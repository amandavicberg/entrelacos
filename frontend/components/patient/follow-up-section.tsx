import { Ionicons } from '@expo/vector-icons';
import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Button, Paragraph, SizableText, TextArea, useTheme, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { AppInput } from '@/components/app-input';
import { BrandButton } from '@/components/brand-button';
import { CancellationConfirmation } from '@/components/cancellation-confirmation';
import { FeedbackState } from '@/components/feedback-state';
import { PatientScreen } from '@/components/patient/patient-screen';
import { useAuth } from '@/contexts/auth-context';
import { openExternalResource } from '@/lib/open-external';
import { getMaterialUrl, listAppointments, listMaterials, listPatientObservations, listPatientRelationships, listTimeline, respondToAppointment, type FollowUpAppointment, type FollowUpMaterial, type FollowUpObservation, type TimelineItem } from '@/lib/api';

type Section = 'appointments' | 'observations' | 'timeline' | 'materials';
const titles: Record<Section, string> = { appointments: 'Minha agenda', observations: 'Orientações compartilhadas', timeline: 'Meu histórico', materials: 'Meus materiais' };
const materialTypes: Record<FollowUpMaterial['kind'], string> = { ebook: 'E-book', podcast: 'Podcast', video: 'Vídeo', pdf: 'PDF', audio: 'Áudio', other: 'Material' };
const materialIcons: Record<FollowUpMaterial['kind'], 'book-outline' | 'mic-outline' | 'videocam-outline' | 'document-text-outline' | 'musical-notes-outline' | 'folder-outline'> = {
  ebook: 'book-outline', podcast: 'mic-outline', video: 'videocam-outline', pdf: 'document-text-outline', audio: 'musical-notes-outline', other: 'folder-outline',
};

function normalize(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR');
}

export function PatientFollowUpSection({ section }: { section: Section }) {
  const { accessState, session } = useAuth();
  const theme = useTheme();
  const hasLoaded = useRef(false);
  const [appointments, setAppointments] = useState<FollowUpAppointment[]>([]);
  const [observations, setObservations] = useState<FollowUpObservation[]>([]);
  const [materials, setMaterials] = useState<FollowUpMaterial[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [materialQuery, setMaterialQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    if (!hasLoaded.current) setLoading(true);
    setError('');
    try {
      if (section === 'appointments') setAppointments(await listAppointments(session.access_token, undefined, true));
      if (section === 'observations') setObservations(await listPatientObservations(session.access_token));
      if (section === 'materials') setMaterials((await listMaterials(session.access_token, true)).materials);
      if (section === 'timeline') {
        const relationships = await listPatientRelationships(session.access_token);
        const groups = await Promise.all(relationships.map((item) => listTimeline(session.access_token, item.relationshipId, true)));
        setTimeline(groups.flat().sort((a, b) => Date.parse(b.at) - Date.parse(a.at)));
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar este conteúdo.');
    } finally { hasLoaded.current = true; setLoading(false); }
  }, [section, session]);

  useFocusEffect(useCallback(() => {
    void load();
    const timer = setInterval(() => {
      if (!session?.access_token) return;
      if (section === 'materials') void listMaterials(session.access_token, true).then((result) => setMaterials(result.materials)).catch(() => {});
      if (section === 'appointments') void listAppointments(session.access_token, undefined, true).then(setAppointments).catch(() => {});
    }, 30_000);
    return () => clearInterval(timer);
  }, [load, section, session]));

  if (accessState !== 'patient-active') return <Redirect href={accessState === 'patient-pending' ? '/(patient)/pending' : '/'} />;

  async function respond(item: FollowUpAppointment, answer: 'confirmed' | 'cancelled') {
    if (!session?.access_token || submitting) return;
    setSubmitting(item.id); setFeedback('');
    try {
      await respondToAppointment(session.access_token, item.id, answer, reasons[item.id]?.trim() || undefined);
      setCancelId(null);
      setFeedback(answer === 'confirmed' ? 'Consulta confirmada.' : 'Consulta cancelada.');
      await load();
    } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível responder.'); }
    finally { setSubmitting(null); }
  }

  async function openMaterial(item: FollowUpMaterial) {
    if (!session?.access_token) return;
    setFeedback('');
    try { await openExternalResource(() => getMaterialUrl(session.access_token, item.id, true)); }
    catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Material indisponível.'); }
  }

  const materialResults = materials.filter((item) => normalize(`${item.title} ${item.description ?? ''}`).includes(normalize(materialQuery.trim())));
  const empty = section === 'appointments' ? appointments.length === 0 : section === 'observations' ? observations.length === 0 : section === 'materials' ? materials.length === 0 : timeline.length === 0;
  const blockingError = Boolean(error) && !(section === 'materials' && materials.length > 0);
  const description = section === 'materials' ? 'Conteúdos selecionados pelo seu profissional para este acompanhamento.'
    : section === 'observations' ? 'Orientações para consultar sempre que precisar.'
      : section === 'timeline' ? 'Uma visão dos registros e acontecimentos do acompanhamento.'
        : 'Consulte e responda aos seus agendamentos.';

  return <PatientScreen title={titles[section]} description={description} backToSpace={section !== 'materials'}>
    {feedback ? <AppCard p="$3" background="$accentSoft" borderColor="$logoBorder"><Paragraph role="alert" color="$color">{feedback}</Paragraph></AppCard> : null}
    {section === 'materials' ? <AppCard p="$5">
      <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
        <YStack gap="$1"><SizableText color="$color" fontWeight="700" fontSize={18}>Compartilhados com você</SizableText><Paragraph color="$muted" size="$2">Cada material aparece depois que o profissional o envia para seu vínculo.</Paragraph></YStack>
        {!loading ? <SizableText color="$accentText" bg="$accentSoft" px="$3" py="$1" rounded="$12" size="$2" fontWeight="700">{materials.length} {materials.length === 1 ? 'material' : 'materiais'}</SizableText> : null}
      </XStack>
      <AppInput label="Buscar material" placeholder="Busque por título ou descrição" value={materialQuery} onChangeText={setMaterialQuery} />
      <Button self="flex-start" minH="$touchTarget" bg="$soft" color="$brand" onPress={() => void load()}>Atualizar materiais</Button>
    </AppCard> : null}
    {loading ? <FeedbackState status="loading" title={section === 'materials' ? 'Buscando materiais' : undefined} description={section === 'materials' ? 'A primeira conexão pode levar alguns instantes.' : undefined} /> : null}
    {!loading && error ? <AppCard p="$4" background="$pendingBackground" borderColor="$logoBorder">
      <Paragraph role="alert" color="$pendingColor">{blockingError ? error : 'Não foi possível atualizar os materiais. A lista anterior permanece disponível.'}</Paragraph>
      <Button self="flex-start" minH="$touchTarget" onPress={() => void load()}>Tentar novamente</Button>
    </AppCard> : null}
    {!loading && !blockingError && empty ? <FeedbackState status="empty"
      title={section === 'materials' ? 'Nenhum material compartilhado' : undefined}
      description={section === 'materials' ? 'Quando seu profissional compartilhar um conteúdo, ele aparecerá aqui.' : undefined} /> : null}

    {!loading && !blockingError && section === 'materials' && materials.length > 0 && materialResults.length === 0 ? <AppCard p="$5"><FeedbackState status="empty" title="Nenhum resultado" description="Tente buscar por outro termo." /><Button self="flex-start" minH="$touchTarget" onPress={() => setMaterialQuery('')}>Limpar busca</Button></AppCard> : null}
    {!loading && !blockingError && section === 'materials' ? materialResults.map((item) => <AppCard key={item.shareId ?? item.id} p="$5">
      <XStack items="flex-start" gap="$3"><YStack width={50} height={50} items="center" justify="center" bg="$soft" rounded="$control"><Ionicons name={materialIcons[item.kind]} size={24} color={theme.brand.val} accessible={false} /></YStack><YStack flex={1} minW={0} gap="$1"><SizableText color="$color" fontWeight="700" fontSize={17}>{item.title}</SizableText><Paragraph color="$accentText" size="$2">{materialTypes[item.kind]} · Compartilhado com você</Paragraph></YStack></XStack>
      {item.description ? <Paragraph color="$muted">{item.description}</Paragraph> : null}
      <Button self="flex-start" minH="$touchTarget" bg="$soft" color="$brand" onPress={() => void openMaterial(item)}>Abrir material</Button>
    </AppCard>) : null}
    {!loading && !blockingError && section === 'observations' ? observations.map((item) => <AppCard key={item.id} p="$5"><XStack items="center" gap="$2"><Ionicons name="reader-outline" size={21} color={theme.brand.val} accessible={false} /><SizableText color="$color" fontWeight="700">Orientação</SizableText></XStack><Paragraph color="$color">{item.content}</Paragraph><Paragraph color="$muted" size="$2">{new Date(item.occurredAt).toLocaleString('pt-BR')}</Paragraph></AppCard>) : null}
    {!loading && !blockingError && section === 'timeline' ? timeline.map((item) => <AppCard key={`${item.type}-${item.id}`} p="$5" borderLeftWidth={4} borderLeftColor="$accent"><SizableText color="$color" fontWeight="700">{item.label}</SizableText><Paragraph color="$muted" size="$2">{new Date(item.at).toLocaleString('pt-BR')}</Paragraph>{item.content ? <Paragraph color="$color">{item.content}</Paragraph> : null}</AppCard>) : null}
    {!loading && !blockingError && section === 'appointments' ? appointments.map((item) => <AppCard key={item.id} p="$5"><SizableText color="$color" fontWeight="700">{new Date(item.startsAt).toLocaleString('pt-BR')}</SizableText><Paragraph color="$muted">{item.state === 'cancelled' ? 'Cancelada' : item.patientResponse === 'confirmed' ? 'Confirmada' : 'Aguardando sua confirmação'}</Paragraph>{item.state === 'scheduled' && item.patientResponse === 'pending' ? <YStack gap="$2"><TextArea aria-label="Motivo opcional para cancelamento" placeholder="Motivo do cancelamento (opcional)" maxLength={500} value={reasons[item.id] ?? ''} onChangeText={(value) => setReasons((current) => ({ ...current, [item.id]: value }))} borderColor="$borderColor" /><XStack gap="$2" flexWrap="wrap"><BrandButton disabled={Boolean(submitting)} onPress={() => void respond(item, 'confirmed')}>Confirmar</BrandButton><Button minH="$touchTarget" bg="$declinedBackground" color="$declinedColor" disabled={Boolean(submitting)} onPress={() => setCancelId(item.id)}>Cancelar</Button></XStack>{cancelId === item.id ? <CancellationConfirmation busy={Boolean(submitting)} onKeep={() => setCancelId(null)} onConfirm={() => void respond(item, 'cancelled')} /> : null}</YStack> : null}</AppCard>) : null}
  </PatientScreen>;
}
