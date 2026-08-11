import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupportedStorage } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Read as static `process.env.X` member expressions. Expo's Babel plugin inlines
// EXPO_PUBLIC_* vars at build time by matching this exact shape; computed access
// such as process.env[name] is not inlined and resolves to undefined in the bundle.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabasePublishableKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error(
    'Missing Supabase configuration. Set EXPO_PUBLIC_SUPABASE_URL and ' +
      'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY in frontend/.env, then restart Metro ' +
      'with `npx expo start -c` so the new values are inlined into the bundle.',
  );
}

/**
 * AsyncStorage touches `window` on web and crashes Expo's static/SSR render
 * pass where `window` is undefined. Use localStorage in the browser and a
 * no-op memory store during SSR.
 */
const memoryStore = new Map<string, string>();

const webStorage: SupportedStorage = {
  getItem: (key) => {
    if (typeof window === 'undefined') {
      return Promise.resolve(memoryStore.get(key) ?? null);
    }
    return Promise.resolve(window.localStorage.getItem(key));
  },
  setItem: (key, value) => {
    if (typeof window === 'undefined') {
      memoryStore.set(key, value);
      return Promise.resolve();
    }
    window.localStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem: (key) => {
    if (typeof window === 'undefined') {
      memoryStore.delete(key);
      return Promise.resolve();
    }
    window.localStorage.removeItem(key);
    return Promise.resolve();
  },
};

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    storage: Platform.OS === 'web' ? webStorage : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    // Always false: Expo web SSR runs createClient without window/localStorage,
    // so auto-detect would try PKCE exchange with an empty memory store.
    // /auth/callback calls createSessionFromUrl once on the client instead.
    detectSessionInUrl: false,
    flowType: 'pkce',
  },
});
