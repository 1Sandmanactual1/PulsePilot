export type FitnessGoal =
  | "strength"
  | "hypertrophy"
  | "endurance"
  | "fatloss"
  | "flexibility"
  | "general-health";

export type NotificationMode = "off" | "in-app" | "push";

export type WeeklyStrengthFeeling = "stronger" | "same" | "weaker";
export type IntegrationKey = "garmin" | "myfitnesspal" | "fitnotes";

export type IntegrationStatus = "not-connected" | "needs-import" | "connected" | "partner-required";

export type IntegrationConfig = {
  key: IntegrationKey;
  label: string;
  description: string;
  status: IntegrationStatus;
  detail: string;
};

export type SyncAuthority = "pulsepilot" | "provider" | "two-way" | "import-only";
export type SyncWriteback = "supported" | "planned" | "not-supported";

export type SyncRule = {
  id: string;
  fieldLabel: string;
  provider: IntegrationKey | "pulsepilot";
  authority: SyncAuthority;
  writeback: SyncWriteback;
  pulsePilotBehavior: string;
  providerBehavior: string;
};

export type PromptSetting = {
  enabled: boolean;
  mode: NotificationMode;
};

export type HydrationSettings = PromptSetting & {
  reminderTime: string;
  targetOz: number;
};

export type WeeklyCheckInSettings = PromptSetting & {
  startDay: string;
  endDay: string;
};

export type UserProfile = {
  fullName: string;
  email: string;
  age: number;
  currentWeightLb: number;
  goal: FitnessGoal;
};

export type DailyVitals = {
  sleepHours: number;
  restingHeartRate: number;
  bodyBattery: number;
  stressLevel: "low" | "moderate" | "high";
  pulseOx: number;
  caloriesBurned: number;
  steps: number;
};

export type VitalSyncStatus = "live" | "demo";

export type VitalHistoryPoint = {
  date: string;
  restingHeartRate: number;
  bodyBattery: number;
  steps: number;
  sleepHours: number;
  pulseOx: number;
  caloriesBurned: number;
  stressLevel: DailyVitals["stressLevel"];
  source: VitalSyncStatus;
};

export type NutritionSnapshot = {
  caloriesTarget: number;
  caloriesConsumed: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
  waterOz: number;
};

export type NutritionFoodEntry = {
  id: string;
  name: string;
  meal: "breakfast" | "lunch" | "dinner" | "snack";
  calories: number;
  proteinGrams: number;
  carbsGrams: number;
  fatGrams: number;
};

export type NutritionDayPlan = {
  dayLabel: string;
  focus: string;
  meals: string[];
};

export type ExerciseDefinition = {
  id: string;
  name: string;
  category: string;
  movementPattern: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  whyItWorks: string;
  substitutions: string[];
};

export type WorkoutExercise = {
  id: string;
  exerciseId?: string;
  exerciseName: string;
  category: string;
  sets: number;
  reps: string;
  weightLb: number;
};

export type WorkoutDay = {
  id: string;
  dayLabel: string;
  focus: string;
  exercises: WorkoutExercise[];
};

export type FitNotesWorkoutExerciseSummary = {
  exerciseName: string;
  category: string;
  setCount: number;
  totalReps: number;
  topWeightLb: number;
};

export type FitNotesWorkoutSession = {
  id: string;
  date: string;
  weekday: string;
  exerciseCount: number;
  topCategory: string;
  exercises: FitNotesWorkoutExerciseSummary[];
};

export type FitNotesImportSummary = {
  importedFileName: string;
  importedAt: string;
  totalRows: number;
  totalSessions: number;
  topCategories: Array<{ category: string; count: number }>;
  weekdayDistribution: Array<{ weekday: string; count: number }>;
  recentSessions: FitNotesWorkoutSession[];
};

export type CoachingSuggestion = {
  id: string;
  title: string;
  reason: string;
  impact: string;
};

export type AppPreferences = {
  rememberEmail: boolean;
  staySignedIn: boolean;
  hydration: HydrationSettings;
  weeklyCheckIns: WeeklyCheckInSettings;
  integrations: Record<IntegrationKey, IntegrationConfig>;
  syncRules: SyncRule[];
};

export type WeeklyCheckIn = {
  weekOf: string;
  phase: "start" | "end";
  feeling: WeeklyStrengthFeeling;
  notes?: string;
};
