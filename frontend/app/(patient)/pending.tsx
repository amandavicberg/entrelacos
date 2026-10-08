import { Ionicons } from '@expo/vector-icons';
import { Redirect, type RelativePathString, useRouter } from 'expo-router';
import { useState } from 'react';
import { getTokens, Paragraph, SizableText, useTheme, XStack, YStack } from 'tamagui';

import { AuthScreen } from '@/components/auth-screen';
import { BrandButton } from '@/components/brand-button';
import { useAuth } from '@/contexts/auth-context';

const patientPath = '/(patient)' as RelativePathString;
const patientConnectPath = '/(patient)/connect' as RelativePathString;

export default function PatientPendingScreen() {
  const { accessState, refreshAccess, signOut } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const tokens = getTokens();
  const [leaving, setLeaving] = useState(false);
  const [signOutError, setSignOutError] = useState('');

  async function handleSignOut() {
    if (leaving) return;
    setLeaving(true); setSignOutError('');
    try { await signOut(); router.replace('/login'); }
    catch { setSignOutError('Não foi possível sair da conta. Tente novamente.'); }
    finally { setLeaving(false); }
  }

  if (accessState === 'patient-active') return <Redirect href={patientPath} />;
  if (accessState === 'patient-unassociated') return <Redirect href={patientConnectPath} />;

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
        {signOutError ? <Paragraph role="alert" color="$red10">{signOutError}</Paragraph> : null}
        <BrandButton chromeless borderWidth={1} borderColor="$brand" color="$brand" minH={50} onPress={() => void handleSignOut()} disabled={leaving} style={{ borderRadius: tokens.radius.$5.val }}>
          {leaving ? 'Saindo…' : 'Sair da conta'}
        </BrandButton>
      </YStack>
    </AuthScreen>
  );
}
