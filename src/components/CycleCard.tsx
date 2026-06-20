import { Text, View } from "react-native";
import { colors } from "@/theme/tokens";
import type { Cycle } from "@/types";
import { AppLogo } from "./AppLogo";
import { CycleStatusPill } from "./StatusPill";
import { Countdown } from "./Countdown";
import { Icon } from "./Icon";
import { Divider } from "./ui";
import { PressableScale } from "./PressableScale";

/** A cycle on the My Cycles tab. Interactive (spring + haptic) → cycle detail. */
export function CycleCard({
  cycle,
  onPress,
}: {
  cycle: Cycle;
  onPress: () => void;
}) {
  const isActive = cycle.status === "ACTIVE";
  const respondedCount = cycle.checkIns.filter(
    (c) => c.status === "RESPONDED",
  ).length;

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
        <AppLogo name={cycle.campaign.appName} size={44} />
        <View className="flex-1">
          <Text
            className="font-display text-[16px]"
            style={{ color: colors.ink, letterSpacing: -0.3 }}
          >
            {cycle.campaign.appName}
          </Text>
          <Text className="font-body text-[13px]" style={{ color: colors.slate }}>
            {cycle.campaign.feedbackFocus}
          </Text>
        </View>
        <CycleStatusPill status={cycle.status} />
      </View>

      {isActive ? (
        <Countdown optInAt={cycle.optInAt} completesAt={cycle.completesAt} />
      ) : (
        <Text className="font-body text-[13px]" style={{ color: colors.slate }}>
          {cycle.status === "MATCHED"
            ? "Opt in to start your 14-day cycle"
            : cycle.status === "COMPLETED"
              ? "Cycle complete — feedback submitted"
              : "Cycle dropped"}
        </Text>
      )}

      <Divider />

      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5">
          <Icon name="check-circle" size={13} color={colors.slateLight} />
          <Text className="font-body text-[12.5px]" style={{ color: colors.slate }}>
            {cycle.checkIns.length > 0
              ? `${respondedCount} of ${cycle.checkIns.length} check-ins`
              : "No check-ins yet"}
          </Text>
        </View>
        <Icon name="chevron-right" size={16} color={colors.slateLight} />
      </View>
    </PressableScale>
  );
}
