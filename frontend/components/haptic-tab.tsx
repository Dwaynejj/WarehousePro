import AsyncStorage from '@react-native-async-storage/async-storage';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

const HAPTICS_KEY = 'warehousepro.prefs.haptics';

export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev) => {
        if (process.env.EXPO_OS === 'ios') {
          void AsyncStorage.getItem(HAPTICS_KEY).then((value) => {
            if (value === '0') return;
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          });
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
