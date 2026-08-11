import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useSessionRole } from '@/hooks/use-session-role';
import { landingRouteForRole } from '@/lib/role';

/** Renders children only for an authenticated picker (or unknown) session. */
export function RequirePicker({ children }: { children: React.ReactNode }) {
  const session = useSessionRole();

  if (session.status === 'loading') {
    return (
      <View className="screen items-center justify-center">
        <ActivityIndicator color="#f97316" />
      </View>
    );
  }

  if (session.status === 'signed-out') {
    return <Redirect href="/(auth)/signin" />;
  }

  if (session.role === 'admin') {
    return <Redirect href={landingRouteForRole('admin')} />;
  }

  return <>{children}</>;
}
