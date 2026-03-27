/**
 * Shared edge style drawing functions.
 * Used by sails, kama, mantle, capes, flags, and wings.
 */

import { SVGPath } from './primitives';
import { SeededRNG } from '../utils/rng';

/** All supported edge style names */
export const EDGE_STYLE_NAMES = [
  'none', 'scalloped', 'zigzag', 'wavy', 'castellated', 'torn',
  'pointed', 'flame', 'stepped', 'dovetail', 'fishtail',
  'feathered', 'cloud', 'sawtooth', 'arrow', 'picot',
] as const;

export type EdgeStyleName = typeof EDGE_STYLE_NAMES[number];

/**
 * Draw a styled edge segment from (x0,y0) to (x1,y1).
 * Style applies perpendicular decoration. `outward` direction: +1 or -1.
 * The safeInset parameter defines regions to skip decoration near grommets.
 */
export function drawStyledEdge(
  path: SVGPath,
  x0: number, y0: number, x1: number, y1: number,
  style: string, depth: number, count: number,
  outwardX: number, outwardY: number,
  safeInset: number,
  seed: number = 0
): void {
  if (style === 'none' || style === 'straight') {
    path.lineTo(x1, y1);
    return;
  }

  // Compute safe start/end to avoid grommet collisions
  const dx = x1 - x0;
  const dy = y1 - y0;
  const edgeLen = Math.hypot(dx, dy);
  if (edgeLen < safeInset * 2 + 2) {
    path.lineTo(x1, y1);
    return;
  }

  const ux = dx / edgeLen;
  const uy = dy / edgeLen;
  const sx0 = x0 + ux * safeInset;
  const sy0 = y0 + uy * safeInset;
  const sx1 = x1 - ux * safeInset;
  const sy1 = y1 - uy * safeInset;
  const safeLen = edgeLen - safeInset * 2;

  // Draw safe inset straight line at start
  path.lineTo(sx0, sy0);

  // Now draw the decorated portion
  const segW = safeLen / count;

  switch (style) {
    case 'scalloped':
      for (let i = 0; i < count; i++) {
        const ax = sx0 + ux * (i * segW);
        const ay = sy0 + uy * (i * segW);
        const bx = sx0 + ux * ((i + 1) * segW);
        const by = sy0 + uy * ((i + 1) * segW);
        const cx = (ax + bx) / 2 + outwardX * depth;
        const cy = (ay + by) / 2 + outwardY * depth;
        path.quadraticBezierTo(cx, cy, bx, by);
      }
      break;

    case 'zigzag':
      for (let i = 0; i < count; i++) {
        const midX = sx0 + ux * ((i + 0.5) * segW);
        const midY = sy0 + uy * ((i + 0.5) * segW);
        const dir = (i % 2 === 0) ? 1 : -1;
        path.lineTo(midX + outwardX * depth * dir, midY + outwardY * depth * dir);
      }
      path.lineTo(sx1, sy1);
      break;

    case 'wavy':
      for (let i = 0; i < count; i++) {
        const ax = sx0 + ux * (i * segW);
        const ay = sy0 + uy * (i * segW);
        const bx = sx0 + ux * ((i + 1) * segW);
        const by = sy0 + uy * ((i + 1) * segW);
        const dir = (i % 2 === 0) ? 1 : -1;
        const cx = (ax + bx) / 2 + outwardX * depth * dir;
        const cy = (ay + by) / 2 + outwardY * depth * dir;
        path.quadraticBezierTo(cx, cy, bx, by);
      }
      break;

    case 'castellated': {
      const merlonW = segW * 0.5;
      for (let i = 0; i < count; i++) {
        const baseX = sx0 + ux * (i * segW);
        const baseY = sy0 + uy * (i * segW);
        path.lineTo(baseX + outwardX * depth, baseY + outwardY * depth);
        path.lineTo(
          baseX + ux * merlonW + outwardX * depth,
          baseY + uy * merlonW + outwardY * depth
        );
        path.lineTo(baseX + ux * merlonW, baseY + uy * merlonW);
        const nextX = sx0 + ux * ((i + 1) * segW);
        const nextY = sy0 + uy * ((i + 1) * segW);
        path.lineTo(nextX, nextY);
      }
      break;
    }

    case 'torn': {
      const scrambled = seed != null ? ((seed * 2654435761) >>> 0) : Math.round(x0 * 100 + y0 * 37 + count * 7);
      const rng = new SeededRNG(scrambled);
      const tearSegs = count * 4;
      const tearSegW = safeLen / tearSegs;
      const points: Array<{ x: number; y: number }> = [];
      for (let i = 0; i <= tearSegs; i++) {
        const t = i / tearSegs;
        const baseX = sx0 + ux * (t * safeLen);
        const baseY = sy0 + uy * (t * safeLen);
        if (i === 0 || i === tearSegs) { points.push({ x: baseX, y: baseY }); continue; }
        const r1 = rng.nextRange(0, 1);
        const r2 = rng.nextRange(0, 1);
        const midBias = Math.sin(t * Math.PI);
        const isDeepTear = r1 < 0.25;
        const tearDepth = isDeepTear
          ? depth * (0.6 + r2 * 0.4) * (0.5 + midBias * 0.5)
          : depth * r2 * 0.35 * (0.3 + midBias * 0.7);
        const dir = rng.nextRange(0, 1) < 0.7 ? 1 : -0.25;
        const lateralJitter = rng.nextRange(-0.4, 0.4) * tearSegW;
        points.push({
          x: baseX + ux * lateralJitter + outwardX * tearDepth * dir,
          y: baseY + uy * lateralJitter + outwardY * tearDepth * dir,
        });
      }
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const cpOff1 = rng.nextRange(0.2, 0.5);
        const cpOff2 = rng.nextRange(0.5, 0.8);
        const cpPerp1 = rng.nextRange(-0.3, 0.3) * depth;
        const cpPerp2 = rng.nextRange(-0.3, 0.3) * depth;
        const cp1x = p0.x + (p1.x - p0.x) * cpOff1 + outwardX * cpPerp1;
        const cp1y = p0.y + (p1.y - p0.y) * cpOff1 + outwardY * cpPerp1;
        const cp2x = p0.x + (p1.x - p0.x) * cpOff2 + outwardX * cpPerp2;
        const cp2y = p0.y + (p1.y - p0.y) * cpOff2 + outwardY * cpPerp2;
        path.cubicBezierTo(cp1x, cp1y, cp2x, cp2y, p1.x, p1.y);
      }
      break;
    }

    case 'pointed':
      // Gothic pointed arches — straight sides to a peak
      for (let i = 0; i < count; i++) {
        const ax = sx0 + ux * (i * segW);
        const ay = sy0 + uy * (i * segW);
        const bx = sx0 + ux * ((i + 1) * segW);
        const by = sy0 + uy * ((i + 1) * segW);
        const peakX = (ax + bx) / 2 + outwardX * depth;
        const peakY = (ay + by) / 2 + outwardY * depth;
        path.lineTo(peakX, peakY);
        path.lineTo(bx, by);
      }
      break;

    case 'flame': {
      // Organic flickering flame tongues — seeded variation in height/width
      const scrambled = seed != null ? ((seed * 2654435761) >>> 0) : Math.round(x0 * 100 + y0 * 37);
      const rng = new SeededRNG(scrambled);
      for (let i = 0; i < count; i++) {
        const ax = sx0 + ux * (i * segW);
        const ay = sy0 + uy * (i * segW);
        const bx = sx0 + ux * ((i + 1) * segW);
        const by = sy0 + uy * ((i + 1) * segW);
        const h = depth * (0.5 + rng.nextRange(0, 1) * 0.8);
        const lean = rng.nextRange(-0.2, 0.2) * segW;
        const tipX = (ax + bx) / 2 + ux * lean + outwardX * h;
        const tipY = (ay + by) / 2 + uy * lean + outwardY * h;
        // Rising curve to tip
        const cp1x = ax + ux * segW * 0.15 + outwardX * h * 0.6;
        const cp1y = ay + uy * segW * 0.15 + outwardY * h * 0.6;
        path.quadraticBezierTo(cp1x, cp1y, tipX, tipY);
        // Falling curve back down
        const cp2x = bx - ux * segW * 0.15 + outwardX * h * 0.6;
        const cp2y = by - uy * segW * 0.15 + outwardY * h * 0.6;
        path.quadraticBezierTo(cp2x, cp2y, bx, by);
      }
      break;
    }

    case 'stepped':
      // Staircase steps — ascending then descending
      for (let i = 0; i < count; i++) {
        const steps = 3;
        const stepW = segW / (steps * 2);
        for (let s = 0; s < steps; s++) {
          const t0 = i * segW + s * 2 * stepW;
          const d = depth * ((s + 1) / steps);
          const px = sx0 + ux * t0;
          const py = sy0 + uy * t0;
          path.lineTo(px + outwardX * d, py + outwardY * d);
          path.lineTo(px + ux * stepW + outwardX * d, py + uy * stepW + outwardY * d);
        }
        for (let s = steps - 1; s >= 0; s--) {
          const t0 = i * segW + (steps + (steps - 1 - s)) * stepW * 2;
          const d = depth * ((s + 1) / steps);
          if (s < steps - 1) {
            const px = sx0 + ux * (t0 - stepW);
            const py = sy0 + uy * (t0 - stepW);
            path.lineTo(px + outwardX * d, py + outwardY * d);
          }
          const px2 = sx0 + ux * t0;
          const py2 = sy0 + uy * t0;
          path.lineTo(px2 + outwardX * d, py2 + outwardY * d);
        }
        const endX = sx0 + ux * ((i + 1) * segW);
        const endY = sy0 + uy * ((i + 1) * segW);
        path.lineTo(endX, endY);
      }
      break;

    case 'dovetail': {
      // Trapezoidal notches alternating in/out
      const notchTop = segW * 0.3;
      const notchBot = segW * 0.6;
      for (let i = 0; i < count; i++) {
        const baseX = sx0 + ux * (i * segW);
        const baseY = sy0 + uy * (i * segW);
        const dir = (i % 2 === 0) ? 1 : -0.3;
        const d = depth * dir;
        // Narrow top
        const inset = (segW - notchTop) / 2;
        path.lineTo(baseX + ux * inset + outwardX * d, baseY + uy * inset + outwardY * d);
        // Wide bottom (trapezoid shape)
        const wideInset = (segW - notchBot) / 2;
        path.lineTo(baseX + ux * wideInset + outwardX * d, baseY + uy * wideInset + outwardY * d);
        path.lineTo(baseX + ux * (segW - wideInset) + outwardX * d, baseY + uy * (segW - wideInset) + outwardY * d);
        // Back narrow
        path.lineTo(baseX + ux * (segW - inset) + outwardX * d, baseY + uy * (segW - inset) + outwardY * d);
        // Return to baseline
        const nextX = sx0 + ux * ((i + 1) * segW);
        const nextY = sy0 + uy * ((i + 1) * segW);
        path.lineTo(nextX, nextY);
      }
      break;
    }

    case 'fishtail':
      // V-shaped notch pattern
      for (let i = 0; i < count; i++) {
        const ax = sx0 + ux * (i * segW);
        const ay = sy0 + uy * (i * segW);
        const bx = sx0 + ux * ((i + 1) * segW);
        const by = sy0 + uy * ((i + 1) * segW);
        const midX = (ax + bx) / 2;
        const midY = (ay + by) / 2;
        // Outward to wings, then inward notch at center
        path.lineTo(ax + outwardX * depth * 0.3, ay + outwardY * depth * 0.3);
        path.lineTo(midX - outwardX * depth * 0.7, midY - outwardY * depth * 0.7);
        path.lineTo(bx + outwardX * depth * 0.3, by + outwardY * depth * 0.3);
        path.lineTo(bx, by);
      }
      break;

    case 'feathered': {
      // Overlapping elongated leaf/feather shapes
      const scrambled = seed != null ? ((seed * 2654435761) >>> 0) : Math.round(x0 * 100 + y0 * 37);
      const rng = new SeededRNG(scrambled);
      for (let i = 0; i < count; i++) {
        const ax = sx0 + ux * (i * segW);
        const ay = sy0 + uy * (i * segW);
        const bx = sx0 + ux * ((i + 1) * segW);
        const by = sy0 + uy * ((i + 1) * segW);
        const h = depth * (0.6 + rng.nextRange(0, 1) * 0.4);
        // Overlap: extend slightly past segment
        const overlapX = ux * segW * 0.15;
        const overlapY = uy * segW * 0.15;
        const tipX = (ax + bx) / 2 + overlapX + outwardX * h;
        const tipY = (ay + by) / 2 + overlapY + outwardY * h;
        // Smooth feather curve: up
        path.cubicBezierTo(
          ax + ux * segW * 0.2 + outwardX * h * 0.3,
          ay + uy * segW * 0.2 + outwardY * h * 0.3,
          tipX - ux * segW * 0.1 + outwardX * h * 0.1,
          tipY - uy * segW * 0.1 + outwardY * h * 0.1,
          tipX, tipY
        );
        // Smooth feather curve: down
        path.cubicBezierTo(
          tipX + ux * segW * 0.1 + outwardX * h * 0.1,
          tipY + uy * segW * 0.1 + outwardY * h * 0.1,
          bx - ux * segW * 0.2 + outwardX * h * 0.3,
          by - uy * segW * 0.2 + outwardY * h * 0.3,
          bx, by
        );
      }
      break;
    }

    case 'cloud': {
      // Billowy bumps of varying size (3 arcs per segment)
      const scrambled = seed != null ? ((seed * 2654435761) >>> 0) : Math.round(x0 * 100 + y0 * 37);
      const rng = new SeededRNG(scrambled);
      for (let i = 0; i < count; i++) {
        const subCount = 3;
        const subW = segW / subCount;
        for (let j = 0; j < subCount; j++) {
          const t0 = i * segW + j * subW;
          const t1 = t0 + subW;
          const pax = sx0 + ux * t0;
          const pay = sy0 + uy * t0;
          const pbx = sx0 + ux * t1;
          const pby = sy0 + uy * t1;
          const h = depth * (0.4 + rng.nextRange(0, 1) * 0.6);
          const cx = (pax + pbx) / 2 + outwardX * h;
          const cy = (pay + pby) / 2 + outwardY * h;
          path.quadraticBezierTo(cx, cy, pbx, pby);
        }
      }
      break;
    }

    case 'sawtooth':
      // Asymmetric teeth (steep rise, gradual fall)
      for (let i = 0; i < count; i++) {
        const ax = sx0 + ux * (i * segW);
        const ay = sy0 + uy * (i * segW);
        const bx = sx0 + ux * ((i + 1) * segW);
        const by = sy0 + uy * ((i + 1) * segW);
        // Steep side: jump to peak at 25%
        const peakT = 0.25;
        const peakX = ax + ux * segW * peakT + outwardX * depth;
        const peakY = ay + uy * segW * peakT + outwardY * depth;
        path.lineTo(peakX, peakY);
        // Gradual slope back down
        path.lineTo(bx, by);
      }
      break;

    case 'arrow':
      // Chevron/arrow pattern pointing outward
      for (let i = 0; i < count; i++) {
        const ax = sx0 + ux * (i * segW);
        const ay = sy0 + uy * (i * segW);
        const bx = sx0 + ux * ((i + 1) * segW);
        const by = sy0 + uy * ((i + 1) * segW);
        const midX = (ax + bx) / 2;
        const midY = (ay + by) / 2;
        // Indent at start and end, peak outward at center
        const notchDepth = depth * 0.3;
        path.lineTo(ax - outwardX * notchDepth, ay - outwardY * notchDepth);
        path.lineTo(midX + outwardX * depth, midY + outwardY * depth);
        path.lineTo(bx - outwardX * notchDepth, by - outwardY * notchDepth);
        path.lineTo(bx, by);
      }
      break;

    case 'picot': {
      // Small decorative loops at regular intervals
      for (let i = 0; i < count; i++) {
        const midT = (i + 0.5) * segW;
        const midX = sx0 + ux * midT;
        const midY = sy0 + uy * midT;
        // Line to just before the loop
        path.lineTo(sx0 + ux * (midT - segW * 0.15), sy0 + uy * (midT - segW * 0.15));
        // Small circular bump
        const loopR = Math.min(depth * 0.5, segW * 0.3);
        const peakX = midX + outwardX * loopR * 2;
        const peakY = midY + outwardY * loopR * 2;
        path.cubicBezierTo(
          midX - ux * loopR + outwardX * loopR * 1.5,
          midY - uy * loopR + outwardY * loopR * 1.5,
          peakX - ux * loopR * 0.5,
          peakY - uy * loopR * 0.5,
          peakX, peakY
        );
        path.cubicBezierTo(
          peakX + ux * loopR * 0.5,
          peakY + uy * loopR * 0.5,
          midX + ux * loopR + outwardX * loopR * 1.5,
          midY + uy * loopR + outwardY * loopR * 1.5,
          sx0 + ux * (midT + segW * 0.15),
          sy0 + uy * (midT + segW * 0.15)
        );
        // Continue to next segment start
        const endX = sx0 + ux * ((i + 1) * segW);
        const endY = sy0 + uy * ((i + 1) * segW);
        path.lineTo(endX, endY);
      }
      break;
    }

    default:
      path.lineTo(sx1, sy1);
  }

  // Draw safe inset straight line at end
  path.lineTo(x1, y1);
}
