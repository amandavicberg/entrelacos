import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as Linking from 'expo-linking';
import { Button, Paragraph, SizableText, TextArea, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { AppInput } from '@/components/app-input';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { ProfessionalBrand, ProfessionalScreen } from '@/components/professional/professional-screen';
import { useAuth } from '@/contexts/auth-context';
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

const localDateTime = (date = new Date()) => {
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};
const initialAppointmentStart = localDateTime(new Date(Date.now() + 86_400_000));
const initialAppointmentEnd = localDateTime(new Date(Date.now() + 90_000_000));

const appointmentStatus = (appointment: FollowUpAppointment) => appointment.state === 'cancelled'
  ? 'Cancelada'
  : appointment.patientResponse === 'confirmed' ? 'Confirmada' : 'Aguardando confirmação';

export default function PatientDetailScreen() {
  const { relationshipId } = useLocalSearchParams<{ relationshipId: string }>();
  const { session } = useAuth();
  const router = useRouter();
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
    setError('');
    try {
      const [patientData, observationData, appointmentData, timelineData, materialData, documentData, messageData, checkInData] = await Promise.all([
        getProfessionalPatient(session.access_token, relationshipId),
        listProfessionalObservations(session.access_token, relationshipId),
        listAppointments(session.access_token, relationshipId),
        listTimeline(session.access_token, relationshipId),
        listMaterials(session.access_token),
        listPatientDocuments(session.access_token, relationshipId),
        listPatientMessages(session.access_token, relationshipId),
        listPatientCheckIns(session.access_token, relationshipId),
      ]);
      setPatient(patientData);
      setObservations(observationData);
      setAppointments(appointmentData);
      setTimeline(timelineData);
      setMaterials(materialData.materials);
      setDocuments(documentData); setPatientMessages(messageData); setCheckIns(checkInData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o acompanhamento.');
    } finally { setLoading(false); }
  }, [relationshipId, session]);

  useEffect(() => { const timeout = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timeout); }, [load]);

  async function saveObservation() {
    if (!session?.access_token || !relationshipId || saving || !content.trim()) return;
    setSaving(true); setFeedback('');
    try {
      const input = { content, visibility, occurredAt: new Date(occurredAt).toISOString() };
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
      const start = new Date(startsAt).toISOString(); const end = new Date(endsAt).toISOString();
      if (editingAppointment) await rescheduleAppointment(session.access_token, relationshipId, editingAppointment, start, end);
      else await createAppointment(session.access_token, relationshipId, start, end);
      setEditingAppointment(null); setFeedback(editingAppointment ? 'Consulta reagendada.' : 'Consulta criada.');
      await load();
    } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível salvar a consulta.'); }
    finally { setSaving(false); }
  }

  function requestCancel(appointment: FollowUpAppointment) {
    Alert.alert('Cancelar consulta?', 'Esta ação ficará registrada no histórico.', [
      { text: 'Voltar', style: 'cancel' },
      { text: 'Cancelar consulta', style: 'destructive', onPress: () => void runCancel(appointment) },
    ]);
  }

  async function runCancel(appointment: FollowUpAppointment) {
    if (!session?.access_token || !relationshipId || saving) return;
    setSaving(true);
    try { await cancelProfessionalAppointment(session.access_token, relationshipId, appointment.id); setFeedback('Consulta cancelada.'); await load(); }
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
    try { await Linking.openURL(await getPatientDocumentUrl(session.access_token, document.id, false)); }
    catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível abrir o documento.'); }
  }

  if (loading) return <ProfessionalScreen><FeedbackState status="loading" title="Carregando acompanhamento" /></ProfessionalScreen>;
  if (error || !patient) return <ProfessionalScreen><FeedbackState status="error" title="Acompanhamento indisponível" description={error} /><Button minH="$touchTarget" onPress={() => router.back()}>Voltar</Button></ProfessionalScreen>;

  return (
    <ProfessionalScreen>
      <ProfessionalBrand />
      <Button self="flex-start" chromeless color="$brand" minH="$touchTarget" onPress={() => router.back()}>Voltar aos pacientes</Button>
      <AppHeader eyebrow="ACOMPANHAMENTO ATIVO" title={patient.patientName} description="Observações, agenda, histórico e materiais deste vínculo." />
      {feedback ? <Paragraph role="alert" color="$brand">{feedback}</Paragraph> : null}

      <AppCard title="Mensagem de aniversário" background="$surface" rounded="$panel">
        <YStack gap="$3"><Paragraph color="$muted">Opcional. Se não houver personalização, o paciente verá a mensagem padrão no aniversário.</Paragraph><TextArea aria-label="Mensagem de aniversário para o paciente" value={birthdayContent} onChangeText={setBirthdayContent} placeholder="Escreva uma mensagem acolhedora" maxLength={1000} minH={100} borderColor="$borderColor" /><BrandButton disabled={saving || !birthdayContent.trim()} onPress={() => void saveBirthday()}>{saving ? 'Salvando…' : 'Salvar mensagem'}</BrandButton></YStack>
      </AppCard>

      <AppCard title={editingObservation ? 'Corrigir observação' : 'Nova observação'} background="$surface" rounded="$panel">
        <YStack gap="$3">
          <SizableText color="$muted" size="$2">Observações são privadas por padrão.</SizableText>
          <TextArea aria-label="Conteúdo da observação" value={content} onChangeText={setContent} placeholder="Registre somente o necessário para o acompanhamento" minH={110} maxLength={5000} borderColor="$borderColor" />
          <AppInput label="Data e hora" value={occurredAt} onChangeText={setOccurredAt} placeholder="AAAA-MM-DDTHH:mm" />
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

      <AppCard title={editingAppointment ? 'Reagendar consulta' : 'Nova consulta'} background="$surface" rounded="$panel">
        <YStack gap="$3"><AppInput label="Início" value={startsAt} onChangeText={setStartsAt} placeholder="AAAA-MM-DDTHH:mm" /><AppInput label="Término" value={endsAt} onChangeText={setEndsAt} placeholder="AAAA-MM-DDTHH:mm" /><XStack gap="$2" flexWrap="wrap"><BrandButton disabled={saving} onPress={saveAppointment}>{editingAppointment ? 'Salvar reagendamento' : 'Criar consulta'}</BrandButton>{editingAppointment ? <Button minH="$touchTarget" onPress={() => setEditingAppointment(null)}>Cancelar edição</Button> : null}</XStack></YStack>
      </AppCard>

      <AppCard title="Agenda deste paciente" background="$surface" rounded="$panel">
        <YStack gap="$3">{appointments.length === 0 ? <Paragraph color="$muted">Nenhuma consulta agendada.</Paragraph> : appointments.map((item) => (
          <YStack key={item.id} gap="$2" p="$3" bg="$background" rounded="$control"><SizableText color="$color" fontWeight="700">{new Date(item.startsAt).toLocaleString('pt-BR')}</SizableText><Paragraph color="$muted">{appointmentStatus(item)}</Paragraph>{item.state === 'scheduled' ? <XStack gap="$2" flexWrap="wrap"><Button minH="$touchTarget" onPress={() => { setEditingAppointment(item.id); setStartsAt(localDateTime(new Date(item.startsAt))); setEndsAt(localDateTime(new Date(item.endsAt))); }}>Reagendar</Button><Button minH="$touchTarget" bg="$declinedBackground" color="$declinedColor" onPress={() => requestCancel(item)}>Cancelar</Button></XStack> : null}</YStack>
        ))}</YStack>
      </AppCard>

      <AppCard title="Materiais disponíveis" background="$surface" rounded="$panel">
        <YStack gap="$3">{materials.length === 0 ? <Paragraph color="$muted">Cadastre materiais na aba Materiais.</Paragraph> : materials.map((item) => <XStack key={item.id} gap="$3" items="center" flexWrap="wrap" p="$3" bg="$background" rounded="$control"><YStack flex={1} minW={180}><SizableText color="$color" fontWeight="700">{item.title}</SizableText><Paragraph color="$muted" size="$2">{item.kind}</Paragraph></YStack><Button minH="$touchTarget" disabled={saving} onPress={() => handleShare(item.id)}>Compartilhar</Button></XStack>)}</YStack>
      </AppCard>

      <AppCard title="Documentos enviados pelo paciente" background="$surface" rounded="$panel"><YStack gap="$3">{documents.length === 0 ? <Paragraph color="$muted">Nenhum PDF enviado ainda.</Paragraph> : documents.map((item) => <XStack key={item.id} gap="$3" items="center" flexWrap="wrap" p="$3" bg="$background" rounded="$control"><YStack flex={1} minW={180}><SizableText color="$color" fontWeight="700">{item.title}</SizableText><Paragraph color="$muted" size="$2">{new Date(item.createdAt).toLocaleString('pt-BR')}</Paragraph></YStack><Button minH="$touchTarget" onPress={() => void openDocument(item)}>Abrir PDF</Button></XStack>)}</YStack></AppCard>

      <AppCard title="Mural do paciente" background="$surface" rounded="$panel"><YStack gap="$3">{patientMessages.length === 0 ? <Paragraph color="$muted">Nenhum recado para a próxima sessão.</Paragraph> : patientMessages.map((item) => <YStack key={item.id} gap="$1" p="$3" bg="$background" rounded="$control"><Paragraph color="$color">{item.content}</Paragraph><Paragraph color="$muted" size="$2">{new Date(item.createdAt).toLocaleString('pt-BR')}</Paragraph></YStack>)}</YStack></AppCard>

      <AppCard title="Como o paciente está" background="$surface" rounded="$panel"><YStack gap="$3">{checkIns.length === 0 ? <Paragraph color="$muted">Nenhum check-in registrado.</Paragraph> : checkIns.map((item) => <YStack key={item.id} gap="$1" p="$3" bg="$background" rounded="$control"><SizableText color="$color" fontWeight="700">{item.feeling}</SizableText>{item.note ? <Paragraph color="$color">{item.note}</Paragraph> : null}<Paragraph color="$muted" size="$2">{new Date(item.createdAt).toLocaleString('pt-BR')}</Paragraph></YStack>)}</YStack></AppCard>

      <AppCard title="Histórico cronológico" background="$surface" rounded="$panel">
        <YStack gap="$3">{timeline.length === 0 ? <Paragraph color="$muted">Nenhum evento registrado.</Paragraph> : timeline.map((item) => <YStack key={`${item.type}-${item.id}`} pl="$3" borderLeftWidth={3} borderLeftColor="$brand"><SizableText color="$color" fontWeight="700">{item.label}</SizableText><Paragraph color="$muted" size="$2">{new Date(item.at).toLocaleString('pt-BR')}</Paragraph>{item.content ? <Paragraph color="$color">{item.content}</Paragraph> : null}</YStack>)}</YStack>
      </AppCard>
    </ProfessionalScreen>
  );
}
