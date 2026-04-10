import { StyleSheet, Text, View } from "react-native";

import { colors, radius } from "@/theme/theme";

type Props = {
  label: string;
  tone?: "default" | "accent" | "success";
};

export function Pill({ label, tone = "default" }: Props) {
  return (
    <View style={[styles.root, tone === "accent" && styles.accent, tone === "success" && styles.success]}>
      <Text style={[styles.text, tone !== "default" && styles.strongText]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  accent: {
    backgroundColor: colors.accentSoft
  },
  success: {
    backgroundColor: "#DCEEE5"
  },
  text: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "600"
  },
  strongText: {
    color: colors.text
  }
});
