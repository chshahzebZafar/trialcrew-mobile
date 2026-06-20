import { useState } from "react";
import { Pressable, Switch, Text, View } from "react-native";
import { useReminderStore } from "@/stores/reminderStore";
import { colors } from "@/theme/tokens";
import { Card } from "./ui";
import { Icon } from "./Icon";

const TIMES = [
  { label: "9:00 AM", hour: 9, minute: 0 },
  { label: "1:00 PM", hour: 13, minute: 0 },
  { label: "7:00 PM", hour: 19, minute: 0 },
];

/** Daily check-in reminder — real local notification scheduling. */
export function RemindersCard() {
  const { enabled, hour, minute, enable, setTime, disable } = useReminderStore();
  const [denied, setDenied] = useState(false);

  const onToggle = async (on: boolean) => {
    setDenied(false);
    if (on) {
      const ok = await enable(hour, minute);
      if (!ok) setDenied(true);
    } else {
      await disable();
    }
  };

  return (
    <Card className="gap-3 p-5">
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.indigoSoft }}
        >
          <Icon name="bell" size={17} color={colors.indigo} />
        </View>
        <View className="flex-1">
          <Text className="font-body-semibold text-[14px]" style={{ color: colors.ink }}>
            Daily check-in reminder
          </Text>
          <Text className="font-body text-[12.5px]" style={{ color: colors.slate }}>
            A nudge to confirm you used the app today.
          </Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={onToggle}
          trackColor={{ false: colors.lineStrong, true: colors.indigo }}
          thumbColor={colors.white}
        />
      </View>

      {enabled && (
        <View className="flex-row gap-2 pt-1">
          {TIMES.map((t) => {
            const active = hour === t.hour && minute === t.minute;
            return (
              <Pressable
                key={t.label}
                onPress={() => setTime(t.hour, t.minute)}
                className="flex-1 items-center rounded-xl py-2.5"
                style={{
                  backgroundColor: active ? colors.ink : colors.sand,
                  borderWidth: 1,
                  borderColor: active ? colors.ink : colors.line,
                }}
              >
                <Text
                  className="font-body-medium text-[13px]"
                  style={{ color: active ? colors.white : colors.slate }}
                >
                  {t.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      )}

      {denied && (
        <Text className="font-body text-[12px]" style={{ color: colors.danger }}>
          Notifications are blocked. Enable them for TrialCrew in your device settings.
        </Text>
      )}
    </Card>
  );
}
