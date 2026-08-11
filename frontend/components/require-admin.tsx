import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useSessionRole } from '@/hooks/use-session-role';
import { landingRouteForRole } from '@/lib/role';

/**
 * Renders children only for an authenticated admin session.
 *
 * Admin tabs are a separate navigator from the picker app, but deep links can
 * still hit these routes — this is the presentation guard. Real authorization
 * must eventually live on the Spring API.
 */
export function RequireAdmin({ children }: { children: React.ReactNode }) {
  const session = useSessionRole();

  if (session.status === 'loading') {
    return (
      <View className="screen items-center justify-center">
        <ActivityIndicator color="#0f766e" />
      </View>
    );
  }

  if (session.status === 'signed-out') {
    return <Redirect href="/admin/signin" />;
  }

  if (session.role !== 'admin') {
    return <Redirect href={landingRouteForRole(session.role)} />;
  }

  return <>{children}</>;
}
