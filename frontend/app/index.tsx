import { Ionicons } from '@expo/vector-icons';
import { Link, Redirect, type RelativePathString } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, getTokens, Paragraph, SizableText, useTheme, XStack, YStack } from 'tamagui';

import { AppScreen } from '@/components/app-screen';
import { FeedbackState } from '@/components/feedback-state';
import { useAuth } from '@/contexts/auth-context';

const loginPath = '/login' as RelativePathString;
const patientPath = '/(patient)' as RelativePathString;
const patientPendingPath = '/(patient)/pending' as RelativePathString;
const professionalPath = '/(professional)' as RelativePathString;

export default function WelcomeScreen() {
  const { accessState } = useAuth();
  const theme = useTheme();
  const tokens = getTokens();

  if (accessState === 'loading') return <FeedbackState status="loading" title="Preparando seu acesso" />;
  if (accessState === 'professional') return <Redirect href={professionalPath} />;
  if (accessState === 'patient-active') return <Redirect href={patientPath} />;
  if (accessState === 'patient-pending') return <Redirect href={patientPendingPath} />;

  return (
    <AppScreen>
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1 }}>
        <YStack flex={1} width="100%" maxW={500} self="center" py="$4" gap="$6">
          <YStack items="center" gap="$5" pt="$4">
            <XStack items="center" gap="$2">
              <XStack
                items="center"
                justify="center"
                width={48}
                height={48}
                bg="$brand"
                style={{ borderRadius: tokens.radius.$6.val }}
              >
                <Ionicons name="link-outline" size={26} color={theme.brandContrast.val} />
              </XStack>
              <SizableText color="$brand" fontFamily="$heading" letterSpacing={1.5} size="$3">
                ENTRELAÇOS
              </SizableText>
            </XStack>

            <YStack items="center" gap="$3" px="$2">
              <SizableText
                color="$color"
                fontFamily="$heading"
                fontSize={34}
                lineHeight={43}
                style={{ textAlign: 'center' }}
                maxW={380}
              >
                Cuidado contínuo, em conexão.
              </SizableText>
              <Paragraph
                color="$muted"
                fontFamily="$body"
                size="$4"
                lineHeight={24}
                style={{ textAlign: 'center' }}
                maxW={390}
              >
                Um espaço seguro para pacientes e profissionais organizarem o acompanhamento com mais clareza e proximidade.
              </Paragraph>
            </YStack>
          </YStack>

          <YStack
            flex={1}
            justify="flex-end"
            gap="$4"
            minH={300}
            bg="$brand"
            overflow="hidden"
            position="relative"
            style={{ borderRadius: tokens.radius.$6.val }}
          >
            <YStack
              pointerEvents="none"
              bg="$background"
              opacity={0.98}
              style={{ position: 'absolute', top: -178, left: '-27%', width: '154%', height: 282, borderRadius: 999 }}
            />
            <YStack
              pointerEvents="none"
              borderWidth={16}
              borderColor="$brandContrast"
              opacity={0.14}
              style={{ position: 'absolute', top: -125, left: '-12%', width: '124%', height: 230, borderRadius: 999 }}
            />
            <YStack gap="$2" px="$5" pb="$5" pt="$20">
              <SizableText color="$brandContrast" fontFamily="$heading" size="$6">
                Como deseja continuar?
              </SizableText>
              <Paragraph color="$brandContrast" fontFamily="$body" opacity={0.86} lineHeight={22}>
                Acesse sua conta ou dê o primeiro passo para começar.
              </Paragraph>
            </YStack>
            <YStack gap="$2" px="$5" pb="$5">
              <Link href={loginPath} replace asChild>
                <Button
                  minH={56}
                  bg="$brandContrast"
                  color="$brand"
                  fontFamily="$heading"
                  pressStyle={{ scale: 0.98, opacity: 0.9 }}
                  style={{ borderRadius: tokens.radius.$5.val }}
                >
                  Começar
                </Button>
              </Link>
              <Link href={loginPath} replace asChild>
                <Button chromeless color="$brandContrast" fontFamily="$heading" self="center" minH={48}>
                  Já tenho acesso
                </Button>
              </Link>
            </YStack>
          </YStack>
        </YStack>
      </SafeAreaView>
    </AppScreen>
  );
}
