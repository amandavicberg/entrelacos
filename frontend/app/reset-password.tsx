import { Link, type RelativePathString, useRouter } from 'expo-router';
import { useState } from 'react';
import { Paragraph, SizableText, Spinner, XStack, YStack } from 'tamagui';

import { AppInput } from '@/components/app-input';
import { AuthScreen } from '@/components/auth-screen';
import { BrandButton } from '@/components/brand-button';
import { FeedbackState } from '@/components/feedback-state';
import { useAuth } from '@/contexts/auth-context';
import { getSupabaseClient } from '@/lib/supabase';

const loginPath = '/login' as RelativePathString;

export default function ResetPasswordScreen() {
  const { accessState, signOut } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);

  if (accessState === 'loading') return <FeedbackState status="loading" title="Validando link de recuperação" />;
  if (accessState !== 'password-recovery' && !completed) {
    return (
      <AuthScreen title="Link inválido ou expirado" description="Solicite uma nova recuperação de senha para continuar.">
        <Link href={'/forgot-password' as RelativePathString} replace asChild><BrandButton>Solicitar novo link</BrandButton></Link>
      </AuthScreen>
    );
  }

  async function submit() {
    if (password.length < 8) {
      setError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (password !== confirmation) {
      setError('As senhas precisam ser iguais.');
      return;
    }
    setSubmitting(true);
    setError('');
    const { error: updateError } = await getSupabaseClient().auth.updateUser({ password });
    setSubmitting(false);
    if (updateError) {
      setError('Não foi possível atualizar sua senha. Solicite um novo link e tente novamente.');
      return;
    }
    await signOut();
    setCompleted(true);
    router.replace(loginPath);
  }

  return (
    <AuthScreen title="Defina uma nova senha" description="Escolha uma senha forte para concluir a recuperação.">
      <YStack gap="$4">
        <AppInput label="Nova senha" placeholder="Pelo menos 8 caracteres" value={password} onChangeText={setPassword} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" disabled={submitting} />
        <AppInput label="Confirmar nova senha" placeholder="Repita sua nova senha" value={confirmation} onChangeText={setConfirmation} error={error || undefined} secureTextEntry autoCapitalize="none" autoCorrect={false} autoComplete="new-password" textContentType="newPassword" returnKeyType="done" onSubmitEditing={submit} disabled={submitting} />
        <BrandButton size="$5" minH={54} disabled={submitting} onPress={submit}>
          {submitting ? <XStack items="center" gap="$2"><Spinner color="$brandContrast" size="small" /><SizableText color="$brandContrast">Atualizando...</SizableText></XStack> : 'Atualizar senha'}
        </BrandButton>
        <Paragraph color="$muted" size="$2">Após atualizar, você entrará novamente com sua nova senha.</Paragraph>
      </YStack>
    </AuthScreen>
  );
}
