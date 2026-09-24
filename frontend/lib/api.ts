function getApiUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) throw new Error('EXPO_PUBLIC_API_URL não foi definida no ambiente do frontend.');
  return url.replace(/\/$/, '');
}

const apiTimeoutMs = 15_000;

async function fetchApi(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), apiTimeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('A solicitação demorou mais que o esperado. Verifique sua conexão e tente novamente.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function requestJson<T>(path: string, accessToken: string, init: RequestInit = {}): Promise<T> {
  const response = await fetchApi(`${getApiUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
  });
  const payload = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!response.ok || !payload) throw new Error(payload?.error ?? 'Não foi possível concluir a solicitação.');
  return payload;
}

export type ProfessionalInvitation = {
  code: string;
  expiresAt: string;
};

export type PendingRelationship = {
  id: string;
  patientName: string;
  requestedAt: string;
};

export async function generateProfessionalInvite(accessToken: string): Promise<ProfessionalInvitation> {
  const response = await fetchApi(`${getApiUrl()}/v1/professional/invitations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  const payload = (await response.json().catch(() => null)) as {
    invitation?: ProfessionalInvitation;
    error?: string;
  } | null;

  if (!response.ok || !payload?.invitation) {
    throw new Error(payload?.error ?? 'Não foi possível gerar o código de convite.');
  }

  return payload.invitation;
}

export async function listPendingRelationships(accessToken: string): Promise<PendingRelationship[]> {
  const response = await fetchApi(`${getApiUrl()}/v1/professional/relationships/pending`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = (await response.json().catch(() => null)) as {
    relationships?: PendingRelationship[];
    error?: string;
  } | null;
  if (!response.ok || !payload?.relationships) {
    throw new Error(payload?.error ?? 'Não foi possível carregar as solicitações.');
  }
  return payload.relationships;
}

export async function approvePendingRelationship(accessToken: string, relationshipId: string): Promise<void> {
  const response = await fetchApi(`${getApiUrl()}/v1/professional/relationships/${relationshipId}/approve`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) throw new Error(payload?.error ?? 'Não foi possível aprovar a solicitação.');
}

export async function rejectPendingRelationship(accessToken: string, relationshipId: string): Promise<void> {
  const response = await fetchApi(`${getApiUrl()}/v1/professional/relationships/${relationshipId}/reject`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) throw new Error(payload?.error ?? 'Não foi possível recusar a solicitação.');
}

export async function consumePatientInvite(code: string, accessToken: string): Promise<void> {
  const response = await fetchApi(`${getApiUrl()}/v1/patient/invitations/consume`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ code }),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? 'Não foi possível validar o código de convite.');
  }
}

export type FollowUpPatient = { relationshipId: string; patientName: string; approvedAt: string | null };
export type FollowUpObservation = { id: string; content: string; visibility: 'professional' | 'patient'; occurredAt: string; version: number; createdAt: string };
export type FollowUpAppointment = { id: string; relationshipId: string; startsAt: string; endsAt: string; state: 'scheduled' | 'cancelled'; patientResponse: 'pending' | 'confirmed' | 'cancelled'; cancelledAt: string | null; cancellationReason: string | null };
export type FollowUpMaterial = { id: string; title: string; description: string | null; kind: 'ebook' | 'podcast' | 'video' | 'pdf' | 'audio' | 'other'; source: 'external' | 'storage'; externalUrl: string | null; mimeType: string | null; sizeBytes: number | null; createdAt: string; relationshipId?: string };
export type TimelineItem = { id: string; type: 'observation' | 'appointment' | 'material'; at: string; label: string; content?: string };
export type MaterialUsage = { count: number; sizeBytes: number; quotaBytes: number };
export type PatientRelationship = { relationshipId: string; professionalName: string; approvedAt: string | null };

export async function listProfessionalPatients(accessToken: string): Promise<FollowUpPatient[]> {
  return (await requestJson<{ patients: FollowUpPatient[] }>('/v1/professional/patients?limit=100', accessToken)).patients;
}

export async function getProfessionalPatient(accessToken: string, relationshipId: string): Promise<FollowUpPatient> {
  return (await requestJson<{ patient: FollowUpPatient }>(`/v1/professional/patients/${relationshipId}`, accessToken)).patient;
}

export async function listProfessionalObservations(accessToken: string, relationshipId: string): Promise<FollowUpObservation[]> {
  return (await requestJson<{ observations: FollowUpObservation[] }>(`/v1/professional/patients/${relationshipId}/observations`, accessToken)).observations;
}

export async function createProfessionalObservation(accessToken: string, relationshipId: string, input: { content: string; visibility: FollowUpObservation['visibility']; occurredAt: string }): Promise<void> {
  await requestJson(`/v1/professional/patients/${relationshipId}/observations`, accessToken, { method: 'POST', body: JSON.stringify(input) });
}

export async function correctProfessionalObservation(accessToken: string, relationshipId: string, observationId: string, input: { content: string; visibility: FollowUpObservation['visibility']; occurredAt: string }): Promise<void> {
  await requestJson(`/v1/professional/patients/${relationshipId}/observations/${observationId}`, accessToken, { method: 'PATCH', body: JSON.stringify(input) });
}

export async function listAppointments(accessToken: string, relationshipId?: string, patient = false): Promise<FollowUpAppointment[]> {
  const path = patient ? '/v1/patient/appointments' : relationshipId ? `/v1/professional/patients/${relationshipId}/appointments` : '/v1/professional/appointments';
  return (await requestJson<{ appointments: FollowUpAppointment[] }>(path, accessToken)).appointments;
}

export async function createAppointment(accessToken: string, relationshipId: string, startsAt: string, endsAt: string): Promise<void> {
  await requestJson(`/v1/professional/patients/${relationshipId}/appointments`, accessToken, { method: 'POST', body: JSON.stringify({ startsAt, endsAt }) });
}

export async function rescheduleAppointment(accessToken: string, relationshipId: string, appointmentId: string, startsAt: string, endsAt: string): Promise<void> {
  await requestJson(`/v1/professional/patients/${relationshipId}/appointments/${appointmentId}`, accessToken, { method: 'PATCH', body: JSON.stringify({ startsAt, endsAt }) });
}

export async function cancelProfessionalAppointment(accessToken: string, relationshipId: string, appointmentId: string, reason?: string): Promise<void> {
  await requestJson(`/v1/professional/patients/${relationshipId}/appointments/${appointmentId}/cancel`, accessToken, { method: 'POST', body: JSON.stringify({ reason }) });
}

export async function respondToAppointment(accessToken: string, appointmentId: string, response: 'confirmed' | 'cancelled', reason?: string): Promise<void> {
  await requestJson(`/v1/patient/appointments/${appointmentId}/response`, accessToken, { method: 'POST', body: JSON.stringify({ response, reason }) });
}

export async function listTimeline(accessToken: string, relationshipId: string, patient = false): Promise<TimelineItem[]> {
  const path = patient ? `/v1/patient/relationships/${relationshipId}/timeline` : `/v1/professional/patients/${relationshipId}/timeline`;
  return (await requestJson<{ timeline: TimelineItem[] }>(path, accessToken)).timeline;
}

export async function listMaterials(accessToken: string, patient = false): Promise<{ materials: FollowUpMaterial[]; usage?: MaterialUsage }> {
  return requestJson(patient ? '/v1/patient/materials' : '/v1/professional/materials', accessToken);
}

export async function createExternalMaterial(accessToken: string, input: { title: string; description?: string; kind: FollowUpMaterial['kind']; externalUrl: string }): Promise<string> {
  return (await requestJson<{ material: { id: string } }>('/v1/professional/materials/external', accessToken, { method: 'POST', body: JSON.stringify(input) })).material.id;
}

export type UploadPreparation = { materialId: string; storagePath: string; signedUrl: string; token: string };
export async function prepareMaterialUpload(accessToken: string, file: { fileName: string; mimeType: string; sizeBytes: number }): Promise<UploadPreparation> {
  return (await requestJson<{ upload: UploadPreparation }>('/v1/professional/materials/upload-url', accessToken, { method: 'POST', body: JSON.stringify(file) })).upload;
}

export async function confirmMaterialUpload(accessToken: string, input: { materialId: string; storagePath: string; fileName: string; mimeType: string; sizeBytes: number; title: string; description?: string }): Promise<string> {
  return (await requestJson<{ material: { id: string } }>('/v1/professional/materials/storage', accessToken, { method: 'POST', body: JSON.stringify(input) })).material.id;
}

export async function uploadToSignedUrl(storagePath: string, token: string, fileUri: string, mimeType: string): Promise<void> {
  const fileResponse = await fetch(fileUri);
  if (!fileResponse.ok) throw new Error('Não foi possível ler o arquivo selecionado.');
  const { error } = await getSupabaseClient().storage.from('professional-materials').uploadToSignedUrl(
    storagePath,
    token,
    await fileResponse.arrayBuffer(),
    { contentType: mimeType },
  );
  if (error) throw new Error('Não foi possível enviar o arquivo.');
}

export async function shareMaterial(accessToken: string, materialId: string, relationshipIds: string[]): Promise<void> {
  await requestJson(`/v1/professional/materials/${materialId}/shares`, accessToken, { method: 'POST', body: JSON.stringify({ relationshipIds }) });
}

export async function getMaterialUrl(accessToken: string, materialId: string, patient = false): Promise<string> {
  const path = patient ? `/v1/patient/materials/${materialId}/url` : `/v1/professional/materials/${materialId}/url`;
  return (await requestJson<{ url: string }>(path, accessToken)).url;
}

export async function listPatientObservations(accessToken: string): Promise<FollowUpObservation[]> {
  return (await requestJson<{ observations: FollowUpObservation[] }>('/v1/patient/observations', accessToken)).observations;
}

export async function listPatientRelationships(accessToken: string): Promise<PatientRelationship[]> {
  return (await requestJson<{ relationships: PatientRelationship[] }>('/v1/patient/relationships', accessToken)).relationships;
}
import { getSupabaseClient } from '@/lib/supabase';
