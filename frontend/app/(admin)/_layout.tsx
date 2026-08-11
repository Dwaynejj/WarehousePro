import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { RequireAdmin } from '@/components/require-admin';
import { useResolvedScheme } from '@/components/theme-provider';
import { useBreakpoint } from '@/hooks/use-breakpoint';

const ACTIVE = '#0d9488';

export default function AdminLayout() {
  const { isDesktop, isPhone } = useBreakpoint();
  const scheme = useResolvedScheme();
  const dark = scheme === 'dark';

  return (
    <RequireAdmin>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: ACTIVE,
          tabBarInactiveTintColor: dark ? '#64748b' : '#94a3b8',
          tabBarButton: HapticTab,
          tabBarPosition: isDesktop ? 'left' : 'bottom',
          tabBarVariant: isDesktop ? 'material' : 'uikit',
          tabBarLabelPosition: isDesktop ? 'beside-icon' : 'below-icon',
          tabBarStyle: isDesktop
            ? {
                backgroundColor: dark ? '#020617' : '#ffffff',
                borderRightColor: dark ? '#1e293b' : '#e2e8f0',
                width: 168,
                paddingTop: Platform.OS === 'web' ? 20 : 12,
              }
            : {
                backgroundColor: dark ? '#020617' : '#ffffff',
                borderTopColor: dark ? '#1e293b' : '#e2e8f0',
                height: isPhone ? 58 : 64,
              },
          tabBarLabelStyle: {
            fontSize: isDesktop ? 13 : isPhone ? 10 : 11,
            fontFamily: 'DMSans_600SemiBold',
          },
          tabBarItemStyle: isDesktop
            ? { marginVertical: 2, borderRadius: 12 }
            : undefined,
        }}>
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="view-dashboard-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="orders"
          options={{
            title: 'Create Order',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="clipboard-plus-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="map"
          options={{
            title: 'Map',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="floor-plan" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="history"
          options={{
            title: 'History',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="history" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="account-circle-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
      </Tabs>
    </RequireAdmin>
  );
}
