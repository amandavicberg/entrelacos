import { Ionicons } from '@expo/vector-icons';
import { type RelativePathString, useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, Paragraph, SizableText, useTheme, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { PatientScreen } from '@/components/patient/patient-screen';
import { useAuth } from '@/contexts/auth-context';

const areas = [
  { label: 'Meus documentos', description: 'Envie PDFs privados para o profissional.', icon: 'document-attach-outline', href: '/(patient)/documents' },
  { label: 'Mural para a sessão', description: 'Anote o que deseja conversar no próximo encontro.', icon: 'chatbox-outline', href: '/(patient)/messages' },
  { label: 'Check-ins', description: 'Registre como você está se sentindo.', icon: 'heart-outline', href: '/(patient)/check-ins' },
  { label: 'Orientações', description: 'Releia as orientações compartilhadas.', icon: 'reader-outline', href: '/(patient)/observations' },
  { label: 'Meu histórico', description: 'Veja os acontecimentos do acompanhamento.', icon: 'time-outline', href: '/(patient)/history' },
] as const;

export default function PatientSpaceScreen() {
  const { session, signOut } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const [leaving, setLeaving] = useState(false);
  const [error, setError] = useState('');
  const name = typeof session?.user.user_metadata?.full_name === 'string'
    ? session.user.user_metadata.full_name.trim() : '';

  async function handleSignOut() {
    if (leaving) return;
    setLeaving(true); setError('');
    try {
      await signOut();
      router.replace('/login');
    } catch {
      setError('Não foi possível sair da conta. Tente novamente.');
    } finally { setLeaving(false); }
  }

  return <PatientScreen title="Meu espaço" description="Suas anotações, documentos e orientações em um só lugar.">
    <AppCard p="$5">
      <YStack gap="$1">
        <SizableText color="$color" fontWeight="700" fontSize={18}>Continuar o acompanhamento</SizableText>
        <Paragraph color="$muted" size="$2">Escolha o que você precisa fazer agora.</Paragraph>
      </YStack>
      <YStack gap="$2">
        {areas.map((item) => <Button key={item.href} unstyled role="button" minH={72} height="auto" p="$3"
          bg="$background" rounded="$control" borderWidth={1} borderColor="$borderColor"
          hoverStyle={{ borderColor: '$brand', background: '$soft' }} pressStyle={{ opacity: 0.84 }}
          aria-label={item.label} onPress={() => router.push(item.href as RelativePathString)}>
          <XStack width="100%" items="center" gap="$3">
            <YStack width={44} height={44} items="center" justify="center" bg="$soft" rounded="$control">
              <Ionicons name={item.icon} size={22} color={theme.brand.val} accessible={false} />
            </YStack>
            <YStack flex={1} minW={0} gap="$1">
              <SizableText color="$color" fontWeight="700">{item.label}</SizableText>
              <Paragraph color="$muted" size="$2">{item.description}</Paragraph>
            </YStack>
            <Ionicons name="chevron-forward" size={18} color={theme.brand.val} accessible={false} />
          </XStack>
        </Button>)}
      </YStack>
    </AppCard>
    <AppCard p="$5">
      <SizableText color="$color" fontWeight="700" fontSize={18}>Sua conta</SizableText>
      {name ? <Paragraph color="$color">{name}</Paragraph> : null}
      {session?.user.email ? <Paragraph color="$muted" size="$2">{session.user.email}</Paragraph> : null}
      {error ? <Paragraph role="alert" color="$red10">{error}</Paragraph> : null}
      <Button self="flex-start" minH="$touchTarget" bg="$soft" color="$brand" borderWidth={1} borderColor="$borderColor"
        hoverStyle={{ bg: '$backgroundPress' }} disabled={leaving}
        icon={<Ionicons name="log-out-outline" size={19} color={theme.brand.val} accessible={false} />}
        onPress={() => void handleSignOut()}>{leaving ? 'Saindo…' : 'Sair da conta'}</Button>
    </AppCard>
  </PatientScreen>;
}
