import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Button, Paragraph, SizableText, TextArea, XStack, YStack } from 'tamagui';

import { CancellationConfirmation } from '@/components/cancellation-confirmation';
import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { AppInput } from '@/components/app-input';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { ProfessionalBrand, ProfessionalScreen } from '@/components/professional/professional-screen';
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

export default function PatientDetailScreen() {
  const { relationshipId } = useLocalSearchParams<{ relationshipId: string }>();
  const { session } = useAuth();
  const router = useRouter();
  const [section, setSection] = useState('observations');
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

  const load = useCallback(async () => {
    if (!session?.access_token || !relationshipId) return;
    await Promise.resolve();
    setLoading(true);
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
      setContent(''); setEditingObservation(null); setVisibility('professional'); setOccurredAt(localDateTime());
      setFeedback(editingObservation ? 'Correção salva com a versão anterior preservada.' : 'Observação registrada.');
      await load();
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
      setEditingAppointment(null); setFeedback(editingAppointment ? 'Consulta reagendada.' : 'Consulta criada.');
      await load();
    } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível salvar a consulta.'); }
    finally { setSaving(false); }
  }

  async function runCancel(appointment: FollowUpAppointment) {
    if (!session?.access_token || !relationshipId || saving) return;
    setSaving(true);
    try { await cancelProfessionalAppointment(session.access_token, relationshipId, appointment.id); setCancelId(null); setFeedback('Consulta cancelada.'); await load(); }
    catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível cancelar.'); }
    finally { setSaving(false); }
  }

  async function handleShare(materialId: string) {
    if (!session?.access_token || !relationshipId || saving) return;
    setSaving(true);
    try { await shareMaterial(session.access_token, materialId, [relationshipId]); setFeedback('Material compartilhado com o paciente.'); await load(); }
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

  if (loading) return <ProfessionalScreen><FeedbackState status="loading" title="Carregando acompanhamento" /></ProfessionalScreen>;
  if (error || !patient) return <ProfessionalScreen><FeedbackState status="error" title="Acompanhamento indisponível" description={error} /><Button minH="$touchTarget" onPress={() => router.replace('/(professional)/patients')}>Voltar</Button></ProfessionalScreen>;

  return (
    <ProfessionalScreen>
      <ProfessionalBrand />
      <Button self="flex-start" chromeless color="$brand" minH="$touchTarget" onPress={() => router.replace('/(professional)/patients')}>Voltar aos pacientes</Button>
      <YStack shrink={0}><AppHeader eyebrow="ACOMPANHAMENTO ATIVO" title={patient.patientName} description="Observações, agenda, histórico e materiais deste vínculo." /></YStack>
      {loadWarning ? <YStack gap="$2"><Paragraph role="alert" color="$declinedColor">{loadWarning}</Paragraph><Button self="flex-start" minH="$touchTarget" onPress={() => void load()}>Atualizar dados</Button></YStack> : null}
      {feedback ? <Paragraph role="alert" color="$brand">{feedback}</Paragraph> : null}

      <XStack gap="$2" flexWrap="wrap" shrink={0} role="group" aria-label="Seções do acompanhamento">
        {[['observations', 'Observações'], ['appointments', 'Agenda'], ['patient', 'Registros do paciente'], ['materials', 'Materiais'], ['history', 'Histórico'], ['birthday', 'Aniversário']].map(([value, label]) => (
          <Button key={value} minH="$touchTarget" bg={section === value ? '$brand' : '$soft'} color={section === value ? '$brandContrast' : '$color'} aria-pressed={section === value} onPress={() => setSection(value)}>{label}</Button>
        ))}
      </XStack>
      <Button self="flex-start" chromeless color="$brand" minH="$touchTarget" onPress={() => void load()}>Atualizar acompanhamento</Button>
      {section === 'birthday' ? <>      <AppCard title="Mensagem de aniversário" background="$surface" rounded="$panel">
        <YStack gap="$3"><Paragraph color="$muted">Opcional. Se não houver personalização, o paciente verá a mensagem padrão no aniversário.</Paragraph><TextArea aria-label="Mensagem de aniversário para o paciente" value={birthdayContent} onChangeText={setBirthdayContent} placeholder="Escreva uma mensagem acolhedora" maxLength={1000} minH={100} borderColor="$borderColor" /><BrandButton disabled={saving || !birthdayContent.trim()} onPress={() => void saveBirthday()}>{saving ? 'Salvando…' : 'Salvar mensagem'}</BrandButton></YStack>
      </AppCard>

</> : null}
      {section === 'observations' ? <>
      <AppCard title={editingObservation ? 'Corrigir observação' : 'Nova observação'} background="$surface" rounded="$panel">
        <YStack gap="$3">
          <SizableText color="$muted" size="$2">Observações são privadas por padrão.</SizableText>
          <TextArea aria-label="Conteúdo da observação" value={content} onChangeText={setContent} placeholder="Registre somente o necessário para o acompanhamento" minH={110} maxLength={5000} borderColor="$borderColor" />
          <AppInput label="Data e hora da observação" value={occurredAt} onChangeText={(value) => setOccurredAt(maskLocalDateTime(value))} placeholder="DD/MM/AAAA HH:mm" keyboardType="numeric" /><Paragraph color="$muted" size="$2">Exemplo: 25/12/2026 14:30</Paragraph>
          <XStack gap="$2" flexWrap="wrap" accessibilityRole="radiogroup">
            <Button minH="$touchTarget" flex={1} minW={160} bg={visibility === 'professional' ? '$brand' : '$soft'} color={visibility === 'professional' ? '$brandContrast' : '$color'} onPress={() => setVisibility('professional')} accessibilityState={{ selected: visibility === 'professional' }}>Somente profissional</Button>
            <Button minH="$touchTarget" flex={1} minW={160} bg={visibility === 'patient' ? '$brand' : '$soft'} color={visibility === 'patient' ? '$brandContrast' : '$color'} onPress={() => setVisibility('patient')} accessibilityState={{ selected: visibility === 'patient' }}>Compartilhar com paciente</Button>
          </XStack>
          <XStack gap="$2" flexWrap="wrap"><BrandButton disabled={saving || !content.trim()} onPress={saveObservation}>{saving ? 'Salvando…' : editingObservation ? 'Salvar correção' : 'Registrar observação'}</BrandButton>{editingObservation ? <Button minH="$touchTarget" onPress={() => { setEditingObservation(null); setContent(''); }}>Cancelar edição</Button> : null}</XStack>
        </YStack>
      </AppCard>

      <AppCard title="Observações" background="$surface" rounded="$panel">
        <YStack gap="$3">{observations.length === 0 ? <Paragraph color="$muted">Nenhuma observação registrada.</Paragraph> : observations.map((item) => (
          <YStack key={item.id} gap="$2" p="$3" bg="$background" rounded="$control" borderWidth={1} borderColor="$borderColor">
            <XStack justify="space-between" gap="$2" flexWrap="wrap"><SizableText color="$color" fontWeight="700">{item.visibility === 'patient' ? 'Compartilhada' : 'Privada'}</SizableText><Paragraph color="$muted" size="$2">{new Date(item.occurredAt).toLocaleString('pt-BR')} · versão {item.version}</Paragraph></XStack>
            <Paragraph color="$color">{item.content}</Paragraph>
            <Button self="flex-start" chromeless color="$brand" minH="$touchTarget" onPress={() => { setEditingObservation(item.id); setContent(item.content); setVisibility(item.visibility); setOccurredAt(localDateTime(new Date(item.occurredAt))); }}>Corrigir preservando versão</Button>
          </YStack>
        ))}</YStack>
      </AppCard>

      </> : null}
      {section === 'appointments' ? <>
      <AppCard title={editingAppointment ? 'Reagendar consulta' : 'Nova consulta'} background="$surface" rounded="$panel">
        <YStack gap="$3"><Paragraph color="$muted" size="$2">Use dia/mês/ano e horário de 24 horas. Exemplo: 25/12/2026 14:30.</Paragraph><AppInput label="Data e hora de início" value={startsAt} onChangeText={(value) => setStartsAt(maskLocalDateTime(value))} placeholder="DD/MM/AAAA HH:mm" keyboardType="numeric" /><AppInput label="Data e hora de término" value={endsAt} onChangeText={(value) => setEndsAt(maskLocalDateTime(value))} placeholder="DD/MM/AAAA HH:mm" keyboardType="numeric" /><XStack gap="$2" flexWrap="wrap"><BrandButton disabled={saving} onPress={saveAppointment}>{editingAppointment ? 'Salvar reagendamento' : 'Criar consulta'}</BrandButton>{editingAppointment ? <Button minH="$touchTarget" onPress={() => setEditingAppointment(null)}>Cancelar edição</Button> : null}</XStack></YStack>
      </AppCard>

      <AppCard title="Agenda deste paciente" background="$surface" rounded="$panel">
        <YStack gap="$3">{appointments.length === 0 ? <Paragraph color="$muted">Nenhuma consulta agendada.</Paragraph> : appointments.map((item) => (
          <YStack key={item.id} gap="$2" p="$3" bg="$background" rounded="$control"><SizableText color="$color" fontWeight="700">{new Date(item.startsAt).toLocaleString('pt-BR')}</SizableText><Paragraph color="$muted">{appointmentStatus(item)}</Paragraph>{item.state === 'scheduled' ? <XStack gap="$2" flexWrap="wrap"><Button minH="$touchTarget" onPress={() => { setEditingAppointment(item.id); setStartsAt(localDateTime(new Date(item.startsAt))); setEndsAt(localDateTime(new Date(item.endsAt))); }}>Reagendar</Button><Button minH="$touchTarget" bg="$declinedBackground" color="$declinedColor" disabled={saving} onPress={() => setCancelId(item.id)}>Cancelar</Button></XStack> : null}{cancelId === item.id ? <CancellationConfirmation busy={saving} onKeep={() => setCancelId(null)} onConfirm={() => void runCancel(item)} /> : null}</YStack>
        ))}</YStack>
      </AppCard>

      </> : null}
      {section === 'materials' ? <>
      <AppCard title="Materiais disponíveis" background="$surface" rounded="$panel">
        <YStack gap="$3">{materials.length === 0 ? <Paragraph color="$muted">Cadastre materiais na aba Materiais.</Paragraph> : materials.map((item) => <XStack key={item.id} gap="$3" items="center" flexWrap="wrap" p="$3" bg="$background" rounded="$control"><YStack flex={1} minW={180}><SizableText color="$color" fontWeight="700">{item.title}</SizableText><Paragraph color="$muted" size="$2">{({ ebook: 'E-book', podcast: 'Podcast', video: 'Vídeo', pdf: 'PDF', audio: 'Áudio', other: 'Outro' })[item.kind]}</Paragraph></YStack><Button minH="$touchTarget" disabled={saving} onPress={() => handleShare(item.id)}>Compartilhar</Button></XStack>)}</YStack>
      </AppCard>

      </> : null}
      {section === 'patient' ? <>
      <AppCard title="Documentos enviados pelo paciente" background="$surface" rounded="$panel"><YStack gap="$3">{documents.length === 0 ? <Paragraph color="$muted">Nenhum PDF enviado ainda.</Paragraph> : documents.map((item) => <XStack key={item.id} gap="$3" items="center" flexWrap="wrap" p="$3" bg="$background" rounded="$control"><YStack flex={1} minW={180}><SizableText color="$color" fontWeight="700">{item.title}</SizableText><Paragraph color="$muted" size="$2">{new Date(item.createdAt).toLocaleString('pt-BR')}</Paragraph></YStack><Button minH="$touchTarget" onPress={() => void openDocument(item)}>Abrir PDF</Button></XStack>)}</YStack></AppCard>

      <AppCard title="Mural do paciente" background="$surface" rounded="$panel"><YStack gap="$3">{patientMessages.length === 0 ? <Paragraph color="$muted">Nenhum recado para a próxima sessão.</Paragraph> : patientMessages.map((item) => <YStack key={item.id} gap="$1" p="$3" bg="$background" rounded="$control"><Paragraph color="$color">{item.content}</Paragraph><Paragraph color="$muted" size="$2">{new Date(item.createdAt).toLocaleString('pt-BR')}</Paragraph></YStack>)}</YStack></AppCard>

      <AppCard title="Como o paciente está" background="$surface" rounded="$panel"><YStack gap="$3">{checkIns.length === 0 ? <Paragraph color="$muted">Nenhum check-in registrado.</Paragraph> : checkIns.map((item) => <YStack key={item.id} gap="$1" p="$3" bg="$background" rounded="$control"><SizableText color="$color" fontWeight="700">{({ calm: 'Tranquilo(a)', happy: 'Feliz', tired: 'Cansado(a)', anxious: 'Ansioso(a)', sad: 'Triste', other: 'Outro' })[item.feeling]}</SizableText>{item.note ? <Paragraph color="$color">{item.note}</Paragraph> : null}<Paragraph color="$muted" size="$2">{new Date(item.createdAt).toLocaleString('pt-BR')}</Paragraph></YStack>)}</YStack></AppCard>

      </> : null}
      {section === 'history' ? <>
      <AppCard title="Histórico cronológico" background="$surface" rounded="$panel">
        <YStack gap="$3">{timeline.length === 0 ? <Paragraph color="$muted">Nenhum evento registrado.</Paragraph> : timeline.map((item) => <YStack key={`${item.type}-${item.id}`} pl="$3" borderLeftWidth={3} borderLeftColor="$brand"><SizableText color="$color" fontWeight="700">{item.label}</SizableText><Paragraph color="$muted" size="$2">{new Date(item.at).toLocaleString('pt-BR')}</Paragraph>{item.content ? <Paragraph color="$color">{item.content}</Paragraph> : null}</YStack>)}</YStack>
      </AppCard>
      </> : null}
    </ProfessionalScreen>
  );
}
