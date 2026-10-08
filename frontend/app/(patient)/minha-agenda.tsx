import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Button, Paragraph, SizableText, XStack, YStack } from 'tamagui';

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

  return <PatientScreen title="Minha agenda" description="Escolha um horário disponível e acompanhe suas consultas.">
    {feedback ? <Paragraph role="status" color="$brand">{feedback}</Paragraph> : null}
    <AppCard p="$5" title="Agendar consulta">
      <Paragraph color="$muted" size="$3">Horários de Brasília. Você pode reservar a partir de 1 hora de antecedência, até 60 dias à frente.</Paragraph>
      <MonthCalendar month={month} selected={selectedDay} marks={marks} minMonth={monthKey(today)} maxMonth={maxMonth}
        minDay={today} maxDay={maxDay} markDescription="Os pontos indicam dias com horários livres." markedDayLabel="com horários livres"
        onMonthChange={(value) => { setMonth(value); setSelectedDay(`${value}-01`); setSelectedSlot(null); }}
        onSelect={(value) => { setSelectedDay(value); setSelectedSlot(null); }} />
      {slotLoading ? <FeedbackState status="loading" title="Buscando horários livres" /> : null}
      {!slotLoading && slotError ? <YStack gap="$2"><FeedbackState status="error" description={slotError} />
        <Button self="flex-start" minH="$touchTarget" onPress={loadSlots}>Tentar novamente</Button></YStack> : null}
      {!slotLoading && !slotError ? <YStack gap="$3" pt="$3" borderTopWidth={1} borderColor="$borderColor">
        <SizableText color="$color" fontWeight="700">Horários para {new Date(`${selectedDay}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: 'numeric', month: 'long' })}</SizableText>
        {daySlots.length === 0 ? <Paragraph color="$muted">Não há horários livres neste dia. Escolha outra data com ponto no calendário.</Paragraph> :
          <XStack gap="$2" flexWrap="wrap">{daySlots.map((item) => <Button key={item.startsAt} minH="$touchTarget"
            bg={selectedSlot?.startsAt === item.startsAt ? '$brand' : '$soft'}
            color={selectedSlot?.startsAt === item.startsAt ? '$brandContrast' : '$brand'}
            aria-pressed={selectedSlot?.startsAt === item.startsAt}
            onPress={() => setSelectedSlot(item)}>
            {new Date(item.startsAt).toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })}
          </Button>)}</XStack>}
        {selectedSlot ? <YStack gap="$2" p="$4" bg="$accentSoft" rounded="$control" borderWidth={1} borderColor="$logoBorder">
          <SizableText color="$color" fontWeight="700">Confirmar agendamento</SizableText>
          <Paragraph color="$muted">{consultationDate(selectedSlot.startsAt)}</Paragraph>
          <XStack gap="$2" flexWrap="wrap">
            <BrandButton disabled={busy} onPress={() => void book()}>{busy ? 'Agendando…' : 'Confirmar horário'}</BrandButton>
            <Button minH="$touchTarget" disabled={busy} onPress={() => setSelectedSlot(null)}>Escolher outro</Button>
          </XStack>
        </YStack> : null}
      </YStack> : null}
    </AppCard>

    <AppCard p="$5" title="Minhas consultas">
      {appointmentLoading ? <FeedbackState status="loading" title="Carregando consultas" /> : null}
      {!appointmentLoading && appointmentError ? <YStack gap="$2"><FeedbackState status="error" description={appointmentError} />
        <Button self="flex-start" minH="$touchTarget" onPress={loadAppointments}>Tentar novamente</Button></YStack> : null}
      {!appointmentLoading && !appointmentError && upcoming.length === 0 ? <Paragraph color="$muted">Nenhuma consulta futura agendada.</Paragraph> : null}
      {!appointmentLoading && !appointmentError ? upcoming.map((item) => <YStack key={item.id} gap="$2" p="$4" bg="$background" rounded="$control" borderWidth={1} borderColor="$borderColor">
        <SizableText color="$color" fontWeight="700">{consultationDate(item.startsAt)}</SizableText>
        <Paragraph color="$muted" size="$2">{item.patientResponse === 'confirmed' ? 'Confirmada' : 'Aguardando sua confirmação'}</Paragraph>
        <XStack gap="$2" flexWrap="wrap">
          {item.patientResponse === 'pending' ? <BrandButton disabled={busy} onPress={() => void respond(item, 'confirmed')}>Confirmar</BrandButton> : null}
          <Button minH="$touchTarget" disabled={busy} bg="$declinedBackground" color="$declinedColor"
            onPress={() => setCancelId(item.id)}>Cancelar consulta</Button>
        </XStack>
        {cancelId === item.id ? <CancellationConfirmation busy={busy} onKeep={() => setCancelId(null)}
          onConfirm={() => void respond(item, 'cancelled')} /> : null}
      </YStack>) : null}
    </AppCard>
  </PatientScreen>;
}
