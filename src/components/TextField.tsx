import { useState } from "react";
import {
  Pressable,
  Text,
  TextInput,
  type TextInputProps,
  View,
} from "react-native";
import { colors } from "@/theme/tokens";

/** Labeled text input with focus ring + optional password reveal. */
export function TextField({
  label,
  secure = false,
  error,
  ...props
}: {
  label: string;
  secure?: boolean;
  error?: string;
} & TextInputProps) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(secure);

  return (
    <View className="gap-1.5">
      <Text
        className="font-inter-medium text-[13px]"
        style={{ color: colors.slate }}
      >
        {label}
      </Text>
      <View
        className="h-12 flex-row items-center rounded-xl bg-white px-3"
        style={{
          borderWidth: 1.5,
          borderColor: error
            ? colors.clay
            : focused
              ? colors.indigo
              : colors.line,
        }}
      >
        <TextInput
          {...props}
          secureTextEntry={hidden}
          onFocus={(e) => {
            setFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            props.onBlur?.(e);
          }}
          placeholderTextColor={colors.slate}
          className="flex-1 font-inter text-[15px]"
          style={{ color: colors.ink }}
        />
        {secure && (
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={10}>
            <Text
              className="font-mono text-[11px] uppercase"
              style={{ color: colors.indigo }}
            >
              {hidden ? "Show" : "Hide"}
            </Text>
          </Pressable>
        )}
      </View>
      {error && (
        <Text className="font-inter text-[12px]" style={{ color: "#B4262C" }}>
          {error}
        </Text>
      )}
    </View>
  );
}
