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
          <YStack width="100%" maxW={1160} self="center" px={wide ? '$6' : '$4'} py={wide ? '$5' : '$4'} gap={wide ? '$8' : '$6'}>
            <XStack justify="space-between" items="center" gap="$3">
              <BrandLogo width={wide ? 190 : 150} framed={false} />
              <Link href="/login" asChild><Button bg="$surface" color="$brand" borderWidth={1} borderColor="$borderColor" minH="$touchTarget">Entrar</Button></Link>
            </XStack>
            <XStack flexDirection={wide ? 'row' : 'column'} gap={wide ? '$7' : '$5'} items="stretch">
              <YStack flex={wide ? 1 : undefined} minW={0} width={wide ? undefined : '100%'} gap="$5" py={wide ? '$6' : '$2'} justify="center">
                <XStack self="flex-start" items="center" gap="$2" bg="$accentSoft" rounded="$12" px="$3" py="$2">
                  <YStack width={8} height={8} rounded="$12" bg="$accent" />
                  <SizableText color="$accentText" size="$2" fontWeight="700" letterSpacing={1}>CUIDADO ENTRE ENCONTROS</SizableText>
                </XStack>
                <SizableText role="heading" fontFamily="$heading" color="$color" fontSize={wide ? 46 : 34} lineHeight={wide ? 58 : 44}>Seu cuidado, com mais clareza a cada passo.</SizableText>
                <Paragraph color="$muted" size="$5" lineHeight={29}>Consultas, registros e materiais em um espaço organizado para você e o profissional que acompanha seu percurso.</Paragraph>
                <YStack gap="$3" maxW={350} width="100%">
                  <Link href="/cadastro" asChild><BrandButton iconAfter={<Ionicons name="arrow-forward-outline" size={20} color={theme.brandContrast.val} accessible={false} />}>Criar minha conta</BrandButton></Link>
                  <Paragraph color="$muted" size="$2">Paciente ou profissional? Você escolhe seu perfil no cadastro.</Paragraph>
                </YStack>
              </YStack>
              <YStack flex={wide ? 1 : undefined} minW={0} width={wide ? undefined : '100%'} bg="$surface" borderWidth={1} borderColor="$borderColor" rounded="$panel" p={wide ? '$6' : '$5'} gap="$5">
                <XStack gap="$2" items="center"><Ionicons name="heart-outline" size={20} color={theme.accentText.val} accessible={false} /><SizableText color="$accentText" size="$2" fontWeight="700" letterSpacing={1}>UM ESPAÇO PARA CONTINUAR</SizableText></XStack>
                <SizableText color="$color" fontFamily="$heading" fontSize={wide ? 27 : 23} lineHeight={wide ? 36 : 32}>O que importa fica fácil de encontrar.</SizableText>
                {[
                  { icon: 'calendar-outline', title: 'Encontros', text: 'Consulte horários e acompanhe suas consultas.' },
                  { icon: 'heart-outline', title: 'Seu momento', text: 'Registre como está para levar à próxima conversa.' },
                  { icon: 'folder-open-outline', title: 'Conteúdos', text: 'Reencontre materiais e orientações compartilhados.' },
                ].map((item) => <XStack key={item.title} gap="$3" p="$3" bg="$background" rounded="$control" items="center">
                  <YStack width={46} height={46} items="center" justify="center" bg="$accentSoft" rounded="$control"><Ionicons name={item.icon as 'calendar-outline'} size={22} color={theme.brand.val} accessible={false} /></YStack>
                  <YStack flex={1} minW={0} gap="$1"><SizableText color="$color" fontWeight="700">{item.title}</SizableText><Paragraph color="$muted" size="$2">{item.text}</Paragraph></YStack>
                </XStack>)}
              </YStack>
            </XStack>
            <XStack gap="$5" flexWrap="wrap" borderTopWidth={1} borderColor="$borderColor" pt="$5" pb="$4">
              <YStack flex={1} minW={240} gap="$1"><SizableText color="$brand" fontWeight="700">Para pacientes</SizableText><Paragraph color="$muted" size="$3">Acompanhe seu percurso após aceitar o convite e obter aprovação do profissional.</Paragraph></YStack>
              <YStack flex={1} minW={240} gap="$1"><SizableText color="$brand" fontWeight="700">Para profissionais</SizableText><Paragraph color="$muted" size="$3">Organize agenda, vínculos e conteúdos do acompanhamento.</Paragraph></YStack>
            </XStack>
          </YStack>
        </ScrollView>
      </SafeAreaView>
    </AppScreen>
  );
}
