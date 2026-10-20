import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import type { PropsWithChildren, ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Paragraph, ScrollView, SizableText, useTheme, XStack, YStack } from 'tamagui';
import { AppButton as Button } from '@/components/app-button';
import { BrandLogo } from '@/components/brand-logo';
import { AppScreen } from '@/components/app-screen';
import { AmbientSurface } from '@/components/ambient-surface';

type AuthScreenProps = PropsWithChildren<{
  title: string; description: string; footer?: ReactNode; maxW?: number; brand?: ReactNode; compact?: boolean;
}>;

export function AuthScreen({ children, title, description, footer, maxW = 500, brand }: AuthScreenProps) {
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 1000 && fontScale < 1.5;
  const theme = useTheme();
  return <AppScreen p={0}>
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ grow: 1 }}>
        <XStack width="100%" maxW={wide ? 1184 : 600} self="center" flexDirection={wide ? 'row' : 'column'}
          flex={1} py={wide ? '$5' : 0} items="stretch">
          <AmbientSurface strong flex={wide ? 1 : undefined} minW={0} minH={wide ? 740 : undefined}
            rounded={wide ? '$sheet' : 0}>
            <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: wide ? 1 : undefined }}>
              <YStack flex={wide ? 1 : undefined} p={wide ? '$6' : '$4'} pb={wide ? '$6' : '$7'} gap={wide ? '$7' : '$5'} justify="space-between">
                <XStack items="center" justify="space-between" gap="$3" flexWrap="wrap">
                  <YStack bg="$logoSurface" rounded="$pill" px="$3" py="$1">{brand ?? <BrandLogo width={145} framed={false} />}</YStack>
                  <Link href="/" asChild><Button circular bg="$glass" borderWidth={1} borderColor="$glassBorder" minW="$touchTarget" minH="$touchTarget"
                    aria-label="Voltar ao início" icon={<Ionicons name="arrow-back" size={21} color={theme.heroText.val} accessible={false} />}
                    hoverStyle={{ bg: '$photoShade' }} /></Link>
                </XStack>
                <YStack gap="$3" px="$2">
                  <SizableText color="$heroText" size="$2" letterSpacing={1.7}>SEU ESPAÇO DE CUIDADO</SizableText>
                  <SizableText role="heading" color="$heroText" fontFamily="$body" fontWeight="400" fontSize={wide ? 46 : 33}
                    lineHeight={wide ? 58 : 44} letterSpacing={-1}>{wide ? 'O próximo passo começa com um vínculo.' : title}</SizableText>
                  <Paragraph color="$heroText" size="$3" lineHeight={25}>{wide ? 'Escuta, presença e continuidade. Um espaço para o que acontece entre os encontros.' : description}</Paragraph>
                </YStack>
                {wide ? <XStack items="center" gap="$2"><Ionicons name="link-outline" size={22} color={theme.heroText.val} accessible={false} />
                  <SizableText color="$heroText" size="$3">Cuidado que se conecta.</SizableText></XStack> : null}
              </YStack>
            </SafeAreaView>
          </AmbientSurface>
          <YStack width={wide ? maxW + 60 : '100%'} minW={0} bg="$surface" rounded="$sheet" mt={wide ? 0 : -32}
            ml={wide ? -32 : 0} position="relative" px={wide ? '$5' : '$4'} py="$5" gap="$5">
            <YStack width={38} height={4} rounded="$pill" bg="$logoBorder" self="center" aria-hidden />
            {wide ? <YStack gap="$2"><SizableText role="heading" color="$color" fontFamily="$heading" fontSize={30} lineHeight={40} letterSpacing={-0.8}>{title}</SizableText>
              <Paragraph color="$muted" size="$3" lineHeight={25}>{description}</Paragraph></YStack> : null}
            {children}
            {footer ? <YStack borderTopWidth={1} borderColor="$borderColor" pt="$3">{footer}</YStack> : null}
            <SafeAreaView edges={['bottom']} />
          </YStack>
        </XStack>
      </ScrollView>
    </KeyboardAvoidingView>
  </AppScreen>;
}
