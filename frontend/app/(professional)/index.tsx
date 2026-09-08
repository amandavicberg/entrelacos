import { useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Button, H1, Paragraph, XStack, YStack } from 'tamagui';

import { FeedbackState } from '@/components/feedback-state';
import {
  AppointmentsPanel, BirthdaysPanel, DashboardSkeleton, DemoNotice, QuickActions, SummaryCards,
} from '@/components/professional/dashboard-sections';
import { ProfileCard } from '@/components/professional/profile-card';
import { ProfessionalBrand, ProfessionalScreen } from '@/components/professional/professional-screen';
import { useAuth } from '@/contexts/auth-context';
import { useProfessionalProfile } from '@/hooks/use-professional-profile';
import { createDashboardDemo, dashboardScenario } from '@/lib/professional-dashboard';

export default function ProfessionalHomeScreen() {
  const { signOut } = useAuth();
  const profile = useProfessionalProfile();
  const { scenario } = useLocalSearchParams<{ scenario?: string }>();
  const [demoRecovered, setDemoRecovered] = useState(false);
  const [baseDate] = useState(() => new Date());
  const demo = useMemo(() => createDashboardDemo(baseDate), [baseDate]);
  const [leaving, setLeaving] = useState(false);
  const [exitError, setExitError] = useState(false);
  const { width, fontScale } = useWindowDimensions();
  const selectedScenario = dashboardScenario(scenario ?? process.env.EXPO_PUBLIC_PROFESSIONAL_SCENARIO, __DEV__);
  const demoState = selectedScenario === 'error' && demoRecovered ? 'ready' : selectedScenario;
  const patients = demoState === 'empty' ? [] : demo.patients;
  const appointments = demoState === 'empty' ? [] : demo.appointments;
  const wide = width >= 850 && fontScale <= 1.3;

  async function handleSignOut() {
    setLeaving(true);
    setExitError(false);
    try { await signOut(); } catch { setExitError(true); } finally { setLeaving(false); }
  }

  return (
    <ProfessionalScreen>
      <XStack items="center" justify="space-between" gap="$3" flexWrap="wrap">
        <ProfessionalBrand />
        <Button chromeless color="$muted" minH={44} height="auto" py="$2" disabled={leaving} onPress={handleSignOut} aria-label="Sair da conta">{leaving ? 'Saindo…' : 'Sair'}</Button>
      </XStack>
      {exitError ? <Paragraph color="$declinedColor" role="alert">Não foi possível sair. Tente novamente.</Paragraph> : null}
      <YStack gap="$2">
        <H1 color="$color" fontFamily="$heading" size="$8">{profile.profile ? `Olá, ${profile.profile.name.split(/\s+/)[0]}` : 'Olá, profissional'}</H1>
        <Paragraph color="$muted" size="$4">Seu espaço para acompanhar e cuidar.</Paragraph>
      </YStack>
      <ProfileCard state={profile} />
      <DemoNotice />
      {demoState === 'loading' ? <DashboardSkeleton /> : demoState === 'error' ? (
        <YStack>
          <FeedbackState status="error" title="Não foi possível carregar o resumo" description="Este é um cenário de erro demonstrativo para validação visual." />
          <Button minH={44} height="auto" py="$3" bg="$soft" color="$brand" onPress={() => setDemoRecovered(true)}>Recarregar demonstração</Button>
        </YStack>
      ) : (
        <>
          <SummaryCards patients={patients} appointments={appointments} />
          {patients.length === 0 ? <FeedbackState status="empty" title="Seu acompanhamento começa aqui" description="Seus pacientes aparecerão aqui quando estiverem vinculados a você." /> : null}
        </>
      )}
      <QuickActions />
      {demoState === 'ready' || demoState === 'empty' ? (
        <XStack gap="$5" flexDirection={wide ? 'row' : 'column'} items="stretch">
          <YStack flex={wide ? 1.2 : undefined} minW={0}><AppointmentsPanel patients={patients} appointments={appointments} baseDate={baseDate} /></YStack>
          <YStack flex={wide ? 1 : undefined} minW={0}><BirthdaysPanel patients={patients} baseDate={baseDate} /></YStack>
        </XStack>
      ) : null}
    </ProfessionalScreen>
  );
}
