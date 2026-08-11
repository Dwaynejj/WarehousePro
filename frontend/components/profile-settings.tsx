import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ConnectionBanner } from '@/components/connection-banner';
import { PageHeader } from '@/components/page-header';
import { PasswordField } from '@/components/password-field';
import { ScreenShell } from '@/components/screen-shell';
import { useProfile } from '@/hooks/use-profile';
import {
  initialsFromName,
  updateUserProfile,
  uploadAvatarImage,
} from '@/lib/profile';
import { supabase } from '@/lib/supabase';
import { useThemeStore, type ThemeMode } from '@/store/use-theme-store';

const HAPTICS_KEY = 'warehousepro.prefs.haptics';

type Props = {
  /** Visual accent only — not shown as a role label. */
  tone?: 'picker' | 'admin';
  /** Where to send the user after a successful sign-out. */
  onSignedOut: () => void;
};

const THEME_OPTIONS: {
  mode: ThemeMode;
  label: string;
  icon: 'white-balance-sunny' | 'moon-waning-crescent' | 'theme-light-dark';
}[] = [
  { mode: 'light', label: 'Light', icon: 'white-balance-sunny' },
  { mode: 'dark', label: 'Dark', icon: 'moon-waning-crescent' },
  { mode: 'system', label: 'System', icon: 'theme-light-dark' },
];

/**
 * Shared profile + account settings for every signed-in user.
 */
export function ProfileSettings({ tone = 'picker', onSignedOut }: Props) {
  const accent = tone === 'admin' ? '#0d9488' : '#f97316';
  const accentName = tone === 'admin' ? 'teal' : 'orange';
  const signOutBg = tone === 'admin' ? 'bg-teal-800 dark:bg-teal-700' : 'bg-slate-900 dark:bg-slate-800';
  const { status, profile, refresh } = useProfile();
  const themeMode = useThemeStore((s) => s.mode);
  const setThemeMode = useThemeStore((s) => s.setMode);

  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pickingPhoto, setPickingPhoto] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setPhone(profile.phone);
    setAvatarUrl(profile.avatarUrl);
  }, [profile]);

  useEffect(() => {
    void AsyncStorage.getItem(HAPTICS_KEY).then((value) => {
      if (value === '0') setHapticsEnabled(false);
      if (value === '1') setHapticsEnabled(true);
    });
  }, []);

  async function setHaptics(next: boolean) {
    setHapticsEnabled(next);
    await AsyncStorage.setItem(HAPTICS_KEY, next ? '1' : '0');
  }

  async function pickAndUploadPhoto() {
    if (!profile) return;
    setError(null);
    setMessage(null);
    setPickingPhoto(true);
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        setError('Photo library access is required to change your picture.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      const mime = asset.mimeType ?? 'image/jpeg';
      const publicUrl = await uploadAvatarImage(profile.id, asset.uri, mime);
      const updated = await updateUserProfile({
        fullName,
        phone,
        avatarUrl: publicUrl,
      });
      setAvatarUrl(updated.avatarUrl);
      await refresh();
      setMessage('Photo updated.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not update photo.');
    } finally {
      setPickingPhoto(false);
    }
  }

  async function saveProfile() {
    setError(null);
    setMessage(null);
    if (!fullName.trim()) {
      setError('Enter a display name.');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile({
        fullName,
        phone,
        avatarUrl: avatarUrl,
      });
      await refresh();
      setMessage('Profile saved.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  async function changePassword() {
    setError(null);
    setMessage(null);
    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    setChangingPassword(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      setNewPassword('');
      setConfirmPassword('');
      setMessage('Password updated.');
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Could not update password.',
      );
    } finally {
      setChangingPassword(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    setError(null);
    try {
      const { error: signOutError } = await supabase.auth.signOut();
      if (signOutError) {
        setError(signOutError.message);
        return;
      }
      onSignedOut();
    } finally {
      setSigningOut(false);
    }
  }

  if (status === 'loading' || !profile) {
    return (
      <View className="screen items-center justify-center">
        <ActivityIndicator color={accent} size="large" />
      </View>
    );
  }

  const initials = initialsFromName(fullName || profile.fullName, profile.email);
  const busy = saving || pickingPhoto || signingOut || changingPassword;

  return (
    <KeyboardAvoidingView
      className="screen"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScreenShell bottomPad={48} density="narrow">
        <PageHeader
          title="Profile"
          subtitle="Your account details"
          accent={accentName === 'teal' ? 'teal' : 'orange'}
        />

        <View className="mt-4">
          <ConnectionBanner tone={tone} />
        </View>

        <View className="card items-center px-4 py-6">
          <Pressable
            onPress={pickAndUploadPhoto}
            disabled={busy}
            className="relative active:opacity-90"
            accessibilityRole="button"
            accessibilityLabel="Change profile photo">
            {avatarUrl ? (
              <Image
                source={{ uri: avatarUrl }}
                style={{ width: 112, height: 112, borderRadius: 56, backgroundColor: '#e2e8f0' }}
              />
            ) : (
              <View
                className="items-center justify-center rounded-full"
                style={{ backgroundColor: accent, width: 112, height: 112, borderRadius: 56 }}>
                <Text className="font-display text-3xl text-white">{initials}</Text>
              </View>
            )}
            <View
              className="absolute bottom-0 right-0 h-9 w-9 items-center justify-center rounded-full border-2 border-white dark:border-slate-900"
              style={{ backgroundColor: accent }}>
              {pickingPhoto ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <MaterialCommunityIcons name="camera" size={18} color="#ffffff" />
              )}
            </View>
          </Pressable>
          <Text className="muted mt-3 text-sm">Tap to change photo</Text>
        </View>

        <View className="card mt-3 p-4">
          <Text className="label">Display name</Text>
          <TextInput
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your name"
            placeholderTextColor="#94a3b8"
            editable={!busy}
            autoCapitalize="words"
            className="field mt-2"
          />

          <Text className="label mt-4">Email</Text>
          <Text className="body-text mt-2 text-base">{profile.email ?? '—'}</Text>

          <Text className="label mt-4">Phone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="Optional"
            placeholderTextColor="#94a3b8"
            editable={!busy}
            keyboardType="phone-pad"
            className="field mt-2"
          />
        </View>

        <View className="card mt-3 p-4">
          <Text className="label">Appearance</Text>
          <Text className="muted mt-1 text-xs">Dark mode works across the whole app.</Text>
          <View className="mt-3 flex-row gap-2">
            {THEME_OPTIONS.map((option) => {
              const selected = themeMode === option.mode;
              return (
                <Pressable
                  key={option.mode}
                  onPress={() => setThemeMode(option.mode)}
                  className={`flex-1 items-center rounded-xl border px-2 py-3 ${
                    selected
                      ? tone === 'admin'
                        ? 'border-teal-500 bg-teal-50 dark:border-teal-400 dark:bg-teal-950'
                        : 'border-orange-500 bg-orange-50 dark:border-orange-400 dark:bg-orange-950'
                      : 'border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800'
                  }`}>
                  <MaterialCommunityIcons
                    name={option.icon}
                    size={20}
                    color={selected ? accent : '#94a3b8'}
                  />
                  <Text
                    className={`mt-1 font-semibold text-xs ${
                      selected
                        ? 'text-slate-900 dark:text-white'
                        : 'text-slate-500 dark:text-slate-400'
                    }`}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="card mt-3 p-4">
          <Text className="label">Preferences</Text>
          <View className="mt-3 flex-row items-center justify-between">
            <View className="mr-3 flex-1">
              <Text className="font-semibold text-base text-slate-900 dark:text-white">
                Haptic feedback
              </Text>
              <Text className="muted mt-0.5 text-xs">
                Light taps when confirming picks (device supported).
              </Text>
            </View>
            <Switch
              value={hapticsEnabled}
              onValueChange={(next) => {
                void setHaptics(next);
              }}
              trackColor={{ false: '#cbd5e1', true: accent }}
              thumbColor="#ffffff"
            />
          </View>
        </View>

        <View className="card mt-3 p-4">
          <Text className="label">Change password</Text>
          <Text className="muted mt-1 text-xs">
            You change it yourself while signed in. If you forgot it and can&apos;t sign in, use
            Forgot password on the sign-in screen.
          </Text>
          <Text className="label mt-4">New password</Text>
          <View className="mt-2">
            <PasswordField
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="At least 6 characters"
              placeholderTextColor="#94a3b8"
              autoComplete="new-password"
              editable={!busy}
            />
          </View>
          <Text className="label mt-4">Confirm new password</Text>
          <View className="mt-2">
            <PasswordField
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Re-enter password"
              placeholderTextColor="#94a3b8"
              autoComplete="new-password"
              editable={!busy}
            />
          </View>
          <Pressable
            onPress={changePassword}
            disabled={busy}
            className="mt-4 h-12 items-center justify-center rounded-full active:opacity-90"
            style={{ backgroundColor: busy ? '#94a3b8' : accent }}>
            {changingPassword ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="font-semibold text-base text-white">Update password</Text>
            )}
          </Pressable>
        </View>

        {message ? (
          <Text className="mt-4 font-sans text-sm text-emerald-700 dark:text-emerald-400">
            {message}
          </Text>
        ) : null}
        {error ? (
          <Text className="mt-4 font-sans text-sm text-red-600 dark:text-red-400">{error}</Text>
        ) : null}

        <Pressable
          onPress={saveProfile}
          disabled={busy}
          className="mt-6 h-14 items-center justify-center rounded-full active:opacity-90"
          style={{ backgroundColor: busy ? '#94a3b8' : accent }}>
          {saving ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="font-semibold text-lg text-white">Save changes</Text>
          )}
        </Pressable>

        <Pressable
          onPress={signOut}
          disabled={busy}
          className={`mt-3 h-14 items-center justify-center rounded-full active:opacity-90 ${signOutBg}`}>
          {signingOut ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text className="font-semibold text-lg text-white">Sign out</Text>
          )}
        </Pressable>
      </ScreenShell>
    </KeyboardAvoidingView>
  );
}
