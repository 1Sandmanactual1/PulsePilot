import { StyleSheet, View } from "react-native";
import Svg, { Ellipse, Path, Rect } from "react-native-svg";

type Props = {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  view: "front" | "back";
};

type RegionId =
  | "chest"
  | "front-delts"
  | "biceps"
  | "forearms"
  | "abs"
  | "obliques"
  | "quads"
  | "calves"
  | "traps"
  | "lats"
  | "rear-delts"
  | "triceps"
  | "spinal-erectors"
  | "glutes"
  | "hamstrings";

const primaryColor = "#2682D5";
const inactiveColor = "#2A2A2A";
const outlineColor = "#444444";

const muscleMap: Record<string, RegionId> = {
  "Rectus abdominis": "abs",
  "Transverse abdominis": "abs",
  Obliques: "obliques",
  Lats: "lats",
  "Mid traps": "traps",
  "Upper traps": "traps",
  Rhomboids: "lats",
  "Rear delts": "rear-delts",
  "Front delts": "front-delts",
  Biceps: "biceps",
  Triceps: "triceps",
  Forearms: "forearms",
  "Spinal erectors": "spinal-erectors",
  Glutes: "glutes",
  Hamstrings: "hamstrings",
  Quads: "quads",
  Calves: "calves",
  Chest: "chest",
  Pectorals: "chest",
  "Hip flexors": "quads",
  "Lower rectus abdominis": "abs",
  "Quadratus lumborum": "spinal-erectors",
  "Glute medius": "glutes",
  "Teres major": "lats"
};

function resolveRegions(muscles: string[]) {
  return new Set(
    muscles
      .map((muscle) => muscleMap[muscle])
      .filter((region): region is RegionId => Boolean(region))
  );
}

function getFill(region: RegionId, primary: Set<RegionId>, secondary: Set<RegionId>) {
  if (primary.has(region)) return primaryColor;
  if (secondary.has(region)) return `${primaryColor}59`;
  return inactiveColor;
}

export function MuscleMap({ primaryMuscles, secondaryMuscles, view }: Props) {
  const primaryRegions = resolveRegions(primaryMuscles);
  const secondaryRegions = resolveRegions(secondaryMuscles);

  return (
    <View style={styles.container}>
      <Svg width="100%" height="100%" viewBox="0 0 120 260">
        <Ellipse cx="60" cy="18" rx="12" ry="12" fill="#1A1A1A" stroke={outlineColor} strokeWidth="2" />
        <Path d="M44 34 L76 34 L84 48 L36 48 Z" fill="#1A1A1A" stroke={outlineColor} strokeWidth="2" />
        <Rect x="42" y="48" width="36" height="72" rx="14" fill="#1A1A1A" stroke={outlineColor} strokeWidth="2" />
        <Rect x="32" y="116" width="20" height="54" rx="10" fill="#1A1A1A" stroke={outlineColor} strokeWidth="2" />
        <Rect x="68" y="116" width="20" height="54" rx="10" fill="#1A1A1A" stroke={outlineColor} strokeWidth="2" />
        <Rect x="36" y="170" width="14" height="54" rx="8" fill="#1A1A1A" stroke={outlineColor} strokeWidth="2" />
        <Rect x="70" y="170" width="14" height="54" rx="8" fill="#1A1A1A" stroke={outlineColor} strokeWidth="2" />
        <Rect x="18" y="54" width="16" height="52" rx="8" fill="#1A1A1A" stroke={outlineColor} strokeWidth="2" />
        <Rect x="86" y="54" width="16" height="52" rx="8" fill="#1A1A1A" stroke={outlineColor} strokeWidth="2" />
        <Rect x="18" y="106" width="14" height="48" rx="7" fill="#1A1A1A" stroke={outlineColor} strokeWidth="2" />
        <Rect x="88" y="106" width="14" height="48" rx="7" fill="#1A1A1A" stroke={outlineColor} strokeWidth="2" />

        {view === "front" ? (
          <>
            <Ellipse cx="48" cy="64" rx="14" ry="12" fill={getFill("chest", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Ellipse cx="72" cy="64" rx="14" ry="12" fill={getFill("chest", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Ellipse cx="29" cy="58" rx="8" ry="8" fill={getFill("front-delts", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Ellipse cx="91" cy="58" rx="8" ry="8" fill={getFill("front-delts", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Rect x="18" y="62" width="16" height="34" rx="8" fill={getFill("biceps", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Rect x="86" y="62" width="16" height="34" rx="8" fill={getFill("biceps", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Rect x="18" y="106" width="14" height="36" rx="7" fill={getFill("forearms", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Rect x="88" y="106" width="14" height="36" rx="7" fill={getFill("forearms", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Rect x="50" y="84" width="20" height="34" rx="8" fill={getFill("abs", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Path d="M42 88 Q34 102 42 116" fill={getFill("obliques", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Path d="M78 88 Q86 102 78 116" fill={getFill("obliques", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Rect x="32" y="122" width="20" height="46" rx="10" fill={getFill("quads", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Rect x="68" y="122" width="20" height="46" rx="10" fill={getFill("quads", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Rect x="36" y="180" width="14" height="32" rx="7" fill={getFill("calves", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Rect x="70" y="180" width="14" height="32" rx="7" fill={getFill("calves", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
          </>
        ) : (
          <>
            <Path d="M46 38 L74 38 L82 54 L38 54 Z" fill={getFill("traps", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Path d="M38 58 Q28 84 42 116 L52 112 L52 62 Z" fill={getFill("lats", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Path d="M82 58 Q92 84 78 116 L68 112 L68 62 Z" fill={getFill("lats", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Ellipse cx="29" cy="58" rx="8" ry="8" fill={getFill("rear-delts", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Ellipse cx="91" cy="58" rx="8" ry="8" fill={getFill("rear-delts", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Rect x="18" y="62" width="16" height="34" rx="8" fill={getFill("triceps", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Rect x="86" y="62" width="16" height="34" rx="8" fill={getFill("triceps", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Rect x="52" y="70" width="6" height="44" rx="3" fill={getFill("spinal-erectors", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1" />
            <Rect x="62" y="70" width="6" height="44" rx="3" fill={getFill("spinal-erectors", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1" />
            <Ellipse cx="48" cy="134" rx="14" ry="12" fill={getFill("glutes", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Ellipse cx="72" cy="134" rx="14" ry="12" fill={getFill("glutes", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Rect x="32" y="144" width="20" height="36" rx="10" fill={getFill("hamstrings", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
            <Rect x="68" y="144" width="20" height="36" rx="10" fill={getFill("hamstrings", primaryRegions, secondaryRegions)} stroke={outlineColor} strokeWidth="1.5" />
          </>
        )}
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
