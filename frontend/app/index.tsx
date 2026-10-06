import { Ionicons } from '@expo/vector-icons';
import { Link, Redirect, type RelativePathString } from 'expo-router';
import { useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Paragraph, ScrollView, SizableText, useTheme, XStack, YStack } from 'tamagui';

import { BrandLogo } from '@/components/brand-logo';
import { BrandButton } from '@/components/brand-button';
import { AppScreen } from '@/components/app-screen';
import { FeedbackState } from '@/components/feedback-state';
import { useAuth } from '@/contexts/auth-context';

export default function WelcomeScreen() {
  const { accessState } = useAuth();
  const { width, fontScale } = useWindowDimensions();
  const wide = width > 850 && fontScale < 1.5;
  const theme = useTheme();
  if (accessState === 'loading') return <FeedbackState status="loading" title="Preparando seu acesso" />;
  if (accessState === 'professional') return <Redirect href="/(professional)" />;
  if (accessState === 'patient-active') return <Redirect href="/(patient)" />;
  if (accessState === 'patient-pending') return <Redirect href="/(patient)/pending" />;
  if (accessState === 'patient-unassociated') return <Redirect href={'/(patient)/connect' as RelativePathString} />;

  return (
    <AppScreen p={0}>
      <SafeAreaView edges={['top', 'bottom', 'left', 'right']} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ grow: 1 }}>
          <YStack width="100%" maxW={1160} self="center" px={wide ? '$6' : '$4'} py="$4" gap="$6">
            <XStack justify="space-between" items="center" gap="$3">
              <BrandLogo width={wide ? 190 : 150} />
              <Link href="/login" asChild><Button chromeless color="$brand" minH="$touchTarget">Entrar</Button></Link>
            </XStack>
            <XStack flexDirection={wide ? 'row' : 'column'} gap={wide ? '$8' : '$5'} items="center">
              <YStack flex={wide ? 1 : undefined} width={wide ? undefined : '100%'} gap="$5" py="$4">
                <XStack self="flex-start" bg="$accentSoft" rounded="$12" px="$3" py="$2"><SizableText color="$accentText" size="$2" fontWeight="600" letterSpacing={1}>ENTRE ENCONTROS, EXISTE CUIDADO</SizableText></XStack>
                <SizableText role="heading" fontFamily="$heading" color="$color" fontSize={wide ? 48 : 34} lineHeight={wide ? 59 : 43}>Seu cuidado,{'\n'}mais próximo.</SizableText>
                <Paragraph color="$muted" size="$5" lineHeight={28}>Um lugar para registrar seu momento, encontrar orientações e construir continuidade com quem acompanha você.</Paragraph>
                <YStack gap="$3" maxW={360} width="100%">
                  <Link href="/cadastro" asChild><BrandButton iconAfter={<Ionicons name="arrow-forward-outline" size={20} color={theme.brandContrast.val} />}>Criar minha conta</BrandButton></Link>
                  <Paragraph color="$muted" size="$2">Já tem acesso? Use o botão Entrar no topo.</Paragraph>
                </YStack>
              </YStack>
              <YStack flex={wide ? 1 : undefined} width={wide ? undefined : '100%'} bg="$hero" rounded="$panel" p={wide ? '$6' : '$5'} gap="$5">
                <XStack gap="$2" items="center"><YStack width={8} height={8} rounded="$12" bg="$accent" /><SizableText color="$heroText" size="$2" letterSpacing={1}>SEU ESPAÇO DE ACOMPANHAMENTO</SizableText></XStack>
                <SizableText color="$heroText" fontFamily="$heading" size="$7">Cada momento{'\n'}faz parte do percurso.</SizableText>
                {[
                  { icon: 'heart-outline', title: 'Registre como você está', text: 'Guarde percepções para a próxima sessão.' },
                  { icon: 'calendar-outline', title: 'Encontre seu próximo encontro', text: 'Consulte a agenda do seu acompanhamento.' },
                  { icon: 'book-outline', title: 'Retome o que faz sentido', text: 'Acesse orientações e materiais compartilhados.' },
                ].map((item, index) => <XStack key={item.title} gap="$3" py="$3" borderTopWidth={index ? 1 : 0} borderColor="$heroMuted"><Ionicons name={item.icon as 'heart-outline'} size={24} color={theme.accent.val} /><YStack flex={1} gap="$1"><SizableText color="$heroText" fontWeight="600">{item.title}</SizableText><Paragraph color="$heroMuted" size="$3">{item.text}</Paragraph></YStack></XStack>)}
              </YStack>
            </XStack>
            <XStack gap="$5" flexWrap="wrap" borderTopWidth={1} borderColor="$borderColor" pt="$5" pb="$4">
              <YStack flex={1} minW={240} gap="$2"><SizableText color="$color" fontWeight="600">Para pacientes</SizableText><Paragraph color="$muted" size="$3">Crie sua conta e conecte-se usando o convite do seu profissional.</Paragraph></YStack>
              <YStack flex={1} minW={240} gap="$2"><SizableText color="$color" fontWeight="600">Para profissionais</SizableText><Paragraph color="$muted" size="$3">Organize vínculos, registros e materiais em um acompanhamento contínuo.</Paragraph></YStack>
            </XStack>
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}
