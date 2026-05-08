/**
 * MuscleMap — photorealistic anatomy base + transparent SVG green highlight overlay.
 *
 * Base images: anatomy-front.png (247x597) and anatomy-back.png (233x597).
 * SVG overlay uses exact viewBox per image. Inactive muscles: fillOpacity=0
 * (fully transparent — image shows through with all muscle detail visible).
 * Active muscles: semi-transparent green wash, muscle texture still visible beneath.
 */

import React, { useMemo } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import Svg, { Ellipse, Path, Rect, G } from 'react-native-svg';

// ─── Constants ────────────────────────────────────────────────────────────────

const GREEN = '#22C55E';
// Primary highlight: visible but translucent enough to see muscle fibers beneath
const PRIMARY_OPACITY   = 0.46;
// Secondary highlight: subtle tint
const SECONDARY_OPACITY = 0.22;

// Each image has its own viewBox matching exact pixel dimensions
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
  height?: number;
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

function normalizeMuscleName(name: string): string[] {
  const n = name.toLowerCase().trim();
  const map: Record<string, string[]> = {
    // ABS
    'rectus abdominis':      ['abs-ul','abs-ur','abs-ml','abs-mr','abs-ll','abs-lr'],
    'transverse abdominis':  ['abs-ul','abs-ur','abs-ml','abs-mr','abs-ll','abs-lr'],
    'lower rectus abdominis':['abs-ll','abs-lr'],
    'abs':                   ['abs-ul','abs-ur','abs-ml','abs-mr','abs-ll','abs-lr'],
    'core':                  ['abs-ul','abs-ur','abs-ml','abs-mr','abs-ll','abs-lr'],
    'serratus anterior':     ['serratus-l','serratus-r'],
    // OBLIQUES
    'obliques':              ['obliques-l','obliques-r'],
    'external obliques':     ['obliques-l','obliques-r'],
    'internal obliques':     ['obliques-l','obliques-r'],
    // HIP FLEXORS / TFL
    'hip flexors':           ['tfl-l','tfl-r'],
    'tensor fasciae latae':  ['tfl-l','tfl-r'],
    // CHEST
    'chest':                 ['chest-l','chest-r'],
    'pectorals':             ['chest-l','chest-r'],
    'pectoralis major':      ['chest-l','chest-r'],
    'upper chest':           ['chest-l','chest-r'],
    'lower chest':           ['chest-l','chest-r'],
    // SHOULDERS front
    'front delts':           ['front-delts-l','front-delts-r'],
    'anterior delts':        ['front-delts-l','front-delts-r'],
    'lateral delts':         ['front-delts-l','front-delts-r'],
    'deltoid':               ['front-delts-l','front-delts-r'],
    'shoulders':             ['front-delts-l','front-delts-r'],
    // SHOULDERS back
    'rear delts':            ['rear-delts-l','rear-delts-r'],
    'posterior deltoid':     ['rear-delts-l','rear-delts-r'],
    // BICEPS
    'biceps':                ['biceps-l','biceps-r'],
    'biceps brachii':        ['biceps-l','biceps-r'],
    'brachialis':            ['biceps-l','biceps-r'],
    // TRICEPS
    'triceps':               ['triceps-l','triceps-r'],
    'triceps brachii':       ['triceps-l','triceps-r'],
    // FOREARMS
    'forearms':              ['forearms-l','forearms-r'],
    'brachioradialis':       ['forearms-l','forearms-r'],
    'grip':                  ['forearms-l','forearms-r'],
    // TRAPS
    'upper traps':           ['upper-traps'],
    'mid traps':             ['mid-traps-l','mid-traps-r'],
    'lower traps':           ['lower-traps-l','lower-traps-r'],
    'trapezius':             ['upper-traps','mid-traps-l','mid-traps-r','lower-traps-l','lower-traps-r'],
    'upper back':            ['upper-traps','mid-traps-l','mid-traps-r'],
    // RHOMBOIDS / INFRA / TERES
    'rhomboids':             ['rhomboids'],
    'infraspinatus':         ['infra-l','infra-r'],
    'teres minor':           ['teres-minor-l','teres-minor-r'],
    'teres major':           ['teres-major-l','teres-major-r'],
    // LATS
    'lats':                  ['lats-l','lats-r'],
    'latissimus dorsi':      ['lats-l','lats-r'],
    'mid back':              ['lats-l','lats-r'],
    // ERECTORS
    'spinal erectors':       ['erectors-l','erectors-r'],
    'erector spinae':        ['erectors-l','erectors-r'],
    'quadratus lumborum':    ['erectors-l','erectors-r'],
    // GLUTES
    'glutes':                ['glute-med-l','glute-med-r','glute-max-l','glute-max-r'],
    'gluteus maximus':       ['glute-max-l','glute-max-r'],
    'glute medius':          ['glute-med-l','glute-med-r'],
    'gluteus medius':        ['glute-med-l','glute-med-r'],
    // QUADS
    'quads':                 ['vl-l','rf-l','vm-l','vl-r','rf-r','vm-r'],
    'quadriceps':            ['vl-l','rf-l','vm-l','vl-r','rf-r','vm-r'],
    'vastus lateralis':      ['vl-l','vl-r'],
    'rectus femoris':        ['rf-l','rf-r'],
    'vastus medialis':       ['vm-l','vm-r'],
    'adductors':             ['add-l','add-r'],
    'sartorius':             ['sart-l','sart-r'],
    // HAMSTRINGS
    'hamstrings':            ['bf-l','bf-r','semi-l','semi-r'],
    'biceps femoris':        ['bf-l','bf-r'],
    'semitendinosus':        ['semi-l','semi-r'],
    'semimembranosus':       ['semi-l','semi-r'],
    // CALVES
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

function hl(id: string, primary: Set<string>, secondary: Set<string>) {
  if (primary.has(id))   return { fill: GREEN, fillOpacity: PRIMARY_OPACITY };
  if (secondary.has(id)) return { fill: GREEN, fillOpacity: SECONDARY_OPACITY };
  return { fill: GREEN, fillOpacity: 0 };
}

// ─── FRONT OVERLAY ────────────────────────────────────────────────────────────
// viewBox: 0 0 247 597
// Front figure: x=0–246, y=11–591, center x=123
// Coordinates scaled to exactly match anatomy-front.png pixel positions

function FrontOverlay({ p, s }: { p: Set<string>; s: Set<string> }) {
  return (
    <G>
      {/* FRONT DELTS */}
      <Ellipse cx="25"  cy="120" rx="20" ry="24" {...hl('front-delts-l', p, s)} />
      <Ellipse cx="221" cy="120" rx="20" ry="24" {...hl('front-delts-r', p, s)} />

      {/* CHEST — left pec (D-shape, sternum to outer) */}
      <Path d="M77,108 C85,100 105,97 123,100 L123,168 C105,172 83,165 77,155 C70,145 70,120 77,108 Z"
        {...hl('chest-l', p, s)} />
      {/* CHEST — right pec */}
      <Path d="M169,108 C161,100 141,97 123,100 L123,168 C141,172 163,165 169,155 C176,145 176,120 169,108 Z"
        {...hl('chest-r', p, s)} />

      {/* BICEPS */}
      <Ellipse cx="14"  cy="200" rx="12" ry="33" {...hl('biceps-l', p, s)} />
      <Ellipse cx="233" cy="200" rx="12" ry="33" {...hl('biceps-r', p, s)} />

      {/* FOREARMS */}
      <Ellipse cx="13"  cy="263" rx="10" ry="27" {...hl('forearms-l', p, s)} />
      <Ellipse cx="234" cy="263" rx="10" ry="27" {...hl('forearms-r', p, s)} />

      {/* SERRATUS ANTERIOR */}
      <Ellipse cx="76"  cy="188" rx="9"  ry="24" {...hl('serratus-l', p, s)} />
      <Ellipse cx="170" cy="188" rx="9"  ry="24" {...hl('serratus-r', p, s)} />

      {/* ABS — 6-pack: two columns, three rows */}
      <Ellipse cx="108" cy="175" rx="12" ry="13" {...hl('abs-ul', p, s)} />
      <Ellipse cx="138" cy="175" rx="12" ry="13" {...hl('abs-ur', p, s)} />
      <Ellipse cx="107" cy="205" rx="11" ry="12" {...hl('abs-ml', p, s)} />
      <Ellipse cx="139" cy="205" rx="11" ry="12" {...hl('abs-mr', p, s)} />
      <Ellipse cx="108" cy="233" rx="10" ry="11" {...hl('abs-ll', p, s)} />
      <Ellipse cx="138" cy="233" rx="10" ry="11" {...hl('abs-lr', p, s)} />

      {/* OBLIQUES */}
      <Path d="M74,172 C70,180 67,205 67,232 C67,255 70,272 76,278 C82,280 92,275 94,265 C92,244 90,217 90,197 C90,182 87,172 82,171 Z"
        {...hl('obliques-l', p, s)} />
      <Path d="M172,172 C176,180 179,205 179,232 C179,255 176,272 170,278 C164,280 154,275 152,265 C154,244 156,217 156,197 C156,182 159,172 164,171 Z"
        {...hl('obliques-r', p, s)} />

      {/* TFL / HIP FLEXORS */}
      <Ellipse cx="82"  cy="307" rx="13" ry="17" {...hl('tfl-l', p, s)} />
      <Ellipse cx="163" cy="307" rx="13" ry="17" {...hl('tfl-r', p, s)} />

      {/* VASTUS LATERALIS (outer quad) */}
      <Path d="M63,332 C57,345 55,375 57,408 C59,432 63,450 70,456 C77,453 83,443 85,428 C83,403 79,373 77,348 C75,335 70,328 63,332 Z"
        {...hl('vl-l', p, s)} />
      <Path d="M183,332 C189,345 191,375 189,408 C187,432 183,450 176,456 C169,453 163,443 161,428 C163,403 167,373 169,348 C171,335 176,328 183,332 Z"
        {...hl('vl-r', p, s)} />

      {/* RECTUS FEMORIS (center quad) */}
      <Ellipse cx="100" cy="390" rx="11" ry="55" {...hl('rf-l', p, s)} />
      <Ellipse cx="146" cy="390" rx="11" ry="55" {...hl('rf-r', p, s)} />

      {/* VASTUS MEDIALIS (inner teardrop above knee) */}
      <Ellipse cx="109" cy="440" rx="12" ry="17" {...hl('vm-l', p, s)} />
      <Ellipse cx="137" cy="440" rx="12" ry="17" {...hl('vm-r', p, s)} />

      {/* SARTORIUS (diagonal ribbon) */}
      <Path d="M118,330 C122,336 118,368 110,405 C105,428 96,447 90,450 C86,444 85,436 88,426 C94,403 103,365 107,338 Z"
        {...hl('sart-l', p, s)} />
      <Path d="M128,330 C124,336 128,368 136,405 C141,428 150,447 156,450 C160,444 161,436 158,426 C152,403 143,365 139,338 Z"
        {...hl('sart-r', p, s)} />

      {/* ADDUCTORS (inner thigh) */}
      <Path d="M112,345 C116,352 118,378 118,408 C118,430 117,448 114,454 C110,454 106,448 104,434 C102,412 102,382 105,358 Z"
        {...hl('add-l', p, s)} />
      <Path d="M134,345 C130,352 128,378 128,408 C128,430 129,448 132,454 C136,454 140,448 142,434 C144,412 144,382 141,358 Z"
        {...hl('add-r', p, s)} />

      {/* TIBIALIS ANTERIOR (front of shin) */}
      <Ellipse cx="82"  cy="503" rx="8"  ry="34" {...hl('tib-l', p, s)} />
      <Ellipse cx="163" cy="503" rx="8"  ry="34" {...hl('tib-r', p, s)} />

      {/* GASTROCNEMIUS (visible at outer edge from front) */}
      <Ellipse cx="72"  cy="494" rx="9"  ry="26" {...hl('gastroc-l', p, s)} />
      <Ellipse cx="174" cy="494" rx="9"  ry="26" {...hl('gastroc-r', p, s)} />
    </G>
  );
}

// ─── BACK OVERLAY ─────────────────────────────────────────────────────────────
// viewBox: 0 0 233 597
// Back figure: x=0–232, y=12–589, center x=116
// Coordinates scaled to exactly match anatomy-back.png pixel positions

function BackOverlay({ p, s }: { p: Set<string>; s: Set<string> }) {
  return (
    <G>
      {/* UPPER TRAPS — large diamond cowl from neck to mid-shoulder-blade */}
      <Path d="M116,100 C128,103 165,114 196,132 C204,142 200,154 190,162 C172,172 146,178 116,180 C86,178 60,172 42,162 C32,154 28,142 36,132 C67,114 104,103 116,100 Z"
        {...hl('upper-traps', p, s)} />

      {/* REAR DELTS */}
      <Ellipse cx="20"  cy="138" rx="18" ry="21" {...hl('rear-delts-l', p, s)} />
      <Ellipse cx="213" cy="138" rx="18" ry="21" {...hl('rear-delts-r', p, s)} />

      {/* INFRASPINATUS */}
      <Ellipse cx="66"  cy="185" rx="20" ry="18" {...hl('infra-l', p, s)} />
      <Ellipse cx="167" cy="185" rx="20" ry="18" {...hl('infra-r', p, s)} />

      {/* TERES MINOR */}
      <Ellipse cx="54"  cy="212" rx="12" ry="9"  {...hl('teres-minor-l', p, s)} />
      <Ellipse cx="179" cy="212" rx="12" ry="9"  {...hl('teres-minor-r', p, s)} />

      {/* TERES MAJOR */}
      <Ellipse cx="48"  cy="230" rx="12" ry="11" {...hl('teres-major-l', p, s)} />
      <Ellipse cx="185" cy="230" rx="12" ry="11" {...hl('teres-major-r', p, s)} />

      {/* RHOMBOIDS — diamond between shoulder blades */}
      <Path d="M82,150 C92,144 116,142 140,144 C150,150 154,168 150,188 C138,198 116,203 94,198 C82,186 78,168 82,150 Z"
        {...hl('rhomboids', p, s)} />

      {/* MID TRAPS */}
      <Path d="M20,178 C30,174 52,175 72,180 L72,203 C52,206 30,203 20,197 Z"
        {...hl('mid-traps-l', p, s)} />
      <Path d="M213,178 C203,174 181,175 161,180 L161,203 C181,206 203,203 213,197 Z"
        {...hl('mid-traps-r', p, s)} />

      {/* LOWER TRAPS — V-shape below mid traps */}
      <Path d="M20,205 C30,202 55,204 74,210 C84,224 88,242 82,256 C64,250 38,242 24,230 C18,222 16,212 20,205 Z"
        {...hl('lower-traps-l', p, s)} />
      <Path d="M213,205 C203,202 178,204 159,210 C149,224 145,242 151,256 C169,250 195,242 209,230 C215,222 217,212 213,205 Z"
        {...hl('lower-traps-r', p, s)} />

      {/* LATS — large wings from armpit down to low back */}
      <Path d="M22,198 C16,210 15,235 16,260 C17,283 20,302 26,312 C34,318 50,317 58,307 C64,294 66,272 64,248 C62,225 56,205 46,196 C38,191 27,193 22,198 Z"
        {...hl('lats-l', p, s)} />
      <Path d="M211,198 C217,210 218,235 217,260 C216,283 213,302 207,312 C199,318 183,317 175,307 C169,294 167,272 169,248 C171,225 177,205 187,196 C195,191 206,193 211,198 Z"
        {...hl('lats-r', p, s)} />

      {/* ERECTOR SPINAE — two narrow vertical pillars */}
      <Rect x="98"  y="200" width="12" height="124" rx="6" {...hl('erectors-l', p, s)} />
      <Rect x="113" y="200" width="12" height="124" rx="6" {...hl('erectors-r', p, s)} />

      {/* TRICEPS */}
      <Ellipse cx="11"  cy="204" rx="11" ry="35" {...hl('triceps-l', p, s)} />
      <Ellipse cx="222" cy="204" rx="11" ry="35" {...hl('triceps-r', p, s)} />

      {/* FOREARMS */}
      <Ellipse cx="9"   cy="265" rx="9"  ry="25" {...hl('forearms-l', p, s)} />
      <Ellipse cx="224" cy="265" rx="9"  ry="25" {...hl('forearms-r', p, s)} />

      {/* GLUTE MEDIUS */}
      <Ellipse cx="72"  cy="320" rx="18" ry="13" {...hl('glute-med-l', p, s)} />
      <Ellipse cx="161" cy="320" rx="18" ry="13" {...hl('glute-med-r', p, s)} />

      {/* GLUTEUS MAXIMUS */}
      <Path d="M32,332 C24,343 20,363 22,390 C24,410 32,422 44,424 C62,426 84,418 96,404 C102,392 102,370 96,352 C89,337 72,328 54,328 C44,328 36,330 32,332 Z"
        {...hl('glute-max-l', p, s)} />
      <Path d="M201,332 C209,343 213,363 211,390 C209,410 201,422 189,424 C171,426 149,418 137,404 C131,392 131,370 137,352 C144,337 161,328 179,328 C189,328 197,330 201,332 Z"
        {...hl('glute-max-r', p, s)} />

      {/* BICEPS FEMORIS (outer hamstring) */}
      <Ellipse cx="62"  cy="452" rx="15" ry="44" {...hl('bf-l', p, s)} />
      <Ellipse cx="171" cy="452" rx="15" ry="44" {...hl('bf-r', p, s)} />

      {/* SEMITENDINOSUS / SEMIMEMBRANOSUS (inner hamstring) */}
      <Ellipse cx="88"  cy="450" rx="12" ry="42" {...hl('semi-l', p, s)} />
      <Ellipse cx="145" cy="450" rx="12" ry="42" {...hl('semi-r', p, s)} />

      {/* GASTROCNEMIUS */}
      <Ellipse cx="74"  cy="508" rx="13" ry="33" {...hl('gastroc-l', p, s)} />
      <Ellipse cx="159" cy="508" rx="13" ry="33" {...hl('gastroc-r', p, s)} />

      {/* SOLEUS */}
      <Ellipse cx="61"  cy="524" rx="7"  ry="20" {...hl('soleus-l', p, s)} />
      <Ellipse cx="172" cy="524" rx="7"  ry="20" {...hl('soleus-r', p, s)} />
    </G>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function MuscleMap({
  primaryMuscles,
  secondaryMuscles,
  view = 'front',
  width = 50,
  height = 100,
}: MuscleMapProps) {
  const primary   = useMemo(() => getRegionIds(primaryMuscles),   [primaryMuscles]);
  const secondary = useMemo(() => getRegionIds(secondaryMuscles), [secondaryMuscles]);

  const vw = view === 'front' ? FRONT_W : BACK_W;
  const vh = view === 'front' ? FRONT_H : BACK_H;

  return (
    <View style={{ width, height, position: 'relative', overflow: 'hidden' }}>
      <Image
        source={view === 'front'
          ? require('../../assets/anatomy-front.png')
          : require('../../assets/anatomy-back.png')}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
        resizeMode="stretch"
      />
      <Svg
        width={width}
        height={height}
        viewBox={`0 0 ${vw} ${vh}`}
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
