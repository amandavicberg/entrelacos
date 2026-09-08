import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, SizableText, useTheme, XStack, YStack } from 'tamagui';

import { AppScreen } from '@/components/app-screen';
import { initials } from '@/lib/professional-dashboard';

export type ProfessionalIcon = ComponentProps<typeof Ionicons>['name'];

export function ProfessionalScreen({ children }: PropsWithChildren) {
  return (
    <AppScreen p={0}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ grow: 1 }}>
          <YStack width="100%" maxW={1000} self="center" p="$5" gap="$5" pb="$7" flex={1}>
            {children}
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}

export function ProfessionalBrand() {
  const theme = useTheme();
  return (
    <XStack items="center" gap="$2" shrink={1}>
      <Ionicons name="link-outline" size={24} color={theme.brand.val} accessible={false} />
      <SizableText fontFamily="$heading" size="$4" color="$brand">EntreLaços</SizableText>
    </XStack>
  );
}

export function InitialsAvatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <YStack width={large ? 64 : 44} height={large ? 64 : 44} bg="$soft" rounded="$12" items="center" justify="center" shrink={0} aria-hidden>
      <SizableText color="$brand" fontFamily="$heading" size={large ? '$6' : '$3'} allowFontScaling={false}>{initials(name)}</SizableText>
    </YStack>
  );
}
