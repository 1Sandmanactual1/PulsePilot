import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";

import {
  defaultPreferences,
  defaultGoalSettings,
  mockCheckIns,
  mockDailyMealPlan,
  defaultNutritionTargets,
  defaultRecipes,
  defaultSavedFoods,
  defaultSavedMeals,
  defaultWeightHistory,
  barcodeLibrary,
  mockFoodLog,
  mockNutrition,
  mockProfile,
  mockSuggestions,
  mockVitalHistory,
  mockVitals,
  mockWeeklyPlan
} from "@/data/mock-data";
import { blendSuggestions, buildDailyMealPlan, buildNutritionFromFoodLog, getNutritionTargetsForGoal } from "@/lib/coaching";
import {
  ensureUserProfile,
  FitNotesImportRecord,
  loadFitNotesImports,
  loadDailyVitals,
  loadVitalHistory,
  loadNutrition,
  loadPreferences,
  loadWeeklyCheckIns,
  saveFitNotesImport,
  savePreferences as persistPreferences,
  saveUserProfile,
  saveWeeklyCheckIn
} from "@/lib/database";
import { summarizeFitNotesCsv } from "@/lib/fitnotes";
import { getJson, setJson } from "@/lib/storage";
import { useAuth } from "@/providers/AuthProvider";
import {
  AppPreferences,
  CoachMemory,
  CoachingSuggestion,
  DailyVitals,
  FitnessGoal,
  FitNotesImportSummary,
  GoalSettingsMap,
  NutritionDayPlan,
  NutritionFoodEntry,
  NutritionSnapshot,
  NutritionTargets,
  SavedRecipe,
  SavedFood,
  SavedMealTemplate,
  UserProfile,
  VitalHistoryPoint,
  VitalSyncStatus,
  WeeklyCheckIn,
  WeeklyStrengthFeeling,
  WeightLogEntry,
  WorkoutDay
} from "@/types/domain";

type AppStateContextValue = {
  profile: UserProfile;
  goalSettings: GoalSettingsMap;
  vitals: DailyVitals;
  nutrition: NutritionSnapshot;
  weeklyPlan: WorkoutDay[];
  dailyMealPlan: NutritionDayPlan[];
  nutritionTargets: NutritionTargets;
  suggestions: CoachingSuggestion[];
  preferences: AppPreferences;
  checkIns: WeeklyCheckIn[];
  fitNotesImports: FitNotesImportRecord[];
  fitNotesSummary: FitNotesImportSummary | null;
  foodLog: NutritionFoodEntry[];
  savedFoods: SavedFood[];
  savedMeals: SavedMealTemplate[];
  recipes: SavedRecipe[];
  weightHistory: WeightLogEntry[];
  coachMemory: CoachMemory;
  vitalHistory: VitalHistoryPoint[];
  vitalsStatus: VitalSyncStatus;
  currentFeeling?: WeeklyStrengthFeeling;
  loading: boolean;
  setGoal: (goal: FitnessGoal) => Promise<void>;
  updateGoalSettings: (goal: FitnessGoal, next: GoalSettingsMap[FitnessGoal]) => Promise<void>;
  updateProfile: (next: UserProfile) => Promise<void>;
  updatePreferences: (next: AppPreferences) => Promise<void>;
  submitWeeklyCheckIn: (feeling: WeeklyStrengthFeeling, phase: "start" | "end", notes?: string) => Promise<void>;
  markIntegrationConnected: (key: keyof AppPreferences["integrations"], detail: string) => Promise<void>;
  recordFitNotesImport: (fileName: string, text: string) => Promise<void>;
  addWorkoutExercise: (dayId: string, exerciseName: string, category?: string) => Promise<void>;
  addWorkoutExercises: (dayId: string, exercises: Array<{ exerciseName: string; category?: string }>) => Promise<void>;
  updateWorkoutExercise: (dayId: string, exerciseId: string, next: Partial<WorkoutDay["exercises"][number]>) => Promise<void>;
  removeWorkoutExercise: (dayId: string, exerciseId: string) => Promise<void>;
  addFoodLogEntry: (entry: Omit<NutritionFoodEntry, "id">) => Promise<void>;
  removeFoodLogEntry: (entryId: string) => Promise<void>;
  saveCurrentFoodAsFavorite: (entryId: string) => Promise<void>;
  quickAddSavedFood: (foodId: string) => Promise<void>;
  quickAddSavedMeal: (mealId: string) => Promise<void>;
  saveMealFromCurrentFoods: (name: string, meal: NutritionFoodEntry["meal"]) => Promise<void>;
  updateSavedMeal: (mealId: string, name: string) => Promise<void>;
  removeSavedMeal: (mealId: string) => Promise<void>;
  quickAddRecipe: (recipeId: string, meal?: NutritionFoodEntry["meal"]) => Promise<void>;
  saveRecipeFromFoods: (name: string, servings: number, itemIds: string[]) => Promise<void>;
  scanBarcode: (barcode: string) => Promise<{ matched: boolean; foodName?: string }>;
  updateNutritionTargets: (next: NutritionTargets) => Promise<void>;
  logWeight: (weightLb: number, note?: string) => Promise<void>;
  addMealPlanItem: (dayLabel: string, meal: string) => Promise<void>;
  removeMealPlanItem: (dayLabel: string, meal: string) => Promise<void>;
  updateCoachMemory: (next: Partial<CoachMemory>) => Promise<void>;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

const PREFERENCES_KEY = "pulsepilot.preferences";
const CHECK_INS_KEY = "pulsepilot.check-ins";
const PROFILE_KEY = "pulsepilot.profile";
const GOAL_SETTINGS_KEY = "pulsepilot.goal-settings";
const FITNOTES_SUMMARY_KEY = "pulsepilot.fitnotes-summary";
const WEEKLY_PLAN_KEY = "pulsepilot.weekly-plan";
const FOOD_LOG_KEY = "pulsepilot.food-log";
const NUTRITION_TARGETS_KEY = "pulsepilot.nutrition-targets";
const SAVED_FOODS_KEY = "pulsepilot.saved-foods";
const SAVED_MEALS_KEY = "pulsepilot.saved-meals";
const RECIPES_KEY = "pulsepilot.recipes";
const WEIGHT_HISTORY_KEY = "pulsepilot.weight-history";
const DAILY_MEAL_PLAN_KEY = "pulsepilot.daily-meal-plan";
const COACH_MEMORY_KEY = "pulsepilot.coach-memory";

function isLegacyDemoFoodLog(entries: NutritionFoodEntry[]) {
  const demoIds = ["food-1", "food-2", "food-3", "food-4"];
  return entries.length === demoIds.length && entries.every((entry, index) => entry.id === demoIds[index]);
}

function isLegacyDemoSavedFoods(entries: SavedFood[]) {
  const demoIds = ["saved-food-eggs", "saved-food-bowl"];
  return entries.length === demoIds.length && entries.every((entry, index) => entry.id === demoIds[index]);
}

function isLegacyDemoSavedMeals(entries: SavedMealTemplate[]) {
  return entries.length === 1 && entries[0]?.id === "saved-meal-breakfast";
}

function isLegacyDemoRecipes(entries: SavedRecipe[]) {
  return entries.length === 1 && entries[0]?.id === "recipe-1";
}

function isLegacyDemoWeightHistory(entries: WeightLogEntry[]) {
  const demoIds = ["weight-1", "weight-2", "weight-3"];
  return entries.length === demoIds.length && entries.every((entry, index) => entry.id === demoIds[index]);
}

export function AppStateProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(mockProfile);
  const [goalSettings, setGoalSettings] = useState<GoalSettingsMap>(defaultGoalSettings);
  const [vitals, setVitals] = useState<DailyVitals>(mockVitals);
  const [nutrition, setNutrition] = useState<NutritionSnapshot>(mockNutrition);
  const [foodLog, setFoodLog] = useState<NutritionFoodEntry[]>(mockFoodLog);
  const [weeklyPlan, setWeeklyPlan] = useState<WorkoutDay[]>(mockWeeklyPlan);
  const [dailyMealPlan, setDailyMealPlan] = useState<NutritionDayPlan[]>(mockDailyMealPlan);
  const [nutritionTargets, setNutritionTargets] = useState<NutritionTargets>(defaultNutritionTargets);
  const [savedFoods, setSavedFoods] = useState<SavedFood[]>(defaultSavedFoods);
  const [savedMeals, setSavedMeals] = useState<SavedMealTemplate[]>(defaultSavedMeals);
  const [recipes, setRecipes] = useState<SavedRecipe[]>(defaultRecipes);
  const [weightHistory, setWeightHistory] = useState<WeightLogEntry[]>(defaultWeightHistory);
  const [coachMemory, setCoachMemory] = useState<CoachMemory>({
    acceptedActionCount: 0,
    declinedActionCount: 0,
    recentTopics: []
  });
  const [vitalHistory, setVitalHistory] = useState<VitalHistoryPoint[]>(mockVitalHistory);
  const [vitalsStatus, setVitalsStatus] = useState<VitalSyncStatus>("demo");
  const [preferences, setPreferences] = useState<AppPreferences>(defaultPreferences);
  const [checkIns, setCheckIns] = useState<WeeklyCheckIn[]>(mockCheckIns);
  const [fitNotesImports, setFitNotesImports] = useState<FitNotesImportRecord[]>([]);
  const [fitNotesSummary, setFitNotesSummary] = useState<FitNotesImportSummary | null>(null);
  const [currentFeeling, setCurrentFeeling] = useState<WeeklyStrengthFeeling | undefined>(mockCheckIns.at(-1)?.feeling);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      const storedProfile = await getJson(PROFILE_KEY, mockProfile);
      const storedGoalSettings = await getJson(GOAL_SETTINGS_KEY, defaultGoalSettings);
      const storedPrefs = await getJson(PREFERENCES_KEY, defaultPreferences);
      const storedCheckIns = await getJson(CHECK_INS_KEY, mockCheckIns);
      const storedFitNotesSummary = await getJson<FitNotesImportSummary | null>(FITNOTES_SUMMARY_KEY, null);
      const storedWeeklyPlan = await getJson(WEEKLY_PLAN_KEY, mockWeeklyPlan);
      const storedFoodLog = await getJson(FOOD_LOG_KEY, mockFoodLog);
      const storedNutritionTargets = await getJson(NUTRITION_TARGETS_KEY, defaultNutritionTargets);
      const storedSavedFoods = await getJson(SAVED_FOODS_KEY, defaultSavedFoods);
      const storedSavedMeals = await getJson(SAVED_MEALS_KEY, defaultSavedMeals);
      const storedRecipes = await getJson(RECIPES_KEY, defaultRecipes);
      const storedWeightHistory = await getJson(WEIGHT_HISTORY_KEY, defaultWeightHistory);
      const storedDailyMealPlan = await getJson(DAILY_MEAL_PLAN_KEY, mockDailyMealPlan);
      const storedCoachMemory = await getJson<CoachMemory>(COACH_MEMORY_KEY, {
        acceptedActionCount: 0,
        declinedActionCount: 0,
        recentTopics: []
      });
      let nextProfile = storedProfile;
      let nextGoalSettings = storedGoalSettings;
      let nextVitals = mockVitals;
      let nextNutrition = mockNutrition;
      let nextFoodLog = storedFoodLog;
      let nextWeeklyPlan = storedWeeklyPlan;
      let nextDailyMealPlan = storedDailyMealPlan;
      let nextNutritionTargets = storedNutritionTargets;
      let nextSavedFoods = storedSavedFoods;
      let nextSavedMeals = storedSavedMeals;
      let nextRecipes = storedRecipes;
      let nextWeightHistory = storedWeightHistory;
      let nextVitalHistory = mockVitalHistory;
      let nextVitalsStatus: VitalSyncStatus = "demo";
      let nextPreferences = storedPrefs;
      let nextCheckIns = storedCheckIns;
      let nextFitNotesImports: FitNotesImportRecord[] = [];
      let nextFitNotesSummary = storedFitNotesSummary;

      if (isLegacyDemoFoodLog(storedFoodLog)) {
        nextFoodLog = [];
        await setJson(FOOD_LOG_KEY, []);
      }

      if (isLegacyDemoSavedFoods(storedSavedFoods)) {
        nextSavedFoods = [];
        await setJson(SAVED_FOODS_KEY, []);
      }

      if (isLegacyDemoSavedMeals(storedSavedMeals)) {
        nextSavedMeals = [];
        await setJson(SAVED_MEALS_KEY, []);
      }

      if (isLegacyDemoRecipes(storedRecipes)) {
        nextRecipes = [];
        await setJson(RECIPES_KEY, []);
      }

      if (isLegacyDemoWeightHistory(storedWeightHistory)) {
        nextWeightHistory = [];
        await setJson(WEIGHT_HISTORY_KEY, []);
      }

      if (session?.user) {
        nextProfile = await ensureUserProfile({
          id: session.user.id,
          email: session.user.email
        });
        const liveVitalHistory = await loadVitalHistory(session.user.id);
        nextVitalHistory = liveVitalHistory.length ? liveVitalHistory : mockVitalHistory;
        nextVitalsStatus = liveVitalHistory.length ? "live" : "demo";
        nextVitals = liveVitalHistory[0]
          ? {
              sleepHours: liveVitalHistory[0].sleepHours,
              restingHeartRate: liveVitalHistory[0].restingHeartRate,
              bodyBattery: liveVitalHistory[0].bodyBattery,
              stressLevel: liveVitalHistory[0].stressLevel,
              pulseOx: liveVitalHistory[0].pulseOx,
              caloriesBurned: liveVitalHistory[0].caloriesBurned,
              steps: liveVitalHistory[0].steps
            }
          : await loadDailyVitals(session.user.id);
        nextNutrition = await loadNutrition(session.user.id);
        nextPreferences = {
          ...(await loadPreferences(session.user.id)),
          integrations: storedPrefs.integrations
        };
        nextCheckIns = await loadWeeklyCheckIns(session.user.id);
        nextFitNotesImports = await loadFitNotesImports(session.user.id);
      }

      if (!nextDailyMealPlan.length) {
        nextDailyMealPlan = buildDailyMealPlan(nextProfile.goal);
      }

      const autoTargets = getNutritionTargetsForGoal(
        nextProfile.goal,
        nextProfile.currentWeightLb,
        nextProfile.age,
        nextGoalSettings[nextProfile.goal],
        nextProfile.heightInches,
        nextProfile.biologicalSex
      );
      const macroTargets = {
        calories: nextNutritionTargets.calories || autoTargets.calories,
        proteinGrams: nextNutritionTargets.proteinGrams || autoTargets.proteinGrams,
        carbsGrams: nextNutritionTargets.carbsGrams || autoTargets.carbsGrams,
        fatGrams: nextNutritionTargets.fatGrams || autoTargets.fatGrams
      };
      const nutritionWithTargets = {
        ...nextNutrition,
        caloriesTarget: macroTargets.calories,
        proteinGrams: nextNutrition.proteinGrams,
        carbsGrams: nextNutrition.carbsGrams,
        fatGrams: nextNutrition.fatGrams
      };
      const derivedNutrition = buildNutritionFromFoodLog(nextFoodLog, nutritionWithTargets);
      nextDailyMealPlan = buildDailyMealPlan(nextProfile.goal);

      setProfile(nextProfile);
      setGoalSettings(nextGoalSettings);
      setVitals(nextVitals);
      setNutrition({
        ...derivedNutrition,
        caloriesTarget: macroTargets.calories
      });
      setFoodLog(nextFoodLog);
      setWeeklyPlan(nextWeeklyPlan);
      setDailyMealPlan(nextDailyMealPlan);
      setNutritionTargets(macroTargets);
      setSavedFoods(nextSavedFoods);
      setSavedMeals(nextSavedMeals);
      setRecipes(nextRecipes);
      setWeightHistory(nextWeightHistory);
      setCoachMemory(storedCoachMemory);
      setVitalHistory(nextVitalHistory);
      setVitalsStatus(nextVitalsStatus);
      setPreferences(nextPreferences);
      setCheckIns(nextCheckIns);
      setFitNotesImports(nextFitNotesImports);
      setFitNotesSummary(nextFitNotesSummary);
      setCurrentFeeling(nextCheckIns.at(-1)?.feeling);
      setLoading(false);
    }

    bootstrap().catch(() => {
      setLoading(false);
    });
  }, [session?.user?.id]);

  async function updatePreferences(next: AppPreferences) {
    setPreferences(next);
    await setJson(PREFERENCES_KEY, next);
    if (session?.user) {
      await persistPreferences(session.user.id, next);
    }
  }

  async function updateProfile(next: UserProfile) {
    setProfile(next);
    await setJson(PROFILE_KEY, next);
    const macroTargets = getNutritionTargetsForGoal(
      next.goal,
      next.currentWeightLb,
      next.age,
      goalSettings[next.goal],
      next.heightInches,
      next.biologicalSex
    );
    const nextDailyPlan = buildDailyMealPlan(next.goal);
    setNutritionTargets(macroTargets);
    await setJson(NUTRITION_TARGETS_KEY, macroTargets);
    setNutrition((current) => ({
      ...current,
      caloriesTarget: macroTargets.calories
    }));
    setDailyMealPlan(nextDailyPlan);
    await setJson(DAILY_MEAL_PLAN_KEY, nextDailyPlan);
    if (session?.user) {
      await saveUserProfile(session.user.id, next);
    }
  }

  async function submitWeeklyCheckIn(feeling: WeeklyStrengthFeeling, phase: "start" | "end", notes?: string) {
    const nextEntry: WeeklyCheckIn = {
      weekOf: new Date().toISOString().slice(0, 10),
      phase,
      feeling,
      notes
    };

    const next = [...checkIns, nextEntry];
    setCheckIns(next);
    setCurrentFeeling(feeling);
    await setJson(CHECK_INS_KEY, next);
    if (session?.user) {
      await saveWeeklyCheckIn(session.user.id, nextEntry);
    }
  }

  async function setGoal(goal: FitnessGoal) {
    const next = {
      ...profile,
      goal
    };
    await updateProfile(next);
  }

  async function updateGoalSettings(goal: FitnessGoal, next: GoalSettingsMap[FitnessGoal]) {
    const merged = {
      ...goalSettings,
      [goal]: {
        ...goalSettings[goal],
        ...next
      }
    };
    setGoalSettings(merged);
    await setJson(GOAL_SETTINGS_KEY, merged);
    if (profile.goal === goal) {
      const macroTargets = getNutritionTargetsForGoal(
        goal,
        profile.currentWeightLb,
        profile.age,
        merged[goal],
        profile.heightInches,
        profile.biologicalSex
      );
      setNutrition((current) => ({
        ...current,
        caloriesTarget: macroTargets.calories
      }));
      setNutritionTargets(macroTargets);
      const nextDailyPlan = buildDailyMealPlan(goal);
      setDailyMealPlan(nextDailyPlan);
      await setJson(DAILY_MEAL_PLAN_KEY, nextDailyPlan);
    }
  }

  async function markIntegrationConnected(key: keyof AppPreferences["integrations"], detail: string) {
    const status =
      key === "fitnotes" ? "connected" : key === "myfitnesspal" ? "connected" : ("partner-required" as const);
    const next = {
      ...preferences,
      integrations: {
        ...preferences.integrations,
        [key]: {
          ...preferences.integrations[key],
          status,
          detail
        }
      }
    };
    await updatePreferences(next);
  }

  async function recordFitNotesImport(fileName: string, text: string) {
    const summary = summarizeFitNotesCsv(fileName, text);
    const next = {
      ...preferences,
      integrations: {
        ...preferences.integrations,
        fitnotes: {
          ...preferences.integrations.fitnotes,
          status: "connected" as const,
          detail: `Imported ${summary.totalRows} rows across ${summary.totalSessions} workout sessions from ${fileName}.`
        }
      }
    };
    await updatePreferences(next);
    setFitNotesSummary(summary);
    await setJson(FITNOTES_SUMMARY_KEY, summary);
    if (session?.user) {
      await saveFitNotesImport(session.user.id, fileName, summary.totalRows);
      setFitNotesImports(await loadFitNotesImports(session.user.id));
    }
  }

  async function persistWeeklyPlan(next: WorkoutDay[]) {
    setWeeklyPlan(next);
    await setJson(WEEKLY_PLAN_KEY, next);
  }

  async function addWorkoutExercise(dayId: string, exerciseName: string, category = "Custom") {
    const next = weeklyPlan.map((day) =>
      day.id === dayId
        ? {
            ...day,
            exercises: [
              ...day.exercises,
              {
                id: `${dayId}-${Date.now()}`,
                exerciseName,
                category,
                sets: 3,
                reps: "8-10",
                weightLb: 0
              }
            ]
          }
        : day
    );
    await persistWeeklyPlan(next);
  }

  async function addWorkoutExercises(dayId: string, exercises: Array<{ exerciseName: string; category?: string }>) {
    if (!exercises.length) {
      return;
    }

    const next = weeklyPlan.map((day) =>
      day.id === dayId
        ? {
            ...day,
            exercises: [
              ...day.exercises,
              ...exercises.map((exercise) => ({
                id: `${dayId}-${Date.now()}-${exercise.exerciseName.replace(/\s+/g, "-").toLowerCase()}`,
                exerciseName: exercise.exerciseName,
                category: exercise.category || "Custom",
                sets: 3,
                reps: "8-10",
                weightLb: 0
              }))
            ]
          }
        : day
    );

    await persistWeeklyPlan(next);
  }

  async function updateWorkoutExercise(dayId: string, exerciseId: string, nextUpdate: Partial<WorkoutDay["exercises"][number]>) {
    const next = weeklyPlan.map((day) =>
      day.id === dayId
        ? {
            ...day,
            exercises: day.exercises.map((exercise) =>
              exercise.id === exerciseId ? { ...exercise, ...nextUpdate } : exercise
            )
          }
        : day
    );
    await persistWeeklyPlan(next);
  }

  async function removeWorkoutExercise(dayId: string, exerciseId: string) {
    const next = weeklyPlan.map((day) =>
      day.id === dayId
        ? {
            ...day,
            exercises: day.exercises.filter((exercise) => exercise.id !== exerciseId)
          }
        : day
    );
    await persistWeeklyPlan(next);
  }

  async function addFoodLogEntry(entry: Omit<NutritionFoodEntry, "id">) {
    const next = [
      {
        ...entry,
        id: `food-${Date.now()}`
      },
      ...foodLog
    ];
    setFoodLog(next);
    await setJson(FOOD_LOG_KEY, next);
    const macroTargets = nutritionTargets.calories
      ? nutritionTargets
      : getNutritionTargetsForGoal(
          profile.goal,
          profile.currentWeightLb,
          profile.age,
          goalSettings[profile.goal],
          profile.heightInches,
          profile.biologicalSex
        );
    setNutrition(
      buildNutritionFromFoodLog(next, {
        ...nutrition,
        caloriesTarget: macroTargets.calories
      })
    );
  }

  async function removeFoodLogEntry(entryId: string) {
    const next = foodLog.filter((entry) => entry.id !== entryId);
    setFoodLog(next);
    await setJson(FOOD_LOG_KEY, next);
    const macroTargets = nutritionTargets.calories
      ? nutritionTargets
      : getNutritionTargetsForGoal(
          profile.goal,
          profile.currentWeightLb,
          profile.age,
          goalSettings[profile.goal],
          profile.heightInches,
          profile.biologicalSex
        );
    setNutrition(
      buildNutritionFromFoodLog(next, {
        ...nutrition,
        caloriesTarget: macroTargets.calories
      })
    );
  }

  async function saveCurrentFoodAsFavorite(entryId: string) {
    const entry = foodLog.find((item) => item.id === entryId);
    if (!entry) {
      return;
    }

    const next = [
      {
        id: `saved-food-${Date.now()}`,
        name: entry.name,
        defaultMeal: entry.meal,
        calories: entry.calories,
        proteinGrams: entry.proteinGrams,
        carbsGrams: entry.carbsGrams,
        fatGrams: entry.fatGrams
      },
      ...savedFoods
    ];
    setSavedFoods(next);
    await setJson(SAVED_FOODS_KEY, next);
  }

  async function quickAddSavedFood(foodId: string) {
    const food = savedFoods.find((item) => item.id === foodId);
    if (!food) {
      return;
    }

    await addFoodLogEntry({
      name: food.name,
      meal: food.defaultMeal,
      calories: food.calories,
      proteinGrams: food.proteinGrams,
      carbsGrams: food.carbsGrams,
      fatGrams: food.fatGrams
    });
  }

  async function quickAddSavedMeal(mealId: string) {
    const meal = savedMeals.find((item) => item.id === mealId);
    if (!meal) {
      return;
    }

    for (const item of meal.items) {
      await addFoodLogEntry({
        name: item.name,
        meal: meal.meal,
        calories: item.calories,
        proteinGrams: item.proteinGrams,
        carbsGrams: item.carbsGrams,
        fatGrams: item.fatGrams
      });
    }
  }

  async function saveMealFromCurrentFoods(name: string, meal: NutritionFoodEntry["meal"]) {
    const items = foodLog.filter((entry) => entry.meal === meal);
    if (!items.length || !name.trim()) {
      return;
    }

    const next = [
      {
        id: `saved-meal-${Date.now()}`,
        name: name.trim(),
        meal,
        items: items.map((item) => ({ ...item, id: `${item.id}-template` }))
      },
      ...savedMeals
    ];
    setSavedMeals(next);
    await setJson(SAVED_MEALS_KEY, next);
  }

  async function updateSavedMeal(mealId: string, name: string) {
    const next = savedMeals.map((meal) => (meal.id === mealId ? { ...meal, name: name.trim() || meal.name } : meal));
    setSavedMeals(next);
    await setJson(SAVED_MEALS_KEY, next);
  }

  async function removeSavedMeal(mealId: string) {
    const next = savedMeals.filter((meal) => meal.id !== mealId);
    setSavedMeals(next);
    await setJson(SAVED_MEALS_KEY, next);
  }

  async function quickAddRecipe(recipeId: string, meal?: NutritionFoodEntry["meal"]) {
    const recipe = recipes.find((item) => item.id === recipeId);
    if (!recipe) {
      return;
    }

    for (const item of recipe.items) {
      await addFoodLogEntry({
        name: item.name,
        meal: meal ?? item.meal,
        calories: Math.round(item.calories / Math.max(recipe.servings, 1)),
        proteinGrams: Math.round(item.proteinGrams / Math.max(recipe.servings, 1)),
        carbsGrams: Math.round(item.carbsGrams / Math.max(recipe.servings, 1)),
        fatGrams: Math.round(item.fatGrams / Math.max(recipe.servings, 1))
      });
    }
  }

  async function saveRecipeFromFoods(name: string, servings: number, itemIds: string[]) {
    const items = foodLog.filter((entry) => itemIds.includes(entry.id));
    if (!items.length || !name.trim()) {
      return;
    }

    const next = [
      {
        id: `recipe-${Date.now()}`,
        name: name.trim(),
        servings: Math.max(servings, 1),
        items: items.map((item) => ({ ...item, id: `${item.id}-recipe` }))
      },
      ...recipes
    ];
    setRecipes(next);
    await setJson(RECIPES_KEY, next);
  }

  async function scanBarcode(barcode: string) {
    const found = barcodeLibrary.find((entry) => entry.barcode === barcode.trim());
    if (!found) {
      return { matched: false };
    }

    await addFoodLogEntry(found.food);
    return { matched: true, foodName: found.food.name };
  }

  async function updateNutritionTargets(next: NutritionTargets) {
    setNutritionTargets(next);
    await setJson(NUTRITION_TARGETS_KEY, next);
    setNutrition((current) => ({
      ...current,
      caloriesTarget: next.calories
    }));
  }

  async function logWeight(weightLb: number, note?: string) {
    const entry: WeightLogEntry = {
      id: `weight-${Date.now()}`,
      loggedAt: new Date().toISOString(),
      weightLb,
      note
    };
    const next = [entry, ...weightHistory];
    setWeightHistory(next);
    await setJson(WEIGHT_HISTORY_KEY, next);
    await updateProfile({
      ...profile,
      currentWeightLb: weightLb
    });
  }

  async function addMealPlanItem(dayLabel: string, meal: string) {
    const next = dailyMealPlan.map((day) =>
      day.dayLabel === dayLabel ? { ...day, meals: [...day.meals, meal] } : day
    );
    setDailyMealPlan(next);
    await setJson(DAILY_MEAL_PLAN_KEY, next);
  }

  async function removeMealPlanItem(dayLabel: string, meal: string) {
    const next = dailyMealPlan.map((day) =>
      day.dayLabel === dayLabel ? { ...day, meals: day.meals.filter((entry) => entry !== meal) } : day
    );
    setDailyMealPlan(next);
    await setJson(DAILY_MEAL_PLAN_KEY, next);
  }

  async function updateCoachMemory(next: Partial<CoachMemory>) {
    const merged = {
      ...coachMemory,
      ...next,
      recentTopics: next.recentTopics ?? coachMemory.recentTopics
    };
    setCoachMemory(merged);
    await setJson(COACH_MEMORY_KEY, merged);
  }

  return (
    <AppStateContext.Provider
      value={{
        profile,
        goalSettings,
        vitals,
        nutrition,
        weeklyPlan,
        dailyMealPlan,
        nutritionTargets,
        suggestions: blendSuggestions(mockSuggestions, currentFeeling),
        preferences,
        checkIns,
        fitNotesImports,
        fitNotesSummary,
        foodLog,
        savedFoods,
        savedMeals,
        recipes,
        weightHistory,
        coachMemory,
        vitalHistory,
        vitalsStatus,
        currentFeeling,
        loading,
        setGoal,
        updateGoalSettings,
        updateProfile,
        updatePreferences,
        submitWeeklyCheckIn,
        markIntegrationConnected,
        recordFitNotesImport,
        addWorkoutExercise,
        addWorkoutExercises,
        updateWorkoutExercise,
        removeWorkoutExercise,
        addFoodLogEntry,
        removeFoodLogEntry,
        saveCurrentFoodAsFavorite,
        quickAddSavedFood,
        quickAddSavedMeal,
        saveMealFromCurrentFoods,
        updateSavedMeal,
        removeSavedMeal,
        quickAddRecipe,
        saveRecipeFromFoods,
        scanBarcode,
        updateNutritionTargets,
        logWeight,
        addMealPlanItem,
        removeMealPlanItem,
        updateCoachMemory
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const value = useContext(AppStateContext);
  if (!value) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }

  return value;
}
