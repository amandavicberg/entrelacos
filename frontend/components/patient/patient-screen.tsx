import { useRouter } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ScrollView, XStack, YStack } from 'tamagui';

import { AppHeader } from '@/components/app-header';
import { AppScreen } from '@/components/app-screen';
import { BrandLogo } from '@/components/brand-logo';

export function PatientScreen({ title, description, children }: PropsWithChildren<{ title: string; description: string }>) {
  const router = useRouter();
  return (
    <AppScreen p={0}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ grow: 1 }}>
          <YStack width="100%" maxW={760} self="center" p="$4" pb="$7" gap="$5">
            <XStack justify="space-between" items="center" gap="$3" flexWrap="wrap">
              <BrandLogo width={156} />
              <Button chromeless color="$brand" minH="$touchTarget" onPress={() => router.replace('/(patient)')}>Meu início</Button>
            </XStack>
            <AppHeader eyebrow="MEU ACOMPANHAMENTO" title={title} description={description} />
            {children}
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}
