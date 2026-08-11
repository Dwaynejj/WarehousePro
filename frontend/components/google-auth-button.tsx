import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

type Props = {
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  /** Visual variant for picker (light) vs admin (dark) screens. */
  tone?: 'light' | 'dark';
  label?: string;
};

/**
 * Shared Google CTA used on picker + admin auth screens.
 */
export function GoogleAuthButton({
  onPress,
  disabled,
  loading,
  tone = 'light',
  label = 'Continue with Google',
}: Props) {
  const dark = tone === 'dark';

  return (
    <View>
      <View className="my-5 flex-row items-center">
        <View className={`h-px flex-1 ${dark ? 'bg-teal-800' : 'bg-slate-200'}`} />
        <Text
          className={`mx-3 text-xs uppercase tracking-wide ${
            dark ? 'text-teal-300/70' : 'text-slate-400'
          }`}>
          or
        </Text>
        <View className={`h-px flex-1 ${dark ? 'bg-teal-800' : 'bg-slate-200'}`} />
      </View>

      <Pressable
        onPress={onPress}
        disabled={disabled || loading}
        accessibilityRole="button"
        accessibilityLabel={label}
        className={`h-14 flex-row items-center justify-center rounded-full border ${
          dark
            ? 'border-teal-600 bg-teal-900 active:bg-teal-800'
            : 'border-slate-300 bg-white active:bg-slate-100 dark:border-slate-600 dark:bg-slate-900 dark:active:bg-slate-800'
        } ${disabled || loading ? 'opacity-60' : ''}`}>
        {loading ? (
          <ActivityIndicator color={dark ? '#5eead4' : '#0f172a'} />
        ) : (
          <>
            <MaterialCommunityIcons
              name="google"
              size={20}
              color={dark ? '#ccfbf1' : '#0f172a'}
            />
            <Text
              className={`ml-2 font-semibold text-base ${
                dark ? 'text-teal-50' : 'text-slate-900 dark:text-white'
              }`}>
              {label}
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
