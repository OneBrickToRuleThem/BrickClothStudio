/**
 * Self-intersection detection for SVG cut paths.
 *
 * Parses SVG path data into line segments (sampling curves), then checks
 * whether any non-adjacent segments cross. Used to warn users before
 * exporting patterns that would cause cutting issues.
 */

interface Point { x: number; y: number }
interface Segment { p0: Point; p1: Point }

const CURVE_SAMPLES = 8;

function cubicAt(
  t: number, x0: number, y0: number,
  cx1: number, cy1: number, cx2: number, cy2: number,
  x3: number, y3: number
): Point {
  const u = 1 - t;
  return {
    x: u * u * u * x0 + 3 * u * u * t * cx1 + 3 * u * t * t * cx2 + t * t * t * x3,
    y: u * u * u * y0 + 3 * u * u * t * cy1 + 3 * u * t * t * cy2 + t * t * t * y3,
  };
}

function quadAt(
  t: number, x0: number, y0: number,
  cx: number, cy: number, x2: number, y2: number
): Point {
  const u = 1 - t;
  return {
    x: u * u * x0 + 2 * u * t * cx + t * t * x2,
    y: u * u * y0 + 2 * u * t * cy + t * t * y2,
  };
}

function pathToSegments(pathData: string): Segment[] {
  const segments: Segment[] = [];
  const tokens = pathData.match(/[MLCQAZHVSTZ]|-?\d+\.?\d*/gi) || [];
  let i = 0;
  let cmd = '';
  let curX = 0, curY = 0;

  while (i < tokens.length) {
    const token = tokens[i];
    if (/^[A-Za-z]$/.test(token)) {
      cmd = token.toUpperCase();
      i++;
      if (cmd === 'Z') continue;
    } else {
      switch (cmd) {
        case 'M': {
          curX = parseFloat(tokens[i]);
          curY = parseFloat(tokens[i + 1]);
          i += 2;
          break;
        }
        case 'L': {
          const ex = parseFloat(tokens[i]);
          const ey = parseFloat(tokens[i + 1]);
          if (!isNaN(ex) && !isNaN(ey)) {
            segments.push({ p0: { x: curX, y: curY }, p1: { x: ex, y: ey } });
            curX = ex; curY = ey;
          }
          i += 2;
          break;
        }
        case 'C': {
          const cx1 = parseFloat(tokens[i]);
          const cy1 = parseFloat(tokens[i + 1]);
          const cx2 = parseFloat(tokens[i + 2]);
          const cy2 = parseFloat(tokens[i + 3]);
          const ex = parseFloat(tokens[i + 4]);
          const ey = parseFloat(tokens[i + 5]);
          let prev = { x: curX, y: curY };
          for (let s = 1; s <= CURVE_SAMPLES; s++) {
            const pt = cubicAt(s / CURVE_SAMPLES, curX, curY, cx1, cy1, cx2, cy2, ex, ey);
            segments.push({ p0: prev, p1: pt });
            prev = pt;
          }
          curX = ex; curY = ey;
          i += 6;
          break;
        }
        case 'Q': {
          const cx = parseFloat(tokens[i]);
          const cy = parseFloat(tokens[i + 1]);
          const ex = parseFloat(tokens[i + 2]);
          const ey = parseFloat(tokens[i + 3]);
          let prev = { x: curX, y: curY };
          for (let s = 1; s <= CURVE_SAMPLES; s++) {
            const pt = quadAt(s / CURVE_SAMPLES, curX, curY, cx, cy, ex, ey);
            segments.push({ p0: prev, p1: pt });
            prev = pt;
          }
          curX = ex; curY = ey;
          i += 4;
          break;
        }
        case 'A': {
          const ex = parseFloat(tokens[i + 5]);
          const ey = parseFloat(tokens[i + 6]);
          if (!isNaN(ex) && !isNaN(ey)) {
            segments.push({ p0: { x: curX, y: curY }, p1: { x: ex, y: ey } });
            curX = ex; curY = ey;
          }
          i += 7;
          break;
        }
        case 'H': {
          const ex = parseFloat(tokens[i]);
          if (!isNaN(ex)) {
            segments.push({ p0: { x: curX, y: curY }, p1: { x: ex, y: curY } });
            curX = ex;
          }
          i += 1;
          break;
        }
        case 'V': {
          const ey = parseFloat(tokens[i]);
          if (!isNaN(ey)) {
            segments.push({ p0: { x: curX, y: curY }, p1: { x: curX, y: ey } });
            curY = ey;
          }
          i += 1;
          break;
        }
        default:
          i++;
          break;
      }
    }
  }
  return segments;
}

function cross(p0: Point, p1: Point, p2: Point): number {
  return (p1.x - p0.x) * (p2.y - p0.y) - (p1.y - p0.y) * (p2.x - p0.x);
}

function segmentsIntersect(a: Segment, b: Segment): boolean {
  const d1 = cross(a.p0, a.p1, b.p0);
  const d2 = cross(a.p0, a.p1, b.p1);
  const d3 = cross(b.p0, b.p1, a.p0);
  const d4 = cross(b.p0, b.p1, a.p1);
  return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
         ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

function dist(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

/**
 * Check cut paths for self-intersecting segments.
 * Returns true if any intersections are found.
 */
export function hasIntersections(cutPaths: string[]): boolean {
  const MIN_SEG_LEN = 0.01;
  const ENDPOINT_TOL = 0.05;

  for (const pathData of cutPaths) {
    const segs = pathToSegments(pathData);
    const valid = segs.filter(s => dist(s.p0, s.p1) >= MIN_SEG_LEN);

    for (let i = 0; i < valid.length; i++) {
      for (let j = i + 2; j < valid.length; j++) {
        const a = valid[i];
        const b = valid[j];
        if (dist(a.p0, b.p0) < ENDPOINT_TOL ||
            dist(a.p0, b.p1) < ENDPOINT_TOL ||
            dist(a.p1, b.p0) < ENDPOINT_TOL ||
            dist(a.p1, b.p1) < ENDPOINT_TOL) {
          continue;
        }
        if (segmentsIntersect(a, b)) return true;
      }
    }
  }
  return false;
}

/**
 * Detailed intersection check — returns count and descriptions of the first few.
 * Used by tests for diagnostic output.
 */
export function findIntersections(cutPaths: string[]): { count: number; details: string[] } {
  const details: string[] = [];
  let count = 0;
  const MIN_SEG_LEN = 0.01;
  const ENDPOINT_TOL = 0.05;

  for (const pathData of cutPaths) {
    const segs = pathToSegments(pathData);
    const valid = segs.filter(s => dist(s.p0, s.p1) >= MIN_SEG_LEN);

    for (let i = 0; i < valid.length; i++) {
      for (let j = i + 2; j < valid.length; j++) {
        const a = valid[i];
        const b = valid[j];
        if (dist(a.p0, b.p0) < ENDPOINT_TOL ||
            dist(a.p0, b.p1) < ENDPOINT_TOL ||
            dist(a.p1, b.p0) < ENDPOINT_TOL ||
            dist(a.p1, b.p1) < ENDPOINT_TOL) {
          continue;
        }
        if (segmentsIntersect(a, b)) {
          count++;
          if (details.length < 5) {
            details.push(
              `seg[${i}] (${a.p0.x.toFixed(2)},${a.p0.y.toFixed(2)})→(${a.p1.x.toFixed(2)},${a.p1.y.toFixed(2)}) ` +
              `× seg[${j}] (${b.p0.x.toFixed(2)},${b.p0.y.toFixed(2)})→(${b.p1.x.toFixed(2)},${b.p1.y.toFixed(2)})`
            );
          }
        }
      }
    }
  }
  return { count, details };
}
