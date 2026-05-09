/**
 * MuscleMap — anatomy base image + SVG color overlay.
 * Images: anatomy-front.png / anatomy-back.png (247×597 each).
 * Overlay coordinates calibrated from hand-painted muscle reference.
 */

import React, { useMemo } from 'react';
import { View, Image } from 'react-native';
import Svg, { Rect, Path, Ellipse, G } from 'react-native-svg';

const IMG_W = 247;
const IMG_H = 597;

const P = 0.52;  // primary opacity
const S = 0.26;  // secondary opacity

const C = {
  yellow: '#F59E0B',
  red:    '#EF4444',
  green:  '#22C55E',
  blue:   '#3B82F6',
  orange: '#F97316',
  cyan:   '#06B6D4',
  purple: '#A855F7',
  pink:   '#EC4899',
  lime:   '#84CC16',
  teal:   '#14B8A6',
};

type ViewSide = 'front' | 'back';
interface MuscleMapProps {
  primaryMuscles:   string[];
  secondaryMuscles: string[];
  view?:  ViewSide;
  width?: number;
}

function normalizeMuscleName(name: string): string[] {
  const n = name.toLowerCase().trim();
  const map: Record<string, string[]> = {
    'rectus abdominis':     ['abs-ul','abs-ur','abs-ml','abs-mr','abs-ll','abs-lr'],
    'transverse abdominis': ['abs-ul','abs-ur','abs-ml','abs-mr','abs-ll','abs-lr'],
    'abs':                  ['abs-ul','abs-ur','abs-ml','abs-mr','abs-ll','abs-lr'],
    'core':                 ['abs-ul','abs-ur','abs-ml','abs-mr','abs-ll','abs-lr'],
    'lower rectus abdominis': ['abs-ll','abs-lr'],
    'serratus anterior':    ['serratus-l','serratus-r'],
    'obliques':             ['obliques-l','obliques-r'],
    'external obliques':    ['obliques-l','obliques-r'],
    'internal obliques':    ['obliques-l','obliques-r'],
    'hip flexors':          ['tfl-l','tfl-r'],
    'tensor fasciae latae': ['tfl-l','tfl-r'],
    'chest':                ['chest-l','chest-r'],
    'pectorals':            ['chest-l','chest-r'],
    'pectoralis major':     ['chest-l','chest-r'],
    'upper chest':          ['chest-l','chest-r'],
    'lower chest':          ['chest-l','chest-r'],
    'front delts':          ['front-delts-l','front-delts-r'],
    'anterior deltoid':     ['front-delts-l','front-delts-r'],
    'lateral delts':        ['front-delts-l','front-delts-r','lat-delt-l','lat-delt-r'],
    'deltoid':              ['front-delts-l','front-delts-r'],
    'shoulders':            ['front-delts-l','front-delts-r'],
    'rear delts':           ['rear-delts-l','rear-delts-r'],
    'posterior deltoid':    ['rear-delts-l','rear-delts-r'],
    'biceps':               ['biceps-l','biceps-r'],
    'biceps brachii':       ['biceps-l','biceps-r'],
    'brachialis':           ['biceps-l','biceps-r'],
    'triceps':              ['triceps-l','triceps-r'],
    'triceps brachii':      ['triceps-l','triceps-r'],
    'forearms':             ['forearms-l','forearms-r'],
    'brachioradialis':      ['forearms-l','forearms-r'],
    'grip':                 ['forearms-l','forearms-r'],
    'upper traps':          ['upper-traps'],
    'mid traps':            ['mid-traps-l','mid-traps-r'],
    'lower traps':          ['lower-traps-l','lower-traps-r'],
    'trapezius':            ['upper-traps','mid-traps-l','mid-traps-r'],
    'upper back':           ['upper-traps','rhomboids'],
    'rhomboids':            ['rhomboids'],
    'infraspinatus':        ['infra-l','infra-r'],
    'teres minor':          ['teres-l','teres-r'],
    'teres major':          ['teres-l','teres-r'],
    'lats':                 ['lats-l','lats-r'],
    'latissimus dorsi':     ['lats-l','lats-r'],
    'mid back':             ['lats-l','lats-r','rhomboids'],
    'spinal erectors':      ['erectors-l','erectors-r'],
    'erector spinae':       ['erectors-l','erectors-r'],
    'lower back':           ['erectors-l','erectors-r'],
    'glutes':               ['glutes-l','glutes-r'],
    'gluteus maximus':      ['glutes-l','glutes-r'],
    'glute medius':         ['glute-med-l','glute-med-r'],
    'gluteus medius':       ['glute-med-l','glute-med-r'],
    'quads':                ['vl-l','rf-l','vm-l','vl-r','rf-r','vm-r'],
    'quadriceps':           ['vl-l','rf-l','vm-l','vl-r','rf-r','vm-r'],
    'vastus lateralis':     ['vl-l','vl-r'],
    'rectus femoris':       ['rf-l','rf-r'],
    'vastus medialis':      ['vm-l','vm-r'],
    'adductors':            ['add-l','add-r'],
    'sartorius':            ['sart-l','sart-r'],
    'hamstrings':           ['bf-l','bf-r','semi-l','semi-r'],
    'biceps femoris':       ['bf-l','bf-r'],
    'semitendinosus':       ['semi-l','semi-r'],
    'calves':               ['gastroc-l','gastroc-r'],
    'gastrocnemius':        ['gastroc-l','gastroc-r'],
    'soleus':               ['gastroc-l','gastroc-r'],
    'tibialis anterior':    ['tib-l','tib-r'],
  };
  return map[n] || [];
}

function getIds(muscles: string[]): Set<string> {
  const ids = new Set<string>();
  muscles.forEach(m => normalizeMuscleName(m).forEach(id => ids.add(id)));
  return ids;
}

function hl(id: string, p: Set<string>, s: Set<string>, color: string) {
  if (p.has(id)) return { fill: color, fillOpacity: P };
  if (s.has(id)) return { fill: color, fillOpacity: S };
  return { fill: color, fillOpacity: 0 };
}

// ─── FRONT OVERLAY ─────────────────────────────────────────────────────────
// Coordinates in 247×597 space, calibrated from hand-painted muscle reference

function FrontOverlay({ p, s }: { p: Set<string>; s: Set<string> }) {
  return (
    <G>
      {/* FRONT DELTOIDS — shoulder caps */}
      <Rect x="53"  y="112" width="36" height="42" rx="5" {...hl('front-delts-l', p, s, C.yellow)} />
      <Rect x="158" y="112" width="43" height="42" rx="5" {...hl('front-delts-r', p, s, C.yellow)} />

      {/* LATERAL DELTOID — outer shoulder */}
      <Rect x="50"  y="148" width="33" height="67" rx="5" {...hl('lat-delt-l', p, s, C.pink)} />
      <Rect x="164" y="148" width="40" height="67" rx="5" {...hl('lat-delt-r', p, s, C.pink)} />

      {/* CHEST — pectoralis major */}
      <Path d="M83,122 C80,135 78,155 82,172 C88,178 105,178 122,175 L122,122 Z"
        {...hl('chest-l', p, s, C.red)} />
      <Path d="M123,122 L123,175 C140,178 157,178 163,172 C167,155 165,135 162,122 Z"
        {...hl('chest-r', p, s, C.red)} />

      {/* BICEPS — upper arm */}
      <Rect x="38"  y="162" width="27" height="133" rx="8" {...hl('biceps-l', p, s, C.blue)} />
      <Rect x="182" y="162" width="28" height="133" rx="8" {...hl('biceps-r', p, s, C.blue)} />

      {/* FOREARMS */}
      <Rect x="36"  y="298" width="27" height="92" rx="6" {...hl('forearms-l', p, s, C.orange)} />
      <Rect x="183" y="298" width="27" height="92" rx="6" {...hl('forearms-r', p, s, C.orange)} />

      {/* SERRATUS ANTERIOR — ribcage fingers */}
      <Rect x="77"  y="168" width="20" height="112" rx="4" {...hl('serratus-l', p, s, C.cyan)} />
      <Rect x="150" y="168" width="20" height="112" rx="4" {...hl('serratus-r', p, s, C.cyan)} />

      {/* ABS — 6-pack: 2 columns × 3 rows */}
      <Rect x="88"  y="176" width="34" height="42" rx="4" {...hl('abs-ul', p, s, C.green)} />
      <Rect x="123" y="176" width="37" height="42" rx="4" {...hl('abs-ur', p, s, C.lime)} />
      <Rect x="88"  y="222" width="34" height="38" rx="4" {...hl('abs-ml', p, s, C.green)} />
      <Rect x="123" y="222" width="37" height="38" rx="4" {...hl('abs-mr', p, s, C.lime)} />
      <Rect x="88"  y="264" width="34" height="41" rx="4" {...hl('abs-ll', p, s, C.green)} />
      <Rect x="123" y="264" width="37" height="41" rx="4" {...hl('abs-lr', p, s, C.lime)} />

      {/* OBLIQUES — external oblique, diagonal side bands */}
      <Path d="M62,176 L85,176 L85,340 C78,342 68,338 62,330 Z"
        {...hl('obliques-l', p, s, C.orange)} />
      <Path d="M162,176 C156,222 160,280 165,330 C159,338 149,342 142,340 L162,340 Z"
        {...hl('obliques-r', p, s, C.orange)} />

      {/* TFL / HIP FLEXORS */}
      <Rect x="88"  y="308" width="32" height="52" rx="4" {...hl('tfl-l', p, s, C.purple)} />
      <Rect x="130" y="308" width="32" height="52" rx="4" {...hl('tfl-r', p, s, C.purple)} />

      {/* VASTUS LATERALIS — outer quad */}
      <Path d="M72,363 C69,385 67,420 70,452 C72,472 76,488 82,497 L103,497 L103,363 Z"
        {...hl('vl-l', p, s, C.blue)} />
      <Path d="M144,363 L144,497 L165,497 C171,488 175,472 177,452 C180,420 178,385 175,363 Z"
        {...hl('vl-r', p, s, C.blue)} />

      {/* RECTUS FEMORIS — center quad strip */}
      <Rect x="103" y="363" width="19" height="134" rx="4" {...hl('rf-l', p, s, C.green)} />
      <Rect x="125" y="363" width="19" height="134" rx="4" {...hl('rf-r', p, s, C.lime)} />

      {/* VASTUS MEDIALIS — teardrop above knee */}
      <Ellipse cx="99"  cy="508" rx="11" ry="17" {...hl('vm-l', p, s, C.yellow)} />
      <Ellipse cx="150" cy="506" rx="10" ry="15" {...hl('vm-r', p, s, C.yellow)} />

      {/* SARTORIUS — diagonal ribbon across thigh */}
      <Path d="M118,365 C122,390 116,430 108,462 C103,478 97,490 94,495 C91,490 90,482 92,470 C98,447 108,405 112,380 Z"
        {...hl('sart-l', p, s, C.purple)} />
      <Path d="M129,365 C125,390 131,430 139,462 C144,478 150,490 153,495 C156,490 157,482 155,470 C149,447 139,405 135,380 Z"
        {...hl('sart-r', p, s, C.purple)} />

      {/* ADDUCTORS */}
      <Path d="M120,365 L122,495 L115,495 L115,365 Z"
        {...hl('add-l', p, s, C.teal)} />
      <Path d="M125,365 L132,365 L132,495 L125,495 Z"
        {...hl('add-r', p, s, C.teal)} />

      {/* TIBIALIS ANTERIOR — front shin */}
      <Rect x="88"  y="510" width="20" height="58" rx="4" {...hl('tib-l', p, s, C.cyan)} />
      <Rect x="138" y="510" width="20" height="58" rx="4" {...hl('tib-r', p, s, C.cyan)} />

      {/* GASTROCNEMIUS — visible at shin sides from front */}
      <Rect x="68"  y="510" width="20" height="55" rx="4" {...hl('gastroc-l', p, s, C.teal)} />
      <Rect x="158" y="510" width="20" height="55" rx="4" {...hl('gastroc-r', p, s, C.teal)} />
    </G>
  );
}

// ─── BACK OVERLAY ──────────────────────────────────────────────────────────
// anatomy-back.png is right half of anatomy source — same 247×597 coordinate space

function BackOverlay({ p, s }: { p: Set<string>; s: Set<string> }) {
  return (
    <G>
      {/* UPPER TRAPS — diamond cowl */}
      <Path d="M123,112 C140,116 172,128 190,145 C194,156 190,168 180,175 C162,184 142,188 123,189 C104,188 84,184 66,175 C56,168 52,156 56,145 C74,128 106,116 123,112 Z"
        {...hl('upper-traps', p, s, C.yellow)} />

      {/* REAR DELTS — shoulder caps */}
      <Ellipse cx="62"  cy="133" rx="22" ry="20" {...hl('rear-delts-l', p, s, C.orange)} />
      <Ellipse cx="184" cy="133" rx="22" ry="20" {...hl('rear-delts-r', p, s, C.orange)} />

      {/* MID TRAPS */}
      <Rect x="65" y="172" width="26" height="38" rx="4" {...hl('mid-traps-l', p, s, C.blue)} />
      <Rect x="156" y="172" width="26" height="38" rx="4" {...hl('mid-traps-r', p, s, C.blue)} />

      {/* LOWER TRAPS */}
      <Path d="M68,210 C62,224 60,240 66,254 C80,250 104,245 116,242 L116,210 Z"
        {...hl('lower-traps-l', p, s, C.cyan)} />
      <Path d="M179,210 L131,210 L131,242 C143,245 167,250 181,254 C187,240 185,224 179,210 Z"
        {...hl('lower-traps-r', p, s, C.cyan)} />

      {/* RHOMBOIDS */}
      <Rect x="90" y="148" width="67" height="70" rx="5" {...hl('rhomboids', p, s, C.purple)} />

      {/* INFRASPINATUS */}
      <Ellipse cx="78"  cy="188" rx="18" ry="16" {...hl('infra-l', p, s, C.pink)} />
      <Ellipse cx="169" cy="188" rx="18" ry="16" {...hl('infra-r', p, s, C.pink)} />

      {/* TERES MAJOR / MINOR */}
      <Ellipse cx="68"  cy="222" rx="15" ry="10" {...hl('teres-l', p, s, C.cyan)} />
      <Ellipse cx="179" cy="222" rx="15" ry="10" {...hl('teres-r', p, s, C.cyan)} />

      {/* LATS — large wings */}
      <Path d="M44,198 C40,216 40,252 44,285 C46,312 54,332 62,340 C74,345 90,340 97,328 C102,312 102,280 100,252 C98,228 90,208 80,200 C68,195 52,195 44,198 Z"
        {...hl('lats-l', p, s, C.green)} />
      <Path d="M203,198 C207,216 207,252 203,285 C201,312 193,332 185,340 C173,345 157,340 150,328 C145,312 145,280 147,252 C149,228 157,208 167,200 C179,195 195,195 203,198 Z"
        {...hl('lats-r', p, s, C.green)} />

      {/* ERECTOR SPINAE */}
      <Rect x="104" y="198" width="14" height="140" rx="7" {...hl('erectors-l', p, s, C.orange)} />
      <Rect x="129" y="198" width="14" height="140" rx="7" {...hl('erectors-r', p, s, C.orange)} />

      {/* TRICEPS */}
      <Rect x="36"  y="155" width="28" height="132" rx="8" {...hl('triceps-l', p, s, C.blue)} />
      <Rect x="183" y="155" width="28" height="132" rx="8" {...hl('triceps-r', p, s, C.blue)} />

      {/* FOREARMS */}
      <Rect x="34"  y="290" width="28" height="92" rx="6" {...hl('forearms-l', p, s, C.cyan)} />
      <Rect x="185" y="290" width="28" height="92" rx="6" {...hl('forearms-r', p, s, C.cyan)} />

      {/* GLUTE MEDIUS */}
      <Ellipse cx="90"  cy="333" rx="25" ry="15" {...hl('glute-med-l', p, s, C.lime)} />
      <Ellipse cx="157" cy="333" rx="25" ry="15" {...hl('glute-med-r', p, s, C.lime)} />

      {/* GLUTEUS MAXIMUS */}
      <Path d="M56,338 C52,355 50,382 54,408 C58,425 68,435 80,436 C98,438 118,430 122,414 C126,396 124,366 118,348 C112,334 96,328 80,330 C68,332 60,334 56,338 Z"
        {...hl('glutes-l', p, s, C.yellow)} />
      <Path d="M191,338 C195,355 197,382 193,408 C189,425 179,435 167,436 C149,438 129,430 125,414 C121,396 123,366 129,348 C135,334 151,328 167,330 C179,332 187,334 191,338 Z"
        {...hl('glutes-r', p, s, C.yellow)} />

      {/* BICEPS FEMORIS — outer hamstring */}
      <Path d="M60,440 C56,458 54,482 58,504 C60,516 66,524 72,524 C78,522 82,514 82,498 C82,476 80,454 76,442 C73,436 64,435 60,440 Z"
        {...hl('bf-l', p, s, C.blue)} />
      <Path d="M187,440 C191,458 193,482 189,504 C187,516 181,524 175,524 C169,522 165,514 165,498 C165,476 167,454 171,442 C174,436 183,435 187,440 Z"
        {...hl('bf-r', p, s, C.blue)} />

      {/* SEMITENDINOSUS — inner hamstring */}
      <Path d="M95,440 C91,458 90,482 92,504 C93,516 97,523 102,524 C107,522 110,514 110,498 C110,476 108,454 104,442 C101,436 98,435 95,440 Z"
        {...hl('semi-l', p, s, C.purple)} />
      <Path d="M152,440 C156,458 157,482 155,504 C154,516 150,523 145,524 C140,522 137,514 137,498 C137,476 139,454 143,442 C146,436 149,435 152,440 Z"
        {...hl('semi-r', p, s, C.purple)} />

      {/* GASTROCNEMIUS — calf */}
      <Ellipse cx="88"  cy="548" rx="16" ry="27" {...hl('gastroc-l', p, s, C.green)} />
      <Ellipse cx="159" cy="548" rx="16" ry="27" {...hl('gastroc-r', p, s, C.green)} />
    </G>
  );
}

// ─── Main Component ─────────────────────────────────────────────────────────

export function MuscleMap({
  primaryMuscles,
  secondaryMuscles,
  view = 'front',
  width = 50,
}: MuscleMapProps) {
  const primary   = useMemo(() => getIds(primaryMuscles),   [primaryMuscles]);
  const secondary = useMemo(() => getIds(secondaryMuscles), [secondaryMuscles]);

  const h = width * (IMG_H / IMG_W);  // maintain 247:597 aspect ratio

  return (
    <View style={{ width, height: h }}>
      <Image
        source={view === 'front'
          ? require('../../assets/anatomy-front.png')
          : require('../../assets/anatomy-back.png')}
        style={{ position: 'absolute', top: 0, left: 0, width, height: h }}
        resizeMode="stretch"
      />
      <Svg
        width={width}
        height={h}
        viewBox={`0 0 ${IMG_W} ${IMG_H}`}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        {view === 'front'
          ? <FrontOverlay p={primary} s={secondary} />
          : <BackOverlay  p={primary} s={secondary} />
        }
      </Svg>
    </View>
  );
}

export default MuscleMap;
