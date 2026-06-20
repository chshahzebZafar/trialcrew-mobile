import { Text, View } from "react-native";
import { colors } from "@/theme/tokens";

/** Minimal brand lockup for the auth screens. */
export function AuthBrand({ tagline }: { tagline: string }) {
  return (
    <View className="gap-5">
      <View className="flex-row items-center gap-2.5">
        <View
          className="h-9 w-9 items-center justify-center rounded-[10px]"
          style={{ backgroundColor: colors.ink }}
        >
          <View
            className="h-3.5 w-3.5 rounded-[4px]"
            style={{ backgroundColor: colors.white }}
          />
        </View>
        <Text
          className="font-display text-[20px]"
          style={{ color: colors.ink, letterSpacing: -0.5 }}
        >
          TrialCrew
        </Text>
      </View>
      <Text
        className="font-display text-[28px]"
        style={{ color: colors.ink, letterSpacing: -0.8, lineHeight: 33 }}
      >
        {tagline}
      </Text>
    </View>
  );
}
