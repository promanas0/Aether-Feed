import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_CONFIG_KEY = 'aether_supabase_config_v1';
const DEFAULT_SUPABASE_URL = 'https://eekdcgoeybphyqwfwgjs.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_VLP93NzwJavPGFQpYVccwA_v4fE_g_2';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isEnabled: boolean;
}

export const getStoredSupabaseConfig = (): SupabaseConfig => {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

  try {
    const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && parsed.url && parsed.anonKey && parsed.isEnabled !== false) {
        return parsed;
      }
    }
  } catch {}

  return {
    url: envUrl,
    anonKey: envKey,
    isEnabled: true,
  };
};

export const saveSupabaseConfig = (config: SupabaseConfig): void => {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  window.dispatchEvent(new Event('aether_supabase_config_change'));
};

let cachedClient: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export const getSupabaseClient = (): SupabaseClient | null => {
  const config = getStoredSupabaseConfig();
  if (!config.isEnabled || !config.url || !config.anonKey) {
    return null;
  }

  if (cachedClient && lastUrl === config.url && lastKey === config.anonKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
    lastUrl = config.url;
    lastKey = config.anonKey;
    return cachedClient;
  } catch (err) {
    console.error('[Aether Feed] Failed to initialize Supabase client:', err);
    return null;
  }
};

export const testSupabaseConnection = async (
  url: string,
  anonKey: string
): Promise<{ success: boolean; message: string }> => {
  if (!url || !anonKey) {
    return { success: false, message: 'URL and Anon Key are required.' };
  }

  try {
    const tempClient = createClient(url, anonKey);
    const { error } = await tempClient.from('profiles').select('id').limit(1);

    if (error) {
      console.warn('[Aether Feed] Supabase connection test returned error:', error);
      return {
        success: false,
        message: `Supabase Error (${error.code || 'HTTP'}): ${error.message}`,
      };
    }

    return { success: true, message: 'Supabase connected successfully!' };
  } catch (err: any) {
    console.error('[Aether Feed] Connection test exception:', err);
    return {
      success: false,
      message: err.message || 'Failed to reach Supabase. Check URL, Anon Key, and CORS settings.',
    };
  }
};
