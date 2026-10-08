import { Ionicons } from '@expo/vector-icons';
import { type RelativePathString, useRouter } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, ScrollView, useTheme, XStack, YStack } from 'tamagui';

import { AppHeader } from '@/components/app-header';
import { AppScreen } from '@/components/app-screen';
import { BrandLogo } from '@/components/brand-logo';

export function PatientScreen({ title, description, backToSpace = false, children }: PropsWithChildren<{ title: string; description: string; backToSpace?: boolean }>) {
  const router = useRouter();
  const theme = useTheme();
  return (
    <AppScreen p={0}>
      <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ grow: 1 }}>
          <YStack width="100%" maxW={1000} self="center" p="$5" pb="$7" gap="$5">
            <XStack justify="space-between" items="center" gap="$3" flexWrap="wrap">
              <BrandLogo width={160} framed={false} />
              {backToSpace ? <Button bg="$soft" color="$brand" borderWidth={1} borderColor="$borderColor" minH="$touchTarget"
                icon={<Ionicons name="arrow-back-outline" size={19} color={theme.brand.val} accessible={false} />}
                hoverStyle={{ bg: '$backgroundPress' }} pressStyle={{ bg: '$backgroundPress' }}
                onPress={() => router.navigate('/(patient)/space' as RelativePathString)}>Meu espaço</Button> : null}
            </XStack>
            <AppHeader eyebrow="MEU ACOMPANHAMENTO" title={title} description={description} />
            {children}
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}
