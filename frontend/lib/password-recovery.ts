import AsyncStorage from '@react-native-async-storage/async-storage';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import { Platform } from 'react-native';

import type { Role } from '@/lib/role';

const PORTAL_KEY = 'warehousepro.password-reset.portal';

/** Where Supabase should send the user after they click the email link. */
export function passwordRecoveryRedirectTo(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  return Linking.createURL('auth/callback');
}

export async function savePasswordResetPortal(portal: Role): Promise<void> {
  await AsyncStorage.setItem(PORTAL_KEY, portal);
}

export async function readPasswordResetPortal(): Promise<Role> {
  const raw = await AsyncStorage.getItem(PORTAL_KEY);
  if (raw === 'admin' || raw === 'picker') return raw;
  return 'picker';
}

export async function clearPasswordResetPortal(): Promise<void> {
  await AsyncStorage.removeItem(PORTAL_KEY);
}

/** True when the redirect URL is a Supabase password-recovery link. */
export function isPasswordRecoveryUrl(url: string): boolean {
  const { params } = QueryParams.getQueryParams(url);
  return params.type === 'recovery';
}
