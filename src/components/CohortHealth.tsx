import { type DimensionValue, Text, View } from "react-native";
import { colors } from "@/theme/tokens";
import type { Enrollment } from "@/types";
import { computeAnalytics } from "@/lib/founderAnalytics";
import { Card } from "./ui";
import { Icon, type IconName } from "./Icon";

function Metric({ label, value, icon, tone }: { label: string; value: string; icon: IconName; tone: string }) {
  return (
    <View className="flex-1 gap-1.5 rounded-2xl p-3.5" style={{ backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.line }}>
      <Icon name={icon} size={15} color={tone} />
      <Text className="font-display text-[22px]" style={{ color: colors.ink, letterSpacing: -0.5 }}>
        {value}
      </Text>
      <Text className="font-body text-[11.5px]" style={{ color: colors.slate }}>
        {label}
      </Text>
    </View>
  );
}

function LegendDot({ color, label, n }: { color: string; label: string; n: number }) {
  return (
    <View className="flex-row items-center gap-1.5">
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text className="font-body text-[12px]" style={{ color: colors.slate }}>
        {label} · {n}
      </Text>
    </View>
  );
}

/** Founder analytics for a running cohort. */
export function CohortHealth({ enrollments, startDate }: { enrollments: Enrollment[]; startDate?: string }) {
  const a = computeAnalytics(enrollments, startDate);

  // Engagement breakdown over the full cohort (3-colour stacked bar).
  const green = a.onTrack; // on-track + completed
  const amber = a.atRisk;
  const red = a.behind + a.droppedCount;
  const sum = Math.max(1, green + amber + red);
  const seg = (n: number): DimensionValue => `${(n / sum) * 100}%` as DimensionValue;

  return (
    <View className="gap-3">
      <View className="flex-row items-center justify-between">
        <Text className="font-body text-[12px]" style={{ color: colors.slate }}>
          Cohort health
        </Text>
        <Text className="font-mono text-[11px]" style={{ color: colors.slate }}>
          Day {a.day}/14 · {a.daysRemaining}d left
        </Text>
      </View>

      <View className="flex-row gap-3">
        <Metric label="Completion forecast" value={`${a.completionForecast}%`} icon="trending-up" tone={colors.positive} />
        <Metric label="Daily active" value={`${a.dailyActiveRate}%`} icon="activity" tone={colors.indigo} />
      </View>
      <View className="flex-row gap-3">
        <Metric label="Avg days confirmed" value={a.avgDays.toFixed(1)} icon="check-circle" tone={colors.ink} />
        <Metric label="Drop rate" value={`${a.dropRate}%`} icon="trending-down" tone={colors.danger} />
      </View>

      <Card className="gap-3 p-4">
        <View className="h-2.5 w-full flex-row overflow-hidden rounded-full" style={{ backgroundColor: colors.sand }}>
          {green > 0 && <View style={{ width: seg(green), backgroundColor: colors.positive }} />}
          {amber > 0 && <View style={{ width: seg(amber), backgroundColor: colors.gold }} />}
          {red > 0 && <View style={{ width: seg(red), backgroundColor: colors.danger }} />}
        </View>
        <View className="flex-row flex-wrap gap-x-4 gap-y-1.5">
          <LegendDot color={colors.positive} label="On track" n={green} />
          <LegendDot color={colors.gold} label="At risk" n={amber} />
          <LegendDot color={colors.danger} label="Behind" n={red} />
        </View>
      </Card>
    </View>
  );
}
