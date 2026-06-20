import { Text, View, type ViewProps } from "react-native";
import { colors } from "@/theme/tokens";

/** Surface card — hairline border + soft modern shadow. */
export function Card({
  style,
  className,
  ...props
}: ViewProps & { className?: string }) {
  return (
    <View
      {...props}
      className={`rounded-[18px] bg-card ${className ?? ""}`}
      style={[
        {
          borderWidth: 1,
          borderColor: colors.line,
          shadowColor: "#1C1917",
          shadowOpacity: 0.05,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: 6 },
          elevation: 2,
        },
        style,
      ]}
    />
  );
}

/** Quiet chip — subtle fill, sentence case by default. */
export function Chip({
  label,
  bg = colors.sand,
  fg = colors.slate,
  icon,
}: {
  label: string;
  bg?: string;
  fg?: string;
  icon?: React.ReactNode;
}) {
  return (
    <View
      className="flex-row items-center gap-1.5 self-start rounded-lg px-2.5 py-1"
      style={{ backgroundColor: bg }}
    >
      {icon}
      <Text
        className="font-body-medium text-[12px]"
        style={{ color: fg, letterSpacing: -0.1 }}
      >
        {label}
      </Text>
    </View>
  );
}

/** Small uppercase kicker — used sparingly. */
export function Eyebrow({ children }: { children: string }) {
  return (
    <Text
      className="font-body-medium text-[11px] uppercase"
      style={{ color: colors.slateLight, letterSpacing: 1 }}
    >
      {children}
    </Text>
  );
}

/** Hairline divider. */
export function Divider() {
  return <View style={{ height: 1, backgroundColor: colors.line }} />;
}
