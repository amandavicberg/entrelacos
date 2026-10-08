import { Ionicons } from '@expo/vector-icons';
import { Link, Redirect, type RelativePathString } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Button, getTokens, Paragraph, SizableText, Spinner, useTheme, XStack, YStack } from 'tamagui';

import { AuthScreen } from '@/components/auth-screen';
import { AppInput } from '@/components/app-input';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { type AppRole, useAuth } from '@/contexts/auth-context';
import { authErrorMessage, reportAuthError } from '@/lib/auth-errors';
import { initialValues, validateRegistration, birthDateToIso, formatBirthDate, formatPhone, passwordHint, type FormValues, type FormErrors } from '@/lib/registration-form';
import { registerUser, resendConfirmationEmail } from '@/lib/registration';

const loginPath = '/login' as RelativePathString;
const patientPath = '/(patient)' as RelativePathString;
const patientPendingPath = '/(patient)/pending' as RelativePathString;
const patientConnectPath = '/(patient)/connect' as RelativePathString;
const professionalPath = '/(professional)' as RelativePathString;

export default function RegistrationScreen() {
  const { accessState } = useAuth();
  const theme = useTheme();
  const tokens = getTokens();
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submissionInFlight = useRef(false);
  const resendInFlight = useRef(false);
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
    const timer = setInterval(() => {
      setResendCountdown((current) => (current > 0 ? current - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isComplete]);

  if (accessState === 'loading') return <FeedbackState status="loading" title="Validando sessão" />;
  if (accessState === 'professional') return <Redirect href={professionalPath} />;
  if (accessState === 'patient-active') return <Redirect href={patientPath} />;
  if (accessState === 'patient-pending') return <Redirect href={patientPendingPath} />;
  if (accessState === 'patient-unassociated') return <Redirect href={patientConnectPath} />;

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
    if (submissionInFlight.current) return;
    const nextErrors = validateRegistration(values);
    setErrors(nextErrors);
    setSubmitError(undefined);
    if (Object.keys(nextErrors).length > 0) {
      setSubmitError('Revise os campos destacados acima para continuar.');
      return;
    }

    submissionInFlight.current = true;
    setIsSubmitting(true);
    try {
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
      if (error) throw error;
      setResendCountdown(60);
      setIsComplete(true);
    } catch (error) {
      reportAuthError('signup', error);
      setSubmitError(authErrorMessage(error));
    } finally {
      submissionInFlight.current = false;
      setIsSubmitting(false);
    }
  }

  async function resendEmail() {
    if (resendCountdown > 0 || resendInFlight.current) return;
    resendInFlight.current = true;
    setIsResending(true);
    setResendMessage(undefined);
    setResendError(undefined);
    try {
      const { error } = await resendConfirmationEmail(values.email.trim().toLowerCase());
      if (error) throw error;
      setResendCountdown(60);
      setResendMessage('Solicitação recebida. Confira sua caixa de entrada e o spam.');
    } catch (error) {
      reportAuthError('resend', error);
      setResendError(authErrorMessage(error, 'resend'));
      setResendCountdown(60);
    } finally {
      resendInFlight.current = false;
      setIsResending(false);
    }
  }

  if (isComplete) {
    return (
      <AuthScreen
        title="Confirme seu e-mail"
        description="Confira sua caixa de entrada para confirmar seu acesso. Se você já tem uma conta, pode entrar com seus dados."
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
            <SizableText color="$color" fontWeight="600">{values.email.trim().toLowerCase()}</SizableText>
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
            {resendError ? <Paragraph color="$red10" role="alert">{resendError}</Paragraph> : null}
          </YStack>
        </YStack>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      title="Crie sua conta"
      description="Escolha como vai usar o EntreLaços e preencha seus dados."
      maxW={560}
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
          <SizableText color="$color" size="$3" fontWeight="700">Seu perfil</SizableText>
          <XStack gap="$1" p="$1" bg="$backgroundHover" borderWidth={1} borderColor="$borderColor" style={{ borderRadius: tokens.radius.$5.val }} role="radiogroup" aria-label="Perfil da nova conta">
            {(['patient', 'professional'] as const).map((role) => {
              const selected = values.role === role;
              return (
                <Button
                  key={role}
                  flex={1}
                  minH={48}
                  height="auto"
                  py="$2"
                  px="$2"
                  textProps={{ text: 'center', shrink: 1 }}
                  disabled={isSubmitting}
                  role="radio"
                  aria-checked={selected}
                  aria-disabled={isSubmitting}
                  bg={selected ? '$brand' : 'transparent'}
                  color={selected ? '$brandContrast' : '$muted'}
                  borderWidth={0}
                  style={{ borderRadius: tokens.radius.$4.val }}
                  fontWeight={selected ? '800' : '600'}
                  hoverStyle={{ bg: selected ? '$brandHover' : '$backgroundPress' }}
                  pressStyle={{ bg: selected ? '$brandPress' : '$backgroundPress', scale: 0.98 }}
                  focusVisibleStyle={{ outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' }}
                  onPress={() => changeRole(role)}
                >
                  {role === 'patient' ? 'Paciente' : 'Profissional'}
                </Button>
              );
            })}
          </XStack>
          <Paragraph color="$muted" size="$2">
            {values.role === 'patient'
              ? 'Depois de confirmar o e-mail, informe o convite do profissional para solicitar o vínculo.'
              : 'Os dados de atuação ajudam a identificar seu perfil profissional.'}
          </Paragraph>
        </YStack>

        <YStack gap="$4">
          <SizableText color="$color" size="$5" fontWeight="700">Seus dados</SizableText>
          <AppInput appearance="filled" maxLength={160} label="Nome completo" placeholder="Seu nome completo" value={values.fullName} onChangeText={(value) => updateValue('fullName', value)} error={errors.fullName} autoCapitalize="words" autoComplete="name" returnKeyType="next" disabled={isSubmitting} startAdornment={<Ionicons name="person-outline" size={19} color={theme.muted.val} />} />
          <AppInput appearance="filled" label="Data de nascimento" placeholder="DD/MM/AAAA" value={values.birthDate} onChangeText={(value) => updateValue('birthDate', formatBirthDate(value))} error={errors.birthDate} keyboardType="number-pad" disabled={isSubmitting} startAdornment={<Ionicons name="calendar-outline" size={19} color={theme.muted.val} />} />
          <AppInput appearance="filled" label="Telefone" placeholder="(00) 00000-0000" value={values.phone} onChangeText={(value) => updateValue('phone', formatPhone(value))} error={errors.phone} keyboardType="phone-pad" autoComplete="tel" disabled={isSubmitting} startAdornment={<Ionicons name="call-outline" size={19} color={theme.muted.val} />} />
          <AppInput appearance="filled" maxLength={254} type="email" label="E-mail" placeholder="seuemail@exemplo.com" value={values.email} onChangeText={(value) => updateValue('email', value)} error={errors.email} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" textContentType="emailAddress" disabled={isSubmitting} startAdornment={<Ionicons name="mail-outline" size={19} color={theme.muted.val} />} />
        </YStack>

        {values.role === 'professional' ? (
          <YStack gap="$4" pt="$4" borderTopWidth={1} borderColor="$borderColor">
            <YStack gap="$1">
              <SizableText color="$color" size="$5" fontWeight="700">Atuação profissional</SizableText>
              <Paragraph color="$muted" size="$2">Essas informações identificam sua atuação no EntreLaços.</Paragraph>
            </YStack>
            <AppInput appearance="filled" label="Atuação profissional" placeholder="Ex.: Psicologia clínica" value={values.specialty} onChangeText={(value) => updateValue('specialty', value)} error={errors.specialty} autoCapitalize="sentences" disabled={isSubmitting} startAdornment={<Ionicons name="briefcase-outline" size={19} color={theme.muted.val} />} />
            <AppInput appearance="filled" label="Tipo de registro profissional" placeholder="Ex.: CRP" value={values.registrationType} onChangeText={(value) => updateValue('registrationType', value)} error={errors.registrationType} autoCapitalize="characters" disabled={isSubmitting} startAdornment={<Ionicons name="document-text-outline" size={19} color={theme.muted.val} />} />
            <AppInput appearance="filled" label="Número do registro profissional" placeholder="Informe seu número de registro" value={values.registrationNumber} onChangeText={(value) => updateValue('registrationNumber', value)} error={errors.registrationNumber} returnKeyType="next" disabled={isSubmitting} startAdornment={<Ionicons name="card-outline" size={19} color={theme.muted.val} />} />
          </YStack>
        ) : null}

        <YStack gap="$4" pt="$4" borderTopWidth={1} borderColor="$borderColor">
          <YStack gap="$1"><SizableText color="$color" size="$5" fontWeight="700">Segurança da conta</SizableText><Paragraph color="$muted" size="$2">{passwordHint}</Paragraph></YStack>
          <AppInput appearance="filled" label="Senha" placeholder="10+ caracteres sem contar espaços" value={values.password} onChangeText={(value) => updateValue('password', value)} error={errors.password} secureTextEntry={!showPassword} type={showPassword ? 'text' : 'password'} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" disabled={isSubmitting} startAdornment={<Ionicons name="lock-closed-outline" size={19} color={theme.muted.val} />} endAdornment={<PasswordVisibilityButton visible={showPassword} disabled={isSubmitting} color={theme.muted.val} onPress={() => setShowPassword((value) => !value)} />} />
          <AppInput appearance="filled" label="Confirmar senha" placeholder="Repita sua senha" value={values.passwordConfirmation} onChangeText={(value) => updateValue('passwordConfirmation', value)} error={errors.passwordConfirmation} secureTextEntry={!showPasswordConfirmation} type={showPasswordConfirmation ? 'text' : 'password'} autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" returnKeyType="done" onSubmitEditing={submit} disabled={isSubmitting} startAdornment={<Ionicons name="shield-checkmark-outline" size={19} color={theme.muted.val} />} endAdornment={<PasswordVisibilityButton visible={showPasswordConfirmation} disabled={isSubmitting} color={theme.muted.val} onPress={() => setShowPasswordConfirmation((value) => !value)} />} />
        </YStack>

        {submitError ? (
          <YStack p="$3" borderWidth={1} borderColor="$red9" bg="$backgroundHover" style={{ borderRadius: tokens.radius.$4.val }} role="alert">
            <SizableText color="$red10" fontWeight="700">{Object.keys(errors).length ? 'Revise os dados informados' : 'Não foi possível criar sua conta'}</SizableText>
            <Paragraph color="$red10">{submitError}</Paragraph>
          </YStack>
        ) : null}

        <BrandButton size="$5" minH={56} disabled={isSubmitting} onPress={submit} style={{ borderRadius: tokens.radius.$5.val }} accessibilityLabel={isSubmitting ? 'Criando conta' : 'Criar conta'}>
          {isSubmitting ? <XStack items="center" gap="$2"><Spinner color="$brandContrast" size="small" /><SizableText color="$brandContrast" fontWeight="800">Criando conta...</SizableText></XStack> : 'Criar conta'}
        </BrandButton>
      </YStack>
    </AuthScreen>
  );
}

function PasswordVisibilityButton({ visible, disabled, color, onPress }: { visible: boolean; disabled: boolean; color: string; onPress: () => void }) {
  return (
    <Button circular chromeless size="$3" minW="$touchTarget" minH="$touchTarget" disabled={disabled} aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={visible} aria-disabled={disabled} icon={<Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={20} color={color} />} onPress={onPress} />
  );
}
