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
  const {
    nutrition,
    profile,
    foodLog,
    dailyMealPlan,
    nutritionTargets,
    savedFoods,
    savedMeals,
    recipes,
    weightHistory,
    setGoal,
    addFoodLogEntry,
    removeFoodLogEntry,
    saveCurrentFoodAsFavorite,
    quickAddSavedFood,
    quickAddSavedMeal,
    saveMealFromCurrentFoods,
    updateSavedMeal,
    removeSavedMeal,
    quickAddRecipe,
    saveRecipeFromFoods,
    scanBarcode,
    updateNutritionTargets,
    logWeight
  } = useAppState();
  const [form, setForm] = useState<FoodForm>(emptyForm);
  const [mealName, setMealName] = useState("");
  const [mealEditDrafts, setMealEditDrafts] = useState<Record<string, string>>({});
  const [targetDraft, setTargetDraft] = useState({
    calories: String(nutritionTargets.calories),
    proteinGrams: String(nutritionTargets.proteinGrams),
    carbsGrams: String(nutritionTargets.carbsGrams),
    fatGrams: String(nutritionTargets.fatGrams)
  });
  const [weightDraft, setWeightDraft] = useState(String(profile.currentWeightLb));
  const [barcodeDraft, setBarcodeDraft] = useState("");
  const [barcodeMessage, setBarcodeMessage] = useState<string | null>(null);
  const [recipeName, setRecipeName] = useState("");
  const [recipeServings, setRecipeServings] = useState("4");

  const autoTargets = useMemo(
    () => getNutritionTargetsForGoal(profile.goal, profile.currentWeightLb),
    [profile.goal, profile.currentWeightLb]
  );
  const selectedRecipeIds = useMemo(() => foodLog.slice(0, 4).map((item) => item.id), [foodLog]);
  const trendRange = useMemo(() => {
    if (!weightHistory.length) {
      return { min: 0, max: 0 };
    }
    const values = weightHistory.map((entry) => entry.weightLb);
    return {
      min: Math.min(...values),
      max: Math.max(...values)
    };
  }, [weightHistory]);

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

  async function handleSaveTargets() {
    await updateNutritionTargets({
      calories: Number(targetDraft.calories) || autoTargets.calories,
      proteinGrams: Number(targetDraft.proteinGrams) || autoTargets.proteinGrams,
      carbsGrams: Number(targetDraft.carbsGrams) || autoTargets.carbsGrams,
      fatGrams: Number(targetDraft.fatGrams) || autoTargets.fatGrams
    });
  }

  async function handleLogWeight() {
    const nextWeight = Number(weightDraft);
    if (!Number.isFinite(nextWeight)) {
      return;
    }

    await logWeight(nextWeight, "Logged from nutrition tab");
  }

  async function handleBarcodeLookup() {
    if (!barcodeDraft.trim()) {
      return;
    }
    const result = await scanBarcode(barcodeDraft);
    setBarcodeMessage(
      result.matched
        ? `Barcode matched and added "${result.foodName}" to your diary.`
        : "Barcode not found in PulsePilot yet. Add the food manually now, then save it for faster logging next time."
    );
    if (result.matched) {
      setBarcodeDraft("");
    }
  }

  async function handleSaveRecipe() {
    if (!recipeName.trim()) {
      return;
    }
    await saveRecipeFromFoods(recipeName, Number(recipeServings) || 1, selectedRecipeIds);
    setRecipeName("");
  }

  return (
    <ScreenContainer>
      <SectionHeader
        eyebrow="Nutrition"
        title="PulsePilot nutrition engine"
        description="PulsePilot now owns the nutrition workflow directly: goals, targets, food logging, barcode entry, recipes, saved foods, saved meals, and weight tracking."
      />

      <Card>
        <Text style={styles.cardTitle}>Goal selection</Text>
        <Text style={styles.body}>This goal now drives both nutrition suggestions and training recommendations inside PulsePilot.</Text>
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
        <Text style={styles.cardTitle}>Custom targets</Text>
        <Text style={styles.helper}>
          Auto target suggestion for {getGoalLabel(profile.goal)} at {profile.currentWeightLb} lb: {autoTargets.calories} cal / P {autoTargets.proteinGrams} / C {autoTargets.carbsGrams} / F {autoTargets.fatGrams}
        </Text>
        <View style={styles.inputRow}>
          <TextInput keyboardType="numeric" onChangeText={(value) => setTargetDraft((current) => ({ ...current, calories: value }))} placeholder="Calories" placeholderTextColor={colors.muted} style={styles.miniInput} value={targetDraft.calories} />
          <TextInput keyboardType="numeric" onChangeText={(value) => setTargetDraft((current) => ({ ...current, proteinGrams: value }))} placeholder="Protein" placeholderTextColor={colors.muted} style={styles.miniInput} value={targetDraft.proteinGrams} />
        </View>
        <View style={styles.inputRow}>
          <TextInput keyboardType="numeric" onChangeText={(value) => setTargetDraft((current) => ({ ...current, carbsGrams: value }))} placeholder="Carbs" placeholderTextColor={colors.muted} style={styles.miniInput} value={targetDraft.carbsGrams} />
          <TextInput keyboardType="numeric" onChangeText={(value) => setTargetDraft((current) => ({ ...current, fatGrams: value }))} placeholder="Fat" placeholderTextColor={colors.muted} style={styles.miniInput} value={targetDraft.fatGrams} />
        </View>
        <Pressable onPress={handleSaveTargets} style={styles.addButton}>
          <Text style={styles.addButtonText}>Save nutrition targets</Text>
        </Pressable>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Actual intake vs target</Text>
        <MacroBar label="Calories" current={nutrition.caloriesConsumed} target={nutritionTargets.calories} suffix="" />
        <MacroBar label="Protein" current={nutrition.proteinGrams} target={nutritionTargets.proteinGrams} suffix=" g" />
        <MacroBar label="Carbs" current={nutrition.carbsGrams} target={nutritionTargets.carbsGrams} suffix=" g" />
        <MacroBar label="Fat" current={nutrition.fatGrams} target={nutritionTargets.fatGrams} suffix=" g" />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Barcode quick add</Text>
        <Text style={styles.body}>This is the first built-in barcode flow. For now, PulsePilot matches against its own barcode library and can learn new foods through manual logging plus saved favorites.</Text>
        <TextInput
          onChangeText={setBarcodeDraft}
          placeholder="Enter barcode number"
          placeholderTextColor={colors.muted}
          style={styles.fullInput}
          value={barcodeDraft}
        />
        <Pressable onPress={handleBarcodeLookup} style={styles.addButton}>
          <Text style={styles.addButtonText}>Lookup barcode</Text>
        </Pressable>
        {barcodeMessage ? <Text style={styles.helper}>{barcodeMessage}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Log food in PulsePilot</Text>
        <TextInput onChangeText={(value) => setForm((current) => ({ ...current, name: value }))} placeholder="Food name" placeholderTextColor={colors.muted} style={styles.fullInput} value={form.name} />
        <View style={styles.segmentRow}>
          {(["breakfast", "lunch", "dinner", "snack"] as NutritionFoodEntry["meal"][]).map((meal) => (
            <Pressable key={meal} onPress={() => setForm((current) => ({ ...current, meal }))} style={[styles.segment, form.meal === meal && styles.segmentActive]}>
              <Text style={[styles.segmentText, form.meal === meal && styles.segmentTextActive]}>{meal}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.inputRow}>
          <TextInput keyboardType="numeric" onChangeText={(value) => setForm((current) => ({ ...current, calories: value }))} placeholder="Calories" placeholderTextColor={colors.muted} style={styles.miniInput} value={form.calories} />
          <TextInput keyboardType="numeric" onChangeText={(value) => setForm((current) => ({ ...current, proteinGrams: value }))} placeholder="Protein" placeholderTextColor={colors.muted} style={styles.miniInput} value={form.proteinGrams} />
        </View>
        <View style={styles.inputRow}>
          <TextInput keyboardType="numeric" onChangeText={(value) => setForm((current) => ({ ...current, carbsGrams: value }))} placeholder="Carbs" placeholderTextColor={colors.muted} style={styles.miniInput} value={form.carbsGrams} />
          <TextInput keyboardType="numeric" onChangeText={(value) => setForm((current) => ({ ...current, fatGrams: value }))} placeholder="Fat" placeholderTextColor={colors.muted} style={styles.miniInput} value={form.fatGrams} />
        </View>
        <Pressable onPress={handleAddFood} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add food entry</Text>
        </Pressable>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Saved foods</Text>
        {savedFoods.map((food) => (
          <View key={food.id} style={styles.foodRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.foodName}>{food.name}</Text>
              <Text style={styles.foodMeta}>
                {food.defaultMeal} · {food.calories} cal · P {food.proteinGrams} / C {food.carbsGrams} / F {food.fatGrams}
              </Text>
            </View>
            <Pressable onPress={() => quickAddSavedFood(food.id)} style={styles.smallAction}>
              <Text style={styles.smallActionText}>Quick add</Text>
            </Pressable>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Saved meals</Text>
        <TextInput onChangeText={setMealName} placeholder="Name the current lunch to save it" placeholderTextColor={colors.muted} style={styles.fullInput} value={mealName} />
        <Pressable onPress={() => saveMealFromCurrentFoods(mealName, "lunch")} style={styles.smallAction}>
          <Text style={styles.smallActionText}>Save current lunch as meal</Text>
        </Pressable>
        {savedMeals.map((meal) => (
          <View key={meal.id} style={styles.savedMealCard}>
            <TextInput
              onChangeText={(value) => setMealEditDrafts((current) => ({ ...current, [meal.id]: value }))}
              placeholder={meal.name}
              placeholderTextColor={colors.muted}
              style={styles.fullInput}
              value={mealEditDrafts[meal.id] ?? meal.name}
            />
            <Text style={styles.foodMeta}>
              {meal.meal} · {meal.items.length} items
            </Text>
            <View style={styles.actionGroup}>
              <Pressable onPress={() => updateSavedMeal(meal.id, mealEditDrafts[meal.id] ?? meal.name)} style={styles.smallAction}>
                <Text style={styles.smallActionText}>Save name</Text>
              </Pressable>
              <Pressable onPress={() => quickAddSavedMeal(meal.id)} style={styles.smallAction}>
                <Text style={styles.smallActionText}>Quick add</Text>
              </Pressable>
              <Pressable onPress={() => removeSavedMeal(meal.id)} style={styles.removeButton}>
                <Text style={styles.removeButtonText}>Delete</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Recipe builder</Text>
        <Text style={styles.body}>This builds the first built-in recipe system. Right now it uses your most recent logged foods as ingredients, then saves the recipe for quick add later.</Text>
        <TextInput onChangeText={setRecipeName} placeholder="Recipe name" placeholderTextColor={colors.muted} style={styles.fullInput} value={recipeName} />
        <TextInput keyboardType="numeric" onChangeText={setRecipeServings} placeholder="Servings" placeholderTextColor={colors.muted} style={styles.fullInput} value={recipeServings} />
        <Text style={styles.helper}>Recipe source items: {foodLog.slice(0, 4).map((item) => item.name).join(", ") || "Log foods first"}</Text>
        <Pressable onPress={handleSaveRecipe} style={styles.addButton}>
          <Text style={styles.addButtonText}>Save recipe from recent foods</Text>
        </Pressable>
        {recipes.map((recipe) => (
          <View key={recipe.id} style={styles.foodRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.foodName}>{recipe.name}</Text>
              <Text style={styles.foodMeta}>
                {recipe.items.length} ingredients · {recipe.servings} servings
              </Text>
            </View>
            <Pressable onPress={() => quickAddRecipe(recipe.id, "dinner")} style={styles.smallAction}>
              <Text style={styles.smallActionText}>Add serving</Text>
            </Pressable>
          </View>
        ))}
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
            <View style={styles.actionGroup}>
              <Pressable onPress={() => saveCurrentFoodAsFavorite(entry.id)} style={styles.smallAction}>
                <Text style={styles.smallActionText}>Save food</Text>
              </Pressable>
              <Pressable onPress={() => removeFoodLogEntry(entry.id)} style={styles.removeButton}>
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Weight logging and trend</Text>
        <Text style={styles.body}>PulsePilot now owns the weight log directly and uses it for nutrition coaching.</Text>
        <TextInput keyboardType="numeric" onChangeText={setWeightDraft} placeholder="Current weight" placeholderTextColor={colors.muted} style={styles.fullInput} value={weightDraft} />
        <Pressable onPress={handleLogWeight} style={styles.addButton}>
          <Text style={styles.addButtonText}>Log weight</Text>
        </Pressable>
        <View style={styles.weightTrend}>
          {weightHistory.slice(0, 6).reverse().map((entry) => {
            const spread = Math.max(trendRange.max - trendRange.min, 1);
            const percent = ((entry.weightLb - trendRange.min) / spread) * 100;
            return (
              <View key={entry.id} style={styles.trendRow}>
                <Text style={styles.label}>{new Date(entry.loggedAt).toLocaleDateString()}</Text>
                <View style={styles.trendTrack}>
                  <View style={[styles.trendFill, { width: `${Math.max(percent, 6)}%` }]} />
                </View>
                <Text style={styles.value}>{entry.weightLb.toFixed(1)} lb</Text>
              </View>
            );
          })}
        </View>
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
  savedMealCard: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
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
  actionGroup: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "flex-end"
  },
  smallAction: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8
  },
  smallActionText: {
    color: colors.text,
    fontWeight: "800"
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
  weightTrend: {
    gap: spacing.sm
  },
  trendRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  trendTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    flex: 1,
    height: 10,
    overflow: "hidden"
  },
  trendFill: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    height: "100%"
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
  label: {
    color: colors.muted,
    fontSize: 14,
    minWidth: 88
  },
  value: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "700"
  }
});
