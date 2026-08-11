import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ConnectionBanner } from '@/components/connection-banner';
import { OrderCard } from '@/components/order-card';
import { OrderGrid } from '@/components/order-grid';
import { PageHeader } from '@/components/page-header';
import { ScreenShell } from '@/components/screen-shell';
import { WorkflowSteps } from '@/components/workflow-steps';
import { listOrders } from '@/lib/api/routes';
import { describeApiError } from '@/lib/errors';
import { useActiveOrderStore, type Order } from '@/store/use-active-order-store';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; orders: Order[] };

export default function PickerHomeScreen() {
  const router = useRouter();
  const setActiveOrder = useActiveOrderStore((state) => state.setActiveOrder);
  const activeOrderId = useActiveOrderStore((state) => state.order?.id ?? null);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const requestId = useRef(0);

  const loadOrders = useCallback(async () => {
    const id = ++requestId.current;
    setState((prev) => (prev.status === 'ready' ? prev : { status: 'loading' }));
    try {
      const orders = await listOrders();
      if (id !== requestId.current) return;
      setState({ status: 'ready', orders });
    } catch (error) {
      if (id !== requestId.current) return;
      setState({ status: 'error', message: describeApiError(error) });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadOrders();
    }, [loadOrders]),
  );

  function openOrder(order: Order) {
    setActiveOrder(order);
    router.navigate('/(picker)/route');
  }

  const pending =
    state.status === 'ready' ? state.orders.filter((o) => o.status !== 'COMPLETED') : [];
  const completedCount =
    state.status === 'ready' ? state.orders.filter((o) => o.status === 'COMPLETED').length : 0;

  return (
    <ScreenShell density="wide" bottomPad={56}>
      <PageHeader
        title="Pick queue"
        subtitle="Step 1 — choose a pending order to start picking"
        accent="orange"
      />

      <View className="mt-3">
        <ConnectionBanner tone="picker" />
      </View>

      <WorkflowSteps
        tone="picker"
        steps={[
          {
            n: 1,
            title: 'Select an order (you are here)',
            detail: 'Only PENDING orders appear below. Tap one to open Route.',
            active: true,
          },
          {
            n: 2,
            title: 'Follow the optimized route',
            detail: 'Backend calculates the shortest aisle-respecting path.',
          },
          {
            n: 3,
            title: 'Confirm picks, then complete',
            detail: 'Mark each bin, then finish the order when the list is done.',
          },
        ]}
      />

      {state.status === 'loading' ? (
        <View className="mt-4 items-center p-8">
          <ActivityIndicator color="#f97316" />
          <Text className="muted mt-3 text-sm">Loading orders from the API…</Text>
        </View>
      ) : null}

      {state.status === 'error' ? (
        <View className="mt-2 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
          <Text className="font-semibold text-sm text-red-800 dark:text-red-300">
            Could not load orders
          </Text>
          <Text className="mt-1 text-sm leading-5 text-red-700 dark:text-red-400">
            {state.message}
          </Text>
          <Pressable
            onPress={loadOrders}
            className="mt-3 self-start rounded-full bg-orange-500 px-4 py-2 active:bg-orange-600">
            <Text className="font-semibold text-sm text-white">Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {state.status === 'ready' ? (
        <View className="mb-3 flex-row gap-3">
          <View className="card flex-1 p-3">
            <Text className="label">Pending</Text>
            <Text className="font-display mt-1 text-xl text-slate-900 dark:text-white">
              {pending.length}
            </Text>
          </View>
          <View className="card flex-1 p-3">
            <Text className="label">Completed</Text>
            <Text className="font-display mt-1 text-xl text-slate-900 dark:text-white">
              {completedCount}
            </Text>
          </View>
        </View>
      ) : null}

      {state.status === 'ready' && pending.length === 0 ? (
        <View className="card mt-2 items-center p-8">
          <MaterialCommunityIcons name="clipboard-check-outline" size={36} color="#94a3b8" />
          <Text className="font-semibold mt-3 text-center text-slate-700 dark:text-slate-200">
            No pending orders
          </Text>
          <Text className="muted mt-1 text-center text-sm">
            New orders will show up here. You can preview a sample route (demo only — picks
            won&apos;t save).
          </Text>
          <Pressable
            onPress={() => {
              useActiveOrderStore.getState().clearActiveOrder();
              router.navigate('/(picker)/route');
            }}
            className="mt-4 rounded-full bg-orange-500 px-5 py-3 active:bg-orange-600">
            <Text className="font-semibold text-white">Preview sample route</Text>
          </Pressable>
        </View>
      ) : null}

      {pending.length > 0 ? (
        <View className="mt-1 mb-3">
          <View className="mb-3 flex-row items-center justify-between px-0.5">
            <Text className="label">Pending orders</Text>
            <Text className="muted text-xs">{pending.length} ready</Text>
          </View>
          <OrderGrid>
            {pending.map((order) => {
              const active = order.id === activeOrderId;
              return (
                <OrderCard
                  key={order.id}
                  order={order}
                  onPress={() => openOrder(order)}
                  tone="picker"
                  showAction
                  active={active}
                />
              );
            })}
          </OrderGrid>
        </View>
      ) : null}
    </ScreenShell>
  );
}
