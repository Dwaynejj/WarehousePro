import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ConnectionBanner } from '@/components/connection-banner';
import { PageHeader } from '@/components/page-header';
import { ScreenShell } from '@/components/screen-shell';
import { WarehouseMap, type Aisle, type Bin } from '@/components/warehouse-map';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { completeOrder, optimizeRoute, pickOrderItem } from '@/lib/api/routes';
import { apiGet } from '@/lib/client';
import { describeApiError } from '@/lib/errors';
import {
  FALLBACK_PICK_LIST_CODES,
  FALLBACK_START_CODE,
  useActiveOrderStore,
} from '@/store/use-active-order-store';
import type { OptimizeRouteResponse } from '@/types';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      route: OptimizeRouteResponse;
      aisles: Aisle[];
      bins: Bin[];
      floor: { width: number; height: number };
    };

export default function PickerRouteScreen() {
  const router = useRouter();
  const { useSplit: wide } = useBreakpoint();
  const activeOrder = useActiveOrderStore((state) => state.order);
  const setActiveOrder = useActiveOrderStore((state) => state.setActiveOrder);
  const clearActiveOrder = useActiveOrderStore((state) => state.clearActiveOrder);

  const isDemo = activeOrder === null;
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [actionError, setActionError] = useState<string | null>(null);
  const [pendingItemId, setPendingItemId] = useState<number | null>(null);
  const [completing, setCompleting] = useState(false);
  const [demoPicked, setDemoPicked] = useState<string[]>([]);

  const startCode = activeOrder?.startCode ?? FALLBACK_START_CODE;
  const rawPickList = activeOrder?.pickListCodes ?? FALLBACK_PICK_LIST_CODES;
  const pickListKey = rawPickList.join('|');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const pickListCodes = useMemo(() => rawPickList, [pickListKey]);

  const loadRoute = useCallback(async () => {
    setState({ status: 'loading' });
    setActionError(null);
    try {
      const [route, aisles, bins, warehouse] = await Promise.all([
        optimizeRoute({ startCode, pickListCodes }),
        apiGet<Aisle[]>('/api/aisles'),
        apiGet<Bin[]>('/api/bins'),
        apiGet<{ width: number; height: number }>('/api/warehouse'),
      ]);
      setState({
        status: 'ready',
        route,
        aisles,
        bins,
        floor: { width: warehouse.width, height: warehouse.height },
      });
    } catch (error) {
      setState({ status: 'error', message: describeApiError(error) });
    }
  }, [startCode, pickListCodes]);

  useEffect(() => {
    setDemoPicked([]);
    loadRoute();
  }, [loadRoute]);

  const orderedBins =
    state.status === 'ready'
      ? state.route.orderedBinCodes.filter((code) => code !== startCode)
      : [];

  const pickedCodes = new Set(
    isDemo
      ? demoPicked
      : (activeOrder?.items ?? []).filter((item) => item.picked).map((item) => item.binCode),
  );

  const currentBin = orderedBins.find((code) => !pickedCodes.has(code)) ?? null;
  const allPicked =
    orderedBins.length > 0 && orderedBins.every((code) => pickedCodes.has(code));

  async function confirmPick(binCode: string) {
    if (isDemo) {
      setDemoPicked((prev) => (prev.includes(binCode) ? prev : [...prev, binCode]));
      return;
    }
    if (!activeOrder) return;
    const item = activeOrder.items.find((row) => row.binCode === binCode && !row.picked);
    if (!item) return;

    setPendingItemId(item.id);
    setActionError(null);
    try {
      const updated = await pickOrderItem(activeOrder.id, item.id);
      setActiveOrder(updated);
    } catch (error) {
      setActionError(describeApiError(error));
    } finally {
      setPendingItemId(null);
    }
  }

  async function finishOrder() {
    if (isDemo) {
      clearActiveOrder();
      setDemoPicked([]);
      router.navigate('/(picker)/home');
      return;
    }
    if (!activeOrder) return;
    setCompleting(true);
    setActionError(null);
    try {
      await completeOrder(activeOrder.id);
      clearActiveOrder();
      router.navigate('/(picker)/home');
    } catch (error) {
      setActionError(describeApiError(error));
    } finally {
      setCompleting(false);
    }
  }

  const pickedList = Array.from(pickedCodes);

  return (
    <ScreenShell bottomPad={48} density="wide">
      <PageHeader
        title="Route"
        subtitle="Optimized path — confirm picks; map shelves turn green"
        accent="orange"
      />

      <View className="mt-4">
        <ConnectionBanner tone="picker" />
      </View>

      {isDemo ? (
        <View className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/50">
          <Text className="font-semibold text-sm text-amber-900 dark:text-amber-200">
            Demo mode
          </Text>
          <Text className="mt-1 text-xs leading-4 text-amber-800 dark:text-amber-300">
            Sample bins only. Open a PENDING order from the queue to save progress.
          </Text>
        </View>
      ) : (
        <View className="mb-4 rounded-2xl border border-orange-200 bg-orange-50 p-4 dark:border-orange-900 dark:bg-orange-950/50">
          <Text className="font-semibold text-sm text-orange-900 dark:text-orange-200">
            Order #{activeOrder.id} · start {startCode}
          </Text>
          <Text className="mt-1 text-xs text-orange-800 dark:text-orange-300">
            Confirm the orange stop. Completed shelves turn green on the map.
          </Text>
        </View>
      )}

      {state.status === 'loading' ? (
        <View className="mt-8 items-center">
          <ActivityIndicator color="#f97316" />
          <Text className="muted mt-3">Optimizing route…</Text>
        </View>
      ) : null}

      {state.status === 'error' ? (
        <View className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
          <Text className="text-sm text-red-700 dark:text-red-300">{state.message}</Text>
          <Pressable onPress={loadRoute} className="mt-3">
            <Text className="font-semibold text-sm text-orange-600 dark:text-orange-400">Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {state.status === 'ready' ? (
        <View className={wide ? 'flex-row gap-5' : undefined}>
          <View className={wide ? 'w-[48%]' : 'mb-4'}>
            <Text className="label mb-2">Live map</Text>
            <WarehouseMap
              aisles={state.aisles}
              bins={state.bins}
              floor={state.floor}
              routeCodes={state.route.orderedBinCodes}
              pickedCodes={pickedList}
              currentCode={currentBin}
              compact={!wide}
            />
            <View className="mt-3 flex-row gap-3">
              <View className="card flex-1 p-3">
                <Text className="label text-[10px]">Distance</Text>
                <Text className="font-display text-xl text-slate-900 dark:text-white">
                  {state.route.totalDistance.toFixed(1)}
                </Text>
              </View>
              <View className="card flex-1 p-3">
                <Text className="label text-[10px]">Progress</Text>
                <Text className="font-display text-xl text-slate-900 dark:text-white">
                  {pickedCodes.size}/{orderedBins.length}
                </Text>
              </View>
            </View>
          </View>

          <View className={wide ? 'flex-1' : undefined}>
            <View className="card overflow-hidden">
              <View className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
                <Text className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                  Visit order
                </Text>
                <Text className="muted text-xs">Orange = current · Green = picked</Text>
              </View>
              {state.route.orderedBinCodes.map((code, index) => {
                const isStart = code === startCode;
                const picked = !isStart && pickedCodes.has(code);
                const current = code === currentBin;
                const product =
                  state.bins.find((b) => b.code === code)?.sku ??
                  (isStart ? 'Packing station' : 'Shelf');
                return (
                  <View
                    key={`${code}-${index}`}
                    className={`flex-row items-center border-b border-slate-100 px-4 py-3 dark:border-slate-800 ${
                      current
                        ? 'bg-orange-50 dark:bg-orange-950/40'
                        : picked
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30'
                          : ''
                    }`}>
                    <View
                      className={`h-8 w-8 items-center justify-center rounded-full ${
                        picked
                          ? 'bg-emerald-500'
                          : current
                            ? 'bg-orange-500'
                            : 'bg-slate-200 dark:bg-slate-700'
                      }`}>
                      {picked ? (
                        <MaterialCommunityIcons name="check" size={16} color="#ffffff" />
                      ) : (
                        <Text className="font-bold text-xs text-slate-700 dark:text-slate-200">
                          {index + 1}
                        </Text>
                      )}
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="font-semibold text-slate-900 dark:text-white">
                        {product}
                      </Text>
                      <Text className="muted text-xs">{code}</Text>
                    </View>
                    {current && !isStart ? (
                      <Pressable
                        onPress={() => confirmPick(code)}
                        disabled={pendingItemId !== null}
                        className="rounded-full bg-orange-500 px-3 py-2 active:bg-orange-600">
                        {pendingItemId !== null ? (
                          <ActivityIndicator color="#ffffff" size="small" />
                        ) : (
                          <Text className="font-semibold text-xs text-white">Confirm</Text>
                        )}
                      </Pressable>
                    ) : null}
                  </View>
                );
              })}
            </View>

            {actionError ? (
              <View className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/50">
                <Text className="text-sm text-red-700 dark:text-red-300">{actionError}</Text>
              </View>
            ) : null}

            {allPicked ? (
              <Pressable
                onPress={finishOrder}
                disabled={completing}
                className="mt-5 h-14 items-center justify-center rounded-2xl bg-emerald-600 active:bg-emerald-500">
                {completing ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text className="font-semibold text-lg text-white">
                    {isDemo ? 'Finish demo' : 'Complete order'}
                  </Text>
                )}
              </Pressable>
            ) : (
              <Text className="muted mt-4 text-center text-xs">
                Confirm the orange stop to unlock the next shelf.
              </Text>
            )}
          </View>
        </View>
      ) : null}
    </ScreenShell>
  );
}
