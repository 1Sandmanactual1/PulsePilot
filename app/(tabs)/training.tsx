import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@/components/Card";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { exerciseCategoryOrder, exerciseLibrary } from "@/data/exercise-library";
import { useAppState } from "@/providers/AppStateProvider";
import { ExerciseCategory, ExerciseDefinition, WorkoutDay, WorkoutExercise } from "@/types/domain";
import { colors, radius, spacing } from "@/theme/theme";

type ScreenMode = "log" | "categories" | "category-detail" | "exercise" | "calendar" | "routines" | "new-exercise";
type ExerciseTab = "track" | "history" | "graph";
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
  date: string;
  sets: Array<{ weightLb: number; reps: number }>;
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

function parseReps(value: string) {
  const match = value.match(/\d+/);
  return match ? Number(match[0]) : 8;
}

function estimateOneRm(weightLb: number, reps: number) {
  if (!weightLb || !reps) return 0;
  return Number((weightLb * (1 + reps / 30)).toFixed(1));
}

function buildStartingSets(exercise: WorkoutExercise): LoggedSet[] {
  const reps = parseReps(exercise.reps);
  return Array.from({ length: Math.max(exercise.sets, 1) }, (_, index) => ({
    id: `${exercise.id}-${index + 1}`,
    weightLb: exercise.weightLb,
    reps,
    completed: false
  }));
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

export default function TrainingScreen() {
  const {
    suggestions,
    weeklyPlan,
    fitNotesSummary,
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
  const [exerciseTab, setExerciseTab] = useState<ExerciseTab>("track");
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [graphRange, setGraphRange] = useState<GraphRange>("3m");
  const [librarySearch, setLibrarySearch] = useState("");
  const [librarySelection, setLibrarySelection] = useState<string[]>([]);
  const [workoutSelection, setWorkoutSelection] = useState<string[]>([]);
  const [trackSets, setTrackSets] = useState<Record<string, LoggedSet[]>>({});
  const [draftWeight, setDraftWeight] = useState<Record<string, number>>({});
  const [draftReps, setDraftReps] = useState<Record<string, number>>({});
  const [draftComment, setDraftComment] = useState<Record<string, string>>({});
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

  const selectedDate = useMemo(() => new Date(`${selectedDateIso}T12:00:00`), [selectedDateIso]);
  const normalizedWeeklyPlan = ensureWorkoutDays(weeklyPlan);
  const selectedDay = normalizedWeeklyPlan.find((day) => day.id === getWeekdayId(selectedDate)) ?? normalizedWeeklyPlan[0];
  const previousDate = addDays(selectedDate, -1);
  const nextDate = addDays(selectedDate, 1);
  const previousWorkoutDay = normalizedWeeklyPlan.find((day) => day.id === getWeekdayId(previousDate)) ?? null;
  const selectedSupersets = supersetsByDay[selectedDay.id] ?? [];
  const selectedExercise = selectedDay.exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null;

  const allExercises = useMemo(() => [...exerciseLibrary, ...customExercises], [customExercises]);
  const categoryExercises = useMemo(() => {
    const query = librarySearch.trim().toLowerCase();
    return allExercises.filter((exercise) => {
      if (exercise.category !== selectedCategory) return false;
      if (!query) return true;
      return exercise.name.toLowerCase().includes(query) || exercise.aliases.some((alias) => alias.toLowerCase().includes(query));
    });
  }, [allExercises, librarySearch, selectedCategory]);

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

  const currentSets = selectedExercise ? trackSets[selectedExercise.id] ?? buildStartingSets(selectedExercise) : [];
  const currentDraftWeight = selectedExercise ? draftWeight[selectedExercise.id] ?? selectedExercise.weightLb : 0;
  const currentDraftReps = selectedExercise ? draftReps[selectedExercise.id] ?? parseReps(selectedExercise.reps) : 0;
  const currentDraftComment = selectedExercise ? draftComment[selectedExercise.id] ?? "" : "";
  const currentEditingSetId = selectedExercise ? editingSetId[selectedExercise.id] ?? null : null;

  const historyRows = useMemo<HistoryRow[]>(() => {
    if (!selectedExercise) return [];
    const liveRows: HistoryRow[] = currentSets.length
      ? [{ date: getRelativeDayLabel(selectedDate), sets: currentSets.map((set) => ({ weightLb: set.weightLb, reps: set.reps })) }]
      : [];
    const importedRows = (fitNotesSummary?.recentSessions ?? []).flatMap((session) => {
      const match = session.exercises.find((exercise) => exercise.exerciseName === selectedExercise.exerciseName);
      if (!match) return [];
      return [{
        date: new Date(session.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase(),
        sets: Array.from({ length: match.setCount }, () => ({
          weightLb: match.topWeightLb,
          reps: Math.max(1, Math.round(match.totalReps / Math.max(match.setCount, 1)))
        }))
      }];
    });
    return [...liveRows, ...importedRows];
  }, [currentSets, fitNotesSummary, selectedDate, selectedExercise]);

  const graphPointCount: Record<GraphRange, number> = { "1m": 4, "3m": 8, "6m": 12, "1y": 20, all: historyRows.length };
  const graphPoints = historyRows.slice(0, graphPointCount[graphRange] || historyRows.length).map((row) => row.sets.reduce((best, set) => Math.max(best, estimateOneRm(set.weightLb, set.reps)), 0)).reverse();
  const graphMax = Math.max(...graphPoints, 1);

  const routines = useMemo(() => [{ id: "weekly-split", name: "Weekly Split", days: normalizedWeeklyPlan.filter((day) => day.exercises.length) }], [normalizedWeeklyPlan]);

  function openExercise(exerciseId: string) {
    const exercise = selectedDay.exercises.find((entry) => entry.id === exerciseId);
    if (!exercise) return;
    setTrackSets((current) => ({ ...current, [exercise.id]: current[exercise.id] ?? buildStartingSets(exercise) }));
    setDraftWeight((current) => ({ ...current, [exercise.id]: current[exercise.id] ?? exercise.weightLb }));
    setDraftReps((current) => ({ ...current, [exercise.id]: current[exercise.id] ?? parseReps(exercise.reps) }));
    setDraftComment((current) => ({ ...current, [exercise.id]: current[exercise.id] ?? "" }));
    setSelectedExerciseId(exercise.id);
    setExerciseTab("track");
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
      await updateWorkoutExercise(selectedDay.id, replaceTargetExerciseId, { exerciseId: exercise.id, exerciseName: exercise.name, category: exercise.category, sets: 3, reps: "8-10", weightLb: 0 });
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
    await addWorkoutExercises(selectedDay.id, selectedExercises.map((exercise) => ({ exerciseName: exercise.name, category: exercise.category })));
    setLibrarySelection([]);
    setMode("log");
  }

  async function copyPreviousWorkout() {
    if (!previousWorkoutDay?.exercises.length) return;
    await addWorkoutExercises(selectedDay.id, previousWorkoutDay.exercises.map((exercise) => ({ exerciseName: exercise.exerciseName, category: exercise.category })));
  }

  async function saveTrackSet() {
    if (!selectedExercise) return;
    const nextSet: LoggedSet = {
      id: currentEditingSetId ?? `${selectedExercise.id}-${Date.now()}`,
      weightLb: currentDraftWeight,
      reps: currentDraftReps,
      completed: currentEditingSetId ? currentSets.find((set) => set.id === currentEditingSetId)?.completed ?? false : false,
      comment: currentDraftComment || undefined
    };
    const nextSets = currentEditingSetId ? currentSets.map((set) => (set.id === currentEditingSetId ? nextSet : set)) : [...currentSets, nextSet];
    setTrackSets((current) => ({ ...current, [selectedExercise.id]: nextSets }));
    setEditingSetId((current) => ({ ...current, [selectedExercise.id]: null }));
    setDraftComment((current) => ({ ...current, [selectedExercise.id]: "" }));
    await updateWorkoutExercise(selectedDay.id, selectedExercise.id, { sets: nextSets.length, reps: String(currentDraftReps), weightLb: currentDraftWeight });
  }

  function selectSet(setId: string) {
    if (!selectedExercise) return;
    const found = currentSets.find((set) => set.id === setId);
    if (!found) return;
    setEditingSetId((current) => ({ ...current, [selectedExercise.id]: setId }));
    setDraftWeight((current) => ({ ...current, [selectedExercise.id]: found.weightLb }));
    setDraftReps((current) => ({ ...current, [selectedExercise.id]: found.reps }));
    setDraftComment((current) => ({ ...current, [selectedExercise.id]: found.comment ?? "" }));
  }

  function clearTrackDraft() {
    if (!selectedExercise) return;
    setEditingSetId((current) => ({ ...current, [selectedExercise.id]: null }));
    setDraftWeight((current) => ({ ...current, [selectedExercise.id]: selectedExercise.weightLb }));
    setDraftReps((current) => ({ ...current, [selectedExercise.id]: parseReps(selectedExercise.reps) }));
    setDraftComment((current) => ({ ...current, [selectedExercise.id]: "" }));
  }

  async function deleteSelectedSet() {
    if (!selectedExercise || !currentEditingSetId) return;
    const nextSets = currentSets.filter((set) => set.id !== currentEditingSetId);
    setTrackSets((current) => ({ ...current, [selectedExercise.id]: nextSets }));
    setEditingSetId((current) => ({ ...current, [selectedExercise.id]: null }));
    await updateWorkoutExercise(selectedDay.id, selectedExercise.id, { sets: nextSets.length });
  }

  function toggleSetComplete(setId: string) {
    if (!selectedExercise) return;
    setTrackSets((current) => ({ ...current, [selectedExercise.id]: currentSets.map((set) => (set.id === setId ? { ...set, completed: !set.completed } : set)) }));
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
    const nextSuperset: SupersetGroup = { id: `superset-${Date.now()}`, name: `Superset ${selectedSupersets.length + 1}`, exerciseIds: workoutSelection };
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
    setCustomExercises((current) => [...current, nextExercise].sort((left, right) => left.name.localeCompare(right.name)));
    if (saveAndNew) {
      resetNewExerciseForm();
      return;
    }
    resetNewExerciseForm();
    setSelectedCategory(newExerciseCategory);
    setMode("categories");
  }

  const monthGrid = getMonthMatrix(calendarMonth);
  const monthWorkoutsByDate = importedWorkouts.reduce<Record<string, CalendarWorkout>>((accumulator, workout) => {
    accumulator[workout.date] = workout;
    return accumulator;
  }, {});

  if (mode === "new-exercise") {
    return (
      <ScreenContainer>
        <SectionHeader eyebrow="Training" title="New Exercise" description="Create a new exercise with the same practical setup fields FitNotes centers." />
        <Card>
          <View style={styles.toolbar}>
            <Pressable onPress={() => setMode("categories")} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></Pressable>
            <Pressable onPress={() => saveNewExercise(true)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Save and New</Text></Pressable>
            <Pressable onPress={() => saveNewExercise(false)} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Save</Text></Pressable>
          </View>
        </Card>
        <Card>
          <Text style={styles.fieldLabel}>Name</Text>
          <TextInput value={newExerciseName} onChangeText={setNewExerciseName} placeholder="Exercise name" placeholderTextColor={colors.muted} style={styles.input} />
          <Text style={styles.fieldLabel}>Notes (Optional)</Text>
          <TextInput value={newExerciseNotes} onChangeText={setNewExerciseNotes} placeholder="Notes" placeholderTextColor={colors.muted} style={styles.input} />
          <Text style={styles.fieldLabel}>Category</Text>
          <View style={styles.chipRow}>{exerciseCategoryOrder.map((category) => <Pressable key={category} onPress={() => setNewExerciseCategory(category)} style={[styles.chip, newExerciseCategory === category && styles.chipActive]}><Text style={[styles.chipText, newExerciseCategory === category && styles.chipTextActive]}>{category}</Text></Pressable>)}</View>
          <Text style={styles.fieldLabel}>Type</Text>
          <View style={styles.chipRow}>{["Weight and Reps", "Distance and Time"].map((option) => <Pressable key={option} onPress={() => setNewExerciseType(option)} style={[styles.chip, newExerciseType === option && styles.chipActive]}><Text style={[styles.chipText, newExerciseType === option && styles.chipTextActive]}>{option}</Text></Pressable>)}</View>
          <Text style={styles.fieldLabel}>Weight Unit</Text>
          <View style={styles.chipRow}>{["Default (lbs)", "Metric (kgs)", "Imperial (lbs)"].map((unit) => <Pressable key={unit} onPress={() => setNewExerciseUnit(unit)} style={[styles.chip, newExerciseUnit === unit && styles.chipActive]}><Text style={[styles.chipText, newExerciseUnit === unit && styles.chipTextActive]}>{unit}</Text></Pressable>)}</View>
        </Card>
      </ScreenContainer>
    );
  }

  if (mode === "category-detail") {
    return (
      <ScreenContainer>
        <SectionHeader eyebrow="Training" title={selectedCategory} description={`Tap one exercise to add it to ${selectedDay.dayLabel}, or long-press to select multiple exercises first.`} />
        <Card>
          <View style={styles.toolbar}>
            <Pressable onPress={() => { setLibrarySelection([]); setMode("categories"); }} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></Pressable>
            {librarySelection.length ? <><Text style={styles.helperText}>{librarySelection.length} selected</Text><Pressable onPress={addSelectedExercises} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Add Selected</Text></Pressable></> : null}
          </View>
          <TextInput value={librarySearch} onChangeText={setLibrarySearch} placeholder={`Search ${selectedCategory}`} placeholderTextColor={colors.muted} style={styles.input} />
          {categoryExercises.map((exercise) => {
            const isSelected = librarySelection.includes(exercise.id);
            return (
              <Pressable key={exercise.id} onPress={() => handleExerciseLibraryTap(exercise)} onLongPress={() => toggleLibrarySelection(exercise.id)} style={[styles.exerciseListRow, isSelected && styles.exerciseListRowSelected]}>
                <View style={styles.exerciseListContent}>
                  <Text style={styles.exerciseTitle}>{exercise.name}</Text>
                  {exercise.aliases.length ? <Text style={styles.aliasText}>Also called: {exercise.aliases.join(", ")}</Text> : null}
                </View>
                <Text style={styles.mutedLink}>{replaceTargetExerciseId ? "Replace" : librarySelection.length ? (isSelected ? "Selected" : "Select") : "Add"}</Text>
              </Pressable>
            );
          })}
        </Card>
      </ScreenContainer>
    );
  }

  if (mode === "categories") {
    return (
      <ScreenContainer>
        <SectionHeader eyebrow="Training" title="All Exercises" description="Choose a category first, then open that category's exercise list on its own page." />
        <Card>
          <View style={styles.toolbar}>
            <Pressable onPress={() => setMode("log")} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></Pressable>
            <Pressable onPress={() => setMode("routines")} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Routines</Text></Pressable>
            <Pressable onPress={() => setMode("new-exercise")} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>New Exercise</Text></Pressable>
            <Pressable onPress={() => setShowCategoryColours((current) => !current)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{showCategoryColours ? "Colours" : "Plain"}</Text></Pressable>
          </View>
        </Card>
        <Card>
          {exerciseCategoryOrder.map((category) => (
            <Pressable key={category} onPress={() => { setSelectedCategory(category); setLibrarySearch(""); setLibrarySelection([]); setMode("category-detail"); }} style={styles.categoryRow}>
              <View style={styles.categoryRowLeft}>{showCategoryColours ? <View style={[styles.categoryDot, { backgroundColor: categoryColors[category] }]} /> : null}<Text style={styles.categoryRowText}>{category}</Text></View>
              <Text style={styles.mutedLink}>Open</Text>
            </Pressable>
          ))}
        </Card>
      </ScreenContainer>
    );
  }

  if (mode === "routines") {
    return (
      <ScreenContainer>
        <SectionHeader eyebrow="Training" title="Routines" description="Log a stored split into the current workout day, similar to FitNotes' routine-first flow." />
        <Card><View style={styles.toolbar}><Pressable onPress={() => setMode("log")} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></Pressable></View></Card>
        {routines.map((routine) => (
          <Card key={routine.id}>
            <Text style={styles.sectionTitle}>{routine.name}</Text>
            {routine.days.map((day) => <View key={day.id} style={styles.sectionRow}><Text style={styles.exerciseTitle}>{day.dayLabel}</Text><Text style={styles.helperText}>{day.exercises.length} exercises</Text></View>)}
            <Pressable onPress={async () => { await addWorkoutExercises(selectedDay.id, routine.days.flatMap((day) => day.exercises.map((exercise) => ({ exerciseName: exercise.exerciseName, category: exercise.category })))); setMode("log"); }} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Log Routine To {selectedDay.dayLabel}</Text></Pressable>
          </Card>
        ))}
      </ScreenContainer>
    );
  }

  if (mode === "exercise" && selectedExercise) {
    const estimated1Rm = estimateOneRm(currentDraftWeight, currentDraftReps);
    const setCalculator = Number((estimated1Rm * 0.75).toFixed(1));
    const plateLoadPerSide = Math.max(Number((((currentDraftWeight - 45) / 2)).toFixed(1)), 0);

    return (
      <ScreenContainer>
        <SectionHeader eyebrow="Training" title={selectedExercise.exerciseName} description="Track, history, and graph are kept as separate views the way FitNotes treats a single exercise." />
        <Card><View style={styles.toolbar}><Pressable onPress={() => setMode("log")} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></Pressable>{(["track", "history", "graph"] as ExerciseTab[]).map((tab) => <Pressable key={tab} onPress={() => setExerciseTab(tab)} style={[styles.chip, exerciseTab === tab && styles.chipActive]}><Text style={[styles.chipText, exerciseTab === tab && styles.chipTextActive]}>{tab.toUpperCase()}</Text></Pressable>)}</View></Card>
        {exerciseTab === "track" ? <><Card><Text style={styles.fieldLabel}>Weight (lbs)</Text><View style={styles.stepper}><Pressable onPress={() => setDraftWeight((current) => ({ ...current, [selectedExercise.id]: Math.max(0, currentDraftWeight - 5) }))} style={styles.stepButton}><Text style={styles.stepSymbol}>-</Text></Pressable><Text style={styles.stepValue}>{currentDraftWeight.toFixed(1)}</Text><Pressable onPress={() => setDraftWeight((current) => ({ ...current, [selectedExercise.id]: currentDraftWeight + 5 }))} style={styles.stepButton}><Text style={styles.stepSymbol}>+</Text></Pressable></View><Text style={styles.fieldLabel}>Reps</Text><View style={styles.stepper}><Pressable onPress={() => setDraftReps((current) => ({ ...current, [selectedExercise.id]: Math.max(1, currentDraftReps - 1) }))} style={styles.stepButton}><Text style={styles.stepSymbol}>-</Text></Pressable><Text style={styles.stepValue}>{currentDraftReps}</Text><Pressable onPress={() => setDraftReps((current) => ({ ...current, [selectedExercise.id]: currentDraftReps + 1 }))} style={styles.stepButton}><Text style={styles.stepSymbol}>+</Text></Pressable></View><Text style={styles.fieldLabel}>Comment</Text><TextInput value={currentDraftComment} onChangeText={(value) => setDraftComment((current) => ({ ...current, [selectedExercise.id]: value }))} placeholder="Optional note" placeholderTextColor={colors.muted} style={styles.input} /><View style={styles.toolbar}><Pressable onPress={saveTrackSet} style={styles.saveButton}><Text style={styles.primaryButtonText}>{currentEditingSetId ? "Update" : "Save"}</Text></Pressable><Pressable onPress={clearTrackDraft} style={styles.clearButton}><Text style={styles.primaryButtonText}>Clear</Text></Pressable>{currentEditingSetId ? <Pressable onPress={deleteSelectedSet} style={styles.deleteButton}><Text style={styles.primaryButtonText}>Delete</Text></Pressable> : null}</View></Card><Card>{currentSets.map((set, index) => <Pressable key={set.id} onPress={() => selectSet(set.id)} style={styles.loggedSetRow}><Text style={styles.setIndex}>{index + 1}</Text><Text style={styles.setValue}>{set.weightLb.toFixed(1)} lbs</Text><Text style={styles.setValue}>{set.reps} reps</Text><Pressable onPress={() => toggleSetComplete(set.id)} style={styles.checkButton}><Text style={styles.checkText}>{set.completed ? "Done" : "Open"}</Text></Pressable></Pressable>)}</Card></> : null}
        {exerciseTab === "history" ? <Card>{historyRows.map((row) => <View key={row.date} style={styles.historyBlock}><Text style={styles.historyHeading}>{row.date}</Text>{row.sets.map((set, index) => <View key={`${row.date}-${index}`} style={styles.loggedSetRow}><Text style={styles.setValue}>{set.weightLb.toFixed(1)} lbs</Text><Text style={styles.setValue}>{set.reps} reps</Text></View>)}</View>)}</Card> : null}
        {exerciseTab === "graph" ? <><Card><View style={styles.chipRow}>{(["1m", "3m", "6m", "1y", "all"] as GraphRange[]).map((range) => <Pressable key={range} onPress={() => setGraphRange(range)} style={[styles.chip, graphRange === range && styles.chipActive]}><Text style={[styles.chipText, graphRange === range && styles.chipTextActive]}>{range}</Text></Pressable>)}</View><View style={styles.graph}>{graphPoints.length ? graphPoints.map((point, index) => <View key={`${point}-${index}`} style={styles.graphColumn}><View style={[styles.graphBar, { height: `${(point / graphMax) * 100}%` }]} /></View>) : <Text style={styles.helperText}>Tap through Track and History to build exercise graph points.</Text>}</View></Card><Card><Text style={styles.sectionTitle}>Workout Tools</Text><Text style={styles.bodyText}>Estimated 1RM: {estimated1Rm.toFixed(1)} lbs</Text><Text style={styles.bodyText}>Set Calculator (75%): {setCalculator.toFixed(1)} lbs</Text><Text style={styles.bodyText}>Plate Calculator: 45 lb bar + {plateLoadPerSide.toFixed(1)} lbs each side</Text></Card></> : null}
      </ScreenContainer>
    );
  }

  if (mode === "calendar") {
    return (
      <ScreenContainer>
        <SectionHeader eyebrow="Training" title="Calendar" description="Month and list views are now their own Training page instead of being tucked away as planner-only data." />
        <Card><View style={styles.toolbar}><Pressable onPress={() => setMode("log")} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></Pressable><Pressable onPress={() => setCalendarView("month")} style={[styles.chip, calendarView === "month" && styles.chipActive]}><Text style={[styles.chipText, calendarView === "month" && styles.chipTextActive]}>Month</Text></Pressable><Pressable onPress={() => setCalendarView("list")} style={[styles.chip, calendarView === "list" && styles.chipActive]}><Text style={[styles.chipText, calendarView === "list" && styles.chipTextActive]}>List</Text></Pressable></View></Card>
        {calendarView === "month" ? <Card><View style={styles.calendarHeader}><Pressable onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Prev</Text></Pressable><Text style={styles.sectionTitle}>{getMonthTitle(calendarMonth)}</Text><Pressable onPress={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Next</Text></Pressable></View><View style={styles.calendarWeekHeader}>{["S", "M", "T", "W", "T", "F", "S"].map((label) => <Text key={label} style={styles.calendarWeekLabel}>{label}</Text>)}</View><View style={styles.calendarGrid}>{monthGrid.map((date) => { const iso = toIsoDate(date); const workout = monthWorkoutsByDate[iso]; const isCurrentMonth = date.getMonth() === calendarMonth.getMonth(); const isSelected = iso === selectedDateIso; return <Pressable key={iso} onPress={() => { setSelectedDateIso(iso); setSelectedCalendarWorkoutId(workout?.id ?? null); }} style={[styles.calendarCell, isSelected && styles.calendarCellSelected]}><Text style={[styles.calendarCellText, !isCurrentMonth && styles.calendarCellMuted, isSelected && styles.calendarCellTextActive]}>{date.getDate()}</Text><View style={styles.calendarDots}>{(workout?.categories ?? []).slice(0, 4).map((category) => <View key={`${iso}-${category}`} style={[styles.calendarDot, { backgroundColor: categoryColors[category] }]} />)}</View></Pressable>; })}</View></Card> : <Card>{Object.entries(groupedImportedWorkouts).map(([month, workouts]) => <View key={month} style={styles.historyBlock}><Text style={styles.historyHeading}>{month}</Text>{workouts.map((workout) => <Pressable key={workout.id} onPress={() => { setSelectedDateIso(workout.date); setSelectedCalendarWorkoutId(workout.id); }} style={[styles.exerciseListRow, selectedCalendarWorkoutId === workout.id && styles.exerciseListRowSelected]}><View style={styles.exerciseListContent}><Text style={styles.exerciseTitle}>{new Date(workout.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</Text><Text style={styles.aliasText}>{workout.summary}</Text></View><View style={styles.inlineDots}>{workout.categories.map((category) => <View key={`${workout.id}-${category}`} style={[styles.categoryDot, { backgroundColor: categoryColors[category] }]} />)}</View></Pressable>)}</View>)}</Card>}
        {selectedCalendarWorkout ? <Card><Text style={styles.sectionTitle}>Workout Panel</Text><Text style={styles.bodyText}>{new Date(selectedCalendarWorkout.date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</Text>{selectedCalendarWorkout.names.map((name, index) => <View key={`${selectedCalendarWorkout.id}-${name}-${index}`} style={styles.sectionRow}><Text style={styles.bodyText}>{name}</Text></View>)}</Card> : null}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SectionHeader
        eyebrow="Training"
        title="Workout Log"
        description="Use the same date-first flow as FitNotes: move day to day, open the calendar, add exercises, or copy the previous workout."
      />
      <Card>
        <View style={styles.toolbar}>
          <Pressable onPress={() => setSelectedDateIso(toIsoDate(previousDate))} style={styles.backButton}>
            <Text style={styles.backButtonText}>Prev</Text>
          </Pressable>
          <Text style={styles.sectionTitle}>{getRelativeDayLabel(selectedDate)}</Text>
          <Pressable onPress={() => setSelectedDateIso(toIsoDate(nextDate))} style={styles.backButton}>
            <Text style={styles.backButtonText}>Next</Text>
          </Pressable>
        </View>
        <View style={styles.toolbar}>
          <Pressable onPress={() => setMode("calendar")} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Calendar</Text>
          </Pressable>
          <Pressable onPress={() => setMode("categories")} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Exercises</Text>
          </Pressable>
          <Pressable onPress={() => setMode("routines")} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Routines</Text>
          </Pressable>
        </View>
      </Card>

      {workoutSelection.length ? (
        <Card>
          <View style={styles.toolbar}>
            <Text style={styles.sectionTitle}>{workoutSelection.length} exercise{workoutSelection.length === 1 ? "" : "s"} selected</Text>
            <Pressable onPress={() => setWorkoutSelection(selectedDay.exercises.map((exercise) => exercise.id))} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Select All</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (workoutSelection.length === 1) {
                  setReplaceTargetExerciseId(workoutSelection[0]);
                  setMode("categories");
                }
              }}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>Replace</Text>
            </Pressable>
            <Pressable onPress={() => createSuperset()} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Superset</Text>
            </Pressable>
            <Pressable onPress={() => moveSelectedWorkout("up")} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Move Up</Text>
            </Pressable>
            <Pressable onPress={() => moveSelectedWorkout("down")} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Move Down</Text>
            </Pressable>
            <Pressable onPress={() => deleteSelectedExercises()} style={styles.deleteButton}>
              <Text style={styles.primaryButtonText}>Delete</Text>
            </Pressable>
          </View>
        </Card>
      ) : null}

      {!selectedDay.exercises.length ? (
        <Card>
          <Text style={styles.sectionTitle}>Workout Log Empty</Text>
          <Text style={styles.helperText}>Start a new workout for {selectedDay.dayLabel}, or copy the previous workout into this day.</Text>
          <View style={styles.toolbar}>
            <Pressable onPress={() => setMode("categories")} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Start New Workout</Text>
            </Pressable>
            <Pressable onPress={copyPreviousWorkout} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Copy Previous Workout</Text>
            </Pressable>
          </View>
        </Card>
      ) : (
        <>
          {selectedSupersets.length ? (
            <Card>
              <Text style={styles.sectionTitle}>Supersets</Text>
              {selectedSupersets.map((superset) => (
                <View key={superset.id} style={styles.historyBlock}>
                  <Text style={styles.historyHeading}>{superset.name}</Text>
                  {superset.exerciseIds.map((exerciseId) => {
                    const match = selectedDay.exercises.find((exercise) => exercise.id === exerciseId);
                    return match ? (
                      <View key={exerciseId} style={styles.sectionRow}>
                        <Text style={styles.bodyText}>{match.exerciseName}</Text>
                      </View>
                    ) : null;
                  })}
                </View>
              ))}
            </Card>
          ) : null}

          <Card>
            {selectedDay.exercises.map((exercise) => {
              const isSelected = workoutSelection.includes(exercise.id);
              const sets = trackSets[exercise.id] ?? buildStartingSets(exercise);
              return (
                <Pressable
                  key={exercise.id}
                  onPress={() => {
                    if (workoutSelection.length) {
                      toggleWorkoutSelection(exercise.id);
                    } else {
                      openExercise(exercise.id);
                    }
                  }}
                  onLongPress={() => toggleWorkoutSelection(exercise.id)}
                  style={[styles.exerciseListRow, isSelected && styles.exerciseListRowSelected]}
                >
                  <View style={styles.exerciseListContent}>
                    <Text style={styles.exerciseTitle}>{exercise.exerciseName}</Text>
                    {sets.slice(0, 4).map((set) => (
                      <View key={set.id} style={styles.loggedSetRow}>
                        <Text style={styles.setValue}>{set.weightLb.toFixed(1)} lbs</Text>
                        <Text style={styles.setValue}>{set.reps} reps</Text>
                      </View>
                    ))}
                  </View>
                  <Text style={styles.mutedLink}>{isSelected ? "Selected" : "Open"}</Text>
                </Pressable>
              );
            })}
          </Card>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: spacing.sm
  },
  backButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surfaceMuted
  },
  backButtonText: {
    color: colors.text,
    fontWeight: "700"
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44,
    flexGrow: 1
  },
  primaryButtonText: {
    color: colors.surface,
    fontWeight: "800"
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: "700"
  },
  saveButton: {
    backgroundColor: "#21B36D",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  clearButton: {
    backgroundColor: "#2796E6",
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center"
  },
  deleteButton: {
    backgroundColor: colors.danger,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center"
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  chip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted
  },
  chipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent
  },
  chipText: {
    color: colors.text,
    fontWeight: "700"
  },
  chipTextActive: {
    color: colors.surface
  },
  helperText: {
    color: colors.muted,
    lineHeight: 20
  },
  mutedLink: {
    color: colors.accent,
    fontWeight: "700"
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceMuted,
    color: colors.text,
    marginBottom: spacing.md
  },
  fieldLabel: {
    color: colors.text,
    fontWeight: "800",
    marginBottom: spacing.xs
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 18,
    marginBottom: spacing.sm
  },
  bodyText: {
    color: colors.text,
    lineHeight: 20
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
  exerciseTitle: {
    color: colors.text,
    fontWeight: "800",
    fontSize: 16
  },
  aliasText: {
    color: colors.muted,
    lineHeight: 18
  },
  loggedSetRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.sm,
    paddingVertical: spacing.xs
  },
  setIndex: {
    color: colors.muted,
    width: 24,
    fontWeight: "700"
  },
  setValue: {
    color: colors.text,
    fontWeight: "700"
  },
  checkButton: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    backgroundColor: colors.surfaceMuted
  },
  checkText: {
    color: colors.text,
    fontWeight: "700"
  },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.xs,
    gap: spacing.md
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
  historyBlock: {
    marginBottom: spacing.md,
    gap: spacing.xs
  },
  historyHeading: {
    color: colors.accent,
    fontWeight: "800",
    marginBottom: spacing.xs
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
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    marginBottom: spacing.md
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center"
  },
  stepSymbol: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "800"
  },
  stepValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    minWidth: 80,
    textAlign: "center"
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
    justifyContent: "center",
    borderRadius: radius.md,
    paddingVertical: spacing.xs,
    gap: spacing.xs
  },
  calendarCellSelected: {
    backgroundColor: colors.accent
  },
  calendarCellText: {
    color: colors.text,
    fontWeight: "700"
  },
  calendarCellTextActive: {
    color: colors.surface
  },
  calendarCellMuted: {
    opacity: 0.35
  },
  calendarDots: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 4,
    maxWidth: 32
  },
  calendarDot: {
    width: 6,
    height: 6,
    borderRadius: 999
  },
  inlineDots: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center"
  }
});
