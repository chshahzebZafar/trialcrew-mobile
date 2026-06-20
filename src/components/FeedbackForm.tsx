import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { colors } from "@/theme/tokens";
import type { Feedback, FeedbackQuestion } from "@/types";
import { PrimaryButton } from "./PrimaryButton";

/**
 * Structured feedback form built from the fixed question set. Validates that every
 * question is answered before submit. One submission per cycle.
 */
export function FeedbackForm({
  questions,
  onSubmit,
  submitting = false,
}: {
  questions: FeedbackQuestion[];
  onSubmit: (answers: Feedback["answers"]) => void;
  submitting?: boolean;
}) {
  const [answers, setAnswers] = useState<Feedback["answers"]>({});

  const setAnswer = (id: string, value: string | number | boolean) =>
    setAnswers((prev) => ({ ...prev, [id]: value }));

  const complete = questions.every((q) => answers[q.id] !== undefined);

  return (
    <View className="gap-5">
      {questions.map((q) => (
        <View key={q.id} className="gap-2">
          <Text
            className="font-inter-medium text-[14px]"
            style={{ color: colors.ink }}
          >
            {q.prompt}
          </Text>
          {q.type === "text" && (
            <TextInput
              multiline
              placeholder="Your answer…"
              placeholderTextColor={colors.slate}
              value={(answers[q.id] as string) ?? ""}
              onChangeText={(t) => setAnswer(q.id, t)}
              className="min-h-[72px] rounded-[10px] bg-white p-3 font-body text-[14px]"
              style={{
                color: colors.ink,
                borderWidth: 1,
                borderColor: colors.line,
                textAlignVertical: "top",
              }}
            />
          )}
          {q.type === "rating" && (
            <View className="flex-row gap-2">
              {[1, 2, 3, 4, 5].map((n) => {
                const selected = answers[q.id] === n;
                return (
                  <Pressable
                    key={n}
                    onPress={() => setAnswer(q.id, n)}
                    className="h-11 w-11 items-center justify-center rounded-[10px]"
                    style={{
                      backgroundColor: selected ? colors.ink : colors.sand,
                      borderWidth: 1,
                      borderColor: selected ? colors.ink : colors.line,
                    }}
                  >
                    <Text
                      className="font-body-medium text-[14px]"
                      style={{ color: selected ? colors.white : colors.slate }}
                    >
                      {n}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
          {q.type === "boolean" && (
            <View className="flex-row gap-2">
              {[
                { label: "Yes", value: true },
                { label: "No", value: false },
              ].map((opt) => {
                const selected = answers[q.id] === opt.value;
                return (
                  <Pressable
                    key={opt.label}
                    onPress={() => setAnswer(q.id, opt.value)}
                    className="h-11 flex-1 items-center justify-center rounded-[10px]"
                    style={{
                      backgroundColor: selected ? colors.ink : colors.sand,
                      borderWidth: 1,
                      borderColor: selected ? colors.ink : colors.line,
                    }}
                  >
                    <Text
                      className="font-body-medium text-[14px]"
                      style={{ color: selected ? colors.white : colors.slate }}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      ))}

      <PrimaryButton
        label="Submit feedback"
        variant="accent"
        onPress={() => onSubmit(answers)}
        disabled={!complete}
        loading={submitting}
      />
      {!complete && (
        <Text
          className="text-center font-inter text-[12px]"
          style={{ color: colors.slate }}
        >
          Answer every question to submit.
        </Text>
      )}
    </View>
  );
}
