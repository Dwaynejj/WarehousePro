import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { EmailField } from '@/components/email-field';
import { GoogleAuthButton } from '@/components/google-auth-button';
import { PasswordField } from '@/components/password-field';
import { signInWithGoogle } from '@/lib/google-auth';
import { landingRouteForRole, readRoleFromMetadata } from '@/lib/role';
import { supabase } from '@/lib/supabase';

/**
 * Separate admin portal entry.
 * Google sign-in only succeeds for accounts that already have role=admin.
 */
export default function AdminSignInScreen() {
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
      if (role !== 'admin') {
        await supabase.auth.signOut();
        setErrorMessage('This account cannot sign in here.');
        return;
      }

      router.replace(landingRouteForRole('admin'));
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
      const result = await signInWithGoogle({ portal: 'admin', mode: 'signin' });
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
    <AuthShell tone="teal" darkCanvas>
      <View className="items-center">
        <View className="h-16 w-16 items-center justify-center rounded-2xl bg-teal-500">
          <MaterialCommunityIcons name="warehouse" size={32} color="#ffffff" />
        </View>
        <Text className="font-display mt-5 text-3xl tracking-tight text-white">WarehousePro</Text>
        <Text className="mt-2 text-center text-base text-teal-100/80">
          Sign in with email or Google
        </Text>
      </View>

      <View className="mt-8 gap-4">
        <View>
          <Text className="mb-1.5 font-medium text-sm text-teal-100">Email</Text>
          <EmailField
            value={email}
            onChangeText={setEmail}
            placeholder="admin@company.com"
            placeholderTextColor="#5eead4"
            editable={!busy}
          />
        </View>
        <View>
          <View className="mb-1.5 flex-row items-center justify-between">
            <Text className="font-medium text-sm text-teal-100">Password</Text>
            <Pressable onPress={() => router.push('/(auth)/forgot-password?portal=admin')}>
              <Text className="font-semibold text-xs text-teal-200">Forgot password?</Text>
            </Pressable>
          </View>
          <PasswordField
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            placeholderTextColor="#5eead4"
            autoComplete="current-password"
            editable={!busy}
          />
        </View>
      </View>

      {errorMessage ? (
        <View className="mt-4 rounded-xl border border-red-300/40 bg-red-950/50 p-3">
          <Text className="text-sm text-red-200">{errorMessage}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={handleSignIn}
        disabled={busy}
        className={`mt-6 h-14 items-center justify-center rounded-full ${
          busy ? 'bg-teal-700' : 'bg-teal-500 active:bg-teal-400'
        }`}>
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="font-semibold text-lg text-white">Sign in</Text>
        )}
      </Pressable>

      <GoogleAuthButton
        onPress={handleGoogle}
        disabled={busy}
        loading={googleLoading}
        tone="dark"
        label="Sign in with Google"
      />
    </AuthShell>
  );
}
