import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Paragraph, ScrollView, SizableText, YStack } from 'tamagui';

import { BrandLogo } from '@/components/brand-logo';
import { AppScreen } from '@/components/app-screen';

type AuthScreenProps = PropsWithChildren<{
  title: string;
  description: string;
  footer?: ReactNode;
  maxW?: number;
  brand?: ReactNode;
  compact?: boolean;
}>;

export function AuthScreen({
  children, title, description, footer, maxW = 500, brand, compact = false,
}: AuthScreenProps) {
  return (
    <AppScreen {...(compact ? { px: '$5', py: 0 } : {})}>
      <SafeAreaView edges={compact ? ['top', 'bottom', 'left', 'right'] : ['top', 'bottom']} style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={compact ? { grow: 1 } : undefined}
          >
            <YStack
              width="100%" maxW={maxW} self="center"
              gap={compact ? '$4' : '$6'} py={compact ? '$5' : '$4'}
              {...(compact ? { grow: 1, justify: 'center' } : {})}
            >
              {brand ?? <BrandLogo width={176} />}

              <YStack gap="$2">
                <SizableText role="heading" color="$color" fontFamily="$heading" fontSize={30} lineHeight={36}>
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
