import * as Linking from 'expo-linking';
import type { Session } from '@supabase/supabase-js';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { consumePatientInvite } from '@/lib/api';
import { getSupabaseClient } from '@/lib/supabase';

export type AppRole = 'patient' | 'professional';
export type AccessState = 'loading' | 'signed-out' | 'password-recovery' | 'patient-unassociated' | 'patient-active' | 'patient-pending' | 'professional';

type SignInInput = {
  email: string;
  password: string;
  role: AppRole;
  inviteCode?: string;
};

type AuthContextValue = {
  accessState: AccessState;
  session: Session | null;
  signIn(input: SignInInput): Promise<void>;
  signOut(): Promise<void>;
  refreshAccess(): Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function resolveAccess(session: Session): Promise<AccessState> {
  const supabase = getSupabaseClient();
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, status')
    .eq('id', session.user.id)
    .maybeSingle();

  if (profileError || !profile || profile.status !== 0) {
    throw new Error('Não foi possível validar seu perfil.');
  }
  if (profile.role === 'professional') return 'professional';
  if (profile.role !== 'patient') throw new Error('Perfil de acesso inválido.');

  const { data: relationships, error: relationshipError } = await supabase
    .from('patient_professional_relationships')
    .select('relationship_status')
    .eq('patient_id', session.user.id)
    .eq('status', 0)
    .in('relationship_status', ['active', 'pending']);

  if (relationshipError) throw new Error('Não foi possível validar sua associação.');
  if (relationships?.some(({ relationship_status }) => relationship_status === 'active')) {
    return 'patient-active';
  }
  if (relationships?.some(({ relationship_status }) => relationship_status === 'pending')) {
    return 'patient-pending';
  }
  return 'patient-unassociated';
}

function recoveryParameters(url: string): URLSearchParams | null {
  const fragment = url.split('#')[1];
  const query = fragment ?? url.split('?')[1];
  if (!query) return null;

  const parameters = new URLSearchParams(query);
  const isResetPasswordRoute = url.split(/[?#]/)[0].endsWith('reset-password');
  return parameters.get('type') === 'recovery' || (isResetPasswordRoute && parameters.has('code'))
    ? parameters
    : null;
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [accessState, setAccessState] = useState<AccessState>('loading');
  const recoveryUserId = useRef<string | undefined>(undefined);

  const applySession = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    if (!nextSession) {
      setAccessState('signed-out');
      return;
    }

    if (recoveryUserId.current === nextSession.user.id) {
      setAccessState('password-recovery');
      return;
    }

    try {
      setAccessState(await resolveAccess(nextSession));
    } catch {
      await getSupabaseClient().auth.signOut();
      setSession(null);
      setAccessState('signed-out');
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    void supabase.auth.getSession().then(({ data }) => applySession(data.session));
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'SIGNED_OUT') {
        recoveryUserId.current = undefined;
        setSession(null);
        setAccessState('signed-out');
      } else if (event === 'PASSWORD_RECOVERY' && nextSession) {
        recoveryUserId.current = nextSession.user.id;
        setSession(nextSession);
        setAccessState('password-recovery');
      } else if (event === 'TOKEN_REFRESHED') {
        setSession(nextSession);
      }
    });
    return () => data.subscription.unsubscribe();
  }, [applySession]);

  useEffect(() => {
    const supabase = getSupabaseClient();

    async function handleRecoveryUrl(url: string | null) {
      if (!url) return;
      const parameters = recoveryParameters(url);
      if (!parameters) return;

      const code = parameters.get('code');
      const accessToken = parameters.get('access_token');
      const refreshToken = parameters.get('refresh_token');
      const result = code
        ? await supabase.auth.exchangeCodeForSession(code)
        : accessToken && refreshToken
          ? await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          : null;

      if (result?.data.session && !result.error) {
        recoveryUserId.current = result.data.session.user.id;
        setSession(result.data.session);
        setAccessState('password-recovery');
      }
    }

    void Linking.getInitialURL().then(handleRecoveryUrl);
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleRecoveryUrl(url);
    });
    return () => subscription.remove();
  }, []);

  const signIn = useCallback(async ({ email, password, role, inviteCode }: SignInInput) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw new Error('Login ou senha inválidos.');

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', data.session.user.id)
        .maybeSingle();
      if (profileError || !profile || profile.status !== 0) {
        throw new Error('Não foi possível validar seu perfil.');
      }
      if (profile.role !== role) throw new Error('O tipo de acesso não corresponde ao seu cadastro.');

      let nextAccess = await resolveAccess(data.session);
      if (role === 'patient' && nextAccess === 'patient-unassociated') {
        const { count, error: countError } = await supabase
          .from('patient_professional_relationships')
          .select('id', { count: 'exact', head: true })
          .eq('patient_id', data.session.user.id)
          .eq('status', 0)
          .eq('relationship_status', 'pending');
        if (countError) throw new Error('Não foi possível validar sua associação.');
        if (!count) {
          if (!inviteCode?.trim()) throw new Error('Informe o código de convite do primeiro acesso.');
          await consumePatientInvite(inviteCode.trim(), data.session.access_token);
          nextAccess = 'patient-pending';
        }
      }

      setSession(data.session);
      setAccessState(nextAccess);
    } catch (error) {
      await supabase.auth.signOut();
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    await getSupabaseClient().auth.signOut();
    recoveryUserId.current = undefined;
    setSession(null);
    setAccessState('signed-out');
  }, []);

  const refreshAccess = useCallback(async () => {
    if (!session) return;
    setAccessState('loading');
    await applySession(session);
  }, [applySession, session]);

  const value = useMemo(
    () => ({ accessState, session, signIn, signOut, refreshAccess }),
    [accessState, refreshAccess, session, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  return context;
}
