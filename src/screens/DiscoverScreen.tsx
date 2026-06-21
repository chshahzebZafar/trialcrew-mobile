import { useState } from "react";
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import { useBrowseCampaigns, useCycles, useOptIn, useProfile } from "@/api/hooks";
import { colors, gradients } from "@/theme/tokens";
import { CampaignCard } from "@/components/CampaignCard";
import { EmptyState } from "@/components/Screen";
import { Entrance, AView, fadeIn } from "@/components/Motion";
import { TopBar } from "@/components/TopBar";
import { PulseDot } from "@/components/PulseDot";
import { Card } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";

const DAY = 86400000;

function StatTile({ icon, value, label, tone }: { icon: IconName; value: string; label: string; tone: string }) {
  return (
    <Card className="flex-1 gap-2 p-4">
      <View className="h-8 w-8 items-center justify-center rounded-xl" style={{ backgroundColor: colors.sand }}>
        <Icon name={icon} size={15} color={tone} />
      </View>
      <Text className="font-display text-[22px]" style={{ color: colors.ink, letterSpacing: -0.5 }}>
        {value}
      </Text>
      <Text className="font-body text-[11.5px]" style={{ color: colors.slate }}>
        {label}
      </Text>
    </Card>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-full px-3.5 py-2"
      style={{ backgroundColor: active ? colors.ink : colors.card, borderWidth: 1, borderColor: active ? colors.ink : colors.line }}
    >
      <Text className="font-body-medium text-[12.5px]" style={{ color: active ? colors.white : colors.inkSoft }}>
        {label}
      </Text>
    </Pressable>
  );
}

/** Tester dashboard — modern: topbar, active-cycle spotlight, stat bento, app list. */
export function DiscoverScreen() {
  const router = useRouter();
  const { data: campaigns, isLoading } = useBrowseCampaigns();
  const { data: cycles } = useCycles();
  const { data: profile } = useProfile();
  const optIn = useOptIn();

  const qc = useQueryClient();
  const [filter, setFilter] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([qc.invalidateQueries({ queryKey: ["browse"] }), qc.invalidateQueries({ queryKey: ["cycles"] })]);
    setRefreshing(false);
  };

  const all = campaigns ?? [];
  const interests = new Set([profile?.vertical, ...(profile?.categories ?? [])].filter(Boolean) as string[]);
  const verticals = Array.from(new Set(all.map((c) => c.vertical)));
  const filtered = !filter
    ? all
    : filter === "__foryou"
      ? all.filter((c) => interests.has(c.vertical))
      : all.filter((c) => c.vertical === filter);
  const total = all.length;
  const shown = filtered.length;
  const active = (cycles ?? []).find((c) => c.status === "ACTIVE");
  const activeDay = active?.optInAt
    ? Math.min(14, Math.max(1, Math.floor((Date.now() - new Date(active.optInAt).getTime()) / DAY) + 1))
    : 0;

  const handleOptIn = (campaignId: string) => {
    optIn.mutate(campaignId, { onSuccess: (cycle) => router.push(`/cycle/${cycle.id}`) });
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.indigo} colors={[colors.indigo]} />}
        ListHeaderComponent={
          <View className="gap-5 pb-1">
            <AView entering={fadeIn(0)}>
              <TopBar subtitle={profile?.vertical?.toUpperCase()} />
            </AView>

            {/* Spotlight — active cycle */}
            <AView entering={fadeIn(60)}>
              {active ? (
                <Pressable onPress={() => router.push(`/cycle/${active.id}`)}>
                  <LinearGradient
                    colors={gradients.indigo}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={{ borderRadius: 22, padding: 18, overflow: "hidden" }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-2">
                        <PulseDot color={colors.lime} size={7} />
                        <Text className="font-mono text-[11px] uppercase" style={{ color: "rgba(255,255,255,0.85)", letterSpacing: 1 }}>
                          Active cycle
                        </Text>
                      </View>
                      <Text className="font-mono text-[11px]" style={{ color: "rgba(255,255,255,0.85)" }}>
                        Day {activeDay}/14
                      </Text>
                    </View>
                    <Text className="mt-3 font-display text-[22px]" style={{ color: colors.white, letterSpacing: -0.5 }}>
                      {active.campaign.appName}
                    </Text>
                    <View className="mt-3 h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.25)" }}>
                      <View className="h-full rounded-full" style={{ width: `${(activeDay / 14) * 100}%`, backgroundColor: colors.white }} />
                    </View>
                    <View className="mt-3 flex-row items-center gap-1.5">
                      <Text className="font-body-semibold text-[13px]" style={{ color: colors.white }}>
                        Confirm today's check-in
                      </Text>
                      <Icon name="arrow-right" size={15} color={colors.white} />
                    </View>
                  </LinearGradient>
                </Pressable>
              ) : (
                <Card className="flex-row items-center gap-3 p-4">
                  <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.indigoSoft }}>
                    <Icon name="compass" size={19} color={colors.indigo} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-body-semibold text-[14px]" style={{ color: colors.ink }}>
                      No active cycle yet
                    </Text>
                    <Text className="font-body text-[12.5px]" style={{ color: colors.slate }}>
                      Opt into an app below to start your first 14-day cycle.
                    </Text>
                  </View>
                </Card>
              )}
            </AView>

            {/* Stat bento */}
            <AView entering={fadeIn(120)}>
              <View className="flex-row gap-3">
                <StatTile icon="shield" value={`${Math.round((profile?.reliabilityScore ?? 0) * 100)}%`} label="Reliability" tone={colors.positive} />
                <StatTile icon="check-circle" value={`${profile?.completedCycles ?? 0}`} label="Completed" tone={colors.indigo} />
                <StatTile icon="grid" value={`${total}`} label="To test" tone={colors.gold} />
              </View>
            </AView>

            {/* Section header */}
            <View className="flex-row items-center justify-between pt-1">
              <Text className="font-display text-[18px]" style={{ color: colors.ink, letterSpacing: -0.4 }}>
                Browse apps
              </Text>
              {shown > 0 && (
                <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: colors.indigoSoft }}>
                  <Text className="font-mono text-[11px]" style={{ color: colors.indigoInk }}>
                    {shown}
                  </Text>
                </View>
              )}
            </View>

            {/* Filters */}
            {(verticals.length > 1 || interests.size > 0) && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                <FilterChip label="All" active={!filter} onPress={() => setFilter(null)} />
                {interests.size > 0 && (
                  <FilterChip label="For you" active={filter === "__foryou"} onPress={() => setFilter("__foryou")} />
                )}
                {verticals.map((v) => (
                  <FilterChip key={v} label={v} active={filter === v} onPress={() => setFilter(v)} />
                ))}
              </ScrollView>
            )}
          </View>
        }
        renderItem={({ item, index }) => (
          <Entrance index={index}>
            <CampaignCard
              campaign={item}
              optingIn={optIn.isPending && optIn.variables === item.id}
              onOptIn={() => handleOptIn(item.id)}
            />
          </Entrance>
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState message="No new matched apps right now. We match you as founders launch campaigns in your field." />
          )
        }
      />
    </SafeAreaView>
  );
}
