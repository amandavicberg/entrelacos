import { Redirect, type RelativePathString } from 'expo-router';
import { H2, Paragraph, YStack } from 'tamagui';

import { AppScreen } from '@/components/app-screen';
import { BrandButton } from '@/components/brand-button';
import { useAuth } from '@/contexts/auth-context';

const patientPath = '/(patient)' as RelativePathString;

export default function PatientPendingScreen() {
  const { accessState, refreshAccess, signOut } = useAuth();
  if (accessState === 'patient-active') return <Redirect href={patientPath} />;

  return (
    <AppScreen>
      <YStack flex={1} justify="center" gap="$4" maxW={520} width="100%" self="center">
        <H2 color="$color">Aguardando aprovação</H2>
        <Paragraph color="$muted" size="$5">
          Seu acesso foi identificado, mas os dados de acompanhamento só estarão disponíveis
          depois que o profissional aprovar a associação.
        </Paragraph>
        <BrandButton onPress={refreshAccess}>Verificar novamente</BrandButton>
        <BrandButton chromeless borderWidth={1} borderColor="$brand" color="$brand" onPress={signOut}>
          Sair da conta
        </BrandButton>
      </YStack>
    </AppScreen>
  );
}
