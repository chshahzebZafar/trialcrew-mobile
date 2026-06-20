import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { colors } from "@/theme/tokens";
import { cycleProgress, formatCountdown, remainingUntil } from "@/lib/time";

/**
 * Live per-cycle countdown. Ticks every minute (cheap, reduced-motion friendly).
 * Shows remaining time + a thin progress line across the cycle's 14-day window.
 */
export function Countdown({
  optInAt,
  completesAt,
  compact = false,
}: {
  optInAt?: string;
  completesAt?: string;
  compact?: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const r = remainingUntil(completesAt, now);
  const progress = cycleProgress(optInAt, completesAt, now);
  const label = formatCountdown(r);

  if (compact) {
    return (
      <Text className="font-body-medium text-[13px]" style={{ color: colors.ink }}>
        {label} left
      </Text>
    );
  }

  return (
    <View className="gap-2">
      <View className="flex-row items-baseline justify-between">
        <Text
          className="font-display text-[22px]"
          style={{ color: colors.ink, letterSpacing: -0.5 }}
        >
          {label}
        </Text>
        <Text className="font-body text-[12px]" style={{ color: colors.slate }}>
          {r.done ? "cycle complete" : "remaining"}
        </Text>
      </View>
      <View
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: colors.sand }}
      >
        <View
          className="h-full rounded-full"
          style={{
            width: `${Math.round(progress * 100)}%`,
            backgroundColor: r.done ? colors.positive : colors.ink,
          }}
        />
      </View>
    </View>
  );
}
