import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { clearAuthIntent, saveAuthIntent, type AuthIntent } from '@/lib/auth-intent';
import { landingRouteForRole, readRoleFromMetadata, type Role } from '@/lib/role';
import { supabase } from '@/lib/supabase';

// Required so the auth session can finish when returning to the app.
WebBrowser.maybeCompleteAuthSession();

export type GoogleAuthResult =
  | { status: 'redirected' }
  | { status: 'cancelled' }
  | { status: 'ready'; href: ReturnType<typeof landingRouteForRole> }
  | { status: 'error'; message: string };

function oauthRedirectTo(): string {
  // Must match the browser origin that holds the PKCE verifier in localStorage.
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }
  // Native / Expo Go: frontend://auth/callback or exp://…/--/auth/callback
  return Linking.createURL('auth/callback');
}

/** Dedupes Strict Mode / double-mount exchanges for the same auth code. */
let pkceExchange: Promise<Awaited<
  ReturnType<typeof supabase.auth.exchangeCodeForSession>
>['data']['session']> | null = null;
let pkceExchangeCode: string | null = null;

/**
 * Read OAuth error fields from a redirect URL (query or hash fragment).
 * Supabase failure redirects look like:
 *   /auth/callback#error=server_error&error_code=unexpected_failure&error_description=...
 */
function oauthErrorFromUrl(url: string): string | null {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  const oauthError = params.error;
  const description = params.error_description
    ? decodeURIComponent(params.error_description.replace(/\+/g, ' '))
    : null;
  const code = params.error_code ?? errorCode;

  if (!oauthError && !description && !code) {
    return null;
  }

  const parts = [
    description,
    code ? `(${code})` : null,
    !description && oauthError ? oauthError : null,
  ].filter(Boolean);

  return parts.join(' ') || 'Google sign-in was rejected by the auth server.';
}

/**
 * Finish a session from an OAuth redirect URL (code or access_token hash).
 */
export async function createSessionFromUrl(url: string) {
  const oauthError = oauthErrorFromUrl(url);
  if (oauthError) {
    throw new Error(oauthError);
  }

  const { params, errorCode } = QueryParams.getQueryParams(url);
  if (errorCode) {
    throw new Error(errorCode);
  }

  // Prefer an existing session (e.g. prior successful exchange in Strict Mode).
  const existing = await supabase.auth.getSession();
  if (existing.data.session) {
    return existing.data.session;
  }

  const code = params.code;
  if (code) {
    if (typeof window === 'undefined') {
      throw new Error('OAuth code exchange must run in the browser.');
    }

    if (!pkceExchange || pkceExchangeCode !== code) {
      pkceExchangeCode = code;
      pkceExchange = (async () => {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          // Verifier already consumed by a concurrent exchange — use that session.
          if (/code verifier|already|expired|invalid/i.test(error.message)) {
            const again = await supabase.auth.getSession();
            if (again.data.session) return again.data.session;
          }
          throw error;
        }
        return data.session;
      })().finally(() => {
        pkceExchange = null;
        pkceExchangeCode = null;
      });
    }

    const session = await pkceExchange;
    if (session) return session;
  }

  const access_token = params.access_token;
  const refresh_token = params.refresh_token;
  if (access_token && refresh_token) {
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });
    if (error) throw error;
    return data.session;
  }

  throw new Error(
    'No auth session returned. Check that Google is enabled in Supabase and the redirect URLs match.',
  );
}

/**
 * After Google auth, enforce portal rules and ensure role metadata is set.
 */
export async function finalizeGoogleSession(intent: AuthIntent | null): Promise<{
  href: ReturnType<typeof landingRouteForRole>;
}> {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error(error?.message ?? 'Google sign-in did not return a user.');
  }

  let role = readRoleFromMetadata(user.user_metadata);
  const portal: Role = intent?.portal ?? 'picker';
  const mode = intent?.mode ?? 'signin';

  if (portal === 'picker') {
    if (role === 'admin') {
      await supabase.auth.signOut();
      throw new Error('This account cannot sign in here.');
    }
    if (role !== 'picker') {
      // New Google users (or legacy accounts without role) become pickers.
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role: 'picker' },
      });
      if (updateError) throw updateError;
      role = 'picker';
    }
  } else {
    // Admin portal
    if (mode === 'signup') {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { role: 'admin' },
      });
      if (updateError) throw updateError;
      role = 'admin';
    } else if (role !== 'admin') {
      await supabase.auth.signOut();
      throw new Error('This account cannot sign in here.');
    }
  }

  await clearAuthIntent();
  return { href: landingRouteForRole(role) };
}

/**
 * Start Google OAuth for the given portal.
 * On web this navigates away; on native it opens an auth session browser.
 */
export async function signInWithGoogle(intent: AuthIntent): Promise<GoogleAuthResult> {
  await saveAuthIntent(intent);
  const redirectTo = oauthRedirectTo();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      // Some Google Workspace accounts omit email unless these scopes are requested.
      scopes: 'openid email profile',
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    await clearAuthIntent();
    return { status: 'error', message: error.message };
  }
  if (!data.url) {
    await clearAuthIntent();
    return { status: 'error', message: 'Google did not return an auth URL.' };
  }

  if (Platform.OS === 'web') {
    // Full-page redirect; /auth/callback finishes the session.
    if (typeof window !== 'undefined') {
      window.location.assign(data.url);
    }
    return { status: 'redirected' };
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    await clearAuthIntent();
    return { status: 'cancelled' };
  }

  try {
    await createSessionFromUrl(result.url);
    const finished = await finalizeGoogleSession(intent);
    return { status: 'ready', href: finished.href };
  } catch (caught) {
    await clearAuthIntent();
    await supabase.auth.signOut().catch(() => undefined);
    return {
      status: 'error',
      message:
        caught instanceof Error ? caught.message : 'Google sign-in failed.',
    };
  }
}
