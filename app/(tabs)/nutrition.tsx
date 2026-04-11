import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@/components/Card";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { useAppState } from "@/providers/AppStateProvider";
import { FitnessGoal, NutritionFoodEntry } from "@/types/domain";
import { colors, radius, spacing } from "@/theme/theme";
import { getGoalLabel, getNutritionTargetsForGoal } from "@/lib/coaching";

const goalOptions: FitnessGoal[] = [
  "strength",
  "hypertrophy",
  "endurance",
  "fatloss",
  "flexibility",
  "general-health"
];

type FoodForm = {
  name: string;
  meal: NutritionFoodEntry["meal"];
  calories: string;
  proteinGrams: string;
  carbsGrams: string;
  fatGrams: string;
};

const emptyForm: FoodForm = {
  name: "",
  meal: "breakfast",
  calories: "",
  proteinGrams: "",
  carbsGrams: "",
  fatGrams: ""
};

export default function NutritionScreen() {
  const { nutrition, profile, foodLog, dailyMealPlan, setGoal, addFoodLogEntry, removeFoodLogEntry } = useAppState();
  const [form, setForm] = useState<FoodForm>(emptyForm);
  const targets = useMemo(() => getNutritionTargetsForGoal(profile.goal, profile.currentWeightLb), [profile.goal, profile.currentWeightLb]);
  const prepPlan = useMemo(() => {
    const proteinItems = ["Chicken breast", "Greek yogurt", "Eggs"];
    const carbItems = ["Cooked rice", "Oats", "Blueberries"];
    return [
      ["Chicken breast", profile.goal === "fatloss" ? "42 oz for week" : "56 oz for week"],
      ["Cooked rice", profile.goal === "endurance" ? "16 cups for week" : "12 cups for week"],
      ["Greek yogurt", "7 servings"],
      ["Eggs", "18 count"],
      ["Oats", profile.goal === "hypertrophy" ? "9 cups dry" : "7 cups dry"],
      ["Blueberries", "4 pints"],
      ["Focus", `${proteinItems.join(", ")} + ${carbItems.join(", ")}`]
    ];
  }, [profile.goal]);

  async function handleAddFood() {
    if (!form.name.trim()) {
      return;
    }

    await addFoodLogEntry({
      name: form.name.trim(),
      meal: form.meal,
      calories: Number(form.calories) || 0,
      proteinGrams: Number(form.proteinGrams) || 0,
      carbsGrams: Number(form.carbsGrams) || 0,
      fatGrams: Number(form.fatGrams) || 0
    });
    setForm(emptyForm);
  }

  return (
    <ScreenContainer>
      <SectionHeader
        eyebrow="Nutrition"
        title="Goal-driven food tracking and planning"
        description="This should react to the goal you choose and to the foods you log in PulsePilot or eventually sync in from MyFitnessPal."
      />

      <Card>
        <Text style={styles.cardTitle}>Goal selection</Text>
        <Text style={styles.body}>Pick the main goal that should drive both eating recommendations and workout suggestions.</Text>
        <View style={styles.goalRow}>
          {goalOptions.map((goal) => (
            <Pressable
              key={goal}
              onPress={() => setGoal(goal)}
              style={[styles.goalButton, profile.goal === goal && styles.goalButtonActive]}
            >
              <Text style={[styles.goalButtonText, profile.goal === goal && styles.goalButtonTextActive]}>
                {getGoalLabel(goal)}
              </Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Actual intake vs target</Text>
        <Text style={styles.body}>This chart should represent what you actually ate, not just what PulsePilot wants you to eat.</Text>
        <MacroBar label="Calories" current={nutrition.caloriesConsumed} target={targets.calories} suffix="" />
        <MacroBar label="Protein" current={nutrition.proteinGrams} target={targets.proteinGrams} suffix=" g" />
        <MacroBar label="Carbs" current={nutrition.carbsGrams} target={targets.carbsGrams} suffix=" g" />
        <MacroBar label="Fat" current={nutrition.fatGrams} target={targets.fatGrams} suffix=" g" />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Log food in PulsePilot</Text>
        <Text style={styles.helper}>Until live MyFitnessPal sync is approved, logging here is how PulsePilot can behave like the main hub.</Text>
        <TextInput
          onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
          placeholder="Food name"
          placeholderTextColor={colors.muted}
          style={styles.fullInput}
          value={form.name}
        />
        <View style={styles.segmentRow}>
          {(["breakfast", "lunch", "dinner", "snack"] as NutritionFoodEntry["meal"][]).map((meal) => (
            <Pressable
              key={meal}
              onPress={() => setForm((current) => ({ ...current, meal }))}
              style={[styles.segment, form.meal === meal && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, form.meal === meal && styles.segmentTextActive]}>{meal}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.inputRow}>
          <TextInput
            keyboardType="numeric"
            onChangeText={(value) => setForm((current) => ({ ...current, calories: value }))}
            placeholder="Calories"
            placeholderTextColor={colors.muted}
            style={styles.miniInput}
            value={form.calories}
          />
          <TextInput
            keyboardType="numeric"
            onChangeText={(value) => setForm((current) => ({ ...current, proteinGrams: value }))}
            placeholder="Protein"
            placeholderTextColor={colors.muted}
            style={styles.miniInput}
            value={form.proteinGrams}
          />
        </View>
        <View style={styles.inputRow}>
          <TextInput
            keyboardType="numeric"
            onChangeText={(value) => setForm((current) => ({ ...current, carbsGrams: value }))}
            placeholder="Carbs"
            placeholderTextColor={colors.muted}
            style={styles.miniInput}
            value={form.carbsGrams}
          />
          <TextInput
            keyboardType="numeric"
            onChangeText={(value) => setForm((current) => ({ ...current, fatGrams: value }))}
            placeholder="Fat"
            placeholderTextColor={colors.muted}
            style={styles.miniInput}
            value={form.fatGrams}
          />
        </View>
        <Pressable onPress={handleAddFood} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add food entry</Text>
        </Pressable>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Today's logged foods</Text>
        {foodLog.map((entry) => (
          <View key={entry.id} style={styles.foodRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.foodName}>{entry.name}</Text>
              <Text style={styles.foodMeta}>
                {entry.meal} · {entry.calories} cal · P {entry.proteinGrams} / C {entry.carbsGrams} / F {entry.fatGrams}
              </Text>
            </View>
            <Pressable onPress={() => removeFoodLogEntry(entry.id)} style={styles.removeButton}>
              <Text style={styles.removeButtonText}>Remove</Text>
            </Pressable>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Day-by-day meal plan</Text>
        {dailyMealPlan.map((day) => (
          <View key={day.dayLabel} style={styles.dayRow}>
            <Text style={styles.dayLabel}>
              {day.dayLabel} · {day.focus}
            </Text>
            {day.meals.map((meal) => (
              <Text key={`${day.dayLabel}-${meal}`} style={styles.body}>
                {meal}
              </Text>
            ))}
          </View>
        ))}
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

function MacroBar({
  label,
  current,
  target,
  suffix
}: {
  label: string;
  current: number;
  target: number;
  suffix: string;
}) {
  const progress = Math.min(current / Math.max(target, 1), 1);

  return (
    <View style={styles.macroBlock}>
      <View style={styles.macroHeader}>
        <Text style={styles.foodName}>{label}</Text>
        <Text style={styles.value}>
          {current} / {target}
          {suffix}
        </Text>
      </View>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${Math.max(progress * 100, 6)}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  helper: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700"
  },
  goalRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  goalButton: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  goalButtonActive: {
    backgroundColor: colors.accent
  },
  goalButtonText: {
    color: colors.text,
    fontWeight: "700"
  },
  goalButtonTextActive: {
    color: "#FFFFFF"
  },
  macroBlock: {
    gap: 8
  },
  macroHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  barTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    height: 12,
    overflow: "hidden"
  },
  barFill: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    height: "100%"
  },
  segmentRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  segment: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  segmentActive: {
    backgroundColor: colors.accent
  },
  segmentText: {
    color: colors.text,
    fontWeight: "700"
  },
  segmentTextActive: {
    color: "#FFFFFF"
  },
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  miniInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.sm,
    borderWidth: 1,
    color: colors.text,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  fullInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  addButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14
  },
  addButtonText: {
    color: "#FFFFFF",
    fontWeight: "800"
  },
  foodRow: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    gap: spacing.sm,
    paddingTop: spacing.sm
  },
  foodName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  foodMeta: {
    color: colors.muted,
    fontSize: 13
  },
  removeButton: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  removeButtonText: {
    color: colors.accent,
    fontWeight: "800"
  },
  dayRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 6,
    paddingTop: spacing.sm
  },
  dayLabel: {
    color: colors.text,
    fontSize: 15,
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
