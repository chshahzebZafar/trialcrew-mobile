import { type ReactNode } from "react";
import { Pressable, type StyleProp, type ViewStyle } from "react-native";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { spring } from "@/theme/tokens";

/**
 * Tappable surface with a tactile spring press-scale + light haptic — the
 * "interactive card" feel from the ui-ux-pro-max guidance. Runs on the UI thread
 * (Reanimated worklets). className/style apply to the animated surface.
 */
export function PressableScale({
  onPress,
  children,
  scaleTo = 0.97,
  haptic = true,
  disabled = false,
  className,
  style,
}: {
  onPress?: () => void;
  children: ReactNode;
  scaleTo?: number;
  haptic?: boolean;
  disabled?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      onPressIn={() => {
        scale.value = withSpring(scaleTo, spring);
        if (haptic) Haptics.selectionAsync().catch(() => {});
      }}
      onPressOut={() => {
        scale.value = withSpring(1, spring);
      }}
    >
      <Animated.View className={className} style={[animStyle, style]}>
        {children}
      </Animated.View>
    </Pressable>
  );
}
