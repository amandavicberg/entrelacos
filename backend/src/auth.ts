import { createHash } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import { supabase } from './config/supabase.js';

export class HttpError extends Error { constructor(public readonly status: number, public readonly publicMessage: string) { super(publicMessage); } }
export type Actor = { id: string; role: 'patient' | 'professional' };

export function bearerToken(request: IncomingMessage): string {
  const value = request.headers.authorization;
  if (!value?.startsWith('Bearer ')) throw new HttpError(401, 'Sessão inválida ou expirada.');
  return value.slice(7).trim();
}

// Share only concurrent validation work. Nothing survives the request batch.
const authenticationInFlight = new Map<string, Promise<Actor>>();

async function resolveActor(token: string): Promise<Actor> {
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, 'Sessão inválida ou expirada.');
  const { data: profile, error: profileError } = await supabase.from('profiles')
    .select('role,status,professional_profiles(status),patient_profiles(status)').eq('id', data.user.id).maybeSingle();
  if (profileError || !profile || profile.status !== 0 || (profile.role !== 'patient' && profile.role !== 'professional')) throw new HttpError(403, 'Seu acesso não está ativo.');
  const related = profile.role === 'professional' ? profile.professional_profiles : profile.patient_profiles;
  const roleProfile = Array.isArray(related) ? related[0] : related;
  if (!roleProfile || roleProfile.status !== 0) throw new HttpError(403, 'Seu acesso não está ativo.');
  return { id: data.user.id, role: profile.role };
}

export async function authenticate(request: IncomingMessage, expectedRole?: Actor['role']): Promise<Actor> {
  const token = bearerToken(request);
  const key = createHash('sha256').update(token).digest('hex');
  let pending = authenticationInFlight.get(key);
  if (!pending) {
    pending = resolveActor(token).finally(() => authenticationInFlight.delete(key));
    authenticationInFlight.set(key, pending);
  }
  const actor = await pending;
  if (expectedRole && actor.role !== expectedRole) throw new HttpError(403, 'Você não possui permissão para esta ação.');
  return actor;
}

// Historical access is read-only and limited to the original professional.
export async function readableRelationship(actor: Actor, relationshipId: string) {
  if (actor.role !== 'professional') return activeRelationship(actor, relationshipId);
  const { data, error } = await supabase.from('patient_professional_relationships')
    .select('id,patient_id,professional_id,relationship_status,approved_at,ended_at')
    .eq('id', relationshipId).eq('professional_id', actor.id)
    .in('relationship_status', ['active', 'ended']).eq('status', 0).maybeSingle();
  if (error || !data) throw new HttpError(404, 'Acompanhamento não encontrado.');
  return data;
}

export async function requireActivePatient(actor: Actor): Promise<void> {
  if (actor.role !== 'patient') return;
  const { data, error } = await supabase.from('patient_professional_relationships').select('id')
    .eq('patient_id', actor.id).eq('relationship_status', 'active').eq('status', 0).limit(1).maybeSingle();
  if (error || !data) throw new HttpError(403, 'Você precisa de um vínculo ativo para acessar o acompanhamento.');
}

export async function activeRelationship(actor: Actor, relationshipId: string, role: Actor['role'] = actor.role) {
  const field = role === 'professional' ? 'professional_id' : 'patient_id';
  const { data, error } = await supabase.from('patient_professional_relationships').select('id,patient_id,professional_id,relationship_status,approved_at,ended_at').eq('id', relationshipId).eq(field, actor.id).eq('relationship_status', 'active').eq('status', 0).maybeSingle();
  if (error || !data) throw new HttpError(404, 'Acompanhamento não encontrado.');
  return data;
}
