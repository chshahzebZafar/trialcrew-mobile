import Feather from "@expo/vector-icons/Feather";
import { colors } from "@/theme/tokens";

export type IconName = React.ComponentProps<typeof Feather>["name"];

/** Thin wrapper over Feather so screens use one consistent icon set + sizing. */
export function Icon({
  name,
  size = 18,
  color = colors.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Feather name={name} size={size} color={color} />;
}
