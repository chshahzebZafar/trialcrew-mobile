import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { useBroadcastReplies, usePostReply } from "@/api/hooks";
import { colors } from "@/theme/tokens";
import type { Broadcast, Role } from "@/types";
import { Card } from "./ui";
import { Icon } from "./Icon";
import { PrimaryButton } from "./PrimaryButton";

function ago(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/** A founder broadcast + its two-way reply thread. Shared by founder & tester. */
export function BroadcastThread({
  broadcast,
  viewerRole,
  viewerName,
}: {
  broadcast: Broadcast;
  viewerRole: Role;
  viewerName: string;
}) {
  const { data: replies } = useBroadcastReplies(broadcast.id);
  const post = usePostReply(broadcast.id);
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");

  const count = replies?.length ?? 0;

  const send = () => {
    if (text.trim().length < 1) return;
    post.mutate(
      { authorName: viewerName, authorRole: viewerRole, message: text },
      { onSuccess: () => setText("") },
    );
  };

  return (
    <Card className="gap-3 p-4">
      {/* Broadcast */}
      <View className="flex-row items-center gap-2">
        <Icon name="radio" size={13} color={colors.indigo} />
        <Text className="font-mono text-[11px]" style={{ color: colors.slate }}>
          {viewerRole === "FOUNDER" ? `Sent ${ago(broadcast.sentAt)} · all testers` : `Team · ${ago(broadcast.sentAt)}`}
        </Text>
      </View>
      <Text className="font-body text-[13.5px] leading-[20px]" style={{ color: colors.ink }}>
        {broadcast.message}
      </Text>

      {/* Replies toggle */}
      <Pressable onPress={() => setOpen((o) => !o)} className="flex-row items-center gap-1.5 pt-1">
        <Icon name="message-circle" size={13} color={colors.indigo} />
        <Text className="font-body-medium text-[12.5px]" style={{ color: colors.indigo }}>
          {count > 0 ? `${count} ${count === 1 ? "reply" : "replies"}` : "Reply"}
        </Text>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={14} color={colors.indigo} />
      </Pressable>

      {open && (
        <View className="gap-3">
          {(replies ?? []).map((r) => {
            const mine = r.authorRole === viewerRole;
            const isFounder = r.authorRole === "FOUNDER";
            return (
              <View
                key={r.id}
                className="gap-1 rounded-xl p-3"
                style={{
                  backgroundColor: mine ? colors.indigoSoft : colors.bg,
                  borderWidth: 1,
                  borderColor: mine ? colors.indigoSoft : colors.line,
                }}
              >
                <View className="flex-row items-center gap-2">
                  <Text className="font-body-semibold text-[12.5px]" style={{ color: colors.ink }}>
                    {r.authorName}
                  </Text>
                  <View
                    className="rounded px-1.5 py-0.5"
                    style={{ backgroundColor: isFounder ? colors.ink : colors.sand }}
                  >
                    <Text
                      className="font-mono text-[9px] uppercase"
                      style={{ color: isFounder ? colors.white : colors.slate, letterSpacing: 0.5 }}
                    >
                      {isFounder ? "Founder" : "Tester"}
                    </Text>
                  </View>
                  <Text className="font-mono text-[10px]" style={{ color: colors.slateLight }}>
                    {ago(r.sentAt)}
                  </Text>
                </View>
                <Text className="font-body text-[13px] leading-[19px]" style={{ color: colors.inkSoft }}>
                  {r.message}
                </Text>
              </View>
            );
          })}

          {/* Composer */}
          <View className="gap-2">
            <TextInput
              value={text}
              onChangeText={setText}
              multiline
              placeholder={viewerRole === "FOUNDER" ? "Reply to the cohort…" : "Reply to the team…"}
              placeholderTextColor={colors.slate}
              className="min-h-[44px] rounded-[10px] bg-bg p-3 font-body text-[13.5px]"
              style={{ color: colors.ink, borderWidth: 1, borderColor: colors.line, textAlignVertical: "top" }}
            />
            <PrimaryButton
              label="Send reply"
              icon="corner-up-left"
              disabled={text.trim().length < 1}
              loading={post.isPending}
              onPress={send}
            />
          </View>
        </View>
      )}
    </Card>
  );
}
