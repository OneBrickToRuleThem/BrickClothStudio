/**
 * Cape template generators
 * Capes are the most versatile LEGO fabric element
 */

import { Template, TemplateParams, generateAttachmentHole } from './base';
import { SVGPath, scallopedPath } from '../geometry/primitives';
import { SeededRNG } from '../utils/rng';

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
function drawRefLeftSide(path: SVGPath, w: number, h: number) {
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
}

/**
 * Draw the right side of the reference outline — right segments 5-25.
 * From y ≈ 0.897h up to right shoulder peak.
 * Mirror of drawRefLeftSide. Used by CapeTattered.
 */
function drawRefRightSide(path: SVGPath, w: number, h: number) {
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
 * Draw the standard bottom hem (no modifier) with independent length control.
 * Maps the reference bottom beziers from the side endpoints down to actual height h.
 */
function drawRefStandardHem(path: SVGPath, w: number, refH: number, h: number) {
  const sideEndY = refH * 0.89712;
  const refBottom = refH * 0.99925;
  // Map a reference Y fraction to actual Y, stretching only the bottom zone
  function yMap(refFrac: number): number {
    const refY = refH * refFrac;
    if (refY <= sideEndY) return refY;
    const t = (refY - sideEndY) / (refBottom - sideEndY);
    return sideEndY + t * (h - sideEndY);
  }
  // Left bottom 4 beziers
  path.cubicBezierTo(w * 0.00409, yMap(0.90125), w * 0.00828, yMap(0.90362), w * 0.03267, yMap(0.91449));
  path.cubicBezierTo(w * 0.07094, yMap(0.93155), w * 0.12346, yMap(0.94865), w * 0.18105, yMap(0.96279));
  path.cubicBezierTo(w * 0.22355, yMap(0.97322), w * 0.23299, yMap(0.97505), w * 0.29379, yMap(0.98465));
  path.cubicBezierTo(w * 0.35859, yMap(0.99487), w * 0.37646, yMap(0.99729), w * 0.40180, yMap(0.99925));
  // Bridge
  path.lineTo(w * 0.59820, yMap(0.99925));
  // Right bottom 4 beziers
  path.cubicBezierTo(w * 0.62354, yMap(0.99729), w * 0.64141, yMap(0.99487), w * 0.70621, yMap(0.98465));
  path.cubicBezierTo(w * 0.76701, yMap(0.97505), w * 0.77645, yMap(0.97322), w * 0.81895, yMap(0.96279));
  path.cubicBezierTo(w * 0.87654, yMap(0.94865), w * 0.92906, yMap(0.93155), w * 0.96733, yMap(0.91449));
  path.cubicBezierTo(w * 0.99172, yMap(0.90362), w * 0.99591, yMap(0.90125), w * 0.99807, yMap(0.89712));
}

function drawModifiedOutline(
  path: SVGPath, w: number, h: number, params: TemplateParams
) {
  const refH = REF_H;
  const tattered = params.tattered as boolean;
  const scalloped = params.scalloped as boolean;
  const fishtail = params.fishtail as boolean;
  const asymmetric = params.asymmetric as boolean;

  // If no hem modifier, draw sides at reference height and stretch bottom to h
  if (!tattered && !scalloped && !fishtail && !asymmetric) {
    drawRefLeftSide(path, w, refH);
    drawRefStandardHem(path, w, refH, h);
    drawRefRightSide(path, w, refH);
    return;
  }

  // Draw the left side at reference height
  drawRefLeftSide(path, w, refH);
  // Side endpoints use refH so upper shape stays fixed
  const leftX = w * 0.00193;
  const leftY = refH * 0.89712;
  const rightX = w * 0.99807;
  const rightY = leftY;

  if (tattered) {
    const rng = new SeededRNG((params.seed as number) || 12345);
    const intensity = (params.tatteredIntensity as number) || 0.06;
    const jitterMax = w * intensity;
    const segmentCount = Math.max(12, Math.floor(w / 2.5));
    let prevY = leftY;
    for (let i = 0; i <= segmentCount; i++) {
      const t = i / segmentCount;
      const xPos = leftX + (rightX - leftX) * t;
      const baseY = leftY + (h - leftY) * Math.sin(t * Math.PI);
      const yJitter = rng.nextRange(-jitterMax * 0.2, jitterMax);
      let targetY = baseY + yJitter;
      targetY = Math.max(targetY, leftY);
      const maxStep = jitterMax * 1.2;
      if (Math.abs(targetY - prevY) > maxStep) {
        targetY = prevY + Math.sign(targetY - prevY) * maxStep;
      }
      prevY = targetY;
      path.lineTo(xPos, targetY);
    }
  } else if (scalloped) {
    const count = (params.scallopCount as number) || 8;
    const depth = (params.scallopDepth as number) || 3;
    const inverted = params.scallopInverted as boolean;
    const hemW = rightX - leftX;
    const segW = hemW / count;
    const droop = h - leftY;
    for (let i = 0; i < count; i++) {
      const ex = leftX + segW * (i + 1);
      const startY = leftY + droop * Math.sin((i / count) * Math.PI);
      const endY = leftY + droop * Math.sin(((i + 1) / count) * Math.PI);
      const midX = leftX + segW * (i + 0.5);
      const midBaseY = (startY + endY) / 2;
      const ctrlY = inverted ? midBaseY - depth : midBaseY + depth;
      path.quadraticBezierTo(midX, ctrlY, ex, endY);
    }
  } else if (fishtail) {
    const depthFrac = (params.fishtailDepth as number) || 0.15;
    const notchCount = (params.fishtailNotches as number) || 3;
    const notchDepth = h * depthFrac;
    const hemBottom = h;
    // Curve from left side down to hem
    const hemLeft = w * 0.12;
    const hemRight = w * 0.88;
    path.cubicBezierTo(leftX, leftY + (hemBottom - leftY) * 0.4, w * 0.06, hemBottom, hemLeft, hemBottom);
    // Distribute V-notches evenly across the hem
    const hemSpan = hemRight - hemLeft;
    const notchW = Math.min(w * 0.06, hemSpan / (notchCount * 2));
    for (let i = 0; i < notchCount; i++) {
      const nc = hemLeft + hemSpan * (i + 1) / (notchCount + 1);
      path.lineTo(nc - notchW, hemBottom);
      path.lineTo(nc, hemBottom - notchDepth);
      path.lineTo(nc + notchW, hemBottom);
    }
    path.lineTo(hemRight, hemBottom);
    // Curve from hem up to right side
    path.cubicBezierTo(w * 0.94, hemBottom, rightX, rightY + (hemBottom - rightY) * 0.4, rightX, rightY);
  } else if (asymmetric) {
    const skew = (params.asymmetricSkew as number) || 0.15;
    const side = (params.asymmetricSide as string) || 'left';
    const hemBase = h;
    const leftDrop = (side === 'left' || side === 'both') ? hemBase : leftY;
    const rightDrop = (side === 'right' || side === 'both') ? hemBase : rightY;
    const leftHem = (side === 'right') ? leftY + (hemBase - leftY) * (1 - skew) : leftDrop;
    const rightHem = (side === 'left') ? rightY + (hemBase - rightY) * (1 - skew) : rightDrop;
    const midHem = (leftHem + rightHem) / 2;
    path.cubicBezierTo(leftX, leftY + (leftHem - leftY) * 0.4, w * 0.12, leftHem, w * 0.30, leftHem);
    path.lineTo(w * 0.50, midHem);
    path.lineTo(w * 0.70, rightHem);
    path.cubicBezierTo(w * 0.88, rightHem, rightX, rightY + (rightHem - rightY) * 0.4, rightX, rightY);
  }

  // Draw the right side back up at reference height
  drawRefRightSide(path, w, refH);
}

/**
 * Generate star-shaped battle damage holes as separate cut paths.
 * Deterministic positions from seed, placed in the body area of the cape.
 */
function generateStarHoles(
  w: number, h: number, count: number, size: number, seed: number
): string[] {
  const rng = new SeededRNG(seed);
  const paths: string[] = [];
  const placed: Array<{x: number; y: number}> = [];

  for (let i = 0; i < count; i++) {
    // Try to avoid overlapping previous holes
    let cx = 0, cy = 0;
    for (let attempt = 0; attempt < 10; attempt++) {
      cx = w * (0.12 + rng.next() * 0.76);
      cy = h * (0.22 + rng.next() * 0.55);
      const tooClose = placed.some(p =>
        Math.hypot(p.x - cx, p.y - cy) < size * 3
      );
      if (!tooClose) break;
    }
    placed.push({ x: cx, y: cy });

    // Vary per-hole: size ±40%, point count 4-7, rotation, inner ratio
    const holeSize = size * (0.6 + rng.next() * 0.8);
    const points = 4 + Math.floor(rng.next() * 4);
    const rotation = rng.next() * Math.PI * 2;
    const innerRatio = 0.3 + rng.next() * 0.25; // 0.3-0.55 inner radius

    const path = new SVGPath();
    const totalVerts = points * 2;
    for (let p = 0; p <= totalVerts; p++) {
      const angle = (p * Math.PI) / points + rotation;
      const isOuter = p % 2 === 0;
      const r = isOuter ? holeSize : holeSize * innerRatio;
      // Add slight per-vertex wobble for organic feel
      const wobble = 1 + (rng.next() - 0.5) * 0.3;
      const x = cx + r * wobble * Math.cos(angle);
      const y = cy + r * wobble * Math.sin(angle);
      if (p === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
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
 * Generate standard reference hole paths for a cape variant.
 * Uses reference positions but respects the user's chosen hole radius.
 */
function generateRefHoles(w: number, h: number, holeRadius: number): string[] {
  const cx = w / 2;
  const holeOffset = w * REF_HOLE_OFFSET;
  const holeY = h * REF_HOLE_Y;
  return [
    generateAttachmentHole(cx - holeOffset, holeY, holeRadius, 0, 0, false),
    generateAttachmentHole(cx + holeOffset, holeY, holeRadius, 0, 0, false),
  ];
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
    const paths = [this.generateCutPath(params), ...generateRefHoles(width, REF_H, holeRadius)];
    if (params.swordSlit) {
      paths.push(generateSwordSlit(
        width, length,
        params.swordSide as string || 'right',
        params.swordAngle as number || 35,
        params.swordY as number || 0.45
      ));
    }
    if (params.starHoles) {
      paths.push(...generateStarHoles(
        width, length,
        (params.starHoleCount as number) || 5,
        (params.starHoleSize as number) || 1.5,
        (params.seed as number) || 12345
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
