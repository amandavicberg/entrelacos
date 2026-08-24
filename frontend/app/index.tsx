import { Ionicons } from '@expo/vector-icons';
import { Link, Redirect, type RelativePathString } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Button, getTokens, H2, Paragraph, ScrollView, SizableText, Spinner, useTheme, XStack, YStack } from 'tamagui';

import { AppInput } from '@/components/app-input';
import { AppScreen } from '@/components/app-screen';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { type AppRole, useAuth } from '@/contexts/auth-context';

const forgotPasswordPath = '/forgot-password' as RelativePathString;
const patientPath = '/(patient)' as RelativePathString;
const patientPendingPath = '/(patient)/pending' as RelativePathString;
const professionalPath = '/(professional)' as RelativePathString;
type Errors = Partial<Record<'email' | 'password' | 'inviteCode', string>>;

export default function LoginScreen() {
  const { accessState, signIn } = useAuth();
  const theme = useTheme();
  const tokens = getTokens();
  const [role, setRole] = useState<AppRole>('patient');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [inviteCode, setInviteCode] = useState('');
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
    if (nextRole === 'professional') setInviteCode('');
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
      setFeedback(error instanceof Error ? error.message : 'Não foi possível entrar. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppScreen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} flex={1}>
          <YStack flex={1} justify="center" gap="$6" maxW={520} width="100%" self="center" py="$6">
            <YStack gap="$2">
              <SizableText size="$2" color="$brand" fontWeight="800" letterSpacing={2}>
                ENTRELAÇOS
              </SizableText>
              <H2 color="$color" fontWeight="800">Bem-vindo de volta</H2>
              <Paragraph color="$muted" size="$4">
                Selecione seu perfil e acesse sua conta com segurança.
              </Paragraph>
            </YStack>

            <YStack gap="$2" accessibilityRole="radiogroup" aria-label="Tipo de acesso">
              <SizableText color="$muted" size="$3" fontWeight="600">Entrar como</SizableText>
              <XStack gap="$1" p="$1" bg="$borderColor" style={{ borderRadius: tokens.radius.$5.val }}>
                {(['patient', 'professional'] as const).map((option) => {
                  const selected = role === option;
                  return (
                    <Button
                      key={option}
                      flex={1}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      bg={selected ? '$brand' : 'transparent'}
                      color={selected ? '$brandContrast' : '$color'}
                      borderWidth={0}
                      style={{ borderRadius: tokens.radius.$4.val }}
                      fontWeight={selected ? '700' : '500'}
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
                value={email}
                onChangeText={setEmail}
                error={errors.email}
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                startAdornment={<Ionicons name="mail-outline" size={19} color={theme.muted.val} />}
              />
              <YStack gap="$2">
                <AppInput
                  label="Senha"
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
                  startAdornment={<Ionicons name="lock-closed-outline" size={19} color={theme.muted.val} />}
                  endAdornment={
                    <Button
                      circular
                      chromeless
                      size="$3"
                      accessibilityLabel={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                      accessibilityState={{ expanded: showPassword }}
                      icon={
                        <Ionicons
                          name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                          size={20}
                          color={theme.muted.val}
                        />
                      }
                      onPress={() => setShowPassword((value) => !value)}
                    />
                  }
                />
                <Link href={forgotPasswordPath} asChild>
                  <Button chromeless size="$3" self="flex-end" color="$brand" fontWeight="600">
                    Esqueci minha senha
                  </Button>
                </Link>
              </YStack>

              {role === 'patient' ? (
                <AppInput
                  label="Código de convite (primeiro acesso)"
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  error={errors.inviteCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={64}
                  accessibilityHint="Necessário somente se você ainda não possui associação com um profissional."
                />
              ) : null}

              {feedback ? <Paragraph color="$red10" accessibilityRole="alert">{feedback}</Paragraph> : null}

              <BrandButton
                size="$5"
                style={{ borderRadius: tokens.radius.$4.val }}
                disabled={submitting}
                opacity={submitting ? 0.72 : 1}
                pressStyle={{ scale: 0.98, opacity: 0.9 }}
                accessibilityLabel={submitting ? 'Entrando' : 'Entrar'}
                onPress={handleSubmit}
              >
                {submitting ? (
                  <XStack items="center" gap="$2">
                    <Spinner color="$brandContrast" size="small" />
                    <SizableText color="$brandContrast" fontWeight="700">Entrando...</SizableText>
                  </XStack>
                ) : 'Entrar'}
              </BrandButton>

              <XStack items="center" justify="center" gap="$1" flexWrap="wrap" py="$2">
                <Paragraph color="$muted">Primeiro acesso?</Paragraph>
                <BrandButton
                  chromeless
                  color="$brand"
                  disabled
                  accessibilityHint="A rota será conectada quando a tela de cadastro estiver disponível."
                >
                  Cadastre-se como {role === 'patient' ? 'paciente' : 'profissional'}
                </BrandButton>
              </XStack>
            </YStack>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </AppScreen>
  );
}
