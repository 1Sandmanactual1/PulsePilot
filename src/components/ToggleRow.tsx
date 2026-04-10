import { Switch, StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/theme/theme";

type Props = {
  label: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
};

export function ToggleRow({ label, description, value, onValueChange }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.copy}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: colors.border, true: colors.accent }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between"
  },
  copy: {
    flex: 1,
    gap: 4
  },
  label: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  description: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19
  }
});
