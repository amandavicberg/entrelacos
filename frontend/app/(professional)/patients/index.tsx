import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { Paragraph, SizableText, useTheme, XStack, YStack } from 'tamagui';
import { AppButton as Button } from '@/components/app-button';

import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { AppInput } from '@/components/app-input';
import { FeedbackState } from '@/components/feedback-state';
import { InitialsAvatar, ProfessionalBrand, ProfessionalScreen } from '@/components/professional/professional-screen';
import { useAuth } from '@/contexts/auth-context';
import { listProfessionalPatients, type FollowUpPatient } from '@/lib/api';

const searchable = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('pt-BR').trim();

export default function PatientsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const theme = useTheme();
  const { width, fontScale } = useWindowDimensions();
  const compact = width < 620 || fontScale >= 1.3;
  const [patients, setPatients] = useState<FollowUpPatient[]>([]);
  const [state, setState] = useState<'active' | 'ended'>('active');
  const generation = useRef(0);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (showLoading = false) => {
    if (!session?.access_token) return;
    const request = ++generation.current;
    if (showLoading) setLoading(true);
    setError('');
    try { const data = await listProfessionalPatients(session.access_token, state); if (request === generation.current) setPatients(data); }
    catch (cause) { if (request === generation.current) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os pacientes.'); }
    finally { if (request === generation.current) setLoading(false); }
  }, [session, state]);

  useFocusEffect(useCallback(() => { void load(); return () => { generation.current++; }; }, [load]));
  const filtered = useMemo(() => {
    const normalized = searchable(query);
    return normalized ? patients.filter((patient) => searchable(patient.patientName).includes(normalized)) : patients;
  }, [patients, query]);

  return (
    <ProfessionalScreen>
      <ProfessionalBrand />
      <XStack items="flex-end" justify="space-between" gap="$3" flexWrap="wrap">
        <AppHeader eyebrow="SEUS VÍNCULOS" title="Pacientes" description="Encontre cada pessoa e continue o acompanhamento em um só lugar." />
        {!loading && !error ? <XStack items="center" gap="$2" px="$3" py="$2" bg="$accentSoft" rounded="$12">
          <Ionicons name="people-outline" size={17} color={theme.accentText.val} accessible={false} />
          <SizableText color="$accentText" size="$2" fontWeight="700">{patients.length} {state === 'ended' ? (patients.length === 1 ? 'encerrado' : 'encerrados') : (patients.length === 1 ? 'ativo' : 'ativos')}</SizableText>
        </XStack> : null}
      </XStack>
      <XStack gap="$2" role="group" aria-label="Situação dos pacientes">
        {(['active', 'ended'] as const).map((value) => <Button key={value} minH="$touchTarget"
          bg={state === value ? '$brand' : '$soft'} color={state === value ? '$brandContrast' : '$brand'}
          aria-pressed={state === value} onPress={() => { if (state === value) return; generation.current++; setPatients([]); setLoading(true); setState(value); }}>
          {value === 'active' ? 'Ativos' : 'Encerrados'}</Button>)}
      </XStack>
      {state === 'ended' ? <Paragraph color="$muted">Consulte os acompanhamentos anteriores. Os registros permanecem preservados, mesmo após um novo convite.</Paragraph> : null}
      <AppCard p="$5">
        <YStack gap="$2">
          <SizableText color="$color" fontWeight="700">Buscar paciente</SizableText>
          <Paragraph color="$muted" size="$2">Pesquise pelo nome para chegar rapidamente à ficha.</Paragraph>
          <XStack items="flex-end" gap="$2">
            <YStack flex={1} minW={0}><AppInput label="Nome" value={query} onChangeText={setQuery} placeholder="Digite o nome do paciente" accessibilityLabel="Buscar paciente por nome" /></YStack>
            {query ? <Button chromeless minH="$touchTarget" px="$2" color="$brand" aria-label="Limpar busca" onPress={() => setQuery('')}>Limpar</Button> : null}
          </XStack>
        </YStack>
      </AppCard>
      {loading ? <FeedbackState status="loading" title="Carregando pacientes" /> : null}
      {!loading && error ? <YStack gap="$3"><FeedbackState status="error" title="Não foi possível carregar" description={error} /><Button self="flex-start" minH="$touchTarget" onPress={() => void load(true)}>Tentar novamente</Button></YStack> : null}
      {!loading && !error && patients.length === 0 ? <AppCard p="$5"><YStack items="center" gap="$3" py="$5">
        <YStack width={56} height={56} items="center" justify="center" bg="$soft" rounded="$12"><Ionicons name="people-outline" size={26} color={theme.brand.val} accessible={false} /></YStack>
        <SizableText color="$color" fontWeight="700" fontSize={18} text="center">{state === 'ended' ? 'Nenhum acompanhamento encerrado' : 'Sua lista está pronta para começar'}</SizableText>
        <Paragraph color="$muted" text="center">{state === 'ended' ? 'Os pacientes que deixarem o acompanhamento aparecerão aqui com seu histórico.' : 'Quando você aprovar um vínculo, o paciente aparecerá aqui.'}</Paragraph>
        <Button minH="$touchTarget" bg="$brand" color="$brandContrast" hoverStyle={{ background: '$brandHover' }} pressStyle={{ background: '$brandPress' }} onPress={() => router.push('/(professional)')}>Ir para o início</Button>
      </YStack></AppCard> : null}
      {!loading && !error && patients.length > 0 ? <YStack gap="$3">
        <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
          <SizableText color="$color" fontWeight="700" fontSize={18}>{query ? 'Resultados da busca' : state === 'ended' ? 'Acompanhamentos encerrados' : 'Em acompanhamento'}</SizableText>
          {query ? <Paragraph color="$muted" size="$2">{filtered.length} {filtered.length === 1 ? 'resultado' : 'resultados'}</Paragraph> : null}
        </XStack>
        {filtered.length === 0 ? <AppCard p="$5"><YStack items="center" gap="$2" py="$4">
          <Ionicons name="search-outline" size={28} color={theme.muted.val} accessible={false} />
          <SizableText color="$color" fontWeight="700">Nenhum paciente encontrado</SizableText>
          <Paragraph color="$muted" text="center">Confira o nome ou limpe a busca para ver todos.</Paragraph>
          <Button chromeless minH="$touchTarget" color="$brand" onPress={() => setQuery('')}>Mostrar todos</Button>
        </YStack></AppCard> : filtered.map((patient) => (
          <Button key={patient.relationshipId} unstyled role="button" height="auto" minH={88}
            p="$4" bg="$surface" rounded="$panel" borderWidth={1} borderColor="$borderColor"
            hoverStyle={{ borderColor: '$brand', background: '$backgroundHover' }} pressStyle={{ opacity: 0.85 }}
            onPress={() => router.push({ pathname: '/(professional)/patients/[relationshipId]', params: { relationshipId: patient.relationshipId } })}
            aria-label={`Abrir acompanhamento de ${patient.patientName}`}>
            <XStack width="100%" items="center" gap="$3">
              <InitialsAvatar name={patient.patientName} large={!compact} />
              <YStack flex={1} minW={0} gap="$1" items="flex-start">
                <SizableText color="$color" fontWeight="700" fontSize={compact ? 15 : 17} text="left">{patient.patientName}</SizableText>
                <Paragraph color="$muted" size="$2" text="left">{patient.endedAt ? `Encerrado em ${new Date(patient.endedAt).toLocaleDateString('pt-BR')}` : patient.approvedAt ? `Em acompanhamento desde ${new Date(patient.approvedAt).toLocaleDateString('pt-BR')}` : 'Acompanhamento ativo'}</Paragraph>
              </YStack>
              {!compact ? <SizableText color="$brand" fontWeight="700" size="$2">Abrir ficha</SizableText> : null}
              <Ionicons name="chevron-forward" size={20} color={theme.brand.val} accessible={false} />
            </XStack>
          </Button>
        ))}
      </YStack> : null}
    </ProfessionalScreen>
  );
}
