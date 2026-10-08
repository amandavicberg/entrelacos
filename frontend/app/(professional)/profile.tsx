import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Button, H1, Paragraph, SizableText, Spinner, useTheme, XStack, YStack } from 'tamagui';

import { AppCard } from '@/components/app-card';
import { AppInput } from '@/components/app-input';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { InitialsAvatar, ProfessionalScreen } from '@/components/professional/professional-screen';
import { useAuth } from '@/contexts/auth-context';
import { useProfessionalProfile, type ProfessionalProfile } from '@/hooks/use-professional-profile';
import { updateProfessionalDetails, updateProfessionalIdentity } from '@/lib/api';

function ProfileForm({ initial, email, onSaved }: {
  initial: ProfessionalProfile; email?: string; onSaved: () => void;
}) {
  const theme = useTheme();
  const { session, signOut } = useAuth();
  const [name, setName] = useState(initial.name);
  const [specialty, setSpecialty] = useState(initial.specialty ?? '');
  const [registrationType, setRegistrationType] = useState(initial.registrationType ?? '');
  const [registrationNumber, setRegistrationNumber] = useState(initial.registrationNumber ?? '');
  const [saving, setSaving] = useState<'identity' | 'professional' | null>(null);
  const [leaving, setLeaving] = useState(false);
  const [message, setMessage] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const [nameError, setNameError] = useState('');
  const [detailError, setDetailError] = useState('');

  async function saveIdentity() {
    const fullName = name.trim();
    if (!fullName || fullName.length > 160) {
      setNameError('Informe um nome com até 160 caracteres.');
      return;
    }
    if (!session?.access_token) return;
    setNameError('');
    setMessage(null);
    setSaving('identity');
    try {
      await updateProfessionalIdentity(session.access_token, fullName);
      setName(fullName);
      setMessage({ kind: 'success', text: 'Nome atualizado.' });
      onSaved();
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Não foi possível salvar o nome.' });
    } finally {
      setSaving(null);
    }
  }

  async function saveProfessional() {
    const details = {
      specialty: specialty.trim(), registrationType: registrationType.trim(), registrationNumber: registrationNumber.trim(),
    };
    if (!details.specialty || !details.registrationType || !details.registrationNumber
      || details.specialty.length > 120 || details.registrationType.length > 30 || details.registrationNumber.length > 60) {
      setDetailError('Preencha os três campos. Use até 120 caracteres para atuação, 30 para tipo e 60 para número.');
      return;
    }
    if (!session?.access_token) return;
    setDetailError('');
    setMessage(null);
    setSaving('professional');
    try {
      await updateProfessionalDetails(session.access_token, details);
      setSpecialty(details.specialty);
      setRegistrationType(details.registrationType);
      setRegistrationNumber(details.registrationNumber);
      setMessage({ kind: 'success', text: 'Dados profissionais atualizados.' });
      onSaved();
    } catch (error) {
      setMessage({ kind: 'error', text: error instanceof Error ? error.message : 'Não foi possível salvar os dados profissionais.' });
    } finally {
      setSaving(null);
    }
  }

  async function handleSignOut() {
    if (leaving) return;
    setLeaving(true);
    setMessage(null);
    try {
      await signOut();
    } catch {
      setMessage({ kind: 'error', text: 'Não foi possível sair. Tente novamente.' });
      setLeaving(false);
    }
  }

  return (
    <>
      <XStack items="center" gap="$3">
        <InitialsAvatar name={name} large />
        <YStack flex={1} gap="$1">
          <H1 fontFamily="$heading" color="$color" size="$7">{name}</H1>
          <Paragraph color="$muted">Seu cadastro profissional</Paragraph>
        </YStack>
      </XStack>

      {message ? (
        <YStack p="$3" bg={message.kind === 'error' ? '$declinedBackground' : '$soft'}
          rounded="$control" borderWidth={1} borderColor="$borderColor">
          <Paragraph role={message.kind === 'error' ? 'alert' : 'status'}
            color={message.kind === 'error' ? '$declinedColor' : '$brand'}>{message.text}</Paragraph>
        </YStack>
      ) : null}

      <AppCard title="Dados pessoais" p="$5">
        <Paragraph color="$muted" size="$3">Mantenha o nome pelo qual os pacientes identificam você.</Paragraph>
        <AppInput label="Nome completo" value={name} onChangeText={setName} error={nameError}
          autoCapitalize="words" autoComplete="name" maxLength={160} disabled={saving !== null} />
        {email ? (
          <YStack gap="$1">
            <SizableText color="$color" fontWeight="600">E-mail de acesso</SizableText>
            <Paragraph color="$muted" selectable>{email}</Paragraph>
            <Paragraph color="$muted" size="$2">Para alterar o e-mail de acesso, contate o suporte do projeto.</Paragraph>
          </YStack>
        ) : null}
        <BrandButton self="flex-start" disabled={saving !== null || name.trim() === initial.name}
          icon={saving === 'identity' ? <Spinner size="small" color="$brandContrast" /> : undefined}
          onPress={() => void saveIdentity()}>
          {saving === 'identity' ? 'Salvando…' : 'Salvar nome'}
        </BrandButton>
      </AppCard>

      <AppCard title="Atuação profissional" p="$5">
        <Paragraph color="$muted" size="$3">Esses dados aparecem no seu perfil e ajudam a identificar sua atuação.</Paragraph>
        <AppInput label="Atuação" value={specialty} onChangeText={setSpecialty}
          placeholder="Ex.: Psicologia clínica" maxLength={120} disabled={saving !== null} />
        <XStack gap="$3" flexWrap="wrap">
          <YStack flex={1} minW={150}>
            <AppInput label="Tipo de registro" value={registrationType} onChangeText={setRegistrationType}
              placeholder="Ex.: CRP" autoCapitalize="characters" maxLength={30} disabled={saving !== null} />
          </YStack>
          <YStack flex={2} minW={170}>
            <AppInput label="Número do registro" value={registrationNumber} onChangeText={setRegistrationNumber}
              placeholder="Número profissional" maxLength={60} disabled={saving !== null} />
          </YStack>
        </XStack>
        {detailError ? <Paragraph color="$declinedColor" role="alert">{detailError}</Paragraph> : null}
        <BrandButton self="flex-start" disabled={saving !== null || (
          specialty.trim() === (initial.specialty ?? '')
          && registrationType.trim() === (initial.registrationType ?? '')
          && registrationNumber.trim() === (initial.registrationNumber ?? '')
        )} icon={saving === 'professional' ? <Spinner size="small" color="$brandContrast" /> : undefined}
          onPress={() => void saveProfessional()}>
          {saving === 'professional' ? 'Salvando…' : 'Salvar dados profissionais'}
        </BrandButton>
      </AppCard>

      <Button self="flex-start" minH="$touchTarget" chromeless color="$declinedColor"
        disabled={leaving} onPress={() => void handleSignOut()}>
        <Ionicons name="log-out-outline" size={18} color={theme.declinedColor.val} accessible={false} />
        {leaving ? 'Saindo…' : 'Sair da conta'}
      </Button>
    </>
  );
}

export default function ProfessionalProfileScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const profile = useProfessionalProfile();

  return (
    <ProfessionalScreen>
      <Button self="flex-start" minH="$touchTarget" chromeless color="$brand"
        onPress={() => router.navigate('/(professional)')}>
        <Ionicons name="arrow-back" size={18} accessible={false} /> Voltar ao início
      </Button>
      {profile.status === 'loading' ? <FeedbackState status="loading" title="Carregando seu perfil" /> : null}
      {profile.status === 'error' ? (
        <AppCard>
          <FeedbackState status="error" title="Perfil indisponível" description="Não foi possível carregar seus dados." />
          <Button self="flex-start" minH="$touchTarget" onPress={profile.retry}>Tentar novamente</Button>
        </AppCard>
      ) : null}
      {profile.status === 'ready' && profile.profile ? (
        <ProfileForm initial={profile.profile} email={session?.user.email} onSaved={profile.retry} />
      ) : null}
    </ProfessionalScreen>
  );
}
