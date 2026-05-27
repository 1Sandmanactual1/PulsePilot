from __future__ import annotations

import json
import re
import unicodedata
from pathlib import Path
from typing import Iterable
from urllib.request import Request, urlopen


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "src" / "data" / "exercise-library-lyfta.generated.ts"
HEADERS = {"User-Agent": "Mozilla/5.0"}
BASE_URL = "https://lyfta.app/exercises?page={page}"
LAST_PAGE = 244


def slugify(value: str) -> str:
    normalized = unicodedata.normalize("NFKD", value).encode("ascii", "ignore").decode("ascii")
    normalized = normalized.lower()
    normalized = re.sub(r"[^a-z0-9]+", "-", normalized).strip("-")
    return normalized or "exercise"


def fetch_page(page: int) -> list[dict]:
    html = urlopen(Request(BASE_URL.format(page=page), headers=HEADERS), timeout=30).read().decode("utf-8", "ignore")
    match = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', html)
    if not match:
      raise RuntimeError(f"Could not find __NEXT_DATA__ for page {page}")
    data = json.loads(match.group(1))
    return data["props"]["pageProps"].get("firstData", [])


def first_body_parts(raw: object) -> list[str]:
    if isinstance(raw, list):
        return [part for part in raw if isinstance(part, str) and part.strip()]
    return []


def classify_category(name: str, body_parts: list[str], equipment: list[str]) -> str:
    lower = name.lower()
    parts = {part.lower() for part in body_parts}

    if "chest" in parts:
        return "Chest"
    if "back" in parts or "neck" in parts:
        return "Back"
    if "biceps" in parts:
        return "Biceps"
    if "triceps" in parts:
        return "Triceps"
    if "forearms" in parts:
        return "Forearms"
    if "shoulders" in parts:
        return "Shoulders"
    if "waist" in parts:
        return "Abs"
    if parts & {"quadriceps", "thighs", "hips", "hamstrings", "calves"}:
        return "Legs"
    if parts & {"cardio", "plyometrics", "yoga", "stretching"}:
        return "Cardio"

    if any(token in lower for token in ("curl", "hammer curl", "zottman", "bayesian curl")):
        return "Biceps"
    if any(token in lower for token in ("pushdown", "skullcrusher", "triceps", "kickback", "overhead extension")):
        return "Triceps"
    if any(token in lower for token in ("raise", "press", "jerk", "snatch", "upright row", "arnold")):
        return "Shoulders"
    if any(token in lower for token in ("row", "pull-up", "pulldown", "shrug", "deadlift", "back extension")):
        return "Back"
    if any(token in lower for token in ("bench", "fly", "crossover", "push-up", "dip", "pullover")):
        return "Chest"
    if any(token in lower for token in ("wrist", "grip", "carry")):
        return "Forearms"
    if any(token in lower for token in ("squat", "lunge", "leg", "calf", "glute", "hip thrust", "adduction", "abduction", "step-up")):
        return "Legs"
    if any(token in lower for token in ("crunch", "plank", "twist", "sit-up", "leg raise", "knee raise", "wood chop", "rollout")):
        return "Abs"
    if any(token in lower for token in ("run", "walk", "bike", "cycle", "row erg", "swim", "jump rope", "burpee")):
        return "Cardio"

    if "weightlifting" in parts or "full body" in parts:
        if any(token in lower for token in ("snatch", "jerk", "clean", "thruster")):
            return "Shoulders"
        if any(token in lower for token in ("swing", "squat", "lunge")):
            return "Legs"
        return "Cardio"

    if equipment and any(item.lower() in {"treadmill", "ski erg", "row erg", "air bike"} for item in equipment):
        return "Cardio"

    return "Cardio"


def infer_muscles(category: str, name: str, body_parts: list[str]) -> tuple[list[str], list[str], str]:
    lower = name.lower()

    if category == "Abs":
        if any(token in lower for token in ("oblique", "twist", "wood chop", "side bend")):
            return ["Obliques"], ["Rectus abdominis"], "Rotation"
        if "plank" in lower:
            return ["Transverse abdominis"], ["Rectus abdominis", "Obliques"], "Anti-extension"
        if any(token in lower for token in ("leg raise", "knee raise", "pull-in", "reverse crunch")):
            return ["Lower rectus abdominis"], ["Hip flexors", "Obliques"], "Hip flexion"
        return ["Rectus abdominis"], ["Obliques"], "Spinal flexion"

    if category == "Back":
        if "shrug" in lower:
            return ["Upper traps"], ["Forearms"], "Scapular elevation"
        if "deadlift" in lower:
            return ["Spinal erectors", "Lats"], ["Glutes", "Hamstrings", "Forearms"], "Hip hinge"
        if any(token in lower for token in ("pull-up", "pulldown", "chin-up")):
            return ["Lats"], ["Biceps", "Teres major"], "Vertical pull"
        if "back extension" in lower or "hyperextension" in lower:
            return ["Spinal erectors"], ["Glutes", "Hamstrings"], "Hip hinge"
        return ["Lats", "Rhomboids"], ["Biceps", "Rear delts"], "Horizontal pull"

    if category == "Biceps":
        if any(token in lower for token in ("hammer", "reverse curl", "zottman")):
            return ["Brachialis", "Brachioradialis"], ["Biceps brachii", "Forearms"], "Elbow flexion"
        return ["Biceps brachii"], ["Brachialis", "Forearms"], "Elbow flexion"

    if category == "Cardio":
        if any(token in lower for token in ("run", "walk", "jog", "sprint")):
            return ["Quads", "Glutes"], ["Calves", "Hamstrings"], "Steady-state cardio"
        if any(token in lower for token in ("bike", "cycle", "spin")):
            return ["Quads"], ["Glutes", "Calves"], "Steady-state cardio"
        if "row" in lower:
            return ["Lats", "Quads"], ["Biceps", "Hamstrings"], "Full-body cardio"
        if "swim" in lower:
            return ["Lats", "Front delts"], ["Quads", "Calves"], "Full-body cardio"
        return ["Calves"], ["Quads", "Front delts"], "Conditioning"

    if category == "Chest":
        if any(token in lower for token in ("fly", "crossover", "pec deck")):
            return ["Pectorals"], ["Front delts"], "Horizontal adduction"
        if "pullover" in lower:
            return ["Pectorals"], ["Lats", "Front delts"], "Shoulder extension"
        return ["Pectorals"], ["Triceps", "Front delts"], "Horizontal press"

    if category == "Forearms":
        if "reverse curl" in lower:
            return ["Brachioradialis"], ["Forearms", "Biceps brachii"], "Pronated elbow flexion"
        return ["Forearms"], ["Brachioradialis"], "Wrist flexion"

    if category == "Legs":
        if "calf" in lower:
            return ["Calves"], ["Soleus"], "Ankle plantarflexion"
        if any(token in lower for token in ("hamstring", "leg curl", "romanian deadlift", "good morning")):
            return ["Hamstrings"], ["Glutes", "Spinal erectors"], "Hip hinge"
        if any(token in lower for token in ("glute", "hip thrust", "kickback", "abduction")) or "hips" in {part.lower() for part in body_parts}:
            return ["Glutes"], ["Glute medius", "Hamstrings"], "Hip extension"
        if "adduction" in lower:
            return ["Adductors"], ["Glutes"], "Hip adduction"
        if any(token in lower for token in ("leg extension", "sissy squat")):
            return ["Quads"], ["Glutes"], "Knee extension"
        return ["Quads"], ["Glutes", "Hamstrings"], "Squat / press"

    if category == "Shoulders":
        if any(token in lower for token in ("rear delt", "reverse fly", "face pull")):
            return ["Rear delts"], ["Mid traps", "Rhomboids"], "Horizontal abduction"
        if any(token in lower for token in ("lateral raise", "upright row")):
            return ["Lateral delts"], ["Upper traps"], "Shoulder abduction"
        if "front raise" in lower:
            return ["Front delts"], ["Pectorals"], "Shoulder flexion"
        return ["Front delts", "Lateral delts"], ["Triceps", "Upper traps"], "Overhead press"

    if category == "Triceps":
        if "overhead" in lower:
            return ["Triceps long head"], ["Triceps lateral head", "Triceps medial head"], "Elbow extension"
        if any(token in lower for token in ("bench", "dip", "press")):
            return ["Triceps"], ["Pectorals", "Front delts"], "Press"
        return ["Triceps lateral head", "Triceps medial head"], ["Long head"], "Elbow extension"

    return ["Rectus abdominis"], ["Obliques"], "Spinal flexion"


def why_it_works(category: str, pattern: str) -> str:
    return f"Lyfta import: categorized under {category.lower()} and tagged as a {pattern.lower()} movement for planning and exercise selection."


def substitutions(name: str, category: str) -> list[str]:
    lower = name.lower()
    if category == "Chest" and "bench" in lower:
        return ["Push-Up", "Machine Chest Press"]
    if category == "Back" and "row" in lower:
        return ["Cable Row", "Lat Pulldown"]
    if category == "Legs" and "squat" in lower:
        return ["Leg Press", "Bulgarian Split Squat"]
    if category == "Biceps":
        return ["Barbell Curl", "Cable Curl"]
    if category == "Triceps":
        return ["Rope Pushdown", "EZ-Bar Skullcrusher"]
    if category == "Shoulders":
        return ["Overhead Press", "Lateral Raise"]
    if category == "Abs":
        return ["Crunch", "Plank"]
    if category == "Cardio":
        return ["Walking", "Cycling"]
    return []


def format_ts(value) -> str:
    return json.dumps(value, ensure_ascii=False)


def build_entry(item: dict, seen_ids: set[str]) -> dict:
    name = item["name"].strip()
    body_parts = first_body_parts(item.get("body_part"))
    equipment = [value for value in (item.get("equipment") or []) if isinstance(value, str) and value.strip()]
    category = classify_category(name, body_parts, equipment)
    primary, secondary, pattern = infer_muscles(category, name, body_parts)
    base_id = slugify(name)
    candidate = base_id
    suffix = 2
    while candidate in seen_ids:
        candidate = f"{base_id}-{suffix}"
        suffix += 1
    seen_ids.add(candidate)
    return {
        "id": candidate,
        "name": name,
        "aliases": [],
        "category": category,
        "movementPattern": pattern,
        "primaryMuscles": primary,
        "secondaryMuscles": secondary,
        "whyItWorks": why_it_works(category, pattern),
        "substitutions": substitutions(name, category),
    }


def fetch_all_items() -> list[dict]:
    items: list[dict] = []
    for page in range(1, LAST_PAGE + 1):
        items.extend(fetch_page(page))
    deduped: dict[str, dict] = {}
    for item in items:
        name = item["name"].strip()
        key = name.casefold()
        if key not in deduped:
            deduped[key] = item
    return list(deduped.values())


def build_file(entries: Iterable[dict]) -> str:
    lines = [
        'import { ExerciseDefinition, ExerciseMuscleTarget } from "@/types/domain";',
        "",
        "function buildTargetChart(primaryMuscles: string[], secondaryMuscles: string[]): ExerciseMuscleTarget[] {",
        "  const primaryShare = primaryMuscles.length ? 70 / primaryMuscles.length : 0;",
        "  const secondaryShare = secondaryMuscles.length ? 30 / secondaryMuscles.length : 0;",
        "  const chart = new Map<string, number>();",
        "",
        "  primaryMuscles.forEach((muscle) => {",
        "    chart.set(muscle, (chart.get(muscle) ?? 0) + primaryShare);",
        "  });",
        "",
        "  secondaryMuscles.forEach((muscle) => {",
        "    chart.set(muscle, (chart.get(muscle) ?? 0) + secondaryShare);",
        "  });",
        "",
        "  return [...chart.entries()]",
        "    .map(([muscle, percent]) => ({ muscle, percent: Math.round(percent) }))",
        "    .sort((left, right) => right.percent - left.percent);",
        "}",
        "",
        "export const lyftaExerciseLibrary: ExerciseDefinition[] = [",
    ]
    for entry in entries:
        lines.extend([
            "  {",
            f"    id: {format_ts(entry['id'])},",
            f"    name: {format_ts(entry['name'])},",
            f"    aliases: {format_ts(entry['aliases'])},",
            f"    category: {format_ts(entry['category'])},",
            f"    movementPattern: {format_ts(entry['movementPattern'])},",
            f"    primaryMuscles: {format_ts(entry['primaryMuscles'])},",
            f"    secondaryMuscles: {format_ts(entry['secondaryMuscles'])},",
            f"    targetChart: buildTargetChart({format_ts(entry['primaryMuscles'])}, {format_ts(entry['secondaryMuscles'])}),",
            f"    whyItWorks: {format_ts(entry['whyItWorks'])},",
            f"    substitutions: {format_ts(entry['substitutions'])}",
            "  },",
        ])
    lines.append("];")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    items = fetch_all_items()
    seen_ids: set[str] = set()
    entries = [build_entry(item, seen_ids) for item in items]
    OUTPUT.write_text(build_file(entries), encoding="utf-8")
    print(f"Wrote {len(entries)} Lyfta exercises to {OUTPUT}")


if __name__ == "__main__":
    main()
