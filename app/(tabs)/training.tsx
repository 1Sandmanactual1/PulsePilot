import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@/components/Card";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { exerciseCategoryOrder, exerciseLibrary } from "@/data/exercise-library";
import { useAppState } from "@/providers/AppStateProvider";
import { ExerciseCategory, ExerciseDefinition, WorkoutExercise } from "@/types/domain";
import { colors, radius, spacing } from "@/theme/theme";

type ScreenMode = "home" | "categories" | "exercise" | "calendar" | "routines" | "new-exercise";
type ExerciseTab = "track" | "history" | "graph";
type CalendarView = "month" | "list";
type GraphRange = "1m" | "3m" | "6m" | "1y" | "all";

type LoggedSet = { id: string; weightLb: number; reps: number; completed: boolean; comment?: string };
type SupersetGroup = { id: string; name: string; exerciseIds: string[] };
type HistoryRow = { date: string; sets: Array<{ weightLb: number; reps: number }> };
type CalendarWorkout = {
  id: string;
  date: string;
  categories: string[];
  names: string[];
  exerciseDetails: Array<{ name: string; category: string; topWeightLb: number; reps: number; setCount: number }>;
};

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

function monthKey(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
}

export default function TrainingScreen() {
  const { suggestions, weeklyPlan, fitNotesSummary, addWorkoutExercise, addWorkoutExercises, updateWorkoutExercise, removeWorkoutExercise } = useAppState();
  const [mode, setMode] = useState<ScreenMode>("home");
  const [selectedDayId, setSelectedDayId] = useState(weeklyPlan[0]?.id ?? "mon");
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>("Abs");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [exerciseTab, setExerciseTab] = useState<ExerciseTab>("track");
  const [calendarView, setCalendarView] = useState<CalendarView>("month");
  const [graphRange, setGraphRange] = useState<GraphRange>("3m");
  const [search, setSearch] = useState("");
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<string[]>([]);
  const [trackSets, setTrackSets] = useState<Record<string, LoggedSet[]>>({});
  const [draftWeight, setDraftWeight] = useState<Record<string, number>>({});
  const [draftReps, setDraftReps] = useState<Record<string, number>>({});
  const [draftComment, setDraftComment] = useState<Record<string, string>>({});
  const [editingSetId, setEditingSetId] = useState<Record<string, string | null>>({});
  const [supersetsByDay, setSupersetsByDay] = useState<Record<string, SupersetGroup[]>>({});
  const [showCategoryColours, setShowCategoryColours] = useState(true);
  const [showCalendarPanel, setShowCalendarPanel] = useState(true);
  const [showCalendarNav, setShowCalendarNav] = useState(true);
  const [showCalendarSets, setShowCalendarSets] = useState(true);
  const [showCalendarCategoryNames, setShowCalendarCategoryNames] = useState(true);
  const [calendarCategoryFilters, setCalendarCategoryFilters] = useState<ExerciseCategory[]>([]);
  const [calendarExerciseFilter, setCalendarExerciseFilter] = useState("");
  const [calendarMatchMode, setCalendarMatchMode] = useState<"all" | "any">("any");
  const [selectedCalendarWorkoutId, setSelectedCalendarWorkoutId] = useState<string | null>(null);
  const [customExercises] = useState<ExerciseDefinition[]>([]);

  const selectedDay = weeklyPlan.find((day) => day.id === selectedDayId) ?? weeklyPlan[0];
  const selectedDayIndex = weeklyPlan.findIndex((day) => day.id === selectedDayId);
  const previousDay = selectedDayIndex > 0 ? weeklyPlan[selectedDayIndex - 1] : null;
  const nextDay = selectedDayIndex < weeklyPlan.length - 1 ? weeklyPlan[selectedDayIndex + 1] : null;
  const selectedExercise = selectedDay?.exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null;
  const currentSets = selectedExercise ? trackSets[selectedExercise.id] ?? buildStartingSets(selectedExercise) : [];
  const currentDraftWeight = selectedExercise ? draftWeight[selectedExercise.id] ?? selectedExercise.weightLb : 0;
  const currentDraftReps = selectedExercise ? draftReps[selectedExercise.id] ?? parseReps(selectedExercise.reps) : 0;
  const currentDraftComment = selectedExercise ? draftComment[selectedExercise.id] ?? "" : "";
  const currentEditingSetId = selectedExercise ? editingSetId[selectedExercise.id] ?? null : null;
  const currentSupersets = supersetsByDay[selectedDayId] ?? [];

  const allExercises = useMemo(() => [...exerciseLibrary, ...customExercises], [customExercises]);
  const routines = useMemo(
    () => [
      {
        id: "routine-weekly-split",
        name: "Weekly Split",
        days: weeklyPlan.map((day) => ({
          id: day.id,
          dayLabel: day.dayLabel,
          exercises: day.exercises
        }))
      }
    ],
    [weeklyPlan]
  );
  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();
    return allExercises.filter((exercise) => {
      if (exercise.category !== selectedCategory) return false;
      if (!query) return true;
      return exercise.name.toLowerCase().includes(query) || exercise.aliases.some((alias) => alias.toLowerCase().includes(query));
    });
  }, [allExercises, search, selectedCategory]);

  const historyRows = useMemo<HistoryRow[]>(() => {
    if (!selectedExercise) return [];
    const todayLabel = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase();
    const todaySets: HistoryRow[] = currentSets.length
      ? [{ date: todayLabel, sets: currentSets.map((set) => ({ weightLb: set.weightLb, reps: set.reps })) }]
      : [];
    const imported = (fitNotesSummary?.recentSessions ?? []).reduce<HistoryRow[]>((rows, session, index) => {
      const match = session.exercises.find((entry) => entry.exerciseName === selectedExercise.exerciseName);
      if (!match) return rows;
      const date = new Date();
      date.setDate(date.getDate() - index * 7);
      rows.push({
        date: date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }).toUpperCase(),
        sets: Array.from({ length: match.setCount }, () => ({
          weightLb: match.topWeightLb,
          reps: Math.max(1, Math.round(match.totalReps / Math.max(match.setCount, 1)))
        }))
      });
      return rows;
    }, []);
    return [...todaySets, ...imported];
  }, [currentSets, fitNotesSummary, selectedExercise]);

  const graphPointCount: Record<GraphRange, number> = { "1m": 4, "3m": 8, "6m": 12, "1y": 16, all: historyRows.length };
  const graphPoints = historyRows.slice(0, graphPointCount[graphRange] || historyRows.length).map((entry) => entry.sets.reduce((best, set) => Math.max(best, estimateOneRm(set.weightLb, set.reps)), 0)).reverse();
  const graphMax = Math.max(...graphPoints, 1);

  const importedWorkouts = useMemo<CalendarWorkout[]>(() => fitNotesSummary?.recentSessions.map((session) => ({
    id: session.id,
    date: session.date,
    categories: [...new Set(session.exercises.map((exercise) => exercise.category))],
    names: session.exercises.map((exercise) => exercise.exerciseName),
    exerciseDetails: session.exercises.map((exercise) => ({
      name: exercise.exerciseName,
      category: exercise.category,
      topWeightLb: exercise.topWeightLb,
      reps: Math.max(1, Math.round(exercise.totalReps / Math.max(exercise.setCount, 1))),
      setCount: exercise.setCount
    }))
  })) ?? [], [fitNotesSummary]);

  const filteredCalendarWorkouts = useMemo(() => {
    const query = calendarExerciseFilter.trim().toLowerCase();
    return importedWorkouts.filter((workout) => {
      if (calendarCategoryFilters.length) {
        const matches = calendarCategoryFilters.map((category) => workout.categories.includes(category));
        const pass = calendarMatchMode === "all" ? matches.every(Boolean) : matches.some(Boolean);
        if (!pass) return false;
      }
      if (query && !workout.names.some((name) => name.toLowerCase().includes(query))) return false;
      return true;
    });
  }, [calendarCategoryFilters, calendarExerciseFilter, calendarMatchMode, importedWorkouts]);

  const groupedCalendarWorkouts = useMemo(() => filteredCalendarWorkouts.reduce<Record<string, CalendarWorkout[]>>((accumulator, workout) => {
    const key = monthKey(workout.date);
    accumulator[key] = accumulator[key] ? [...accumulator[key], workout] : [workout];
    return accumulator;
  }, {}), [filteredCalendarWorkouts]);

  const selectedCalendarWorkout = filteredCalendarWorkouts.find((workout) => workout.id === selectedCalendarWorkoutId) ?? filteredCalendarWorkouts[0] ?? null;

  function ensureExerciseState(exercise: WorkoutExercise) {
    setTrackSets((current) => ({ ...current, [exercise.id]: current[exercise.id] ?? buildStartingSets(exercise) }));
    setDraftWeight((current) => ({ ...current, [exercise.id]: current[exercise.id] ?? exercise.weightLb }));
    setDraftReps((current) => ({ ...current, [exercise.id]: current[exercise.id] ?? parseReps(exercise.reps) }));
    setDraftComment((current) => ({ ...current, [exercise.id]: current[exercise.id] ?? "" }));
  }

  function openExercise(exerciseId: string) {
    const exercise = selectedDay?.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;
    ensureExerciseState(exercise);
    setSelectedExerciseId(exercise.id);
    setExerciseTab("track");
    setMode("exercise");
  }

  function toggleLibrarySelect(exerciseId: string) {
    setSelectedLibraryIds((current) => current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId]);
  }

  function toggleWorkoutSelection(exerciseId: string) {
    setSelectedWorkoutIds((current) => current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId]);
  }

  async function handleLibraryTap(exerciseId: string, name: string, category: string) {
    if (multiSelectMode) {
      toggleLibrarySelect(exerciseId);
      return;
    }
    await addWorkoutExercise(selectedDayId, name, category);
    setMode("home");
  }

  async function addSelectedExercises() {
    await addWorkoutExercises(selectedDayId, filteredExercises.filter((exercise) => selectedLibraryIds.includes(exercise.id)).map((exercise) => ({ exerciseName: exercise.name, category: exercise.category })));
    setSelectedLibraryIds([]);
    setMultiSelectMode(false);
    setMode("home");
  }

  async function copyPreviousWorkout() {
    if (!previousDay?.exercises.length) return;
    await addWorkoutExercises(selectedDayId, previousDay.exercises.map((exercise) => ({ exerciseName: exercise.exerciseName, category: exercise.category })));
  }

  function createSuperset() {
    if (selectedWorkoutIds.length < 2) return;
    const nextSuperset: SupersetGroup = { id: `superset-${Date.now()}`, name: `Superset ${currentSupersets.length + 1}`, exerciseIds: selectedWorkoutIds };
    setSupersetsByDay((current) => ({ ...current, [selectedDayId]: [...(current[selectedDayId] ?? []), nextSuperset] }));
    setSelectedWorkoutIds([]);
  }

  function selectSet(setId: string) {
    if (!selectedExercise) return;
    const set = currentSets.find((item) => item.id === setId);
    if (!set) return;
    setEditingSetId((current) => ({ ...current, [selectedExercise.id]: setId }));
    setDraftWeight((current) => ({ ...current, [selectedExercise.id]: set.weightLb }));
    setDraftReps((current) => ({ ...current, [selectedExercise.id]: set.reps }));
    setDraftComment((current) => ({ ...current, [selectedExercise.id]: set.comment ?? "" }));
  }

  async function saveSet() {
    if (!selectedExercise) return;
    const nextSet: LoggedSet = { id: currentEditingSetId ?? `${selectedExercise.id}-${Date.now()}`, weightLb: currentDraftWeight, reps: currentDraftReps, completed: currentEditingSetId ? currentSets.find((set) => set.id === currentEditingSetId)?.completed ?? false : false, comment: currentDraftComment || undefined };
    const nextSets = currentEditingSetId ? currentSets.map((set) => (set.id === currentEditingSetId ? nextSet : set)) : [...currentSets, nextSet];
    setTrackSets((current) => ({ ...current, [selectedExercise.id]: nextSets }));
    setEditingSetId((current) => ({ ...current, [selectedExercise.id]: null }));
    setDraftComment((current) => ({ ...current, [selectedExercise.id]: "" }));
    await updateWorkoutExercise(selectedDayId, selectedExercise.id, { sets: nextSets.length, reps: String(currentDraftReps), weightLb: currentDraftWeight });
  }

  async function clearDraft() {
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
    await updateWorkoutExercise(selectedDayId, selectedExercise.id, { sets: nextSets.length });
  }

  function toggleSetComplete(setId: string) {
    if (!selectedExercise) return;
    setTrackSets((current) => ({ ...current, [selectedExercise.id]: currentSets.map((set) => (set.id === setId ? { ...set, completed: !set.completed } : set)) }));
  }

  if (mode === "categories") {
    return (
      <ScreenContainer>
        <SectionHeader eyebrow="Training" title="Exercise list" description="Choose a category, then drill into the exercise list like FitNotes." />
        <Card>
          <View style={styles.rowWrap}>
            <Pressable onPress={() => setMode("home")} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></Pressable>
            <Pressable onPress={() => setMode("routines")} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Routines</Text></Pressable>
            <Pressable onPress={() => setShowCategoryColours((current) => !current)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>{showCategoryColours ? "Colours On" : "Colours Off"}</Text></Pressable>
          </View>
        </Card>
        <Card>
          {exerciseCategoryOrder.map((category) => (
            <Pressable key={category} onPress={() => setSelectedCategory(category)} style={styles.categoryRow}>
              <View style={styles.categoryRowLeft}>
                {showCategoryColours ? <View style={[styles.categoryDot, { backgroundColor: categoryColors[category] }]} /> : null}
                <Text style={styles.categoryRowText}>{category}</Text>
              </View>
              <Text style={styles.linkText}>Open</Text>
            </Pressable>
          ))}
        </Card>
        <Card>
          <Text style={styles.title}>{selectedCategory}</Text>
          <TextInput value={search} onChangeText={setSearch} placeholder={`Search ${selectedCategory.toLowerCase()} exercises`} placeholderTextColor={colors.muted} style={styles.input} />
          {multiSelectMode ? (
            <View style={styles.rowWrap}>
              <Text style={styles.body}>{selectedLibraryIds.length} selected</Text>
              <Pressable onPress={addSelectedExercises} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Add Selected</Text></Pressable>
              <Pressable onPress={() => { setMultiSelectMode(false); setSelectedLibraryIds([]); }} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Cancel</Text></Pressable>
            </View>
          ) : <Text style={styles.body}>Tap to add one exercise, or press and hold to select multiple exercises.</Text>}
          {filteredExercises.map((exercise) => {
            const isSelected = selectedLibraryIds.includes(exercise.id);
            return (
              <Pressable key={exercise.id} onPress={() => handleLibraryTap(exercise.id, exercise.name, exercise.category)} onLongPress={() => { setMultiSelectMode(true); toggleLibrarySelect(exercise.id); }} style={[styles.exerciseRow, isSelected && styles.exerciseRowSelected]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.exerciseName}>{exercise.name}</Text>
                  {exercise.aliases.length ? <Text style={styles.aliasText}>Also called: {exercise.aliases.join(", ")}</Text> : null}
                </View>
                <Text style={styles.linkText}>{multiSelectMode ? (isSelected ? "Selected" : "Select") : "Add"}</Text>
              </Pressable>
            );
          })}
        </Card>
      </ScreenContainer>
    );
  }

  if (mode === "routines") {
    return (
      <ScreenContainer>
        <SectionHeader eyebrow="Training" title="Routines" description="PulsePilot now surfaces repeated workout templates more explicitly." />
        <Card>
          <View style={styles.rowWrap}>
            <Pressable onPress={() => setMode("home")} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></Pressable>
            <Pressable onPress={async () => {
              await addWorkoutExercises(selectedDayId, routines[0].days.flatMap((day) => day.exercises).map((exercise) => ({ exerciseName: exercise.exerciseName, category: exercise.category })));
              setMode("home");
            }} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Log Weekly Split To {selectedDay.dayLabel}</Text></Pressable>
          </View>
        </Card>
        <Card>
          <Text style={styles.title}>Weekly Split</Text>
          {weeklyPlan.map((day) => (
            <View key={day.id} style={styles.historyGroup}>
              <Text style={styles.historyDate}>{day.dayLabel}</Text>
              {day.exercises.map((exercise) => <Text key={exercise.id} style={styles.body}>{exercise.exerciseName}</Text>)}
            </View>
          ))}
        </Card>
      </ScreenContainer>
    );
  }

  if (mode === "exercise" && selectedExercise) {
    const estimated1Rm = estimateOneRm(currentDraftWeight, currentDraftReps);
    const setCalculator = Math.round((estimated1Rm * 0.75) / 5) * 5;
    return (
      <ScreenContainer>
        <SectionHeader eyebrow="Training" title={selectedExercise.exerciseName} description="Track, history, and graph are split the same way FitNotes centers one exercise at a time." />
        <Card>
          <View style={styles.rowWrap}>
            <Pressable onPress={() => setMode("home")} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></Pressable>
            {(["track", "history", "graph"] as ExerciseTab[]).map((tab) => (
              <Pressable key={tab} onPress={() => setExerciseTab(tab)} style={[styles.dayChip, exerciseTab === tab && styles.dayChipActive]}>
                <Text style={[styles.dayChipText, exerciseTab === tab && styles.dayChipTextActive]}>{tab.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>
        </Card>
        {exerciseTab === "track" ? (
          <>
            <Card>
              <Text style={styles.label}>Weight (lbs)</Text>
              <View style={styles.stepper}>
                <Pressable onPress={() => setDraftWeight((current) => ({ ...current, [selectedExercise.id]: Math.max(0, currentDraftWeight - 5) }))} style={styles.stepButton}><Text style={styles.stepText}>-</Text></Pressable>
                <Text style={styles.stepValue}>{currentDraftWeight.toFixed(1)}</Text>
                <Pressable onPress={() => setDraftWeight((current) => ({ ...current, [selectedExercise.id]: currentDraftWeight + 5 }))} style={styles.stepButton}><Text style={styles.stepText}>+</Text></Pressable>
              </View>
              <Text style={styles.label}>Reps</Text>
              <View style={styles.stepper}>
                <Pressable onPress={() => setDraftReps((current) => ({ ...current, [selectedExercise.id]: Math.max(1, currentDraftReps - 1) }))} style={styles.stepButton}><Text style={styles.stepText}>-</Text></Pressable>
                <Text style={styles.stepValue}>{currentDraftReps}</Text>
                <Pressable onPress={() => setDraftReps((current) => ({ ...current, [selectedExercise.id]: currentDraftReps + 1 }))} style={styles.stepButton}><Text style={styles.stepText}>+</Text></Pressable>
              </View>
              <Text style={styles.label}>Comment</Text>
              <TextInput value={currentDraftComment} onChangeText={(value) => setDraftComment((current) => ({ ...current, [selectedExercise.id]: value }))} placeholder="Optional set note" placeholderTextColor={colors.muted} style={styles.input} />
              <View style={styles.rowWrap}>
                <Pressable onPress={saveSet} style={styles.saveButton}><Text style={styles.primaryButtonText}>{currentEditingSetId ? "Update" : "Save"}</Text></Pressable>
                <Pressable onPress={clearDraft} style={styles.clearButton}><Text style={styles.primaryButtonText}>Clear</Text></Pressable>
                {currentEditingSetId ? <Pressable onPress={deleteSelectedSet} style={styles.deleteButton}><Text style={styles.primaryButtonText}>Delete</Text></Pressable> : null}
              </View>
            </Card>
            <Card>
              <Text style={styles.title}>Logged sets</Text>
              {currentSets.map((set, index) => (
                <Pressable key={set.id} onPress={() => selectSet(set.id)} style={styles.setCard}>
                  <View style={styles.setRow}>
                    <Text style={styles.setCell}>{index + 1}</Text>
                    <Text style={styles.setCell}>{set.weightLb.toFixed(1)} lbs</Text>
                    <Text style={styles.setCell}>{set.reps} reps</Text>
                    <Pressable onPress={() => toggleSetComplete(set.id)} style={styles.checkButton}><Text style={styles.checkText}>{set.completed ? "Done" : "Open"}</Text></Pressable>
                  </View>
                  {set.comment ? <Text style={styles.aliasText}>Comment: {set.comment}</Text> : null}
                </Pressable>
              ))}
            </Card>
          </>
        ) : null}
        {exerciseTab === "history" ? <Card>{historyRows.map((entry) => <View key={entry.date} style={styles.historyGroup}><Text style={styles.historyDate}>{entry.date}</Text>{entry.sets.map((set, index) => <View key={`${entry.date}-${index}`} style={styles.setRow}><Text style={styles.setCell}>{set.weightLb.toFixed(1)} lbs</Text><Text style={styles.setCell}>{set.reps} reps</Text></View>)}</View>)}</Card> : null}
        {exerciseTab === "graph" ? <><Card><Text style={styles.title}>Progress graph</Text><View style={styles.rowWrap}>{(["1m", "3m", "6m", "1y", "all"] as GraphRange[]).map((range) => <Pressable key={range} onPress={() => setGraphRange(range)} style={[styles.dayChip, graphRange === range && styles.dayChipActive]}><Text style={[styles.dayChipText, graphRange === range && styles.dayChipTextActive]}>{range}</Text></Pressable>)}</View><View style={styles.graph}>{graphPoints.length ? graphPoints.map((point, index) => <View key={`${point}-${index}`} style={styles.graphColumn}><View style={[styles.graphBar, { height: `${(point / graphMax) * 100}%` }]} /></View>) : <Text style={styles.body}>Graph points appear as you log or import sessions.</Text>}</View></Card><Card><Text style={styles.title}>Workout tools</Text><Text style={styles.body}>Estimated 1RM: {estimated1Rm.toFixed(1)} lbs</Text><Text style={styles.body}>Set calculator (75%): {setCalculator.toFixed(1)} lbs</Text><Text style={styles.body}>Plate calculator at {currentDraftWeight.toFixed(1)} lbs: 45s x {Math.max(Math.floor((currentDraftWeight - 45) / 90), 0)} each side.</Text></Card></> : null}
      </ScreenContainer>
    );
  }

  if (mode === "calendar") {
    return (
      <ScreenContainer>
        <SectionHeader eyebrow="Training" title="Workout calendar" description="Month view, list view, filters, workout panel, and navigation bar behavior are now part of Training." />
        <Card>
          <View style={styles.rowWrap}>
            <Pressable onPress={() => setMode("home")} style={styles.backButton}><Text style={styles.backButtonText}>Back</Text></Pressable>
            <Pressable onPress={() => setCalendarView("month")} style={[styles.secondaryButton, calendarView === "month" && styles.dayChipActive]}><Text style={[styles.secondaryButtonText, calendarView === "month" && styles.dayChipTextActive]}>Month View</Text></Pressable>
            <Pressable onPress={() => setCalendarView("list")} style={[styles.secondaryButton, calendarView === "list" && styles.dayChipActive]}><Text style={[styles.secondaryButtonText, calendarView === "list" && styles.dayChipTextActive]}>List View</Text></Pressable>
          </View>
        </Card>
        <Card>
          <Text style={styles.title}>Calendar options</Text>
          <View style={styles.rowWrap}>
            <Pressable onPress={() => setShowCalendarPanel((current) => !current)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Workout Panel {showCalendarPanel ? "On" : "Off"}</Text></Pressable>
            <Pressable onPress={() => setShowCategoryColours((current) => !current)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Category Dots {showCategoryColours ? "On" : "Off"}</Text></Pressable>
            <Pressable onPress={() => setShowCalendarNav((current) => !current)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Navigation Bar {showCalendarNav ? "On" : "Off"}</Text></Pressable>
            <Pressable onPress={() => setShowCalendarSets((current) => !current)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Sets {showCalendarSets ? "On" : "Off"}</Text></Pressable>
            <Pressable onPress={() => setShowCalendarCategoryNames((current) => !current)} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Category Names {showCalendarCategoryNames ? "On" : "Off"}</Text></Pressable>
          </View>
        </Card>
        <Card>
          <Text style={styles.title}>Filters</Text>
          <TextInput value={calendarExerciseFilter} onChangeText={setCalendarExerciseFilter} placeholder="Exercise filter" placeholderTextColor={colors.muted} style={styles.input} />
          <View style={styles.rowWrap}>
            <Pressable onPress={() => setCalendarMatchMode("any")} style={[styles.dayChip, calendarMatchMode === "any" && styles.dayChipActive]}><Text style={[styles.dayChipText, calendarMatchMode === "any" && styles.dayChipTextActive]}>Match Any</Text></Pressable>
            <Pressable onPress={() => setCalendarMatchMode("all")} style={[styles.dayChip, calendarMatchMode === "all" && styles.dayChipActive]}><Text style={[styles.dayChipText, calendarMatchMode === "all" && styles.dayChipTextActive]}>Match All</Text></Pressable>
          </View>
          <View style={styles.rowWrap}>
            {exerciseCategoryOrder.map((category) => <Pressable key={category} onPress={() => setCalendarCategoryFilters((current) => current.includes(category) ? current.filter((item) => item !== category) : [...current, category])} style={[styles.dayChip, calendarCategoryFilters.includes(category) && styles.dayChipActive]}><Text style={[styles.dayChipText, calendarCategoryFilters.includes(category) && styles.dayChipTextActive]}>{category}</Text></Pressable>)}
          </View>
        </Card>
        <Card>
          <Text style={styles.title}>{calendarView === "month" ? "Month View" : "List View"}</Text>
          {calendarView === "month" ? Object.entries(groupedCalendarWorkouts).map(([month, workouts]) => <View key={month} style={styles.historyGroup}><Text style={styles.historyDate}>{month}</Text>{workouts.map((workout) => <Pressable key={workout.id} onPress={() => setSelectedCalendarWorkoutId(workout.id)} style={[styles.calendarWorkoutRow, selectedCalendarWorkout?.id === workout.id && styles.exerciseRowSelected]}><Text style={styles.exerciseName}>{workout.date}</Text><View style={styles.rowWrap}>{showCategoryColours ? workout.categories.map((category) => <View key={`${workout.id}-${category}`} style={[styles.categoryDot, { backgroundColor: categoryColors[category as ExerciseCategory] ?? colors.accent }]} />) : <Text style={styles.body}>{workout.categories.join(", ")}</Text>}</View></Pressable>)}</View>) : filteredCalendarWorkouts.map((workout) => <View key={workout.id} style={styles.historyGroup}><Text style={styles.historyDate}>{workout.date}</Text>{workout.exerciseDetails.map((exercise) => <View key={`${workout.id}-${exercise.name}`} style={styles.listRow}>{showCategoryColours ? <View style={[styles.categoryDot, { backgroundColor: categoryColors[exercise.category as ExerciseCategory] ?? colors.accent }]} /> : null}<View style={{ flex: 1 }}><Text style={styles.body}>{exercise.name}</Text>{showCalendarSets ? <Text style={styles.aliasText}>{exercise.setCount} sets x {exercise.topWeightLb.toFixed(1)} lbs x {exercise.reps} reps</Text> : null}</View></View>)}{showCalendarCategoryNames ? <Text style={styles.aliasText}>{workout.categories.join(", ")}</Text> : null}</View>)}
        </Card>
        {showCalendarPanel && selectedCalendarWorkout ? <Card><Text style={styles.title}>Workout panel</Text><Text style={styles.body}>{selectedCalendarWorkout.date}</Text>{selectedCalendarWorkout.exerciseDetails.map((exercise) => <Pressable key={`${selectedCalendarWorkout.id}-${exercise.name}`} onPress={() => addWorkoutExercise(selectedDayId, exercise.name, exercise.category)} style={styles.exerciseRow}><View style={{ flex: 1 }}><Text style={styles.exerciseName}>{exercise.name}</Text><Text style={styles.aliasText}>{exercise.setCount} sets x {exercise.topWeightLb.toFixed(1)} lbs x {exercise.reps} reps</Text></View><Text style={styles.linkText}>Add</Text></Pressable>)}</Card> : null}
        {showCalendarNav ? <Card><View style={styles.rowWrap}><Text style={styles.body}>{filteredCalendarWorkouts.length} workouts</Text><Pressable onPress={() => { if (!selectedCalendarWorkout) return; const index = filteredCalendarWorkouts.findIndex((item) => item.id === selectedCalendarWorkout.id); if (index > 0) setSelectedCalendarWorkoutId(filteredCalendarWorkouts[index - 1].id); }} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Previous Workout</Text></Pressable><Pressable onPress={() => { if (!selectedCalendarWorkout) return; const index = filteredCalendarWorkouts.findIndex((item) => item.id === selectedCalendarWorkout.id); if (index >= 0 && index < filteredCalendarWorkouts.length - 1) setSelectedCalendarWorkoutId(filteredCalendarWorkouts[index + 1].id); }} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Next Workout</Text></Pressable></View></Card> : null}
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SectionHeader eyebrow="Training" title="FitNotes-style workout log" description="Day log first, then exercises, routines, calendar, history, graphing, and set tools." />
      <Card>
        <View style={styles.rowWrap}>
          <Pressable onPress={() => setMode("categories")} style={styles.primaryButton}><Text style={styles.primaryButtonText}>All Exercises</Text></Pressable>
          <Pressable onPress={() => setMode("routines")} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Routines</Text></Pressable>
          <Pressable onPress={() => setMode("calendar")} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Calendar</Text></Pressable>
        </View>
      </Card>
      <Card>
        <View style={styles.rowWrap}>
          <Pressable disabled={!previousDay} onPress={() => previousDay && setSelectedDayId(previousDay.id)} style={[styles.secondaryButton, !previousDay && styles.disabled]}><Text style={styles.secondaryButtonText}>Previous Day</Text></Pressable>
          <Pressable disabled={!nextDay} onPress={() => nextDay && setSelectedDayId(nextDay.id)} style={[styles.secondaryButton, !nextDay && styles.disabled]}><Text style={styles.secondaryButtonText}>Next Day</Text></Pressable>
        </View>
        <View style={styles.rowWrap}>
          {weeklyPlan.map((day) => <Pressable key={day.id} onPress={() => setSelectedDayId(day.id)} style={[styles.dayChip, day.id === selectedDayId && styles.dayChipActive]}><Text style={[styles.dayChipText, day.id === selectedDayId && styles.dayChipTextActive]}>{day.dayLabel}</Text></Pressable>)}
        </View>
        <Text style={styles.body}>{selectedDay.focus}</Text>
        {selectedDay.exercises.length ? selectedDay.exercises.map((exercise) => {
          const sets = trackSets[exercise.id] ?? buildStartingSets(exercise);
          const completed = sets.filter((set) => set.completed).length;
          const isSelected = selectedWorkoutIds.includes(exercise.id);
          return <Pressable key={exercise.id} onLongPress={() => toggleWorkoutSelection(exercise.id)} onPress={() => selectedWorkoutIds.length ? toggleWorkoutSelection(exercise.id) : openExercise(exercise.id)} style={[styles.exerciseCard, isSelected && styles.exerciseRowSelected]}><View style={styles.exerciseHeader}><View style={{ flex: 1 }}><Text style={styles.exerciseName}>{exercise.exerciseName}</Text><Text style={styles.exerciseCategory}>{exercise.category}</Text></View><Text style={styles.linkText}>{completed}/{Math.max(sets.length, 1)}</Text></View>{sets.slice(0, 4).map((set, index) => <View key={set.id} style={styles.setRow}><Text style={styles.setCell}>{index + 1}</Text><Text style={styles.setCell}>{set.weightLb.toFixed(1)} lbs</Text><Text style={styles.setCell}>{set.reps} reps</Text><Text style={styles.setCell}>{set.completed ? "Done" : ""}</Text></View>)}</Pressable>;
        }) : <View style={styles.emptyState}><Text style={styles.emptyTitle}>Workout Log Empty</Text><Pressable onPress={() => setMode("categories")} style={styles.primaryButton}><Text style={styles.primaryButtonText}>Start New Workout</Text></Pressable><Pressable onPress={copyPreviousWorkout} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Copy Previous Workout</Text></Pressable></View>}
      </Card>
      {selectedWorkoutIds.length ? <Card><Text style={styles.title}>{selectedWorkoutIds.length} exercise{selectedWorkoutIds.length > 1 ? "s" : ""} selected</Text><View style={styles.rowWrap}><Pressable onPress={createSuperset} style={styles.primaryButton}><Text style={styles.primaryButtonText}>New Superset</Text></Pressable><Pressable onPress={() => setSelectedWorkoutIds(selectedDay.exercises.map((exercise) => exercise.id))} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Select All</Text></Pressable><Pressable onPress={() => setSelectedWorkoutIds([])} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Clear</Text></Pressable>{selectedWorkoutIds.length === 1 ? <Pressable onPress={async () => { await removeWorkoutExercise(selectedDayId, selectedWorkoutIds[0]); setSelectedWorkoutIds([]); }} style={styles.deleteButton}><Text style={styles.primaryButtonText}>Delete</Text></Pressable> : null}</View></Card> : null}
      {currentSupersets.length ? <Card><Text style={styles.title}>Supersets</Text>{currentSupersets.map((superset) => <View key={superset.id} style={styles.historyGroup}><Text style={styles.historyDate}>{superset.name}</Text><Text style={styles.body}>{superset.exerciseIds.map((id) => selectedDay.exercises.find((exercise) => exercise.id === id)?.exerciseName).filter(Boolean).join(" -> ")}</Text></View>)}</Card> : null}
      <Card>
        <Text style={styles.title}>Suggested changes</Text>
        {suggestions.map((suggestion) => <View key={suggestion.id} style={styles.historyGroup}><Text style={styles.exerciseName}>{suggestion.title}</Text><Text style={styles.body}>{suggestion.reason}</Text></View>)}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  title: { color: colors.text, fontSize: 18, fontWeight: "800" },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  label: { color: colors.text, fontSize: 13, fontWeight: "800" },
  backButton: { alignItems: "center", alignSelf: "flex-start", backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 10 },
  backButtonText: { color: colors.text, fontSize: 13, fontWeight: "800" },
  primaryButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: radius.pill, justifyContent: "center", paddingHorizontal: 16, paddingVertical: 14 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800" },
  secondaryButton: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, justifyContent: "center", paddingHorizontal: 16, paddingVertical: 14 },
  secondaryButtonText: { color: colors.text, fontWeight: "800" },
  deleteButton: { alignItems: "center", backgroundColor: "#D34B41", borderRadius: radius.pill, justifyContent: "center", paddingHorizontal: 16, paddingVertical: 14 },
  saveButton: { alignItems: "center", backgroundColor: "#2AAE6A", borderRadius: radius.sm, justifyContent: "center", paddingHorizontal: 18, paddingVertical: 14 },
  clearButton: { alignItems: "center", backgroundColor: "#3B8DD0", borderRadius: radius.sm, justifyContent: "center", paddingHorizontal: 18, paddingVertical: 14 },
  disabled: { opacity: 0.45 },
  dayChip: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 10 },
  dayChipActive: { backgroundColor: colors.accent },
  dayChipText: { color: colors.text, fontWeight: "700" },
  dayChipTextActive: { color: "#FFFFFF" },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.text, paddingHorizontal: 14, paddingVertical: 12 },
  categoryRow: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: 14 },
  categoryRowLeft: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  categoryRowText: { color: colors.text, fontSize: 18 },
  categoryDot: { borderRadius: radius.pill, height: 12, width: 12 },
  exerciseRow: { borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", gap: spacing.sm, paddingVertical: 12 },
  exerciseRowSelected: { backgroundColor: colors.accentSoft, borderRadius: radius.md, paddingHorizontal: spacing.sm },
  exerciseCard: { borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  exerciseHeader: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  exerciseName: { color: colors.text, fontSize: 15, fontWeight: "800" },
  exerciseCategory: { color: colors.muted, fontSize: 13 },
  aliasText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  linkText: { color: colors.accent, fontSize: 12, fontWeight: "800" },
  emptyState: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl },
  emptyTitle: { color: colors.muted, fontSize: 24, fontWeight: "300" },
  stepper: { alignItems: "center", flexDirection: "row", gap: spacing.md, justifyContent: "center" },
  stepButton: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, height: 48, justifyContent: "center", width: 56 },
  stepText: { color: colors.text, fontSize: 28, fontWeight: "600" },
  stepValue: { color: colors.text, fontSize: 28, fontWeight: "700", minWidth: 90, textAlign: "center" },
  setCard: { borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.xs, padding: spacing.sm },
  setRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm, paddingVertical: 4 },
  setCell: { color: colors.text, fontSize: 13, minWidth: 54 },
  checkButton: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, justifyContent: "center", paddingHorizontal: 12, paddingVertical: 6 },
  checkText: { color: colors.text, fontSize: 12, fontWeight: "800" },
  historyGroup: { borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.xs, paddingVertical: spacing.sm },
  historyDate: { color: colors.text, fontSize: 14, fontWeight: "800", textTransform: "uppercase" },
  graph: { alignItems: "flex-end", borderBottomColor: colors.border, borderBottomWidth: 1, borderLeftColor: colors.border, borderLeftWidth: 1, flexDirection: "row", gap: spacing.sm, height: 220, padding: spacing.sm },
  graphColumn: { flex: 1, height: "100%", justifyContent: "flex-end" },
  graphBar: { backgroundColor: colors.accent, borderRadius: radius.sm, minHeight: 8 },
  calendarWorkoutRow: { borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.xs, paddingVertical: spacing.sm },
  listRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm, paddingVertical: 4 }
});
