import type { IncomingMessage, ServerResponse } from 'node:http';

import { authenticate, HttpError } from './auth.js';
import { supabase } from './config/supabase.js';
import { logDatabaseError, sendJson } from './http.js';

const recentDays = 7;
const previewLimit = 5;

function databaseFailure(context: string, error: unknown): never {
  logDatabaseError(context, error);
  throw new HttpError(500, 'Não foi possível carregar as atualizações dos pacientes.');
}

export async function listProfessionalActivity(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'professional');
  const { data: relationships, error: relationshipError } = await supabase.from('patient_professional_relationships')
    .select('id, patient_id')
    .eq('professional_id', actor.id).eq('relationship_status', 'active').eq('status', 0);
  if (relationshipError) databaseFailure('Falha ao listar vínculos para atividade', relationshipError);
  if (!relationships?.length) return sendJson(response, 200, { count: 0, items: [], periodDays: recentDays });

  const patientIds = [...new Set(relationships.map((item) => item.patient_id))];
  const { data: profiles, error: profileError } = await supabase.from('profiles')
    .select('id, full_name').in('id', patientIds).eq('role', 'patient').eq('status', 0);
  if (profileError) databaseFailure('Falha ao identificar pacientes para atividade', profileError);
  const namesByPatientId = new Map((profiles ?? []).map((item) => [item.id, item.full_name]));
  const namesByRelationshipId = new Map(relationships.flatMap((item) => {
    const name = namesByPatientId.get(item.patient_id);
    return name ? [[item.id, name] as const] : [];
  }));
  const ids = [...namesByRelationshipId.keys()];
  if (!ids.length) return sendJson(response, 200, { count: 0, items: [], periodDays: recentDays });

  const since = new Date(Date.now() - recentDays * 86_400_000).toISOString();
  const [documents, messages, checkIns] = await Promise.all([
    supabase.from('patient_documents').select('id, relationship_id, created_at', { count: 'exact' })
      .in('relationship_id', ids).eq('status', 0).gte('created_at', since)
      .order('created_at', { ascending: false }).limit(previewLimit),
    supabase.from('patient_messages').select('id, relationship_id, created_at', { count: 'exact' })
      .in('relationship_id', ids).eq('status', 0).gte('created_at', since)
      .order('created_at', { ascending: false }).limit(previewLimit),
    supabase.from('patient_check_ins').select('id, relationship_id, created_at', { count: 'exact' })
      .in('relationship_id', ids).eq('status', 0).gte('created_at', since)
      .order('created_at', { ascending: false }).limit(previewLimit),
  ]);
  if (documents.error || messages.error || checkIns.error) {
    databaseFailure('Falha ao listar atividade dos pacientes', documents.error ?? messages.error ?? checkIns.error);
  }

  const items = [
    ...(documents.data ?? []).map((item) => ({ ...item, type: 'document' as const })),
    ...(messages.data ?? []).map((item) => ({ ...item, type: 'message' as const })),
    ...(checkIns.data ?? []).map((item) => ({ ...item, type: 'check-in' as const })),
  ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)).slice(0, previewLimit)
    .map((item) => ({
      id: item.id,
      relationshipId: item.relationship_id,
      patientName: namesByRelationshipId.get(item.relationship_id),
      type: item.type,
      at: item.created_at,
    }));
  sendJson(response, 200, {
    count: (documents.count ?? 0) + (messages.count ?? 0) + (checkIns.count ?? 0),
    items,
    periodDays: recentDays,
  });
}
