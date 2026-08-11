import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_600SemiBold,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { ThemeProvider, useResolvedScheme } from '@/components/theme-provider';
import '../global.css';

export const unstable_settings = {
  anchor: 'index',
};

SplashScreen.preventAutoHideAsync().catch(() => undefined);

function RootNavigator() {
  const scheme = useResolvedScheme();

  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(picker)" />
        <Stack.Screen name="(admin)" />
        <Stack.Screen name="admin/signin" />
        <Stack.Screen name="admin/invite" />
        <Stack.Screen name="auth/callback" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_600SemiBold,
    DMSans_700Bold,
    Sora_600SemiBold,
    Sora_700Bold,
  });

  const ready = fontsLoaded || fontError != null;

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [ready]);

  // Avoid a permanent blank screen if fonts are slow or fail.
  if (!ready) {
    return null;
  }

  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
