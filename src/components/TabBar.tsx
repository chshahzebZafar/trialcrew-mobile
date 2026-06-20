import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import Feather from "@expo/vector-icons/Feather";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { colors, springSoft } from "@/theme/tokens";
import { useIsFounder } from "@/stores/roleStore";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

/** Per-role label + icon for each tab route. */
function tabMeta(routeName: string, isFounder: boolean): { label: string; icon: FeatherName } {
  if (routeName === "profile") return { label: "Profile", icon: "user" };
  if (isFounder) {
    return routeName === "index"
      ? { label: "My Apps", icon: "smartphone" }
      : { label: "Testers", icon: "users" };
  }
  return routeName === "index"
    ? { label: "Discover", icon: "grid" }
    : { label: "Cycles", icon: "clock" };
}

function TabButton({
  label,
  icon,
  focused,
  onPress,
}: {
  label: string;
  icon: FeatherName;
  focused: boolean;
  onPress: () => void;
}) {
  const p = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    p.value = withSpring(focused ? 1 : 0, springSoft);
  }, [focused, p]);

  const pill = useAnimatedStyle(() => ({
    opacity: p.value,
    transform: [{ scale: 0.86 + p.value * 0.14 }],
  }));

  return (
    <Pressable onPress={onPress} className="flex-1 items-center justify-center gap-1">
      <View className="items-center justify-center" style={{ height: 34, width: 64 }}>
        <Animated.View
          style={[
            {
              position: "absolute",
              height: 34,
              width: 64,
              borderRadius: 17,
              backgroundColor: colors.indigoSoft,
            },
            pill,
          ]}
        />
        <Feather name={icon} size={19} color={focused ? colors.indigo : colors.slateLight} />
      </View>
      <Text
        className="font-body-medium text-[11px]"
        style={{ color: focused ? colors.indigoInk : colors.slateLight, letterSpacing: -0.1 }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/** Custom modern bottom bar: animated active pill + haptic feedback. */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const isFounder = useIsFounder();

  return (
    <View
      style={{
        flexDirection: "row",
        paddingTop: 10,
        paddingBottom: Math.max(insets.bottom, 10),
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.line,
      }}
    >
      {state.routes.map((route, index) => {
        const { label, icon } = tabMeta(route.name, isFounder);
        const focused = state.index === index;

        const onPress = () => {
          Haptics.selectionAsync().catch(() => {});
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TabButton
            key={route.key}
            label={label}
            icon={icon}
            focused={focused}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}
