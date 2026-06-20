import { useEffect, useState } from "react";
import { Text, useWindowDimensions, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useRoleStore } from "@/stores/roleStore";
import { colors } from "@/theme/tokens";
import type { Role } from "@/types";

const meta: Record<Role, { color: string; icon: React.ComponentProps<typeof Feather>["name"]; title: string; sub: string }> = {
  FOUNDER: { color: colors.indigo, icon: "briefcase", title: "Founder mode", sub: "Submit & manage your apps" },
  TESTER: { color: colors.positive, icon: "compass", title: "Tester mode", sub: "Discover & test apps" },
};

/**
 * Creative role-switch overlay: a colored circle reveals from center, the new
 * role's identity springs in, holds, then the whole overlay fades to reveal the
 * (already swapped) content. Fires only on explicit toggles (switchSeq > 0).
 */
export function RoleTransition() {
  const { width, height } = useWindowDimensions();
  const switchSeq = useRoleStore((s) => s.switchSeq);
  const role = useRoleStore((s) => s.role);

  const [visible, setVisible] = useState(false);
  const [shown, setShown] = useState<Role>(role);

  const reveal = useSharedValue(0); // circle cover 0→1
  const label = useSharedValue(0); // identity opacity/translate
  const fade = useSharedValue(0); // exit fade (1 = gone)

  const diameter = Math.max(width, height) * 2.4;

  useEffect(() => {
    if (switchSeq === 0) return;
    setShown(role);
    setVisible(true);
    reveal.value = 0;
    label.value = 0;
    fade.value = 0;
    reveal.value = withTiming(1, { duration: 460, easing: Easing.out(Easing.cubic) });
    label.value = withDelay(190, withTiming(1, { duration: 320, easing: Easing.out(Easing.quad) }));
    const id = setTimeout(() => {
      fade.value = withTiming(1, { duration: 400 }, (done) => {
        if (done) runOnJS(setVisible)(false);
      });
    }, 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [switchSeq]);

  const circleStyle = useAnimatedStyle(() => ({
    opacity: 1 - fade.value,
    transform: [{ scale: reveal.value }],
  }));
  const labelStyle = useAnimatedStyle(() => ({
    opacity: label.value * (1 - fade.value),
    transform: [{ translateY: (1 - label.value) * 18 }, { scale: 0.96 + label.value * 0.04 }],
  }));

  if (!visible) return null;
  const m = meta[shown];

  return (
    <View
      pointerEvents="auto"
      style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" }}
    >
      <Animated.View
        style={[
          {
            position: "absolute",
            width: diameter,
            height: diameter,
            borderRadius: diameter / 2,
            backgroundColor: m.color,
          },
          circleStyle,
        ]}
      />
      <Animated.View style={[{ alignItems: "center", gap: 16 }, labelStyle]}>
        <View
          style={{
            width: 84,
            height: 84,
            borderRadius: 26,
            backgroundColor: "rgba(255,255,255,0.16)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Feather name={m.icon} size={38} color={colors.white} />
        </View>
        <View style={{ alignItems: "center", gap: 4 }}>
          <Text className="font-display text-[26px]" style={{ color: colors.white, letterSpacing: -0.5 }}>
            {m.title}
          </Text>
          <Text className="font-body text-[14px]" style={{ color: "rgba(255,255,255,0.85)" }}>
            {m.sub}
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}
