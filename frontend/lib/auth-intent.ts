import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Role } from '@/lib/role';

const KEY = 'warehousepro.oauth.intent';

/**
 * What the user was doing when they started Google OAuth.
 * Survives the browser redirect so the callback can assign the right role.
 */
export type AuthIntent = {
  portal: Role;
  /** signup = first-time / force role; signin = require matching role */
  mode: 'signup' | 'signin';
};

export async function saveAuthIntent(intent: AuthIntent): Promise<void> {
  await AsyncStorage.setItem(KEY, JSON.stringify(intent));
}

export async function readAuthIntent(): Promise<AuthIntent | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as AuthIntent;
    if (
      (parsed.portal === 'picker' || parsed.portal === 'admin') &&
      (parsed.mode === 'signup' || parsed.mode === 'signin')
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function clearAuthIntent(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
}
