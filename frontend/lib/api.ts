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

export type ProfessionalInvitation = {
  code: string;
  expiresAt: string;
};

export type PendingRelationship = {
  id: string;
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
