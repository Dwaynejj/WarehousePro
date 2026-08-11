import { useRouter } from 'expo-router';

import { ProfileSettings } from '@/components/profile-settings';

export default function PickerSettingsScreen() {
  const router = useRouter();

  return (
    <ProfileSettings
      tone="picker"
      onSignedOut={() => router.replace('/(auth)/onboarding')}
    />
  );
}
