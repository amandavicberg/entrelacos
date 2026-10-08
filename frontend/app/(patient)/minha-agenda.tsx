import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Button, Paragraph, SizableText, useTheme, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { BrandButton } from '@/components/brand-button';
import { CancellationConfirmation } from '@/components/cancellation-confirmation';
import { FeedbackState } from '@/components/feedback-state';
import { MonthCalendar } from '@/components/month-calendar';
import { PatientScreen } from '@/components/patient/patient-screen';
import { useAuth } from '@/contexts/auth-context';
import { dateKey, monthDays, monthKey } from '@/lib/calendar';
import {
  bookPatientAppointment, listAppointments, listPatientAvailableSlots, respondToAppointment,
  type AvailableSlot, type FollowUpAppointment,
} from '@/lib/api';

function consultationDate(value: string): string {
  return new Date(value).toLocaleString('pt-BR', {
    timeZone: 'America/Sao_Paulo', weekday: 'long', day: 'numeric', month: 'long',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function PatientAgendaScreen() {
  const { session } = useAuth();
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 800 && fontScale < 1.3;
  const [now, setNow] = useState(() => Date.now());
  const today = dateKey(new Date(now));
  const [month, setMonth] = useState(() => monthKey(today));
  const [selectedDay, setSelectedDay] = useState(today);
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [appointments, setAppointments] = useState<FollowUpAppointment[]>([]);
  const [slotLoading, setSlotLoading] = useState(true);
  const [appointmentLoading, setAppointmentLoading] = useState(true);
  const [slotError, setSlotError] = useState('');
  const [appointmentError, setAppointmentError] = useState('');
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState('');

  const loadAppointments = useCallback(async () => {
    if (!session?.access_token) return;
    setAppointmentLoading(true); setAppointmentError('');
    try { setAppointments(await listAppointments(session.access_token, undefined, true)); }
    catch (cause) { setAppointmentError(cause instanceof Error ? cause.message : 'Não foi possível carregar suas consultas.'); }
    finally { setAppointmentLoading(false); }
  }, [session]);

  const loadSlots = useCallback(async () => {
    if (!session?.access_token) return;
    setSlotLoading(true); setSlotError('');
    const current = dateKey(new Date());
    const first = `${month}-01`;
    const last = monthDays(month).filter((day): day is string => Boolean(day)).at(-1)!;
    const limit = dateKey(new Date(Date.now() + 60 * 24 * 60 * 60 * 1000));
    if (last < current || first > limit) { setSlots([]); setSlotLoading(false); return; }
    try { setSlots(await listPatientAvailableSlots(session.access_token, first < current ? current : first, last > limit ? limit : last)); }
    catch (cause) { setSlotError(cause instanceof Error ? cause.message : 'Não foi possível carregar os horários livres.'); }
    finally { setSlotLoading(false); }
  }, [month, session]);

  useFocusEffect(useCallback(() => {
    setNow(Date.now());
    void loadAppointments();
    void loadSlots();
    const timer = setInterval(() => { setNow(Date.now()); void loadAppointments(); void loadSlots(); }, 60_000);
    return () => clearInterval(timer);
  }, [loadAppointments, loadSlots]));

  async function book() {
    if (!selectedSlot || !session?.access_token || busy) return;
    setBusy(true); setFeedback('');
    try {
      await bookPatientAppointment(session.access_token, selectedSlot);
      setSelectedSlot(null);
      setFeedback('Consulta agendada. Você já pode vê-la em “Minhas consultas”.');
      await Promise.all([loadAppointments(), loadSlots()]);
    } catch (cause) {
      setSelectedSlot(null);
      setFeedback(cause instanceof Error ? cause.message : 'Não foi possível agendar.');
      await loadSlots();
    } finally { setBusy(false); }
  }

  async function respond(item: FollowUpAppointment, answer: 'confirmed' | 'cancelled') {
    if (!session?.access_token || busy) return;
    setBusy(true); setFeedback('');
    try {
      await respondToAppointment(session.access_token, item.id, answer);
      setCancelId(null);
      setFeedback(answer === 'confirmed' ? 'Consulta confirmada.' : 'Consulta cancelada. O horário voltou a ficar disponível.');
      await Promise.all([loadAppointments(), loadSlots()]);
    } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível atualizar a consulta.'); }
    finally { setBusy(false); }
  }

  const marks = slots.reduce<Record<string, number>>((result, item) => {
    const key = dateKey(item.startsAt); result[key] = (result[key] ?? 0) + 1; return result;
  }, {});
  const daySlots = slots.filter((item) => dateKey(item.startsAt) === selectedDay);
  const upcoming = appointments.filter((item) => item.state === 'scheduled' && Date.parse(item.startsAt) >= now)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const maxMonth = monthKey(dateKey(new Date(now + 60 * 24 * 60 * 60 * 1000)));
  const maxDay = dateKey(new Date(now + 60 * 24 * 60 * 60 * 1000));
  const selectedDateLabel = new Date(`${selectedDay}T12:00:00Z`).toLocaleDateString('pt-BR', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long',
  });

  return <PatientScreen title="Minha agenda" description="Escolha um dia para agendar e acompanhe suas próximas consultas.">
    {feedback ? <AppCard p="$3" background="$accentSoft" borderColor="$logoBorder"><Paragraph role="status" color="$color">{feedback}</Paragraph></AppCard> : null}
    <XStack items="center" gap="$2" self="flex-start" bg="$accentSoft" px="$3" py="$2" rounded="$12">
      <Ionicons name="time-outline" size={16} color={theme.accentText.val} accessible={false} />
      <SizableText color="$accentText" size="$2" fontWeight="700">Horário de Brasília</SizableText>
    </XStack>
    <XStack flexDirection={wide ? 'row' : 'column'} gap="$4" items="stretch">
      <AppCard flex={wide ? 1 : undefined} minW={0} p="$5">
        <SizableText color="$color" fontWeight="700" fontSize={18}>Escolha uma data</SizableText>
        <Paragraph color="$muted" size="$2">Os pontos marcam dias com horários livres nos próximos 60 dias.</Paragraph>
        <MonthCalendar month={month} selected={selectedDay} marks={marks} minMonth={monthKey(today)} maxMonth={maxMonth}
          minDay={today} maxDay={maxDay} markDescription="Os pontos indicam dias com horários livres." markedDayLabel="com horários livres"
          onMonthChange={(value) => { setMonth(value); setSelectedDay(`${value}-01` < today ? today : `${value}-01`); setSelectedSlot(null); }}
          onSelect={(value) => { setSelectedDay(value); setSelectedSlot(null); }} />
      </AppCard>
      <AppCard flex={wide ? 1 : undefined} minW={0} p="$5">
        <XStack items="center" gap="$3">
          <YStack width={56} height={56} items="center" justify="center" bg="$accentSoft" rounded="$control">
            <SizableText color="$accentText" fontFamily="$heading" fontSize={24}>{Number(selectedDay.slice(-2))}</SizableText>
          </YStack>
          <YStack flex={1} minW={0} gap="$1"><Paragraph color="$muted" size="$2">DIA SELECIONADO</Paragraph><SizableText color="$color" fontWeight="700" textTransform="capitalize">{selectedDateLabel}</SizableText></YStack>
        </XStack>
        <YStack gap="$2" pt="$3" borderTopWidth={1} borderColor="$borderColor">
          <SizableText color="$color" fontWeight="700">Horários disponíveis</SizableText>
          <Paragraph color="$muted" size="$2">Agende com pelo menos 1 hora de antecedência.</Paragraph>
        </YStack>
        {slotLoading ? <FeedbackState status="loading" title="Buscando horários" /> : null}
        {!slotLoading && slotError ? <YStack gap="$2"><FeedbackState status="error" description={slotError} /><Button self="flex-start" minH="$touchTarget" onPress={loadSlots}>Tentar novamente</Button></YStack> : null}
        {!slotLoading && !slotError && daySlots.length === 0 ? <YStack items="center" gap="$2" py="$5" bg="$background" rounded="$control"><Ionicons name="calendar-clear-outline" size={25} color={theme.muted.val} accessible={false} /><Paragraph color="$muted" text="center">Sem horários livres neste dia. Escolha uma data marcada no calendário.</Paragraph></YStack> : null}
        {!slotLoading && !slotError && daySlots.length > 0 ? <XStack gap="$2" flexWrap="wrap">{daySlots.map((item) => {
          const selected = selectedSlot?.startsAt === item.startsAt;
          return <Button key={item.startsAt} minH="$touchTarget" bg={selected ? '$brand' : '$soft'} color={selected ? '$brandContrast' : '$brand'}
            borderWidth={1} borderColor={selected ? '$brand' : '$borderColor'}
            hoverStyle={{ bg: selected ? '$brandHover' : '$backgroundPress' }} pressStyle={{ bg: selected ? '$brandPress' : '$backgroundPress' }}
            aria-pressed={selected} onPress={() => setSelectedSlot(item)}>
            {new Date(item.startsAt).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}
          </Button>;
        })}</XStack> : null}
        {selectedSlot ? <YStack gap="$3" p="$4" bg="$accentSoft" rounded="$control" borderWidth={1} borderColor="$logoBorder">
          <SizableText color="$color" fontWeight="700">Confirmar agendamento</SizableText>
          <Paragraph color="$muted">{consultationDate(selectedSlot.startsAt)}</Paragraph>
          <XStack gap="$2" flexWrap="wrap"><BrandButton disabled={busy} onPress={() => void book()}>{busy ? 'Agendando…' : 'Confirmar horário'}</BrandButton><Button minH="$touchTarget" disabled={busy} onPress={() => setSelectedSlot(null)}>Escolher outro</Button></XStack>
        </YStack> : null}
      </AppCard>
    </XStack>

    <AppCard p="$5">
      <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
        <YStack gap="$1"><SizableText color="$color" fontWeight="700" fontSize={18}>Próximas consultas</SizableText><Paragraph color="$muted" size="$2">Confirme sua presença ou cancele se não puder comparecer.</Paragraph></YStack>
        {!appointmentLoading && !appointmentError ? <SizableText color="$brand" bg="$soft" px="$3" py="$1" rounded="$12" size="$2" fontWeight="700">{upcoming.length} {upcoming.length === 1 ? 'consulta' : 'consultas'}</SizableText> : null}
      </XStack>
      {appointmentLoading ? <FeedbackState status="loading" title="Carregando consultas" /> : null}
      {!appointmentLoading && appointmentError ? <YStack gap="$2"><FeedbackState status="error" description={appointmentError} /><Button self="flex-start" minH="$touchTarget" onPress={loadAppointments}>Tentar novamente</Button></YStack> : null}
      {!appointmentLoading && !appointmentError && upcoming.length === 0 ? <Paragraph color="$muted">Nenhuma consulta futura agendada. Escolha um dia no calendário acima.</Paragraph> : null}
      {!appointmentLoading && !appointmentError ? upcoming.map((item) => <YStack key={item.id} gap="$3" p="$4" bg="$background" rounded="$control" borderWidth={1} borderColor="$borderColor">
        <XStack items="center" gap="$3"><YStack width={44} height={44} items="center" justify="center" bg="$soft" rounded="$control"><Ionicons name="calendar-outline" size={22} color={theme.brand.val} accessible={false} /></YStack><YStack flex={1} minW={0} gap="$1"><SizableText color="$color" fontWeight="700" textTransform="capitalize">{consultationDate(item.startsAt)}</SizableText><Paragraph color={item.patientResponse === 'confirmed' ? '$confirmedColor' : '$pendingColor'} size="$2">{item.patientResponse === 'confirmed' ? 'Presença confirmada' : 'Aguardando sua confirmação'}</Paragraph></YStack></XStack>
        <XStack gap="$2" flexWrap="wrap">{item.patientResponse === 'pending' ? <BrandButton disabled={busy} onPress={() => void respond(item, 'confirmed')}>Confirmar presença</BrandButton> : null}<Button minH="$touchTarget" disabled={busy} bg="$declinedBackground" color="$declinedColor" onPress={() => setCancelId(item.id)}>Cancelar consulta</Button></XStack>
        {cancelId === item.id ? <CancellationConfirmation busy={busy} onKeep={() => setCancelId(null)} onConfirm={() => void respond(item, 'cancelled')} /> : null}
      </YStack>) : null}
    </AppCard>
  </PatientScreen>;
}
