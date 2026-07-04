import { TextInput as RNTextInput, StyleSheet, type TextInputProps } from "react-native";

import { useI18n } from "@/context/LanguageContext";

// Inter has NO Arabic glyphs, so any input that pins an Inter weight renders
// Arabic as broken, disconnected letters ("حروف مش كلام"). Swap to the matching
// Cairo weight in Arabic — the same contract AppText uses for <Text>.
const INTER_TO_CAIRO: Record<string, string> = {
  Inter_400Regular: "Cairo_400Regular",
  Inter_500Medium: "Cairo_500Medium",
  Inter_600SemiBold: "Cairo_600SemiBold",
  Inter_700Bold: "Cairo_700Bold",
};

/**
 * Drop-in replacement for react-native's <TextInput>. In Arabic it swaps the
 * Inter font family for the matching Cairo weight and sets RTL writing
 * direction, so typed Arabic shapes correctly. In English it renders untouched.
 */
export function AppTextInput({ style, ...props }: TextInputProps) {
  const { isRTL } = useI18n();
  if (!isRTL) {
    return <RNTextInput style={style} {...props} />;
  }
  const flat = (StyleSheet.flatten(style) || {}) as { fontFamily?: string };
  const family = flat.fontFamily;
  const mapped = family ? INTER_TO_CAIRO[family] ?? family : "Cairo_400Regular";
  return (
    <RNTextInput
      style={[style, { fontFamily: mapped, writingDirection: "rtl" }]}
      {...props}
    />
  );
}
