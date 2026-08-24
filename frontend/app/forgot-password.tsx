import { Link } from 'expo-router';
import { H2, Paragraph, YStack } from 'tamagui';

import { AppScreen } from '@/components/app-screen';
import { BrandButton } from '@/components/brand-button';

export default function ForgotPasswordScreen() {
  return (
    <AppScreen>
      <YStack flex={1} justify="center" gap="$4" maxW={520} width="100%" self="center">
        <H2 color="$color">Recuperação de senha</H2>
        <Paragraph color="$muted" size="$5">
          O fluxo seguro de redefinição será disponibilizado em uma próxima etapa.
        </Paragraph>
        <Link href="/" asChild>
          <BrandButton>Voltar ao login</BrandButton>
        </Link>
      </YStack>
    </AppScreen>
  );
}
