import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ConnectionBanner } from '@/components/connection-banner';
import { PageHeader } from '@/components/page-header';
import { ScreenShell } from '@/components/screen-shell';
import { WarehouseMap, type Aisle, type Bin } from '@/components/warehouse-map';
import { apiGet } from '@/lib/client';
import { describeApiError } from '@/lib/errors';
import { useActiveOrderStore } from '@/store/use-active-order-store';

type Props = {
  tone?: 'picker' | 'admin';
  title?: string;
  subtitle?: string;
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      aisles: Aisle[];
      bins: Bin[];
      floor: { width: number; height: number };
    };

/**
 * Shared floor map for picker + admin.
 * When an active order has picks, those bins (and their aisle) turn green.
 */
export function LayoutMapScreen({
  tone = 'picker',
  title = 'Floor map',
  subtitle = 'Live shelf layout — picked bins turn green',
}: Props) {
  const activeOrder = useActiveOrderStore((s) => s.order);
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const load = useCallback(async () => {
    setState((prev) => (prev.status === 'ready' ? prev : { status: 'loading' }));
    try {
      const [aisles, bins, warehouse] = await Promise.all([
        apiGet<Aisle[]>('/api/aisles'),
        apiGet<Bin[]>('/api/bins'),
        apiGet<{ width: number; height: number }>('/api/warehouse'),
      ]);
      setState({
        status: 'ready',
        aisles,
        bins,
        floor: { width: warehouse.width, height: warehouse.height },
      });
    } catch (error) {
      setState({ status: 'error', message: describeApiError(error) });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const pickedCodes =
    activeOrder?.items.filter((i) => i.picked).map((i) => i.binCode) ?? [];
  const routeCodes = activeOrder
    ? [activeOrder.startCode, ...activeOrder.pickListCodes]
    : [];
  const currentCode =
    activeOrder?.items.find((i) => !i.picked)?.binCode ?? null;

  return (
    <ScreenShell>
      <PageHeader
        title={title}
        subtitle={subtitle}
        accent={tone === 'admin' ? 'teal' : 'orange'}
      />

      <View className="mt-4">
        <ConnectionBanner tone={tone} />
      </View>

      {activeOrder ? (
        <View className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 p-3 dark:border-orange-900 dark:bg-orange-950/50">
          <Text className="font-semibold text-sm text-orange-900 dark:text-orange-200">
            Tracking Order #{activeOrder.id}
          </Text>
          <Text className="mt-0.5 text-xs text-orange-800 dark:text-orange-300">
            {pickedCodes.length} of {activeOrder.pickListCodes.length} bins picked — green marks
            completed shelves on the map.
          </Text>
        </View>
      ) : (
        <View className="card mb-4 p-3">
          <Text className="body-text text-sm">
            No active pick order. Showing the full warehouse layout. Open a PENDING order from the
            queue to see live green progress.
          </Text>
        </View>
      )}

      {state.status === 'loading' ? (
        <View className="items-center p-10">
          <ActivityIndicator color={tone === 'admin' ? '#0d9488' : '#f97316'} />
        </View>
      ) : null}

      {state.status === 'error' ? (
        <View className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
          <Text className="text-sm text-red-700 dark:text-red-300">{state.message}</Text>
          <Pressable onPress={load} className="mt-3">
            <Text className="font-semibold text-sm text-orange-600 dark:text-orange-400">Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {state.status === 'ready' ? (
        <WarehouseMap
          aisles={state.aisles}
          bins={state.bins}
          floor={state.floor}
          routeCodes={routeCodes}
          pickedCodes={pickedCodes}
          currentCode={currentCode}
        />
      ) : null}
    </ScreenShell>
  );
}
