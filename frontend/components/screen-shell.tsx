import { ScrollView, View, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useBreakpoint } from '@/hooks/use-breakpoint';

type Props = ViewProps & {
  children: React.ReactNode;
  /** Scrollable body (default true). */
  scroll?: boolean;
  /** Extra bottom padding for tab bars / sticky buttons. */
  bottomPad?: number;
  /**
   * Desktop content width.
   * - `default` reading column
   * - `wide` fills the stage (orders, maps)
   * - `narrow` forms/profile
   */
  density?: 'default' | 'wide' | 'narrow';
};

/**
 * Responsive page chrome.
 * Desktop: content fills the area beside the nav — no large empty left gutter.
 */
export function ScreenShell({
  children,
  scroll = true,
  bottomPad = 40,
  density = 'default',
  className,
  ...rest
}: Props) {
  const { isDesktop, isTablet } = useBreakpoint();

  // Narrow stays centered; wide/default fill available width on desktop.
  const maxWidth =
    density === 'narrow'
      ? 560
      : density === 'wide'
        ? undefined
        : isDesktop
          ? 960
          : isTablet
            ? 720
            : undefined;

  const horizontalPad = isDesktop ? 24 : isTablet ? 22 : 20;
  const topPad = isDesktop ? 22 : 20;

  const body = (
    <View
      className={`${scroll ? '' : 'flex-1 '} ${className ?? ''}`}
      style={{
        width: '100%',
        ...(maxWidth ? { maxWidth, alignSelf: 'flex-start' as const } : null),
        paddingHorizontal: horizontalPad,
        paddingTop: topPad,
      }}
      {...rest}>
      {children}
    </View>
  );

  const stage = (
    <View className="min-h-full overflow-hidden rounded-3xl border border-slate-200/90 bg-slate-50 shadow-soft dark:border-slate-800 dark:bg-slate-950">
      {body}
    </View>
  );

  return (
    <View className="screen">
      {isDesktop ? (
        <View
          pointerEvents="none"
          className="absolute inset-0 bg-slate-100/80 dark:bg-slate-950"
        />
      ) : null}
      <SafeAreaView className="flex-1" edges={['top', 'left', 'right']}>
        {scroll ? (
          <ScrollView
            className="flex-1"
            contentContainerStyle={{
              paddingBottom: bottomPad + (isDesktop ? 16 : 0),
              flexGrow: 1,
            }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {isDesktop ? (
              <View className="w-full px-4 pb-2 pt-4">{stage}</View>
            ) : (
              body
            )}
          </ScrollView>
        ) : isDesktop ? (
          <View className="w-full flex-1 px-4 py-4">{stage}</View>
        ) : (
          body
        )}
      </SafeAreaView>
    </View>
  );
}
