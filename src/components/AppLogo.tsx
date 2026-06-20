import { Text, View } from "react-native";
import { colors } from "@/theme/tokens";

/**
 * Monochrome monogram tile — neutral surface, ink initials, hairline border.
 * Deliberately quiet (premium-minimal); the app name carries the identity.
 */
function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function AppLogo({ name, size = 48 }: { name: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.26,
        backgroundColor: colors.sand,
        borderWidth: 1,
        borderColor: colors.line,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text
        className="font-display"
        style={{ color: colors.ink, fontSize: size * 0.34, letterSpacing: -0.5 }}
      >
        {initials(name)}
      </Text>
    </View>
  );
}
