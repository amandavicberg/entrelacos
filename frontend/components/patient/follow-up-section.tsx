import * as Linking from 'expo-linking';
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { Button, H2, Paragraph, SizableText, TextArea, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { AppScreen } from '@/components/app-screen';
import { FeedbackState } from '@/components/feedback-state';
import { useAuth } from '@/contexts/auth-context';
import { getMaterialUrl, listAppointments, listMaterials, listPatientObservations, listPatientRelationships, listTimeline, respondToAppointment, type FollowUpAppointment, type FollowUpMaterial, type FollowUpObservation, type TimelineItem } from '@/lib/api';

type Section = 'appointments' | 'observations' | 'timeline' | 'materials';
const titles: Record<Section, string> = { appointments: 'Minha agenda', observations: 'Orientações compartilhadas', timeline: 'Meu histórico', materials: 'Meus materiais' };

export function PatientFollowUpSection({ section }: { section: Section }) {
  const { accessState, session } = useAuth(); const router = useRouter();
  const [appointments, setAppointments] = useState<FollowUpAppointment[]>([]); const [observations, setObservations] = useState<FollowUpObservation[]>([]);
  const [materials, setMaterials] = useState<FollowUpMaterial[]>([]); const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [feedback, setFeedback] = useState(''); const [submitting, setSubmitting] = useState<string | null>(null); const [reasons, setReasons] = useState<Record<string, string>>({});
  const load = useCallback(async () => {
    if (!session?.access_token) return; await Promise.resolve(); setLoading(true); setError('');
    try {
      if (section === 'appointments') setAppointments(await listAppointments(session.access_token, undefined, true));
      if (section === 'observations') setObservations(await listPatientObservations(session.access_token));
      if (section === 'materials') setMaterials((await listMaterials(session.access_token, true)).materials);
      if (section === 'timeline') { const relationships = await listPatientRelationships(session.access_token); const groups = await Promise.all(relationships.map((item) => listTimeline(session.access_token, item.relationshipId, true))); setTimeline(groups.flat().sort((a, b) => Date.parse(b.at) - Date.parse(a.at))); }
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar este conteúdo.'); }
    finally { setLoading(false); }
  }, [section, session]);
  useEffect(() => { const timeout = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timeout); }, [load]);

  if (accessState !== 'patient-active') return <Redirect href={accessState === 'patient-pending' ? '/(patient)/pending' : '/'} />;
  async function respond(item: FollowUpAppointment, response: 'confirmed' | 'cancelled') { if (!session?.access_token || submitting) return; setSubmitting(item.id); setFeedback(''); try { await respondToAppointment(session.access_token, item.id, response, reasons[item.id]?.trim() || undefined); setFeedback(response === 'confirmed' ? 'Consulta confirmada.' : 'Consulta cancelada.'); await load(); } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível responder.'); } finally { setSubmitting(null); } }
  function confirmCancellation(item: FollowUpAppointment) { Alert.alert('Cancelar consulta?', 'O profissional verá o cancelamento e o motivo informado, se houver.', [{ text: 'Voltar', style: 'cancel' }, { text: 'Cancelar consulta', style: 'destructive', onPress: () => void respond(item, 'cancelled') }]); }
  async function openMaterial(item: FollowUpMaterial) { if (!session?.access_token) return; try { await Linking.openURL(await getMaterialUrl(session.access_token, item.id, true)); } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Material indisponível.'); } }

  const empty = section === 'appointments' ? appointments.length === 0 : section === 'observations' ? observations.length === 0 : section === 'materials' ? materials.length === 0 : timeline.length === 0;
  return <AppScreen><ScrollView contentContainerStyle={{ paddingBottom: 32 }}><YStack gap="$4" maxW={760} width="100%" self="center"><Button self="flex-start" chromeless color="$brand" minH="$touchTarget" onPress={() => router.back()}>Voltar</Button><H2 color="$color">{titles[section]}</H2><Paragraph color="$muted">Conteúdo disponibilizado somente nos seus acompanhamentos ativos.</Paragraph>{feedback ? <Paragraph role="alert" color="$brand">{feedback}</Paragraph> : null}{loading ? <FeedbackState status="loading" /> : null}{!loading && error ? <YStack><FeedbackState status="error" description={error} /><Button minH="$touchTarget" onPress={load}>Tentar novamente</Button></YStack> : null}{!loading && !error && empty ? <FeedbackState status="empty" /> : null}
    {!loading && !error && section === 'appointments' ? appointments.map((item) => <AppCard key={item.id} background="$surface"><SizableText color="$color" fontWeight="700">{new Date(item.startsAt).toLocaleString('pt-BR')}</SizableText><Paragraph color="$muted">{item.state === 'cancelled' ? 'Cancelada' : item.patientResponse === 'confirmed' ? 'Confirmada' : 'Aguardando sua confirmação'}</Paragraph>{item.state === 'scheduled' && item.patientResponse === 'pending' ? <YStack gap="$2"><TextArea aria-label="Motivo opcional para cancelamento" placeholder="Motivo do cancelamento (opcional)" maxLength={500} value={reasons[item.id] ?? ''} onChangeText={(value) => setReasons((current) => ({ ...current, [item.id]: value }))} borderColor="$borderColor" /><XStack gap="$2" flexWrap="wrap"><Button minH="$touchTarget" bg="$brand" color="$brandContrast" disabled={Boolean(submitting)} onPress={() => respond(item, 'confirmed')}>Confirmar</Button><Button minH="$touchTarget" bg="$declinedBackground" color="$declinedColor" disabled={Boolean(submitting)} onPress={() => confirmCancellation(item)}>Cancelar</Button></XStack></YStack> : null}</AppCard>) : null}
    {!loading && !error && section === 'observations' ? observations.map((item) => <AppCard key={item.id} background="$surface"><Paragraph color="$color">{item.content}</Paragraph><Paragraph color="$muted" size="$2">{new Date(item.occurredAt).toLocaleString('pt-BR')}</Paragraph></AppCard>) : null}
    {!loading && !error && section === 'materials' ? materials.map((item) => <AppCard key={item.id} background="$surface"><SizableText color="$color" fontWeight="700">{item.title}</SizableText>{item.description ? <Paragraph color="$muted">{item.description}</Paragraph> : null}<Button self="flex-start" minH="$touchTarget" onPress={() => openMaterial(item)}>Abrir material</Button></AppCard>) : null}
    {!loading && !error && section === 'timeline' ? timeline.map((item) => <YStack key={`${item.type}-${item.id}`} pl="$3" py="$2" borderLeftWidth={3} borderLeftColor="$brand"><SizableText color="$color" fontWeight="700">{item.label}</SizableText><Paragraph color="$muted" size="$2">{new Date(item.at).toLocaleString('pt-BR')}</Paragraph>{item.content ? <Paragraph color="$color">{item.content}</Paragraph> : null}</YStack>) : null}
  </YStack></ScrollView></AppScreen>;
}
