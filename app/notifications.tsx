import { useEffect } from "react";
import { FlatList, Text, View } from "react-native";
import { useMarkNotificationsRead, useNotifications } from "@/api/hooks";
import { colors } from "@/theme/tokens";
import { Card } from "@/components/ui";
import { Icon, type IconName } from "@/components/Icon";
import { EmptyState } from "@/components/Screen";
import { Entrance } from "@/components/Motion";
import type { NotificationKind } from "@/types";

const meta: Record<NotificationKind, { icon: IconName; bg: string; fg: string }> = {
  MATCH: { icon: "zap", bg: colors.indigoSoft, fg: colors.indigo },
  BROADCAST: { icon: "radio", bg: colors.indigoSoft, fg: colors.indigo },
  REMINDER: { icon: "bell", bg: colors.goldSoft, fg: colors.gold },
  REWARD: { icon: "gift", bg: colors.goldSoft, fg: colors.gold },
  SYSTEM: { icon: "info", bg: colors.sand, fg: colors.slate },
};

function ago(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function Notifications() {
  const { data: notifs, isLoading } = useNotifications();
  const markRead = useMarkNotificationsRead();

  // Mark everything read once when the screen opens.
  useEffect(() => {
    markRead.mutate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <FlatList
        data={notifs ?? []}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: 36 }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => {
          const m = meta[item.kind];
          return (
            <Entrance index={index}>
              <Card className="flex-row gap-3 p-4">
                <View
                  className="h-10 w-10 items-center justify-center rounded-2xl"
                  style={{ backgroundColor: m.bg }}
                >
                  <Icon name={m.icon} size={17} color={m.fg} />
                </View>
                <View className="flex-1 gap-0.5">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-body-semibold text-[14px]" style={{ color: colors.ink }}>
                      {item.title}
                    </Text>
                    <Text className="font-mono text-[10.5px]" style={{ color: colors.slateLight }}>
                      {ago(item.createdAt)}
                    </Text>
                  </View>
                  <Text className="font-body text-[13px] leading-[19px]" style={{ color: colors.slate }}>
                    {item.body}
                  </Text>
                </View>
                {!item.read && (
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: colors.danger, marginTop: 4 }} />
                )}
              </Card>
            </Entrance>
          );
        }}
        ListEmptyComponent={isLoading ? null : <EmptyState message="You're all caught up." />}
      />
    </View>
  );
}
