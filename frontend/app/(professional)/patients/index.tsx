import { type RelativePathString, useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Paragraph, SizableText, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { AppInput } from '@/components/app-input';
import { FeedbackState } from '@/components/feedback-state';
import { InitialsAvatar, ProfessionalBrand, ProfessionalScreen } from '@/components/professional/professional-screen';
import { useAuth } from '@/contexts/auth-context';
import { listProfessionalPatients, type FollowUpPatient } from '@/lib/api';

export default function PatientsScreen() {
  const { session } = useAuth();
  const router = useRouter();
  const [patients, setPatients] = useState<FollowUpPatient[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    await Promise.resolve();
    setLoading(true);
    setError('');
    try { setPatients(await listProfessionalPatients(session.access_token)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar os pacientes.'); }
    finally { setLoading(false); }
  }, [session]);

  useEffect(() => { const timeout = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timeout); }, [load]);
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('pt-BR');
    return normalized ? patients.filter((patient) => patient.patientName.toLocaleLowerCase('pt-BR').includes(normalized)) : patients;
  }, [patients, query]);

  return (
    <ProfessionalScreen>
      <ProfessionalBrand />
      <AppHeader eyebrow="ACOMPANHAMENTO" title="Pacientes" description="Somente associações ativas aparecem nesta lista." />
      <AppInput label="Buscar por nome" value={query} onChangeText={setQuery} placeholder="Digite o nome do paciente" accessibilityLabel="Buscar paciente por nome" />
      {loading ? <FeedbackState status="loading" title="Carregando pacientes" /> : null}
      {!loading && error ? <YStack gap="$3"><FeedbackState status="error" title="Não foi possível carregar" description={error} /><Button minH="$touchTarget" onPress={load}>Tentar novamente</Button></YStack> : null}
      {!loading && !error && patients.length === 0 ? <FeedbackState status="empty" title="Nenhum paciente ativo" description="Pacientes aprovados aparecerão aqui." /> : null}
      {!loading && !error && patients.length > 0 && filtered.length === 0 ? <FeedbackState status="empty" title="Nenhum resultado" description="Tente buscar por outro nome." /> : null}
      {!loading && !error ? <YStack gap="$3">{filtered.map((patient) => (
        <AppCard key={patient.relationshipId} background="$surface" rounded="$panel" p="$4">
          <XStack items="center" gap="$3" flexWrap="wrap">
            <InitialsAvatar name={patient.patientName} />
            <YStack flex={1} minW={180}>
              <SizableText color="$color" fontWeight="700">{patient.patientName}</SizableText>
              <Paragraph color="$muted" size="$2">Acompanhamento ativo</Paragraph>
            </YStack>
            <Button minH="$touchTarget" bg="$brand" color="$brandContrast" onPress={() => router.push(`/(professional)/patients/${patient.relationshipId}` as RelativePathString)} accessibilityLabel={`Abrir acompanhamento de ${patient.patientName}`}>Abrir</Button>
          </XStack>
        </AppCard>
      ))}</YStack> : null}
    </ProfessionalScreen>
  );
}
