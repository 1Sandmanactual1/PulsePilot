import { PropsWithChildren, createContext, useContext, useEffect, useState } from "react";

import { defaultPreferences, mockCheckIns, mockNutrition, mockProfile, mockSuggestions, mockVitals, mockWeeklyPlan } from "@/data/mock-data";
import { blendSuggestions } from "@/lib/coaching";
import {
  ensureUserProfile,
  FitNotesImportRecord,
  loadFitNotesImports,
  loadDailyVitals,
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
  NutritionSnapshot,
  UserProfile,
  WeeklyCheckIn,
  WeeklyStrengthFeeling,
  WorkoutDay
} from "@/types/domain";

type AppStateContextValue = {
  profile: UserProfile;
  vitals: DailyVitals;
  nutrition: NutritionSnapshot;
  weeklyPlan: WorkoutDay[];
  suggestions: CoachingSuggestion[];
  preferences: AppPreferences;
  checkIns: WeeklyCheckIn[];
  fitNotesImports: FitNotesImportRecord[];
  fitNotesSummary: FitNotesImportSummary | null;
  currentFeeling?: WeeklyStrengthFeeling;
  loading: boolean;
  setGoal: (goal: FitnessGoal) => Promise<void>;
  updateProfile: (next: UserProfile) => Promise<void>;
  updatePreferences: (next: AppPreferences) => Promise<void>;
  submitWeeklyCheckIn: (feeling: WeeklyStrengthFeeling, phase: "start" | "end", notes?: string) => Promise<void>;
  markIntegrationConnected: (key: keyof AppPreferences["integrations"], detail: string) => Promise<void>;
  recordFitNotesImport: (fileName: string, text: string) => Promise<void>;
};

const AppStateContext = createContext<AppStateContextValue | undefined>(undefined);

const PREFERENCES_KEY = "pulsepilot.preferences";
const CHECK_INS_KEY = "pulsepilot.check-ins";
const PROFILE_KEY = "pulsepilot.profile";
const FITNOTES_SUMMARY_KEY = "pulsepilot.fitnotes-summary";

export function AppStateProvider({ children }: PropsWithChildren) {
  const { session } = useAuth();
  const [profile, setProfile] = useState<UserProfile>(mockProfile);
  const [vitals, setVitals] = useState<DailyVitals>(mockVitals);
  const [nutrition, setNutrition] = useState<NutritionSnapshot>(mockNutrition);
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
      let nextProfile = storedProfile;
      let nextVitals = mockVitals;
      let nextNutrition = mockNutrition;
      let nextPreferences = storedPrefs;
      let nextCheckIns = storedCheckIns;
      let nextFitNotesImports: FitNotesImportRecord[] = [];
      let nextFitNotesSummary = storedFitNotesSummary;

      if (session?.user) {
        nextProfile = await ensureUserProfile({
          id: session.user.id,
          email: session.user.email
        });
        nextVitals = await loadDailyVitals(session.user.id);
        nextNutrition = await loadNutrition(session.user.id);
        nextPreferences = {
          ...(await loadPreferences(session.user.id)),
          integrations: storedPrefs.integrations
        };
        nextCheckIns = await loadWeeklyCheckIns(session.user.id);
        nextFitNotesImports = await loadFitNotesImports(session.user.id);
      }

      setProfile(nextProfile);
      setVitals(nextVitals);
      setNutrition(nextNutrition);
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
    setProfile(next);
    await setJson(PROFILE_KEY, next);
    if (session?.user) {
      await saveUserProfile(session.user.id, next);
    }
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

  return (
    <AppStateContext.Provider
      value={{
        profile,
        vitals,
        nutrition,
        weeklyPlan: mockWeeklyPlan,
        suggestions: blendSuggestions(mockSuggestions, currentFeeling),
        preferences,
        checkIns,
        fitNotesImports,
        fitNotesSummary,
        currentFeeling,
        loading,
        setGoal,
        updateProfile,
        updatePreferences,
        submitWeeklyCheckIn,
        markIntegrationConnected,
        recordFitNotesImport
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
