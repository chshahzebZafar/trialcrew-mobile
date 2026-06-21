import { type ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, View, type ScrollViewProps, type StyleProp, type ViewStyle } from "react-native";

const isIOS = Platform.OS === "ios";

/**
 * Premium keyboard-aware scroll for any screen with text inputs.
 *  - iOS: native `automaticallyAdjustKeyboardInsets` — smooth, no jank, scrolls the focused
 *    field into view automatically.
 *  - Android: `KeyboardAvoidingView` height (works with the default adjustResize).
 *  - Both: drag-to-dismiss the keyboard (`keyboardDismissMode="interactive"`) and taps pass
 *    through to buttons while the keyboard is open (`keyboardShouldPersistTaps="handled"`).
 * No native modules → works in Expo Go.
 */
export function FormScroll({
  children,
  contentContainerStyle,
  backgroundColor,
  keyboardVerticalOffset = 0,
  refreshControl,
}: {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  backgroundColor?: string;
  keyboardVerticalOffset?: number;
  refreshControl?: ScrollViewProps["refreshControl"];
}) {
  const scroll = (
    <ScrollView
      contentContainerStyle={contentContainerStyle}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      automaticallyAdjustKeyboardInsets={isIOS}
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      {children}
    </ScrollView>
  );

  return isIOS ? (
    <View style={{ flex: 1, backgroundColor }}>{scroll}</View>
  ) : (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor }} behavior="height" keyboardVerticalOffset={keyboardVerticalOffset}>
      {scroll}
    </KeyboardAvoidingView>
  );
}
