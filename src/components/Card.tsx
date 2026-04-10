import { PropsWithChildren } from "react";
import { Platform, StyleSheet, View, ViewStyle } from "react-native";

import { colors, radius, spacing } from "@/theme/theme";

type Props = PropsWithChildren<{
  style?: ViewStyle;
}>;

export function Card({ children, style }: Props) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    boxShadow: Platform.OS === "web" ? "0px 10px 20px rgba(35, 23, 15, 0.10)" : undefined,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
    shadowColor: Platform.OS === "web" ? undefined : colors.shadow,
    shadowOffset: Platform.OS === "web" ? undefined : { width: 0, height: 10 },
    shadowOpacity: Platform.OS === "web" ? undefined : 1,
    shadowRadius: Platform.OS === "web" ? undefined : 20,
    elevation: 2
  }
});
