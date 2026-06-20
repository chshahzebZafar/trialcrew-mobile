import { Text, View } from "react-native";
import { cycleStatusMeta, checkInStatusMeta } from "@/theme/tokens";
import type { CheckInStatus, CycleStatus } from "@/types";

function Pill({ bg, fg, label }: { bg: string; fg: string; label: string }) {
  return (
    <View
      className="self-start rounded-md px-2 py-1"
      style={{ backgroundColor: bg }}
    >
      <Text
        className="font-body-medium text-[11.5px]"
        style={{ color: fg, letterSpacing: -0.1 }}
      >
        {label}
      </Text>
    </View>
  );
}

export function CycleStatusPill({ status }: { status: CycleStatus }) {
  const meta = cycleStatusMeta[status];
  return <Pill bg={meta.bg} fg={meta.fg} label={meta.label} />;
}

export function CheckInStatusPill({ status }: { status: CheckInStatus }) {
  const meta = checkInStatusMeta[status];
  return <Pill bg={meta.bg} fg={meta.fg} label={meta.label} />;
}
