import { createHash, randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { authenticate, HttpError } from './auth.js';
import { supabase } from './config/supabase.js';
import { logDatabaseError, sendJson } from './http.js';
import { jsonBody, text } from './validation.js';

const inviteLifetimeMs = 7 * 24 * 60 * 60 * 1000;

export async function consumeInvite(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'patient');
  const body = await jsonBody(request);
  const code = text(body.code, 'Código de convite', 64) ?? '';
  if (code.length < 6) throw new HttpError(400, 'Informe um código de convite válido.');

  const { data, error } = await supabase.rpc('consume_patient_invite', {
    p_code: code,
    p_patient_id: actor.id,
  });
  if (error) {
    logDatabaseError('Falha ao consumir convite', error);
    throw new HttpError(400, 'Código inválido, expirado ou já utilizado.');
  }
  sendJson(response, 201, { relationship: data });
}

export async function generateInvite(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'professional');
  const code = randomBytes(8).toString('hex').toUpperCase();
  const expiresAt = new Date(Date.now() + inviteLifetimeMs).toISOString();
  const { error } = await supabase.from('professional_invites').insert({
    professional_id: actor.id,
    code_digest: createHash('sha256').update(code).digest('hex'),
    expires_at: expiresAt,
    status: 0,
  });
  if (error) {
    logDatabaseError('Falha ao criar convite', error);
    throw new HttpError(500, 'Não foi possível gerar o convite.');
  }
  sendJson(response, 201, { invitation: { code, expiresAt } });
}

export async function listPendingRelationships(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'professional');
  const { data, error } = await supabase
    .from('patient_professional_relationships')
    .select('id, patient_id, requested_at')
    .eq('professional_id', actor.id)
    .eq('relationship_status', 'pending')
    .eq('status', 0)
    .order('requested_at');
  if (error) throw new HttpError(500, 'Não foi possível carregar as solicitações.');

  const patientIds = [...new Set((data ?? []).map((item) => item.patient_id))];
  const { data: patients, error: patientError } = patientIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', patientIds).eq('role', 'patient').eq('status', 0)
    : { data: [], error: null };
  if (patientError) throw new HttpError(500, 'Não foi possível carregar as solicitações.');
  const names = new Map((patients ?? []).map((patient) => [patient.id, patient.full_name]));
  sendJson(response, 200, {
    relationships: (data ?? []).flatMap((item) => names.has(item.patient_id)
      ? [{ id: item.id, patientName: names.get(item.patient_id), requestedAt: item.requested_at }]
      : []),
  });
}

export async function decideRelationship(
  request: IncomingMessage,
  response: ServerResponse,
  relationshipId: string,
  decision: 'active' | 'rejected',
): Promise<void> {
  const actor = await authenticate(request, 'professional');
  const values = decision === 'active'
    ? { relationship_status: decision, approved_at: new Date().toISOString() }
    : { relationship_status: decision };
  const { data, error } = await supabase.from('patient_professional_relationships')
    .update(values)
    .eq('id', relationshipId)
    .eq('professional_id', actor.id)
    .eq('relationship_status', 'pending')
    .eq('status', 0)
    .select('id, relationship_status, approved_at')
    .maybeSingle();
  if (error) throw new HttpError(500, 'Não foi possível atualizar a solicitação.');
  if (!data) throw new HttpError(409, 'A solicitação não está mais pendente.');
  sendJson(response, 200, { relationship: data });
}
