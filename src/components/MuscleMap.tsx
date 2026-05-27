/**
 * MuscleMap — anatomy base image + SVG color overlay.
 * Images: anatomy-front.png / anatomy-back.png (247×597 each).
 * Overlay coordinates calibrated from hand-painted muscle reference.
 */

import React, { useMemo } from 'react';
import { View, Image } from 'react-native';
import Svg, { Rect, Path, Ellipse, G } from 'react-native-svg';

const FRONT_W = 247;
const BACK_W = 233;
const IMG_H = 597;

const P = 0.78;  // primary opacity
const S = 0.42;  // secondary opacity

const C = {
  yellow: '#22C55E',
  red:    '#22C55E',
  green:  '#22C55E',
  blue:   '#22C55E',
  orange: '#22C55E',
  cyan:   '#22C55E',
  purple: '#22C55E',
  pink:   '#22C55E',
  lime:   '#22C55E',
  teal:   '#22C55E',
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
    'quadratus lumborum':   ['obliques-l','obliques-r'],
    'hip flexors':          ['tfl-l','tfl-r'],
    'tensor fasciae latae': ['tfl-l','tfl-r'],
    'chest':                ['chest-l','chest-r'],
    'pectorals':            ['chest-l','chest-r'],
    'pectoralis major':     ['chest-l','chest-r'],
    'upper pectoralis major': ['chest-l','chest-r'],
    'lower pectoralis major': ['chest-l','chest-r'],
    'upper chest':          ['chest-l','chest-r'],
    'lower chest':          ['chest-l','chest-r'],
    'front delts':          ['front-delts-l','front-delts-r'],
    'anterior deltoid':     ['front-delts-l','front-delts-r'],
    'anterior delts':       ['front-delts-l','front-delts-r'],
    'medial delts':         ['lat-delt-l','lat-delt-r'],
    'lateral delts':        ['front-delts-l','front-delts-r','lat-delt-l','lat-delt-r'],
    'deltoid':              ['front-delts-l','front-delts-r'],
    'delts':                ['front-delts-l','front-delts-r','lat-delt-l','lat-delt-r','rear-delts-l','rear-delts-r'],
    'shoulders':            ['front-delts-l','front-delts-r'],
    'rear delts':           ['rear-delts-l','rear-delts-r'],
    'posterior deltoid':    ['rear-delts-l','rear-delts-r'],
    'biceps':               ['biceps-l','biceps-r'],
    'biceps brachii':       ['biceps-l','biceps-r'],
    'brachialis':           ['biceps-l','biceps-r'],
    'triceps':              ['triceps-l','triceps-r'],
    'triceps brachii':      ['triceps-l','triceps-r'],
    'triceps lateral head': ['triceps-l','triceps-r'],
    'triceps medial head':  ['triceps-l','triceps-r'],
    'triceps long head':    ['triceps-l','triceps-r'],
    'lateral head':         ['triceps-l','triceps-r'],
    'medial head':          ['triceps-l','triceps-r'],
    'long head':            ['triceps-l','triceps-r'],
    'forearms':             ['forearms-l','forearms-r'],
    'forearm flexors':      ['forearms-l','forearms-r'],
    'forearm extensors':    ['forearms-l','forearms-r'],
    'brachioradialis':      ['forearms-l','forearms-r'],
    'pronators':            ['forearms-l','forearms-r'],
    'supinators':           ['forearms-l','forearms-r'],
    'grip':                 ['forearms-l','forearms-r'],
    'upper traps':          ['upper-traps'],
    'mid traps':            ['mid-traps-l','mid-traps-r'],
    'lower traps':          ['lower-traps-l','lower-traps-r'],
    'trapezius':            ['upper-traps','mid-traps-l','mid-traps-r'],
    'upper back':           ['upper-traps','rhomboids'],
    'rhomboids':            ['rhomboids'],
    'external rotators':    ['infra-l','infra-r','teres-l','teres-r'],
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
    'glute max':            ['glutes-l','glutes-r'],
    'gluteus maximus':      ['glutes-l','glutes-r'],
    'glute medius':         ['glute-med-l','glute-med-r'],
    'gluteus medius':       ['glute-med-l','glute-med-r'],
    'quads':                ['vl-l','rf-l','vm-l','vl-r','rf-r','vm-r'],
    'quadriceps':           ['vl-l','rf-l','vm-l','vl-r','rf-r','vm-r'],
    'legs':                 ['vl-l','rf-l','vm-l','vl-r','rf-r','vm-r','bf-l','bf-r','semi-l','semi-r','gastroc-l','gastroc-r'],
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
      <Path d="M95,115 L 78,112 L 68,116 L 60,122 L 55,132 L 54,141 L 52,144 L 56,158 L 58,158 L 70,144 L 73,133 L 84,122 L 95,118 Z" {...hl('front-delts-l', p, s, C.yellow)} />
      <Path d="M160,115 L 160,118 L 170,122 L 184,136 L 186,146 L 198,159 L 201,152 L 201,130 L 197,122 L 184,112 Z" {...hl('front-delts-r', p, s, C.yellow)} />

      {/* LATERAL DELTOID — outer shoulder */}
      <Path d="M46,148 C39,157 35,171 35,186 C38,197 46,205 56,208 C64,205 70,197 73,186 C73,171 67,157 58,148 C54,146 50,146 46,148 Z" {...hl('lat-delt-l', p, s, C.pink)} />
      <Path d="M201,148 C208,157 212,171 212,186 C209,197 201,205 191,208 C183,205 177,197 174,186 C174,171 180,157 189,148 C193,146 197,146 201,148 Z" {...hl('lat-delt-r', p, s, C.pink)} />

      {/* CHEST — pectoralis major */}
      <Path d="M75,139 L 77,156 L 87,173 L 93,176 L 105,177 L 118,169 L 121,163 L 120,155 L 117,155 L 111,150 L 95,143 L 79,138 Z" {...hl('chest-l', p, s, C.red)} />
      <Path d="M178,139 L 168,138 L 137,149 L 127,157 L 130,169 L 135,173 L 145,176 L 163,173 L 176,157 L 178,152 Z" {...hl('chest-r', p, s, C.red)} />

      {/* BICEPS — upper arm */}
      <Path d="M71,147 L 64,151 L 60,157 L 52,178 L 51,210 L 54,217 L 60,213 L 61,209 L 63,211 L 66,209 L 67,201 L 72,192 L 71,188 L 74,181 L 76,166 L 74,153 Z" {...hl('biceps-l', p, s, C.blue)} />
      <Path d="M183,147 L 180,163 L 183,194 L 188,208 L 193,211 L 193,214 L 196,217 L 201,217 L 204,207 L 204,180 L 194,156 L 188,148 Z" {...hl('biceps-r', p, s, C.blue)} />

      {/* FOREARMS */}
      <Path d="M45,202 L 40,221 L 39,261 L 37,272 L 51,242 L 52,246 L 48,264 L 59,249 L 60,254 L 58,259 L 61,257 L 69,239 L 72,226 L 70,221 L 69,224 L 68,220 L 64,217 L 56,226 L 54,232 L 53,216 L 49,212 Z" {...hl('forearms-l', p, s, C.orange)} />
      <Path d="M209,202 L 200,221 L 199,239 L 196,226 L 190,217 L 186,220 L 185,225 L 183,222 L 185,240 L 192,260 L 192,249 L 199,261 L 201,261 L 200,244 L 212,273 L 211,228 L 213,225 L 213,217 Z" {...hl('forearms-r', p, s, C.orange)} />

      {/* SERRATUS ANTERIOR — ribcage fingers */}
      <Path d="M121,152 L 120,140 L 115,131 L 116,121 L 106,123 L 96,128 L 83,130 L 79,136 L 80,138 L 105,146 L 117,154 L 120,154 Z" {...hl('serratus-l', p, s, C.cyan)} />
      <Path d="M127,153 L 129,148 L 134,149 L 160,139 L 178,136 L 167,130 L 138,122 L 134,126 L 133,132 L 129,138 Z" {...hl('serratus-r', p, s, C.cyan)} />

      {/* ABS — 6-pack: 2 columns × 3 rows */}
      <Path d="M120,172 L 111,173 L 99,183 L 98,202 L 104,202 L 99,206 L 99,215 L 121,215 L 123,212 L 123,195 L 117,195 L 112,198 L 109,197 L 120,191 L 122,188 L 122,174 Z" {...hl('abs-ul', p, s, C.green)} />
      <Path d="M128,172 L 126,175 L 126,188 L 140,198 L 138,199 L 130,194 L 127,195 L 126,214 L 149,215 L 149,206 L 143,202 L 144,200 L 149,202 L 149,182 L 147,178 L 141,175 Z" {...hl('abs-ur', p, s, C.lime)} />
      <Path d="M98,222 L 98,233 L 102,239 L 120,238 L 123,235 L 122,218 L 109,218 Z" {...hl('abs-ml', p, s, C.green)} />
      <Path d="M126,219 L 126,236 L 129,239 L 149,238 L 148,221 L 141,218 Z" {...hl('abs-mr', p, s, C.lime)} />
      <Path d="M100,241 L 101,258 L 104,264 L 107,279 L 123,279 L 123,246 L 120,245 L 118,241 Z" {...hl('abs-ll', p, s, C.green)} />
      <Path d="M130,241 L 125,247 L 125,279 L 142,279 L 148,261 L 148,242 Z" {...hl('abs-lr', p, s, C.lime)} />

      {/* OBLIQUES — external oblique, diagonal side bands */}
      <Path d="M83,235 L 83,254 L 91,266 L 95,268 L 94,245 Z M89,182 L 83,185 L 83,190 L 81,186 L 79,186 L 79,189 L 83,194 L 82,197 L 85,202 L 82,203 L 84,214 L 87,219 L 85,221 L 84,231 L 91,239 L 94,239 L 94,230 L 88,223 L 89,221 L 93,222 L 92,212 L 89,208 L 93,206 L 93,197 L 90,193 L 94,189 L 94,182 Z M79,170 L 80,183 L 84,183 L 93,178 Z" {...hl('obliques-l', p, s, C.orange)} />
      <Path d="M172,238 L 172,244 L 167,254 L 164,253 L 167,245 L 164,249 L 163,247 L 159,247 L 160,242 L 153,246 L 153,275 L 156,275 L 161,265 L 170,256 L 172,252 Z M176,169 L 154,177 L 158,180 L 154,181 L 155,191 L 167,191 L 168,189 L 171,194 L 165,201 L 159,198 L 160,194 L 163,193 L 160,193 L 155,198 L 156,208 L 159,208 L 162,205 L 164,206 L 156,213 L 155,223 L 160,225 L 155,230 L 155,237 L 157,239 L 161,239 L 163,237 L 165,238 L 170,231 L 170,224 L 168,229 L 166,227 L 167,225 L 164,227 L 162,225 L 165,221 L 163,220 L 166,217 L 167,218 L 166,217 L 168,215 L 170,216 L 168,215 L 172,204 L 167,202 L 170,200 L 170,195 L 175,193 L 176,183 L 172,187 L 171,185 L 165,184 L 176,179 Z" {...hl('obliques-r', p, s, C.orange)} />

      {/* TFL / HIP FLEXORS */}
      <Path d="M108,281 L 117,303 L 121,308 L 123,308 L 123,281 Z" {...hl('tfl-l', p, s, C.purple)} />
      <Path d="M141,281 L 138,288 L 137,281 L 125,281 L 125,308 L 132,308 L 136,296 L 135,297 L 134,294 L 136,292 L 137,293 Z" {...hl('tfl-r', p, s, C.purple)} />

      {/* VASTUS LATERALIS — outer quad */}
      <Path d="M90,292 L 87,294 L 77,313 L 73,329 L 72,344 L 73,383 L 81,400 L 87,400 L 88,402 L 97,356 L 97,341 L 93,323 Z" {...hl('vl-l', p, s, C.blue)} />
      <Path d="M161,292 L 159,322 L 155,334 L 155,364 L 163,396 L 166,400 L 167,396 L 168,398 L 174,398 L 177,395 L 181,385 L 180,336 L 173,313 L 164,294 Z" {...hl('vl-r', p, s, C.blue)} />

      {/* RECTUS FEMORIS — center quad strip */}
      <Path d="M90,276 L 94,323 L 98,333 L 100,349 L 102,351 L 110,392 L 110,408 L 105,419 L 105,424 L 111,424 L 114,411 L 112,391 L 113,375 L 105,328 L 101,317 L 99,295 L 93,279 Z" {...hl('rf-l', p, s, C.green)} />
      <Path d="M159,281 L 153,296 L 144,343 L 143,414 L 147,424 L 149,424 L 150,421 L 146,410 L 146,375 L 156,327 L 157,310 L 159,306 Z" {...hl('rf-r', p, s, C.lime)} />

      {/* VASTUS MEDIALIS — teardrop above knee */}
      <Path d="M100,350 L 96,377 L 91,395 L 92,412 L 96,419 L 105,417 L 109,407 L 109,393 L 107,390 L 103,360 Z M102,287 L 101,307 L 104,308 L 103,319 L 105,321 L 107,315 L 109,314 L 109,306 L 106,302 L 106,292 Z" {...hl('vm-l', p, s, C.yellow)} />
      <Path d="M152,347 L 148,370 L 148,411 L 153,418 L 159,419 L 162,410 L 162,394 L 153,362 Z M149,286 L 144,295 L 144,300 L 146,303 L 143,303 L 143,313 L 147,317 L 148,310 L 145,304 L 149,304 Z" {...hl('vm-r', p, s, C.yellow)} />

      {/* SARTORIUS — diagonal ribbon across thigh */}
      <Path d="M109,315 L 106,322 L 106,332 L 109,341 L 110,354 L 113,354 L 117,345 L 117,328 L 114,319 L 111,315 Z" {...hl('sart-l', p, s, C.purple)} />
      <Path d="M144,315 L 141,316 L 138,324 L 138,351 L 140,356 L 139,359 L 141,361 L 140,363 L 143,359 L 143,343 L 147,327 L 146,317 L 145,318 Z" {...hl('sart-r', p, s, C.purple)} />

      {/* ADDUCTORS */}
      <Path d="M116,245 L 117,255 L 118,249 L 119,256 L 117,264 L 115,251 L 115,260 L 113,260 L 113,252 L 113,293 L 121,308 L 125,308 L 125,266 L 123,255 L 124,265 L 122,265 L 121,256 L 121,261 L 119,261 L 120,247 L 123,246 Z" {...hl('add-l', p, s, C.teal)} />
      <Path d="M128,245 L 126,247 L 125,256 L 125,308 L 132,308 L 136,296 L 135,297 L 134,294 L 138,291 L 138,278 L 136,278 L 138,270 L 137,273 L 134,269 L 131,276 L 131,265 L 131,269 L 129,272 L 128,271 Z" {...hl('add-r', p, s, C.teal)} />

      {/* TIBIALIS ANTERIOR — front shin */}
      <Path d="M81,438 L 81,448 L 79,453 L 79,476 L 81,491 L 89,519 L 86,506 L 89,504 L 90,500 L 91,502 L 88,483 L 87,463 L 83,448 L 83,438 Z" {...hl('tib-l', p, s, C.cyan)} />
      <Path d="M178,450 L 173,467 L 173,483 L 175,485 L 172,491 L 173,494 L 169,511 L 167,511 L 168,514 L 166,517 L 166,523 L 170,523 L 180,479 L 180,454 Z" {...hl('tib-r', p, s, C.cyan)} />

      {/* GASTROCNEMIUS — visible at shin sides from front */}
      <Path d="M81,438 L 81,448 L 79,453 L 79,476 L 81,491 L 91,523 L 94,523 L 94,514 L 91,507 L 91,497 L 88,483 L 88,468 L 83,448 L 83,438 Z" {...hl('gastroc-l', p, s, C.teal)} />
      <Path d="M178,450 L 173,467 L 171,494 L 169,497 L 166,523 L 170,523 L 180,479 L 180,454 Z" {...hl('gastroc-r', p, s, C.teal)} />
    </G>
  );
}

// ─── BACK OVERLAY ──────────────────────────────────────────────────────────
// anatomy-back.png is right half of anatomy source — same 247×597 coordinate space

function BackOverlay({ p, s }: { p: Set<string>; s: Set<string> }) {
  return (
    <G>
      {/* UPPER TRAPS — diamond cowl */}
      <Path d="M123,108 C139,111 155,117 169,126 C178,135 183,146 183,157 C177,168 165,176 150,182 C141,184 132,186 123,186 C114,186 105,184 96,182 C81,176 69,168 63,157 C63,146 68,135 77,126 C91,117 107,111 123,108 Z"
        {...hl('upper-traps', p, s, C.yellow)} />

      {/* REAR DELTS — shoulder caps */}
      <Path d="M58,114 C48,120 43,130 42,142 C45,153 52,161 62,164 C70,163 77,157 81,148 C82,136 79,126 72,117 C67,113 62,112 58,114 Z" {...hl('rear-delts-l', p, s, C.orange)} />
      <Path d="M188,114 C198,120 203,130 204,142 C201,153 194,161 184,164 C176,163 169,157 165,148 C164,136 167,126 174,117 C179,113 184,112 188,114 Z" {...hl('rear-delts-r', p, s, C.orange)} />

      {/* MID TRAPS */}
      <Path d="M76,160 C69,168 66,180 67,192 C73,200 81,203 91,200 C96,192 97,181 94,170 C89,162 83,158 76,160 Z" {...hl('mid-traps-l', p, s, C.blue)} />
      <Path d="M170,160 C177,168 180,180 179,192 C173,200 165,203 155,200 C150,192 149,181 152,170 C157,162 163,158 170,160 Z" {...hl('mid-traps-r', p, s, C.blue)} />

      {/* LOWER TRAPS */}
      <Path d="M78,204 C70,216 68,231 72,245 C84,245 97,240 109,234 C111,223 108,212 101,205 C93,202 85,202 78,204 Z"
        {...hl('lower-traps-l', p, s, C.cyan)} />
      <Path d="M168,204 C176,216 178,231 174,245 C162,245 149,240 137,234 C135,223 138,212 145,205 C153,202 161,202 168,204 Z"
        {...hl('lower-traps-r', p, s, C.cyan)} />

      {/* RHOMBOIDS */}
      <Path d="M92,148 C86,158 86,172 89,186 C98,196 111,201 123,201 C135,201 148,196 157,186 C160,172 160,158 154,148 C145,143 134,142 123,142 C112,142 101,143 92,148 Z" {...hl('rhomboids', p, s, C.purple)} />

      {/* INFRASPINATUS */}
      <Path d="M72,176 C65,183 62,193 64,203 C71,209 79,211 88,208 C93,200 93,190 90,180 C84,175 78,173 72,176 Z" {...hl('infra-l', p, s, C.pink)} />
      <Path d="M174,176 C181,183 184,193 182,203 C175,209 167,211 158,208 C153,200 153,190 156,180 C162,175 168,173 174,176 Z" {...hl('infra-r', p, s, C.pink)} />

      {/* TERES MAJOR / MINOR */}
      <Path d="M61,212 C56,217 54,224 56,231 C62,236 70,236 78,232 C81,225 79,218 73,213 C69,211 65,211 61,212 Z" {...hl('teres-l', p, s, C.cyan)} />
      <Path d="M186,212 C191,217 193,224 191,231 C185,236 177,236 169,232 C166,225 168,218 174,213 C178,211 182,211 186,212 Z" {...hl('teres-r', p, s, C.cyan)} />

      {/* LATS — large wings */}
      <Path d="M51,194 C43,206 39,223 38,242 C39,271 42,298 49,323 C56,334 65,340 76,341 C85,334 92,324 96,311 C96,285 93,258 87,230 C81,209 68,195 51,194 Z"
        {...hl('lats-l', p, s, C.green)} />
      <Path d="M195,194 C203,206 207,223 208,242 C207,271 204,298 197,323 C190,334 181,340 170,341 C161,334 154,324 150,311 C150,285 153,258 159,230 C165,209 178,195 195,194 Z"
        {...hl('lats-r', p, s, C.green)} />

      {/* ERECTOR SPINAE */}
      <Path d="M111,195 C107,208 105,227 105,249 C106,279 109,308 113,336 C116,341 119,341 122,336 C123,307 123,278 121,248 C119,226 117,208 114,196 C113,194 112,194 111,195 Z" {...hl('erectors-l', p, s, C.orange)} />
      <Path d="M135,195 C139,208 141,227 141,249 C140,279 137,308 133,336 C130,341 127,341 124,336 C123,307 123,278 125,248 C127,226 129,208 132,196 C133,194 134,194 135,195 Z" {...hl('erectors-r', p, s, C.orange)} />

      {/* TRICEPS */}
      <Path d="M47,150 C40,162 36,179 35,199 C36,221 40,245 46,267 C50,278 56,282 62,277 C65,261 65,239 63,215 C60,189 55,166 50,152 C49,150 48,149 47,150 Z" {...hl('triceps-l', p, s, C.blue)} />
      <Path d="M200,150 C207,162 211,179 212,199 C211,221 207,245 201,267 C197,278 191,282 185,277 C182,261 182,239 184,215 C187,189 192,166 197,152 C198,150 199,149 200,150 Z" {...hl('triceps-r', p, s, C.blue)} />

      {/* FOREARMS */}
      <Path d="M41,266 C35,278 33,294 34,311 C36,327 40,343 45,357 C49,363 54,365 58,360 C60,344 59,326 57,308 C54,289 49,273 44,266 C43,265 42,265 41,266 Z" {...hl('forearms-l', p, s, C.cyan)} />
      <Path d="M206,266 C212,278 214,294 213,311 C211,327 207,343 202,357 C198,363 193,365 189,360 C187,344 188,326 190,308 C193,289 198,273 203,266 C204,265 205,265 206,266 Z" {...hl('forearms-r', p, s, C.cyan)} />

      {/* GLUTE MEDIUS */}
      <Path d="M83,318 C75,323 71,331 72,340 C79,346 88,348 98,345 C103,338 102,329 97,321 C92,318 87,317 83,318 Z" {...hl('glute-med-l', p, s, C.lime)} />
      <Path d="M164,318 C172,323 176,331 175,340 C168,346 159,348 149,345 C144,338 145,329 150,321 C155,318 160,317 164,318 Z" {...hl('glute-med-r', p, s, C.lime)} />

      {/* GLUTEUS MAXIMUS */}
      <Path d="M66,336 C58,345 53,359 52,374 C53,392 58,409 67,422 C77,429 90,429 102,420 C110,411 115,398 116,383 C113,365 107,350 98,339 C88,334 76,333 66,336 Z"
        {...hl('glutes-l', p, s, C.yellow)} />
      <Path d="M180,336 C188,345 193,359 194,374 C193,392 188,409 179,422 C169,429 156,429 144,420 C136,411 131,398 130,383 C133,365 139,350 148,339 C158,334 170,333 180,336 Z"
        {...hl('glutes-r', p, s, C.yellow)} />

      {/* BICEPS FEMORIS — outer hamstring */}
      <Path d="M69,430 C63,439 59,453 58,470 C58,486 61,502 66,517 C70,522 75,522 79,517 C82,503 83,488 81,471 C79,452 75,438 71,431 C70,430 69,429 69,430 Z"
        {...hl('bf-l', p, s, C.blue)} />
      <Path d="M177,430 C183,439 187,453 188,470 C188,486 185,502 180,517 C176,522 171,522 167,517 C164,503 163,488 165,471 C167,452 171,438 175,431 C176,430 177,429 177,430 Z"
        {...hl('bf-r', p, s, C.blue)} />

      {/* SEMITENDINOSUS — inner hamstring */}
      <Path d="M101,430 C97,439 94,453 94,469 C94,484 96,500 100,515 C103,520 107,520 110,516 C112,502 112,487 111,470 C109,452 106,438 103,431 C102,430 101,429 101,430 Z"
        {...hl('semi-l', p, s, C.purple)} />
      <Path d="M145,430 C149,439 152,453 152,469 C152,484 150,500 146,515 C143,520 139,520 136,516 C134,502 134,487 135,470 C137,452 140,438 143,431 C144,430 145,429 145,430 Z"
        {...hl('semi-r', p, s, C.purple)} />

      {/* GASTROCNEMIUS — calf */}
      <Path d="M81,498 C74,506 71,519 71,533 C73,548 77,561 84,572 C90,575 95,573 99,566 C101,551 100,534 96,516 C92,505 87,498 81,498 Z" {...hl('gastroc-l', p, s, C.green)} />
      <Path d="M166,498 C173,506 176,519 176,533 C174,548 170,561 163,572 C157,575 152,573 148,566 C146,551 147,534 151,516 C155,505 160,498 166,498 Z" {...hl('gastroc-r', p, s, C.green)} />
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

  const imageWidth = view === 'front' ? FRONT_W : BACK_W;
  const imageSource = view === 'front'
    ? require('../../assets/anatomy-front.png')
    : require('../../assets/anatomy-back.png');
  const h = width * (IMG_H / imageWidth);

  return (
    <View style={{ width, height: h, position: 'relative', overflow: 'hidden' }}>
        <Image
          source={imageSource}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
          resizeMode="stretch"
        />
        <Svg
          width={width}
          height={h}
          viewBox={`0 0 ${imageWidth} ${IMG_H}`}
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
