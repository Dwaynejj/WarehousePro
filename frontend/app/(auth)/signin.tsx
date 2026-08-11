import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AuthShell, useAuthLayout } from '@/components/auth-shell';
import { EmailField } from '@/components/email-field';
import { GoogleAuthButton } from '@/components/google-auth-button';
import { PasswordField } from '@/components/password-field';
import { signInWithGoogle } from '@/lib/google-auth';
import { landingRouteForRole, readRoleFromMetadata } from '@/lib/role';
import { supabase } from '@/lib/supabase';

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSignIn() {
    setErrorMessage(null);
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setErrorMessage('Enter your email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const role = readRoleFromMetadata(data.user?.user_metadata);
      if (role === 'admin') {
        await supabase.auth.signOut();
        setErrorMessage('This account cannot sign in here.');
        return;
      }

      router.replace(landingRouteForRole(role));
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

  async function handleGoogle() {
    setErrorMessage(null);
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle({ portal: 'picker', mode: 'signin' });
      if (result.status === 'redirected') return;
      if (result.status === 'cancelled') return;
      if (result.status === 'error') {
        setErrorMessage(result.message);
        return;
      }
      router.replace(result.href);
    } finally {
      setGoogleLoading(false);
    }
  }

  const busy = submitting || googleLoading;

  return (
    <AuthShell tone="orange">
      <SignInForm
        email={email}
        password={password}
        setEmail={setEmail}
        setPassword={setPassword}
        busy={busy}
        submitting={submitting}
        googleLoading={googleLoading}
        errorMessage={errorMessage}
        onSignIn={handleSignIn}
        onGoogle={handleGoogle}
        onSignup={() => router.push('/(auth)/signup')}
        onForgot={() => router.push('/(auth)/forgot-password')}
      />
    </AuthShell>
  );
}

function SignInForm({
  email,
  password,
  setEmail,
  setPassword,
  busy,
  submitting,
  googleLoading,
  errorMessage,
  onSignIn,
  onGoogle,
  onSignup,
  onForgot,
}: {
  email: string;
  password: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  busy: boolean;
  submitting: boolean;
  googleLoading: boolean;
  errorMessage: string | null;
  onSignIn: () => void;
  onGoogle: () => void;
  onSignup: () => void;
  onForgot: () => void;
}) {
  const { split } = useAuthLayout();

  return (
    <>
      {!split ? (
        <View className="items-center">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-orange-500">
            <MaterialCommunityIcons name="warehouse" size={32} color="#ffffff" />
          </View>
          <Text className="font-display mt-5 text-3xl text-slate-900 dark:text-white">Sign in</Text>
          <Text className="muted mt-2 text-center text-base">Continue with email or Google</Text>
        </View>
      ) : (
        <View className="mb-2">
          <Text className="font-display text-3xl text-slate-900 dark:text-white">Sign in</Text>
          <Text className="muted mt-2 text-base">Continue with email or Google</Text>
        </View>
      )}

      <View className="mt-8 gap-4">
        <View>
          <Text className="mb-1.5 font-medium text-sm text-slate-700 dark:text-slate-300">
            Email
          </Text>
          <EmailField
            value={email}
            onChangeText={setEmail}
            placeholder="you@company.com"
            placeholderTextColor="#94a3b8"
            editable={!busy}
          />
        </View>
        <View>
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="font-medium text-sm text-slate-700 dark:text-slate-300">
              Password
            </Text>
            <Pressable onPress={onForgot}>
              <Text className="font-semibold text-xs text-orange-600">Forgot password?</Text>
            </Pressable>
          </View>
          <PasswordField
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#94a3b8"
            autoComplete="current-password"
            editable={!busy}
          />
        </View>
      </View>

      {errorMessage ? (
        <View className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/50">
          <Text className="text-sm text-red-700 dark:text-red-300">{errorMessage}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={onSignIn}
        disabled={busy}
        className={`mt-6 h-14 items-center justify-center rounded-full ${
          busy ? 'bg-orange-300' : 'bg-orange-500 active:bg-orange-600'
        }`}>
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="font-semibold text-lg text-white">Sign in</Text>
        )}
      </Pressable>

      <GoogleAuthButton
        onPress={onGoogle}
        disabled={busy}
        loading={googleLoading}
        label="Sign in with Google"
      />

      <View className="mt-6 flex-row items-center justify-center">
        <Text className="muted text-sm">Need an account? </Text>
        <Pressable onPress={onSignup}>
          <Text className="font-semibold text-sm text-orange-600">Sign up</Text>
        </Pressable>
      </View>
    </>
  );
}
