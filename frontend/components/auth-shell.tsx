import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { createContext, useContext } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBreakpoint } from '@/hooks/use-breakpoint';

type AuthLayoutValue = {
  /** Brand panel is already showing on the left — hide duplicate logos in the form. */
  split: boolean;
  darkCanvas: boolean;
};

const AuthLayoutContext = createContext<AuthLayoutValue>({
  split: false,
  darkCanvas: false,
});

export function useAuthLayout() {
  return useContext(AuthLayoutContext);
}

type Props = {
  children: React.ReactNode;
  /** orange = public auth, teal = staff invite/signin */
  tone?: 'orange' | 'teal';
  /** When true, use the dark teal staff canvas instead of light screen. */
  darkCanvas?: boolean;
};

/**
 * Auth pages: phone stays full-bleed; desktop becomes a centered card
 * (or brand + form split on very wide screens) so forms don’t stretch.
 */
export function AuthShell({ children, tone = 'orange', darkCanvas = false }: Props) {
  const { isDesktop, width } = useBreakpoint();
  const split = width >= 1100 && !darkCanvas;
  const accent = tone === 'teal' ? '#0d9488' : '#f97316';
  const layout: AuthLayoutValue = { split, darkCanvas };

  if (darkCanvas) {
    return (
      <AuthLayoutContext.Provider value={layout}>
        <View className="flex-1 bg-teal-950">
          <StatusBar style="light" />
          <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView
              className="flex-1"
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
              <ScrollView
                className="flex-1"
                contentContainerStyle={{
                  flexGrow: 1,
                  justifyContent: isDesktop ? 'center' : 'flex-start',
                  paddingVertical: isDesktop ? 40 : 0,
                }}
                keyboardShouldPersistTaps="handled">
                <View
                  className="w-full self-center px-8 pb-10 pt-8"
                  style={{ maxWidth: isDesktop ? 440 : undefined }}>
                  {children}
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </View>
      </AuthLayoutContext.Provider>
    );
  }

  return (
    <AuthLayoutContext.Provider value={layout}>
      <View className="screen">
        <StatusBar style="dark" />
        {isDesktop ? (
          <View
            pointerEvents="none"
            className="absolute inset-0 bg-slate-100 dark:bg-slate-950"
          />
        ) : null}
        <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
          <KeyboardAvoidingView
            className="flex-1"
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
              className="flex-1"
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: isDesktop ? 'center' : 'flex-start',
                paddingVertical: isDesktop ? 48 : 0,
                paddingHorizontal: isDesktop ? 24 : 0,
              }}
              keyboardShouldPersistTaps="handled">
              {split ? (
                <View
                  className="mx-auto w-full flex-row overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-soft dark:border-slate-800 dark:bg-slate-900"
                  style={{ maxWidth: 960, minHeight: 560 }}>
                  <View
                    className="w-[42%] justify-between px-10 py-12"
                    style={{ backgroundColor: '#0f172a' }}>
                    <View>
                      <View
                        className="h-14 w-14 items-center justify-center rounded-2xl"
                        style={{ backgroundColor: accent }}>
                        <MaterialCommunityIcons name="warehouse" size={28} color="#ffffff" />
                      </View>
                      <Text className="font-display mt-8 text-3xl tracking-tight text-white">
                        WarehousePro
                      </Text>
                      <Text className="mt-3 font-sans text-base leading-6 text-slate-400">
                        Optimized pick routes for the floor — sign in to continue.
                      </Text>
                    </View>
                    <Text className="font-sans text-xs text-slate-500">Capstone · BIT 268</Text>
                  </View>
                  <View className="flex-1 justify-center px-10 py-12">{children}</View>
                </View>
              ) : (
                <View
                  className={`w-full self-center ${
                    isDesktop
                      ? 'rounded-3xl border border-slate-200 bg-white px-10 py-10 shadow-soft dark:border-slate-800 dark:bg-slate-900'
                      : 'px-8 pb-10 pt-8'
                  }`}
                  style={{ maxWidth: isDesktop ? 440 : undefined }}>
                  {children}
                </View>
              )}
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </AuthLayoutContext.Provider>
  );
}
