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
 * Draw the reference cape outline — 25 symmetric cubic beziers per side.
 * Traced from standard-cape.svg, left side as authority, right side mirrored.
 *
 * Draws from left shoulder peak → left side → bottom → right side → right shoulder peak.
 * Caller must already be at the left shoulder peak position.
 */
function drawRefOutline(path: SVGPath, w: number, h: number) {
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
}

/**
 * Draw the left side of the reference outline — segments 1-21.
 * Shoulder peak → left side down to y ≈ 0.897h.
 * Used by CapeTattered to replace the bottom hem with jitter.
 */
function drawRefLeftSide(path: SVGPath, w: number, h: number, hemWidth: number = 1.0) {
  const cx = w / 2;
  // Progressively adjust X from center: at y=0 no adjustment, at y=0.897h full hemWidth
  function xAdj(xFrac: number, yFrac: number): number {
    const x = w * xFrac;
    if (hemWidth === 1.0) return x;
    const t = Math.max(0, yFrac / 0.89712); // 0 at top, 1 at side bottom
    const adjusted = cx + (x - cx) * hemWidth;
    return x + (adjusted - x) * t;
  }
  path.cubicBezierTo(xAdj(0.34058, 0.01217), h * 0.01217, xAdj(0.31290, 0.01849), h * 0.01849, xAdj(0.30793, 0.02040), h * 0.02040);
  path.cubicBezierTo(xAdj(0.29702, 0.02459), h * 0.02459, xAdj(0.28376, 0.03298), h * 0.03298, xAdj(0.27895, 0.03873), h * 0.03873);
  path.cubicBezierTo(xAdj(0.27002, 0.04942), h * 0.04942, xAdj(0.25938, 0.06828), h * 0.06828, xAdj(0.23779, 0.11174), h * 0.11174);
  path.cubicBezierTo(xAdj(0.22615, 0.13518), h * 0.13518, xAdj(0.21624, 0.15492), h * 0.15492, xAdj(0.21578, 0.15561), h * 0.15561);
  path.cubicBezierTo(xAdj(0.21459, 0.15739), h * 0.15739, xAdj(0.19440, 0.20213), h * 0.20213, xAdj(0.18948, 0.21389), h * 0.21389);
  path.cubicBezierTo(xAdj(0.18724, 0.21926), h * 0.21926, xAdj(0.17947, 0.23755), h * 0.23755, xAdj(0.17222, 0.25453), h * 0.25453);
  path.cubicBezierTo(xAdj(0.16105, 0.28069), h * 0.28069, xAdj(0.14695, 0.31696), h * 0.31696, xAdj(0.14695, 0.31955), h * 0.31955);
  path.cubicBezierTo(xAdj(0.14695, 0.31996), h * 0.31996, xAdj(0.14615, 0.32208), h * 0.32208, xAdj(0.14517, 0.32427), h * 0.32427);
  path.cubicBezierTo(xAdj(0.14150, 0.33246), h * 0.33246, xAdj(0.10078, 0.45578), h * 0.45578, xAdj(0.09352, 0.48070), h * 0.48070);
  path.cubicBezierTo(xAdj(0.09170, 0.48694), h * 0.48694, xAdj(0.08892, 0.49630), h * 0.49630, xAdj(0.08734, 0.50149), h * 0.50149);
  path.cubicBezierTo(xAdj(0.08405, 0.51230), h * 0.51230, xAdj(0.07365, 0.54804), h * 0.54804, xAdj(0.06387, 0.58214), h * 0.58214);
  path.cubicBezierTo(xAdj(0.06019, 0.59496), h * 0.59496, xAdj(0.05631, 0.60828), h * 0.60828, xAdj(0.05526, 0.61175), h * 0.61175);
  path.cubicBezierTo(xAdj(0.04892, 0.63252), h * 0.63252, xAdj(0.04331, 0.65211), h * 0.65211, xAdj(0.04119, 0.66089), h * 0.66089);
  path.cubicBezierTo(xAdj(0.03985, 0.66643), h * 0.66643, xAdj(0.03771, 0.67494), h * 0.67494, xAdj(0.03644, 0.67979), h * 0.67979);
  path.cubicBezierTo(xAdj(0.03518, 0.68464), h * 0.68464, xAdj(0.03328, 0.69229), h * 0.69229, xAdj(0.03223, 0.69680), h * 0.69680);
  path.cubicBezierTo(xAdj(0.03118, 0.70130), h * 0.70130, xAdj(0.02728, 0.71775), h * 0.71775, xAdj(0.02356, 0.73334), h * 0.73334);
  path.cubicBezierTo(xAdj(0.01984, 0.74893), h * 0.74893, xAdj(0.01564, 0.76849), h * 0.76849, xAdj(0.01424, 0.77681), h * 0.77681);
  path.cubicBezierTo(xAdj(0.01284, 0.78513), h * 0.78513, xAdj(0.01031, 0.80015), h * 0.80015, xAdj(0.00862, 0.81020), h * 0.81020);
  path.cubicBezierTo(xAdj(0.00694, 0.82025), h * 0.82025, xAdj(0.00532, 0.82932), h * 0.82932, xAdj(0.00503, 0.83036), h * 0.83036);
  path.cubicBezierTo(xAdj(0.00473, 0.83140), h * 0.83140, xAdj(0.00333, 0.84161), h * 0.84161, xAdj(0.00191, 0.85304), h * 0.85304);
  path.cubicBezierTo(xAdj(-0.00065, 0.87357), h * 0.87357, xAdj(-0.00063, 0.89219), h * 0.89219, xAdj(0.00193, 0.89712), h * 0.89712);
}

/**
 * Draw the right side of the reference outline — right segments 5-25.
 * From y ≈ 0.897h up to right shoulder peak.
 * Mirror of drawRefLeftSide. Used by CapeTattered.
 */
function drawRefRightSide(path: SVGPath, w: number, h: number, hemWidth: number = 1.0) {
  const cx = w / 2;
  function xAdj(xFrac: number, yFrac: number): number {
    const x = w * xFrac;
    if (hemWidth === 1.0) return x;
    const t = Math.max(0, yFrac / 0.89712);
    const adjusted = cx + (x - cx) * hemWidth;
    return x + (adjusted - x) * t;
  }
  path.cubicBezierTo(xAdj(1.00065, 0.89219), h * 0.89219, xAdj(1.00063, 0.87357), h * 0.87357, xAdj(0.99809, 0.85304), h * 0.85304);
  path.cubicBezierTo(xAdj(0.99667, 0.84161), h * 0.84161, xAdj(0.99527, 0.83140), h * 0.83140, xAdj(0.99497, 0.83036), h * 0.83036);
  path.cubicBezierTo(xAdj(0.99468, 0.82932), h * 0.82932, xAdj(0.99306, 0.82025), h * 0.82025, xAdj(0.99138, 0.81020), h * 0.81020);
  path.cubicBezierTo(xAdj(0.98969, 0.80015), h * 0.80015, xAdj(0.98716, 0.78513), h * 0.78513, xAdj(0.98576, 0.77681), h * 0.77681);
  path.cubicBezierTo(xAdj(0.98436, 0.76849), h * 0.76849, xAdj(0.98016, 0.74893), h * 0.74893, xAdj(0.97644, 0.73334), h * 0.73334);
  path.cubicBezierTo(xAdj(0.97272, 0.71775), h * 0.71775, xAdj(0.96882, 0.70130), h * 0.70130, xAdj(0.96777, 0.69680), h * 0.69680);
  path.cubicBezierTo(xAdj(0.96672, 0.69229), h * 0.69229, xAdj(0.96482, 0.68464), h * 0.68464, xAdj(0.96356, 0.67979), h * 0.67979);
  path.cubicBezierTo(xAdj(0.96229, 0.67494), h * 0.67494, xAdj(0.96015, 0.66643), h * 0.66643, xAdj(0.95881, 0.66089), h * 0.66089);
  path.cubicBezierTo(xAdj(0.95669, 0.65211), h * 0.65211, xAdj(0.95108, 0.63252), h * 0.63252, xAdj(0.94474, 0.61175), h * 0.61175);
  path.cubicBezierTo(xAdj(0.94369, 0.60828), h * 0.60828, xAdj(0.93981, 0.59496), h * 0.59496, xAdj(0.93613, 0.58214), h * 0.58214);
  path.cubicBezierTo(xAdj(0.92635, 0.54804), h * 0.54804, xAdj(0.91595, 0.51230), h * 0.51230, xAdj(0.91266, 0.50149), h * 0.50149);
  path.cubicBezierTo(xAdj(0.91108, 0.49630), h * 0.49630, xAdj(0.90830, 0.48694), h * 0.48694, xAdj(0.90648, 0.48070), h * 0.48070);
  path.cubicBezierTo(xAdj(0.89922, 0.45578), h * 0.45578, xAdj(0.85850, 0.33246), h * 0.33246, xAdj(0.85483, 0.32427), h * 0.32427);
  path.cubicBezierTo(xAdj(0.85385, 0.32208), h * 0.32208, xAdj(0.85305, 0.31996), h * 0.31996, xAdj(0.85305, 0.31955), h * 0.31955);
  path.cubicBezierTo(xAdj(0.85305, 0.31696), h * 0.31696, xAdj(0.83895, 0.28069), h * 0.28069, xAdj(0.82778, 0.25453), h * 0.25453);
  path.cubicBezierTo(xAdj(0.82053, 0.23755), h * 0.23755, xAdj(0.81276, 0.21926), h * 0.21926, xAdj(0.81052, 0.21389), h * 0.21389);
  path.cubicBezierTo(xAdj(0.80560, 0.20213), h * 0.20213, xAdj(0.78541, 0.15739), h * 0.15739, xAdj(0.78422, 0.15561), h * 0.15561);
  path.cubicBezierTo(xAdj(0.78376, 0.15492), h * 0.15492, xAdj(0.77385, 0.13518), h * 0.13518, xAdj(0.76221, 0.11174), h * 0.11174);
  path.cubicBezierTo(xAdj(0.74062, 0.06828), h * 0.06828, xAdj(0.72998, 0.04942), h * 0.04942, xAdj(0.72105, 0.03873), h * 0.03873);
  path.cubicBezierTo(xAdj(0.71624, 0.03298), h * 0.03298, xAdj(0.70298, 0.02459), h * 0.02459, xAdj(0.69207, 0.02040), h * 0.02040);
  path.cubicBezierTo(xAdj(0.68710, 0.01849), h * 0.01849, xAdj(0.65942, 0.01217), h * 0.01217, xAdj(0.64415, 0.00946), h * 0.00946);
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
  // Bridge
  path.lineTo(xAdj(0.59820), h * 0.99925);
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
function drawRoundedHem(path: SVGPath, w: number, h: number, hemWidth: number, rounding: number) {
  const cx = w / 2;
  function xAdj(xFrac: number): number {
    const x = w * xFrac;
    return cx + (x - cx) * hemWidth;
  }
  const leftX = xAdj(0.00193);
  const rightX = xAdj(0.99807);
  const sideY = h * 0.89712;
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
  // Left quarter-arc: tangent at start is vertical, tangent at bottom is horizontal
  path.cubicBezierTo(leftX, sideY + depth * k, cx - halfW * k, bottomY, cx, bottomY);
  // Right quarter-arc: tangent at bottom is horizontal, tangent at end is vertical
  path.cubicBezierTo(cx + halfW * k, bottomY, rightX, sideY + depth * k, rightX, sideY);
}

function drawModifiedOutline(
  path: SVGPath, w: number, h: number, params: TemplateParams
) {
  const refH = REF_H;
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
  const rounding = params.rounding as boolean;
  const roundingAmt = (params.roundingAmount as number) || 0.5;

  const hasHemStyle = tattered || scalloped || fishtail || asymmetric || pointed || zigzag || wavy || castellated || dovetail || flame || stepped;

  // If no hem modifier, draw full outline at actual length h with hemWidth taper
  if (!hasHemStyle) {
    drawRefLeftSide(path, w, h, hemW);
    if (rounding) {
      drawRoundedHem(path, w, h, hemW, roundingAmt);
    } else {
      drawRefStandardHem(path, w, h, hemW);
    }
    drawRefRightSide(path, w, h, hemW);
    return;
  }

  // Draw the left side at actual length with hemWidth taper
  drawRefLeftSide(path, w, h, hemW);
  // Side endpoints at actual length
  const cx = w / 2;
  const leftX = cx + (w * 0.00193 - cx) * hemW;
  const leftY = h * 0.89712;
  const rightX = cx + (w * 0.99807 - cx) * hemW;
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
    const jitterMax = w * intensity;
    const hemSpan = rightX - leftX;
    const segmentCount = Math.max(12, Math.floor(hemSpan / 2.5));
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
    const pointDepth = (rightX - leftX) * depthFrac;
    const tipDepth = Math.max(pointDepth, effectiveDepth);
    const tipY = leftY + tipDepth;
    const midX = (leftX + rightX) / 2;
    const lcp = offsetPoint(leftX, leftY, tipDepth * 0.3);
    path.cubicBezierTo(lcp.x, lcp.y, midX - (midX - leftX) * 0.4, tipY, midX, tipY);
    const rcp = offsetPoint(rightX, leftY, tipDepth * 0.3);
    path.cubicBezierTo(midX + (rightX - midX) * 0.4, tipY, rcp.x, rcp.y, rightX, leftY);
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
      const d = (i % 2 === 0) ? depth : -depth;
      const ctrl = offsetPoint(midX, midBY, d);
      path.quadraticBezierTo(ctrl.x, ctrl.y, endX, baseY(tEnd));
    }
  } else if (castellated) {
    const count = (params.castellatedCount as number) || 8;
    const depth = (params.castellatedDepth as number) || 3;
    const segW = hemSpan / count;
    for (let i = 0; i < count; i++) {
      const tStart = i / count;
      const tEnd = (i + 1) / count;
      const startX = leftX + segW * i;
      const endX = leftX + segW * (i + 1);
      const bYS = baseY(tStart);
      const bYE = baseY(tEnd);
      if (i % 2 === 0) {
        // Merlon (raised) — offset outward
        const topL = offsetPoint(startX, bYS, depth);
        const topR = offsetPoint(endX, bYE, depth);
        path.lineTo(topL.x, topL.y);
        path.lineTo(topR.x, topR.y);
        path.lineTo(endX, bYE);
      } else {
        // Crenel (gap) — stay on baseline
        path.lineTo(endX, bYE);
      }
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
    const segW = hemSpan / count;
    for (let i = 0; i < count; i++) {
      const t0 = i / count;
      const t1 = (i + 0.5) / count;
      const t2 = (i + 1) / count;
      const startX = leftX + segW * i;
      const tipX = leftX + segW * (i + 0.5);
      const endX = leftX + segW * (i + 1);
      const bYStart = baseY(t0);
      const bYTip = baseY(t1);
      const bYEnd = baseY(t2);
      const tip = offsetPoint(tipX, bYTip, depth);
      // Asymmetric curves: lean the flame slightly
      const cp1 = offsetPoint(startX + segW * 0.15, baseY(t0 + 0.15 / count), depth * 0.6);
      const cp2 = offsetPoint(tipX - segW * 0.1, bYTip, depth * 0.9);
      path.cubicBezierTo(cp1.x, cp1.y, cp2.x, cp2.y, tip.x, tip.y);
      const cp3 = offsetPoint(tipX + segW * 0.1, bYTip, depth * 0.9);
      const cp4 = offsetPoint(endX - segW * 0.15, baseY(t2 - 0.15 / count), depth * 0.3);
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
  }

  // Draw the right side back up at actual length with hemWidth taper
  drawRefRightSide(path, w, h, hemW);
}

/**
 * Generate irregular worn/torn hole shapes as separate cut paths.
 * Produces organic blob shapes that avoid other cut features.
 */
function generateWornHoles(
  w: number, h: number, count: number, size: number, seed: number,
  params: TemplateParams
): string[] {
  const rng = new SeededRNG(seed);
  const paths: string[] = [];
  const placed: Array<{x: number; y: number; r: number}> = [];
  const refH = REF_H;

  // Build exclusion zones: circles to avoid
  const exclusions: Array<{x: number; y: number; r: number}> = [];
  // Attachment holes
  const holeCx = w / 2;
  const holeOff = w * REF_HOLE_OFFSET;
  const holeY = refH * REF_HOLE_Y;
  const holeR = (params.holeRadius as number) || REF_HOLE_RADIUS;
  exclusions.push({ x: holeCx - holeOff, y: holeY, r: holeR + size + 1 });
  exclusions.push({ x: holeCx + holeOff, y: holeY, r: holeR + size + 1 });
  // Neck/slit area
  exclusions.push({ x: holeCx, y: refH * 0.15, r: w * 0.12 });
  // Arm slits if enabled
  if (params.armSlits) {
    const armY = refH * ((params.armSlitY as number) || 0.35);
    exclusions.push({ x: w * 0.22, y: armY, r: size + 4 });
    exclusions.push({ x: w * 0.78, y: armY, r: size + 4 });
  }
  // Sword slit if enabled
  if (params.swordSlit) {
    const swordY = h * ((params.swordY as number) || 0.45);
    const swordX = (params.swordSide === 'left') ? w * 0.35 : w * 0.65;
    exclusions.push({ x: swordX, y: swordY, r: size + 5 });
  }

  // Safe placement zone: away from edges and the hem
  const sideEndY = refH * 0.89712;
  const safeMinX = w * 0.15;
  const safeMaxX = w * 0.85;
  const safeMinY = refH * 0.20;
  const safeMaxY = sideEndY - size - 2;

  for (let i = 0; i < count; i++) {
    let cx = 0, cy = 0, placed_ok = false;
    for (let attempt = 0; attempt < 30; attempt++) {
      cx = safeMinX + rng.next() * (safeMaxX - safeMinX);
      cy = safeMinY + rng.next() * (safeMaxY - safeMinY);
      // Check against exclusions
      const blocked = exclusions.some(e =>
        Math.hypot(e.x - cx, e.y - cy) < e.r
      );
      // Check against previously placed holes
      const tooClose = placed.some(p =>
        Math.hypot(p.x - cx, p.y - cy) < p.r + size * 2
      );
      if (!blocked && !tooClose) { placed_ok = true; break; }
    }
    if (!placed_ok) continue; // skip if can't place safely

    // Vary size per hole: 50%-160% of base
    const holeSize = size * (0.5 + rng.next() * 1.1);
    placed.push({ x: cx, y: cy, r: holeSize });

    // Generate an irregular blob using random radii + smooth cubic curves
    const vertCount = 5 + Math.floor(rng.next() * 5); // 5-9 vertices
    const angles: number[] = [];
    const radii: number[] = [];
    const baseAngle = rng.next() * Math.PI * 2;
    for (let v = 0; v < vertCount; v++) {
      angles.push(baseAngle + (v / vertCount) * Math.PI * 2);
      // Wildly varying radii for organic torn look
      radii.push(holeSize * (0.3 + rng.next() * 1.0));
    }

    const pts = angles.map((a, idx) => ({
      x: cx + radii[idx] * Math.cos(a),
      y: cy + radii[idx] * Math.sin(a),
    }));

    const path = new SVGPath();
    path.moveTo(pts[0].x, pts[0].y);
    for (let v = 0; v < vertCount; v++) {
      const curr = pts[v];
      const next = pts[(v + 1) % vertCount];
      // Random control point offsets for wobbly curves
      const mx = (curr.x + next.x) / 2;
      const my = (curr.y + next.y) / 2;
      const cpOff = holeSize * 0.4;
      const cp1x = curr.x + (mx - curr.x) * 0.5 + (rng.next() - 0.5) * cpOff;
      const cp1y = curr.y + (my - curr.y) * 0.5 + (rng.next() - 0.5) * cpOff;
      const cp2x = next.x + (mx - next.x) * 0.5 + (rng.next() - 0.5) * cpOff;
      const cp2y = next.y + (my - next.y) * 0.5 + (rng.next() - 0.5) * cpOff;
      path.cubicBezierTo(cp1x, cp1y, cp2x, cp2y, next.x, next.y);
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

/** Reference slit half-width factor (fraction of width) */
const REF_SLIT_HW = 0.008;
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
 * Draw the neck opening and slit from the reference.
 * Path direction: neck-bottom-left → left arm up → left shoulder peak →
 * (outline) → right shoulder peak → right arm down → neck-bottom-right →
 * slit wall down → keyhole arc → closePath back to start.
 *
 * Call this as the FIRST thing after moveTo(cx - sw, neckBottomY).
 * The outline goes between the two neck arm sections.
 */
function drawRefNeckAndSlit(path: SVGPath, w: number, h: number) {
  const sw = w * REF_SLIT_HW;
  const cx = w / 2;
  const holeCenterY = h * REF_SLIT_CENTER_Y;
  const dy = Math.sqrt(REF_SLIT_R * REF_SLIT_R - sw * sw);
  const arcJoinY = holeCenterY - dy;

  // --- Neck left arm: 3 cubics from neck-bottom-left up to left shoulder peak ---
  path.cubicBezierTo(w * 0.46734, h * 0.04666, w * 0.46423, h * 0.04467, w * 0.44870, h * 0.02594);
  path.cubicBezierTo(w * 0.43236, h * 0.00626, w * 0.42500, h * 0.00000, w * 0.41816, h * 0.00000);
  path.cubicBezierTo(w * 0.41366, h * 0.00000, w * 0.38230, h * 0.00476, w * 0.35585, h * 0.00946);

  // <<< caller inserts outline here >>>

  return { sw, cx, arcJoinY };
}

/**
 * Complete the neck right arm + slit after the outline.
 * Call after drawRefOutline / custom outline has been drawn,
 * with the path positioned at right shoulder peak (0.64415w, 0.00946h).
 */
function closeRefNeckAndSlit(path: SVGPath, w: number, h: number, sw: number, cx: number, arcJoinY: number) {
  // --- Neck right arm: 3 cubics from right shoulder peak to neck-bottom-right ---
  path.cubicBezierTo(w * 0.61770, h * 0.00476, w * 0.58634, h * 0.00000, w * 0.58184, h * 0.00000);
  path.cubicBezierTo(w * 0.57500, h * 0.00000, w * 0.56764, h * 0.00626, w * 0.55130, h * 0.02594);
  path.cubicBezierTo(w * 0.53577, h * 0.04467, w * 0.53266, h * 0.04666, cx + sw, h * 0.04778);

  // --- Slit: right wall down → keyhole arc → close back to start ---
  path.lineTo(cx + sw, arcJoinY);
  path.arcTo(REF_SLIT_R, REF_SLIT_R, 0, 1, 1, cx - sw, arcJoinY);

  path.closePath();
}

/**
 * Generate attachment hole paths for variable hole count.
 * Holes are evenly distributed around center at the reference Y position.
 */
function generateRefHoles(w: number, h: number, holeRadius: number, holeCount: number = 2): string[] {
  const cx = w / 2;
  const holeY = h * REF_HOLE_Y;
  if (holeCount === 1) {
    return [generateAttachmentHole(cx, holeY, holeRadius, 0, 0, false)];
  }
  // Spread holes evenly across the same total span as the original 2-hole layout
  const totalSpan = w * REF_HOLE_OFFSET * 2; // full width between outermost holes
  const holes: string[] = [];
  for (let i = 0; i < holeCount; i++) {
    const x = cx - totalSpan / 2 + (totalSpan / (holeCount - 1)) * i;
    holes.push(generateAttachmentHole(x, holeY, holeRadius, 0, 0, false));
  }
  return holes;
}

/**
 * Generate extra slit cut paths for 3+ hole configurations.
 * The center slit is already part of the main outline; this adds the additional ones.
 * For N holes, there are N-1 slits total; 1 is built-in, so this generates N-2 extra.
 */
function generateExtraSlits(w: number, h: number, holeCount: number): string[] {
  if (holeCount <= 2) return [];
  const cx = w / 2;
  const totalSpan = w * REF_HOLE_OFFSET * 2;
  const sw = w * REF_SLIT_HW;
  const slitTopY = h * 0.04778;
  const holeCenterY = h * REF_SLIT_CENTER_Y;
  const dy = Math.sqrt(REF_SLIT_R * REF_SLIT_R - sw * sw);
  const arcJoinY = holeCenterY - dy;
  const slits: string[] = [];
  // All N-1 slit positions between consecutive holes
  for (let i = 0; i < holeCount - 1; i++) {
    const slitCx = cx - totalSpan / 2 + (totalSpan / (holeCount - 1)) * (i + 0.5);
    // Skip the center slit (already in the outline) — it's at cx
    if (Math.abs(slitCx - cx) < 0.1) continue;
    const path = new SVGPath();
    path.moveTo(slitCx - sw, slitTopY);
    path.lineTo(slitCx - sw, arcJoinY);
    path.arcTo(REF_SLIT_R, REF_SLIT_R, 0, 1, 1, slitCx + sw, arcJoinY);
    path.lineTo(slitCx + sw, slitTopY);
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

    // Use refH for the neck/slit so the top stays fixed regardless of length
    path.moveTo(w / 2 - w * REF_SLIT_HW, refH * 0.04778);
    const { sw, cx, arcJoinY } = drawRefNeckAndSlit(path, w, refH);
    drawModifiedOutline(path, w, h, params);
    closeRefNeckAndSlit(path, w, refH, sw, cx, arcJoinY);
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius } = params;
    // Holes use REF_H so they stay in the same position regardless of length
    const paths = [this.generateCutPath(params), ...generateRefHoles(width, REF_H, holeRadius, 2)];
    if (params.swordSlit) {
      paths.push(generateSwordSlit(
        width, length,
        params.swordSide as string || 'right',
        params.swordAngle as number || 35,
        params.swordY as number || 0.45
      ));
    }
    if (params.starHoles) {
      paths.push(...generateWornHoles(
        width, length,
        (params.starHoleCount as number) || 5,
        (params.starHoleSize as number) || 1.5,
        (params.seed as number) || 12345,
        params
      ));
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

    path.moveTo(w / 2 - w * REF_SLIT_HW, h * 0.04778);
    const { sw, cx, arcJoinY } = drawRefNeckAndSlit(path, w, h);
    drawRefOutline(path, w, h);
    closeRefNeckAndSlit(path, w, h, sw, cx, arcJoinY);
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius } = params;
    const h = length * 0.6;
    const paths = [this.generateCutPath(params), ...generateRefHoles(width, h, holeRadius)];
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

    path.moveTo(w / 2 - w * REF_SLIT_HW, h * 0.04778);
    const { sw, cx, arcJoinY } = drawRefNeckAndSlit(path, w, h);

    if (split) {
      const splitY = h * 0.65;
      const splitGap = w * 0.03;

      // Left side: 12 reference beziers (shoulder → ~0.612h)
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

      // Extend to split point, then tail geometry
      path.lineTo(w * 0.05526, splitY);
      path.lineTo(w * 0.05526, h);
      path.lineTo(cx - splitGap, h);
      path.lineTo(cx - splitGap, splitY);
      path.lineTo(cx + splitGap, splitY);
      path.lineTo(cx + splitGap, h);
      path.lineTo(w * 0.94474, h);
      path.lineTo(w * 0.94474, splitY);

      // Right side: 12 mirrored reference beziers (~0.612h → shoulder)
      path.lineTo(w * 0.94474, h * 0.61175);
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
    } else {
      drawRefOutline(path, w, h);
    }

    closeRefNeckAndSlit(path, w, h, sw, cx, arcJoinY);
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius } = params;
    const h = length * 1.4;
    const paths = [this.generateCutPath(params), ...generateRefHoles(width, h, holeRadius)];
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

    path.moveTo(w / 2 - w * REF_SLIT_HW, h * 0.04778);
    const { sw, cx, arcJoinY } = drawRefNeckAndSlit(path, w, h);

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

    closeRefNeckAndSlit(path, w, h, sw, cx, arcJoinY);
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius } = params;
    const paths = [this.generateCutPath(params), ...generateRefHoles(width, length, holeRadius)];
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
 *   moveTo  → neck-opening bottom-left
 *   3 cubics → neck left arm up to left shoulder peak
 *  25 cubics → left side down to bottom-center
 *   lineTo  → bottom-center bridge to mirrored start
 *  25 cubics → right side up (mirrored left) to right shoulder peak
 *   3 cubics → neck right arm down to neck-opening bottom-right
 *   lineTo  → right slit wall down to keyhole join
 *   arc     → keyhole stress-relief circle
 *   close   → left slit wall back up to start
 */
export class CapeReferenceTest extends Template {
  generateCutPath(params: TemplateParams): string {
    const { length, width } = params;
    const path = new SVGPath();
    const w = width;
    const h = length;

    // Half-width of the slit / neck opening at its narrowest center point
    // Reference SVG: left wall x ≈ 0.492w, right wall x ≈ 0.508w → half-width ≈ 0.008w
    const sw = w * 0.008;
    const cx = w / 2;
    const slitR = 1.3; // stress-relief keyhole radius (mm), from reference inline hole span
    const holeCenterY = h * 0.295; // inline hole Y center from reference (slit extends to ~0.26h)

    // Keyhole arc join point
    const dy = Math.sqrt(slitR * slitR - sw * sw);
    const arcJoinY = holeCenterY - dy;

    // --- Start at neck-opening bottom-left ---
    path.moveTo(cx - sw, h * 0.04778);

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

    // --- Neck right arm: 3 cubics from right shoulder peak to neck-opening bottom-right ---
    path.cubicBezierTo(w * 0.61770, h * 0.00476, w * 0.58634, h * 0.00000, w * 0.58184, h * 0.00000);
    path.cubicBezierTo(w * 0.57500, h * 0.00000, w * 0.56764, h * 0.00626, w * 0.55130, h * 0.02594);
    path.cubicBezierTo(w * 0.53577, h * 0.04467, w * 0.53266, h * 0.04666, cx + sw, h * 0.04778);

    // --- Slit: right wall down → keyhole arc → close back to start ---
    path.lineTo(cx + sw, arcJoinY);
    path.arcTo(slitR, slitR, 0, 1, 1, cx - sw, arcJoinY);

    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius } = params;
    return [this.generateCutPath(params), ...generateRefHoles(width, length, holeRadius)];
  }

  generateScorePaths(params: TemplateParams): string[] {
    return [];
  }

  generateEngravePaths(params: TemplateParams): string[] {
    return [];
  }
}
