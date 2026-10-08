import type { IncomingMessage, ServerResponse } from 'node:http';

import { authenticate, HttpError } from './auth.js';
import { supabase } from './config/supabase.js';
import { logDatabaseError, sendJson } from './http.js';
import { jsonBody, text } from './validation.js';

export async function updateProfessionalProfile(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'professional');
  const body = await jsonBody(request);

  if (body.section === 'identity') {
    const fullName = text(body.fullName, 'Nome completo', 160)!;
    const { data, error } = await supabase.from('profiles')
      .update({ full_name: fullName })
      .eq('id', actor.id).eq('role', 'professional').eq('status', 0)
      .select('full_name').maybeSingle();
    if (error) {
      logDatabaseError('Falha ao atualizar nome profissional', error);
      throw new HttpError(500, 'Não foi possível salvar o nome. Tente novamente.');
    }
    if (!data) throw new HttpError(403, 'Seu acesso não está ativo.');
    return sendJson(response, 200, { fullName: data.full_name });
  }

  if (body.section === 'professional') {
    const specialty = text(body.specialty, 'Atuação profissional', 120)!;
    const registrationType = text(body.registrationType, 'Tipo de registro', 30)!;
    const registrationNumber = text(body.registrationNumber, 'Número do registro', 60)!;
    const { data, error } = await supabase.from('professional_profiles')
      .update({ specialty, registration_type: registrationType, registration_number: registrationNumber })
      .eq('id', actor.id).eq('status', 0)
      .select('specialty').maybeSingle();
    if (error) {
      if (error.code === '23505') throw new HttpError(409, 'Esse registro profissional já está em uso.');
      logDatabaseError('Falha ao atualizar registro profissional', error);
      throw new HttpError(500, 'Não foi possível salvar os dados profissionais. Tente novamente.');
    }
    if (!data) throw new HttpError(403, 'Seu acesso não está ativo.');
    return sendJson(response, 200, { saved: true });
  }

  throw new HttpError(400, 'Seção do perfil inválida.');
}
