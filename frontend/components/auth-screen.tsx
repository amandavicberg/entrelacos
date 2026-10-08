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
            <YStack width="100%" maxW={1160} self="center" px={wide ? '$6' : '$4'} py={wide ? '$5' : '$4'} flex={1} gap={wide ? '$6' : '$4'}>
              <XStack justify="space-between" items="center" gap="$3">
                {brand ?? <BrandLogo width={wide ? 190 : 160} framed={false} />}
                <Link href="/" asChild>
                  <Button bg="$surface" color="$brand" borderWidth={1} borderColor="$borderColor" minH="$touchTarget"
                    icon={<Ionicons name="arrow-back-outline" size={18} color={theme.brand.val} accessible={false} />}
                    aria-label="Voltar ao início">Início</Button>
                </Link>
              </XStack>
              <XStack gap="$6" items="flex-start" justify="center" flex={1}>
                {wide ? (
                  <YStack flex={1} minW={0} minH={compact ? 520 : 660} bg="$accentSoft" borderWidth={1} borderColor="$logoBorder" rounded="$panel" p="$6" gap="$6" justify="space-between">
                    <YStack gap="$5">
                      <XStack self="flex-start" items="center" gap="$2" bg="$surface" rounded="$12" px="$3" py="$2">
                        <YStack width={8} height={8} rounded="$12" bg="$accent" />
                        <SizableText color="$accentText" size="$2" fontWeight="700" letterSpacing={1}>CUIDADO ENTRE ENCONTROS</SizableText>
                      </XStack>
                      <SizableText color="$color" fontFamily="$heading" fontSize={38} lineHeight={49}>Um espaço para o que acontece entre as consultas.</SizableText>
                      <Paragraph color="$muted" size="$4" lineHeight={26}>Acompanhe consultas, organize seus registros e encontre o que foi compartilhado com você.</Paragraph>
                    </YStack>
                    <YStack gap="$4" borderTopWidth={1} borderColor="$logoBorder" pt="$5">
                      {[
                        { icon: 'calendar-outline', title: 'Consultas à mão', text: 'Veja os próximos encontros e confirme sua presença.' },
                        { icon: 'folder-open-outline', title: 'Tudo em seu lugar', text: 'Acesse materiais, documentos e orientações.' },
                        { icon: 'shield-checkmark-outline', title: 'Acesso vinculado', text: 'Seu espaço é liberado após o vínculo com o profissional.' },
                      ].map((item) => (
                        <XStack key={item.title} gap="$3" items="flex-start">
                          <YStack width={42} height={42} items="center" justify="center" bg="$surface" rounded="$control">
                            <Ionicons name={item.icon as 'calendar-outline'} size={21} color={theme.brand.val} accessible={false} />
                          </YStack>
                          <YStack flex={1} gap="$1"><SizableText color="$color" fontWeight="700">{item.title}</SizableText><Paragraph color="$muted" size="$2">{item.text}</Paragraph></YStack>
                        </XStack>
                      ))}
                    </YStack>
                  </YStack>
                ) : null}
                <YStack width={wide ? maxW : '100%'} maxW={maxW} gap="$5" bg="$surface" borderWidth={1} borderColor="$borderColor" rounded="$panel" p={wide ? '$6' : '$5'} mb="$5" mt={compact && wide ? '$4' : 0}>
                  <YStack gap="$3">
                    <YStack width={42} height={4} bg="$accent" rounded="$4" />
                    <SizableText role="heading" color="$color" fontFamily="$heading" fontSize={30} lineHeight={39}>{title}</SizableText>
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
