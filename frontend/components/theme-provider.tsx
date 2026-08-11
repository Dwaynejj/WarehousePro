import { useColorScheme as useNativeWindColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Appearance, Platform, useColorScheme as useSystemColorScheme } from 'react-native';

import { useThemeStore } from '@/store/use-theme-store';

type Props = {
  children: React.ReactNode;
};

/**
 * Applies the user's theme preference to NativeWind (`dark:` classes).
 */
export function ThemeProvider({ children }: Props) {
  const mode = useThemeStore((s) => s.mode);
  const hydrated = useThemeStore((s) => s.hydrated);
  const hydrate = useThemeStore((s) => s.hydrate);
  const system = useSystemColorScheme();
  const { setColorScheme } = useNativeWindColorScheme();

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;

    try {
      if (mode === 'system') {
        setColorScheme('system');
        if (Platform.OS !== 'web') {
          Appearance.setColorScheme(null);
        }
        return;
      }

      setColorScheme(mode);
      if (Platform.OS !== 'web') {
        Appearance.setColorScheme(mode);
      }
    } catch (error) {
      console.warn('Theme scheme could not be applied:', error);
    }
  }, [hydrated, mode, setColorScheme, system]);

  return <>{children}</>;
}

/** Resolved light/dark after applying preference (for StatusBar, tab bars, etc.). */
export function useResolvedScheme(): 'light' | 'dark' {
  const mode = useThemeStore((s) => s.mode);
  const system = useSystemColorScheme();
  if (mode === 'system') {
    return system === 'dark' ? 'dark' : 'light';
  }
  return mode;
}
