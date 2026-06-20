import { Text, View } from "react-native";
import { colors } from "@/theme/tokens";
import { AppLogo } from "@/components/AppLogo";
import { Icon } from "@/components/Icon";

/**
 * Quiet, asset-free onboarding illustrations — neutral surfaces, hairline borders,
 * one indigo accent. Reinforces: matching → the 14-day cycle → earning badges.
 */

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <View
      className="items-center justify-center rounded-[28px]"
      style={{
        width: 232,
        height: 232,
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.line,
      }}
    >
      {children}
    </View>
  );
}

export function MatchArt() {
  return (
    <Frame>
      <View className="items-center gap-4">
        <View className="flex-row items-center gap-3">
          <AppLogo name="SiteSync" size={52} />
          <View
            className="h-8 w-8 items-center justify-center rounded-full"
            style={{ backgroundColor: colors.indigoSoft }}
          >
            <Icon name="link-2" size={15} color={colors.indigo} />
          </View>
          <AppLogo name="PunchList Pro" size={52} />
        </View>
        <Text className="font-body text-[12.5px]" style={{ color: colors.slate }}>
          matched to your field
        </Text>
      </View>
    </Frame>
  );
}

export function CycleArt() {
  return (
    <Frame>
      <View
        className="h-[140px] w-[140px] items-center justify-center rounded-full"
        style={{ borderWidth: 10, borderColor: colors.sand }}
      >
        <View
          className="absolute h-[140px] w-[140px] rounded-full"
          style={{
            borderWidth: 10,
            borderColor: colors.ink,
            borderRightColor: "transparent",
            borderBottomColor: "transparent",
            transform: [{ rotate: "45deg" }],
          }}
        />
        <Text
          className="font-display text-[44px]"
          style={{ color: colors.ink, letterSpacing: -1 }}
        >
          14
        </Text>
        <Text className="font-body text-[11px]" style={{ color: colors.slate }}>
          day cycle
        </Text>
      </View>
    </Frame>
  );
}

export function BadgeArt() {
  return (
    <Frame>
      <View className="items-center gap-4">
        <View
          className="h-20 w-20 items-center justify-center rounded-3xl"
          style={{ backgroundColor: colors.indigoSoft }}
        >
          <Icon name="award" size={36} color={colors.indigo} />
        </View>
        <View className="flex-row gap-2">
          {["Verified", "Senior", "Expert"].map((t, i) => (
            <View
              key={t}
              className="rounded-md px-2.5 py-1"
              style={{ backgroundColor: i === 2 ? colors.positiveSoft : colors.sand }}
            >
              <Text
                className="font-body-medium text-[11px]"
                style={{ color: i === 2 ? colors.positive : colors.slate }}
              >
                {t}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </Frame>
  );
}
