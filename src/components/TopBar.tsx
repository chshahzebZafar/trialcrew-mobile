import { Pressable, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useNotifications } from "@/api/hooks";
import { colors } from "@/theme/tokens";
import { Icon } from "./Icon";
import { PulseDot } from "./PulseDot";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function initials(name: string) {
  const w = name.trim().split(/\s+/);
  return ((w[0]?.[0] ?? "") + (w[1]?.[0] ?? "")).toUpperCase() || "?";
}

/** Dashboard top bar: avatar + greeting/name + notification bell with unread dot. */
export function TopBar({ subtitle }: { subtitle?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: notifs } = useNotifications();

  const name = user?.name ?? "there";
  const firstName = name.split(/\s+/)[0];
  const unread = (notifs ?? []).filter((n) => !n.read).length;

  return (
    <View className="flex-row items-center gap-3">
      {/* Avatar */}
      <View
        className="h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: colors.ink }}
      >
        <Text className="font-display text-[16px]" style={{ color: colors.white, letterSpacing: -0.3 }}>
          {initials(name)}
        </Text>
      </View>

      {/* Greeting + creative name */}
      <View className="flex-1">
        <Text className="font-body text-[12.5px]" style={{ color: colors.slate }}>
          {greeting()}
        </Text>
        <View className="flex-row items-center gap-1.5">
          <Text className="font-display text-[19px]" style={{ color: colors.ink, letterSpacing: -0.5 }}>
            {firstName}
          </Text>
          <Text style={{ fontSize: 15 }}>👋</Text>
        </View>
        {subtitle && (
          <Text className="font-mono text-[10.5px]" style={{ color: colors.slateLight, letterSpacing: 0.3 }}>
            {subtitle}
          </Text>
        )}
      </View>

      {/* Notification bell */}
      <Pressable
        onPress={() => router.push("/notifications")}
        className="h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }}
      >
        <Icon name="bell" size={19} color={colors.ink} />
        {unread > 0 && (
          <View style={{ position: "absolute", top: 8, right: 9 }}>
            <PulseDot color={colors.danger} size={7} />
          </View>
        )}
      </Pressable>
    </View>
  );
}
