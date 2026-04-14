import { useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";

import { Card } from "@/components/Card";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionHeader } from "@/components/SectionHeader";
import { exerciseCategoryOrder, exerciseLibrary } from "@/data/exercise-library";
import { useAppState } from "@/providers/AppStateProvider";
import { ExerciseCategory, WorkoutExercise } from "@/types/domain";
import { colors, radius, spacing } from "@/theme/theme";

type ScreenMode = "home" | "categories" | "exercise" | "calendar";
type ExerciseTab = "track" | "history" | "graph";
type GraphRange = "1m" | "3m" | "6m" | "1y" | "all";

type SupersetGroup = {
  id: string;
  name: string;
  exerciseIds: string[];
  color: string;
  jumpBetween: boolean;
  disableTimerAutostart: boolean;
};

type LoggedSet = {
  id: string;
  weightLb: number;
  reps: number;
  completed: boolean;
};

type HistoryEntry = {
  date: string;
  sets: Array<{
    weightLb: number;
    reps: number;
  }>;
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
  if (!weightLb || !reps) {
    return 0;
  }

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

export default function TrainingScreen() {
  const {
    suggestions,
    weeklyPlan,
    fitNotesSummary,
    addWorkoutExercise,
    addWorkoutExercises,
    updateWorkoutExercise
  } = useAppState();

  const [mode, setMode] = useState<ScreenMode>("home");
  const [selectedDayId, setSelectedDayId] = useState(weeklyPlan[0]?.id ?? "mon");
  const [selectedCategory, setSelectedCategory] = useState<ExerciseCategory>("Abs");
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [exerciseTab, setExerciseTab] = useState<ExerciseTab>("track");
  const [search, setSearch] = useState("");
  const [multiSelectMode, setMultiSelectMode] = useState(false);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);
  const [trackSets, setTrackSets] = useState<Record<string, LoggedSet[]>>({});
  const [draftWeight, setDraftWeight] = useState<Record<string, number>>({});
  const [draftReps, setDraftReps] = useState<Record<string, number>>({});
  const [calendarView, setCalendarView] = useState<"month" | "list">("month");
  const [graphRange, setGraphRange] = useState<GraphRange>("3m");
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<string[]>([]);
  const [supersetsByDay, setSupersetsByDay] = useState<Record<string, SupersetGroup[]>>({});
  const [showCategoryColours, setShowCategoryColours] = useState(true);

  const selectedDay = weeklyPlan.find((day) => day.id === selectedDayId) ?? weeklyPlan[0];
  const selectedExercise = selectedDay?.exercises.find((exercise) => exercise.id === selectedExerciseId) ?? null;
  const currentSets = selectedExercise ? trackSets[selectedExercise.id] ?? buildStartingSets(selectedExercise) : [];
  const currentDraftWeight = selectedExercise ? draftWeight[selectedExercise.id] ?? selectedExercise.weightLb : 0;
  const currentDraftReps = selectedExercise ? draftReps[selectedExercise.id] ?? parseReps(selectedExercise.reps) : 0;
  const selectedDayIndex = weeklyPlan.findIndex((day) => day.id === selectedDayId);
  const previousDay = selectedDayIndex > 0 ? weeklyPlan[selectedDayIndex - 1] : null;
  const nextDay = selectedDayIndex < weeklyPlan.length - 1 ? weeklyPlan[selectedDayIndex + 1] : null;
  const currentSupersets = supersetsByDay[selectedDayId] ?? [];

  const filteredExercises = useMemo(() => {
    const query = search.trim().toLowerCase();
    return exerciseLibrary.filter((exercise) => {
      if (exercise.category !== selectedCategory) return false;
      if (!query) return true;
      return (
        exercise.name.toLowerCase().includes(query) ||
        exercise.aliases.some((alias) => alias.toLowerCase().includes(query))
      );
    });
  }, [search, selectedCategory]);

  const historyRows = useMemo(() => {
    if (!selectedExercise) return [];

    const imported: HistoryEntry[] =
      fitNotesSummary?.recentSessions
        .map((session, sessionIndex) => {
          const match = session.exercises.find((entry) => entry.exerciseName === selectedExercise.exerciseName);
          if (!match) return null;

          const date = new Date();
          date.setDate(date.getDate() - sessionIndex * 7);
          return {
            date: date
              .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
              .toUpperCase(),
            sets: Array.from({ length: match.setCount }, () => ({
              weightLb: match.topWeightLb,
              reps: Math.max(1, Math.round(match.totalReps / Math.max(match.setCount, 1)))
            }))
          };
        })
        .filter((entry): entry is HistoryEntry => entry !== null) ?? [];

    const todayLabel = new Date()
      .toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })
      .toUpperCase();
    const todaySets = currentSets.length
      ? [{ date: todayLabel, sets: currentSets.map((set) => ({ weightLb: set.weightLb, reps: set.reps })) }]
      : [];

    return [...todaySets, ...imported];
  }, [currentSets, fitNotesSummary, selectedExercise]);

  const rangeSizeLookup: Record<GraphRange, number> = {
    "1m": 4,
    "3m": 8,
    "6m": 12,
    "1y": 16,
    all: historyRows.length
  };

  const graphPoints = historyRows
    .slice(0, rangeSizeLookup[graphRange] || historyRows.length)
    .map((entry) => entry.sets.reduce((best, set) => Math.max(best, estimateOneRm(set.weightLb, set.reps)), 0))
    .reverse();
  const graphMax = Math.max(...graphPoints, 1);

  const importedWorkoutSummaries =
    fitNotesSummary?.recentSessions.map((session) => ({
      id: session.id,
      date: session.date,
      categories: [...new Set(session.exercises.map((exercise) => exercise.category))],
      names: session.exercises.map((exercise) => exercise.exerciseName)
    })) ?? [];

  function openExercise(exerciseId: string) {
    const exercise = selectedDay?.exercises.find((item) => item.id === exerciseId);
    if (!exercise) return;

    setTrackSets((current) => ({ ...current, [exercise.id]: current[exercise.id] ?? buildStartingSets(exercise) }));
    setSelectedExerciseId(exercise.id);
    setExerciseTab("track");
    setMode("exercise");
  }

  function toggleSelect(exerciseId: string) {
    setSelectedLibraryIds((current) =>
      current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId]
    );
  }

  function toggleWorkoutSelection(exerciseId: string) {
    setSelectedWorkoutIds((current) =>
      current.includes(exerciseId) ? current.filter((id) => id !== exerciseId) : [...current, exerciseId]
    );
  }

  async function handleLibraryTap(exerciseId: string, exerciseName: string, category: string) {
    if (multiSelectMode) {
      toggleSelect(exerciseId);
      return;
    }

    await addWorkoutExercise(selectedDayId, exerciseName, category);
    setMode("home");
  }

  async function addSelectedExercises() {
    const payload = filteredExercises
      .filter((exercise) => selectedLibraryIds.includes(exercise.id))
      .map((exercise) => ({ exerciseName: exercise.name, category: exercise.category }));
    await addWorkoutExercises(selectedDayId, payload);
    setSelectedLibraryIds([]);
    setMultiSelectMode(false);
    setMode("home");
  }

  async function copyPreviousWorkout() {
    if (!previousDay?.exercises.length) {
      return;
    }

    await addWorkoutExercises(
      selectedDayId,
      previousDay.exercises.map((exercise) => ({
        exerciseName: exercise.exerciseName,
        category: exercise.category
      }))
    );
  }

  function createSuperset() {
    if (selectedWorkoutIds.length < 2) {
      return;
    }

    const nextSuperset: SupersetGroup = {
      id: `superset-${Date.now()}`,
      name: `Superset ${currentSupersets.length + 1}`,
      exerciseIds: selectedWorkoutIds,
      color: "#E75B5B",
      jumpBetween: true,
      disableTimerAutostart: true
    };

    setSupersetsByDay((current) => ({
      ...current,
      [selectedDayId]: [...(current[selectedDayId] ?? []), nextSuperset]
    }));
    setSelectedWorkoutIds([]);
  }

  async function saveSet() {
    if (!selectedExercise) return;

    const nextSet: LoggedSet = {
      id: `${selectedExercise.id}-${Date.now()}`,
      weightLb: currentDraftWeight,
      reps: currentDraftReps,
      completed: true
    };

    const nextSets = [...currentSets, nextSet];
    setTrackSets((current) => ({ ...current, [selectedExercise.id]: nextSets }));
    await updateWorkoutExercise(selectedDayId, selectedExercise.id, {
      sets: nextSets.length,
      reps: String(currentDraftReps),
      weightLb: currentDraftWeight
    });
  }

  async function clearSets() {
    if (!selectedExercise) return;
    setTrackSets((current) => ({ ...current, [selectedExercise.id]: [] }));
    await updateWorkoutExercise(selectedDayId, selectedExercise.id, { sets: 0 });
  }

  if (mode === "categories") {
    return (
      <ScreenContainer>
        <SectionHeader
          eyebrow="Training"
          title="All exercises"
          description="Choose a muscle group first, then drill into that exercise list like FitNotes."
        />

        <Card>
          <Pressable onPress={() => setMode("home")} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back to workout</Text>
          </Pressable>
          <View style={styles.rowWrap}>
            <Pressable
              onPress={() => setShowCategoryColours((current) => !current)}
              style={styles.secondaryButton}
            >
              <Text style={styles.secondaryButtonText}>
                {showCategoryColours ? "Colours on" : "Colours off"}
              </Text>
            </Pressable>
            <Pressable onPress={() => setSearch("")} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Clear search</Text>
            </Pressable>
          </View>
          {exerciseCategoryOrder.map((category) => (
            <Pressable key={category} onPress={() => setSelectedCategory(category)} style={styles.categoryRow}>
              <View style={styles.categoryRowLeft}>
                {showCategoryColours ? (
                  <View style={[styles.categoryDot, { backgroundColor: categoryColors[category] }]} />
                ) : null}
                <Text style={styles.categoryRowText}>{category}</Text>
              </View>
              <Text style={styles.linkText}>Open</Text>
            </Pressable>
          ))}
        </Card>

        <Card>
          <Text style={styles.title}>{selectedCategory}</Text>
          <TextInput
            onChangeText={setSearch}
            placeholder={`Search ${selectedCategory.toLowerCase()} exercises`}
            placeholderTextColor={colors.muted}
            style={styles.input}
            value={search}
          />
          {multiSelectMode ? (
            <View style={styles.rowWrap}>
              <Text style={styles.body}>{selectedLibraryIds.length} selected</Text>
              <Pressable onPress={addSelectedExercises} style={styles.primaryButton}>
                <Text style={styles.primaryButtonText}>Add selected to {selectedDay.dayLabel}</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.body}>Tap one exercise to add it, or press and hold to enter multi-select mode.</Text>
          )}

          {filteredExercises.map((exercise) => {
            const isSelected = selectedLibraryIds.includes(exercise.id);
            return (
              <Pressable
                key={exercise.id}
                onPress={() => handleLibraryTap(exercise.id, exercise.name, exercise.category)}
                onLongPress={() => {
                  setMultiSelectMode(true);
                  toggleSelect(exercise.id);
                }}
                style={[styles.exerciseRow, isSelected && styles.exerciseRowSelected]}
              >
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

  if (mode === "exercise" && selectedExercise) {
    const estimated1Rm = estimateOneRm(currentDraftWeight, currentDraftReps);
    const setCalculator = Math.round((estimated1Rm * 0.75) / 5) * 5;

    return (
      <ScreenContainer>
        <SectionHeader
          eyebrow="Training"
          title={selectedExercise.exerciseName}
          description="Track, history, and graph are split the same way FitNotes centers one exercise at a time."
        />

        <Card>
          <Pressable onPress={() => setMode("home")} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back to workout</Text>
          </Pressable>
          <View style={styles.rowWrap}>
            {(["track", "history", "graph"] as ExerciseTab[]).map((tab) => (
              <Pressable
                key={tab}
                onPress={() => setExerciseTab(tab)}
                style={[styles.dayChip, exerciseTab === tab && styles.dayChipActive]}
              >
                <Text style={[styles.dayChipText, exerciseTab === tab && styles.dayChipTextActive]}>{tab.toUpperCase()}</Text>
              </Pressable>
            ))}
          </View>
        </Card>

        {exerciseTab === "track" ? (
          <Card>
            <Text style={styles.trackLabel}>Weight (lbs)</Text>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setDraftWeight((current) => ({ ...current, [selectedExercise.id]: Math.max(0, currentDraftWeight - 5) }))}
                style={styles.stepButton}
              >
                <Text style={styles.stepButtonText}>-</Text>
              </Pressable>
              <Text style={styles.stepValue}>{currentDraftWeight.toFixed(1)}</Text>
              <Pressable
                onPress={() => setDraftWeight((current) => ({ ...current, [selectedExercise.id]: currentDraftWeight + 5 }))}
                style={styles.stepButton}
              >
                <Text style={styles.stepButtonText}>+</Text>
              </Pressable>
            </View>

            <Text style={styles.trackLabel}>Reps</Text>
            <View style={styles.stepper}>
              <Pressable
                onPress={() => setDraftReps((current) => ({ ...current, [selectedExercise.id]: Math.max(1, currentDraftReps - 1) }))}
                style={styles.stepButton}
              >
                <Text style={styles.stepButtonText}>-</Text>
              </Pressable>
              <Text style={styles.stepValue}>{currentDraftReps}</Text>
              <Pressable
                onPress={() => setDraftReps((current) => ({ ...current, [selectedExercise.id]: currentDraftReps + 1 }))}
                style={styles.stepButton}
              >
                <Text style={styles.stepButtonText}>+</Text>
              </Pressable>
            </View>

            <View style={styles.rowWrap}>
              <Pressable onPress={saveSet} style={styles.saveButton}>
                <Text style={styles.primaryButtonText}>Save</Text>
              </Pressable>
              <Pressable onPress={clearSets} style={styles.clearButton}>
                <Text style={styles.primaryButtonText}>Clear</Text>
              </Pressable>
            </View>

            {currentSets.map((set, index) => (
              <View key={set.id} style={styles.setRow}>
                <Text style={styles.setCell}>{index + 1}</Text>
                <Text style={styles.setCell}>{set.weightLb.toFixed(1)} lbs</Text>
                <Text style={styles.setCell}>{set.reps} reps</Text>
                <Text style={styles.setCell}>{set.completed ? "✓" : ""}</Text>
              </View>
            ))}
          </Card>
        ) : null}

        {exerciseTab === "history" ? (
          <Card>
            {historyRows.map((entry) => (
              <View key={entry.date} style={styles.historyGroup}>
                <Text style={styles.historyDate}>{entry.date}</Text>
                {entry.sets.map((set, index) => (
                  <View key={`${entry.date}-${index}`} style={styles.setRow}>
                    <Text style={styles.setCell}>{set.weightLb.toFixed(1)} lbs</Text>
                    <Text style={styles.setCell}>{set.reps} reps</Text>
                  </View>
                ))}
              </View>
            ))}
          </Card>
        ) : null}

        {exerciseTab === "graph" ? (
          <>
            <Card>
              <Text style={styles.title}>Progress graph</Text>
              <View style={styles.rowWrap}>
                {(["1m", "3m", "6m", "1y", "all"] as GraphRange[]).map((range) => (
                  <Pressable
                    key={range}
                    onPress={() => setGraphRange(range)}
                    style={[styles.dayChip, graphRange === range && styles.dayChipActive]}
                  >
                    <Text style={[styles.dayChipText, graphRange === range && styles.dayChipTextActive]}>
                      {range}
                    </Text>
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
                  <Text style={styles.body}>Graph points appear as you log or import sessions.</Text>
                )}
              </View>
            </Card>

            <Card>
              <Text style={styles.title}>Workout tools</Text>
              <Text style={styles.body}>Estimated 1RM: {estimated1Rm.toFixed(1)} lbs</Text>
              <Text style={styles.body}>Set calculator (75%): {setCalculator.toFixed(1)} lbs</Text>
              <Text style={styles.body}>
                Plate calculator at {currentDraftWeight.toFixed(1)} lbs: 45s x{" "}
                {Math.max(Math.floor((currentDraftWeight - 45) / 90), 0)} each side before smaller change plates.
              </Text>
            </Card>
          </>
        ) : null}
      </ScreenContainer>
    );
  }

  if (mode === "calendar") {
    return (
      <ScreenContainer>
        <SectionHeader
          eyebrow="Training"
          title="Workout calendar"
          description="Review past workouts by date with month-style or list-style views."
        />
        <Card>
          <View style={styles.rowWrap}>
            <Pressable onPress={() => setMode("home")} style={styles.backButton}>
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>
            <Pressable onPress={() => setCalendarView("month")} style={[styles.secondaryButton, calendarView === "month" && styles.dayChipActive]}>
              <Text style={[styles.secondaryButtonText, calendarView === "month" && styles.dayChipTextActive]}>Month View</Text>
            </Pressable>
            <Pressable onPress={() => setCalendarView("list")} style={[styles.secondaryButton, calendarView === "list" && styles.dayChipActive]}>
              <Text style={[styles.secondaryButtonText, calendarView === "list" && styles.dayChipTextActive]}>List View</Text>
            </Pressable>
          </View>

          {importedWorkoutSummaries.map((workout) => (
            <View key={workout.id} style={styles.historyGroup}>
              <Text style={styles.historyDate}>{workout.date}</Text>
              {calendarView === "month" ? (
                <View style={styles.rowWrap}>
                  {workout.categories.map((category) => (
                    showCategoryColours ? (
                      <View
                        key={`${workout.id}-${category}`}
                        style={[
                          styles.categoryDot,
                          { backgroundColor: categoryColors[category as ExerciseCategory] ?? colors.accent }
                        ]}
                      />
                    ) : (
                      <Text key={`${workout.id}-${category}`} style={styles.body}>
                        {category}
                      </Text>
                    )
                  ))}
                </View>
              ) : (
                workout.names.map((name) => (
                  <Text key={`${workout.id}-${name}`} style={styles.body}>
                    {name}
                  </Text>
                ))
              )}
            </View>
          ))}
        </Card>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SectionHeader
        eyebrow="Training"
        title="FitNotes-style workout log"
        description="Day log first, then category drill-in, exercise detail, history, graphing, and workout review."
      />

      <Card>
        <View style={styles.rowWrap}>
          <Pressable
            disabled={!previousDay}
            onPress={() => previousDay && setSelectedDayId(previousDay.id)}
            style={[styles.secondaryButton, !previousDay && styles.disabledButton]}
          >
            <Text style={styles.secondaryButtonText}>Previous day</Text>
          </Pressable>
          <Pressable
            disabled={!nextDay}
            onPress={() => nextDay && setSelectedDayId(nextDay.id)}
            style={[styles.secondaryButton, !nextDay && styles.disabledButton]}
          >
            <Text style={styles.secondaryButtonText}>Next day</Text>
          </Pressable>
          {weeklyPlan.map((day) => (
            <Pressable
              key={day.id}
              onPress={() => setSelectedDayId(day.id)}
              style={[styles.dayChip, day.id === selectedDayId && styles.dayChipActive]}
            >
              <Text style={[styles.dayChipText, day.id === selectedDayId && styles.dayChipTextActive]}>{day.dayLabel}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.focusText}>{selectedDay.focus}</Text>
        <Text style={styles.body}>
          {selectedDay.dayLabel === "Monday" ? "Today" : selectedDay.dayLabel === "Tuesday" ? "Tomorrow" : "Upcoming"}{" "}
          log style: tap an exercise to open Track / History / Graph. Press and hold to select several exercises.
        </Text>

        {selectedDay.exercises.length ? (
          selectedDay.exercises.map((exercise) => {
            const sets = trackSets[exercise.id] ?? buildStartingSets(exercise);
            const isSelected = selectedWorkoutIds.includes(exercise.id);
            return (
              <Pressable
                key={exercise.id}
                onLongPress={() => toggleWorkoutSelection(exercise.id)}
                onPress={() => (selectedWorkoutIds.length ? toggleWorkoutSelection(exercise.id) : openExercise(exercise.id))}
                style={[styles.exerciseCard, isSelected && styles.exerciseRowSelected]}
              >
                <View style={styles.exerciseHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.exerciseName}>{exercise.exerciseName}</Text>
                    <Text style={styles.exerciseCategory}>{exercise.category}</Text>
                  </View>
                  <Text style={styles.linkText}>{isSelected ? "Selected" : "Track"}</Text>
                </View>
                {sets.slice(0, 4).map((set, index) => (
                  <View key={set.id} style={styles.setRow}>
                    <Text style={styles.setCell}>{index + 1}</Text>
                    <Text style={styles.setCell}>{set.weightLb.toFixed(1)} lbs</Text>
                    <Text style={styles.setCell}>{set.reps} reps</Text>
                  </View>
                ))}
              </Pressable>
            );
          })
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>Workout Log Empty</Text>
            <Pressable onPress={() => setMode("categories")} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Start New Workout</Text>
            </Pressable>
            <Pressable onPress={copyPreviousWorkout} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Copy previous workout</Text>
            </Pressable>
          </View>
        )}
      </Card>

      {selectedWorkoutIds.length ? (
        <Card>
          <Text style={styles.title}>{selectedWorkoutIds.length} exercise{selectedWorkoutIds.length > 1 ? "s" : ""} selected</Text>
          <View style={styles.rowWrap}>
            <Pressable onPress={createSuperset} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>New superset</Text>
            </Pressable>
            <Pressable onPress={() => setSelectedWorkoutIds(selectedDay.exercises.map((exercise) => exercise.id))} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Select all</Text>
            </Pressable>
            <Pressable onPress={() => setSelectedWorkoutIds([])} style={styles.secondaryButton}>
              <Text style={styles.secondaryButtonText}>Clear selection</Text>
            </Pressable>
          </View>
        </Card>
      ) : null}

      {currentSupersets.length ? (
        <Card>
          <Text style={styles.title}>Supersets</Text>
          {currentSupersets.map((superset) => (
            <View key={superset.id} style={styles.suggestion}>
              <View style={styles.categoryRowLeft}>
                <View style={[styles.categoryDot, { backgroundColor: superset.color }]} />
                <Text style={styles.suggestionTitle}>{superset.name}</Text>
              </View>
              <Text style={styles.body}>
                {superset.exerciseIds
                  .map((exerciseId) => selectedDay.exercises.find((exercise) => exercise.id === exerciseId)?.exerciseName)
                  .filter(Boolean)
                  .join(" → ")}
              </Text>
              <Text style={styles.body}>
                Jump between exercises: {superset.jumpBetween ? "On" : "Off"} • Timer auto-start:{" "}
                {superset.disableTimerAutostart ? "Off" : "On"}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}

      <Card>
        <View style={styles.rowWrap}>
          <Pressable onPress={() => setMode("categories")} style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>All Exercises</Text>
          </Pressable>
          <Pressable onPress={() => setMode("calendar")} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Calendar</Text>
          </Pressable>
        </View>
      </Card>

      <Card>
        <Text style={styles.title}>Routines</Text>
        <Text style={styles.body}>
          FitNotes keeps routines as reusable workout templates. PulsePilot is using your weekly day plan as the first
          routine layer so each day can act like a repeatable template.
        </Text>
        {weeklyPlan.map((day) => (
          <View key={day.id} style={styles.suggestion}>
            <Text style={styles.suggestionTitle}>{day.dayLabel}</Text>
            <Text style={styles.body}>{day.exercises.length} exercises • {day.focus}</Text>
          </View>
        ))}
      </Card>

      <Card>
        <Text style={styles.title}>Suggested changes</Text>
        {suggestions.map((suggestion) => (
          <View key={suggestion.id} style={styles.suggestion}>
            <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
            <Text style={styles.body}>{suggestion.reason}</Text>
          </View>
        ))}
      </Card>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: { color: colors.text, fontSize: 18, fontWeight: "800" },
  body: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  focusText: { color: colors.muted, fontSize: 15 },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  dayChip: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: 14, paddingVertical: 10 },
  dayChipActive: { backgroundColor: colors.accent },
  dayChipText: { color: colors.text, fontWeight: "700" },
  dayChipTextActive: { color: "#FFFFFF" },
  primaryButton: { alignItems: "center", backgroundColor: colors.accent, borderRadius: radius.pill, justifyContent: "center", paddingHorizontal: 16, paddingVertical: 14 },
  primaryButtonText: { color: "#FFFFFF", fontWeight: "800" },
  secondaryButton: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, justifyContent: "center", paddingHorizontal: 16, paddingVertical: 14 },
  disabledButton: { opacity: 0.45 },
  secondaryButtonText: { color: colors.text, fontWeight: "800" },
  exerciseCard: { borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  exerciseHeader: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  exerciseName: { color: colors.text, fontSize: 15, fontWeight: "800" },
  exerciseCategory: { color: colors.muted, fontSize: 13 },
  linkText: { color: colors.accent, fontSize: 12, fontWeight: "800" },
  setRow: { alignItems: "center", flexDirection: "row", gap: spacing.sm, paddingVertical: 4 },
  setCell: { color: colors.text, fontSize: 13, minWidth: 54 },
  emptyState: { alignItems: "center", gap: spacing.md, paddingVertical: spacing.xl },
  emptyTitle: { color: colors.muted, fontSize: 24, fontWeight: "300" },
  backButton: { alignItems: "center", alignSelf: "flex-start", backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 10 },
  backButtonText: { color: colors.text, fontSize: 13, fontWeight: "800" },
  categoryRow: { alignItems: "center", borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", justifyContent: "space-between", paddingVertical: 14 },
  categoryRowLeft: { alignItems: "center", flexDirection: "row", gap: spacing.sm },
  categoryRowText: { color: colors.text, fontSize: 18 },
  categoryDot: { borderRadius: radius.pill, height: 12, width: 12 },
  input: { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: radius.md, borderWidth: 1, color: colors.text, paddingHorizontal: 14, paddingVertical: 12 },
  exerciseRow: { borderTopColor: colors.border, borderTopWidth: 1, flexDirection: "row", gap: spacing.sm, paddingVertical: 12 },
  exerciseRowSelected: { backgroundColor: colors.accentSoft, borderRadius: radius.md, paddingHorizontal: spacing.sm },
  aliasText: { color: colors.muted, fontSize: 12, lineHeight: 18 },
  trackLabel: { color: colors.text, fontSize: 13, fontWeight: "800" },
  stepper: { alignItems: "center", flexDirection: "row", gap: spacing.md, justifyContent: "center" },
  stepButton: { alignItems: "center", backgroundColor: colors.surfaceMuted, borderRadius: radius.sm, height: 48, justifyContent: "center", width: 56 },
  stepButtonText: { color: colors.text, fontSize: 28, fontWeight: "600" },
  stepValue: { color: colors.text, fontSize: 28, fontWeight: "700", minWidth: 90, textAlign: "center" },
  saveButton: { alignItems: "center", backgroundColor: "#2AAE6A", borderRadius: radius.sm, justifyContent: "center", paddingHorizontal: 18, paddingVertical: 14 },
  clearButton: { alignItems: "center", backgroundColor: "#3B8DD0", borderRadius: radius.sm, justifyContent: "center", paddingHorizontal: 18, paddingVertical: 14 },
  historyGroup: { borderTopColor: colors.border, borderTopWidth: 1, gap: spacing.xs, paddingVertical: spacing.sm },
  historyDate: { color: colors.text, fontSize: 14, fontWeight: "800", textTransform: "uppercase" },
  graph: { alignItems: "flex-end", borderBottomColor: colors.border, borderBottomWidth: 1, borderLeftColor: colors.border, borderLeftWidth: 1, flexDirection: "row", gap: spacing.sm, height: 220, padding: spacing.sm },
  graphColumn: { flex: 1, height: "100%", justifyContent: "flex-end" },
  graphBar: { backgroundColor: colors.accent, borderRadius: radius.sm, minHeight: 8 },
  suggestion: { borderTopColor: colors.border, borderTopWidth: 1, gap: 6, paddingTop: spacing.sm },
  suggestionTitle: { color: colors.text, fontSize: 15, fontWeight: "800" }
});
