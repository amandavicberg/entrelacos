import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { activeRelationship, authenticate, HttpError, type Actor } from './auth.js';
import { supabase } from './config/supabase.js';
import { logDatabaseError, sendJson } from './http.js';
import { isoDate, jsonBody, pagination, text, uuid } from './validation.js';

type MaterialRule = { extensions: string[]; maxBytes: number; kind: 'pdf' | 'audio' };
const materialRules: Record<string, MaterialRule> = {
  'application/pdf': { extensions: ['pdf'], maxBytes: 10 * 1024 * 1024, kind: 'pdf' },
  'audio/mpeg': { extensions: ['mp3'], maxBytes: 15 * 1024 * 1024, kind: 'audio' },
  'audio/mp4': { extensions: ['m4a', 'mp4'], maxBytes: 15 * 1024 * 1024, kind: 'audio' },
  'audio/aac': { extensions: ['aac'], maxBytes: 15 * 1024 * 1024, kind: 'audio' },
};

function databaseFailure(context: string, publicMessage: string, error: unknown): never {
  logDatabaseError(context, error);
  throw new HttpError(500, publicMessage);
}

async function activeRelationshipIds(actor: Actor): Promise<string[]> {
  const column = actor.role === 'professional' ? 'professional_id' : 'patient_id';
  const { data, error } = await supabase.from('patient_professional_relationships')
    .select('id').eq(column, actor.id).eq('relationship_status', 'active').eq('status', 0);
  if (error) databaseFailure('Falha ao validar associações', 'Não foi possível validar seus acompanhamentos.', error);
  return (data ?? []).map((item) => item.id);
}

function parseInterval(body: Record<string, unknown>): { startsAt: string; endsAt: string } {
  const startsAt = isoDate(body.startsAt, 'Data de início');
  const endsAt = isoDate(body.endsAt, 'Data de término');
  if (Date.parse(endsAt) <= Date.parse(startsAt)) {
    throw new HttpError(400, 'O término deve ser posterior ao início.');
  }
  return { startsAt, endsAt };
}

function observationOutput(item: Record<string, any>) {
  return {
    id: item.id,
    content: item.content,
    visibility: item.visibility,
    occurredAt: item.occurred_at,
    version: item.version,
    createdAt: item.created_at,
  };
}

function appointmentOutput(item: Record<string, any>) {
  return {
    id: item.id,
    relationshipId: item.relationship_id,
    startsAt: item.starts_at,
    endsAt: item.ends_at,
    state: item.appointment_state,
    patientResponse: item.patient_response,
    cancelledAt: item.cancelled_at,
    cancellationReason: item.cancellation_reason,
  };
}

function materialOutput(item: Record<string, any>) {
  return {
    id: item.id,
    title: item.title,
    description: item.description,
    kind: item.kind,
    source: item.source,
    externalUrl: item.external_url,
    mimeType: item.mime_type,
    sizeBytes: item.size_bytes,
    createdAt: item.created_at,
  };
}

export async function listProfessionalPatients(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'professional');
  const { limit, offset } = pagination(request.url);
  const { data: relationships, error } = await supabase.from('patient_professional_relationships')
    .select('id, patient_id, approved_at')
    .eq('professional_id', actor.id)
    .eq('relationship_status', 'active')
    .eq('status', 0)
    .order('approved_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (error) databaseFailure('Falha ao listar pacientes', 'Não foi possível carregar os pacientes.', error);

  const ids = (relationships ?? []).map((item) => item.patient_id);
  const { data: profiles, error: profileError } = ids.length
    ? await supabase.from('profiles').select('id, full_name').in('id', ids).eq('role', 'patient').eq('status', 0)
    : { data: [], error: null };
  if (profileError) databaseFailure('Falha ao carregar identidades', 'Não foi possível carregar os pacientes.', profileError);
  const byId = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
  sendJson(response, 200, {
    patients: (relationships ?? []).flatMap((item) => {
      const patientName = byId.get(item.patient_id);
      return patientName ? [{ relationshipId: item.id, patientName, approvedAt: item.approved_at }] : [];
    }),
    limit,
    offset,
  });
}

export async function listPatientRelationships(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'patient');
  const { data, error } = await supabase.from('patient_professional_relationships')
    .select('id, professional_id, approved_at')
    .eq('patient_id', actor.id).eq('relationship_status', 'active').eq('status', 0);
  if (error) databaseFailure('Falha ao listar vínculos do paciente', 'Não foi possível carregar seus acompanhamentos.', error);
  const ids = (data ?? []).map((item) => item.professional_id);
  const { data: profiles, error: profileError } = ids.length
    ? await supabase.from('profiles').select('id, full_name').in('id', ids).eq('role', 'professional').eq('status', 0)
    : { data: [], error: null };
  if (profileError) databaseFailure('Falha ao carregar profissionais', 'Não foi possível carregar seus acompanhamentos.', profileError);
  const names = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name]));
  sendJson(response, 200, { relationships: (data ?? []).flatMap((item) => {
    const professionalName = names.get(item.professional_id);
    return professionalName ? [{ relationshipId: item.id, professionalName, approvedAt: item.approved_at }] : [];
  }) });
}

export async function getProfessionalPatient(
  request: IncomingMessage,
  response: ServerResponse,
  relationshipId: string,
): Promise<void> {
  const actor = await authenticate(request, 'professional');
  const relationship = await activeRelationship(actor, relationshipId);
  const { data, error } = await supabase.from('profiles').select('full_name')
    .eq('id', relationship.patient_id).eq('role', 'patient').eq('status', 0).maybeSingle();
  if (error || !data) throw new HttpError(404, 'Paciente não encontrado.');
  sendJson(response, 200, { patient: { relationshipId, patientName: data.full_name } });
}

export async function listObservations(
  request: IncomingMessage,
  response: ServerResponse,
  relationshipId?: string,
): Promise<void> {
  const actor = await authenticate(request);
  const ids = relationshipId ? [relationshipId] : await activeRelationshipIds(actor);
  if (relationshipId) await activeRelationship(actor, relationshipId);
  if (!ids.length) return sendJson(response, 200, { observations: [] });
  const { limit, offset } = pagination(request.url);
  let query = supabase.from('professional_observations')
    .select('id, content, visibility, occurred_at, version, created_at')
    .in('relationship_id', ids)
    .eq('status', 0)
    .order('occurred_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (actor.role === 'patient') query = query.eq('visibility', 'patient');
  const { data, error } = await query;
  if (error) databaseFailure('Falha ao listar observações', 'Não foi possível carregar as observações.', error);
  sendJson(response, 200, { observations: (data ?? []).map(observationOutput), limit, offset });
}

export async function createObservation(
  request: IncomingMessage,
  response: ServerResponse,
  relationshipId: string,
): Promise<void> {
  const actor = await authenticate(request, 'professional');
  await activeRelationship(actor, relationshipId);
  const body = await jsonBody(request);
  if (body.visibility !== 'professional' && body.visibility !== 'patient') {
    throw new HttpError(400, 'Visibilidade inválida.');
  }
  const { data: latest, error: versionError } = await supabase.from('professional_observations')
    .select('version').eq('relationship_id', relationshipId).order('version', { ascending: false }).limit(1).maybeSingle();
  if (versionError) databaseFailure('Falha ao calcular versão', 'Não foi possível registrar a observação.', versionError);
  const { data, error } = await supabase.from('professional_observations').insert({
    relationship_id: relationshipId,
    author_id: actor.id,
    content: text(body.content, 'Observação', 5000),
    visibility: body.visibility,
    occurred_at: isoDate(body.occurredAt, 'Data da observação'),
    version: (latest?.version ?? 0) + 1,
  }).select('id').single();
  if (error) databaseFailure('Falha ao criar observação', 'Não foi possível registrar a observação.', error);
  sendJson(response, 201, { observation: data });
}

export async function correctObservation(
  request: IncomingMessage,
  response: ServerResponse,
  relationshipId: string,
  observationId: string,
): Promise<void> {
  const actor = await authenticate(request, 'professional');
  await activeRelationship(actor, relationshipId);
  const body = await jsonBody(request);
  if (body.visibility !== 'professional' && body.visibility !== 'patient') throw new HttpError(400, 'Visibilidade inválida.');
  const { data: previous, error: previousError } = await supabase.from('professional_observations')
    .select('version').eq('id', observationId).eq('relationship_id', relationshipId).eq('author_id', actor.id).eq('status', 0).maybeSingle();
  if (previousError) databaseFailure('Falha ao localizar observação', 'Não foi possível corrigir a observação.', previousError);
  if (!previous) throw new HttpError(404, 'Observação não encontrada.');
  const { data: latest, error: latestError } = await supabase.from('professional_observations')
    .select('version').eq('relationship_id', relationshipId).order('version', { ascending: false }).limit(1).single();
  if (latestError) databaseFailure('Falha ao calcular versão', 'Não foi possível corrigir a observação.', latestError);
  const { error: insertError } = await supabase.from('professional_observations').insert({
    relationship_id: relationshipId,
    author_id: actor.id,
    content: text(body.content, 'Observação', 5000),
    visibility: body.visibility,
    occurred_at: isoDate(body.occurredAt, 'Data da observação'),
    version: latest.version + 1,
    previous_version_id: observationId,
  });
  if (insertError) databaseFailure('Falha ao criar correção', 'Não foi possível corrigir a observação.', insertError);
  const { error: updateError } = await supabase.from('professional_observations').update({ status: -1 }).eq('id', observationId).eq('status', 0);
  if (updateError) databaseFailure('Falha ao arquivar versão', 'A nova versão foi criada, mas a anterior requer revisão.', updateError);
  sendJson(response, 200, {});
}

export async function listAppointments(
  request: IncomingMessage,
  response: ServerResponse,
  relationshipId?: string,
): Promise<void> {
  const actor = await authenticate(request);
  const ids = relationshipId ? [relationshipId] : await activeRelationshipIds(actor);
  if (relationshipId) await activeRelationship(actor, relationshipId);
  if (!ids.length) return sendJson(response, 200, { appointments: [] });
  const { data, error } = await supabase.from('appointments')
    .select('id, relationship_id, starts_at, ends_at, appointment_state, patient_response, cancelled_at, cancellation_reason')
    .in('relationship_id', ids)
    .eq('status', 0)
    .order('starts_at');
  if (error) databaseFailure('Falha ao listar agenda', 'Não foi possível carregar a agenda.', error);
  sendJson(response, 200, { appointments: (data ?? []).map(appointmentOutput) });
}

export async function createAppointment(
  request: IncomingMessage,
  response: ServerResponse,
  relationshipId: string,
): Promise<void> {
  const actor = await authenticate(request, 'professional');
  await activeRelationship(actor, relationshipId);
  const body = await jsonBody(request);
  const interval = parseInterval(body);
  const { data, error } = await supabase.from('appointments').insert({
    relationship_id: relationshipId,
    starts_at: interval.startsAt,
    ends_at: interval.endsAt,
  }).select('id').single();
  if (error) databaseFailure('Falha ao criar consulta', 'Não foi possível criar a consulta.', error);
  sendJson(response, 201, { appointment: data });
}

export async function rescheduleAppointment(
  request: IncomingMessage,
  response: ServerResponse,
  relationshipId: string,
  appointmentId: string,
): Promise<void> {
  const actor = await authenticate(request, 'professional');
  await activeRelationship(actor, relationshipId);
  const body = await jsonBody(request);
  const interval = parseInterval(body);
  const { data, error } = await supabase.from('appointments').update({
    starts_at: interval.startsAt,
    ends_at: interval.endsAt,
    patient_response: 'pending',
  }).eq('id', appointmentId)
    .eq('relationship_id', relationshipId)
    .eq('appointment_state', 'scheduled')
    .eq('status', 0)
    .select('id').maybeSingle();
  if (error) databaseFailure('Falha ao reagendar consulta', 'Não foi possível reagendar a consulta.', error);
  if (!data) throw new HttpError(409, 'Esta consulta não pode mais ser reagendada.');
  sendJson(response, 200, {});
}

async function cancelAppointmentForActor(
  response: ServerResponse,
  actorId: string,
  relationshipId: string,
  appointmentId: string,
  reason?: string,
): Promise<void> {
  const { data, error } = await supabase.from('appointments').update({
    appointment_state: 'cancelled',
    patient_response: 'cancelled',
    cancelled_by: actorId,
    cancelled_at: new Date().toISOString(),
    cancellation_reason: reason ?? null,
  }).eq('id', appointmentId)
    .eq('relationship_id', relationshipId)
    .eq('appointment_state', 'scheduled')
    .eq('status', 0)
    .select('id').maybeSingle();
  if (error) databaseFailure('Falha ao cancelar consulta', 'Não foi possível cancelar a consulta.', error);
  if (!data) throw new HttpError(409, 'Esta consulta já não pode ser cancelada.');
  sendJson(response, 200, {});
}

export async function cancelAppointment(
  request: IncomingMessage,
  response: ServerResponse,
  relationshipId: string,
  appointmentId: string,
): Promise<void> {
  const actor = await authenticate(request, 'professional');
  await activeRelationship(actor, relationshipId);
  const body = await jsonBody(request);
  await cancelAppointmentForActor(response, actor.id, relationshipId, appointmentId, text(body.reason, 'Motivo', 500, false));
}

export async function respondToAppointment(
  request: IncomingMessage,
  response: ServerResponse,
  appointmentId: string,
): Promise<void> {
  const actor = await authenticate(request, 'patient');
  const body = await jsonBody(request);
  if (body.response !== 'confirmed' && body.response !== 'cancelled') throw new HttpError(400, 'Resposta inválida.');
  const { data: appointment, error: findError } = await supabase.from('appointments')
    .select('relationship_id').eq('id', appointmentId).eq('appointment_state', 'scheduled').eq('status', 0).maybeSingle();
  if (findError || !appointment) throw new HttpError(404, 'Consulta não encontrada.');
  await activeRelationship(actor, appointment.relationship_id);
  if (body.response === 'cancelled') {
    await cancelAppointmentForActor(
      response,
      actor.id,
      appointment.relationship_id,
      appointmentId,
      text(body.reason, 'Motivo', 500, false),
    );
    return;
  }
  const { data, error } = await supabase.from('appointments').update({ patient_response: 'confirmed' })
    .eq('id', appointmentId).eq('patient_response', 'pending').eq('appointment_state', 'scheduled').eq('status', 0)
    .select('id').maybeSingle();
  if (error) databaseFailure('Falha ao confirmar consulta', 'Não foi possível confirmar a consulta.', error);
  if (!data) throw new HttpError(409, 'Esta consulta já recebeu uma resposta.');
  sendJson(response, 200, {});
}

export async function listTimeline(
  request: IncomingMessage,
  response: ServerResponse,
  relationshipId: string,
): Promise<void> {
  const actor = await authenticate(request);
  await activeRelationship(actor, relationshipId);
  let observationsQuery = supabase.from('professional_observations')
    .select('id, content, occurred_at').eq('relationship_id', relationshipId).eq('status', 0);
  if (actor.role === 'patient') observationsQuery = observationsQuery.eq('visibility', 'patient');
  const [observations, appointmentEvents, shares] = await Promise.all([
    observationsQuery,
    supabase.from('appointment_events').select('id, event_type, occurred_at')
      .eq('relationship_id', relationshipId).eq('status', 0),
    supabase.from('patient_material_shares').select('id, shared_at, professional_materials(title)')
      .eq('relationship_id', relationshipId).eq('status', 0),
  ]);
  if (observations.error || appointmentEvents.error || shares.error) {
    databaseFailure('Falha ao montar histórico', 'Não foi possível carregar o histórico.', observations.error ?? appointmentEvents.error ?? shares.error);
  }
  const timeline = [
    ...(observations.data ?? []).map((item) => ({ id: item.id, type: 'observation', at: item.occurred_at, label: 'Observação registrada', content: item.content })),
    ...(appointmentEvents.data ?? []).map((item) => ({ id: item.id, type: 'appointment', at: item.occurred_at, label: `Agenda: ${item.event_type}` })),
    ...(shares.data ?? []).map((item) => ({ id: item.id, type: 'material', at: item.shared_at, label: 'Material compartilhado' })),
  ].sort((left, right) => Date.parse(right.at) - Date.parse(left.at));
  sendJson(response, 200, { timeline });
}

export async function listMaterials(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request);
  if (actor.role === 'professional') {
    const { data, error } = await supabase.from('professional_materials')
      .select('id, title, description, kind, source, external_url, mime_type, size_bytes, created_at')
      .eq('professional_id', actor.id).eq('status', 0).order('created_at', { ascending: false });
    if (error) databaseFailure('Falha ao listar materiais', 'Não foi possível carregar os materiais.', error);
    const materials = (data ?? []).map(materialOutput);
    sendJson(response, 200, {
      materials,
      usage: {
        count: materials.filter((item) => item.source === 'storage').length,
        sizeBytes: materials.reduce((total, item) => total + (item.sizeBytes ?? 0), 0),
        quotaBytes: 1024 * 1024 * 1024,
      },
    });
    return;
  }

  const relationshipIds = await activeRelationshipIds(actor);
  if (!relationshipIds.length) return sendJson(response, 200, { materials: [] });
  const { data, error } = await supabase.from('patient_material_shares')
    .select('id, relationship_id, shared_at, professional_materials(id, title, description, kind, source, external_url, mime_type, size_bytes, created_at)')
    .in('relationship_id', relationshipIds).eq('status', 0).order('shared_at', { ascending: false });
  if (error) databaseFailure('Falha ao listar materiais compartilhados', 'Não foi possível carregar os materiais.', error);
  sendJson(response, 200, {
    materials: (data ?? []).flatMap((share) => {
      const raw = Array.isArray(share.professional_materials)
        ? share.professional_materials[0]
        : share.professional_materials;
      return raw ? [{ ...materialOutput(raw), shareId: share.id, relationshipId: share.relationship_id }] : [];
    }),
  });
}

export async function createExternalMaterial(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'professional');
  const body = await jsonBody(request);
  const externalUrl = text(body.externalUrl, 'Link', 2000) ?? '';
  try {
    const parsed = new URL(externalUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error();
  } catch {
    throw new HttpError(400, 'Informe um link HTTP ou HTTPS válido.');
  }
  const kind = ['ebook', 'podcast', 'video', 'other'].includes(String(body.kind)) ? body.kind : 'other';
  const { data, error } = await supabase.from('professional_materials').insert({
    professional_id: actor.id,
    title: text(body.title, 'Título', 160),
    description: text(body.description, 'Descrição', 2000, false),
    kind,
    source: 'external',
    external_url: externalUrl,
  }).select('id').single();
  if (error) databaseFailure('Falha ao cadastrar material externo', 'Não foi possível cadastrar o material.', error);
  sendJson(response, 201, { material: data });
}

function validateFile(body: Record<string, unknown>): { fileName: string; mimeType: string; sizeBytes: number; rule: MaterialRule; extension: string } {
  const fileName = text(body.fileName, 'Nome do arquivo', 255) ?? '';
  const mimeType = text(body.mimeType, 'Tipo do arquivo', 100) ?? '';
  const sizeBytes = Number(body.sizeBytes);
  const rule = materialRules[mimeType];
  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  if (!rule || !rule.extensions.includes(extension) || !Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > rule.maxBytes) {
    throw new HttpError(400, 'Arquivo não permitido ou acima do limite definido.');
  }
  return { fileName, mimeType, sizeBytes, rule, extension };
}

export async function prepareMaterialUpload(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'professional');
  const body = await jsonBody(request);
  const file = validateFile(body);
  const materialId = randomUUID();
  const storagePath = `${actor.id}/${materialId}/${randomUUID()}.${file.extension}`;
  const { data, error } = await supabase.storage.from('professional-materials').createSignedUploadUrl(storagePath);
  if (error || !data) databaseFailure('Falha ao assinar upload', 'Não foi possível preparar o envio do arquivo.', error);
  sendJson(response, 201, { upload: { materialId, storagePath, signedUrl: data.signedUrl, token: data.token } });
}

export async function confirmMaterialUpload(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'professional');
  const body = await jsonBody(request);
  const file = validateFile(body);
  const materialId = uuid(body.materialId, 'Material');
  const storagePath = text(body.storagePath, 'Caminho do arquivo', 500) ?? '';
  if (!storagePath.startsWith(`${actor.id}/${materialId}/`)) throw new HttpError(400, 'Caminho do arquivo inválido.');
  const directory = storagePath.split('/').slice(0, -1).join('/');
  const objectName = storagePath.split('/').at(-1);
  const { data: objects, error: storageError } = await supabase.storage.from('professional-materials').list(directory, { limit: 10 });
  if (storageError || !objects?.some((item) => item.name === objectName)) {
    throw new HttpError(409, 'O upload ainda não foi concluído.');
  }
  const { data, error } = await supabase.from('professional_materials').insert({
    id: materialId,
    professional_id: actor.id,
    title: text(body.title, 'Título', 160),
    description: text(body.description, 'Descrição', 2000, false),
    kind: file.rule.kind,
    source: 'storage',
    storage_path: storagePath,
    mime_type: file.mimeType,
    size_bytes: file.sizeBytes,
  }).select('id').single();
  if (error) databaseFailure('Falha ao confirmar material', 'Não foi possível cadastrar o material.', error);
  sendJson(response, 201, { material: data });
}

export async function shareMaterial(
  request: IncomingMessage,
  response: ServerResponse,
  materialId: string,
): Promise<void> {
  const actor = await authenticate(request, 'professional');
  const body = await jsonBody(request);
  const relationshipIds = Array.isArray(body.relationshipIds)
    ? [...new Set(body.relationshipIds.map((item) => uuid(item, 'Paciente')))]
    : [];
  if (!relationshipIds.length || relationshipIds.length > 100) throw new HttpError(400, 'Selecione de 1 a 100 pacientes.');
  const { data: material, error: materialError } = await supabase.from('professional_materials')
    .select('id').eq('id', materialId).eq('professional_id', actor.id).eq('status', 0).maybeSingle();
  if (materialError || !material) throw new HttpError(404, 'Material não encontrado.');
  await Promise.all(relationshipIds.map((relationshipId) => activeRelationship(actor, relationshipId)));
  const { error } = await supabase.from('patient_material_shares').upsert(
    relationshipIds.map((relationshipId) => ({ material_id: materialId, relationship_id: relationshipId, status: 0 })),
    { onConflict: 'material_id,relationship_id' },
  );
  if (error) databaseFailure('Falha ao compartilhar material', 'Não foi possível compartilhar o material.', error);
  sendJson(response, 201, {});
}

export async function getMaterialUrl(
  request: IncomingMessage,
  response: ServerResponse,
  materialId: string,
): Promise<void> {
  const actor = await authenticate(request);
  const { data: material, error } = await supabase.from('professional_materials')
    .select('professional_id, source, external_url, storage_path').eq('id', materialId).eq('status', 0).maybeSingle();
  if (error || !material) throw new HttpError(404, 'Material não encontrado.');
  if (actor.role === 'professional') {
    if (material.professional_id !== actor.id) throw new HttpError(404, 'Material não encontrado.');
  } else {
    const relationshipIds = await activeRelationshipIds(actor);
    const { data: share, error: shareError } = relationshipIds.length
      ? await supabase.from('patient_material_shares').select('id').eq('material_id', materialId).in('relationship_id', relationshipIds).eq('status', 0).limit(1).maybeSingle()
      : { data: null, error: null };
    if (shareError || !share) throw new HttpError(404, 'Material não encontrado.');
  }
  if (material.source === 'external') return sendJson(response, 200, { url: material.external_url });
  const { data, error: signedError } = await supabase.storage.from('professional-materials').createSignedUrl(material.storage_path, 60);
  if (signedError || !data) databaseFailure('Falha ao assinar download', 'Não foi possível abrir o material.', signedError);
  sendJson(response, 200, { url: data.signedUrl, expiresIn: 60 });
}
