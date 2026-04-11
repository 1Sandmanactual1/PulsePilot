import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";

import {
  defaultPreferences,
  mockCheckIns,
  mockDailyMealPlan,
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
  UserProfile,
  VitalHistoryPoint,
  VitalSyncStatus,
  WeeklyCheckIn,
  WeeklyStrengthFeeling,
  WorkoutDay
} from "@/types/domain";

type AppStateContextValue = {
  profile: UserProfile;
  vitals: DailyVitals;
  nutrition: NutritionSnapshot;
  weeklyPlan: WorkoutDay[];
  dailyMealPlan: NutritionDayPlan[];
  suggestions: CoachingSuggestion[];
  preferences: AppPreferences;
  checkIns: WeeklyCheckIn[];
  fitNotesImports: FitNotesImportRecord[];
  fitNotesSummary: FitNotesImportSummary | null;
  foodLog: NutritionFoodEntry[];
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
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

const PREFERENCES_KEY = "pulsepilot.preferences";
const CHECK_INS_KEY = "pulsepilot.check-ins";
const PROFILE_KEY = "pulsepilot.profile";
const FITNOTES_SUMMARY_KEY = "pulsepilot.fitnotes-summary";
const WEEKLY_PLAN_KEY = "pulsepilot.weekly-plan";
const FOOD_LOG_KEY = "pulsepilot.food-log";

export function AppStateProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(mockProfile);
  const [vitals, setVitals] = useState<DailyVitals>(mockVitals);
  const [nutrition, setNutrition] = useState<NutritionSnapshot>(mockNutrition);
  const [foodLog, setFoodLog] = useState<NutritionFoodEntry[]>(mockFoodLog);
  const [weeklyPlan, setWeeklyPlan] = useState<WorkoutDay[]>(mockWeeklyPlan);
  const [dailyMealPlan, setDailyMealPlan] = useState<NutritionDayPlan[]>(mockDailyMealPlan);
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
      let nextProfile = storedProfile;
      let nextVitals = mockVitals;
      let nextNutrition = mockNutrition;
      let nextFoodLog = storedFoodLog;
      let nextWeeklyPlan = storedWeeklyPlan;
      let nextDailyMealPlan = buildDailyMealPlan(storedProfile.goal);
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

      const macroTargets = getNutritionTargetsForGoal(nextProfile.goal, nextProfile.currentWeightLb);
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
      caloriesTarget: macroTargets.calories
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
    const next = {
      ...preferences,
      integrations: {
        ...preferences.integrations,
        [key]: {
          ...preferences.integrations[key],
          status: key === "fitnotes" ? ("connected" as const) : ("partner-required" as const),
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
    const macroTargets = getNutritionTargetsForGoal(profile.goal, profile.currentWeightLb);
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
    const macroTargets = getNutritionTargetsForGoal(profile.goal, profile.currentWeightLb);
    setNutrition(
      buildNutritionFromFoodLog(next, {
        ...nutrition,
        caloriesTarget: macroTargets.calories
      })
    );
  }

  return (
    <AppStateContext.Provider
      value={{
        profile,
        vitals,
        nutrition,
        weeklyPlan,
        dailyMealPlan,
        suggestions: blendSuggestions(mockSuggestions, currentFeeling),
        preferences,
        checkIns,
        fitNotesImports,
        fitNotesSummary,
        foodLog,
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
        removeFoodLogEntry
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
