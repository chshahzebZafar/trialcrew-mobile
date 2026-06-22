import { useState } from "react";
import { Alert, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useFounderStats, useProfile } from "@/api/hooks";
import { api } from "@/api/client";
import { apiErrorMessage } from "@/api/config";
import { registerPushToken } from "@/lib/push";
import { useAuth } from "@/lib/auth";
import { useRole } from "@/stores/roleStore";
import { colors } from "@/theme/tokens";
import { BadgePill, nextTierProgress } from "@/components/Badge";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PressableScale } from "@/components/PressableScale";
import { Card, Chip, Divider } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { Entrance } from "@/components/Motion";
import { RoleToggle } from "@/components/RoleToggle";
import { RemindersCard } from "@/components/RemindersCard";

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function initials(name: string) {
  const w = name.trim().split(/\s+/);
  return ((w[0]?.[0] ?? "") + (w[1]?.[0] ?? "")).toUpperCase() || "?";
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-1 items-center gap-1 py-1">
      <Text className="font-display text-[22px]" style={{ color: colors.ink, letterSpacing: -0.5 }}>
        {value}
      </Text>
      <Text className="font-body text-[11.5px]" style={{ color: colors.slate }}>
        {label}
      </Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { data: profile, isLoading } = useProfile();
  const { data: fStats } = useFounderStats();
  const { signOut } = useAuth();
  const role = useRole();
  const router = useRouter();
  const isFounder = role === "FOUNDER";
  const [pushBusy, setPushBusy] = useState(false);

  const testNotifications = async () => {
    setPushBusy(true);
    try {
      const token = await registerPushToken();
      if (token) await api.setPushToken(token);
      const res = await api.sendTestPush();
      if (!res.hasToken) {
        Alert.alert("Enable notifications", "No push token yet. Grant notification permission when prompted (works in a dev/standalone build, not Expo Go), then tap again.");
      } else {
        Alert.alert("Test sent ✓", "A test notification was sent to this device — it should arrive in a few seconds.");
      }
    } catch (e) {
      Alert.alert("Couldn't send", apiErrorMessage(e));
    } finally {
      setPushBusy(false);
    }
  };

  if (isLoading || !profile) {
    return <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  const tier = nextTierProgress(profile.completedCycles);

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView
        contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 44 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity (shared) */}
        <Entrance index={0}>
          <View className="items-center gap-3 pb-1 pt-2">
            <View
              className="h-20 w-20 items-center justify-center rounded-3xl"
              style={{ backgroundColor: colors.sand, borderWidth: 1, borderColor: colors.line }}
            >
              <Text className="font-display text-[28px]" style={{ color: colors.ink, letterSpacing: -0.5 }}>
                {initials(profile.name)}
              </Text>
            </View>
            <View className="items-center gap-1.5">
              <Text className="font-display text-[24px]" style={{ color: colors.ink, letterSpacing: -0.6 }}>
                {profile.name}
              </Text>
              <Text className="font-body text-[14px]" style={{ color: colors.slate }}>
                {profile.vertical}
              </Text>
              <View className="mt-1">
                {isFounder ? (
                  <Chip label="App founder" bg={colors.indigoSoft} fg={colors.indigoInk} />
                ) : (
                  <BadgePill tier={profile.badgeTier} />
                )}
              </View>
            </View>
          </View>
        </Entrance>

        {/* Edit profile */}
        <PressableScale onPress={() => router.push("/edit-profile")}>
          <View className="flex-row items-center justify-center gap-2 rounded-xl py-2.5" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }}>
            <Icon name="edit-3" size={15} color={colors.ink} />
            <Text className="font-body-semibold text-[14px]" style={{ color: colors.ink }}>Edit profile</Text>
          </View>
        </PressableScale>

        {/* Test notifications */}
        <PressableScale onPress={testNotifications} disabled={pushBusy}>
          <View className="flex-row items-center justify-center gap-2 rounded-xl py-2.5" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }}>
            <Icon name="bell" size={15} color={colors.indigo} />
            <Text className="font-body-semibold text-[14px]" style={{ color: colors.indigo }}>{pushBusy ? "Sending…" : "Test notifications"}</Text>
          </View>
        </PressableScale>

        {/* Role switch */}
        <Entrance index={1}>
          <View className="gap-2">
            <Text className="font-body text-[12px]" style={{ color: colors.slate }}>
              Your role
            </Text>
            <RoleToggle />
          </View>
        </Entrance>

        {/* Role-specific stats */}
        <Entrance index={2}>
          {isFounder ? (
            <Card className="flex-row p-4">
              <Stat label="Apps" value={`${fStats?.appsSubmitted ?? 0}`} />
              <View style={{ width: 1, backgroundColor: colors.line }} />
              <Stat label="Testers" value={`${fStats?.testersEngaged ?? 0}`} />
              <View style={{ width: 1, backgroundColor: colors.line }} />
              <Stat label="Rating" value={`${fStats?.avgRating ?? 0}`} />
            </Card>
          ) : (
            <Card className="flex-row p-4">
              <Stat label="Reliability" value={`${Math.round(profile.reliabilityScore * 100)}%`} />
              <View style={{ width: 1, backgroundColor: colors.line }} />
              <Stat label="Completed" value={`${profile.completedCycles}`} />
              <View style={{ width: 1, backgroundColor: colors.line }} />
              <Stat label="Accepted" value={`${profile.acceptedCycles}`} />
            </Card>
          )}
        </Entrance>

        {/* Role-specific detail */}
        {isFounder ? (
          <Entrance index={3}>
            <Card className="gap-3 p-5">
              <View className="flex-row items-center gap-2">
                <Icon name="message-square" size={15} color={colors.indigo} />
                <Text className="font-body-semibold text-[14px]" style={{ color: colors.ink }}>
                  {fStats?.feedbackReceived ?? 0} structured feedback reports received
                </Text>
              </View>
              <Text className="font-body text-[13px] leading-[20px]" style={{ color: colors.slate }}>
                Each report comes from a vetted professional who ran a genuine 14-day closed test.
              </Text>
            </Card>
          </Entrance>
        ) : (
          <Entrance index={3}>
            <Card className="gap-3 p-5">
              <View className="flex-row items-center gap-2">
                <Icon name="award" size={15} color={colors.indigo} />
                <Text className="font-body-semibold text-[14px]" style={{ color: colors.ink }}>
                  {tier.next
                    ? `${tier.remaining} more cycle${tier.remaining === 1 ? "" : "s"} to ${tier.next}`
                    : "Top tier reached — Expert"}
                </Text>
              </View>
              <View className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: colors.sand }}>
                <View
                  className="h-full rounded-full"
                  style={{ width: `${Math.round(tier.fraction * 100)}%`, backgroundColor: colors.indigo }}
                />
              </View>
            </Card>
          </Entrance>
        )}

        {/* Rewards + reminders (tester only) */}
        {!isFounder && (
          <>
            <Entrance index={4}>
              <Card className="gap-3 p-5">
                <View className="flex-row items-center gap-2">
                  <Icon name="gift" size={15} color={colors.gold} />
                  <Text className="font-body-semibold text-[14px]" style={{ color: colors.ink }}>
                    Rewards
                  </Text>
                </View>
                {profile.premiumUntil || profile.credits > 0 || profile.stipendPending > 0 ? (
                  <View className="gap-2">
                    {profile.premiumUntil && (
                      <View className="flex-row items-center gap-2">
                        <Icon name="star" size={13} color={colors.gold} />
                        <Text className="font-body text-[13px]" style={{ color: colors.ink }}>
                          Premium · active until {fmtDate(profile.premiumUntil)}
                        </Text>
                      </View>
                    )}
                    {profile.credits > 0 && (
                      <View className="flex-row items-center gap-2">
                        <Icon name="zap" size={13} color={colors.indigo} />
                        <Text className="font-body text-[13px]" style={{ color: colors.ink }}>
                          {profile.credits} platform credits
                        </Text>
                      </View>
                    )}
                    {profile.stipendPending > 0 && (
                      <View className="flex-row items-center gap-2">
                        <Icon name="dollar-sign" size={13} color={colors.positive} />
                        <Text className="font-body text-[13px]" style={{ color: colors.ink }}>
                          ${profile.stipendPending} stipend pending payout
                        </Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <Text className="font-body text-[13px]" style={{ color: colors.slate }}>
                    No rewards yet — complete a cycle and claim to earn.
                  </Text>
                )}
              </Card>
            </Entrance>
            <Entrance index={5}>
              <RemindersCard />
            </Entrance>
          </>
        )}

        {/* Bio + specialities (shared) */}
        <Entrance index={6}>
          <Card className="gap-4 p-5">
            {profile.bio && (
              <>
                <Text className="font-body text-[14px] leading-[21px]" style={{ color: colors.inkSoft }}>
                  {profile.bio}
                </Text>
                <Divider />
              </>
            )}
            <View className="gap-2.5">
              <Text className="font-body text-[12px]" style={{ color: colors.slate }}>
                Specialities
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {profile.categories.map((c) => (
                  <Chip key={c} label={c} />
                ))}
              </View>
            </View>
          </Card>
        </Entrance>

        <Entrance index={7}>
          <PrimaryButton label="Sign out" variant="outline" icon="log-out" onPress={signOut} />
        </Entrance>
      </ScrollView>
    </SafeAreaView>
  );
}
