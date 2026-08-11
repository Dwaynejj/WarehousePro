import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import { AisleManager } from '@/components/aisle-manager';
import { ConnectionBanner } from '@/components/connection-banner';
import { FIELD_BASE_CLASSNAME, STABLE_TEXT_STYLE } from '@/components/field-config';
import { PageHeader } from '@/components/page-header';
import { ScreenShell } from '@/components/screen-shell';
import { WarehouseMap, type Aisle, type Bin } from '@/components/warehouse-map';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { apiGet, apiPut } from '@/lib/client';
import { describeApiError } from '@/lib/errors';

type Warehouse = {
  id: number;
  name: string;
  width: number;
  height: number;
};

type Zone = { id: number; name: string; zoneType: string | null };

type SetupData = {
  warehouse: Warehouse;
  aisles: Aisle[];
  bins: Bin[];
  zones: Zone[];
};

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: SetupData };

type Feedback = { tone: 'error' | 'success'; message: string } | null;

const START_CODE = 'PACK-01';

export default function AdminDashboardScreen() {
  const { useSplit: wide } = useBreakpoint();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [name, setName] = useState('');
  const [floorW, setFloorW] = useState('');
  const [floorH, setFloorH] = useState('');
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [savedFlash, setSavedFlash] = useState(false);

  const load = useCallback(async () => {
    setState((prev) => (prev.status === 'ready' ? prev : { status: 'loading' }));
    try {
      const [warehouse, aisles, bins, zones] = await Promise.all([
        apiGet<Warehouse>('/api/warehouse'),
        apiGet<Aisle[]>('/api/aisles'),
        apiGet<Bin[]>('/api/bins'),
        apiGet<Zone[]>('/api/zones'),
      ]);
      setName(warehouse.name);
      setFloorW(String(warehouse.width));
      setFloorH(String(warehouse.height));
      setState({ status: 'ready', data: { warehouse, aisles, bins, zones } });
    } catch (error) {
      setState({ status: 'error', message: describeApiError(error) });
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function saveWarehouse() {
    setFeedback(null);
    const w = Number(floorW);
    const h = Number(floorH);
    if (!name.trim()) {
      setFeedback({ tone: 'error', message: 'Enter a warehouse name.' });
      return;
    }
    if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) {
      setFeedback({ tone: 'error', message: 'Width and height must be positive numbers.' });
      return;
    }

    setSaving(true);
    try {
      await apiPut<Warehouse>('/api/warehouse', { name: name.trim(), width: w, height: h });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1600);
      await load();
    } catch (error) {
      setFeedback({ tone: 'error', message: describeApiError(error) });
    } finally {
      setSaving(false);
    }
  }

  const data = state.status === 'ready' ? state.data : null;
  const shelfBins = data?.bins.filter((b) => b.code !== START_CODE) ?? [];
  const zoneId = data?.zones[0]?.id ?? null;

  return (
    <ScreenShell bottomPad={48} density="wide">
      <PageHeader
        title="Warehouse setup"
        subtitle="Floor dimensions and layout"
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
        <View className="mt-2 rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/50">
          <Text className="text-sm text-red-700 dark:text-red-300">{state.message}</Text>
          <Pressable onPress={load} className="mt-3">
            <Text className="font-semibold text-sm text-teal-600 dark:text-teal-400">Retry</Text>
          </Pressable>
        </View>
      ) : null}

      {data ? (
        <View className={wide ? 'mt-2 flex-row gap-5' : 'mt-2'}>
          <View className={wide ? 'flex-1' : undefined}>
            <View className="card p-4">
              <Text className="mb-1.5 font-medium text-sm text-slate-700 dark:text-slate-300">
                Name
              </Text>
              <TextInput
                value={name}
                onChangeText={setName}
                className={FIELD_BASE_CLASSNAME}
                style={STABLE_TEXT_STYLE}
                placeholder="Main Warehouse"
                placeholderTextColor="#94a3b8"
              />
              <View className="mt-3 flex-row gap-3">
                <View className="flex-1">
                  <Text className="mb-1.5 font-medium text-sm text-slate-700 dark:text-slate-300">
                    Width
                  </Text>
                  <TextInput
                    value={floorW}
                    onChangeText={setFloorW}
                    keyboardType="numeric"
                    className={FIELD_BASE_CLASSNAME}
                    style={STABLE_TEXT_STYLE}
                  />
                </View>
                <View className="flex-1">
                  <Text className="mb-1.5 font-medium text-sm text-slate-700 dark:text-slate-300">
                    Height
                  </Text>
                  <TextInput
                    value={floorH}
                    onChangeText={setFloorH}
                    keyboardType="numeric"
                    className={FIELD_BASE_CLASSNAME}
                    style={STABLE_TEXT_STYLE}
                  />
                </View>
              </View>
              <Text className="muted mt-2 text-xs leading-4">
                Measured in the same units as bin coordinates. The warehouse cannot be made
                smaller than bins already placed in it.
              </Text>
              <Pressable
                onPress={saveWarehouse}
                disabled={saving}
                className={`mt-4 h-12 items-center justify-center rounded-full ${
                  savedFlash
                    ? 'bg-slate-200 dark:bg-slate-700'
                    : 'bg-teal-600 active:bg-teal-500'
                }`}>
                {saving ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text
                    className={`font-semibold text-base ${
                      savedFlash ? 'text-slate-600 dark:text-slate-300' : 'text-white'
                    }`}>
                    {savedFlash ? 'Saved' : 'Save dimensions'}
                  </Text>
                )}
              </Pressable>
            </View>

            {feedback ? (
              <View
                className={`mt-3 rounded-xl border p-3 ${
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

            <Text className="label mb-2 mt-6">Aisles and shelves</Text>
            <AisleManager
              aisles={data.aisles}
              bins={data.bins}
              zoneId={zoneId}
              startCode={START_CODE}
              floor={{ width: data.warehouse.width, height: data.warehouse.height }}
              onChanged={load}
              onError={(message) => setFeedback({ tone: 'error', message })}
            />
          </View>

          <View className={wide ? 'w-[42%]' : 'mt-6'}>
            <Text className="label mb-2">Current layout</Text>
            <WarehouseMap
              aisles={data.aisles}
              bins={data.bins}
              floor={{ width: data.warehouse.width, height: data.warehouse.height }}
              compact={!wide}
            />

            <View className="mt-3 flex-row gap-3">
              <Stat icon="view-grid-outline" label="Aisles" value={String(data.aisles.length)} />
              <Stat icon="cube-outline" label="Bins" value={String(shelfBins.length)} />
              <Stat
                icon="ruler-square"
                label="Floor"
                value={`${data.warehouse.width}×${data.warehouse.height}`}
              />
            </View>
          </View>
        </View>
      ) : null}
    </ScreenShell>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
  value: string;
}) {
  return (
    <View className="card flex-1 items-center p-3">
      <MaterialCommunityIcons name={icon} size={18} color="#0d9488" />
      <Text className="font-display mt-1 text-lg text-slate-900 dark:text-white">{value}</Text>
      <Text className="muted text-[10px]">{label}</Text>
    </View>
  );
}
