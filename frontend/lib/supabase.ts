import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { secureStorage } from '@/lib/secure-storage';

type PublicSupabaseConfig = {
  url: string;
  publishableKey: string;
};

function getPublicSupabaseConfig(): PublicSupabaseConfig {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url) {
    throw new Error('EXPO_PUBLIC_SUPABASE_URL não foi definida no ambiente do frontend.');
  }

  if (!publishableKey) {
    throw new Error(
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY não foi definida no ambiente do frontend.',
    );
  }

  return { url, publishableKey };
}

let client: SupabaseClient | undefined;

export function getSupabaseClient(): SupabaseClient {
  if (!client) {
    const { url, publishableKey } = getPublicSupabaseConfig();

    client = createClient(url, publishableKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
        storage: secureStorage,
      },
    });
  }

  return client;
}
