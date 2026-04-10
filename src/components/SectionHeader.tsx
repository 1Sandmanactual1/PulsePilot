import { StyleSheet, Text, View } from "react-native";

import { colors, spacing } from "@/theme/theme";

type Props = {
  eyebrow: string;
  title: string;
  description?: string;
};

export function SectionHeader({ eyebrow, title, description }: Props) {
  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {description ? <Text style={styles.description}>{description}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 6
  },
  eyebrow: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.6,
    textTransform: "uppercase"
  },
  title: {
    color: colors.text,
    fontSize: 30,
    fontWeight: "800"
  },
  description: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  }
});
