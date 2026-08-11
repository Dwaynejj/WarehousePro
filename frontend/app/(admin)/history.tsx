import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { ConnectionBanner } from '@/components/connection-banner';
import { OrderCard } from '@/components/order-card';
import { OrderGrid } from '@/components/order-grid';
import { PageHeader } from '@/components/page-header';
import { ScreenShell } from '@/components/screen-shell';
import { listOrders } from '@/lib/api/routes';
import { describeApiError } from '@/lib/errors';
import type { Order } from '@/types';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; orders: Order[] };

type Filter = 'all' | 'pending' | 'completed';

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '';
  }
}

function durationLabel(order: Order): string | null {
  if (!order.completedAt) return null;
  const start = new Date(order.createdAt).getTime();
  const end = new Date(order.completedAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  const mins = Math.round((end - start) / 60000);
  if (mins < 1) return 'under a minute';
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export default function AdminHistoryScreen() {
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [filter, setFilter] = useState<Filter>('all');

  const load = useCallback(async () => {
    setState((prev) => (prev.status === 'ready' ? prev : { status: 'loading' }));
    try {
      const orders = await listOrders();
      setState({ status: 'ready', orders });
    } catch (error) {
      setState({ status: 'error', message: describeApiError(error) });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const orders = state.status === 'ready' ? state.orders : [];
  const pending = orders.filter((o) => o.status !== 'COMPLETED');
  const completed = orders.filter((o) => o.status === 'COMPLETED');
  const visible =
    filter === 'pending' ? pending : filter === 'completed' ? completed : orders;

  const pickedTotal = useMemo(
    () =>
      orders.reduce(
        (sum, order) => sum + order.items.filter((i) => i.picked).length,
        0,
      ),
    [orders],
  );
  const itemTotal = useMemo(
    () => orders.reduce((sum, order) => sum + order.items.length, 0),
    [orders],
  );
  const pct = itemTotal > 0 ? Math.round((pickedTotal / itemTotal) * 100) : 0;

  return (
    <ScreenShell bottomPad={56}>
      <PageHeader
        title="History"
        subtitle={`${completed.length} completed · ${pending.length} pending`}
        accent="teal"
      />

      <View className="mt-4">
        <ConnectionBanner tone="admin" />
      </View>

      <View className="mb-4 flex-row gap-2">
        {(
          [
            ['all', `All ${orders.length}`],
            ['pending', `Pending ${pending.length}`],
            ['completed', `Completed ${completed.length}`],
          ] as const
        ).map(([key, label]) => {
          const active = filter === key;
          return (
            <Pressable
              key={key}
              onPress={() => setFilter(key)}
              className={`rounded-full px-3.5 py-2 ${
                active
                  ? 'bg-teal-600'
                  : 'border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
              }`}>
              <Text
                className={`font-semibold text-sm ${
                  active ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                }`}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {state.status === 'ready' ? (
        <View className="card mb-4 p-4">
          <View className="flex-row gap-2">
            <MiniStat icon="speedometer" label="Orders" value={String(orders.length)} />
            <MiniStat icon="clock-outline" label="Pending" value={String(pending.length)} />
            <MiniStat
              icon="clipboard-check-outline"
              label="Done"
              value={`${completed.length}/${orders.length || 0}`}
            />
          </View>
          <Text className="mt-4 font-semibold text-sm text-slate-700 dark:text-slate-200">
            {pending.length} pending orders
          </Text>
          <View className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <View className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
          </View>
          <Text className="muted mt-1 text-xs">{pct}% of line items picked</Text>
        </View>
      ) : null}

      {state.status === 'loading' ? (
        <View className="card items-center p-10">
          <ActivityIndicator color="#0d9488" />
          <Text className="muted mt-3 text-sm">Loading history…</Text>
        </View>
      ) : null}

      {state.status === 'error' ? (
        <View className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
          <Text className="text-sm text-red-700 dark:text-red-300">{state.message}</Text>
          <Pressable onPress={load} className="mt-3">
            <Text className="font-semibold text-sm text-teal-600 dark:text-teal-400">Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {visible.length > 0 ? (
        <View className="mt-1 mb-3">
          <View className="mb-3 flex-row items-center justify-between px-0.5">
            <Text className="label">
              {filter === 'all'
                ? 'All orders'
                : filter === 'pending'
                  ? 'Pending orders'
                  : 'Completed orders'}
            </Text>
            <Text className="muted text-xs">{visible.length} shown</Text>
          </View>
          <OrderGrid>
            {visible.map((order) => (
              <OrderCard
                key={order.id}
                order={order}
                tone="admin"
                timeLabel={formatTime(order.createdAt)}
                durationLabel={durationLabel(order)}
              />
            ))}
          </OrderGrid>
        </View>
      ) : state.status === 'ready' ? (
        <View className="card mt-1 items-center p-8">
          <MaterialCommunityIcons name="clipboard-text-off-outline" size={36} color="#94a3b8" />
          <Text className="mt-3 font-semibold text-slate-700 dark:text-slate-200">
            No orders in this filter
          </Text>
        </View>
      ) : null}
    </ScreenShell>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="flex-1 items-center rounded-xl bg-slate-50 p-3 dark:bg-slate-800">
      <MaterialCommunityIcons name={icon} size={18} color="#0d9488" />
      <Text className="font-display mt-1 text-lg text-slate-900 dark:text-white">{value}</Text>
      <Text className="muted text-[10px]">{label}</Text>
    </View>
  );
}
