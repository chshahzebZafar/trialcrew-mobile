import { useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  Text,
  useWindowDimensions,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useOnboarding } from "@/lib/onboarding";
import { colors } from "@/theme/tokens";
import { PrimaryButton } from "@/components/PrimaryButton";
import {
  MatchArt,
  CycleArt,
  BadgeArt,
} from "@/components/OnboardingArt";

const slides = [
  {
    key: "match",
    Art: MatchArt,
    title: "Matched to your field",
    body: "We pair you with apps built for your industry — so every test you run is work you actually understand.",
  },
  {
    key: "cycle",
    Art: CycleArt,
    title: "Real 14-day cycles",
    body: "Run genuine Google Play closed tests on your own clock. Quick check-ins keep your cycle on track — no busywork.",
  },
  {
    key: "badge",
    Art: BadgeArt,
    title: "Build a verified reputation",
    body: "Finish cycles, leave structured feedback, and climb from Verified to Expert with a public portfolio.",
  },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const router = useRouter();
  const { complete } = useOnboarding();
  const listRef = useRef<FlatList>(null);
  const [index, setIndex] = useState(0);

  const isLast = index === slides.length - 1;

  const finish = async () => {
    await complete();
    router.replace("/(auth)/sign-in");
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== index) setIndex(i);
  };

  const next = () => {
    if (isLast) return finish();
    const ni = index + 1;
    setIndex(ni); // update dots/CTA immediately, don't wait for the scroll event
    listRef.current?.scrollToIndex({ index: ni, animated: true });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.porcelain }}>
      {/* Skip */}
      <View className="flex-row justify-end px-5 pt-2">
        <Pressable onPress={finish} hitSlop={10} disabled={isLast}>
          <Text
            className="font-inter-medium text-[14px]"
            style={{ color: isLast ? "transparent" : colors.slate }}
          >
            Skip
          </Text>
        </Pressable>
      </View>

      <FlatList
        ref={listRef}
        data={slides}
        keyExtractor={(s) => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
        renderItem={({ item }) => (
          <View style={{ width }} className="flex-1 items-center px-8 pt-6">
            <View className="flex-1 items-center justify-center">
              <item.Art />
            </View>
            <View className="gap-3 pb-4">
              <Text
                className="text-center font-display text-[28px]"
                style={{ color: colors.ink, letterSpacing: -0.8, lineHeight: 32 }}
              >
                {item.title}
              </Text>
              <Text
                className="text-center font-body text-[15px]"
                style={{ color: colors.slate, lineHeight: 22 }}
              >
                {item.body}
              </Text>
            </View>
          </View>
        )}
      />

      {/* Dots */}
      <View className="flex-row justify-center gap-2 py-4">
        {slides.map((s, i) => (
          <View
            key={s.key}
            className="h-1.5 rounded-full"
            style={{
              width: i === index ? 20 : 6,
              backgroundColor: i === index ? colors.ink : colors.lineStrong,
            }}
          />
        ))}
      </View>

      <View className="gap-3 px-6 pb-8">
        <PrimaryButton
          label={isLast ? "Get started" : "Next"}
          variant={isLast ? "accent" : "primary"}
          onPress={next}
        />
      </View>
    </SafeAreaView>
  );
}
