/**
 * Cape template generators
 * Capes are the most versatile LEGO fabric element
 */

import { Template, TemplateParams, generateAttachmentHole } from './base';
import { SVGPath, scallopedPath } from '../geometry/primitives';
import { SeededRNG } from '../utils/rng';
import { FLAME_PROFILE, drawStyledEdge } from '../geometry/edgeStyles';
import type { PatternExport } from '../utils/types';

/** Reference cape height in mm — upper portion stays fixed at this scale */
const REF_H = 39;

/**
 * Profile descriptor for parameterized outline drawing.
 * Allows the same hem/side style code to work with different cape shapes.
 */
interface CapeOutlineProfile {
  sideTopYFrac: number;
  sideBotYFrac: number;
  sideLeftXFrac: number;
  sideRightXFrac: number;
  shoulderH?: number;
  /** Y-fraction of the shoulder peak where the neck meets the side edge.
   *  When set, drawStyledRightSide will lineTo the shoulder peak after
   *  finishing the styled edge so closeRefNeck starts from the correct position. */
  shoulderPeakYFrac?: number;
  /** X-fraction of the right shoulder peak. Mirror of left. */
  shoulderPeakXFrac?: number;
  sideProfileFn: (yFrac: number) => number;
  drawRefLeft: (path: SVGPath, w: number, h: number, hemW: number, shH?: number) => void;
  drawRefRight: (path: SVGPath, w: number, h: number, hemW: number, shH?: number) => void;
  drawRefHem: (path: SVGPath, w: number, h: number, hemW: number) => void;
}

/**
 * Draw the reference cape outline — 25 symmetric cubic beziers per side.
 * Traced from standard-cape.svg, left side as authority, right side mirrored.
 *
 * Draws from left shoulder peak → left side → bottom → right side → right shoulder peak.
 * Caller must already be at the left shoulder peak position.
 */
function drawRefOutline(path: SVGPath, w: number, h: number) {
  // --- Left side: 14 smoothed cubics from shoulder peak down to side bottom ---
  path.cubicBezierTo(w * 0.34058, h * 0.01217, w * 0.31290, h * 0.01849, w * 0.30793, h * 0.02040);
  path.cubicBezierTo(w * 0.29702, h * 0.02459, w * 0.28376, h * 0.03298, w * 0.27895, h * 0.03873);
  path.cubicBezierTo(w * 0.27002, h * 0.04942, w * 0.25938, h * 0.06828, w * 0.23779, h * 0.11174);
  path.cubicBezierTo(w * 0.22615, h * 0.13518, w * 0.21624, h * 0.15492, w * 0.21578, h * 0.15561);
  path.cubicBezierTo(w * 0.21459, h * 0.15739, w * 0.19440, h * 0.20213, w * 0.18948, h * 0.21389);
  path.cubicBezierTo(w * 0.18724, h * 0.21926, w * 0.17947, h * 0.23755, w * 0.17222, h * 0.25453);
  path.cubicBezierTo(w * 0.16105, h * 0.28069, w * 0.14615, h * 0.32208, w * 0.14517, h * 0.32427);
  path.cubicBezierTo(w * 0.14150, h * 0.33246, w * 0.08892, h * 0.49630, w * 0.08734, h * 0.50149);
  path.cubicBezierTo(w * 0.08405, h * 0.51230, w * 0.05631, h * 0.60828, w * 0.05526, h * 0.61175);
  path.cubicBezierTo(w * 0.04892, h * 0.63252, w * 0.03328, h * 0.69229, w * 0.03223, h * 0.69680);
  path.cubicBezierTo(w * 0.03118, h * 0.70130, w * 0.02728, h * 0.71775, w * 0.02356, h * 0.73334);
  path.cubicBezierTo(w * 0.01984, h * 0.74893, w * 0.01564, h * 0.76849, w * 0.01424, h * 0.77681);
  path.cubicBezierTo(w * 0.01284, h * 0.78513, w * 0.00333, h * 0.84161, w * 0.00191, h * 0.85304);
  path.cubicBezierTo(w * -0.00065, h * 0.87357, w * -0.00063, h * 0.89219, w * 0.00193, h * 0.89712);

  // --- Left hem: 4 cubics from side bottom to center ---
  path.cubicBezierTo(w * 0.00409, h * 0.90125, w * 0.00828, h * 0.90362, w * 0.03267, h * 0.91449);
  path.cubicBezierTo(w * 0.07094, h * 0.93155, w * 0.12346, h * 0.94865, w * 0.18105, h * 0.96279);
  path.cubicBezierTo(w * 0.22355, h * 0.97322, w * 0.23299, h * 0.97505, w * 0.29379, h * 0.98465);
  path.cubicBezierTo(w * 0.35859, h * 0.99487, w * 0.37646, h * 0.99729, w * 0.40180, h * 0.99925);

  // --- Bottom center bridge (tangent-continuous cubic) ---
  path.cubicBezierTo(w * 0.46727, h * 1.00431, w * 0.53273, h * 1.00431, w * 0.59820, h * 0.99925);

  // --- Right hem: 4 mirrored cubics from center to side bottom ---
  path.cubicBezierTo(w * 0.62354, h * 0.99729, w * 0.64141, h * 0.99487, w * 0.70621, h * 0.98465);
  path.cubicBezierTo(w * 0.76701, h * 0.97505, w * 0.77645, h * 0.97322, w * 0.81895, h * 0.96279);
  path.cubicBezierTo(w * 0.87654, h * 0.94865, w * 0.92906, h * 0.93155, w * 0.96733, h * 0.91449);
  path.cubicBezierTo(w * 0.99172, h * 0.90362, w * 0.99591, h * 0.90125, w * 0.99807, h * 0.89712);

  // --- Right side: 14 smoothed mirrored cubics from side bottom up to right shoulder peak ---
  path.cubicBezierTo(w * 1.00063, h * 0.89219, w * 1.00065, h * 0.87357, w * 0.99809, h * 0.85304);
  path.cubicBezierTo(w * 0.99667, h * 0.84161, w * 0.98716, h * 0.78513, w * 0.98576, h * 0.77681);
  path.cubicBezierTo(w * 0.98436, h * 0.76849, w * 0.98016, h * 0.74893, w * 0.97644, h * 0.73334);
  path.cubicBezierTo(w * 0.97272, h * 0.71775, w * 0.96882, h * 0.70130, w * 0.96777, h * 0.69680);
  path.cubicBezierTo(w * 0.96672, h * 0.69229, w * 0.95108, h * 0.63252, w * 0.94474, h * 0.61175);
  path.cubicBezierTo(w * 0.94369, h * 0.60828, w * 0.91595, h * 0.51230, w * 0.91266, h * 0.50149);
  path.cubicBezierTo(w * 0.91108, h * 0.49630, w * 0.85850, h * 0.33246, w * 0.85483, h * 0.32427);
  path.cubicBezierTo(w * 0.85385, h * 0.32208, w * 0.83895, h * 0.28069, w * 0.82778, h * 0.25453);
  path.cubicBezierTo(w * 0.82053, h * 0.23755, w * 0.81276, h * 0.21926, w * 0.81052, h * 0.21389);
  path.cubicBezierTo(w * 0.80560, h * 0.20213, w * 0.78541, h * 0.15739, w * 0.78422, h * 0.15561);
  path.cubicBezierTo(w * 0.78376, h * 0.15492, w * 0.77385, h * 0.13518, w * 0.76221, h * 0.11174);
  path.cubicBezierTo(w * 0.74062, h * 0.06828, w * 0.72998, h * 0.04942, w * 0.72105, h * 0.03873);
  path.cubicBezierTo(w * 0.71624, h * 0.03298, w * 0.70298, h * 0.02459, w * 0.69207, h * 0.02040);
  path.cubicBezierTo(w * 0.68710, h * 0.01849, w * 0.65942, h * 0.01217, w * 0.64415, h * 0.00946);
}

/**
 * Draw the left side of the reference outline — segments 1-21.
 * Shoulder peak → left side down to y ≈ 0.897h.
 * Used by CapeTattered to replace the bottom hem with jitter.
 */
function drawRefLeftSide(path: SVGPath, w: number, h: number, hemWidth: number = 1.0, shoulderH?: number) {
  const cx = w / 2;
  const sh = shoulderH ?? h;
  // Progressively adjust X from center: at y=0 no adjustment, at y=0.897h full hemWidth
  function xAdj(xFrac: number, yFrac: number): number {
    const x = w * xFrac;
    if (hemWidth === 1.0) return x;
    const t = Math.max(0, yFrac / 0.89712); // 0 at top, 1 at side bottom
    const adjusted = cx + (x - cx) * hemWidth;
    return x + (adjusted - x) * t;
  }
  // Smoothly blend Y from shoulderH at yFrac=0 to h at yFrac=0.12
  function yAt(yFrac: number): number {
    if (sh === h) return h * yFrac;
    const blend = Math.min(1, yFrac / 0.12);
    const t = blend * blend * (3 - 2 * blend); // smoothstep
    return (sh + (h - sh) * t) * yFrac;
  }
  path.cubicBezierTo(xAdj(0.34058, 0.01217), yAt(0.01217), xAdj(0.31290, 0.01849), yAt(0.01849), xAdj(0.30793, 0.02040), yAt(0.02040));
  path.cubicBezierTo(xAdj(0.29702, 0.02459), yAt(0.02459), xAdj(0.28376, 0.03298), yAt(0.03298), xAdj(0.27895, 0.03873), yAt(0.03873));
  path.cubicBezierTo(xAdj(0.27002, 0.04942), yAt(0.04942), xAdj(0.25938, 0.06828), yAt(0.06828), xAdj(0.23779, 0.11174), yAt(0.11174));
  path.cubicBezierTo(xAdj(0.22615, 0.13518), h * 0.13518, xAdj(0.21624, 0.15492), h * 0.15492, xAdj(0.21578, 0.15561), h * 0.15561);
  path.cubicBezierTo(xAdj(0.21459, 0.15739), h * 0.15739, xAdj(0.19440, 0.20213), h * 0.20213, xAdj(0.18948, 0.21389), h * 0.21389);
  path.cubicBezierTo(xAdj(0.18724, 0.21926), h * 0.21926, xAdj(0.17947, 0.23755), h * 0.23755, xAdj(0.17222, 0.25453), h * 0.25453);
  path.cubicBezierTo(xAdj(0.16105, 0.28069), h * 0.28069, xAdj(0.14615, 0.32208), h * 0.32208, xAdj(0.14517, 0.32427), h * 0.32427);
  path.cubicBezierTo(xAdj(0.14150, 0.33246), h * 0.33246, xAdj(0.08892, 0.49630), h * 0.49630, xAdj(0.08734, 0.50149), h * 0.50149);
  path.cubicBezierTo(xAdj(0.08405, 0.51230), h * 0.51230, xAdj(0.05631, 0.60828), h * 0.60828, xAdj(0.05526, 0.61175), h * 0.61175);
  path.cubicBezierTo(xAdj(0.04892, 0.63252), h * 0.63252, xAdj(0.03328, 0.69229), h * 0.69229, xAdj(0.03223, 0.69680), h * 0.69680);
  path.cubicBezierTo(xAdj(0.03118, 0.70130), h * 0.70130, xAdj(0.02728, 0.71775), h * 0.71775, xAdj(0.02356, 0.73334), h * 0.73334);
  path.cubicBezierTo(xAdj(0.01984, 0.74893), h * 0.74893, xAdj(0.01564, 0.76849), h * 0.76849, xAdj(0.01424, 0.77681), h * 0.77681);
  path.cubicBezierTo(xAdj(0.01284, 0.78513), h * 0.78513, xAdj(0.00333, 0.84161), h * 0.84161, xAdj(0.00191, 0.85304), h * 0.85304);
  path.cubicBezierTo(xAdj(-0.00065, 0.87357), h * 0.87357, xAdj(-0.00063, 0.89219), h * 0.89219, xAdj(0.00193, 0.89712), h * 0.89712);
}

/**
 * Draw the right side of the reference outline — right segments 5-25.
 * From y ≈ 0.897h up to right shoulder peak.
 * Mirror of drawRefLeftSide. Used by CapeTattered.
 */
function drawRefRightSide(path: SVGPath, w: number, h: number, hemWidth: number = 1.0, shoulderH?: number) {
  const cx = w / 2;
  const sh = shoulderH ?? h;
  function xAdj(xFrac: number, yFrac: number): number {
    const x = w * xFrac;
    if (hemWidth === 1.0) return x;
    const t = Math.max(0, yFrac / 0.89712);
    const adjusted = cx + (x - cx) * hemWidth;
    return x + (adjusted - x) * t;
  }
  // Smoothly blend Y from shoulderH at yFrac=0 to h at yFrac=0.12
  function yAt(yFrac: number): number {
    if (sh === h) return h * yFrac;
    const blend = Math.min(1, yFrac / 0.12);
    const t = blend * blend * (3 - 2 * blend); // smoothstep
    return (sh + (h - sh) * t) * yFrac;
  }
  path.cubicBezierTo(xAdj(1.00063, 0.89219), h * 0.89219, xAdj(1.00065, 0.87357), h * 0.87357, xAdj(0.99809, 0.85304), h * 0.85304);
  path.cubicBezierTo(xAdj(0.99667, 0.84161), h * 0.84161, xAdj(0.98716, 0.78513), h * 0.78513, xAdj(0.98576, 0.77681), h * 0.77681);
  path.cubicBezierTo(xAdj(0.98436, 0.76849), h * 0.76849, xAdj(0.98016, 0.74893), h * 0.74893, xAdj(0.97644, 0.73334), h * 0.73334);
  path.cubicBezierTo(xAdj(0.97272, 0.71775), h * 0.71775, xAdj(0.96882, 0.70130), h * 0.70130, xAdj(0.96777, 0.69680), h * 0.69680);
  path.cubicBezierTo(xAdj(0.96672, 0.69229), h * 0.69229, xAdj(0.95108, 0.63252), h * 0.63252, xAdj(0.94474, 0.61175), h * 0.61175);
  path.cubicBezierTo(xAdj(0.94369, 0.60828), h * 0.60828, xAdj(0.91595, 0.51230), h * 0.51230, xAdj(0.91266, 0.50149), h * 0.50149);
  path.cubicBezierTo(xAdj(0.91108, 0.49630), h * 0.49630, xAdj(0.85850, 0.33246), h * 0.33246, xAdj(0.85483, 0.32427), h * 0.32427);
  path.cubicBezierTo(xAdj(0.85385, 0.32208), h * 0.32208, xAdj(0.83895, 0.28069), h * 0.28069, xAdj(0.82778, 0.25453), h * 0.25453);
  path.cubicBezierTo(xAdj(0.82053, 0.23755), h * 0.23755, xAdj(0.81276, 0.21926), h * 0.21926, xAdj(0.81052, 0.21389), h * 0.21389);
  path.cubicBezierTo(xAdj(0.80560, 0.20213), h * 0.20213, xAdj(0.78541, 0.15739), h * 0.15739, xAdj(0.78422, 0.15561), h * 0.15561);
  path.cubicBezierTo(xAdj(0.78376, 0.15492), h * 0.15492, xAdj(0.77385, 0.13518), h * 0.13518, xAdj(0.76221, 0.11174), yAt(0.11174));
  path.cubicBezierTo(xAdj(0.74062, 0.06828), yAt(0.06828), xAdj(0.72998, 0.04942), yAt(0.04942), xAdj(0.72105, 0.03873), yAt(0.03873));
  path.cubicBezierTo(xAdj(0.71624, 0.03298), yAt(0.03298), xAdj(0.70298, 0.02459), yAt(0.02459), xAdj(0.69207, 0.02040), yAt(0.02040));
  path.cubicBezierTo(xAdj(0.68710, 0.01849), yAt(0.01849), xAdj(0.65942, 0.01217), yAt(0.01217), xAdj(0.64415, 0.00946), yAt(0.00946));
}

/**
 * Generate an angled sword slit as a single cut line.
 * A simple line segment at the given angle, positioned on either side of the cape.
 *
 * @param w       cape width in mm
 * @param h       cape height in mm
 * @param side    'left' | 'right' — which side of the cape
 * @param angle   degrees from vertical (0 = vertical, 90 = horizontal)
 * @param yFrac   vertical position as fraction of height (0 = top, 1 = bottom)
 * @param slitLen length of the slit in mm (default 8, sized for 66964 greatsword blade ~5mm, crossguard ~12mm catches)
 */
function generateSwordSlit(
  w: number,
  h: number,
  side: string,
  angle: number,
  yFrac: number,
  slitLen: number = 8,
  slitCount: number = 1,
  slitSpacing: number = 3
): string {
  const path = new SVGPath();
  const half = slitLen / 2;

  // Center of the slit — closer to center: 35% / 65% of width
  const cx = side === 'left' ? w * 0.35 : w * 0.65;
  const cy = h * yFrac;

  // Angle in radians (positive = tilted toward shoulder)
  const rad = (side === 'left' ? -angle : angle) * Math.PI / 180;
  const sinA = Math.sin(rad);
  const cosA = Math.cos(rad);

  // Perpendicular direction (for offsetting parallel slits)
  const perpX = cosA;
  const perpY = -sinA;

  const count = Math.max(1, Math.min(2, slitCount));
  for (let i = 0; i < count; i++) {
    // Offset from center: for 1 slit = 0, for 2 slits = ±spacing/2
    const offset = count === 1 ? 0 : (i - 0.5) * slitSpacing;
    const ox = cx + perpX * offset;
    const oy = cy + perpY * offset;

    path.moveTo(ox - half * sinA, oy - half * cosA);
    path.lineTo(ox + half * sinA, oy + half * cosA);
  }

  return path.toString();
}

// ---------------------------------------------------------------------------
// Cape modifier geometry helpers
// ---------------------------------------------------------------------------

/**
 * Draw a modified bottom hem replacing the standard reference bottom.
 * Uses drawRefLeftSide (21 segs to ~0.897h), then the chosen hem, then drawRefRightSide.
 * Returns with the path at the right shoulder peak.
 *
 * hemType: 'standard' | 'tattered' | 'scalloped' | 'notched' | 'asymmetric'
 */
/**
 * Draw the standard bottom hem (no modifier) at actual cape height.
 * Connects the bottom of the left side to the bottom of the right side
 * with the reference curved hem shape, adjusted for hemWidth.
 */
function drawRefStandardHem(path: SVGPath, w: number, h: number, hemWidth: number) {
  const cx = w / 2;
  function xAdj(xFrac: number): number {
    const x = w * xFrac;
    return cx + (x - cx) * hemWidth;
  }
  // Left bottom 4 beziers (from side endpoint at ~0.897h down to ~0.999h)
  path.cubicBezierTo(xAdj(0.00409), h * 0.90125, xAdj(0.00828), h * 0.90362, xAdj(0.03267), h * 0.91449);
  path.cubicBezierTo(xAdj(0.07094), h * 0.93155, xAdj(0.12346), h * 0.94865, xAdj(0.18105), h * 0.96279);
  path.cubicBezierTo(xAdj(0.22355), h * 0.97322, xAdj(0.23299), h * 0.97505, xAdj(0.29379), h * 0.98465);
  path.cubicBezierTo(xAdj(0.35859), h * 0.99487, xAdj(0.37646), h * 0.99729, xAdj(0.40180), h * 0.99925);
  // Bridge (tangent-continuous cubic)
  path.cubicBezierTo(xAdj(0.46727), h * 1.00431, xAdj(0.53273), h * 1.00431, xAdj(0.59820), h * 0.99925);
  // Right bottom 4 beziers
  path.cubicBezierTo(xAdj(0.62354), h * 0.99729, xAdj(0.64141), h * 0.99487, xAdj(0.70621), h * 0.98465);
  path.cubicBezierTo(xAdj(0.76701), h * 0.97505, xAdj(0.77645), h * 0.97322, xAdj(0.81895), h * 0.96279);
  path.cubicBezierTo(xAdj(0.87654), h * 0.94865, xAdj(0.92906), h * 0.93155, xAdj(0.96733), h * 0.91449);
  path.cubicBezierTo(xAdj(0.99172), h * 0.90362, xAdj(0.99591), h * 0.90125, xAdj(0.99807), h * 0.89712);
}

/**
 * Draw a rounded U-shaped hem from the left side bottom to the right side bottom.
 * Uses two cubic beziers to approximate an elliptical arc.
 * @param rounding  0-1: 0 = flat straight hem, 1 = full semicircular U
 */
function drawRoundedHem(
  path: SVGPath, w: number, h: number, hemWidth: number, rounding: number,
  sideBotYFrac = 0.89712, sideLeftXFrac = 0.00193, sideRightXFrac = 0.99807
) {
  const cx = w / 2;
  function xAdj(xFrac: number): number {
    const x = w * xFrac;
    return cx + (x - cx) * hemWidth;
  }
  const leftX = xAdj(sideLeftXFrac);
  const rightX = xAdj(sideRightXFrac);
  const sideY = h * sideBotYFrac;
  const halfW = (rightX - leftX) / 2;
  // 0 = flat (zero depth), 1 = full semicircle
  const maxDepth = halfW;
  const depth = rounding * maxDepth;
  if (depth < 0.01) {
    // Flat: straight line across
    path.lineTo(rightX, sideY);
    return;
  }
  const bottomY = sideY + depth;
  // Kappa for cubic bezier quarter-circle approximation
  const k = 0.5522847498;
  // Tangent bias: match the slight horizontal component of the side edges
  // to avoid a visible bump at the junction between side and rounded hem
  const tangentBias = depth * 0.15;
  // Left quarter-arc
  path.cubicBezierTo(leftX + tangentBias, sideY + depth * k, cx - halfW * k, bottomY, cx, bottomY);
  // Right quarter-arc
  path.cubicBezierTo(cx + halfW * k, bottomY, rightX - tangentBias, sideY + depth * k, rightX, sideY);
}

// Key sample points from the left side bezier chain: [yFrac, xFrac]
// Extracted from the bezier endpoints to approximate the side profile.
const LEFT_SIDE_SAMPLES: [number, number][] = [
  [0.02040, 0.30793], [0.03873, 0.27895], [0.11174, 0.23779],
  [0.15561, 0.21578], [0.21389, 0.18948], [0.25453, 0.17222],
  [0.32427, 0.14517], [0.50149, 0.08734], [0.61175, 0.05526],
  [0.69680, 0.03223], [0.73334, 0.02356], [0.77681, 0.01424],
  [0.85304, 0.00191], [0.89712, 0.00193],
];

/**
 * Get the reference left-side X fraction at a given Y fraction,
 * by linearly interpolating the sample table.
 */
function leftSideXFrac(yFrac: number): number {
  if (yFrac <= LEFT_SIDE_SAMPLES[0][0]) return LEFT_SIDE_SAMPLES[0][1];
  if (yFrac >= LEFT_SIDE_SAMPLES[LEFT_SIDE_SAMPLES.length - 1][0]) return LEFT_SIDE_SAMPLES[LEFT_SIDE_SAMPLES.length - 1][1];
  for (let i = 0; i < LEFT_SIDE_SAMPLES.length - 1; i++) {
    const [y0, x0] = LEFT_SIDE_SAMPLES[i];
    const [y1, x1] = LEFT_SIDE_SAMPLES[i + 1];
    if (yFrac >= y0 && yFrac <= y1) {
      const t = (yFrac - y0) / (y1 - y0);
      return x0 + (x1 - x0) * t;
    }
  }
  return LEFT_SIDE_SAMPLES[LEFT_SIDE_SAMPLES.length - 1][1];
}

/**
 * Compute the side edge endpoint position for a cape profile.
 */
function sidePoint(
  w: number, h: number, hemWidth: number,
  profileFn: (yFrac: number) => number,
  yFrac: number, botYFrac: number,
  shoulderH: number | undefined,
  mirror: boolean
): { x: number; y: number } {
  const cx = w / 2;
  const sh = shoulderH ?? h;
  let xFrac = profileFn(yFrac);
  if (mirror) xFrac = 1 - xFrac;
  const rawX = w * xFrac;
  const taper = Math.max(0, yFrac / botYFrac);
  const x = hemWidth === 1.0 ? rawX : rawX + (cx + (rawX - cx) * hemWidth - rawX) * taper;
  // Y with shoulder blend
  let y: number;
  if (sh === h) {
    y = h * yFrac;
  } else {
    const blend = Math.min(1, yFrac / 0.12);
    const t = blend * blend * (3 - 2 * blend);
    y = (sh + (h - sh) * t) * yFrac;
  }
  return { x, y };
}

/**
 * Draw a styled left side. Delegates to drawStyledEdge with the correct
 * endpoints and outward normal for the left side of the cape.
 */
function drawStyledLeftSide(
  path: SVGPath, w: number, h: number, hemWidth: number,
  style: string, depth: number, count: number, seed: number,
  shoulderH?: number,
  profileFn?: (yFrac: number) => number,
  topY?: number,
  botY?: number,
  sawtoothCurve: number = 0,
  sawtoothReverse: boolean = false,
  sideCurve: number = 0
) {
  const topYFrac = topY ?? 0.02040;
  const botYFrac = botY ?? 0.89712;
  const _profileFn = profileFn ?? leftSideXFrac;

  const p0 = sidePoint(w, h, hemWidth, _profileFn, topYFrac, botYFrac, shoulderH, false);
  const p1 = sidePoint(w, h, hemWidth, _profileFn, botYFrac, botYFrac, shoulderH, false);

  // Outward normal: 90° CCW of edge direction → points left (away from center)
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  const outwardX = -dy / len;
  const outwardY = dx / len;

  drawStyledEdge(path, p0.x, p0.y, p1.x, p1.y, style, depth, count,
    outwardX, outwardY, 0, seed, false, sawtoothCurve, sawtoothReverse, sideCurve);
}

/**
 * Draw a styled right side. Mirror of drawStyledLeftSide.
 * Draws bottom→top to maintain path continuity.
 */
function drawStyledRightSide(
  path: SVGPath, w: number, h: number, hemWidth: number,
  style: string, depth: number, count: number, seed: number,
  shoulderH?: number,
  profileFn?: (yFrac: number) => number,
  topY?: number,
  botY?: number,
  sawtoothCurve: number = 0,
  sawtoothReverse: boolean = false,
  sideCurve: number = 0
) {
  const topYFrac = topY ?? 0.02040;
  const botYFrac = botY ?? 0.89712;
  const _profileFn = profileFn ?? leftSideXFrac;

  // Drawing order: bottom → top (path continues from hem)
  const p0 = sidePoint(w, h, hemWidth, _profileFn, botYFrac, botYFrac, shoulderH, true);
  const p1 = sidePoint(w, h, hemWidth, _profileFn, topYFrac, botYFrac, shoulderH, true);

  // Outward normal: 90° CCW of edge direction → points right (away from center)
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.hypot(dx, dy) || 1;
  const outwardX = -dy / len;
  const outwardY = dx / len;

  drawStyledEdge(path, p0.x, p0.y, p1.x, p1.y, style, depth, count,
    outwardX, outwardY, 0, seed, false, sawtoothCurve, sawtoothReverse, sideCurve, true);
}

// ---------------------------------------------------------------------------
// Narrow cape outline profile — leaf/teardrop shape, no neck opening
// ---------------------------------------------------------------------------

/** Narrow left side sample points [yFrac, xFrac] from bezier endpoints and control points */
const NARROW_LEFT_SIDE_SAMPLES: [number, number][] = [
  [0.0014, 0.5000],
  [0.0024, 0.4160],
  [0.0033, 0.3822],
  [0.0112, 0.3583],
  [0.0159, 0.3440],
  [0.0267, 0.3232],
  [0.0352, 0.3122],
  [0.0863, 0.2455],
  [0.3013, 0.1306],
  [0.4668, 0.0815],
  [0.6116, 0.0385],
  [0.7327, 0.0147],
  [0.8464, 0.0068],
];

function narrowLeftSideXFrac(yFrac: number): number {
  if (yFrac <= NARROW_LEFT_SIDE_SAMPLES[0][0]) return NARROW_LEFT_SIDE_SAMPLES[0][1];
  const last = NARROW_LEFT_SIDE_SAMPLES[NARROW_LEFT_SIDE_SAMPLES.length - 1];
  if (yFrac >= last[0]) return last[1];
  for (let i = 0; i < NARROW_LEFT_SIDE_SAMPLES.length - 1; i++) {
    const [y0, x0] = NARROW_LEFT_SIDE_SAMPLES[i];
    const [y1, x1] = NARROW_LEFT_SIDE_SAMPLES[i + 1];
    if (yFrac >= y0 && yFrac <= y1) {
      const t = (yFrac - y0) / (y1 - y0);
      return x0 + (x1 - x0) * t;
    }
  }
  return last[1];
}

/** Draw narrow left side: 4 beziers from top (0.5,0.0014) to (0.0068,0.8464) */
function drawNarrowRefLeftSide(path: SVGPath, w: number, h: number, hemWidth: number = 1.0) {
  const cx = w / 2;
  function xAdj(xFrac: number, yFrac: number): number {
    const x = w * xFrac;
    if (hemWidth === 1.0) return x;
    const t = Math.max(0, yFrac / 0.8464);
    const adjusted = cx + (x - cx) * hemWidth;
    return x + (adjusted - x) * t;
  }
  // B6 reversed (from apex at 0.5)
  path.cubicBezierTo(xAdj(0.4160, 0.0024), h * 0.0024, xAdj(0.3822, 0.0033), h * 0.0033, xAdj(0.3583, 0.0112), h * 0.0112);
  // B5 reversed
  path.cubicBezierTo(xAdj(0.344, 0.0159), h * 0.0159, xAdj(0.3232, 0.0267), h * 0.0267, xAdj(0.3122, 0.0352), h * 0.0352);
  // B4 reversed
  path.cubicBezierTo(xAdj(0.2455, 0.0863), h * 0.0863, xAdj(0.1306, 0.3013), h * 0.3013, xAdj(0.0815, 0.4668), h * 0.4668);
  // B3 reversed
  path.cubicBezierTo(xAdj(0.0385, 0.6116), h * 0.6116, xAdj(0.0147, 0.7327), h * 0.7327, xAdj(0.0068, 0.8464), h * 0.8464);
}

/** Draw narrow right side: 4 beziers from (0.9932,0.8464) up to start (0.5,0.0014) */
function drawNarrowRefRightSide(path: SVGPath, w: number, h: number, hemWidth: number = 1.0) {
  const cx = w / 2;
  function xAdj(xFrac: number, yFrac: number): number {
    const x = w * xFrac;
    if (hemWidth === 1.0) return x;
    const t = Math.max(0, yFrac / 0.8464);
    const adjusted = cx + (x - cx) * hemWidth;
    return x + (adjusted - x) * t;
  }
  // B10 reversed
  path.cubicBezierTo(xAdj(0.9853, 0.7327), h * 0.7327, xAdj(0.9615, 0.6116), h * 0.6116, xAdj(0.9185, 0.4668), h * 0.4668);
  // B9 reversed
  path.cubicBezierTo(xAdj(0.8694, 0.3013), h * 0.3013, xAdj(0.7545, 0.0863), h * 0.0863, xAdj(0.6878, 0.0352), h * 0.0352);
  // B8 reversed
  path.cubicBezierTo(xAdj(0.6768, 0.0267), h * 0.0267, xAdj(0.656, 0.0159), h * 0.0159, xAdj(0.6417, 0.0112), h * 0.0112);
  // B7 reversed — closes back to starting point (apex at 0.5)
  path.cubicBezierTo(xAdj(0.6178, 0.0033), h * 0.0033, xAdj(0.5840, 0.0024), h * 0.0024, xAdj(0.5, 0.0014), h * 0.0014);
}

/** Draw narrow standard hem: 2 beziers down to bottom, bridge, 2 beziers up */
function drawNarrowStandardHem(path: SVGPath, w: number, h: number, hemWidth: number) {
  const cx = w / 2;
  function xAdj(xFrac: number): number {
    const x = w * xFrac;
    return cx + (x - cx) * hemWidth;
  }
  // Left hem: from side-bottom (0.0068,0.8464) down to bottom
  path.cubicBezierTo(xAdj(0), h * 0.9437, xAdj(0.0012), h * 0.9551, xAdj(0.0184), h * 0.9609);
  path.cubicBezierTo(xAdj(0.0482), h * 0.9708, xAdj(0.1861), h * 0.9847, xAdj(0.3302), h * 0.9923);
  // Bridge
  path.lineTo(xAdj(0.6698), h * 0.9923);
  // Right hem: from bottom back up to side-bottom
  path.cubicBezierTo(xAdj(0.8139), h * 0.9847, xAdj(0.9518), h * 0.9708, xAdj(0.9816), h * 0.9609);
  path.cubicBezierTo(xAdj(0.9988), h * 0.9551, xAdj(1.0), h * 0.9437, xAdj(0.9932), h * 0.8464);
}

const STANDARD_PROFILE: CapeOutlineProfile = {
  sideTopYFrac: 0.02040,
  sideBotYFrac: 0.89712,
  sideLeftXFrac: 0.00193,
  sideRightXFrac: 0.99807,
  shoulderH: REF_H,
  shoulderPeakYFrac: 0.00946,
  shoulderPeakXFrac: 0.64415,
  sideProfileFn: leftSideXFrac,
  drawRefLeft: drawRefLeftSide,
  drawRefRight: drawRefRightSide,
  drawRefHem: drawRefStandardHem,
};

const NARROW_PROFILE: CapeOutlineProfile = {
  sideTopYFrac: 0.0014,
  sideBotYFrac: 0.8464,
  sideLeftXFrac: 0.0068,
  sideRightXFrac: 0.9932,
  sideProfileFn: narrowLeftSideXFrac,
  drawRefLeft: drawNarrowRefLeftSide,
  drawRefRight: drawNarrowRefRightSide,
  drawRefHem: drawNarrowStandardHem,
};

function drawModifiedOutline(
  path: SVGPath, w: number, h: number, params: TemplateParams,
  profile?: CapeOutlineProfile
) {
  const p = profile ?? STANDARD_PROFILE;
  const refH = p.shoulderH ?? h;
  const hemW = (params.hemWidth as number) || 1.0;
  const tattered = params.tattered as boolean;
  const scalloped = params.scalloped as boolean;
  const notched = params.notched as boolean;
  const asymmetric = params.asymmetric as boolean;
  const zigzag = params.zigzag as boolean;
  const wavy = params.wavy as boolean;
  const castellated = params.castellated as boolean;
  const dovetail = params.dovetail as boolean;
  const flame = params.flame as boolean;
  const stepped = params.stepped as boolean;
  const thorned = params.thorned as boolean;
  const torn = params.torn as boolean;
  const feathered = params.feathered as boolean;
  const cloud = params.cloud as boolean;
  const sawtooth = params.sawtooth as boolean;
  const arrow = params.arrow as boolean;
  const picot = params.picot as boolean;
  const bottomCurveAmt = (params.bottomCurve as number) || 0;
  const rounding = bottomCurveAmt > 0;

  const hasHemStyle = tattered || scalloped || notched || asymmetric || zigzag || wavy || castellated || dovetail || flame || stepped || thorned || torn || feathered || cloud || sawtooth || arrow || picot;

  const sideStyle = (params.sideStyle as string) || 'none';
  const sideDepth = (params.sideStyleDepth as number) || 3;
  const sideCount = (params.sideStyleCount as number) || 8;
  const sideSeed = (params.seed as number) || 12345;
  const sideSawCurve = (params.sawtoothCurve as number) || 0;
  const sideSawReverse = !!(params.sawtoothReverse);
  const sideCurve = (params.sideCurve as number) || 0;

  function drawLeft() {
    if (sideStyle !== 'none' || sideCurve !== 0) drawStyledLeftSide(path, w, h, hemW, sideStyle, sideDepth, sideCount, sideSeed, refH, p.sideProfileFn, p.sideTopYFrac, p.sideBotYFrac, sideSawCurve, sideSawReverse, sideCurve);
    else p.drawRefLeft(path, w, h, hemW, refH);
  }
  function drawRight() {
    if (sideStyle !== 'none' || sideCurve !== 0) {
      drawStyledRightSide(path, w, h, hemW, sideStyle, sideDepth, sideCount, sideSeed, refH, p.sideProfileFn, p.sideTopYFrac, p.sideBotYFrac, sideSawCurve, sideSawReverse, sideCurve);
      // When using styled sides, the styled edge ends at sideTopYFrac which is
      // below the shoulder peak. Connect to the shoulder peak with a straight
      // line so closeRefNeck starts from the correct position (mirrors the
      // implicit lineTo from shoulder peak down to sideTopYFrac on the left).
      if (p.shoulderPeakYFrac != null && p.shoulderPeakXFrac != null) {
        const peakY = (p.shoulderH ?? h) * p.shoulderPeakYFrac;
        const peakX = w * p.shoulderPeakXFrac;
        path.lineTo(peakX, peakY);
      }
    }
    else p.drawRefRight(path, w, h, hemW, refH);
  }

  // If no hem modifier, draw full outline at actual length h with hemWidth taper
  if (!hasHemStyle) {
    drawLeft();
    if (rounding) {
      drawRoundedHem(path, w, h, hemW, bottomCurveAmt, p.sideBotYFrac, p.sideLeftXFrac, p.sideRightXFrac);
    } else {
      p.drawRefHem(path, w, h, hemW);
    }
    drawRight();
    return;
  }

  // Draw the left side at actual length with hemWidth taper
  drawLeft();
  // Side endpoints at actual length
  const cx = w / 2;
  const leftX = cx + (w * p.sideLeftXFrac - cx) * hemW;
  const leftY = h * p.sideBotYFrac;
  const rightX = cx + (w * p.sideRightXFrac - cx) * hemW;
  const rightY = leftY;

  const halfW = (rightX - leftX) / 2;
  const hemDepth = h - leftY;
  // When rounding is active the hem follows a deeper curved baseline
  const effectiveDepth = rounding ? Math.max(hemDepth, bottomCurveAmt * halfW) : hemDepth;
  const hemSpan = rightX - leftX;

  // Baseline Y at parameter t (0 = left edge, 1 = right edge).
  // Smooth curve: leftY at edges, dipping to leftY + effectiveDepth at center.
  function baseY(t: number): number {
    return leftY + effectiveDepth * Math.sin(t * Math.PI);
  }

  // Outward normal of the baseline curve at parameter t.
  // Perpendicular to the tangent, pointing away from the cape body.
  function baseNormal(t: number): { nx: number; ny: number } {
    const dydt = effectiveDepth * Math.PI * Math.cos(t * Math.PI);
    const len = Math.sqrt(hemSpan * hemSpan + dydt * dydt);
    return { nx: -dydt / len, ny: hemSpan / len };
  }

  // Offset along the baseline's local surface normal at the X position of px.
  // When rounding is off, the baseline is nearly flat so normals point straight down.
  function offsetPoint(px: number, py: number, offset: number): { x: number; y: number } {
    if (!rounding) return { x: px, y: py + offset };
    const t = Math.max(0, Math.min(1, (px - leftX) / hemSpan));
    const n = baseNormal(t);
    return { x: px + offset * n.nx, y: py + offset * n.ny };
  }

  if (tattered) {
    const rng = new SeededRNG((params.seed as number) || 12345);
    const intensity = (params.tatteredIntensity as number) || 0.06;
    const symmetric = params.tatteredSymmetric !== false;
    const jitterMax = w * intensity;
    const hemSpan = rightX - leftX;
    const segmentCount = Math.max(12, Math.floor(hemSpan / 2.5));
    if (symmetric) {
      // Pre-compute offsets for first half, then mirror
      const halfCount = Math.ceil(segmentCount / 2);
      const halfOffsets: number[] = [];
      let prevOff = 0;
      for (let i = 0; i <= halfCount; i++) {
        let off = rng.nextRange(-jitterMax * 0.2, jitterMax);
        off = Math.max(off, 0);
        const maxStep = jitterMax * 1.2;
        if (Math.abs(off - prevOff) > maxStep) {
          off = prevOff + Math.sign(off - prevOff) * maxStep;
        }
        prevOff = off;
        halfOffsets.push(off);
      }
      for (let i = 0; i <= segmentCount; i++) {
        const t = i / segmentCount;
        const xPos = leftX + hemSpan * t;
        const bY = baseY(t);
        const mi = i <= halfCount ? i : segmentCount - i;
        const pt = offsetPoint(xPos, bY, halfOffsets[mi]);
        path.lineTo(pt.x, pt.y);
      }
    } else {
      let prevOffset = 0;
      for (let i = 0; i <= segmentCount; i++) {
        const t = i / segmentCount;
        const xPos = leftX + hemSpan * t;
        const bY = baseY(t);
        let offset = rng.nextRange(-jitterMax * 0.2, jitterMax);
        offset = Math.max(offset, 0);
        const maxStep = jitterMax * 1.2;
        if (Math.abs(offset - prevOffset) > maxStep) {
          offset = prevOffset + Math.sign(offset - prevOffset) * maxStep;
        }
        prevOffset = offset;
        const pt = offsetPoint(xPos, bY, offset);
        path.lineTo(pt.x, pt.y);
      }
    }
  } else if (scalloped) {
    const count = (params.scallopCount as number) || 8;
    const depth = (params.scallopDepth as number) || 3;
    const inverted = params.scallopInverted as boolean;
    const hemSpanW = rightX - leftX;
    const segW = hemSpanW / count;
    for (let i = 0; i < count; i++) {
      const ex = leftX + segW * (i + 1);
      const endY = baseY((i + 1) / count);
      const midX = leftX + segW * (i + 0.5);
      const midBY = baseY((i + 0.5) / count);
      const d = inverted ? -depth : depth;
      const ctrl = offsetPoint(midX, midBY, d);
      path.quadraticBezierTo(ctrl.x, ctrl.y, ex, endY);
    }
  } else if (notched) {
    // Flat runs with distinct V-notch cuts (comb-like, matches drawStyledEdge)
    const count = (params.notchedCount as number) || 6;
    const depth = (params.notchedDepth as number) || 3;
    const totalCells = 2 * count + 1;
    const cellW = hemSpan / totalCells;
    for (let i = 0; i < totalCells; i++) {
      const t1 = (i + 1) / totalCells;
      const x1 = leftX + (i + 1) * cellW;
      if (i % 2 === 0) {
        // Flat run along baseline
        path.lineTo(x1, baseY(t1));
      } else {
        // V-notch: inward cut at center of cell
        const midX = leftX + (i + 0.5) * cellW;
        const tMid = (i + 0.5) / totalCells;
        const peak = offsetPoint(midX, baseY(tMid), -depth);
        path.lineTo(peak.x, peak.y);
        path.lineTo(x1, baseY(t1));
      }
    }
  } else if (asymmetric) {
    const skew = (params.asymmetricSkew as number) || 0.5;
    const side = (params.asymmetricSide as string) || 'left';
    const hemBase = leftY + effectiveDepth;
    const hemRange = hemBase - leftY;
    const leftHem = (side === 'left' || side === 'both')
      ? hemBase
      : leftY + hemRange * (1 - skew);
    const rightHem = (side === 'right' || side === 'both')
      ? hemBase
      : leftY + hemRange * (1 - skew);
    const hemSpanW = rightX - leftX;
    const lcp1 = offsetPoint(leftX, leftY, (leftHem - leftY) * 0.3);
    path.cubicBezierTo(lcp1.x, lcp1.y, leftX + hemSpanW * 0.05, leftHem, leftX + hemSpanW * 0.15, leftHem);
    path.lineTo(leftX + hemSpanW * 0.5, (leftHem + rightHem) / 2);
    path.lineTo(leftX + hemSpanW * 0.85, rightHem);
    const rcp1 = offsetPoint(rightX, leftY, (rightHem - leftY) * 0.3);
    path.cubicBezierTo(leftX + hemSpanW * 0.95, rightHem, rcp1.x, rcp1.y, rightX, leftY);
  } else if (zigzag) {
    // Repeating pointed arches per segment (matches drawStyledEdge)
    const count = (params.zigzagCount as number) || 6;
    const depth = (params.zigzagDepth as number) || 3;
    const segW = hemSpan / count;
    for (let i = 0; i < count; i++) {
      const tMid = (i + 0.5) / count;
      const t1 = (i + 1) / count;
      const midX = leftX + segW * (i + 0.5);
      const endX = leftX + segW * (i + 1);
      const peak = offsetPoint(midX, baseY(tMid), depth);
      path.lineTo(peak.x, peak.y);
      path.lineTo(endX, baseY(t1));
    }
  } else if (wavy) {
    const count = (params.wavyCount as number) || 6;
    const depth = (params.wavyDepth as number) || 3;
    const segW = hemSpan / count;
    for (let i = 0; i < count; i++) {
      const tMid = (i + 0.5) / count;
      const tEnd = (i + 1) / count;
      const midX = leftX + segW * (i + 0.5);
      const endX = leftX + segW * (i + 1);
      const midBY = baseY(tMid);
      const mirrorI = i < count / 2 ? i : count - 1 - i;
      const d = (mirrorI % 2 === 0) ? depth : -depth;
      const ctrl = offsetPoint(midX, midBY, d);
      path.quadraticBezierTo(ctrl.x, ctrl.y, endX, baseY(tEnd));
    }
  } else if (castellated) {
    const count = (params.castellatedCount as number) || 8;
    const depth = (params.castellatedDepth as number) || 3;
    const segW = hemSpan / count;
    if (count % 2 === 1) {
      // Odd count: simple alternation is already symmetric (M C M C M)
      for (let i = 0; i < count; i++) {
        const startX = leftX + segW * i;
        const endX = leftX + segW * (i + 1);
        const tS = (startX - leftX) / hemSpan;
        const tE = (endX - leftX) / hemSpan;
        const bYS = baseY(tS);
        const bYE = baseY(tE);
        const isMerlon = i % 2 === 0;
        if (isMerlon) {
          const topL = offsetPoint(startX, bYS, depth);
          const topR = offsetPoint(endX, bYE, depth);
          path.lineTo(topL.x, topL.y);
          path.lineTo(topR.x, topR.y);
          path.lineTo(endX, bYE);
        } else {
          path.lineTo(endX, bYE);
        }
      }
    } else {
      // Even count: half-width crenel at each end for symmetry (½C M C M … C M ½C)
      const halfW = segW / 2;
      // First half-crenel
      {
        const endX = leftX + halfW;
        const tE = halfW / hemSpan;
        path.lineTo(endX, baseY(tE));
      }
      // Middle full segments
      for (let i = 1; i < count; i++) {
        const startX = leftX + halfW + segW * (i - 1);
        const endX = startX + segW;
        const tS = (startX - leftX) / hemSpan;
        const tE = (endX - leftX) / hemSpan;
        const bYS = baseY(tS);
        const bYE = baseY(tE);
        const isMerlon = i % 2 !== 0;
        if (isMerlon) {
          const topL = offsetPoint(startX, bYS, depth);
          const topR = offsetPoint(endX, bYE, depth);
          path.lineTo(topL.x, topL.y);
          path.lineTo(topR.x, topR.y);
          path.lineTo(endX, bYE);
        } else {
          path.lineTo(endX, bYE);
        }
      }
      // Last half-crenel
      path.lineTo(rightX, baseY(1));
    }
  } else if (dovetail) {
    // Flat gaps alternating with trapezoidal dovetail tabs (matches flag)
    const count = (params.dovetailCount as number) || 6;
    const depth = (params.dovetailDepth as number) || 3;
    const totalCells = 2 * count + 1;
    const cellW = hemSpan / totalCells;
    for (let i = 0; i < totalCells; i++) {
      const x1 = leftX + (i + 1) * cellW;
      const t1 = (i + 1) / totalCells;
      if (i % 2 === 0) {
        // Flat gap along baseline
        path.lineTo(x1, baseY(t1));
      } else {
        // Dovetail tab: narrow at baseline, wider at depth
        const midX = leftX + (i + 0.5) * cellW;
        const narrowHalf = cellW * 0.35;
        const wideHalf = cellW * 0.55;
        const tNL = (midX - narrowHalf - leftX) / hemSpan;
        const tWL = (midX - wideHalf - leftX) / hemSpan;
        const tWR = (midX + wideHalf - leftX) / hemSpan;
        const tNR = (midX + narrowHalf - leftX) / hemSpan;
        // Left narrow neck at baseline (behind — path arrives from left)
        path.lineTo(midX - narrowHalf, baseY(tNL));
        // Left wide flare at depth
        const ptWL = offsetPoint(midX - wideHalf, baseY(tWL), depth);
        path.lineTo(ptWL.x, ptWL.y);
        // Right wide flare at depth
        const ptWR = offsetPoint(midX + wideHalf, baseY(tWR), depth);
        path.lineTo(ptWR.x, ptWR.y);
        // Right narrow neck at baseline (ahead)
        path.lineTo(midX + narrowHalf, baseY(tNR));
      }
    }
  } else if (flame) {
    const depth = (params.flameDepth as number) || 6;
    // Fixed flame profile from Flames.svg, projected onto the curved baseline
    for (const cmd of FLAME_PROFILE) {
      if (cmd[0] === 2) {
        const t = cmd[1];
        const h = cmd[2] * depth;
        const x = leftX + t * hemSpan;
        const pt = offsetPoint(x, baseY(t), h);
        path.lineTo(pt.x, pt.y);
      } else if (cmd[0] === 3) {
        const pt1 = offsetPoint(leftX + cmd[1] * hemSpan, baseY(cmd[1]), cmd[2] * depth);
        const pt2 = offsetPoint(leftX + cmd[3] * hemSpan, baseY(cmd[3]), cmd[4] * depth);
        const pte = offsetPoint(leftX + cmd[5] * hemSpan, baseY(cmd[5]), cmd[6] * depth);
        path.cubicBezierTo(pt1.x, pt1.y, pt2.x, pt2.y, pte.x, pte.y);
      }
    }
    // Ensure path reaches the right edge
    path.lineTo(rightX, baseY(1));
  } else if (stepped) {
    // Staircase pyramid per segment: 3 steps ascending then 3 descending (matches drawStyledEdge)
    const count = (params.steppedCount as number) || 5;
    const depth = (params.steppedDepth as number) || 4;
    const segW = hemSpan / count;
    const steps = 3;
    const halfSteps = steps * 2;
    const subW = segW / halfSteps;
    for (let i = 0; i < count; i++) {
      const segStart = i / count;
      // Ascending steps
      for (let s = 0; s < steps; s++) {
        const d = depth * ((s + 1) / steps);
        const t0 = segStart + (s * subW) / hemSpan;
        const t1 = segStart + ((s + 1) * subW) / hemSpan;
        const x0 = leftX + segW * i + s * subW;
        const x1 = x0 + subW;
        const p0 = offsetPoint(x0, baseY(t0), d);
        const p1 = offsetPoint(x1, baseY(t1), d);
        path.lineTo(p0.x, p0.y);
        path.lineTo(p1.x, p1.y);
      }
      // Descending steps (mirror of ascending)
      for (let s = steps - 1; s >= 0; s--) {
        const d = depth * ((s + 1) / steps);
        const subIdx = halfSteps - 1 - s;
        const t0 = segStart + (subIdx * subW) / hemSpan;
        const t1 = segStart + ((subIdx + 1) * subW) / hemSpan;
        const x0 = leftX + segW * i + subIdx * subW;
        const x1 = x0 + subW;
        const p0 = offsetPoint(x0, baseY(t0), d);
        const p1 = offsetPoint(x1, baseY(t1), d);
        path.lineTo(p0.x, p0.y);
        path.lineTo(p1.x, p1.y);
      }
    }
  } else if (feathered) {
    // Overlapping elongated leaf/feather shapes (matches drawStyledEdge)
    const count = (params.hemEdgeCount as number) || 8;
    const depth = (params.hemEdgeDepth as number) || 3;
    const seed = (params.seed as number) || 12345;
    const scrambled = ((seed * 2654435761) >>> 0);
    const rng = new SeededRNG(scrambled);
    const segW = hemSpan / count;
    for (let i = 0; i < count; i++) {
      const t0 = i / count;
      const tMid = (i + 0.5) / count;
      const t1 = (i + 1) / count;
      const startX = leftX + segW * i;
      const endX = leftX + segW * (i + 1);
      const h = depth * (0.6 + rng.nextRange(0, 1) * 0.4);
      // Tip at midpoint + slight overlap
      const overlapT = 0.15 / count;
      const tipX = leftX + segW * (i + 0.5);
      const tipBY = baseY(tMid);
      const tip = offsetPoint(tipX, tipBY, h);
      // Smooth feather curve: up to tip
      const cp1 = offsetPoint(startX + segW * 0.2, baseY(t0 + 0.2 / count), h * 0.3);
      const cp2 = offsetPoint(tipX - segW * 0.1, tipBY, h * 0.1 + h);
      path.cubicBezierTo(cp1.x, cp1.y, cp2.x, cp2.y, tip.x, tip.y);
      // Smooth feather curve: down from tip
      const cp3 = offsetPoint(tipX + segW * 0.1, tipBY, h * 0.1 + h);
      const cp4 = offsetPoint(endX - segW * 0.2, baseY(t1 - 0.2 / count), h * 0.3);
      path.cubicBezierTo(cp3.x, cp3.y, cp4.x, cp4.y, endX, baseY(t1));
    }
  } else if (cloud) {
    // Billowy bumps of varying size, 3 arcs per segment (matches drawStyledEdge)
    const count = (params.hemEdgeCount as number) || 8;
    const depth = (params.hemEdgeDepth as number) || 3;
    const seed = (params.seed as number) || 12345;
    const scrambled = ((seed * 2654435761) >>> 0);
    const rng = new SeededRNG(scrambled);
    const segW = hemSpan / count;
    for (let i = 0; i < count; i++) {
      const subCount = 3;
      const subW = segW / subCount;
      for (let j = 0; j < subCount; j++) {
        const tStart = (i * segW + j * subW) / hemSpan;
        const tEnd = (i * segW + (j + 1) * subW) / hemSpan;
        const startX = leftX + i * segW + j * subW;
        const endX = startX + subW;
        const midX = (startX + endX) / 2;
        const tMid = (tStart + tEnd) / 2;
        const bumpH = depth * (0.4 + rng.nextRange(0, 1) * 0.6);
        const ctrl = offsetPoint(midX, baseY(tMid), bumpH);
        path.quadraticBezierTo(ctrl.x, ctrl.y, endX, baseY(tEnd));
      }
    }
  } else if (sawtooth) {
    // Asymmetric teeth — steep rise, gradual fall (matches drawStyledEdge)
    const count = (params.hemEdgeCount as number) || 8;
    const depth = (params.hemEdgeDepth as number) || 3;
    const curve = (params.sawtoothCurve as number) || 0;
    const reverse = !!(params.sawtoothReverse);
    const segW = hemSpan / count;
    for (let i = 0; i < count; i++) {
      const t1 = (i + 1) / count;
      const endX = leftX + segW * (i + 1);
      if (reverse) {
        // Gradual rise then steep drop
        const peakFrac = 0.75;
        const tPeak = (i + peakFrac) / count;
        const peakX = leftX + segW * (i + peakFrac);
        const peak = offsetPoint(peakX, baseY(tPeak), depth);
        if (curve > 0) {
          const tMid = (i + peakFrac / 2) / count;
          const midX = leftX + segW * (i + peakFrac / 2);
          const cp = offsetPoint(midX, baseY(tMid), depth * curve * 0.3);
          path.quadraticBezierTo(cp.x, cp.y, peak.x, peak.y);
        } else {
          path.lineTo(peak.x, peak.y);
        }
        path.lineTo(endX, baseY(t1));
      } else {
        // Steep rise then gradual slope
        const peakFrac = 0.25;
        const tPeak = (i + peakFrac) / count;
        const peakX = leftX + segW * (i + peakFrac);
        const peak = offsetPoint(peakX, baseY(tPeak), depth);
        path.lineTo(peak.x, peak.y);
        if (curve > 0) {
          const tMid = (i + (1 + peakFrac) / 2) / count;
          const midX = leftX + segW * (i + (1 + peakFrac) / 2);
          const cp = offsetPoint(midX, baseY(tMid), depth * curve * 0.3);
          path.quadraticBezierTo(cp.x, cp.y, endX, baseY(t1));
        } else {
          path.lineTo(endX, baseY(t1));
        }
      }
    }
  } else if (arrow) {
    // Arrow pattern: narrow stem with triangular arrowhead (matches flag)
    const count = (params.hemEdgeCount as number) || 8;
    const depth = (params.hemEdgeDepth as number) || 3;
    const segW = hemSpan / count;
    const stemW = segW * 0.15;
    const headW = segW * 0.4;
    for (let i = 0; i < count; i++) {
      const tMid = (i + 0.5) / count;
      const t1 = (i + 1) / count;
      const midX = leftX + segW * (i + 0.5);
      const endX = leftX + segW * (i + 1);
      // Left side of stem
      const stemL = offsetPoint(midX - stemW, baseY(tMid), 0);
      path.lineTo(stemL.x, stemL.y);
      const stemLBot = offsetPoint(midX - stemW, baseY(tMid), depth * 0.5);
      path.lineTo(stemLBot.x, stemLBot.y);
      // Arrowhead widens
      const headL = offsetPoint(midX - headW, baseY(tMid), depth * 0.5);
      path.lineTo(headL.x, headL.y);
      // Tip
      const tip = offsetPoint(midX, baseY(tMid), depth);
      path.lineTo(tip.x, tip.y);
      // Right side of arrowhead
      const headR = offsetPoint(midX + headW, baseY(tMid), depth * 0.5);
      path.lineTo(headR.x, headR.y);
      // Right side of stem
      const stemRBot = offsetPoint(midX + stemW, baseY(tMid), depth * 0.5);
      path.lineTo(stemRBot.x, stemRBot.y);
      const stemR = offsetPoint(midX + stemW, baseY(tMid), 0);
      path.lineTo(stemR.x, stemR.y);
      // Back to baseline
      path.lineTo(endX, baseY(t1));
    }
  } else if (picot) {
    // Small decorative loops (matches drawStyledEdge)
    const count = (params.hemEdgeCount as number) || 8;
    const depth = (params.hemEdgeDepth as number) || 3;
    const segW = hemSpan / count;
    for (let i = 0; i < count; i++) {
      const tMid = (i + 0.5) / count;
      const t1 = (i + 1) / count;
      const midX = leftX + segW * (i + 0.5);
      const endX = leftX + segW * (i + 1);
      const loopR = Math.min(depth * 0.5, segW * 0.3);
      // Line to just before loop
      const preX = midX - segW * 0.15;
      const preT = (i + 0.35) / count;
      path.lineTo(preX, baseY(preT));
      // Small circular bump
      const peakPt = offsetPoint(midX, baseY(tMid), loopR * 2);
      const cp1 = offsetPoint(midX - segW * 0.15, baseY(tMid), loopR * 1.5);
      const cp2 = offsetPoint(midX - segW * 0.075, baseY(tMid), loopR * 2);
      path.cubicBezierTo(cp1.x, cp1.y, cp2.x, cp2.y, peakPt.x, peakPt.y);
      const cp3 = offsetPoint(midX + segW * 0.075, baseY(tMid), loopR * 2);
      const cp4 = offsetPoint(midX + segW * 0.15, baseY(tMid), loopR * 1.5);
      const postX = midX + segW * 0.15;
      const postT = (i + 0.65) / count;
      path.cubicBezierTo(cp3.x, cp3.y, cp4.x, cp4.y, postX, baseY(postT));
      // Continue to segment end
      path.lineTo(endX, baseY(t1));
    }
  } else if (thorned) {
    // Equally spaced sharp triangular thorns along the hem
    // 2*count+1 cells: flat gaps alternating with thorn spikes
    const count = (params.hemEdgeCount as number) || 8;
    const depth = (params.hemEdgeDepth as number) || 3;
    const totalCells = 2 * count + 1;
    const cellW = hemSpan / totalCells;
    for (let i = 0; i < totalCells; i++) {
      const t1 = (i + 1) / totalCells;
      const x1 = leftX + (i + 1) * cellW;
      if (i % 2 === 0) {
        // Flat gap along baseline
        path.lineTo(x1, baseY(t1));
      } else {
        // Sharp thorn: narrow triangular spike
        const tPeakStart = (i + 0.35) / totalCells;
        const tPeak = (i + 0.5) / totalCells;
        const tPeakEnd = (i + 0.65) / totalCells;
        const peakStartX = leftX + (i + 0.35) * cellW;
        const peakX = leftX + (i + 0.5) * cellW;
        const peakEndX = leftX + (i + 0.65) * cellW;
        // Rise to peak
        path.lineTo(peakStartX, baseY(tPeakStart));
        const peak = offsetPoint(peakX, baseY(tPeak), depth);
        path.lineTo(peak.x, peak.y);
        // Descend from peak
        path.lineTo(peakEndX, baseY(tPeakEnd));
        // Continue to cell end
        path.lineTo(x1, baseY(t1));
      }
    }
  } else if (torn) {
    // Segment-based styles (torn remains as phase-based sampling)
    const count = (params.hemEdgeCount as number) || 8;
    const depth = (params.hemEdgeDepth as number) || 3;
    const seed = (params.seed as number) || 12345;
    const segments = Math.max(count * 4, 40);
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const xPos = leftX + hemSpan * t;
      const bY = baseY(t);
      const rng = new SeededRNG(seed + i * 7 + 31);
      const r1 = rng.nextRange(0, 1);
      const r2 = rng.nextRange(0, 1);
      let off = r1 < 0.2 ? depth * (0.7 + r2 * 0.3) : depth * r2 * 0.4;
      if (rng.nextRange(0, 1) > 0.65) off *= -0.3;
      const pt = offsetPoint(xPos, bY, off);
      path.lineTo(pt.x, pt.y);
    }
  }

  // Return path to baseline on the right before drawing the side curve
  // (symmetric with the implicit rise from baseline to hem on the left)
  path.lineTo(rightX, rightY);
  // Draw the right side back up at actual length with hemWidth taper
  drawRight();
}

/**
 * Generate irregular worn/torn hole shapes as separate cut paths.
 * Produces varied organic hole shapes using seeded RNG for reproducibility.
 * Each seed produces a unique arrangement of tear/wear patterns.
 */
function generateWornHoles(
  w: number, h: number, count: number, size: number, seed: number,
  params: TemplateParams
): string[] {
  const rng = new SeededRNG(seed);
  const paths: string[] = [];
  const placed: Array<{x: number; y: number; r: number}> = [];
  const refH = REF_H;

  // Build exclusion zones
  const exclusions: Array<{x: number; y: number; r: number}> = [];
  const holeCx = w / 2;
  const holeOff = w * REF_HOLE_OFFSET;
  const holeY = refH * REF_HOLE_Y;
  const holeR = (params.holeRadius as number) || REF_HOLE_RADIUS;
  exclusions.push({ x: holeCx - holeOff, y: holeY, r: holeR + size + 1 });
  exclusions.push({ x: holeCx + holeOff, y: holeY, r: holeR + size + 1 });
  exclusions.push({ x: holeCx, y: refH * 0.15, r: w * 0.12 });
  if (params.armSlits) {
    const armY = refH * ((params.armSlitY as number) || 0.35);
    exclusions.push({ x: w * 0.22, y: armY, r: size + 4 });
    exclusions.push({ x: w * 0.78, y: armY, r: size + 4 });
  }
  if (params.swordSlit) {
    const swordY = h * ((params.swordY as number) || 0.45);
    const swordX = (params.swordSide === 'left') ? w * 0.35 : w * 0.65;
    exclusions.push({ x: swordX, y: swordY, r: size + 5 });
  }

  const sideEndY = refH * 0.89712;
  const safeMinX = w * 0.15;
  const safeMaxX = w * 0.85;
  const safeMinY = h * 0.20;
  const safeMaxY = Math.max(safeMinY + size, sideEndY - size - 2);

  // Hole shape types for variety
  const shapeTypes = ['tear', 'crescent', 'ragged', 'elongated', 'moth'] as const;

  for (let i = 0; i < count; i++) {
    let cx = 0, cy = 0, placed_ok = false;
    for (let attempt = 0; attempt < 40; attempt++) {
      cx = safeMinX + rng.next() * (safeMaxX - safeMinX);
      cy = safeMinY + rng.next() * (safeMaxY - safeMinY);
      const blocked = exclusions.some(e => Math.hypot(e.x - cx, e.y - cy) < e.r);
      const tooClose = placed.some(p => Math.hypot(p.x - cx, p.y - cy) < p.r + size * 1.8);
      if (!blocked && !tooClose) { placed_ok = true; break; }
    }
    if (!placed_ok) continue;

    // Per-hole variation: 40%-180% of base size
    const holeSize = size * (0.4 + rng.next() * 1.4);
    placed.push({ x: cx, y: cy, r: holeSize });

    // Pick shape type based on seed+index for variety
    const shapeType = shapeTypes[Math.floor(rng.next() * shapeTypes.length)];
    const rotation = rng.next() * Math.PI * 2;
    const path = new SVGPath();

    if (shapeType === 'tear') {
      // Teardrop/water-drop torn shape — radius clamped to prevent crossing
      const vertCount = 6 + Math.floor(rng.next() * 4);
      const pts: Array<{x: number; y: number}> = [];
      let prevR = 0;
      for (let v = 0; v < vertCount; v++) {
        const a = rotation + (v / vertCount) * Math.PI * 2;
        const stretch = 1.0 + Math.sin(a - rotation) * 0.5;
        let r = holeSize * (0.35 + rng.next() * 0.7) * stretch;
        if (prevR > 0) r = Math.max(r, prevR * 0.35); // prevent extreme shrinkage between adjacent
        prevR = r;
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      }
      path.moveTo(pts[0].x, pts[0].y);
      for (let v = 0; v < vertCount; v++) {
        const curr = pts[v], next = pts[(v + 1) % vertCount];
        const segLen = Math.hypot(next.x - curr.x, next.y - curr.y);
        const cpOff = Math.min(segLen * 0.35, holeSize * 0.3);
        const mx = (curr.x + next.x) / 2, my = (curr.y + next.y) / 2;
        const nx = -(next.y - curr.y), ny = (next.x - curr.x);
        const nl = Math.hypot(nx, ny) || 1;
        const bulge = (rng.next() - 0.4) * cpOff;
        path.quadraticBezierTo(mx + nx / nl * bulge, my + ny / nl * bulge, next.x, next.y);
      }
    } else if (shapeType === 'crescent') {
      // Crescent/bite shape (partial arc subtraction)
      const arcRadius = holeSize * (0.8 + rng.next() * 0.6);
      const arcAngle = Math.PI * (0.5 + rng.next() * 0.7);
      const steps = 8 + Math.floor(rng.next() * 4);
      const pts: Array<{x: number; y: number}> = [];
      // Outer arc
      for (let s = 0; s <= steps; s++) {
        const a = rotation - arcAngle / 2 + (s / steps) * arcAngle;
        const r = arcRadius * (0.85 + rng.next() * 0.3);
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      }
      // Inner arc (narrower, back)
      const innerR = arcRadius * (0.3 + rng.next() * 0.3);
      for (let s = steps; s >= 0; s--) {
        const a = rotation - arcAngle / 2 + (s / steps) * arcAngle;
        const r = innerR * (0.7 + rng.next() * 0.6);
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      }
      path.moveTo(pts[0].x, pts[0].y);
      for (let p = 1; p < pts.length; p++) {
        const prev = pts[p - 1], curr = pts[p];
        const cpOff = holeSize * 0.15;
        path.quadraticBezierTo(
          (prev.x + curr.x) / 2 + (rng.next() - 0.5) * cpOff,
          (prev.y + curr.y) / 2 + (rng.next() - 0.5) * cpOff,
          curr.x, curr.y
        );
      }
    } else if (shapeType === 'ragged') {
      // Ragged/spiky torn hole — min radius clamped to prevent self-intersection
      const vertCount = 8 + Math.floor(rng.next() * 6);
      const stepAngle = (Math.PI * 2) / vertCount;
      const minRadiusFrac = Math.sin(stepAngle / 2) * 1.1; // star-convex safety bound
      const pts: Array<{x: number; y: number}> = [];
      for (let v = 0; v < vertCount; v++) {
        const a = rotation + (v / vertCount) * Math.PI * 2;
        const spike = (v % 2 === 0) ? (0.6 + rng.next() * 0.6) : Math.max(minRadiusFrac, 0.3 + rng.next() * 0.25);
        const r = holeSize * spike;
        pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
      }
      path.moveTo(pts[0].x, pts[0].y);
      for (let v = 0; v < vertCount; v++) {
        const next = pts[(v + 1) % vertCount];
        path.lineTo(next.x, next.y);
      }
    } else if (shapeType === 'elongated') {
      // Elongated tear/rip (stretched in one direction)
      const vertCount = 7 + Math.floor(rng.next() * 3);
      const stretchX = 0.4 + rng.next() * 0.4;
      const stretchY = 1.5 + rng.next() * 1.0;
      const pts: Array<{x: number; y: number}> = [];
      for (let v = 0; v < vertCount; v++) {
        const a = (v / vertCount) * Math.PI * 2;
        const r = holeSize * (0.4 + rng.next() * 0.6);
        const dx = r * Math.cos(a) * stretchX;
        const dy = r * Math.sin(a) * stretchY;
        const rx = dx * Math.cos(rotation) - dy * Math.sin(rotation);
        const ry = dx * Math.sin(rotation) + dy * Math.cos(rotation);
        pts.push({ x: cx + rx, y: cy + ry });
      }
      path.moveTo(pts[0].x, pts[0].y);
      for (let v = 0; v < vertCount; v++) {
        const curr = pts[v], next = pts[(v + 1) % vertCount];
        const cpOff = holeSize * 0.3;
        const mx = (curr.x + next.x) / 2, my = (curr.y + next.y) / 2;
        path.quadraticBezierTo(mx + (rng.next() - 0.5) * cpOff, my + (rng.next() - 0.5) * cpOff, next.x, next.y);
      }
    } else {
      // Moth-eaten: cluster of small non-overlapping irregular circles
      const clusterCount = 2 + Math.floor(rng.next() * 3);
      const subCenters: Array<{x: number; y: number; r: number}> = [];
      for (let c = 0; c < clusterCount; c++) {
        // Place each sub-circle ensuring no overlap with previous ones
        let subCx = cx, subCy = cy, subR = holeSize * (0.25 + rng.next() * 0.35);
        for (let a = 0; a < 10; a++) {
          const offA = rng.next() * Math.PI * 2;
          const offR = holeSize * (0.4 + rng.next() * 0.6);
          subCx = cx + offR * Math.cos(offA);
          subCy = cy + offR * Math.sin(offA);
          const overlaps = subCenters.some(sc => Math.hypot(sc.x - subCx, sc.y - subCy) < sc.r + subR + 0.2);
          if (!overlaps) break;
        }
        subCenters.push({ x: subCx, y: subCy, r: subR });
        const subVerts = 5 + Math.floor(rng.next() * 3);
        const subPts: Array<{x: number; y: number}> = [];
        for (let v = 0; v < subVerts; v++) {
          const a = (v / subVerts) * Math.PI * 2;
          const r = subR * (0.7 + rng.next() * 0.6);
          subPts.push({ x: subCx + r * Math.cos(a), y: subCy + r * Math.sin(a) });
        }
        path.moveTo(subPts[0].x, subPts[0].y);
        for (let v = 0; v < subVerts; v++) {
          const next = subPts[(v + 1) % subVerts];
          const curr = subPts[v];
          const cpOff = subR * 0.3;
          path.quadraticBezierTo(
            (curr.x + next.x) / 2 + (rng.next() - 0.5) * cpOff,
            (curr.y + next.y) / 2 + (rng.next() - 0.5) * cpOff,
            next.x, next.y
          );
        }
        path.closePath();
      }
      paths.push(path.toString());
      continue; // moth has its own closePath logic
    }
    path.closePath();
    paths.push(path.toString());
  }
  return paths;
}

/**
 * Generate arm slit cut lines as separate cut paths (one per side).
 */
function generateArmSlits(
  w: number, h: number, yFrac: number, slitLen: number
): string[] {
  const refH = REF_H;
  const cy = refH * yFrac;
  const half = slitLen / 2;
  // Clamp slit to stay below attachment holes and above the hem
  const holeBottom = refH * 0.156 + 2.36 + 1.5;
  const hemTop = refH * 0.89712 - 1.5;
  const top = Math.max(cy - half, holeBottom);
  const bottom = Math.min(cy + half, hemTop);
  // Place at ~22% / 78% width — safely inside the cape body
  const leftPath = new SVGPath();
  leftPath.moveTo(w * 0.22, top);
  leftPath.lineTo(w * 0.22, bottom);
  const rightPath = new SVGPath();
  rightPath.moveTo(w * 0.78, top);
  rightPath.lineTo(w * 0.78, bottom);
  return [leftPath.toString(), rightPath.toString()];
}

/** Reference keyhole radius in mm */
const REF_SLIT_R = 1.3;
/** Reference keyhole center Y (fraction of height) */
const REF_SLIT_CENTER_Y = 0.295;
/** Reference head-pin hole radius in mm */
const REF_HOLE_RADIUS = 2.36;
/** Reference hole Y position (fraction of height) */
const REF_HOLE_Y = 0.156;
/** Reference hole X offset from center (fraction of width) */
const REF_HOLE_OFFSET = 0.127;

/**
 * Draw the neck opening from center bottom up to the left shoulder peak.
 * Call this as the FIRST thing after moveTo(cx, neckBottomY).
 * The outline goes between the two neck arm sections.
 */
function drawRefNeck(path: SVGPath, w: number, h: number) {
  // --- Neck left arm: 3 cubics from neck-bottom (center) up to left shoulder peak ---
  path.cubicBezierTo(w * 0.46734, h * 0.04666, w * 0.46423, h * 0.04467, w * 0.44870, h * 0.02594);
  path.cubicBezierTo(w * 0.43236, h * 0.00626, w * 0.42500, h * 0.00000, w * 0.41816, h * 0.00000);
  path.cubicBezierTo(w * 0.41366, h * 0.00000, w * 0.38230, h * 0.00476, w * 0.35585, h * 0.00946);

  // <<< caller inserts outline here >>>
}

/**
 * Complete the neck right arm after the outline.
 * Call after drawRefOutline / custom outline has been drawn,
 * with the path positioned at right shoulder peak (0.64415w, 0.00946h).
 */
function closeRefNeck(path: SVGPath, w: number, h: number) {
  const cx = w / 2;
  // --- Neck right arm: 3 cubics from right shoulder peak to neck-bottom (center) ---
  path.cubicBezierTo(w * 0.61770, h * 0.00476, w * 0.58634, h * 0.00000, w * 0.58184, h * 0.00000);
  path.cubicBezierTo(w * 0.57500, h * 0.00000, w * 0.56764, h * 0.00626, w * 0.55130, h * 0.02594);
  path.cubicBezierTo(w * 0.53577, h * 0.04467, w * 0.53266, h * 0.04666, cx, h * 0.04778);

  path.closePath();
}

/**
 * Generate the center neck slit as a single cut line from the neck opening
 * down to the top of the keyhole circle.
 */
function generateCenterSlit(w: number, h: number): string {
  const cx = w / 2;
  const neckBottomY = h * 0.04778;
  const keyholeTopY = h * REF_SLIT_CENTER_Y - REF_SLIT_R;
  const path = new SVGPath();
  path.moveTo(cx, neckBottomY);
  path.lineTo(cx, keyholeTopY);
  return path.toString();
}

/**
 * Generate the center keyhole as a separate circle cut path.
 */
function generateCenterKeyhole(w: number, h: number): string {
  const cx = w / 2;
  const keyholeY = h * REF_SLIT_CENTER_Y;
  const path = new SVGPath();
  path.moveTo(cx, keyholeY - REF_SLIT_R);
  path.arcTo(REF_SLIT_R, REF_SLIT_R, 0, 1, 1, cx, keyholeY + REF_SLIT_R);
  path.arcTo(REF_SLIT_R, REF_SLIT_R, 0, 1, 1, cx, keyholeY - REF_SLIT_R);
  path.closePath();
  return path.toString();
}

/**
 * Generate attachment hole paths for variable hole count.
 * Holes are evenly distributed around center at the reference Y position.
 */
function generateRefHoles(w: number, h: number, holeRadius: number, holeCount: number = 2, params?: TemplateParams): string[] {
  const cx = w / 2;
  const holeY = h * REF_HOLE_Y;
  if (holeCount === 1) {
    return [generateAttachmentHole(cx, holeY, holeRadius, 0, 0, false, params)];
  }
  const totalSpan = w * REF_HOLE_OFFSET * 2;
  const holes: string[] = [];
  for (let i = 0; i < holeCount; i++) {
    const x = cx - totalSpan / 2 + (totalSpan / (holeCount - 1)) * i;
    holes.push(generateAttachmentHole(x, holeY, holeRadius, 0, 0, false, params));
  }
  return holes;
}

/**
 * Generate extra slit cut lines for 3+ hole configurations.
 * Each slit is a single vertical cut line between consecutive hole positions.
 */
function generateExtraSlits(w: number, h: number, holeCount: number): string[] {
  if (holeCount <= 2) return [];
  const cx = w / 2;
  const totalSpan = w * REF_HOLE_OFFSET * 2;
  const slitTopY = h * 0.04778;
  const keyholeTopY = h * REF_SLIT_CENTER_Y - REF_SLIT_R;
  const slits: string[] = [];
  for (let i = 0; i < holeCount - 1; i++) {
    const slitCx = cx - totalSpan / 2 + (totalSpan / (holeCount - 1)) * (i + 0.5);
    // Skip the center slit (already generated separately)
    if (Math.abs(slitCx - cx) < 0.1) continue;
    const path = new SVGPath();
    path.moveTo(slitCx, slitTopY);
    path.lineTo(slitCx, keyholeTopY);
    slits.push(path.toString());
  }
  return slits;
}

/**
 * CapeStandard: Classic LEGO minifigure cape
 * Based directly on standard-cape.svg
 * Dimensions: ~40mm wide × 39mm tall
 */
export class CapeStandard extends Template {
  generateCutPath(params: TemplateParams): string {
    const { length, width } = params;
    const path = new SVGPath();
    const w = width;
    const h = length;
    const refH = REF_H;

    // Neck uses fixed refH so it stays in place; body uses actual h so bottom extends
    path.moveTo(w / 2, refH * 0.04778);
    drawRefNeck(path, w, refH);

    drawModifiedOutline(path, w, h, params);

    closeRefNeck(path, w, refH);
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius } = params;
    // Holes use REF_H so they stay in the same position regardless of length
    const paths = [this.generateCutPath(params), ...generateRefHoles(width, REF_H, holeRadius, 2, params)];
    // Center slit (single line) and keyhole circle
    paths.push(generateCenterSlit(width, REF_H));
    paths.push(generateCenterKeyhole(width, REF_H));
    if (params.swordSlit) {
      paths.push(generateSwordSlit(
        width, length,
        params.swordSide as string || 'right',
        params.swordAngle as number || 35,
        params.swordY as number || 0.45
      ));
    }
    if (params.starHoles) {
      const holePaths = generateWornHoles(
        width, length,
        (params.starHoleCount as number) || 5,
        (params.starHoleSize as number) || 1.5,
        (params.seed as number) || 12345,
        params
      );
      // Add worn holes as separate cut paths for boolean subtraction via evenodd
      paths.push(...holePaths);
    }
    if (params.armSlits) {
      paths.push(...generateArmSlits(
        width, length,
        (params.armSlitY as number) || 0.25,
        (params.armSlitLength as number) || 6
      ));
    }
    return paths;
  }

  generateScorePaths(params: TemplateParams): string[] { return []; }
  generateEngravePaths(params: TemplateParams): string[] { return []; }

  export(
    id: string,
    name: string,
    elementType: string,
    variantName: string,
    params: TemplateParams
  ): PatternExport {
    const result = super.export(id, name, elementType, variantName, params);
    // Compute effective height when modifiers extend beyond params.length
    const w = params.width;
    const h = params.length;
    const hemW = (params.hemWidth as number) || 1.0;
    const cx = w / 2;
    const leftX = cx + (w * 0.00193 - cx) * hemW;
    const rightX = cx + (w * 0.99807 - cx) * hemW;
    const sideY = h * 0.89712;
    let maxY = h;
    const halfW = (rightX - leftX) / 2;
    {
      const bottomCurveAmt = (params.bottomCurve as number) || 0;
      if (bottomCurveAmt > 0) maxY = Math.max(maxY, sideY + bottomCurveAmt * halfW);
    }
    if (params.zigzag) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.zigzagDepth as number) || 3));
    }
    if (params.wavy) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.wavyDepth as number) || 3));
    }
    if (params.castellated) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.castellatedDepth as number) || 3));
    }
    if (params.dovetail) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.dovetailDepth as number) || 3));
    }
    if (params.notched) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.notchedDepth as number) || 3));
    }
    if (params.flame) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.flameDepth as number) || 6));
    }
    if (params.stepped) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.steppedDepth as number) || 4));
    }
    if (params.scalloped) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.scallopDepth as number) || 3));
    }
    if (params.torn) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.tornDepth as number) || 3));
    }
    if (params.feathered) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.featheredDepth as number) || 3));
    }
    if (params.cloud) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.cloudDepth as number) || 3));
    }
    if (params.sawtooth) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.sawtoothDepth as number) || 3));
    }
    if (params.arrow) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.arrowDepth as number) || 3));
    }
    if (params.picot) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.picotDepth as number) || 3));
    }
    if (maxY > result.boundingBox.height) {
      result.boundingBox.height = maxY;
    }
    // Compute actual X extents from hemWidth, sideStyle, and default bounds
    let minX = 0;
    let maxX = w;
    if (hemW !== 1.0) {
      minX = Math.min(minX, leftX);
      maxX = Math.max(maxX, rightX);
    }
    const sideStyle = (params.sideStyle as string) || 'none';
    if (sideStyle !== 'none') {
      const sideDepth = (params.sideStyleDepth as number) || 3;
      minX = Math.min(minX, -sideDepth);
      maxX = Math.max(maxX, w + sideDepth);
    }
    result.boundingBox.x = minX;
    result.boundingBox.width = maxX - minX;
    return result;
  }
}

/** Standard hole radius for single-hole capes */
const STD_NARROW_HOLE_R = 2.36;

/**
 * CapeNarrowSingleHole: Narrow leaf/teardrop cape with single centered hole.
 * Fully procedural — supports all hem/side/transform features.
 * Dimensions: ~28mm wide × 36mm tall
 */
export class CapeNarrowSingleHole extends Template {
  generateCutPath(params: TemplateParams): string {
    const { length, width } = params;
    const path = new SVGPath();
    const w = width;
    const h = length;

    // Start at top apex of leaf shape (centered)
    path.moveTo(w * 0.5, h * 0.0014);

    drawModifiedOutline(path, w, h, params, NARROW_PROFILE);

    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length } = params;
    const paths = [this.generateCutPath(params)];
    // Single centered attachment hole
    const holeCx = width * 0.5;
    const holeCy = length * 0.14;
    paths.push(generateAttachmentHole(holeCx, holeCy, STD_NARROW_HOLE_R, 0, 0, false, params));
    if (params.swordSlit) {
      paths.push(generateSwordSlit(
        width, length,
        params.swordSide as string || 'right',
        params.swordAngle as number || 35,
        params.swordY as number || 0.45,
        8,
        (params.swordSlitCount as number) || 1,
        (params.swordSlitSpacing as number) || 3
      ));
    }
    if (params.starHoles) {
      const holePaths = generateWornHoles(
        width, length,
        (params.starHoleCount as number) || 5,
        (params.starHoleSize as number) || 1.5,
        (params.seed as number) || 12345,
        params
      );
      paths.push(...holePaths);
    }
    if (params.armSlits) {
      paths.push(...generateArmSlits(
        width, length,
        (params.armSlitY as number) || 0.25,
        (params.armSlitLength as number) || 6
      ));
    }
    return paths;
  }

  generateScorePaths(_params: TemplateParams): string[] { return []; }
  generateEngravePaths(_params: TemplateParams): string[] { return []; }

  export(
    id: string,
    name: string,
    elementType: string,
    variantName: string,
    params: TemplateParams
  ): PatternExport {
    const result = super.export(id, name, elementType, variantName, params);
    const w = params.width;
    const h = params.length;
    const hemW = (params.hemWidth as number) || 1.0;
    const cx = w / 2;
    const leftX = cx + (w * 0.0068 - cx) * hemW;
    const rightX = cx + (w * 0.9932 - cx) * hemW;
    const sideY = h * 0.8464;
    let maxY = h;
    const halfW = (rightX - leftX) / 2;
    {
      const bottomCurveAmt = (params.bottomCurve as number) || 0;
      if (bottomCurveAmt > 0) maxY = Math.max(maxY, sideY + bottomCurveAmt * halfW);
    }
    if (params.zigzag) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.zigzagDepth as number) || 3));
    }
    if (params.wavy) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.wavyDepth as number) || 3));
    }
    if (params.castellated) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.castellatedDepth as number) || 3));
    }
    if (params.dovetail) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.dovetailDepth as number) || 3));
    }
    if (params.notched) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.notchedDepth as number) || 3));
    }
    if (params.flame) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.flameDepth as number) || 6));
    }
    if (params.stepped) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.steppedDepth as number) || 4));
    }
    if (params.scalloped) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.scallopDepth as number) || 3));
    }
    if (params.torn) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.tornDepth as number) || 3));
    }
    if (params.feathered) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.featheredDepth as number) || 3));
    }
    if (params.cloud) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.cloudDepth as number) || 3));
    }
    if (params.sawtooth) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.sawtoothDepth as number) || 3));
    }
    if (params.arrow) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.arrowDepth as number) || 3));
    }
    if (params.picot) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.picotDepth as number) || 3));
    }
    if (maxY > result.boundingBox.height) {
      result.boundingBox.height = maxY;
    }
    let minX = 0;
    let maxX = w;
    if (hemW !== 1.0) {
      minX = Math.min(minX, leftX);
      maxX = Math.max(maxX, rightX);
    }
    const sideStyle = (params.sideStyle as string) || 'none';
    if (sideStyle !== 'none') {
      const sideDepth = (params.sideStyleDepth as number) || 3;
      minX = Math.min(minX, -sideDepth);
      maxX = Math.max(maxX, w + sideDepth);
    }
    result.boundingBox.x = minX;
    result.boundingBox.width = maxX - minX;
    return result;
  }
}

/**
 * CapeTattered: Ragged/tattered hem using seeded noise
 * Same flowing drape shape as standard, with roughed-up bottom edge
 */
export class CapeTattered extends Template {
  generateCutPath(params: TemplateParams): string {
    const { length, width, seed = 42 } = params;
    const rng = new SeededRNG(seed as number);
    const path = new SVGPath();
    const w = width;
    const h = length;

    path.moveTo(w / 2, h * 0.04778);
    drawRefNeck(path, w, h);

    // Reference left side: 21 beziers (shoulder → y ≈ 0.897h)
    drawRefLeftSide(path, w, h);
    // Left side now at approximately (0.00193w, 0.89712h)

    // Tattered bottom edge from left edge to right edge at ~0.9h
    const hemY = h * 0.89712;
    const hemEndX = w * 0.99807; // mirror of left endpoint X
    const segmentCount = Math.max(8, Math.floor(w / 3));
    const jitterMax = w * 0.06;

    for (let i = 0; i <= segmentCount; i++) {
      const t = i / segmentCount;
      const xPos = w * 0.00193 + (hemEndX - w * 0.00193) * t;
      const yJitter = rng.nextRange(-jitterMax, jitterMax);
      // Sine drape: deepest at center, shallow at edges
      const baseY = hemY + (h - hemY) * Math.sin(t * Math.PI);
      path.lineTo(xPos, baseY + yJitter);
    }

    // Reference right side: 21 mirrored beziers (y ≈ 0.897h → shoulder)
    drawRefRightSide(path, w, h);

    closeRefNeck(path, w, h);
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius } = params;
    const paths = [this.generateCutPath(params), ...generateRefHoles(width, length, holeRadius)];
    paths.push(generateCenterSlit(width, length));
    paths.push(generateCenterKeyhole(width, length));
    if (params.swordSlit) {
      paths.push(generateSwordSlit(
        width, length,
        params.swordSide as string || 'right',
        params.swordAngle as number || 35,
        params.swordY as number || 0.45,
        8,
        (params.swordSlitCount as number) || 1,
        (params.swordSlitSpacing as number) || 3
      ));
    }
    return paths;
  }

  generateScorePaths(params: TemplateParams): string[] { return []; }
  generateEngravePaths(params: TemplateParams): string[] { return []; }

  export(
    id: string,
    name: string,
    elementType: string,
    variantName: string,
    params: TemplateParams
  ): PatternExport {
    const result = super.export(id, name, elementType, variantName, params);
    // Tattered hem jitter can extend up to 6% of width beyond the base hem
    const jitterMax = params.width * 0.06;
    const hemY = params.length * 0.89712;
    const hemDepth = params.length - hemY;
    result.boundingBox.height = hemY + hemDepth + jitterMax;
    return result;
  }
}

/**
 * CapeReferenceTest: Exact reproduction of standard-cape.svg, made symmetric.
 *
 * Every coordinate is traced from the reference SVG path data with the
 * group transform applied, then normalized to (w, h).  The left side of the
 * reference is used as authority and mirrored for the right side so the cape
 * is perfectly symmetric about x = w/2.
 *
 * Path topology (single closed path):
 *   moveTo  → neck-opening bottom (center)
 *   3 cubics → neck left arm up to left shoulder peak
 *  25 cubics → left side down to bottom-center
 *   lineTo  → bottom-center bridge to mirrored start
 *  25 cubics → right side up (mirrored left) to right shoulder peak
 *   3 cubics → neck right arm down to neck-opening bottom (center)
 *   close   → back to start
 * Slit + keyhole rendered as separate cut paths.
 */
export class CapeReferenceTest extends Template {
  generateCutPath(params: TemplateParams): string {
    const { length, width } = params;
    const path = new SVGPath();
    const w = width;
    const h = length;

    const cx = w / 2;

    // --- Start at neck-opening bottom (center) ---
    path.moveTo(cx, h * 0.04778);

    // --- Neck left arm: 3 reversed cubics → left shoulder peak ---
    path.cubicBezierTo(w * 0.46734, h * 0.04666, w * 0.46423, h * 0.04467, w * 0.44870, h * 0.02594);
    path.cubicBezierTo(w * 0.43236, h * 0.00626, w * 0.42500, h * 0.00000, w * 0.41816, h * 0.00000);
    path.cubicBezierTo(w * 0.41366, h * 0.00000, w * 0.38230, h * 0.00476, w * 0.35585, h * 0.00946);

    // --- Left side: 25 cubics from shoulder peak down to bottom-center ---
    path.cubicBezierTo(w * 0.34058, h * 0.01217, w * 0.31290, h * 0.01849, w * 0.30793, h * 0.02040);
    path.cubicBezierTo(w * 0.29702, h * 0.02459, w * 0.28376, h * 0.03298, w * 0.27895, h * 0.03873);
    path.cubicBezierTo(w * 0.27002, h * 0.04942, w * 0.25938, h * 0.06828, w * 0.23779, h * 0.11174);
    path.cubicBezierTo(w * 0.22615, h * 0.13518, w * 0.21624, h * 0.15492, w * 0.21578, h * 0.15561);
    path.cubicBezierTo(w * 0.21459, h * 0.15739, w * 0.19440, h * 0.20213, w * 0.18948, h * 0.21389);
    path.cubicBezierTo(w * 0.18724, h * 0.21926, w * 0.17947, h * 0.23755, w * 0.17222, h * 0.25453);
    path.cubicBezierTo(w * 0.16105, h * 0.28069, w * 0.14695, h * 0.31696, w * 0.14695, h * 0.31955);
    path.cubicBezierTo(w * 0.14695, h * 0.31996, w * 0.14615, h * 0.32208, w * 0.14517, h * 0.32427);
    path.cubicBezierTo(w * 0.14150, h * 0.33246, w * 0.10078, h * 0.45578, w * 0.09352, h * 0.48070);
    path.cubicBezierTo(w * 0.09170, h * 0.48694, w * 0.08892, h * 0.49630, w * 0.08734, h * 0.50149);
    path.cubicBezierTo(w * 0.08405, h * 0.51230, w * 0.07365, h * 0.54804, w * 0.06387, h * 0.58214);
    path.cubicBezierTo(w * 0.06019, h * 0.59496, w * 0.05631, h * 0.60828, w * 0.05526, h * 0.61175);
    path.cubicBezierTo(w * 0.04892, h * 0.63252, w * 0.04331, h * 0.65211, w * 0.04119, h * 0.66089);
    path.cubicBezierTo(w * 0.03985, h * 0.66643, w * 0.03771, h * 0.67494, w * 0.03644, h * 0.67979);
    path.cubicBezierTo(w * 0.03518, h * 0.68464, w * 0.03328, h * 0.69229, w * 0.03223, h * 0.69680);
    path.cubicBezierTo(w * 0.03118, h * 0.70130, w * 0.02728, h * 0.71775, w * 0.02356, h * 0.73334);
    path.cubicBezierTo(w * 0.01984, h * 0.74893, w * 0.01564, h * 0.76849, w * 0.01424, h * 0.77681);
    path.cubicBezierTo(w * 0.01284, h * 0.78513, w * 0.01031, h * 0.80015, w * 0.00862, h * 0.81020);
    path.cubicBezierTo(w * 0.00694, h * 0.82025, w * 0.00532, h * 0.82932, w * 0.00503, h * 0.83036);
    path.cubicBezierTo(w * 0.00473, h * 0.83140, w * 0.00333, h * 0.84161, w * 0.00191, h * 0.85304);
    path.cubicBezierTo(w * -0.00065, h * 0.87357, w * -0.00063, h * 0.89219, w * 0.00193, h * 0.89712);
    path.cubicBezierTo(w * 0.00409, h * 0.90125, w * 0.00828, h * 0.90362, w * 0.03267, h * 0.91449);
    path.cubicBezierTo(w * 0.07094, h * 0.93155, w * 0.12346, h * 0.94865, w * 0.18105, h * 0.96279);
    path.cubicBezierTo(w * 0.22355, h * 0.97322, w * 0.23299, h * 0.97505, w * 0.29379, h * 0.98465);
    path.cubicBezierTo(w * 0.35859, h * 0.99487, w * 0.37646, h * 0.99729, w * 0.40180, h * 0.99925);

    // --- Bottom center bridge ---
    path.lineTo(w * 0.59820, h * 0.99925);

    // --- Right side: 25 mirrored cubics from bottom-center up to right shoulder peak ---
    path.cubicBezierTo(w * 0.62354, h * 0.99729, w * 0.64141, h * 0.99487, w * 0.70621, h * 0.98465);
    path.cubicBezierTo(w * 0.76701, h * 0.97505, w * 0.77645, h * 0.97322, w * 0.81895, h * 0.96279);
    path.cubicBezierTo(w * 0.87654, h * 0.94865, w * 0.92906, h * 0.93155, w * 0.96733, h * 0.91449);
    path.cubicBezierTo(w * 0.99172, h * 0.90362, w * 0.99591, h * 0.90125, w * 0.99807, h * 0.89712);
    path.cubicBezierTo(w * 1.00065, h * 0.89219, w * 1.00063, h * 0.87357, w * 0.99809, h * 0.85304);
    path.cubicBezierTo(w * 0.99667, h * 0.84161, w * 0.99527, h * 0.83140, w * 0.99497, h * 0.83036);
    path.cubicBezierTo(w * 0.99468, h * 0.82932, w * 0.99306, h * 0.82025, w * 0.99138, h * 0.81020);
    path.cubicBezierTo(w * 0.98969, h * 0.80015, w * 0.98716, h * 0.78513, w * 0.98576, h * 0.77681);
    path.cubicBezierTo(w * 0.98436, h * 0.76849, w * 0.98016, h * 0.74893, w * 0.97644, h * 0.73334);
    path.cubicBezierTo(w * 0.97272, h * 0.71775, w * 0.96882, h * 0.70130, w * 0.96777, h * 0.69680);
    path.cubicBezierTo(w * 0.96672, h * 0.69229, w * 0.96482, h * 0.68464, w * 0.96356, h * 0.67979);
    path.cubicBezierTo(w * 0.96229, h * 0.67494, w * 0.96015, h * 0.66643, w * 0.95881, h * 0.66089);
    path.cubicBezierTo(w * 0.95669, h * 0.65211, w * 0.95108, h * 0.63252, w * 0.94474, h * 0.61175);
    path.cubicBezierTo(w * 0.94369, h * 0.60828, w * 0.93981, h * 0.59496, w * 0.93613, h * 0.58214);
    path.cubicBezierTo(w * 0.92635, h * 0.54804, w * 0.91595, h * 0.51230, w * 0.91266, h * 0.50149);
    path.cubicBezierTo(w * 0.91108, h * 0.49630, w * 0.90830, h * 0.48694, w * 0.90648, h * 0.48070);
    path.cubicBezierTo(w * 0.89922, h * 0.45578, w * 0.85850, h * 0.33246, w * 0.85483, h * 0.32427);
    path.cubicBezierTo(w * 0.85385, h * 0.32208, w * 0.85305, h * 0.31996, w * 0.85305, h * 0.31955);
    path.cubicBezierTo(w * 0.85305, h * 0.31696, w * 0.83895, h * 0.28069, w * 0.82778, h * 0.25453);
    path.cubicBezierTo(w * 0.82053, h * 0.23755, w * 0.81276, h * 0.21926, w * 0.81052, h * 0.21389);
    path.cubicBezierTo(w * 0.80560, h * 0.20213, w * 0.78541, h * 0.15739, w * 0.78422, h * 0.15561);
    path.cubicBezierTo(w * 0.78376, h * 0.15492, w * 0.77385, h * 0.13518, w * 0.76221, h * 0.11174);
    path.cubicBezierTo(w * 0.74062, h * 0.06828, w * 0.72998, h * 0.04942, w * 0.72105, h * 0.03873);
    path.cubicBezierTo(w * 0.71624, h * 0.03298, w * 0.70298, h * 0.02459, w * 0.69207, h * 0.02040);
    path.cubicBezierTo(w * 0.68710, h * 0.01849, w * 0.65942, h * 0.01217, w * 0.64415, h * 0.00946);

    // --- Neck right arm: 3 cubics from right shoulder peak to neck-opening bottom (center) ---
    path.cubicBezierTo(w * 0.61770, h * 0.00476, w * 0.58634, h * 0.00000, w * 0.58184, h * 0.00000);
    path.cubicBezierTo(w * 0.57500, h * 0.00000, w * 0.56764, h * 0.00626, w * 0.55130, h * 0.02594);
    path.cubicBezierTo(w * 0.53577, h * 0.04467, w * 0.53266, h * 0.04666, cx, h * 0.04778);

    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius } = params;
    const paths = [this.generateCutPath(params), ...generateRefHoles(width, length, holeRadius)];
    paths.push(generateCenterSlit(width, length));
    paths.push(generateCenterKeyhole(width, length));
    return paths;
  }

  generateScorePaths(params: TemplateParams): string[] {
    return [];
  }

  generateEngravePaths(params: TemplateParams): string[] {
    return [];
  }
}
