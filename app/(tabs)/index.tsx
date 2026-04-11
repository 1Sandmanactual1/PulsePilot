import { Pressable, StyleSheet, Text, View } from "react-native";

import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { StatRow } from "@/components/StatRow";
import { useAppState } from "@/providers/AppStateProvider";
import { getGoalLabel, getGoalSummary, getHydrationGuidance, getVitalAverages } from "@/lib/coaching";
import { FitnessGoal } from "@/types/domain";
import { colors, radius, spacing } from "@/theme/theme";

const goalOptions: FitnessGoal[] = [
  "strength",
  "hypertrophy",
  "endurance",
  "fatloss",
  "flexibility",
  "general-health"
];

export default function TodayScreen() {
  const { profile, vitals, nutrition, preferences, setGoal, vitalHistory, vitalsStatus } = useAppState();
  const goalSummary = getGoalSummary(profile.goal);
  const hydrationGuidance = getHydrationGuidance(
    nutrition.waterOz,
    preferences.hydration.targetOz,
    preferences.hydration.reminderTime
  );
  const averages = getVitalAverages(vitalHistory);
  const liveGarmin = vitalsStatus === "live";

  return (
    <ScreenContainer>
      <SectionHeader
        eyebrow="Today"
        title="Daily optimization dashboard"
        description="PulsePilot should become your hub, but Garmin recovery is only truly live once Garmin partner access is in place."
      />

      <Card>
        <Text style={styles.cardTitle}>Garmin sync status</Text>
        <Text style={styles.body}>
          {liveGarmin
            ? "Live Garmin daily metrics are connected. PulsePilot is reading your latest saved Garmin snapshot."
            : "Garmin live sync is not connected yet, so PulsePilot is showing a planning baseline instead of your watch's real-time numbers."}
        </Text>
        <View style={styles.pillRow}>
          <Pill label={liveGarmin ? "Live Garmin data" : "Demo baseline until Garmin sync"} tone={liveGarmin ? "success" : "accent"} />
          <Pill label={`Goal: ${getGoalLabel(profile.goal)}`} />
        </View>
      </Card>

      <Card>
        <Text style={styles.scoreLabel}>Readiness</Text>
        <Text style={styles.scoreValue}>{liveGarmin ? vitals.bodyBattery : "--"}</Text>
        <View style={styles.pillRow}>
          <Pill label={`${vitals.sleepHours}h sleep`} tone="success" />
          <Pill label={`${nutrition.waterOz} / ${preferences.hydration.targetOz} oz water`} tone="accent" />
          <Pill label={`${vitals.steps.toLocaleString()} steps`} />
        </View>
        {!liveGarmin ? <Text style={styles.helper}>Connect Garmin to replace the planning baseline with real wearable readings.</Text> : null}
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
        <Text style={styles.cardTitle}>Latest recovery read</Text>
        <StatRow label="Heart rate" value={liveGarmin ? `${vitals.restingHeartRate} bpm` : "Waiting for Garmin sync"} />
        <StatRow label="Stress" value={liveGarmin ? vitals.stressLevel : "Waiting for Garmin sync"} />
        <StatRow label="Pulse ox" value={liveGarmin ? `${vitals.pulseOx}%` : "Waiting for Garmin sync"} />
        <StatRow label="Calories burned" value={liveGarmin ? `${vitals.caloriesBurned}` : "Waiting for Garmin sync"} />
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Daily + weekly averages</Text>
        {averages ? (
          <>
            <StatRow label="Daily average heart rate" value={`${averages.daily.restingHeartRate} bpm`} />
            <StatRow label="Weekly average heart rate" value={`${averages.weekly.restingHeartRate} bpm`} />
            <StatRow label="Weekly average sleep" value={`${averages.weekly.sleepHours} h`} />
            <StatRow label="Weekly average steps" value={averages.weekly.steps.toLocaleString()} />
          </>
        ) : (
          <Text style={styles.body}>PulsePilot will show averages here once Garmin history is flowing in.</Text>
        )}
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
  goalButtonActive: {
    backgroundColor: colors.accent
  },
  goalButtonText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "700"
  },
  goalButtonTextActive: {
    color: "#FFFFFF"
  },
  smallText: {
    color: colors.muted,
    fontSize: 13
  },
  helper: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700"
  }
});
