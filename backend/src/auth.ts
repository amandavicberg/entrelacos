import type { IncomingMessage } from 'node:http';
import { supabase } from './config/supabase.js';

export class HttpError extends Error { constructor(public readonly status: number, public readonly publicMessage: string) { super(publicMessage); } }
export type Actor = { id: string; role: 'patient' | 'professional' };

export function bearerToken(request: IncomingMessage): string {
  const value = request.headers.authorization;
  if (!value?.startsWith('Bearer ')) throw new HttpError(401, 'Sessão inválida ou expirada.');
  return value.slice(7).trim();
}

export async function authenticate(request: IncomingMessage, expectedRole?: Actor['role']): Promise<Actor> {
  const { data, error } = await supabase.auth.getUser(bearerToken(request));
  if (error || !data.user) throw new HttpError(401, 'Sessão inválida ou expirada.');
  const { data: profile, error: profileError } = await supabase.from('profiles').select('role,status').eq('id', data.user.id).maybeSingle();
  if (profileError || !profile || profile.status !== 0 || (profile.role !== 'patient' && profile.role !== 'professional')) throw new HttpError(403, 'Seu acesso não está ativo.');
  if (expectedRole && profile.role !== expectedRole) throw new HttpError(403, 'Você não possui permissão para esta ação.');
  const table = profile.role === 'professional' ? 'professional_profiles' : 'patient_profiles';
  const { data: roleProfile, error: roleError } = await supabase.from(table).select('status').eq('id', data.user.id).maybeSingle();
  if (roleError || !roleProfile || roleProfile.status !== 0) throw new HttpError(403, 'Seu acesso não está ativo.');
  return { id: data.user.id, role: profile.role };
}

export async function activeRelationship(actor: Actor, relationshipId: string, role: Actor['role'] = actor.role) {
  const field = role === 'professional' ? 'professional_id' : 'patient_id';
  const { data, error } = await supabase.from('patient_professional_relationships').select('id,patient_id,professional_id').eq('id', relationshipId).eq(field, actor.id).eq('relationship_status', 'active').eq('status', 0).maybeSingle();
  if (error || !data) throw new HttpError(404, 'Acompanhamento não encontrado.');
  return data;
}
