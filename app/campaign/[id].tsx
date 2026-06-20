import { useState } from "react";
import { Pressable, ScrollView, Share, Text, TextInput, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  useBroadcasts,
  useEnrollments,
  useExportEmails,
  useFounderApp,
  useMarkInvited,
  usePublishApp,
  useSendBroadcast,
} from "@/api/hooks";
import { colors } from "@/theme/tokens";
import { AppLogo } from "@/components/AppLogo";
import { BadgePill } from "@/components/Badge";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Card, Divider } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { PressableScale } from "@/components/PressableScale";
import { Screen, EmptyState } from "@/components/Screen";
import { founderStatusMeta } from "@/components/FounderAppCard";
import { RewardChip } from "@/components/Reward";
import { CohortHealth } from "@/components/CohortHealth";
import { BroadcastThread } from "@/components/BroadcastThread";
import type { Enrollment } from "@/types";

function fmtAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const M = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DAY = 86400000;
const fmt = (iso?: string) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${M[d.getMonth()]} ${d.getDate()}`;
};

const TARGETS = [12, 16, 20];
const STARTS = [
  { label: "Today", days: 0 },
  { label: "In 3 days", days: 3 },
  { label: "In a week", days: 7 },
];

function ChipBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-xl px-3.5 py-2.5"
      style={{
        backgroundColor: active ? colors.ink : colors.sand,
        borderWidth: 1,
        borderColor: active ? colors.ink : colors.line,
      }}
    >
      <Text className="font-body-medium text-[13px]" style={{ color: active ? colors.white : colors.slate }}>
        {label}
      </Text>
    </Pressable>
  );
}

function EnrollmentRow({ e, onPress }: { e: Enrollment; onPress: () => void }) {
  const initials = e.testerName.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <PressableScale onPress={onPress} className="flex-row items-center gap-3 py-1" scaleTo={0.98} haptic={false}>
      <View
        className="h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: colors.sand, borderWidth: 1, borderColor: colors.line }}
      >
        <Text className="font-display text-[12px]" style={{ color: colors.ink }}>{initials}</Text>
      </View>
      <View className="flex-1">
        <Text className="font-body-semibold text-[14px]" style={{ color: colors.ink }}>{e.testerName}</Text>
        <Text className="font-body text-[12px]" style={{ color: colors.slate }}>
          {e.status === "TESTING" ? `Day ${e.dailyDone}/14` : e.status === "COMPLETED" ? "Completed" : e.status === "DROPPED" ? "Dropped" : "Enrolled"}
        </Text>
      </View>
      <BadgePill tier={e.badgeTier} />
      <Icon name="chevron-right" size={15} color={colors.slateLight} />
    </PressableScale>
  );
}

export default function CampaignDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const appId = id ?? "";
  const router = useRouter();
  const { data: app, isLoading } = useFounderApp(appId);
  const { data: enrolls } = useEnrollments(appId);
  const publish = usePublishApp(appId);
  const invite = useMarkInvited(appId);
  const exportEmails = useExportEmails(appId);
  const { data: broadcasts } = useBroadcasts(app?.packageName ?? "");
  const sendBroadcast = useSendBroadcast(app?.packageName ?? "");

  const [target, setTarget] = useState(16);
  const [startDays, setStartDays] = useState(0);
  const [message, setMessage] = useState("");

  if (isLoading) return <Screen>{null}</Screen>;
  if (!app) return <Screen><EmptyState message="App not found." /></Screen>;

  const meta = founderStatusMeta[app.status];
  const isDraft = app.status === "DRAFT";
  const ready = app.enrolledCount >= app.minTesters;
  const remaining = Math.max(0, app.minTesters - app.enrolledCount);
  const droppedCount = (enrolls ?? []).filter((e) => e.status === "DROPPED").length;

  const doPublish = () =>
    publish.mutate({ minTesters: target, startDate: new Date(Date.now() + startDays * DAY).toISOString() });

  const doExport = async () => {
    const emails = await exportEmails.mutateAsync();
    await Share.share({
      message: `TrialCrew · ${app.name} — tester Gmails for Play Console:\n\n${emails.join("\n")}`,
    });
  };

  return (
    <ScrollView style={{ backgroundColor: colors.bg }} contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 44 }}>
      {/* Header */}
      <View className="flex-row items-center gap-3">
        <AppLogo name={app.name} size={52} />
        <View className="flex-1">
          <Text className="font-display text-[20px]" style={{ color: colors.ink, letterSpacing: -0.4 }}>{app.name}</Text>
          <Text className="font-body text-[12.5px]" style={{ color: colors.slate }}>{app.packageName}</Text>
        </View>
        <View className="self-start rounded-md px-2 py-1" style={{ backgroundColor: meta.bg }}>
          <Text className="font-body-medium text-[11.5px]" style={{ color: meta.fg }}>{meta.label}</Text>
        </View>
      </View>

      <View className="flex-row items-center justify-between">
        <Text className="flex-1 font-body text-[13.5px] leading-[20px]" style={{ color: colors.slate }}>
          Focus · {app.feedbackFocus}
        </Text>
        <RewardChip reward={app.rewardType} />
      </View>

      {/* DRAFT → publish flow */}
      {isDraft ? (
        <Card className="gap-4 p-5">
          <View className="gap-1">
            <Text className="font-display text-[15px]" style={{ color: colors.ink }}>Publish to testers</Text>
            <Text className="font-body text-[13px]" style={{ color: colors.slate }}>
              Set your target cohort and start date. Play needs 12 for 14 days — a buffer protects against drop-offs.
            </Text>
          </View>
          <View className="gap-2">
            <Text className="font-body text-[12px]" style={{ color: colors.slate }}>Tester target</Text>
            <View className="flex-row gap-2">
              {TARGETS.map((t) => (
                <ChipBtn key={t} label={`${t}`} active={target === t} onPress={() => setTarget(t)} />
              ))}
            </View>
          </View>
          <View className="gap-2">
            <Text className="font-body text-[12px]" style={{ color: colors.slate }}>Test starts</Text>
            <View className="flex-row gap-2">
              {STARTS.map((s) => (
                <ChipBtn key={s.label} label={s.label} active={startDays === s.days} onPress={() => setStartDays(s.days)} />
              ))}
            </View>
          </View>
          <PrimaryButton label="Publish to testers" variant="accent" icon="send" onPress={doPublish} loading={publish.isPending} />
        </Card>
      ) : (
        <>
          {/* Timeline */}
          <Card className="flex-row p-4">
            <View className="flex-1 items-center gap-0.5">
              <Text className="font-body text-[11.5px]" style={{ color: colors.slate }}>Published</Text>
              <Text className="font-body-semibold text-[14px]" style={{ color: colors.ink }}>{fmt(app.publishedAt)}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.line }} />
            <View className="flex-1 items-center gap-0.5">
              <Text className="font-body text-[11.5px]" style={{ color: colors.slate }}>Starts</Text>
              <Text className="font-body-semibold text-[14px]" style={{ color: colors.ink }}>{fmt(app.startDate)}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: colors.line }} />
            <View className="flex-1 items-center gap-0.5">
              <Text className="font-body text-[11.5px]" style={{ color: colors.slate }}>Ends</Text>
              <Text className="font-body-semibold text-[14px]" style={{ color: colors.ink }}>
                {fmt(app.startDate ? new Date(new Date(app.startDate).getTime() + 14 * DAY).toISOString() : undefined)}
              </Text>
            </View>
          </Card>

          {/* Enrollment + actions */}
          <Card className="gap-4 p-5">
            <View className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="font-display text-[15px]" style={{ color: colors.ink }}>
                  {app.enrolledCount} of {app.minTesters} enrolled
                </Text>
                <Text className="font-body-medium text-[13px]" style={{ color: ready ? colors.positive : colors.slate }}>
                  {ready ? "Target met" : `${remaining} to go`}
                </Text>
              </View>
              <View className="h-2.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: colors.sand }}>
                <View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((app.enrolledCount / app.minTesters) * 100))}%`,
                    backgroundColor: ready ? colors.positive : colors.indigo,
                  }}
                />
              </View>
            </View>

            {droppedCount > 0 && (
              <View className="flex-row items-start gap-2 rounded-xl p-3" style={{ backgroundColor: colors.dangerSoft }}>
                <Icon name="refresh-cw" size={14} color={colors.danger} />
                <Text className="flex-1 font-body text-[12px] leading-[17px]" style={{ color: colors.danger }}>
                  {droppedCount} tester{droppedCount === 1 ? "" : "s"} dropped for missed check-ins —{" "}
                  {droppedCount === 1 ? "a slot has" : "slots have"} reopened and {droppedCount === 1 ? "is" : "are"} backfilling from your match pool.
                </Text>
              </View>
            )}

            {ready ? (
              <View className="gap-3">
                <PrimaryButton label="Export tester emails" variant="primary" icon="download" onPress={doExport} loading={exportEmails.isPending} />
                {app.status === "ENROLLING" && (
                  <PrimaryButton label="Mark invited & start test" variant="accent" icon="check" onPress={() => invite.mutate()} loading={invite.isPending} />
                )}
                <View className="flex-row items-start gap-2 rounded-xl p-3" style={{ backgroundColor: colors.indigoSoft }}>
                  <Icon name="lock" size={14} color={colors.indigoInk} />
                  <Text className="flex-1 font-body text-[12px] leading-[17px]" style={{ color: colors.indigoInk }}>
                    Add these Gmails as testers in Play Console, then mark invited — the 14-day test begins on the start date.
                  </Text>
                </View>
              </View>
            ) : (
              <Text className="font-body text-[13px]" style={{ color: colors.slate }}>
                Emails unlock for export once your target of {app.minTesters} testers enrol.
              </Text>
            )}
          </Card>

          {/* Cohort analytics (test running) */}
          {app.status === "INVITED" && (enrolls?.length ?? 0) > 0 && (
            <CohortHealth enrollments={enrolls ?? []} startDate={app.startDate} />
          )}

          {/* Enrolled testers */}
          <View className="gap-3">
            <Text className="font-body text-[12px]" style={{ color: colors.slate }}>
              Enrolled testers ({enrolls?.length ?? 0})
            </Text>
            <Card className="gap-1 p-4">
              {(enrolls ?? []).map((e, i) => (
                <View key={e.id}>
                  {i > 0 && <Divider />}
                  <View className={i > 0 ? "pt-1" : ""}>
                    <EnrollmentRow e={e} onPress={() => router.push({ pathname: "/enrollment/[id]", params: { id: e.id } })} />
                  </View>
                </View>
              ))}
              {(enrolls?.length ?? 0) === 0 && (
                <Text className="py-2 font-body text-[13px]" style={{ color: colors.slate }}>No testers yet.</Text>
              )}
            </Card>
          </View>

          {/* Broadcast to cohort */}
          <View className="gap-3">
            <Text className="font-body text-[12px]" style={{ color: colors.slate }}>Message your testers</Text>
            <Card className="gap-3 p-4">
              <TextInput
                value={message}
                onChangeText={setMessage}
                multiline
                placeholder="Share a new build, focus area, or thanks…"
                placeholderTextColor={colors.slate}
                className="min-h-[64px] rounded-[10px] bg-bg p-3 font-body text-[14px]"
                style={{ color: colors.ink, borderWidth: 1, borderColor: colors.line, textAlignVertical: "top" }}
              />
              <PrimaryButton
                label="Send to all testers"
                variant="accent"
                icon="send"
                disabled={message.trim().length < 2}
                loading={sendBroadcast.isPending}
                onPress={() =>
                  sendBroadcast.mutate(message, { onSuccess: () => setMessage("") })
                }
              />
            </Card>

            {(broadcasts ?? []).map((b) => (
              <BroadcastThread key={b.id} broadcast={b} viewerRole="FOUNDER" viewerName="You" />
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}
