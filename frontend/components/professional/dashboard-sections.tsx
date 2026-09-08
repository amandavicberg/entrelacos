import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { Modal, useWindowDimensions } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { Button, Paragraph, Sheet, SizableText, useTheme, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { FeedbackState } from '@/components/feedback-state';
import {
  appointmentSummary, birthdayLabel, monthlyBirthdays, upcomingBirthdays,
  type Birthday, type DemoAppointment, type DemoPatient,
} from '@/lib/professional-dashboard';
import { InitialsAvatar } from './professional-screen';

export function Panel({ children }: PropsWithChildren) {
  return <AppCard background="$surface" rounded="$panel" p="$5">{children}</AppCard>;
}

export function SectionTitle({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  return (
    <XStack items="center" justify="space-between" gap="$2" flexWrap="wrap">
      <SizableText role="heading" color="$color" fontFamily="$heading" size="$6" shrink={1}>{title}</SizableText>
      {action ? <Button chromeless color="$brand" minH={44} height="auto" py="$2" px={0} onPress={onPress} fontWeight="600">{action}</Button> : null}
    </XStack>
  );
}

export function DashboardSkeleton() {
  return (
    <YStack gap="$4" aria-label="Carregando resumo demonstrativo" aria-busy>
      <XStack gap="$3" flexWrap="wrap">
        {[0, 1, 2].map((key) => <YStack key={key} bg="$soft" rounded="$panel" height={112} flex={1} minW={110} />)}
      </XStack>
      <YStack bg="$soft" rounded="$panel" height={230} />
      <YStack bg="$soft" rounded="$panel" height={180} />
    </YStack>
  );
}

export function SummaryCards({ patients, appointments }: { patients: DemoPatient[]; appointments: DemoAppointment[] }) {
  const theme = useTheme();
  const router = useRouter();
  const { width, fontScale } = useWindowDimensions();
  const summary = appointmentSummary(patients, appointments);
  const narrow = width < 370 || fontScale > 1.3;
  const items = [
    { label: 'Pacientes vinculados', value: summary.patients, icon: 'people-outline', route: '/(professional)/patients' },
    { label: 'Consultas hoje', value: summary.today, icon: 'calendar-outline', route: '/(professional)/agenda' },
    { label: 'Aguardando confirmação', value: summary.pending, icon: 'time-outline', route: '/(professional)/agenda' },
  ] as const;
  return (
    <XStack gap="$3" flexWrap="wrap">
      {items.map((item) => (
        <YStack key={item.label} flex={1} flexBasis={narrow ? '100%' : width < 600 ? '42%' : 0} minW={0}>
          <Button unstyled role="button" onPress={() => router.navigate(item.route)}
            aria-label={`${item.label}: ${item.value}. Dados demonstrativos.`}
            bg="$surface" borderWidth={1} borderColor="$borderColor" rounded="$panel" p="$4"
            height="auto" minH={104} width="100%" items="stretch" justify="flex-start"
            pressStyle={{ opacity: 0.8 }} focusStyle={{ outlineWidth: 2, outlineColor: '$brand', outlineStyle: 'solid' }}>
            <YStack gap="$2" pointerEvents="none" width="100%">
              <XStack items="center" justify="space-between" gap="$2">
                <SizableText color="$color" fontFamily="$heading" size="$8">{item.value.toString().padStart(2, '0')}</SizableText>
                <Ionicons name={item.icon} size={20} color={theme.brand.val} accessible={false} />
              </XStack>
              <Paragraph color="$muted" size="$3" text="left">{item.label}</Paragraph>
            </YStack>
          </Button>
        </YStack>
      ))}
    </XStack>
  );
}

export function QuickActions() {
  const router = useRouter();
  const theme = useTheme();
  const actions = [
    { label: 'Pacientes', icon: 'people-outline', route: '/(professional)/patients' },
    { label: 'Agenda', icon: 'calendar-outline', route: '/(professional)/agenda' },
    { label: 'Materiais', icon: 'folder-open-outline', route: '/(professional)/materials' },
  ] as const;
  return (
    <YStack gap="$3">
      <SectionTitle title="Acesso rápido" />
      <XStack gap="$2" flexWrap="wrap">
        {actions.map(({ label, icon, route }) => (
          <Button key={label} flex={1} minW={90} minH={68} height="auto" p="$3" rounded="$control" bg="$soft"
            onPress={() => router.navigate(route)} aria-label={`Abrir ${label}`}>
            <YStack items="center" gap="$2" pointerEvents="none" shrink={1}>
              <Ionicons name={icon} color={theme.brand.val} size={22} accessible={false} />
              <SizableText color="$brand" size="$3" fontWeight="600">{label}</SizableText>
            </YStack>
          </Button>
        ))}
      </XStack>
    </YStack>
  );
}

const confirmationStyles = {
  confirmed: { text: 'Presença confirmada', icon: 'checkmark-circle-outline', background: '$soft', color: '$brand' },
  pending: { text: 'Aguardando resposta', icon: 'time-outline', background: '$pendingBackground', color: '$pendingColor' },
  declined: { text: 'Não comparecerá', icon: 'close-circle-outline', background: '$declinedBackground', color: '$declinedColor' },
} as const;

function ConfirmationBadge({ confirmation }: { confirmation: DemoAppointment['confirmation'] }) {
  const theme = useTheme();
  const style = confirmationStyles[confirmation];
  const iconColor = confirmation === 'pending' ? theme.pendingColor.val : confirmation === 'declined' ? theme.declinedColor.val : theme.brand.val;
  return (
    <XStack bg={style.background} rounded="$4" px="$2" py="$1" gap="$1" items="center" self="flex-start" maxW="100%">
      <Ionicons name={style.icon} color={iconColor} size={14} accessible={false} />
      <SizableText color={style.color} size="$2" shrink={1}>{style.text}</SizableText>
    </XStack>
  );
}

export function AppointmentsPanel({ patients, appointments, baseDate }: { patients: DemoPatient[]; appointments: DemoAppointment[]; baseDate: Date }) {
  const router = useRouter();
  const { fontScale, width } = useWindowDimensions();
  return (
    <Panel>
      <SectionTitle title="Consultas de hoje" action="Ver agenda" onPress={() => router.navigate('/(professional)/agenda')} />
      <Paragraph color="$muted" size="$3">{baseDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</Paragraph>
      {appointments.length === 0 ? <FeedbackState status="empty" title="Sem consultas hoje" description="Você não tem consultas agendadas para hoje." /> :
        [...appointments].sort((a, b) => a.time.localeCompare(b.time)).slice(0, 3).map((appointment, index) => {
          const patient = patients.find(({ id }) => id === appointment.patientId);
          if (!patient) return null;
          return (
            <XStack key={appointment.id} gap="$3" items="flex-start" py="$3" borderTopWidth={index ? 1 : 0} borderColor="$borderColor"
              flexDirection={width < 370 || fontScale > 1.3 ? 'column' : 'row'}>
              <SizableText color="$brand" fontFamily="$heading" size="$4" minW={54} pt="$2">{appointment.time}</SizableText>
              <XStack gap="$3" flex={width < 370 || fontScale > 1.3 ? undefined : 1} width={width < 370 || fontScale > 1.3 ? '100%' : undefined} items="center">
                <InitialsAvatar name={patient.name} />
                <YStack flex={1} minW={0} gap="$2">
                  <SizableText color="$color" fontWeight="600" size="$4">{patient.name}</SizableText>
                  <ConfirmationBadge confirmation={appointment.confirmation} />
                </YStack>
              </XStack>
            </XStack>
          );
        })}
      {appointments.length > 3 ? <Button chromeless color="$brand" minH={44} height="auto" py="$2" onPress={() => router.navigate('/(professional)/agenda')}>Ver todas as consultas</Button> : null}
    </Panel>
  );
}

function BirthdayRow({ birthday }: { birthday: Birthday }) {
  return (
    <XStack gap="$3" items="center" py="$3">
      <InitialsAvatar name={birthday.name} />
      <YStack flex={1} gap="$1">
        <SizableText color="$color" size="$4" fontWeight="600">{birthday.name}</SizableText>
        <XStack gap="$2" flexWrap="wrap">
          <SizableText color="$muted" size="$3">{birthday.date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' }).replace(' de ', ' ').replace('.', '')}</SizableText>
          <SizableText color="$brand" size="$3" fontWeight={birthday.daysUntil === 0 ? '700' : '400'}>{birthdayLabel(birthday.daysUntil)}</SizableText>
        </XStack>
      </YStack>
    </XStack>
  );
}

export function BirthdaysPanel({ patients, baseDate }: { patients: DemoPatient[]; baseDate: Date }) {
  const [open, setOpen] = useState(false);
  const reducedMotion = useReducedMotion();
  const birthdays = upcomingBirthdays(patients, baseDate);
  const monthly = monthlyBirthdays(patients, baseDate);
  const theme = useTheme();
  return (
    <>
      <Panel>
        <XStack gap="$2" items="center"><Ionicons name="gift-outline" color={theme.brand.val} size={22} accessible={false} /><SectionTitle title="Aniversariantes" /></XStack>
        <Paragraph color="$muted" size="$3">Pequenas lembranças que aproximam.</Paragraph>
        {birthdays.length ? birthdays.slice(0, 3).map((birthday) => <BirthdayRow key={birthday.id} birthday={birthday} />) :
          <FeedbackState status="empty" title="Sem aniversariantes próximos" description="Nenhum aniversário nos próximos 30 dias." />}
        <Button chromeless color="$brand" minH={44} height="auto" py="$2" onPress={() => setOpen(true)}><SizableText color="$brand" text="center" shrink={1}>Ver aniversariantes do mês</SizableText></Button>
      </Panel>
      <Modal transparent visible={open} animationType="none" onRequestClose={() => setOpen(false)}>
      <Sheet open={open} onOpenChange={setOpen} snapPoints={[75]} dismissOnSnapToBottom disableDrag transitionConfig={{ type: 'timing', duration: reducedMotion ? 0 : 180 }}>
        <Sheet.Overlay bg="$shadowColor" opacity={0.4} />
        <Sheet.Frame bg="$surface" p="$5" gap="$3" borderTopLeftRadius="$panel" borderTopRightRadius="$panel">
          <SectionTitle title="Aniversariantes do mês" />
          <Paragraph color="$muted">{baseDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })} · Dados demonstrativos</Paragraph>
          <Button minH={44} height="auto" py="$2" color="$brand" bg="$soft" onPress={() => setOpen(false)} aria-label="Fechar aniversariantes do mês">Fechar</Button>
          <Sheet.ScrollView>
            <YStack pb="$7">
              {monthly.length ? monthly.map((birthday) => <BirthdayRow key={birthday.id} birthday={birthday} />) :
                <FeedbackState status="empty" title="Nenhum aniversário neste mês" description="Os aniversariantes do mês aparecerão aqui." />}
            </YStack>
          </Sheet.ScrollView>
        </Sheet.Frame>
      </Sheet>
      </Modal>
    </>
  );
}

export function DemoNotice() {
  const theme = useTheme();
  return (
    <XStack gap="$2" items="flex-start" bg="$soft" rounded="$control" p="$3">
      <Ionicons name="information-circle-outline" color={theme.brand.val} size={19} accessible={false} />
      <Paragraph color="$brand" size="$3" flex={1}>Prévia com dados demonstrativos. Os pacientes, as consultas e os aniversários abaixo são fictícios.</Paragraph>
    </XStack>
  );
}
