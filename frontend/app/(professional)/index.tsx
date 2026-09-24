import * as Clipboard from 'expo-clipboard';
import { useEffect, useState } from 'react';
import { Button, H1, Paragraph, SizableText, Spinner, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { QuickActions } from '@/components/professional/dashboard-sections';
import { ProfileCard } from '@/components/professional/profile-card';
import { ProfessionalBrand, ProfessionalScreen } from '@/components/professional/professional-screen';
import { useAuth } from '@/contexts/auth-context';
import { useProfessionalProfile } from '@/hooks/use-professional-profile';
import { approvePendingRelationship, generateProfessionalInvite, listAppointments, listPendingRelationships, listProfessionalPatients, rejectPendingRelationship, type FollowUpAppointment, type FollowUpPatient, type PendingRelationship, type ProfessionalInvitation } from '@/lib/api';

export default function ProfessionalHomeScreen() {
  const { session, signOut } = useAuth();
  const profile = useProfessionalProfile();
  const [invitation, setInvitation] = useState<ProfessionalInvitation | null>(null);
  const [pendingRelationships, setPendingRelationships] = useState<PendingRelationship[]>([]);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [copied, setCopied] = useState(false);
  const [patients, setPatients] = useState<FollowUpPatient[]>([]);
  const [appointments, setAppointments] = useState<FollowUpAppointment[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [exitError, setExitError] = useState(false);

  useEffect(() => {
    if (!session?.access_token) return;
    void loadPendingRelationships(session.access_token);
    void loadSummary(session.access_token);
  }, [session?.access_token]);

  async function loadSummary(accessToken: string) {
    setSummaryLoading(true); setSummaryError('');
    try { const [patientData, appointmentData] = await Promise.all([listProfessionalPatients(accessToken), listAppointments(accessToken)]); setPatients(patientData); setAppointments(appointmentData); }
    catch (error) { setSummaryError(error instanceof Error ? error.message : 'Não foi possível carregar o resumo.'); }
    finally { setSummaryLoading(false); }
  }

  async function loadPendingRelationships(accessToken: string) {
    try {
      setPendingRelationships(await listPendingRelationships(accessToken));
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível carregar as solicitações.');
    }
  }

  async function handleGenerateInvite() {
    if (!session?.access_token || loadingInvite) return;
    setLoadingInvite(true);
    setFeedback('');
    try {
      setInvitation(await generateProfessionalInvite(session.access_token));
      setCopied(false);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível gerar o código.');
    } finally {
      setLoadingInvite(false);
    }
  }

  async function handleCopyCode() {
    if (!invitation) return;
    await Clipboard.setStringAsync(invitation.code);
    setCopied(true);
  }

  async function handleApprove(relationshipId: string) {
    if (!session?.access_token || decidingId) return;
    setDecidingId(relationshipId);
    setFeedback('');
    try {
      await approvePendingRelationship(session.access_token, relationshipId);
      await loadPendingRelationships(session.access_token);
      await loadSummary(session.access_token);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível aprovar a solicitação.');
    } finally {
      setDecidingId(null);
    }
  }

  async function handleReject(relationshipId: string) {
    if (!session?.access_token || decidingId) return;
    setDecidingId(relationshipId);
    setFeedback('');
    try {
      await rejectPendingRelationship(session.access_token, relationshipId);
      await loadPendingRelationships(session.access_token);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Não foi possível recusar a solicitação.');
    } finally {
      setDecidingId(null);
    }
  }

  async function handleSignOut() {
    setLeaving(true);
    setExitError(false);
    try { await signOut(); } catch { setExitError(true); } finally { setLeaving(false); }
  }

  return (
    <ProfessionalScreen>
      <XStack items="center" justify="space-between" gap="$3" flexWrap="wrap">
        <ProfessionalBrand />
        <Button chromeless color="$muted" minH={44} height="auto" py="$2" disabled={leaving} onPress={handleSignOut} aria-label="Sair da conta">
          {leaving ? 'Saindo…' : 'Sair'}
        </Button>
      </XStack>
      {exitError ? <Paragraph color="$declinedColor" role="alert">Não foi possível sair. Tente novamente.</Paragraph> : null}
      <YStack gap="$2">
        <H1 color="$color" fontFamily="$heading" size="$8">{profile.profile ? `Olá, ${profile.profile.name.split(/\s+/)[0]}` : 'Olá, profissional'}</H1>
        <Paragraph color="$muted" size="$4">Seu espaço para acompanhar e cuidar.</Paragraph>
      </YStack>
      <ProfileCard state={profile} />
      <AppCard title="Convites e solicitações" background="$surface" rounded="$panel" p="$5">
        <Paragraph color="$muted">Gere um código para convidar um paciente ao seu acompanhamento.</Paragraph>
        <BrandButton disabled={loadingInvite} onPress={handleGenerateInvite} minH={48}>
          {loadingInvite ? <XStack items="center" gap="$2"><Spinner color="$brandContrast" size="small" /><SizableText color="$brandContrast">Gerando...</SizableText></XStack> : 'Gerar código de acesso'}
        </BrandButton>
        {invitation ? (
          <YStack gap="$2" p="$3" bg="$soft" borderWidth={1} borderColor="$borderColor" rounded="$control">
            <SizableText color="$muted" size="$2">Código para compartilhar</SizableText>
            <SizableText color="$brand" fontSize={24} letterSpacing={3} fontWeight="800" style={{ textAlign: 'center' }}>{invitation.code}</SizableText>
            <Button onPress={handleCopyCode} accessibilityLabel="Copiar código de acesso">{copied ? 'Código copiado' : 'Copiar código'}</Button>
            <Paragraph color="$muted" size="$2">Válido até {new Date(invitation.expiresAt).toLocaleString('pt-BR')}.</Paragraph>
          </YStack>
        ) : null}
        {pendingRelationships.length ? pendingRelationships.map((relationship) => (
          <YStack key={relationship.id} gap="$2" p="$3" bg="$backgroundHover" borderWidth={1} borderColor="$borderColor" rounded="$control">
            <SizableText color="$color" fontWeight="700">{relationship.patientName}</SizableText>
            <Paragraph color="$muted" size="$2">Solicitação recebida em {new Date(relationship.requestedAt).toLocaleString('pt-BR')}.</Paragraph>
            <XStack gap="$2" flexWrap="wrap">
              <BrandButton flex={1} minW={130} disabled={decidingId !== null} onPress={() => handleApprove(relationship.id)}>
                {decidingId === relationship.id ? 'Salvando...' : 'Aprovar'}
              </BrandButton>
              <Button flex={1} minW={130} minH="$touchTarget" bg="$declinedBackground" color="$declinedColor" borderWidth={1} borderColor="$declinedColor" disabled={decidingId !== null} onPress={() => handleReject(relationship.id)}>
                {decidingId === relationship.id ? 'Salvando...' : 'Recusar'}
              </Button>
            </XStack>
          </YStack>
        )) : <Paragraph color="$muted" size="$2">Nenhuma solicitação pendente.</Paragraph>}
        {feedback ? <Paragraph color="$red10" role="alert">{feedback}</Paragraph> : null}
      </AppCard>
      {summaryLoading ? <FeedbackState status="loading" title="Carregando resumo" /> : null}
      {!summaryLoading && summaryError ? <YStack><FeedbackState status="error" title="Não foi possível carregar o resumo" description={summaryError} /><Button minH="$touchTarget" onPress={() => session?.access_token && loadSummary(session.access_token)}>Tentar novamente</Button></YStack> : null}
      {!summaryLoading && !summaryError ? <XStack gap="$3" flexWrap="wrap"><AppCard flex={1} minW={150} title="Pacientes ativos" background="$surface"><SizableText color="$brand" fontFamily="$heading" size="$8">{patients.length}</SizableText></AppCard><AppCard flex={1} minW={150} title="Próximas consultas" background="$surface"><SizableText color="$brand" fontFamily="$heading" size="$8">{appointments.filter((item) => item.state === 'scheduled' && Date.parse(item.startsAt) >= Date.now()).length}</SizableText></AppCard><AppCard flex={1} minW={150} title="Aguardando confirmação" background="$surface"><SizableText color="$brand" fontFamily="$heading" size="$8">{appointments.filter((item) => item.state === 'scheduled' && item.patientResponse === 'pending').length}</SizableText></AppCard></XStack> : null}
      {!summaryLoading && !summaryError && patients.length === 0 ? <FeedbackState status="empty" title="Seu acompanhamento começa aqui" description="Seus pacientes aparecerão aqui quando estiverem vinculados a você." /> : null}
      <QuickActions />
    </ProfessionalScreen>
  );
}
