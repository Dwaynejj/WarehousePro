import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { RequirePicker } from '@/components/require-picker';
import { useResolvedScheme } from '@/components/theme-provider';
import { useBreakpoint } from '@/hooks/use-breakpoint';

const ACTIVE = '#f97316';

export default function PickerLayout() {
  const { isDesktop, isPhone } = useBreakpoint();
  const scheme = useResolvedScheme();
  const dark = scheme === 'dark';

  return (
    <RequirePicker>
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
          name="home"
          options={{
            title: 'Orders',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons
                name="clipboard-list-outline"
                size={size}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="route"
          options={{
            title: 'Route',
            tabBarIcon: ({ color, size }) => (
              <MaterialCommunityIcons name="map-marker-path" size={size} color={color} />
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
    </RequirePicker>
  );
}
