import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Button, Dialog, Paragraph, Progress, ScrollView, SizableText, TextArea, useTheme, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { AppInput } from '@/components/app-input';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { InitialsAvatar, ProfessionalBrand, ProfessionalScreen, type ProfessionalIcon } from '@/components/professional/professional-screen';
import { useAuth } from '@/contexts/auth-context';
import { openExternalResource } from '@/lib/open-external';
import {
  confirmMaterialUpload, createExternalMaterial, getMaterialUrl, listMaterials,
  listProfessionalPatients, prepareMaterialUpload, shareMaterial, uploadToSignedUrl,
  type FollowUpMaterial, type FollowUpPatient, type MaterialUsage,
} from '@/lib/api';

type PickedFile = { uri: string; name: string; mimeType: string; size: number };
type MaterialFilter = 'all' | 'external' | 'storage';
type LinkKind = 'ebook' | 'podcast' | 'video';

const kindLabels: Record<FollowUpMaterial['kind'], string> = {
  ebook: 'E-book', podcast: 'Podcast', video: 'Vídeo',
  pdf: 'PDF', audio: 'Áudio', other: 'Outro',
};
const kindIcons: Record<FollowUpMaterial['kind'], ProfessionalIcon> = {
  ebook: 'book-outline', podcast: 'mic-outline', video: 'videocam-outline',
  pdf: 'document-text-outline', audio: 'headset-outline', other: 'link-outline',
};
const filters: { value: MaterialFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'external', label: 'Links' },
  { value: 'storage', label: 'Arquivos' },
];
const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();

export default function MaterialsScreen() {
  const { session } = useAuth();
  const theme = useTheme();
  const { width, height, fontScale } = useWindowDimensions();
  const compact = width < 620 || fontScale >= 1.3;
  const [materials, setMaterials] = useState<FollowUpMaterial[]>([]);
  const [patients, setPatients] = useState<FollowUpPatient[]>([]);
  const [usage, setUsage] = useState<MaterialUsage | undefined>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [formFeedback, setFormFeedback] = useState('');
  const [shareFeedback, setShareFeedback] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [sharingMaterialId, setSharingMaterialId] = useState<string | null>(null);
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  const [shareQuery, setShareQuery] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<MaterialFilter>('all');
  const [mode, setMode] = useState<'external' | 'storage'>('external');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [kind, setKind] = useState<LinkKind>('ebook');
  const [file, setFile] = useState<PickedFile | null>(null);

  const load = useCallback(async (showLoading = false) => {
    if (!session?.access_token) return;
    if (showLoading) setLoading(true);
    setError('');
    try {
      const [result, patientData] = await Promise.all([
        listMaterials(session.access_token),
        listProfessionalPatients(session.access_token),
      ]);
      setMaterials(result.materials);
      setUsage(result.usage);
      setPatients(patientData);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os materiais.');
    } finally { setLoading(false); }
  }, [session]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const visibleMaterials = useMemo(() => {
    const term = normalize(query);
    return materials.filter((item) => (
      (filter === 'all' || item.source === filter)
      && (!term || normalize(item.title + ' ' + (item.description ?? '')).includes(term))
    ));
  }, [filter, materials, query]);
  const visiblePatients = useMemo(() => {
    const term = normalize(shareQuery);
    return patients.filter((patient) => !term || normalize(patient.patientName).includes(term))
      .sort((a, b) => a.patientName.localeCompare(b.patientName, 'pt-BR'));
  }, [patients, shareQuery]);
  const allVisibleSelected = visiblePatients.length > 0
    && visiblePatients.every((patient) => selectedPatients.includes(patient.relationshipId));
  const sharingMaterial = materials.find((item) => item.id === sharingMaterialId);

  const usagePercent = usage && usage.quotaBytes > 0
    ? Math.min(100, (usage.sizeBytes / usage.quotaBytes) * 100) : 0;
  const storageMb = usage ? (usage.sizeBytes / 1024 / 1024).toFixed(1) : '0.0';

  function toggleForm() {
    setShowForm((current) => !current);
    setFormFeedback('');
    setFeedback('');
  }

  async function pickFile() {
    if (saving) return;
    setFormFeedback('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'audio/mpeg', 'audio/mp4', 'audio/aac'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const asset = result.assets[0];
      if (!asset.mimeType || !asset.size) {
        setFormFeedback('Não foi possível identificar tipo ou tamanho do arquivo.');
        return;
      }
      setFile({ uri: asset.uri, name: asset.name, mimeType: asset.mimeType, size: asset.size });
      if (!title.trim()) setTitle(asset.name.replace(/\.[^.]+$/, ''));
    } catch {
      setFormFeedback('Não foi possível selecionar o arquivo. Tente novamente.');
    }
  }

  async function save() {
    if (!session?.access_token || saving) return;
    if (!title.trim()) {
      setFormFeedback('Informe um título para identificar o material.');
      return;
    }
    if (mode === 'external') {
      try {
        const url = new URL(externalUrl.trim());
        if (url.protocol !== 'http:' && url.protocol !== 'https:') throw new Error();
      } catch {
        setFormFeedback('Informe um link válido começando com https:// ou http://.');
        return;
      }
    } else if (!file) {
      setFormFeedback('Selecione um PDF ou áudio antes de continuar.');
      return;
    }
    setSaving(true);
    setFormFeedback('');
    try {
      if (mode === 'external') {
        await createExternalMaterial(session.access_token, {
          title: title.trim(), description: description.trim(), kind,
          externalUrl: externalUrl.trim(),
        });
      } else if (file) {
        const metadata = { fileName: file.name, mimeType: file.mimeType, sizeBytes: file.size };
        const upload = await prepareMaterialUpload(session.access_token, metadata);
        await uploadToSignedUrl(upload.storagePath, upload.token, file.uri, file.mimeType);
        await confirmMaterialUpload(session.access_token, {
          ...metadata, materialId: upload.materialId, storagePath: upload.storagePath,
          title: title.trim(), description: description.trim(),
        });
      }
      setShowForm(false);
      setTitle('');
      setDescription('');
      setExternalUrl('');
      setFile(null);
      setFeedback('Material salvo na biblioteca. Para enviá-lo, clique em Compartilhar e selecione os pacientes.');
      await load();
    } catch (cause) {
      setFormFeedback(cause instanceof Error ? cause.message : 'Não foi possível cadastrar o material.');
    } finally { setSaving(false); }
  }

  async function openMaterial(materialId: string) {
    if (!session?.access_token) return;
    setFeedback('');
    try { await openExternalResource(() => getMaterialUrl(session.access_token, materialId)); }
    catch (cause) { setFeedback(cause instanceof Error ? cause.message : 'Não foi possível abrir o material.'); }
  }

  function toggleShare(materialId: string) {
    setSharingMaterialId(materialId);
    setSelectedPatients([]);
    setShareQuery('');
    setShareFeedback('');
    setFeedback('');
  }

  function closeShare() {
    if (saving) return;
    setSharingMaterialId(null);
    setSelectedPatients([]);
    setShareQuery('');
    setShareFeedback('');
  }

  function togglePatient(relationshipId: string) {
    setSelectedPatients((current) => current.includes(relationshipId)
      ? current.filter((id) => id !== relationshipId) : [...current, relationshipId]);
    setShareFeedback('');
  }

  function toggleVisiblePatients() {
    const visibleIds = new Set(visiblePatients.map((patient) => patient.relationshipId));
    setSelectedPatients((current) => allVisibleSelected
      ? current.filter((id) => !visibleIds.has(id))
      : [...new Set([...current, ...visibleIds])]);
    setShareFeedback('');
  }

  async function shareWithSelected(materialId: string) {
    if (!session?.access_token || saving || !selectedPatients.length) return;
    setSaving(true);
    setShareFeedback('');
    try {
      await shareMaterial(session.access_token, materialId, selectedPatients);
      setFeedback('Material compartilhado com ' + selectedPatients.length + (selectedPatients.length === 1 ? ' paciente.' : ' pacientes.'));
      setSharingMaterialId(null);
      setSelectedPatients([]);
      setShareQuery('');
      setShareFeedback('');
    } catch (cause) {
      setShareFeedback(cause instanceof Error ? cause.message : 'Não foi possível compartilhar o material.');
    } finally { setSaving(false); }
  }

  return <ProfessionalScreen>
    <ProfessionalBrand />
    <XStack items="flex-end" justify="space-between" gap="$3" flexWrap="wrap">
      <AppHeader eyebrow="APOIO AO CUIDADO" title="Materiais"
        description="Organize conteúdos de apoio e compartilhe com seus pacientes." />
      <Button minH="$touchTarget" bg="$brand" color="$brandContrast"
        hoverStyle={{ background: '$brandHover' }} pressStyle={{ background: '$brandPress' }}
        disabled={saving} aria-expanded={showForm}
        icon={<Ionicons name={showForm ? 'close' : 'add'} size={20} color={theme.brandContrast.val} accessible={false} />}
        onPress={toggleForm}>{showForm ? 'Fechar cadastro' : 'Novo material'}</Button>
    </XStack>

    {feedback ? <AppCard p="$3" bg="$accentSoft" borderColor="$logoBorder">
      <Paragraph role="alert" color="$color">{feedback}</Paragraph>
    </AppCard> : null}

    {showForm ? <AppCard p="$5">
      <YStack gap="$4">
        <YStack gap="$1">
          <SizableText color="$color" fontWeight="700" fontSize={20}>Novo material</SizableText>
          <Paragraph color="$muted" size="$2">Escolha entre indicar um link ou enviar um arquivo privado.</Paragraph>
        </YStack>
        <XStack gap="$2" p="$1" bg="$soft" rounded="$control">
          {(['external', 'storage'] as const).map((value) => (
            <Button key={value} flex={1} minH="$touchTarget" px="$2"
              bg={mode === value ? '$brand' : 'transparent'}
              color={mode === value ? '$brandContrast' : '$brand'}
              hoverStyle={{ background: mode === value ? '$brandHover' : '$backgroundHover' }}
              pressStyle={{ background: mode === value ? '$brandPress' : '$backgroundPress' }}
              aria-pressed={mode === value} onPress={() => { setMode(value); setFormFeedback(''); }}>
              {value === 'external' ? 'Link externo' : 'PDF ou áudio'}
            </Button>
          ))}
        </XStack>
        <AppInput label="Título" value={title} onChangeText={(value) => { setTitle(value); setFormFeedback(''); }}
          placeholder="Ex.: Guia de preparação" maxLength={160} />
        <YStack gap="$2">
          <SizableText color="$color" fontWeight="700">Descrição <SizableText color="$muted" fontWeight="400">(opcional)</SizableText></SizableText>
          <TextArea aria-label="Descrição opcional" value={description} onChangeText={setDescription}
            placeholder="Conte ao paciente por que este conteúdo pode ajudar"
            maxLength={2000} minH={90} borderColor="$borderColor" />
        </YStack>
        {mode === 'external' ? <>
          <AppInput label="Endereço do link" value={externalUrl}
            onChangeText={(value) => { setExternalUrl(value); setFormFeedback(''); }}
            placeholder="https://exemplo.com/material" autoCapitalize="none" keyboardType="url" />
          <YStack gap="$2">
            <SizableText color="$color" fontWeight="700">Tipo de conteúdo</SizableText>
            <XStack gap="$2" flexWrap="wrap">
              {(['ebook', 'podcast', 'video'] as const).map((value) => (
                <Button key={value} minH="$touchTarget" px="$4"
                  bg={kind === value ? '$brand' : '$soft'}
                  color={kind === value ? '$brandContrast' : '$brand'}
                  hoverStyle={{ background: kind === value ? '$brandHover' : '$backgroundHover' }}
                  pressStyle={{ background: kind === value ? '$brandPress' : '$backgroundPress' }}
                  aria-pressed={kind === value} onPress={() => setKind(value)}>{kindLabels[value]}</Button>
              ))}
            </XStack>
          </YStack>
        </> : <YStack gap="$2">
          <SizableText color="$color" fontWeight="700">Arquivo</SizableText>
          <Button self="flex-start" minH="$touchTarget" bg="$soft" color="$brand"
            icon={<Ionicons name="attach-outline" size={19} color={theme.brand.val} accessible={false} />}
            onPress={() => void pickFile()}>{file ? 'Trocar arquivo' : 'Selecionar arquivo'}</Button>
          {file ? <Paragraph color="$color" size="$2">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} MB</Paragraph>
            : <Paragraph color="$muted" size="$2">PDF até 10 MB; MP3, M4A ou AAC até 15 MB.</Paragraph>}
        </YStack>}
        {formFeedback ? <Paragraph role="alert" color="$declinedColor">{formFeedback}</Paragraph> : null}
        <XStack gap="$2" flexWrap="wrap">
          <BrandButton hoverStyle={{ background: '$brandHover' }} pressStyle={{ background: '$brandPress' }}
            disabled={saving || !title.trim() || (mode === 'external' ? !externalUrl.trim() : !file)}
            onPress={() => void save()}>{saving ? 'Salvando…' : 'Salvar material'}</BrandButton>
          <Button minH="$touchTarget" onPress={toggleForm}>Cancelar</Button>
        </XStack>
      </YStack>
    </AppCard> : null}

    <AppCard p="$5">
      <YStack gap="$4">
        <XStack items={compact ? 'flex-start' : 'center'} flexDirection={compact ? 'column' : 'row'} justify="space-between" gap="$2">
          <YStack gap="$1" minW={0} width={compact ? '100%' : undefined} flex={compact ? undefined : 1}>
            <SizableText color="$color" fontWeight="700" fontSize={20}>Sua biblioteca</SizableText>
            <Paragraph color="$muted" size="$2">Cadastrar um conteúdo não o envia ao paciente. Use Compartilhar em cada material para escolher quem o receberá.</Paragraph>
          </YStack>
          {!loading && !error ? <SizableText color="$accentText" bg="$accentSoft" px="$3" py="$1" rounded="$12" size="$2" fontWeight="700">
            {materials.length} {materials.length === 1 ? 'material' : 'materiais'}
          </SizableText> : null}
        </XStack>
        <AppInput label="Buscar na biblioteca" value={query} onChangeText={setQuery}
          placeholder="Busque por título ou descrição" accessibilityLabel="Buscar material" />
        <XStack gap="$2" flexWrap="wrap" role="group" aria-label="Filtrar materiais">
          {filters.map(({ value, label }) => <Button key={value} minH="$touchTarget" px="$4"
            bg={filter === value ? '$brand' : '$soft'}
            color={filter === value ? '$brandContrast' : '$brand'}
            hoverStyle={{ background: filter === value ? '$brandHover' : '$backgroundHover' }}
            pressStyle={{ background: filter === value ? '$brandPress' : '$backgroundPress' }}
            aria-pressed={filter === value} onPress={() => setFilter(value)}>{label}</Button>)}
        </XStack>
      </YStack>
    </AppCard>

    {loading ? <FeedbackState status="loading" title="Carregando materiais" /> : null}
    {!loading && error ? <YStack gap="$3">
      <FeedbackState status="error" title="Não foi possível carregar" description={error} />
      <Button self="flex-start" minH="$touchTarget" onPress={() => void load(true)}>Tentar novamente</Button>
    </YStack> : null}
    {!loading && !error && materials.length === 0 ? <AppCard p="$5">
      <YStack items="center" gap="$3" py="$5">
        <YStack width={56} height={56} items="center" justify="center" bg="$soft" rounded="$12">
          <Ionicons name="folder-open-outline" size={28} color={theme.brand.val} accessible={false} />
        </YStack>
        <SizableText color="$color" fontWeight="700" fontSize={18} text="center">Sua biblioteca começa aqui</SizableText>
        <Paragraph color="$muted" text="center">Adicione um link ou arquivo de apoio para compartilhar no acompanhamento.</Paragraph>
        <Button minH="$touchTarget" bg="$brand" color="$brandContrast"
          hoverStyle={{ background: '$brandHover' }} pressStyle={{ background: '$brandPress' }}
          onPress={() => setShowForm(true)}>Adicionar primeiro material</Button>
      </YStack>
    </AppCard> : null}
    {!loading && !error && materials.length > 0 ? <YStack gap="$3">
      <XStack items="center" justify="space-between" gap="$2">
        <SizableText color="$color" fontWeight="700" fontSize={18}>Materiais disponíveis</SizableText>
        {query || filter !== 'all' ? <Paragraph color="$muted" size="$2">{visibleMaterials.length} {visibleMaterials.length === 1 ? 'resultado' : 'resultados'}</Paragraph> : null}
      </XStack>
      {visibleMaterials.length === 0 ? <AppCard p="$5"><YStack items="center" gap="$2" py="$4">
        <Ionicons name="search-outline" size={28} color={theme.muted.val} accessible={false} />
        <SizableText color="$color" fontWeight="700">Nenhum material encontrado</SizableText>
        <Paragraph color="$muted" text="center">Tente outra busca ou mostre todos os tipos.</Paragraph>
        <Button chromeless minH="$touchTarget" color="$brand" onPress={() => { setQuery(''); setFilter('all'); }}>Mostrar todos</Button>
      </YStack></AppCard> : visibleMaterials.map((item) => <AppCard key={item.id} p="$5">
        <YStack gap="$3">
          <XStack items="flex-start" gap="$3">
            <YStack width={50} height={50} items="center" justify="center" bg="$soft" rounded="$control">
              <Ionicons name={kindIcons[item.kind]} size={24} color={theme.brand.val} accessible={false} />
            </YStack>
            <YStack flex={1} minW={0} gap="$1">
              <SizableText color="$color" fontWeight="700" fontSize={compact ? 16 : 18}>{item.title}</SizableText>
              <Paragraph color="$muted" size="$2">{kindLabels[item.kind]} · {item.source === 'external' ? 'Link externo' : 'Arquivo privado'}</Paragraph>
            </YStack>
          </XStack>
          {item.description ? <Paragraph color="$muted">{item.description}</Paragraph> : null}
          <XStack gap="$2" flexWrap="wrap" pt="$2" borderTopWidth={1} borderColor="$borderColor">
            <Button minH="$touchTarget" bg="$soft" color="$brand"
              icon={<Ionicons name="open-outline" size={18} color={theme.brand.val} accessible={false} />}
              aria-label={'Abrir ' + item.title} onPress={() => void openMaterial(item.id)}>Abrir</Button>
            <Button minH="$touchTarget" bg="$surface" color="$brand"
              borderWidth={1} borderColor="$brand"
              hoverStyle={{ background: '$soft' }} pressStyle={{ background: '$backgroundPress' }}
              aria-label={'Compartilhar ' + item.title}
              icon={<Ionicons name="share-outline" size={18} color={theme.brand.val} accessible={false} />}
              onPress={() => toggleShare(item.id)}>Compartilhar</Button>
          </XStack>
        </YStack>
      </AppCard>)}
    </YStack> : null}

    {!loading && !error && usage ? <AppCard p="$4">
      <YStack gap="$2">
        <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
          <XStack items="center" gap="$2">
            <Ionicons name="cloud-outline" size={19} color={theme.brand.val} accessible={false} />
            <SizableText color="$color" fontWeight="700">Armazenamento</SizableText>
          </XStack>
          <Paragraph color="$muted" size="$2">{usage.count} {usage.count === 1 ? 'arquivo' : 'arquivos'} · {storageMb} MB de 1 GB orientativo</Paragraph>
        </XStack>
        <Progress value={usagePercent} max={100} bg="$soft" aria-label="Uso de armazenamento">
          <Progress.Indicator bg={usagePercent >= 80 ? '$declinedColor' : '$brand'} />
        </Progress>
        {usagePercent >= 80 ? <Paragraph color="$declinedColor" role="alert">O uso individual atingiu 80% da cota de referência.</Paragraph> : null}
      </YStack>
    </AppCard> : null}

    <Dialog open={sharingMaterialId !== null} onOpenChange={(open) => { if (!open) closeShare(); }}>
      <Dialog.Portal>
        <Dialog.Overlay bg="$overlay" />
        <Dialog.Content width={compact ? '92%' : 560} maxW={560} maxH={Math.floor(height * 0.88)}
          bg="$surface" borderWidth={1} borderColor="$borderColor" rounded="$panel" p="$5" gap="$3">
          <XStack items="flex-start" justify="space-between" gap="$3">
            <YStack flex={1} minW={0} gap="$1">
              <Dialog.Title color="$color" fontSize={compact ? 20 : 22} fontFamily="$heading">Compartilhar material</Dialog.Title>
              <Dialog.Description color="$muted" size="$2">
                {sharingMaterial ? 'Selecione os pacientes ativos que receberão “' + sharingMaterial.title + '”.' : 'Selecione os pacientes ativos.'}
              </Dialog.Description>
            </YStack>
            <Button minH="$touchTarget" minW="$touchTarget" chromeless p="$2" aria-label="Fechar janela de compartilhamento"
              icon={<Ionicons name="close" size={22} color={theme.brand.val} accessible={false} />}
              onPress={closeShare} />
          </XStack>
          <AppInput label="Buscar paciente" value={shareQuery} onChangeText={setShareQuery}
            placeholder="Digite o nome do paciente" accessibilityLabel="Buscar paciente para compartilhar" />
          <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
            <Paragraph color="$muted" size="$2">{visiblePatients.length} {visiblePatients.length === 1 ? 'paciente encontrado' : 'pacientes encontrados'}</Paragraph>
            {visiblePatients.length > 0 ? <Button chromeless minH="$touchTarget" color="$brand" fontWeight="700"
              onPress={toggleVisiblePatients}>{allVisibleSelected ? 'Desmarcar visíveis' : 'Selecionar visíveis'}</Button> : null}
          </XStack>
          <ScrollView maxH={Math.max(150, Math.floor(height * 0.88) - 340)}
            borderWidth={1} borderColor="$borderColor" rounded="$control" bg="$background">
            <YStack p="$2" gap="$2">
              {patients.length === 0 ? <Paragraph color="$muted" p="$3">Nenhum paciente ativo disponível para compartilhamento.</Paragraph> : null}
              {patients.length > 0 && visiblePatients.length === 0 ? <Paragraph color="$muted" p="$3">Nenhum paciente encontrado com esse nome.</Paragraph> : null}
              {visiblePatients.map((patient) => {
                const selected = selectedPatients.includes(patient.relationshipId);
                return <Button key={patient.relationshipId} unstyled role="button" minH={62} height="auto" p="$3"
                  bg={selected ? '$soft' : '$surface'} rounded="$control" borderWidth={1}
                  borderColor={selected ? '$brand' : '$borderColor'}
                  hoverStyle={{ background: '$soft' }} pressStyle={{ opacity: 0.8 }}
                  aria-label={'Selecionar ' + patient.patientName} aria-pressed={selected}
                  onPress={() => togglePatient(patient.relationshipId)}>
                  <XStack width="100%" items="center" gap="$3">
                    <InitialsAvatar name={patient.patientName} />
                    <SizableText flex={1} minW={0} color="$color" fontWeight="600" text="left">{patient.patientName}</SizableText>
                    <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={24}
                      color={selected ? theme.brand.val : theme.muted.val} accessible={false} />
                  </XStack>
                </Button>;
              })}
            </YStack>
          </ScrollView>
          {shareFeedback ? <Paragraph role="alert" color="$declinedColor">{shareFeedback}</Paragraph> : null}
          <YStack gap="$2" pt="$2" borderTopWidth={1} borderColor="$borderColor">
            <XStack items="center" justify="space-between" gap="$2">
              <SizableText color="$brand" fontWeight="700" size="$2">
                {selectedPatients.length} {selectedPatients.length === 1 ? 'selecionado' : 'selecionados'}
              </SizableText>
              <Button minH="$touchTarget" color="$brand" onPress={closeShare} disabled={saving}>Cancelar</Button>
              {!compact ? <BrandButton minH="$touchTarget" py="$2" hoverStyle={{ background: '$brandHover' }} pressStyle={{ background: '$brandPress' }}
                disabled={saving || selectedPatients.length === 0 || !sharingMaterialId}
                onPress={() => { if (sharingMaterialId) void shareWithSelected(sharingMaterialId); }}>
                {saving ? 'Enviando…' : 'Enviar material'}
              </BrandButton> : null}
            </XStack>
            {compact ? <BrandButton width="100%" minH="$touchTarget" py="$2" hoverStyle={{ background: '$brandHover' }} pressStyle={{ background: '$brandPress' }}
              disabled={saving || selectedPatients.length === 0 || !sharingMaterialId}
              onPress={() => { if (sharingMaterialId) void shareWithSelected(sharingMaterialId); }}>
              {saving ? 'Enviando…' : 'Enviar material'}
            </BrandButton> : null}
          </YStack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  </ProfessionalScreen>;
}
