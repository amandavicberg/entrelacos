import { Redirect, Stack, type RelativePathString } from 'expo-router';

import { FeedbackState } from '@/components/feedback-state';
import { useAuth } from '@/contexts/auth-context';

export default function ProfessionalLayout() {
  const { accessState } = useAuth();
  if (accessState === 'loading') return <FeedbackState status="loading" title="Validando acesso" />;
  if (accessState === 'signed-out') return <Redirect href={'/login' as RelativePathString} />;
  if (accessState !== 'professional') return <Redirect href="/" />;
  return <Stack screenOptions={{ headerShown: false }} />;
}
