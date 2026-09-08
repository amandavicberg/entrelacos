import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Paragraph, SizableText, useTheme, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { BrandButton } from '@/components/brand-button';
import { ProfessionalBrand, ProfessionalScreen, type ProfessionalIcon } from './professional-screen';

export function SectionPlaceholder({ title, description, icon }: { title: string; description: string; icon: ProfessionalIcon }) {
  const theme = useTheme();
  const router = useRouter();
  return (
    <ProfessionalScreen>
      <ProfessionalBrand />
      <AppHeader eyebrow="SEU ESPAÇO DE CUIDADO" title={title} />
      <AppCard background="$surface" rounded="$panel" p="$6">
        <YStack items="center" gap="$4" py="$6" maxW={460} self="center">
          <YStack bg="$soft" p="$4" rounded="$panel"><Ionicons name={icon} size={36} color={theme.brand.val} accessible={false} /></YStack>
          <SizableText role="heading" fontFamily="$heading" color="$color" size="$6" text="center">Um novo espaço está chegando</SizableText>
          <Paragraph color="$muted" text="center">{description}</Paragraph>
          <SizableText color="$brand" size="$3" text="center">Disponível em uma próxima etapa</SizableText>
          <BrandButton minH={44} height="auto" py="$3" rounded="$control" onPress={() => router.navigate('/(professional)')}>Voltar ao início</BrandButton>
        </YStack>
      </AppCard>
    </ProfessionalScreen>
  );
}
