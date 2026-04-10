import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useState } from "react";

import { Card } from "@/components/Card";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { useAppState } from "@/providers/AppStateProvider";
import { getWeeklyCheckInGuidance } from "@/lib/coaching";
import { WeeklyStrengthFeeling } from "@/types/domain";
import { colors, radius, spacing } from "@/theme/theme";

export default function CheckInsScreen() {
  const { checkIns, currentFeeling, submitWeeklyCheckIn, nutrition, preferences, vitals } = useAppState();
  const [phase, setPhase] = useState<"start" | "end">("start");
  const [selected, setSelected] = useState<WeeklyStrengthFeeling>("same");
  const [note, setNote] = useState("");

  const guidance = getWeeklyCheckInGuidance(currentFeeling ?? "same", vitals, nutrition);

  async function handleSubmit() {
    await submitWeeklyCheckIn(selected, phase, note.trim() || undefined);
    setNote("");
  }

  return (
    <ScreenContainer>
      <SectionHeader
        eyebrow="Check-Ins"
        title="Start and end each week with a strength pulse"
        description="Your answer becomes part of the recommendation engine, alongside Garmin recovery and workout trend data."
      />

      <Card>
        <Text style={styles.cardTitle}>Weekly strength check-in</Text>
        <Text style={styles.body}>Do you feel like you are getting stronger, staying the same, or getting weaker?</Text>
        <View style={styles.segmentRow}>
          <Pressable onPress={() => setPhase("start")} style={[styles.segment, phase === "start" && styles.segmentActive]}>
            <Text style={[styles.segmentText, phase === "start" && styles.segmentTextActive]}>Start of week</Text>
          </Pressable>
          <Pressable onPress={() => setPhase("end")} style={[styles.segment, phase === "end" && styles.segmentActive]}>
            <Text style={[styles.segmentText, phase === "end" && styles.segmentTextActive]}>End of week</Text>
          </Pressable>
        </View>
        <View style={styles.choiceRow}>
          {(["stronger", "same", "weaker"] as WeeklyStrengthFeeling[]).map((option) => (
            <Pressable key={option} onPress={() => setSelected(option)} style={[styles.choice, selected === option && styles.choiceActive]}>
              <Text style={[styles.choiceText, selected === option && styles.choiceTextActive]}>{option}</Text>
            </Pressable>
          ))}
        </View>
        <TextInput
          multiline
          onChangeText={setNote}
          placeholder="Optional note about how the week felt..."
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={note}
        />
        <Pressable onPress={handleSubmit} style={styles.submit}>
          <Text style={styles.submitText}>Save weekly check-in</Text>
        </Pressable>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Current coaching response</Text>
        <Text style={styles.body}>{guidance}</Text>
        <Text style={styles.helper}>
          Prompt setting: {preferences.weeklyCheckIns.enabled ? preferences.weeklyCheckIns.mode : "off"}.
        </Text>
      </Card>

      <Card>
        <Text style={styles.cardTitle}>Recent check-ins</Text>
        {checkIns.slice(-4).reverse().map((checkIn) => (
          <View key={`${checkIn.weekOf}-${checkIn.phase}`} style={styles.historyRow}>
            <Text style={styles.body}>
              {checkIn.weekOf} · {checkIn.phase} of week
            </Text>
            <Text style={styles.historyFeeling}>{checkIn.feeling}</Text>
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
    fontSize: 15,
    lineHeight: 22
  },
  helper: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: "700"
  },
  segmentRow: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    flexDirection: "row",
    padding: 4
  },
  segment: {
    alignItems: "center",
    borderRadius: radius.pill,
    flex: 1,
    paddingVertical: 10
  },
  segmentActive: {
    backgroundColor: colors.card
  },
  segmentText: {
    color: colors.muted,
    fontWeight: "700"
  },
  segmentTextActive: {
    color: colors.text
  },
  choiceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  choice: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10
  },
  choiceActive: {
    backgroundColor: colors.accent
  },
  choiceText: {
    color: colors.text,
    fontWeight: "700"
  },
  choiceTextActive: {
    color: "#FFFFFF"
  },
  input: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    minHeight: 110,
    padding: spacing.md,
    textAlignVertical: "top"
  },
  submit: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "800"
  },
  historyRow: {
    borderTopColor: colors.border,
    borderTopWidth: 1,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: spacing.sm
  },
  historyFeeling: {
    color: colors.text,
    fontWeight: "800",
    textTransform: "capitalize"
  }
});
