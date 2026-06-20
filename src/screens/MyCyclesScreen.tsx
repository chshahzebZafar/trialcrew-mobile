import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useCycles } from "@/api/hooks";
import { colors } from "@/theme/tokens";
import { CycleCard } from "@/components/CycleCard";
import { EmptyState } from "@/components/Screen";
import { Entrance } from "@/components/Motion";
import type { Cycle, CycleStatus } from "@/types";

/** My Cycles — the tester's cycles, each with its own per-tester 14-day countdown. */
export function MyCyclesScreen() {
  const router = useRouter();
  const { data: cycles, isLoading } = useCycles();

  const order: Record<CycleStatus, number> = {
    ACTIVE: 0,
    MATCHED: 1,
    INVITED: 1,
    INSTALLED: 1,
    COMPLETED: 2,
    DROPPED: 3,
  };
  const sorted = [...(cycles ?? [])].sort(
    (a: Cycle, b: Cycle) => order[a.status] - order[b.status],
  );
  const activeCount = sorted.filter((c) => c.status === "ACTIVE").length;

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={sorted}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="gap-2 pb-4 pt-2">
            <Text className="font-body text-[15px]" style={{ color: colors.slate }}>
              {activeCount} active
            </Text>
            <Text
              className="font-display text-[30px]"
              style={{ color: colors.ink, letterSpacing: -0.8 }}
            >
              My cycles
            </Text>
            <Text className="font-body text-[14px]" style={{ color: colors.slate }}>
              Each cycle runs on its own 14-day clock.
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <Entrance index={index}>
            <CycleCard cycle={item} onPress={() => router.push(`/cycle/${item.id}`)} />
          </Entrance>
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState message="No cycles yet. Opt into an app from Discover to start your first 14-day cycle." />
          )
        }
      />
    </SafeAreaView>
  );
}
