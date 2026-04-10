import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { StatRow } from "@/components/StatRow";
import { useAppState } from "@/providers/AppStateProvider";
import { colors, spacing } from "@/theme/theme";

const prepPlan = [
  ["Chicken breast", "49 oz for week"],
  ["Cooked rice", "14 cups for week"],
  ["Greek yogurt", "7 servings"],
  ["Eggs", "18 count"],
  ["Oats", "7 cups dry"],
  ["Blueberries", "4 pints"]
];

export default function NutritionScreen() {
  const { nutrition, profile } = useAppState();

  return (
    <ScreenContainer>
      <SectionHeader
        eyebrow="Nutrition"
        title="Meal prep around your real foods"
        description="MyFitnessPal data feeds calories, protein, weight trend, and the weekly prep guidance."
      />

      <Card>
        <Text style={styles.cardTitle}>Daily target for {profile.goal.replace("-", " ")}</Text>
        <StatRow label="Calories" value={`${nutrition.caloriesConsumed} / ${nutrition.caloriesTarget}`} />
        <StatRow label="Protein" value={`${nutrition.proteinGrams} g`} />
        <StatRow label="Carbs" value={`${nutrition.carbsGrams} g`} />
        <StatRow label="Fat" value={`${nutrition.fatGrams} g`} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Weekly prep plan</Text>
        {prepPlan.map(([label, value]) => (
          <View key={label} style={styles.row}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value}</Text>
          </View>
        ))}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  row: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.sm
  },
  label: {
    color: colors.muted,
    fontSize: 14
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  }
});
