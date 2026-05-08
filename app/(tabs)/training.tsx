import { useMemo, useState } from "react";
import { Alert, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from "react-native";

import { Card } from "@/components/Card";
import { MuscleMap } from "@/components/MuscleMap";
import { ScreenContainer } from "@/components/ScreenContainer";
import { exerciseCategoryOrder, exerciseLibrary } from "@/data/exercise-library";
import { useAppState } from "@/providers/AppStateProvider";
import { ExerciseCategory, ExerciseDefinition, WorkoutDay, WorkoutExercise } from "@/types/domain";
import { colors, radius, spacing } from "@/theme/theme";

type ScreenMode =
  | "log"
  | "categories"
  | "category-detail"
  | "exercise"
  | "exercise-history"
  | "exercise-graph"
  | "calendar"
  | "routines"
  | "new-exercise";

type CalendarView = "month" | "list";
type GraphRange = "1m" | "3m" | "6m" | "1y" | "all";

type LoggedSet = {
  id: string;
  weightLb: number;
  reps: number;
  completed: boolean;
  comment?: string;
};

type SupersetGroup = {
  id: string;
  name: string;
  exerciseIds: string[];
};

type HistoryRow = {
  dateIso: string;
  dateLabel: string;
  sets: Array<{ weightLb: number; reps: number }>;
  source: "local" | "imported";
};

type CalendarWorkout = {
  id: string;
  date: string;
  categories: ExerciseCategory[];
  names: string[];
  summary: string;
};

const weekdayLookup = [
  { id: "sun", label: "Sunday" },
  { id: "mon", label: "Monday" },
  { id: "tue", label: "Tuesday" },
  { id: "wed", label: "Wednesday" },
  { id: "thu", label: "Thursday" },
  { id: "fri", label: "Friday" },
  { id: "sat", label: "Saturday" }
] as const;

const categoryColors: Record<ExerciseCategory, string> = {
  Abs: "#2B3A55",
  Back: "#2682D5",
  Biceps: "#F4A11D",
  Cardio: "#7D8681",
  Chest: "#D34B41",
  Forearms: "#2DCB71",
  Legs: "#49C7C7",
  Shoulders: "#9340C6",
  Triceps: "#34B34A"
};

const defaultFrontCategories = new Set<ExerciseCategory>(["Abs", "Biceps", "Cardio", "Chest", "Forearms", "Legs", "Shoulders"]);
const defaultGraphPointCount: Record<GraphRange, number> = { "1m": 4, "3m": 8, "6m": 12, "1y": 20, all: Number.MAX_SAFE_INTEGER };

function parseReps(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 8;
}

function estimateOneRm(weightLb: number, reps: number) {
  if (!weightLb || !reps) return 0;
  return Number((weightLb * (1 + reps / 30)).toFixed(1));
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, amount: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + amount);
  return next;
}

function toIsoDate(date: Date) {
  return startOfDay(date).toISOString().slice(0, 10);
}

function getWeekdayId(date: Date) {
  return weekdayLookup[date.getDay()].id;
}

function ensureWorkoutDays(plan: WorkoutDay[]) {
  return weekdayLookup.map((entry) => plan.find((day) => day.id === entry.id) ?? { id: entry.id, dayLabel: entry.label, focus: "Workout Log", exercises: [] });
}

function getRelativeDayLabel(date: Date) {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const diff = Math.round((target.getTime() - today.getTime()) / 86400000);
  if (diff === 0) return "TODAY";
  if (diff === 1) return "TOMORROW";
  if (diff === -1) return "YESTERDAY";
  return target.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
}

function getMonthTitle(date: Date) {
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
}

function getMonthMatrix(monthDate: Date) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const start = addDays(first, -first.getDay());
  return Array.from({ length: 42 }, (_, index) => addDays(start, index));
}

function groupByMonth(workouts: CalendarWorkout[]) {
  return workouts.reduce<Record<string, CalendarWorkout[]>>((accumulator, workout) => {
    const key = getMonthTitle(new Date(workout.date));
    accumulator[key] = accumulator[key] ? [...accumulator[key], workout] : [workout];
    return accumulator;
  }, {});
}

function formatHistoryLabel(dateIso: string) {
  return new Date(`${dateIso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric"
  }).toUpperCase();
}

function makeSessionKey(dateIso: string, exerciseName: string) {
  return `${dateIso}::${exerciseName}`;
}

function resolveExerciseView(category: ExerciseCategory | undefined) {
  return category && defaultFrontCategories.has(category) ? "front" : "back";
}

function getExerciseDefinition(allExercises: ExerciseDefinition[], exerciseName: string) {
  return (
    allExercises.find((entry) => entry.name === exerciseName) ??
    allExercises.find((entry) => entry.aliases.some((alias) => alias === exerciseName)) ??
    null
  );
}

function buildImportedHistoryRows(exerciseName: string, fitNotesSummary: ReturnType<typeof useAppState>["fitNotesSummary"]): HistoryRow[] {
  return (fitNotesSummary?.recentSessions ?? [])
    .flatMap((session) => {
      const match = session.exercises.find((exercise) => exercise.exerciseName === exerciseName);
      if (!match) return [];
      return [
        {
          dateIso: session.date.slice(0, 10),
          dateLabel: formatHistoryLabel(session.date.slice(0, 10)),
          source: "imported" as const,
          sets: Array.from({ length: match.setCount }, () => ({
            weightLb: match.topWeightLb,
            reps: Math.max(1, Math.round(match.totalReps / Math.max(match.setCount, 1)))
          }))
        }
      ];
    })
    .sort((left, right) => right.dateIso.localeCompare(left.dateIso));
}

function buildLocalHistoryRows(exerciseName: string, trackSets: Record<string, LoggedSet[]>): HistoryRow[] {
  return Object.entries(trackSets)
    .flatMap(([sessionKey, sets]) => {
      const [dateIso, name] = sessionKey.split("::");
      if (name !== exerciseName || !sets.length) {
        return [];
      }
      return [
        {
          dateIso,
          dateLabel: formatHistoryLabel(dateIso),
          source: "local" as const,
          sets: sets.map((set) => ({ weightLb: set.weightLb, reps: set.reps }))
        }
      ];
    })
    .sort((left, right) => right.dateIso.localeCompare(left.dateIso));
}

export default function TrainingScreen() {
  const {
    fitNotesSummary,
    weeklyPlan,
    addWorkoutExercise,
    addWorkoutExercises,
    updateWorkoutExercise,
    removeWorkoutExercise,
    reorderWorkoutExercise
  } = useAppState();

  const [mode, setMode] = useState<ScreenMode>("log");
  const [selectedDateIso, setSelectedDateIso] = useState(toIsoDate(new Date()));
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>("Abs");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [graphRange, setGraphRange] = useState<GraphRange>("3m");
  const [librarySearch, setLibrarySearch] = useState("");
  const [librarySelection, setLibrarySelection] = useState<string[]>([]);
  const [workoutSelection, setWorkoutSelection] = useState<string[]>([]);
  const [trackSets, setTrackSets] = useState<Record<string, LoggedSet[]>>({});
  const [draftWeight, setDraftWeight] = useState<Record<string, number>>({});
  const [draftReps, setDraftReps] = useState<Record<string, number>>({});
  const [editingSetId, setEditingSetId] = useState<Record<string, string | null>>({});
  const [supersetsByDay, setSupersetsByDay] = useState<Record<string, SupersetGroup[]>>({});
  const [showCategoryColours, setShowCategoryColours] = useState(true);
  const [calendarMonth, setCalendarMonth] = useState(startOfDay(new Date()));
  const [selectedCalendarWorkoutId, setSelectedCalendarWorkoutId] = useState<string | null>(null);
  const [customExercises, setCustomExercises] = useState<ExerciseDefinition[]>([]);
  const [replaceTargetExerciseId, setReplaceTargetExerciseId] = useState<string | null>(null);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseNotes, setNewExerciseNotes] = useState("");
  const [newExerciseCategory, setNewExerciseCategory] = useState<ExerciseCategory>("Abs");
  const [newExerciseType, setNewExerciseType] = useState("Weight and Reps");
  const [newExerciseUnit, setNewExerciseUnit] = useState("Default (lbs)");
  const [exerciseMenuOpen, setExerciseMenuOpen] = useState(false);

  const selectedDate = useMemo(() => new Date(`${selectedDateIso}T12:00:00`), [selectedDateIso]);
  const normalizedWeeklyPlan = ensureWorkoutDays(weeklyPlan);
  const selectedDay = normalizedWeeklyPlan.find((day) => day.id === getWeekdayId(selectedDate)) ?? normalizedWeeklyPlan[0];
  const previousDate = addDays(selectedDate, -1);
  const nextDate = addDays(selectedDate, 1);
  const previousWorkoutDay = normalizedWeeklyPlan.find((day) => day.id === getWeekdayId(previousDate)) ?? null;
  const selectedSupersets = supersetsByDay[selectedDay.id] ?? [];

  const allExercises = useMemo(() => [...exerciseLibrary, ...customExercises], [customExercises]);
  const allExercisesMap = useMemo(() => new Map(allExercises.map((e) => [e.name, e])), [allExercises]);
  const selectedExercise = selectedDay.exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null;
  const selectedExerciseDefinition = selectedExercise ? getExerciseDefinition(allExercises, selectedExercise.exerciseName) : null;
  const currentSessionKey = selectedExercise ? makeSessionKey(selectedDateIso, selectedExercise.exerciseName) : null;
  const currentSets = currentSessionKey ? trackSets[currentSessionKey] ?? [] : [];

  const allHistoryRows = useMemo(() => {
    if (!selectedExercise) return [];
    const localRows = buildLocalHistoryRows(selectedExercise.exerciseName, trackSets);
    const importedRows = buildImportedHistoryRows(selectedExercise.exerciseName, fitNotesSummary);

    const merged = [...localRows];
    importedRows.forEach((row) => {
      if (!merged.some((existing) => existing.dateIso === row.dateIso && existing.sets.length === row.sets.length && existing.source === "imported")) {
        merged.push(row);
      }
    });

    return merged.sort((left, right) => right.dateIso.localeCompare(left.dateIso));
  }, [fitNotesSummary, selectedExercise, trackSets]);

  const previousHistoryRows = useMemo(
    () => allHistoryRows.filter((row) => row.dateIso !== selectedDateIso),
    [allHistoryRows, selectedDateIso]
  );

  const currentDraftWeight = currentSessionKey ? draftWeight[currentSessionKey] ?? 0 : 0;
  const currentDraftReps = currentSessionKey ? draftReps[currentSessionKey] ?? 0 : 0;
  const currentEditingSetId = currentSessionKey ? editingSetId[currentSessionKey] ?? null : null;

  const routines = useMemo(
    () => [{ id: "weekly-split", name: "Weekly Split", days: normalizedWeeklyPlan.filter((day) => day.exercises.length) }],
    [normalizedWeeklyPlan]
  );

  const importedWorkouts = useMemo<CalendarWorkout[]>(
    () =>
      fitNotesSummary?.recentSessions.map((session) => ({
        id: session.id,
        date: session.date,
        categories: [...new Set(session.exercises.map((exercise) => exercise.category as ExerciseCategory))],
        names: session.exercises.map((exercise) => exercise.exerciseName),
        summary: `${session.exercises.length} exercises`
      })) ?? [],
    [fitNotesSummary]
  );

  const groupedImportedWorkouts = useMemo(() => groupByMonth(importedWorkouts), [importedWorkouts]);
  const selectedCalendarWorkout = importedWorkouts.find((workout) => workout.id === selectedCalendarWorkoutId) ?? null;

  const categoryExercises = useMemo(() => {
    const query = librarySearch.trim().toLowerCase();
    return allExercises.filter((exercise) => {
      if (exercise.category !== selectedCategory) return false;
      if (!query) return true;
      return exercise.name.toLowerCase().includes(query) || exercise.aliases.some((alias) => alias.toLowerCase().includes(query));
    });
  }, [allExercises, librarySearch, selectedCategory]);

  const monthGrid = getMonthMatrix(calendarMonth);
  const monthWorkoutsByDate = importedWorkouts.reduce<Record<string, CalendarWorkout>>((accumulator, workout) => {
    accumulator[workout.date.slice(0, 10)] = workout;
    return accumulator;
  }, {});

  const graphPoints = allHistoryRows
    .slice(0, defaultGraphPointCount[graphRange])
    .map((row) => row.sets.reduce((best, set) => Math.max(best, estimateOneRm(set.weightLb, set.reps)), 0))
    .reverse();
  const graphMax = Math.max(...graphPoints, 1);

  function seedDraftForExercise(exercise: WorkoutExercise) {
    const sessionKey = makeSessionKey(selectedDateIso, exercise.exerciseName);
    const existingSets = trackSets[sessionKey] ?? [];
    const previousRow = [...buildLocalHistoryRows(exercise.exerciseName, trackSets), ...buildImportedHistoryRows(exercise.exerciseName, fitNotesSummary)]
      .filter((row) => row.dateIso !== selectedDateIso)
      .sort((left, right) => right.dateIso.localeCompare(left.dateIso))[0];

    const defaultWeight = existingSets.length
      ? existingSets[existingSets.length - 1].weightLb
      : previousRow?.sets[0]?.weightLb ?? exercise.weightLb;
    const defaultReps = existingSets.length
      ? existingSets[existingSets.length - 1].reps
      : previousRow?.sets[0]?.reps ?? parseReps(exercise.reps);

    setDraftWeight((current) => ({ ...current, [sessionKey]: current[sessionKey] ?? defaultWeight }));
    setDraftReps((current) => ({ ...current, [sessionKey]: current[sessionKey] ?? defaultReps }));
    setEditingSetId((current) => ({ ...current, [sessionKey]: null }));
  }

  function openExercise(exercise: WorkoutExercise) {
    setSelectedExerciseId(exercise.id);
    seedDraftForExercise(exercise);
    setExerciseMenuOpen(false);
    setMode("exercise");
  }

  function toggleLibrarySelection(exerciseId: string) {
    setLibrarySelection((current) => (current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId]));
  }

  function toggleWorkoutSelection(exerciseId: string) {
    setWorkoutSelection((current) => (current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId]));
  }

  async function handleExerciseLibraryTap(exercise: ExerciseDefinition) {
    if (replaceTargetExerciseId) {
      await updateWorkoutExercise(selectedDay.id, replaceTargetExerciseId, {
        exerciseId: exercise.id,
        exerciseName: exercise.name,
        category: exercise.category,
        sets: 3,
        reps: "8-10",
        weightLb: 0
      });
      setReplaceTargetExerciseId(null);
      setMode("log");
      return;
    }

    if (librarySelection.length) {
      toggleLibrarySelection(exercise.id);
      return;
    }

    await addWorkoutExercise(selectedDay.id, exercise.name, exercise.category);
    setMode("log");
  }

  async function addSelectedExercises() {
    const selectedExercises = categoryExercises.filter((exercise) => librarySelection.includes(exercise.id));
    await addWorkoutExercises(
      selectedDay.id,
      selectedExercises.map((exercise) => ({ exerciseName: exercise.name, category: exercise.category }))
    );
    setLibrarySelection([]);
    setMode("log");
  }

  async function copyPreviousWorkout() {
    if (!previousWorkoutDay?.exercises.length) return;
    await addWorkoutExercises(
      selectedDay.id,
      previousWorkoutDay.exercises.map((exercise) => ({ exerciseName: exercise.exerciseName, category: exercise.category }))
    );
  }

  async function saveTrackSet() {
    if (!selectedExercise || !currentSessionKey) return;
    const nextSet: LoggedSet = {
      id: currentEditingSetId ?? `${selectedExercise.id}-${Date.now()}`,
      weightLb: currentDraftWeight,
      reps: currentDraftReps,
      completed: currentEditingSetId ? currentSets.find((set) => set.id === currentEditingSetId)?.completed ?? false : false
    };

    const nextSets = currentEditingSetId
      ? currentSets.map((set) => (set.id === currentEditingSetId ? nextSet : set))
      : [...currentSets, nextSet];

    setTrackSets((current) => ({ ...current, [currentSessionKey]: nextSets }));
    setEditingSetId((current) => ({ ...current, [currentSessionKey]: null }));
    setDraftWeight((current) => ({ ...current, [currentSessionKey]: nextSet.weightLb }));
    setDraftReps((current) => ({ ...current, [currentSessionKey]: nextSet.reps }));

    await updateWorkoutExercise(selectedDay.id, selectedExercise.id, {
      sets: nextSets.length,
      reps: String(nextSet.reps),
      weightLb: nextSet.weightLb
    });
  }

  function selectSet(setId: string) {
    if (!selectedExercise || !currentSessionKey) return;
    const found = currentSets.find((set) => set.id === setId);
    if (!found) return;

    setEditingSetId((current) => ({ ...current, [currentSessionKey]: setId }));
    setDraftWeight((current) => ({ ...current, [currentSessionKey]: found.weightLb }));
    setDraftReps((current) => ({ ...current, [currentSessionKey]: found.reps }));
  }

  function clearTrackDraft() {
    if (!selectedExercise || !currentSessionKey) return;
    const previousRow = previousHistoryRows[0];
    const fallbackWeight = currentSets[currentSets.length - 1]?.weightLb ?? previousRow?.sets[0]?.weightLb ?? selectedExercise.weightLb;
    const fallbackReps = currentSets[currentSets.length - 1]?.reps ?? previousRow?.sets[0]?.reps ?? parseReps(selectedExercise.reps);

    setEditingSetId((current) => ({ ...current, [currentSessionKey]: null }));
    setDraftWeight((current) => ({ ...current, [currentSessionKey]: fallbackWeight }));
    setDraftReps((current) => ({ ...current, [currentSessionKey]: fallbackReps }));
  }

  function deleteCurrentExercise() {
    if (!selectedExercise) return;
    Alert.alert("Delete Exercise", "Remove this exercise from today's workout?", [
      {
        text: "Cancel",
        style: "cancel",
        onPress: () => setExerciseMenuOpen(false)
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await removeWorkoutExercise(selectedDay.id, selectedExercise.id);
          setExerciseMenuOpen(false);
          setSelectedExerciseId(null);
          setMode("log");
        }
      }
    ]);
  }

  function toggleSetComplete(exerciseName: string, setId: string) {
    const sessionKey = makeSessionKey(selectedDateIso, exerciseName);
    setTrackSets((current) => {
      const currentSetsForExercise = current[sessionKey] ?? [];
      return {
        ...current,
        [sessionKey]: currentSetsForExercise.map((set) => (set.id === setId ? { ...set, completed: !set.completed } : set))
      };
    });
  }

  async function moveSelectedWorkout(direction: "up" | "down") {
    if (workoutSelection.length !== 1) return;
    await reorderWorkoutExercise(selectedDay.id, workoutSelection[0], direction);
  }

  async function deleteSelectedExercises() {
    for (const exerciseId of workoutSelection) {
      await removeWorkoutExercise(selectedDay.id, exerciseId);
    }
    setWorkoutSelection([]);
  }

  function createSuperset() {
    if (workoutSelection.length < 2) return;
    const nextSuperset: SupersetGroup = {
      id: `superset-${Date.now()}`,
      name: `Superset ${selectedSupersets.length + 1}`,
      exerciseIds: workoutSelection
    };
    setSupersetsByDay((current) => ({ ...current, [selectedDay.id]: [...(current[selectedDay.id] ?? []), nextSuperset] }));
    setWorkoutSelection([]);
  }

  function resetNewExerciseForm() {
    setNewExerciseName("");
    setNewExerciseNotes("");
    setNewExerciseCategory("Abs");
    setNewExerciseType("Weight and Reps");
    setNewExerciseUnit("Default (lbs)");
  }

  function saveNewExercise(saveAndNew: boolean) {
    const trimmedName = newExerciseName.trim();
    if (!trimmedName) return;

    const nextExercise: ExerciseDefinition = {
      id: `custom-${Date.now()}`,
      name: trimmedName,
      aliases: [],
      category: newExerciseCategory,
      movementPattern: newExerciseType,
      primaryMuscles: [newExerciseCategory],
      secondaryMuscles: newExerciseNotes ? [newExerciseNotes] : [],
      targetChart: [{ muscle: newExerciseCategory, percent: 100 }],
      whyItWorks: newExerciseNotes || `${trimmedName} is tracked as a custom PulsePilot exercise.`,
      substitutions: []
    };

    setCustomExercises((current) =>
      [...current, nextExercise].sort((left, right) => left.name.localeCompare(right.name))
    );

    if (saveAndNew) {
      resetNewExerciseForm();
      return;
    }

    resetNewExerciseForm();
    setSelectedCategory(newExerciseCategory);
    setMode("categories");
  }

  function renderTopDateNav() {
    return (
      <View style={styles.dateNav}>
        <Pressable onPress={() => setSelectedDateIso(toIsoDate(previousDate))} style={styles.iconButton}>
          <Text style={styles.iconButtonText}>{"\u2039"}</Text>
        </Pressable>
        <Text style={styles.dateNavLabel}>{getRelativeDayLabel(selectedDate)}</Text>
        <Pressable onPress={() => setSelectedDateIso(toIsoDate(nextDate))} style={styles.iconButton}>
          <Text style={styles.iconButtonText}>{"\u203A"}</Text>
        </Pressable>
      </View>
    );
  }

  function renderLogScreen() {
    return (
      <ScreenContainer>
        <Card>
          {renderTopDateNav()}
          <View style={styles.secondaryActionsRow}>
            <Pressable onPress={() => setMode("categories")} style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionButtonText}>Add Exercise</Text>
            </Pressable>
            <Pressable onPress={() => setMode("calendar")} style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionButtonText}>Calendar</Text>
            </Pressable>
            <Pressable onPress={() => setMode("routines")} style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionButtonText}>Routines</Text>
            </Pressable>
          </View>
        </Card>

        {workoutSelection.length ? (
          <Card>
            <View style={styles.selectionToolbar}>
              <Text style={styles.selectionCount}>
                {workoutSelection.length} exercise{workoutSelection.length === 1 ? "" : "s"} selected
              </Text>
              <View style={styles.selectionActions}>
                <Pressable onPress={() => setWorkoutSelection(selectedDay.exercises.map((exercise) => exercise.id))} style={styles.smallActionButton}>
                  <Text style={styles.smallActionButtonText}>Select All</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (workoutSelection.length === 1) {
                      setReplaceTargetExerciseId(workoutSelection[0]);
                      setMode("categories");
                    }
                  }}
                  style={styles.smallActionButton}
                >
                  <Text style={styles.smallActionButtonText}>Replace</Text>
                </Pressable>
                <Pressable onPress={createSuperset} style={styles.smallActionButton}>
                  <Text style={styles.smallActionButtonText}>Superset</Text>
                </Pressable>
                <Pressable onPress={() => moveSelectedWorkout("up")} style={styles.smallActionButton}>
                  <Text style={styles.smallActionButtonText}>Up</Text>
                </Pressable>
                <Pressable onPress={() => moveSelectedWorkout("down")} style={styles.smallActionButton}>
                  <Text style={styles.smallActionButtonText}>Down</Text>
                </Pressable>
                <Pressable onPress={deleteSelectedExercises} style={styles.deleteActionButton}>
                  <Text style={styles.deleteActionButtonText}>Delete</Text>
                </Pressable>
              </View>
            </View>
          </Card>
        ) : null}

        {!selectedDay.exercises.length ? (
          <Card>
            <Text style={styles.emptyStateText}>No exercises yet {"\u2014"} tap Add Exercise to start</Text>
            {!!previousWorkoutDay?.exercises.length && (
              <Pressable onPress={copyPreviousWorkout} style={styles.linkButton}>
                <Text style={styles.linkButtonText}>Copy Previous Workout</Text>
              </Pressable>
            )}
          </Card>
        ) : (
          <>
            {selectedSupersets.length ? (
              <Card>
                <Text style={styles.cardTitle}>Supersets</Text>
                {selectedSupersets.map((superset) => (
                  <View key={superset.id} style={styles.supersetBlock}>
                    <Text style={styles.supersetTitle}>{superset.name}</Text>
                    {superset.exerciseIds.map((exerciseId) => {
                      const match = selectedDay.exercises.find((exercise) => exercise.id === exerciseId);
                      return match ? (
                        <Text key={exerciseId} style={styles.supersetExercise}>
                          {match.exerciseName}
                        </Text>
                      ) : null;
                    })}
                  </View>
                ))}
              </Card>
            ) : null}

            <Card>
              {selectedDay.exercises.map((exercise) => {
                const isSelected = workoutSelection.includes(exercise.id);
                const sessionKey = makeSessionKey(selectedDateIso, exercise.exerciseName);
                const sets = trackSets[sessionKey] ?? [];
                const exerciseDefinition = allExercisesMap.get(exercise.exerciseName);

                return (
                  <View key={exercise.id} style={[styles.exerciseCard, isSelected && styles.exerciseCardSelected]}>
                    <Pressable
                      onPress={() => {
                        if (workoutSelection.length) {
                          toggleWorkoutSelection(exercise.id);
                          return;
                        }
                        openExercise(exercise);
                      }}
                      onLongPress={() => toggleWorkoutSelection(exercise.id)}
                      style={styles.exerciseCardContent}
                    >
                      <View style={styles.exerciseCardTextColumn}>
                        <Text style={styles.exerciseCardTitle}>{exercise.exerciseName}</Text>
                      {!sets.length ? (
                        <Text style={styles.placeholderText}>No sets logged yet</Text>
                      ) : (
                        sets.map((set, index) => (
                          <View key={set.id} style={styles.setRow}>
                            <Text style={styles.setRowText}>{`Set ${index + 1}`}</Text>
                            <Text style={styles.setRowText}>{`${set.weightLb.toFixed(1)} lbs`}</Text>
                            <Text style={styles.setRowText}>{`${set.reps} reps`}</Text>
                            <Pressable
                              onPress={() => toggleSetComplete(exercise.exerciseName, set.id)}
                              style={styles.setCheckButton}
                            >
                              <Text style={styles.setCheckButtonText}>{set.completed ? "\u25C9" : "\u25CB"}</Text>
                            </Pressable>
                          </View>
                        ))
                      )}
                      </View>
                      <View style={styles.rowMuscleMapWrap}>
                        <MuscleMap
                          primaryMuscles={exerciseDefinition?.primaryMuscles ?? []}
                          secondaryMuscles={exerciseDefinition?.secondaryMuscles ?? []}
                          view={resolveExerciseView(exerciseDefinition?.category ?? (exercise.category as ExerciseCategory))}
                        />
                      </View>
                    </Pressable>
                  </View>
                );
              })}
            </Card>
          </>
        )}
      </ScreenContainer>
    );
  }

  function renderExerciseMenu() {
    if (!selectedExercise) return null;

    return (
      <>
        <TouchableOpacity onPress={() => setExerciseMenuOpen(true)} style={{ padding: 8 }}>
          <Text style={{ fontSize: 20 }}>{"\u00B7\u00B7\u00B7"}</Text>
        </TouchableOpacity>

        <Modal
          visible={exerciseMenuOpen}
          transparent
          animationType="none"
          onRequestClose={() => setExerciseMenuOpen(false)}
        >
          <TouchableWithoutFeedback onPress={() => setExerciseMenuOpen(false)}>
            <View style={{ flex: 1 }}>
              <TouchableWithoutFeedback>
                <View style={{
                  position: "absolute",
                  top: 60,
                  right: 16,
                  backgroundColor: "white",
                  borderRadius: 10,
                  paddingVertical: 8,
                  minWidth: 180,
                  shadowColor: "#000",
                  shadowOpacity: 0.18,
                  shadowRadius: 12,
                  elevation: 20
                }}>
                  <TouchableOpacity onPress={() => { setExerciseMenuOpen(false); setMode("exercise-history"); }}
                    style={{ paddingVertical: 14, paddingHorizontal: 20 }}>
                    <Text style={{ fontSize: 15 }}>View History</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => { setExerciseMenuOpen(false); setMode("exercise-graph"); }}
                    style={{ paddingVertical: 14, paddingHorizontal: 20 }}>
                    <Text style={{ fontSize: 15 }}>View Graph</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => {
                    setExerciseMenuOpen(false);
                    Alert.alert("Delete Exercise", "Remove this exercise from today?", [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => {
                          await removeWorkoutExercise(selectedDay.id, selectedExercise.id);
                          setSelectedExerciseId(null);
                          setMode("log");
                        }
                      }
                    ]);
                  }} style={{ paddingVertical: 14, paddingHorizontal: 20 }}>
                    <Text style={{ fontSize: 15, color: "#E53E3E" }}>Delete Exercise</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </>
    );
  }

  function renderExerciseHeader(backToMode: ScreenMode) {
    if (!selectedExercise) return null;
    return (
      <View style={styles.exerciseHeaderBar}>
        <Pressable onPress={() => { setExerciseMenuOpen(false); setMode(backToMode); }} style={styles.iconButton}>
          <Text style={styles.iconButtonText}>{"\u2039"}</Text>
        </Pressable>
        <View style={styles.exerciseTitleColumn}>
          <Text style={styles.exerciseScreenTitle}>{selectedExercise.exerciseName}</Text>
          <Text style={styles.exerciseHeaderSubtitle}>{selectedDay.dayLabel}</Text>
        </View>
        <View style={styles.muscleMapWrap}>
          <MuscleMap
            primaryMuscles={selectedExerciseDefinition?.primaryMuscles ?? []}
            secondaryMuscles={selectedExerciseDefinition?.secondaryMuscles ?? []}
            view={resolveExerciseView(selectedExerciseDefinition?.category ?? (selectedExercise.category as ExerciseCategory))}
            width={80}
          />
        </View>
        {renderExerciseMenu()}
      </View>
    );
  }

  function renderExerciseMode() {
    if (!selectedExercise || !currentSessionKey) return null;

    const currentLabel = getRelativeDayLabel(selectedDate);
    const previousRow = previousHistoryRows[0] ?? null;

    return (
      <SafeAreaView style={styles.exerciseSafeArea}>
        <View style={styles.exerciseRoot}>
          {renderExerciseHeader("log")}
          <ScrollView contentContainerStyle={styles.exerciseScrollContent}>
            {previousRow ? (
              <Card style={styles.dimReferenceCard}>
                <Text style={styles.historyDateLabel}>{previousRow.dateLabel}</Text>
                {previousRow.sets.map((set, index) => (
                  <View key={`${previousRow.dateIso}-${index}`} style={styles.readonlySetRow}>
                    <Text style={styles.readonlySetText}>{`Set ${index + 1}`}</Text>
                    <Text style={styles.readonlySetText}>{`${set.weightLb.toFixed(1)} lbs`}</Text>
                    <Text style={styles.readonlySetText}>{`${set.reps} reps`}</Text>
                  </View>
                ))}
              </Card>
            ) : null}

            <Card>
              <Text style={styles.currentSessionLabel}>{currentLabel}</Text>
              {!currentSets.length ? (
                <Text style={styles.placeholderText}>Tap + Add Set to begin</Text>
              ) : (
                currentSets.map((set, index) => (
                  <View key={set.id} style={styles.currentSetRow}>
                    <Pressable onPress={() => selectSet(set.id)} style={styles.currentSetMain}>
                      <Text style={styles.currentSetText}>{`Set ${index + 1}`}</Text>
                      <Text style={styles.currentSetText}>{`${set.weightLb.toFixed(1)} lbs`}</Text>
                      <Text style={styles.currentSetText}>{`${set.reps} reps`}</Text>
                    </Pressable>
                    <Pressable onPress={() => toggleSetComplete(selectedExercise.exerciseName, set.id)} style={styles.setCheckButton}>
                      <Text style={styles.setCheckButtonText}>{set.completed ? "\u25C9" : "\u25CB"}</Text>
                    </Pressable>
                  </View>
                ))
              )}
            </Card>
          </ScrollView>

          <View style={styles.fixedInputArea}>
            <View style={styles.inputFieldsRow}>
              <View style={styles.metricInputBlock}>
                <Text style={styles.metricInputLabel}>Weight</Text>
                <View style={styles.metricFieldRow}>
                  <TextInput
                    value={String(currentDraftWeight)}
                    onChangeText={(value) =>
                      setDraftWeight((current) => ({
                        ...current,
                        [currentSessionKey]: Number.parseFloat(value) || 0
                      }))
                    }
                    keyboardType="decimal-pad"
                    style={styles.metricInput}
                  />
                  <Text style={styles.metricSuffix}>lbs</Text>
                </View>
              </View>

              <View style={styles.metricInputBlock}>
                <Text style={styles.metricInputLabel}>Reps</Text>
                <View style={styles.metricFieldRow}>
                  <TextInput
                    value={String(currentDraftReps)}
                    onChangeText={(value) =>
                      setDraftReps((current) => ({
                        ...current,
                        [currentSessionKey]: Number.parseInt(value, 10) || 0
                      }))
                    }
                    keyboardType="number-pad"
                    style={styles.metricInput}
                  />
                  <Text style={styles.metricSuffix}>reps</Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomActionRow}>
              <Pressable onPress={saveTrackSet} style={styles.addSetButton}>
                <Text style={styles.addSetButtonText}>{currentEditingSetId ? "UPDATE SET" : "+ ADD SET"}</Text>
              </Pressable>
              {currentEditingSetId ? (
                <Pressable onPress={clearTrackDraft} style={styles.cancelLink}>
                  <Text style={styles.cancelLinkText}>Cancel</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  function renderExerciseHistoryMode() {
    if (!selectedExercise) return null;
    return (
      <ScreenContainer>
        <Card>
          {renderExerciseHeader("exercise")}
          <View style={styles.modeBodySpacing}>
            {allHistoryRows.length ? (
              allHistoryRows.map((row) => (
                <View key={`${row.source}-${row.dateIso}`} style={styles.historyBlock}>
                  <Text style={styles.historyDateLabel}>{row.dateLabel}</Text>
                  {row.sets.map((set, index) => (
                    <View key={`${row.dateIso}-${index}`} style={styles.readonlySetRow}>
                      <Text style={styles.readonlySetText}>{`Set ${index + 1}`}</Text>
                      <Text style={styles.readonlySetText}>{`${set.weightLb.toFixed(1)} lbs`}</Text>
                      <Text style={styles.readonlySetText}>{`${set.reps} reps`}</Text>
                    </View>
                  ))}
                </View>
              ))
            ) : (
              <Text style={styles.placeholderText}>No history available yet.</Text>
            )}
          </View>
        </Card>
      </ScreenContainer>
    );
  }

  function renderExerciseGraphMode() {
    if (!selectedExercise) return null;

    const estimated1Rm = estimateOneRm(currentDraftWeight, currentDraftReps);
    const setCalculator = Number((estimated1Rm * 0.75).toFixed(1));
    const plateLoadPerSide = Math.max(Number((((currentDraftWeight - 45) / 2)).toFixed(1)), 0);

    return (
      <ScreenContainer>
        <Card>
          {renderExerciseHeader("exercise")}
          <View style={styles.modeBodySpacing}>
            <View style={styles.rangeRow}>
              {(["1m", "3m", "6m", "1y", "all"] as GraphRange[]).map((range) => (
                <Pressable key={range} onPress={() => setGraphRange(range)} style={[styles.rangeChip, graphRange === range && styles.rangeChipActive]}>
                  <Text style={[styles.rangeChipText, graphRange === range && styles.rangeChipTextActive]}>{range}</Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.graph}>
              {graphPoints.length ? (
                graphPoints.map((point, index) => (
                  <View key={`${point}-${index}`} style={styles.graphColumn}>
                    <View style={[styles.graphBar, { height: `${(point / graphMax) * 100}%` }]} />
                  </View>
                ))
              ) : (
                <Text style={styles.placeholderText}>No graph points available yet.</Text>
              )}
            </View>
            <View style={styles.toolsBlock}>
              <Text style={styles.cardTitle}>Workout Tools</Text>
              <Text style={styles.toolText}>Estimated 1RM: {estimated1Rm.toFixed(1)} lbs</Text>
              <Text style={styles.toolText}>Set Calculator (75%): {setCalculator.toFixed(1)} lbs</Text>
              <Text style={styles.toolText}>Plate Calculator: 45 lb bar + {plateLoadPerSide.toFixed(1)} lbs each side</Text>
            </View>
          </View>
        </Card>
      </ScreenContainer>
    );
  }

  function renderCategoryDetail() {
    return (
      <ScreenContainer>
        <Card>
          <View style={styles.simpleTopBar}>
            <Pressable onPress={() => { setLibrarySelection([]); setMode("categories"); }} style={styles.iconButton}>
              <Text style={styles.iconButtonText}>{"\u2039"}</Text>
            </Pressable>
            <Text style={styles.simpleTopBarTitle}>{selectedCategory}</Text>
            <View style={styles.simpleTopBarSpacer} />
          </View>
          <TextInput
            value={librarySearch}
            onChangeText={setLibrarySearch}
            placeholder={`Search ${selectedCategory}`}
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
          {librarySelection.length ? (
            <View style={styles.selectionToolbar}>
              <Text style={styles.selectionCount}>{librarySelection.length} selected</Text>
              <Pressable onPress={addSelectedExercises} style={styles.smallActionButton}>
                <Text style={styles.smallActionButtonText}>Add Selected</Text>
              </Pressable>
            </View>
          ) : null}
          {categoryExercises.map((exercise) => {
            const isSelected = librarySelection.includes(exercise.id);
            return (
              <Pressable
                key={exercise.id}
                onPress={() => handleExerciseLibraryTap(exercise)}
                onLongPress={() => toggleLibrarySelection(exercise.id)}
                style={[styles.exerciseListRow, isSelected && styles.exerciseListRowSelected]}
              >
                <View style={styles.exerciseListContent}>
                  <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                  {exercise.aliases.length ? <Text style={styles.aliasText}>Also called: {exercise.aliases.join(", ")}</Text> : null}
                </View>
                <View style={styles.exerciseListRight}>
                  <View style={styles.rowMuscleMapWrap}>
                    <MuscleMap
                      primaryMuscles={exercise.primaryMuscles}
                      secondaryMuscles={exercise.secondaryMuscles}
                      view={resolveExerciseView(exercise.category)}
                    />
                  </View>
                  <Text style={styles.mutedLink}>
                    {replaceTargetExerciseId ? "Replace" : librarySelection.length ? (isSelected ? "Selected" : "Select") : "Add"}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </Card>
      </ScreenContainer>
    );
  }

  function renderCategories() {
    return (
      <ScreenContainer>
        <Card>
          <View style={styles.simpleTopBar}>
            <Pressable onPress={() => setMode("log")} style={styles.iconButton}>
              <Text style={styles.iconButtonText}>{"\u2039"}</Text>
            </Pressable>
            <Text style={styles.simpleTopBarTitle}>All Exercises</Text>
            <View style={styles.simpleTopBarSpacer} />
          </View>
          <View style={styles.secondaryActionsRow}>
            <Pressable onPress={() => setMode("routines")} style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionButtonText}>Routines</Text>
            </Pressable>
            <Pressable onPress={() => setMode("new-exercise")} style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionButtonText}>New Exercise</Text>
            </Pressable>
            <Pressable onPress={() => setShowCategoryColours((current) => !current)} style={styles.secondaryActionButton}>
              <Text style={styles.secondaryActionButtonText}>{showCategoryColours ? "Colours" : "Plain"}</Text>
            </Pressable>
          </View>

          {exerciseCategoryOrder.map((category) => (
            <Pressable
              key={category}
              onPress={() => {
                setSelectedCategory(category);
                setLibrarySearch("");
                setLibrarySelection([]);
                setMode("category-detail");
              }}
              style={styles.categoryRow}
            >
              <View style={styles.categoryRowLeft}>
                {showCategoryColours ? <View style={[styles.categoryDot, { backgroundColor: categoryColors[category] }]} /> : null}
                <Text style={styles.categoryRowText}>{category}</Text>
              </View>
              <Text style={styles.mutedLink}>Open</Text>
            </Pressable>
          ))}
        </Card>
      </ScreenContainer>
    );
  }

  function renderRoutines() {
    return (
      <ScreenContainer>
        <Card>
          <View style={styles.simpleTopBar}>
            <Pressable onPress={() => setMode("log")} style={styles.iconButton}>
              <Text style={styles.iconButtonText}>{"\u2039"}</Text>
            </Pressable>
            <Text style={styles.simpleTopBarTitle}>Routines</Text>
            <View style={styles.simpleTopBarSpacer} />
          </View>
          {routines.map((routine) => (
            <View key={routine.id} style={styles.routineBlock}>
              <Text style={styles.cardTitle}>{routine.name}</Text>
              {routine.days.map((day) => (
                <View key={day.id} style={styles.routineDayRow}>
                  <Text style={styles.routineDayTitle}>{day.dayLabel}</Text>
                  <Text style={styles.routineDayCount}>{day.exercises.length} exercises</Text>
                </View>
              ))}
              <Pressable
                onPress={async () => {
                  await addWorkoutExercises(
                    selectedDay.id,
                    routine.days.flatMap((day) => day.exercises.map((exercise) => ({ exerciseName: exercise.exerciseName, category: exercise.category })))
                  );
                  setMode("log");
                }}
                style={styles.addSetButton}
              >
                <Text style={styles.addSetButtonText}>Log Routine To {selectedDay.dayLabel}</Text>
              </Pressable>
            </View>
          ))}
        </Card>
      </ScreenContainer>
    );
  }

  function renderNewExercise() {
    return (
      <ScreenContainer>
        <Card>
          <View style={styles.simpleTopBar}>
            <Pressable onPress={() => setMode("categories")} style={styles.iconButton}>
              <Text style={styles.iconButtonText}>{"\u2039"}</Text>
            </Pressable>
            <Text style={styles.simpleTopBarTitle}>New Exercise</Text>
            <View style={styles.topBarActions}>
              <Pressable onPress={() => saveNewExercise(true)} style={styles.smallActionButton}>
                <Text style={styles.smallActionButtonText}>Save & New</Text>
              </Pressable>
              <Pressable onPress={() => saveNewExercise(false)} style={styles.smallActionButton}>
                <Text style={styles.smallActionButtonText}>Save</Text>
              </Pressable>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput value={newExerciseName} onChangeText={setNewExerciseName} placeholder="Exercise name" placeholderTextColor={colors.muted} style={styles.searchInput} />
          <Text style={styles.fieldLabel}>Notes (Optional)</Text>
          <TextInput value={newExerciseNotes} onChangeText={setNewExerciseNotes} placeholder="Notes" placeholderTextColor={colors.muted} style={styles.searchInput} />
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.filterChipRow}>
            {exerciseCategoryOrder.map((category) => (
              <Pressable key={category} onPress={() => setNewExerciseCategory(category)} style={[styles.rangeChip, newExerciseCategory === category && styles.rangeChipActive]}>
                <Text style={[styles.rangeChipText, newExerciseCategory === category && styles.rangeChipTextActive]}>{category}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.filterChipRow}>
            {["Weight and Reps", "Distance and Time"].map((option) => (
              <Pressable key={option} onPress={() => setNewExerciseType(option)} style={[styles.rangeChip, newExerciseType === option && styles.rangeChipActive]}>
                <Text style={[styles.rangeChipText, newExerciseType === option && styles.rangeChipTextActive]}>{option}</Text>
              </Pressable>
            ))}
          </View>
          <Text style={styles.fieldLabel}>Weight Unit</Text>
          <View style={styles.filterChipRow}>
            {["Default (lbs)", "Metric (kgs)", "Imperial (lbs)"].map((unit) => (
              <Pressable key={unit} onPress={() => setNewExerciseUnit(unit)} style={[styles.rangeChip, newExerciseUnit === unit && styles.rangeChipActive]}>
                <Text style={[styles.rangeChipText, newExerciseUnit === unit && styles.rangeChipTextActive]}>{unit}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
      </ScreenContainer>
    );
  }

  function renderCalendar() {
    return (
      <ScreenContainer>
        <Card>
          <View style={styles.simpleTopBar}>
            <Pressable onPress={() => setMode("log")} style={styles.iconButton}>
              <Text style={styles.iconButtonText}>{"\u2039"}</Text>
            </Pressable>
            <Text style={styles.simpleTopBarTitle}>Calendar</Text>
            <View style={styles.topBarActions}>
              <Pressable onPress={() => setCalendarView("month")} style={[styles.smallActionButton, calendarView === "month" && styles.smallActionButtonActive]}>
                <Text style={[styles.smallActionButtonText, calendarView === "month" && styles.smallActionButtonTextActive]}>Month</Text>
              </Pressable>
              <Pressable onPress={() => setCalendarView("list")} style={[styles.smallActionButton, calendarView === "list" && styles.smallActionButtonActive]}>
                <Text style={[styles.smallActionButtonText, calendarView === "list" && styles.smallActionButtonTextActive]}>List</Text>
              </Pressable>
            </View>
          </View>

          {calendarView === "month" ? (
            <>
              <View style={styles.calendarHeader}>
                <Pressable onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} style={styles.iconButton}>
                  <Text style={styles.iconButtonText}>{"\u2039"}</Text>
                </Pressable>
                <Text style={styles.cardTitle}>{getMonthTitle(calendarMonth)}</Text>
                <Pressable onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} style={styles.iconButton}>
                  <Text style={styles.iconButtonText}>{"\u203A"}</Text>
                </Pressable>
              </View>
              <View style={styles.calendarWeekHeader}>
                {["S", "M", "T", "W", "T", "F", "S"].map((label) => (
                  <Text key={label} style={styles.calendarWeekLabel}>
                    {label}
                  </Text>
                ))}
              </View>
              <View style={styles.calendarGrid}>
                {monthGrid.map((date) => {
                  const iso = toIsoDate(date);
                  const workout = monthWorkoutsByDate[iso];
                  const isCurrentMonth = date.getMonth() === calendarMonth.getMonth();
                  const isSelected = iso === selectedDateIso;
                  return (
                    <Pressable
                      key={iso}
                      onPress={() => {
                        setSelectedDateIso(iso);
                        setSelectedCalendarWorkoutId(workout?.id ?? null);
                      }}
                      style={[styles.calendarCell, isSelected && styles.calendarCellSelected]}
                    >
                      <Text style={[styles.calendarCellText, !isCurrentMonth && styles.calendarCellMuted, isSelected && styles.calendarCellTextActive]}>
                        {date.getDate()}
                      </Text>
                      <View style={styles.calendarDots}>
                        {(workout?.categories ?? []).slice(0, 4).map((category) => (
                          <View key={`${iso}-${category}`} style={[styles.calendarDot, { backgroundColor: categoryColors[category] }]} />
                        ))}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            Object.entries(groupedImportedWorkouts).map(([month, workouts]) => (
              <View key={month} style={styles.historyBlock}>
                <Text style={styles.historyDateLabel}>{month}</Text>
                {workouts.map((workout) => (
                  <Pressable
                    key={workout.id}
                    onPress={() => {
                      setSelectedDateIso(workout.date.slice(0, 10));
                      setSelectedCalendarWorkoutId(workout.id);
                    }}
                    style={[styles.exerciseListRow, selectedCalendarWorkoutId === workout.id && styles.exerciseListRowSelected]}
                  >
                    <View style={styles.exerciseListContent}>
                      <Text style={styles.exerciseTitle}>
                        {new Date(workout.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                      </Text>
                      <Text style={styles.aliasText}>{workout.summary}</Text>
                    </View>
                    <View style={styles.inlineDots}>
                      {workout.categories.map((category) => (
                        <View key={`${workout.id}-${category}`} style={[styles.categoryDot, { backgroundColor: categoryColors[category] }]} />
                      ))}
                    </View>
                  </Pressable>
                ))}
              </View>
            ))
          )}
        </Card>

        {selectedCalendarWorkout ? (
          <Card>
            <Text style={styles.cardTitle}>Workout</Text>
            <Text style={styles.exerciseHeaderSubtitle}>
              {new Date(selectedCalendarWorkout.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </Text>
            {selectedCalendarWorkout.names.map((name, index) => (
              <Text key={`${selectedCalendarWorkout.id}-${index}`} style={styles.supersetExercise}>
                {name}
              </Text>
            ))}
          </Card>
        ) : null}
      </ScreenContainer>
    );
  }

  if (mode === "categories") return renderCategories();
  if (mode === "category-detail") return renderCategoryDetail();
  if (mode === "routines") return renderRoutines();
  if (mode === "new-exercise") return renderNewExercise();
  if (mode === "calendar") return renderCalendar();
  if (mode === "exercise") return renderExerciseMode();
  if (mode === "exercise-history") return renderExerciseHistoryMode();
  if (mode === "exercise-graph") return renderExerciseGraphMode();

  return renderLogScreen();
}

const styles = StyleSheet.create({
  dateNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.sm
  },
  dateNavLabel: {
    flex: 1,
    textAlign: "center",
    color: colors.text,
    fontSize: 18,
    fontWeight: "800"
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  iconButtonText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800"
  },
  secondaryActionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  secondaryActionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted
  },
  secondaryActionButtonText: {
    color: colors.text,
    fontWeight: "700"
  },
  selectionToolbar: {
    gap: spacing.sm
  },
  selectionCount: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16
  },
  selectionActions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  smallActionButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceMuted
  },
  smallActionButtonActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  smallActionButtonText: {
    color: colors.text,
    fontWeight: "700"
  },
  smallActionButtonTextActive: {
    color: colors.surface
  },
  deleteActionButton: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.danger
  },
  deleteActionButtonText: {
    color: colors.surface,
    fontWeight: "800"
  },
  emptyStateText: {
    color: colors.muted,
    lineHeight: 22
  },
  linkButton: {
    alignSelf: "flex-start",
    marginTop: spacing.sm
  },
  linkButtonText: {
    color: colors.accent,
    fontWeight: "700"
  },
  cardTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: spacing.sm
  },
  supersetBlock: {
    marginBottom: spacing.md,
    gap: spacing.xs
  },
  supersetTitle: {
    color: colors.accent,
    fontWeight: "800"
  },
  supersetExercise: {
    color: colors.text,
    lineHeight: 20
  },
  exerciseCard: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  exerciseCardSelected: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md
  },
  exerciseCardContent: {
    paddingVertical: spacing.md,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md
  },
  exerciseCardTextColumn: {
    flex: 1
  },
  exerciseCardTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: spacing.xs
  },
  placeholderText: {
    color: colors.muted,
    lineHeight: 20
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs
  },
  setRowText: {
    color: colors.text,
    fontWeight: "700",
    flex: 1
  },
  setCheckButton: {
    width: 28,
    alignItems: "center",
    justifyContent: "center"
  },
  setCheckButtonText: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: "800"
  },
  exerciseSafeArea: {
    flex: 1,
    backgroundColor: colors.background
  },
  exerciseRoot: {
    flex: 1
  },
  exerciseHeaderBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm
  },
  exerciseTitleColumn: {
    flex: 1,
    gap: spacing.xs
  },
  exerciseScreenTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "800"
  },
  exerciseHeaderSubtitle: {
    color: colors.muted,
    fontWeight: "700"
  },
  muscleMapWrap: {
    width: 80,
    marginHorizontal: 8,
    flexShrink: 0
  },
  exerciseMenuWrap: {
    position: "relative",
    zIndex: 1000
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  menuButtonText: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800"
  },
  menuModalBackdrop: {
    flex: 1
  },
  menuDropdown: {
    position: "absolute",
    right: spacing.md,
    top: spacing.xl * 2,
    zIndex: 1000,
    elevation: 10,
    backgroundColor: "white",
    borderRadius: 8,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    minWidth: 180,
    shadowOffset: { width: 0, height: 4 }
  },
  menuItem: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  menuItemText: {
    color: colors.text,
    fontWeight: "700"
  },
  menuItemDanger: {
    color: colors.danger
  },
  exerciseScrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 220,
    gap: spacing.md
  },
  dimReferenceCard: {
    opacity: 0.45
  },
  historyDateLabel: {
    color: colors.accent,
    fontWeight: "800",
    marginBottom: spacing.sm
  },
  readonlySetRow: {
    flexDirection: "row",
    gap: spacing.sm,
    paddingVertical: spacing.xs
  },
  readonlySetText: {
    flex: 1,
    color: colors.text,
    fontWeight: "700"
  },
  currentSessionLabel: {
    color: colors.text,
    fontWeight: "800",
    marginBottom: spacing.sm
  },
  currentSetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs
  },
  currentSetMain: {
    flex: 1,
    flexDirection: "row",
    gap: spacing.sm
  },
  currentSetText: {
    flex: 1,
    color: colors.text,
    fontWeight: "700"
  },
  fixedInputArea: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md
  },
  inputFieldsRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  metricInputBlock: {
    flex: 1,
    gap: spacing.xs
  },
  metricInputLabel: {
    color: colors.muted,
    fontWeight: "700"
  },
  metricFieldRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  metricInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    fontSize: 24,
    fontWeight: "800"
  },
  metricSuffix: {
    color: colors.text,
    fontWeight: "700"
  },
  bottomActionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md
  },
  addSetButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm
  },
  addSetButtonText: {
    color: colors.surface,
    fontWeight: "800"
  },
  cancelLink: {
    paddingVertical: spacing.sm
  },
  cancelLinkText: {
    color: colors.muted,
    fontWeight: "700"
  },
  modeBodySpacing: {
    gap: spacing.md
  },
  rangeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  rangeChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted
  },
  rangeChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  rangeChipText: {
    color: colors.text,
    fontWeight: "700"
  },
  rangeChipTextActive: {
    color: colors.surface
  },
  graph: {
    minHeight: 180,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  graphColumn: {
    flex: 1,
    minHeight: 140,
    justifyContent: "flex-end"
  },
  graphBar: {
    width: "100%",
    minHeight: 6,
    backgroundColor: colors.accent,
    borderRadius: radius.sm
  },
  toolsBlock: {
    gap: spacing.xs
  },
  toolText: {
    color: colors.text,
    lineHeight: 20
  },
  simpleTopBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    marginBottom: spacing.md
  },
  simpleTopBarTitle: {
    flex: 1,
    color: colors.text,
    fontSize: 20,
    fontWeight: "800"
  },
  simpleTopBarSpacer: {
    width: 36
  },
  topBarActions: {
    flexDirection: "row",
    gap: spacing.sm
  },
  searchInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    marginBottom: spacing.md
  },
  exerciseListRow: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacing.md
  },
  exerciseListRowSelected: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm
  },
  exerciseListContent: {
    flex: 1,
    gap: spacing.xs
  },
  exerciseListRight: {
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs
  },
  exerciseTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16
  },
  aliasText: {
    color: colors.muted,
    lineHeight: 18
  },
  mutedLink: {
    color: colors.accent,
    fontWeight: "700"
  },
  rowMuscleMapWrap: {
    width: 50,
  },
  categoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  categoryRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  categoryRowText: {
    color: colors.text,
    fontWeight: "700",
    fontSize: 16
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 999
  },
  routineBlock: {
    gap: spacing.sm
  },
  routineDayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  routineDayTitle: {
    color: colors.text,
    fontWeight: "700"
  },
  routineDayCount: {
    color: colors.muted
  },
  filterChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.md
  },
  fieldLabel: {
    color: colors.text,
    fontWeight: "800",
    marginBottom: spacing.xs
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.sm
  },
  calendarWeekHeader: {
    flexDirection: "row",
    marginBottom: spacing.sm
  },
  calendarWeekLabel: {
    flex: 1,
    textAlign: "center",
    color: colors.muted,
    fontWeight: "700"
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap"
  },
  calendarCell: {
    width: "14.2857%",
    minHeight: 64,
    alignItems: "center",
    paddingVertical: spacing.xs,
    gap: spacing.xs
  },
  calendarCellSelected: {
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md
  },
  calendarCellText: {
    color: colors.text,
    fontWeight: "700"
  },
  calendarCellTextActive: {
    color: colors.accent
  },
  calendarCellMuted: {
    color: colors.muted
  },
  calendarDots: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 4,
    justifyContent: "center"
  },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 999
  },
  inlineDots: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
    justifyContent: "flex-end"
  },
  historyBlock: {
    marginBottom: spacing.md,
    gap: spacing.xs
  }
});

