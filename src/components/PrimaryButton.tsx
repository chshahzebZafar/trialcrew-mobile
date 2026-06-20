import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { colors, gradients, spring } from "@/theme/tokens";
import { Icon, type IconName } from "./Icon";

type Variant = "primary" | "accent" | "outline" | "ghost";

/**
 * CTA with a tactile spring press + haptic. `accent` uses a subtle indigo
 * gradient + soft shadow (modern, not loud); `primary` is solid ink. API stable.
 */
export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  icon,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: Variant;
  icon?: IconName;
}) {
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const fg =
    variant === "primary" || variant === "accent" ? colors.white : colors.ink;
  const filled = variant === "primary" || variant === "accent";

  const inner = (
    <View className="h-[50px] flex-row items-center justify-center gap-2 px-5">
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Icon name={icon} size={17} color={fg} />}
          <Text
            className="font-body-semibold text-[15px]"
            style={{ color: fg, letterSpacing: -0.2 }}
          >
            {label}
          </Text>
        </>
      )}
    </View>
  );

  return (
    <Animated.View
      style={[
        animStyle,
        { opacity: isDisabled ? 0.4 : 1 },
        variant === "accent" && {
          shadowColor: colors.indigo,
          shadowOpacity: 0.3,
          shadowRadius: 14,
          shadowOffset: { width: 0, height: 6 },
          elevation: 5,
        },
      ]}
    >
      <Pressable
        onPress={onPress}
        disabled={isDisabled}
        onPressIn={() => {
          scale.value = withSpring(0.97, spring);
          if (!isDisabled) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        }}
        onPressOut={() => (scale.value = withSpring(1, spring))}
        className="overflow-hidden rounded-2xl"
      >
        {variant === "accent" ? (
          <LinearGradient colors={gradients.indigo} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            {inner}
          </LinearGradient>
        ) : (
          <View
            style={{
              backgroundColor:
                variant === "primary"
                  ? colors.ink
                  : variant === "ghost"
                    ? colors.sand
                    : "transparent",
              borderWidth: variant === "outline" ? 1 : 0,
              borderColor: colors.lineStrong,
            }}
          >
            {inner}
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}
