import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, SizableText, YStack } from 'tamagui';

import { BrandLogo } from '@/components/brand-logo';
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
  return (
    <BrandLogo width={156} />
  );
}

export function InitialsAvatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <YStack width={large ? 64 : 44} height={large ? 64 : 44} bg="$soft" rounded="$12" items="center" justify="center" shrink={0} aria-hidden>
      <SizableText color="$brand" fontFamily="$heading" size={large ? '$6' : '$3'} allowFontScaling={false}>{initials(name)}</SizableText>
    </YStack>
  );
}
