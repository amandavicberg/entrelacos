import { Redirect, Stack } from 'expo-router';

import { FeedbackState } from '@/components/feedback-state';
import { useAuth } from '@/contexts/auth-context';

export default function PatientLayout() {
  const { accessState } = useAuth();
  if (accessState === 'loading') return <FeedbackState status="loading" title="Validando acesso" />;
  if (accessState !== 'patient-active' && accessState !== 'patient-pending' && accessState !== 'patient-unassociated') {
    return <Redirect href="/" />;
  }
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={accessState === 'patient-unassociated'}><Stack.Screen name="connect" /></Stack.Protected>
      <Stack.Protected guard={accessState === 'patient-pending'}><Stack.Screen name="pending" /></Stack.Protected>
      <Stack.Protected guard={accessState === 'patient-active'}>
        {['index', 'agenda', 'materials', 'observations', 'history', 'documents', 'messages', 'check-ins'].map((name) => <Stack.Screen key={name} name={name} />)}
      </Stack.Protected>
    </Stack>
  );
}
