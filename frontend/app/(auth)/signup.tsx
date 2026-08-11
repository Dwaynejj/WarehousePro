import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AuthShell, useAuthLayout } from '@/components/auth-shell';
import { EmailField } from '@/components/email-field';
import { GoogleAuthButton } from '@/components/google-auth-button';
import { PasswordField } from '@/components/password-field';
import { signInWithGoogle } from '@/lib/google-auth';
import { PASSWORD_HINT, validatePassword } from '@/lib/password';
import { landingRouteForRole } from '@/lib/role';
import { supabase } from '@/lib/supabase';

/**
 * Public signup creates picker accounts only (email or Google).
 */
export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleCreateAccount() {
    setErrorMessage(null);
    setSuccessMessage(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Enter your email address.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }
    const passwordProblem = validatePassword(password);
    if (passwordProblem) {
      setErrorMessage(passwordProblem);
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: { data: { role: 'picker' } },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        router.replace(landingRouteForRole('picker'));
        return;
      }

      setSuccessMessage('Account created. Confirm your email, then sign in.');
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
    setSuccessMessage(null);
    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle({ portal: 'picker', mode: 'signup' });
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
      <SignupForm
        email={email}
        password={password}
        confirmPassword={confirmPassword}
        setEmail={setEmail}
        setPassword={setPassword}
        setConfirmPassword={setConfirmPassword}
        busy={busy}
        submitting={submitting}
        googleLoading={googleLoading}
        errorMessage={errorMessage}
        successMessage={successMessage}
        onCreate={handleCreateAccount}
        onGoogle={handleGoogle}
        onSignIn={() => router.push('/(auth)/signin')}
      />
    </AuthShell>
  );
}

function SignupForm({
  email,
  password,
  confirmPassword,
  setEmail,
  setPassword,
  setConfirmPassword,
  busy,
  submitting,
  googleLoading,
  errorMessage,
  successMessage,
  onCreate,
  onGoogle,
  onSignIn,
}: {
  email: string;
  password: string;
  confirmPassword: string;
  setEmail: (v: string) => void;
  setPassword: (v: string) => void;
  setConfirmPassword: (v: string) => void;
  busy: boolean;
  submitting: boolean;
  googleLoading: boolean;
  errorMessage: string | null;
  successMessage: string | null;
  onCreate: () => void;
  onGoogle: () => void;
  onSignIn: () => void;
}) {
  const { split } = useAuthLayout();

  return (
    <>
      {!split ? (
        <View className="items-center">
          <View className="h-16 w-16 items-center justify-center rounded-2xl bg-orange-500">
            <MaterialCommunityIcons name="cart-outline" size={32} color="#ffffff" />
          </View>
          <Text className="font-display mt-5 text-3xl text-slate-900 dark:text-white">
            Create account
          </Text>
          <Text className="muted mt-2 text-center text-base">Sign up with email or Google</Text>
        </View>
      ) : (
        <View className="mb-2">
          <Text className="font-display text-3xl text-slate-900 dark:text-white">
            Create account
          </Text>
          <Text className="muted mt-2 text-base">Sign up with email or Google</Text>
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
          <Text className="mb-1.5 font-medium text-sm text-slate-700 dark:text-slate-300">
            Password
          </Text>
          <PasswordField
            value={password}
            onChangeText={setPassword}
            placeholder="Enter a password"
            placeholderTextColor="#94a3b8"
            autoComplete="new-password"
            editable={!busy}
          />
          <Text className="muted mt-1.5 text-xs">{PASSWORD_HINT}</Text>
        </View>
        <View>
          <Text className="mb-1.5 font-medium text-sm text-slate-700 dark:text-slate-300">
            Confirm password
          </Text>
          <PasswordField
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter your password"
            placeholderTextColor="#94a3b8"
            autoComplete="new-password"
            editable={!busy}
          />
        </View>
      </View>

      {errorMessage ? (
        <View className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/50">
          <Text className="text-sm text-red-700 dark:text-red-300">{errorMessage}</Text>
        </View>
      ) : null}
      {successMessage ? (
        <View className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-900 dark:bg-emerald-950/50">
          <Text className="text-sm text-emerald-700 dark:text-emerald-300">{successMessage}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={onCreate}
        disabled={busy}
        className={`mt-6 h-14 items-center justify-center rounded-full ${
          busy ? 'bg-orange-300' : 'bg-orange-500 active:bg-orange-600'
        }`}>
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="font-semibold text-lg text-white">Create account</Text>
        )}
      </Pressable>

      <GoogleAuthButton
        onPress={onGoogle}
        disabled={busy}
        loading={googleLoading}
        label="Sign up with Google"
      />

      <View className="mt-6 flex-row items-center justify-center">
        <Text className="muted text-sm">Already have an account? </Text>
        <Pressable onPress={onSignIn}>
          <Text className="font-semibold text-sm text-orange-600">Sign in</Text>
        </Pressable>
      </View>
    </>
  );
}
