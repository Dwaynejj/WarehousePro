import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';

import { useSessionRole } from '@/hooks/use-session-role';
import { landingRouteForRole } from '@/lib/role';

/**
 * Cold start: send signed-in users to their portal; everyone else to onboarding.
 */
export default function Index() {
  const session = useSessionRole();

  if (session.status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator color="#f97316" />
      </View>
    );
  }

  if (session.status === 'signed-in') {
    return <Redirect href={landingRouteForRole(session.role)} />;
  }

  return <Redirect href="/(auth)/onboarding" />;
}
