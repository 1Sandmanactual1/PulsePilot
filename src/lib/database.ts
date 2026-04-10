import { defaultPreferences, mockCheckIns, mockNutrition, mockProfile, mockVitals } from "@/data/mock-data";
import { hasSupabaseEnv, supabase } from "@/lib/supabase";
import { AppPreferences, DailyVitals, NutritionSnapshot, UserProfile, WeeklyCheckIn } from "@/types/domain";

export type FitNotesImportRecord = {
  id: string;
  sourceFileName: string;
  importedAt: string;
  rowCount: number;
};

type SessionUser = {
  id: string;
  email?: string;
};

function getClient() {
  if (!hasSupabaseEnv() || !supabase) {
    return null;
  }

  return supabase;
}

export async function ensureUserProfile(user: SessionUser) {
  const client = getClient();
  if (!client) {
    return mockProfile;
  }

  const { data, error } = await client
    .from("user_profiles")
    .select("id, full_name, age, current_weight_lb, goal")
    .eq("id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    const starter = {
      id: user.id,
      full_name: user.email?.split("@")[0] ?? mockProfile.fullName,
      age: mockProfile.age,
      current_weight_lb: mockProfile.currentWeightLb,
      goal: mockProfile.goal
    };

    const { error: insertError } = await client.from("user_profiles").insert(starter);
    if (insertError) {
      throw insertError;
    }

    return {
      ...mockProfile,
      fullName: starter.full_name,
      email: user.email ?? mockProfile.email
    };
  }

  return {
    fullName: data.full_name ?? mockProfile.fullName,
    email: user.email ?? mockProfile.email,
    age: data.age ?? mockProfile.age,
    currentWeightLb: Number(data.current_weight_lb ?? mockProfile.currentWeightLb),
    goal: data.goal ?? mockProfile.goal
  } satisfies UserProfile;
}

export async function saveUserProfile(userId: string, profile: UserProfile) {
  const client = getClient();
  if (!client) {
    return;
  }

  const { error } = await client.from("user_profiles").upsert({
    id: userId,
    full_name: profile.fullName,
    age: profile.age,
    current_weight_lb: profile.currentWeightLb,
    goal: profile.goal,
    updated_at: new Date().toISOString()
  });

  if (error) {
    throw error;
  }
}

export async function loadPreferences(userId: string) {
  const client = getClient();
  if (!client) {
    return defaultPreferences;
  }

  const { data, error } = await client
    .from("user_preferences")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    await savePreferences(userId, defaultPreferences);
    return defaultPreferences;
  }

  return {
    ...defaultPreferences,
    rememberEmail: data.remember_email ?? defaultPreferences.rememberEmail,
    staySignedIn: data.stay_signed_in ?? defaultPreferences.staySignedIn,
    hydration: {
      ...defaultPreferences.hydration,
      enabled: data.hydration_enabled ?? defaultPreferences.hydration.enabled,
      mode: data.hydration_mode ?? defaultPreferences.hydration.mode,
      reminderTime: data.hydration_reminder_time ?? defaultPreferences.hydration.reminderTime,
      targetOz: data.hydration_target_oz ?? defaultPreferences.hydration.targetOz
    },
    weeklyCheckIns: {
      ...defaultPreferences.weeklyCheckIns,
      enabled: data.weekly_checkins_enabled ?? defaultPreferences.weeklyCheckIns.enabled,
      mode: data.weekly_checkins_mode ?? defaultPreferences.weeklyCheckIns.mode,
      startDay: data.weekly_checkins_start_day ?? defaultPreferences.weeklyCheckIns.startDay,
      endDay: data.weekly_checkins_end_day ?? defaultPreferences.weeklyCheckIns.endDay
    }
  } satisfies AppPreferences;
}

export async function savePreferences(userId: string, preferences: AppPreferences) {
  const client = getClient();
  if (!client) {
    return;
  }

  const { error } = await client.from("user_preferences").upsert({
    user_id: userId,
    remember_email: preferences.rememberEmail,
    stay_signed_in: preferences.staySignedIn,
    hydration_enabled: preferences.hydration.enabled,
    hydration_mode: preferences.hydration.mode,
    hydration_reminder_time: preferences.hydration.reminderTime,
    hydration_target_oz: preferences.hydration.targetOz,
    weekly_checkins_enabled: preferences.weeklyCheckIns.enabled,
    weekly_checkins_mode: preferences.weeklyCheckIns.mode,
    weekly_checkins_start_day: preferences.weeklyCheckIns.startDay,
    weekly_checkins_end_day: preferences.weeklyCheckIns.endDay,
    updated_at: new Date().toISOString()
  });

  if (error) {
    throw error;
  }
}

export async function loadWeeklyCheckIns(userId: string) {
  const client = getClient();
  if (!client) {
    return mockCheckIns;
  }

  const { data, error } = await client
    .from("weekly_check_ins")
    .select("week_of, phase, feeling, notes")
    .eq("user_id", userId)
    .order("week_of", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  if (!data?.length) {
    return [];
  }

  return data.map(
    (row) =>
      ({
        weekOf: row.week_of,
        phase: row.phase,
        feeling: row.feeling,
        notes: row.notes ?? undefined
      }) satisfies WeeklyCheckIn
  );
}

export async function saveWeeklyCheckIn(userId: string, entry: WeeklyCheckIn) {
  const client = getClient();
  if (!client) {
    return;
  }

  const { error } = await client.from("weekly_check_ins").insert({
    user_id: userId,
    week_of: entry.weekOf,
    phase: entry.phase,
    feeling: entry.feeling,
    notes: entry.notes ?? null
  });

  if (error) {
    throw error;
  }
}

export async function loadDailyVitals(userId: string) {
  const client = getClient();
  if (!client) {
    return mockVitals;
  }

  const { data, error } = await client
    .from("garmin_daily_metrics")
    .select("*")
    .eq("user_id", userId)
    .order("metric_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return mockVitals;
  }

  return {
    sleepHours: Number(data.sleep_hours ?? mockVitals.sleepHours),
    restingHeartRate: data.resting_heart_rate ?? mockVitals.restingHeartRate,
    bodyBattery: data.body_battery ?? mockVitals.bodyBattery,
    stressLevel: data.stress_level ?? mockVitals.stressLevel,
    pulseOx: data.pulse_ox ?? mockVitals.pulseOx,
    caloriesBurned: data.calories_burned ?? mockVitals.caloriesBurned,
    steps: data.steps ?? mockVitals.steps
  } satisfies DailyVitals;
}

export async function loadNutrition(userId: string) {
  const client = getClient();
  if (!client) {
    return mockNutrition;
  }

  const { data, error } = await client
    .from("nutrition_daily_snapshots")
    .select("*")
    .eq("user_id", userId)
    .order("snapshot_date", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return mockNutrition;
  }

  return {
    caloriesTarget: data.calories_target ?? mockNutrition.caloriesTarget,
    caloriesConsumed: data.calories_consumed ?? mockNutrition.caloriesConsumed,
    proteinGrams: data.protein_grams ?? mockNutrition.proteinGrams,
    carbsGrams: data.carbs_grams ?? mockNutrition.carbsGrams,
    fatGrams: data.fat_grams ?? mockNutrition.fatGrams,
    waterOz: data.water_oz ?? mockNutrition.waterOz
  } satisfies NutritionSnapshot;
}

export async function saveFitNotesImport(userId: string, fileName: string, rowCount: number) {
  const client = getClient();
  if (!client) {
    return;
  }

  const { error } = await client.from("fitnotes_imports").insert({
    user_id: userId,
    source_filename: fileName,
    row_count: rowCount
  });

  if (error) {
    throw error;
  }
}

export async function loadFitNotesImports(userId: string) {
  const client = getClient();
  if (!client) {
    return [] as FitNotesImportRecord[];
  }

  const { data, error } = await client
    .from("fitnotes_imports")
    .select("id, source_filename, imported_at, row_count")
    .eq("user_id", userId)
    .order("imported_at", { ascending: false })
    .limit(10);

  if (error) {
    throw error;
  }

  return (data ?? []).map(
    (row) =>
      ({
        id: row.id,
        sourceFileName: row.source_filename ?? "FitNotes export.csv",
        importedAt: row.imported_at,
        rowCount: row.row_count ?? 0
      }) satisfies FitNotesImportRecord
  );
}
