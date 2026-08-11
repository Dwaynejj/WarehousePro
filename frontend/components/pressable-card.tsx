import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  className?: string;
  children: React.ReactNode;
};

/**
 * Card pressable with a tiny scale spring — enough polish, not a toy.
 */
export function PressableCard({
  children,
  className,
  onPressIn,
  onPressOut,
  style,
  ...rest
}: Props) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      {...rest}
      className={className}
      style={[style, animatedStyle]}
      onPressIn={(e) => {
        scale.value = withSpring(0.985, { damping: 18, stiffness: 320 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 16, stiffness: 280 });
        onPressOut?.(e);
      }}>
      {children}
    </AnimatedPressable>
  );
}
