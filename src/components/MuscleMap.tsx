import { useEffect, useMemo } from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

type Props = {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  view: "front" | "back";
};

type RegionId =
  | "chest-left"
  | "chest-right"
  | "front-delts-left"
  | "front-delts-right"
  | "biceps-left"
  | "biceps-right"
  | "forearms-left"
  | "forearms-right"
  | "abs-upper"
  | "abs-middle"
  | "abs-lower"
  | "obliques-left"
  | "obliques-right"
  | "quads-left"
  | "quads-right"
  | "calves-left"
  | "calves-right"
  | "traps-left"
  | "traps-right"
  | "lats-left"
  | "lats-right"
  | "rear-delts-left"
  | "rear-delts-right"
  | "triceps-left"
  | "triceps-right"
  | "spinal-erectors-left"
  | "spinal-erectors-right"
  | "glutes-left"
  | "glutes-right"
  | "hamstrings-left"
  | "hamstrings-right";

type RegionDefinition = {
  id: RegionId;
  d: string;
};

const primaryColor = "#2682D5";
const inactiveColor = "#2A2A2A";
const outlineColor = "#444444";
const bodyFill = "#151515";

const frontRegions: RegionDefinition[] = [
  { id: "chest-left", d: "M98 88 C90 87 82 89 76 94 C70 100 67 109 67 119 C68 130 73 139 82 146 C88 150 95 150 100 145 C102 131 101 112 99 92 C99 90 98 89 98 88 Z" },
  { id: "chest-right", d: "M102 88 C110 87 118 89 124 94 C130 100 133 109 133 119 C132 130 127 139 118 146 C112 150 105 150 100 145 C98 131 99 112 101 92 C101 90 102 89 102 88 Z" },
  { id: "front-delts-left", d: "M78 74 C70 77 64 83 60 91 C57 99 57 108 60 116 C63 122 69 126 76 127 C81 123 84 116 85 107 C85 97 84 87 81 78 C80 76 79 75 78 74 Z" },
  { id: "front-delts-right", d: "M122 74 C130 77 136 83 140 91 C143 99 143 108 140 116 C137 122 131 126 124 127 C119 123 116 116 115 107 C115 97 116 87 119 78 C120 76 121 75 122 74 Z" },
  { id: "biceps-left", d: "M58 109 C53 117 49 127 48 138 C47 151 49 163 54 174 C58 180 63 181 67 177 C71 165 72 147 69 124 C67 116 63 110 58 109 Z" },
  { id: "biceps-right", d: "M142 109 C147 117 151 127 152 138 C153 151 151 163 146 174 C142 180 137 181 133 177 C129 165 128 147 131 124 C133 116 137 110 142 109 Z" },
  { id: "forearms-left", d: "M54 177 C49 187 46 198 46 211 C46 224 49 236 55 246 C58 250 62 251 66 248 C68 235 67 216 62 187 C60 181 58 178 54 177 Z" },
  { id: "forearms-right", d: "M146 177 C151 187 154 198 154 211 C154 224 151 236 145 246 C142 250 138 251 134 248 C132 235 133 216 138 187 C140 181 142 178 146 177 Z" },
  { id: "abs-upper", d: "M93 145 C88 148 85 154 85 161 C85 168 88 173 93 177 C97 179 103 179 107 177 C112 173 115 168 115 161 C115 154 112 148 107 145 C103 143 97 143 93 145 Z" },
  { id: "abs-middle", d: "M92 177 C87 181 84 187 84 194 C84 202 88 207 93 211 C98 213 102 213 107 211 C112 207 116 202 116 194 C116 187 113 181 108 177 C103 175 97 175 92 177 Z" },
  { id: "abs-lower", d: "M93 210 C89 214 86 220 86 227 C86 234 89 239 94 243 C98 245 102 245 106 243 C111 239 114 234 114 227 C114 220 111 214 107 210 C103 208 97 208 93 210 Z" },
  { id: "obliques-left", d: "M79 143 C74 149 71 158 70 169 C69 181 71 193 76 203 C79 208 83 209 86 206 C87 189 88 168 90 147 C87 144 84 142 79 143 Z" },
  { id: "obliques-right", d: "M121 143 C126 149 129 158 130 169 C131 181 129 193 124 203 C121 208 117 209 114 206 C113 189 112 168 110 147 C113 144 116 142 121 143 Z" },
  { id: "quads-left", d: "M84 244 C77 252 72 264 69 279 C66 295 66 311 70 326 C73 334 77 340 83 343 C87 344 90 342 92 338 C94 322 94 295 93 252 C91 247 88 244 84 244 Z" },
  { id: "quads-right", d: "M116 244 C123 252 128 264 131 279 C134 295 134 311 130 326 C127 334 123 340 117 343 C113 344 110 342 108 338 C106 322 106 295 107 252 C109 247 112 244 116 244 Z" },
  { id: "calves-left", d: "M83 337 C77 347 74 359 74 371 C74 381 77 390 82 396 C85 399 89 399 92 396 C94 383 91 357 87 341 C86 339 85 338 83 337 Z" },
  { id: "calves-right", d: "M117 337 C123 347 126 359 126 371 C126 381 123 390 118 396 C115 399 111 399 108 396 C106 383 109 357 113 341 C114 339 115 338 117 337 Z" }
];

const backRegions: RegionDefinition[] = [
  { id: "traps-left", d: "M96 72 C88 74 81 79 76 86 C72 93 71 100 73 107 C77 112 83 114 91 114 C94 101 95 87 96 75 C96 73 96 72 96 72 Z" },
  { id: "traps-right", d: "M104 72 C112 74 119 79 124 86 C128 93 129 100 127 107 C123 112 117 114 109 114 C106 101 105 87 104 75 C104 73 104 72 104 72 Z" },
  { id: "rear-delts-left", d: "M77 78 C70 81 64 87 60 95 C58 103 58 111 61 118 C65 123 70 125 76 125 C80 122 83 116 84 108 C84 98 82 88 79 80 C78 79 78 78 77 78 Z" },
  { id: "rear-delts-right", d: "M123 78 C130 81 136 87 140 95 C142 103 142 111 139 118 C135 123 130 125 124 125 C120 122 117 116 116 108 C116 98 118 88 121 80 C122 79 122 78 123 78 Z" },
  { id: "lats-left", d: "M89 112 C81 116 73 124 68 134 C64 145 63 157 64 170 C67 183 72 194 79 201 C84 204 89 203 92 198 C94 177 94 148 91 117 C90 114 90 113 89 112 Z" },
  { id: "lats-right", d: "M111 112 C119 116 127 124 132 134 C136 145 137 157 136 170 C133 183 128 194 121 201 C116 204 111 203 108 198 C106 177 106 148 109 117 C110 114 110 113 111 112 Z" },
  { id: "triceps-left", d: "M57 117 C52 125 48 136 47 148 C47 160 49 172 54 182 C57 188 61 189 65 186 C68 172 69 152 65 126 C63 120 60 117 57 117 Z" },
  { id: "triceps-right", d: "M143 117 C148 125 152 136 153 148 C153 160 151 172 146 182 C143 188 139 189 135 186 C132 172 131 152 135 126 C137 120 140 117 143 117 Z" },
  { id: "spinal-erectors-left", d: "M96 121 C93 135 91 150 91 167 C91 185 93 202 97 219 C98 223 99 224 101 221 C101 200 100 157 99 125 C98 122 97 121 96 121 Z" },
  { id: "spinal-erectors-right", d: "M104 121 C107 135 109 150 109 167 C109 185 107 202 103 219 C102 223 101 224 99 221 C99 200 100 157 101 125 C102 122 103 121 104 121 Z" },
  { id: "glutes-left", d: "M87 223 C81 227 76 234 74 242 C73 251 76 260 82 266 C86 270 92 271 97 268 C100 259 100 247 98 231 C95 226 92 223 87 223 Z" },
  { id: "glutes-right", d: "M113 223 C119 227 124 234 126 242 C127 251 124 260 118 266 C114 270 108 271 103 268 C100 259 100 247 102 231 C105 226 108 223 113 223 Z" },
  { id: "hamstrings-left", d: "M84 266 C77 276 72 289 69 304 C67 320 67 335 71 349 C74 357 78 362 83 365 C87 366 90 364 92 360 C94 344 94 312 93 273 C91 269 88 266 84 266 Z" },
  { id: "hamstrings-right", d: "M116 266 C123 276 128 289 131 304 C133 320 133 335 129 349 C126 357 122 362 117 365 C113 366 110 364 108 360 C106 344 106 312 107 273 C109 269 112 266 116 266 Z" },
  { id: "calves-left", d: "M83 353 C77 363 74 374 74 386 C74 395 77 402 82 407 C85 410 88 409 91 406 C93 393 91 370 87 357 C86 355 85 353 83 353 Z" },
  { id: "calves-right", d: "M117 353 C123 363 126 374 126 386 C126 395 123 402 118 407 C115 410 112 409 109 406 C107 393 109 370 113 357 C114 355 115 353 117 353 Z" }
];

const frontBodyOutline = [
  "M100 63",
  "C90 63 80 66 72 73",
  "C64 81 58 93 55 107",
  "C53 123 54 141 58 159",
  "C62 176 68 191 75 205",
  "C81 216 87 226 89 238",
  "C90 250 88 263 85 278",
  "C82 294 82 311 84 328",
  "C86 345 90 362 94 377",
  "C96 386 98 393 100 398",
  "C102 393 104 386 106 377",
  "C110 362 114 345 116 328",
  "C118 311 118 294 115 278",
  "C112 263 110 250 111 238",
  "C113 226 119 216 125 205",
  "C132 191 138 176 142 159",
  "C146 141 147 123 145 107",
  "C142 93 136 81 128 73",
  "C120 66 110 63 100 63 Z"
].join(" ");

const backBodyOutline = [
  "M100 63",
  "C90 63 80 66 72 74",
  "C64 83 59 95 56 110",
  "C54 126 55 145 59 163",
  "C63 179 69 194 76 208",
  "C82 220 88 231 90 244",
  "C91 257 89 271 86 286",
  "C83 302 83 320 85 337",
  "C87 354 91 369 95 383",
  "C97 390 98 396 100 401",
  "C102 396 103 390 105 383",
  "C109 369 113 354 115 337",
  "C117 320 117 302 114 286",
  "C111 271 109 257 110 244",
  "C112 231 118 220 124 208",
  "C131 194 137 179 141 163",
  "C145 145 146 126 144 110",
  "C141 95 136 83 128 74",
  "C120 66 110 63 100 63 Z"
].join(" ");

const frontLimbOutlines = [
  "M61 101 C54 109 49 120 46 133 C43 148 43 165 47 182 C50 201 56 218 65 232 C69 235 73 233 76 227 C75 205 76 181 79 154 C81 130 76 112 68 102 C66 100 63 100 61 101 Z",
  "M139 101 C146 109 151 120 154 133 C157 148 157 165 153 182 C150 201 144 218 135 232 C131 235 127 233 124 227 C125 205 124 181 121 154 C119 130 124 112 132 102 C134 100 137 100 139 101 Z",
  "M84 241 C77 250 72 263 68 278 C65 295 65 313 68 331 C71 351 76 368 82 384 C85 389 89 389 92 384 C95 356 95 323 94 246 C91 242 88 240 84 241 Z",
  "M116 241 C123 250 128 263 132 278 C135 295 135 313 132 331 C129 351 124 368 118 384 C115 389 111 389 108 384 C105 356 105 323 106 246 C109 242 112 240 116 241 Z"
];

const backLimbOutlines = [
  "M59 109 C53 117 48 128 45 141 C43 156 43 173 47 190 C50 209 56 224 65 236 C69 240 73 238 76 232 C75 209 76 184 79 156 C80 133 76 117 68 109 C65 108 62 108 59 109 Z",
  "M141 109 C147 117 152 128 155 141 C157 156 157 173 153 190 C150 209 144 224 135 236 C131 240 127 238 124 232 C125 209 124 184 121 156 C120 133 124 117 132 109 C135 108 138 108 141 109 Z",
  "M84 246 C77 255 72 268 68 283 C65 300 65 319 68 338 C71 358 76 374 82 390 C85 395 89 395 92 390 C95 362 95 329 94 251 C91 247 88 245 84 246 Z",
  "M116 246 C123 255 128 268 132 283 C135 300 135 319 132 338 C129 358 124 374 118 390 C115 395 111 395 108 390 C105 362 105 329 106 251 C109 247 112 245 116 246 Z"
];

const groupRegionMap: Record<string, RegionId[]> = {
  abs: ["abs-upper", "abs-middle", "abs-lower"],
  obliques: ["obliques-left", "obliques-right"],
  chest: ["chest-left", "chest-right"],
  "front-delts": ["front-delts-left", "front-delts-right"],
  "rear-delts": ["rear-delts-left", "rear-delts-right"],
  biceps: ["biceps-left", "biceps-right"],
  forearms: ["forearms-left", "forearms-right"],
  triceps: ["triceps-left", "triceps-right"],
  traps: ["traps-left", "traps-right"],
  lats: ["lats-left", "lats-right"],
  "spinal-erectors": ["spinal-erectors-left", "spinal-erectors-right"],
  glutes: ["glutes-left", "glutes-right"],
  hamstrings: ["hamstrings-left", "hamstrings-right"],
  quads: ["quads-left", "quads-right"],
  calves: ["calves-left", "calves-right"]
};

const directMuscleMap: Record<string, RegionId[]> = {
  "Rectus abdominis": groupRegionMap.abs,
  "Transverse abdominis": groupRegionMap.abs,
  Obliques: groupRegionMap.obliques,
  Lats: groupRegionMap.lats,
  "Mid traps": groupRegionMap.traps,
  "Upper traps": groupRegionMap.traps,
  Rhomboids: groupRegionMap.lats,
  "Rear delts": groupRegionMap["rear-delts"],
  "Front delts": groupRegionMap["front-delts"],
  Biceps: groupRegionMap.biceps,
  Triceps: groupRegionMap.triceps,
  Forearms: groupRegionMap.forearms,
  "Spinal erectors": groupRegionMap["spinal-erectors"],
  Glutes: groupRegionMap.glutes,
  Hamstrings: groupRegionMap.hamstrings,
  Quads: groupRegionMap.quads,
  Calves: groupRegionMap.calves,
  Chest: groupRegionMap.chest,
  Pectorals: groupRegionMap.chest,
  "Hip flexors": groupRegionMap.quads,
  "Lower rectus abdominis": groupRegionMap.abs,
  "Quadratus lumborum": groupRegionMap["spinal-erectors"],
  "Glute medius": groupRegionMap.glutes,
  "Teres major": groupRegionMap.lats
};

function normalizeMuscleName(muscle: string): RegionId[] {
  const direct = directMuscleMap[muscle];
  if (direct) {
    return direct;
  }

  const normalized = muscle.trim().toLowerCase();

  if (normalized.includes("abdominis") || normalized === "abs" || normalized.includes("core")) return groupRegionMap.abs;
  if (normalized.includes("oblique")) return groupRegionMap.obliques;
  if (normalized.includes("pectoral") || normalized.includes("chest")) return groupRegionMap.chest;
  if (normalized.includes("rear delt") || normalized.includes("posterior delt") || normalized.includes("external rotator")) return groupRegionMap["rear-delts"];
  if (normalized.includes("front delt") || normalized.includes("anterior delt") || normalized.includes("medial delt") || normalized.includes("shoulder")) {
    return groupRegionMap["front-delts"];
  }
  if (normalized.includes("biceps brachii") || normalized === "biceps" || normalized.includes("brachialis")) return groupRegionMap.biceps;
  if (
    normalized.includes("forearm") ||
    normalized.includes("grip") ||
    normalized.includes("pronator") ||
    normalized.includes("supinator") ||
    normalized.includes("brachioradialis")
  ) {
    return groupRegionMap.forearms;
  }
  if (normalized.includes("triceps")) return groupRegionMap.triceps;
  if (normalized.includes("trap")) return groupRegionMap.traps;
  if (
    normalized.includes("lat") ||
    normalized.includes("rhomboid") ||
    normalized.includes("mid back") ||
    normalized.includes("upper back") ||
    normalized.includes("teres major")
  ) {
    return groupRegionMap.lats;
  }
  if (normalized.includes("spinal erector") || normalized.includes("quadratus lumborum")) return groupRegionMap["spinal-erectors"];
  if (normalized.includes("glute")) return groupRegionMap.glutes;
  if (normalized.includes("hamstring")) return groupRegionMap.hamstrings;
  if (normalized.includes("quad") || normalized.includes("quadriceps") || normalized.includes("hip flexor") || normalized.includes("adductor")) {
    return groupRegionMap.quads;
  }
  if (normalized.includes("calf") || normalized.includes("gastrocnemius") || normalized.includes("soleus")) return groupRegionMap.calves;

  return [];
}

function resolveRegions(muscles: string[]) {
  return new Set(
    muscles.flatMap((muscle) => normalizeMuscleName(muscle))
  );
}

function getRegionPaint(region: RegionId, primary: Set<RegionId>, secondary: Set<RegionId>) {
  if (primary.has(region)) {
    return { fill: primaryColor, fillOpacity: 1 };
  }
  if (secondary.has(region)) {
    return { fill: primaryColor, fillOpacity: 0.35 };
  }
  return { fill: inactiveColor, fillOpacity: 1 };
}

function renderRegion(
  region: RegionDefinition,
  primaryRegions: Set<RegionId>,
  secondaryRegions: Set<RegionId>
) {
  return (
    <Path
      key={region.id}
      id={region.id}
      d={region.d}
      stroke={outlineColor}
      strokeWidth={2}
      {...getRegionPaint(region.id, primaryRegions, secondaryRegions)}
    />
  );
}

export function MuscleMap({ primaryMuscles, secondaryMuscles, view }: Props) {
  const primaryRegions = useMemo(() => resolveRegions(primaryMuscles), [primaryMuscles]);
  const secondaryRegions = useMemo(() => resolveRegions(secondaryMuscles), [secondaryMuscles]);
  const highlightedCount = primaryRegions.size + secondaryRegions.size;

  useEffect(() => {
    if (highlightedCount === 0) {
      console.warn("[MuscleMap] no highlighted regions", {
        primaryMuscles,
        secondaryMuscles,
        view
      });
    }
  }, [highlightedCount, primaryMuscles, secondaryMuscles, view]);

  const activeRegions = view === "front" ? frontRegions : backRegions;
  const bodyOutline = view === "front" ? frontBodyOutline : backBodyOutline;
  const limbOutlines = view === "front" ? frontLimbOutlines : backLimbOutlines;

  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" viewBox="0 0 200 400">
        <Path d="M100 18 C92 18 85 20 79 26 C73 32 70 40 70 49 C71 58 75 66 82 71 C88 76 94 79 100 79 C106 79 112 76 118 71 C125 66 129 58 130 49 C130 40 127 32 121 26 C115 20 108 18 100 18 Z" fill={bodyFill} stroke={outlineColor} strokeWidth={2.5} />
        <Path d={bodyOutline} fill={bodyFill} stroke={outlineColor} strokeWidth={2.5} />
        {limbOutlines.map((d) => (
          <Path key={d} d={d} fill={bodyFill} stroke={outlineColor} strokeWidth={2.5} />
        ))}
        {activeRegions.map((region) => renderRegion(region, primaryRegions, secondaryRegions))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%"
  }
});
