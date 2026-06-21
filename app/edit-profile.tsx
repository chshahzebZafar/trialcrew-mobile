import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useProfile, useUpdateProfile } from "@/api/hooks";
import { apiErrorMessage } from "@/api/config";
import { VERTICALS } from "@/lib/verticals";
import { colors } from "@/theme/tokens";
import { TextField } from "@/components/TextField";
import { FormScroll } from "@/components/FormScroll";
import { PrimaryButton } from "@/components/PrimaryButton";
import { PressableScale } from "@/components/PressableScale";
import { Icon } from "@/components/Icon";

function Chip({ label, active, onPress, check }: { label: string; active: boolean; onPress: () => void; check?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center gap-1.5 rounded-xl px-3.5 py-2"
      style={{ backgroundColor: active ? colors.indigoSoft : colors.card, borderWidth: 1.5, borderColor: active ? colors.indigo : colors.line }}
    >
      {check && active && <Icon name="check" size={13} color={colors.indigo} />}
      <Text className="font-body-medium text-[13px]" style={{ color: active ? colors.indigoInk : colors.ink }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function EditProfile() {
  const router = useRouter();
  const { data: profile } = useProfile();
  const update = useUpdateProfile();

  const [name, setName] = useState(profile?.name ?? "");
  const [vertical, setVertical] = useState(profile?.vertical ?? "");
  const [interests, setInterests] = useState<string[]>(profile?.categories ?? []);
  const [bio, setBio] = useState(profile?.bio ?? "");
  const [error, setError] = useState<string | null>(null);

  const toggleInterest = (v: string) =>
    setInterests((cur) => (cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v]));

  const save = async () => {
    if (name.trim().length < 2) return setError("Enter your name");
    if (!vertical) return setError("Pick your primary field");
    setError(null);
    try {
      await update.mutateAsync({ name: name.trim(), vertical, categories: interests, bio: bio.trim() || undefined });
      router.back();
    } catch (e) {
      setError(apiErrorMessage(e, "Couldn't save your profile. Try again."));
    }
  };

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View className="flex-row items-center px-5 pb-1 pt-2">
        <PressableScale onPress={() => router.back()}>
          <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.line }}>
            <Icon name="arrow-left" size={20} color={colors.ink} />
          </View>
        </PressableScale>
      </View>
      <FormScroll backgroundColor={colors.bg} contentContainerStyle={{ padding: 20, paddingTop: 8, gap: 22, paddingBottom: 40 }}>
        <View className="gap-1.5">
          <Text className="font-display text-[24px]" style={{ color: colors.ink, letterSpacing: -0.6 }}>Edit profile</Text>
          <Text className="font-body text-[14px] leading-[20px]" style={{ color: colors.slate }}>
            Your field and interests power the apps we match you with.
          </Text>
        </View>

        <TextField label="Name" placeholder="Your name" value={name} onChangeText={setName} />

        <View className="gap-2.5">
          <Text className="font-body-medium text-[13px]" style={{ color: colors.slate }}>Your primary field</Text>
          <View className="flex-row flex-wrap gap-2">
            {VERTICALS.map((v) => (
              <Chip key={v} label={v} active={vertical === v} onPress={() => setVertical(v)} />
            ))}
          </View>
        </View>

        <View className="gap-2.5">
          <Text className="font-body-medium text-[13px]" style={{ color: colors.slate }}>Interests — fields you want to test</Text>
          <View className="flex-row flex-wrap gap-2">
            {VERTICALS.map((v) => (
              <Chip key={v} label={v} active={interests.includes(v)} onPress={() => toggleInterest(v)} check />
            ))}
          </View>
        </View>

        <TextField label="Bio (optional)" placeholder="A line about your testing experience" value={bio} onChangeText={setBio} />

        {error && <Text className="font-body text-[13px]" style={{ color: colors.danger }}>{error}</Text>}
        <PrimaryButton label="Save profile" variant="accent" icon="check" onPress={save} loading={update.isPending} />
      </FormScroll>
    </SafeAreaView>
  );
}
