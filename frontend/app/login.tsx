import { Ionicons } from '@expo/vector-icons';
import { Link, Redirect, type RelativePathString } from 'expo-router';
import { useState } from 'react';
import { Button, getTokens, Paragraph, SizableText, Spinner, useTheme, XStack, YStack } from 'tamagui';

import { AuthScreen } from '@/components/auth-screen';
import { AppInput } from '@/components/app-input';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { type AppRole, useAuth } from '@/contexts/auth-context';

const forgotPasswordPath = '/forgot-password' as RelativePathString;
const patientPath = '/(patient)' as RelativePathString;
const patientPendingPath = '/(patient)/pending' as RelativePathString;
const professionalPath = '/(professional)' as RelativePathString;
const registrationPath = '/cadastro' as RelativePathString;
type Errors = Partial<Record<'email' | 'password' | 'inviteCode', string>>;

export default function LoginScreen() {
  const { accessState, signIn } = useAuth();
  const theme = useTheme();
  const tokens = getTokens();
  const [role, setRole] = useState<AppRole>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isInviteExpanded, setIsInviteExpanded] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (accessState === 'loading') return <FeedbackState status="loading" title="Validando sessão" />;
  if (accessState === 'professional') return <Redirect href={professionalPath} />;
  if (accessState === 'patient-active') return <Redirect href={patientPath} />;
  if (accessState === 'patient-pending') return <Redirect href={patientPendingPath} />;

  function selectRole(nextRole: AppRole) {
    setRole(nextRole);
    setFeedback('');
    setErrors({});
    if (nextRole === 'professional') {
      setInviteCode('');
      setIsInviteExpanded(false);
    }
  }

  function validate(): Errors {
    const nextErrors: Errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) nextErrors.email = 'Informe um e-mail válido.';
    if (!password) nextErrors.password = 'Informe sua senha.';
    if (inviteCode && (inviteCode.trim().length < 6 || inviteCode.trim().length > 64)) {
      nextErrors.inviteCode = 'O código deve ter entre 6 e 64 caracteres.';
    }
    return nextErrors;
  }

  async function handleSubmit() {
    if (submitting) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    setFeedback('');
    if (Object.keys(nextErrors).length) return;

    setSubmitting(true);
    try {
      await signIn({
        email: email.trim().toLowerCase(),
        password,
        role,
        inviteCode: role === 'patient' ? inviteCode : undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Não foi possível entrar. Tente novamente.';
      if (role === 'patient' && message.toLowerCase().includes('código de convite')) {
        setIsInviteExpanded(true);
      }
      setFeedback(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Cuidado que aproxima."
      description="Organize seu acompanhamento com segurança, proximidade e clareza."
      footer={
        <XStack items="center" justify="center" gap="$1" flexWrap="wrap" pb="$2">
          <Paragraph color="$muted">É sua primeira vez por aqui?</Paragraph>
          <Link href={registrationPath} asChild>
            <Button chromeless color="$brand" fontWeight="800" accessibilityHint="Abre a tela de criação de conta.">
              Criar acesso
            </Button>
          </Link>
        </XStack>
      }
    >
      <YStack gap="$3">
        <YStack gap="$2" accessibilityRole="radiogroup" aria-label="Tipo de acesso">
          <SizableText color="$muted" size="$3" fontWeight="700">Seu perfil</SizableText>
          <XStack gap="$1" p="$1" bg="$backgroundHover" borderWidth={1} borderColor="$borderColor" style={{ borderRadius: tokens.radius.$5.val }}>
            {(['patient', 'professional'] as const).map((option) => {
              const selected = role === option;
              return (
                <Button
                  key={option}
                  flex={1}
                  minH={44}
                  disabled={submitting}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: selected, disabled: submitting }}
                  bg={selected ? '$brand' : 'transparent'}
                  color={selected ? '$brandContrast' : '$muted'}
                  borderWidth={0}
                  style={{ borderRadius: tokens.radius.$4.val }}
                  fontWeight={selected ? '800' : '600'}
                  pressStyle={{ scale: 0.98, opacity: 0.9 }}
                  onPress={() => selectRole(option)}
                >
                  {option === 'patient' ? 'Paciente' : 'Profissional'}
                </Button>
              );
            })}
          </XStack>
        </YStack>

        <YStack gap="$4">
          <AppInput
            label="E-mail"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
            disabled={submitting}
            startAdornment={<Ionicons name="mail-outline" size={19} color={theme.muted.val} />}
          />

          <YStack gap="$1">
            <AppInput
              label="Senha"
              placeholder="Digite sua senha"
              value={password}
              onChangeText={setPassword}
              error={errors.password}
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              textContentType="password"
              secureTextEntry={!showPassword}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              disabled={submitting}
              startAdornment={<Ionicons name="lock-closed-outline" size={19} color={theme.muted.val} />}
              endAdornment={
                <Button
                  circular
                  chromeless
                  size="$3"
                  disabled={submitting}
                  accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  accessibilityState={{ expanded: showPassword, disabled: submitting }}
                  icon={<Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.muted.val} />}
                  onPress={() => setShowPassword((value) => !value)}
                />
              }
            />
            <Link href={forgotPasswordPath} asChild>
              <Button chromeless size="$3" self="flex-end" color="$brand" fontWeight="700">
                Esqueci minha senha
              </Button>
            </Link>
          </YStack>

          {role === 'patient' ? (
            <YStack gap="$2" p="$3" bg="$backgroundHover" borderWidth={1} borderColor="$borderColor" style={{ borderRadius: tokens.radius.$4.val }}>
              <Button
                chromeless
                justify="space-between"
                px={0}
                minH={36}
                disabled={submitting}
                accessibilityLabel="Primeiro acesso com código de convite"
                accessibilityState={{ expanded: isInviteExpanded, disabled: submitting }}
                onPress={() => setIsInviteExpanded((value) => !value)}
              >
                <YStack flex={1} gap="$1">
                  <SizableText color="$color" fontWeight="700">Primeiro acesso?</SizableText>
                  <Paragraph color="$muted" size="$2">Tenho um código de convite.</Paragraph>
                </YStack>
                <Ionicons name={isInviteExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color={theme.muted.val} />
              </Button>
              {isInviteExpanded ? (
                <YStack gap="$2" pt="$1">
                  <AppInput
                    label="Código de convite"
                    placeholder="Informe o código recebido"
                    value={inviteCode}
                    onChangeText={setInviteCode}
                    error={errors.inviteCode}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={64}
                    disabled={submitting}
                    accessibilityHint="Use somente se você recebeu um convite de um profissional."
                    startAdornment={<Ionicons name="key-outline" size={19} color={theme.muted.val} />}
                  />
                  <Paragraph color="$muted" size="$2">Use este código somente se você recebeu um convite.</Paragraph>
                </YStack>
              ) : null}
            </YStack>
          ) : null}

          {feedback ? (
            <YStack p="$3" borderWidth={1} borderColor="$red9" bg="$backgroundHover" style={{ borderRadius: tokens.radius.$4.val }} accessibilityRole="alert">
              <Paragraph color="$red10">{feedback}</Paragraph>
            </YStack>
          ) : null}

          <BrandButton
            size="$5"
            minH={56}
            disabled={submitting}
            opacity={submitting ? 0.72 : 1}
            pressStyle={{ scale: 0.98, opacity: 0.9 }}
            accessibilityLabel={submitting ? 'Entrando' : 'Entrar'}
            onPress={handleSubmit}
            style={{ borderRadius: tokens.radius.$5.val }}
          >
            {submitting ? (
              <XStack items="center" gap="$2">
                <Spinner color="$brandContrast" size="small" />
                <SizableText color="$brandContrast" fontWeight="800">Entrando...</SizableText>
              </XStack>
            ) : 'Entrar'}
          </BrandButton>
        </YStack>
      </YStack>
    </AuthScreen>
  );
}
