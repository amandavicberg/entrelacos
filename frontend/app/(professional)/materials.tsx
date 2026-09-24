import * as DocumentPicker from 'expo-document-picker';
import * as Linking from 'expo-linking';
import { useCallback, useEffect, useState } from 'react';
import { Button, Paragraph, Progress, SizableText, TextArea, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { AppInput } from '@/components/app-input';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { ProfessionalBrand, ProfessionalScreen } from '@/components/professional/professional-screen';
import { useAuth } from '@/contexts/auth-context';
import { confirmMaterialUpload, createExternalMaterial, getMaterialUrl, listMaterials, listProfessionalPatients, prepareMaterialUpload, shareMaterial, uploadToSignedUrl, type FollowUpMaterial, type FollowUpPatient, type MaterialUsage } from '@/lib/api';

type PickedFile = { uri: string; name: string; mimeType: string; size: number };
export default function MaterialsScreen() {
  const { session } = useAuth();
  const [materials, setMaterials] = useState<FollowUpMaterial[]>([]);
  const [patients, setPatients] = useState<FollowUpPatient[]>([]);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [usage, setUsage] = useState<MaterialUsage | undefined>();
  const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false);
  const [error, setError] = useState(''); const [feedback, setFeedback] = useState('');
  const [mode, setMode] = useState<'external' | 'storage'>('external');
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [externalUrl, setExternalUrl] = useState('');
  const [kind, setKind] = useState<'ebook' | 'podcast' | 'video'>('ebook'); const [file, setFile] = useState<PickedFile | null>(null);

  const load = useCallback(async () => { if (!session?.access_token) return; await Promise.resolve(); setLoading(true); setError(''); try { const [result, patientData] = await Promise.all([listMaterials(session.access_token), listProfessionalPatients(session.access_token)]); setMaterials(result.materials); setUsage(result.usage); setPatients(patientData); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os materiais.'); } finally { setLoading(false); } }, [session]);
  useEffect(() => { const timeout = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timeout); }, [load]);

  async function pickFile() {
    const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'audio/mpeg', 'audio/mp4', 'audio/aac'], multiple: false, copyToCacheDirectory: true });
    if (result.canceled) return; const asset = result.assets[0];
    if (!asset.mimeType || !asset.size) { setFeedback('Não foi possível identificar tipo ou tamanho do arquivo.'); return; }
    setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size });
    if (!title) setTitle(asset.name.replace(/\.[^.]+$/, ''));
  }

  async function save() {
    if (!session?.access_token || saving || !title.trim()) return; setSaving(true); setFeedback('');
    try {
      if (mode === 'external') await createExternalMaterial(session.access_token, { title, description, kind, externalUrl });
      else {
        if (!file) throw new Error('Selecione um PDF ou áudio.');
        const metadata = { fileName: file.name, mimeType: file.mimeType, sizeBytes: file.size };
        const upload = await prepareMaterialUpload(session.access_token, metadata);
        await uploadToSignedUrl(upload.storagePath, upload.token, file.uri, file.mimeType);
        await confirmMaterialUpload(session.access_token, { ...metadata, materialId: upload.materialId, storagePath: upload.storagePath, title, description });
      }
      setTitle(''); setDescription(''); setExternalUrl(''); setFile(null); setFeedback('Material cadastrado. Agora ele pode ser compartilhado no acompanhamento do paciente.'); await load();
    } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível cadastrar o material.'); }
    finally { setSaving(false); }
  }

  async function openMaterial(materialId: string) { if (!session?.access_token) return; try { await Linking.openURL(await getMaterialUrl(session.access_token, materialId)); } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Material indisponível.'); } }
  async function shareWithSelected(materialId: string) { if (!session?.access_token || saving || !selectedPatients.length) return; setSaving(true); setFeedback(''); try { await shareMaterial(session.access_token, materialId, selectedPatients); setFeedback(`Material compartilhado com ${selectedPatients.length} paciente(s).`); } catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível compartilhar.'); } finally { setSaving(false); } }
  function togglePatient(relationshipId: string) { setSelectedPatients((current) => current.includes(relationshipId) ? current.filter((id) => id !== relationshipId) : [...current, relationshipId]); }
  const usagePercent = usage ? Math.min(100, (usage.sizeBytes / usage.quotaBytes) * 100) : 0;
  return <ProfessionalScreen><ProfessionalBrand /><AppHeader eyebrow="APOIO AO CUIDADO" title="Materiais" description="Links externos, PDFs e áudios privados." />
    <AppCard title="Cadastrar material" background="$surface" rounded="$panel"><YStack gap="$3"><XStack gap="$2" flexWrap="wrap"><Button flex={1} minW={140} minH="$touchTarget" bg={mode === 'external' ? '$brand' : '$soft'} color={mode === 'external' ? '$brandContrast' : '$color'} onPress={() => setMode('external')}>Link externo</Button><Button flex={1} minW={140} minH="$touchTarget" bg={mode === 'storage' ? '$brand' : '$soft'} color={mode === 'storage' ? '$brandContrast' : '$color'} onPress={() => setMode('storage')}>PDF ou áudio</Button></XStack><AppInput label="Título" value={title} onChangeText={setTitle} maxLength={160} /><TextArea aria-label="Descrição opcional" placeholder="Descrição opcional" value={description} onChangeText={setDescription} maxLength={2000} borderColor="$borderColor" />{mode === 'external' ? <><AppInput label="Link HTTP ou HTTPS" value={externalUrl} onChangeText={setExternalUrl} autoCapitalize="none" keyboardType="url" /><XStack gap="$2" flexWrap="wrap">{(['ebook', 'podcast', 'video'] as const).map((value) => <Button key={value} minH="$touchTarget" bg={kind === value ? '$brand' : '$soft'} color={kind === value ? '$brandContrast' : '$color'} onPress={() => setKind(value)}>{value === 'ebook' ? 'E-book' : value === 'podcast' ? 'Podcast' : 'Vídeo'}</Button>)}</XStack></> : <><Button minH="$touchTarget" onPress={pickFile}>{file ? 'Trocar arquivo' : 'Selecionar arquivo'}</Button>{file ? <Paragraph color="$muted">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</Paragraph> : <Paragraph color="$muted" size="$2">PDF até 10 MB; MP3, M4A ou AAC até 15 MB.</Paragraph>}</>}<BrandButton disabled={saving || !title.trim() || (mode === 'external' ? !externalUrl.trim() : !file)} onPress={save}>{saving ? 'Enviando…' : 'Cadastrar material'}</BrandButton>{feedback ? <Paragraph role="alert" color="$brand">{feedback}</Paragraph> : null}</YStack></AppCard>
    {usage ? <AppCard title="Uso de arquivos" background="$surface" rounded="$panel"><Paragraph color="$muted">{usage.count} arquivo(s) · {(usage.sizeBytes / 1024 / 1024).toFixed(1)} MB de 1 GB orientativo</Paragraph><Progress value={usagePercent} max={100} bg="$soft"><Progress.Indicator bg={usagePercent >= 80 ? '$declinedColor' : '$brand'} /></Progress>{usagePercent >= 80 ? <Paragraph color="$declinedColor" role="alert">O uso individual atingiu 80% da cota de referência.</Paragraph> : null}</AppCard> : null}
    {!loading && !error ? <AppCard title="Pacientes para compartilhamento" background="$surface" rounded="$panel"><Paragraph color="$muted" size="$2">Selecione um ou mais vínculos ativos e use “Compartilhar” no material desejado.</Paragraph><XStack gap="$2" flexWrap="wrap">{patients.map((patient) => { const selected = selectedPatients.includes(patient.relationshipId); return <Button key={patient.relationshipId} minH="$touchTarget" bg={selected ? '$brand' : '$soft'} color={selected ? '$brandContrast' : '$color'} accessibilityState={{ selected }} onPress={() => togglePatient(patient.relationshipId)}>{patient.patientName}</Button>; })}{patients.length === 0 ? <Paragraph color="$muted">Nenhum paciente ativo.</Paragraph> : null}</XStack></AppCard> : null}
    {loading ? <FeedbackState status="loading" title="Carregando materiais" /> : null}{!loading && error ? <YStack gap="$3"><FeedbackState status="error" description={error} /><Button minH="$touchTarget" onPress={load}>Tentar novamente</Button></YStack> : null}{!loading && !error && materials.length === 0 ? <FeedbackState status="empty" title="Nenhum material" /> : null}{!loading && !error ? <YStack gap="$3">{materials.map((item) => <AppCard key={item.id} background="$surface" rounded="$panel"><SizableText color="$color" fontWeight="700">{item.title}</SizableText>{item.description ? <Paragraph color="$muted">{item.description}</Paragraph> : null}<Paragraph color="$muted" size="$2">{item.source === 'external' ? 'Link externo' : 'Arquivo privado'} · {item.kind}</Paragraph><XStack gap="$2" flexWrap="wrap"><Button minH="$touchTarget" onPress={() => openMaterial(item.id)}>Abrir material</Button><Button minH="$touchTarget" bg="$brand" color="$brandContrast" disabled={saving || !selectedPatients.length} onPress={() => shareWithSelected(item.id)}>Compartilhar ({selectedPatients.length})</Button></XStack></AppCard>)}</YStack> : null}
  </ProfessionalScreen>;
}
