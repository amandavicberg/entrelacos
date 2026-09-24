import { Ionicons } from '@expo/vector-icons';
import { Redirect, type RelativePathString, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView } from 'react-native';
import { Button, Card, Paragraph, Separator, SizableText, TextArea, useTheme, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { AppHeader } from '@/components/app-header';
import { AppScreen } from '@/components/app-screen';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { useAuth } from '@/contexts/auth-context';
import { getBirthdayMessage, listAppointments, listMaterials, listPatientObservations, type FollowUpAppointment, type FollowUpMaterial, type FollowUpObservation } from '@/lib/api';

const feelings = [
  { label: 'Tranquilo(a)', icon: 'leaf-outline' as const },
  { label: 'Feliz', icon: 'sunny-outline' as const },
  { label: 'Cansado(a)', icon: 'cloud-outline' as const },
  { label: 'Ansioso(a)', icon: 'pulse-outline' as const },
  { label: 'Triste', icon: 'rainy-outline' as const },
];

const menuItems = [
  { label: 'Minha agenda', icon: 'calendar-outline' as const, href: '/(patient)/agenda' as RelativePathString },
  { label: 'Orientações compartilhadas', icon: 'reader-outline' as const, href: '/(patient)/observations' as RelativePathString },
  { label: 'Meu histórico', icon: 'time-outline' as const, href: '/(patient)/history' as RelativePathString },
  { label: 'Materiais exclusivos', icon: 'play-circle-outline' as const, href: '/(patient)/materials' as RelativePathString },
  { label: 'Meus documentos', icon: 'document-attach-outline' as const, href: '/(patient)/documents' as RelativePathString },
  { label: 'Mural para a sessão', icon: 'chatbox-outline' as const, href: '/(patient)/messages' as RelativePathString },
  { label: 'Check-ins', icon: 'heart-outline' as const, href: '/(patient)/check-ins' as RelativePathString },
  { label: 'Aprendizados', icon: 'sparkles-outline' as const },
  { label: 'Documentos e exames', icon: 'document-text-outline' as const },
  { label: 'Ferramentas de apoio', icon: 'heart-outline' as const },
  { label: 'Mensagem para minha profissional', icon: 'chatbubble-ellipses-outline' as const },
];

function nextAppointment(appointments: FollowUpAppointment[]) {
  const now = Date.now();
  return appointments.filter((item) => item.state === 'scheduled' && Date.parse(item.startsAt) >= now)
    .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))[0];
}

function formatAppointment(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' }).format(new Date(date));
}

export default function PatientHomeScreen() {
  const { accessState, session, signOut } = useAuth();
  const theme = useTheme();
  const router = useRouter();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [dailyNote, setDailyNote] = useState('');
  const [checkInFeedback, setCheckInFeedback] = useState('');
  const [appointments, setAppointments] = useState<FollowUpAppointment[]>([]);
  const [observations, setObservations] = useState<FollowUpObservation[]>([]);
  const [materials, setMaterials] = useState<FollowUpMaterial[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState('');
  const [leaving, setLeaving] = useState(false);
  const [birthdayMessage, setBirthdayMessage] = useState<string | null>(null);

  const loadSummary = useCallback(async () => {
    if (!session?.access_token) return;
    setSummaryLoading(true); setSummaryError('');
    try {
      const [appointmentData, observationData, materialData, birthdayData] = await Promise.all([
        listAppointments(session.access_token, undefined, true), listPatientObservations(session.access_token), listMaterials(session.access_token, true), getBirthdayMessage(session.access_token),
      ]);
      setAppointments(appointmentData); setObservations(observationData); setMaterials(materialData.materials);
      setBirthdayMessage(birthdayData.isBirthday ? birthdayData.message ?? 'Feliz aniversário! Que seu novo ciclo seja leve, acolhedor e cheio de boas possibilidades.' : null);
    } catch (cause) {
      setSummaryError(cause instanceof Error ? cause.message : 'Não foi possível carregar o resumo do acompanhamento.');
    } finally { setSummaryLoading(false); }
  }, [session?.access_token]);

  useEffect(() => {
    const timeout = setTimeout(() => void loadSummary(), 0);
    return () => clearTimeout(timeout);
  }, [loadSummary]);

  if (accessState === 'patient-pending') return <Redirect href="/(patient)/pending" />;
  if (accessState === 'patient-unassociated') return <Redirect href={'/(patient)/connect' as RelativePathString} />;
  if (accessState !== 'patient-active') return <FeedbackState status="loading" title="Validando acesso" />;

  const upcoming = nextAppointment(appointments);
  const openItem = (item: (typeof menuItems)[number]) => { setMenuVisible(false); if (item.href) router.push(item.href); };
  const resetCheckIn = () => setCheckInFeedback('');

  async function handleSignOut() {
    if (leaving) return;
    setLeaving(true);
    try { await signOut(); } finally { setLeaving(false); }
  }

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <YStack gap="$5" maxW={720} width="100%" self="center">
          <XStack items="flex-start" justify="space-between" gap="$3">
            <AppHeader eyebrow="MEU ACOMPANHAMENTO" title="Olá, que bom ter você aqui." description="Veja com calma o que está disponível para hoje." />
            <Button aria-label="Abrir menu do paciente" circular minW="$touchTarget" minH="$touchTarget" bg="$surface" borderWidth={1} borderColor="$borderColor" icon={<Ionicons name="menu-outline" size={24} color={theme.color.val} />} onPress={() => setMenuVisible(true)} />
          </XStack>

          <AppCard title="Como você está hoje?">
            <Paragraph color="$muted">Escolha a opção mais próxima do seu momento e, se quiser, faça uma anotação para você.</Paragraph>
            <XStack flexWrap="wrap" gap="$2" accessibilityRole="radiogroup">
              {feelings.map((feeling) => {
                const isSelected = selectedFeeling === feeling.label;
                return <Button key={feeling.label} minH="$touchTarget" flex={1} minW={112} bg={isSelected ? '$brand' : '$surface'} color={isSelected ? '$brandContrast' : '$color'} borderWidth={1} borderColor={isSelected ? '$brand' : '$borderColor'} pressStyle={{ opacity: 0.82 }} accessibilityRole="radio" accessibilityState={{ selected: isSelected }} icon={<Ionicons name={feeling.icon} size={18} color={isSelected ? theme.brandContrast.val : theme.color.val} />} onPress={() => { setSelectedFeeling(feeling.label); resetCheckIn(); }}>{feeling.label}</Button>;
              })}
            </XStack>
            <TextArea aria-label="Anotação pessoal sobre como estou me sentindo hoje" placeholder="Quer anotar algo sobre este momento?" value={dailyNote} onChangeText={(value) => { setDailyNote(value); resetCheckIn(); }} maxLength={500} minH={92} borderColor="$borderColor" focusStyle={{ borderColor: '$brand' }} />
            <XStack items="center" justify="space-between" gap="$3" flexWrap="wrap">
              <Paragraph color="$muted" size="$2" flex={1}>Este espaço ainda não salva informações no seu acompanhamento.</Paragraph>
              <BrandButton disabled={!selectedFeeling && !dailyNote.trim()} onPress={() => setCheckInFeedback('Sua anotação ficou pronta nesta tela. Ela não é enviada automaticamente; leve o que for importante para a próxima conversa.')}>Preparar anotação</BrandButton>
            </XStack>
            {checkInFeedback ? <Paragraph color="$brand" size="$2" role="status">{checkInFeedback}</Paragraph> : null}
          </AppCard>

          <AppCard title="Próxima sessão">
            {summaryLoading ? <FeedbackState status="loading" title="Buscando sua agenda" description="Aguarde um momento." /> : null}
            {!summaryLoading && summaryError ? <YStack gap="$2"><FeedbackState status="error" title="Agenda indisponível" description={summaryError} /><Button minH="$touchTarget" onPress={() => void loadSummary()}>Tentar novamente</Button></YStack> : null}
            {!summaryLoading && !summaryError && upcoming ? <YStack gap="$2"><XStack gap="$2" items="center"><Ionicons name="calendar-outline" size={21} color={theme.brand.val} /><SizableText color="$color" fontWeight="700" textTransform="capitalize">{formatAppointment(upcoming.startsAt)}</SizableText></XStack><Paragraph color="$muted">{upcoming.patientResponse === 'confirmed' ? 'Sua presença está confirmada.' : 'Sua confirmação está pendente.'}</Paragraph><Button self="flex-start" minH="$touchTarget" onPress={() => router.push('/(patient)/agenda' as RelativePathString)}>Ver agenda</Button></YStack> : null}
            {!summaryLoading && !summaryError && !upcoming ? <YStack gap="$2"><Paragraph color="$muted">Nenhuma sessão futura está disponível no momento.</Paragraph><Button self="flex-start" minH="$touchTarget" onPress={() => router.push('/(patient)/agenda' as RelativePathString)}>Abrir agenda</Button></YStack> : null}
          </AppCard>

          {birthdayMessage ? <AppCard title="Feliz aniversário!"><Paragraph color="$color">{birthdayMessage}</Paragraph></AppCard> : null}

          <YStack gap="$3">
            <XStack items="center" justify="space-between" gap="$3"><SizableText size="$6" color="$color" fontWeight="700">Acesso rápido</SizableText><Button chromeless color="$brand" minH="$touchTarget" onPress={() => setMenuVisible(true)}>Ver menu</Button></XStack>
            <XStack gap="$3" flexWrap="wrap">
              {menuItems.slice(0, 3).map((item) => {
                const count = item.label === 'Orientações compartilhadas' ? observations.length : undefined;
                return <Card key={item.label} flex={1} minW={180} p="$4" borderWidth={1} borderColor="$borderColor" bg="$surface" pressStyle={{ opacity: 0.82 }} onPress={() => openItem(item)} accessibilityRole="button" accessibilityLabel={`Abrir ${item.label}`}><YStack gap="$3"><Ionicons name={item.icon} size={24} color={theme.brand.val} /><SizableText color="$color" fontWeight="600">{item.label}</SizableText><Paragraph color="$muted" size="$2">{count === undefined ? 'Abrir' : count === 0 ? 'Nada novo por aqui' : `${count} disponível${count > 1 ? 'is' : ''}`}</Paragraph></YStack></Card>;
              })}
            </XStack>
            {!summaryLoading && !summaryError && materials.length > 0 ? <Button self="flex-start" minH="$touchTarget" onPress={() => router.push('/(patient)/materials' as RelativePathString)}>Ver {materials.length} material{materials.length > 1 ? 'is' : ''} compartilhado{materials.length > 1 ? 's' : ''}</Button> : null}
          </YStack>

          <AppCard title="Um cuidado importante"><XStack gap="$3" items="flex-start"><YStack bg="$soft" p="$3" rounded="$control"><Ionicons name="shield-checkmark-outline" size={24} color={theme.brand.val} /></YStack><YStack gap="$1" flex={1}><SizableText color="$color" fontWeight="700">Protocolo de emergência</SizableText><Paragraph color="$muted">Ainda não há um protocolo disponibilizado neste acompanhamento. Em caso de urgência, procure o serviço de emergência da sua região.</Paragraph></YStack></XStack></AppCard>
        </YStack>
      </ScrollView>

      <Modal visible={menuVisible} transparent animationType="slide" onRequestClose={() => setMenuVisible(false)}>
        <Pressable accessibilityLabel="Fechar menu" style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.32)' }} onPress={() => setMenuVisible(false)}>
          <Pressable style={{ width: '86%', maxWidth: 380, height: '100%', padding: 24, paddingTop: 64, backgroundColor: theme.background.val }} onPress={(event) => event.stopPropagation()}>
            <YStack gap="$4" flex={1}>
              <XStack items="center" justify="space-between"><AppHeader eyebrow="MENU" title="Seu espaço" /><Button aria-label="Fechar menu" circular chromeless minW="$touchTarget" minH="$touchTarget" icon={<Ionicons name="close-outline" size={26} color={theme.color.val} />} onPress={() => setMenuVisible(false)} /></XStack>
              <Separator borderColor="$borderColor" />
              <YStack gap="$2" flex={1}>{menuItems.map((item) => <Button key={item.label} justify="flex-start" minH="$touchTarget" bg="$surface" color="$color" borderWidth={1} borderColor="$borderColor" icon={<Ionicons name={item.icon} size={21} color={theme.color.val} />} onPress={() => openItem(item)} accessibilityHint={item.href ? undefined : 'Este recurso estará disponível em breve.'}>{item.href ? item.label : `${item.label} · Em breve`}</Button>)}</YStack>
              <Button justify="flex-start" minH="$touchTarget" chromeless color="$muted" disabled={leaving} icon={<Ionicons name="log-out-outline" size={21} color={theme.muted.val} />} onPress={() => void handleSignOut()}>{leaving ? 'Saindo…' : 'Sair da conta'}</Button>
            </YStack>
          </Pressable>
        </Pressable>
      </Modal>
    </AppScreen>
  );
}
