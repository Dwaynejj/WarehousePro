import { useRouter } from 'expo-router';

import { ProfileSettings } from '@/components/profile-settings';

export default function AdminSettingsScreen() {
  const router = useRouter();

  return (
    <ProfileSettings
      tone="admin"
      onSignedOut={() => router.replace('/admin/signin')}
    />
  );
}
