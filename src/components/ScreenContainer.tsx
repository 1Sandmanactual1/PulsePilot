import { PropsWithChildren } from "react";
import { SafeAreaView, ScrollView, StyleSheet, View } from "react-native";

import { colors, spacing } from "@/theme/theme";

type Props = PropsWithChildren<{
  padded?: boolean;
}>;

export function ScreenContainer({ children, padded = true }: Props) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={[styles.content, padded && styles.padded]}>
        <View style={styles.inner}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  content: {
    flexGrow: 1
  },
  padded: {
    paddingVertical: spacing.lg
  },
  inner: {
    gap: spacing.md,
    paddingHorizontal: spacing.md
  }
});
