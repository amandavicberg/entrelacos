import { Ionicons } from '@expo/vector-icons';
import { Link, Redirect, type RelativePathString } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Paragraph, ScrollView, SizableText, useTheme, XStack, YStack } from 'tamagui';
import { AppButton as Button } from '@/components/app-button';

import { AmbientSurface } from '@/components/ambient-surface';
import { BrandLogo } from '@/components/brand-logo';
import { BrandButton } from '@/components/brand-button';
import { AppScreen } from '@/components/app-screen';
import { FeedbackState } from '@/components/feedback-state';
import { useAuth } from '@/contexts/auth-context';

export default function WelcomeScreen() {
  const { accessState } = useAuth();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 1000 && fontScale < 1.5;
  const theme = useTheme();
  if (accessState === 'loading') return <FeedbackState status="loading" title="Preparando seu acesso" />;
  if (accessState === 'professional') return <Redirect href="/(professional)" />;
  if (accessState === 'patient-active') return <Redirect href="/(patient)" />;
  if (accessState === 'patient-pending') return <Redirect href="/(patient)/pending" />;
  if (accessState === 'patient-unassociated') return <Redirect href={'/(patient)/connect' as RelativePathString} />;

  return (
    <AppScreen p={0}>
      <ScrollView contentContainerStyle={{ grow: 1 }}>
        <YStack width="100%" maxW={wide ? 1184 : 600} self="center" flex={1} py={wide ? '$5' : 0}>
          <XStack flexDirection={wide ? 'row' : 'column'} flex={1} items="stretch">
            <AmbientSurface flex={wide ? 1.2 : undefined} minW={0} minH={wide ? 740 : 460}
              rounded={wide ? '$sheet' : 0} strong>
              <SafeAreaView edges={['top', 'left', 'right']} style={{ flex: wide ? 1 : undefined }}>
                <YStack flex={wide ? 1 : undefined} justify="space-between" p={wide ? '$6' : '$4'} gap="$6" pb={wide ? '$7' : '$7'}>
                  <XStack items="center" justify="space-between" gap="$3" flexWrap="wrap">
                    <YStack bg="$logoSurface" rounded="$pill" px="$3" py="$1"><BrandLogo width={148} framed={false} /></YStack>
                    <Link href="/login" asChild><Button bg="$glass" color="$heroText" rounded="$pill" minH="$touchTarget"
                      borderWidth={1} borderColor="$glassBorder" px="$4" hoverStyle={{ bg: '$photoShade' }}
                      iconAfter={<Ionicons name="arrow-forward" size={17} color={theme.heroText.val} accessible={false} />}>Entrar</Button></Link>
                  </XStack>
                  <YStack gap="$4" px="$2" maxW={500}>
                    <SizableText color="$heroText" size="$2" letterSpacing={2} shrink={1}>CUIDADO ENTRE ENCONTROS</SizableText>
                    <SizableText role="heading" color="$heroText" fontFamily="$body" fontWeight="400" letterSpacing={-1.8}
                      fontSize={wide ? 58 : 46} lineHeight={wide ? 69 : 56}>O cuidado{'\n'}acontece{'\n'}entre nós.</SizableText>
                    <Paragraph color="$heroText" size="$3" lineHeight={24} maxW={300}>Sua história, seus encontros.{'\n'}Tudo conectado em um só espaço.</Paragraph>
                  </YStack>
                </YStack>
              </SafeAreaView>
            </AmbientSurface>

            <YStack flex={wide ? 1 : undefined} minW={0} bg="$surface" rounded="$sheet" mt={wide ? 0 : -36}
              ml={wide ? -36 : 0} position="relative" justify="center" px={wide ? '$6' : '$5'} pt="$5" pb="$5" gap="$5">
              <YStack width={38} height={4} rounded="$pill" bg="$logoBorder" self="center" mb="$1" aria-hidden />
              <YStack gap="$2">
                <XStack gap="$2" items="center"><YStack width={6} height={6} bg="$accent" rounded="$pill" />
                  <SizableText size="$2" color="$accentText" letterSpacing={1.4}>BEM-VINDO AO ENTRELAÇOS</SizableText></XStack>
                <SizableText color="$color" fontFamily="$heading" fontSize={wide ? 33 : 25} lineHeight={wide ? 44 : 34} letterSpacing={-0.6}>
                  Um lugar para continuar o seu cuidado.
                </SizableText>
                <Paragraph color="$muted" size="$3" lineHeight={24}>Organize o que importa entre uma consulta e outra, junto de quem acompanha você.</Paragraph>
              </YStack>
              <XStack gap="$2">
                {[
                  { icon: 'calendar-outline', label: 'Encontros' },
                  { icon: 'heart-outline', label: 'Registros' },
                  { icon: 'folder-open-outline', label: 'Materiais' },
                ].map((item) => <YStack key={item.label} flex={1} minW={0} items="center" gap="$2" py="$3" bg="$background" rounded="$control">
                  <Ionicons name={item.icon as 'heart-outline'} size={23} color={theme.brand.val} accessible={false} />
                  <SizableText color="$brand" size="$2" text="center">{item.label}</SizableText>
                </YStack>)}
              </XStack>
              <YStack gap="$3">
                <Link href="/cadastro" asChild><BrandButton iconAfter={<Ionicons name="arrow-forward" size={21} color={theme.brandContrast.val} accessible={false} />}>Começar meu percurso</BrandButton></Link>
                <Paragraph color="$muted" size="$2" text="center">Para pacientes e profissionais.</Paragraph>
              </YStack>
              <XStack gap="$2" items="flex-start" borderTopWidth={1} borderColor="$borderColor" pt="$4">
                <Ionicons name="link-outline" size={17} color={theme.accentText.val} accessible={false} />
                <Paragraph color="$muted" size="$2" flex={1}>O acesso do paciente começa com o convite e a aprovação do profissional.</Paragraph>
              </XStack>
              <SafeAreaView edges={['bottom']} />
            </YStack>
          </XStack>
        </YStack>
      </ScrollView>
    </AppScreen>
  );
}
