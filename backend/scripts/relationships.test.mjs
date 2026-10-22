import assert from 'node:assert/strict';
import { beforeEach, test } from 'node:test';
// Isolated fixtures: no real Supabase requests or patient data.
process.env.SUPABASE_URL = 'http://127.0.0.1:1';
process.env.SUPABASE_SECRET_KEY = 'test-only-key';
const { default: config } = await import('../dist/config/supabase.js');
const { default: auth } = await import('../dist/auth.js');
const { default: followUp } = await import('../dist/follow-up.js');
const { default: space } = await import('../dist/patient-space.js');
const { supabase } = config;
let tables, updates, authCalls, updateError;
const relationship = { id: 'r1', patient_id: 'patient', professional_id: 'professional', relationship_status: 'active', status: 0, approved_at: '2026-01-01T00:00:00Z', ended_at: null };
const request = (token = 'professional', url = '/') => ({ headers: { authorization: `Bearer ${token}` }, url });
const response = () => ({ status: null, body: null, writeHead(status) { this.status = status; }, end(body) { this.body = JSON.parse(body); } });
const rejected = (promise, status) => assert.rejects(promise, (error) => error.status === status);

beforeEach(() => {
  updates = []; authCalls = 0; updateError = null;
  tables = {
    profiles: ['professional', 'other', 'patient', 'disabled'].map((id) => ({ id, role: id === 'patient' ? 'patient' : 'professional', full_name: 'Pessoa fictícia', status: id === 'disabled' ? -1 : 0, professional_profiles: { status: 0 }, patient_profiles: { status: 0 } })),
    patient_professional_relationships: [{ ...relationship }],
    appointments: [], professional_observations: [{ id: 'o1', relationship_id: 'r1', content: 'Registro fictício', visibility: 'professional', status: 0 }],
    patient_documents: [{ id: 'd1', relationship_id: 'r1', patient_id: 'patient', storage_path: 'fixture.pdf', status: 0 }],
    patient_messages: [{ id: 'm1', relationship_id: 'r1', author_id: 'patient', content: 'Recado fictício', status: 0 }],
    patient_check_ins: [{ id: 'c1', relationship_id: 'r1', author_id: 'patient', feeling: 'calm', status: 0 }],
    appointment_events: [], patient_material_shares: [],
  };
  supabase.auth.getUser = async (token) => { authCalls++; await new Promise((resolve) => setImmediate(resolve)); return { data: { user: token === 'invalid' ? null : { id: token } }, error: null }; };
  supabase.from = (table) => {
    const filters = []; let patch, single = false, start = 0, end = Infinity;
    const query = {
      select() { return query; },
      eq(field, value) { filters.push((row) => row[field] === value); return query; },
      in(field, values) { filters.push((row) => values.includes(row[field])); return query; },
      gte(field, value) { filters.push((row) => row[field] >= value); return query; },
      order() { return query; },
      range(a, b) { start = a; end = b + 1; return query; },
      limit(n) { end = n; return query; },
      maybeSingle() { single = true; return query; },
      update(value) { patch = value; return query; },
      then(resolve, reject) {
        try {
          const rows = (tables[table] ?? []).filter((row) => filters.every((filter) => filter(row))).slice(start, end);
          if (patch && updateError) return Promise.resolve({ data: null, error: updateError }).then(resolve, reject);
          if (patch) { updates.push({ table, patch }); rows.forEach((row) => Object.assign(row, patch)); }
          return Promise.resolve({ data: single ? rows[0] ?? null : rows, error: null }).then(resolve, reject);
        } catch (error) { return Promise.reject(error).then(resolve, reject); }
      },
    };
    return query;
  };
  supabase.storage.from = () => ({ createSignedUrl: async () => ({ data: { signedUrl: 'https://example.invalid/fixture.pdf' }, error: null }) });
});

test('encerra somente o vínculo, preserva todas as linhas e é idempotente', async () => {
  const records = structuredClone(tables);
  const result = response();
  await followUp.endProfessionalRelationship(request(), result, 'r1');
  assert.equal(result.status, 200);
  assert.equal(tables.patient_professional_relationships[0].relationship_status, 'ended');
  assert.equal(tables.patient_professional_relationships[0].status, 0);
  assert.ok(tables.patient_professional_relationships[0].ended_at);
  for (const table of Object.keys(records).filter((name) => name !== 'patient_professional_relationships')) assert.deepEqual(tables[table], records[table]);
  await followUp.endProfessionalRelationship(request(), response(), 'r1');
  assert.equal(updates.length, 1);
  const active = response(), ended = response();
  await followUp.listProfessionalPatients(request('professional', '/?state=active'), active);
  await followUp.listProfessionalPatients(request('professional', '/?state=ended'), ended);
  assert.equal(active.body.patients.length, 0);
  assert.equal(ended.body.patients[0].relationshipId, 'r1');
});

test('outro profissional, paciente, conta desativada e token inválido não encerram vínculo', async () => {
  for (const [token, status] of [['other', 404], ['patient', 403], ['disabled', 403], ['invalid', 401]]) {
    await rejected(followUp.endProfessionalRelationship(request(token), response(), 'r1'), status);
  }
  assert.equal(updates.length, 0);
});

test('consulta futura impede encerramento e cancelada permite', async () => {
  tables.appointments.push({ id: 'a1', relationship_id: 'r1', status: 0, appointment_state: 'scheduled', ends_at: '2999-01-01T12:00:00Z' });
  await rejected(followUp.endProfessionalRelationship(request(), response(), 'r1'), 409);
  assert.equal(updates.length, 0);
  tables.appointments[0].appointment_state = 'cancelled';
  await followUp.endProfessionalRelationship(request(), response(), 'r1');
  assert.equal(updates.length, 1);
});

test('histórico e PDF encerrados são legíveis somente pelo profissional original', async () => {
  tables.patient_professional_relationships[0].relationship_status = 'ended';
  for (const handler of [followUp.getProfessionalPatient, followUp.listObservations, followUp.listAppointments, followUp.listTimeline, followUp.listProfessionalPatientMaterials, space.listPatientDocuments, space.listPatientMessages, space.listPatientCheckIns]) {
    const result = response();
    await handler(request(), result, 'r1');
    assert.equal(result.status, 200);
    await rejected(handler(request('other'), response(), 'r1'), 404);
  }
  const result = response();
  await space.getPatientDocumentUrl(request(), result, 'd1');
  assert.equal(result.status, 200);
  await rejected(space.getPatientDocumentUrl(request('other'), response(), 'd1'), 404);
  await rejected(space.getPatientDocumentUrl(request('patient'), response(), 'd1'), 403);
});

test('vínculo encerrado rejeita novas escritas mesmo pela API', async () => {
  tables.patient_professional_relationships[0].relationship_status = 'ended';
  for (const handler of [followUp.createObservation, followUp.correctObservation, followUp.createAppointment, followUp.rescheduleAppointment, followUp.cancelAppointment]) {
    await rejected(handler(request(), response(), 'r1', 'record'), 404);
  }
  assert.equal(updates.length, 0);
});

test('paciente sem vínculo ativo não lê registros pela API diretamente', async () => {
  tables.patient_professional_relationships[0].relationship_status = 'ended';
  for (const handler of [space.listPatientDocuments, space.listPatientMessages, space.listPatientCheckIns]) await rejected(handler(request('patient'), response()), 403);
  await rejected(auth.readableRelationship({ id: 'patient', role: 'patient' }, 'r1'), 404);
});

test('novo vínculo não apaga nem concede histórico antigo a outro profissional', async () => {
  tables.patient_professional_relationships[0].relationship_status = 'ended';
  tables.patient_professional_relationships.push({ ...relationship, id: 'r2', professional_id: 'other' });
  assert.equal((await auth.readableRelationship({ id: 'professional', role: 'professional' }, 'r1')).id, 'r1');
  await rejected(auth.readableRelationship({ id: 'other', role: 'professional' }, 'r1'), 404);
});

test('validação concorrente é compartilhada, papéis e revogação continuam verificados', async () => {
  await Promise.all(Array.from({ length: 8 }, () => auth.authenticate(request(), 'professional')));
  assert.equal(authCalls, 1);
  await rejected(auth.authenticate(request(), 'patient'), 403);
  assert.equal(authCalls, 2);
  tables.profiles[0].status = -1;
  await rejected(auth.authenticate(request(), 'professional'), 403);
  assert.equal(authCalls, 3);
});

test('perfil complementar desativado e vínculo inativado não permitem acesso', async () => {
  tables.profiles[0].professional_profiles.status = -1;
  await rejected(auth.authenticate(request()), 403);
  tables.profiles[0].professional_profiles.status = 0;
  tables.patient_professional_relationships[0].status = -1;
  await rejected(followUp.getProfessionalPatient(request(), response(), 'r1'), 404);
});


test('conflito detectado pelo trigger retorna 409 sem anunciar encerramento', async () => {
  updateError = { code: '23514' };
  await rejected(followUp.endProfessionalRelationship(request(), response(), 'r1'), 409);
  assert.equal(tables.patient_professional_relationships[0].relationship_status, 'active');
  assert.equal(updates.length, 0);
});

test('listagem rejeita estado arbitrário', async () => {
  await rejected(followUp.listProfessionalPatients(request('professional', '/?state=pending'), response()), 400);
});
