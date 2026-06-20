import { Text, View } from "react-native";
import { colors } from "@/theme/tokens";
import type { FounderTesterRow } from "@/types";
import { CycleStatusPill } from "./StatusPill";
import { BadgePill } from "./Badge";
import { PrimaryButton } from "./PrimaryButton";

function initials(name: string) {
  const w = name.trim().split(/\s+/);
  return ((w[0]?.[0] ?? "") + (w[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function FounderTesterCard({
  row,
  onRate,
  rating = false,
}: {
  row: FounderTesterRow;
  onRate: () => void;
  rating?: boolean;
}) {
  const pct = Math.round((row.dayProgress / 14) * 100);
  const canRate = row.status === "COMPLETED" && !row.rated;

  return (
    <View
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
        <View
          className="h-11 w-11 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.sand, borderWidth: 1, borderColor: colors.line }}
        >
          <Text className="font-display text-[15px]" style={{ color: colors.ink }}>
            {initials(row.testerName)}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="font-display text-[15px]" style={{ color: colors.ink, letterSpacing: -0.3 }}>
            {row.testerName}
          </Text>
          <Text className="font-body text-[12.5px]" style={{ color: colors.slate }}>
            {row.appName} · {row.vertical}
          </Text>
        </View>
        <CycleStatusPill status={row.status} />
      </View>

      {/* Cycle progress */}
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="font-body text-[12.5px]" style={{ color: colors.slate }}>
            Day {row.dayProgress} of 14
          </Text>
          <View className="flex-row items-center gap-2">
            <Text className="font-body-medium text-[12.5px]" style={{ color: colors.slate }}>
              {Math.round(row.reliabilityScore * 100)}% reliable
            </Text>
            <BadgePill tier={row.badgeTier} />
          </View>
        </View>
        <View className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: colors.sand }}>
          <View
            className="h-full rounded-full"
            style={{ width: `${pct}%`, backgroundColor: row.status === "COMPLETED" ? colors.positive : colors.indigo }}
          />
        </View>
      </View>

      {canRate ? (
        <PrimaryButton label="Rate tester" variant="accent" icon="star" onPress={onRate} loading={rating} />
      ) : row.rated ? (
        <View className="flex-row items-center gap-1.5">
          <View className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: colors.positive }} />
          <Text className="font-body text-[12.5px]" style={{ color: colors.slate }}>
            Rated · feedback recorded
          </Text>
        </View>
      ) : null}
    </View>
  );
}
