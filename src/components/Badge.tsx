import { Text, View } from "react-native";
import { colors } from "@/theme/tokens";
import { BADGE_THRESHOLDS, type BadgeTier } from "@/types";

const tierMeta: Record<BadgeTier, { label: string; bg: string; fg: string }> = {
  NONE: { label: "Unranked", bg: colors.sand, fg: colors.slate },
  VERIFIED: { label: "Verified", bg: colors.indigoSoft, fg: colors.indigoInk },
  SENIOR: { label: "Senior", bg: colors.ink, fg: colors.white },
  EXPERT: { label: "Expert", bg: colors.gold, fg: colors.white },
};

export function BadgePill({ tier }: { tier: BadgeTier }) {
  const meta = tierMeta[tier];
  return (
    <View
      className="self-start rounded-md px-2.5 py-1"
      style={{ backgroundColor: meta.bg }}
    >
      <Text
        className="font-body-medium text-[11.5px]"
        style={{ color: meta.fg, letterSpacing: -0.1 }}
      >
        {meta.label}
      </Text>
    </View>
  );
}

/** Progress toward the next badge tier, for the profile screen. */
export function nextTierProgress(completedCycles: number): {
  next: BadgeTier | null;
  remaining: number;
  fraction: number;
} {
  const ladder: { tier: BadgeTier; at: number }[] = [
    { tier: "VERIFIED", at: BADGE_THRESHOLDS.VERIFIED },
    { tier: "SENIOR", at: BADGE_THRESHOLDS.SENIOR },
    { tier: "EXPERT", at: BADGE_THRESHOLDS.EXPERT },
  ];
  const next = ladder.find((l) => completedCycles < l.at);
  if (!next) return { next: null, remaining: 0, fraction: 1 };
  const prevAt =
    ladder[ladder.indexOf(next) - 1]?.at ?? 0;
  const fraction =
    (completedCycles - prevAt) / (next.at - prevAt);
  return {
    next: next.tier,
    remaining: next.at - completedCycles,
    fraction: Math.min(1, Math.max(0, fraction)),
  };
}
