import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { AuthShell } from '@/components/auth-shell';
import { PasswordField } from '@/components/password-field';
import {
  clearPasswordResetPortal,
  readPasswordResetPortal,
} from '@/lib/password-recovery';
import { landingRouteForRole, readRoleFromMetadata } from '@/lib/role';
import { supabase } from '@/lib/supabase';

/**
 * Shown after the user opens the email recovery link.
 * Requires an active recovery session from /auth/callback.
 */
export default function ResetPasswordScreen() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [portalAccent, setPortalAccent] = useState<'orange' | 'teal'>('orange');

  useEffect(() => {
    let active = true;
    (async () => {
      const portal = await readPasswordResetPortal();
      if (!active) return;
      setPortalAccent(portal === 'admin' ? 'teal' : 'orange');

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (!data.session) {
        router.replace(portal === 'admin' ? '/admin/signin' : '/(auth)/signin');
        return;
      }
      setChecking(false);
    })();
    return () => {
      active = false;
    };
  }, [router]);

  async function handleSave() {
    setErrorMessage(null);
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirm) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrorMessage(error.message);
        return;
      }

      const portal = await readPasswordResetPortal();
      await clearPasswordResetPortal();
      const role = readRoleFromMetadata(data.user?.user_metadata) ?? portal;
      router.replace(landingRouteForRole(role));
    } catch (caught) {
      setErrorMessage(
        caught instanceof Error
          ? `Could not update password: ${caught.message}`
          : 'Could not update password.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (checking) {
    return (
      <View className="screen items-center justify-center">
        <ActivityIndicator color="#f97316" size="large" />
      </View>
    );
  }

  const isAdmin = portalAccent === 'teal';
  const accentBg = isAdmin ? 'bg-teal-500' : 'bg-orange-500';
  const accentBtn = isAdmin ? 'bg-teal-500 active:bg-teal-400' : 'bg-orange-500 active:bg-orange-600';
  const accentBusy = isAdmin ? 'bg-teal-700' : 'bg-orange-300';

  return (
    <AuthShell tone={portalAccent} darkCanvas={isAdmin}>
      <View className="items-center">
        <View className={`h-16 w-16 items-center justify-center rounded-2xl ${accentBg}`}>
          <MaterialCommunityIcons name="form-textbox-password" size={32} color="#ffffff" />
        </View>
        <Text
          className={`font-display mt-5 text-3xl ${
            isAdmin ? 'text-white' : 'text-slate-900 dark:text-white'
          }`}>
          New password
        </Text>
        <Text className={`mt-2 text-center text-base ${isAdmin ? 'text-teal-100/80' : 'muted'}`}>
          Choose a password for your WarehousePro account
        </Text>
      </View>

      <View className="mt-8 gap-4">
        <View>
          <Text
            className={`mb-1.5 font-medium text-sm ${
              isAdmin ? 'text-teal-100' : 'text-slate-700 dark:text-slate-300'
            }`}>
            New password
          </Text>
          <PasswordField
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor={isAdmin ? '#5eead4' : '#94a3b8'}
            autoComplete="new-password"
            editable={!submitting}
          />
        </View>
        <View>
          <Text
            className={`mb-1.5 font-medium text-sm ${
              isAdmin ? 'text-teal-100' : 'text-slate-700 dark:text-slate-300'
            }`}>
            Confirm password
          </Text>
          <PasswordField
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Re-enter password"
            placeholderTextColor={isAdmin ? '#5eead4' : '#94a3b8'}
            autoComplete="new-password"
            editable={!submitting}
          />
        </View>
      </View>

      {errorMessage ? (
        <View
          className={`mt-4 rounded-xl border p-3 ${
            isAdmin
              ? 'border-red-300/40 bg-red-950/50'
              : 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50'
          }`}>
          <Text className={`text-sm ${isAdmin ? 'text-red-200' : 'text-red-700 dark:text-red-300'}`}>
            {errorMessage}
          </Text>
        </View>
      ) : null}

      <Pressable
        onPress={handleSave}
        disabled={submitting}
        className={`mt-6 h-14 items-center justify-center rounded-full ${
          submitting ? accentBusy : accentBtn
        }`}>
        {submitting ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text className="font-semibold text-lg text-white">Update password</Text>
        )}
      </Pressable>
    </AuthShell>
  );
}
