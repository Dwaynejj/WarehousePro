import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text, View } from 'react-native';

type Props = {
  title: string;
  subtitle?: string;
  /** Small accent bar under the title (brand color). */
  accent?: 'orange' | 'teal' | 'none';
  right?: React.ReactNode;
};

/**
 * Shared screen heading with a light entrance motion.
 */
export function PageHeader({ title, subtitle, accent = 'orange', right }: Props) {
  const bar =
    accent === 'orange' ? 'bg-orange-500' : accent === 'teal' ? 'bg-teal-500' : null;

  return (
    <Animated.View entering={FadeInDown.duration(380).springify().damping(18)}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text className="page-title">{title}</Text>
          {subtitle ? <Text className="page-subtitle">{subtitle}</Text> : null}
          {bar ? <View className={`mt-3 h-1 w-12 rounded-full ${bar}`} /> : null}
        </View>
        {right}
      </View>
    </Animated.View>
  );
}
