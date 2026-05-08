import React, { useMemo } from 'react';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

const ACCENT = '#2682D5';
const INACTIVE = '#2a2a2a';
const BODY_FILL = '#1a1a1a';
const OUTLINE = '#555555';

type ViewSide = 'front' | 'back';

interface MuscleMapProps {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  view?: ViewSide;
  width?: number;
  height?: number;
}

function normalizeMuscleName(name: string): string[] {
  const n = name.toLowerCase().trim();
  const map: Record<string, string[]> = {
    'rectus abdominis': ['abs'],
    'transverse abdominis': ['abs'],
    'lower rectus abdominis': ['abs'],
    'abs': ['abs'],
    'obliques': ['obliques-l', 'obliques-r'],
    'external obliques': ['obliques-l', 'obliques-r'],
    'lats': ['lats-l', 'lats-r'],
    'latissimus dorsi': ['lats-l', 'lats-r'],
    'mid traps': ['traps'],
    'upper traps': ['traps'],
    'lower traps': ['traps'],
    'trapezius': ['traps'],
    'rhomboids': ['lats-l', 'lats-r'],
    'mid back': ['lats-l', 'lats-r'],
    'upper back': ['traps'],
    'rear delts': ['rear-delts-l', 'rear-delts-r'],
    'posterior deltoid': ['rear-delts-l', 'rear-delts-r'],
    'front delts': ['front-delts-l', 'front-delts-r'],
    'anterior delts': ['front-delts-l', 'front-delts-r'],
    'lateral delts': ['front-delts-l', 'front-delts-r'],
    'deltoid': ['front-delts-l', 'front-delts-r'],
    'shoulders': ['front-delts-l', 'front-delts-r'],
    'biceps': ['biceps-l', 'biceps-r'],
    'biceps brachii': ['biceps-l', 'biceps-r'],
    'brachialis': ['biceps-l', 'biceps-r'],
    'triceps': ['triceps-l', 'triceps-r'],
    'triceps brachii': ['triceps-l', 'triceps-r'],
    'forearms': ['forearms-l', 'forearms-r'],
    'brachioradialis': ['forearms-l', 'forearms-r'],
    'grip': ['forearms-l', 'forearms-r'],
    'spinal erectors': ['spine'],
    'erector spinae': ['spine'],
    'quadratus lumborum': ['spine'],
    'glutes': ['glutes-l', 'glutes-r'],
    'gluteus maximus': ['glutes-l', 'glutes-r'],
    'glute medius': ['glutes-l', 'glutes-r'],
    'gluteus medius': ['glutes-l', 'glutes-r'],
    'hamstrings': ['hams-l', 'hams-r'],
    'quads': ['quads-l', 'quads-r'],
    'quadriceps': ['quads-l', 'quads-r'],
    'hip flexors': ['quads-l', 'quads-r'],
    'adductors': ['quads-l', 'quads-r'],
    'calves': ['calves-l', 'calves-r'],
    'gastrocnemius': ['calves-l', 'calves-r'],
    'soleus': ['calves-l', 'calves-r'],
    'tibialis anterior': ['calves-l', 'calves-r'],
    'chest': ['chest-l', 'chest-r'],
    'pectorals': ['chest-l', 'chest-r'],
    'pectoralis major': ['chest-l', 'chest-r'],
    'lower chest': ['chest-l', 'chest-r'],
    'upper chest': ['chest-l', 'chest-r'],
    'teres major': ['lats-l', 'lats-r'],
    'core': ['abs'],
  };
  return map[n] || [];
}

function getRegionIds(muscles: string[]): Set<string> {
  const ids = new Set<string>();
  muscles.forEach(m => normalizeMuscleName(m).forEach(id => ids.add(id)));
  return ids;
}

function regionFill(id: string, primary: Set<string>, secondary: Set<string>) {
  if (primary.has(id)) return { fill: ACCENT, fillOpacity: 1 };
  if (secondary.has(id)) return { fill: ACCENT, fillOpacity: 0.4 };
  return { fill: INACTIVE, fillOpacity: 1 };
}

// ─── FRONT VIEW ──────────────────────────────────────────────────────────────
// viewBox "0 0 100 230"
// All coordinates hand-tuned for natural human proportions.

function FrontFigure({ primary, secondary }: { primary: Set<string>; secondary: Set<string> }) {
  const f = (id: string) => regionFill(id, primary, secondary);
  return (
    <G>
      {/* ── Body silhouette outline ── */}
      {/* Torso */}
      <Path
        d="M38,28 C30,28 18,30 16,38 C14,46 14,54 16,60 C18,66 26,68 26,68
           C24,80 22,95 22,108 C22,118 28,122 28,128
           C26,130 22,132 20,138 C18,144 18,155 18,162
           C18,175 20,188 20,198 C20,208 22,218 24,224
           L28,226 L34,226 C36,220 36,210 36,200 C36,190 36,178 38,168
           C39,162 42,160 44,158 C46,160 49,162 50,166
           C51,162 54,160 56,158 C58,160 61,162 62,168
           C64,178 64,190 64,200 C64,210 64,220 66,226
           L72,226 L76,224 C78,218 80,208 80,198 C80,188 82,175 82,162
           C82,155 82,144 80,138 C78,132 74,130 72,128
           C72,122 78,118 78,108 C78,95 76,80 74,68
           C74,68 82,66 84,60 C86,54 86,46 84,38
           C82,30 70,28 62,28 Z"
        fill={BODY_FILL}
        stroke={OUTLINE}
        strokeWidth="1.2"
      />
      {/* Left arm */}
      <Path
        d="M16,38 C12,40 10,48 10,58 C10,68 10,80 11,92
           C12,104 13,112 14,120 C15,126 16,128 18,128
           C20,128 22,126 22,120 C22,112 22,100 22,88
           C22,76 22,64 22,58 C22,52 22,44 22,38 Z"
        fill={BODY_FILL}
        stroke={OUTLINE}
        strokeWidth="1.2"
      />
      {/* Right arm */}
      <Path
        d="M84,38 C88,40 90,48 90,58 C90,68 90,80 89,92
           C88,104 87,112 86,120 C85,126 84,128 82,128
           C80,128 78,126 78,120 C78,112 78,100 78,88
           C78,76 78,64 78,58 C78,52 78,44 78,38 Z"
        fill={BODY_FILL}
        stroke={OUTLINE}
        strokeWidth="1.2"
      />

      {/* ── Chest left ── */}
      <Path
        d="M28,36 C28,34 34,33 40,34 C46,35 50,38 50,42
           C50,50 48,58 44,62 C40,64 32,62 29,56 C27,52 27,44 28,36 Z"
        {...f('chest-l')}
        stroke="none"
      />
      {/* Chest right */}
      <Path
        d="M72,36 C72,34 66,33 60,34 C54,35 50,38 50,42
           C50,50 52,58 56,62 C60,64 68,62 71,56 C73,52 73,44 72,36 Z"
        {...f('chest-r')}
        stroke="none"
      />

      {/* ── Front delt left ── */}
      <Path
        d="M17,32 C14,32 12,36 12,42 C12,48 14,54 18,56
           C22,54 24,48 24,42 C24,36 22,32 18,32 Z"
        {...f('front-delts-l')}
        stroke="none"
      />
      {/* Front delt right */}
      <Path
        d="M83,32 C86,32 88,36 88,42 C88,48 86,54 82,56
           C78,54 76,48 76,42 C76,36 78,32 82,32 Z"
        {...f('front-delts-r')}
        stroke="none"
      />

      {/* ── Biceps left ── */}
      <Ellipse cx="14" cy="72" rx="5" ry="14" {...f('biceps-l')} stroke="none" />
      {/* Biceps right */}
      <Ellipse cx="86" cy="72" rx="5" ry="14" {...f('biceps-r')} stroke="none" />

      {/* ── Forearms left ── */}
      <Ellipse cx="15" cy="104" rx="4.5" ry="13" {...f('forearms-l')} stroke="none" />
      {/* Forearms right */}
      <Ellipse cx="85" cy="104" rx="4.5" ry="13" {...f('forearms-r')} stroke="none" />

      {/* ── Abs ── */}
      <Path
        d="M40,65 C37,65 34,68 34,72 C34,88 36,100 38,108
           C40,114 44,116 50,116 C56,116 60,114 62,108
           C64,100 66,88 66,72 C66,68 63,65 60,65
           C58,65 54,66 50,66 C46,66 42,65 40,65 Z"
        {...f('abs')}
        stroke="none"
      />

      {/* ── Obliques left ── */}
      <Path
        d="M26,70 C24,72 23,78 23,86 C23,96 24,104 26,110
           C28,114 32,116 36,114 C34,104 33,90 33,78
           C33,72 32,68 30,68 Z"
        {...f('obliques-l')}
        stroke="none"
      />
      {/* Obliques right */}
      <Path
        d="M74,70 C76,72 77,78 77,86 C77,96 76,104 74,110
           C72,114 68,116 64,114 C66,104 67,90 67,78
           C67,72 68,68 70,68 Z"
        {...f('obliques-r')}
        stroke="none"
      />

      {/* ── Quads left ── */}
      <Path
        d="M22,130 C20,132 19,140 19,150 C19,163 20,175 22,182
           C25,186 30,186 34,182 C36,174 37,162 37,150
           C37,138 36,130 34,128 C30,126 24,128 22,130 Z"
        {...f('quads-l')}
        stroke="none"
      />
      {/* Quads right */}
      <Path
        d="M78,130 C80,132 81,140 81,150 C81,163 80,175 78,182
           C75,186 70,186 66,182 C64,174 63,162 63,150
           C63,138 64,130 66,128 C70,126 76,128 78,130 Z"
        {...f('quads-r')}
        stroke="none"
      />

      {/* ── Calves left ── */}
      <Path
        d="M20,196 C19,200 19,208 20,214 C21,220 24,224 28,224
           C32,224 34,220 34,214 C35,208 35,200 34,196
           C32,193 28,192 24,193 Z"
        {...f('calves-l')}
        stroke="none"
      />
      {/* Calves right */}
      <Path
        d="M80,196 C81,200 81,208 80,214 C79,220 76,224 72,224
           C68,224 66,220 66,214 C65,208 65,200 66,196
           C68,193 72,192 76,193 Z"
        {...f('calves-r')}
        stroke="none"
      />

      {/* ── Head ── */}
      <Circle cx="50" cy="14" r="11" fill={BODY_FILL} stroke={OUTLINE} strokeWidth="1.2" />
      {/* Neck */}
      <Path d="M44,24 L44,30 L56,30 L56,24 Z" fill={BODY_FILL} stroke="none" />
    </G>
  );
}

// ─── BACK VIEW ───────────────────────────────────────────────────────────────

function BackFigure({ primary, secondary }: { primary: Set<string>; secondary: Set<string> }) {
  const f = (id: string) => regionFill(id, primary, secondary);
  return (
    <G>
      {/* ── Body silhouette outline (same shape as front) ── */}
      <Path
        d="M38,28 C30,28 18,30 16,38 C14,46 14,54 16,60 C18,66 26,68 26,68
           C24,80 22,95 22,108 C22,118 28,122 28,128
           C26,130 22,132 20,138 C18,144 18,155 18,162
           C18,175 20,188 20,198 C20,208 22,218 24,224
           L28,226 L34,226 C36,220 36,210 36,200 C36,190 36,178 38,168
           C39,162 42,160 44,158 C46,160 49,162 50,166
           C51,162 54,160 56,158 C58,160 61,162 62,168
           C64,178 64,190 64,200 C64,210 64,220 66,226
           L72,226 L76,224 C78,218 80,208 80,198 C80,188 82,175 82,162
           C82,155 82,144 80,138 C78,132 74,130 72,128
           C72,122 78,118 78,108 C78,95 76,80 74,68
           C74,68 82,66 84,60 C86,54 86,46 84,38
           C82,30 70,28 62,28 Z"
        fill={BODY_FILL}
        stroke={OUTLINE}
        strokeWidth="1.2"
      />
      {/* Left arm */}
      <Path
        d="M16,38 C12,40 10,48 10,58 C10,68 10,80 11,92
           C12,104 13,112 14,120 C15,126 16,128 18,128
           C20,128 22,126 22,120 C22,112 22,100 22,88
           C22,76 22,64 22,58 C22,52 22,44 22,38 Z"
        fill={BODY_FILL}
        stroke={OUTLINE}
        strokeWidth="1.2"
      />
      {/* Right arm */}
      <Path
        d="M84,38 C88,40 90,48 90,58 C90,68 90,80 89,92
           C88,104 87,112 86,120 C85,126 84,128 82,128
           C80,128 78,126 78,120 C78,112 78,100 78,88
           C78,76 78,64 78,58 C78,52 78,44 78,38 Z"
        fill={BODY_FILL}
        stroke={OUTLINE}
        strokeWidth="1.2"
      />

      {/* ── Traps ── */}
      <Path
        d="M38,30 C38,30 44,36 50,36 C56,36 62,30 62,30
           C64,30 70,30 74,34 C78,38 76,46 72,50
           C68,54 60,56 50,56 C40,56 32,54 28,50
           C24,46 22,38 26,34 C30,30 36,30 38,30 Z"
        {...f('traps')}
        stroke="none"
      />

      {/* ── Rear delt left ── */}
      <Path
        d="M17,32 C14,32 12,36 12,42 C12,48 14,54 18,56
           C22,54 24,48 24,42 C24,36 22,32 18,32 Z"
        {...f('rear-delts-l')}
        stroke="none"
      />
      {/* Rear delt right */}
      <Path
        d="M83,32 C86,32 88,36 88,42 C88,48 86,54 82,56
           C78,54 76,48 76,42 C76,36 78,32 82,32 Z"
        {...f('rear-delts-r')}
        stroke="none"
      />

      {/* ── Lats left ── */}
      <Path
        d="M26,56 C22,58 22,66 22,76 C22,88 24,96 28,102
           C32,106 38,108 42,106 C44,96 44,82 42,70
           C40,62 36,56 30,55 Z"
        {...f('lats-l')}
        stroke="none"
      />
      {/* Lats right */}
      <Path
        d="M74,56 C78,58 78,66 78,76 C78,88 76,96 72,102
           C68,106 62,108 58,106 C56,96 56,82 58,70
           C60,62 64,56 70,55 Z"
        {...f('lats-r')}
        stroke="none"
      />

      {/* ── Triceps left ── */}
      <Ellipse cx="14" cy="72" rx="5" ry="14" {...f('triceps-l')} stroke="none" />
      {/* Triceps right */}
      <Ellipse cx="86" cy="72" rx="5" ry="14" {...f('triceps-r')} stroke="none" />

      {/* ── Forearms left ── */}
      <Ellipse cx="15" cy="104" rx="4.5" ry="13" {...f('forearms-l')} stroke="none" />
      {/* Forearms right */}
      <Ellipse cx="85" cy="104" rx="4.5" ry="13" {...f('forearms-r')} stroke="none" />

      {/* ── Spinal erectors ── */}
      <Path
        d="M46,58 C44,62 43,76 43,92 C43,106 44,116 46,122 L50,122 L54,122
           C56,116 57,106 57,92 C57,76 56,62 54,58 Z"
        {...f('spine')}
        stroke="none"
      />

      {/* ── Glutes left ── */}
      <Path
        d="M22,118 C20,120 19,128 19,136 C19,146 22,154 28,156
           C34,158 40,154 42,146 C44,138 44,130 42,124
           C38,120 30,116 22,118 Z"
        {...f('glutes-l')}
        stroke="none"
      />
      {/* Glutes right */}
      <Path
        d="M78,118 C80,120 81,128 81,136 C81,146 78,154 72,156
           C66,158 60,154 58,146 C56,138 56,130 58,124
           C62,120 70,116 78,118 Z"
        {...f('glutes-r')}
        stroke="none"
      />

      {/* ── Hamstrings left ── */}
      <Path
        d="M20,158 C19,162 19,172 20,182 C21,190 24,196 28,196
           C32,196 35,190 36,182 C37,172 37,162 35,156
           C31,154 24,154 20,158 Z"
        {...f('hams-l')}
        stroke="none"
      />
      {/* Hamstrings right */}
      <Path
        d="M80,158 C81,162 81,172 80,182 C79,190 76,196 72,196
           C68,196 65,190 64,182 C63,172 63,162 65,156
           C69,154 76,154 80,158 Z"
        {...f('hams-r')}
        stroke="none"
      />

      {/* ── Calves left ── */}
      <Path
        d="M20,196 C19,200 19,208 20,214 C21,220 24,224 28,224
           C32,224 34,220 34,214 C35,208 35,200 34,196
           C32,193 28,192 24,193 Z"
        {...f('calves-l')}
        stroke="none"
      />
      {/* Calves right */}
      <Path
        d="M80,196 C81,200 81,208 80,214 C79,220 76,224 72,224
           C68,224 66,220 66,214 C65,208 65,200 66,196
           C68,193 72,192 76,193 Z"
        {...f('calves-r')}
        stroke="none"
      />

      {/* ── Head (back) ── */}
      <Circle cx="50" cy="14" r="11" fill={BODY_FILL} stroke={OUTLINE} strokeWidth="1.2" />
      <Path d="M44,24 L44,30 L56,30 L56,24 Z" fill={BODY_FILL} stroke="none" />
    </G>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MuscleMap({
  primaryMuscles,
  secondaryMuscles,
  view = 'front',
  width = 60,
  height = 140,
}: MuscleMapProps) {
  const primary = useMemo(() => getRegionIds(primaryMuscles), [primaryMuscles]);
  const secondary = useMemo(() => getRegionIds(secondaryMuscles), [secondaryMuscles]);

  if (process.env.NODE_ENV !== 'production' && primary.size === 0 && secondary.size === 0) {
    console.log('[MuscleMap] No regions resolved. Primary:', primaryMuscles, 'Secondary:', secondaryMuscles);
  }

  return (
    <Svg width={width} height={height} viewBox="0 0 100 230">
      {view === 'front'
        ? <FrontFigure primary={primary} secondary={secondary} />
        : <BackFigure primary={primary} secondary={secondary} />
      }
    </Svg>
  );
}

export default MuscleMap;
