import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Button, Paragraph, SizableText, TextArea, useTheme, XStack, YStack } from 'tamagui';

import { CancellationConfirmation } from '@/components/cancellation-confirmation';
import { AppCard } from '@/components/app-card';
import { AppInput } from '@/components/app-input';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { InitialsAvatar, ProfessionalBrand, ProfessionalScreen, type ProfessionalIcon } from '@/components/professional/professional-screen';
import { useAuth } from '@/contexts/auth-context';
import { formatLocalDateTime, maskLocalDateTime, parseLocalDateTime } from '@/lib/date-time-input';
import { openExternalResource } from '@/lib/open-external';
import {
  cancelProfessionalAppointment,
  createAppointment,
  createProfessionalObservation,
  correctProfessionalObservation,
  getProfessionalPatient,
  getPatientDocumentUrl,
  listAppointments,
  listMaterials,
  listProfessionalObservations,
  listPatientCheckIns,
  listPatientDocuments,
  listPatientMessages,
  listTimeline,
  rescheduleAppointment,
  saveBirthdayMessage,
  shareMaterial,
  type FollowUpAppointment,
  type FollowUpMaterial,
  type FollowUpObservation,
  type FollowUpPatient,
  type PatientCheckIn,
  type PatientDocument,
  type PatientMessage,
  type TimelineItem,
} from '@/lib/api';

const localDateTime = (date = new Date()) => formatLocalDateTime(date);
const initialAppointmentStart = localDateTime(new Date(Date.now() + 86_400_000));
const initialAppointmentEnd = localDateTime(new Date(Date.now() + 90_000_000));

const appointmentStatus = (appointment: FollowUpAppointment) => appointment.state === 'cancelled'
  ? 'Cancelada'
  : appointment.patientResponse === 'confirmed' ? 'Confirmada' : 'Aguardando confirmação';

const sections: { value: string; label: string; accessibleLabel: string; icon: ProfessionalIcon }[] = [
  { value: 'observations', label: 'Observações', accessibleLabel: 'Observações profissionais', icon: 'document-text-outline' },
  { value: 'appointments', label: 'Consultas', accessibleLabel: 'Consultas do paciente', icon: 'calendar-outline' },
  { value: 'patient', label: 'Registros', accessibleLabel: 'Registros enviados pelo paciente', icon: 'heart-outline' },
  { value: 'materials', label: 'Materiais', accessibleLabel: 'Materiais para compartilhar', icon: 'folder-outline' },
  { value: 'history', label: 'Histórico', accessibleLabel: 'Histórico do vínculo', icon: 'time-outline' },
  { value: 'birthday', label: 'Aniversário', accessibleLabel: 'Mensagem de aniversário', icon: 'gift-outline' },
];

export default function PatientDetailScreen() {
  const { relationshipId, section: requestedSection } = useLocalSearchParams<{ relationshipId: string; section?: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const wide = width >= 800 && fontScale < 1.3;
  const navColumns = fontScale >= 1.3 || width < 620 ? 2 : width < 1050 ? 3 : 6;
  const [section, setSection] = useState(requestedSection === 'patient' ? 'patient' : 'observations');
  const [observationFormOpen, setObservationFormOpen] = useState(false);
  const [appointmentFormOpen, setAppointmentFormOpen] = useState(false);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [patient, setPatient] = useState<FollowUpPatient | null>(null);
  const [observations, setObservations] = useState<FollowUpObservation[]>([]);
  const [appointments, setAppointments] = useState<FollowUpAppointment[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [materials, setMaterials] = useState<FollowUpMaterial[]>([]);
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [patientMessages, setPatientMessages] = useState<PatientMessage[]>([]);
  const [checkIns, setCheckIns] = useState<PatientCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [loadWarning, setLoadWarning] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<FollowUpObservation['visibility']>('professional');
  const [occurredAt, setOccurredAt] = useState(localDateTime());
  const [editingObservation, setEditingObservation] = useState<string | null>(null);
  const [startsAt, setStartsAt] = useState(initialAppointmentStart);
  const [endsAt, setEndsAt] = useState(initialAppointmentEnd);
  const [editingAppointment, setEditingAppointment] = useState<string | null>(null);
  const [birthdayContent, setBirthdayContent] = useState('');
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async (silent = false) => {
    if (!session?.access_token || !relationshipId) return;
    if (!silent) setLoading(true);
    setNow(Date.now());
    setError(''); setLoadWarning('');
    try {
      const patientData = await getProfessionalPatient(session.access_token, relationshipId);
      setPatient(patientData);
      const results = await Promise.allSettled([
        listProfessionalObservations(session.access_token, relationshipId),
        listAppointments(session.access_token, relationshipId),
        listTimeline(session.access_token, relationshipId),
        listMaterials(session.access_token),
        listPatientDocuments(session.access_token, relationshipId),
        listPatientMessages(session.access_token, relationshipId),
        listPatientCheckIns(session.access_token, relationshipId),
      ]);
      const [observationData, appointmentData, timelineData, materialData, documentData, messageData, checkInData] = results;
      if (observationData.status === 'fulfilled') setObservations(observationData.value);
      if (appointmentData.status === 'fulfilled') setAppointments(appointmentData.value);
      if (timelineData.status === 'fulfilled') setTimeline(timelineData.value);
      if (materialData.status === 'fulfilled') setMaterials(materialData.value.materials);
      if (documentData.status === 'fulfilled') setDocuments(documentData.value);
      if (messageData.status === 'fulfilled') setPatientMessages(messageData.value);
      if (checkInData.status === 'fulfilled') setCheckIns(checkInData.value);
      if (results.some((result) => result.status === 'rejected')) setLoadWarning('Parte do acompanhamento não pôde ser carregada. Tente atualizar os dados.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o acompanhamento.');
    } finally { setLoading(false); }
  }, [relationshipId, session]);

  useFocusEffect(useCallback(() => {
    void load();
    const timer = setInterval(() => {
      if (!session?.access_token || !relationshipId) return;
      void listAppointments(session.access_token, relationshipId).then(setAppointments).catch(() => {});
      void listPatientDocuments(session.access_token, relationshipId).then(setDocuments).catch(() => {});
    }, 30_000);
    return () => clearInterval(timer);
  }, [load, relationshipId, session]));

  async function saveObservation() {
    if (!session?.access_token || !relationshipId || saving || !content.trim()) return;
    setSaving(true); setFeedback('');
    try {
      const input = { content, visibility, occurredAt: parseLocalDateTime(occurredAt).toISOString() };
      if (editingObservation) await correctProfessionalObservation(session.access_token, relationshipId, editingObservation, input);
      else await createProfessionalObservation(session.access_token, relationshipId, input);
      setContent(''); setEditingObservation(null); setObservationFormOpen(false); setVisibility('professional'); setOccurredAt(localDateTime());
      setFeedback(editingObservation ? 'Correção salva com a versão anterior preservada.' : 'Observação registrada.');
      await load(true);
    } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível salvar.'); }
    finally { setSaving(false); }
  }

  async function saveAppointment() {
    if (!session?.access_token || !relationshipId || saving) return;
    setSaving(true); setFeedback('');
    try {
      const start = parseLocalDateTime(startsAt).toISOString(); const end = parseLocalDateTime(endsAt).toISOString();
      if (Date.parse(end) <= Date.parse(start)) throw new Error('O término deve ser posterior ao início.');
      if (editingAppointment) await rescheduleAppointment(session.access_token, relationshipId, editingAppointment, start, end);
      else await createAppointment(session.access_token, relationshipId, start, end);
      setEditingAppointment(null); setAppointmentFormOpen(false); setFeedback(editingAppointment ? 'Consulta reagendada.' : 'Consulta criada.');
      await load(true);
    } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível salvar a consulta.'); }
    finally { setSaving(false); }
  }

  async function runCancel(appointment: FollowUpAppointment) {
    if (!session?.access_token || !relationshipId || saving) return;
    setSaving(true);
    try { await cancelProfessionalAppointment(session.access_token, relationshipId, appointment.id); setCancelId(null); setFeedback('Consulta cancelada.'); await load(true); }
    catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível cancelar.'); }
    finally { setSaving(false); }
  }

  async function handleShare(materialId: string) {
    if (!session?.access_token || !relationshipId || saving) return;
    setSaving(true);
    try { await shareMaterial(session.access_token, materialId, [relationshipId]); setFeedback('Material compartilhado com o paciente.'); await load(true); }
    catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível compartilhar.'); }
    finally { setSaving(false); }
  }

  async function saveBirthday() {
    if (!session?.access_token || !relationshipId || saving || !birthdayContent.trim()) return;
    setSaving(true); setFeedback('');
    try { await saveBirthdayMessage(session.access_token, relationshipId, birthdayContent); setFeedback('Mensagem de aniversário salva. Ela aparecerá ao paciente na data de nascimento.'); }
    catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível salvar a mensagem.'); }
    finally { setSaving(false); }
  }
  async function openDocument(document: PatientDocument) {
    if (!session?.access_token) return;
    try { await openExternalResource(() => getPatientDocumentUrl(session.access_token, document.id, false)); }
    catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível abrir o documento.'); }
  }

  const upcoming = appointments.filter((item) => item.state === 'scheduled' && Date.parse(item.startsAt) >= now)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];

  if (loading) return <ProfessionalScreen><FeedbackState status="loading" title="Carregando acompanhamento" /></ProfessionalScreen>;
  if (error || !patient) return <ProfessionalScreen><FeedbackState status="error" title="Acompanhamento indisponível" description={error} /><Button minH="$touchTarget" onPress={() => router.replace('/(professional)/patients')}>Voltar</Button></ProfessionalScreen>;

  return (
    <ProfessionalScreen>
      <XStack items="center" justify="space-between" gap="$3" flexWrap="wrap">
        <ProfessionalBrand />
        <Button chromeless minH="$touchTarget" color="$brand" fontWeight="700"
          icon={<Ionicons name="arrow-back" size={18} color={theme.brand.val} accessible={false} />}
          onPress={() => router.replace('/(professional)/patients')}>Pacientes</Button>
      </XStack>
      <AppCard p="$5" borderLeftWidth={4} borderLeftColor="$accent">
        <XStack items="center" gap="$4" flexWrap="wrap">
          <InitialsAvatar name={patient.patientName} large />
          <YStack flex={1} minW={180} gap="$1">
            <Paragraph color="$accentText" size="$2" fontWeight="700" letterSpacing={1}>FICHA DO PACIENTE</Paragraph>
            <SizableText role="heading" color="$color" fontFamily="$heading" fontSize={wide ? 28 : 23} lineHeight={wide ? 36 : 31}>{patient.patientName}</SizableText>
            <Paragraph color="$muted" size="$2">Vínculo ativo · Acompanhamento individual</Paragraph>
          </YStack>
          <Button chromeless minH="$touchTarget" color="$brand" aria-label="Atualizar acompanhamento"
            icon={<Ionicons name="refresh-outline" size={19} color={theme.brand.val} accessible={false} />}
            onPress={() => void load(true)}>Atualizar</Button>
        </XStack>
        <XStack items="center" gap="$2" pt="$3" borderTopWidth={1} borderColor="$borderColor" flexWrap="wrap">
          <Ionicons name="calendar-outline" size={18} color={theme.brand.val} accessible={false} />
          <Paragraph color="$muted" size="$2">Próxima consulta</Paragraph>
          <SizableText color="$color" fontWeight="700" size="$2">
            {upcoming ? new Date(upcoming.startsAt).toLocaleString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'Nenhuma agendada'}
          </SizableText>
        </XStack>
      </AppCard>
      {loadWarning ? <AppCard p="$4" bg="$pendingBackground" borderColor="$pendingColor"><XStack items="center" justify="space-between" gap="$2" flexWrap="wrap"><Paragraph role="alert" color="$pendingColor" flex={1} minW={200}>{loadWarning}</Paragraph><Button minH="$touchTarget" onPress={() => void load(true)}>Tentar novamente</Button></XStack></AppCard> : null}

      <YStack gap="$2">
        <SizableText color="$color" fontWeight="700" fontSize={18}>Áreas do acompanhamento</SizableText>
        <XStack gap="$2" flexWrap="wrap" shrink={0} role="group" aria-label="Seções do acompanhamento">
          {sections.map(({ value, label, accessibleLabel, icon }) => (
            <Button key={value} flex={navColumns === 6 ? 1 : undefined} width={navColumns === 6 ? undefined : navColumns === 3 ? '31%' : '48%'} minW={navColumns === 6 ? 145 : undefined} minH={50} px="$3"
              bg={section === value ? '$brand' : '$surface'} color={section === value ? '$brandContrast' : '$brand'}
              borderWidth={1} borderColor={section === value ? '$brand' : '$borderColor'} rounded="$control"
              hoverStyle={{ background: section === value ? '$brandHover' : '$soft' }}
              pressStyle={{ background: section === value ? '$brandPress' : '$soft' }}
              aria-label={accessibleLabel} aria-pressed={section === value}
              icon={<Ionicons name={icon} size={18} color={section === value ? theme.brandContrast.val : theme.brand.val} accessible={false} />}
              onPress={() => { setSection(value); setFeedback(''); }}>{label}</Button>
          ))}
        </XStack>
      </YStack>
      {feedback ? <AppCard p="$3" bg="$accentSoft" borderColor="$logoBorder"><Paragraph role="alert" color="$color">{feedback}</Paragraph></AppCard> : null}
      {section === 'birthday' ? <><YStack gap="$1"><SizableText color="$color" fontWeight="700" fontSize={20}>Mensagem de aniversário</SizableText><Paragraph color="$muted" size="$2">Um gesto pessoal no dia do aniversário do paciente.</Paragraph></YStack>
      <AppCard background="$surface" rounded="$panel" p="$5">
        <YStack gap="$3"><XStack items="center" gap="$3"><YStack width={48} height={48} items="center" justify="center" bg="$accentSoft" rounded="$control"><Ionicons name="gift-outline" size={24} color={theme.accentText.val} accessible={false} /></YStack><SizableText color="$color" fontWeight="700">Escreva uma mensagem acolhedora</SizableText></XStack><Paragraph color="$muted">Opcional. Sem personalização, o paciente verá a mensagem padrão no aniversário.</Paragraph><TextArea aria-label="Mensagem de aniversário para o paciente" value={birthdayContent} onChangeText={setBirthdayContent} placeholder="Escreva aqui a mensagem" maxLength={1000} minH={120} borderColor="$borderColor" /><Paragraph color="$muted" size="$2">{birthdayContent.length}/1000 caracteres</Paragraph><BrandButton hoverStyle={{ background: '$brandHover' }} pressStyle={{ background: '$brandPress' }} disabled={saving || !birthdayContent.trim()} onPress={() => void saveBirthday()}>{saving ? 'Salvando…' : 'Salvar mensagem'}</BrandButton></YStack>
      </AppCard>

</> : null}
      {section === 'observations' ? <>
      <XStack items="center" justify="space-between" gap="$3" flexWrap="wrap">
        <YStack gap="$1"><SizableText color="$color" fontWeight="700" fontSize={20}>Observações profissionais</SizableText><Paragraph color="$muted" size="$2">Registros privados ou compartilhados, com histórico de correções.</Paragraph></YStack>
        <Button minH="$touchTarget" bg="$brand" color="$brandContrast" hoverStyle={{ background: '$brandHover' }} pressStyle={{ background: '$brandPress' }}
          icon={<Ionicons name="add" size={20} color={theme.brandContrast.val} accessible={false} />}
          onPress={() => { setEditingObservation(null); setContent(''); setVisibility('professional'); setOccurredAt(localDateTime()); setObservationFormOpen(true); setFeedback(''); }}>Nova observação</Button>
      </XStack>
      {observationFormOpen ? <AppCard title={editingObservation ? 'Corrigir observação' : 'Nova observação'} background="$surface" rounded="$panel" p="$5">
        <YStack gap="$3">
          <SizableText color="$muted" size="$2">Observações são privadas por padrão.</SizableText>
          <TextArea aria-label="Conteúdo da observação" value={content} onChangeText={setContent} placeholder="Registre somente o necessário para o acompanhamento" minH={110} maxLength={5000} borderColor="$borderColor" />
          <AppInput label="Data e hora da observação" value={occurredAt} onChangeText={(value) => setOccurredAt(maskLocalDateTime(value))} placeholder="DD/MM/AAAA HH:mm" keyboardType="numeric" /><Paragraph color="$muted" size="$2">Exemplo: 25/12/2026 14:30</Paragraph>
          <XStack gap="$2" flexWrap="wrap" accessibilityRole="radiogroup">
            <Button minH="$touchTarget" flex={1} minW={160} bg={visibility === 'professional' ? '$brand' : '$soft'} color={visibility === 'professional' ? '$brandContrast' : '$color'} onPress={() => setVisibility('professional')} accessibilityState={{ selected: visibility === 'professional' }}>Somente profissional</Button>
            <Button minH="$touchTarget" flex={1} minW={160} bg={visibility === 'patient' ? '$brand' : '$soft'} color={visibility === 'patient' ? '$brandContrast' : '$color'} onPress={() => setVisibility('patient')} accessibilityState={{ selected: visibility === 'patient' }}>Compartilhar com paciente</Button>
          </XStack>
          <XStack gap="$2" flexWrap="wrap"><BrandButton hoverStyle={{ background: '$brandHover' }} pressStyle={{ background: '$brandPress' }} disabled={saving || !content.trim()} onPress={saveObservation}>{saving ? 'Salvando…' : editingObservation ? 'Salvar correção' : 'Registrar observação'}</BrandButton><Button minH="$touchTarget" onPress={() => { setEditingObservation(null); setContent(''); setObservationFormOpen(false); }}>Fechar</Button></XStack>
        </YStack>
      </AppCard> : null}

      <AppCard title={`Registros anteriores · ${observations.length}`} background="$surface" rounded="$panel" p="$5">
        <YStack gap="$3">{observations.length === 0 ? <Paragraph color="$muted">Ainda não há observações. Use “Nova observação” para registrar a primeira.</Paragraph> : observations.map((item) => (
          <YStack key={item.id} gap="$2" p="$3" bg="$background" rounded="$control" borderWidth={1} borderColor="$borderColor">
            <XStack justify="space-between" gap="$2" flexWrap="wrap"><SizableText color={item.visibility === 'patient' ? '$accentText' : '$brand'} bg={item.visibility === 'patient' ? '$accentSoft' : '$soft'} px="$2" py="$1" rounded="$12" size="$2" fontWeight="700">{item.visibility === 'patient' ? 'Compartilhada com paciente' : 'Privada'}</SizableText><Paragraph color="$muted" size="$2">{new Date(item.occurredAt).toLocaleString('pt-BR')} · versão {item.version}</Paragraph></XStack>
            <Paragraph color="$color">{item.content}</Paragraph>
            <Button self="flex-start" chromeless color="$brand" minH="$touchTarget" onPress={() => { setEditingObservation(item.id); setContent(item.content); setVisibility(item.visibility); setOccurredAt(localDateTime(new Date(item.occurredAt))); setObservationFormOpen(true); setFeedback(''); }}>Corrigir registro</Button>
          </YStack>
        ))}</YStack>
      </AppCard>

      </> : null}
      {section === 'appointments' ? <>
      <XStack items="center" justify="space-between" gap="$3" flexWrap="wrap">
        <YStack gap="$1"><SizableText color="$color" fontWeight="700" fontSize={20}>Consultas deste paciente</SizableText><Paragraph color="$muted" size="$2">Veja confirmações, reagende ou crie um encontro.</Paragraph></YStack>
        <Button minH="$touchTarget" bg="$brand" color="$brandContrast" hoverStyle={{ background: '$brandHover' }} pressStyle={{ background: '$brandPress' }}
          icon={<Ionicons name="add" size={20} color={theme.brandContrast.val} accessible={false} />}
          onPress={() => { setEditingAppointment(null); setAppointmentFormOpen(true); setFeedback(''); }}>Nova consulta</Button>
      </XStack>
      {appointmentFormOpen ? <AppCard title={editingAppointment ? 'Reagendar consulta' : 'Nova consulta'} background="$surface" rounded="$panel" p="$5">
        <YStack gap="$3"><Paragraph color="$muted" size="$2">Use dia/mês/ano e horário de 24 horas. Exemplo: 25/12/2026 14:30.</Paragraph><AppInput label="Data e hora de início" value={startsAt} onChangeText={(value) => setStartsAt(maskLocalDateTime(value))} placeholder="DD/MM/AAAA HH:mm" keyboardType="numeric" /><AppInput label="Data e hora de término" value={endsAt} onChangeText={(value) => setEndsAt(maskLocalDateTime(value))} placeholder="DD/MM/AAAA HH:mm" keyboardType="numeric" /><XStack gap="$2" flexWrap="wrap"><BrandButton hoverStyle={{ background: '$brandHover' }} pressStyle={{ background: '$brandPress' }} disabled={saving} onPress={saveAppointment}>{saving ? 'Salvando…' : editingAppointment ? 'Salvar reagendamento' : 'Criar consulta'}</BrandButton><Button minH="$touchTarget" onPress={() => { setEditingAppointment(null); setAppointmentFormOpen(false); }}>Fechar</Button></XStack></YStack>
      </AppCard> : null}

      <AppCard title={`Agenda · ${appointments.length}`} background="$surface" rounded="$panel" p="$5">
        <YStack gap="$3">{appointments.length === 0 ? <Paragraph color="$muted">Nenhuma consulta registrada para este paciente.</Paragraph> : appointments.map((item) => (
          <YStack key={item.id} gap="$2" p="$3" bg="$background" rounded="$control" borderWidth={1} borderColor="$borderColor"><XStack items="center" gap="$3"><YStack width={50} height={50} items="center" justify="center" bg="$accentSoft" rounded="$control"><Ionicons name="calendar-outline" size={23} color={theme.accentText.val} accessible={false} /></YStack><YStack flex={1} minW={0}><SizableText color="$color" fontWeight="700">{new Date(item.startsAt).toLocaleString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}</SizableText><Paragraph color="$muted" size="$2">{new Date(item.startsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} – {new Date(item.endsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Paragraph></YStack></XStack><SizableText color={item.state === 'cancelled' ? '$declinedColor' : '$accentText'} fontWeight="700" size="$2">{appointmentStatus(item)}</SizableText>{item.state === 'scheduled' ? <XStack gap="$2" flexWrap="wrap"><Button minH="$touchTarget" bg="$soft" color="$brand" onPress={() => { setEditingAppointment(item.id); setStartsAt(localDateTime(new Date(item.startsAt))); setEndsAt(localDateTime(new Date(item.endsAt))); setAppointmentFormOpen(true); setFeedback(''); }}>Reagendar</Button><Button minH="$touchTarget" bg="$declinedBackground" color="$declinedColor" disabled={saving} onPress={() => setCancelId(item.id)}>Cancelar</Button></XStack> : null}{cancelId === item.id ? <CancellationConfirmation busy={saving} onKeep={() => setCancelId(null)} onConfirm={() => void runCancel(item)} /> : null}</YStack>
        ))}</YStack>
      </AppCard>

      </> : null}
      {section === 'materials' ? <>
      <YStack gap="$1"><SizableText color="$color" fontWeight="700" fontSize={20}>Compartilhar materiais</SizableText><Paragraph color="$muted" size="$2">Selecione um conteúdo da sua biblioteca para enviar a este paciente.</Paragraph></YStack>
      <AppCard title={`Sua biblioteca · ${materials.length}`} background="$surface" rounded="$panel" p="$5">
        <YStack gap="$3">{materials.length === 0 ? <YStack gap="$2"><Paragraph color="$muted">Ainda não há materiais na sua biblioteca.</Paragraph><Button self="flex-start" minH="$touchTarget" bg="$soft" color="$brand" onPress={() => router.push('/(professional)/materials')}>Cadastrar material</Button></YStack> : materials.map((item) => <XStack key={item.id} gap="$3" items="center" flexWrap="wrap" p="$3" bg="$background" rounded="$control" borderWidth={1} borderColor="$borderColor"><YStack width={44} height={44} items="center" justify="center" bg="$soft" rounded="$control"><Ionicons name="document-outline" size={22} color={theme.brand.val} accessible={false} /></YStack><YStack flex={1} minW={180}><SizableText color="$color" fontWeight="700">{item.title}</SizableText><Paragraph color="$muted" size="$2">{({ ebook: 'E-book', podcast: 'Podcast', video: 'Vídeo', pdf: 'PDF', audio: 'Áudio', other: 'Outro' })[item.kind]}</Paragraph></YStack><Button minH="$touchTarget" bg="$brand" color="$brandContrast" hoverStyle={{ background: '$brandHover' }} pressStyle={{ background: '$brandPress' }} disabled={saving} onPress={() => handleShare(item.id)}>Compartilhar</Button></XStack>)}</YStack>
      </AppCard>

      </> : null}
      {section === 'patient' ? <>
      <YStack gap="$1"><SizableText color="$color" fontWeight="700" fontSize={20}>Registros do paciente</SizableText><Paragraph color="$muted" size="$2">Documentos, recados e check-ins compartilhados neste vínculo.</Paragraph></YStack>
      <AppCard title={`Documentos · ${documents.length}`} background="$surface" rounded="$panel" p="$5"><YStack gap="$3">{documents.length === 0 ? <Paragraph color="$muted">Nenhum PDF enviado ainda.</Paragraph> : documents.map((item) => <XStack key={item.id} gap="$3" items="center" flexWrap="wrap" p="$3" bg="$background" rounded="$control" borderWidth={1} borderColor="$borderColor"><YStack width={44} height={44} items="center" justify="center" bg="$soft" rounded="$control"><Ionicons name="document-attach-outline" size={22} color={theme.brand.val} accessible={false} /></YStack><YStack flex={1} minW={180}><SizableText color="$color" fontWeight="700">{item.title}</SizableText><Paragraph color="$muted" size="$2">{new Date(item.createdAt).toLocaleString('pt-BR')}</Paragraph></YStack><Button minH="$touchTarget" bg="$soft" color="$brand" onPress={() => void openDocument(item)}>Abrir PDF</Button></XStack>)}</YStack></AppCard>

      <AppCard title={`Recados para a próxima sessão · ${patientMessages.length}`} background="$surface" rounded="$panel" p="$5"><YStack gap="$3">{patientMessages.length === 0 ? <Paragraph color="$muted">Nenhum recado deixado pelo paciente.</Paragraph> : patientMessages.map((item) => <YStack key={item.id} gap="$2" p="$3" bg="$background" rounded="$control" borderWidth={1} borderColor="$borderColor"><Paragraph color="$color">{item.content}</Paragraph><Paragraph color="$muted" size="$2">{new Date(item.createdAt).toLocaleString('pt-BR')}</Paragraph></YStack>)}</YStack></AppCard>

      <AppCard title={`Check-ins · ${checkIns.length}`} background="$surface" rounded="$panel" p="$5"><YStack gap="$3">{checkIns.length === 0 ? <Paragraph color="$muted">Nenhum check-in registrado.</Paragraph> : checkIns.map((item) => <YStack key={item.id} gap="$2" p="$3" bg="$background" rounded="$control" borderWidth={1} borderColor="$borderColor"><XStack items="center" gap="$2"><Ionicons name="heart-outline" size={18} color={theme.accentText.val} accessible={false} /><SizableText color="$color" fontWeight="700">{({ calm: 'Tranquilo(a)', happy: 'Feliz', tired: 'Cansado(a)', anxious: 'Ansioso(a)', sad: 'Triste', other: 'Outro' })[item.feeling]}</SizableText></XStack>{item.note ? <Paragraph color="$color">{item.note}</Paragraph> : null}<Paragraph color="$muted" size="$2">{new Date(item.createdAt).toLocaleString('pt-BR')}</Paragraph></YStack>)}</YStack></AppCard>

      </> : null}
      {section === 'history' ? <>
      <YStack gap="$1"><SizableText color="$color" fontWeight="700" fontSize={20}>Histórico do vínculo</SizableText><Paragraph color="$muted" size="$2">Acompanhe os registros em ordem cronológica.</Paragraph></YStack>
      <AppCard title={`${timeline.length} ${timeline.length === 1 ? 'evento' : 'eventos'}`} background="$surface" rounded="$panel" p="$5">
        <YStack gap="$4">{timeline.length === 0 ? <Paragraph color="$muted">Nenhum evento registrado.</Paragraph> : timeline.map((item) => <YStack key={`${item.type}-${item.id}`} gap="$1" pl="$4" py="$1" borderLeftWidth={3} borderLeftColor="$accent"><SizableText color="$color" fontWeight="700">{item.label}</SizableText><Paragraph color="$muted" size="$2">{new Date(item.at).toLocaleString('pt-BR')}</Paragraph>{item.content ? <Paragraph color="$color">{item.content}</Paragraph> : null}</YStack>)}</YStack>
      </AppCard>
      </> : null}
    </ProfessionalScreen>
  );
}
