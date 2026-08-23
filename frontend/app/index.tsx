import { Link, type RelativePathString } from 'expo-router';
import { H2, Paragraph, Separator, SizableText, YStack } from 'tamagui';

import { AppScreen } from '@/components/app-screen';
import { BrandButton } from '@/components/brand-button';

const patientPath = '/(patient)' as RelativePathString;
const professionalPath = '/(professional)' as RelativePathString;
const registrationPath = '/cadastro' as RelativePathString;

export default function EntryScreen() {
  return (
    <AppScreen>
      <YStack flex={1} justify="center" gap="$5" maxW={520} width="100%" self="center">
        <YStack gap="$2">
          <SizableText size="$3" color="$brand" fontWeight="700" letterSpacing={1}>
            ENTRELAÇOS
          </SizableText>
          <H2 color="$color">Acompanhamento mais próximo e organizado.</H2>
          <Paragraph color="$muted" size="$5">
            Estrutura inicial de navegação para validar as telas de cada perfil.
          </Paragraph>
        </YStack>

        <Separator borderColor="$borderColor" />

        <YStack gap="$3">
          <Link href={registrationPath} asChild>
            <BrandButton size="$5">Criar uma conta</BrandButton>
          </Link>
          <Link href={patientPath} asChild>
            <BrandButton size="$5" chromeless borderWidth={1} borderColor="$brand" color="$brand">
              Visualizar área do paciente
            </BrandButton>
          </Link>
          <Link href={professionalPath} asChild>
            <BrandButton size="$5" chromeless borderWidth={1} borderColor="$brand" color="$brand">
              Visualizar área do profissional
            </BrandButton>
          </Link>
        </YStack>
      </YStack>
    </AppScreen>
  );
}
