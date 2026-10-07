type AuthOperation = 'signup' | 'login' | 'resend' | 'recovery';

/** Translate service errors without exposing raw responses, credentials or personal data. */
export function authErrorMessage(error: unknown, operation: AuthOperation = 'signup'): string {
  const value = error && typeof error === 'object' ? error as { code?: string; message?: string; status?: number; name?: string } : {};
  const message = value.message?.toLowerCase() ?? '';
  const code = value.code;
  if (message.includes('invalid api key') || code === 'invalid_api_key') return 'O serviço de acesso está com uma configuração indisponível. A equipe do EntreLaços precisa verificar o aplicativo.';
  if (code === 'email_not_confirmed') return 'Confirme seu e-mail antes de entrar. Confira sua caixa de entrada e o spam.';
  if (code === 'email_address_not_authorized' || message.includes('email address not authorized')) {
    return 'O envio de e-mails ainda não está liberado para este endereço. Entre em contato com a equipe do EntreLaços para concluir seu acesso.';
  }
  if (code === 'over_email_send_rate_limit' || code === 'over_request_rate_limit' || value.status === 429 || message.includes('rate limit')) {
    return 'Muitas tentativas em pouco tempo. Aguarde antes de tentar novamente; o envio de e-mails pode levar mais tempo para ser liberado.';
  }
  if (code === 'user_already_exists' || message.includes('already registered')) return 'Não foi possível usar esses dados. Se você já tem conta, entre ou recupere sua senha.';
  if (code === 'signup_disabled' || message.includes('signups not allowed')) return 'Novos cadastros estão temporariamente indisponíveis. Tente novamente mais tarde.';
  if (message.includes('database error')) return 'Encontramos um problema ao preparar seu perfil. Entre em contato com a equipe do EntreLaços.';
  if (message.includes('sending confirmation') || message.includes('smtp')) return 'Não conseguimos enviar a confirmação agora. Tente novamente mais tarde ou entre em contato com a equipe.';
  if (code === 'weak_password' || code === 'same_password') return 'Escolha uma senha diferente, com 10 ou mais caracteres, maiúscula, minúscula, número e símbolo.';
  if (code === 'email_address_invalid') return 'Confira o endereço de e-mail e tente novamente.';
  if (code === 'invalid_credentials') return 'E-mail ou senha incorretos. Confira os dados ou recupere sua senha.';
  if (value.name === 'AuthRetryableFetchError' || value.name === 'TypeError' || message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
    return 'Não conseguimos conectar. Verifique sua internet e tente novamente.';
  }
  return operation === 'login'
    ? 'Não foi possível entrar agora. Tente novamente em alguns instantes.'
    : 'Não foi possível concluir a solicitação agora. Tente novamente em alguns instantes.';
}

export function reportAuthError(operation: AuthOperation, error: unknown) {
  const value = error && typeof error === 'object' ? error as { code?: unknown; status?: unknown } : {};
  // Allow only machine-readable codes. Never log the response, metadata, email or tokens.
  const code = typeof value.code === 'string' && /^[a-z_]{1,64}$/.test(value.code) ? value.code : 'unknown';
  console.warn('[auth]', { operation, code, status: typeof value.status === 'number' ? value.status : undefined });
}
