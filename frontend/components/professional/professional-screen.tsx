import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps, PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScrollView, SizableText, YStack } from 'tamagui';

import { useScreenLayout } from '@/hooks/use-screen-layout';
import { BrandLogo } from '@/components/brand-logo';
import { AppScreen } from '@/components/app-screen';
import { initials } from '@/lib/professional-dashboard';

export type ProfessionalIcon = ComponentProps<typeof Ionicons>['name'];

export function ProfessionalScreen({ children }: PropsWithChildren) {
  const { compact } = useScreenLayout();
  return (
    <AppScreen p={0}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ grow: 1 }}>
          <YStack width="100%" maxW="$page" self="center" px={compact ? '$4' : '$6'} pt="$4" gap="$5" pb="$7">
            {children}
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}

export function ProfessionalBrand() {
  return (
    <YStack pb="$3" borderBottomWidth={1} borderColor="$logoBorder"><BrandLogo width={160} framed={false} /></YStack>
  );
}

export function InitialsAvatar({ name, large = false }: { name: string; large?: boolean }) {
  return (
    <YStack width={large ? 64 : 44} height={large ? 64 : 44} bg="$accentSoft" borderWidth={1} borderColor="$logoBorder" rounded="$pill" items="center" justify="center" shrink={0} aria-hidden>
      <SizableText color="$brand" fontFamily="$heading" size={large ? '$6' : '$3'} allowFontScaling={false}>{initials(name)}</SizableText>
    </YStack>
  );
}
