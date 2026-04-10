import { StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { useAppState } from "@/providers/AppStateProvider";
import { exerciseLibrary } from "@/data/mock-data";
import { colors, spacing } from "@/theme/theme";

export default function TrainingScreen() {
  const { suggestions, weeklyPlan, fitNotesImports, fitNotesSummary } = useAppState();

  return (
    <ScreenContainer>
      <SectionHeader
        eyebrow="Training"
        title="FitNotes-driven workout intelligence"
        description="This screen is where the app compares your split, exercise overlap, and progression trend before changing the plan."
      />

      <Card>
        <Text style={styles.cardTitle}>FitNotes import status</Text>
        <Text style={styles.body}>
          {fitNotesImports.length > 0
            ? `Latest import: ${fitNotesImports[0].sourceFileName} with ${fitNotesImports[0].rowCount} rows.`
            : "No FitNotes import has been saved yet. Use Settings to import your first CSV export."}
        </Text>
      </Card>

      {fitNotesSummary ? (
        <>
          <Card>
            <Text style={styles.cardTitle}>Imported training summary</Text>
            <Text style={styles.body}>
              PulsePilot found {fitNotesSummary.totalSessions} workout sessions in {fitNotesSummary.importedFileName}.
            </Text>
            <Text style={styles.body}>
              Most common categories: {fitNotesSummary.topCategories.map((item) => `${item.category} (${item.count})`).join(", ") || "None"}.
            </Text>
            <Text style={styles.body}>
              Most common training days: {fitNotesSummary.weekdayDistribution.map((item) => `${item.weekday} (${item.count})`).join(", ") || "None"}.
            </Text>
          </Card>

          <Card>
            <Text style={styles.cardTitle}>Recent imported sessions</Text>
            {fitNotesSummary.recentSessions.slice(0, 4).map((session) => (
              <View key={session.id} style={styles.suggestion}>
                <Text style={styles.suggestionTitle}>
                  {session.weekday} · {session.date}
                </Text>
                <Text style={styles.body}>
                  {session.exerciseCount} exercises with {session.topCategory} as the top category.
                </Text>
                <Text style={styles.impact}>
                  Top exercises: {session.exercises.slice(0, 3).map((exercise) => exercise.exerciseName).join(", ")}
                </Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <Card>
        <Text style={styles.cardTitle}>Weekly split</Text>
        {weeklyPlan.map((day) => (
          <View key={day.id} style={styles.dayRow}>
            <View>
              <Text style={styles.dayLabel}>{day.dayLabel}</Text>
              <Text style={styles.focus}>{day.focus}</Text>
            </View>
            <Text style={styles.meta}>{day.exercises.length} exercises</Text>
          </View>
        ))}
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
        <Text style={styles.cardTitle}>Exercise intelligence</Text>
        {exerciseLibrary.map((exercise) => (
          <View key={exercise.id} style={styles.suggestion}>
            <Text style={styles.suggestionTitle}>{exercise.name}</Text>
            <Text style={styles.body}>Primary: {exercise.primaryMuscles.join(", ")}</Text>
            <Text style={styles.body}>Secondary: {exercise.secondaryMuscles.join(", ")}</Text>
            <Text style={styles.impact}>{exercise.whyItWorks}</Text>
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
  dayRow: {
    alignItems: "center",
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm
  },
  dayLabel: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "700"
  },
  focus: {
    color: colors.muted,
    fontSize: 14
  },
  meta: {
    color: colors.muted,
    fontSize: 13
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
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20
  },
  impact: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700"
  }
});
