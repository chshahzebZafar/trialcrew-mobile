import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useSubmitApp } from "@/api/hooks";
import { apiErrorMessage } from "@/api/config";
import { colors } from "@/theme/tokens";
import { TextField } from "@/components/TextField";
import { FormScroll } from "@/components/FormScroll";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PressableScale } from "@/components/PressableScale";
import { Icon } from "@/components/Icon";
import { rewardMeta } from "@/components/Reward";
import type { RewardType } from "@/types";

const REWARDS: RewardType[] = ["PREMIUM_ACCESS", "CREDITS", "STIPEND"];

export default function SubmitApp() {
  const router = useRouter();
  const submit = useSubmitApp();

  const [name, setName] = useState("");
  const [packageName, setPackageName] = useState("");
  const [vertical, setVertical] = useState("");
  const [feedbackFocus, setFeedbackFocus] = useState("");
  const [description, setDescription] = useState("");
  const [playStoreUrl, setPlayStoreUrl] = useState("");
  const [reward, setReward] = useState<RewardType>("PREMIUM_ACCESS");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = "Enter the app name";
    if (!/^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i.test(packageName.trim()))
      next.packageName = "e.g. com.yourcompany.app";
    if (vertical.trim().length < 2) next.vertical = "What field is it for?";
    if (feedbackFocus.trim().length < 3) next.feedbackFocus = "What should testers focus on?";

    // Optional Play Store link: auto-add https:// if the scheme is missing, then sanity-check it.
    const raw = playStoreUrl.trim();
    const url = raw ? (/^https?:\/\//i.test(raw) ? raw : `https://${raw}`) : undefined;
    if (url && !/^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(url))
      next.playStoreUrl = "Enter a valid link, e.g. https://play.google.com/...";

    setErrors(next);
    if (Object.keys(next).length) return;

    setFormError(null);
    try {
      await submit.mutateAsync({
        name: name.trim(),
        packageName: packageName.trim(),
        vertical: vertical.trim(),
        feedbackFocus: feedbackFocus.trim(),
        description: description.trim() || undefined,
        playStoreUrl: url,
        rewardType: reward,
      });
      router.back();
    } catch (e) {
      setFormError(apiErrorMessage(e, "Couldn't create the app. Please check your details and try again."));
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Custom header — safe-area aware, tappable back with press feedback */}
      <View className="flex-row items-center px-5 pb-1 pt-2">
        <PressableScale onPress={() => router.back()}>
          <View
            className="h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }}
          >
            <Icon name="arrow-left" size={20} color={colors.ink} />
          </View>
        </PressableScale>
      </View>
      <FormScroll
        backgroundColor={colors.bg}
        contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 18, paddingBottom: 40 }}
      >
        <View className="gap-1.5">
          <Text className="font-display text-[24px]" style={{ color: colors.ink, letterSpacing: -0.6 }}>
            Submit an app
          </Text>
          <Text className="font-body text-[14px] leading-[20px]" style={{ color: colors.slate }}>
            We'll match you with vetted testers in your field for a genuine 14-day closed test.
          </Text>
        </View>

        <View className="gap-4">
          <TextField label="App name" placeholder="SiteSync" value={name} onChangeText={setName} error={errors.name} />
          <TextField
            label="Package name"
            placeholder="com.yourcompany.app"
            autoCapitalize="none"
            autoCorrect={false}
            value={packageName}
            onChangeText={setPackageName}
            error={errors.packageName}
          />
          <TextField
            label="Field / vertical"
            placeholder="Construction"
            value={vertical}
            onChangeText={setVertical}
            error={errors.vertical}
          />
          <TextField
            label="Feedback focus"
            placeholder="Daily logs & crew check-in flow"
            value={feedbackFocus}
            onChangeText={setFeedbackFocus}
            error={errors.feedbackFocus}
          />
          <TextField
            label="Description (optional)"
            placeholder="What does the app do?"
            value={description}
            onChangeText={setDescription}
          />
          <TextField
            label="Play Store URL (optional)"
            placeholder="play.google.com/store/apps/..."
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            value={playStoreUrl}
            onChangeText={setPlayStoreUrl}
            error={errors.playStoreUrl}
          />
        </View>

        <View className="gap-2.5">
          <Text className="font-body-medium text-[13px]" style={{ color: colors.slate }}>
            Tester reward
          </Text>
          <View className="gap-2">
            {REWARDS.map((r) => {
              const m = rewardMeta[r];
              const active = reward === r;
              return (
                <Pressable
                  key={r}
                  onPress={() => setReward(r)}
                  className="flex-row items-center gap-3 rounded-xl p-3"
                  style={{
                    backgroundColor: active ? colors.indigoSoft : colors.card,
                    borderWidth: 1.5,
                    borderColor: active ? colors.indigo : colors.line,
                  }}
                >
                  <Icon name={m.icon} size={16} color={active ? colors.indigo : colors.slate} />
                  <Text
                    className="flex-1 font-body-medium text-[14px]"
                    style={{ color: active ? colors.indigoInk : colors.ink }}
                  >
                    {m.label}
                  </Text>
                  {active && <Icon name="check" size={16} color={colors.indigo} />}
                </Pressable>
              );
            })}
          </View>
          <Text className="font-body text-[12px]" style={{ color: colors.slate }}>
            Held in escrow and released to each tester only when they complete the 14-day cycle.
          </Text>
        </View>

        <View
          className="flex-row items-center gap-2 rounded-xl p-3"
          style={{ backgroundColor: colors.indigoSoft }}
        >
          <Icon name="info" size={15} color={colors.indigoInk} />
          <Text className="flex-1 font-body text-[12.5px]" style={{ color: colors.indigoInk }}>
            This creates a draft. You'll set the tester target and start date when you publish.
          </Text>
        </View>

        {formError && (
          <Text className="font-body text-[13px]" style={{ color: colors.danger }}>
            {formError}
          </Text>
        )}
        <PrimaryButton
          label="Create draft app"
          variant="accent"
          icon="plus"
          onPress={onSubmit}
          loading={submit.isPending}
        />
      </FormScroll>
    </SafeAreaView>
  );
}
