import { Ionicons } from '@expo/vector-icons';
import { Redirect, type RelativePathString, useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Button, Paragraph, SizableText, useTheme, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { PatientScreen } from '@/components/patient/patient-screen';
import { useAuth } from '@/contexts/auth-context';
import { getBirthdayMessage, listAppointments, listMaterials, listPatientObservations, type FollowUpAppointment, type FollowUpMaterial, type FollowUpObservation } from '@/lib/api';

function nextAppointment(appointments: FollowUpAppointment[]) {
  const now = Date.now();
  return appointments.filter((item) => item.state === 'scheduled' && Date.parse(item.startsAt) >= now)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
}

function appointmentDate(value: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo', weekday: 'long', day: '2-digit', month: 'long',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

export default function PatientHomeScreen() {
  const { accessState, session } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 760 && fontScale < 1.3;
  const [appointments, setAppointments] = useState<FollowUpAppointment[]>([]);
  const [observations, setObservations] = useState<FollowUpObservation[]>([]);
  const [materials, setMaterials] = useState<FollowUpMaterial[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [contentLoading, setContentLoading] = useState(true);
  const [observationError, setObservationError] = useState(false);
  const [materialError, setMaterialError] = useState(false);
  const [birthdayMessage, setBirthdayMessage] = useState<string | null>(null);
  const [birthdayError, setBirthdayError] = useState(false);

  const loadSummary = useCallback(async () => {
    if (!session?.access_token) return;
    setSummaryLoading(true); setSummaryError(''); setContentLoading(true); setObservationError(false); setMaterialError(false);
    const token = session.access_token;
    const agenda = listAppointments(token, undefined, true)
      .then(setAppointments)
      .catch((cause) => setSummaryError(cause instanceof Error ? cause.message : 'Não foi possível carregar sua agenda.'))
      .finally(() => setSummaryLoading(false));
    const content = Promise.allSettled([listPatientObservations(token), listMaterials(token, true)])
      .then(([observationResult, materialResult]) => {
        if (observationResult.status === 'fulfilled') setObservations(observationResult.value);
        if (materialResult.status === 'fulfilled') setMaterials(materialResult.value.materials);
        setObservationError(observationResult.status === 'rejected');
        setMaterialError(materialResult.status === 'rejected');
      }).finally(() => setContentLoading(false));
    await Promise.all([agenda, content]);
  }, [session]);

  const loadBirthday = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const data = await getBirthdayMessage(session.access_token);
      setBirthdayError(false);
      setBirthdayMessage(data.isBirthday
        ? data.message ?? 'Feliz aniversário! Que seu novo ciclo seja leve, acolhedor e cheio de boas possibilidades.'
        : null);
    } catch { setBirthdayError(true); }
  }, [session]);

  useFocusEffect(useCallback(() => {
    void loadSummary();
    void loadBirthday();
    const timer = setInterval(() => { void loadBirthday(); }, 5 * 60_000);
    return () => clearInterval(timer);
  }, [loadBirthday, loadSummary]));

  if (accessState === 'patient-pending') return <Redirect href="/(patient)/pending" />;
  if (accessState === 'patient-unassociated') return <Redirect href={'/(patient)/connect' as RelativePathString} />;
  if (accessState !== 'patient-active') return <FeedbackState status="loading" title="Validando acesso" />;

  const fullName = typeof session?.user.user_metadata?.full_name === 'string'
    ? session.user.user_metadata.full_name.trim() : '';
  const firstName = fullName.split(/\s+/)[0];
  const upcoming = nextAppointment(appointments);

  return <PatientScreen title={firstName ? `Olá, ${firstName}` : 'Olá, que bom ter você aqui'}
    description="Seu acompanhamento, com o que importa para hoje.">
    <AppCard p="$5" background="$accentSoft" borderColor="$logoBorder">
      <XStack items="center" gap="$2">
        <Ionicons name="heart-outline" size={20} color={theme.accentText.val} accessible={false} />
        <SizableText color="$accentText" size="$2" fontWeight="700" letterSpacing={1}>UM MOMENTO PARA VOCÊ</SizableText>
      </XStack>
      <SizableText color="$color" fontFamily="$heading" fontSize={wide ? 27 : 23}>Como você está hoje?</SizableText>
      <Paragraph color="$muted">Registre seu momento para levar à próxima conversa.</Paragraph>
      <BrandButton self="flex-start" onPress={() => router.push('/(patient)/check-ins' as RelativePathString)}>
        Fazer meu check-in
      </BrandButton>
    </AppCard>

    <XStack flexDirection={wide ? 'row' : 'column'} gap="$4" items="stretch">
      <AppCard flex={wide ? 1 : undefined} minW={0} p="$5">
        <XStack items="center" gap="$2"><Ionicons name="calendar-outline" size={20} color={theme.brand.val} accessible={false} /><SizableText color="$color" fontWeight="700" fontSize={18}>Próxima sessão</SizableText></XStack>
        {summaryLoading ? <FeedbackState status="loading" title="Buscando sua agenda" /> : null}
        {!summaryLoading && summaryError ? <YStack gap="$2"><FeedbackState status="error" description={summaryError} /><Button self="flex-start" minH="$touchTarget" onPress={() => void loadSummary()}>Tentar novamente</Button></YStack> : null}
        {!summaryLoading && !summaryError && upcoming ? <YStack gap="$2">
          <SizableText color="$color" fontWeight="700" textTransform="capitalize">{appointmentDate(upcoming.startsAt)}</SizableText>
          <Paragraph color={upcoming.patientResponse === 'confirmed' ? '$confirmedColor' : '$pendingColor'}>
            {upcoming.patientResponse === 'confirmed' ? 'Presença confirmada' : 'Aguardando sua confirmação'}
          </Paragraph>
        </YStack> : null}
        {!summaryLoading && !summaryError && !upcoming ? <Paragraph color="$muted">Nenhuma consulta futura agendada.</Paragraph> : null}
        {!summaryLoading && !summaryError ? <Button self="flex-start" minH="$touchTarget" bg="$soft" color="$brand"
          onPress={() => router.navigate('/(patient)/minha-agenda' as RelativePathString)}>
          {upcoming ? 'Ver minha agenda' : 'Escolher um horário'}
        </Button> : null}
      </AppCard>

      <AppCard flex={wide ? 1 : undefined} minW={0} p="$5">
        <XStack items="center" gap="$2"><Ionicons name="sparkles-outline" size={20} color={theme.accentText.val} accessible={false} /><SizableText color="$color" fontWeight="700" fontSize={18}>Compartilhado com você</SizableText></XStack>
        <Paragraph color="$muted" size="$2">Conteúdos disponíveis no acompanhamento.</Paragraph>
        <YStack gap="$2" pt="$2" borderTopWidth={1} borderColor="$borderColor">
          <Button unstyled role="button" minH="$touchTarget" height="auto" p="$2" bg="$background" rounded="$control"
            onPress={() => router.push('/(patient)/observations' as RelativePathString)}>
            <XStack width="100%" items="center" gap="$2"><Paragraph color="$color" flex={1}>Orientações</Paragraph><SizableText color="$brand" fontWeight="700">{contentLoading ? '…' : observationError ? '—' : observations.length}</SizableText><Ionicons name="chevron-forward" size={17} color={theme.brand.val} accessible={false} /></XStack>
          </Button>
          <Button unstyled role="button" minH="$touchTarget" height="auto" p="$2" bg="$background" rounded="$control"
            onPress={() => router.navigate('/(patient)/materials' as RelativePathString)}>
            <XStack width="100%" items="center" gap="$2"><Paragraph color="$color" flex={1}>Materiais</Paragraph><SizableText color="$brand" fontWeight="700">{contentLoading ? '…' : materialError ? '—' : materials.length}</SizableText><Ionicons name="chevron-forward" size={17} color={theme.brand.val} accessible={false} /></XStack>
          </Button>
        </YStack>
        {observationError || materialError ? <Paragraph role="alert" color="$pendingColor">Parte dos conteúdos não carregou.</Paragraph> : null}
        {observationError || materialError ? <Button self="flex-start" minH="$touchTarget" bg="$soft" color="$brand" onPress={() => void loadSummary()}>Atualizar conteúdo</Button> : null}
      </AppCard>
    </XStack>

    {birthdayMessage ? <AppCard p="$5" background="$accentSoft" borderColor="$logoBorder">
      <XStack items="center" gap="$2"><Ionicons name="gift-outline" size={22} color={theme.accentText.val} accessible={false} /><SizableText color="$color" fontWeight="700" fontSize={18}>Feliz aniversário!</SizableText></XStack>
      <Paragraph color="$color">{birthdayMessage}</Paragraph>
    </AppCard> : null}
    {birthdayError ? <AppCard title="Mensagem especial indisponível"><Paragraph color="$muted">Não foi possível consultar a mensagem de aniversário agora.</Paragraph><Button self="flex-start" minH="$touchTarget" onPress={() => void loadBirthday()}>Tentar novamente</Button></AppCard> : null}

    <AppCard p="$5">
      <XStack items="flex-start" gap="$3">
        <YStack width={44} height={44} items="center" justify="center" bg="$soft" rounded="$control"><Ionicons name="shield-checkmark-outline" size={22} color={theme.brand.val} accessible={false} /></YStack>
        <YStack flex={1} gap="$1"><SizableText color="$color" fontWeight="700">Em caso de urgência</SizableText><Paragraph color="$muted" size="$2">Este espaço não substitui atendimento de emergência. Procure o serviço de urgência da sua região.</Paragraph></YStack>
      </XStack>
    </AppCard>
  </PatientScreen>;
}
