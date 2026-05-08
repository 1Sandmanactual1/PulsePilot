/**
 * MuscleMap — photorealistic anatomy base + transparent SVG green highlight overlay.
 *
 * Base images: anatomy-front.png (247x597) and anatomy-back.png (233x597).
 * Coordinates verified against pixel-sampled muscle boundaries.
 * Inactive muscles: fillOpacity=0. Active: semi-transparent green wash.
 */

import React, { useMemo } from 'react';
import { View, Image } from 'react-native';
import Svg, { Path, Rect, G } from 'react-native-svg';

const GREEN = '#22C55E';
const PRIMARY_OPACITY   = 0.46;
const SECONDARY_OPACITY = 0.22;

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

function hl(id: string, primary: Set<string>, secondary: Set<string>) {
  if (primary.has(id))   return { fill: GREEN, fillOpacity: PRIMARY_OPACITY };
  if (secondary.has(id)) return { fill: GREEN, fillOpacity: SECONDARY_OPACITY };
  return { fill: GREEN, fillOpacity: 0 };
}

// ─── FRONT OVERLAY ────────────────────────────────────────────────────────────
// viewBox 0 0 247 597. Pixel-sampled boundaries:
//   Deltoids y=105-150: left x=51-89, right x=158-196
//   Biceps   y=163-245: left x=43-70, right x=177-210
//   Forearms y=248-290: left x=42-60, right x=187-214
//   Tibialis y=457-537: left x=97-115, right x=132-183
//   Quads    y=335-455: left thigh x=68-114, right thigh x=134-190

function FrontOverlay({ p, s }: { p: Set<string>; s: Set<string> }) {
  return (
    <G>
      {/* FRONT DELTS — rounded shoulder cap */}
      <Path d="M84,105 C74,100 58,106 51,120 C45,133 50,145 60,150 C72,155 84,149 88,142 C93,132 92,115 84,105 Z"
        {...hl('front-delts-l', p, s)} />
      <Path d="M163,105 C173,100 189,106 196,120 C202,133 197,145 187,150 C175,155 163,149 159,142 C154,132 155,115 163,105 Z"
        {...hl('front-delts-r', p, s)} />

      {/* CHEST — D-shape pecs, sternum to outer */}
      <Path d="M77,108 C85,100 105,97 123,100 L123,168 C105,172 83,165 77,155 C70,145 70,120 77,108 Z"
        {...hl('chest-l', p, s)} />
      <Path d="M169,108 C161,100 141,97 123,100 L123,168 C141,172 163,165 169,155 C176,145 176,120 169,108 Z"
        {...hl('chest-r', p, s)} />

      {/* BICEPS — teardrop: narrow at deltoid insertion, wide belly, tapers to elbow */}
      <Path d="M68,163 C62,161 53,168 46,183 C39,200 41,221 50,238 C56,246 66,247 72,239 C79,220 77,196 72,177 C70,165 74,162 68,163 Z"
        {...hl('biceps-l', p, s)} />
      <Path d="M179,163 C185,161 194,168 201,183 C208,200 206,221 197,238 C191,246 181,247 175,239 C168,220 170,196 175,177 C177,165 173,162 179,163 Z"
        {...hl('biceps-r', p, s)} />

      {/* FOREARMS — tapered, wider at elbow, narrower at wrist */}
      <Path d="M66,248 C60,246 50,252 43,263 C38,274 40,284 47,290 C53,295 63,294 69,288 C75,278 73,260 66,248 Z"
        {...hl('forearms-l', p, s)} />
      <Path d="M181,248 C187,246 197,252 204,263 C209,274 207,284 200,290 C194,295 184,294 178,288 C172,278 174,260 181,248 Z"
        {...hl('forearms-r', p, s)} />

      {/* SERRATUS ANTERIOR — elongated oval on lateral ribcage */}
      <Path d="M72,164 C63,166 54,176 50,188 C47,199 50,210 58,214 C66,217 77,212 81,202 C85,190 83,172 72,164 Z"
        {...hl('serratus-l', p, s)} />
      <Path d="M175,164 C184,166 193,176 197,188 C200,199 197,210 189,214 C181,217 170,212 166,202 C162,190 164,172 175,164 Z"
        {...hl('serratus-r', p, s)} />

      {/* ABS — six rounded-rect segments, two columns three rows */}
      <Path d="M96,164 C91,165 88,171 89,179 C90,187 96,192 103,191 C110,190 114,183 112,174 C110,165 102,163 96,164 Z"
        {...hl('abs-ul', p, s)} />
      <Path d="M150,164 C156,165 159,171 158,179 C157,187 151,192 144,191 C137,190 133,183 135,174 C137,165 145,163 150,164 Z"
        {...hl('abs-ur', p, s)} />
      <Path d="M96,194 C91,195 88,200 89,208 C90,216 96,221 103,220 C110,219 114,212 112,203 C111,195 102,193 96,194 Z"
        {...hl('abs-ml', p, s)} />
      <Path d="M150,194 C155,195 159,200 158,208 C157,216 151,221 144,220 C137,219 133,212 135,203 C136,195 145,193 150,194 Z"
        {...hl('abs-mr', p, s)} />
      <Path d="M97,222 C92,223 89,228 90,236 C91,243 97,247 104,246 C111,245 115,238 113,230 C111,222 103,220 97,222 Z"
        {...hl('abs-ll', p, s)} />
      <Path d="M149,222 C154,223 158,228 157,236 C156,243 150,247 143,246 C136,245 132,238 134,230 C136,222 144,220 149,222 Z"
        {...hl('abs-lr', p, s)} />

      {/* OBLIQUES — sweep from lower ribs to iliac crest */}
      <Path d="M74,172 C70,180 67,205 67,232 C67,255 70,272 76,278 C82,280 92,275 94,265 C92,244 90,217 90,197 C90,182 87,172 82,171 Z"
        {...hl('obliques-l', p, s)} />
      <Path d="M172,172 C176,180 179,205 179,232 C179,255 176,272 170,278 C164,280 154,275 152,265 C154,244 156,217 156,197 C156,182 159,172 164,171 Z"
        {...hl('obliques-r', p, s)} />

      {/* TFL / HIP FLEXORS — small triangular outer-hip muscle */}
      <Path d="M78,289 C72,295 69,311 72,326 C75,334 83,337 90,332 C97,325 97,307 94,294 C91,284 84,282 78,289 Z"
        {...hl('tfl-l', p, s)} />
      <Path d="M169,289 C175,295 178,311 175,326 C172,334 164,337 157,332 C150,325 150,307 153,294 C156,284 163,282 169,289 Z"
        {...hl('tfl-r', p, s)} />

      {/* VASTUS LATERALIS — outer quad sweep */}
      <Path d="M75,335 C69,350 67,378 70,408 C72,430 76,448 82,454 C88,453 93,441 93,425 C91,400 87,370 83,348 C80,337 77,332 75,335 Z"
        {...hl('vl-l', p, s)} />
      <Path d="M172,335 C178,350 180,378 177,408 C175,430 171,448 165,454 C159,453 154,441 154,425 C156,400 160,370 164,348 C167,337 170,332 172,335 Z"
        {...hl('vl-r', p, s)} />

      {/* RECTUS FEMORIS — elongated central quad, wider mid, tapers at knee */}
      <Path d="M108,335 C110,345 111,370 111,395 C111,420 109,440 106,452 C101,458 95,455 92,447 C89,433 88,408 88,383 C88,358 89,340 92,335 C97,328 105,328 108,335 Z"
        {...hl('rf-l', p, s)} />
      <Path d="M139,335 C137,345 136,370 136,395 C136,420 138,440 141,452 C146,458 152,455 155,447 C158,433 159,408 159,383 C159,358 158,340 155,335 C150,328 142,328 139,335 Z"
        {...hl('rf-r', p, s)} />

      {/* VASTUS MEDIALIS — inner teardrop above knee */}
      <Path d="M113,424 C117,418 122,420 122,430 C122,441 118,453 113,457 C107,460 100,456 100,445 C100,434 104,423 113,424 Z"
        {...hl('vm-l', p, s)} />
      <Path d="M134,424 C130,418 125,420 125,430 C125,441 129,453 134,457 C140,460 147,456 147,445 C147,434 143,423 134,424 Z"
        {...hl('vm-r', p, s)} />

      {/* SARTORIUS — diagonal ribbon across quad */}
      <Path d="M118,330 C122,336 118,368 110,405 C105,428 96,447 90,450 C86,444 85,436 88,426 C94,403 103,365 107,338 Z"
        {...hl('sart-l', p, s)} />
      <Path d="M128,330 C124,336 128,368 136,405 C141,428 150,447 156,450 C160,444 161,436 158,426 C152,403 143,365 139,338 Z"
        {...hl('sart-r', p, s)} />

      {/* ADDUCTORS — inner thigh band */}
      <Path d="M112,345 C116,352 118,378 118,408 C118,430 117,448 114,454 C110,454 106,448 104,434 C102,412 102,382 105,358 Z"
        {...hl('add-l', p, s)} />
      <Path d="M134,345 C130,352 128,378 128,408 C128,430 129,448 132,454 C136,454 140,448 142,434 C144,412 144,382 141,358 Z"
        {...hl('add-r', p, s)} />

      {/* TIBIALIS ANTERIOR — long tapered wedge on front-lateral shin */}
      <Path d="M114,457 C117,463 117,480 113,504 C110,524 107,536 103,537 C99,537 96,529 97,508 C99,484 102,464 106,457 C109,452 113,452 114,457 Z"
        {...hl('tib-l', p, s)} />
      <Path d="M133,457 C130,463 130,480 134,504 C137,524 140,536 144,537 C148,537 151,529 150,508 C148,484 145,464 141,457 C138,452 134,452 133,457 Z"
        {...hl('tib-r', p, s)} />

      {/* GASTROCNEMIUS — medial calf head visible from front */}
      <Path d="M84,462 C77,466 71,479 72,495 C73,509 80,521 87,522 C92,520 95,510 94,494 C93,478 90,464 84,462 Z"
        {...hl('gastroc-l', p, s)} />
      <Path d="M163,462 C170,466 176,479 175,495 C174,509 167,521 160,522 C155,520 152,510 153,494 C154,478 157,464 163,462 Z"
        {...hl('gastroc-r', p, s)} />
    </G>
  );
}

// ─── BACK OVERLAY ─────────────────────────────────────────────────────────────
// viewBox 0 0 233 597. Pixel-sampled boundaries:
//   Rear delts y=108-152: left x=35-82,  right x=151-198  (was cx=20/213 — BIG FIX)
//   Triceps    y=152-248: left x=30-65,  right x=168-203  (was cx=11/222 — BIG FIX)
//   Forearms   y=247-290: left x=30-54,  right x=179-204  (was cx=9/224  — BIG FIX)
//   Teres min  y=206-226: left x=82-104, right x=129-151  (was cx=54/179 — BIG FIX)
//   Teres maj  y=225-248: left x=68-100, right x=133-165  (was cx=48/185 — BIG FIX)

function BackOverlay({ p, s }: { p: Set<string>; s: Set<string> }) {
  return (
    <G>
      {/* UPPER TRAPS — large diamond cowl from neck to mid-shoulder-blade */}
      <Path d="M116,100 C128,103 165,114 196,132 C204,142 200,154 190,162 C172,172 146,178 116,180 C86,178 60,172 42,162 C32,154 28,142 36,132 C67,114 104,103 116,100 Z"
        {...hl('upper-traps', p, s)} />

      {/* REAR DELTS — rounded D-shape, outer shoulder from back */}
      <Path d="M57,110 C44,110 34,118 33,130 C31,142 38,152 51,156 C65,160 80,152 84,140 C88,128 80,112 57,110 Z"
        {...hl('rear-delts-l', p, s)} />
      <Path d="M176,110 C189,110 199,118 200,130 C202,142 195,152 182,156 C168,160 153,152 149,140 C145,128 153,112 176,110 Z"
        {...hl('rear-delts-r', p, s)} />

      {/* INFRASPINATUS — fan across lower scapula */}
      <Path d="M57,166 C66,160 92,160 105,170 C112,180 108,197 98,206 C86,211 66,208 56,199 C47,191 46,174 57,166 Z"
        {...hl('infra-l', p, s)} />
      <Path d="M176,166 C167,160 141,160 128,170 C121,180 125,197 135,206 C147,211 167,208 177,199 C186,191 187,174 176,166 Z"
        {...hl('infra-r', p, s)} />

      {/* TERES MINOR — narrow band below infra */}
      <Path d="M84,207 C76,209 72,215 74,221 C76,227 84,231 94,229 C103,227 108,220 105,213 C101,207 91,205 84,207 Z"
        {...hl('teres-minor-l', p, s)} />
      <Path d="M149,207 C157,209 161,215 159,221 C157,227 149,231 139,229 C130,227 125,220 128,213 C132,207 142,205 149,207 Z"
        {...hl('teres-minor-r', p, s)} />

      {/* TERES MAJOR — slightly wider band below teres minor */}
      <Path d="M72,227 C64,230 60,237 63,245 C66,252 76,256 88,253 C99,250 104,242 100,234 C96,226 82,223 72,227 Z"
        {...hl('teres-major-l', p, s)} />
      <Path d="M161,227 C169,230 173,237 170,245 C167,252 157,256 145,253 C134,250 129,242 133,234 C137,226 151,223 161,227 Z"
        {...hl('teres-major-r', p, s)} />

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

      {/* LATS — large wings from armpit to low back */}
      <Path d="M22,198 C16,210 15,235 16,260 C17,283 20,302 26,312 C34,318 50,317 58,307 C64,294 66,272 64,248 C62,225 56,205 46,196 C38,191 27,193 22,198 Z"
        {...hl('lats-l', p, s)} />
      <Path d="M211,198 C217,210 218,235 217,260 C216,283 213,302 207,312 C199,318 183,317 175,307 C169,294 167,272 169,248 C171,225 177,205 187,196 C195,191 206,193 211,198 Z"
        {...hl('lats-r', p, s)} />

      {/* ERECTOR SPINAE — two narrow vertical pillars beside spine */}
      <Rect x="98"  y="200" width="12" height="124" rx="6" {...hl('erectors-l', p, s)} />
      <Rect x="123" y="200" width="12" height="124" rx="6" {...hl('erectors-r', p, s)} />

      {/* TRICEPS — posterior upper arm, teardrop wider at belly */}
      <Path d="M50,153 C42,155 34,163 30,180 C27,197 30,220 38,239 C44,249 54,251 61,245 C69,233 68,209 64,185 C60,165 58,151 50,153 Z"
        {...hl('triceps-l', p, s)} />
      <Path d="M183,153 C191,155 199,163 203,180 C206,197 203,220 195,239 C189,249 179,251 172,245 C164,233 165,209 169,185 C173,165 175,151 183,153 Z"
        {...hl('triceps-r', p, s)} />

      {/* FOREARMS — tapered, wider at elbow, narrower at wrist */}
      <Path d="M50,248 C44,246 34,252 28,264 C24,275 27,286 35,292 C42,297 52,295 57,287 C63,276 59,258 50,248 Z"
        {...hl('forearms-l', p, s)} />
      <Path d="M183,248 C189,246 199,252 205,264 C209,275 206,286 198,292 C191,297 181,295 176,287 C170,276 174,258 183,248 Z"
        {...hl('forearms-r', p, s)} />

      {/* GLUTE MEDIUS — curved fan on upper outer glute */}
      <Path d="M70,287 C64,293 62,309 66,323 C70,333 79,337 91,335 C102,331 107,319 103,307 C99,293 90,283 78,284 C74,284 71,285 70,287 Z"
        {...hl('glute-med-l', p, s)} />
      <Path d="M163,287 C169,293 171,309 167,323 C163,333 154,337 142,335 C131,331 126,319 130,307 C134,293 143,283 155,284 C159,284 162,285 163,287 Z"
        {...hl('glute-med-r', p, s)} />

      {/* GLUTEUS MAXIMUS */}
      <Path d="M32,332 C24,343 20,363 22,390 C24,410 32,422 44,424 C62,426 84,418 96,404 C102,392 102,370 96,352 C89,337 72,328 54,328 C44,328 36,330 32,332 Z"
        {...hl('glute-max-l', p, s)} />
      <Path d="M201,332 C209,343 213,363 211,390 C209,410 201,422 189,424 C171,426 149,418 137,404 C131,392 131,370 137,352 C144,337 161,328 179,328 C189,328 197,330 201,332 Z"
        {...hl('glute-max-r', p, s)} />

      {/* BICEPS FEMORIS — outer hamstring, elongated tapered lens */}
      <Path d="M65,342 C59,344 54,356 52,374 C50,392 52,418 57,440 C59,456 63,462 68,460 C73,458 77,446 77,424 C77,400 75,376 72,358 C69,346 68,340 65,342 Z"
        {...hl('bf-l', p, s)} />
      <Path d="M168,342 C174,344 179,356 181,374 C183,392 181,418 176,440 C174,456 170,462 165,460 C160,458 156,446 156,424 C156,400 158,376 161,358 C164,346 165,340 168,342 Z"
        {...hl('bf-r', p, s)} />

      {/* SEMITENDINOSUS — inner hamstring, parallel ribbon */}
      <Path d="M89,342 C83,344 79,356 77,374 C76,392 77,418 81,440 C83,456 88,462 93,460 C98,458 102,446 101,424 C101,400 99,376 97,358 C94,346 92,340 89,342 Z"
        {...hl('semi-l', p, s)} />
      <Path d="M144,342 C150,344 154,356 156,374 C157,392 156,418 152,440 C150,456 145,462 140,460 C135,458 131,446 132,424 C132,400 134,376 136,358 C139,346 141,340 144,342 Z"
        {...hl('semi-r', p, s)} />

      {/* GASTROCNEMIUS — diamond/heart shape, two-lobe calf */}
      <Path d="M74,460 C65,463 58,476 58,493 C59,510 66,525 74,529 C81,527 88,517 87,499 C86,481 80,463 74,460 Z"
        {...hl('gastroc-l', p, s)} />
      <Path d="M159,460 C168,463 175,476 175,493 C174,510 167,525 159,529 C152,527 145,517 146,499 C147,481 153,463 159,460 Z"
        {...hl('gastroc-r', p, s)} />

      {/* SOLEUS — broad base below gastroc */}
      <Path d="M68,516 C62,518 57,526 58,535 C59,543 65,549 72,548 C79,547 84,540 82,531 C80,522 74,514 68,516 Z"
        {...hl('soleus-l', p, s)} />
      <Path d="M165,516 C171,518 176,526 175,535 C174,543 168,549 161,548 C154,547 149,540 151,531 C153,522 159,514 165,516 Z"
        {...hl('soleus-r', p, s)} />
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
