import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@/components/Card";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { exerciseCategoryOrder, exerciseLibrary } from "@/data/exercise-library";
import { useAppState } from "@/providers/AppStateProvider";
import { colors, radius, spacing } from "@/theme/theme";

export default function TrainingScreen() {
  const {
    suggestions,
    weeklyPlan,
    fitNotesImports,
    fitNotesSummary,
    addWorkoutExercise,
    updateWorkoutExercise,
    removeWorkoutExercise
  } = useAppState();

  const [selectedDayId, setSelectedDayId] = useState(weeklyPlan[0]?.id ?? "mon");
  const [customExerciseName, setCustomExerciseName] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [librarySearch, setLibrarySearch] = useState("");

  const importedExercises = useMemo(() => {
    const lookup = new Map<string, { name: string; category: string; count: number }>();
    fitNotesSummary?.recentSessions.forEach((session) => {
      session.exercises.forEach((exercise) => {
        const existing = lookup.get(exercise.exerciseName);
        if (existing) {
          existing.count += exercise.setCount;
        } else {
          lookup.set(exercise.exerciseName, {
            name: exercise.exerciseName,
            category: exercise.category,
            count: exercise.setCount
          });
        }
      });
    });

    return [...lookup.values()].sort((left, right) => right.count - left.count);
  }, [fitNotesSummary]);

  const groupedLibrary = useMemo(() => {
    const query = librarySearch.trim().toLowerCase();
    const filtered = exerciseLibrary.filter((exercise) => {
      if (!query) {
        return true;
      }

      return (
        exercise.name.toLowerCase().includes(query) ||
        exercise.aliases.some((alias) => alias.toLowerCase().includes(query)) ||
        exercise.primaryMuscles.some((muscle) => muscle.toLowerCase().includes(query)) ||
        exercise.secondaryMuscles.some((muscle) => muscle.toLowerCase().includes(query))
      );
    });

    return exerciseCategoryOrder
      .map((category) => ({
        category,
        exercises: filtered.filter((exercise) => exercise.category === category)
      }))
      .filter((group) => group.exercises.length > 0);
  }, [librarySearch]);

  async function handleAddCustomExercise() {
    if (!customExerciseName.trim()) {
      return;
    }

    await addWorkoutExercise(selectedDayId, customExerciseName.trim(), customCategory.trim() || "Custom");
    setCustomExerciseName("");
    setCustomCategory("");
  }

  const selectedDayLabel = weeklyPlan.find((day) => day.id === selectedDayId)?.dayLabel ?? "selected day";

  return (
    <ScreenContainer>
      <SectionHeader
        eyebrow="Training"
        title="Interactive workout builder"
        description="FitNotes should feed PulsePilot's analysis, but PulsePilot should be where you can tweak the split, add lifts, browse exercises, and understand exactly what each movement trains."
      />

      <Card>
        <Text style={styles.cardTitle}>FitNotes import status</Text>
        <Text style={styles.body}>
          {fitNotesImports.length > 0
            ? `Latest import: ${fitNotesImports[0].sourceFileName} with ${fitNotesImports[0].rowCount} rows.`
            : "No FitNotes import has been saved yet. Use Settings to import your first CSV export."}
        </Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Workout editor</Text>
        <Text style={styles.body}>Add, remove, and tune exercises by day. PulsePilot should be the place where your split actually gets edited.</Text>
        <View style={styles.segmentRow}>
          {weeklyPlan.map((day) => (
            <Pressable
              key={day.id}
              onPress={() => setSelectedDayId(day.id)}
              style={[styles.segment, selectedDayId === day.id && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, selectedDayId === day.id && styles.segmentTextActive]}>{day.dayLabel}</Text>
            </Pressable>
          ))}
        </View>

        {weeklyPlan.map((day) => (
          <View key={day.id} style={styles.dayCard}>
            <View style={styles.dayHeader}>
              <View>
                <Text style={styles.dayLabel}>{day.dayLabel}</Text>
                <Text style={styles.focus}>{day.focus}</Text>
              </View>
              <Text style={styles.meta}>{day.exercises.length} lifts</Text>
            </View>

            {day.exercises.map((exercise) => (
              <View key={exercise.id} style={styles.exerciseCard}>
                <View style={styles.exerciseHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                    <Text style={styles.exerciseCategory}>{exercise.category}</Text>
                  </View>
                  <Pressable onPress={() => removeWorkoutExercise(day.id, exercise.id)} style={styles.removeButton}>
                    <Text style={styles.removeButtonText}>Remove</Text>
                  </Pressable>
                </View>
                <View style={styles.inputRow}>
                  <TextInput
                    onChangeText={(value) => updateWorkoutExercise(day.id, exercise.id, { sets: Number(value) || 0 })}
                    placeholder="Sets"
                    placeholderTextColor={colors.muted}
                    style={styles.miniInput}
                    value={String(exercise.sets)}
                  />
                  <TextInput
                    onChangeText={(value) => updateWorkoutExercise(day.id, exercise.id, { reps: value })}
                    placeholder="Reps"
                    placeholderTextColor={colors.muted}
                    style={styles.miniInput}
                    value={exercise.reps}
                  />
                  <TextInput
                    onChangeText={(value) => updateWorkoutExercise(day.id, exercise.id, { weightLb: Number(value) || 0 })}
                    placeholder="Weight"
                    placeholderTextColor={colors.muted}
                    style={styles.miniInput}
                    value={String(exercise.weightLb)}
                  />
                </View>
              </View>
            ))}
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Add workout to selected day</Text>
        <Text style={styles.helper}>Selected day: {selectedDayLabel}</Text>
        <TextInput
          onChangeText={setCustomExerciseName}
          placeholder="Exercise name"
          placeholderTextColor={colors.muted}
          style={styles.fullInput}
          value={customExerciseName}
        />
        <TextInput
          onChangeText={setCustomCategory}
          placeholder="Category / muscle group"
          placeholderTextColor={colors.muted}
          style={styles.fullInput}
          value={customCategory}
        />
        <Pressable onPress={handleAddCustomExercise} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add custom exercise</Text>
        </Pressable>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>FitNotes exercise history</Text>
        <Text style={styles.body}>These are exercises PulsePilot found in your FitNotes import. Tap one to add it back into the selected day.</Text>
        {importedExercises.length ? (
          importedExercises.slice(0, 16).map((exercise) => (
            <Pressable
              key={exercise.name}
              onPress={() => addWorkoutExercise(selectedDayId, exercise.name, exercise.category)}
              style={styles.importedExercise}
            >
              <View>
                <Text style={styles.exerciseName}>{exercise.name}</Text>
                <Text style={styles.exerciseCategory}>{exercise.category} - {exercise.count} logged sets</Text>
              </View>
              <Text style={styles.addInline}>Add</Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.body}>Import FitNotes in Settings to populate your historical exercise list here.</Text>
        )}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Suggested changes</Text>
        {suggestions.map((suggestion) => (
          <View key={suggestion.id} style={styles.suggestion}>
            <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
            <Text style={styles.body}>{suggestion.reason}</Text>
            <Text style={styles.impact}>Expected impact: {suggestion.impact}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Exercise library</Text>
        <Text style={styles.body}>
          Categories are alphabetical, exercises are alphabetical inside each category, aliases are shown, and each exercise includes a muscle-emphasis chart.
        </Text>
        <TextInput
          onChangeText={setLibrarySearch}
          placeholder="Search exercises, aliases, or muscles"
          placeholderTextColor={colors.muted}
          style={styles.fullInput}
          value={librarySearch}
        />

        {groupedLibrary.map((group) => (
          <View key={group.category} style={styles.categorySection}>
            <Text style={styles.categoryHeading}>{group.category}</Text>
            {group.exercises.map((exercise) => (
              <View key={exercise.id} style={styles.libraryCard}>
                <View style={styles.exerciseHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{exercise.name}</Text>
                    {exercise.aliases.length ? <Text style={styles.aliasText}>Also called: {exercise.aliases.join(", ")}</Text> : null}
                    <Text style={styles.exerciseCategory}>{exercise.movementPattern}</Text>
                  </View>
                  <Pressable
                    onPress={() => addWorkoutExercise(selectedDayId, exercise.name, exercise.category)}
                    style={styles.inlineAction}
                  >
                    <Text style={styles.inlineActionText}>Add to {selectedDayLabel}</Text>
                  </Pressable>
                </View>

                <Text style={styles.body}>Primary: {exercise.primaryMuscles.join(", ")}</Text>
                <Text style={styles.body}>Secondary: {exercise.secondaryMuscles.join(", ")}</Text>
                <Text style={styles.impact}>{exercise.whyItWorks}</Text>

                <View style={styles.targetChart}>
                  <Text style={styles.chartTitle}>Muscle emphasis</Text>
                  {exercise.targetChart.map((target) => (
                    <View key={`${exercise.id}-${target.muscle}`} style={styles.chartRow}>
                      <Text style={styles.chartLabel}>{target.muscle}</Text>
                      <View style={styles.chartTrack}>
                        <View style={[styles.chartFill, { width: `${target.percent}%` }]} />
                      </View>
                      <Text style={styles.chartPercent}>{target.percent}%</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
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
  dayCard: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingTop: spacing.sm
  },
  dayHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  dayLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800"
  },
  focus: {
    color: colors.muted,
    fontSize: 14
  },
  meta: {
    color: colors.muted,
    fontSize: 13
  },
  exerciseCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  exerciseHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  exerciseName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  exerciseCategory: {
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
  inputRow: {
    flexDirection: "row",
    gap: spacing.sm
  },
  miniInput: {
    backgroundColor: colors.card,
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
  importedExercise: {
    alignItems: "center",
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.sm
  },
  addInline: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "800"
  },
  categorySection: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingTop: spacing.md
  },
  categoryHeading: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "900"
  },
  libraryCard: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md
  },
  aliasText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18
  },
  inlineAction: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  inlineActionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800"
  },
  targetChart: {
    gap: 8
  },
  chartTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800"
  },
  chartRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm
  },
  chartLabel: {
    color: colors.muted,
    flexBasis: 140,
    flexShrink: 0,
    fontSize: 12
  },
  chartTrack: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    flex: 1,
    height: 10,
    overflow: "hidden"
  },
  chartFill: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    height: "100%"
  },
  chartPercent: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
    width: 36
  },
  suggestion: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    gap: 6,
    paddingTop: spacing.sm
  },
  suggestionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "800"
  },
  impact: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700"
  }
});
