import { type ReactNode } from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors } from "@/theme/tokens";

/** Standard porcelain screen wrapper with an optional title/subtitle header. */
export function Screen({
  title,
  subtitle,
  children,
  edges = ["top"],
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  edges?: ("top" | "bottom" | "left" | "right")[];
}) {
  return (
    <SafeAreaView
      edges={edges}
      style={{ flex: 1, backgroundColor: colors.porcelain }}
    >
      {title && (
        <View className="px-5 pb-2 pt-2">
          <Text className="font-sora-bold text-2xl" style={{ color: colors.ink }}>
            {title}
          </Text>
          {subtitle && (
            <Text
              className="mt-0.5 font-inter text-[13px]"
              style={{ color: colors.slate }}
            >
              {subtitle}
            </Text>
          )}
        </View>
      )}
      {children}
    </SafeAreaView>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <View className="items-center justify-center px-8 py-16">
      <Text
        className="text-center font-inter text-[14px]"
        style={{ color: colors.slate }}
      >
        {message}
      </Text>
    </View>
  );
}
