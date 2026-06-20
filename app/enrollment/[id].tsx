import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useEnrollment, useRateEnrollment } from "@/api/hooks";
import { colors } from "@/theme/tokens";
import { BadgePill } from "@/components/Badge";
import { CycleStatusPill } from "@/components/StatusPill";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Card, Divider } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Screen, EmptyState } from "@/components/Screen";

// Representative structured feedback (mock) shown once a tester submits.
const FEEDBACK = [
  { q: "First impression", a: "Clean, fast to start a daily log. Knew where to tap immediately." },
  { q: "Ease of use", a: "4 / 5" },
  { q: "Crashes", a: "None over the cycle" },
  { q: "Biggest gap", a: "Offline mode for poor-signal sites" },
  { q: "Would recommend", a: "Yes — to other site managers" },
];

export default function EnrollmentDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: e, isLoading } = useEnrollment(id ?? "");
  const rate = useRateEnrollment();

  if (isLoading) return <Screen>{null}</Screen>;
  if (!e) return <Screen><EmptyState message="Tester not found." /></Screen>;

  const initials = e.testerName.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const canRate = e.status === "COMPLETED" && !e.rated;

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 44 }}>
      {/* Header */}
      <View className="flex-row items-center gap-3">
        <View
          className="h-14 w-14 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.sand, borderWidth: 1, borderColor: colors.line }}
        >
          <Text className="font-display text-[18px]" style={{ color: colors.ink }}>{initials}</Text>
        </View>
        <View className="flex-1">
          <Text className="font-display text-[19px]" style={{ color: colors.ink, letterSpacing: -0.4 }}>{e.testerName}</Text>
          <Text className="font-body text-[12.5px]" style={{ color: colors.slate }}>{e.gmail}</Text>
        </View>
        <CycleStatusPill status={e.status === "TESTING" ? "ACTIVE" : e.status === "COMPLETED" ? "COMPLETED" : e.status === "DROPPED" ? "DROPPED" : "MATCHED"} />
      </View>

      {/* Reliability + badge */}
      <Card className="flex-row items-center justify-between p-4">
        <View className="flex-row items-center gap-2">
          <Icon name="shield" size={15} color={colors.indigo} />
          <Text className="font-body-semibold text-[14px]" style={{ color: colors.ink }}>
            {Math.round(e.reliabilityScore * 100)}% reliability
          </Text>
        </View>
        <BadgePill tier={e.badgeTier} />
      </Card>

      {/* Daily proof-of-use grid */}
      <Card className="gap-3 p-5">
        <View className="flex-row items-center justify-between">
          <Text className="font-display text-[15px]" style={{ color: colors.ink }}>Daily proof-of-use</Text>
          <Text className="font-body-medium text-[13px]" style={{ color: colors.slate }}>{e.dailyDone}/14 days</Text>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {Array.from({ length: 14 }, (_, i) => {
            const done = i < e.dailyDone;
            return (
              <View
                key={i}
                className="items-center justify-center rounded-lg"
                style={{
                  width: 38,
                  height: 38,
                  backgroundColor: done ? colors.positiveSoft : colors.sand,
                  borderWidth: 1,
                  borderColor: done ? colors.positive : colors.line,
                }}
              >
                {done ? (
                  <Icon name="check" size={15} color={colors.positive} />
                ) : (
                  <Text className="font-body text-[12px]" style={{ color: colors.slateLight }}>{i + 1}</Text>
                )}
              </View>
            );
          })}
        </View>
        <Text className="font-body text-[12px]" style={{ color: colors.slate }}>
          Each tile = one day the tester confirmed real in-app activity.
        </Text>
      </Card>

      {/* Structured feedback */}
      <Card className="gap-3 p-5">
        <Text className="font-display text-[15px]" style={{ color: colors.ink }}>Structured feedback</Text>
        {e.feedbackSubmitted ? (
          <View className="gap-3">
            {FEEDBACK.map((f, i) => (
              <View key={f.q} className="gap-1">
                {i > 0 && <Divider />}
                <Text className={`font-body text-[12px] ${i > 0 ? "pt-2" : ""}`} style={{ color: colors.slate }}>{f.q}</Text>
                <Text className="font-body text-[14px] leading-[20px]" style={{ color: colors.ink }}>{f.a}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text className="font-body text-[13px]" style={{ color: colors.slate }}>
            Feedback is submitted at the end of the 14-day cycle.
          </Text>
        )}
      </Card>

      {canRate && (
        <PrimaryButton label="Rate this tester" variant="accent" icon="star" onPress={() => rate.mutate(e.id)} loading={rate.isPending} />
      )}
      {e.rated && (
        <View className="flex-row items-center justify-center gap-1.5">
          <Icon name="check-circle" size={15} color={colors.positive} />
          <Text className="font-body text-[13px]" style={{ color: colors.slate }}>Rated · reliability recorded</Text>
        </View>
      )}
    </ScrollView>
  );
}
