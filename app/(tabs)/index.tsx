import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { StatRow } from "@/components/StatRow";
import { useAppState } from "@/providers/AppStateProvider";
import { getGoalSummary, getHydrationGuidance } from "@/lib/coaching";
import { colors, radius, spacing } from "@/theme/theme";

export default function TodayScreen() {
  const { profile, vitals, nutrition, preferences, setGoal } = useAppState();
  const goalSummary = getGoalSummary(profile.goal);
  const hydrationGuidance = getHydrationGuidance(
    nutrition.waterOz,
    preferences.hydration.targetOz,
    preferences.hydration.reminderTime
  );

  return (
    <ScreenContainer>
      <SectionHeader
        eyebrow="Today"
        title="Daily optimization dashboard"
        description="Garmin-style readiness, MyFitnessPal nutrition status, and hydration coaching in one place."
      />

      <Card>
        <Text style={styles.scoreLabel}>Readiness</Text>
        <Text style={styles.scoreValue}>{vitals.bodyBattery}</Text>
        <View style={styles.pillRow}>
          <Pill label={`${vitals.sleepHours}h sleep`} tone="success" />
          <Pill label={`${nutrition.waterOz} / ${preferences.hydration.targetOz} oz water`} tone="accent" />
          <Pill label={`${vitals.steps.toLocaleString()} steps`} />
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Goal engine</Text>
        <Text style={styles.body}>{goalSummary.summary}</Text>
        <View style={styles.pillRow}>
          {goalSummary.bullets.map((bullet) => (
            <Pill key={bullet} label={bullet} />
          ))}
        </View>
        <View style={styles.goalRow}>
          {["strength", "hypertrophy", "fatloss"].map((goal) => (
            <Pressable key={goal} onPress={() => setGoal(goal as typeof profile.goal)} style={styles.goalButton}>
              <Text style={styles.goalButtonText}>{goal.replace("-", " ")}</Text>
            </Pressable>
          ))}
        </View>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Garmin recovery read</Text>
        <StatRow label="Resting heart rate" value={`${vitals.restingHeartRate} bpm`} />
        <StatRow label="Stress" value={vitals.stressLevel} />
        <StatRow label="Pulse ox" value={`${vitals.pulseOx}%`} />
        <StatRow label="Calories burned" value={`${vitals.caloriesBurned}`} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Hydration coach</Text>
        <Text style={styles.body}>{hydrationGuidance}</Text>
        <Text style={styles.smallText}>
          Prompt mode: {preferences.hydration.enabled ? preferences.hydration.mode : "off"}.
        </Text>
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scoreLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: "700"
  },
  scoreValue: {
    color: colors.text,
    fontSize: 56,
    fontWeight: "900"
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  body: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22
  },
  pillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10
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
  goalButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  smallText: {
    color: colors.muted,
    fontSize: 13
  }
});
