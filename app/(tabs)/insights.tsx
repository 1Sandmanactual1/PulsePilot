import { StyleSheet, Text } from "react-native";

import { Card } from "@/components/Card";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { StatRow } from "@/components/StatRow";
import { useAppState } from "@/providers/AppStateProvider";
import { colors } from "@/theme/theme";
import { getGoalLabel, getVitalAverages } from "@/lib/coaching";

export default function InsightsScreen() {
  const { vitals, nutrition, currentFeeling, preferences, fitNotesSummary, vitalHistory, vitalsStatus, profile } = useAppState();
  const averages = getVitalAverages(vitalHistory);

  return (
    <ScreenContainer>
      <SectionHeader
        eyebrow="Insights"
        title="Averages, sync rules, and recommendation logic"
        description="This screen should explain where PulsePilot is getting its numbers from and how it is deciding what to change."
      />

      <Card>
        <Text style={styles.cardTitle}>Vital averages</Text>
        {averages ? (
          <>
            <StatRow label="Daily avg resting heart rate" value={`${averages.daily.restingHeartRate} bpm`} />
            <StatRow label="Weekly avg resting heart rate" value={`${averages.weekly.restingHeartRate} bpm`} />
            <StatRow label="Weekly avg body battery" value={`${averages.weekly.bodyBattery}`} />
            <StatRow label="Weekly avg steps" value={averages.weekly.steps.toLocaleString()} />
            <StatRow label="Weekly avg sleep" value={`${averages.weekly.sleepHours} h`} />
          </>
        ) : (
          <Text style={styles.body}>No Garmin history is available yet.</Text>
        )}
        <Text style={styles.helper}>
          Source status: {vitalsStatus === "live" ? "live Garmin snapshot" : "demo planning baseline until Garmin is connected"}.
        </Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Recovery + nutrition summary</Text>
        <Text style={styles.body}>
          Goal: {getGoalLabel(profile.goal)}. Latest readiness inputs: sleep {vitals.sleepHours}h, body battery {vitals.bodyBattery}, calories {nutrition.caloriesConsumed} of {nutrition.caloriesTarget}.
        </Text>
        <Text style={styles.body}>Current weekly strength feeling: {currentFeeling ?? "not answered yet"}.</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Decision model</Text>
        <Text style={styles.body}>1. Garmin recovery status once live sync is approved and connected.</Text>
        <Text style={styles.body}>2. Food intake, macro targets, saved meals, and weight logs entered directly in PulsePilot.</Text>
        <Text style={styles.body}>3. FitNotes workout history and the edits you make directly in PulsePilot.</Text>
        <Text style={styles.body}>4. Your weekly check-ins about getting stronger, staying the same, or getting weaker.</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>PulsePilot hub rules</Text>
        {preferences.syncRules.map((rule) => (
          <Text key={rule.id} style={styles.body}>
            {rule.fieldLabel}: {rule.authority === "pulsepilot" ? "PulsePilot owns edits." : rule.authority === "provider" ? "Provider owns the source data." : rule.authority === "two-way" ? "PulsePilot and provider should stay in sync both ways." : "Import-first workflow."}
          </Text>
        ))}
      </Card>

      {fitNotesSummary ? (
        <Card>
          <Text style={styles.cardTitle}>Imported workout insight</Text>
          <Text style={styles.body}>
            Latest FitNotes import found {fitNotesSummary.totalSessions} sessions and shows the heaviest concentration in {fitNotesSummary.topCategories[0]?.category ?? "mixed categories"}.
          </Text>
          <Text style={styles.body}>
            PulsePilot can now use imported exercises plus your own edits in the Training tab as the basis for split analysis and future swaps.
          </Text>
        </Card>
      ) : null}
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
    fontSize: 15,
    lineHeight: 22
  },
  helper: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700"
  }
});
