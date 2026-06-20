import { Text, View } from "react-native";
import { colors } from "@/theme/tokens";
import type { RewardType } from "@/types";
import { Icon, type IconName } from "./Icon";

export const rewardMeta: Record<
  RewardType,
  { label: string; short: string; icon: IconName }
> = {
  PREMIUM_ACCESS: { label: "Premium access", short: "Premium", icon: "star" },
  CREDITS: { label: "Platform credits", short: "Credits", icon: "zap" },
  STIPEND: { label: "Paid stipend", short: "Stipend", icon: "dollar-sign" },
};

/** Compact reward chip (founder cards / headers). */
export function RewardChip({ reward }: { reward: RewardType }) {
  const m = rewardMeta[reward];
  return (
    <View
      className="flex-row items-center gap-1.5 self-start rounded-md px-2 py-1"
      style={{ backgroundColor: colors.goldSoft }}
    >
      <Icon name={m.icon} size={11} color={colors.gold} />
      <Text className="font-body-medium text-[11.5px]" style={{ color: colors.gold, letterSpacing: -0.1 }}>
        {m.short}
      </Text>
    </View>
  );
}
