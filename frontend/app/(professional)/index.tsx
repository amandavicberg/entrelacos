import { Link } from 'expo-router';
import { H1, Paragraph, SizableText, YStack } from 'tamagui';

import { AppScreen } from '@/components/app-screen';
import { BrandButton } from '@/components/brand-button';

export default function ProfessionalPlaceholderScreen() {
  return (
    <AppScreen>
      <YStack flex={1} justify="center" gap="$4" maxW={520} width="100%" self="center">
        <SizableText size="$3" color="$brand" fontWeight="700" letterSpacing={1}>
          ÁREA DO PROFISSIONAL
        </SizableText>
        <H1 color="$color">Acompanhamento organizado para cada paciente.</H1>
        <Paragraph color="$muted" size="$5">
          Esta tela é um ponto de partida para o painel do profissional.
        </Paragraph>
        <Link href="/" asChild>
          <BrandButton>Voltar</BrandButton>
        </Link>
      </YStack>
    </AppScreen>
  );
}
