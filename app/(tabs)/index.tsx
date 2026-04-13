import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@/components/Card";
import { Pill } from "@/components/Pill";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { buildCoachConfirmationMessage, buildCoachReply } from "@/lib/coach";
import { StatRow } from "@/components/StatRow";
import { useAppState } from "@/providers/AppStateProvider";
import { getGoalLabel, getGoalSummary, getHydrationGuidance, getVitalAverages } from "@/lib/coaching";
import { CoachAction, CoachMessage, FitnessGoal } from "@/types/domain";
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
  const {
    profile,
    vitals,
    nutrition,
    preferences,
    setGoal,
    vitalHistory,
    vitalsStatus,
    weeklyPlan,
    dailyMealPlan,
    nutritionTargets,
    addWorkoutExercise,
    removeWorkoutExercise,
    addMealPlanItem,
    removeMealPlanItem,
    coachMemory,
    updateCoachMemory
  } = useAppState();
  const [coachInput, setCoachInput] = useState("");
  const [coachMessages, setCoachMessages] = useState<CoachMessage[]>([
    {
      id: "coach-welcome",
      role: "assistant",
      text: "I’m your PulsePilot coach. Ask me about your calories, workouts, or meal plan, or tell me a change you want me to make.",
      createdAt: new Date().toISOString()
    }
  ]);
  const [pendingAction, setPendingAction] = useState<CoachAction | undefined>();
  const goalSummary = getGoalSummary(profile.goal);
  const hydrationGuidance = getHydrationGuidance(
    nutrition.waterOz,
    preferences.hydration.targetOz,
    preferences.hydration.reminderTime
  );
  const averages = getVitalAverages(vitalHistory);
  const liveGarmin = vitalsStatus === "live";

  async function handleCoachSend() {
    if (!coachInput.trim()) {
      return;
    }

    const userMessage: CoachMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: coachInput.trim(),
      createdAt: new Date().toISOString()
    };
    const reply = buildCoachReply({
      message: coachInput,
      profile,
      nutritionTargets,
      weeklyPlan,
      dailyMealPlan
    });
    const assistantMessage: CoachMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      text: reply.text,
      createdAt: new Date().toISOString(),
      pendingAction: reply.pendingAction
    };

    setCoachMessages((current) => [...current, userMessage, assistantMessage]);
    setPendingAction(reply.pendingAction);
    setCoachInput("");
    await updateCoachMemory({
      lastSuggestedAt: new Date().toISOString(),
      recentTopics: Array.from(new Set([...coachMemory.recentTopics, ...reply.topics])).slice(-8)
    });
  }

  async function handleCoachAction(action: CoachAction, accepted: boolean) {
    if (!accepted) {
      setPendingAction(undefined);
      setCoachMessages((current) => [
        ...current,
        {
          id: `assistant-decline-${Date.now()}`,
          role: "assistant",
          text: "No problem. I left everything unchanged.",
          createdAt: new Date().toISOString()
        }
      ]);
      await updateCoachMemory({
        declinedActionCount: coachMemory.declinedActionCount + 1
      });
      return;
    }

    if (action.type === "add-workout-exercise") {
      await addWorkoutExercise(action.payload.dayId, action.payload.exerciseName, action.payload.category);
    }

    if (action.type === "remove-workout-exercise") {
      const day = weeklyPlan.find((entry) => entry.id === action.payload.dayId);
      const match = day?.exercises.find(
        (exercise) => exercise.exerciseName.toLowerCase() === action.payload.exerciseName.toLowerCase()
      );
      if (match) {
        await removeWorkoutExercise(action.payload.dayId, match.id);
      }
    }

    if (action.type === "change-goal") {
      await setGoal(action.payload.goal as FitnessGoal);
    }

    if (action.type === "add-meal-plan-item") {
      await addMealPlanItem(action.payload.dayLabel, action.payload.meal);
    }

    if (action.type === "remove-meal-plan-item") {
      await removeMealPlanItem(action.payload.dayLabel, action.payload.meal);
    }

    setPendingAction(undefined);
    setCoachMessages((current) => [
      ...current,
      {
        id: `assistant-confirm-${Date.now()}`,
        role: "assistant",
        text: buildCoachConfirmationMessage(action.label),
        createdAt: new Date().toISOString()
      }
    ]);
    await updateCoachMemory({
      acceptedActionCount: coachMemory.acceptedActionCount + 1
    });
  }

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

      <Card>
        <Text style={styles.cardTitle}>PulsePilot coach</Text>
        <Text style={styles.body}>
          Ask health questions, or tell me to add or remove a workout or meal-plan item and I can stage the change for
          confirmation.
        </Text>
        <View style={styles.pillRow}>
          <Pill label={`Accepted changes: ${coachMemory.acceptedActionCount}`} />
          <Pill label={`Declined changes: ${coachMemory.declinedActionCount}`} />
        </View>
        <View style={styles.coachThread}>
          {coachMessages.slice(-6).map((message) => (
            <View
              key={message.id}
              style={[styles.chatBubble, message.role === "assistant" ? styles.assistantBubble : styles.userBubble]}
            >
              <Text style={[styles.chatText, message.role === "user" && styles.userChatText]}>{message.text}</Text>
            </View>
          ))}
        </View>
        {pendingAction ? (
          <View style={styles.actionRow}>
            <Pressable onPress={() => handleCoachAction(pendingAction, true)} style={styles.actionButton}>
              <Text style={styles.actionButtonText}>Make this change now</Text>
            </Pressable>
            <Pressable onPress={() => handleCoachAction(pendingAction, false)} style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionText}>Not now</Text>
            </Pressable>
          </View>
        ) : null}
        <TextInput
          onChangeText={setCoachInput}
          placeholder="Ask a question or request a change..."
          placeholderTextColor={colors.muted}
          style={styles.coachInput}
          value={coachInput}
        />
        <Pressable onPress={handleCoachSend} style={styles.coachSend}>
          <Text style={styles.coachSendText}>Ask PulsePilot coach</Text>
        </Pressable>
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
  },
  coachThread: {
    gap: spacing.sm
  },
  chatBubble: {
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  assistantBubble: {
    backgroundColor: colors.surfaceMuted
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.accent
  },
  chatText: {
    color: colors.text,
    lineHeight: 20
  },
  userChatText: {
    color: "#FFFFFF"
  },
  actionRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  actionButton: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  actionButtonText: {
    color: "#FFFFFF",
    fontWeight: "800"
  },
  secondaryActionButton: {
    alignItems: "center",
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 12
  },
  secondaryActionText: {
    color: colors.text,
    fontWeight: "800"
  },
  coachInput: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.text,
    paddingHorizontal: 14,
    paddingVertical: 12
  },
  coachSend: {
    alignItems: "center",
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: 14
  },
  coachSendText: {
    color: "#FFFFFF",
    fontWeight: "800"
  }
});
