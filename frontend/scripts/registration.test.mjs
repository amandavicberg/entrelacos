import assert from 'node:assert/strict';
import { test } from 'node:test';
import { authErrorMessage, reportAuthError } from '../lib/auth-errors.ts';
import { initialValues, validateRegistration, birthDateToIso, formatBirthDate, formatPhone } from '../lib/registration-form.ts';

const patient = { ...initialValues, fullName: 'Pessoa de teste', birthDate: '29/02/2000', phone: '(21) 90000-0000', email: 'teste@example.com', password: 'Senha-de-teste-123', passwordConfirmation: 'Senha-de-teste-123' };
test('cadastro de paciente e profissional validam requisitos próprios', () => {
  assert.deepEqual(validateRegistration(patient), {});
  assert.deepEqual(Object.keys(validateRegistration({ ...patient, role: 'professional' })).sort(), ['registrationNumber', 'registrationType', 'specialty']);
  assert.deepEqual(validateRegistration({ ...patient, role: 'professional', specialty: 'Psicologia', registrationType: 'CRP', registrationNumber: 'TESTE' }), {});
});
test('cadastro rejeita datas inexistentes, futuras e dados inválidos antes da rede', () => {
  for (const birthDate of ['29/02/2001', '31/04/2000', '00/01/2000', '01/13/2000', '01/01/2999', '2000-02-29']) {
    assert.ok(validateRegistration({ ...patient, birthDate }).birthDate, birthDate);
  }
  assert.ok(validateRegistration({ ...patient, fullName: 'x'.repeat(161) }).fullName);
  assert.ok(validateRegistration({ ...patient, email: 'sem-arroba' }).email);
  assert.ok(validateRegistration({ ...patient, passwordConfirmation: 'outra' }).passwordConfirmation);
  assert.ok(validateRegistration({ ...patient, phone: '123456789012' }).phone);
  for (const password of ['abcdefghij', 'Abcdefghij', 'Abcdefghi1', 'Abcdefghi!', 'Ab1!']) {
    assert.ok(validateRegistration({ ...patient, password }).password, password);
  }
});
test('data brasileira e telefone mantêm valores esperados para o cadastro', () => {
  assert.equal(birthDateToIso('29/02/2000'), '2000-02-29');
  assert.equal(formatBirthDate('29022000'), '29/02/2000');
  assert.equal(formatPhone('2133334444'), '(21) 3333-4444');
  assert.equal(formatPhone('21988887777'), '(21) 98888-7777');
});
test('falhas de envio, rede, confirmação e banco têm orientações distintas', () => {
  assert.match(authErrorMessage({ code: 'email_address_not_authorized' }), /envio de e-mails ainda não está liberado/);
  assert.match(authErrorMessage({ code: 'over_email_send_rate_limit' }), /Muitas tentativas/);
  assert.match(authErrorMessage({ code: 'email_not_confirmed' }, 'login'), /Confirme seu e-mail/);
  assert.match(authErrorMessage({ message: 'Database error saving new user' }), /preparar seu perfil/);
  assert.match(authErrorMessage({ name: 'AuthRetryableFetchError' }), /internet/);
  assert.match(authErrorMessage({ code: 'invalid_credentials' }, 'login'), /senha incorretos/);
  assert.doesNotMatch(authErrorMessage({ message: 'secret-token-and-email@example.com' }), /secret-token|example.com/);
});
test('diagnóstico nunca registra mensagens, metadados ou tokens', () => {
  const oldWarn = console.warn;
  const logs = [];
  console.warn = (...args) => logs.push(args);
  try {
    reportAuthError('signup', { code: 'unexpected_failure', status: 500, message: 'private', access_token: 'private', email: 'private' });
    assert.deepEqual(logs, [['[auth]', { operation: 'signup', code: 'unexpected_failure', status: 500 }]]);
  } finally { console.warn = oldWarn; }
});
