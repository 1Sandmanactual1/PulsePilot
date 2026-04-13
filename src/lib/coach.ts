import { CoachAction, CoachMessage, DailyVitals, NutritionDayPlan, NutritionTargets, UserProfile, WorkoutDay } from "@/types/domain";

type CoachReplyContext = {
  message: string;
  profile: UserProfile;
  nutritionTargets: NutritionTargets;
  weeklyPlan: WorkoutDay[];
  dailyMealPlan: NutritionDayPlan[];
};

type CoachReply = {
  text: string;
  pendingAction?: CoachAction;
  topics: string[];
};

const goalLookup = [
  { key: "strength", label: "strength" },
  { key: "hypertrophy", label: "muscle building" },
  { key: "endurance", label: "endurance / cardio" },
  { key: "fatloss", label: "cutting / weight loss" },
  { key: "flexibility", label: "flexibility" },
  { key: "general-health", label: "general health" }
] as const;

function findDayByMessage(message: string, weeklyPlan: WorkoutDay[]) {
  const lowered = message.toLowerCase();
  return weeklyPlan.find((day) => lowered.includes(day.dayLabel.toLowerCase()));
}

function findMealDayByMessage(message: string, dailyMealPlan: NutritionDayPlan[]) {
  const lowered = message.toLowerCase();
  return dailyMealPlan.find((day) => lowered.includes(day.dayLabel.toLowerCase()));
}

function extractExerciseName(message: string) {
  const cleaned = message
    .replace(/^add\s+/i, "")
    .replace(/^remove\s+/i, "")
    .replace(/\s+to\s+my workout.*$/i, "")
    .replace(/\s+from\s+my workout.*$/i, "")
    .replace(/\s+to\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday).*$/i, "")
    .replace(/\s+from\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday).*$/i, "")
    .trim();

  return cleaned ? cleaned.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "";
}

function extractMealText(message: string) {
  const cleaned = message
    .replace(/^add\s+/i, "")
    .replace(/^remove\s+/i, "")
    .replace(/\s+to\s+my meal plan.*$/i, "")
    .replace(/\s+from\s+my meal plan.*$/i, "")
    .replace(/\s+to\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday).*$/i, "")
    .replace(/\s+from\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday).*$/i, "")
    .trim();

  return cleaned ? cleaned[0].toUpperCase() + cleaned.slice(1) : "";
}

export function buildCoachReply(context: CoachReplyContext): CoachReply {
  const message = context.message.trim();
  const lowered = message.toLowerCase();
  const topics: string[] = [];

  if (!message) {
    return {
      text: "Ask me about your calories, workout, meal plan, or tell me to add or remove something and I can tee up the change for you.",
      topics: ["coach"]
    };
  }

  if (lowered.startsWith("add ") && lowered.includes("meal plan")) {
    const day = findMealDayByMessage(lowered, context.dailyMealPlan) ?? context.dailyMealPlan[0];
    const meal = extractMealText(message);
    topics.push("meal-plan");
    return {
      text: `I can add "${meal}" to your ${day.dayLabel} meal plan. Do you want me to make that change now?`,
      pendingAction: {
        id: `coach-${Date.now()}`,
        type: "add-meal-plan-item",
        label: `Add "${meal}" to ${day.dayLabel}`,
        payload: { dayLabel: day.dayLabel, meal }
      },
      topics
    };
  }

  if (lowered.startsWith("remove ") && lowered.includes("meal plan")) {
    const day = findMealDayByMessage(lowered, context.dailyMealPlan) ?? context.dailyMealPlan[0];
    const meal = extractMealText(message);
    topics.push("meal-plan");
    return {
      text: `I can remove "${meal}" from your ${day.dayLabel} meal plan. Do you want me to make that change now?`,
      pendingAction: {
        id: `coach-${Date.now()}`,
        type: "remove-meal-plan-item",
        label: `Remove "${meal}" from ${day.dayLabel}`,
        payload: { dayLabel: day.dayLabel, meal }
      },
      topics
    };
  }

  if (lowered.startsWith("add ")) {
    const day = findDayByMessage(lowered, context.weeklyPlan) ?? context.weeklyPlan[0];
    const exerciseName = extractExerciseName(message);
    topics.push("workout");
    return {
      text: `I can add ${exerciseName} to your ${day.dayLabel} workout. Do you want me to make that change now?`,
      pendingAction: {
        id: `coach-${Date.now()}`,
        type: "add-workout-exercise",
        label: `Add ${exerciseName} to ${day.dayLabel}`,
        payload: { dayId: day.id, exerciseName, category: day.focus }
      },
      topics
    };
  }

  if (lowered.startsWith("remove ")) {
    const day = findDayByMessage(lowered, context.weeklyPlan) ?? context.weeklyPlan[0];
    const exerciseName = extractExerciseName(message);
    topics.push("workout");
    return {
      text: `I can remove ${exerciseName} from your ${day.dayLabel} workout if it exists there. Do you want me to make that change now?`,
      pendingAction: {
        id: `coach-${Date.now()}`,
        type: "remove-workout-exercise",
        label: `Remove ${exerciseName} from ${day.dayLabel}`,
        payload: { dayId: day.id, exerciseName }
      },
      topics
    };
  }

  const matchedGoal = goalLookup.find((goal) => lowered.includes(goal.label) || lowered.includes(goal.key));
  if (lowered.includes("goal") && matchedGoal) {
    topics.push("goal");
    return {
      text: `I can switch your main goal to ${matchedGoal.label}. Do you want me to make that change now?`,
      pendingAction: {
        id: `coach-${Date.now()}`,
        type: "change-goal",
        label: `Change goal to ${matchedGoal.label}`,
        payload: { goal: matchedGoal.key }
      },
      topics
    };
  }

  if (lowered.includes("calorie") || lowered.includes("weight loss") || lowered.includes("cut")) {
    topics.push("nutrition");
    return {
      text: `Right now your active calorie target is ${context.nutritionTargets.calories} calories with ${context.nutritionTargets.proteinGrams}g protein, ${context.nutritionTargets.carbsGrams}g carbs, and ${context.nutritionTargets.fatGrams}g fat. If you want, tell me a new goal weight and timeframe and I can help you adjust the plan from there.`,
      topics
    };
  }

  if (lowered.includes("workout") || lowered.includes("exercise")) {
    topics.push("workout");
    return {
      text: `You currently have ${context.weeklyPlan.reduce((sum, day) => sum + day.exercises.length, 0)} planned exercises across ${context.weeklyPlan.length} workout days. If you want, tell me to add or remove an exercise and include the day.`,
      topics
    };
  }

  if (lowered.includes("meal plan") || lowered.includes("food")) {
    topics.push("meal-plan");
    return {
      text: `Your meal plan is editable inside PulsePilot now. Ask me to add or remove a specific meal from a specific day, and I’ll stage the change for you.`,
      topics
    };
  }

  topics.push("general-health");
  return {
    text: `I can help with nutrition targets, workout planning, and meal-plan changes right inside PulsePilot. Ask me a health question, or tell me a change you want made and I’ll tee it up for confirmation.`,
    topics
  };
}

export function buildCoachConfirmationMessage(actionLabel: string) {
  return `Done. I made this change: ${actionLabel}.`;
}

