import { useEffect, useMemo, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { router } from 'expo-router';
import {
  Button,
  H3,
  Label,
  Paragraph,
  Separator,
  SizableText,
  XStack,
  YStack,
} from 'tamagui';

import { AppHeader } from '@/components/app-header';
import { AppInput } from '@/components/app-input';
import { AppScreen } from '@/components/app-screen';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { registerUser, resendConfirmationEmail } from '@/lib/registration';
import type { AppRole } from '@/lib/registration.types';

type FormValues = {
  fullName: string;
  birthDate: string;
  phone: string;
  email: string;
  password: string;
  passwordConfirmation: string;
  role: AppRole;
  specialty: string;
  registrationType: string;
  registrationNumber: string;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const initialValues: FormValues = {
  fullName: '',
  birthDate: '',
  phone: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  role: 'patient',
  specialty: '',
  registrationType: '',
  registrationNumber: '',
};

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  const requiredFields: (keyof FormValues)[] = [
    'fullName',
    'birthDate',
    'phone',
    'email',
    'password',
    'passwordConfirmation',
  ];

  for (const field of requiredFields) {
    if (!values[field].trim()) {
      errors[field] = 'Preencha este campo.';
    }
  }

  if (values.email && !/^\S+@\S+\.\S+$/.test(values.email.trim())) {
    errors.email = 'Informe um e-mail válido.';
  }

  if (values.password && values.password.length < 8) {
    errors.password = 'A senha deve ter pelo menos 8 caracteres.';
  }

  if (values.passwordConfirmation && values.password !== values.passwordConfirmation) {
    errors.passwordConfirmation = 'As senhas precisam ser iguais.';
  }

  if (values.birthDate && !isValidBirthDate(values.birthDate)) {
    errors.birthDate = 'Informe uma data válida no formato DD/MM/AAAA.';
  }

  if (values.phone && values.phone.replace(/\D/g, '').length < 10) {
    errors.phone = 'Informe um telefone válido.';
  }

  if (values.role === 'professional') {
    for (const field of ['specialty', 'registrationType', 'registrationNumber'] as const) {
      if (!values[field].trim()) {
        errors[field] = 'Preencha este campo.';
      }
    }
  }

  return errors;
}

function isValidBirthDate(value: string) {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return false;

  const [, day, month, year] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return (
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day) &&
    date <= new Date()
  );
}

function birthDateToIso(value: string) {
  const [day, month, year] = value.split('/');
  return `${year}-${month}-${day}`;
}

function formatBirthDate(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function RegistrationScreen() {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [isComplete, setIsComplete] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>();
  const [resendError, setResendError] = useState<string>();

  useEffect(() => {
    if (!isComplete) return;

    setResendCountdown(60);
    const timer = setInterval(() => {
      setResendCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [isComplete]);

  const roleLabel = useMemo(
    () => (values.role === 'patient' ? 'Paciente' : 'Profissional'),
    [values.role],
  );

  function updateValue(field: keyof FormValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSubmitError(undefined);
  }

  function changeRole(role: AppRole) {
    setValues((current) => ({
      ...current,
      role,
      specialty: role === 'professional' ? current.specialty : '',
      registrationType: role === 'professional' ? current.registrationType : '',
      registrationNumber: role === 'professional' ? current.registrationNumber : '',
    }));
    setErrors({});
    setIsRoleMenuOpen(false);
  }

  async function submit() {
    const nextErrors = validate(values);
    setErrors(nextErrors);
    setSubmitError(undefined);

    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    const { error } = await registerUser({
      fullName: values.fullName.trim(),
      birthDate: birthDateToIso(values.birthDate),
      phone: values.phone.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
      role: values.role,
      specialty: values.role === 'professional' ? values.specialty.trim() : undefined,
      registrationType:
        values.role === 'professional' ? values.registrationType.trim() : undefined,
      registrationNumber:
        values.role === 'professional' ? values.registrationNumber.trim() : undefined,
    });
    setIsSubmitting(false);

    if (error) {
      setSubmitError(getRegistrationError(error.message));
      return;
    }

    setIsComplete(true);
  }

  async function resendEmail() {
    if (resendCountdown > 0 || isResending) return;

    setIsResending(true);
    setResendMessage(undefined);
    setResendError(undefined);
    const { error } = await resendConfirmationEmail(values.email.trim().toLowerCase());
    setIsResending(false);

    if (error) {
      setResendError('Não foi possível reenviar agora. Tente novamente em alguns instantes.');
      return;
    }

    setResendCountdown(60);
    setResendMessage('Enviamos um novo link de confirmação para o seu e-mail.');
  }

  if (isComplete) {
    return (
      <AppScreen>
        <YStack flex={1} justify="center" maxW={560} width="100%" self="center" gap="$5">
          <AppHeader
            eyebrow="CADASTRO CONCLUÍDO"
            title="Confira seu e-mail"
            description="Enviamos um link de confirmação para o endereço informado. Confirme sua conta antes de acessar o aplicativo."
          />
          <YStack bg="$backgroundHover" p="$4" gap="$2">
            <SizableText color="$color" fontWeight="700">
              Próximo passo
            </SizableText>
            <Paragraph color="$muted">
              Depois de confirmar o e-mail, volte para a tela de login para entrar no EntreLaços.
            </Paragraph>
          </YStack>
          <YStack gap="$2">
            <Paragraph color="$muted">
              Não recebeu o e-mail? Aguarde 1 minuto. Depois desse tempo, você poderá solicitar
              um novo envio.
            </Paragraph>
            {resendCountdown > 0 ? (
              <Paragraph color="$muted">
                Reenvio disponível em {resendCountdown}s.
              </Paragraph>
            ) : (
              <BrandButton size="$5" disabled={isResending} onPress={resendEmail}>
                {isResending ? 'Reenviando...' : 'Reenviar e-mail de confirmação'}
              </BrandButton>
            )}
            {resendMessage ? <Paragraph color="$brand">{resendMessage}</Paragraph> : null}
            {resendError ? <Paragraph color="$red10">{resendError}</Paragraph> : null}
          </YStack>
          <BrandButton size="$5" onPress={() => router.back()}>
            Voltar para o login
          </BrandButton>
        </YStack>
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1 }}>
          <YStack width="100%" maxW={620} self="center" gap="$5" py="$4">
            <AppHeader
              eyebrow="ENTRELAÇOS"
              title="Crie sua conta"
              description="Escolha seu perfil e preencha seus dados para começar."
            />

            <YStack gap="$2">
              <Label color="$color" fontWeight="600" htmlFor="role-select">
                Tipo de usuário
              </Label>
              <Button
                id="role-select"
                width="100%"
                size="$5"
                justify="space-between"
                borderWidth={1}
                borderColor="$borderColor"
                bg="$background"
                color="$color"
                onPress={() => setIsRoleMenuOpen((current) => !current)}
                accessibilityRole="button"
                accessibilityState={{ expanded: isRoleMenuOpen }}
              >
                {roleLabel}
                <SizableText color="$muted">{isRoleMenuOpen ? '▲' : '▼'}</SizableText>
              </Button>
              {isRoleMenuOpen ? (
                <YStack borderWidth={1} borderColor="$borderColor" bg="$background" p="$1">
                  <Button
                    chromeless
                    justify="flex-start"
                    color="$color"
                    onPress={() => changeRole('patient')}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: values.role === 'patient' }}
                  >
                    Paciente
                  </Button>
                  <Button
                    chromeless
                    justify="flex-start"
                    color="$color"
                    onPress={() => changeRole('professional')}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: values.role === 'professional' }}
                  >
                    Profissional
                  </Button>
                </YStack>
              ) : null}
              <Paragraph color="$muted" size="$2">
                Perfil selecionado: {roleLabel}
              </Paragraph>
            </YStack>

            <Separator borderColor="$borderColor" />

            <YStack gap="$4">
              <H3 color="$color">Dados básicos</H3>
              <AppInput
                label="Nome completo"
                value={values.fullName}
                onChangeText={(value) => updateValue('fullName', value)}
                error={errors.fullName}
                autoCapitalize="words"
                autoComplete="name"
                returnKeyType="next"
              />
              <AppInput
                label="Data de nascimento"
                placeholder="DD/MM/AAAA"
                value={values.birthDate}
                onChangeText={(value) => updateValue('birthDate', formatBirthDate(value))}
                error={errors.birthDate}
                keyboardType="number-pad"
              />
              <AppInput
                label="Telefone"
                value={values.phone}
                onChangeText={(value) => updateValue('phone', formatPhone(value))}
                error={errors.phone}
                keyboardType="phone-pad"
                autoComplete="tel"
              />
              <AppInput
                label="E-mail"
                id="registration-email"
                value={values.email}
                onChangeText={(value) => updateValue('email', value)}
                error={errors.email}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />
              <AppInput
                label="Senha"
                id="registration-password"
                value={values.password}
                onChangeText={(value) => updateValue('password', value)}
                error={errors.password}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
              />
              <AppInput
                label="Confirmar senha"
                value={values.passwordConfirmation}
                onChangeText={(value) => updateValue('passwordConfirmation', value)}
                error={errors.passwordConfirmation}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="new-password"
              />
            </YStack>

            {values.role === 'professional' ? (
              <YStack gap="$4">
                <Separator borderColor="$borderColor" />
                <H3 color="$color">Dados profissionais</H3>
                <AppInput
                  label="Atuação profissional"
                  value={values.specialty}
                  onChangeText={(value) => updateValue('specialty', value)}
                  error={errors.specialty}
                  autoCapitalize="sentences"
                />
                <AppInput
                  label="Tipo de registro profissional"
                  value={values.registrationType}
                  onChangeText={(value) => updateValue('registrationType', value)}
                  error={errors.registrationType}
                />
                <AppInput
                  label="Número do registro profissional"
                  value={values.registrationNumber}
                  onChangeText={(value) => updateValue('registrationNumber', value)}
                  error={errors.registrationNumber}
                />
              </YStack>
            ) : null}

            {submitError ? (
              <FeedbackState
                status="error"
                title="Não foi possível criar sua conta"
                description={submitError}
              />
            ) : null}

            <BrandButton size="$5" disabled={isSubmitting} onPress={submit}>
              {isSubmitting ? 'Criando conta...' : 'Criar conta'}
            </BrandButton>

            <XStack justify="center">
              <Button chromeless color="$brand" onPress={() => router.back()}>
                Voltar para o login
              </Button>
            </XStack>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}

function getRegistrationError(message: string) {
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('already registered')) {
    return 'Este e-mail já está cadastrado. Tente entrar pela tela de login.';
  }

  if (normalizedMessage.includes('redirect')) {
    return 'O link de confirmação ainda não está autorizado para este aplicativo. Configure “entrelacos://login” nas URLs de redirecionamento do Supabase.';
  }

  if (normalizedMessage.includes('database error saving new user')) {
    return 'Não foi possível finalizar o cadastro. Verifique se a configuração do perfil no Supabase está atualizada.';
  }

  if (normalizedMessage.includes('signups not allowed')) {
    return 'O cadastro de novos usuários está desativado no Supabase.';
  }

  if (normalizedMessage.includes('rate limit')) {
    return 'O limite de envio de e-mails foi atingido. Aguarde alguns minutos antes de tentar novamente.';
  }

  if (normalizedMessage.includes('password')) {
    return 'A senha não atende aos requisitos de segurança.';
  }

  const reason = message.trim();
  return reason
    ? `Não foi possível concluir o cadastro. Motivo informado pelo serviço: ${reason}`
    : 'Não foi possível concluir o cadastro. Verifique os dados e tente novamente.';
}
