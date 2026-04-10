import {
  AppPreferences,
  CoachingSuggestion,
  DailyVitals,
  ExerciseDefinition,
  NutritionSnapshot,
  SyncRule,
  UserProfile,
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

export const mockNutrition: NutritionSnapshot = {
  caloriesTarget: 2450,
  caloriesConsumed: 2180,
  proteinGrams: 154,
  carbsGrams: 232,
  fatGrams: 68,
  waterOz: 56
};

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
      { exerciseId: "barbell-row", sets: 4, reps: "8", weightLb: 185 },
      { exerciseId: "rdl", sets: 3, reps: "8", weightLb: 225 }
    ]
  },
  {
    id: "tue",
    dayLabel: "Tuesday",
    focus: "Back + Biceps",
    exercises: [{ exerciseId: "barbell-row", sets: 4, reps: "8", weightLb: 190 }]
  },
  {
    id: "wed",
    dayLabel: "Wednesday",
    focus: "Legs",
    exercises: [{ exerciseId: "rdl", sets: 3, reps: "8", weightLb: 225 }]
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
