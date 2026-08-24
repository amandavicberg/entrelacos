import { Redirect, Stack } from 'expo-router';

import { FeedbackState } from '@/components/feedback-state';
import { useAuth } from '@/contexts/auth-context';

export default function PatientLayout() {
  const { accessState } = useAuth();
  if (accessState === 'loading') return <FeedbackState status="loading" title="Validando acesso" />;
  if (accessState !== 'patient-active' && accessState !== 'patient-pending') {
    return <Redirect href="/" />;
  }
  return <Stack screenOptions={{ headerShown: false }} />;
}
