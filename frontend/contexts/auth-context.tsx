import * as Linking from 'expo-linking';
import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { authErrorMessage } from '@/lib/auth-errors';
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
  const roleTable = profile.role === 'professional' ? 'professional_profiles' : 'patient_profiles';
  const { data: roleProfile, error: roleError } = await supabase
    .from(roleTable).select('status').eq('id', session.user.id).maybeSingle();
  if (roleError || !roleProfile || roleProfile.status !== 0) throw new Error('Seu acesso não está ativo.');
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
    let mounted = true;
    let linkInFlight = false;
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return;
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

    async function handleAuthUrl(url: string | null): Promise<boolean> {
      if (!url || linkInFlight) return false;
      const parameters = new URLSearchParams(url.split('#')[1] || url.split('?')[1] || '');
      const route = url.split(/[?#]/)[0];
      const recovery = parameters.get('type') === 'recovery' || route.endsWith('/reset-password') || route.endsWith('://reset-password');
      if (!recovery && parameters.get('type') !== 'signup') return false;
      const code = parameters.get('code');
      const accessToken = parameters.get('access_token');
      const refreshToken = parameters.get('refresh_token');
      if (!code && !(accessToken && refreshToken)) return false;
      linkInFlight = true;
      try {
        const result = code
          ? await supabase.auth.exchangeCodeForSession(code)
          : await supabase.auth.setSession({ access_token: accessToken!, refresh_token: refreshToken! });
        if (result.error) throw result.error;
        if (result.data.session && mounted) {
          if (recovery) recoveryUserId.current = result.data.session.user.id;
          await applySession(result.data.session);
        }
        return true;
      } finally {
        linkInFlight = false;
        if (Platform.OS === 'web' && typeof window !== 'undefined') {
          window.history.replaceState(window.history.state, '', window.location.pathname);
        }
      }
    }

    async function initialize() {
      try {
        // Process the callback before reading storage: restoration must not overwrite recovery.
        if (await handleAuthUrl(await Linking.getInitialURL())) return;
        const { data: stored, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (mounted) await applySession(stored.session);
      } catch {
        if (mounted) { setSession(null); setAccessState('signed-out'); }
      }
    }
    void initialize();
    const subscription = Linking.addEventListener('url', ({ url }) => {
      void handleAuthUrl(url).catch(() => {
        if (mounted) { setSession(null); setAccessState('signed-out'); }
      });
    });
    return () => { mounted = false; subscription.remove(); data.subscription.unsubscribe(); };
  }, [applySession]);

  const signIn = useCallback(async ({ email, password, role, inviteCode }: SignInInput) => {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.session) throw Object.assign(new Error(authErrorMessage(error, 'login')), { code: error?.code });

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
      if (role === 'patient' && nextAccess === 'patient-unassociated' && inviteCode?.trim()) {
        await consumePatientInvite(inviteCode.trim().toUpperCase(), data.session.access_token);
        nextAccess = 'patient-pending';
      }

      setSession(data.session);
      setAccessState(nextAccess);
    } catch (error) {
      await supabase.auth.signOut();
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await getSupabaseClient().auth.signOut();
    if (error) throw new Error('Não foi possível encerrar a sessão. Tente novamente.');
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
