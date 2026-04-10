import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/theme/theme";

type Props = {
  label: string;
  value: string;
};

export function StatRow({ label, value }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm
  },
  label: {
    color: colors.muted,
    fontSize: 15
  },
  value: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  }
});
