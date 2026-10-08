import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Button, Paragraph, SizableText, useTheme, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { AppInput } from '@/components/app-input';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { MonthCalendar } from '@/components/month-calendar';
import { ProfessionalBrand, ProfessionalScreen } from '@/components/professional/professional-screen';
import { useAuth } from '@/contexts/auth-context';
import { clockTime, dateKey, minutesFromTime, monthKey } from '@/lib/calendar';
import {
  createProfessionalAvailability, listAppointments, listProfessionalAvailability,
  listProfessionalPatients, removeProfessionalAvailability,
  type AvailabilityWindow, type FollowUpAppointment, type FollowUpPatient,
} from '@/lib/api';

const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const shortWeekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function appointmentTime(value: string): string {
  return new Date(value).toLocaleTimeString('pt-BR', {
    hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo',
  });
}

export default function AgendaScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 800 && fontScale < 1.3;
  const { session } = useAuth();
  const [section, setSection] = useState<'consultations' | 'availability'>('consultations');
  const [month, setMonth] = useState(() => monthKey(dateKey(new Date())));
  const [selectedDay, setSelectedDay] = useState(() => dateKey(new Date()));
  const [appointments, setAppointments] = useState<FollowUpAppointment[]>([]);
  const [patients, setPatients] = useState<FollowUpPatient[]>([]);
  const [availability, setAvailability] = useState<AvailabilityWindow[]>([]);
  const [agendaLoading, setAgendaLoading] = useState(true);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [agendaError, setAgendaError] = useState('');
  const [availabilityError, setAvailabilityError] = useState('');
  const [formFeedback, setFormFeedback] = useState('');
  const [listFeedback, setListFeedback] = useState('');
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [weekday, setWeekday] = useState(1);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('12:00');
  const [slotMinutes, setSlotMinutes] = useState(60);

  const loadAgenda = useCallback(async () => {
    if (!session?.access_token) return;
    setAgendaLoading(true);
    setAgendaError('');
    try {
      const [items, people] = await Promise.all([
        listAppointments(session.access_token), listProfessionalPatients(session.access_token),
      ]);
      setAppointments(items);
      setPatients(people);
    } catch (cause) {
      setAgendaError(cause instanceof Error ? cause.message : 'Não foi possível carregar a agenda.');
    } finally { setAgendaLoading(false); }
  }, [session]);

  const loadAvailability = useCallback(async () => {
    if (!session?.access_token) return;
    setAvailabilityLoading(true);
    setAvailabilityError('');
    try { setAvailability(await listProfessionalAvailability(session.access_token)); }
    catch (cause) { setAvailabilityError(cause instanceof Error ? cause.message : 'Não foi possível carregar seus horários.'); }
    finally { setAvailabilityLoading(false); }
  }, [session]);

  useFocusEffect(useCallback(() => {
    void loadAgenda();
    void loadAvailability();
    const timer = setInterval(() => { void loadAgenda(); }, 60_000);
    return () => clearInterval(timer);
  }, [loadAgenda, loadAvailability]));

  async function saveAvailability() {
    if (!session?.access_token || busy) return;
    const startMinute = minutesFromTime(startTime);
    const endMinute = minutesFromTime(endTime);
    if (startMinute === null || endMinute === null || endMinute - startMinute < slotMinutes) {
      setFormFeedback('Confira os horários. Use HH:mm e deixe espaço para pelo menos uma consulta.');
      return;
    }
    setBusy(true); setFormFeedback('');
    try {
      await createProfessionalAvailability(session.access_token, { weekday, startMinute, endMinute, slotMinutes });
      setFormFeedback('Horário de atendimento cadastrado.');
      await loadAvailability();
    } catch (cause) { setFormFeedback(cause instanceof Error ? cause.message : 'Não foi possível cadastrar o horário.'); }
    finally { setBusy(false); }
  }

  async function removeAvailability(id: string) {
    if (!session?.access_token || busy) return;
    setBusy(true); setListFeedback('');
    try {
      await removeProfessionalAvailability(session.access_token, id);
      setListFeedback('Horário removido. Consultas já agendadas foram preservadas.');
      setRemovingId(null);
      await loadAvailability();
    } catch (cause) { setListFeedback(cause instanceof Error ? cause.message : 'Não foi possível remover o horário.'); }
    finally { setBusy(false); }
  }

  const active = appointments.filter((item) => item.state === 'scheduled');
  const marks = active.reduce<Record<string, number>>((current, item) => {
    const key = dateKey(item.startsAt);
    current[key] = (current[key] ?? 0) + 1;
    return current;
  }, {});
  const selectedAppointments = active.filter((item) => dateKey(item.startsAt) === selectedDay)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  const names = new Map(patients.map((patient) => [patient.relationshipId, patient.patientName]));
  const today = dateKey(new Date());
  const selectedDate = new Date(`${selectedDay}T12:00:00Z`);
  const selectedDateLabel = selectedDate.toLocaleDateString('pt-BR', {
    timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long',
  });
  const monthCount = active.filter((item) => monthKey(dateKey(item.startsAt)) === month).length;
  const startMinute = minutesFromTime(startTime);
  const endMinute = minutesFromTime(endTime);
  const previewCount = startMinute !== null && endMinute !== null && endMinute > startMinute
    ? Math.floor((endMinute - startMinute) / slotMinutes) : 0;
  const formFeedbackIsSuccess = formFeedback.startsWith('Horário de atendimento cadastrado');
  const listFeedbackIsSuccess = listFeedback.startsWith('Horário removido');

  return <ProfessionalScreen><YStack gap="$4">
    <XStack items="center" justify="space-between" gap="$3" flexWrap="wrap">
      <ProfessionalBrand />
      <XStack items="center" gap="$2" px="$3" py="$2" bg="$accentSoft" rounded="$12">
        <Ionicons name="time-outline" size={16} color={theme.accentText.val} accessible={false} />
        <SizableText color="$accentText" size="$2" fontWeight="600">Horário de Brasília</SizableText>
      </XStack>
    </XStack>

    <YStack gap="$1" py="$1">
      <SizableText color="$accentText" size="$2" fontWeight="700" letterSpacing={1}>SEUS ENCONTROS</SizableText>
      <SizableText role="heading" color="$color" fontFamily="$heading" fontSize={32} lineHeight={40}>Agenda</SizableText>
      <Paragraph color="$muted" size="$4">Acompanhe as consultas e defina os horários em que você atende.</Paragraph>
    </YStack>

    <XStack gap="$1" p="$1" bg="$soft" rounded="$control" self="flex-start" width={wide ? undefined : '100%'}>
      <Button flex={wide ? undefined : 1} minH="$touchTarget" px="$4" rounded="$control"
        bg={section === 'consultations' ? '$surface' : 'transparent'} color={section === 'consultations' ? '$brand' : '$muted'}
        borderWidth={section === 'consultations' ? 1 : 0} borderColor="$borderColor"
        aria-pressed={section === 'consultations'} onPress={() => setSection('consultations')}
        icon={<Ionicons name="calendar-outline" size={18} color={section === 'consultations' ? theme.brand.val : theme.muted.val} accessible={false} />}>
        Consultas
      </Button>
      <Button flex={wide ? undefined : 1} minH="$touchTarget" px="$4" rounded="$control"
        bg={section === 'availability' ? '$surface' : 'transparent'} color={section === 'availability' ? '$brand' : '$muted'}
        borderWidth={section === 'availability' ? 1 : 0} borderColor="$borderColor"
        aria-label="Horários de atendimento" aria-pressed={section === 'availability'} onPress={() => setSection('availability')}
        icon={<Ionicons name="time-outline" size={18} color={section === 'availability' ? theme.brand.val : theme.muted.val} accessible={false} />}>
        {wide ? 'Horários de atendimento' : 'Horários'}
      </Button>
    </XStack>

    {section === 'consultations' ? <XStack flexDirection={wide ? 'row' : 'column'} gap="$4" items="stretch">
      <AppCard flex={wide ? 1 : undefined} minW={0} p="$5">
        <XStack items="center" justify="space-between" gap="$3" flexWrap="wrap">
          <YStack gap="$1">
            <SizableText color="$color" fontWeight="700" fontSize={18}>Calendário</SizableText>
            <Paragraph color="$muted" size="$2">{wide ? 'Selecione um dia para ver os atendimentos.' : 'Toque em um dia; as consultas aparecem abaixo.'}</Paragraph>
          </YStack>
          <XStack items="center" gap="$2">
            {!agendaLoading && !agendaError ? <SizableText color="$brand" bg="$soft" px="$3" py="$1" rounded="$12" size="$2" fontWeight="700">
              {monthCount} {monthCount === 1 ? 'consulta' : 'consultas'} no mês
            </SizableText> : null}
            {selectedDay !== today ? <Button chromeless minH="$touchTarget" color="$brand" fontWeight="700"
              onPress={() => { setMonth(monthKey(today)); setSelectedDay(today); }}>Hoje</Button> : null}
          </XStack>
        </XStack>
        {agendaLoading ? <FeedbackState status="loading" title="Carregando consultas" /> : null}
        {!agendaLoading && agendaError ? <YStack gap="$2"><FeedbackState status="error" description={agendaError} />
          <Button self="flex-start" minH="$touchTarget" onPress={loadAgenda}>Tentar novamente</Button></YStack> : null}
        {!agendaLoading && !agendaError ? <MonthCalendar month={month} selected={selectedDay} marks={marks}
          markDescription="O ponto dourado indica um dia com consulta."
          onMonthChange={(value) => { setMonth(value); setSelectedDay(`${value}-01`); }} onSelect={setSelectedDay} /> : null}
      </AppCard>

      <AppCard flex={wide ? 1 : undefined} minW={0} p="$5">
        <XStack items="center" gap="$3">
          <YStack width={56} height={56} items="center" justify="center" bg="$accentSoft" rounded="$control">
            <SizableText color="$accentText" fontFamily="$heading" fontSize={25}>{Number(selectedDay.slice(-2))}</SizableText>
          </YStack>
          <YStack flex={1} minW={0} gap="$1">
            <Paragraph color="$muted" size="$2">DIA SELECIONADO</Paragraph>
            <SizableText color="$color" fontWeight="700" fontSize={17}>{selectedDateLabel}</SizableText>
          </YStack>
        </XStack>
        <XStack items="center" justify="space-between" gap="$2" pt="$2" borderTopWidth={1} borderColor="$borderColor">
          <SizableText color="$color" fontWeight="700">Consultas do dia</SizableText>
          <SizableText color="$brand" bg="$soft" px="$3" py="$1" rounded="$12" size="$2" fontWeight="700">
            {agendaLoading || agendaError ? '—' : selectedAppointments.length}
          </SizableText>
        </XStack>
        {agendaLoading ? <Paragraph color="$muted">Buscando os atendimentos deste dia…</Paragraph> : null}
        {!agendaLoading && agendaError ? <Paragraph color="$muted">Não foi possível mostrar os atendimentos deste dia.</Paragraph> : null}
        {!agendaLoading && !agendaError && selectedAppointments.length === 0 ? <YStack items="center" gap="$2" py="$5" px="$3" bg="$background" rounded="$control">
          <YStack width={48} height={48} items="center" justify="center" bg="$soft" rounded="$12">
            <Ionicons name="calendar-clear-outline" size={24} color={theme.brand.val} accessible={false} />
          </YStack>
          <SizableText color="$color" fontWeight="700" text="center">Nenhuma consulta neste dia</SizableText>
          <Paragraph color="$muted" size="$2" text="center">Quando houver um agendamento, ele aparecerá aqui.</Paragraph>
          {availability.length === 0 ? <Button chromeless color="$brand" fontWeight="700" minH="$touchTarget"
            onPress={() => setSection('availability')}>Configurar horários de atendimento</Button> : null}
        </YStack> : null}
        {!agendaLoading && !agendaError ? selectedAppointments.map((item) => (
          <Button key={item.id} unstyled role="button" minH={82} height="auto" p="$3" bg="$background"
            rounded="$control" borderWidth={1} borderColor="$borderColor"
            hoverStyle={{ borderColor: '$brand' }} pressStyle={{ opacity: 0.82 }}
            aria-label={`Abrir consulta de ${names.get(item.relationshipId) ?? 'paciente'} às ${appointmentTime(item.startsAt)}`}
            onPress={() => router.push({ pathname: '/(professional)/patients/[relationshipId]', params: { relationshipId: item.relationshipId } })}>
            <XStack width="100%" items="center" gap="$3">
              <YStack width={62} items="center" justify="center" bg="$soft" rounded="$control" py="$2">
                <SizableText color="$brand" fontFamily="$heading" size="$3">{appointmentTime(item.startsAt)}</SizableText>
              </YStack>
              <YStack flex={1} minW={0} gap="$1">
                <SizableText color="$color" fontWeight="700">{names.get(item.relationshipId) ?? 'Paciente vinculado'}</SizableText>
                <Paragraph color="$muted" size="$2">Até {appointmentTime(item.endsAt)} · {item.patientResponse === 'confirmed' ? 'Confirmada' : 'Aguardando confirmação'}</Paragraph>
              </YStack>
              <Ionicons name="chevron-forward" size={18} color={theme.brand.val} accessible={false} />
            </XStack>
          </Button>
        )) : null}
      </AppCard>
    </XStack> : null}

    {section === 'availability' ? <YStack gap="$4">
      <XStack flexDirection={wide ? 'row' : 'column'} gap="$4" items="flex-start">
        <AppCard flex={wide ? 1.15 : undefined} width={wide ? undefined : '100%'} minW={0} p="$5">
          <XStack items="center" gap="$2">
            <Ionicons name="add-circle-outline" size={22} color={theme.brand.val} accessible={false} />
            <SizableText color="$color" fontWeight="700" fontSize={18}>Novo período</SizableText>
          </XStack>
          <Paragraph color="$muted" size="$2">O período se repete semanalmente. Cadastre mais de um por dia, se precisar. Pacientes verão os horários livres.</Paragraph>
          <YStack gap="$2" pt="$2">
            <SizableText color="$color" fontWeight="700">1. Dia da semana</SizableText>
            <XStack gap="$2" flexWrap="wrap">
              {shortWeekdays.map((label, index) => <Button key={label} minH="$touchTarget" minW={44} px="$2" rounded="$control"
                bg={weekday === index ? '$brand' : '$soft'} color={weekday === index ? '$brandContrast' : '$brand'}
                aria-pressed={weekday === index} onPress={() => { setWeekday(index); setFormFeedback(''); }}>{label}</Button>)}
            </XStack>
          </YStack>
          <YStack gap="$2" pt="$2">
            <SizableText color="$color" fontWeight="700">2. Período de atendimento</SizableText>
            <XStack gap="$3" flexWrap="wrap">
              <YStack flex={1} minW={130}><AppInput label="Início" value={startTime} onChangeText={(value) => { setStartTime(value); setFormFeedback(''); }} placeholder="08:00" maxLength={5} keyboardType="numbers-and-punctuation" /></YStack>
              <YStack flex={1} minW={130}><AppInput label="Fim" value={endTime} onChangeText={(value) => { setEndTime(value); setFormFeedback(''); }} placeholder="12:00" maxLength={5} keyboardType="numbers-and-punctuation" /></YStack>
            </XStack>
          </YStack>
          <YStack gap="$2" pt="$2">
            <SizableText color="$color" fontWeight="700">3. Duração de cada consulta</SizableText>
            <XStack gap="$2" flexWrap="wrap">
              {[30, 45, 60].map((duration) => <Button key={duration} minH="$touchTarget" px="$4" rounded="$control"
                bg={slotMinutes === duration ? '$brand' : '$soft'} color={slotMinutes === duration ? '$brandContrast' : '$brand'}
                aria-pressed={slotMinutes === duration} onPress={() => { setSlotMinutes(duration); setFormFeedback(''); }}>{duration} min</Button>)}
            </XStack>
          </YStack>
          {previewCount > 0 ? <XStack items="center" gap="$2" p="$3" bg="$accentSoft" rounded="$control">
            <Ionicons name="sparkles-outline" size={18} color={theme.accentText.val} accessible={false} />
            <Paragraph color="$accentText" size="$2" flex={1}>
              {weekdays[weekday]}, {startTime}–{endTime}: até {previewCount} {previewCount === 1 ? 'horário' : 'horários'} por semana.
            </Paragraph>
          </XStack> : null}
          {formFeedback ? <YStack role="status" bg={formFeedbackIsSuccess ? '$soft' : '$declinedBackground'} p="$3" rounded="$control">
            <Paragraph color={formFeedbackIsSuccess ? '$brand' : '$declinedColor'} fontWeight="600">{formFeedback}</Paragraph>
          </YStack> : null}
          <BrandButton disabled={busy || Boolean(availabilityError)} onPress={() => void saveAvailability()}>
            {busy ? 'Salvando…' : 'Salvar período semanal'}
          </BrandButton>
        </AppCard>

        <AppCard flex={wide ? 0.85 : undefined} width={wide ? undefined : '100%'} minW={0} p="$5">
          <XStack items="center" justify="space-between" gap="$2">
            <SizableText color="$color" fontWeight="700" fontSize={18}>Sua semana</SizableText>
            <SizableText color="$brand" bg="$soft" px="$3" py="$1" rounded="$12" size="$2" fontWeight="700">
              {availabilityLoading || availabilityError ? '—' : availability.length}
            </SizableText>
          </XStack>
          {listFeedback ? <YStack role="status" bg={listFeedbackIsSuccess ? '$soft' : '$declinedBackground'} p="$3" rounded="$control">
            <Paragraph color={listFeedbackIsSuccess ? '$brand' : '$declinedColor'} fontWeight="600">{listFeedback}</Paragraph>
          </YStack> : null}
          {availabilityLoading ? <FeedbackState status="loading" title="Carregando horários" /> : null}
          {availabilityError ? <YStack gap="$2"><FeedbackState status="error" description={availabilityError} />
            <Button self="flex-start" minH="$touchTarget" onPress={loadAvailability}>Tentar novamente</Button></YStack> : null}
          {!availabilityLoading && !availabilityError && availability.length === 0 ? <YStack gap="$2" p="$4" bg="$background" rounded="$control">
            <Ionicons name="time-outline" size={25} color={theme.brand.val} accessible={false} />
            <SizableText color="$color" fontWeight="700">Sua semana começa aqui</SizableText>
            <Paragraph color="$muted" size="$2">Cadastre o primeiro período para abrir horários aos pacientes.</Paragraph>
          </YStack> : null}
          {!availabilityLoading && !availabilityError ? availability.map((item) => (
            <YStack key={item.id} gap="$2" p="$3" bg="$background" rounded="$control" borderWidth={1} borderColor="$borderColor">
              <XStack items="center" justify="space-between" gap="$2">
                <YStack gap="$1" flex={1} minW={0}>
                  <SizableText color="$color" fontWeight="700">{weekdays[item.weekday]}</SizableText>
                  <Paragraph color="$muted" size="$2">{clockTime(item.startMinute)}–{clockTime(item.endMinute)} · {item.slotMinutes} min por consulta</Paragraph>
                </YStack>
                {removingId !== item.id ? <Button chromeless color="$declinedColor" minH="$touchTarget" aria-label={`Remover horário de ${weekdays[item.weekday]}`}
                  onPress={() => setRemovingId(item.id)}>
                  <Ionicons name="trash-outline" size={20} color={theme.declinedColor.val} accessible={false} />
                </Button> : null}
              </XStack>
              {removingId === item.id ? <YStack gap="$2">
                <Paragraph color="$muted" size="$2">Remover este período? Consultas já marcadas continuam na agenda.</Paragraph>
                <XStack gap="$2" flexWrap="wrap">
                  <Button minH="$touchTarget" disabled={busy} onPress={() => setRemovingId(null)}>Manter</Button>
                  <Button minH="$touchTarget" bg="$declinedBackground" color="$declinedColor" disabled={busy} onPress={() => void removeAvailability(item.id)}>Remover período</Button>
                </XStack>
              </YStack> : null}
            </YStack>
          )) : null}
          <Paragraph color="$muted" size="$2">Horários de Brasília. Alterações não cancelam consultas já marcadas.</Paragraph>
        </AppCard>
      </XStack>
    </YStack> : null}
  </YStack></ProfessionalScreen>;
}
