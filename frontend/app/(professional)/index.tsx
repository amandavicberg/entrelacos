import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Button, H1, Paragraph, SizableText, Spinner, useTheme, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { BrandButton } from '@/components/brand-button';
import { BrandLogo } from '@/components/brand-logo';
import { FeedbackState } from '@/components/feedback-state';
import { InitialsAvatar, ProfessionalScreen } from '@/components/professional/professional-screen';
import { useAuth } from '@/contexts/auth-context';
import { useProfessionalProfile } from '@/hooks/use-professional-profile';
import { careTimeZone, professionalSummary } from '@/lib/calendar';
import {
  approvePendingRelationship,
  generateProfessionalInvite,
  listAppointments,
  listPendingRelationships,
  listProfessionalActivity,
  listProfessionalPatients,
  rejectPendingRelationship,
  type FollowUpAppointment,
  type FollowUpPatient,
  type PendingRelationship,
  type ProfessionalActivity,
  type ProfessionalInvitation,
} from '@/lib/api';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type MetricTone = 'brand' | 'neutral' | 'confirmed' | 'declined' | 'pending';

function Metric({ label, detail, value, icon, tone, onPress }: {
  label: string; detail: string; value: number; icon: IconName; tone: MetricTone; onPress: () => void;
}) {
  const theme = useTheme();
  const { fontScale } = useWindowDimensions();
  const backgrounds = {
    brand: '$soft', neutral: '$surface', confirmed: '$confirmedBackground',
    declined: '$declinedBackground', pending: '$pendingBackground',
  } as const;
  const textColors = {
    brand: '$brand', neutral: '$brand', confirmed: '$confirmedColor',
    declined: '$declinedColor', pending: '$pendingColor',
  } as const;
  const iconColors = {
    brand: theme.brand.val, neutral: theme.brand.val, confirmed: theme.confirmedColor.val,
    declined: theme.declinedColor.val, pending: theme.pendingColor.val,
  };
  return (
    <Button unstyled role="button" onPress={onPress} aria-label={`${label}: ${value}. ${detail}`}
      flex={1} minW={fontScale >= 1.3 ? 270 : 150} minH={142} height="auto" p="$4" rounded="$panel"
      bg={backgrounds[tone]} borderWidth={1} borderColor="$borderColor"
      hoverStyle={{ borderColor: '$brand' }} pressStyle={{ opacity: 0.8 }}
      focusVisibleStyle={{ outlineWidth: 2, outlineColor: '$brand', outlineStyle: 'solid' }}>
      <YStack width="100%" gap="$1" pointerEvents="none">
        <XStack width="100%" items="center" justify="space-between" gap="$2">
          <SizableText color={textColors[tone]} fontFamily="$heading" size="$8">{value}</SizableText>
          <YStack width={40} height={40} rounded="$control" bg="$surface" items="center" justify="center">
            <Ionicons name={icon} size={20} color={iconColors[tone]} accessible={false} />
          </YStack>
        </XStack>
        <SizableText color="$color" fontWeight="700" text="left" fontSize={14}>{label}</SizableText>
        <Paragraph color="$muted" size="$2" text="left">{detail}</Paragraph>
      </YStack>
    </Button>
  );
}

function appointmentDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: careTimeZone,
  }).format(new Date(value));
}

function activityDate(value: string): string {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: careTimeZone,
  }).format(new Date(value));
}

const activityLabels: Record<ProfessionalActivity['items'][number]['type'], { label: string; icon: IconName }> = {
  document: { label: 'Enviou um documento', icon: 'document-attach-outline' },
  message: { label: 'Deixou um recado', icon: 'chatbubble-ellipses-outline' },
  'check-in': { label: 'Registrou um check-in', icon: 'heart-outline' },
};

export default function ProfessionalHomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { session } = useAuth();
  const profile = useProfessionalProfile();
  const retryProfile = profile.retry;
  const [invitation, setInvitation] = useState<ProfessionalInvitation | null>(null);
  const [pendingRelationships, setPendingRelationships] = useState<PendingRelationship[]>([]);
  const [patients, setPatients] = useState<FollowUpPatient[]>([]);
  const [appointments, setAppointments] = useState<FollowUpAppointment[]>([]);
  const [activity, setActivity] = useState<ProfessionalActivity | null>(null);
  const [loadingInvite, setLoadingInvite] = useState(false);
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [pendingError, setPendingError] = useState('');
  const [summaryError, setSummaryError] = useState('');
  const [activityError, setActivityError] = useState('');
  const [feedback, setFeedback] = useState<{ message: string; kind: 'success' | 'error' } | null>(null);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const loadSummary = useCallback(async (token: string, silent = false) => {
    if (!silent) setSummaryLoading(true);
    try {
      const [patientData, appointmentData] = await Promise.all([
        listProfessionalPatients(token), listAppointments(token),
      ]);
      setPatients(patientData);
      setAppointments(appointmentData);
      setSummaryError('');
    } catch (error) {
      if (!silent) setSummaryError(error instanceof Error ? error.message : 'Não foi possível carregar o resumo.');
    } finally {
      if (!silent) setSummaryLoading(false);
    }
  }, []);

  const loadPending = useCallback(async (token: string, silent = false) => {
    if (!silent) setPendingLoading(true);
    try {
      setPendingRelationships(await listPendingRelationships(token));
      setPendingError('');
    } catch (error) {
      if (!silent) setPendingError(error instanceof Error ? error.message : 'Não foi possível carregar as solicitações.');
    } finally {
      if (!silent) setPendingLoading(false);
    }
  }, []);

  const loadActivity = useCallback(async (token: string, silent = false) => {
    if (!silent) setActivityLoading(true);
    try {
      setActivity(await listProfessionalActivity(token));
      setActivityError('');
    } catch (error) {
      if (!silent) setActivityError(error instanceof Error ? error.message : 'Não foi possível carregar as atualizações.');
    } finally {
      if (!silent) setActivityLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    const token = session?.access_token;
    if (!token) return;
    retryProfile();
    setNow(Date.now());
    void loadPending(token);
    void loadSummary(token);
    void loadActivity(token);
    const timer = setInterval(() => {
      setNow(Date.now());
      void loadPending(token, true);
      void loadSummary(token, true);
      void loadActivity(token, true);
    }, 30_000);
    return () => clearInterval(timer);
  }, [loadActivity, loadPending, loadSummary, retryProfile, session]));

  const upcoming = appointments
    .filter((item) => item.state === 'scheduled' && Date.parse(item.startsAt) >= now)
    .sort((left, right) => Date.parse(left.startsAt) - Date.parse(right.startsAt));
  const summary = professionalSummary(appointments, now);
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: careTimeZone }).format(new Date(now));
  const activityPeriodDays = activity?.periodDays ?? 7;
  const names = new Map(patients.map((patient) => [patient.relationshipId, patient.patientName]));
  const firstName = profile.profile?.name.split(/\s+/)[0];

  function openAppointment(appointment: FollowUpAppointment) {
    router.push({
      pathname: '/(professional)/patients/[relationshipId]',
      params: { relationshipId: appointment.relationshipId },
    });
  }

  async function handleGenerateInvite() {
    if (!session?.access_token || loadingInvite) return;
    setLoadingInvite(true);
    setFeedback(null);
    try {
      setInvitation(await generateProfessionalInvite(session.access_token));
      setCopied(false);
    } catch (error) {
      setFeedback({ kind: 'error', message: error instanceof Error ? error.message : 'Não foi possível gerar o código.' });
    } finally {
      setLoadingInvite(false);
    }
  }

  async function handleCopyCode() {
    if (!invitation) return;
    try {
      await Clipboard.setStringAsync(invitation.code);
      setCopied(true);
    } catch {
      setFeedback({ kind: 'error', message: 'Não foi possível copiar. Selecione o código e copie manualmente.' });
    }
  }

  async function decide(relationshipId: string, choice: 'approve' | 'reject') {
    if (!session?.access_token || decidingId) return;
    setDecidingId(relationshipId);
    setFeedback(null);
    try {
      if (choice === 'approve') await approvePendingRelationship(session.access_token, relationshipId);
      else await rejectPendingRelationship(session.access_token, relationshipId);
      setFeedback({ kind: 'success', message: choice === 'approve' ? 'Paciente vinculado ao seu acompanhamento.' : 'Solicitação recusada.' });
      await Promise.all([loadPending(session.access_token), loadSummary(session.access_token)]);
    } catch (error) {
      setFeedback({ kind: 'error', message: error instanceof Error ? error.message : 'Não foi possível concluir a decisão.' });
    } finally {
      setDecidingId(null);
    }
  }

  return (
    <ProfessionalScreen>
      <AppCard p="$5" background="$surface" borderColor="$borderColor">
        <XStack items="center" justify="space-between" gap="$3" flexWrap="wrap">
          <BrandLogo width={184} framed={false} />
          <Button unstyled role="button" minH="$touchTarget" aria-label="Abrir meu perfil profissional"
            onPress={() => router.navigate('/(professional)/profile' as Href)}
            hoverStyle={{ opacity: 0.75 }} pressStyle={{ opacity: 0.7 }}
            focusVisibleStyle={{ outlineWidth: 2, outlineColor: '$brand', outlineStyle: 'solid' }}>
            <XStack items="center" gap="$2" py="$1" px="$2" rounded="$control" bg="$soft">
              <InitialsAvatar name={profile.profile?.name ?? 'Profissional'} />
              <YStack gap={0} maxW={135}>
                <SizableText color="$color" fontWeight="700" numberOfLines={1}>
                  {firstName ?? 'Meu perfil'}
                </SizableText>
                <SizableText color="$muted" size="$2">Meu perfil</SizableText>
              </YStack>
              <Ionicons name="chevron-forward" size={16} color={theme.brand.val} accessible={false} />
            </XStack>
          </Button>
        </XStack>
        <YStack gap="$2" pt="$3">
          <SizableText color="$brand" size="$2" fontWeight="700" letterSpacing={1}>PAINEL PROFISSIONAL</SizableText>
          <H1 color="$color" fontFamily="$heading" size="$8">{firstName ? 'Olá, ' + firstName : 'Olá, profissional'}</H1>
          <Paragraph color="$muted" size="$4">Um lugar para acompanhar pessoas e organizar os próximos encontros.</Paragraph>
          {profile.profile?.specialty || profile.profile?.registration ? (
            <Paragraph color="$brand" size="$2">
              {[profile.profile.specialty, profile.profile.registration].filter(Boolean).join(' · ')}
            </Paragraph>
          ) : null}
          {profile.status === 'error' ? (
            <XStack items="center" gap="$2" flexWrap="wrap">
              <Paragraph color="$declinedColor" size="$2">Seu perfil não pôde ser carregado.</Paragraph>
              <Button minH="$touchTarget" chromeless color="$brand" onPress={profile.retry}>Tentar novamente</Button>
            </XStack>
          ) : null}
        </YStack>
      </AppCard>

      {feedback ? (
        <YStack p="$3" bg={feedback.kind === 'error' ? '$declinedBackground' : '$soft'}
          rounded="$control" borderWidth={1} borderColor="$borderColor">
          <Paragraph role={feedback.kind === 'error' ? 'alert' : 'status'}
            color={feedback.kind === 'error' ? '$declinedColor' : '$brand'}>{feedback.message}</Paragraph>
        </YStack>
      ) : null}

      {!pendingLoading && !pendingError && pendingRelationships.length > 0 ? (
        <AppCard p="$5" background="$accentSoft" borderColor="$logoBorder">
          <XStack items="center" gap="$2" flexWrap="wrap">
            <Ionicons name="people-outline" size={22} color={theme.brand.val} accessible={false} />
            <SizableText color="$color" fontFamily="$heading" size="$5">
              {pendingRelationships.length === 1 ? '1 solicitação precisa de você' : pendingRelationships.length + ' solicitações precisam de você'}
            </SizableText>
          </XStack>
          <Paragraph color="$muted" size="$3">Confira quem pediu vínculo antes de liberar o acompanhamento.</Paragraph>
          <YStack gap="$2">
            {pendingRelationships.map((relationship) => (
              <YStack key={relationship.id} gap="$2" p="$4" bg="$surface" rounded="$control"
                borderWidth={1} borderColor="$borderColor">
                <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
                  <YStack gap="$1" flex={1} minW={180}>
                    <SizableText color="$color" fontWeight="700">{relationship.patientName}</SizableText>
                    <Paragraph color="$muted" size="$2">
                      Solicitação de {new Date(relationship.requestedAt).toLocaleDateString('pt-BR')}
                    </Paragraph>
                  </YStack>
                  <XStack gap="$2" flexWrap="wrap">
                    <BrandButton minH="$touchTarget" disabled={decidingId !== null}
                      onPress={() => void decide(relationship.id, 'approve')}>
                      {decidingId === relationship.id ? 'Salvando…' : 'Aprovar'}
                    </BrandButton>
                    <Button minH="$touchTarget" bg="$surface" color="$declinedColor"
                      borderWidth={1} borderColor="$borderColor" disabled={decidingId !== null}
                      onPress={() => void decide(relationship.id, 'reject')}>Recusar</Button>
                  </XStack>
                </XStack>
              </YStack>
            ))}
          </YStack>
        </AppCard>
      ) : null}
      {pendingLoading ? <FeedbackState status="loading" title="Buscando solicitações" /> : null}
      {pendingError ? (
        <AppCard>
          <FeedbackState status="error" title="Solicitações indisponíveis" description={pendingError} />
          <Button self="flex-start" minH="$touchTarget"
            onPress={() => session?.access_token && void loadPending(session.access_token)}>Tentar novamente</Button>
        </AppCard>
      ) : null}

      <YStack gap="$3">
        <YStack gap="$1">
          <SizableText color="$color" fontFamily="$heading" size="$6">Visão geral</SizableText>
          <Paragraph color="$muted" size="$3">Situação de {monthLabel} e próximas confirmações.</Paragraph>
        </YStack>
        {summaryLoading ? <FeedbackState status="loading" title="Carregando acompanhamento" /> : null}
        {!summaryLoading && summaryError ? (
          <AppCard>
            <FeedbackState status="error" title="Resumo indisponível" description={summaryError} />
            <Button self="flex-start" minH="$touchTarget"
              onPress={() => session?.access_token && void loadSummary(session.access_token)}>Tentar novamente</Button>
          </AppCard>
        ) : null}
        {!summaryLoading && !summaryError ? (
          <XStack gap="$3" flexWrap="wrap">
            <Metric label="Pacientes ativos" detail="Vínculos em andamento" value={patients.length} icon="people-outline" tone="brand"
              onPress={() => router.navigate('/(professional)/patients')} />
            <Metric label="Consultas canceladas" detail="Com data neste mês" value={summary.cancelledThisMonth}
              icon="close-circle-outline" tone={summary.cancelledThisMonth > 0 ? 'declined' : 'neutral'}
              onPress={() => router.navigate('/(professional)/agenda')} />
            <Metric label="Consultas confirmadas" detail="Com data neste mês" value={summary.confirmedThisMonth}
              icon="checkmark-circle-outline" tone={summary.confirmedThisMonth > 0 ? 'confirmed' : 'neutral'}
              onPress={() => router.navigate('/(professional)/agenda')} />
            <Metric label="Aguardando confirmação" detail="Consultas futuras" value={summary.awaitingConfirmation}
              icon="time-outline" tone={summary.awaitingConfirmation > 0 ? 'pending' : 'neutral'}
              onPress={() => router.navigate('/(professional)/agenda')} />
          </XStack>
        ) : null}
      </YStack>

      <AppCard p="$5">
        <YStack gap="$3">
          <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
            <YStack gap="$1" flex={1} minW={220}>
              <SizableText color="$color" fontFamily="$heading" size="$6">Atualizações dos pacientes</SizableText>
              <Paragraph color="$muted" size="$2">Recados, documentos e check-ins dos últimos {activityPeriodDays} dias.</Paragraph>
            </YStack>
            {!activityLoading && !activityError && activity && activity.count > 0 ? (
              <SizableText color="$accentText" bg="$accentSoft" px="$3" py="$1" rounded="$12" size="$2" fontWeight="700">
                {activity.count} {activity.count === 1 ? 'atualização recente' : 'atualizações recentes'}
              </SizableText>
            ) : null}
          </XStack>
          {activityLoading ? <FeedbackState status="loading" title="Buscando atualizações" /> : null}
          {!activityLoading && activityError ? (
            <YStack gap="$2">
              <FeedbackState status="error" title="Atualizações indisponíveis" description={activityError} />
              <Button self="flex-start" minH="$touchTarget"
                onPress={() => session?.access_token && void loadActivity(session.access_token)}>Tentar novamente</Button>
            </YStack>
          ) : null}
          {!activityLoading && !activityError && activity?.count === 0 ? (
            <Paragraph color="$muted">Nenhum recado, documento ou check-in recebido nos últimos {activityPeriodDays} dias.</Paragraph>
          ) : null}
          {!activityLoading && !activityError ? activity?.items.map((item) => (
            <Button key={`${item.type}-${item.id}`} unstyled role="button" minH={68} height="auto" p="$3"
              bg="$background" rounded="$control" borderWidth={1} borderColor="$borderColor"
              hoverStyle={{ borderColor: '$brand' }} pressStyle={{ opacity: 0.8 }}
              focusVisibleStyle={{ outlineWidth: 2, outlineColor: '$brand', outlineStyle: 'solid' }}
              aria-label={`${item.patientName}: ${activityLabels[item.type].label.toLowerCase()}, ${activityDate(item.at)}. Abrir registros`}
              onPress={() => router.push({ pathname: '/(professional)/patients/[relationshipId]', params: { relationshipId: item.relationshipId, section: 'patient' } })}>
              <XStack width="100%" items="center" gap="$3">
                <YStack width={40} height={40} bg="$soft" rounded="$control" items="center" justify="center">
                  <Ionicons name={activityLabels[item.type].icon} size={20} color={theme.brand.val} accessible={false} />
                </YStack>
                <YStack flex={1} minW={0} gap="$1">
                  <SizableText color="$color" fontWeight="700" numberOfLines={1} text="left">{item.patientName}</SizableText>
                  <Paragraph color="$muted" size="$2" text="left">{activityLabels[item.type].label} · {activityDate(item.at)}</Paragraph>
                </YStack>
                <Ionicons name="chevron-forward" size={17} color={theme.brand.val} accessible={false} />
              </XStack>
            </Button>
          )) : null}
          {!activityLoading && !activityError && activity && activity.count > activity.items.length ? (
            <Paragraph color="$muted" size="$2">Mostrando as {activity.items.length} atualizações mais recentes.</Paragraph>
          ) : null}
        </YStack>
      </AppCard>

      <XStack gap="$4" flexWrap="wrap" items="flex-start">
        {!summaryLoading && !summaryError && upcoming.length > 0 ? <AppCard flex={1} minW={280} p="$5">
          <YStack gap="$1">
            <SizableText color="$color" fontFamily="$heading" size="$5">Próximos encontros</SizableText>
            <Paragraph color="$muted" size="$2">Pacientes e horários das próximas consultas.</Paragraph>
          </YStack>
          {upcoming.slice(0, 3).map((item) => (
            <Button key={item.id} unstyled role="button" onPress={() => openAppointment(item)}
              aria-label={`${names.get(item.relationshipId) ?? 'Paciente'}: ${appointmentDate(item.startsAt)}, ${item.patientResponse === 'confirmed' ? 'confirmada' : 'aguardando confirmação'}. Abrir acompanhamento`}
              minH={70} height="auto" p="$3" bg="$background" rounded="$control"
              borderWidth={1} borderColor="$borderColor"
              hoverStyle={{ borderColor: '$brand' }} pressStyle={{ opacity: 0.8 }}>
              <XStack width="100%" items="center" gap="$3" flexWrap="wrap">
                <YStack flex={1} minW={0} gap="$1">
                  <SizableText color="$color" fontWeight="700">
                    {names.get(item.relationshipId) ?? 'Paciente vinculado'}
                  </SizableText>
                  <Paragraph color="$muted" size="$2">{appointmentDate(item.startsAt)}</Paragraph>
                </YStack>
                <SizableText px="$2" py="$1" rounded="$12" fontWeight="700"
                  bg={item.patientResponse === 'confirmed' ? '$confirmedBackground' : '$pendingBackground'}
                  color={item.patientResponse === 'confirmed' ? '$confirmedColor' : '$pendingColor'} size="$2">
                  {item.patientResponse === 'confirmed' ? 'Confirmada' : 'Aguardando'}
                </SizableText>
              </XStack>
            </Button>
          ))}
          <Button self="flex-start" chromeless color="$brand" minH="$touchTarget"
            onPress={() => router.navigate('/(professional)/agenda')}>Ver agenda completa</Button>
        </AppCard> : null}

        <AppCard flex={1} minW={280} p="$5">
          <XStack items="flex-start" justify="space-between" gap="$3" flexWrap="wrap">
            <YStack gap="$2" flex={1} minW={220}>
              <XStack items="center" gap="$2">
                <Ionicons name="person-add-outline" size={22} color={theme.brand.val} accessible={false} />
                <SizableText color="$color" fontFamily="$heading" size="$5">Convidar paciente</SizableText>
              </XStack>
              <Paragraph color="$muted" size="$3">
                Gere um código para quem vai iniciar o acompanhamento. O paciente informa esse código no cadastro.
              </Paragraph>
            </YStack>
            {!invitation ? <BrandButton self="flex-start" disabled={loadingInvite} onPress={() => void handleGenerateInvite()}
              icon={loadingInvite ? <Spinner size="small" color="$brandContrast" /> : undefined}>
              {loadingInvite ? 'Gerando…' : 'Gerar código'}
            </BrandButton> : null}
          </XStack>
          {invitation ? (
            <YStack gap="$2" p="$4" bg="$accentSoft" rounded="$control"
              borderWidth={1} borderColor="$logoBorder">
              <SizableText color="$accentText" fontWeight="700" size="$2">Código pronto para compartilhar</SizableText>
              <XStack items="center" justify="space-between" gap="$3" flexWrap="wrap">
                <SizableText color="$brand" fontFamily="$heading" fontSize={24}
                  letterSpacing={2} selectable>{invitation.code}</SizableText>
                <Button minH="$touchTarget" bg="$brand" color="$brandContrast"
                  icon={<Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={18} color={theme.brandContrast.val} accessible={false} />}
                  onPress={() => void handleCopyCode()}>
                  {copied ? 'Copiado' : 'Copiar código'}
                </Button>
              </XStack>
              <Paragraph color="$muted" size="$2">Uso único · válido até {new Date(invitation.expiresAt).toLocaleString('pt-BR')}.</Paragraph>
            </YStack>
          ) : null}
          <Paragraph color="$muted" size="$2">
            Depois que o paciente usar o código, a solicitação aparecerá aqui para você aprovar.
          </Paragraph>
          {invitation ? <Button self="flex-start" chromeless color="$brand" minH="$touchTarget"
            disabled={loadingInvite} onPress={() => void handleGenerateInvite()}>
            {loadingInvite ? 'Gerando…' : 'Gerar outro código'}
          </Button> : null}
        </AppCard>
      </XStack>

    </ProfessionalScreen>
  );
}
