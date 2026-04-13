import {
  ActivityLevel,
  CoachingSuggestion,
  DailyVitals,
  FitnessGoal,
  GoalSettingsMap,
  NutritionDayPlan,
  NutritionFoodEntry,
  NutritionSnapshot,
  VitalHistoryPoint,
  WeeklyStrengthFeeling
} from "@/types/domain";

const activityMaintenanceMultipliers: Record<ActivityLevel, number> = {
  stationary: 12,
  "some-movement": 13,
  "moderate-movement": 14,
  "steady-moving": 15,
  "moving-all-day": 16,
  "very-active": 17
};

function getAgeAdjustment(age: number) {
  if (age < 25) {
    return 100;
  }

  if (age < 40) {
    return 0;
  }

  if (age < 55) {
    return -100;
  }

  return -180;
}

function getEstimatedMaintenanceCalories(weightLb: number, age: number, activityLevel: ActivityLevel) {
  return Math.round(weightLb * activityMaintenanceMultipliers[activityLevel] + getAgeAdjustment(age));
}

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

export function getGoalLabel(goal: FitnessGoal) {
  const labels: Record<FitnessGoal, string> = {
    strength: "Strength",
    hypertrophy: "Muscle building",
    endurance: "Endurance / cardio",
    fatloss: "Cutting / weight loss",
    flexibility: "Flexibility",
    "general-health": "General health"
  };

  return labels[goal];
}

export function buildNutritionFromFoodLog(foodLog: NutritionFoodEntry[], fallback: NutritionSnapshot) {
  if (!foodLog.length) {
    return fallback;
  }

  return {
    ...fallback,
    caloriesConsumed: foodLog.reduce((sum, item) => sum + item.calories, 0),
    proteinGrams: foodLog.reduce((sum, item) => sum + item.proteinGrams, 0),
    carbsGrams: foodLog.reduce((sum, item) => sum + item.carbsGrams, 0),
    fatGrams: foodLog.reduce((sum, item) => sum + item.fatGrams, 0)
  };
}

export function getNutritionTargetsForGoal(
  goal: FitnessGoal,
  weightLb: number,
  age: number,
  goalSettings?: GoalSettingsMap[FitnessGoal]
) {
  const baselineCalories = {
    strength: Math.round(weightLb * 14.5),
    hypertrophy: Math.round(weightLb * 15.5),
    endurance: Math.round(weightLb * 14),
    fatloss: Math.round(weightLb * 12),
    flexibility: Math.round(weightLb * 13),
    "general-health": Math.round(weightLb * 13.5)
  }[goal];

  const proteinMultiplier = {
    strength: 0.9,
    hypertrophy: 1,
    endurance: 0.8,
    fatloss: 1,
    flexibility: 0.75,
    "general-health": 0.8
  }[goal];

  const carbsMultiplier = {
    strength: 1.2,
    hypertrophy: 1.25,
    endurance: 1.4,
    fatloss: 0.85,
    flexibility: 0.9,
    "general-health": 1
  }[goal];

  let calories = baselineCalories;
  if (goal === "fatloss") {
    const targetWeight = goalSettings?.fatloss?.goalWeightLb;
    const timeframeValue = goalSettings?.fatloss?.timeframeValue;
    const timeframeUnit = goalSettings?.fatloss?.timeframeUnit ?? "weeks";
    const activityLevel = goalSettings?.fatloss?.activityLevel ?? "moderate-movement";
    const maintenanceEstimate = getEstimatedMaintenanceCalories(weightLb, age, activityLevel);
    calories = Math.round(maintenanceEstimate - 500);

    if (targetWeight && timeframeValue && targetWeight < weightLb) {
      const poundsToLose = weightLb - targetWeight;
      const days =
        timeframeUnit === "days"
          ? timeframeValue
          : timeframeUnit === "weeks"
            ? timeframeValue * 7
            : timeframeValue * 30;

      if (days > 0) {
        const requestedPoundsPerWeek = (poundsToLose / days) * 7;
        const recommendedMaxWeeklyLoss = Number(Math.min(2, weightLb * 0.01).toFixed(2));
        const appliedPoundsPerWeek = Math.min(requestedPoundsPerWeek, recommendedMaxWeeklyLoss);
        const dailyDeficit = appliedPoundsPerWeek * 500;
        calories = Math.round(maintenanceEstimate - dailyDeficit);
      }
    }
  }

  return {
    calories,
    proteinGrams: Math.round(weightLb * proteinMultiplier),
    carbsGrams: Math.round(weightLb * carbsMultiplier),
    fatGrams: Math.round((calories * 0.27) / 9)
  };
}

export function getFatLossGoalDetails(weightLb: number, goalSettings?: GoalSettingsMap[FitnessGoal]) {
  const targetWeight = goalSettings?.fatloss?.goalWeightLb;
  const timeframeValue = goalSettings?.fatloss?.timeframeValue;
  const timeframeUnit = goalSettings?.fatloss?.timeframeUnit ?? "weeks";
  const activityLevel = goalSettings?.fatloss?.activityLevel ?? "moderate-movement";

  if (!targetWeight || !timeframeValue || targetWeight >= weightLb) {
    return null;
  }

  const poundsToLose = Number((weightLb - targetWeight).toFixed(1));
  const days =
    timeframeUnit === "days"
      ? timeframeValue
      : timeframeUnit === "weeks"
      ? timeframeValue * 7
      : timeframeValue * 30;
  const requestedPoundsPerWeek = Number(((poundsToLose / days) * 7).toFixed(2));
  const recommendedMaxWeeklyLoss = Number(Math.min(2, weightLb * 0.01).toFixed(2));
  const appliedPoundsPerWeek = Number(Math.min(requestedPoundsPerWeek, recommendedMaxWeeklyLoss).toFixed(2));

  return {
    targetWeight,
    timeframeValue,
    timeframeUnit,
    poundsToLose,
    requestedPoundsPerWeek,
    poundsPerWeek: appliedPoundsPerWeek,
    recommendedMaxWeeklyLoss,
    isPaceCapped: requestedPoundsPerWeek > recommendedMaxWeeklyLoss,
    activityLevel
  };
}

export function buildDailyMealPlan(goal: FitnessGoal): NutritionDayPlan[] {
  const templates: Record<FitnessGoal, NutritionDayPlan[]> = {
    strength: [
      { dayLabel: "Monday", focus: "Heavy pressing support", meals: ["Breakfast: eggs, oats, fruit", "Lunch: chicken rice bowl", "Dinner: beef, potatoes, greens", "Snack: yogurt + cereal"] },
      { dayLabel: "Tuesday", focus: "Pull-session fuel", meals: ["Breakfast: bagel + eggs", "Lunch: turkey pasta bowl", "Dinner: salmon rice plate", "Snack: shake + banana"] },
      { dayLabel: "Wednesday", focus: "Leg-day carbs", meals: ["Breakfast: overnight oats", "Lunch: chicken burrito bowl", "Dinner: steak and potatoes", "Snack: yogurt + berries"] },
      { dayLabel: "Thursday", focus: "Recovery reset", meals: ["Breakfast: omelet + toast", "Lunch: tuna wrap", "Dinner: stir-fry bowl", "Snack: cottage cheese + fruit"] },
      { dayLabel: "Friday", focus: "Top-set performance", meals: ["Breakfast: pancakes + whey", "Lunch: double chicken rice bowl", "Dinner: burger bowls", "Snack: oats + peanut butter"] },
      { dayLabel: "Saturday", focus: "Flexible higher-calorie day", meals: ["Breakfast: yogurt parfait", "Lunch: deli sandwich", "Dinner: social meal fits target", "Snack: protein shake"] },
      { dayLabel: "Sunday", focus: "Prep and reset", meals: ["Breakfast: eggs + sourdough", "Lunch: chicken salad wrap", "Dinner: salmon and rice", "Snack: fruit + yogurt"] }
    ],
    hypertrophy: [
      { dayLabel: "Monday", focus: "Volume support", meals: ["Breakfast: oats + whey + berries", "Lunch: chicken pasta bowl", "Dinner: rice, beef, veggies", "Snack: yogurt + granola"] },
      { dayLabel: "Tuesday", focus: "Growth calories", meals: ["Breakfast: bagel sandwich", "Lunch: burrito bowl", "Dinner: salmon, rice, avocado", "Snack: trail mix + shake"] },
      { dayLabel: "Wednesday", focus: "Leg volume", meals: ["Breakfast: overnight oats", "Lunch: double rice chicken bowl", "Dinner: steak, potatoes, greens", "Snack: cereal + milk"] },
      { dayLabel: "Thursday", focus: "Recovery meals", meals: ["Breakfast: toast + eggs", "Lunch: turkey wrap", "Dinner: pasta + turkey meat sauce", "Snack: fruit + Greek yogurt"] },
      { dayLabel: "Friday", focus: "Push calories upward", meals: ["Breakfast: pancakes + eggs", "Lunch: teriyaki chicken bowl", "Dinner: burgers + rice", "Snack: oats + whey"] },
      { dayLabel: "Saturday", focus: "Social flexibility", meals: ["Breakfast: yogurt + fruit", "Lunch: sandwich + chips fits target", "Dinner: relaxed high-calorie dinner", "Snack: protein bar"] },
      { dayLabel: "Sunday", focus: "Prep proteins", meals: ["Breakfast: omelet", "Lunch: chicken wrap", "Dinner: salmon + potatoes", "Snack: cottage cheese"] }
    ],
    endurance: [
      { dayLabel: "Monday", focus: "Cardio fuel", meals: ["Breakfast: oatmeal + banana", "Lunch: chicken rice bowl", "Dinner: salmon pasta", "Snack: sports drink + fruit"] },
      { dayLabel: "Tuesday", focus: "Steady energy", meals: ["Breakfast: toast + eggs", "Lunch: turkey sandwich", "Dinner: burrito bowl", "Snack: yogurt"] },
      { dayLabel: "Wednesday", focus: "Long-session support", meals: ["Breakfast: overnight oats", "Lunch: rice + lean beef", "Dinner: pasta + chicken", "Snack: bagel + peanut butter"] },
      { dayLabel: "Thursday", focus: "Recovery carbs", meals: ["Breakfast: granola + milk", "Lunch: wrap + fruit", "Dinner: stir-fry + noodles", "Snack: smoothie"] },
      { dayLabel: "Friday", focus: "Workout quality", meals: ["Breakfast: oats + honey", "Lunch: sushi bowl", "Dinner: chicken potatoes", "Snack: cereal + milk"] },
      { dayLabel: "Saturday", focus: "Flexible fueling", meals: ["Breakfast: pancakes", "Lunch: sandwich", "Dinner: social meal", "Snack: fruit"] },
      { dayLabel: "Sunday", focus: "Light recovery", meals: ["Breakfast: yogurt + berries", "Lunch: soup + bread", "Dinner: salmon rice", "Snack: shake"] }
    ],
    fatloss: [
      { dayLabel: "Monday", focus: "High protein start", meals: ["Breakfast: egg whites + oats", "Lunch: chicken salad bowl", "Dinner: lean beef + potatoes", "Snack: Greek yogurt"] },
      { dayLabel: "Tuesday", focus: "Cut hunger, keep output", meals: ["Breakfast: yogurt parfait", "Lunch: turkey wrap", "Dinner: salmon + vegetables + rice", "Snack: apple + protein shake"] },
      { dayLabel: "Wednesday", focus: "Leg day without overeating", meals: ["Breakfast: overnight oats", "Lunch: burrito bowl light cheese", "Dinner: chicken pasta measured portion", "Snack: berries + cottage cheese"] },
      { dayLabel: "Thursday", focus: "Recovery under calories", meals: ["Breakfast: eggs + toast", "Lunch: tuna salad wrap", "Dinner: stir-fry bowl", "Snack: protein pudding"] },
      { dayLabel: "Friday", focus: "Stay full", meals: ["Breakfast: oats + whey", "Lunch: chicken rice bowl", "Dinner: burgers without extra sides", "Snack: popcorn + yogurt"] },
      { dayLabel: "Saturday", focus: "Flexible cut day", meals: ["Breakfast: omelet", "Lunch: deli sandwich", "Dinner: social meal budgeted in", "Snack: protein bar"] },
      { dayLabel: "Sunday", focus: "Meal prep reset", meals: ["Breakfast: yogurt + fruit", "Lunch: grilled chicken salad", "Dinner: salmon + potatoes", "Snack: shake"] }
    ],
    flexibility: [
      { dayLabel: "Monday", focus: "Lower inflammation support", meals: ["Breakfast: berries + yogurt", "Lunch: chicken rice bowl", "Dinner: salmon + vegetables", "Snack: nuts + fruit"] },
      { dayLabel: "Tuesday", focus: "Mobility support", meals: ["Breakfast: oats + flax", "Lunch: turkey wrap", "Dinner: stir-fry bowl", "Snack: smoothie"] },
      { dayLabel: "Wednesday", focus: "Joint-friendly fuel", meals: ["Breakfast: eggs + toast", "Lunch: tuna rice bowl", "Dinner: lean beef + potatoes", "Snack: yogurt"] },
      { dayLabel: "Thursday", focus: "Recovery day", meals: ["Breakfast: fruit + yogurt", "Lunch: soup + sandwich", "Dinner: chicken pasta", "Snack: cottage cheese"] },
      { dayLabel: "Friday", focus: "Training support", meals: ["Breakfast: oats + whey", "Lunch: burrito bowl", "Dinner: salmon rice", "Snack: berries"] },
      { dayLabel: "Saturday", focus: "Flexible day", meals: ["Breakfast: bagel + eggs", "Lunch: wrap + fruit", "Dinner: social meal", "Snack: shake"] },
      { dayLabel: "Sunday", focus: "Reset", meals: ["Breakfast: omelet", "Lunch: chicken salad", "Dinner: roasted vegetables + protein", "Snack: yogurt"] }
    ],
    "general-health": [
      { dayLabel: "Monday", focus: "Balanced day", meals: ["Breakfast: oats + eggs", "Lunch: chicken rice bowl", "Dinner: salmon + potatoes", "Snack: yogurt"] },
      { dayLabel: "Tuesday", focus: "Steady energy", meals: ["Breakfast: toast + eggs", "Lunch: turkey wrap", "Dinner: stir-fry bowl", "Snack: fruit + nuts"] },
      { dayLabel: "Wednesday", focus: "Consistency", meals: ["Breakfast: overnight oats", "Lunch: burrito bowl", "Dinner: lean beef + rice", "Snack: shake"] },
      { dayLabel: "Thursday", focus: "Recovery basics", meals: ["Breakfast: yogurt + berries", "Lunch: sandwich + soup", "Dinner: chicken pasta", "Snack: cottage cheese"] },
      { dayLabel: "Friday", focus: "Flexible structure", meals: ["Breakfast: pancakes + eggs", "Lunch: chicken salad wrap", "Dinner: burgers + potatoes", "Snack: protein bar"] },
      { dayLabel: "Saturday", focus: "Social balance", meals: ["Breakfast: bagel + yogurt", "Lunch: sandwich", "Dinner: social meal", "Snack: fruit"] },
      { dayLabel: "Sunday", focus: "Reset and prep", meals: ["Breakfast: omelet", "Lunch: salad bowl", "Dinner: salmon + rice", "Snack: yogurt"] }
    ]
  };

  return templates[goal];
}

export function getVitalAverages(history: VitalHistoryPoint[]) {
  const relevant = history.length ? history : [];
  if (!relevant.length) {
    return null;
  }

  const sum = <K extends keyof VitalHistoryPoint>(key: K) =>
    relevant.reduce((total, point) => total + Number(point[key]), 0);

  const latest = relevant[0];
  return {
    daily: latest,
    weekly: {
      restingHeartRate: Math.round(sum("restingHeartRate") / relevant.length),
      bodyBattery: Math.round(sum("bodyBattery") / relevant.length),
      steps: Math.round(sum("steps") / relevant.length),
      sleepHours: Number((sum("sleepHours") / relevant.length).toFixed(1)),
      pulseOx: Math.round(sum("pulseOx") / relevant.length),
      caloriesBurned: Math.round(sum("caloriesBurned") / relevant.length)
    }
  };
}
