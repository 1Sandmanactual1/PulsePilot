import { FitNotesImportSummary, FitNotesWorkoutExerciseSummary, FitNotesWorkoutSession } from "@/types/domain";

type CsvRow = Record<string, string>;

function parseCsv(text: string) {
  const rows: string[][] = [];
  let current = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(current);
      current = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(current);
      current = "";
      if (row.some((cell) => cell.length > 0)) {
        rows.push(row);
      }
      row = [];
      continue;
    }

    current += char;
  }

  if (current.length > 0 || row.length > 0) {
    row.push(current);
    rows.push(row);
  }

  return rows;
}

function normalizeKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function toObjects(rows: string[][]): CsvRow[] {
  if (!rows.length) {
    return [];
  }

  const headers = rows[0].map((header) => header.trim());
  return rows.slice(1).map((values) => {
    const row: CsvRow = {};
    headers.forEach((header, headerIndex) => {
      row[header] = values[headerIndex]?.trim() ?? "";
    });
    return row;
  });
}

function getValue(row: CsvRow, keys: string[]) {
  const entries = Object.entries(row);
  for (const key of keys) {
    const match = entries.find(([rowKey]) => normalizeKey(rowKey) === normalizeKey(key));
    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function parseNumber(raw: string) {
  const normalized = raw.replace(/[^0-9.-]+/g, "");
  const value = Number(normalized);
  return Number.isFinite(value) ? value : 0;
}

function normalizeDate(raw: string) {
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }

  const parts = raw.split(/[/-]/).map((part) => part.trim());
  if (parts.length === 3) {
    const [first, second, third] = parts;
    if (third.length === 4) {
      const month = first.padStart(2, "0");
      const day = second.padStart(2, "0");
      return `${third}-${month}-${day}`;
    }
  }

  return raw;
}

function weekdayFromDate(date: string) {
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "Unknown";
  }

  return parsed.toLocaleDateString("en-US", { weekday: "long" });
}

function topCategoryForSession(exercises: FitNotesWorkoutExerciseSummary[]) {
  const counts = new Map<string, number>();
  exercises.forEach((exercise) => {
    counts.set(exercise.category, (counts.get(exercise.category) ?? 0) + exercise.setCount);
  });

  const sorted = [...counts.entries()].sort((left, right) => right[1] - left[1]);
  return sorted[0]?.[0] ?? "Mixed";
}

export function summarizeFitNotesCsv(fileName: string, text: string): FitNotesImportSummary {
  const rows = toObjects(parseCsv(text));
  const sessions = new Map<string, Map<string, FitNotesWorkoutExerciseSummary>>();
  const categoryCounts = new Map<string, number>();
  const weekdayCounts = new Map<string, number>();

  rows.forEach((row) => {
    const rawDate = getValue(row, ["Date", "Workout Date", "Timestamp", "Day"]);
    const date = normalizeDate(rawDate);
    const exerciseName = getValue(row, ["Exercise", "Exercise Name", "Name"]) || "Unknown exercise";
    const category =
      getValue(row, ["Category", "Exercise Category", "Body Part", "Muscle Group"]) || "Uncategorized";
    const reps = parseNumber(getValue(row, ["Reps", "Rep Count"]));
    const weight = parseNumber(getValue(row, ["Weight", "Weight (kg)", "Weight (lb)", "Load"]));

    if (!sessions.has(date)) {
      sessions.set(date, new Map());
    }

    const workoutMap = sessions.get(date)!;
    const existing = workoutMap.get(exerciseName);
    if (existing) {
      existing.setCount += 1;
      existing.totalReps += reps;
      existing.topWeightLb = Math.max(existing.topWeightLb, weight);
    } else {
      workoutMap.set(exerciseName, {
        exerciseName,
        category,
        setCount: 1,
        totalReps: reps,
        topWeightLb: weight
      });
    }

    categoryCounts.set(category, (categoryCounts.get(category) ?? 0) + 1);
    const weekday = weekdayFromDate(date);
    weekdayCounts.set(weekday, (weekdayCounts.get(weekday) ?? 0) + 1);
  });

  const recentSessions: FitNotesWorkoutSession[] = [...sessions.entries()]
    .sort((left, right) => right[0].localeCompare(left[0]))
    .slice(0, 8)
    .map(([date, exerciseMap]) => {
      const exercises = [...exerciseMap.values()].sort((left, right) => right.setCount - left.setCount);
      return {
        id: `${date}-${exercises.length}`,
        date,
        weekday: weekdayFromDate(date),
        exerciseCount: exercises.length,
        topCategory: topCategoryForSession(exercises),
        exercises
      };
    });

  return {
    importedFileName: fileName,
    importedAt: new Date().toISOString(),
    totalRows: rows.length,
    totalSessions: sessions.size,
    topCategories: [...categoryCounts.entries()]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([category, count]) => ({ category, count })),
    weekdayDistribution: [...weekdayCounts.entries()]
      .sort((left, right) => right[1] - left[1])
      .map(([weekday, count]) => ({ weekday, count })),
    recentSessions
  };
}
