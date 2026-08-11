import { Children, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { useBreakpoint } from '@/hooks/use-breakpoint';

type Props = {
  children: ReactNode;
  /** Force a single column (e.g. very narrow nested panels). */
  singleColumn?: boolean;
};

const GAP = 18;

/**
 * Order cards in a breathing grid — 2 columns normally, 3 on very wide desktops.
 */
export function OrderGrid({ children, singleColumn = false }: Props) {
  const { width, isDesktop } = useBreakpoint();
  const cols = singleColumn ? 1 : width >= 1180 ? 3 : width >= 640 ? 2 : 1;
  const items = Children.toArray(children);

  // Leave room for gaps between columns so cards never touch.
  const cellWidth =
    cols === 1
      ? '100%'
      : cols === 2
        ? '48.2%'
        : '31.8%';

  return (
    <View style={[styles.row, isDesktop ? styles.rowDesktop : null]}>
      {items.map((child, index) => (
        <View
          key={index}
          style={{
            width: cellWidth,
            flexGrow: cols === 1 ? 0 : 1,
            maxWidth: cols === 1 ? '100%' : cols === 2 ? '49%' : '33%',
          }}>
          {child}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
  },
  rowDesktop: {
    gap: 20,
  },
});
