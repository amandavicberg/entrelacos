import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Button, Paragraph, SizableText, TextArea, useTheme, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { AppInput } from '@/components/app-input';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { PatientScreen } from '@/components/patient/patient-screen';
import { useAuth } from '@/contexts/auth-context';
import { openExternalResource } from '@/lib/open-external';
import { confirmPatientDocumentUpload, createPatientCheckIn, createPatientMessage, getPatientDocumentUrl, listPatientCheckIns, listPatientDocuments, listPatientMessages, listPatientRelationships, preparePatientDocumentUpload, uploadPatientDocument, type PatientCheckIn, type PatientDocument, type PatientMessage, type PatientRelationship } from '@/lib/api';

type Section = 'documents' | 'messages' | 'check-ins';
const titles: Record<Section, { title: string; description: string }> = {
  documents: { title: 'Meus documentos', description: 'Envie PDFs privados para o profissional do seu acompanhamento.' },
  messages: { title: 'Mural para a sessão', description: 'Guarde assuntos para a próxima conversa. Este espaço não é um chat.' },
  'check-ins': { title: 'Como estou me sentindo', description: 'Registre seu momento para apoiar a próxima conversa.' },
};
const feelingLabels: { value: PatientCheckIn['feeling']; label: string }[] = [
  { value: 'calm', label: 'Tranquilo(a)' }, { value: 'happy', label: 'Feliz' },
  { value: 'tired', label: 'Cansado(a)' }, { value: 'anxious', label: 'Ansioso(a)' },
  { value: 'sad', label: 'Triste' }, { value: 'other', label: 'Outro' },
];
const documentKinds: { value: PatientDocument['kind']; label: string }[] = [
  { value: 'exam', label: 'Exame' }, { value: 'report', label: 'Laudo' },
  { value: 'diagnosis', label: 'Diagnóstico' }, { value: 'other', label: 'Outro' },
];

export function PatientSpaceSection({ section }: { section: Section }) {
  const { accessState, session } = useAuth();
  const theme = useTheme();
  const hasLoaded = useRef(false);
  const [relationships, setRelationships] = useState<PatientRelationship[]>([]);
  const [selectedRelationship, setSelectedRelationship] = useState('');
  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [messages, setMessages] = useState<PatientMessage[]>([]);
  const [checkIns, setCheckIns] = useState<PatientCheckIn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackIsError, setFeedbackIsError] = useState(false);
  const [content, setContent] = useState('');
  const [feeling, setFeeling] = useState<PatientCheckIn['feeling']>('calm');
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<PatientDocument['kind']>('exam');

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    if (!hasLoaded.current) setLoading(true);
    setError('');
    try {
      const relationData = await listPatientRelationships(session.access_token);
      setRelationships(relationData);
      setSelectedRelationship((current) => relationData.some((item) => item.relationshipId === current)
        ? current : relationData[0]?.relationshipId ?? '');
      if (section === 'documents') setDocuments(await listPatientDocuments(session.access_token));
      if (section === 'messages') setMessages(await listPatientMessages(session.access_token));
      if (section === 'check-ins') setCheckIns(await listPatientCheckIns(session.access_token));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar este espaço.'); }
    finally { hasLoaded.current = true; setLoading(false); }
  }, [section, session]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  if (accessState !== 'patient-active') return <Redirect href={accessState === 'patient-pending' ? '/(patient)/pending' : '/'} />;

  async function sendMessage() {
    if (!session?.access_token || !selectedRelationship || !content.trim() || saving) return;
    setSaving(true); setFeedback('');
    try {
      await createPatientMessage(session.access_token, selectedRelationship, content.trim());
      setContent(''); setFeedbackIsError(false); setFeedback('Recado adicionado ao mural.');
      await load();
    } catch (cause) { setFeedbackIsError(true); setFeedback(cause instanceof Error ? cause.message : 'Não foi possível publicar o recado.'); }
    finally { setSaving(false); }
  }

  async function saveCheckIn() {
    if (!session?.access_token || !selectedRelationship || saving) return;
    setSaving(true); setFeedback('');
    try {
      await createPatientCheckIn(session.access_token, selectedRelationship, feeling, content.trim() || undefined);
      setContent(''); setFeedbackIsError(false); setFeedback('Check-in registrado para seu acompanhamento.');
      await load();
    } catch (cause) { setFeedbackIsError(true); setFeedback(cause instanceof Error ? cause.message : 'Não foi possível registrar o check-in.'); }
    finally { setSaving(false); }
  }

  async function pickDocument() {
    if (!session?.access_token || !selectedRelationship || saving) return;
    setSaving(true); setFeedback('');
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const file = result.assets[0];
      const sizeBytes = file.size ?? 0;
      const mimeType = file.mimeType === 'application/pdf' || (!file.mimeType && /\.pdf$/i.test(file.name)) ? 'application/pdf' : null;
      if (!mimeType || sizeBytes < 1 || sizeBytes > 10 * 1024 * 1024) {
        setFeedbackIsError(true); setFeedback('Selecione um PDF de até 10 MB.'); return;
      }
      const upload = await preparePatientDocumentUpload(session.access_token, { relationshipId: selectedRelationship, fileName: file.name, mimeType, sizeBytes });
      await uploadPatientDocument(upload.storagePath, upload.token, file.uri, mimeType);
      await confirmPatientDocumentUpload(session.access_token, { relationshipId: selectedRelationship, documentId: upload.documentId, storagePath: upload.storagePath, fileName: file.name, mimeType, sizeBytes, title: title.trim() || file.name.replace(/\.pdf$/i, ''), kind });
      setTitle(''); setFeedbackIsError(false); setFeedback('PDF enviado. Ele está disponível para o profissional deste acompanhamento.');
      await load();
    } catch (cause) { setFeedbackIsError(true); setFeedback(cause instanceof Error ? cause.message : 'Não foi possível enviar o documento.'); }
    finally { setSaving(false); }
  }

  async function openDocument(document: PatientDocument) {
    if (!session?.access_token) return;
    try { await openExternalResource(() => getPatientDocumentUrl(session.access_token, document.id)); }
    catch (cause) { setFeedbackIsError(true); setFeedback(cause instanceof Error ? cause.message : 'Documento indisponível.'); }
  }

  const visibleDocuments = documents.filter((item) => item.relationshipId === selectedRelationship);
  const visibleMessages = messages.filter((item) => item.relationshipId === selectedRelationship);
  const visibleCheckIns = checkIns.filter((item) => item.relationshipId === selectedRelationship);
  const items = section === 'documents' ? visibleDocuments : section === 'messages' ? visibleMessages : visibleCheckIns;
  const countLabel = section === 'documents' ? items.length === 1 ? 'documento enviado' : 'documentos enviados'
    : section === 'messages' ? items.length === 1 ? 'recado registrado' : 'recados registrados'
      : items.length === 1 ? 'check-in registrado' : 'check-ins registrados';
  const emptyTitle = section === 'documents' ? 'Nenhum documento enviado' : section === 'messages' ? 'Nenhum recado por aqui' : 'Nenhum check-in ainda';
  const emptyDescription = section === 'documents' ? 'Seu primeiro PDF aparecerá aqui depois do envio.'
    : section === 'messages' ? 'Os assuntos que você registrar aparecerão aqui.'
      : 'Seus registros aparecerão aqui depois do primeiro check-in.';

  return <PatientScreen title={titles[section].title} description={titles[section].description} backToSpace>
    {relationships.length > 1 ? <AppCard p="$4"><SizableText color="$color" fontWeight="700">Acompanhamento</SizableText><XStack gap="$2" flexWrap="wrap">{relationships.map((item) => <Button key={item.relationshipId} minH="$touchTarget" bg={selectedRelationship === item.relationshipId ? '$brand' : '$soft'} color={selectedRelationship === item.relationshipId ? '$brandContrast' : '$color'} onPress={() => setSelectedRelationship(item.relationshipId)}>{item.professionalName}</Button>)}</XStack></AppCard> : null}

    {section === 'documents' ? <AppCard p="$5">
      <XStack items="center" gap="$3"><YStack width={48} height={48} items="center" justify="center" bg="$accentSoft" rounded="$control"><Ionicons name="document-attach-outline" size={24} color={theme.accentText.val} accessible={false} /></YStack><YStack flex={1} gap="$1"><SizableText color="$color" fontWeight="700" fontSize={18}>Enviar PDF</SizableText><Paragraph color="$muted" size="$2">Seu profissional poderá abrir o arquivo neste vínculo.</Paragraph></YStack></XStack>
      <AppInput label="Título (opcional)" value={title} onChangeText={setTitle} placeholder="Ex.: Resultado de exame" maxLength={160} />
      <YStack gap="$2"><SizableText color="$color" fontWeight="700">Categoria</SizableText><XStack gap="$2" flexWrap="wrap">{documentKinds.map((item) => <Button key={item.value} minH="$touchTarget" bg={kind === item.value ? '$brand' : '$soft'} color={kind === item.value ? '$brandContrast' : '$brand'} borderWidth={1} borderColor={kind === item.value ? '$brand' : '$borderColor'} aria-pressed={kind === item.value} onPress={() => setKind(item.value)}>{item.label}</Button>)}</XStack></YStack>
      <Paragraph color="$muted" size="$2">Somente PDF, até 10 MB. O envio começa depois que você escolher o arquivo.</Paragraph>
      <BrandButton self="flex-start" disabled={saving || !selectedRelationship} onPress={() => void pickDocument()}>{saving ? 'Enviando PDF…' : 'Selecionar e enviar PDF'}</BrandButton>
    </AppCard> : null}

    {section === 'messages' ? <AppCard p="$5">
      <SizableText color="$color" fontWeight="700" fontSize={18}>Novo recado</SizableText>
      <Paragraph color="$muted" size="$2">Anote um assunto para a próxima sessão. Não há resposta em tempo real.</Paragraph>
      <TextArea aria-label="Recado para a próxima sessão" placeholder="O que você gostaria de conversar?" value={content} onChangeText={setContent} maxLength={2000} minH={130} borderColor="$borderColor" />
      <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap"><Paragraph color="$muted" size="$2">{content.length}/2000 caracteres</Paragraph><BrandButton disabled={saving || !selectedRelationship || !content.trim()} onPress={() => void sendMessage()}>{saving ? 'Salvando…' : 'Adicionar ao mural'}</BrandButton></XStack>
    </AppCard> : null}

    {section === 'check-ins' ? <AppCard p="$5">
      <SizableText color="$color" fontWeight="700" fontSize={18}>Meu check-in</SizableText>
      <Paragraph color="$muted" size="$2">Escolha uma palavra que melhor descreve seu momento.</Paragraph>
      <XStack gap="$2" flexWrap="wrap" accessibilityRole="radiogroup">{feelingLabels.map((item) => <Button key={item.value} minH="$touchTarget" bg={feeling === item.value ? '$brand' : '$soft'} color={feeling === item.value ? '$brandContrast' : '$brand'} borderWidth={1} borderColor={feeling === item.value ? '$brand' : '$borderColor'} accessibilityRole="radio" accessibilityState={{ selected: feeling === item.value }} onPress={() => setFeeling(item.value)}>{item.label}</Button>)}</XStack>
      <TextArea aria-label="Anotação opcional do check-in" placeholder="Quer deixar uma anotação?" value={content} onChangeText={setContent} maxLength={500} minH={100} borderColor="$borderColor" />
      <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap"><Paragraph color="$muted" size="$2">Opcional · {content.length}/500 caracteres</Paragraph><BrandButton disabled={saving || !selectedRelationship} onPress={() => void saveCheckIn()}>{saving ? 'Salvando…' : 'Registrar meu momento'}</BrandButton></XStack>
    </AppCard> : null}

    {feedback ? <AppCard p="$3" background={feedbackIsError ? '$declinedBackground' : '$confirmedBackground'} borderColor="$borderColor"><Paragraph role="alert" color={feedbackIsError ? '$declinedColor' : '$confirmedColor'}>{feedback}</Paragraph></AppCard> : null}
    <AppCard p="$5">
      <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap"><SizableText color="$color" fontWeight="700" fontSize={18}>{section === 'documents' ? 'Documentos enviados' : section === 'messages' ? 'Recados para a sessão' : 'Meus check-ins'}</SizableText>{!loading && !error ? <SizableText color="$brand" bg="$soft" px="$3" py="$1" rounded="$12" size="$2" fontWeight="700">{items.length} {countLabel}</SizableText> : null}</XStack>
      {loading ? <FeedbackState status="loading" title="Carregando registros" /> : null}
      {!loading && error ? <YStack gap="$2"><FeedbackState status="error" description={error} /><Button self="flex-start" minH="$touchTarget" onPress={() => void load()}>Tentar novamente</Button></YStack> : null}
      {!loading && !error && items.length === 0 ? <FeedbackState status="empty" title={emptyTitle} description={emptyDescription} /> : null}
      {!loading && !error && section === 'documents' ? visibleDocuments.map((item) => <YStack key={item.id} gap="$2" p="$4" bg="$background" rounded="$control" borderWidth={1} borderColor="$borderColor"><XStack items="center" gap="$3"><YStack width={44} height={44} items="center" justify="center" bg="$soft" rounded="$control"><Ionicons name="document-text-outline" size={22} color={theme.brand.val} accessible={false} /></YStack><YStack flex={1} minW={0}><SizableText color="$color" fontWeight="700">{item.title}</SizableText><Paragraph color="$muted" size="$2">{new Date(item.createdAt).toLocaleString('pt-BR')} · {(item.sizeBytes / 1024 / 1024).toFixed(1)} MB</Paragraph></YStack></XStack><Button self="flex-start" minH="$touchTarget" bg="$soft" color="$brand" onPress={() => void openDocument(item)}>Abrir PDF</Button></YStack>) : null}
      {!loading && !error && section === 'messages' ? visibleMessages.map((item) => <YStack key={item.id} gap="$2" p="$4" bg="$background" rounded="$control" borderWidth={1} borderColor="$borderColor"><Paragraph color="$color">{item.content}</Paragraph><Paragraph color="$muted" size="$2">{new Date(item.createdAt).toLocaleString('pt-BR')}</Paragraph></YStack>) : null}
      {!loading && !error && section === 'check-ins' ? visibleCheckIns.map((item) => <YStack key={item.id} gap="$2" p="$4" bg="$background" rounded="$control" borderWidth={1} borderColor="$borderColor"><XStack items="center" gap="$2"><Ionicons name="heart-outline" size={19} color={theme.accentText.val} accessible={false} /><SizableText color="$color" fontWeight="700">{feelingLabels.find((label) => label.value === item.feeling)?.label}</SizableText></XStack>{item.note ? <Paragraph color="$color">{item.note}</Paragraph> : null}<Paragraph color="$muted" size="$2">{new Date(item.createdAt).toLocaleString('pt-BR')}</Paragraph></YStack>) : null}
    </AppCard>
  </PatientScreen>;
}
