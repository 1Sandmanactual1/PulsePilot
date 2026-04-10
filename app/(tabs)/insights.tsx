import { StyleSheet, Text } from "react-native";

import { Card } from "@/components/Card";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { useAppState } from "@/providers/AppStateProvider";
import { colors } from "@/theme/theme";

export default function InsightsScreen() {
  const { vitals, nutrition, currentFeeling, preferences, fitNotesSummary } = useAppState();

  return (
    <ScreenContainer>
      <SectionHeader
        eyebrow="Insights"
        title="Why PulsePilot is suggesting changes"
        description="This screen is designed to explain recommendations instead of just throwing them at you."
      />

      <Card>
        <Text style={styles.cardTitle}>Recovery + nutrition summary</Text>
        <Text style={styles.body}>
          Sleep is {vitals.sleepHours} hours, body battery is {vitals.bodyBattery}, and food intake is {nutrition.caloriesConsumed} of {nutrition.caloriesTarget} calories.
        </Text>
        <Text style={styles.body}>
          Current weekly strength feeling: {currentFeeling ?? "not answered yet"}.
        </Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Decision model</Text>
        <Text style={styles.body}>1. Recovery status from Garmin metrics.</Text>
        <Text style={styles.body}>2. Nutrition and body-weight support from MyFitnessPal.</Text>
        <Text style={styles.body}>3. Weekly split, volume, and exercise overlap from FitNotes.</Text>
        <Text style={styles.body}>4. Your weekly check-in about feeling stronger, the same, or weaker.</Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>PulsePilot hub rules</Text>
        {preferences.syncRules.slice(0, 3).map((rule) => (
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
            PulsePilot can now use that imported structure as the basis for split analysis and future swap/progression recommendations.
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
  }
});
