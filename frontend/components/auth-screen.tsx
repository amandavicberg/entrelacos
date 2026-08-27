import { Ionicons } from '@expo/vector-icons';
import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getTokens, Paragraph, ScrollView, SizableText, useTheme, XStack, YStack } from 'tamagui';

import { AppScreen } from '@/components/app-screen';

type AuthScreenProps = PropsWithChildren<{
  title: string;
  description: string;
  footer?: ReactNode;
  maxW?: number;
}>;

export function AuthScreen({ children, title, description, footer, maxW = 500 }: AuthScreenProps) {
  const tokens = getTokens();
  const theme = useTheme();

  return (
    <AppScreen>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <YStack width="100%" maxW={maxW} self="center" gap="$6" py="$4">
              <XStack items="center" gap="$2">
                <XStack
                  items="center"
                  justify="center"
                  width={36}
                  height={36}
                  bg="$brand"
                  style={{ borderRadius: tokens.radius.$6.val }}
                >
                  <Ionicons name="link-outline" size={20} color={theme.brandContrast.val} />
                </XStack>
                <SizableText color="$brand" fontFamily="$heading" letterSpacing={1.4} size="$2">
                  ENTRELAÇOS
                </SizableText>
              </XStack>

              <YStack gap="$2">
                <SizableText color="$color" fontFamily="$heading" fontSize={30} lineHeight={36}>
                  {title}
                </SizableText>
                <Paragraph color="$muted" fontFamily="$body" size="$4" lineHeight={23} maxW={390}>
                  {description}
                </Paragraph>
              </YStack>

              {children}
              {footer}
            </YStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppScreen>
  );
}
