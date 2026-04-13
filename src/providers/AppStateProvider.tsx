import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";

import {
  defaultPreferences,
  mockCheckIns,
  mockDailyMealPlan,
  defaultNutritionTargets,
  defaultSavedFoods,
  defaultSavedMeals,
  defaultWeightHistory,
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
  CoachingSuggestion,
  DailyVitals,
  FitnessGoal,
  FitNotesImportSummary,
  NutritionDayPlan,
  NutritionFoodEntry,
  NutritionSnapshot,
  NutritionTargets,
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
  weightHistory: WeightLogEntry[];
  vitalHistory: VitalHistoryPoint[];
  vitalsStatus: VitalSyncStatus;
  currentFeeling?: WeeklyStrengthFeeling;
  loading: boolean;
  setGoal: (goal: FitnessGoal) => Promise<void>;
  updateProfile: (next: UserProfile) => Promise<void>;
  updatePreferences: (next: AppPreferences) => Promise<void>;
  submitWeeklyCheckIn: (feeling: WeeklyStrengthFeeling, phase: "start" | "end", notes?: string) => Promise<void>;
  markIntegrationConnected: (key: keyof AppPreferences["integrations"], detail: string) => Promise<void>;
  recordFitNotesImport: (fileName: string, text: string) => Promise<void>;
  addWorkoutExercise: (dayId: string, exerciseName: string, category?: string) => Promise<void>;
  updateWorkoutExercise: (dayId: string, exerciseId: string, next: Partial<WorkoutDay["exercises"][number]>) => Promise<void>;
  removeWorkoutExercise: (dayId: string, exerciseId: string) => Promise<void>;
  addFoodLogEntry: (entry: Omit<NutritionFoodEntry, "id">) => Promise<void>;
  removeFoodLogEntry: (entryId: string) => Promise<void>;
  saveCurrentFoodAsFavorite: (entryId: string) => Promise<void>;
  quickAddSavedFood: (foodId: string) => Promise<void>;
  quickAddSavedMeal: (mealId: string) => Promise<void>;
  saveMealFromCurrentFoods: (name: string, meal: NutritionFoodEntry["meal"]) => Promise<void>;
  updateNutritionTargets: (next: NutritionTargets) => Promise<void>;
  logWeight: (weightLb: number, note?: string) => Promise<void>;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

const PREFERENCES_KEY = "pulsepilot.preferences";
const CHECK_INS_KEY = "pulsepilot.check-ins";
const PROFILE_KEY = "pulsepilot.profile";
const FITNOTES_SUMMARY_KEY = "pulsepilot.fitnotes-summary";
const WEEKLY_PLAN_KEY = "pulsepilot.weekly-plan";
const FOOD_LOG_KEY = "pulsepilot.food-log";
const NUTRITION_TARGETS_KEY = "pulsepilot.nutrition-targets";
const SAVED_FOODS_KEY = "pulsepilot.saved-foods";
const SAVED_MEALS_KEY = "pulsepilot.saved-meals";
const WEIGHT_HISTORY_KEY = "pulsepilot.weight-history";

export function AppStateProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(mockProfile);
  const [vitals, setVitals] = useState<DailyVitals>(mockVitals);
  const [nutrition, setNutrition] = useState<NutritionSnapshot>(mockNutrition);
  const [foodLog, setFoodLog] = useState<NutritionFoodEntry[]>(mockFoodLog);
  const [weeklyPlan, setWeeklyPlan] = useState<WorkoutDay[]>(mockWeeklyPlan);
  const [dailyMealPlan, setDailyMealPlan] = useState<NutritionDayPlan[]>(mockDailyMealPlan);
  const [nutritionTargets, setNutritionTargets] = useState<NutritionTargets>(defaultNutritionTargets);
  const [savedFoods, setSavedFoods] = useState<SavedFood[]>(defaultSavedFoods);
  const [savedMeals, setSavedMeals] = useState<SavedMealTemplate[]>(defaultSavedMeals);
  const [weightHistory, setWeightHistory] = useState<WeightLogEntry[]>(defaultWeightHistory);
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
      const storedPrefs = await getJson(PREFERENCES_KEY, defaultPreferences);
      const storedCheckIns = await getJson(CHECK_INS_KEY, mockCheckIns);
      const storedFitNotesSummary = await getJson<FitNotesImportSummary | null>(FITNOTES_SUMMARY_KEY, null);
      const storedWeeklyPlan = await getJson(WEEKLY_PLAN_KEY, mockWeeklyPlan);
      const storedFoodLog = await getJson(FOOD_LOG_KEY, mockFoodLog);
      const storedNutritionTargets = await getJson(NUTRITION_TARGETS_KEY, defaultNutritionTargets);
      const storedSavedFoods = await getJson(SAVED_FOODS_KEY, defaultSavedFoods);
      const storedSavedMeals = await getJson(SAVED_MEALS_KEY, defaultSavedMeals);
      const storedWeightHistory = await getJson(WEIGHT_HISTORY_KEY, defaultWeightHistory);
      let nextProfile = storedProfile;
      let nextVitals = mockVitals;
      let nextNutrition = mockNutrition;
      let nextFoodLog = storedFoodLog;
      let nextWeeklyPlan = storedWeeklyPlan;
      let nextDailyMealPlan = buildDailyMealPlan(storedProfile.goal);
      let nextNutritionTargets = storedNutritionTargets;
      let nextSavedFoods = storedSavedFoods;
      let nextSavedMeals = storedSavedMeals;
      let nextWeightHistory = storedWeightHistory;
      let nextVitalHistory = mockVitalHistory;
      let nextVitalsStatus: VitalSyncStatus = "demo";
      let nextPreferences = storedPrefs;
      let nextCheckIns = storedCheckIns;
      let nextFitNotesImports: FitNotesImportRecord[] = [];
      let nextFitNotesSummary = storedFitNotesSummary;

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

      const autoTargets = getNutritionTargetsForGoal(nextProfile.goal, nextProfile.currentWeightLb);
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
      setWeightHistory(nextWeightHistory);
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
    const macroTargets = getNutritionTargetsForGoal(next.goal, next.currentWeightLb);
    setNutrition((current) => ({
      ...current,
      caloriesTarget: nutritionTargets.calories || macroTargets.calories
    }));
    setDailyMealPlan(buildDailyMealPlan(next.goal));
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
    const macroTargets = nutritionTargets.calories ? nutritionTargets : getNutritionTargetsForGoal(profile.goal, profile.currentWeightLb);
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
    const macroTargets = nutritionTargets.calories ? nutritionTargets : getNutritionTargetsForGoal(profile.goal, profile.currentWeightLb);
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

  return (
    <AppStateContext.Provider
      value={{
        profile,
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
        weightHistory,
        vitalHistory,
        vitalsStatus,
        currentFeeling,
        loading,
        setGoal,
        updateProfile,
        updatePreferences,
        submitWeeklyCheckIn,
        markIntegrationConnected,
        recordFitNotesImport,
        addWorkoutExercise,
        updateWorkoutExercise,
        removeWorkoutExercise,
        addFoodLogEntry,
        removeFoodLogEntry,
        saveCurrentFoodAsFavorite,
        quickAddSavedFood,
        quickAddSavedMeal,
        saveMealFromCurrentFoods,
        updateNutritionTargets,
        logWeight
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
