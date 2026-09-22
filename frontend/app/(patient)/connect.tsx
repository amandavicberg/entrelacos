import { Ionicons } from '@expo/vector-icons';
import { Redirect, type RelativePathString } from 'expo-router';
import { useState } from 'react';
import { getTokens, Paragraph, SizableText, Spinner, useTheme, XStack, YStack } from 'tamagui';

import { AppInput } from '@/components/app-input';
import { AuthScreen } from '@/components/auth-screen';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { useAuth } from '@/contexts/auth-context';
import { consumePatientInvite } from '@/lib/api';

const patientPath = '/(patient)' as RelativePathString;
const patientPendingPath = '/(patient)/pending' as RelativePathString;

export default function PatientConnectScreen() {
  const { accessState, refreshAccess, session, signOut } = useAuth();
  const theme = useTheme();
  const tokens = getTokens();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (accessState === 'loading') return <FeedbackState status="loading" title="Validando acesso" />;
  if (accessState === 'patient-active') return <Redirect href={patientPath} />;
  if (accessState === 'patient-pending') return <Redirect href={patientPendingPath} />;

  async function submit() {
    const normalizedCode = code.trim().toUpperCase();
    if (normalizedCode.length < 6 || normalizedCode.length > 64) {
      setError('Informe um código de convite válido.');
      return;
    }
    if (!session?.access_token || submitting) return;

    setSubmitting(true);
    setError('');
    try {
      await consumePatientInvite(normalizedCode, session.access_token);
      await refreshAccess();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Não foi possível validar o código.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthScreen
      title="Conecte-se ao seu profissional"
      description="Informe o código que você recebeu. Após a aprovação, seu espaço de acompanhamento será liberado."
    >
      <YStack gap="$4">
        <YStack p="$4" gap="$3" bg="$backgroundHover" borderWidth={1} borderColor="$borderColor" style={{ borderRadius: tokens.radius.$5.val }}>
          <XStack items="center" gap="$2">
            <Ionicons name="link-outline" size={23} color={theme.brand.val} />
            <SizableText color="$color" fontWeight="800">Convite do profissional</SizableText>
          </XStack>
          <Paragraph color="$muted">O código é pessoal, tem prazo de validade e só pode ser utilizado uma vez.</Paragraph>
        </YStack>
        <AppInput
          label="Código de convite"
          placeholder="Ex.: A1B2C3D4"
          value={code}
          onChangeText={(value) => { setCode(value.toUpperCase()); setError(''); }}
          error={error || undefined}
          autoCapitalize="characters"
          autoCorrect={false}
          autoComplete="off"
          returnKeyType="done"
          onSubmitEditing={submit}
          disabled={submitting}
          accessibilityHint="Use somente o código enviado pelo seu profissional."
        />
        <BrandButton size="$5" minH={54} disabled={submitting} onPress={submit} style={{ borderRadius: tokens.radius.$5.val }}>
          {submitting ? <XStack items="center" gap="$2"><Spinner color="$brandContrast" size="small" /><SizableText color="$brandContrast">Enviando...</SizableText></XStack> : 'Enviar solicitação'}
        </BrandButton>
        <BrandButton chromeless borderWidth={1} borderColor="$brand" color="$brand" minH={50} onPress={signOut} disabled={submitting} style={{ borderRadius: tokens.radius.$5.val }}>
          Sair da conta
        </BrandButton>
      </YStack>
    </AuthScreen>
  );
}
