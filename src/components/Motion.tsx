import Animated, {
  FadeIn,
  FadeInDown,
  type AnimatedProps,
} from "react-native-reanimated";
import type { ViewProps } from "react-native";

export const AView = Animated.View;

/** Subtle staggered fade-up — quick and quiet (premium-minimal). */
export function stagger(index = 0, distance = 8) {
  return FadeInDown.duration(300)
    .delay(index * 45)
    .withInitialValues({
      opacity: 0,
      transform: [{ translateY: distance }],
    });
}

export function fadeIn(delay = 0) {
  return FadeIn.duration(280).delay(delay);
}

/** Convenience wrapper for an entrance-animated view. */
export function Entrance({
  index = 0,
  ...props
}: { index?: number } & AnimatedProps<ViewProps>) {
  return <Animated.View entering={stagger(index)} {...props} />;
}
