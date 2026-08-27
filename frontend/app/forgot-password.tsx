import { Ionicons } from '@expo/vector-icons';
import { Link, Redirect, type RelativePathString } from 'expo-router';
import { Button, getTokens, Paragraph, SizableText, useTheme, XStack, YStack } from 'tamagui';

import { AuthScreen } from '@/components/auth-screen';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { useAuth } from '@/contexts/auth-context';

const loginPath = '/login' as RelativePathString;
const patientPath = '/(patient)' as RelativePathString;
const patientPendingPath = '/(patient)/pending' as RelativePathString;
const professionalPath = '/(professional)' as RelativePathString;

export default function ForgotPasswordScreen() {
  const { accessState } = useAuth();
  const theme = useTheme();
  const tokens = getTokens();

  if (accessState === 'loading') return <FeedbackState status="loading" title="Validando sessão" />;
  if (accessState === 'professional') return <Redirect href={professionalPath} />;
  if (accessState === 'patient-active') return <Redirect href={patientPath} />;
  if (accessState === 'patient-pending') return <Redirect href={patientPendingPath} />;

  return (
    <AuthScreen
      title="Recupere seu acesso"
      description="Estamos preparando a redefinição segura de senha para o aplicativo."
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
        <Paragraph color="$muted">
          Enquanto esse recurso não estiver disponível, retorne ao login para tentar novamente ou criar seu acesso.
        </Paragraph>
        <Link href={loginPath} replace asChild>
          <BrandButton size="$5" minH={52} style={{ borderRadius: tokens.radius.$5.val }}>
            Voltar ao login
          </BrandButton>
        </Link>
      </YStack>
    </AuthScreen>
  );
}
