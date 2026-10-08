import type { IncomingMessage, ServerResponse } from 'node:http';

import { authenticate, HttpError } from './auth.js';
import { supabase } from './config/supabase.js';
import { logDatabaseError, sendJson } from './http.js';
import { isoDate, jsonBody, uuid } from './validation.js';

function minute(value: unknown, label: string): number {
  if (!Number.isInteger(value) || Number(value) < 0 || Number(value) > 1440) {
    throw new HttpError(400, `${label} inválido.`);
  }
  return Number(value);
}

function output(item: Record<string, any>) {
  return {
    id: item.id, weekday: item.weekday, startMinute: item.start_minute,
    endMinute: item.end_minute, slotMinutes: item.slot_minutes,
  };
}

export async function listProfessionalAvailability(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'professional');
  const { data, error } = await supabase.from('professional_availability')
    .select('id, weekday, start_minute, end_minute, slot_minutes')
    .eq('professional_id', actor.id).eq('status', 0).order('weekday').order('start_minute');
  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      throw new HttpError(503, 'Os horários de atendimento ainda não foram ativados neste banco.');
    }
    logDatabaseError('Falha ao listar disponibilidade', error);
    throw new HttpError(500, 'Não foi possível carregar seus horários de atendimento.');
  }
  sendJson(response, 200, { availability: (data ?? []).map(output) });
}

export async function createProfessionalAvailability(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'professional');
  const body = await jsonBody(request);
  const weekday = minute(body.weekday, 'Dia da semana');
  const startMinute = minute(body.startMinute, 'Horário inicial');
  const endMinute = minute(body.endMinute, 'Horário final');
  const slotMinutes = minute(body.slotMinutes, 'Duração da consulta');
  if (weekday > 6 || startMinute >= 1440 || endMinute <= startMinute
    || ![30, 45, 60].includes(slotMinutes) || endMinute - startMinute < slotMinutes) {
    throw new HttpError(400, 'Confira o dia, o intervalo e a duração das consultas.');
  }
  const { data, error } = await supabase.from('professional_availability').insert({
    professional_id: actor.id, weekday, start_minute: startMinute,
    end_minute: endMinute, slot_minutes: slotMinutes,
  }).select('id, weekday, start_minute, end_minute, slot_minutes').single();
  if (error) {
    if (error.code === '23P01') throw new HttpError(409, 'Esse período se sobrepõe a um horário já cadastrado.');
    logDatabaseError('Falha ao cadastrar disponibilidade', error);
    throw new HttpError(500, 'Não foi possível cadastrar o horário.');
  }
  sendJson(response, 201, { availability: output(data) });
}

export async function removeProfessionalAvailability(request: IncomingMessage, response: ServerResponse, id: string): Promise<void> {
  const actor = await authenticate(request, 'professional');
  const { data, error } = await supabase.from('professional_availability')
    .update({ status: -1 }).eq('id', uuid(id)).eq('professional_id', actor.id).eq('status', 0)
    .select('id').maybeSingle();
  if (error) {
    logDatabaseError('Falha ao remover disponibilidade', error);
    throw new HttpError(500, 'Não foi possível remover o horário.');
  }
  if (!data) throw new HttpError(404, 'Horário não encontrado.');
  sendJson(response, 200, { removed: true });
}

export async function listPatientAvailableSlots(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'patient');
  const query = new URL(request.url ?? '/', 'http://localhost').searchParams;
  const from = query.get('from');
  const until = query.get('until');
  if (!from || !until || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(until)) {
    throw new HttpError(400, 'Informe um intervalo de datas válido.');
  }
  const { data, error } = await supabase.rpc('list_patient_available_slots', {
    p_patient_id: actor.id, p_from_date: from, p_until_date: until,
  });
  if (error) {
    if (error.code === 'PGRST202' || error.code === '42883') {
      throw new HttpError(503, 'O agendamento pelo calendário ainda não foi ativado neste banco.');
    }
    logDatabaseError('Falha ao listar horários livres', error);
    throw new HttpError(500, 'Não foi possível carregar os horários disponíveis.');
  }
  sendJson(response, 200, { slots: (data ?? []).map((item: Record<string, string>) => ({
    startsAt: item.starts_at, endsAt: item.ends_at,
  })) });
}

export async function bookPatientAppointment(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'patient');
  const body = await jsonBody(request);
  const startsAt = isoDate(body.startsAt, 'Data de início');
  const endsAt = isoDate(body.endsAt, 'Data de término');
  const { data, error } = await supabase.rpc('book_patient_appointment', {
    p_patient_id: actor.id, p_starts_at: startsAt, p_ends_at: endsAt,
  });
  if (error) {
    if (error.code === '23P01') throw new HttpError(409, 'Esse horário acabou de ser reservado. Escolha outro.');
    if (error.code === 'P0001') throw new HttpError(409, 'Esse horário não está mais disponível. Atualize a agenda.');
    logDatabaseError('Falha ao reservar consulta', error);
    throw new HttpError(500, 'Não foi possível agendar a consulta.');
  }
  sendJson(response, 201, { appointment: { id: data } });
}
