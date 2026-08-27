import { Ionicons } from '@expo/vector-icons';
import { Link, Redirect, type RelativePathString } from 'expo-router';
import { useEffect, useState } from 'react';
import { Button, getTokens, Paragraph, SizableText, Spinner, useTheme, XStack, YStack } from 'tamagui';

import { AuthScreen } from '@/components/auth-screen';
import { AppInput } from '@/components/app-input';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { type AppRole, useAuth } from '@/contexts/auth-context';
import { registerUser, resendConfirmationEmail } from '@/lib/registration';

const loginPath = '/login' as RelativePathString;
const patientPath = '/(patient)' as RelativePathString;
const patientPendingPath = '/(patient)/pending' as RelativePathString;
const professionalPath = '/(professional)' as RelativePathString;

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
    if (!values[field].trim()) errors[field] = 'Preencha este campo.';
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
      if (!values[field].trim()) errors[field] = 'Preencha este campo.';
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
    date.getFullYear() === Number(year)
    && date.getMonth() === Number(month) - 1
    && date.getDate() === Number(day)
    && date <= new Date()
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
  const { accessState } = useAuth();
  const theme = useTheme();
  const tokens = getTokens();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();
  const [isComplete, setIsComplete] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string>();
  const [resendError, setResendError] = useState<string>();
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false);

  useEffect(() => {
    if (!isComplete) return;
    setResendCountdown(60);
    const timer = setInterval(() => {
      setResendCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isComplete]);

  if (accessState === 'loading') return <FeedbackState status="loading" title="Validando sessão" />;
  if (accessState === 'professional') return <Redirect href={professionalPath} />;
  if (accessState === 'patient-active') return <Redirect href={patientPath} />;
  if (accessState === 'patient-pending') return <Redirect href={patientPendingPath} />;

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
    setSubmitError(undefined);
  }

  async function submit() {
    if (isSubmitting) return;
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
      registrationType: values.role === 'professional' ? values.registrationType.trim() : undefined,
      registrationNumber: values.role === 'professional' ? values.registrationNumber.trim() : undefined,
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
      <AuthScreen
        title="Confirme seu e-mail"
        description="Enviamos um link de confirmação para o endereço informado. Depois de confirmar, entre com seus dados para continuar."
        footer={
          <Link href={loginPath} replace asChild>
            <Button chromeless self="center" color="$brand" fontWeight="800">Voltar para o login</Button>
          </Link>
        }
      >
        <YStack gap="$4">
          <YStack p="$4" gap="$2" bg="$backgroundHover" borderWidth={1} borderColor="$borderColor" style={{ borderRadius: tokens.radius.$5.val }}>
            <XStack items="center" gap="$2">
              <Ionicons name="mail-unread-outline" size={22} color={theme.brand.val} />
              <SizableText color="$color" fontWeight="800">Próximo passo</SizableText>
            </XStack>
            <Paragraph color="$muted">Procure o e-mail na sua caixa de entrada e, se necessário, no spam.</Paragraph>
          </YStack>
          <YStack gap="$2">
            {resendCountdown > 0 ? (
              <Paragraph color="$muted">Você poderá reenviar em {resendCountdown}s.</Paragraph>
            ) : (
              <BrandButton size="$5" minH={52} disabled={isResending} onPress={resendEmail} style={{ borderRadius: tokens.radius.$5.val }}>
                {isResending ? <XStack items="center" gap="$2"><Spinner color="$brandContrast" size="small" /><SizableText color="$brandContrast">Reenviando...</SizableText></XStack> : 'Reenviar e-mail de confirmação'}
              </BrandButton>
            )}
            {resendMessage ? <Paragraph color="$brand">{resendMessage}</Paragraph> : null}
            {resendError ? <Paragraph color="$red10" accessibilityRole="alert">{resendError}</Paragraph> : null}
          </YStack>
        </YStack>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Crie seu acesso"
      description="Escolha seu perfil e preencha apenas os dados necessários para começar."
      maxW={620}
      footer={
        <XStack items="center" justify="center" gap="$1" flexWrap="wrap" pb="$2">
          <Paragraph color="$muted">Já tem uma conta?</Paragraph>
          <Link href={loginPath} replace asChild>
            <Button chromeless color="$brand" fontWeight="800">Entrar</Button>
          </Link>
        </XStack>
      }
    >
      <YStack gap="$5">
        <YStack gap="$2">
          <SizableText color="$muted" size="$3" fontWeight="700">Seu perfil</SizableText>
          <XStack gap="$1" p="$1" bg="$backgroundHover" borderWidth={1} borderColor="$borderColor" style={{ borderRadius: tokens.radius.$5.val }} accessibilityRole="radiogroup">
            {(['patient', 'professional'] as const).map((role) => {
              const selected = values.role === role;
              return (
                <Button
                  key={role}
                  flex={1}
                  minH={48}
                  disabled={isSubmitting}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: isSubmitting }}
                  bg={selected ? '$brand' : 'transparent'}
                  color={selected ? '$brandContrast' : '$muted'}
                  borderWidth={0}
                  style={{ borderRadius: tokens.radius.$4.val }}
                  fontWeight={selected ? '800' : '600'}
                  pressStyle={{ scale: 0.98, opacity: 0.9 }}
                  onPress={() => changeRole(role)}
                >
                  {role === 'patient' ? 'Paciente' : 'Profissional'}
                </Button>
              );
            })}
          </XStack>
          <Paragraph color="$muted" size="$2">
            {values.role === 'patient'
              ? 'Você poderá informar um convite no primeiro acesso.'
              : 'Vamos solicitar seus dados de atuação profissional.'}
          </Paragraph>
        </YStack>

        <YStack gap="$4">
          <SizableText color="$color" size="$5" fontWeight="800">Seus dados</SizableText>
          <AppInput label="Nome completo" placeholder="Como prefere ser chamado(a)?" value={values.fullName} onChangeText={(value) => updateValue('fullName', value)} error={errors.fullName} autoCapitalize="words" autoComplete="name" returnKeyType="next" disabled={isSubmitting} startAdornment={<Ionicons name="person-outline" size={19} color={theme.muted.val} />} />
          <AppInput label="Data de nascimento" placeholder="DD/MM/AAAA" value={values.birthDate} onChangeText={(value) => updateValue('birthDate', formatBirthDate(value))} error={errors.birthDate} keyboardType="number-pad" disabled={isSubmitting} startAdornment={<Ionicons name="calendar-outline" size={19} color={theme.muted.val} />} />
          <AppInput label="Telefone" placeholder="(00) 00000-0000" value={values.phone} onChangeText={(value) => updateValue('phone', formatPhone(value))} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" disabled={isSubmitting} startAdornment={<Ionicons name="call-outline" size={19} color={theme.muted.val} />} />
          <AppInput label="E-mail" placeholder="seuemail@exemplo.com" value={values.email} onChangeText={(value) => updateValue('email', value)} error={errors.email} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" textContentType="emailAddress" disabled={isSubmitting} startAdornment={<Ionicons name="mail-outline" size={19} color={theme.muted.val} />} />
          <AppInput label="Senha" placeholder="Crie uma senha com pelo menos 8 caracteres" value={values.password} onChangeText={(value) => updateValue('password', value)} error={errors.password} secureTextEntry={!showPassword} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" disabled={isSubmitting} startAdornment={<Ionicons name="lock-closed-outline" size={19} color={theme.muted.val} />} endAdornment={<PasswordVisibilityButton visible={showPassword} disabled={isSubmitting} color={theme.muted.val} onPress={() => setShowPassword((value) => !value)} />} />
          <AppInput label="Confirmar senha" placeholder="Repita sua senha" value={values.passwordConfirmation} onChangeText={(value) => updateValue('passwordConfirmation', value)} error={errors.passwordConfirmation} secureTextEntry={!showPasswordConfirmation} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" returnKeyType={values.role === 'professional' ? 'next' : 'done'} onSubmitEditing={values.role === 'patient' ? submit : undefined} disabled={isSubmitting} startAdornment={<Ionicons name="shield-checkmark-outline" size={19} color={theme.muted.val} />} endAdornment={<PasswordVisibilityButton visible={showPasswordConfirmation} disabled={isSubmitting} color={theme.muted.val} onPress={() => setShowPasswordConfirmation((value) => !value)} />} />
        </YStack>

        {values.role === 'professional' ? (
          <YStack gap="$4" p="$4" bg="$backgroundHover" borderWidth={1} borderColor="$borderColor" style={{ borderRadius: tokens.radius.$5.val }}>
            <YStack gap="$1">
              <SizableText color="$color" size="$5" fontWeight="800">Atuação profissional</SizableText>
              <Paragraph color="$muted" size="$2">Essas informações identificam sua atuação no EntreLaços.</Paragraph>
            </YStack>
            <AppInput label="Atuação profissional" placeholder="Ex.: Psicologia clínica" value={values.specialty} onChangeText={(value) => updateValue('specialty', value)} error={errors.specialty} autoCapitalize="sentences" disabled={isSubmitting} startAdornment={<Ionicons name="briefcase-outline" size={19} color={theme.muted.val} />} />
            <AppInput label="Tipo de registro profissional" placeholder="Ex.: CRP" value={values.registrationType} onChangeText={(value) => updateValue('registrationType', value)} error={errors.registrationType} autoCapitalize="characters" disabled={isSubmitting} startAdornment={<Ionicons name="document-text-outline" size={19} color={theme.muted.val} />} />
            <AppInput label="Número do registro profissional" placeholder="Informe seu número de registro" value={values.registrationNumber} onChangeText={(value) => updateValue('registrationNumber', value)} error={errors.registrationNumber} returnKeyType="done" onSubmitEditing={submit} disabled={isSubmitting} startAdornment={<Ionicons name="card-outline" size={19} color={theme.muted.val} />} />
          </YStack>
        ) : null}

        {submitError ? (
          <YStack p="$3" borderWidth={1} borderColor="$red9" bg="$backgroundHover" style={{ borderRadius: tokens.radius.$4.val }} accessibilityRole="alert">
            <SizableText color="$red10" fontWeight="700">Não foi possível criar sua conta</SizableText>
            <Paragraph color="$red10">{submitError}</Paragraph>
          </YStack>
        ) : null}

        <BrandButton size="$5" minH={56} disabled={isSubmitting} onPress={submit} style={{ borderRadius: tokens.radius.$5.val }} accessibilityLabel={isSubmitting ? 'Criando conta' : 'Criar acesso'}>
          {isSubmitting ? <XStack items="center" gap="$2"><Spinner color="$brandContrast" size="small" /><SizableText color="$brandContrast" fontWeight="800">Criando acesso...</SizableText></XStack> : 'Criar acesso'}
        </BrandButton>
      </YStack>
    </AuthScreen>
  );
}

function PasswordVisibilityButton({ visible, disabled, color, onPress }: { visible: boolean; disabled: boolean; color: string; onPress: () => void }) {
  return (
    <Button circular chromeless size="$3" disabled={disabled} accessibilityLabel={visible ? 'Ocultar senha' : 'Mostrar senha'} accessibilityState={{ expanded: visible, disabled }} icon={<Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={color} />} onPress={onPress} />
  );
}

function getRegistrationError(message: string) {
  const normalizedMessage = message.toLowerCase();
  if (normalizedMessage.includes('already registered')) return 'Este e-mail já está cadastrado. Entre com sua conta.';
  if (normalizedMessage.includes('redirect')) return 'O link de confirmação ainda não está autorizado para este aplicativo. Configure o esquema entrelacos nas URLs de redirecionamento do Supabase.';
  if (normalizedMessage.includes('database error saving new user')) return 'Não foi possível finalizar o cadastro. Verifique se a configuração do perfil no Supabase está atualizada.';
  if (normalizedMessage.includes('signups not allowed')) return 'O cadastro de novos usuários está desativado no Supabase.';
  if (normalizedMessage.includes('rate limit')) return 'O limite de envio de e-mails foi atingido. Aguarde alguns minutos antes de tentar novamente.';
  if (normalizedMessage.includes('password')) return 'A senha não atende aos requisitos de segurança.';
  return 'Não foi possível concluir o cadastro. Verifique os dados e tente novamente.';
}
