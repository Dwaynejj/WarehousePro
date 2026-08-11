import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import type { Order } from '@/types';

type Props = {
  order: Order;
  onPress?: () => void;
  /** Visual accent for progress / CTA. */
  tone?: 'picker' | 'admin';
  /** Show “open route” CTA (picker queue). */
  showAction?: boolean;
  /** Optional time label in the header (history). */
  timeLabel?: string | null;
  /** Optional duration meta (history). */
  durationLabel?: string | null;
  /** Highlight the active order (picker). */
  active?: boolean;
  style?: StyleProp<ViewStyle>;
};

function statusStyles(status: string) {
  if (status === 'COMPLETED') {
    return {
      pillBg: '#d1fae5',
      pillText: '#047857',
      bar: 'bg-emerald-500',
      icon: 'check-circle' as const,
      iconColor: '#059669',
    };
  }
  if (status === 'PENDING') {
    return {
      pillBg: '#fef3c7',
      pillText: '#b45309',
      bar: 'bg-orange-400',
      icon: 'clipboard-clock-outline' as const,
      iconColor: '#d97706',
    };
  }
  return {
    pillBg: '#f5f5f4',
    pillText: '#57534e',
    bar: 'bg-stone-400',
    icon: 'clipboard-text-outline' as const,
    iconColor: '#78716c',
  };
}

/**
 * One order = one bordered box. Always light (cream) so it stays readable
 * even when the rest of the app is in dark mode.
 */
export function OrderCard({
  order,
  onPress,
  tone = 'picker',
  showAction = false,
  timeLabel,
  durationLabel,
  active = false,
  style,
}: Props) {
  const styles = statusStyles(order.status);
  const picked = order.items.filter((i) => i.picked).length;
  const total = order.pickListCodes.length || order.items.length;
  const pct = total > 0 ? Math.round((picked / total) * 100) : 0;
  const accent = tone === 'admin' ? '#0d9488' : '#f97316';
  const accentBar = tone === 'admin' ? 'bg-teal-500' : styles.bar;
  const actionColor = tone === 'admin' ? '#0d9488' : '#ea580c';
  const done = order.status === 'COMPLETED';

  const body = (
    <>
      <View className="flex-row items-center justify-between gap-2">
        <View className="min-w-0 flex-1 flex-row items-center gap-2">
          <View
            className="h-8 w-8 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${accent}18` }}>
            <MaterialCommunityIcons name={styles.icon} size={16} color={styles.iconColor} />
          </View>
          <View className="min-w-0 flex-1">
            <Text
              className="font-display-semi text-base"
              style={{ color: '#1c1917' }}
              numberOfLines={1}>
              Order #{order.id}
            </Text>
            {timeLabel ? (
              <Text className="text-[10px]" style={{ color: '#78716c' }} numberOfLines={1}>
                {timeLabel}
              </Text>
            ) : null}
          </View>
        </View>
        <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: styles.pillBg }}>
          <Text className="font-semibold text-[10px]" style={{ color: styles.pillText }}>
            {order.status}
          </Text>
        </View>
      </View>

      <View className="mt-2.5 flex-row flex-wrap gap-1.5">
        <MetaChip icon="map-marker-outline" label={order.startCode} />
        <MetaChip icon="cube-outline" label={`${total} bins`} />
        {durationLabel ? <MetaChip icon="clock-outline" label={durationLabel} /> : null}
      </View>

      {order.pickListCodes.length > 0 ? (
        <Text className="mt-2 text-[11px] leading-4" style={{ color: '#78716c' }} numberOfLines={1}>
          {order.pickListCodes.join(' → ')}
        </Text>
      ) : null}

      {!done ? (
        <View className="mt-2.5">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="text-[10px]" style={{ color: '#78716c' }}>
              {picked}/{total} picked
            </Text>
            <Text className="font-semibold text-[10px]" style={{ color: '#57534e' }}>
              {pct}%
            </Text>
          </View>
          <View className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: '#e7e5e4' }}>
            <View className={`h-full rounded-full ${accentBar}`} style={{ width: `${pct}%` }} />
          </View>
        </View>
      ) : null}

      {showAction ? (
        <View className="mt-2.5 flex-row items-center justify-between">
          <Text className="font-semibold text-xs" style={{ color: actionColor }}>
            Open route
          </Text>
          <MaterialCommunityIcons name="arrow-right" size={16} color={accent} />
        </View>
      ) : null}
    </>
  );

  const boxStyle: StyleProp<ViewStyle> = [
    box.shell,
    {
      borderColor: active ? '#fb923c' : '#e7e5e4',
      borderWidth: active ? 2 : 1,
      backgroundColor: '#f7f6f3',
    },
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [boxStyle, pressed ? box.pressed : null]}>
        {body}
      </Pressable>
    );
  }

  return <View style={boxStyle}>{body}</View>;
}

const box = StyleSheet.create({
  shell: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    minHeight: 108,
  },
  pressed: {
    opacity: 0.92,
  },
});

function MetaChip({
  icon,
  label,
}: {
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  label: string;
}) {
  return (
    <View
      className="flex-row items-center rounded-full px-2 py-0.5"
      style={{
        borderWidth: 1,
        borderColor: '#e7e5e4',
        backgroundColor: '#efece7',
      }}>
      <MaterialCommunityIcons name={icon} size={11} color="#a8a29e" />
      <Text className="ml-1 text-[10px]" style={{ color: '#57534e' }}>
        {label}
      </Text>
    </View>
  );
}
