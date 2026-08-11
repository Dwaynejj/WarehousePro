import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'warehousepro.theme';

type ThemeState = {
  mode: ThemeMode;
  hydrated: boolean;
  setMode: (mode: ThemeMode) => void;
  hydrate: () => Promise<void>;
};

function isThemeMode(value: unknown): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system';
}

/**
 * Appearance preference. `system` follows the device; light/dark are forced.
 * Persisted with AsyncStorage (no zustand/middleware — that ESM build breaks Expo web).
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  mode: 'system',
  hydrated: false,
  setMode: (mode) => {
    set({ mode });
    void AsyncStorage.setItem(STORAGE_KEY, mode);
  },
  hydrate: async () => {
    if (get().hydrated) return;
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (isThemeMode(raw)) {
        set({ mode: raw, hydrated: true });
        return;
      }
    } catch {
      // ignore corrupt/missing storage
    }
    set({ hydrated: true });
  },
}));
