import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Paragraph, ScrollView, SizableText, useTheme, XStack, YStack } from 'tamagui';

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

export function AuthScreen({ children, title, description, footer, maxW = 500, brand, compact = false }: AuthScreenProps) {
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 1000 && fontScale < 1.5;
  const theme = useTheme();
  return (
    <AppScreen p={0}>
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ grow: 1 }}>
            <YStack width="100%" maxW={1160} self="center" px={wide ? '$6' : '$4'} py="$4" flex={1}>
              <XStack justify="space-between" items="center" gap="$3" mb="$4">
                {brand ?? <BrandLogo width={180} />}
                <Link href="/" asChild>
                  <Button chromeless color="$muted" minH="$touchTarget" aria-label="Voltar ao início">Início</Button>
                </Link>
              </XStack>
              <XStack gap="$8" items="flex-start" justify="center" flex={1}>
                {wide ? (
                  <YStack flex={1} minH={570} bg="$hero" rounded="$panel" p="$6" gap="$6" justify="space-between">
                    <YStack gap="$4">
                      <XStack self="flex-start" borderWidth={1} borderColor="$accent" rounded="$12" px="$3" py="$2">
                        <SizableText color="$heroText" size="$2" letterSpacing={1}>CUIDADO QUE CONTINUA</SizableText>
                      </XStack>
                      <SizableText color="$heroText" fontFamily="$heading" fontSize={40} lineHeight={50}>Mais conexão.{'\n'}Um passo de{'\n'}cada vez.</SizableText>
                      <Paragraph color="$heroMuted" size="$4" lineHeight={26}>Um espaço para organizar seu acompanhamento e levar o que importa para a próxima conversa.</Paragraph>
                    </YStack>
                    <YStack gap="$4" borderTopWidth={1} borderColor="$heroMuted" pt="$5">
                      {[
                        { icon: 'journal-outline', title: 'Seu percurso, organizado', text: 'Registros e orientações em um só lugar.' },
                        { icon: 'people-outline', title: 'Um vínculo de cuidado', text: 'Acompanhamento entre paciente e profissional.' },
                        { icon: 'lock-closed-outline', title: 'Acesso com privacidade', text: 'Informações disponíveis conforme seu vínculo.' },
                      ].map((item) => (
                        <XStack key={item.title} gap="$3" items="flex-start">
                          <Ionicons name={item.icon as 'journal-outline'} size={23} color={theme.accent.val} />
                          <YStack flex={1} gap="$1"><SizableText color="$heroText" fontWeight="600">{item.title}</SizableText><Paragraph color="$heroMuted" size="$2">{item.text}</Paragraph></YStack>
                        </XStack>
                      ))}
                    </YStack>
                  </YStack>
                ) : null}
                <YStack width={wide ? maxW : '100%'} maxW={maxW} gap="$5" bg="$surface" borderWidth={1} borderColor="$borderColor" rounded="$panel" p={wide ? '$5' : '$4'} mb="$4" mt={compact && wide ? '$4' : 0}>
                  <YStack gap="$3">
                    <YStack width={36} height={4} bg="$accent" rounded="$4" />
                    <SizableText role="heading" color="$color" fontFamily="$heading" fontSize={28} lineHeight={36}>{title}</SizableText>
                    <Paragraph color="$muted" size="$4" lineHeight={24}>{description}</Paragraph>
                  </YStack>
                  {children}
                  {footer ? <YStack borderTopWidth={1} borderColor="$borderColor" pt="$3">{footer}</YStack> : null}
                </YStack>
              </XStack>
            </YStack>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </AppScreen>
  );
}
