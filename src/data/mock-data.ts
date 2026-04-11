import {
  AppPreferences,
  CoachingSuggestion,
  DailyVitals,
  ExerciseDefinition,
  NutritionDayPlan,
  NutritionFoodEntry,
  NutritionSnapshot,
  SyncRule,
  UserProfile,
  VitalHistoryPoint,
  WeeklyCheckIn,
  WorkoutDay
} from "@/types/domain";

export const mockProfile: UserProfile = {
  fullName: "Brandt",
  email: "brandt@example.com",
  age: 34,
  currentWeightLb: 198.6,
  goal: "strength"
};

export const mockVitals: DailyVitals = {
  sleepHours: 7.7,
  restingHeartRate: 51,
  bodyBattery: 78,
  stressLevel: "low",
  pulseOx: 97,
  caloriesBurned: 2415,
  steps: 9340
};

export const mockVitalHistory: VitalHistoryPoint[] = [
  { date: "2026-04-10", restingHeartRate: 51, bodyBattery: 78, steps: 9340, sleepHours: 7.7, pulseOx: 97, caloriesBurned: 2415, stressLevel: "low", source: "demo" },
  { date: "2026-04-09", restingHeartRate: 52, bodyBattery: 74, steps: 8750, sleepHours: 7.2, pulseOx: 97, caloriesBurned: 2340, stressLevel: "moderate", source: "demo" },
  { date: "2026-04-08", restingHeartRate: 53, bodyBattery: 76, steps: 10220, sleepHours: 7.9, pulseOx: 98, caloriesBurned: 2490, stressLevel: "low", source: "demo" },
  { date: "2026-04-07", restingHeartRate: 54, bodyBattery: 69, steps: 7840, sleepHours: 6.8, pulseOx: 96, caloriesBurned: 2210, stressLevel: "moderate", source: "demo" },
  { date: "2026-04-06", restingHeartRate: 52, bodyBattery: 81, steps: 11110, sleepHours: 8.1, pulseOx: 97, caloriesBurned: 2560, stressLevel: "low", source: "demo" },
  { date: "2026-04-05", restingHeartRate: 50, bodyBattery: 84, steps: 9025, sleepHours: 8.3, pulseOx: 98, caloriesBurned: 2385, stressLevel: "low", source: "demo" },
  { date: "2026-04-04", restingHeartRate: 51, bodyBattery: 80, steps: 9630, sleepHours: 7.8, pulseOx: 97, caloriesBurned: 2445, stressLevel: "low", source: "demo" }
];

export const mockNutrition: NutritionSnapshot = {
  caloriesTarget: 2450,
  caloriesConsumed: 2180,
  proteinGrams: 154,
  carbsGrams: 232,
  fatGrams: 68,
  waterOz: 56
};

export const mockFoodLog: NutritionFoodEntry[] = [
  {
    id: "food-1",
    name: "Eggs and oats",
    meal: "breakfast",
    calories: 520,
    proteinGrams: 28,
    carbsGrams: 42,
    fatGrams: 24
  },
  {
    id: "food-2",
    name: "Chicken rice bowl",
    meal: "lunch",
    calories: 690,
    proteinGrams: 54,
    carbsGrams: 62,
    fatGrams: 18
  },
  {
    id: "food-3",
    name: "Greek yogurt and berries",
    meal: "snack",
    calories: 310,
    proteinGrams: 24,
    carbsGrams: 34,
    fatGrams: 6
  },
  {
    id: "food-4",
    name: "Steak and potatoes",
    meal: "dinner",
    calories: 660,
    proteinGrams: 48,
    carbsGrams: 46,
    fatGrams: 20
  }
];

export const exerciseLibrary: ExerciseDefinition[] = [
  {
    id: "rdl",
    name: "Romanian Deadlift",
    category: "Posterior Chain",
    movementPattern: "Hip hinge",
    primaryMuscles: ["Hamstrings", "Glutes"],
    secondaryMuscles: ["Spinal erectors", "Adductors", "Forearms"],
    whyItWorks: "Builds eccentric hamstring strength and trains hip extension under load.",
    substitutions: ["Good Morning", "Cable Pull-Through", "45-Degree Back Extension"]
  },
  {
    id: "barbell-row",
    name: "Barbell Row",
    category: "Back",
    movementPattern: "Horizontal pull",
    primaryMuscles: ["Lats", "Mid back"],
    secondaryMuscles: ["Rear delts", "Biceps", "Spinal erectors"],
    whyItWorks: "Builds upper-back thickness and reinforces loaded pulling strength.",
    substitutions: ["Chest Supported Row", "Seal Row", "Cable Row"]
  }
];

export const mockWeeklyPlan: WorkoutDay[] = [
  {
    id: "mon",
    dayLabel: "Monday",
    focus: "Chest + Triceps",
    exercises: [
      { id: "mon-1", exerciseId: "barbell-bench", exerciseName: "Barbell Bench Press", category: "Chest", sets: 4, reps: "6-8", weightLb: 205 },
      { id: "mon-2", exerciseId: "incline-db-press", exerciseName: "Incline Dumbbell Press", category: "Chest", sets: 3, reps: "8-10", weightLb: 70 },
      { id: "mon-3", exerciseId: "rope-pushdown", exerciseName: "Rope Pushdown", category: "Triceps", sets: 3, reps: "12-15", weightLb: 55 }
    ]
  },
  {
    id: "tue",
    dayLabel: "Tuesday",
    focus: "Back + Biceps",
    exercises: [
      { id: "tue-1", exerciseId: "barbell-row", exerciseName: "Barbell Row", category: "Back", sets: 4, reps: "8", weightLb: 190 },
      { id: "tue-2", exerciseId: "lat-pulldown", exerciseName: "Lat Pulldown", category: "Back", sets: 3, reps: "10-12", weightLb: 145 },
      { id: "tue-3", exerciseId: "hammer-curl", exerciseName: "Hammer Curl", category: "Biceps", sets: 3, reps: "10-12", weightLb: 35 }
    ]
  },
  {
    id: "wed",
    dayLabel: "Wednesday",
    focus: "Legs",
    exercises: [
      { id: "wed-1", exerciseId: "back-squat", exerciseName: "Back Squat", category: "Legs", sets: 4, reps: "5-6", weightLb: 255 },
      { id: "wed-2", exerciseId: "rdl", exerciseName: "Romanian Deadlift", category: "Posterior Chain", sets: 3, reps: "8", weightLb: 225 },
      { id: "wed-3", exerciseId: "leg-curl", exerciseName: "Leg Curl", category: "Hamstrings", sets: 3, reps: "12", weightLb: 105 }
    ]
  }
];

export const mockDailyMealPlan: NutritionDayPlan[] = [
  {
    dayLabel: "Monday",
    focus: "Heavy upper day",
    meals: ["Breakfast: oats, eggs, fruit", "Lunch: chicken rice bowl", "Dinner: steak, potatoes, vegetables", "Snack: yogurt + granola"]
  },
  {
    dayLabel: "Tuesday",
    focus: "Pull day support",
    meals: ["Breakfast: bagel, eggs, berries", "Lunch: turkey wrap + rice", "Dinner: salmon, rice, asparagus", "Snack: shake + banana"]
  },
  {
    dayLabel: "Wednesday",
    focus: "Leg day fuel",
    meals: ["Breakfast: overnight oats + whey", "Lunch: chicken pasta bowl", "Dinner: lean beef, potatoes, greens", "Snack: yogurt + cereal"]
  },
  {
    dayLabel: "Thursday",
    focus: "Recovery support",
    meals: ["Breakfast: avocado toast + eggs", "Lunch: burrito bowl", "Dinner: chicken stir-fry", "Snack: cottage cheese + fruit"]
  },
  {
    dayLabel: "Friday",
    focus: "Top-set performance",
    meals: ["Breakfast: pancakes + eggs", "Lunch: double chicken rice bowl", "Dinner: burgers + potatoes", "Snack: protein oats"]
  },
  {
    dayLabel: "Saturday",
    focus: "Flexible social meal day",
    meals: ["Breakfast: Greek yogurt parfait", "Lunch: deli sandwich + fruit", "Dinner: higher-calorie meal fits macros", "Snack: shake or jerky"]
  },
  {
    dayLabel: "Sunday",
    focus: "Meal prep reset",
    meals: ["Breakfast: veggie omelet + toast", "Lunch: chicken salad wrap", "Dinner: salmon + rice", "Snack: berries + yogurt"]
  }
];

export const mockSuggestions: CoachingSuggestion[] = [
  {
    id: "move-rdl",
    title: "Move Romanian Deadlift to Tuesday",
    reason: "Posterior-chain fatigue is crowding your leg day and weakening recovery quality.",
    impact: "Better hinge performance and less overlap before heavy squats."
  },
  {
    id: "row-progress",
    title: "Raise Barbell Row target to 195 lb x 8",
    reason: "You have progressed for two weeks without a recovery drop.",
    impact: "Small progression without overreaching."
  }
];

export const defaultSyncRules: SyncRule[] = [
  {
    id: "body-weight",
    fieldLabel: "Body weight",
    provider: "myfitnesspal",
    authority: "pulsepilot",
    writeback: "planned",
    pulsePilotBehavior: "PulsePilot should be the preferred place to edit current body weight and then sync that value outward where supported.",
    providerBehavior: "If MyFitnessPal weight changes outside PulsePilot, PulsePilot should pull the new value back in and show it as an external update."
  },
  {
    id: "age-profile",
    fieldLabel: "Age",
    provider: "myfitnesspal",
    authority: "pulsepilot",
    writeback: "planned",
    pulsePilotBehavior: "PulsePilot owns the editable age field and should keep the profile current for coaching logic.",
    providerBehavior: "Provider profile values may be read when available, but PulsePilot remains the main editing surface."
  },
  {
    id: "garmin-vitals",
    fieldLabel: "Garmin recovery metrics",
    provider: "garmin",
    authority: "provider",
    writeback: "not-supported",
    pulsePilotBehavior: "PulsePilot reads Garmin vitals and uses them for readiness and coaching.",
    providerBehavior: "Garmin remains authoritative for wearable metrics like Body Battery, stress, pulse ox, and sleep."
  },
  {
    id: "nutrition-diary",
    fieldLabel: "Nutrition diary and calories",
    provider: "myfitnesspal",
    authority: "two-way",
    writeback: "planned",
    pulsePilotBehavior: "PulsePilot should eventually let the user log and plan food directly, then sync matching diary updates where provider access allows it.",
    providerBehavior: "MyFitnessPal updates should flow back into PulsePilot so food history stays current."
  },
  {
    id: "workout-history",
    fieldLabel: "Workout history",
    provider: "fitnotes",
    authority: "import-only",
    writeback: "planned",
    pulsePilotBehavior: "PulsePilot reads imported workout history, analyzes it, and proposes workout changes from that baseline.",
    providerBehavior: "FitNotes starts as import-first. Future export/share helpers can push adjusted plans back out."
  }
];

export const defaultPreferences: AppPreferences = {
  rememberEmail: true,
  staySignedIn: true,
  hydration: {
    enabled: true,
    mode: "push",
    reminderTime: "13:00",
    targetOz: 96
  },
  weeklyCheckIns: {
    enabled: true,
    mode: "in-app",
    startDay: "Monday",
    endDay: "Sunday"
  },
  integrations: {
    garmin: {
      key: "garmin",
      label: "Garmin Connect",
      description: "Sync wearable vitals, sleep, readiness, steps, and workouts from your Garmin ecosystem.",
      status: "partner-required",
      detail: "Connection UI is ready. Final live sync needs Garmin partner/API approval."
    },
    myfitnesspal: {
      key: "myfitnesspal",
      label: "MyFitnessPal",
      description: "Pull weight history, calories, macros, foods, and meal tracking into PulsePilot.",
      status: "partner-required",
      detail: "Connection UI is ready. Final live sync needs MyFitnessPal partner/API access."
    },
    fitnotes: {
      key: "fitnotes",
      label: "FitNotes",
      description: "Import workout history, exercises, sets, reps, and load progression.",
      status: "needs-import",
      detail: "Use export/import first, then upgrade to smoother sync helpers later."
    }
  },
  syncRules: defaultSyncRules
};

export const mockCheckIns: WeeklyCheckIn[] = [
  {
    weekOf: "2026-04-06",
    phase: "start",
    feeling: "same"
  },
  {
    weekOf: "2026-04-06",
    phase: "end",
    feeling: "stronger"
  }
];
