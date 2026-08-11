import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { readAuthIntent } from '@/lib/auth-intent';
import { createSessionFromUrl, finalizeGoogleSession } from '@/lib/google-auth';
import { isPasswordRecoveryUrl } from '@/lib/password-recovery';
import { supabase } from '@/lib/supabase';

/**
 * Return path for Google OAuth and password-recovery email links.
 * Supabase redirects here with ?code=… or hash tokens.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function finish() {
      try {
        // Wait until we're in a real browser — Expo web SSR has no localStorage,
        // so the PKCE verifier would be missing if we exchanged during SSR.
        if (typeof window === 'undefined') {
          return;
        }

        const url = Linking.createURL('auth/callback');
        const href = window.location?.href
          ? window.location.href
          : (await Linking.getInitialURL()) ?? url;

        let recovery = isPasswordRecoveryUrl(href);

        // Subscribe before exchange — PKCE links may omit type=recovery in the URL.
        let sawRecoveryEvent = false;
        const {
          data: { subscription },
        } = supabase.auth.onAuthStateChange((event) => {
          if (event === 'PASSWORD_RECOVERY') {
            sawRecoveryEvent = true;
          }
        });

        try {
          await createSessionFromUrl(href);
          // Allow the auth event to flush.
          await new Promise((r) => setTimeout(r, 50));
        } finally {
          subscription.unsubscribe();
        }

        if (!active) return;

        if (recovery || sawRecoveryEvent) {
          router.replace('/(auth)/reset-password');
          return;
        }

        const intent = await readAuthIntent();
        const { href: destination } = await finalizeGoogleSession(intent);
        if (!active) return;
        router.replace(destination);
      } catch (caught) {
        if (!active) return;
        setError(
          caught instanceof Error ? caught.message : 'Could not finish sign-in.',
        );
      }
    }

    finish();
    return () => {
      active = false;
    };
  }, [router]);

  if (error) {
    return (
      <View className="screen items-center justify-center px-8">
        <Text className="font-display text-center text-base text-slate-900 dark:text-white">
          Sign-in failed
        </Text>
        <Text className="mt-2 text-center text-sm text-red-600 dark:text-red-400">{error}</Text>
        <Pressable
          onPress={() => router.replace('/(auth)/signin')}
          className="mt-6 rounded-full bg-orange-500 px-5 py-3">
          <Text className="font-semibold text-white">Back to sign in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="screen items-center justify-center">
      <ActivityIndicator color="#f97316" size="large" />
      <Text className="muted mt-4 text-sm">Finishing sign-in…</Text>
    </View>
  );
}
