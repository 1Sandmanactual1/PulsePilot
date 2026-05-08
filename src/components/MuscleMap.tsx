/**
 * MuscleMap — photorealistic anatomy base + SVG overlay.
 *
 * Paths traced from actual anatomy images via cv2 contour extraction.
 * Multi-color system ensures anatomically adjacent muscles stay distinct.
 */

import React, { useMemo } from 'react';
import { View, Image } from 'react-native';
import Svg, { Path, Rect, G } from 'react-native-svg';

const COLORS = {
  green:  '#22C55E',
  blue:   '#3B82F6',
  orange: '#F97316',
  purple: '#A855F7',
  yellow: '#EAB308',
  cyan:   '#06B6D4',
  red:    '#EF4444',
};

const FRONT_W = 247;
const FRONT_H = 597;
const BACK_W  = 233;
const BACK_H  = 597;

type ViewSide = 'front' | 'back';

interface MuscleMapProps {
  primaryMuscles: string[];
  secondaryMuscles: string[];
  view?: ViewSide;
  width?: number;
}

function normalizeMuscleName(name: string): string[] {
  const n = name.toLowerCase().trim();
  const map: Record<string, string[]> = {
    'rectus abdominis':      ['abs-ul','abs-ur','abs-ml','abs-mr','abs-ll','abs-lr'],
    'transverse abdominis':  ['abs-ul','abs-ur','abs-ml','abs-mr','abs-ll','abs-lr'],
    'lower rectus abdominis':['abs-ll','abs-lr'],
    'abs':                   ['abs-ul','abs-ur','abs-ml','abs-mr','abs-ll','abs-lr'],
    'core':                  ['abs-ul','abs-ur','abs-ml','abs-mr','abs-ll','abs-lr'],
    'serratus anterior':     ['serratus-l','serratus-r'],
    'obliques':              ['obliques-l','obliques-r'],
    'external obliques':     ['obliques-l','obliques-r'],
    'internal obliques':     ['obliques-l','obliques-r'],
    'hip flexors':           ['tfl-l','tfl-r'],
    'tensor fasciae latae':  ['tfl-l','tfl-r'],
    'chest':                 ['chest-l','chest-r'],
    'pectorals':             ['chest-l','chest-r'],
    'pectoralis major':      ['chest-l','chest-r'],
    'upper chest':           ['chest-l','chest-r'],
    'lower chest':           ['chest-l','chest-r'],
    'front delts':           ['front-delts-l','front-delts-r'],
    'anterior delts':        ['front-delts-l','front-delts-r'],
    'lateral delts':         ['front-delts-l','front-delts-r'],
    'deltoid':               ['front-delts-l','front-delts-r'],
    'shoulders':             ['front-delts-l','front-delts-r'],
    'rear delts':            ['rear-delts-l','rear-delts-r'],
    'posterior deltoid':     ['rear-delts-l','rear-delts-r'],
    'biceps':                ['biceps-l','biceps-r'],
    'biceps brachii':        ['biceps-l','biceps-r'],
    'brachialis':            ['biceps-l','biceps-r'],
    'triceps':               ['triceps-l','triceps-r'],
    'triceps brachii':       ['triceps-l','triceps-r'],
    'forearms':              ['forearms-l','forearms-r'],
    'brachioradialis':       ['forearms-l','forearms-r'],
    'grip':                  ['forearms-l','forearms-r'],
    'upper traps':           ['upper-traps'],
    'mid traps':             ['mid-traps-l','mid-traps-r'],
    'lower traps':           ['lower-traps-l','lower-traps-r'],
    'trapezius':             ['upper-traps','mid-traps-l','mid-traps-r','lower-traps-l','lower-traps-r'],
    'upper back':            ['upper-traps','mid-traps-l','mid-traps-r'],
    'rhomboids':             ['rhomboids'],
    'infraspinatus':         ['infra-l','infra-r'],
    'teres minor':           ['teres-minor-l','teres-minor-r'],
    'teres major':           ['teres-major-l','teres-major-r'],
    'lats':                  ['lats-l','lats-r'],
    'latissimus dorsi':      ['lats-l','lats-r'],
    'mid back':              ['lats-l','lats-r'],
    'spinal erectors':       ['erectors-l','erectors-r'],
    'erector spinae':        ['erectors-l','erectors-r'],
    'quadratus lumborum':    ['erectors-l','erectors-r'],
    'glutes':                ['glute-med-l','glute-med-r','glute-max-l','glute-max-r'],
    'gluteus maximus':       ['glute-max-l','glute-max-r'],
    'glute medius':          ['glute-med-l','glute-med-r'],
    'gluteus medius':        ['glute-med-l','glute-med-r'],
    'quads':                 ['vl-l','rf-l','vm-l','vl-r','rf-r','vm-r'],
    'quadriceps':            ['vl-l','rf-l','vm-l','vl-r','rf-r','vm-r'],
    'vastus lateralis':      ['vl-l','vl-r'],
    'rectus femoris':        ['rf-l','rf-r'],
    'vastus medialis':       ['vm-l','vm-r'],
    'adductors':             ['add-l','add-r'],
    'sartorius':             ['sart-l','sart-r'],
    'hamstrings':            ['bf-l','bf-r','semi-l','semi-r'],
    'biceps femoris':        ['bf-l','bf-r'],
    'semitendinosus':        ['semi-l','semi-r'],
    'semimembranosus':       ['semi-l','semi-r'],
    'calves':                ['gastroc-l','gastroc-r','soleus-l','soleus-r'],
    'gastrocnemius':         ['gastroc-l','gastroc-r'],
    'soleus':                ['soleus-l','soleus-r'],
    'tibialis anterior':     ['tib-l','tib-r'],
  };
  return map[n] || [];
}

function getRegionIds(muscles: string[]): Set<string> {
  const ids = new Set<string>();
  muscles.forEach(m => normalizeMuscleName(m).forEach(id => ids.add(id)));
  return ids;
}

function hl(id: string, primary: Set<string>, secondary: Set<string>, color: string) {
  if (primary.has(id))   return { fill: color, fillOpacity: 0.52 };
  if (secondary.has(id)) return { fill: color, fillOpacity: 0.26 };
  return { fill: color, fillOpacity: 0 };
}

// ─── FRONT OVERLAY ────────────────────────────────────────────────────────────
// Paths traced via cv2.approxPolyDP from anatomy-front.png (247x597).

function FrontOverlay({ p, s }: { p: Set<string>; s: Set<string> }) {
  return (
    <G>
      {/* CHEST */}
      <Path d="M122,100 L95,100 L55,121 L55,174 L122,174 Z"
        {...hl('chest-l', p, s, COLORS.green)} />
      <Path d="M123,100 L123,119 L132,119 L126,174 L191,174 L191,110 L165,100 Z"
        {...hl('chest-r', p, s, COLORS.green)} />

      {/* FRONT DELTS */}
      <Path d="M64,114 L52,129 L51,161 L64,161 Z"
        {...hl('front-delts-l', p, s, COLORS.blue)} />
      <Path d="M182,109 L182,161 L207,161 L205,125 L196,113 Z"
        {...hl('front-delts-r', p, s, COLORS.blue)} />

      {/* BICEPS */}
      <Path d="M61,155 L51,155 L37,257 L61,257 L61,212 L51,209 L53,200 L61,201 Z"
        {...hl('biceps-l', p, s, COLORS.orange)} />
      <Path d="M185,155 L185,244 L191,257 L216,257 L207,155 Z"
        {...hl('biceps-r', p, s, COLORS.orange)} />

      {/* FOREARMS */}
      <Path d="M37,248 L37,258 L41,258 L42,262 L37,263 L35,283 L50,284 L59,266 L59,248 Z"
        {...hl('forearms-l', p, s, COLORS.purple)} />
      <Path d="M187,248 L201,285 L216,285 L216,248 Z"
        {...hl('forearms-r', p, s, COLORS.purple)} />

      {/* SERRATUS ANTERIOR — traced serrated fingers */}
      <Path d="M55,160 L55,201 L68,209 L55,215 L55,234 L70,234 L77,190 L84,234 L99,234 L99,160 Z"
        {...hl('serratus-l', p, s, COLORS.cyan)} />
      <Path d="M147,160 L147,234 L172,234 L179,192 L184,234 L191,234 L191,160 Z"
        {...hl('serratus-r', p, s, COLORS.cyan)} />

      {/* ABS — individual segments traced */}
      <Path d="M88,165 L88,204 L122,204 L120,165 Z"
        {...hl('abs-ul', p, s, COLORS.green)} />
      <Path d="M128,165 L123,176 L123,188 L127,190 L123,204 L157,204 L157,165 Z"
        {...hl('abs-ur', p, s, COLORS.blue)} />
      <Path d="M88,205 L88,242 L94,242 L96,234 L100,242 L122,242 L122,205 L99,205 L97,231 L94,205 Z"
        {...hl('abs-ml', p, s, COLORS.green)} />
      <Path d="M123,205 L123,242 L149,242 L151,235 L157,242 L157,205 Z"
        {...hl('abs-mr', p, s, COLORS.blue)} />
      <Path d="M100,243 L105,277 L122,277 L122,243 Z"
        {...hl('abs-ll', p, s, COLORS.green)} />
      <Path d="M123,243 L123,277 L154,277 L154,243 Z"
        {...hl('abs-lr', p, s, COLORS.blue)} />

      {/* OBLIQUES */}
      <Path d="M58,165 L58,264 L79,190 L73,304 L92,304 L92,165 Z"
        {...hl('obliques-l', p, s, COLORS.orange)} />
      <Path d="M154,165 L154,304 L183,304 L171,214 L181,192 L188,247 L188,165 Z"
        {...hl('obliques-r', p, s, COLORS.orange)} />

      {/* TFL */}
      <Path d="M77,285 L68,339 L99,339 L99,285 Z"
        {...hl('tfl-l', p, s, COLORS.yellow)} />
      <Path d="M147,285 L147,339 L181,339 L181,288 Z"
        {...hl('tfl-r', p, s, COLORS.yellow)} />

      {/* VASTUS LATERALIS */}
      <Path d="M75,335 C69,350 67,378 70,408 C72,430 76,448 82,454 C88,453 93,441 93,425 C91,400 87,370 83,348 C80,337 77,332 75,335 Z"
        {...hl('vl-l', p, s, COLORS.blue)} />
      <Path d="M149,330 L149,464 L184,464 L178,432 L169,458 L153,440 L165,403 L180,409 L188,330 Z"
        {...hl('vl-r', p, s, COLORS.blue)} />

      {/* RECTUS FEMORIS */}
      <Path d="M88,330 L88,405 L102,429 L101,452 L88,461 L115,461 L122,330 Z"
        {...hl('rf-l', p, s, COLORS.green)} />
      <Path d="M133,330 L148,461 L157,461 L157,330 Z"
        {...hl('rf-r', p, s, COLORS.green)} />

      {/* VASTUS MEDIALIS */}
      <Path d="M95,420 L102,429 L101,452 L95,454 L95,467 L115,467 L111,441 L114,420 Z"
        {...hl('vm-l', p, s, COLORS.orange)} />
      <Path d="M145,420 L150,437 L148,467 L151,467 L151,420 Z"
        {...hl('vm-r', p, s, COLORS.orange)} />

      {/* SARTORIUS */}
      <Path d="M100,330 L100,461 L115,461 L124,330 Z"
        {...hl('sart-l', p, s, COLORS.purple)} />
      <Path d="M128,330 C124,336 128,368 136,405 C141,428 150,447 156,450 C160,444 161,436 158,426 C152,403 143,365 139,338 Z"
        {...hl('sart-r', p, s, COLORS.purple)} />

      {/* ADDUCTORS */}
      <Path d="M124,340 L108,340 L108,461 L115,461 L111,432 Z"
        {...hl('add-l', p, s, COLORS.cyan)} />
      <Path d="M134,345 C130,352 128,378 128,408 C128,430 129,448 132,454 C136,454 140,448 142,434 C144,412 144,382 141,358 Z"
        {...hl('add-r', p, s, COLORS.cyan)} />

      {/* TIBIALIS ANTERIOR */}
      <Path d="M114,455 L90,457 L90,532 L100,532 L92,543 L103,543 Z"
        {...hl('tib-l', p, s, COLORS.yellow)} />
      <Path d="M148,455 L148,477 L156,510 L156,455 Z"
        {...hl('tib-r', p, s, COLORS.yellow)} />

      {/* GASTROCNEMIUS */}
      <Path d="M79,455 L86,528 L100,532 L92,543 L104,543 L104,455 Z"
        {...hl('gastroc-l', p, s, COLORS.orange)} />
      <Path d="M148,455 L159,528 L167,524 L174,534 L178,455 Z"
        {...hl('gastroc-r', p, s, COLORS.orange)} />
    </G>
  );
}

// ─── BACK OVERLAY ─────────────────────────────────────────────────────────────
// Paths traced via cv2.approxPolyDP from anatomy-back.png (233x597).
// Erectors kept as Rect — traced contours were fragmented.

function BackOverlay({ p, s }: { p: Set<string>; s: Set<string> }) {
  return (
    <G>
      {/* UPPER TRAPS — full bilateral path */}
      <Path d="M116,100 C128,103 165,114 196,132 C204,142 200,154 190,162 C172,172 146,178 116,180 C86,178 60,172 42,162 C32,154 28,142 36,132 C67,114 104,103 116,100 Z"
        {...hl('upper-traps', p, s, COLORS.green)} />

      {/* MID TRAPS — serrated traced shape */}
      <Path d="M31,175 L25,224 L37,222 L40,184 L46,224 L57,224 L60,195 L69,224 L79,224 L79,175 Z"
        {...hl('mid-traps-l', p, s, COLORS.blue)} />
      <Path d="M153,175 L153,224 L163,192 L171,224 L182,224 L184,186 L189,224 L203,224 L195,175 Z"
        {...hl('mid-traps-r', p, s, COLORS.blue)} />

      {/* LOWER TRAPS */}
      <Path d="M27,210 L24,267 L45,267 L57,210 L42,210 L46,231 L36,226 L36,210 Z"
        {...hl('lower-traps-l', p, s, COLORS.cyan)} />
      <Path d="M170,210 L182,267 L205,267 L200,210 L191,210 L184,233 L179,231 L184,210 Z"
        {...hl('lower-traps-r', p, s, COLORS.cyan)} />

      {/* REAR DELTS */}
      <Path d="M74,104 L39,120 L33,164 L74,164 L74,120 L61,126 L57,119 L64,112 L74,115 Z"
        {...hl('rear-delts-l', p, s, COLORS.orange)} />
      <Path d="M179,115 L158,127 L158,164 L193,164 L191,131 Z"
        {...hl('rear-delts-r', p, s, COLORS.orange)} />

      {/* INFRASPINATUS */}
      <Path d="M42,158 L42,214 L57,214 L60,195 L68,214 L114,214 L114,158 Z"
        {...hl('infra-l', p, s, COLORS.purple)} />
      <Path d="M118,158 L118,214 L155,214 L163,192 L170,214 L184,214 L190,158 Z"
        {...hl('infra-r', p, s, COLORS.purple)} />

      {/* TERES MINOR */}
      <Path d="M65,200 L68,231 L90,231 L93,223 L107,216 L107,200 Z"
        {...hl('teres-minor-l', p, s, COLORS.yellow)} />
      <Path d="M125,200 L125,222 L131,231 L155,231 L159,200 Z"
        {...hl('teres-minor-r', p, s, COLORS.yellow)} />

      {/* TERES MAJOR */}
      <Path d="M69,225 L66,241 L68,257 L83,257 L88,252 L86,236 L91,225 Z"
        {...hl('teres-major-l', p, s, COLORS.cyan)} />
      <Path d="M128,225 L135,239 L133,253 L128,257 L133,254 L156,257 L154,225 Z"
        {...hl('teres-major-r', p, s, COLORS.cyan)} />

      {/* RHOMBOIDS */}
      <Path d="M78,142 L78,217 L154,217 L154,142 L116,142 L113,192 L108,142 Z"
        {...hl('rhomboids', p, s, COLORS.blue)} />

      {/* LATS */}
      <Path d="M30,192 L22,286 L37,287 L62,195 L71,325 L55,327 L79,327 L79,192 L43,192 L46,231 Z"
        {...hl('lats-l', p, s, COLORS.green)} />
      <Path d="M166,192 L190,287 L206,287 L197,192 L189,192 L184,233 L183,192 Z"
        {...hl('lats-r', p, s, COLORS.green)} />

      {/* ERECTOR SPINAE — narrow pillars beside spine */}
      <Rect x="98"  y="200" width="12" height="124" rx="6" {...hl('erectors-l', p, s, COLORS.orange)} />
      <Rect x="123" y="200" width="12" height="124" rx="6" {...hl('erectors-r', p, s, COLORS.orange)} />

      {/* TRICEPS */}
      <Path d="M32,145 L24,257 L49,257 L57,235 L57,145 Z"
        {...hl('triceps-l', p, s, COLORS.blue)} />
      <Path d="M175,145 L175,253 L204,257 L194,145 Z"
        {...hl('triceps-r', p, s, COLORS.blue)} />

      {/* FOREARMS */}
      <Path d="M52,248 L24,248 L22,286 L37,287 Z"
        {...hl('forearms-l', p, s, COLORS.purple)} />
      <Path d="M178,248 L178,260 L192,290 L206,287 L204,248 Z"
        {...hl('forearms-r', p, s, COLORS.purple)} />

      {/* GLUTE MEDIUS */}
      <Path d="M65,280 L71,325 L58,313 L53,339 L106,339 L111,280 Z"
        {...hl('glute-med-l', p, s, COLORS.cyan)} />
      <Path d="M121,280 L121,339 L168,339 L164,312 L154,323 L159,280 Z"
        {...hl('glute-med-r', p, s, COLORS.cyan)} />

      {/* GLUTEUS MAXIMUS */}
      <Path d="M55,328 L62,431 L93,431 L106,333 Z"
        {...hl('glute-max-l', p, s, COLORS.green)} />
      <Path d="M120,328 L127,429 L159,431 L169,381 L167,328 Z"
        {...hl('glute-max-r', p, s, COLORS.green)} />

      {/* BICEPS FEMORIS */}
      <Path d="M54,335 L63,426 L56,474 L93,474 L99,335 Z"
        {...hl('bf-l', p, s, COLORS.blue)} />
      <Path d="M133,335 L133,474 L164,474 L158,422 L168,335 Z"
        {...hl('bf-r', p, s, COLORS.blue)} />

      {/* SEMITENDINOSUS */}
      <Path d="M78,335 L78,474 L93,474 L106,335 Z"
        {...hl('semi-l', p, s, COLORS.orange)} />
      <Path d="M118,335 L127,429 L137,440 L127,474 L154,474 L154,335 Z"
        {...hl('semi-r', p, s, COLORS.orange)} />

      {/* GASTROCNEMIUS */}
      <Path d="M91,458 L57,461 L70,554 L74,518 L80,531 L85,525 Z"
        {...hl('gastroc-l', p, s, COLORS.purple)} />
      <Path d="M130,458 L128,495 L137,520 L146,517 L146,554 L153,554 L163,458 Z"
        {...hl('gastroc-r', p, s, COLORS.purple)} />

      {/* SOLEUS */}
      <Path d="M87,510 L61,510 L71,559 L74,518 L79,518 L83,531 Z"
        {...hl('soleus-l', p, s, COLORS.cyan)} />
      <Path d="M159,510 L141,510 L141,516 L146,517 L146,559 L154,552 Z"
        {...hl('soleus-r', p, s, COLORS.cyan)} />
    </G>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MuscleMap({
  primaryMuscles,
  secondaryMuscles,
  view = 'front',
  width = 50,
}: MuscleMapProps) {
  const primary   = useMemo(() => getRegionIds(primaryMuscles),   [primaryMuscles]);
  const secondary = useMemo(() => getRegionIds(secondaryMuscles), [secondaryMuscles]);

  const vw = view === 'front' ? FRONT_W : BACK_W;
  const vh = view === 'front' ? FRONT_H : BACK_H;
  const h  = view === 'front' ? width * (597 / 247) : width * (597 / 233);

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
        viewBox={`0 0 ${vw} ${vh}`}
        style={{ position: 'absolute', top: 0, left: 0, width, height: h }}
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
