import { Text, View } from "react-native";
import { colors } from "@/theme/tokens";
import type { Campaign } from "@/types";
import { AppLogo } from "./AppLogo";
import { PrimaryButton } from "./PrimaryButton";
import { Card, Divider } from "./ui";
import { Icon, type IconName } from "./Icon";

const reward: Record<
  Campaign["rewardType"],
  { label: string; icon: IconName }
> = {
  PREMIUM_ACCESS: { label: "Premium", icon: "star" },
  CREDITS: { label: "Credits", icon: "zap" },
  STIPEND: { label: "Stipend", icon: "dollar-sign" },
};

/** A matched-but-not-opted-in app on the dashboard. */
export function CampaignCard({
  campaign,
  onOptIn,
  optingIn = false,
}: {
  campaign: Campaign;
  onOptIn: () => void;
  optingIn?: boolean;
}) {
  const spotsLeft = Math.max(0, campaign.testersNeeded - campaign.testersMatched);
  const pct = Math.min(
    100,
    Math.round((campaign.testersMatched / campaign.testersNeeded) * 100),
  );
  const r = reward[campaign.rewardType];

  return (
    <Card className="gap-4 p-5">
      {/* Header */}
      <View className="flex-row items-center gap-3">
        <AppLogo name={campaign.appName} size={46} />
        <View className="flex-1">
          <Text
            className="font-display text-[16px]"
            style={{ color: colors.ink, letterSpacing: -0.3 }}
          >
            {campaign.appName}
          </Text>
          <Text className="font-body text-[13px]" style={{ color: colors.slate }}>
            {campaign.vertical}
          </Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <Icon name={r.icon} size={13} color={colors.slateLight} />
          <Text className="font-body text-[12.5px]" style={{ color: colors.slate }}>
            {r.label}
          </Text>
        </View>
      </View>

      {campaign.description && (
        <Text
          className="font-body text-[14px] leading-[21px]"
          style={{ color: colors.inkSoft }}
          numberOfLines={2}
        >
          {campaign.description}
        </Text>
      )}

      <Divider />

      {/* Meta */}
      <View className="gap-2.5">
        <View className="flex-row items-center justify-between">
          <Text className="font-body text-[13px]" style={{ color: colors.slate }}>
            Focus · {campaign.feedbackFocus}
          </Text>
        </View>
        <View className="flex-row items-center gap-3">
          <View
            className="h-1 flex-1 overflow-hidden rounded-full"
            style={{ backgroundColor: colors.sand }}
          >
            <View
              className="h-full rounded-full"
              style={{ width: `${pct}%`, backgroundColor: colors.indigo }}
            />
          </View>
          <Text
            className="font-body-medium text-[12px]"
            style={{ color: colors.slate }}
          >
            {spotsLeft === 0 ? "Full" : `${spotsLeft} left`}
          </Text>
        </View>
      </View>

      <PrimaryButton
        label="Opt in"
        variant="accent"
        onPress={onOptIn}
        loading={optingIn}
        disabled={spotsLeft === 0}
      />
    </Card>
  );
}
