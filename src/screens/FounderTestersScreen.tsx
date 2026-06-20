import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFounderTesters, useRateTester } from "@/api/hooks";
import { colors } from "@/theme/tokens";
import { FounderTesterCard } from "@/components/FounderTesterCard";
import { EmptyState } from "@/components/Screen";
import { Entrance } from "@/components/Motion";
import type { CycleStatus, FounderTesterRow } from "@/types";

/** Founder view — testers running cycles across the founder's apps. */
export function FounderTestersScreen() {
  const { data: testers, isLoading } = useFounderTesters();
  const rate = useRateTester();

  const order: Record<CycleStatus, number> = {
    ACTIVE: 0,
    INVITED: 1,
    INSTALLED: 1,
    MATCHED: 2,
    COMPLETED: 3,
    DROPPED: 4,
  };
  const sorted = [...(testers ?? [])].sort(
    (a: FounderTesterRow, b: FounderTesterRow) => order[a.status] - order[b.status],
  );
  const active = sorted.filter((t) => t.status === "ACTIVE").length;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={sorted}
        keyExtractor={(t) => t.id}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="gap-2 pb-2 pt-2">
            <Text className="font-body text-[15px]" style={{ color: colors.slate }}>
              {active} testing now
            </Text>
            <Text className="font-display text-[30px]" style={{ color: colors.ink, letterSpacing: -0.8 }}>
              Your testers
            </Text>
            <Text className="font-body text-[14px]" style={{ color: colors.slate }}>
              Vetted professionals running real 14-day cycles on your apps.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Entrance index={index}>
            <FounderTesterCard
              row={item}
              rating={rate.isPending && rate.variables === item.id}
              onRate={() => rate.mutate(item.id)}
            />
          </Entrance>
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState message="No testers yet. Submit an app and launch a campaign to get matched with testers." />
          )
        }
      />
    </SafeAreaView>
  );
}
