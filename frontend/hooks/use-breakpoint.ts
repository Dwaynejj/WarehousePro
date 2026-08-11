import { useWindowDimensions } from 'react-native';

/** Shared layout breakpoints for phone / tablet / desktop web. */
export function useBreakpoint() {
  const { width, height } = useWindowDimensions();
  const isPhone = width < 680;
  const isTablet = width >= 680 && width < 1024;
  const isDesktop = width >= 1024;

  return {
    width,
    height,
    isPhone,
    isTablet,
    isDesktop,
    /** Two-column content layouts (dashboard, route, orders). */
    useSplit: width >= 900,
  };
}
