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
      <Path d="M58,118 C48,128 44,146 50,161 C58,171 70,174 80,169 C88,161 91,148 88,134 C84,123 72,115 58,118 Z" {...hl('front-delts-l', p, s, C.yellow)} />
      <Path d="M188,118 C198,128 202,146 196,161 C188,171 176,174 166,169 C158,161 155,148 158,134 C162,123 174,115 188,118 Z" {...hl('front-delts-r', p, s, C.yellow)} />

      {/* LATERAL DELTOID — outer shoulder */}
      <Path d="M46,154 C38,168 36,191 42,211 C49,219 61,217 70,208 C74,192 73,173 67,158 C61,151 53,149 46,154 Z" {...hl('lat-delt-l', p, s, C.pink)} />
      <Path d="M200,154 C208,168 210,191 204,211 C197,219 185,217 176,208 C172,192 173,173 179,158 C185,151 193,149 200,154 Z" {...hl('lat-delt-r', p, s, C.pink)} />

      {/* CHEST — pectoralis major */}
      <Path d="M83,123 C75,130 72,143 73,157 C76,169 84,176 96,179 C105,181 112,180 119,176 C121,164 121,148 118,136 C114,127 107,121 97,119 C91,118 87,119 83,123 Z"
        {...hl('chest-l', p, s, C.red)} />
      <Path d="M163,123 C171,130 174,143 173,157 C170,169 162,176 150,179 C141,181 134,180 127,176 C125,164 125,148 128,136 C132,127 139,121 149,119 C155,118 159,119 163,123 Z"
        {...hl('chest-r', p, s, C.red)} />

      {/* BICEPS — upper arm */}
      <Path d="M46,165 C39,177 36,195 36,218 C37,244 42,268 49,284 C53,291 58,293 62,287 C66,275 67,255 66,231 C64,205 60,182 55,169 C52,164 49,163 46,165 Z" {...hl('biceps-l', p, s, C.blue)} />
      <Path d="M201,165 C208,177 211,195 211,218 C210,244 205,268 198,284 C194,291 189,293 185,287 C181,275 180,255 181,231 C183,205 187,182 192,169 C195,164 198,163 201,165 Z" {...hl('biceps-r', p, s, C.blue)} />

      {/* FOREARMS */}
      <Path d="M39,297 C33,310 31,329 32,349 C34,366 38,380 43,389 C48,391 53,389 56,383 C58,366 57,345 55,325 C52,308 46,296 39,297 Z" {...hl('forearms-l', p, s, C.orange)} />
      <Path d="M207,297 C213,310 215,329 214,349 C212,366 208,380 203,389 C198,391 193,389 190,383 C188,366 189,345 191,325 C194,308 200,296 207,297 Z" {...hl('forearms-r', p, s, C.orange)} />

      {/* SERRATUS ANTERIOR — ribcage fingers */}
      <Path d="M78,170 C70,184 69,244 76,270 C83,278 93,274 99,260 C98,232 97,196 92,174 C88,168 82,167 78,170 Z" {...hl('serratus-l', p, s, C.cyan)} />
      <Path d="M169,170 C177,184 178,244 171,270 C164,278 154,274 148,260 C149,232 150,196 155,174 C159,168 165,167 169,170 Z" {...hl('serratus-r', p, s, C.cyan)} />

      {/* ABS — 6-pack: 2 columns × 3 rows */}
      <Path d="M93,181 C89,188 88,198 89,208 C93,214 100,216 108,216 C113,214 117,211 119,205 C120,195 119,186 116,180 C109,176 98,176 93,181 Z" {...hl('abs-ul', p, s, C.green)} />
      <Path d="M129,181 C125,188 124,198 125,208 C129,214 136,216 144,216 C149,214 153,211 155,205 C156,195 155,186 152,180 C145,176 134,176 129,181 Z" {...hl('abs-ur', p, s, C.lime)} />
      <Path d="M93,221 C89,228 88,238 89,248 C93,254 99,256 106,256 C112,255 116,252 118,246 C119,236 118,227 115,221 C109,217 99,217 93,221 Z" {...hl('abs-ml', p, s, C.green)} />
      <Path d="M130,221 C126,228 125,238 126,248 C130,254 136,256 143,256 C149,255 153,252 155,246 C156,236 155,227 152,221 C146,217 136,217 130,221 Z" {...hl('abs-mr', p, s, C.lime)} />
      <Path d="M95,260 C91,268 90,277 91,287 C95,293 100,296 106,296 C111,295 115,291 117,285 C118,276 117,267 114,261 C109,258 100,257 95,260 Z" {...hl('abs-ll', p, s, C.green)} />
      <Path d="M131,260 C127,268 126,277 127,287 C131,293 136,296 142,296 C147,295 151,291 153,285 C154,276 153,267 150,261 C145,258 136,257 131,260 Z" {...hl('abs-lr', p, s, C.lime)} />

      {/* OBLIQUES — external oblique, diagonal side bands */}
      <Path d="M68,176 C61,188 57,207 56,230 C56,262 60,292 66,320 C72,331 79,336 87,336 C91,324 92,304 91,280 C89,243 85,208 80,183 C76,176 72,174 68,176 Z"
        {...hl('obliques-l', p, s, C.orange)} />
      <Path d="M179,176 C186,188 190,207 191,230 C191,262 187,292 181,320 C175,331 168,336 160,336 C156,324 155,304 156,280 C158,243 162,208 167,183 C171,176 175,174 179,176 Z"
        {...hl('obliques-r', p, s, C.orange)} />

      {/* TFL / HIP FLEXORS */}
      <Path d="M92,309 C85,319 86,344 94,358 C102,362 112,358 118,347 C117,332 114,319 107,309 C101,305 96,305 92,309 Z" {...hl('tfl-l', p, s, C.purple)} />
      <Path d="M155,309 C162,319 161,344 153,358 C145,362 135,358 129,347 C130,332 133,319 140,309 C146,305 151,305 155,309 Z" {...hl('tfl-r', p, s, C.purple)} />

      {/* VASTUS LATERALIS — outer quad */}
      <Path d="M78,363 C71,375 67,394 66,418 C66,445 70,471 77,494 C83,503 90,506 98,501 C102,482 103,454 101,423 C98,396 92,373 86,364 C83,362 80,362 78,363 Z"
        {...hl('vl-l', p, s, C.blue)} />
      <Path d="M168,363 C175,375 179,394 180,418 C180,445 176,471 169,494 C163,503 156,506 148,501 C144,482 143,454 145,423 C148,396 154,373 160,364 C163,362 166,362 168,363 Z"
        {...hl('vl-r', p, s, C.blue)} />

      {/* RECTUS FEMORIS — center quad strip */}
      <Path d="M104,365 C100,377 98,394 98,414 C98,441 101,468 106,491 C111,497 116,497 121,491 C124,468 124,441 123,415 C122,393 120,377 116,365 C112,362 108,362 104,365 Z" {...hl('rf-l', p, s, C.green)} />
      <Path d="M142,365 C146,377 148,394 148,414 C148,441 145,468 140,491 C135,497 130,497 125,491 C122,468 122,441 123,415 C124,393 126,377 130,365 C134,362 138,362 142,365 Z" {...hl('rf-r', p, s, C.lime)} />

      {/* VASTUS MEDIALIS — teardrop above knee */}
      <Ellipse cx="99"  cy="508" rx="11" ry="17" {...hl('vm-l', p, s, C.yellow)} />
      <Ellipse cx="150" cy="506" rx="10" ry="15" {...hl('vm-r', p, s, C.yellow)} />

      {/* SARTORIUS — diagonal ribbon across thigh */}
      <Path d="M118,365 C122,390 116,430 108,462 C103,478 97,490 94,495 C91,490 90,482 92,470 C98,447 108,405 112,380 Z"
        {...hl('sart-l', p, s, C.purple)} />
      <Path d="M129,365 C125,390 131,430 139,462 C144,478 150,490 153,495 C156,490 157,482 155,470 C149,447 139,405 135,380 Z"
        {...hl('sart-r', p, s, C.purple)} />

      {/* ADDUCTORS */}
      <Path d="M114,366 C110,389 111,443 116,489 C120,499 124,499 127,489 C129,445 128,392 124,367 C121,362 117,362 114,366 Z"
        {...hl('add-l', p, s, C.teal)} />
      <Path d="M133,366 C137,389 136,443 131,489 C127,499 123,499 120,489 C118,445 119,392 123,367 C126,362 130,362 133,366 Z"
        {...hl('add-r', p, s, C.teal)} />

      {/* TIBIALIS ANTERIOR — front shin */}
      <Path d="M89,511 C84,520 83,548 87,568 C92,574 100,573 106,567 C108,544 106,520 101,511 C97,508 92,508 89,511 Z" {...hl('tib-l', p, s, C.cyan)} />
      <Path d="M157,511 C162,520 163,548 159,568 C154,574 146,573 140,567 C138,544 140,520 145,511 C149,508 154,508 157,511 Z" {...hl('tib-r', p, s, C.cyan)} />

      {/* GASTROCNEMIUS — visible at shin sides from front */}
      <Path d="M70,512 C65,520 63,532 63,545 C65,556 69,565 75,569 C80,570 84,568 87,562 C89,548 88,531 84,518 C80,511 75,509 70,512 Z" {...hl('gastroc-l', p, s, C.teal)} />
      <Path d="M176,512 C181,520 183,532 183,545 C181,556 177,565 171,569 C166,570 162,568 159,562 C157,548 158,531 162,518 C166,511 171,509 176,512 Z" {...hl('gastroc-r', p, s, C.teal)} />
    </G>
  );
}

// ─── BACK OVERLAY ──────────────────────────────────────────────────────────
// anatomy-back.png is right half of anatomy source — same 247×597 coordinate space

function BackOverlay({ p, s }: { p: Set<string>; s: Set<string> }) {
  return (
    <G>
      {/* UPPER TRAPS — diamond cowl */}
      <Path d="M123,112 C142,116 170,128 184,143 C188,156 184,167 173,176 C158,184 140,189 123,191 C106,189 88,184 73,176 C62,167 58,156 62,143 C76,128 104,116 123,112 Z"
        {...hl('upper-traps', p, s, C.yellow)} />

      {/* REAR DELTS — shoulder caps */}
      <Path d="M60,119 C47,126 42,142 47,157 C56,167 69,169 80,162 C87,152 88,139 83,127 C76,119 68,116 60,119 Z" {...hl('rear-delts-l', p, s, C.orange)} />
      <Path d="M186,119 C199,126 204,142 199,157 C190,167 177,169 166,162 C159,152 158,139 163,127 C170,119 178,116 186,119 Z" {...hl('rear-delts-r', p, s, C.orange)} />

      {/* MID TRAPS */}
      <Path d="M71,173 C64,181 63,198 69,210 C77,213 85,210 92,202 C92,190 89,179 82,172 C78,170 74,170 71,173 Z" {...hl('mid-traps-l', p, s, C.blue)} />
      <Path d="M175,173 C182,181 183,198 177,210 C169,213 161,210 154,202 C154,190 157,179 164,172 C168,170 172,170 175,173 Z" {...hl('mid-traps-r', p, s, C.blue)} />

      {/* LOWER TRAPS */}
      <Path d="M73,210 C64,225 63,243 70,257 C84,252 100,247 114,243 C114,231 111,219 104,211 C93,208 82,208 73,210 Z"
        {...hl('lower-traps-l', p, s, C.cyan)} />
      <Path d="M173,210 C182,225 183,243 176,257 C162,252 146,247 132,243 C132,231 135,219 142,211 C153,208 164,208 173,210 Z"
        {...hl('lower-traps-r', p, s, C.cyan)} />

      {/* RHOMBOIDS */}
      <Path d="M93,149 C84,164 84,197 93,217 C107,223 138,223 153,217 C161,198 161,164 153,149 C139,143 107,143 93,149 Z" {...hl('rhomboids', p, s, C.purple)} />

      {/* INFRASPINATUS */}
      <Path d="M73,175 C63,181 60,196 65,209 C73,214 83,214 92,208 C96,197 95,184 88,176 C83,173 78,173 73,175 Z" {...hl('infra-l', p, s, C.pink)} />
      <Path d="M174,175 C184,181 187,196 182,209 C174,214 164,214 155,208 C151,197 152,184 159,176 C164,173 169,173 174,175 Z" {...hl('infra-r', p, s, C.pink)} />

      {/* TERES MAJOR / MINOR */}
      <Path d="M63,216 C56,221 54,230 58,238 C66,242 76,241 84,235 C86,227 84,220 77,216 C72,214 67,214 63,216 Z" {...hl('teres-l', p, s, C.cyan)} />
      <Path d="M184,216 C191,221 193,230 189,238 C181,242 171,241 163,235 C161,227 163,220 170,216 C175,214 180,214 184,216 Z" {...hl('teres-r', p, s, C.cyan)} />

      {/* LATS — large wings */}
      <Path d="M52,196 C43,208 39,226 38,248 C38,281 43,309 52,331 C59,339 68,342 78,341 C87,336 94,327 98,316 C99,289 96,259 90,229 C83,208 69,195 52,196 Z"
        {...hl('lats-l', p, s, C.green)} />
      <Path d="M194,196 C203,208 207,226 208,248 C208,281 203,309 194,331 C187,339 178,342 168,341 C159,336 152,327 148,316 C147,289 150,259 156,229 C163,208 177,195 194,196 Z"
        {...hl('lats-r', p, s, C.green)} />

      {/* ERECTOR SPINAE */}
      <Path d="M107,198 C101,214 100,286 105,338 C109,344 114,344 118,338 C121,288 120,215 115,198 C112,195 109,195 107,198 Z" {...hl('erectors-l', p, s, C.orange)} />
      <Path d="M139,198 C145,214 146,286 141,338 C137,344 132,344 128,338 C125,288 126,215 131,198 C134,195 137,195 139,198 Z" {...hl('erectors-r', p, s, C.orange)} />

      {/* TRICEPS */}
      <Path d="M41,157 C31,175 30,217 35,260 C39,282 46,292 55,289 C63,278 65,239 62,198 C59,174 51,155 41,157 Z" {...hl('triceps-l', p, s, C.blue)} />
      <Path d="M206,157 C216,175 217,217 212,260 C208,282 201,292 192,289 C184,278 182,239 185,198 C188,174 196,155 206,157 Z" {...hl('triceps-r', p, s, C.blue)} />

      {/* FOREARMS */}
      <Path d="M37,291 C30,308 30,343 36,371 C41,382 49,384 56,378 C60,360 60,324 55,297 C50,289 43,287 37,291 Z" {...hl('forearms-l', p, s, C.cyan)} />
      <Path d="M210,291 C217,308 217,343 211,371 C206,382 198,384 191,378 C187,360 187,324 192,297 C197,289 204,287 210,291 Z" {...hl('forearms-r', p, s, C.cyan)} />

      {/* GLUTE MEDIUS */}
      <Path d="M82,320 C72,326 69,339 74,349 C83,355 95,355 106,348 C109,339 107,328 99,321 C93,318 87,318 82,320 Z" {...hl('glute-med-l', p, s, C.lime)} />
      <Path d="M165,320 C175,326 178,339 173,349 C164,355 152,355 141,348 C138,339 140,328 148,321 C154,318 160,318 165,320 Z" {...hl('glute-med-r', p, s, C.lime)} />

      {/* GLUTEUS MAXIMUS */}
      <Path d="M62,338 C54,350 51,367 51,386 C53,405 59,421 69,432 C79,436 91,433 103,424 C111,414 116,400 117,385 C114,365 108,349 99,339 C87,333 73,332 62,338 Z"
        {...hl('glutes-l', p, s, C.yellow)} />
      <Path d="M184,338 C192,350 195,367 195,386 C193,405 187,421 177,432 C167,436 155,433 143,424 C135,414 130,400 129,385 C132,365 138,349 147,339 C159,333 173,332 184,338 Z"
        {...hl('glutes-r', p, s, C.yellow)} />

      {/* BICEPS FEMORIS — outer hamstring */}
      <Path d="M67,440 C61,451 58,468 58,488 C59,503 62,516 67,526 C71,529 76,528 80,523 C83,509 84,492 82,474 C80,456 76,444 71,439 C69,438 68,438 67,440 Z"
        {...hl('bf-l', p, s, C.blue)} />
      <Path d="M179,440 C185,451 188,468 188,488 C187,503 184,516 179,526 C175,529 170,528 166,523 C163,509 162,492 164,474 C166,456 170,444 175,439 C177,438 178,438 179,440 Z"
        {...hl('bf-r', p, s, C.blue)} />

      {/* SEMITENDINOSUS — inner hamstring */}
      <Path d="M98,440 C94,451 92,469 93,489 C94,504 97,517 101,525 C105,528 109,527 112,522 C114,509 114,492 112,474 C110,456 106,444 102,439 C100,438 99,438 98,440 Z"
        {...hl('semi-l', p, s, C.purple)} />
      <Path d="M148,440 C152,451 154,469 153,489 C152,504 149,517 145,525 C141,528 137,527 134,522 C132,509 132,492 134,474 C136,456 140,444 144,439 C146,438 147,438 148,440 Z"
        {...hl('semi-r', p, s, C.purple)} />

      {/* GASTROCNEMIUS — calf */}
      <Path d="M83,523 C75,530 71,543 71,557 C73,568 78,576 85,579 C92,579 98,575 101,568 C103,554 101,539 96,527 C92,522 87,520 83,523 Z" {...hl('gastroc-l', p, s, C.green)} />
      <Path d="M164,523 C172,530 176,543 176,557 C174,568 169,576 162,579 C155,579 149,575 146,568 C144,554 146,539 151,527 C155,522 160,520 164,523 Z" {...hl('gastroc-r', p, s, C.green)} />
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
