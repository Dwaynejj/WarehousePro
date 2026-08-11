import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TextInput, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { EmailField } from '@/components/email-field';
import { FIELD_BASE_CLASSNAME, STABLE_TEXT_STYLE } from '@/components/field-config';
import { GoogleAuthButton } from '@/components/google-auth-button';
import { PasswordField } from '@/components/password-field';
import { signInWithGoogle } from '@/lib/google-auth';
import { PASSWORD_HINT, validatePassword } from '@/lib/password';
import { landingRouteForRole } from '@/lib/role';
import { supabase } from '@/lib/supabase';

/**
 * Hidden admin provisioning screen.
 * Email/password or Google — both require a valid invite code first.
 */
export default function AdminInviteScreen() {
  const router = useRouter();
  const expectedCode = process.env.EXPO_PUBLIC_ADMIN_INVITE_CODE ?? '';

  const [inviteCode, setInviteCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function assertInvite(): boolean {
    if (!expectedCode) {
      setErrorMessage(
        'Invite signup is not configured. Set EXPO_PUBLIC_ADMIN_INVITE_CODE in frontend/.env.',
      );
      return false;
    }
    if (inviteCode.trim() !== expectedCode) {
      setErrorMessage('Invalid invite code.');
      return false;
    }
    return true;
  }

  async function handleCreateAdmin() {
    setErrorMessage(null);
    if (!assertInvite()) return;

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setErrorMessage('Enter an email address.');
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
        options: { data: { role: 'admin' } },
      });

      if (error) {
        setErrorMessage(error.message);
        return;
      }

      if (data.session) {
        router.replace(landingRouteForRole('admin'));
        return;
      }

      router.replace('/admin/signin');
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
    if (!assertInvite()) return;

    setGoogleLoading(true);
    try {
      const result = await signInWithGoogle({ portal: 'admin', mode: 'signup' });
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
          <MaterialCommunityIcons name="key-variant" size={32} color="#ffffff" />
        </View>
        <Text className="font-display mt-5 text-3xl tracking-tight text-white">Create account</Text>
        <Text className="mt-2 text-center text-base text-teal-100/80">
          Enter your invite code, then continue with email or Google
        </Text>
      </View>

      <View className="mt-8 gap-4">
        <View>
          <Text className="mb-1.5 font-medium text-sm text-teal-100">Invite code</Text>
          <TextInput
            value={inviteCode}
            onChangeText={setInviteCode}
            placeholder="Enter invite code"
            placeholderTextColor="#5eead4"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!busy}
            className={`${FIELD_BASE_CLASSNAME} text-white`}
            style={STABLE_TEXT_STYLE}
          />
        </View>
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
          <Text className="mb-1.5 font-medium text-sm text-teal-100">Password</Text>
          <PasswordField
            value={password}
            onChangeText={setPassword}
            placeholder="Enter a password"
            placeholderTextColor="#5eead4"
            autoComplete="new-password"
            editable={!busy}
          />
          <Text className="mt-1.5 text-xs text-teal-200/70">{PASSWORD_HINT}</Text>
        </View>
        <View>
          <Text className="mb-1.5 font-medium text-sm text-teal-100">Confirm password</Text>
          <PasswordField
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Re-enter password"
            placeholderTextColor="#5eead4"
            autoComplete="new-password"
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
        onPress={handleCreateAdmin}
        disabled={busy}
        className={`mt-6 h-14 items-center justify-center rounded-full ${
          busy ? 'bg-teal-700' : 'bg-teal-500 active:bg-teal-400'
        }`}>
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="font-semibold text-lg text-white">Create account</Text>
        )}
      </Pressable>

      <GoogleAuthButton
        onPress={handleGoogle}
        disabled={busy}
        loading={googleLoading}
        tone="dark"
        label="Continue with Google"
      />

      <Pressable onPress={() => router.replace('/admin/signin')} className="mt-8">
        <Text className="text-center text-sm text-teal-200/70">Back to sign in</Text>
      </Pressable>
    </AuthShell>
  );
}
