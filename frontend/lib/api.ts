function getApiUrl(): string {
  const url = process.env.EXPO_PUBLIC_API_URL;
  if (!url) throw new Error('EXPO_PUBLIC_API_URL não foi definida no ambiente do frontend.');
  return url.replace(/\/$/, '');
}

export async function consumePatientInvite(code: string, accessToken: string): Promise<void> {
  const response = await fetch(`${getApiUrl()}/v1/patient/invitations/consume`, {
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
