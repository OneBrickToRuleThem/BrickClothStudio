/**
 * Shared edge style drawing functions.
 * Used by sails, kama, mantle, capes, flags, and wings.
 */

import { SVGPath } from './primitives';
import { SeededRNG } from '../utils/rng';

/** All supported edge style names */
export const EDGE_STYLE_NAMES = [
  'none', 'arched', 'arrow', 'castellated', 'cloud', 'dovetail',
  'feathered', 'flame', 'notched', 'picot', 'sawtooth',
  'scalloped', 'stepped', 'thorned', 'torn', 'wavy', 'zigzag',
] as const;

export type EdgeStyleName = typeof EDGE_STYLE_NAMES[number];

/**
 * Flame profile extracted from Flames.svg (first subpath, ~20 tongues).
 * Normalized: X=[0,1] along edge, Y=[0,1] outward (0=baseline, 1=max tip).
 * Format: [type, ...coords] where 2=LineTo, 3=CubicBezier(cp1x,cp1y,cp2x,cp2y,x,y).
 */
export const FLAME_PROFILE: (readonly number[])[] = [
  [2, 0, 0],
  [3, 0.00036, 0.0747, 0, 0.11706, 0.01605, 0.18443],
  [3, 0.02255, 0.21173, 0.02344, 0.22109, 0.02227, 0.25003],
  [3, 0.02091, 0.28355, 0.02094, 0.28372, 0.02651, 0.27497],
  [3, 0.03621, 0.25973, 0.04239, 0.22897, 0.04245, 0.19555],
  [3, 0.04255, 0.14599, 0.05269, 0.12391, 0.07151, 0.13226],
  [3, 0.07929, 0.13571, 0.0872, 0.16186, 0.0872, 0.18414],
  [3, 0.0872, 0.19252, 0.08268, 0.21871, 0.07714, 0.24234],
  [3, 0.06832, 0.28002, 0.06721, 0.28929, 0.06816, 0.31769],
  [3, 0.06905, 0.34435, 0.07112, 0.35572, 0.0799, 0.38203],
  [3, 0.09383, 0.42381, 0.09782, 0.45696, 0.09341, 0.49414],
  [3, 0.09158, 0.50957, 0.09041, 0.52278, 0.09082, 0.5235],
  [3, 0.09361, 0.52844, 0.11142, 0.4945, 0.11685, 0.47389],
  [3, 0.12461, 0.44446, 0.12518, 0.41998, 0.11907, 0.3795],
  [3, 0.11265, 0.33692, 0.11303, 0.29078, 0.11994, 0.27432],
  [3, 0.13218, 0.24518, 0.14879, 0.24495, 0.15832, 0.27379],
  [3, 0.16209, 0.28522, 0.16436, 0.30337, 0.16535, 0.33023],
  [2, 0.16681, 0.36982],
  [2, 0.17479, 0.35138],
  [3, 0.18045, 0.3383, 0.18332, 0.32468, 0.18467, 0.30448],
  [3, 0.18708, 0.2684, 0.18884, 0.26368, 0.19987, 0.26368],
  [3, 0.21251, 0.26368, 0.2206, 0.27549, 0.22422, 0.2992],
  [3, 0.22834, 0.32624, 0.22591, 0.34629, 0.21208, 0.39944],
  [3, 0.20128, 0.44099, 0.20052, 0.44679, 0.20043, 0.48867],
  [3, 0.20033, 0.53003, 0.20097, 0.5353, 0.20871, 0.55725],
  [3, 0.21332, 0.57032, 0.22264, 0.58904, 0.22944, 0.59885],
  [3, 0.24123, 0.61587, 0.2417, 0.61611, 0.23981, 0.60433],
  [3, 0.23872, 0.59754, 0.23708, 0.57604, 0.23615, 0.55655],
  [3, 0.23397, 0.51069, 0.23912, 0.48238, 0.25891, 0.4313],
  [3, 0.28142, 0.3732, 0.2844, 0.33245, 0.27115, 0.26414],
  [3, 0.26477, 0.23127, 0.26462, 0.21342, 0.27053, 0.19139],
  [3, 0.28238, 0.14725, 0.31981, 0.15062, 0.32697, 0.19647],
  [3, 0.32871, 0.20758, 0.32823, 0.22436, 0.32547, 0.24932],
  [3, 0.32023, 0.29681, 0.32214, 0.33308, 0.33183, 0.36982],
  [3, 0.34293, 0.41192, 0.34321, 0.46624, 0.33254, 0.50651],
  [3, 0.32408, 0.53842, 0.32583, 0.53934, 0.34631, 0.51375],
  [3, 0.35421, 0.50388, 0.36079, 0.48962, 0.36586, 0.47138],
  [3, 0.37267, 0.44688, 0.37366, 0.43683, 0.3749, 0.37944],
  [3, 0.3764, 0.31046, 0.37888, 0.29692, 0.39303, 0.28053],
  [3, 0.41605, 0.25388, 0.44473, 0.29477, 0.44473, 0.35423],
  [3, 0.44473, 0.38262, 0.43904, 0.41022, 0.42357, 0.45687],
  [3, 0.41567, 0.48066, 0.40983, 0.50564, 0.40795, 0.52368],
  [3, 0.40512, 0.55071, 0.40551, 0.55539, 0.41422, 0.59939],
  [3, 0.42375, 0.64753, 0.42645, 0.69355, 0.42156, 0.72454],
  [2, 0.41934, 0.73861],
  [2, 0.42817, 0.7275],
  [3, 0.44245, 0.70953, 0.45026, 0.67346, 0.45029, 0.62531],
  [3, 0.45031, 0.5912, 0.45122, 0.58297, 0.4559, 0.57471],
  [3, 0.46256, 0.56294, 0.46745, 0.56236, 0.4781, 0.5721],
  [3, 0.49973, 0.59188, 0.50503, 0.67034, 0.49061, 0.75737],
  [3, 0.47991, 0.82201, 0.47959, 0.87694, 0.48971, 0.91536],
  [3, 0.49691, 0.94266, 0.52236, 1, 0.51923, 0.98185],
  [3, 0.50655, 0.90827, 0.50993, 0.86734, 0.53452, 0.79656],
  [3, 0.56086, 0.72078, 0.56321, 0.71011, 0.56325, 0.66604],
  [3, 0.56328, 0.62969, 0.56231, 0.62282, 0.55103, 0.57988],
  [3, 0.53608, 0.52297, 0.53395, 0.49569, 0.54221, 0.46706],
  [3, 0.55151, 0.43484, 0.56796, 0.42393, 0.58448, 0.43902],
  [3, 0.59951, 0.45276, 0.60182, 0.46864, 0.59959, 0.54293],
  [3, 0.59764, 0.60775, 0.59774, 0.60943, 0.60503, 0.63575],
  [3, 0.61707, 0.67923, 0.61959, 0.67906, 0.61943, 0.63475],
  [3, 0.61931, 0.59857, 0.62005, 0.59389, 0.63305, 0.54814],
  [3, 0.64516, 0.5055, 0.64694, 0.49524, 0.64805, 0.46137],
  [3, 0.64954, 0.41588, 0.64683, 0.39896, 0.6313, 0.3566],
  [3, 0.6003, 0.27205, 0.59677, 0.23119, 0.61721, 0.19333],
  [3, 0.62772, 0.17385, 0.64244, 0.1745, 0.654, 0.19494],
  [3, 0.66373, 0.21213, 0.66328, 0.20817, 0.66369, 0.28096],
  [3, 0.66397, 0.33201, 0.66447, 0.3365, 0.67191, 0.35587],
  [3, 0.68457, 0.38886, 0.68707, 0.38689, 0.68555, 0.34514],
  [3, 0.68396, 0.30128, 0.68817, 0.27655, 0.70443, 0.23423],
  [3, 0.71155, 0.21569, 0.71723, 0.19373, 0.7192, 0.17712],
  [3, 0.72096, 0.16227, 0.72327, 0.15013, 0.72433, 0.15013],
  [3, 0.72539, 0.15013, 0.7301, 0.15785, 0.73479, 0.1673],
  [3, 0.74927, 0.19645, 0.74997, 0.23876, 0.73681, 0.28962],
  [3, 0.72574, 0.3324, 0.72343, 0.35904, 0.72536, 0.42166],
  [3, 0.72639, 0.45489, 0.72597, 0.48519, 0.72434, 0.49473],
  [3, 0.72172, 0.51009, 0.72191, 0.51084, 0.72769, 0.50792],
  [3, 0.73864, 0.50239, 0.75145, 0.47332, 0.75632, 0.44297],
  [3, 0.7624, 0.40512, 0.76733, 0.39204, 0.77554, 0.39204],
  [3, 0.78592, 0.39204, 0.79593, 0.41695, 0.79815, 0.4483],
  [3, 0.80052, 0.48185, 0.79824, 0.50596, 0.788, 0.55555],
  [3, 0.77806, 0.60371, 0.77717, 0.64551, 0.78545, 0.67574],
  [3, 0.79085, 0.69545, 0.81208, 0.73671, 0.81457, 0.73231],
  [3, 0.81525, 0.7311, 0.81343, 0.71792, 0.81052, 0.70301],
  [3, 0.80121, 0.65533, 0.80391, 0.63315, 0.82626, 0.57381],
  [3, 0.84665, 0.51966, 0.84974, 0.5056, 0.84974, 0.467],
  [3, 0.84974, 0.44086, 0.84757, 0.42474, 0.83857, 0.38405],
  [3, 0.82313, 0.31425, 0.8236, 0.27856, 0.84034, 0.25115],
  [3, 0.85239, 0.2314, 0.86948, 0.23771, 0.87833, 0.26516],
  [3, 0.88038, 0.27153, 0.88243, 0.3026, 0.88329, 0.34026],
  [3, 0.88461, 0.39897, 0.8854, 0.40649, 0.89242, 0.42766],
  [3, 0.89928, 0.44835, 0.90933, 0.46609, 0.91419, 0.46609],
  [3, 0.91516, 0.46609, 0.9142, 0.45443, 0.91206, 0.44017],
  [3, 0.90721, 0.40796, 0.90927, 0.37855, 0.91888, 0.34267],
  [3, 0.92886, 0.3054, 0.93022, 0.26691, 0.92293, 0.22771],
  [3, 0.91178, 0.16773, 0.91248, 0.14869, 0.92644, 0.13252],
  [3, 0.9325, 0.1255, 0.93483, 0.1252, 0.94206, 0.13049],
  [3, 0.95477, 0.13979, 0.95866, 0.15787, 0.95873, 0.20789],
  [3, 0.9588, 0.25465, 0.96371, 0.28242, 0.97505, 0.30026],
  [3, 0.98278, 0.31241, 0.98438, 0.3091, 0.98097, 0.28807],
  [3, 0.97662, 0.26124, 0.97765, 0.24417, 0.9866, 0.19537],
  [3, 1, 0.12232, 0.99714, 0.05732, 1, 0],
];

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
  seed: number = 0,
  mirror: boolean = false,
  sawtoothCurve: number = 0,
  sawtoothReverse: boolean = false,
  sideCurve: number = 0,
  flipDirection: boolean = false
): void {
  // When style is none/straight but sideCurve is set, draw a bowed line
  if ((style === 'none' || style === 'straight') && sideCurve === 0) {
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

  // When sideCurve != 0, bow the baseline outward by shifting each point
  // perpendicular to the edge using sin(π·t). This adjusts sx0/sy0, sx1/sy1,
  // and all interior positions computed via bowX/bowY helpers.
  const hasBow = sideCurve !== 0;
  const bowAmt = sideCurve * edgeLen * 0.25; // scale relative to edge length
  function bowX(t: number): number { return hasBow ? outwardX * bowAmt * Math.sin(Math.PI * t) : 0; }
  function bowY(t: number): number { return hasBow ? outwardY * bowAmt * Math.sin(Math.PI * t) : 0; }

  const safeFrac0 = safeInset / edgeLen;
  const safeFrac1 = 1 - safeFrac0;
  const sx0 = x0 + ux * safeInset + bowX(safeFrac0);
  const sy0 = y0 + uy * safeInset + bowY(safeFrac0);
  const sx1 = x1 - ux * safeInset + bowX(safeFrac1);
  const sy1 = y1 - uy * safeInset + bowY(safeFrac1);
  const safeLen = edgeLen - safeInset * 2;

  // Draw safe inset straight line at start
  path.lineTo(sx0, sy0);

  // Now draw the decorated portion
  const segW = safeLen / count;

  // Bowed position at distance d along the safe region (d = 0..safeLen)
  // Adds a sinusoidal perpendicular offset so the edge baseline curves outward
  const bowBase = bowX(safeFrac0); // bow already baked into sx0 — offset relative to it
  const bowBaseY = bowY(safeFrac0);
  function bpx(d: number): number {
    if (!hasBow) return sx0 + ux * d;
    return sx0 + ux * d + bowX(safeFrac0 + d / edgeLen) - bowBase;
  }
  function bpy(d: number): number {
    if (!hasBow) return sy0 + uy * d;
    return sy0 + uy * d + bowY(safeFrac0 + d / edgeLen) - bowBaseY;
  }

  switch (style) {
    case 'none':
    case 'straight': {
      // Bowed line (only reached when sideCurve != 0)
      const segments = 20;
      for (let i = 1; i <= segments; i++) {
        const d = (i / segments) * safeLen;
        path.lineTo(bpx(d), bpy(d));
      }
      break;
    }
    case 'scalloped':
      for (let i = 0; i < count; i++) {
        const ax = bpx(i * segW);
        const ay = bpy(i * segW);
        const bx = bpx((i + 1) * segW);
        const by = bpy((i + 1) * segW);
        const cx = (ax + bx) / 2 + outwardX * depth;
        const cy = (ay + by) / 2 + outwardY * depth;
        path.quadraticBezierTo(cx, cy, bx, by);
      }
      break;

    case 'arched':
      // Inverted scallop — arches curve inward instead of outward
      for (let i = 0; i < count; i++) {
        const ax = bpx(i * segW);
        const ay = bpy(i * segW);
        const bx = bpx((i + 1) * segW);
        const by = bpy((i + 1) * segW);
        const cx = (ax + bx) / 2 - outwardX * depth;
        const cy = (ay + by) / 2 - outwardY * depth;
        path.quadraticBezierTo(cx, cy, bx, by);
      }
      break;

    case 'zigzag':
      // Pointed arches — straight sides to an outward peak per segment
      for (let i = 0; i < count; i++) {
        const ax = bpx(i * segW);
        const ay = bpy(i * segW);
        const bx = bpx((i + 1) * segW);
        const by = bpy((i + 1) * segW);
        const peakX = (ax + bx) / 2 + outwardX * depth;
        const peakY = (ay + by) / 2 + outwardY * depth;
        path.lineTo(peakX, peakY);
        path.lineTo(bx, by);
      }
      break;

    case 'wavy':
      // Mirror-symmetric wave: mirrors about center, endpoints always outward
      // Uses cape's proven formula — mirrorI=0 at both ends → always outward
      for (let i = 0; i < count; i++) {
        const ax = bpx(i * segW);
        const ay = bpy(i * segW);
        const bx = bpx((i + 1) * segW);
        const by = bpy((i + 1) * segW);
        const mi = i < count / 2 ? i : count - 1 - i;
        const dir = (mi % 2 === 0) ? 1 : -1;
        const cx = (ax + bx) / 2 + outwardX * depth * dir;
        const cy = (ay + by) / 2 + outwardY * depth * dir;
        path.quadraticBezierTo(cx, cy, bx, by);
      }
      break;

    case 'castellated': {
      // Alternating flat gaps and merlon tabs: 2*count+1 cells
      // Always starts and ends with a gap — inherently symmetric, no abutting
      const totalCells = 2 * count + 1;
      const cellLen = safeLen / totalCells;
      for (let i = 0; i < totalCells; i++) {
        const cx0 = bpx(i * cellLen);
        const cy0 = bpy(i * cellLen);
        const cx1 = bpx((i + 1) * cellLen);
        const cy1 = bpy((i + 1) * cellLen);
        const isGap = (i + (mirror ? 1 : 0)) % 2 === 0;
        if (isGap) {
          path.lineTo(cx1, cy1);
        } else {
          // Merlon: drop to depth, run along, come back up
          path.lineTo(cx0 + outwardX * depth, cy0 + outwardY * depth);
          path.lineTo(cx1 + outwardX * depth, cy1 + outwardY * depth);
          path.lineTo(cx1, cy1);
        }
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
        const baseX = bpx(t * safeLen);
        const baseY = bpy(t * safeLen);
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

    case 'flame': {
      // Fixed flame profile traced from Flames.svg — no count/seed/mirror needed.
      // depth controls the maximum flame height; shape is predetermined.
      for (const cmd of FLAME_PROFILE) {
        if (cmd[0] === 2) {
          path.lineTo(
            bpx(cmd[1] * safeLen) + outwardX * cmd[2] * depth,
            bpy(cmd[1] * safeLen) + outwardY * cmd[2] * depth
          );
        } else if (cmd[0] === 3) {
          path.cubicBezierTo(
            bpx(cmd[1] * safeLen) + outwardX * cmd[2] * depth,
            bpy(cmd[1] * safeLen) + outwardY * cmd[2] * depth,
            bpx(cmd[3] * safeLen) + outwardX * cmd[4] * depth,
            bpy(cmd[3] * safeLen) + outwardY * cmd[4] * depth,
            bpx(cmd[5] * safeLen) + outwardX * cmd[6] * depth,
            bpy(cmd[5] * safeLen) + outwardY * cmd[6] * depth
          );
        }
      }
      break;
    }

    case 'stepped': {
      // Staircase pyramid: ascend in steps then descend symmetrically per segment
      const steps = 3;
      const halfSteps = steps * 2;         // total sub-segments per segment
      const subW = segW / halfSteps;
      for (let i = 0; i < count; i++) {
        const segStart = i * segW;
        // Ascending: steps 0..steps-1
        for (let s = 0; s < steps; s++) {
          const d = depth * ((s + 1) / steps);
          const t0 = segStart + s * subW;
          const t1 = t0 + subW;
          const px0 = bpx(t0);
          const py0 = bpy(t0);
          const px1 = bpx(t1);
          const py1 = bpy(t1);
          path.lineTo(px0 + outwardX * d, py0 + outwardY * d);
          path.lineTo(px1 + outwardX * d, py1 + outwardY * d);
        }
        // Descending: mirror of ascending
        for (let s = steps - 1; s >= 0; s--) {
          const d = depth * ((s + 1) / steps);
          const t0 = segStart + (halfSteps - 1 - s) * subW;
          const t1 = t0 + subW;
          const px0 = bpx(t0);
          const py0 = bpy(t0);
          const px1 = bpx(t1);
          const py1 = bpy(t1);
          path.lineTo(px0 + outwardX * d, py0 + outwardY * d);
          path.lineTo(px1 + outwardX * d, py1 + outwardY * d);
        }
      }
      break;
    }

    case 'dovetail': {
      // Flat gaps alternating with trapezoidal dovetail tabs (matches flag)
      const totalCells = 2 * count + 1;
      const cellLen = safeLen / totalCells;
      for (let i = 0; i < totalCells; i++) {
        const cx1 = bpx((i + 1) * cellLen);
        const cy1 = bpy((i + 1) * cellLen);
        const isGap = (i + (mirror ? 1 : 0)) % 2 === 0;
        if (isGap) {
          path.lineTo(cx1, cy1);
        } else {
          const cx0 = bpx(i * cellLen);
          const cy0 = bpy(i * cellLen);
          const midX = (cx0 + cx1) / 2;
          const midY = (cy0 + cy1) / 2;
          const narrowHalf = cellLen * 0.35;
          const wideHalf = cellLen * 0.55;
          // Narrow neck at baseline (behind side — closest to where path arrived)
          path.lineTo(midX - ux * narrowHalf, midY - uy * narrowHalf);
          // Wide flare at depth (behind side)
          path.lineTo(midX - ux * wideHalf + outwardX * depth, midY - uy * wideHalf + outwardY * depth);
          // Wide flare at depth (ahead side)
          path.lineTo(midX + ux * wideHalf + outwardX * depth, midY + uy * wideHalf + outwardY * depth);
          // Narrow neck at baseline (ahead side)
          path.lineTo(midX + ux * narrowHalf, midY + uy * narrowHalf);
        }
      }
      break;
    }

    case 'notched': {
      // Flat runs with distinct V-notch cuts (comb-like)
      // 2*count+1 cells: flat gaps alternating with V-notch cuts
      const totalCells = 2 * count + 1;
      const cellLen = safeLen / totalCells;
      for (let i = 0; i < totalCells; i++) {
        const cx0 = bpx(i * cellLen);
        const cy0 = bpy(i * cellLen);
        const cx1 = bpx((i + 1) * cellLen);
        const cy1 = bpy((i + 1) * cellLen);
        if (i % 2 === 0) {
          // Flat run along baseline
          path.lineTo(cx1, cy1);
        } else {
          // V-notch: inward cut at center of cell
          const midX = (cx0 + cx1) / 2;
          const midY = (cy0 + cy1) / 2;
          path.lineTo(midX - outwardX * depth, midY - outwardY * depth);
          path.lineTo(cx1, cy1);
        }
      }
      break;
    }

    case 'feathered': {
      // Overlapping elongated leaf/feather shapes
      const scrambled = seed != null ? ((seed * 2654435761) >>> 0) : Math.round(x0 * 100 + y0 * 37);
      const rng = new SeededRNG(scrambled);
      for (let i = 0; i < count; i++) {
        const ax = bpx(i * segW);
        const ay = bpy(i * segW);
        const bx = bpx((i + 1) * segW);
        const by = bpy((i + 1) * segW);
        const h = depth * (0.6 + rng.nextRange(0, 1) * 0.4);
        // Overlap: extend slightly past segment (negate when direction is flipped)
        const overlapSign = flipDirection ? -1 : 1;
        const overlapX = ux * segW * 0.15 * overlapSign;
        const overlapY = uy * segW * 0.15 * overlapSign;
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
          const pax = bpx(t0);
          const pay = bpy(t0);
          const pbx = bpx(t1);
          const pby = bpy(t1);
          const h = depth * (0.4 + rng.nextRange(0, 1) * 0.6);
          const cx = (pax + pbx) / 2 + outwardX * h;
          const cy = (pay + pby) / 2 + outwardY * h;
          path.quadraticBezierTo(cx, cy, pbx, pby);
        }
      }
      break;
    }

    case 'sawtooth': {
      // Asymmetric teeth (steep rise, gradual fall) with optional curve & reverse
      const reverse = sawtoothReverse !== mirror !== flipDirection; // XOR chain: mirror and flipDirection both invert reverse sense
      for (let i = 0; i < count; i++) {
        const ax = bpx(i * segW);
        const ay = bpy(i * segW);
        const bx = bpx((i + 1) * segW);
        const by = bpy((i + 1) * segW);
        if (reverse) {
          // Gradual rise then steep drop
          const peakFrac = 0.75;
          const peakX = ax + ux * segW * peakFrac + outwardX * depth;
          const peakY = ay + uy * segW * peakFrac + outwardY * depth;
          if (sawtoothCurve > 0) {
            const cpX = (ax + peakX) / 2;
            const cpY = (ay + peakY) / 2 + outwardY * depth * sawtoothCurve * 0.3;
            path.quadraticBezierTo(cpX, cpY, peakX, peakY);
          } else {
            path.lineTo(peakX, peakY);
          }
          path.lineTo(bx, by);
        } else {
          // Steep rise then gradual slope
          const peakFrac = 0.25;
          const peakX = ax + ux * segW * peakFrac + outwardX * depth;
          const peakY = ay + uy * segW * peakFrac + outwardY * depth;
          path.lineTo(peakX, peakY);
          if (sawtoothCurve > 0) {
            const cpX = (peakX + bx) / 2;
            const cpY = (peakY + by) / 2 + outwardY * depth * sawtoothCurve * 0.3;
            path.quadraticBezierTo(cpX, cpY, bx, by);
          } else {
            path.lineTo(bx, by);
          }
        }
      }
      break;
    }

    case 'arrow': {
      // Arrow pattern: narrow stem with triangular arrowhead
      // Each arrow centered at cell midpoint, stem extends outward
      for (let i = 0; i < count; i++) {
        const ax = bpx(i * segW);
        const ay = bpy(i * segW);
        const bx = bpx((i + 1) * segW);
        const by = bpy((i + 1) * segW);
        const cx = bpx((i + 0.5) * segW);
        const cy = bpy((i + 0.5) * segW);
        // Along-edge direction from cell start to cell end (follows bow)
        const cdx = bx - ax;
        const cdy = by - ay;
        const clen = Math.hypot(cdx, cdy) || 1;
        const lx = (cdx / clen) * segW;
        const ly = (cdy / clen) * segW;
        const stemW = 0.10;
        const headW = 0.25;
        const stemDepthFrac = 0.5;
        // Go to left stem neck from cell start (short path)
        path.lineTo(cx - lx * stemW, cy - ly * stemW);
        // Up the left side of stem
        path.lineTo(cx - lx * stemW + outwardX * depth * stemDepthFrac, cy - ly * stemW + outwardY * depth * stemDepthFrac);
        // Arrowhead widens left
        path.lineTo(cx - lx * headW + outwardX * depth * stemDepthFrac, cy - ly * headW + outwardY * depth * stemDepthFrac);
        // Tip
        path.lineTo(cx + outwardX * depth, cy + outwardY * depth);
        // Right side of arrowhead
        path.lineTo(cx + lx * headW + outwardX * depth * stemDepthFrac, cy + ly * headW + outwardY * depth * stemDepthFrac);
        // Right side of stem
        path.lineTo(cx + lx * stemW + outwardX * depth * stemDepthFrac, cy + ly * stemW + outwardY * depth * stemDepthFrac);
        // Down to right stem neck
        path.lineTo(cx + lx * stemW, cy + ly * stemW);
        // Trace to cell end
        path.lineTo(bx, by);
      }
      break;
    }

    case 'picot': {
      // Small decorative loops at regular intervals
      for (let i = 0; i < count; i++) {
        const midT = (i + 0.5) * segW;
        const midX = bpx(midT);
        const midY = bpy(midT);
        // Line to just before the loop
        path.lineTo(bpx(midT - segW * 0.15), bpy(midT - segW * 0.15));
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
          bpx(midT + segW * 0.15),
          bpy(midT + segW * 0.15)
        );
        // Continue to next segment start
        const endX = bpx((i + 1) * segW);
        const endY = bpy((i + 1) * segW);
        path.lineTo(endX, endY);
      }
      break;
    }

    case 'thorned': {
      // Equally spaced sharp triangular thorns
      // 2*count+1 cells: flat gaps alternating with thorn spikes
      const totalThornCells = 2 * count + 1;
      const thornCellLen = safeLen / totalThornCells;
      for (let i = 0; i < totalThornCells; i++) {
        const t1 = (i + 1) * thornCellLen;
        const x1t = bpx(t1);
        const y1t = bpy(t1);
        if (i % 2 === 0) {
          // Flat gap along baseline
          path.lineTo(x1t, y1t);
        } else {
          // Sharp thorn: narrow triangular spike
          const peakStartD = (i + 0.35) * thornCellLen;
          const peakD = (i + 0.5) * thornCellLen;
          const peakEndD = (i + 0.65) * thornCellLen;
          path.lineTo(bpx(peakStartD), bpy(peakStartD));
          path.lineTo(bpx(peakD) + outwardX * depth, bpy(peakD) + outwardY * depth);
          path.lineTo(bpx(peakEndD), bpy(peakEndD));
          path.lineTo(x1t, y1t);
        }
      }
      break;
    }

    default:
      path.lineTo(sx1, sy1);
  }

  // Draw safe inset straight line at end
  path.lineTo(x1, y1);
}
