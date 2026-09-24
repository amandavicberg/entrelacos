import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { Button, Paragraph, SizableText, TextArea, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { AppInput } from '@/components/app-input';
import { AppScreen } from '@/components/app-screen';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { useAuth } from '@/contexts/auth-context';
import { confirmPatientDocumentUpload, createPatientCheckIn, createPatientMessage, getPatientDocumentUrl, listPatientCheckIns, listPatientDocuments, listPatientMessages, listPatientRelationships, preparePatientDocumentUpload, uploadPatientDocument, type PatientCheckIn, type PatientDocument, type PatientMessage, type PatientRelationship } from '@/lib/api';

type Section = 'documents' | 'messages' | 'check-ins';
const titles: Record<Section, { title: string; description: string }> = {
  documents: { title: 'Meus documentos', description: 'Envie PDFs privados para o profissional do seu acompanhamento.' },
  messages: { title: 'Mural para a próxima sessão', description: 'Deixe recados importantes. Este espaço não funciona como chat e não tem resposta imediata.' },
  'check-ins': { title: 'Como estou me sentindo', description: 'Registre como está hoje para apoiar a próxima conversa.' },
};
const feelingLabels: { value: PatientCheckIn['feeling']; label: string }[] = [
  { value: 'calm', label: 'Tranquilo(a)' }, { value: 'happy', label: 'Feliz' }, { value: 'tired', label: 'Cansado(a)' }, { value: 'anxious', label: 'Ansioso(a)' }, { value: 'sad', label: 'Triste' }, { value: 'other', label: 'Outro' },
];

export function PatientSpaceSection({ section }: { section: Section }) {
  const { accessState, session } = useAuth(); const router = useRouter();
  const [relationships, setRelationships] = useState<PatientRelationship[]>([]); const [selectedRelationship, setSelectedRelationship] = useState('');
  const [documents, setDocuments] = useState<PatientDocument[]>([]); const [messages, setMessages] = useState<PatientMessage[]>([]); const [checkIns, setCheckIns] = useState<PatientCheckIn[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState(''); const [saving, setSaving] = useState(false); const [feedback, setFeedback] = useState('');
  const [content, setContent] = useState(''); const [feeling, setFeeling] = useState<PatientCheckIn['feeling']>('calm');
  const [title, setTitle] = useState(''); const [kind, setKind] = useState<PatientDocument['kind']>('exam');

  const load = useCallback(async () => {
    if (!session?.access_token) return; setLoading(true); setError('');
    try {
      const relationData = await listPatientRelationships(session.access_token); setRelationships(relationData);
      const activeId = selectedRelationship || relationData[0]?.relationshipId || ''; if (!selectedRelationship) setSelectedRelationship(activeId);
      if (section === 'documents') setDocuments(await listPatientDocuments(session.access_token));
      if (section === 'messages') setMessages(await listPatientMessages(session.access_token));
      if (section === 'check-ins') setCheckIns(await listPatientCheckIns(session.access_token));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar este espaço.'); }
    finally { setLoading(false); }
  }, [section, selectedRelationship, session?.access_token]);
  useEffect(() => { const timer = setTimeout(() => void load(), 0); return () => clearTimeout(timer); }, [load]);
  if (accessState !== 'patient-active') return <Redirect href={accessState === 'patient-pending' ? '/(patient)/pending' : '/'} />;

  async function sendMessage() { if (!session?.access_token || !selectedRelationship || !content.trim() || saving) return; setSaving(true); setFeedback(''); try { await createPatientMessage(session.access_token, selectedRelationship, content); setContent(''); setFeedback('Recado adicionado ao mural.'); await load(); } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível publicar o recado.'); } finally { setSaving(false); } }
  async function saveCheckIn() { if (!session?.access_token || !selectedRelationship || saving) return; setSaving(true); setFeedback(''); try { await createPatientCheckIn(session.access_token, selectedRelationship, feeling, content.trim() || undefined); setContent(''); setFeedback('Check-in registrado para seu acompanhamento.'); await load(); } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível registrar o check-in.'); } finally { setSaving(false); } }
  async function pickDocument() {
    if (!session?.access_token || !selectedRelationship || saving) return;
    const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true, multiple: false });
    if (result.canceled) return; const file = result.assets[0]; const sizeBytes = file.size ?? 0;
    if (file.mimeType !== 'application/pdf' || sizeBytes < 1 || sizeBytes > 10 * 1024 * 1024) { setFeedback('Selecione um PDF de até 10 MB.'); return; }
    setSaving(true); setFeedback('');
    try {
      const upload = await preparePatientDocumentUpload(session.access_token, { relationshipId: selectedRelationship, fileName: file.name, mimeType: file.mimeType, sizeBytes });
      await uploadPatientDocument(upload.storagePath, upload.token, file.uri, file.mimeType);
      await confirmPatientDocumentUpload(session.access_token, { relationshipId: selectedRelationship, documentId: upload.documentId, storagePath: upload.storagePath, fileName: file.name, mimeType: file.mimeType, sizeBytes, title: title.trim() || file.name.replace(/\.pdf$/i, ''), kind });
      setTitle(''); setFeedback('Documento enviado com segurança.'); await load();
    } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível enviar o documento.'); } finally { setSaving(false); }
  }
  async function openDocument(document: PatientDocument) { if (!session?.access_token) return; try { await Linking.openURL(await getPatientDocumentUrl(session.access_token, document.id)); } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Documento indisponível.'); } }
  const empty = section === 'documents' ? documents.length === 0 : section === 'messages' ? messages.length === 0 : checkIns.length === 0;

  return <AppScreen><ScrollView contentContainerStyle={{ paddingBottom: 32 }}><YStack gap="$4" maxW={760} width="100%" self="center"><Button self="flex-start" chromeless color="$brand" minH="$touchTarget" onPress={() => router.back()}>Voltar</Button><AppHeader title={titles[section].title} description={titles[section].description} />
    {relationships.length > 1 ? <YStack gap="$2"><SizableText color="$color" fontWeight="700">Acompanhamento</SizableText><XStack gap="$2" flexWrap="wrap">{relationships.map((item) => <Button key={item.relationshipId} minH="$touchTarget" bg={selectedRelationship === item.relationshipId ? '$brand' : '$soft'} color={selectedRelationship === item.relationshipId ? '$brandContrast' : '$color'} onPress={() => setSelectedRelationship(item.relationshipId)}>{item.professionalName}</Button>)}</XStack></YStack> : null}
    {section === 'documents' ? <AppCard title="Enviar documento"><AppInput label="Título (opcional)" value={title} onChangeText={setTitle} placeholder="Ex.: Resultado de exame" /><XStack gap="$2" flexWrap="wrap">{(['exam', 'report', 'diagnosis', 'other'] as const).map((value) => <Button key={value} minH="$touchTarget" bg={kind === value ? '$brand' : '$soft'} color={kind === value ? '$brandContrast' : '$color'} onPress={() => setKind(value)}>{({ exam: 'Exame', report: 'Laudo', diagnosis: 'Diagnóstico', other: 'Outro' })[value]}</Button>)}</XStack><Paragraph color="$muted" size="$2">Somente PDF, até 10 MB. O documento será visível apenas para o profissional deste acompanhamento.</Paragraph><BrandButton disabled={saving || !selectedRelationship} onPress={() => void pickDocument()}>{saving ? 'Enviando…' : 'Selecionar PDF'}</BrandButton></AppCard> : null}
    {section === 'messages' ? <AppCard title="Novo recado"><TextArea aria-label="Recado para a próxima sessão" placeholder="O que você gostaria que a profissional soubesse?" value={content} onChangeText={setContent} maxLength={2000} minH={120} borderColor="$borderColor" /><BrandButton disabled={saving || !selectedRelationship || !content.trim()} onPress={() => void sendMessage()}>{saving ? 'Publicando…' : 'Adicionar ao mural'}</BrandButton></AppCard> : null}
    {section === 'check-ins' ? <AppCard title="Meu check-in"><XStack gap="$2" flexWrap="wrap" accessibilityRole="radiogroup">{feelingLabels.map((item) => <Button key={item.value} minH="$touchTarget" bg={feeling === item.value ? '$brand' : '$soft'} color={feeling === item.value ? '$brandContrast' : '$color'} accessibilityRole="radio" accessibilityState={{ selected: feeling === item.value }} onPress={() => setFeeling(item.value)}>{item.label}</Button>)}</XStack><TextArea aria-label="Anotação opcional do check-in" placeholder="Quer deixar uma anotação?" value={content} onChangeText={setContent} maxLength={500} minH={96} borderColor="$borderColor" /><BrandButton disabled={saving || !selectedRelationship} onPress={() => void saveCheckIn()}>{saving ? 'Salvando…' : 'Registrar como estou'}</BrandButton></AppCard> : null}
    {feedback ? <Paragraph role="alert" color="$brand">{feedback}</Paragraph> : null}{loading ? <FeedbackState status="loading" /> : null}{!loading && error ? <YStack><FeedbackState status="error" description={error} /><Button minH="$touchTarget" onPress={() => void load()}>Tentar novamente</Button></YStack> : null}{!loading && !error && empty ? <FeedbackState status="empty" /> : null}
    {!loading && !error && section === 'documents' ? documents.map((item) => <AppCard key={item.id}><SizableText color="$color" fontWeight="700">{item.title}</SizableText><Paragraph color="$muted" size="$2">{new Date(item.createdAt).toLocaleString('pt-BR')} · {(item.sizeBytes / 1024 / 1024).toFixed(1)} MB</Paragraph><Button self="flex-start" minH="$touchTarget" onPress={() => void openDocument(item)}>Abrir PDF</Button></AppCard>) : null}
    {!loading && !error && section === 'messages' ? messages.map((item) => <AppCard key={item.id}><Paragraph color="$color">{item.content}</Paragraph><Paragraph color="$muted" size="$2">{new Date(item.createdAt).toLocaleString('pt-BR')}</Paragraph></AppCard>) : null}
    {!loading && !error && section === 'check-ins' ? checkIns.map((item) => <AppCard key={item.id}><SizableText color="$color" fontWeight="700">{feelingLabels.find((label) => label.value === item.feeling)?.label}</SizableText>{item.note ? <Paragraph color="$color">{item.note}</Paragraph> : null}<Paragraph color="$muted" size="$2">{new Date(item.createdAt).toLocaleString('pt-BR')}</Paragraph></AppCard>) : null}
  </YStack></ScrollView></AppScreen>;
}
