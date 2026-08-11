import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { EmailField } from '@/components/email-field';
import {
  passwordRecoveryRedirectTo,
  savePasswordResetPortal,
} from '@/lib/password-recovery';
import type { Role } from '@/lib/role';
import { supabase } from '@/lib/supabase';

function resolvePortal(raw: string | string[] | undefined): Role {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === 'admin' ? 'admin' : 'picker';
}

/**
 * Sends a Supabase password-reset email. Works for picker and admin portals.
 */
export default function ForgotPasswordScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ portal?: string }>();
  const portal = useMemo(() => resolvePortal(params.portal), [params.portal]);
  const accent = portal === 'admin' ? 'teal' : 'orange';
  const accentBg = portal === 'admin' ? 'bg-teal-500' : 'bg-orange-500';
  const accentBtn = portal === 'admin' ? 'bg-teal-500 active:bg-teal-400' : 'bg-orange-500 active:bg-orange-600';
  const accentBusy = portal === 'admin' ? 'bg-teal-700' : 'bg-orange-300';
  const linkColor = portal === 'admin' ? 'text-teal-600' : 'text-orange-600';

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    setErrorMessage(null);
    const trimmed = email.trim();
    if (!trimmed) {
      setErrorMessage('Enter the email for your account.');
      return;
    }

    setSubmitting(true);
    try {
      await savePasswordResetPortal(portal);
      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: passwordRecoveryRedirectTo(),
      });
      if (error) {
        const msg = error.message.toLowerCase();
        if (msg.includes('rate limit') || msg.includes('email rate')) {
          setErrorMessage(
            'Too many reset emails were sent recently (Supabase free-tier limit). Wait about an hour, then try once — or change your password from Profile while signed in.',
          );
          return;
        }
        setErrorMessage(error.message);
        return;
      }
      setSent(true);
    } catch (caught) {
      setErrorMessage(
        caught instanceof Error
          ? `Could not reach Supabase: ${caught.message}`
          : 'Could not reach Supabase.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  const backHref = portal === 'admin' ? '/admin/signin' : '/(auth)/signin';

  return (
    <AuthShell tone={accent} darkCanvas={portal === 'admin'}>
      <View className="items-center">
        <View className={`h-16 w-16 items-center justify-center rounded-2xl ${accentBg}`}>
          <MaterialCommunityIcons name="lock-reset" size={32} color="#ffffff" />
        </View>
        <Text
          className={`font-display mt-5 text-3xl ${
            portal === 'admin' ? 'text-white' : 'text-slate-900 dark:text-white'
          }`}>
          Reset password
        </Text>
        <Text
          className={`mt-2 text-center text-base ${
            portal === 'admin' ? 'text-teal-100/80' : 'muted'
          }`}>
          We&apos;ll email you a link to choose a new password
        </Text>
      </View>

      {sent ? (
        <View className="mt-8 rounded-xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-900 dark:bg-emerald-950/50">
          <Text className="font-semibold text-sm text-emerald-800 dark:text-emerald-300">
            Check your email
          </Text>
          <Text className="mt-1 text-sm leading-5 text-emerald-700 dark:text-emerald-400">
            If an account exists for {email.trim()}, you&apos;ll get a reset link shortly. Open it
            on this device, then set a new password.
          </Text>
        </View>
      ) : (
        <>
          <View className="mt-8">
            <Text
              className={`mb-1.5 font-medium text-sm ${
                portal === 'admin' ? 'text-teal-100' : 'text-slate-700 dark:text-slate-300'
              }`}>
              Email
            </Text>
            <EmailField
              value={email}
              onChangeText={setEmail}
              placeholder="you@company.com"
              placeholderTextColor={portal === 'admin' ? '#5eead4' : '#94a3b8'}
              editable={!submitting}
            />
          </View>

          {errorMessage ? (
            <View
              className={`mt-4 rounded-xl border p-3 ${
                portal === 'admin'
                  ? 'border-red-300/40 bg-red-950/50'
                  : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50'
              }`}>
              <Text
                className={`text-sm ${
                  portal === 'admin' ? 'text-red-200' : 'text-red-700 dark:text-red-300'
                }`}>
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            className={`mt-6 h-14 items-center justify-center rounded-full ${
              submitting ? accentBusy : accentBtn
            }`}>
            {submitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="font-semibold text-lg text-white">Send reset link</Text>
            )}
          </Pressable>
        </>
      )}

      <View className="mt-6 flex-row items-center justify-center">
        <Pressable onPress={() => router.replace(backHref)}>
          <Text className={`font-semibold text-sm ${linkColor}`}>Back to sign in</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}
