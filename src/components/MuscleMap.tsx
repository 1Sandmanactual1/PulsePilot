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
  { id: "chest-left", d: "M83 82 C72 86 64 95 63 108 C63 121 72 129 84 133 C91 135 96 132 98 125 L98 88 C94 82 90 80 83 82 Z" },
  { id: "chest-right", d: "M117 82 C128 86 136 95 137 108 C137 121 128 129 116 133 C109 135 104 132 102 125 L102 88 C106 82 110 80 117 82 Z" },
  { id: "front-delts-left", d: "M64 71 C56 74 49 82 48 91 C48 99 53 105 60 107 C66 107 70 102 71 95 C72 86 70 77 64 71 Z" },
  { id: "front-delts-right", d: "M136 71 C144 74 151 82 152 91 C152 99 147 105 140 107 C134 107 130 102 129 95 C128 86 130 77 136 71 Z" },
  { id: "biceps-left", d: "M47 103 C40 111 36 122 36 134 C36 145 40 155 47 161 C53 162 57 159 59 151 C61 138 60 120 56 109 C54 104 51 102 47 103 Z" },
  { id: "biceps-right", d: "M153 103 C160 111 164 122 164 134 C164 145 160 155 153 161 C147 162 143 159 141 151 C139 138 140 120 144 109 C146 104 149 102 153 103 Z" },
  { id: "forearms-left", d: "M40 162 C34 174 31 186 33 199 C35 208 40 217 48 222 C54 219 57 213 58 204 C56 190 52 175 47 164 C45 160 43 159 40 162 Z" },
  { id: "forearms-right", d: "M160 162 C166 174 169 186 167 199 C165 208 160 217 152 222 C146 219 143 213 142 204 C144 190 148 175 153 164 C155 160 157 159 160 162 Z" },
  { id: "abs-upper", d: "M88 132 C81 138 79 148 81 157 C85 163 93 165 100 165 C107 165 115 163 119 157 C121 148 119 138 112 132 C106 129 94 129 88 132 Z" },
  { id: "abs-middle", d: "M87 166 C81 171 79 180 81 189 C86 194 93 196 100 196 C107 196 114 194 119 189 C121 180 119 171 113 166 C106 163 94 163 87 166 Z" },
  { id: "abs-lower", d: "M88 197 C83 202 81 211 83 219 C88 224 94 226 100 226 C106 226 112 224 117 219 C119 211 117 202 112 197 C106 194 94 194 88 197 Z" },
  { id: "obliques-left", d: "M70 134 C63 144 60 159 61 175 C63 189 68 201 76 209 L80 205 C78 187 78 159 81 137 C77 133 74 132 70 134 Z" },
  { id: "obliques-right", d: "M130 134 C137 144 140 159 139 175 C137 189 132 201 124 209 L120 205 C122 187 122 159 119 137 C123 133 126 132 130 134 Z" },
  { id: "quads-left", d: "M80 234 C71 245 66 262 64 282 C64 299 68 315 75 328 C82 331 88 327 92 318 C95 299 94 268 90 243 C88 236 85 233 80 234 Z" },
  { id: "quads-right", d: "M120 234 C129 245 134 262 136 282 C136 299 132 315 125 328 C118 331 112 327 108 318 C105 299 106 268 110 243 C112 236 115 233 120 234 Z" },
  { id: "calves-left", d: "M79 329 C71 342 67 356 69 372 C72 381 78 388 85 392 C90 389 93 383 94 375 C92 360 88 345 84 333 C82 329 81 328 79 329 Z" },
  { id: "calves-right", d: "M121 329 C129 342 133 356 131 372 C128 381 122 388 115 392 C110 389 107 383 106 375 C108 360 112 345 116 333 C118 329 119 328 121 329 Z" }
];

const backRegions: RegionDefinition[] = [
  { id: "traps-left", d: "M86 65 C75 70 67 80 64 94 C71 101 81 104 92 103 C95 92 96 80 95 68 C92 64 90 63 86 65 Z" },
  { id: "traps-right", d: "M114 65 C125 70 133 80 136 94 C129 101 119 104 108 103 C105 92 104 80 105 68 C108 64 110 63 114 65 Z" },
  { id: "rear-delts-left", d: "M63 78 C54 82 48 90 47 100 C49 108 56 114 64 115 C70 111 73 104 73 95 C72 88 69 81 63 78 Z" },
  { id: "rear-delts-right", d: "M137 78 C146 82 152 90 153 100 C151 108 144 114 136 115 C130 111 127 104 127 95 C128 88 131 81 137 78 Z" },
  { id: "lats-left", d: "M80 106 C67 113 59 128 56 146 C57 164 64 180 76 189 C83 186 87 178 89 167 C89 145 87 124 84 109 C82 106 82 105 80 106 Z" },
  { id: "lats-right", d: "M120 106 C133 113 141 128 144 146 C143 164 136 180 124 189 C117 186 113 178 111 167 C111 145 113 124 116 109 C118 106 118 105 120 106 Z" },
  { id: "triceps-left", d: "M46 111 C39 120 35 132 35 145 C36 155 40 165 47 171 C53 171 57 167 60 160 C61 144 59 128 55 116 C53 112 50 110 46 111 Z" },
  { id: "triceps-right", d: "M154 111 C161 120 165 132 165 145 C164 155 160 165 153 171 C147 171 143 167 140 160 C139 144 141 128 145 116 C147 112 150 110 154 111 Z" },
  { id: "spinal-erectors-left", d: "M93 112 C89 127 87 145 87 163 C88 181 90 197 94 211 C97 214 99 214 101 211 C101 194 100 146 98 114 C96 111 95 111 93 112 Z" },
  { id: "spinal-erectors-right", d: "M107 112 C111 127 113 145 113 163 C112 181 110 197 106 211 C103 214 101 214 99 211 C99 194 100 146 102 114 C104 111 105 111 107 112 Z" },
  { id: "glutes-left", d: "M82 213 C72 220 68 231 69 243 C73 251 81 256 92 258 C98 255 100 249 101 241 C100 228 96 219 88 213 C85 211 84 211 82 213 Z" },
  { id: "glutes-right", d: "M118 213 C128 220 132 231 131 243 C127 251 119 256 108 258 C102 255 100 249 99 241 C100 228 104 219 112 213 C115 211 116 211 118 213 Z" },
  { id: "hamstrings-left", d: "M79 258 C70 269 65 286 65 305 C67 320 72 334 79 346 C86 348 91 344 95 335 C97 313 96 288 91 266 C88 260 84 257 79 258 Z" },
  { id: "hamstrings-right", d: "M121 258 C130 269 135 286 135 305 C133 320 128 334 121 346 C114 348 109 344 105 335 C103 313 104 288 109 266 C112 260 116 257 121 258 Z" },
  { id: "calves-left", d: "M80 347 C72 359 68 372 70 387 C73 394 79 399 85 401 C89 398 92 392 93 385 C91 372 88 359 84 350 C82 347 81 346 80 347 Z" },
  { id: "calves-right", d: "M120 347 C128 359 132 372 130 387 C127 394 121 399 115 401 C111 398 108 392 107 385 C109 372 112 359 116 350 C118 347 119 346 120 347 Z" }
];

const frontBodyOutline = [
  "M100 18",
  "C86 18 75 29 75 43",
  "C75 55 82 64 88 71",
  "L74 80",
  "C62 87 51 101 46 115",
  "C41 129 39 147 43 167",
  "C46 181 52 195 60 208",
  "L69 226",
  "C63 239 58 257 57 276",
  "C56 296 60 317 69 336",
  "C74 345 77 359 77 377",
  "C77 389 84 399 91 399",
  "C97 399 99 391 99 384",
  "C99 391 103 399 109 399",
  "C116 399 123 389 123 377",
  "C123 359 126 345 131 336",
  "C140 317 144 296 143 276",
  "C142 257 137 239 131 226",
  "L140 208",
  "C148 195 154 181 157 167",
  "C161 147 159 129 154 115",
  "C149 101 138 87 126 80",
  "L112 71",
  "C118 64 125 55 125 43",
  "C125 29 114 18 100 18 Z"
].join(" ");

const backBodyOutline = [
  "M100 18",
  "C86 18 75 29 75 43",
  "C75 56 83 66 91 73",
  "L77 83",
  "C64 92 53 107 48 122",
  "C43 138 42 158 46 178",
  "C50 194 57 207 66 219",
  "L71 247",
  "C63 259 59 277 58 298",
  "C58 319 63 337 71 354",
  "C76 363 79 377 79 391",
  "C79 398 84 400 90 400",
  "C96 400 99 393 99 386",
  "C99 393 104 400 110 400",
  "C116 400 121 398 121 391",
  "C121 377 124 363 129 354",
  "C137 337 142 319 142 298",
  "C141 277 137 259 129 247",
  "L134 219",
  "C143 207 150 194 154 178",
  "C158 158 157 138 152 122",
  "C147 107 136 92 123 83",
  "L109 73",
  "C117 66 125 56 125 43",
  "C125 29 114 18 100 18 Z"
].join(" ");

const frontLimbOutlines = [
  "M48 112 C38 124 32 140 32 159 C32 181 39 201 49 217 C54 218 58 214 60 207 C56 188 55 168 57 147 C57 131 55 120 48 112 Z",
  "M152 112 C162 124 168 140 168 159 C168 181 161 201 151 217 C146 218 142 214 140 207 C144 188 145 168 143 147 C143 131 145 120 152 112 Z",
  "M78 228 C67 240 60 260 58 284 C57 311 63 337 73 360 C79 362 84 359 88 352 C89 329 90 283 87 240 C84 231 81 227 78 228 Z",
  "M122 228 C133 240 140 260 142 284 C143 311 137 337 127 360 C121 362 116 359 112 352 C111 329 110 283 113 240 C116 231 119 227 122 228 Z"
];

const backLimbOutlines = [
  "M47 118 C38 129 33 145 33 165 C34 187 41 206 51 221 C56 222 60 219 62 212 C58 190 58 170 60 149 C59 134 55 124 47 118 Z",
  "M153 118 C162 129 167 145 167 165 C166 187 159 206 149 221 C144 222 140 219 138 212 C142 190 142 170 140 149 C141 134 145 124 153 118 Z",
  "M78 247 C67 260 60 281 59 306 C59 331 65 354 75 375 C80 378 85 375 89 368 C90 346 91 301 88 258 C85 249 82 246 78 247 Z",
  "M122 247 C133 260 140 281 141 306 C141 331 135 354 125 375 C120 378 115 375 111 368 C110 346 109 301 112 258 C115 249 118 246 122 247 Z"
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
        <Path d="M100 18 C88 18 78 28 78 40 C78 51 86 58 100 58 C114 58 122 51 122 40 C122 28 112 18 100 18 Z" fill={bodyFill} stroke={outlineColor} strokeWidth={2.5} />
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
