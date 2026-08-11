import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { ConnectionBanner } from '@/components/connection-banner';
import { STABLE_TEXT_STYLE } from '@/components/field-config';
import { PageHeader } from '@/components/page-header';
import { ScreenShell } from '@/components/screen-shell';
import type { Aisle, Bin } from '@/components/warehouse-map';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { filterBins, groupBinsByAisle, unaisledBins } from '@/lib/bin-search';
import { createOrder } from '@/lib/api/routes';
import { apiGet } from '@/lib/client';
import { describeApiError } from '@/lib/errors';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; aisles: Aisle[]; bins: Bin[] };

type Feedback = { tone: 'error' | 'success'; message: string } | null;

export default function AdminCreateOrderScreen() {
  const { useSplit: wide } = useBreakpoint();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [query, setQuery] = useState('');
  const [startCode, setStartCode] = useState<string | null>(null);
  const [selected, setSelected] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const load = useCallback(async () => {
    setState((prev) => (prev.status === 'ready' ? prev : { status: 'loading' }));
    try {
      const [bins, aisles] = await Promise.all([
        apiGet<Bin[]>('/api/bins'),
        apiGet<Aisle[]>('/api/aisles'),
      ]);
      setState({ status: 'ready', aisles, bins });
    } catch (error) {
      setState({ status: 'error', message: describeApiError(error) });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const aisles = state.status === 'ready' ? state.aisles : [];
  const bins = state.status === 'ready' ? state.bins : [];
  const startOptions = useMemo(() => unaisledBins(aisles, bins), [aisles, bins]);

  useEffect(() => {
    if (startCode === null && startOptions.length > 0) {
      setStartCode(startOptions[0].code);
    }
  }, [startCode, startOptions]);

  const pickableBins = useMemo(
    () => bins.filter((bin) => bin.code !== startCode),
    [bins, startCode],
  );
  const matches = useMemo(() => filterBins(pickableBins, query), [pickableBins, query]);
  const groups = useMemo(() => groupBinsByAisle(aisles, matches), [aisles, matches]);
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggleBin(code: string) {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((item) => item !== code) : [...prev, code],
    );
  }

  async function submit() {
    setFeedback(null);
    if (!startCode) {
      setFeedback({ tone: 'error', message: 'Choose a packing station.' });
      return;
    }
    if (selected.length === 0) {
      setFeedback({ tone: 'error', message: 'Select at least one product / bin.' });
      return;
    }

    setSubmitting(true);
    try {
      const order = await createOrder({ startCode, pickListCodes: selected });
      setSelected([]);
      setFeedback({
        tone: 'success',
        message: `Order #${order.id} created · ${order.pickListCodes.length} bins. It’s ready in the pick queue.`,
      });
    } catch (error) {
      setFeedback({ tone: 'error', message: describeApiError(error) });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScreenShell bottomPad={100} density="wide">
      <PageHeader
        title="Create order"
        subtitle={`${selected.length} ${selected.length === 1 ? 'bin' : 'bins'} selected`}
        accent="teal"
      />

      <View className="mt-4">
        <ConnectionBanner tone="admin" />
      </View>

      {state.status === 'loading' ? (
        <View className="mt-10 items-center">
          <ActivityIndicator color="#0d9488" />
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

      {state.status === 'ready' ? (
        <View className={wide ? 'flex-row gap-5' : undefined}>
          <View className={wide ? 'flex-1' : undefined}>
            <Text className="mb-2 font-semibold text-sm text-slate-700 dark:text-slate-300">
              Start station
            </Text>
            <View className="mb-4 flex-row flex-wrap gap-2">
              {startOptions.map((bin) => {
                const active = bin.code === startCode;
                return (
                  <Pressable
                    key={bin.id}
                    onPress={() => setStartCode(bin.code)}
                    className={`rounded-full px-3 py-2 ${
                      active
                        ? 'bg-teal-600'
                        : 'border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900'
                    }`}>
                    <Text
                      className={`font-semibold text-sm ${
                        active ? 'text-white' : 'text-slate-700 dark:text-slate-300'
                      }`}>
                      {bin.code}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="card mb-4 flex-row items-center px-3">
              <MaterialCommunityIcons name="magnify" size={20} color="#94a3b8" />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search product or bin code"
                placeholderTextColor="#94a3b8"
                autoCapitalize="none"
                className="h-12 flex-1 px-2 font-sans text-base text-slate-900 dark:text-white"
                style={STABLE_TEXT_STYLE}
              />
            </View>

            {groups.map((group) => (
              <View key={group.name} className="card mb-3 overflow-hidden">
                <Text className="border-b border-slate-100 px-4 py-2.5 font-bold text-sm text-slate-900 dark:border-slate-800 dark:text-white">
                  {group.name}
                </Text>
                {group.bins.map((bin) => {
                  const active = selectedSet.has(bin.code);
                  return (
                    <Pressable
                      key={bin.id}
                      onPress={() => toggleBin(bin.code)}
                      className="flex-row items-center border-b border-slate-50 px-4 py-3 active:bg-slate-50 dark:border-slate-800 dark:active:bg-slate-800">
                      <View
                        className={`h-6 w-6 items-center justify-center rounded-md border-2 ${
                          active
                            ? 'border-teal-500 bg-teal-500'
                            : 'border-slate-300 dark:border-slate-600'
                        }`}>
                        {active ? (
                          <MaterialCommunityIcons name="check" size={16} color="#ffffff" />
                        ) : null}
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="font-semibold text-base text-slate-900 dark:text-white">
                          {bin.sku?.trim() || 'Empty shelf'}
                        </Text>
                        <Text className="muted text-xs">{bin.code}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ))}

            {feedback ? (
              <View
                className={`mb-3 rounded-xl border p-3 ${
                  feedback.tone === 'error'
                    ? 'border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50'
                    : 'border-emerald-200 bg-emerald-50 dark:border-emerald-900 dark:bg-emerald-950/50'
                }`}>
                <Text
                  className={`text-sm ${
                    feedback.tone === 'error'
                      ? 'text-red-700 dark:text-red-300'
                      : 'text-emerald-700 dark:text-emerald-300'
                  }`}>
                  {feedback.message}
                </Text>
              </View>
            ) : null}

            <Pressable
              onPress={submit}
              disabled={submitting || selected.length === 0}
              className={`mt-2 h-14 items-center justify-center rounded-2xl ${
                selected.length === 0 || submitting
                  ? 'bg-teal-300 dark:bg-teal-900'
                  : 'bg-teal-600 active:bg-teal-500'
              }`}>
              {submitting ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text className="font-semibold text-lg text-white">
                  Create order ({selected.length})
                </Text>
              )}
            </Pressable>
          </View>

          {wide ? (
            <View className="card w-[34%] p-4">
              <Text className="font-semibold text-sm text-slate-700 dark:text-slate-200">
                Selected bins
              </Text>
              {selected.length === 0 ? (
                <Text className="muted mt-3 text-sm">Tap products to build the list.</Text>
              ) : (
                selected.map((code) => {
                  const bin = bins.find((b) => b.code === code);
                  return (
                    <View
                      key={code}
                      className="mt-2 border-b border-slate-50 pb-2 dark:border-slate-800">
                      <Text className="font-semibold text-slate-900 dark:text-white">
                        {bin?.sku ?? 'Empty shelf'}
                      </Text>
                      <Text className="muted text-xs">{code}</Text>
                    </View>
                  );
                })
              )}
            </View>
          ) : null}
        </View>
      ) : null}
    </ScreenShell>
  );
}
