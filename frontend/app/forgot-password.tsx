import { Ionicons } from '@expo/vector-icons';
import { Link, Redirect, type RelativePathString } from 'expo-router';
import { useState } from 'react';
import { Button, getTokens, Paragraph, SizableText, Spinner, useTheme, XStack, YStack } from 'tamagui';

import { AuthScreen } from '@/components/auth-screen';
import { AppInput } from '@/components/app-input';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { useAuth } from '@/contexts/auth-context';
import { requestPasswordReset } from '@/lib/registration';

const loginPath = '/login' as RelativePathString;
const patientPath = '/(patient)' as RelativePathString;
const patientPendingPath = '/(patient)/pending' as RelativePathString;
const patientConnectPath = '/(patient)/connect' as RelativePathString;
const professionalPath = '/(professional)' as RelativePathString;

export default function ForgotPasswordScreen() {
  const { accessState } = useAuth();
  const theme = useTheme();
  const tokens = getTokens();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (accessState === 'loading') return <FeedbackState status="loading" title="Validando sessão" />;
  if (accessState === 'professional') return <Redirect href={professionalPath} />;
  if (accessState === 'patient-active') return <Redirect href={patientPath} />;
  if (accessState === 'patient-pending') return <Redirect href={patientPendingPath} />;
  if (accessState === 'patient-unassociated') return <Redirect href={patientConnectPath} />;

  async function submit() {
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
      setError('Informe um e-mail válido.');
      return;
    }

    setSubmitting(true);
    setError('');
    const { error: requestError } = await requestPasswordReset(normalizedEmail);
    setSubmitting(false);
    if (requestError) {
      setError('Não foi possível enviar agora. Verifique sua conexão e tente novamente.');
      return;
    }
    setSent(true);
  }

  return (
    <AuthScreen
      title="Recupere seu acesso"
      description="Informe seu e-mail para receber um link seguro de redefinição de senha."
      footer={
        <Link href={loginPath} replace asChild>
          <Button chromeless self="center" color="$brand" fontWeight="800">Voltar para o login</Button>
        </Link>
      }
    >
      <YStack p="$4" gap="$3" bg="$backgroundHover" borderWidth={1} borderColor="$borderColor" style={{ borderRadius: tokens.radius.$5.val }}>
        <XStack items="center" gap="$2">
          <Ionicons name="shield-checkmark-outline" size={22} color={theme.brand.val} />
          <SizableText color="$color" fontWeight="800">Segurança em primeiro lugar</SizableText>
        </XStack>
        {sent ? (
          <Paragraph color="$muted">Se houver uma conta com esse e-mail, enviaremos um link de redefinição. Verifique também a caixa de spam.</Paragraph>
        ) : (
          <>
            <Paragraph color="$muted">Por segurança, a confirmação não informa se o e-mail está cadastrado.</Paragraph>
            <AppInput label="E-mail" placeholder="seuemail@exemplo.com" value={email} onChangeText={setEmail} error={error || undefined} autoCapitalize="none" autoCorrect={false} autoComplete="email" keyboardType="email-address" textContentType="emailAddress" disabled={submitting} startAdornment={<Ionicons name="mail-outline" size={19} color={theme.muted.val} />} />
            <BrandButton size="$5" minH={52} disabled={submitting} onPress={submit} style={{ borderRadius: tokens.radius.$5.val }}>
              {submitting ? <XStack items="center" gap="$2"><Spinner color="$brandContrast" size="small" /><SizableText color="$brandContrast">Enviando...</SizableText></XStack> : 'Enviar link de recuperação'}
            </BrandButton>
          </>
        )}
      </YStack>
    </AuthScreen>
  );
}
