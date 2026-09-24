import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

import { activeRelationship, authenticate, HttpError, type Actor } from './auth.js';
import { supabase } from './config/supabase.js';
import { logDatabaseError, sendJson } from './http.js';
import { jsonBody, pagination, text, uuid } from './validation.js';

const maxPdfBytes = 10 * 1024 * 1024;
const feelings = new Set(['calm', 'happy', 'tired', 'anxious', 'sad', 'other']);
const documentKinds = new Set(['exam', 'report', 'diagnosis', 'other']);

function failure(context: string, message: string, error: unknown): never {
  logDatabaseError(context, error);
  throw new HttpError(500, message);
}

function documentOutput(item: Record<string, any>) {
  return { id: item.id, relationshipId: item.relationship_id, title: item.title, kind: item.document_kind, mimeType: item.mime_type, sizeBytes: item.size_bytes, createdAt: item.created_at };
}

function messageOutput(item: Record<string, any>) {
  return { id: item.id, relationshipId: item.relationship_id, content: item.content, createdAt: item.created_at };
}

function checkInOutput(item: Record<string, any>) {
  return { id: item.id, relationshipId: item.relationship_id, feeling: item.feeling, note: item.note, createdAt: item.created_at };
}

function pdfInput(body: Record<string, unknown>) {
  const fileName = text(body.fileName, 'Nome do arquivo', 255) ?? '';
  const mimeType = text(body.mimeType, 'Tipo do arquivo', 100) ?? '';
  const sizeBytes = Number(body.sizeBytes);
  if (mimeType !== 'application/pdf' || !fileName.toLowerCase().endsWith('.pdf') || !Number.isInteger(sizeBytes) || sizeBytes < 1 || sizeBytes > maxPdfBytes) {
    throw new HttpError(400, 'Envie somente PDF de até 10 MB.');
  }
  return { mimeType, sizeBytes };
}

export async function preparePatientDocumentUpload(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'patient');
  const body = await jsonBody(request);
  const file = pdfInput(body);
  const relationshipId = uuid(body.relationshipId, 'Acompanhamento');
  await activeRelationship(actor, relationshipId);
  const documentId = randomUUID();
  const storagePath = `${actor.id}/${documentId}/${randomUUID()}.pdf`;
  const { data, error } = await supabase.storage.from('patient-documents').createSignedUploadUrl(storagePath);
  if (error || !data) failure('Falha ao assinar upload de documento do paciente', 'Não foi possível preparar o envio do documento.', error);
  sendJson(response, 201, { upload: { documentId, storagePath, signedUrl: data.signedUrl, token: data.token, mimeType: file.mimeType, sizeBytes: file.sizeBytes } });
}

export async function confirmPatientDocumentUpload(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'patient');
  const body = await jsonBody(request);
  const file = pdfInput(body);
  const relationshipId = uuid(body.relationshipId, 'Acompanhamento');
  await activeRelationship(actor, relationshipId);
  const documentId = uuid(body.documentId, 'Documento');
  const storagePath = text(body.storagePath, 'Caminho do arquivo', 500) ?? '';
  if (!storagePath.startsWith(`${actor.id}/${documentId}/`)) throw new HttpError(400, 'Caminho do arquivo inválido.');
  const kind = String(body.kind);
  if (!documentKinds.has(kind)) throw new HttpError(400, 'Categoria do documento inválida.');
  const directory = storagePath.split('/').slice(0, -1).join('/');
  const name = storagePath.split('/').at(-1);
  const { data: objects, error: objectError } = await supabase.storage.from('patient-documents').list(directory, { limit: 2 });
  if (objectError || !objects?.some((item) => item.name === name)) throw new HttpError(409, 'O upload ainda não foi concluído.');
  const { data, error } = await supabase.from('patient_documents').insert({ id: documentId, relationship_id: relationshipId, patient_id: actor.id, title: text(body.title, 'Título', 160), document_kind: kind, storage_path: storagePath, mime_type: file.mimeType, size_bytes: file.sizeBytes }).select('id').single();
  if (error) failure('Falha ao registrar documento do paciente', 'Não foi possível registrar o documento.', error);
  sendJson(response, 201, { document: data });
}

export async function listPatientDocuments(request: IncomingMessage, response: ServerResponse, relationshipId?: string): Promise<void> {
  const actor = await authenticate(request);
  const { limit, offset } = pagination(request.url);
  let query = supabase.from('patient_documents').select('id, relationship_id, title, document_kind, mime_type, size_bytes, created_at').eq('status', 0).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  if (relationshipId) {
    await activeRelationship(actor, relationshipId);
    query = query.eq('relationship_id', relationshipId);
  } else if (actor.role === 'patient') {
    query = query.eq('patient_id', actor.id);
  } else throw new HttpError(400, 'Informe o acompanhamento do paciente.');
  const { data, error } = await query;
  if (error) failure('Falha ao listar documentos do paciente', 'Não foi possível carregar os documentos.', error);
  sendJson(response, 200, { documents: (data ?? []).map(documentOutput), limit, offset });
}

export async function getPatientDocumentUrl(request: IncomingMessage, response: ServerResponse, documentId: string): Promise<void> {
  const actor = await authenticate(request);
  const { data: document, error } = await supabase.from('patient_documents').select('relationship_id, patient_id, storage_path').eq('id', documentId).eq('status', 0).maybeSingle();
  if (error || !document) throw new HttpError(404, 'Documento não encontrado.');
  await activeRelationship(actor, document.relationship_id);
  if (actor.role === 'patient' && document.patient_id !== actor.id) throw new HttpError(404, 'Documento não encontrado.');
  const { data, error: signedError } = await supabase.storage.from('patient-documents').createSignedUrl(document.storage_path, 60);
  if (signedError || !data) failure('Falha ao assinar leitura de documento do paciente', 'Não foi possível abrir o documento.', signedError);
  sendJson(response, 200, { url: data.signedUrl, expiresIn: 60 });
}

export async function listPatientMessages(request: IncomingMessage, response: ServerResponse, relationshipId?: string): Promise<void> {
  const actor = await authenticate(request);
  const { limit, offset } = pagination(request.url);
  if (relationshipId) await activeRelationship(actor, relationshipId);
  let query = supabase.from('patient_messages').select('id, relationship_id, content, created_at').eq('status', 0).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  query = relationshipId ? query.eq('relationship_id', relationshipId) : query.eq('author_id', actor.id);
  const { data, error } = await query;
  if (error) failure('Falha ao listar recados do paciente', 'Não foi possível carregar os recados.', error);
  sendJson(response, 200, { messages: (data ?? []).map(messageOutput), limit, offset });
}

export async function createPatientMessage(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'patient'); const body = await jsonBody(request); const relationshipId = uuid(body.relationshipId, 'Acompanhamento');
  await activeRelationship(actor, relationshipId);
  const { data, error } = await supabase.from('patient_messages').insert({ relationship_id: relationshipId, author_id: actor.id, content: text(body.content, 'Recado', 2000) }).select('id').single();
  if (error) failure('Falha ao registrar recado do paciente', 'Não foi possível registrar o recado.', error);
  sendJson(response, 201, { message: data });
}

export async function listPatientCheckIns(request: IncomingMessage, response: ServerResponse, relationshipId?: string): Promise<void> {
  const actor = await authenticate(request); const { limit, offset } = pagination(request.url);
  if (relationshipId) await activeRelationship(actor, relationshipId);
  let query = supabase.from('patient_check_ins').select('id, relationship_id, feeling, note, created_at').eq('status', 0).order('created_at', { ascending: false }).range(offset, offset + limit - 1);
  query = relationshipId ? query.eq('relationship_id', relationshipId) : query.eq('author_id', actor.id);
  const { data, error } = await query;
  if (error) failure('Falha ao listar check-ins', 'Não foi possível carregar os check-ins.', error);
  sendJson(response, 200, { checkIns: (data ?? []).map(checkInOutput), limit, offset });
}

export async function createPatientCheckIn(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'patient'); const body = await jsonBody(request); const relationshipId = uuid(body.relationshipId, 'Acompanhamento'); const feeling = String(body.feeling);
  if (!feelings.has(feeling)) throw new HttpError(400, 'Sentimento inválido.');
  await activeRelationship(actor, relationshipId);
  const { data, error } = await supabase.from('patient_check_ins').insert({ relationship_id: relationshipId, author_id: actor.id, feeling, note: text(body.note, 'Anotação', 500, false) }).select('id').single();
  if (error) failure('Falha ao registrar check-in', 'Não foi possível registrar como você está.', error);
  sendJson(response, 201, { checkIn: data });
}

export async function getBirthdayMessage(request: IncomingMessage, response: ServerResponse): Promise<void> {
  const actor = await authenticate(request, 'patient');
  const { data: profile, error: profileError } = await supabase.from('patient_profiles').select('birth_date').eq('id', actor.id).eq('status', 0).maybeSingle();
  if (profileError || !profile?.birth_date) return sendJson(response, 200, { isBirthday: false });
  const birth = new Date(`${profile.birth_date}T12:00:00`); const now = new Date();
  if (birth.getUTCMonth() !== now.getMonth() || birth.getUTCDate() !== now.getDate()) return sendJson(response, 200, { isBirthday: false });
  const { data: relationships, error } = await supabase.from('patient_professional_relationships').select('id').eq('patient_id', actor.id).eq('relationship_status', 'active').eq('status', 0);
  if (error) failure('Falha ao consultar aniversário', 'Não foi possível carregar a mensagem de aniversário.', error);
  const ids = (relationships ?? []).map((item) => item.id);
  const { data: messages, error: messageError } = ids.length ? await supabase.from('professional_birthday_messages').select('content').in('relationship_id', ids).eq('status', 0).order('updated_at', { ascending: false }).limit(1) : { data: [], error: null };
  if (messageError) failure('Falha ao consultar mensagem de aniversário', 'Não foi possível carregar a mensagem de aniversário.', messageError);
  sendJson(response, 200, { isBirthday: true, message: messages?.[0]?.content ?? null });
}

export async function upsertBirthdayMessage(request: IncomingMessage, response: ServerResponse, relationshipId: string): Promise<void> {
  const actor = await authenticate(request, 'professional'); await activeRelationship(actor, relationshipId); const body = await jsonBody(request);
  const { error } = await supabase.from('professional_birthday_messages').upsert({ relationship_id: relationshipId, author_id: actor.id, content: text(body.content, 'Mensagem de aniversário', 1000), status: 0 }, { onConflict: 'relationship_id' });
  if (error) failure('Falha ao salvar mensagem de aniversário', 'Não foi possível salvar a mensagem de aniversário.', error);
  sendJson(response, 200, {});
}
