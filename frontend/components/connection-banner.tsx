import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useApiHealth } from '@/hooks/use-api-health';

type Props = {
  /** Accent for admin (teal) vs picker (orange). */
  tone?: 'picker' | 'admin';
};

/**
 * Always-visible API status so connection problems are obvious.
 */
export function ConnectionBanner({ tone = 'picker' }: Props) {
  const health = useApiHealth();
  const accent = tone === 'admin' ? '#0d9488' : '#f97316';

  if (health.status === 'checking') {
    return (
      <View className="mb-3 self-start flex-row items-center rounded-lg border border-slate-200 bg-white px-2.5 py-1 dark:border-slate-800 dark:bg-slate-900">
        <ActivityIndicator size="small" color={accent} />
        <Text className="ml-1.5 font-sans text-xs text-slate-600 dark:text-slate-300">
          Checking…
        </Text>
      </View>
    );
  }

  if (health.status === 'online') {
    return (
      <View className="mb-3 self-start flex-row items-center rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 dark:border-emerald-900 dark:bg-emerald-950/60">
        <MaterialCommunityIcons name="lan-connect" size={14} color="#059669" />
        <Text className="ml-1.5 font-sans text-xs text-emerald-800 dark:text-emerald-300">
          Online
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-3 self-start flex-row items-center rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 dark:border-red-900 dark:bg-red-950/50">
      <MaterialCommunityIcons name="lan-disconnect" size={14} color="#b91c1c" />
      <Text className="ml-1.5 font-semibold text-xs text-red-800 dark:text-red-300">
        Offline
      </Text>
      <Pressable
        onPress={health.refresh}
        className="ml-2 rounded-full bg-red-700 px-2 py-0.5 active:opacity-90">
        <Text className="font-semibold text-[10px] text-white">Retry</Text>
      </Pressable>
    </View>
  );
}
