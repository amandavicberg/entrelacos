import { Redirect, type RelativePathString } from 'expo-router';
import { H1, Paragraph, SizableText, YStack } from 'tamagui';

import { AppScreen } from '@/components/app-screen';
import { BrandButton } from '@/components/brand-button';
import { useAuth } from '@/contexts/auth-context';

const pendingPath = '/(patient)/pending' as RelativePathString;

export default function PatientPlaceholderScreen() {
  const { accessState, signOut } = useAuth();
  if (accessState === 'patient-pending') return <Redirect href={pendingPath} />;

  return (
    <AppScreen>
      <YStack flex={1} justify="center" gap="$4" maxW={520} width="100%" self="center">
        <SizableText size="$3" color="$brand" fontWeight="700" letterSpacing={1}>
          ÁREA DO PACIENTE
        </SizableText>
        <H1 color="$color">Seu acompanhamento em um só lugar.</H1>
        <Paragraph color="$muted" size="$5">
          Esta tela é um ponto de partida para o painel do paciente.
        </Paragraph>
        <BrandButton onPress={signOut}>Sair</BrandButton>
      </YStack>
    </AppScreen>
  );
}
