import { FlatList, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFounderApps, useFounderStats } from "@/api/hooks";
import { useAuth } from "@/lib/auth";
import { colors } from "@/theme/tokens";
import { FounderAppCard } from "@/components/FounderAppCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { EmptyState } from "@/components/Screen";
import { Entrance } from "@/components/Motion";
import { Card } from "@/components/ui";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center gap-0.5 py-1">
      <Text className="font-display text-[20px]" style={{ color: colors.ink, letterSpacing: -0.5 }}>
        {value}
      </Text>
      <Text className="font-body text-[11.5px]" style={{ color: colors.slate }}>
        {label}
      </Text>
    </View>
  );
}

/** Founder dashboard — the apps this founder has submitted for testing. */
export function FounderAppsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: apps, isLoading } = useFounderApps();
  const { data: stats } = useFounderStats();
  const firstName = (user?.name ?? "there").split(/\s+/)[0];

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={apps ?? []}
        keyExtractor={(a) => a.id}
        contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="gap-4 pb-2 pt-2">
            <View className="gap-2">
              <Text className="font-body text-[15px]" style={{ color: colors.slate }}>
                Hi {firstName}
              </Text>
              <Text className="font-display text-[30px]" style={{ color: colors.ink, letterSpacing: -0.8 }}>
                Your apps
              </Text>
            </View>

            {stats && (
              <Card className="flex-row p-4">
                <Stat label="Apps" value={`${stats.appsSubmitted}`} />
                <View style={{ width: 1, backgroundColor: colors.line }} />
                <Stat label="Active" value={`${stats.activeCampaigns}`} />
                <View style={{ width: 1, backgroundColor: colors.line }} />
                <Stat label="Testers" value={`${stats.testersEngaged}`} />
                <View style={{ width: 1, backgroundColor: colors.line }} />
                <Stat label="Rating" value={`${stats.avgRating}`} />
              </Card>
            )}

            <PrimaryButton
              label="Submit a new app"
              variant="accent"
              icon="plus"
              onPress={() => router.push("/submit-app")}
            />
          </View>
        }
        renderItem={({ item, index }) => (
          <Entrance index={index}>
            <FounderAppCard
              app={item}
              onPress={() => router.push({ pathname: "/campaign/[id]", params: { id: item.id } })}
            />
          </Entrance>
        )}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState message="No apps yet. Submit your first app to start finding vetted testers." />
          )
        }
      />
    </SafeAreaView>
  );
}
