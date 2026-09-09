import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Button, H1, Paragraph, XStack, Spinner, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { FeedbackState } from '@/components/feedback-state';
import {
  AppointmentsPanel, BirthdaysPanel, DashboardSkeleton, DemoNotice, QuickActions, SummaryCards,
} from '@/components/professional/dashboard-sections';
import { ProfileCard } from '@/components/professional/profile-card';
import { ProfessionalBrand, ProfessionalScreen } from '@/components/professional/professional-screen';
import { useAuth } from '@/contexts/auth-context';
import { approvePendingRelationship, generateProfessionalInvite, listPendingRelationships, type PendingRelationship, type ProfessionalInvitation } from '@/lib/api';
import { useProfessionalProfile } from '@/hooks/use-professional-profile';
import { createDashboardDemo, dashboardScenario } from '@/lib/professional-dashboard';

export default function ProfessionalHomeScreen() {
  const { session, signOut } = useAuth();
  const [invitation, setInvitation] = useState<ProfessionalInvitation | null>(null);
  const [pendingRelationships, setPendingRelationships] = useState<PendingRelationship[]>([]);
  const [loading, setLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!session?.access_token) return;
    void loadPendingRelationships(session.access_token);
  }, [session?.access_token]);

  async function loadPendingRelationships(accessToken: string) {
    try {
      setPendingRelationships(await listPendingRelationships(accessToken));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível carregar as solicitações.');
    }
  }

  async function handleGenerateInvite() {
    if (!session?.access_token || loading) return;
    setLoading(true);
    setFeedback('');
    try {
      setInvitation(await generateProfessionalInvite(session.access_token));
      setCopied(false);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível gerar o código.');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyCode() {
    if (!invitation) return;
    await Clipboard.setStringAsync(invitation.code);
    setCopied(true);
  }

  async function handleApprove(relationshipId: string) {
    if (!session?.access_token || approvingId) return;
    setApprovingId(relationshipId);
    setFeedback('');
    try {
      await approvePendingRelationship(session.access_token, relationshipId);
      await loadPendingRelationships(session.access_token);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível aprovar a solicitação.');
    } finally {
      setApprovingId(null);
    }
  }

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
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
      <YStack gap="$4" maxW={520} width="100%" self="center">
        <SizableText size="$3" color="$brand" fontWeight="700" letterSpacing={1}>
          ÁREA DO PROFISSIONAL
        </SizableText>
        <H1 color="$color">Acompanhamento organizado para cada paciente.</H1>
        <Paragraph color="$muted" size="$5">
          Esta tela é um ponto de partida para o painel do profissional.
        </Paragraph>
        <AppCard title="Convite de teste">
          <Paragraph color="$muted">
            Gere um código para o paciente informar no primeiro acesso. O código expira em 7 dias.
          </Paragraph>
          <BrandButton disabled={loading} onPress={handleGenerateInvite}>
            {loading ? <XStack items="center" gap="$2"><Spinner color="$brandContrast" size="small" /><SizableText color="$brandContrast">Gerando...</SizableText></XStack> : 'Gerar código de acesso'}
          </BrandButton>
          {invitation ? (
            <YStack gap="$2" p="$3" bg="$backgroundHover" borderWidth={1} borderColor="$borderColor">
              <SizableText color="$muted" size="$2">Código para compartilhar</SizableText>
              <SizableText color="$brand" fontSize={24} letterSpacing={3} fontWeight="800" style={{ textAlign: 'center' }}>
                {invitation.code}
              </SizableText>
              <Button onPress={handleCopyCode} accessibilityLabel="Copiar código de acesso">
                {copied ? 'Código copiado' : 'Copiar código'}
              </Button>
              <Paragraph color="$muted" size="$2">
                Válido até {new Date(invitation.expiresAt).toLocaleString('pt-BR')}.
              </Paragraph>
            </YStack>
          ) : null}
        </AppCard>
        <AppCard title="Solicitações pendentes">
          {pendingRelationships.length === 0 ? (
            <Paragraph color="$muted">Nenhum paciente informou um código ainda.</Paragraph>
          ) : pendingRelationships.map((relationship) => (
            <XStack key={relationship.id} items="center" justify="space-between" gap="$3">
              <Paragraph color="$muted" flex={1}>
                Solicitação recebida em {new Date(relationship.requestedAt).toLocaleString('pt-BR')}.
              </Paragraph>
              <Button disabled={approvingId !== null} onPress={() => handleApprove(relationship.id)}>
                {approvingId === relationship.id ? 'Aprovando...' : 'Aprovar'}
              </Button>
            </XStack>
          ))}
        </AppCard>
        {feedback ? <Paragraph color="$red10" accessibilityRole="alert">{feedback}</Paragraph> : null}
        <BrandButton onPress={signOut}>Sair</BrandButton>
      </YStack>
      </ScrollView>
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
