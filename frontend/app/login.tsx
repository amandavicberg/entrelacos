import { Ionicons } from '@expo/vector-icons';
import { useIsFocused } from 'expo-router/react-navigation';
import { Link, Redirect, type RelativePathString } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, getTokens, Paragraph, SizableText, Spinner, Theme, useTheme, XStack, YStack } from 'tamagui';

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
  const isFocused = useIsFocused();

  return (
    <Theme name="light_login">
      <YStack flex={1} bg="$background">
        {isFocused ? <StatusBar style="dark" /> : null}
        <LoginContent />
      </YStack>
    </Theme>
  );
}

function LoginContent() {
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
  const submissionInFlight = useRef(false);

  if (accessState === 'loading') return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
      <FeedbackState status="loading" title="Validando sessão" />
    </SafeAreaView>
  );
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
    if (submissionInFlight.current) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    setFeedback('');
    if (Object.keys(nextErrors).length) {
      if (nextErrors.inviteCode) setIsInviteExpanded(true);
      return;
    }

    submissionInFlight.current = true;
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
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      compact
      maxW={tokens.size.loginContent.val}
      brand={<SizableText color="$brand" fontFamily="$heading" size="$6">EntreLaços</SizableText>}
      title="Seu cuidado continua aqui"
      description="Selecione seu perfil para acessar sua conta."
      footer={
        <XStack items="center" justify="center" gap="$1" flexWrap="wrap" pb="$2">
          <Paragraph color="$muted">Ainda não tem conta?</Paragraph>
          <Link href={registrationPath} asChild>
            <Button chromeless minH="$touchTarget" height="auto" py="$2" px="$2" color="$brand" fontFamily="$heading" textProps={{ textDecorationLine: 'underline' }} accessibilityHint="Abre a tela de criação de conta.">
              Cadastre-se
            </Button>
          </Link>
        </XStack>
      }
    >
      <YStack gap="$4">
        <YStack gap="$2" role="radiogroup" aria-label="Tipo de acesso">
          <SizableText color="$color" size="$3" fontWeight="700">Entrar como</SizableText>
          <XStack gap="$1" p="$1" bg="$backgroundHover" borderWidth={1} borderColor="$borderColor" style={{ borderRadius: tokens.radius.control.val }}>
            {(['patient', 'professional'] as const).map((option) => {
              const selected = role === option;
              return (
                <Button
                  key={option}
                  flex={1}
                  minH="$touchTarget"
                  height="auto"
                  py="$2"
                  px="$2"
                  disabled={submitting}
                  role="radio"
                  aria-checked={selected}
                  aria-disabled={submitting}
                  bg={selected ? '$brand' : 'transparent'}
                  color={selected ? '$brandContrast' : '$muted'}
                  borderWidth={2}
                  borderColor={selected ? '$brand' : 'transparent'}
                  style={{ borderRadius: tokens.radius.$4.val }}
                  fontWeight={selected ? '800' : '600'}
                  hoverStyle={{ bg: selected ? '$brandHover' : '$backgroundPress' }}
                  pressStyle={{ bg: selected ? '$brandPress' : '$backgroundPress' }}
                  focusVisibleStyle={{ outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' }}
                  textProps={{ text: 'center', shrink: 1 }}
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
            appearance="outlined"
            label="E-mail"
            placeholder="seuemail@exemplo.com"
            value={email}
            onChangeText={setEmail}
            error={errors.email}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            keyboardType="email-address"
            type="email"
            textContentType="emailAddress"
            returnKeyType="next"
            disabled={submitting}
            startAdornment={<Ionicons name="mail-outline" size={19} color={theme.muted.val} />}
          />

          <YStack gap="$1">
            <AppInput
              appearance="outlined"
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
              type={showPassword ? 'text' : 'password'}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              disabled={submitting}
              startAdornment={<Ionicons name="lock-closed-outline" size={19} color={theme.muted.val} />}
              endAdornment={
                <Button
                  chromeless
                  size="$3"
                  minH="$touchTarget"
                  minW="$touchTarget"
                  height="auto"
                  py="$2"
                  px="$1"
                  color="$brand"
                  disabled={submitting}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                  aria-pressed={showPassword}
                  aria-disabled={submitting}
                  onPress={() => setShowPassword((value) => !value)}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </Button>
              }
            />
            <Link href={forgotPasswordPath} asChild>
              <Button chromeless size="$3" minH="$touchTarget" height="auto" py="$2" px="$1" self="flex-end" color="$brand" fontWeight="700">
                Esqueci minha senha
              </Button>
            </Link>
          </YStack>

          {role === 'patient' ? (
            <YStack gap="$2" p="$3" bg="$backgroundHover" borderWidth={1} borderColor="$borderColor" style={{ borderRadius: tokens.radius.control.val }}>
              <Button
                chromeless
                justify="space-between"
                px={0}
                minH="$touchTarget"
                height="auto"
                py="$1"
                disabled={submitting}
                aria-label="Primeiro acesso com código de convite"
                aria-expanded={isInviteExpanded}
                aria-disabled={submitting}
                onPress={() => setIsInviteExpanded((value) => !value)}
              >
                <YStack flex={1} minW={0} gap="$1">
                  <SizableText color="$color" fontWeight="700">Primeiro acesso?</SizableText>
                  <Paragraph color="$muted" size="$2">Tenho um código de convite.</Paragraph>
                </YStack>
                <Ionicons name={isInviteExpanded ? 'chevron-up-outline' : 'chevron-down-outline'} size={20} color={theme.muted.val} />
              </Button>
              {isInviteExpanded ? (
                <YStack gap="$2" pt="$1">
                  <AppInput
                    appearance="outlined"
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
            <YStack p="$3" borderWidth={1} borderColor="$red9" bg="$backgroundHover" style={{ borderRadius: tokens.radius.$4.val }} role="alert">
              <Paragraph color="$red10">{feedback}</Paragraph>
            </YStack>
          ) : null}

          <BrandButton
            size="$5"
            minH="$control"
            height="auto"
            py="$3"
            disabled={submitting}
            hoverStyle={{ bg: '$brandHover', opacity: 1 }}
            pressStyle={{ bg: '$brandPress', opacity: 1 }}
            disabledStyle={{ bg: '$brand', opacity: 1 }}
            focusVisibleStyle={{ outlineColor: '$outlineColor', outlineWidth: 2, outlineStyle: 'solid' }}
            aria-busy={submitting}
            aria-disabled={submitting}
            aria-label={submitting ? 'Entrando' : 'Entrar'}
            onPress={handleSubmit}
            style={{ borderRadius: tokens.radius.control.val }}
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
