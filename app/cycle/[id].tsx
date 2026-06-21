import { useEffect, useState } from "react";
import { Linking, Pressable, RefreshControl, Share, Text, TextInput, View } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { useLocalSearchParams } from "expo-router";
import { FormScroll } from "@/components/FormScroll";
import { PressableScale } from "@/components/PressableScale";
import {
  useBroadcasts,
  useClaimReward,
  useCycle,
  useDailyCheckIn,
  useFeedbackQuestions,
  useOptIn,
  useProfile,
  useRespondCheckIn,
  useSubmitFeedback,
  useSubmitProof,
  useUpdateCycleEmail,
} from "@/api/hooks";
import { pickProofImage, uploadProof } from "@/lib/upload";
import { evaluateIntegrity } from "@/lib/integrity";
import { colors } from "@/theme/tokens";
import type { CheckIn, CheckInDay } from "@/types";

const GMAIL_RE = /^[^\s@]+@gmail\.com$/i;
import { Countdown } from "@/components/Countdown";
import { CycleStatusPill, CheckInStatusPill } from "@/components/StatusPill";
import { FeedbackForm } from "@/components/FeedbackForm";
import { PrimaryButton } from "@/components/PrimaryButton";
import { Icon } from "@/components/Icon";
import { rewardMeta } from "@/components/Reward";
import { BroadcastThread } from "@/components/BroadcastThread";
import { Screen, EmptyState } from "@/components/Screen";

const DAY_MS = 86400000;

function fmtAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View
      className="gap-3 rounded-[14px] bg-card p-5"
      style={{ borderWidth: 1, borderColor: colors.line }}
    >
      <Text
        className="font-display text-[15px]"
        style={{ color: colors.ink, letterSpacing: -0.3 }}
      >
        {title}
      </Text>
      {children}
    </View>
  );
}

export default function CycleDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const cycleId = id ?? "";
  const { data: cycle, isLoading } = useCycle(cycleId);
  const { data: questions } = useFeedbackQuestions();

  const optIn = useOptIn();
  const submitProof = useSubmitProof(cycleId);
  const respond = useRespondCheckIn(cycleId);
  const submitFeedback = useSubmitFeedback(cycleId);
  const dailyCheckIn = useDailyCheckIn(cycleId);
  const updateEmail = useUpdateCycleEmail(cycleId);
  const { data: broadcasts } = useBroadcasts(cycle?.campaign.packageName ?? "");
  const { data: profile } = useProfile();
  const claim = useClaimReward(cycleId);

  const [proofLoading, setProofLoading] = useState(false);
  const [replyDay, setReplyDay] = useState<CheckInDay | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [emailDraft, setEmailDraft] = useState("");
  const [emailError, setEmailError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const qc = useQueryClient();
  const onRefresh = async () => {
    setRefreshing(true);
    await qc.invalidateQueries();
    setRefreshing(false);
  };

  // Live clock so the "next check-in" countdown ticks down.
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  if (isLoading) return <Screen>{null}</Screen>;
  if (!cycle) {
    return (
      <Screen>
        <EmptyState message="Cycle not found." />
      </Screen>
    );
  }

  const handleProof = async () => {
    setProofLoading(true);
    try {
      const img = await pickProofImage();
      if (!img) return;
      const url = await uploadProof(img, cycleId);
      await submitProof.mutateAsync(url);
    } catch {
      // Swallowed here so it can't crash; the global mutation handler surfaces the alert.
    } finally {
      setProofLoading(false);
    }
  };

  const sendReply = (day: CheckInDay) => {
    respond.mutate(
      { day, response: replyText.trim() || "Acknowledged" },
      {
        onSuccess: () => {
          setReplyDay(null);
          setReplyText("");
        },
      },
    );
  };

  const isMatched = cycle.status === "MATCHED";
  const isActive = cycle.status === "ACTIVE";
  const isComplete = cycle.status === "COMPLETED";
  const isDropped = cycle.status === "DROPPED";
  const allCheckInsDone =
    cycle.checkIns.length > 0 &&
    cycle.checkIns.every((c: CheckIn) => c.status === "RESPONDED");

  // Daily proof-of-use
  const today = cycle.optInAt
    ? Math.min(14, Math.max(1, Math.floor((Date.now() - new Date(cycle.optInAt).getTime()) / DAY_MS) + 1))
    : 0;
  const dailyDone = cycle.dailyCheckIns.filter((d) => d.doneAt).length;
  const todayDone = !!cycle.dailyCheckIns.find((d) => d.day === today)?.doneAt;
  const _next = new Date(now); _next.setHours(24, 0, 0, 0);
  const _ms = Math.max(0, _next.getTime() - now);
  const nextCheckIn = `${Math.floor(_ms / 3600000)}h ${Math.floor((_ms % 3600000) / 60000)}m`;
  const integrity = evaluateIntegrity(cycle.dailyCheckIns, today);
  const reward = rewardMeta[cycle.campaign.rewardType];

  const startEditEmail = () => {
    setEmailDraft(cycle.gmailForCampaign);
    setEmailError("");
    setEditingEmail(true);
  };
  const saveEmail = () => {
    if (!GMAIL_RE.test(emailDraft.trim())) {
      setEmailError("Enter the Gmail signed into Google Play (must end in @gmail.com)");
      return;
    }
    setEmailError("");
    updateEmail.mutate(emailDraft, { onSuccess: () => setEditingEmail(false) });
  };

  const shareCycle = () => {
    Share.share({
      message: `I'm testing ${cycle.campaign.appName} on TrialCrew — a genuine 14-day closed test (day ${today}/14). #TrialCrew #AppTesting`,
    }).catch(() => {});
  };

  return (
    <FormScroll
      backgroundColor={colors.porcelain}
      contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 48 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.indigo} colors={[colors.indigo]} />}
    >
      {/* Header */}
      <View className="gap-2">
        <View className="flex-row items-start justify-between">
          <Text className="font-sora-bold text-2xl" style={{ color: colors.ink }}>
            {cycle.campaign.appName}
          </Text>
          <CycleStatusPill status={cycle.status} />
        </View>
        <Text className="font-inter text-[13px]" style={{ color: colors.slate }}>
          {cycle.campaign.feedbackFocus}
        </Text>
      </View>

      {/* Featured Play Console install link (set when the founder starts the cohort) */}
      {!!cycle.campaign.testLink && (
        <Pressable onPress={() => Linking.openURL(cycle.campaign.testLink!).catch(() => {})}>
          <View className="gap-1 rounded-2xl p-4" style={{ backgroundColor: colors.indigo }}>
            <View className="flex-row items-center gap-2">
              <Icon name="external-link" size={16} color={colors.white} />
              <Text className="font-body-semibold text-[14px]" style={{ color: colors.white }}>
                Install via Play Console
              </Text>
            </View>
            <Text className="font-body text-[12px]" numberOfLines={1} style={{ color: "rgba(255,255,255,0.85)" }}>
              {cycle.campaign.testLink}
            </Text>
          </View>
        </Pressable>
      )}

      {/* Waiting for the founder to start the cohort */}
      {isMatched && (
        <View className="flex-row items-start gap-2 rounded-xl p-3.5" style={{ backgroundColor: colors.sand }}>
          <Icon name="clock" size={15} color={colors.slate} />
          <Text className="flex-1 font-body text-[13px] leading-[18px]" style={{ color: colors.inkSoft }}>
            You're in! Your 14-day cycle starts when the founder kicks off the cohort — everyone begins together, same days. We'll notify you.
          </Text>
        </View>
      )}

      {/* Share */}
      {(isActive || isComplete) && (
        <PressableScale onPress={shareCycle}>
          <View className="flex-row items-center justify-center gap-2 rounded-xl py-2.5" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }}>
            <Icon name="share-2" size={15} color={colors.indigo} />
            <Text className="font-body-semibold text-[13.5px]" style={{ color: colors.indigo }}>Share your cycle</Text>
          </View>
        </PressableScale>
      )}

      {/* Play Store email (editable) */}
      {!isMatched && (
        <Section title="Your Play Store email">
          {editingEmail ? (
            <View className="gap-2">
              <TextInput
                value={emailDraft}
                onChangeText={setEmailDraft}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="you@gmail.com"
                placeholderTextColor={colors.slate}
                className="rounded-[10px] bg-white p-3 font-body text-[14px]"
                style={{ color: colors.ink, borderWidth: 1, borderColor: emailError ? colors.danger : colors.line }}
              />
              {!!emailError && (
                <Text className="font-body text-[12px]" style={{ color: colors.danger }}>
                  {emailError}
                </Text>
              )}
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <PrimaryButton label="Save" onPress={saveEmail} loading={updateEmail.isPending} />
                </View>
                <View className="flex-1">
                  <PrimaryButton label="Cancel" variant="outline" onPress={() => setEditingEmail(false)} />
                </View>
              </View>
            </View>
          ) : (
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="font-mono text-[13px]" style={{ color: colors.ink }}>
                  {cycle.gmailForCampaign}
                </Text>
                <PrimaryButton label="Edit" variant="ghost" icon="edit-2" onPress={startEditEmail} />
              </View>
              <View className="flex-row items-start gap-2 rounded-xl p-3" style={{ backgroundColor: colors.indigoSoft }}>
                <Icon name="alert-circle" size={14} color={colors.indigoInk} />
                <Text className="flex-1 font-body text-[12px] leading-[17px]" style={{ color: colors.indigoInk }}>
                  This must be the Gmail signed in to Google Play on your device — it's the address the founder adds as a tester.
                </Text>
              </View>
            </View>
          )}
        </Section>
      )}

      {/* Opt-in (MATCHED) */}
      {isMatched && (
        <Section title="Start your cycle">
          <Text
            className="font-inter text-[13px] leading-relaxed"
            style={{ color: colors.slate }}
          >
            Opt in to begin your own 14-day closed-test cycle. Your countdown
            starts the moment you opt in — independent of every other tester.
          </Text>
          <PrimaryButton
            label="Opt in — start 14-day cycle"
            loading={optIn.isPending}
            onPress={() => optIn.mutate(cycle.campaign.id)}
          />
        </Section>
      )}

      {/* Updates from the founder (broadcasts + two-way thread) */}
      {!isMatched && (broadcasts?.length ?? 0) > 0 && (
        <Section title="Updates from the team">
          <View className="gap-3">
            {broadcasts!.map((b) => (
              <BroadcastThread
                key={b.id}
                broadcast={b}
                viewerRole="TESTER"
                viewerName={profile?.name ?? "You"}
              />
            ))}
          </View>
        </Section>
      )}

      {/* Reward escrow + fulfillment */}
      {!isMatched && (() => {
        const claimed = !!cycle.rewardClaimed;
        const grantText =
          cycle.campaign.rewardType === "PREMIUM_ACCESS"
            ? "Premium unlocked — 90 days added to your account"
            : cycle.campaign.rewardType === "CREDITS"
              ? "500 credits added to your balance"
              : "$50 stipend queued for payout";
        return (
          <Section title="Your reward">
            <View className="flex-row items-center gap-3">
              <View
                className="h-11 w-11 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: claimed ? colors.positiveSoft : isComplete ? colors.goldSoft : colors.sand,
                  borderWidth: 1,
                  borderColor: claimed ? colors.positive : isComplete ? colors.gold : colors.line,
                }}
              >
                <Icon
                  name={isDropped ? "x" : claimed ? "check" : isComplete ? "gift" : "lock"}
                  size={18}
                  color={isDropped ? colors.danger : claimed ? colors.positive : isComplete ? colors.gold : colors.slate}
                />
              </View>
              <View className="flex-1">
                <Text className="font-body-semibold text-[15px]" style={{ color: colors.ink }}>
                  {reward.label}
                </Text>
                <Text
                  className="font-body text-[12.5px]"
                  style={{ color: isDropped ? colors.danger : claimed ? colors.positive : isComplete ? colors.gold : colors.slate }}
                >
                  {isDropped
                    ? "Forfeited — cycle dropped"
                    : claimed
                      ? grantText
                      : isComplete
                        ? "Unlocked — claim to receive it"
                        : "Held in escrow · unlocks when you complete the cycle"}
                </Text>
              </View>
            </View>
            {isComplete && !claimed && (
              <PrimaryButton
                label="Claim reward"
                variant="accent"
                icon="gift"
                loading={claim.isPending}
                onPress={() => claim.mutate()}
              />
            )}
          </Section>
        );
      })()}

      {/* Dropped */}
      {isDropped && (
        <Section title="Cycle dropped">
          <View className="flex-row items-start gap-2 rounded-xl p-3" style={{ backgroundColor: colors.dangerSoft }}>
            <Icon name="alert-triangle" size={15} color={colors.danger} />
            <Text className="flex-1 font-body text-[13px] leading-[19px]" style={{ color: colors.danger }}>
              This cycle was dropped after two consecutive missed days, so no reward is issued.
              Your reliability takes the hit — but you can enroll in a new app from Discover anytime.
            </Text>
          </View>
        </Section>
      )}

      {/* Countdown (ACTIVE/COMPLETE) */}
      {(isActive || isComplete) && (
        <Section title="Cycle clock">
          <Countdown
            optInAt={cycle.optInAt}
            completesAt={cycle.completesAt}
          />
        </Section>
      )}

      {/* Daily proof-of-use (ACTIVE) */}
      {isActive && (
        <Section title="Daily proof-of-use">
          <Text className="font-body text-[13px] leading-[19px]" style={{ color: colors.slate }}>
            Each day, open the app and do something real — then confirm here. Keeps your
            cycle genuine and your reliability high.
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {cycle.dailyCheckIns.map((d) => {
              const done = !!d.doneAt;
              const isToday = d.day === today;
              const missed = !done && d.day < today;
              const bg = done ? colors.positiveSoft : missed ? colors.dangerSoft : colors.sand;
              const border = done
                ? colors.positive
                : missed
                  ? colors.danger
                  : isToday
                    ? colors.indigo
                    : colors.line;
              return (
                <View
                  key={d.day}
                  className="items-center justify-center rounded-lg"
                  style={{ width: 38, height: 38, backgroundColor: bg, borderWidth: 1.5, borderColor: border }}
                >
                  {done ? (
                    <Icon name="check" size={15} color={colors.positive} />
                  ) : missed ? (
                    <Icon name="x" size={15} color={colors.danger} />
                  ) : (
                    <Text className="font-body text-[12px]" style={{ color: isToday ? colors.indigo : colors.slateLight }}>
                      {d.day}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>

          {integrity.atRisk && (
            <View className="flex-row items-start gap-2 rounded-xl p-3" style={{ backgroundColor: colors.dangerSoft }}>
              <Icon name="alert-triangle" size={15} color={colors.danger} />
              <Text className="flex-1 font-body text-[12.5px] leading-[18px]" style={{ color: colors.danger }}>
                You missed a day. Confirm today to stay on track — miss again and your cycle is
                dropped with no reward.
              </Text>
            </View>
          )}

          <View className="flex-row items-center justify-between">
            <Text className="font-body-medium text-[13px]" style={{ color: colors.slate }}>
              {dailyDone}/14 days confirmed
            </Text>
            <Text className="font-mono text-[12px]" style={{ color: colors.slate }}>
              Day {today}
            </Text>
          </View>

          {todayDone ? (
            <View className="items-center gap-1 rounded-xl py-3" style={{ backgroundColor: colors.positiveSoft }}>
              <View className="flex-row items-center gap-1.5">
                <Icon name="check-circle" size={16} color={colors.positive} />
                <Text className="font-body-semibold text-[14px]" style={{ color: colors.positive }}>
                  Checked in for today
                </Text>
              </View>
              <Text className="font-mono text-[12px]" style={{ color: colors.positive }}>
                Next check-in in {nextCheckIn}
              </Text>
            </View>
          ) : (
            <PrimaryButton
              label="I used the app today"
              variant="accent"
              icon="check"
              onPress={() => dailyCheckIn.mutate()}
              loading={dailyCheckIn.isPending}
            />
          )}
        </Section>
      )}

      {/* Day-0 proof */}
      {(isActive || isComplete) && (
        <Section title="Day-0 install proof">
          {cycle.proof ? (
            <Text
              className="font-inter text-[13px]"
              style={{ color: colors.slate }}
            >
              Uploaded{cycle.proof.verified ? " · verified ✓" : " · pending review"}
            </Text>
          ) : (
            <>
              <Text
                className="font-inter text-[13px]"
                style={{ color: colors.slate }}
              >
                Upload a screenshot showing the app installed from the closed
                test.
              </Text>
              <PrimaryButton
                label="Upload screenshot"
                variant="outline"
                loading={proofLoading || submitProof.isPending}
                onPress={handleProof}
              />
            </>
          )}
        </Section>
      )}

      {/* Check-ins */}
      {cycle.checkIns.length > 0 && (
        <Section title="Check-ins">
          <View className="gap-3">
            {cycle.checkIns.map((ci: CheckIn) => {
              const canReply = ci.status === "SENT" || ci.status === "PENDING";
              return (
                <View
                  key={ci.id}
                  className="gap-2 rounded-xl p-3"
                  style={{ backgroundColor: colors.sand }}
                >
                  <View className="flex-row items-center justify-between">
                    <Text
                      className="font-mono text-[13px]"
                      style={{ color: colors.ink }}
                    >
                      Day {ci.dayNumber}
                    </Text>
                    <CheckInStatusPill status={ci.status} />
                  </View>
                  {ci.response && (
                    <Text
                      className="font-inter text-[13px]"
                      style={{ color: colors.slate }}
                    >
                      “{ci.response}”
                    </Text>
                  )}
                  {canReply && replyDay !== ci.dayNumber && (
                    <PrimaryButton
                      label="Respond"
                      variant="outline"
                      onPress={() => {
                        setReplyDay(ci.dayNumber);
                        setReplyText("");
                      }}
                    />
                  )}
                  {canReply && replyDay === ci.dayNumber && (
                    <View className="gap-2">
                      <TextInput
                        placeholder="How's testing going?"
                        placeholderTextColor={colors.slate}
                        value={replyText}
                        onChangeText={setReplyText}
                        className="rounded-[10px] bg-white p-3 font-body text-[14px]"
                        style={{
                          color: colors.ink,
                          borderWidth: 1,
                          borderColor: colors.line,
                        }}
                      />
                      <PrimaryButton
                        label="Send response"
                        loading={respond.isPending}
                        onPress={() => sendReply(ci.dayNumber)}
                      />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </Section>
      )}

      {/* Feedback */}
      {isComplete && cycle.feedback ? (
        <Section title="Feedback submitted">
          <Text
            className="font-inter text-[13px]"
            style={{ color: colors.slate }}
          >
            Thanks — your structured feedback has been sent to the founder.
            {cycle.founderRating
              ? ` Founder rated this cycle ${cycle.founderRating}/5.`
              : ""}
          </Text>
        </Section>
      ) : isActive && allCheckInsDone && questions ? (
        <Section title="Submit feedback">
          <FeedbackForm
            questions={questions}
            submitting={submitFeedback.isPending}
            onSubmit={(answers) => submitFeedback.mutate(answers)}
          />
        </Section>
      ) : isActive ? (
        <Section title="Feedback">
          <Text
            className="font-inter text-[13px]"
            style={{ color: colors.slate }}
          >
            The structured feedback form unlocks once you've responded to all
            check-ins.
          </Text>
        </Section>
      ) : null}
    </FormScroll>
  );
}
