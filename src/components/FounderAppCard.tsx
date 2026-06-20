import { Text, View } from "react-native";
import { colors } from "@/theme/tokens";
import type { FounderApp, FounderAppStatus } from "@/types";
import { AppLogo } from "./AppLogo";
import { Divider } from "./ui";
import { Icon } from "./Icon";
import { PressableScale } from "./PressableScale";

export const founderStatusMeta: Record<
  FounderAppStatus,
  { label: string; bg: string; fg: string }
> = {
  DRAFT: { label: "Draft", bg: colors.sand, fg: colors.slate },
  ENROLLING: { label: "Enrolling", bg: colors.indigoSoft, fg: colors.indigoInk },
  INVITED: { label: "Testing", bg: colors.positiveSoft, fg: colors.positive },
  COMPLETE: { label: "Complete", bg: colors.goldSoft, fg: colors.gold },
};

export function FounderAppCard({ app, onPress }: { app: FounderApp; onPress: () => void }) {
  const meta = founderStatusMeta[app.status];
  const pct = Math.min(100, Math.round((app.enrolledCount / app.minTesters) * 100));

  return (
    <PressableScale
      onPress={onPress}
      className="gap-4 rounded-[18px] bg-card p-5"
      style={{
        borderWidth: 1,
        borderColor: colors.line,
        shadowColor: "#1C1917",
        shadowOpacity: 0.05,
        shadowRadius: 16,
        shadowOffset: { width: 0, height: 6 },
        elevation: 2,
      }}
    >
      <View className="flex-row items-center gap-3">
        <AppLogo name={app.name} size={46} />
        <View className="flex-1">
          <Text className="font-display text-[16px]" style={{ color: colors.ink, letterSpacing: -0.3 }}>
            {app.name}
          </Text>
          <Text className="font-body text-[12.5px]" style={{ color: colors.slate }}>
            {app.packageName}
          </Text>
        </View>
        <View className="self-start rounded-md px-2 py-1" style={{ backgroundColor: meta.bg }}>
          <Text className="font-body-medium text-[11.5px]" style={{ color: meta.fg, letterSpacing: -0.1 }}>
            {meta.label}
          </Text>
        </View>
      </View>

      {app.status !== "DRAFT" ? (
        <View className="gap-2">
          <View className="flex-row items-center justify-between">
            <Text className="font-body text-[12.5px]" style={{ color: colors.slate }}>
              {app.enrolledCount}/{app.minTesters} testers enrolled
            </Text>
            <Text className="font-body-medium text-[12.5px]" style={{ color: colors.slate }}>
              {pct}%
            </Text>
          </View>
          <View className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: colors.sand }}>
            <View
              className="h-full rounded-full"
              style={{ width: `${pct}%`, backgroundColor: app.status === "INVITED" ? colors.positive : colors.indigo }}
            />
          </View>
        </View>
      ) : (
        <Text className="font-body text-[13px]" style={{ color: colors.slate }}>
          Draft · publish to start finding testers
        </Text>
      )}

      <Divider />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Icon name="message-square" size={13} color={colors.slateLight} />
          <Text className="font-body text-[12.5px]" style={{ color: colors.slate }}>
            {app.feedbackCount > 0 ? `${app.feedbackCount} feedback` : "No feedback yet"}
          </Text>
        </View>
        <Icon name="chevron-right" size={16} color={colors.slateLight} />
      </View>
    </PressableScale>
  );
}
