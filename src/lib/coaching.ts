import {
  CoachingSuggestion,
  DailyVitals,
  FitnessGoal,
  NutritionSnapshot,
  WeeklyStrengthFeeling
} from "@/types/domain";

export function getGoalSummary(goal: FitnessGoal) {
  const lookup: Record<FitnessGoal, { summary: string; bullets: string[] }> = {
    strength: {
      summary: "Prioritize heavy compound lifts, stable protein intake, and tighter fatigue control.",
      bullets: ["Heavy top sets", "Protein-forward eating", "Longer recovery windows"]
    },
    hypertrophy: {
      summary: "Bias toward more weekly volume, stable calories, and exercise balance across muscle groups.",
      bullets: ["Volume focus", "Moderate reps", "Recovery meals"]
    },
    endurance: {
      summary: "Protect cardio quality by controlling lifting fatigue and keeping fuel available.",
      bullets: ["Cardio priority", "Session fueling", "Lower overlap"]
    },
    fatloss: {
      summary: "Maintain strength and muscle while using a measured calorie deficit and high protein intake.",
      bullets: ["Calorie control", "Strength retention", "Recovery protection"]
    },
    flexibility: {
      summary: "Use mobility blocks and lower fatigue organization to create better range of motion.",
      bullets: ["Mobility dosage", "Lower stiffness", "Recovery-friendly training"]
    },
    "general-health": {
      summary: "Build consistency across movement, sleep, hydration, food quality, and recovery.",
      bullets: ["Daily movement", "Recovery basics", "Sustainable routines"]
    }
  };

  return lookup[goal];
}

export function getHydrationGuidance(currentOz: number, targetOz: number, reminderTime: string) {
  const remaining = Math.max(targetOz - currentOz, 0);
  const status = currentOz >= targetOz / 2 ? "on-pace" : "behind";

  if (status === "on-pace") {
    return `You are on pace. Finish the remaining ${remaining} oz by 8:30 PM and keep sipping steadily through the afternoon.`;
  }

  return `You are behind pace at ${reminderTime}. Drink ${Math.ceil(remaining / 2)} oz over the next 4 hours, then re-check intake and finish the rest by tonight.`;
}

export function getWeeklyCheckInGuidance(
  feeling: WeeklyStrengthFeeling,
  vitals: DailyVitals,
  nutrition: NutritionSnapshot
) {
  if (feeling === "stronger") {
    return "You feel stronger. Keep the current split, preserve the lifts that are working, and consider a small load increase on top performers.";
  }

  if (feeling === "same") {
    return "You feel about the same. Review weekly volume, exercise order, and progression targets before making one moderate tweak.";
  }

  const calorieGap = nutrition.caloriesTarget - nutrition.caloriesConsumed;
  const recoveryFlag = vitals.bodyBattery < 60 || vitals.sleepHours < 7;

  if (recoveryFlag || calorieGap > 350) {
    return "You feel weaker and your recovery inputs look stressed. Reduce fatigue first, tighten food intake, and consider a deload or exercise reshuffle.";
  }

  return "You feel weaker even though recovery is not deeply compromised. Inspect exercise redundancy, stalled lifts, and weekly split overlap before adding more work.";
}

export function blendSuggestions(
  base: CoachingSuggestion[],
  feeling?: WeeklyStrengthFeeling
) {
  if (!feeling) {
    return base;
  }

  const extra: Record<WeeklyStrengthFeeling, CoachingSuggestion> = {
    stronger: {
      id: "preserve-momentum",
      title: "Preserve momentum",
      reason: "Your subjective check-in says the current plan is working.",
      impact: "Favor a small progression over a wholesale workout rewrite."
    },
    same: {
      id: "tighten-order",
      title: "Tighten exercise order",
      reason: "You are stable but not clearly progressing.",
      impact: "Improve quality on priority lifts before adding more volume."
    },
    weaker: {
      id: "reduce-fatigue",
      title: "Reduce fatigue load this week",
      reason: "You reported feeling weaker.",
      impact: "Lower overlap, trim redundant work, and protect recovery."
    }
  };

  return [extra[feeling], ...base];
}
