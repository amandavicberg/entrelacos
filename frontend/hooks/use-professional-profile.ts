import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/auth-context';
import { getSupabaseClient } from '@/lib/supabase';

export type ProfessionalProfile = {
  name: string;
  specialty?: string;
  registration?: string;
};
type ProfileState = { userId: string; status: 'loading' | 'error' | 'ready'; profile?: ProfessionalProfile };

export function useProfessionalProfile() {
  const { session } = useAuth();
  const userId = session?.user.id ?? '';
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<ProfileState>({ userId: '', status: 'loading' });
  const retry = useCallback(() => setAttempt((value) => value + 1), []);

  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    setState({ userId, status: 'loading' });
    async function load() {
      try {
        const client = getSupabaseClient();
        const [identity, professional] = await Promise.all([
          client.from('profiles').select('full_name').eq('id', userId).eq('role', 'professional')
            .eq('status', 0).abortSignal(controller.signal).single(),
          client.from('professional_profiles').select('specialty, registration_type, registration_number')
            .eq('id', userId).eq('status', 0).abortSignal(controller.signal).maybeSingle(),
        ]);
        if (identity.error || professional.error || !identity.data?.full_name?.trim()) throw new Error('profile-unavailable');
        const details = professional.data;
        const profile: ProfessionalProfile = {
          name: identity.data.full_name.trim(),
          specialty: details?.specialty?.trim() || undefined,
          registration: [details?.registration_type?.trim(), details?.registration_number?.trim()].filter(Boolean).join(' ') || undefined,
        };
        if (!controller.signal.aborted) setState({ userId, status: 'ready', profile });
      } catch {
        if (!controller.signal.aborted) setState({ userId, status: 'error' });
      }
    }
    void load();
    return () => controller.abort();
  }, [userId, attempt]);

  return { ...(state.userId === userId ? state : { userId, status: 'loading' as const }), retry };
}
