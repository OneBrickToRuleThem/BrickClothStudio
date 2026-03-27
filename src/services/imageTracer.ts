/**
 * Image Tracer — client-side raster-to-vector conversion
 * Inspired by Inkscape's "Trace Bitmap" brightness-cutoff mode.
 * Uses Canvas API for pixel access, then contour tracing + simplification.
 */

interface Point { x: number; y: number }

/** Trace parameters */
export interface TraceOptions {
  threshold: number;     // 0–255, brightness cutoff for binary conversion
  invert: boolean;       // invert before threshold
  blur: number;          // Gaussian blur radius (0 = none)
  simplify: number;      // Douglas-Peucker tolerance in pixels
  smooth: boolean;       // fit cubic bezier curves
  minArea: number;       // minimum contour area (pixels²) to keep
  targetWidth: number;   // output width in mm
  targetHeight: number;  // output height in mm
}

export const DEFAULT_TRACE_OPTIONS: TraceOptions = {
  threshold: 128,
  invert: false,
  blur: 1,
  simplify: 1.5,
  smooth: true,
  minArea: 20,
  targetWidth: 40,
  targetHeight: 40,
};

// ---------------------------------------------------------------------------
// Image loading utilities
// ---------------------------------------------------------------------------

/** Load a data URL image into a canvas and return pixel access */
function loadImageToCanvas(dataUrl: string): Promise<{ ctx: CanvasRenderingContext2D; w: number; h: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 800; // lower res = faster trace, still plenty of detail
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDim || h > maxDim) {
        const s = maxDim / Math.max(w, h);
        w = Math.round(w * s);
        h = Math.round(h * s);
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      // White background for transparent images
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve({ ctx, w, h });
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

/** Get natural image dimensions from a data URL */
export function getImageDimensions(dataUrl: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = dataUrl;
  });
}

function getGrayscale(ctx: CanvasRenderingContext2D, w: number, h: number): Uint8Array {
  const imgData = ctx.getImageData(0, 0, w, h);
  const d = imgData.data;
  const gray = new Uint8Array(w * h);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = Math.round(0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2]);
  }
  return gray;
}

function boxBlur(data: Uint8Array, w: number, h: number, r: number): Uint8Array {
  if (r <= 0) return data;
  // Two-pass separable box blur
  const tmp = new Uint8Array(data.length);
  const out = new Uint8Array(data.length);
  const size = r * 2 + 1;
  // Horizontal
  for (let y = 0; y < h; y++) {
    let sum = 0;
    for (let x = -r; x <= r; x++) sum += data[y * w + Math.max(0, Math.min(w - 1, x))];
    for (let x = 0; x < w; x++) {
      tmp[y * w + x] = Math.round(sum / size);
      sum -= data[y * w + Math.max(0, x - r)];
      sum += data[y * w + Math.min(w - 1, x + r + 1)];
    }
  }
  // Vertical
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -r; y <= r; y++) sum += tmp[Math.max(0, Math.min(h - 1, y)) * w + x];
    for (let y = 0; y < h; y++) {
      out[y * w + x] = Math.round(sum / size);
      sum -= tmp[Math.max(0, y - r) * w + x];
      sum += tmp[Math.min(h - 1, y + r + 1) * w + x];
    }
  }
  return out;
}

function binarize(data: Uint8Array, t: number, invert: boolean): Uint8Array {
  const bin = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    // 1 = foreground (will be traced), 0 = background
    const dark = data[i] < t;
    bin[i] = (invert ? !dark : dark) ? 1 : 0;
  }
  return bin;
}

// ---------------------------------------------------------------------------
// Threshold preview — returns a data URL of the B/W image
// ---------------------------------------------------------------------------

/** Generate a black-and-white preview data URL showing the binary threshold result */
export async function generateThresholdPreview(
  dataUrl: string, threshold: number, invert: boolean, blur: number
): Promise<string> {
  const { ctx, w, h } = await loadImageToCanvas(dataUrl);
  let gray = getGrayscale(ctx, w, h);
  if (blur > 0) gray = boxBlur(gray, w, h, Math.round(blur));
  const bin = binarize(gray, threshold, invert);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const outCtx = canvas.getContext('2d')!;
  const imgData = outCtx.createImageData(w, h);
  for (let i = 0; i < bin.length; i++) {
    const v = bin[i] ? 0 : 255; // foreground = black, background = white
    imgData.data[i * 4] = v;
    imgData.data[i * 4 + 1] = v;
    imgData.data[i * 4 + 2] = v;
    imgData.data[i * 4 + 3] = 255;
  }
  outCtx.putImageData(imgData, 0, 0);
  return canvas.toDataURL('image/png');
}

// ---------------------------------------------------------------------------
// Contour tracing using Moore neighborhood (more robust than marching squares)
// Traces the boundary of connected foreground regions.
// ---------------------------------------------------------------------------

function traceContours(bin: Uint8Array, w: number, h: number): Point[][] {
  const contours: Point[][] = [];
  // Track which foreground pixels have been used as contour starts
  const visited = new Uint8Array(w * h);

  // Moore neighborhood: 8 directions clockwise from up
  const dx8 = [0, 1, 1, 1, 0, -1, -1, -1];
  const dy8 = [-1, -1, 0, 1, 1, 1, 0, -1];

  function fg(x: number, y: number): boolean {
    if (x < 0 || x >= w || y < 0 || y >= h) return false;
    return bin[y * w + x] === 1;
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      // Look for foreground pixel with background to the left (or at left edge)
      if (!fg(x, y)) continue;
      if (fg(x - 1, y)) continue; // not an outer boundary start
      if (visited[y * w + x]) continue;

      // Trace contour using Moore-neighbor tracing
      const contour: Point[] = [];
      const startX = x, startY = y;
      let cx = x, cy = y;
      let dir = 6; // start by looking left (from whence we "entered")
      let steps = 0;
      const maxSteps = w * h; // safety limit

      do {
        contour.push({ x: cx, y: cy });
        visited[cy * w + cx] = 1;

        // Search Moore neighborhood clockwise from (dir+5)%8
        let found = false;
        const startDir = (dir + 5) % 8; // backtrack and go clockwise
        for (let i = 0; i < 8; i++) {
          const d = (startDir + i) % 8;
          const nx = cx + dx8[d];
          const ny = cy + dy8[d];
          if (fg(nx, ny)) {
            dir = d;
            cx = nx;
            cy = ny;
            found = true;
            break;
          }
        }

        if (!found) break;
        if (++steps > maxSteps) break;
      } while (cx !== startX || cy !== startY);

      if (contour.length >= 8) {
        contours.push(contour);
      }
    }
  }

  return contours;
}

// ---------------------------------------------------------------------------
// Path simplification — Douglas-Peucker
// ---------------------------------------------------------------------------

function perpDist(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x, dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

function douglasPeucker(points: Point[], tolerance: number): Point[] {
  if (points.length <= 2) return points;
  let maxDist = 0, maxIdx = 0;
  const first = points[0], last = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const d = perpDist(points[i], first, last);
    if (d > maxDist) { maxDist = d; maxIdx = i; }
  }
  if (maxDist > tolerance) {
    const left = douglasPeucker(points.slice(0, maxIdx + 1), tolerance);
    const right = douglasPeucker(points.slice(maxIdx), tolerance);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

// ---------------------------------------------------------------------------
// SVG path generation
// ---------------------------------------------------------------------------

function smoothContour(pts: Point[]): string {
  if (pts.length < 3) {
    return pts.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ') + ' Z';
  }

  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;

  for (let i = 0; i < pts.length; i++) {
    const prev = pts[(i - 1 + pts.length) % pts.length];
    const curr = pts[i];
    const next = pts[(i + 1) % pts.length];
    const next2 = pts[(i + 2) % pts.length];

    const tension = 6;
    const cp1x = curr.x + (next.x - prev.x) / tension;
    const cp1y = curr.y + (next.y - prev.y) / tension;
    const cp2x = next.x - (next2.x - curr.x) / tension;
    const cp2y = next.y - (next2.y - curr.y) / tension;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
  }

  return d + ' Z';
}

function polyContour(pts: Point[]): string {
  if (pts.length === 0) return '';
  let d = `M ${pts[0].x.toFixed(2)} ${pts[0].y.toFixed(2)}`;
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${pts[i].x.toFixed(2)} ${pts[i].y.toFixed(2)}`;
  }
  return d + ' Z';
}

function contourArea(pts: Point[]): number {
  let area = 0;
  for (let i = 0; i < pts.length; i++) {
    const j = (i + 1) % pts.length;
    area += pts[i].x * pts[j].y - pts[j].x * pts[i].y;
  }
  return Math.abs(area) / 2;
}

// ---------------------------------------------------------------------------
// Main trace function
// ---------------------------------------------------------------------------

export interface TraceResult {
  svgPath: string;
  contourPaths: string[];
  contourCount: number;
  sourceWidth: number;
  sourceHeight: number;
  /** Bounding box of the traced result in mm */
  bounds: { minX: number; minY: number; maxX: number; maxY: number; width: number; height: number };
}

/** Detected circular hole in the traced image */
export interface DetectedHole {
  cx: number; // center X in mm
  cy: number; // center Y in mm
  radius: number; // estimated radius in mm
  circularity: number; // 0–1, how circular (1 = perfect circle)
}

/**
 * Trace a raster image (data URL) into SVG path data.
 * Output coordinates are in mm, normalized to the positive quadrant (min at 0,0).
 */
export async function traceImage(dataUrl: string, opts: Partial<TraceOptions> = {}): Promise<TraceResult> {
  const o = { ...DEFAULT_TRACE_OPTIONS, ...opts };

  const { ctx, w, h } = await loadImageToCanvas(dataUrl);

  let gray = getGrayscale(ctx, w, h);
  if (o.blur > 0) gray = boxBlur(gray, w, h, Math.round(o.blur));
  const bin = binarize(gray, o.threshold, o.invert);

  const rawContours = traceContours(bin, w, h);

  // Scale: fit image into target dimensions preserving aspect ratio
  const uniformScale = Math.min(o.targetWidth / w, o.targetHeight / h);
  const offsetX = (o.targetWidth - w * uniformScale) / 2;
  const offsetY = (o.targetHeight - h * uniformScale) / 2;

  // First pass: scale all contours to mm, collect all points
  const scaledContours: Point[][] = [];

  for (const raw of rawContours) {
    if (contourArea(raw) < o.minArea) continue;

    let pts = o.simplify > 0 ? douglasPeucker(raw, o.simplify) : raw;
    if (pts.length < 3) continue;

    const scaled = pts.map(p => ({
      x: p.x * uniformScale + offsetX,
      y: p.y * uniformScale + offsetY,
    }));
    scaledContours.push(scaled);
  }

  // Find global bounding box
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const contour of scaledContours) {
    for (const p of contour) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }

  if (scaledContours.length === 0) {
    minX = minY = 0; maxX = o.targetWidth; maxY = o.targetHeight;
  }

  // Normalize: shift so min is at (0, 0)
  const shiftX = -minX;
  const shiftY = -minY;

  const contourPaths: string[] = [];
  for (const contour of scaledContours) {
    const shifted = contour.map(p => ({ x: p.x + shiftX, y: p.y + shiftY }));
    contourPaths.push(o.smooth ? smoothContour(shifted) : polyContour(shifted));
  }

  const boundsWidth = maxX - minX;
  const boundsHeight = maxY - minY;

  return {
    svgPath: contourPaths.join(' '),
    contourPaths,
    contourCount: contourPaths.length,
    sourceWidth: w,
    sourceHeight: h,
    bounds: {
      minX: 0, minY: 0,
      maxX: boundsWidth, maxY: boundsHeight,
      width: boundsWidth, height: boundsHeight,
    },
  };
}

// ---------------------------------------------------------------------------
// Symmetry — mirror contour paths across the vertical center
// ---------------------------------------------------------------------------

/**
 * Mirror an array of SVG contour path strings across the vertical centerline.
 * @param direction 'ltr' = left half becomes master, mirrored to right.
 *                  'rtl' = right half becomes master, mirrored to left.
 * @returns new array of mirrored path strings.
 */
export function mirrorContours(contourPaths: string[], width: number, direction: 'ltr' | 'rtl'): string[] {
  const midX = width / 2;
  return contourPaths.map(pathStr => mirrorPath(pathStr, midX, direction));
}

function mirrorPath(pathStr: string, midX: number, direction: 'ltr' | 'rtl'): string {
  // Fast approach: split on command letters, process x coordinates in each segment.
  // Our paths only use M, L, C, Z — all with absolute coordinates.
  const result: string[] = [];
  let pos = 0;
  const len = pathStr.length;

  while (pos < len) {
    const ch = pathStr[pos];
    if (ch === 'Z' || ch === 'z') {
      result.push(ch);
      pos++;
      // skip whitespace
      while (pos < len && (pathStr[pos] === ' ' || pathStr[pos] === ',')) pos++;
      continue;
    }

    let cmd = '';
    if (/[a-zA-Z]/.test(ch)) {
      cmd = ch;
      pos++;
    }

    // Read coordinate pairs: x y [, x y ...]
    // For M, L: 1 pair; for C: 3 pairs; for S, Q: 2 pairs
    const pairsPerCmd = cmd.toUpperCase() === 'C' ? 3
      : (cmd.toUpperCase() === 'S' || cmd.toUpperCase() === 'Q') ? 2
      : 1; // M, L, T

    if (cmd) result.push(cmd, ' ');

    // Process all coordinate pairs that follow (handles implicit repetition)
    let pairCount = 0;
    while (pos < len) {
      // skip whitespace/commas
      while (pos < len && (pathStr[pos] === ' ' || pathStr[pos] === ',' || pathStr[pos] === '\n')) pos++;
      if (pos >= len || /[a-zA-Z]/.test(pathStr[pos])) break;

      // read x
      const xStart = pos;
      if (pathStr[pos] === '-' || pathStr[pos] === '+') pos++;
      while (pos < len && (pathStr[pos] >= '0' && pathStr[pos] <= '9' || pathStr[pos] === '.')) pos++;
      const xStr = pathStr.slice(xStart, pos);
      let x = parseFloat(xStr);

      // reflect x
      x = reflectX(x, midX, direction);

      // skip separator
      while (pos < len && (pathStr[pos] === ' ' || pathStr[pos] === ',')) pos++;

      // read y
      const yStart = pos;
      if (pathStr[pos] === '-' || pathStr[pos] === '+') pos++;
      while (pos < len && (pathStr[pos] >= '0' && pathStr[pos] <= '9' || pathStr[pos] === '.')) pos++;
      const yStr = pathStr.slice(yStart, pos);

      if (pairCount > 0) result.push(pairCount % pairsPerCmd === 0 ? ' ' : ', ');
      result.push(x.toFixed(2), ' ', yStr);
      pairCount++;
    }
  }

  return result.join('');
}

function reflectX(x: number, midX: number, direction: 'ltr' | 'rtl'): number {
  if (direction === 'ltr') {
    // Left half is master: mirror right-side points to match left
    return x > midX ? 2 * midX - x : x;
  } else {
    // Right half is master: mirror left-side points to match right
    return x < midX ? 2 * midX - x : x;
  }
}

// ---------------------------------------------------------------------------
// Hole detection — find small circular contours that look like attachment holes
// ---------------------------------------------------------------------------

/**
 * Detect circular holes in a traced image.
 * Analyzes the binary threshold image for small, roughly circular foreground regions
 * that could be minifigure attachment holes.
 */
export async function detectHoles(
  dataUrl: string,
  threshold: number,
  invert: boolean,
  blur: number,
  targetWidth: number,
  targetHeight: number,
): Promise<DetectedHole[]> {
  const { ctx, w, h } = await loadImageToCanvas(dataUrl);

  let gray = getGrayscale(ctx, w, h);
  if (blur > 0) gray = boxBlur(gray, w, h, Math.round(blur));

  // For hole detection, we look for background (light) circles inside foreground.
  // So we invert the binary: holes are light regions surrounded by dark.
  const bin = binarize(gray, threshold, invert);

  // Find *background* contours (invert the binary to trace holes)
  const invBin = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) invBin[i] = 1 - bin[i];
  const holeContours = traceContours(invBin, w, h);

  const uniformScale = Math.min(targetWidth / w, targetHeight / h);
  const offsetX = (targetWidth - w * uniformScale) / 2;
  const offsetY = (targetHeight - h * uniformScale) / 2;

  // Same normalization shift as traceImage would produce
  // We need to compute the foreground bounds to match the shift
  const fgContours = traceContours(bin, w, h);
  let fgMinX = Infinity, fgMinY = Infinity;
  for (const c of fgContours) {
    if (contourArea(c) < 20) continue;
    for (const p of c) {
      const mx = p.x * uniformScale + offsetX;
      const my = p.y * uniformScale + offsetY;
      if (mx < fgMinX) fgMinX = mx;
      if (my < fgMinY) fgMinY = my;
    }
  }
  if (!isFinite(fgMinX)) { fgMinX = 0; fgMinY = 0; }
  const shiftX = -fgMinX;
  const shiftY = -fgMinY;

  const holes: DetectedHole[] = [];

  for (const contour of holeContours) {
    const area = contourArea(contour);
    if (area < 5) continue; // too small (noise)

    // Scale to mm
    const mmPts = contour.map(p => ({
      x: p.x * uniformScale + offsetX + shiftX,
      y: p.y * uniformScale + offsetY + shiftY,
    }));

    const areaInMM = contourArea(mmPts);

    // Filter by reasonable hole sizes: radius 0.5mm to 5mm → area π*0.25 to π*25
    if (areaInMM < 0.5 || areaInMM > 80) continue;

    // Compute centroid
    let cx = 0, cy = 0;
    for (const p of mmPts) { cx += p.x; cy += p.y; }
    cx /= mmPts.length;
    cy /= mmPts.length;

    // Compute average distance from centroid (effective radius)
    let avgR = 0;
    let maxR = 0;
    let minR = Infinity;
    for (const p of mmPts) {
      const d = Math.hypot(p.x - cx, p.y - cy);
      avgR += d;
      if (d > maxR) maxR = d;
      if (d < minR) minR = d;
    }
    avgR /= mmPts.length;

    // Circularity: ratio of min radius to max radius (1 = perfect circle)
    const circularity = maxR > 0 ? minR / maxR : 0;

    // Only accept reasonably circular contours
    if (circularity < 0.5) continue;
    // Radius sanity: 0.5mm to 5mm
    if (avgR < 0.5 || avgR > 5) continue;

    holes.push({
      cx: Math.round(cx * 100) / 100,
      cy: Math.round(cy * 100) / 100,
      radius: Math.round(avgR * 100) / 100,
      circularity: Math.round(circularity * 100) / 100,
    });
  }

  // Sort by circularity descending (most circular first)
  holes.sort((a, b) => b.circularity - a.circularity);

  return holes;
}
