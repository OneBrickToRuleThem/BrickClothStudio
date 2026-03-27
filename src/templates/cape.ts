/**
 * Cape template generators
 * Capes are the most versatile LEGO fabric element
 */

import { Template, TemplateParams, generateAttachmentHole } from './base';
import { SVGPath, scallopedPath } from '../geometry/primitives';
import { SeededRNG } from '../utils/rng';
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
  path.cubicBezierTo(w * 1.00065, h * 0.87357, w * 1.00063, h * 0.89219, w * 0.99809, h * 0.85304);
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
  path.cubicBezierTo(xAdj(1.00065, 0.87357), h * 0.87357, xAdj(1.00063, 0.89219), h * 0.89219, xAdj(0.99809, 0.85304), h * 0.85304);
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
  slitLen: number = 8
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

  // Line endpoints
  path.moveTo(cx - half * sinA, cy - half * cosA);
  path.lineTo(cx + half * sinA, cy + half * cosA);

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
 * hemType: 'standard' | 'tattered' | 'scalloped' | 'fishtail' | 'asymmetric'
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
 * Draw a styled left side. Samples the reference side profile and applies
 * a style offset perpendicular to it (outward = toward x=0).
 */
function drawStyledLeftSide(
  path: SVGPath, w: number, h: number, hemWidth: number,
  style: string, depth: number, count: number, seed: number,
  shoulderH?: number,
  profileFn?: (yFrac: number) => number,
  topY?: number,
  botY?: number
) {
  const cx = w / 2;
  const sh = shoulderH ?? h;
  const topYFrac = topY ?? 0.02040;
  const botYFrac = botY ?? 0.89712;
  const range = botYFrac - topYFrac;
  const segments = Math.max(count * 4, 40);
  const _profileFn = profileFn ?? leftSideXFrac;

  function yAt(yFrac: number): number {
    if (sh === h) return h * yFrac;
    const blend = Math.min(1, yFrac / 0.12);
    const t = blend * blend * (3 - 2 * blend);
    return (sh + (h - sh) * t) * yFrac;
  }

  // Pre-compute tattered offsets with step-limiting for smooth transitions
  let tatteredOffsets: number[] | undefined;
  if (style === 'tattered') {
    const rng = new SeededRNG(seed + 1000);
    const maxStep = depth * 0.4;
    tatteredOffsets = [];
    let prev = 0;
    for (let i = 0; i <= segments; i++) {
      let off = -rng.nextRange(0, depth);
      if (Math.abs(off - prev) > maxStep) {
        off = prev + Math.sign(off - prev) * maxStep;
      }
      prev = off;
      tatteredOffsets.push(off);
    }
  }

  for (let i = 1; i <= segments; i++) {
    const t = i / segments;
    const yFrac = topYFrac + range * t;
    const refXFrac = _profileFn(yFrac);
    // Apply hemWidth taper
    const rawX = w * refXFrac;
    const taper = Math.max(0, yFrac / botYFrac);
    const adjustedX = hemWidth === 1.0 ? rawX : rawX + (cx + (rawX - cx) * hemWidth - rawX) * taper;
    const y = yAt(yFrac);

    // Compute outward offset (negative X = outward for left side)
    let offset = 0;
    const st = t; // 0..1 along the side

    if (style === 'tattered') {
      offset = tatteredOffsets![i];
    } else if (style === 'scalloped') {
      const phase = (st * count) % 1;
      offset = -depth * Math.sin(phase * Math.PI);
    } else if (style === 'zigzag') {
      const phase = (st * count) % 1;
      offset = phase < 0.5 ? -depth * (phase * 2) : -depth * (2 - phase * 2);
    } else if (style === 'wavy') {
      offset = -depth * Math.sin(st * count * Math.PI * 2);
    } else if (style === 'castellated') {
      const phase = (st * count) % 1;
      offset = phase < 0.5 ? -depth : 0;
    } else if (style === 'serrated') {
      const phase = (st * count) % 1;
      offset = -depth * phase;
    } else if (style === 'fringed') {
      const phase = (st * count) % 1;
      // Narrow spikes
      offset = phase < 0.2 ? -depth * (phase / 0.2) : phase < 0.4 ? -depth * (1 - (phase - 0.2) / 0.2) : 0;
    } else if (style === 'thorned') {
      const phase = (st * count) % 1;
      // Sharp triangular thorns
      offset = phase < 0.15 ? -depth * (phase / 0.15) : phase < 0.3 ? -depth * (1 - (phase - 0.15) / 0.15) : 0;
    } else if (style === 'torn') {
      const rng = new SeededRNG(seed + i * 7 + 31);
      const r1 = rng.nextRange(0, 1);
      const r2 = rng.nextRange(0, 1);
      offset = r1 < 0.2 ? -depth * (0.7 + r2 * 0.3) : -depth * r2 * 0.4;
      if (rng.nextRange(0, 1) > 0.65) offset *= -0.3;
    } else if (style === 'pointed') {
      const phase = (st * count) % 1;
      offset = phase < 0.5 ? -depth * (phase * 2) : -depth * (2 - phase * 2);
    } else if (style === 'flame') {
      const rng = new SeededRNG(seed + i * 3 + 17);
      const phase = (st * count) % 1;
      // Multi-frequency jagged fire: primary tongue + secondary flicker + tertiary crackle
      const primary = Math.sin(phase * Math.PI);
      const secondary = 0.35 * Math.sin(phase * Math.PI * 3 + rng.nextRange(0, 2));
      const tertiary = 0.15 * Math.sin(phase * Math.PI * 7 + rng.nextRange(0, 4));
      const flicker = rng.nextRange(0.6, 1.2);
      offset = -depth * flicker * Math.max(0, primary + secondary + tertiary);
    } else if (style === 'stepped') {
      const phase = (st * count) % 1;
      offset = -depth * Math.floor(phase * 3) / 3;
    } else if (style === 'dovetail') {
      const phase = (st * count) % 1;
      const dir = Math.floor(st * count) % 2 === 0 ? 1 : 0.3;
      offset = phase > 0.2 && phase < 0.8 ? -depth * dir : 0;
    } else if (style === 'fishtail') {
      const phase = (st * count) % 1;
      offset = phase < 0.5 ? depth * 0.3 * (phase * 2) : -depth * 0.7 * ((phase - 0.5) * 2);
    } else if (style === 'feathered') {
      const rng = new SeededRNG(seed + i * 5 + 11);
      const phase = (st * count) % 1;
      const flicker = rng.nextRange(0.5, 1.3);
      offset = -depth * flicker * Math.sin(phase * Math.PI);
    } else if (style === 'cloud') {
      const rng = new SeededRNG(seed + i * 2 + 7);
      const phase = (st * count * 3) % 1;
      const h = depth * (0.4 + rng.nextRange(0, 1) * 0.6);
      offset = -h * Math.sin(phase * Math.PI);
    } else if (style === 'sawtooth') {
      const phase = (st * count) % 1;
      offset = phase < 0.25 ? -depth * (phase / 0.25) : -depth * (1 - (phase - 0.25) / 0.75);
    } else if (style === 'arrow') {
      const phase = (st * count) % 1;
      offset = phase < 0.5 ? -depth * (phase * 2) : depth * 0.3 - depth * 0.3 * ((phase - 0.5) * 2);
    } else if (style === 'picot') {
      const phase = (st * count) % 1;
      offset = (phase > 0.35 && phase < 0.65) ? -depth * Math.sin((phase - 0.35) / 0.3 * Math.PI) : 0;
    }

    path.lineTo(adjustedX + offset, y);
  }
}

/**
 * Draw a styled right side. Mirror of drawStyledLeftSide.
 * Offset is positive X (outward for right side).
 */
function drawStyledRightSide(
  path: SVGPath, w: number, h: number, hemWidth: number,
  style: string, depth: number, count: number, seed: number,
  shoulderH?: number,
  profileFn?: (yFrac: number) => number,
  topY?: number,
  botY?: number
) {
  const cx = w / 2;
  const sh = shoulderH ?? h;
  const topYFrac = topY ?? 0.02040;
  const botYFrac = botY ?? 0.89712;
  const range = botYFrac - topYFrac;
  const segments = Math.max(count * 4, 40);
  const _profileFn = profileFn ?? leftSideXFrac;

  function yAt(yFrac: number): number {
    if (sh === h) return h * yFrac;
    const blend = Math.min(1, yFrac / 0.12);
    const t = blend * blend * (3 - 2 * blend);
    return (sh + (h - sh) * t) * yFrac;
  }

  // Pre-compute tattered offsets with step-limiting for smooth transitions
  let tatteredOffsets: number[] | undefined;
  if (style === 'tattered') {
    const rng = new SeededRNG(seed + 2000);
    const maxStep = depth * 0.4;
    tatteredOffsets = [];
    let prev = 0;
    for (let i = 0; i <= segments; i++) {
      let off = rng.nextRange(0, depth);
      if (Math.abs(off - prev) > maxStep) {
        off = prev + Math.sign(off - prev) * maxStep;
      }
      prev = off;
      tatteredOffsets.push(off);
    }
  }

  for (let i = 0; i < segments; i++) {
    // Right side goes from bottom to top — same number of points as left side
    const t = 1 - (i / segments);
    const yFrac = topYFrac + range * t;
    const refXFrac = 1 - _profileFn(yFrac); // Mirror
    const rawX = w * refXFrac;
    const taper = Math.max(0, yFrac / botYFrac);
    const adjustedX = hemWidth === 1.0 ? rawX : rawX + (cx + (rawX - cx) * hemWidth - rawX) * taper;
    const y = yAt(yFrac);

    let offset = 0;
    const st = t;

    if (style === 'tattered') {
      offset = tatteredOffsets![i];
    } else if (style === 'scalloped') {
      const phase = (st * count) % 1;
      offset = depth * Math.sin(phase * Math.PI);
    } else if (style === 'zigzag') {
      const phase = (st * count) % 1;
      offset = phase < 0.5 ? depth * (phase * 2) : depth * (2 - phase * 2);
    } else if (style === 'wavy') {
      offset = depth * Math.sin(st * count * Math.PI * 2);
    } else if (style === 'castellated') {
      const phase = (st * count) % 1;
      offset = phase < 0.5 ? depth : 0;
    } else if (style === 'serrated') {
      const phase = (st * count) % 1;
      offset = depth * phase;
    } else if (style === 'fringed') {
      const phase = (st * count) % 1;
      offset = phase < 0.2 ? depth * (phase / 0.2) : phase < 0.4 ? depth * (1 - (phase - 0.2) / 0.2) : 0;
    } else if (style === 'thorned') {
      const phase = (st * count) % 1;
      offset = phase < 0.15 ? depth * (phase / 0.15) : phase < 0.3 ? depth * (1 - (phase - 0.15) / 0.15) : 0;
    } else if (style === 'torn') {
      const rng = new SeededRNG(seed + (segments - i) * 7 + 31);
      const r1 = rng.nextRange(0, 1);
      const r2 = rng.nextRange(0, 1);
      offset = r1 < 0.2 ? depth * (0.7 + r2 * 0.3) : depth * r2 * 0.4;
      if (rng.nextRange(0, 1) > 0.65) offset *= -0.3;
    } else if (style === 'pointed') {
      const phase = (st * count) % 1;
      offset = phase < 0.5 ? depth * (phase * 2) : depth * (2 - phase * 2);
    } else if (style === 'flame') {
      const rng = new SeededRNG(seed + (segments - i) * 3 + 17);
      const phase = (st * count) % 1;
      // Multi-frequency jagged fire: primary tongue + secondary flicker + tertiary crackle
      const primary = Math.sin(phase * Math.PI);
      const secondary = 0.35 * Math.sin(phase * Math.PI * 3 + rng.nextRange(0, 2));
      const tertiary = 0.15 * Math.sin(phase * Math.PI * 7 + rng.nextRange(0, 4));
      const flicker = rng.nextRange(0.6, 1.2);
      offset = depth * flicker * Math.max(0, primary + secondary + tertiary);
    } else if (style === 'stepped') {
      const phase = (st * count) % 1;
      offset = depth * Math.floor(phase * 3) / 3;
    } else if (style === 'dovetail') {
      const phase = (st * count) % 1;
      const dir = Math.floor(st * count) % 2 === 0 ? 1 : 0.3;
      offset = phase > 0.2 && phase < 0.8 ? depth * dir : 0;
    } else if (style === 'fishtail') {
      const phase = (st * count) % 1;
      offset = phase < 0.5 ? -depth * 0.3 * (phase * 2) : depth * 0.7 * ((phase - 0.5) * 2);
    } else if (style === 'feathered') {
      const rng = new SeededRNG(seed + (segments - i) * 5 + 11);
      const phase = (st * count) % 1;
      const flicker = rng.nextRange(0.5, 1.3);
      offset = depth * flicker * Math.sin(phase * Math.PI);
    } else if (style === 'cloud') {
      const rng = new SeededRNG(seed + (segments - i) * 2 + 7);
      const phase = (st * count * 3) % 1;
      const h = depth * (0.4 + rng.nextRange(0, 1) * 0.6);
      offset = h * Math.sin(phase * Math.PI);
    } else if (style === 'sawtooth') {
      const phase = (st * count) % 1;
      offset = phase < 0.25 ? depth * (phase / 0.25) : depth * (1 - (phase - 0.25) / 0.75);
    } else if (style === 'arrow') {
      const phase = (st * count) % 1;
      offset = phase < 0.5 ? depth * (phase * 2) : -depth * 0.3 + depth * 0.3 * ((phase - 0.5) * 2);
    } else if (style === 'picot') {
      const phase = (st * count) % 1;
      offset = (phase > 0.35 && phase < 0.65) ? depth * Math.sin((phase - 0.35) / 0.3 * Math.PI) : 0;
    }

    path.lineTo(adjustedX + offset, y);
  }
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
  const fishtail = params.fishtail as boolean;
  const asymmetric = params.asymmetric as boolean;
  const pointed = params.pointed as boolean;
  const zigzag = params.zigzag as boolean;
  const wavy = params.wavy as boolean;
  const castellated = params.castellated as boolean;
  const dovetail = params.dovetail as boolean;
  const flame = params.flame as boolean;
  const stepped = params.stepped as boolean;
  const serrated = params.serrated as boolean;
  const thorned = params.thorned as boolean;
  const torn = params.torn as boolean;
  const feathered = params.feathered as boolean;
  const cloud = params.cloud as boolean;
  const sawtooth = params.sawtooth as boolean;
  const arrow = params.arrow as boolean;
  const picot = params.picot as boolean;
  const rounding = params.rounding as boolean;
  const roundingAmt = (params.roundingAmount as number) || 0.5;

  const hasHemStyle = tattered || scalloped || fishtail || asymmetric || pointed || zigzag || wavy || castellated || dovetail || flame || stepped || serrated || thorned || torn || feathered || cloud || sawtooth || arrow || picot;

  const sideStyle = (params.sideStyle as string) || 'none';
  const sideDepth = (params.sideStyleDepth as number) || 3;
  const sideCount = (params.sideStyleCount as number) || 8;
  const sideSeed = (params.seed as number) || 12345;

  function drawLeft() {
    if (sideStyle !== 'none') drawStyledLeftSide(path, w, h, hemW, sideStyle, sideDepth, sideCount, sideSeed, refH, p.sideProfileFn, p.sideTopYFrac, p.sideBotYFrac);
    else p.drawRefLeft(path, w, h, hemW, refH);
  }
  function drawRight() {
    if (sideStyle !== 'none') drawStyledRightSide(path, w, h, hemW, sideStyle, sideDepth, sideCount, sideSeed, refH, p.sideProfileFn, p.sideTopYFrac, p.sideBotYFrac);
    else p.drawRefRight(path, w, h, hemW, refH);
  }

  // If no hem modifier, draw full outline at actual length h with hemWidth taper
  if (!hasHemStyle) {
    drawLeft();
    if (rounding) {
      drawRoundedHem(path, w, h, hemW, roundingAmt, p.sideBotYFrac, p.sideLeftXFrac, p.sideRightXFrac);
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
  const effectiveDepth = rounding ? Math.max(hemDepth, roundingAmt * halfW) : hemDepth;
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
  } else if (fishtail) {
    const depthFrac = (params.fishtailDepth as number) || 0.15;
    const notchCount = (params.fishtailNotches as number) || 3;
    const notchDepth = h * depthFrac;
    const hemBottom = leftY + effectiveDepth;
    const innerLeft = leftX + (rightX - leftX) * 0.06;
    const innerRight = leftX + (rightX - leftX) * 0.94;
    path.cubicBezierTo(leftX, leftY + (hemBottom - leftY) * 0.4, leftX + (innerLeft - leftX) * 0.5, hemBottom, innerLeft, hemBottom);
    const innerSpan = innerRight - innerLeft;
    const notchW = Math.min(w * 0.06, innerSpan / (notchCount * 2));
    for (let i = 0; i < notchCount; i++) {
      const nc = innerLeft + innerSpan * (i + 1) / (notchCount + 1);
      path.lineTo(nc - notchW, hemBottom);
      const tip = offsetPoint(nc, hemBottom, -notchDepth);
      path.lineTo(tip.x, tip.y);
      path.lineTo(nc + notchW, hemBottom);
    }
    path.lineTo(innerRight, hemBottom);
    path.cubicBezierTo(rightX - (rightX - innerRight) * 0.5, hemBottom, rightX, leftY + (hemBottom - leftY) * 0.4, rightX, leftY);
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
  } else if (pointed) {
    const depthFrac = (params.pointedDepth as number) || 0.3;
    const roundness = (params.pointedRoundness as number) ?? 0.4;
    const pointDepth = (rightX - leftX) * depthFrac;
    const tipDepth = Math.max(pointDepth, effectiveDepth);
    const tipY = leftY + tipDepth;
    const midX = (leftX + rightX) / 2;
    const lcp = offsetPoint(leftX, leftY, tipDepth * 0.3);
    // roundness 0 = straight lines, 1 = maximum curve
    const curveSpread = (midX - leftX) * roundness;
    path.cubicBezierTo(lcp.x, lcp.y, midX - curveSpread, tipY, midX, tipY);
    const rcp = offsetPoint(rightX, leftY, tipDepth * 0.3);
    path.cubicBezierTo(midX + curveSpread, tipY, rcp.x, rcp.y, rightX, leftY);
  } else if (zigzag) {
    const count = (params.zigzagCount as number) || 10;
    const depth = (params.zigzagDepth as number) || 4;
    const segW = hemSpan / count;
    for (let i = 0; i < count; i++) {
      const t0 = i / count;
      const t1 = (i + 0.5) / count;
      const t2 = (i + 1) / count;
      const peakX = leftX + hemSpan * (t0 + 0.5 / count);
      const peakBY = baseY(t1);
      const peak = offsetPoint(peakX, peakBY, depth);
      path.lineTo(peak.x, peak.y);
      const valleyX = leftX + segW * (i + 1);
      path.lineTo(valleyX, baseY(t2));
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
    const depthFrac = (params.dovetailDepth as number) || 0.25;
    const widthFrac = (params.dovetailWidth as number) || 0.3;
    const notchDepth = hemSpan * depthFrac;
    const notchHalfW = hemSpan * widthFrac * 0.5;
    const midX = (leftX + rightX) / 2;
    const taperW = notchHalfW * 0.7; // narrower at the top of the notch
    // Left side down to baseline center
    path.lineTo(midX - notchHalfW, baseY(0.5 - widthFrac * 0.5));
    // Notch: inward taper
    const notchBY = baseY(0.5);
    const notchBottom = offsetPoint(midX, notchBY, notchDepth);
    path.lineTo(notchBottom.x - taperW, notchBottom.y);
    path.lineTo(notchBottom.x + taperW, notchBottom.y);
    // Back up
    path.lineTo(midX + notchHalfW, baseY(0.5 + widthFrac * 0.5));
    path.lineTo(rightX, baseY(1));
  } else if (flame) {
    const count = (params.flameCount as number) || 5;
    const depth = (params.flameDepth as number) || 6;
    // Fire effect: each main tongue has sub-tongues for a jagged, flickering look
    const subCount = count * 3; // 3 sub-tongues per main flame
    const segW = hemSpan / subCount;
    const baseSeed = (params.seed as number) || 12345;
    for (let i = 0; i < subCount; i++) {
      const t0 = i / subCount;
      const t1 = (i + 0.5) / subCount;
      const t2 = (i + 1) / subCount;
      const startX = leftX + segW * i;
      const tipX = leftX + segW * (i + 0.5);
      const endX = leftX + segW * (i + 1);
      const bYStart = baseY(t0);
      const bYTip = baseY(t1);
      const bYEnd = baseY(t2);
      // Main tongue envelope: taller at center
      const envelope = Math.sin(((i + 0.5) / subCount) * Math.PI);
      // Seed by distance from center so mirror-image tongues get identical randoms
      const mirrorIdx = Math.abs(i - (subCount - 1) / 2);
      const rng = new SeededRNG(baseSeed + Math.round(mirrorIdx * 1000) + 17);
      // Alternate tall/short sub-tongues for fire texture
      const isTall = i % 3 === 1; // middle sub-tongue of each group is tallest
      const heightMul = isTall ? (0.8 + rng.nextRange(0, 0.4)) : (0.3 + rng.nextRange(0, 0.35));
      const tongueDepth = depth * envelope * heightMul;
      if (tongueDepth < 0.3) {
        // Too shallow — just draw a line
        path.lineTo(endX, bYEnd);
        continue;
      }
      const tip = offsetPoint(tipX, bYTip, tongueDepth);
      // Sharper control points for jagged fire look
      const cp1 = offsetPoint(startX + segW * 0.25, baseY(t0 + 0.25 / subCount), tongueDepth * 0.3);
      const cp2 = offsetPoint(tipX - segW * 0.05, bYTip, tongueDepth * 0.95);
      path.cubicBezierTo(cp1.x, cp1.y, cp2.x, cp2.y, tip.x, tip.y);
      const cp3 = offsetPoint(tipX + segW * 0.05, bYTip, tongueDepth * 0.95);
      const cp4 = offsetPoint(endX - segW * 0.25, baseY(t2 - 0.25 / subCount), tongueDepth * 0.3);
      path.cubicBezierTo(cp3.x, cp3.y, cp4.x, cp4.y, endX, bYEnd);
    }
  } else if (stepped) {
    const count = (params.steppedCount as number) || 5;
    const depth = (params.steppedDepth as number) || 4;
    const segW = hemSpan / count;
    for (let i = 0; i < count; i++) {
      const t = (i + 0.5) / count;
      // Each step offset varies by position — deeper at center
      const stepDepth = depth * Math.sin(((i + 0.5) / count) * Math.PI);
      const startX = leftX + segW * i;
      const endX = leftX + segW * (i + 1);
      const bY = baseY(t);
      const stepPt = offsetPoint((startX + endX) / 2, bY, stepDepth);
      path.lineTo(startX, stepPt.y);
      path.lineTo(endX, stepPt.y);
      // Vertical connector to next step
      if (i < count - 1) {
        const nextT = (i + 1.5) / count;
        const nextDepth = depth * Math.sin(((i + 1.5) / count) * Math.PI);
        const nextBY = baseY(nextT);
        const nextPt = offsetPoint((endX + leftX + segW * (i + 2)) / 2, nextBY, nextDepth);
        path.lineTo(endX, nextPt.y);
      }
    }
    path.lineTo(rightX, leftY);
  } else if (feathered) {
    // Feathered: smooth organic bezier curves leaning toward center (like plumage)
    const count = (params.hemEdgeCount as number) || 8;
    const depth = (params.hemEdgeDepth as number) || 3;
    const segW = hemSpan / count;
    for (let i = 0; i < count; i++) {
      const t0 = i / count;
      const t1 = (i + 0.5) / count;
      const t2 = (i + 1) / count;
      const startX = leftX + segW * i;
      const tipX = leftX + segW * (i + 0.5);
      const endX = leftX + segW * (i + 1);
      const bYTip = baseY(t1);
      const bYEnd = baseY(t2);
      const tip = offsetPoint(tipX, bYTip, depth);
      // Mirror lean about cape center for symmetry
      const isRightHalf = (i + 0.5) / count > 0.5;
      const isCenter = count % 2 === 1 && i === Math.floor(count / 2);
      const leanStart = isCenter ? 0.45 : isRightHalf ? 0.3 : 0.6;
      const leanEnd = isCenter ? 0.45 : isRightHalf ? 0.6 : 0.3;
      const cp1 = offsetPoint(startX + segW * 0.15, baseY(t0 + 0.15 / count), depth * leanStart);
      const cp2 = offsetPoint(tipX - segW * 0.1, bYTip, depth * 0.9);
      path.cubicBezierTo(cp1.x, cp1.y, cp2.x, cp2.y, tip.x, tip.y);
      const cp3 = offsetPoint(tipX + segW * 0.1, bYTip, depth * 0.9);
      const cp4 = offsetPoint(endX - segW * 0.15, baseY(t2 - 0.15 / count), depth * leanEnd);
      path.cubicBezierTo(cp3.x, cp3.y, cp4.x, cp4.y, endX, bYEnd);
    }
  } else if (serrated || thorned || sawtooth || arrow || picot || cloud || torn) {
    // Segment-based styles adapted from side edges
    const count = (params.hemEdgeCount as number) || 8;
    const depth = (params.hemEdgeDepth as number) || 3;
    const seed = (params.seed as number) || 12345;
    const segments = Math.max(count * 4, 40);
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const xPos = leftX + hemSpan * t;
      const bY = baseY(t);
      const st = t;
      let off = 0;
      if (serrated) {
        const reverse = params.hemSerratedReverse as boolean;
        const phase = (st * count) % 1;
        off = depth * (reverse ? (1 - phase) : phase);
      } else if (thorned) {
        const phase = (st * count) % 1;
        off = phase < 0.15 ? depth * (phase / 0.15) : phase < 0.3 ? depth * (1 - (phase - 0.15) / 0.15) : 0;
      } else if (sawtooth) {
        const phase = (st * count) % 1;
        off = phase < 0.25 ? depth * (phase / 0.25) : depth * (1 - (phase - 0.25) / 0.75);
      } else if (arrow) {
        // Chevron arrowhead notches: V-shaped cuts pointing outward
        const phase = (st * count) % 1;
        if (phase < 0.1 || phase > 0.9) {
          off = 0; // flat between chevrons
        } else if (phase < 0.5) {
          // descend to tip
          off = depth * ((phase - 0.1) / 0.4);
        } else {
          // ascend from tip
          off = depth * ((0.9 - phase) / 0.4);
        }
      } else if (picot) {
        const phase = (st * count) % 1;
        off = (phase > 0.35 && phase < 0.65) ? depth * Math.sin((phase - 0.35) / 0.3 * Math.PI) : 0;
      } else if (cloud) {
        const rng = new SeededRNG(seed + i * 2 + 7);
        const phase = (st * count * 3) % 1;
        const h = depth * (0.4 + rng.nextRange(0, 1) * 0.6);
        off = h * Math.sin(phase * Math.PI);
      } else if (torn) {
        const rng = new SeededRNG(seed + i * 7 + 31);
        const r1 = rng.nextRange(0, 1);
        const r2 = rng.nextRange(0, 1);
        off = r1 < 0.2 ? depth * (0.7 + r2 * 0.3) : depth * r2 * 0.4;
        if (rng.nextRange(0, 1) > 0.65) off *= -0.3;
      }
      const pt = offsetPoint(xPos, bY, off);
      path.lineTo(pt.x, pt.y);
    }
  }

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
    if (params.rounding) {
      const roundingAmt = (params.roundingAmount as number) || 0.5;
      maxY = Math.max(maxY, sideY + roundingAmt * halfW);
    }
    if (params.pointed) {
      const depthFrac = (params.pointedDepth as number) || 0.3;
      maxY = Math.max(maxY, sideY + (rightX - leftX) * depthFrac);
    }
    if (params.zigzag) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.zigzagDepth as number) || 4));
    }
    if (params.wavy) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.wavyDepth as number) || 3));
    }
    if (params.castellated) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.castellatedDepth as number) || 3));
    }
    if (params.dovetail) {
      const dDepth = ((params.dovetailDepth as number) || 0.25) * (rightX - leftX);
      maxY = Math.max(maxY, sideY + (h - sideY) + dDepth);
    }
    if (params.flame) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.flameDepth as number) || 6));
    }
    if (params.stepped) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.steppedDepth as number) || 4));
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
    if (params.rounding) {
      const roundingAmt = (params.roundingAmount as number) || 0.5;
      maxY = Math.max(maxY, sideY + roundingAmt * halfW);
    }
    if (params.pointed) {
      const depthFrac = (params.pointedDepth as number) || 0.3;
      maxY = Math.max(maxY, sideY + (rightX - leftX) * depthFrac);
    }
    if (params.zigzag) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.zigzagDepth as number) || 4));
    }
    if (params.wavy) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.wavyDepth as number) || 3));
    }
    if (params.castellated) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.castellatedDepth as number) || 3));
    }
    if (params.dovetail) {
      const dDepth = ((params.dovetailDepth as number) || 0.25) * (rightX - leftX);
      maxY = Math.max(maxY, sideY + (h - sideY) + dDepth);
    }
    if (params.flame) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.flameDepth as number) || 6));
    }
    if (params.stepped) {
      maxY = Math.max(maxY, sideY + (h - sideY) + ((params.steppedDepth as number) || 4));
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
 * CapeShort: Shorter cape, 60% of standard length
 * Same flowing drape shape as standard, just shorter height
 */
export class CapeShort extends Template {
  generateCutPath(params: TemplateParams): string {
    const { length, width } = params;
    const path = new SVGPath();
    const w = width;
    const h = length * 0.6;

    path.moveTo(w / 2, h * 0.04778);
    drawRefNeck(path, w, h);
    drawRefOutline(path, w, h);
    closeRefNeck(path, w, h);
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius } = params;
    const h = length * 0.6;
    const paths = [this.generateCutPath(params), ...generateRefHoles(width, h, holeRadius)];
    paths.push(generateCenterSlit(width, h));
    paths.push(generateCenterKeyhole(width, h));
    if (params.swordSlit) {
      paths.push(generateSwordSlit(
        width, h,
        params.swordSide as string || 'right',
        params.swordAngle as number || 35,
        params.swordY as number || 0.45
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
    // CapeShort draws at 60% of params.length
    result.boundingBox.height = params.length * 0.6;
    return result;
  }
}

/**
 * CapeLong: Extended cape, 140% of standard length
 * Same flowing drape shape as standard, just extended height
 * Optional tail split for dramatic effect
 */
export class CapeLong extends Template {
  generateCutPath(params: TemplateParams): string {
    const { length, width, split = false } = params;
    const path = new SVGPath();
    const w = width;
    const h = length * 1.4;

    path.moveTo(w / 2, h * 0.04778);
    drawRefNeck(path, w, h);

    if (split) {
      const splitY = h * 0.65;
      const splitGap = w * 0.03;
      const cx = w / 2;

      // Left side: 9 smoothed reference beziers (shoulder → ~0.612h)
      path.cubicBezierTo(w * 0.34058, h * 0.01217, w * 0.31290, h * 0.01849, w * 0.30793, h * 0.02040);
      path.cubicBezierTo(w * 0.29702, h * 0.02459, w * 0.28376, h * 0.03298, w * 0.27895, h * 0.03873);
      path.cubicBezierTo(w * 0.27002, h * 0.04942, w * 0.25938, h * 0.06828, w * 0.23779, h * 0.11174);
      path.cubicBezierTo(w * 0.22615, h * 0.13518, w * 0.21624, h * 0.15492, w * 0.21578, h * 0.15561);
      path.cubicBezierTo(w * 0.21459, h * 0.15739, w * 0.19440, h * 0.20213, w * 0.18948, h * 0.21389);
      path.cubicBezierTo(w * 0.18724, h * 0.21926, w * 0.17947, h * 0.23755, w * 0.17222, h * 0.25453);
      path.cubicBezierTo(w * 0.16105, h * 0.28069, w * 0.14615, h * 0.32208, w * 0.14517, h * 0.32427);
      path.cubicBezierTo(w * 0.14150, h * 0.33246, w * 0.08892, h * 0.49630, w * 0.08734, h * 0.50149);
      path.cubicBezierTo(w * 0.08405, h * 0.51230, w * 0.05631, h * 0.60828, w * 0.05526, h * 0.61175);

      // Extend to split point, then tail geometry
      path.lineTo(w * 0.05526, splitY);
      path.lineTo(w * 0.05526, h);
      path.lineTo(cx - splitGap, h);
      path.lineTo(cx - splitGap, splitY);
      path.lineTo(cx + splitGap, splitY);
      path.lineTo(cx + splitGap, h);
      path.lineTo(w * 0.94474, h);
      path.lineTo(w * 0.94474, splitY);

      // Right side: 9 smoothed mirrored reference beziers (~0.612h → shoulder)
      path.lineTo(w * 0.94474, h * 0.61175);
      path.cubicBezierTo(w * 0.94369, h * 0.60828, w * 0.91595, h * 0.51230, w * 0.91266, h * 0.50149);
      path.cubicBezierTo(w * 0.91108, h * 0.49630, w * 0.85850, h * 0.33246, w * 0.85483, h * 0.32427);
      path.cubicBezierTo(w * 0.85385, h * 0.32208, w * 0.83895, h * 0.28069, w * 0.82778, h * 0.25453);
      path.cubicBezierTo(w * 0.82053, h * 0.23755, w * 0.81276, h * 0.21926, w * 0.81052, h * 0.21389);
      path.cubicBezierTo(w * 0.80560, h * 0.20213, w * 0.78541, h * 0.15739, w * 0.78422, h * 0.15561);
      path.cubicBezierTo(w * 0.78376, h * 0.15492, w * 0.77385, h * 0.13518, w * 0.76221, h * 0.11174);
      path.cubicBezierTo(w * 0.74062, h * 0.06828, w * 0.72998, h * 0.04942, w * 0.72105, h * 0.03873);
      path.cubicBezierTo(w * 0.71624, h * 0.03298, w * 0.70298, h * 0.02459, w * 0.69207, h * 0.02040);
      path.cubicBezierTo(w * 0.68710, h * 0.01849, w * 0.65942, h * 0.01217, w * 0.64415, h * 0.00946);
    } else {
      drawRefOutline(path, w, h);
    }

    closeRefNeck(path, w, h);
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius } = params;
    const h = length * 1.4;
    const paths = [this.generateCutPath(params), ...generateRefHoles(width, h, holeRadius)];
    paths.push(generateCenterSlit(width, h));
    paths.push(generateCenterKeyhole(width, h));
    if (params.swordSlit) {
      paths.push(generateSwordSlit(
        width, h,
        params.swordSide as string || 'right',
        params.swordAngle as number || 35,
        params.swordY as number || 0.45
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
    // CapeLong draws at 140% of params.length
    result.boundingBox.height = params.length * 1.4;
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
        params.swordY as number || 0.45
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
