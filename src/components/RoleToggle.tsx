import { useState } from "react";
import { LayoutChangeEvent, Pressable, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useRoleStore } from "@/stores/roleStore";
import { colors, spring } from "@/theme/tokens";
import type { Role } from "@/types";

const OPTIONS: { role: Role; label: string; icon: React.ComponentProps<typeof Feather>["name"] }[] = [
  { role: "TESTER", label: "Tester", icon: "compass" },
  { role: "FOUNDER", label: "Founder", icon: "briefcase" },
];

const PAD = 4;

/** Animated segmented control to switch the active role. */
export function RoleToggle() {
  const role = useRoleStore((s) => s.role);
  const setRole = useRoleStore((s) => s.setRole);
  const [w, setW] = useState(0);

  const seg = w > 0 ? (w - PAD * 2) / 2 : 0;
  const x = useSharedValue(0);

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width;
    setW(width);
    const s = (width - PAD * 2) / 2;
    x.value = (role === "FOUNDER" ? 1 : 0) * s;
  };

  const thumb = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  const select = (r: Role, index: number) => {
    x.value = withSpring(index * seg, spring);
    setRole(r); // fires the role-transition overlay
  };

  return (
    <View
      onLayout={onLayout}
      className="flex-row rounded-2xl"
      style={{ backgroundColor: colors.sand, padding: PAD, borderWidth: 1, borderColor: colors.line }}
    >
      {seg > 0 && (
        <Animated.View
          style={[
            {
              position: "absolute",
              top: PAD,
              left: PAD,
              width: seg,
              bottom: PAD,
              borderRadius: 12,
              backgroundColor: colors.card,
              shadowColor: "#1C1917",
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
              elevation: 2,
            },
            thumb,
          ]}
        />
      )}
      {OPTIONS.map((opt, i) => {
        const active = role === opt.role;
        return (
          <Pressable
            key={opt.role}
            onPress={() => select(opt.role, i)}
            className="flex-1 flex-row items-center justify-center gap-2 py-2.5"
          >
            <Feather name={opt.icon} size={15} color={active ? colors.ink : colors.slate} />
            <Text
              className="font-body-semibold text-[14px]"
              style={{ color: active ? colors.ink : colors.slate, letterSpacing: -0.2 }}
            >
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
