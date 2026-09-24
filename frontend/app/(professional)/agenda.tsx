import { useCallback, useEffect, useState } from 'react';
import { Button, Paragraph, SizableText, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { FeedbackState } from '@/components/feedback-state';
import { ProfessionalBrand, ProfessionalScreen } from '@/components/professional/professional-screen';
import { useAuth } from '@/contexts/auth-context';
import { listAppointments, type FollowUpAppointment } from '@/lib/api';

function stateLabel(item: FollowUpAppointment) {
  if (item.state === 'cancelled') return 'Cancelada';
  if (item.patientResponse === 'confirmed') return 'Confirmada pelo paciente';
  return 'Aguardando confirmação';
}

export default function AgendaScreen() {
  const { session } = useAuth();
  const [items, setItems] = useState<FollowUpAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    if (!session?.access_token) return;
    await Promise.resolve();
    setLoading(true); setError('');
    try { setItems(await listAppointments(session.access_token)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a agenda.'); }
    finally { setLoading(false); }
  }, [session]);
  useEffect(() => { const timeout = setTimeout(() => { void load(); }, 0); return () => clearTimeout(timeout); }, [load]);

  return <ProfessionalScreen>
    <ProfessionalBrand />
    <AppHeader eyebrow="ORGANIZAÇÃO" title="Agenda" description="Consultas de todos os seus vínculos ativos." />
    {loading ? <FeedbackState status="loading" title="Carregando agenda" /> : null}
    {!loading && error ? <YStack gap="$3"><FeedbackState status="error" description={error} /><Button minH="$touchTarget" onPress={load}>Tentar novamente</Button></YStack> : null}
    {!loading && !error && items.length === 0 ? <FeedbackState status="empty" title="Nenhuma consulta" description="Crie uma consulta no acompanhamento de um paciente." /> : null}
    {!loading && !error ? <YStack gap="$3">{items.map((item) => <AppCard key={item.id} background="$surface" rounded="$panel"><SizableText color="$color" fontWeight="700">{new Date(item.startsAt).toLocaleString('pt-BR')}</SizableText><Paragraph color="$muted">Até {new Date(item.endsAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</Paragraph><Paragraph color={item.state === 'cancelled' ? '$declinedColor' : '$brand'}>{stateLabel(item)}</Paragraph></AppCard>)}</YStack> : null}
  </ProfessionalScreen>;
}
