import 'dotenv/config';
import { createServer } from 'node:http';

import { HttpError } from './auth.js';
import {
  cancelAppointment,
  confirmMaterialUpload,
  correctObservation,
  createAppointment,
  createExternalMaterial,
  createObservation,
  getMaterialUrl,
  getProfessionalPatient,
  listAppointments,
  listMaterials,
  listObservations,
  listPatientRelationships,
  listProfessionalPatients,
  listTimeline,
  prepareMaterialUpload,
  rescheduleAppointment,
  respondToAppointment,
  shareMaterial,
} from './follow-up.js';
import { sendJson } from './http.js';
import { consumeInvite, decideRelationship, generateInvite, listPendingRelationships } from './invitations.js';
import { confirmPatientDocumentUpload, createPatientCheckIn, createPatientMessage, getBirthdayMessage, getPatientDocumentUrl, listPatientCheckIns, listPatientDocuments, listPatientMessages, preparePatientDocumentUpload, upsertBirthdayMessage } from './patient-space.js';

const port = Number(process.env.PORT ?? 3333);
const host = process.env.HOST ?? '0.0.0.0';
const id = '([0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})';

const server = createServer(async (request, response) => {
  if (request.method === 'OPTIONS') return sendJson(response, 204, {});
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
  try {
    if (request.method === 'POST' && pathname === '/v1/patient/invitations/consume') return await consumeInvite(request, response);
    if (request.method === 'POST' && pathname === '/v1/professional/invitations') return await generateInvite(request, response);
    if (request.method === 'GET' && pathname === '/v1/professional/relationships/pending') return await listPendingRelationships(request, response);

    let match = new RegExp(`^/v1/professional/relationships/${id}/(approve|reject)$`, 'i').exec(pathname);
    if (request.method === 'POST' && match) return await decideRelationship(request, response, match[1], match[2] === 'approve' ? 'active' : 'rejected');

    if (request.method === 'GET' && pathname === '/v1/professional/patients') return await listProfessionalPatients(request, response);
    match = new RegExp(`^/v1/professional/patients/${id}$`, 'i').exec(pathname);
    if (request.method === 'GET' && match) return await getProfessionalPatient(request, response, match[1]);

    match = new RegExp(`^/v1/professional/patients/${id}/observations$`, 'i').exec(pathname);
    if (match && request.method === 'GET') return await listObservations(request, response, match[1]);
    if (match && request.method === 'POST') return await createObservation(request, response, match[1]);
    match = new RegExp(`^/v1/professional/patients/${id}/observations/${id}$`, 'i').exec(pathname);
    if (match && request.method === 'PATCH') return await correctObservation(request, response, match[1], match[2]);

    match = new RegExp(`^/v1/professional/patients/${id}/appointments$`, 'i').exec(pathname);
    if (match && request.method === 'GET') return await listAppointments(request, response, match[1]);
    if (match && request.method === 'POST') return await createAppointment(request, response, match[1]);
    match = new RegExp(`^/v1/professional/patients/${id}/appointments/${id}$`, 'i').exec(pathname);
    if (match && request.method === 'PATCH') return await rescheduleAppointment(request, response, match[1], match[2]);
    match = new RegExp(`^/v1/professional/patients/${id}/appointments/${id}/cancel$`, 'i').exec(pathname);
    if (match && request.method === 'POST') return await cancelAppointment(request, response, match[1], match[2]);
    match = new RegExp(`^/v1/professional/patients/${id}/timeline$`, 'i').exec(pathname);
    if (match && request.method === 'GET') return await listTimeline(request, response, match[1]);
    match = new RegExp(`^/v1/professional/patients/${id}/documents$`, 'i').exec(pathname);
    if (match && request.method === 'GET') return await listPatientDocuments(request, response, match[1]);
    match = new RegExp(`^/v1/professional/patients/${id}/messages$`, 'i').exec(pathname);
    if (match && request.method === 'GET') return await listPatientMessages(request, response, match[1]);
    match = new RegExp(`^/v1/professional/patients/${id}/check-ins$`, 'i').exec(pathname);
    if (match && request.method === 'GET') return await listPatientCheckIns(request, response, match[1]);
    match = new RegExp(`^/v1/professional/patients/${id}/birthday-message$`, 'i').exec(pathname);
    if (match && request.method === 'PUT') return await upsertBirthdayMessage(request, response, match[1]);
    match = new RegExp(`^/v1/professional/documents/${id}/url$`, 'i').exec(pathname);
    if (match && request.method === 'GET') return await getPatientDocumentUrl(request, response, match[1]);

    if (request.method === 'GET' && pathname === '/v1/professional/appointments') return await listAppointments(request, response);
    if (request.method === 'GET' && pathname === '/v1/professional/materials') return await listMaterials(request, response);
    if (request.method === 'POST' && pathname === '/v1/professional/materials/external') return await createExternalMaterial(request, response);
    if (request.method === 'POST' && pathname === '/v1/professional/materials/upload-url') return await prepareMaterialUpload(request, response);
    if (request.method === 'POST' && pathname === '/v1/professional/materials/storage') return await confirmMaterialUpload(request, response);
    match = new RegExp(`^/v1/professional/materials/${id}/shares$`, 'i').exec(pathname);
    if (match && request.method === 'POST') return await shareMaterial(request, response, match[1]);
    match = new RegExp(`^/v1/professional/materials/${id}/url$`, 'i').exec(pathname);
    if (match && request.method === 'GET') return await getMaterialUrl(request, response, match[1]);

    if (request.method === 'GET' && pathname === '/v1/patient/observations') return await listObservations(request, response);
    if (request.method === 'GET' && pathname === '/v1/patient/relationships') return await listPatientRelationships(request, response);
    if (request.method === 'GET' && pathname === '/v1/patient/appointments') return await listAppointments(request, response);
    if (request.method === 'GET' && pathname === '/v1/patient/materials') return await listMaterials(request, response);
    if (request.method === 'GET' && pathname === '/v1/patient/documents') return await listPatientDocuments(request, response);
    if (request.method === 'POST' && pathname === '/v1/patient/documents/upload-url') return await preparePatientDocumentUpload(request, response);
    if (request.method === 'POST' && pathname === '/v1/patient/documents') return await confirmPatientDocumentUpload(request, response);
    if (request.method === 'GET' && pathname === '/v1/patient/messages') return await listPatientMessages(request, response);
    if (request.method === 'POST' && pathname === '/v1/patient/messages') return await createPatientMessage(request, response);
    if (request.method === 'GET' && pathname === '/v1/patient/check-ins') return await listPatientCheckIns(request, response);
    if (request.method === 'POST' && pathname === '/v1/patient/check-ins') return await createPatientCheckIn(request, response);
    if (request.method === 'GET' && pathname === '/v1/patient/birthday-message') return await getBirthdayMessage(request, response);
    match = new RegExp(`^/v1/patient/appointments/${id}/response$`, 'i').exec(pathname);
    if (match && request.method === 'POST') return await respondToAppointment(request, response, match[1]);
    match = new RegExp(`^/v1/patient/relationships/${id}/timeline$`, 'i').exec(pathname);
    if (match && request.method === 'GET') return await listTimeline(request, response, match[1]);
    match = new RegExp(`^/v1/patient/materials/${id}/url$`, 'i').exec(pathname);
    if (match && request.method === 'GET') return await getMaterialUrl(request, response, match[1]);
    match = new RegExp(`^/v1/patient/documents/${id}/url$`, 'i').exec(pathname);
    if (match && request.method === 'GET') return await getPatientDocumentUrl(request, response, match[1]);

    sendJson(response, 404, { error: 'Rota não encontrada.' });
  } catch (error) {
    if (error instanceof HttpError) return sendJson(response, error.status, { error: error.publicMessage });
    console.error('Erro inesperado no backend', { name: error instanceof Error ? error.name : 'unknown' });
    sendJson(response, 500, { error: 'Não foi possível concluir a solicitação.' });
  }
});

server.listen(port, host, () => {
  console.log(`Backend do EntreLaços disponível em http://${host}:${port}.`);
});
