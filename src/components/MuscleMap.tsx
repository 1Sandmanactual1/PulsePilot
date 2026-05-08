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
  { id: "chest-left", d: "M97 89 C88 88 80 91 74 97 C69 104 67 114 69 124 C72 133 79 141 88 145 C93 147 97 146 100 142 C102 131 102 113 100 95 C99 92 98 90 97 89 Z" },
  { id: "chest-right", d: "M103 89 C112 88 120 91 126 97 C131 104 133 114 131 124 C128 133 121 141 112 145 C107 147 103 146 100 142 C98 131 98 113 100 95 C101 92 102 90 103 89 Z" },
  { id: "front-delts-left", d: "M77 76 C69 80 63 87 60 95 C57 103 57 111 60 118 C64 123 69 126 76 126 C81 123 84 117 85 110 C85 98 84 88 80 79 C79 77 78 76 77 76 Z" },
  { id: "front-delts-right", d: "M123 76 C131 80 137 87 140 95 C143 103 143 111 140 118 C136 123 131 126 124 126 C119 123 116 117 115 110 C115 98 116 88 120 79 C121 77 122 76 123 76 Z" },
  { id: "biceps-left", d: "M57 111 C51 120 48 132 48 145 C48 158 51 170 56 181 C60 185 65 183 69 175 C72 161 72 143 68 123 C66 116 62 111 57 111 Z" },
  { id: "biceps-right", d: "M143 111 C149 120 152 132 152 145 C152 158 149 170 144 181 C140 185 135 183 131 175 C128 161 128 143 132 123 C134 116 138 111 143 111 Z" },
  { id: "forearms-left", d: "M53 181 C47 192 44 205 45 219 C46 231 50 242 56 251 C60 254 64 252 67 246 C68 232 66 214 61 191 C59 185 57 181 53 181 Z" },
  { id: "forearms-right", d: "M147 181 C153 192 156 205 155 219 C154 231 150 242 144 251 C140 254 136 252 133 246 C132 232 134 214 139 191 C141 185 143 181 147 181 Z" },
  { id: "abs-upper", d: "M92 145 C87 149 84 155 84 162 C84 169 88 175 94 178 C98 179 102 179 106 178 C112 175 116 169 116 162 C116 155 113 149 108 145 C103 143 97 143 92 145 Z" },
  { id: "abs-middle", d: "M91 178 C86 182 83 188 83 196 C83 203 87 209 93 212 C98 214 102 214 107 212 C113 209 117 203 117 196 C117 188 114 182 109 178 C104 176 96 176 91 178 Z" },
  { id: "abs-lower", d: "M92 212 C87 216 85 222 85 229 C85 236 89 241 94 245 C98 247 102 247 106 245 C111 241 115 236 115 229 C115 222 113 216 108 212 C103 210 97 210 92 212 Z" },
  { id: "obliques-left", d: "M78 144 C72 151 69 161 68 173 C68 186 71 198 76 209 C80 213 84 212 87 207 C86 189 88 167 90 148 C87 144 84 142 78 144 Z" },
  { id: "obliques-right", d: "M122 144 C128 151 131 161 132 173 C132 186 129 198 124 209 C120 213 116 212 113 207 C114 189 112 167 110 148 C113 144 116 142 122 144 Z" },
  { id: "quads-left", d: "M83 247 C74 258 69 274 67 291 C66 308 68 324 73 339 C77 345 82 347 87 344 C91 330 93 309 92 256 C90 250 88 247 83 247 Z" },
  { id: "quads-right", d: "M117 247 C126 258 131 274 133 291 C134 308 132 324 127 339 C123 345 118 347 113 344 C109 330 107 309 108 256 C110 250 112 247 117 247 Z" },
  { id: "calves-left", d: "M82 340 C76 350 73 363 74 376 C75 386 78 394 83 399 C87 401 91 399 93 394 C94 381 91 357 87 344 C86 342 84 340 82 340 Z" },
  { id: "calves-right", d: "M118 340 C124 350 127 363 126 376 C125 386 122 394 117 399 C113 401 109 399 107 394 C106 381 109 357 113 344 C114 342 116 340 118 340 Z" }
];

const backRegions: RegionDefinition[] = [
  { id: "traps-left", d: "M95 73 C86 76 78 82 73 90 C70 97 69 105 72 111 C78 115 85 116 93 114 C96 101 97 88 97 76 C96 74 96 73 95 73 Z" },
  { id: "traps-right", d: "M105 73 C114 76 122 82 127 90 C130 97 131 105 128 111 C122 115 115 116 107 114 C104 101 103 88 103 76 C104 74 104 73 105 73 Z" },
  { id: "rear-delts-left", d: "M76 79 C68 83 62 89 59 98 C57 106 57 114 60 120 C64 124 69 126 76 125 C81 122 84 116 85 108 C84 97 82 87 78 81 C77 80 77 79 76 79 Z" },
  { id: "rear-delts-right", d: "M124 79 C132 83 138 89 141 98 C143 106 143 114 140 120 C136 124 131 126 124 125 C119 122 116 116 115 108 C116 97 118 87 122 81 C123 80 123 79 124 79 Z" },
  { id: "lats-left", d: "M88 113 C78 118 70 127 65 139 C61 151 60 164 62 177 C66 190 73 200 82 205 C87 205 90 201 92 194 C93 173 93 146 90 118 C89 115 89 114 88 113 Z" },
  { id: "lats-right", d: "M112 113 C122 118 130 127 135 139 C139 151 140 164 138 177 C134 190 127 200 118 205 C113 205 110 201 108 194 C107 173 107 146 110 118 C111 115 111 114 112 113 Z" },
  { id: "triceps-left", d: "M56 118 C50 127 46 139 45 152 C45 165 48 177 53 188 C57 192 61 191 65 184 C68 169 68 148 64 127 C62 121 59 118 56 118 Z" },
  { id: "triceps-right", d: "M144 118 C150 127 154 139 155 152 C155 165 152 177 147 188 C143 192 139 191 135 184 C132 169 132 148 136 127 C138 121 141 118 144 118 Z" },
  { id: "spinal-erectors-left", d: "M96 122 C92 137 90 154 90 173 C90 192 92 211 96 229 C98 232 99 232 101 229 C101 205 100 157 99 126 C98 123 97 122 96 122 Z" },
  { id: "spinal-erectors-right", d: "M104 122 C108 137 110 154 110 173 C110 192 108 211 104 229 C102 232 101 232 99 229 C99 205 100 157 101 126 C102 123 103 122 104 122 Z" },
  { id: "glutes-left", d: "M86 228 C79 233 74 241 73 250 C73 259 77 267 84 273 C90 276 95 275 99 270 C101 261 101 249 98 236 C95 231 91 228 86 228 Z" },
  { id: "glutes-right", d: "M114 228 C121 233 126 241 127 250 C127 259 123 267 116 273 C110 276 105 275 101 270 C99 261 99 249 102 236 C105 231 109 228 114 228 Z" },
  { id: "hamstrings-left", d: "M83 271 C75 282 71 298 69 315 C68 332 70 348 75 362 C79 367 83 369 88 366 C92 353 94 331 92 281 C90 275 87 271 83 271 Z" },
  { id: "hamstrings-right", d: "M117 271 C125 282 129 298 131 315 C132 332 130 348 125 362 C121 367 117 369 112 366 C108 353 106 331 108 281 C110 275 113 271 117 271 Z" },
  { id: "calves-left", d: "M82 358 C76 368 73 381 74 393 C75 402 78 409 83 413 C87 415 90 413 92 408 C93 395 90 375 87 362 C85 360 84 358 82 358 Z" },
  { id: "calves-right", d: "M118 358 C124 368 127 381 126 393 C125 402 122 409 117 413 C113 415 110 413 108 408 C107 395 110 375 113 362 C115 360 116 358 118 358 Z" }
];

const frontBodyOutline = [
  "M100 64",
  "C89 64 78 68 70 76",
  "C63 84 58 95 56 108",
  "C54 123 56 142 60 160",
  "C64 176 69 190 76 203",
  "C82 214 88 224 90 235",
  "C91 245 89 257 86 270",
  "C83 286 82 303 84 320",
  "C86 338 90 355 95 373",
  "C97 380 98 388 100 394",
  "C102 388 103 380 105 373",
  "C110 355 114 338 116 320",
  "C118 303 117 286 114 270",
  "C111 257 109 245 110 235",
  "C112 224 118 214 124 203",
  "C131 190 136 176 140 160",
  "C144 142 146 123 144 108",
  "C142 95 137 84 130 76",
  "C122 68 111 64 100 64 Z"
].join(" ");

const backBodyOutline = [
  "M100 64",
  "C89 64 78 68 70 76",
  "C63 84 58 96 56 111",
  "C54 127 56 145 60 163",
  "C64 178 70 193 77 206",
  "C84 218 89 229 91 242",
  "C92 254 90 267 87 282",
  "C84 298 83 315 85 332",
  "C87 349 91 364 95 379",
  "C97 386 98 392 100 398",
  "C102 392 103 386 105 379",
  "C109 364 113 349 115 332",
  "C117 315 116 298 113 282",
  "C110 267 108 254 109 242",
  "C111 229 116 218 123 206",
  "C130 193 136 178 140 163",
  "C144 145 146 127 144 111",
  "C142 96 137 84 130 76",
  "C122 68 111 64 100 64 Z"
].join(" ");

const frontLimbOutlines = [
  "M60 102 C51 113 45 128 43 144 C42 161 44 180 49 198 C52 210 57 223 64 233 C68 236 72 234 74 228 C73 206 74 180 77 149 C78 129 73 112 66 103 C64 101 62 101 60 102 Z",
  "M140 102 C149 113 155 128 157 144 C158 161 156 180 151 198 C148 210 143 223 136 233 C132 236 128 234 126 228 C127 206 126 180 123 149 C122 129 127 112 134 103 C136 101 138 101 140 102 Z",
  "M84 238 C77 248 72 262 69 278 C66 297 67 318 70 338 C72 354 76 369 81 384 C84 389 88 389 91 384 C94 356 95 324 94 243 C91 239 88 237 84 238 Z",
  "M116 238 C123 248 128 262 131 278 C134 297 133 318 130 338 C128 354 124 369 119 384 C116 389 112 389 109 384 C106 356 105 324 106 243 C109 239 112 237 116 238 Z"
];

const backLimbOutlines = [
  "M58 110 C50 120 45 134 43 151 C42 168 44 186 49 203 C53 216 58 227 65 236 C69 239 73 237 75 231 C74 208 75 182 78 151 C79 131 73 117 64 110 C62 109 60 109 58 110 Z",
  "M142 110 C150 120 155 134 157 151 C158 168 156 186 151 203 C147 216 142 227 135 236 C131 239 127 237 125 231 C126 208 125 182 122 151 C121 131 127 117 136 110 C138 109 140 109 142 110 Z",
  "M84 246 C77 256 72 271 69 288 C66 307 67 328 70 347 C73 363 77 377 82 391 C85 396 89 396 92 391 C95 363 96 330 94 251 C91 247 88 245 84 246 Z",
  "M116 246 C123 256 128 271 131 288 C134 307 133 328 130 347 C127 363 123 377 118 391 C115 396 111 396 108 391 C105 363 104 330 106 251 C109 247 112 245 116 246 Z"
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
        <Path d="M100 18 C90 18 82 21 76 28 C71 35 69 44 71 53 C74 61 81 68 89 72 C96 74 104 74 111 72 C119 68 126 61 129 53 C131 44 129 35 124 28 C118 21 110 18 100 18 Z" fill={bodyFill} stroke={outlineColor} strokeWidth={2.5} />
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
