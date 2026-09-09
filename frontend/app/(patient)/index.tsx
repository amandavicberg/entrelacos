import { Ionicons } from '@expo/vector-icons';
import { Redirect } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, ScrollView } from 'react-native';
import {
  Button,
  Card,
  H2,
  Paragraph,
  Separator,
  SizableText,
  TextArea,
  useTheme,
  XStack,
  YStack,
} from 'tamagui';

import { AppCard } from '@/components/app-card';
import { AppScreen } from '@/components/app-screen';
import { FeedbackState } from '@/components/feedback-state';
import { BrandButton } from '@/components/brand-button';
import { useAuth } from '@/contexts/auth-context';

const feelings = [
  { label: 'Tranquilo(a)', icon: 'leaf-outline' as const },
  { label: 'Feliz', icon: 'sunny-outline' as const },
  { label: 'Cansado(a)', icon: 'cloud-outline' as const },
  { label: 'Ansioso(a)', icon: 'pulse-outline' as const },
  { label: 'Triste', icon: 'rainy-outline' as const },
];

const menuItems = [
  { label: 'Minha história', icon: 'book-outline' as const },
  { label: 'Aprendizados', icon: 'sparkles-outline' as const },
  { label: 'Documentos e exames', icon: 'document-text-outline' as const },
  { label: 'Ferramentas de apoio', icon: 'heart-outline' as const },
  { label: 'Materiais exclusivos', icon: 'play-circle-outline' as const },
  { label: 'Mensagem para minha profissional', icon: 'chatbubble-ellipses-outline' as const },
];

export default function PatientHomeScreen() {
  const { accessState, signOut } = useAuth();
  const theme = useTheme();
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedFeeling, setSelectedFeeling] = useState<string | null>(null);
  const [dailyNote, setDailyNote] = useState('');
  const [sessionNote, setSessionNote] = useState('');
  const [saved, setSaved] = useState(false);

  if (accessState === 'patient-pending') return <Redirect href="/(patient)/pending" />;
  if (accessState !== 'patient-active') return <FeedbackState status="loading" title="Validando acesso" />;

  function saveDailyCheckIn() {
    setSaved(true);
  }

  return (
    <AppScreen>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
        <YStack gap="$5" maxW={720} width="100%" self="center">
          <XStack items="center" justify="space-between" gap="$3">
            <YStack gap="$1" flex={1}>
              <SizableText size="$2" color="$brand" fontWeight="700" letterSpacing={1}>
                MEU ACOMPANHAMENTO
              </SizableText>
              <H2 color="$color">Olá, que bom ter você aqui.</H2>
              <Paragraph color="$muted">Como você está se sentindo hoje?</Paragraph>
            </YStack>
            <Button
              aria-label="Abrir menu do paciente"
              accessibilityRole="button"
              circular
              size="$5"
              bg="$background"
              borderWidth={1}
              borderColor="$borderColor"
              icon={<Ionicons name="menu-outline" size={24} color={theme.color.val} />}
              onPress={() => setMenuVisible(true)}
            />
          </XStack>

          <AppCard title="Como você está hoje?">
            <Paragraph color="$muted">Escolha o sentimento que mais combina com o seu momento.</Paragraph>
            <XStack flexWrap="wrap" gap="$2">
              {feelings.map((feeling) => {
                const isSelected = selectedFeeling === feeling.label;
                return (
                  <Button
                    key={feeling.label}
                    size="$3"
                    flex={1}
                    minW={112}
                    bg={isSelected ? '$brand' : '$background'}
                    color={isSelected ? '$brandContrast' : '$color'}
                    borderWidth={1}
                    borderColor={isSelected ? '$brand' : '$borderColor'}
                    pressStyle={{ opacity: 0.82 }}
                    icon={<Ionicons name={feeling.icon} size={18} color={isSelected ? theme.brandContrast.val : theme.color.val} />}
                    onPress={() => {
                      setSelectedFeeling(feeling.label);
                      setSaved(false);
                    }}
                  >
                    {feeling.label}
                  </Button>
                );
              })}
            </XStack>
            <TextArea
              aria-label="Anotação sobre como estou me sentindo hoje"
              placeholder="Quer deixar uma anotação sobre este momento?"
              value={dailyNote}
              onChangeText={(value) => {
                setDailyNote(value);
                setSaved(false);
              }}
              minH={92}
              borderColor="$borderColor"
              focusStyle={{ borderColor: '$brand' }}
            />
            <XStack items="center" justify="space-between" gap="$3" flexWrap="wrap">
              <Paragraph color="$muted" size="$2" flex={1}>
                Este registro será preparado para o seu acompanhamento.
              </Paragraph>
              <BrandButton disabled={!selectedFeeling && !dailyNote.trim()} onPress={saveDailyCheckIn}>
                {saved ? 'Registrado' : 'Registrar hoje'}
              </BrandButton>
            </XStack>
          </AppCard>

          <AppCard title="Para a próxima sessão">
            <Paragraph color="$muted">
              Anote algo que você gostaria de conversar ou não quer esquecer.
            </Paragraph>
            <TextArea
              aria-label="Anotação para a próxima sessão"
              placeholder="O que você gostaria de levar para a próxima sessão?"
              value={sessionNote}
              onChangeText={setSessionNote}
              minH={86}
              borderColor="$borderColor"
              focusStyle={{ borderColor: '$brand' }}
            />
            <XStack items="center" gap="$2">
              <Ionicons name="calendar-outline" size={20} color="currentColor" />
              <Paragraph color="$muted" size="$2">
                Sua próxima sessão aparecerá aqui quando estiver disponível.
              </Paragraph>
            </XStack>
          </AppCard>

          <AppCard title="Um cuidado importante">
            <XStack gap="$3" items="flex-start">
              <YStack bg="$background" p="$3">
                <Ionicons name="shield-checkmark-outline" size={24} color={theme.brand.val} />
              </YStack>
              <YStack gap="$1" flex={1}>
                <SizableText color="$color" fontWeight="700">Protocolo de emergência</SizableText>
                <Paragraph color="$muted">
                  As orientações da sua profissional aparecerão aqui quando forem configuradas.
                </Paragraph>
              </YStack>
            </XStack>
          </AppCard>

          <YStack gap="$3">
            <XStack items="center" justify="space-between">
              <SizableText size="$6" color="$color" fontWeight="700">Acesso rápido</SizableText>
              <Button chromeless color="$brand" onPress={() => setMenuVisible(true)}>Ver menu</Button>
            </XStack>
            <XStack gap="$3" flexWrap="wrap">
              {menuItems.slice(0, 3).map((item) => (
                <Card key={item.label} flex={1} minW={180} p="$4" borderWidth={1} borderColor="$borderColor" bg="$background">
                  <YStack gap="$3">
                    <Ionicons name={item.icon} size={24} color={theme.brand.val} />
                    <SizableText color="$color" fontWeight="600">{item.label}</SizableText>
                    <Paragraph color="$muted" size="$2">Disponível em breve</Paragraph>
                  </YStack>
                </Card>
              ))}
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>

      <Modal visible={menuVisible} transparent animationType="slide" onRequestClose={() => setMenuVisible(false)}>
        <Pressable
          accessibilityLabel="Fechar menu"
          style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.32)' }}
          onPress={() => setMenuVisible(false)}
        >
          <Pressable
            style={{
              width: '86%',
              maxWidth: 380,
              height: '100%',
              padding: 24,
              paddingTop: 64,
              backgroundColor: theme.background.val,
            }}
            onPress={(event) => event.stopPropagation()}
          >
            <YStack gap="$4" flex={1}>
              <XStack items="center" justify="space-between">
                <YStack gap="$1">
                  <SizableText size="$2" color="$brand" fontWeight="700" letterSpacing={1}>MENU</SizableText>
                  <H2 color="$color">Seu espaço</H2>
                </YStack>
                <Button
                  aria-label="Fechar menu"
                  circular
                  chromeless
                  icon={<Ionicons name="close-outline" size={26} color={theme.color.val} />}
                  onPress={() => setMenuVisible(false)}
                />
              </XStack>
              <Separator borderColor="$borderColor" />
              <YStack gap="$2" flex={1}>
                {menuItems.map((item) => (
                  <Button
                    key={item.label}
                    justify="flex-start"
                    size="$5"
                    bg="$background"
                    color="$color"
                    disabled
                    opacity={0.7}
                    borderWidth={1}
                    borderColor="$borderColor"
                    icon={<Ionicons name={item.icon} size={21} color={theme.color.val} />}
                    onPress={() => setMenuVisible(false)}
                  >
                    {item.label}
                  </Button>
                ))}
              </YStack>
              <Button
                justify="flex-start"
                size="$5"
                chromeless
                color="$muted"
                icon={<Ionicons name="log-out-outline" size={21} color={theme.muted.val} />}
                onPress={signOut}
              >
                Sair da conta
              </Button>
            </YStack>
          </Pressable>
        </Pressable>
      </Modal>
    </AppScreen>
  );
}
