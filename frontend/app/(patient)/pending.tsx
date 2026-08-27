import { Ionicons } from '@expo/vector-icons';
import { Redirect, type RelativePathString } from 'expo-router';
import { getTokens, Paragraph, SizableText, useTheme, XStack, YStack } from 'tamagui';

import { AuthScreen } from '@/components/auth-screen';
import { BrandButton } from '@/components/brand-button';
import { useAuth } from '@/contexts/auth-context';

const patientPath = '/(patient)' as RelativePathString;

export default function PatientPendingScreen() {
  const { accessState, refreshAccess, signOut } = useAuth();
  const theme = useTheme();
  const tokens = getTokens();

  if (accessState === 'patient-active') return <Redirect href={patientPath} />;

  return (
    <AuthScreen
      title="Seu acesso está quase pronto"
      description="Seu convite foi identificado. Falta apenas a aprovação do profissional para liberar seu acompanhamento."
    >
      <YStack gap="$4">
        <YStack p="$4" gap="$3" bg="$backgroundHover" borderWidth={1} borderColor="$borderColor" style={{ borderRadius: tokens.radius.$5.val }}>
          <XStack items="center" gap="$2">
            <Ionicons name="time-outline" size={23} color={theme.brand.val} />
            <SizableText color="$color" fontWeight="800">Aguardando aprovação</SizableText>
          </XStack>
          <Paragraph color="$muted">
            Enquanto isso, seus dados de acompanhamento permanecem protegidos e indisponíveis.
          </Paragraph>
        </YStack>
        <BrandButton size="$5" minH={54} onPress={refreshAccess} style={{ borderRadius: tokens.radius.$5.val }}>
          Verificar novamente
        </BrandButton>
        <BrandButton chromeless borderWidth={1} borderColor="$brand" color="$brand" minH={50} onPress={signOut} style={{ borderRadius: tokens.radius.$5.val }}>
          Sair da conta
        </BrandButton>
      </YStack>
    </AuthScreen>
  );
}
