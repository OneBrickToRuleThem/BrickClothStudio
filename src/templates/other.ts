/**
 * Additional template generators
 * Flags, wings, kama, mantle
 */

import { Template, TemplateParams, generateAttachmentHole } from './base';
import { SVGPath, stadiumPath, circlePath } from '../geometry/primitives';
import { drawStyledEdge } from '../geometry/edgeStyles';
import { SAIL_HOLE_STANDARDS, SailHoleType } from '../utils/constants';
import { SeededRNG } from '../utils/rng';

/**
 * Banner-shaped flag base class.
 * Small and large flags have distinct outlines:
 *   - Small: single flame tongue, narrower body
 *   - Large: three flame tongues, wider body
 * Each variant stores its own body path data and reference bounds.
 * Coordinates are normalised to fractions of (w, h) so the shape scales.
 * Two pill-shaped clip holes near top for LEGO bar attachment.
 */

// Path command: 6 numbers = cubic bezier, 2 numbers = lineTo
type BodyCmd = number[];

interface FlagShapeData {
  refLeft: number;
  refRight: number;
  refTop: number;
  refBot: number;
  start: [number, number];
  body: BodyCmd[];
  // Hole centres in AI coordinates
  hole1X: number; // left hole centre X
  hole2X: number; // right hole centre X
  holeY: number;  // both holes centre Y
}

// ── SmallFlag body ──
// 24 cubics + 1 lineTo, single flame tongue on right side
const SMALL_FLAG: FlagShapeData = {
  refLeft: -20.079,
  refRight: 41.639,
  refTop: 18.567,
  refBot: -151.764,
  start: [-11.296535, 18.567],
  body: [
    [-13.200535, 18.567, -14.918207, 17.444766, -15.685207, 15.701766],
    [-17.382207, 11.850766, -19.922411, 3.994472, -19.968411, -8.598528],
    [-20.078411, -38.212528, -9.984555, -42.926634, -9.566555, -56.406634],
    [-9.153555, -69.699634, -19.749586, -76.249768, -18.648586, -97.442768],
    [-17.556586, -118.464770, -7.759281, -119.830700, -3.786281, -128.570700],
    [-1.242281, -134.167700, -0.233957, -139.253160, -0.028957, -148.614160],
    [0.015043, -150.619160, 2.297473, -151.764120, 3.911473, -150.574120],
    [7.518473, -147.917120, 10.338164, -143.622370, 11.820164, -138.313370],
    [15.534164, -125.002370, 4.554691, -112.056560, 2.985691, -98.680561],
    [1.754691, -88.183561, 8.846551, -83.405764, 11.241551, -72.588764],
    [11.974551, -69.275764, 12.621340, -65.344880, 12.750340, -62.208880],
    [12.761050, -61.949932, 12.882904, -61.749306, 13.056493, -61.621478],
    [13.056493, -61.615578], // lineTo
    [13.257718, -61.651228, 13.447520, -61.765744, 13.575048, -61.975930],
    [16.002048, -65.983930, 16.329900, -70.776907, 16.372900, -73.726907],
    [16.454900, -79.423907, 12.262978, -88.419126, 12.077978, -97.176126],
    [11.830978, -108.901120, 19.354267, -117.024560, 22.399267, -123.928560],
    [25.802267, -131.641560, 26.781693, -140.185980, 26.985693, -149.306980],
    [27.014693, -150.577980, 28.413900, -151.312780, 29.497900, -150.648780],
    [33.674900, -148.089780, 38.703646, -142.258890, 39.987646, -132.185890],
    [41.638646, -119.222890, 34.702900, -111.956580, 34.372900, -99.323587],
    [34.104900, -89.086587, 39.631174, -84.618043, 40.153174, -67.617043],
    [40.731174, -48.791043, 31.069966, -30.707952, 32.390966, -15.349952],
    [33.316966, -4.588952, 36.674056, 4.102920, 39.283056, 10.842920],
    [40.695056, 14.490920, 37.999256, 18.420556, 34.087256, 18.420556],
  ],
  hole1X: -2.588,   // centre of left hole
  hole2X: 21.439,   // centre of right hole
  holeY: 4.819,     // centre Y of both holes
};

// ── LargeFlag body ──
// 29 cubics, three flame tongues
const LARGE_FLAG: FlagShapeData = {
  refLeft: -92.002,
  refRight: 22.614,
  refTop: 20.672,
  refBot: -160.882,
  start: [-81.478968, 20.672093],
  body: [
    [-87.665968, 20.672093, -92.001629, 14.610546, -90.055629, 8.736546],
    [-87.721629, 1.693546, -85.340262, -7.498416, -85.154262, -16.098416],
    [-84.823262, -31.290416, -91.043344, -38.171858, -90.713344, -54.850858],
    [-90.457344, -67.766858, -81.862121, -79.063590, -81.410121, -94.924590],
    [-80.908121, -112.587590, -87.935348, -119.875180, -88.567348, -131.254180],
    [-89.152348, -141.776180, -87.019914, -149.303630, -80.397914, -153.985630],
    [-79.143914, -154.872630, -77.388507, -154.151290, -77.081507, -152.645290],
    [-76.261507, -148.614290, -74.736753, -143.839000, -72.383753, -138.741000],
    [-69.410753, -132.301000, -63.590890, -125.546790, -60.273890, -116.832790],
    [-57.437890, -109.382790, -55.822319, -102.323720, -54.839319, -96.106718],
    [-54.529319, -94.145718, -51.891327, -93.647156, -50.922327, -95.380156],
    [-48.628327, -99.484156, -47.506718, -103.891390, -47.447718, -109.016390],
    [-47.282718, -123.328390, -53.777175, -140.392610, -51.741175, -148.319610],
    [-49.719175, -156.186610, -44.797799, -159.538790, -40.631799, -160.603790],
    [-39.545799, -160.881790, -38.503963, -160.015180, -38.624963, -158.900180],
    [-39.562963, -150.267180, -38.727752, -141.920950, -36.383752, -136.263950],
    [-33.385752, -129.028950, -24.741545, -122.309210, -22.621545, -110.336210],
    [-21.663545, -104.919210, -21.722475, -98.673441, -22.249475, -93.972441],
    [-22.432475, -92.337441, -20.434166, -91.401445, -19.283166, -92.576445],
    [-15.747166, -96.183445, -13.841314, -102.614250, -13.485314, -109.126250],
    [-12.714314, -123.218250, -15.823346, -128.309540, -16.567346, -138.301540],
    [-17.208346, -146.902540, -10.660302, -155.198260, -4.923303, -159.209260],
    [-3.584303, -160.145260, -1.761427, -159.091700, -1.876427, -157.461700],
    [-2.283427, -151.728700, -2.516381, -143.232690, 0.496620, -135.878690],
    [3.891619, -127.590690, 17.507421, -118.036450, 18.442421, -103.180450],
    [19.433421, -87.437449, 9.123686, -80.058061, 10.514686, -64.759061],
    [11.725686, -51.438061, 22.614233, -39.655756, 22.075233, -13.896756],
    [21.694233, 4.302245, 18.674511, 13.429929, 15.584511, 18.553929],
    [14.795511, 19.861929, 13.393272, 20.672093, 11.865272, 20.672093],
  ],
  hole1X: -71.117,  // centre of left hole
  hole2X: 2.588,    // centre of right hole
  holeY: 4.819,     // centre Y of both holes
};

// Hole dimensions — fixed size in mm (real LEGO bar clip holes don't scale)
// AI units: radius 4.819pt, flat half-width 2.589pt. 1pt = 0.3528mm.
const HOLE_RADIUS_MM = 4.819 * 0.3528; // ≈ 1.70mm
const HOLE_HALF_FLAT_MM = 2.589 * 0.3528; // ≈ 0.91mm

class BannerFlag extends Template {
  protected shape: FlagShapeData = LARGE_FLAG; // overridden by subclasses

  generateCutPath(params: TemplateParams): string {
    const bottomStyle = (params.flagBottomStyle as string) || 'none';
    const leftStyle = (params.flagLeftStyle as string) || 'none';
    const rightStyle = (params.flagRightStyle as string) || 'none';
    
    // If any edge style is set, use a rectangular body with styled edges
    if (bottomStyle !== 'none' || leftStyle !== 'none' || rightStyle !== 'none') {
      return this.generateStyledFlagPath(params);
    }
    
    // Default: use the reference SVG flame-tongue paths
    const { shape } = this;
    const refW = shape.refRight - shape.refLeft;
    const refH = shape.refTop - shape.refBot;
    const w = params.width;
    const h = params.length;
    const px = (aiX: number) => ((aiX - shape.refLeft) / refW) * w;
    const py = (aiY: number) => ((shape.refTop - aiY) / refH) * h;

    const path = new SVGPath();
    path.moveTo(px(shape.start[0]), py(shape.start[1]));

    for (const cmd of shape.body) {
      if (cmd.length === 6) {
        path.cubicBezierTo(px(cmd[0]), py(cmd[1]), px(cmd[2]), py(cmd[3]), px(cmd[4]), py(cmd[5]));
      } else {
        path.lineTo(px(cmd[0]), py(cmd[1]));
      }
    }

    path.closePath();
    return path.toString();
  }

  /**
   * Generate a rectangular flag body with styled left/right/bottom edges.
   */
  protected generateStyledFlagPath(params: TemplateParams): string {
    const w = params.width;
    const h = params.length;
    const bottomStyle = (params.flagBottomStyle as string) || 'none';
    const leftStyle = (params.flagLeftStyle as string) || 'none';
    const rightStyle = (params.flagRightStyle as string) || 'none';
    const depth = (params.flagBottomDepth as number) || 0.25;
    const count = (params.flagBottomCount as number) || 5;
    const sideDepth = (params.flagSideDepth as number) || 3;
    const sideCount = (params.flagSideCount as number) || 5;
    const path = new SVGPath();
    const margin = 1;
    const r = 1.5;

    // Calculate how much the bottom style extends below the body baseline
    // so we can inset the body to keep decorations within the bounding box
    const bottomExt = this.getBottomExtension(bottomStyle, depth, count, h, margin);
    const bodyBottom = h - margin - bottomExt;

    // Bottom corners are straight when a bottom edge style is active or 'straight',
    // rounded only when 'none' (issue #1 + #4.2)
    const hasBottomEdge = bottomStyle !== 'none';
    const br = hasBottomEdge ? 0 : r; // bottom corner radius

    // Start top-left, go clockwise
    path.moveTo(margin + r, margin);
    path.lineTo(w - margin - r, margin);
    path.arcTo(r, r, 0, 0, 1, w - margin, margin + r);

    // Right edge (top to bottom)
    this.drawStyledSideEdge(path, w - margin, margin + r, w - margin, bodyBottom - br, rightStyle, sideDepth, sideCount, 1);

    // Bottom-right corner: rounded only when no bottom edge style
    if (hasBottomEdge) {
      path.lineTo(w - margin, bodyBottom);
    } else {
      path.arcTo(r, r, 0, 0, 1, w - margin - r, bodyBottom);
    }

    // Bottom edge — decorations extend from bodyBottom down to h-margin (within bounds)
    this.drawStyledBottomEdge(path, w, h, margin, bottomStyle, depth, count, bottomExt, br, params as Record<string, unknown>);

    // Bottom-left corner: rounded only when no bottom edge style
    if (hasBottomEdge) {
      path.lineTo(margin, bodyBottom);
    } else {
      path.arcTo(r, r, 0, 0, 1, margin, bodyBottom - r);
    }

    // Left edge (bottom to top)
    this.drawStyledSideEdge(path, margin, bodyBottom - br, margin, margin + r, leftStyle, sideDepth, sideCount, -1);
    path.arcTo(r, r, 0, 0, 1, margin + r, margin);
    path.closePath();
    return path.toString();
  }

  /** Calculate how far a bottom edge style extends below the body baseline */
  private getBottomExtension(style: string, depthParam: number, count: number, h: number, _margin: number): number {
    switch (style) {
      case 'pointed': return h * depthParam;
      case 'flames': return h * Math.min(depthParam || 0.15, 0.4);
      case 'scalloped': return depthParam || 3;
      case 'zigzag': return depthParam || 3;
      case 'wavy': return depthParam || 3;
      case 'castellated': return depthParam || 3;
      case 'torn': return depthParam || 3;
      case 'stepped': return depthParam || 3;
      case 'dovetail': return depthParam || 3;
      case 'feathered': return depthParam || 3;
      case 'cloud': return depthParam || 3;
      case 'sawtooth': return depthParam || 3;
      case 'arrow': return depthParam || 3;
      case 'picot': return depthParam || 3;
      default: return 0; // 'none', 'straight', 'swallowtail' stay within bounds
    }
  }

  /**
   * Draw a styled vertical side edge (left or right).
   * direction: 1 = top-to-bottom, -1 = bottom-to-top
   */
  private drawStyledSideEdge(
    path: SVGPath, x: number, y1: number, _x2: number, y2: number,
    style: string, depthMm: number, count: number, direction: number
  ): void {
    const len = Math.abs(y2 - y1);
    if (style === 'none' || style === 'straight') {
      path.lineTo(x, y2);
      return;
    }
    const segCount = count || 5;
    const segH = len / segCount;
    const sign = direction; // positive = going down
    const outward = (direction === 1) ? 1 : -1; // right edge bumps right, left edge bumps left

    switch (style) {
      case 'scalloped': {
        for (let i = 0; i < segCount; i++) {
          const sy = y1 + sign * (i + 1) * segH;
          const cy = y1 + sign * (i + 0.5) * segH;
          path.quadraticBezierTo(x + depthMm * outward, cy, x, sy);
        }
        break;
      }
      case 'zigzag': {
        for (let i = 0; i < segCount; i++) {
          const midY = y1 + sign * (i + 0.5) * segH;
          const endY = y1 + sign * (i + 1) * segH;
          const bump = (i % 2 === 0) ? depthMm : -depthMm;
          path.lineTo(x + bump * outward, midY);
          path.lineTo(x, endY);
        }
        break;
      }
      case 'wavy': {
        for (let i = 0; i < segCount; i++) {
          const sy = y1 + sign * (i + 1) * segH;
          const cy = y1 + sign * (i + 0.5) * segH;
          const dir = (i % 2 === 0) ? 1 : -1;
          path.quadraticBezierTo(x + depthMm * dir * outward, cy, x, sy);
        }
        break;
      }
      case 'castellated': {
        const segW = depthMm;
        for (let i = 0; i < segCount; i++) {
          const segStart = y1 + sign * i * segH;
          const segMid = y1 + sign * (i + 0.5) * segH;
          if (i % 2 === 0) {
            path.lineTo(x + segW * outward, segStart);
            path.lineTo(x + segW * outward, segMid);
            path.lineTo(x, segMid);
          }
          path.lineTo(x, y1 + sign * (i + 1) * segH);
        }
        break;
      }
      default:
        // Delegate to shared edge style system for all other styles
        drawStyledEdge(path, x, y1, x, y2, style, depthMm, segCount, outward, 0, 0, 42);
    }
  }

  private drawStyledBottomEdge(
    path: SVGPath, w: number, h: number, margin: number,
    style: string, depthParam: number, count: number, bottomExt: number,
    cornerRadius: number = 0, params: Record<string, unknown> = {}
  ): void {
    const bottomY = h - margin;           // absolute bottom edge of bounding box
    const bodyBottom = bottomY - bottomExt; // raised baseline where the body ends
    const leftX = margin + cornerRadius;
    const rightX = w - margin - cornerRadius;
    const usableW = rightX - leftX;

    switch (style) {
      case 'swallowtail': {
        // V-notch goes inward (upward), no overflow — ext=0, bodyBottom=bottomY
        const depth = h * depthParam;
        const cx = (leftX + rightX) / 2;
        path.lineTo(cx, bodyBottom - depth);
        path.lineTo(leftX, bodyBottom);
        break;
      }
      case 'pointed': {
        // Triangle tip at bottomY (within bounds), body corners at bodyBottom
        const cx = (leftX + rightX) / 2;
        path.lineTo(cx, bottomY);
        path.lineTo(leftX, bodyBottom);
        break;
      }
      case 'flames': {
        // Pointed flame tongues with curling spurs
        const flameCount = count || 5;
        const segW = usableW / flameCount;
        const flameH = bottomExt;
        for (let i = 0; i < flameCount; i++) {
          const x0 = rightX - i * segW;
          const x1 = rightX - (i + 1) * segW;
          const midX = (x0 + x1) / 2;
          // Rising curl spur
          const spur1X = x0 - segW * 0.15;
          const spur1Y = bodyBottom + flameH * 0.3;
          path.quadraticBezierTo(spur1X, spur1Y, midX + segW * 0.1, bodyBottom + flameH * 0.55);
          // Sharp pointed tip
          path.lineTo(midX, bottomY);
          // Falling curl spur
          const spur2X = x1 + segW * 0.15;
          const spur2Y = bodyBottom + flameH * 0.3;
          path.quadraticBezierTo(midX - segW * 0.1, bodyBottom + flameH * 0.55, spur2X, spur2Y);
          path.quadraticBezierTo(x1 + segW * 0.05, bodyBottom + flameH * 0.05, x1, bodyBottom);
        }
        break;
      }
      case 'scalloped': {
        // Scallops curve from bodyBottom down to bottomY, staying within bounds
        const scCount = count || 5;
        const segW = usableW / scCount;
        for (let i = 0; i < scCount; i++) {
          const x0 = rightX - i * segW;
          const x1 = rightX - (i + 1) * segW;
          const cx = (x0 + x1) / 2;
          path.quadraticBezierTo(cx, bottomY, x1, bodyBottom);
        }
        break;
      }
      case 'zigzag': {
        // Teeth alternate between bottomY and bodyBottom, centered for even counts
        const zzCount = count || 8;
        const segW = usableW / zzCount;
        for (let i = 0; i < zzCount; i++) {
          const x = rightX - (i + 0.5) * segW;
          // Start with a downward tooth so pattern is symmetric around center
          const y = (i % 2 === 0) ? bottomY : bodyBottom;
          path.lineTo(x, y);
        }
        // End at bodyBottom on left, ensuring symmetry
        path.lineTo(leftX, bodyBottom);
        break;
      }
      case 'wavy': {
        // Wave control points alternate between bottomY and bodyBottom
        const wvCount = count || 5;
        const segW = usableW / wvCount;
        for (let i = 0; i < wvCount; i++) {
          const x0 = rightX - i * segW;
          const x1 = rightX - (i + 1) * segW;
          const cx = (x0 + x1) / 2;
          const cpY = (i % 2 === 0) ? bottomY : bodyBottom - bottomExt;
          path.quadraticBezierTo(cx, cpY, x1, bodyBottom);
        }
        break;
      }
      case 'straight':
        // Visible straight line at bodyBottom (distinct from 'none' which has no bottom style)
        path.lineTo(leftX, bodyBottom);
        break;
      case 'none':
        path.lineTo(leftX, bodyBottom);
        break;
      case 'castellated': {
        // Battlements: square notches along the bottom
        const castCount = count || 5;
        const segW = usableW / castCount;
        const notchW = segW * 0.5;
        for (let i = 0; i < castCount; i++) {
          const baseX = rightX - i * segW;
          // Drop down to notch
          path.lineTo(baseX, bottomY);
          path.lineTo(baseX - notchW, bottomY);
          // Back up to merlon
          path.lineTo(baseX - notchW, bodyBottom);
          const nextX = rightX - (i + 1) * segW;
          path.lineTo(nextX, bodyBottom);
        }
        break;
      }
      case 'torn': {
        // Torn/ripped edge — delegates to shared system with user seed
        const tornSeed = (params as Record<string, number>).flagBottomSeed ?? 42;
        drawStyledEdge(path, rightX, bodyBottom, leftX, bodyBottom, 'torn', bottomExt, count, 0, 1, 0, tornSeed);
        break;
      }
      case 'stepped': {
        // Staircase steps descending then ascending per segment
        const stepCount = count || 5;
        const segW = usableW / stepCount;
        const steps = 3;
        for (let i = 0; i < stepCount; i++) {
          const segStart = rightX - i * segW;
          const stepW = segW / (steps * 2);
          // Descend
          for (let s = 0; s < steps; s++) {
            const d = bottomExt * ((s + 1) / steps);
            const sx = segStart - s * 2 * stepW;
            path.lineTo(sx, bodyBottom + d);
            path.lineTo(sx - stepW, bodyBottom + d);
          }
          // Ascend
          for (let s = steps - 1; s >= 0; s--) {
            const d = bottomExt * ((s + 1) / steps);
            const sx = segStart - (steps + (steps - 1 - s)) * stepW * 2;
            if (s < steps - 1) {
              path.lineTo(sx + stepW, bodyBottom + d);
            }
            path.lineTo(sx, bodyBottom + d);
          }
          path.lineTo(rightX - (i + 1) * segW, bodyBottom);
        }
        break;
      }
      case 'dovetail': {
        // Trapezoidal dovetail notches
        const dtCount = count || 5;
        const segW = usableW / dtCount;
        for (let i = 0; i < dtCount; i++) {
          const segStart = rightX - i * segW;
          const dir = (i % 2 === 0) ? 1 : 0.3;
          const d = bottomExt * dir;
          // Narrow top entry
          const topInset = segW * 0.35;
          const botInset = segW * 0.2;
          path.lineTo(segStart - topInset, bodyBottom + d);
          path.lineTo(segStart - botInset, bodyBottom + d);
          path.lineTo(segStart - (segW - botInset), bodyBottom + d);
          path.lineTo(segStart - (segW - topInset), bodyBottom + d);
          path.lineTo(rightX - (i + 1) * segW, bodyBottom);
        }
        break;
      }
      case 'feathered': {
        // Overlapping feather shapes with pointed tips
        const fCount = count || 5;
        const segW = usableW / fCount;
        for (let i = 0; i < fCount; i++) {
          const x0 = rightX - i * segW;
          const x1 = rightX - (i + 1) * segW;
          const midX = (x0 + x1) / 2;
          const tipY = bottomY;
          // Smooth pointed feather: rise to sharp point then curve back
          path.cubicBezierTo(
            x0 - segW * 0.1, bodyBottom + bottomExt * 0.2,
            midX + segW * 0.15, tipY - bottomExt * 0.05,
            midX, tipY
          );
          path.cubicBezierTo(
            midX - segW * 0.15, tipY - bottomExt * 0.05,
            x1 + segW * 0.1, bodyBottom + bottomExt * 0.2,
            x1, bodyBottom
          );
        }
        break;
      }
      case 'cloud': {
        // Rounded cloud puffs — 3 arcs per segment with varying radii forming rounded bumps
        const clCount = count || 4;
        const segW = usableW / clCount;
        const rng = new SeededRNG((params as Record<string, number>).flagBottomSeed ?? 42);
        for (let i = 0; i < clCount; i++) {
          const segStart = rightX - i * segW;
          const puffs = 3;
          const puffW = segW / puffs;
          for (let j = 0; j < puffs; j++) {
            const px0 = segStart - j * puffW;
            const px1 = segStart - (j + 1) * puffW;
            const h = bottomExt * (0.5 + rng.nextRange(0, 1) * 0.5);
            const cx = (px0 + px1) / 2;
            // Rounded arc bulge
            path.cubicBezierTo(
              px0 - puffW * 0.1, bodyBottom + h * 0.8,
              cx + puffW * 0.15, bodyBottom + h,
              cx, bodyBottom + h
            );
            path.cubicBezierTo(
              cx - puffW * 0.15, bodyBottom + h,
              px1 + puffW * 0.1, bodyBottom + h * 0.8,
              px1, bodyBottom
            );
          }
        }
        break;
      }
      case 'sawtooth': {
        // Asymmetric sawtooth — steep side, gradual slope; direction toggleable
        const stCount = count || 8;
        const segW = usableW / stCount;
        const reverse = !!(params as Record<string, boolean>).flagSawtoothReverse;
        const curve = (params as Record<string, number>).flagSawtoothCurve ?? 0;
        for (let i = 0; i < stCount; i++) {
          const x0 = rightX - i * segW;
          const x1 = rightX - (i + 1) * segW;
          if (reverse) {
            // Gradual rise then steep drop
            const peakX = x0 - segW * 0.75;
            if (curve > 0) {
              const cpX = (x0 + peakX) / 2;
              path.quadraticBezierTo(cpX, bodyBottom + bottomExt * curve * 0.3, peakX, bottomY);
            } else {
              path.lineTo(peakX, bottomY);
            }
            path.lineTo(x1, bodyBottom);
          } else {
            // Steep rise then gradual slope
            const peakX = x0 - segW * 0.25;
            path.lineTo(peakX, bottomY);
            if (curve > 0) {
              const cpX = (peakX + x1) / 2;
              path.quadraticBezierTo(cpX, bodyBottom + bottomExt * curve * 0.3, x1, bodyBottom);
            } else {
              path.lineTo(x1, bodyBottom);
            }
          }
        }
        break;
      }
      case 'arrow': {
        // Arrow pattern: stem with triangular arrowhead
        const arCount = count || 5;
        const segW = usableW / arCount;
        const stemW = segW * 0.15;
        const headW = segW * 0.4;
        for (let i = 0; i < arCount; i++) {
          const cx = rightX - (i + 0.5) * segW;
          const stemTop = bodyBottom;
          const stemBot = bodyBottom + bottomExt * 0.5;
          const tipY = bottomY;
          // Left side of stem
          path.lineTo(cx + stemW, stemTop);
          path.lineTo(cx + stemW, stemBot);
          // Arrowhead widens
          path.lineTo(cx + headW, stemBot);
          // Tip
          path.lineTo(cx, tipY);
          // Right side of arrowhead
          path.lineTo(cx - headW, stemBot);
          // Right side of stem
          path.lineTo(cx - stemW, stemBot);
          path.lineTo(cx - stemW, stemTop);
          // Back to baseline
          path.lineTo(rightX - (i + 1) * segW, bodyBottom);
        }
        break;
      }
      case 'picot':
        // Delegate picot to shared system
        drawStyledEdge(path, rightX, bodyBottom, leftX, bodyBottom, 'picot', bottomExt, count, 0, 1, 0, 42);
        break;
      default:
        // Delegate any remaining styles to shared edge style system
        drawStyledEdge(path, rightX, bodyBottom, leftX, bodyBottom, style, bottomExt, count, 0, 1, 0, 42);
        break;
    }
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { shape } = this;
    const refW = shape.refRight - shape.refLeft;
    const refH = shape.refTop - shape.refBot;
    const w = params.width;
    const h = params.length;
    const px = (aiX: number) => ((aiX - shape.refLeft) / refW) * w;
    const py = (aiY: number) => ((shape.refTop - aiY) / refH) * h;

    const paths = [this.generateCutPath(params)];

    // Holes are fixed-size (real LEGO clip holes don't change with flag size)
    const h1x = px(shape.hole1X), h2x = px(shape.hole2X), hy = py(shape.holeY);
    if (params.holeOverride) {
      paths.push(generateAttachmentHole(h1x, hy, HOLE_RADIUS_MM, 0, 0, false, params));
      paths.push(generateAttachmentHole(h2x, hy, HOLE_RADIUS_MM, 0, 0, false, params));
    } else {
      paths.push(stadiumPath(h1x, hy, HOLE_HALF_FLAT_MM, HOLE_RADIUS_MM));
      paths.push(stadiumPath(h2x, hy, HOLE_HALF_FLAT_MM, HOLE_RADIUS_MM));
    }

    return paths;
  }

  generateScorePaths(_params: TemplateParams): string[] {
    return [];
  }

  generateEngravePaths(_params: TemplateParams): string[] {
    return [];
  }

  export(
    id: string,
    name: string,
    elementType: string,
    variantName: string,
    params: TemplateParams
  ) {
    const result = super.export(id, name, elementType, variantName, params);
    result.boundingBox = {
      x: 0,
      y: 0,
      width: params.width,
      height: params.length,
    };
    return result;
  }
}

/**
 * Small Flag: single flame tongue, narrower body (~20×36mm)
 */
export class FlagSmall extends BannerFlag {
  protected shape = SMALL_FLAG;

  generateCutPath(params: TemplateParams): string {
    // Small flag always uses reference SVG shape — ignore any style params
    const cleanParams = { ...params, flagBottomStyle: 'none', flagLeftStyle: 'none', flagRightStyle: 'none' };
    return super.generateCutPath(cleanParams);
  }

  export(
    id: string,
    name: string,
    elementType: string,
    variantName: string,
    params: TemplateParams
  ) {
    const flagParams = { ...params, width: params.width || 22, length: params.length || 60 };
    return super.export(id, name, elementType, variantName, flagParams);
  }
}

/**
 * Large Flag: three flame tongues, wider body (~40×64mm)
 */
export class FlagLarge extends BannerFlag {
  protected shape = LARGE_FLAG;

  generateCutPath(params: TemplateParams): string {
    // Large flag always uses reference SVG shape — ignore any style params
    const cleanParams = { ...params, flagBottomStyle: 'none', flagLeftStyle: 'none', flagRightStyle: 'none' };
    return super.generateCutPath(cleanParams);
  }

  export(
    id: string,
    name: string,
    elementType: string,
    variantName: string,
    params: TemplateParams
  ) {
    const flagParams = { ...params, width: params.width || 40, length: params.length || 64 };
    return super.export(id, name, elementType, variantName, flagParams);
  }
}

/**
 * Custom Flag: rectangular body with configurable holes (1-6) and all edge styling options.
 * Always uses the rectangular styled path (no flame-tongue SVG).
 * Default 30×60mm.
 */
export class FlagCustom extends BannerFlag {
  protected shape = LARGE_FLAG; // not actually used since we override generateCutPath

  generateCutPath(params: TemplateParams): string {
    // Force the styled rectangular path — treat 'none' bottom/side styles as 'straight'
    const bottomStyle = (params.flagBottomStyle as string) || 'none';
    const leftStyle = (params.flagLeftStyle as string) || 'none';
    const rightStyle = (params.flagRightStyle as string) || 'none';

    // If all styles are 'none', use a simple rectangle with rounded corners
    if (bottomStyle === 'none' && leftStyle === 'none' && rightStyle === 'none') {
      const w = params.width;
      const h = params.length;
      const margin = 1;
      const r = 1.5;
      const path = new SVGPath();
      path.moveTo(margin + r, margin);
      path.lineTo(w - margin - r, margin);
      path.arcTo(r, r, 0, 0, 1, w - margin, margin + r);
      path.lineTo(w - margin, h - margin - r);
      path.arcTo(r, r, 0, 0, 1, w - margin - r, h - margin);
      path.lineTo(margin + r, h - margin);
      path.arcTo(r, r, 0, 0, 1, margin, h - margin - r);
      path.lineTo(margin, margin + r);
      path.arcTo(r, r, 0, 0, 1, margin + r, margin);
      path.closePath();
      return path.toString();
    }

    // Otherwise delegate to the styled path builder in BannerFlag
    return this.generateStyledFlagPath(params);
  }

  generateCutPaths(params: TemplateParams): string[] {
    const w = params.width;
    const paths = [this.generateCutPath(params)];

    const holeCount = Math.max(1, Math.min(6, (params.flagCustomHoleCount as number) || 2));
    const margin = 1;
    const usableW = w - 2 * margin;
    const holeY = margin + HOLE_RADIUS_MM + 1; // near the top

    for (let i = 0; i < holeCount; i++) {
      // Evenly space holes across the width
      const cx = margin + usableW * (i + 0.5) / holeCount;
      if (params.holeOverride) {
        paths.push(generateAttachmentHole(cx, holeY, HOLE_RADIUS_MM, 0, 0, false, params));
      } else {
        paths.push(stadiumPath(cx, holeY, HOLE_HALF_FLAT_MM, HOLE_RADIUS_MM));
      }
    }

    return paths;
  }

  export(
    id: string,
    name: string,
    elementType: string,
    variantName: string,
    params: TemplateParams
  ) {
    const flagParams = { ...params, width: params.width || 30, length: params.length || 60 };
    return super.export(id, name, elementType, variantName, flagParams);
  }
}

/**
 * Wings: Single dragon/bat wing (45×25mm default)
 * Wing tip at top, membrane sweeps outward to the right,
 * arm extends downward with body attachment on the left.
 */
export class Wings extends Template {
  generateCutPath(params: TemplateParams): string {
    const w = params.width;
    const h = params.length;
    const path = new SVGPath();

    // Start at wing tip (top)
    path.moveTo(w * 0.41, 0);

    // TRAILING EDGE — tip sweeps right into membrane
    path.cubicBezierTo(
      w * 0.50, h * 0.04,
      w * 0.65, h * 0.07,
      w * 0.73, h * 0.12
    );

    // Membrane expands outward
    path.cubicBezierTo(
      w * 0.85, h * 0.18,
      w * 0.94, h * 0.28,
      w * 0.98, h * 0.38
    );

    // Membrane peak
    path.cubicBezierTo(
      w * 1.00, h * 0.43,
      w * 1.00, h * 0.47,
      w * 0.98, h * 0.50
    );

    // Membrane collapses back toward arm
    path.cubicBezierTo(
      w * 0.88, h * 0.52,
      w * 0.78, h * 0.54,
      w * 0.70, h * 0.56
    );

    // ARM — right side going down
    path.cubicBezierTo(
      w * 0.69, h * 0.62,
      w * 0.68, h * 0.72,
      w * 0.67, h * 0.82
    );

    // Lower arm + claw transition
    path.cubicBezierTo(
      w * 0.67, h * 0.88,
      w * 0.60, h * 0.93,
      w * 0.46, h * 0.94
    );

    // Bottom tip
    path.cubicBezierTo(
      w * 0.25, h * 0.97,
      w * 0.10, h * 0.99,
      w * 0.06, h
    );

    // ARM — left side going up
    path.cubicBezierTo(
      w * 0.02, h * 0.99,
      w * 0.00, h * 0.90,
      w * 0.00, h * 0.78
    );

    path.cubicBezierTo(
      w * 0.00, h * 0.68,
      w * 0.00, h * 0.60,
      w * 0.01, h * 0.57
    );

    // Arm shoulder — transition back to wing body
    path.cubicBezierTo(
      w * 0.06, h * 0.56,
      w * 0.16, h * 0.55,
      w * 0.27, h * 0.53
    );

    // LEADING EDGE — going up to tip
    path.cubicBezierTo(
      w * 0.29, h * 0.40,
      w * 0.32, h * 0.25,
      w * 0.35, h * 0.12
    );

    path.cubicBezierTo(
      w * 0.37, h * 0.06,
      w * 0.39, h * 0.02,
      w * 0.41, 0
    );

    path.closePath();
    return path.toString();
  }

  generateScorePaths(params: TemplateParams): string[] {
    const w = params.width;
    const h = params.length;
    const scores: string[] = [];

    // Wing membrane finger lines (radiating from shoulder area)
    for (let i = 0; i < 3; i++) {
      const frac = 0.15 + i * 0.12;
      const score = new SVGPath();
      const startX = w * 0.32;
      const startY = h * (0.35 + i * 0.06);
      const endX = w * (0.70 + i * 0.08);
      const endY = h * (frac + 0.02);
      score.moveTo(startX, startY);
      score.quadraticBezierTo(
        (startX + endX) / 2, (startY + endY) / 2 - h * 0.04,
        endX, endY
      );
      scores.push(score.toString());
    }
    return scores;
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius, slitWidth, enableSlit } = params;
    const paths = [this.generateCutPath(params)];
    // Attachment hole in the arm area near the shoulder
    paths.push(generateAttachmentHole(width * 0.15, length * 0.65, holeRadius, slitWidth, 8, enableSlit, params));
    return paths;
  }

  generateEngravePaths(params: TemplateParams): string[] {
    return [];
  }
}

// ── Tattered Wing fractional path data ──
// Extracted from archive/wingtemplate.svg — asymmetric organic wing shape.
// Coordinates are fractions [0..1] of (width, height). Aspect ratio ≈ 1.755:1.
type FracCmd = number[];

const TATTERED_WING_OUTLINE: FracCmd[] = [
  [1, 0.05775, 0.99266],
  [3, 0.04858, 0.98909, 0.04275, 0.98095, 0.03534, 0.96141],
  [3, 0.01927, 0.91896, 0.00804, 0.86221, 0.00323, 0.79903],
  [3, 0.00051, 0.76340, 0, 0.67111, 0.00234, 0.63810],
  [3, 0.00585, 0.58854, 0.01131, 0.57387, 0.03059, 0.56226],
  [3, 0.04664, 0.55261, 0.05438, 0.55104, 0.08666, 0.55095],
  [3, 0.13294, 0.55083, 0.17666, 0.55465, 0.22187, 0.56278],
  [2, 0.24783, 0.56744],
  [2, 0.25344, 0.55992],
  [3, 0.26783, 0.54066, 0.26994, 0.51669, 0.26047, 0.48002],
  [3, 0.25409, 0.45534, 0.25314, 0.44159, 0.25682, 0.42722],
  [3, 0.25977, 0.41571, 0.27061, 0.36664, 0.27061, 0.36478],
  [3, 0.27061, 0.36400, 0.27268, 0.35543, 0.27521, 0.34573],
  [3, 0.27775, 0.33603, 0.28290, 0.31541, 0.28667, 0.29990],
  [3, 0.29468, 0.26687, 0.32649, 0.15260, 0.33730, 0.11801],
  [3, 0.34534, 0.09228, 0.35020, 0.07887, 0.35876, 0.05880],
  [3, 0.37803, 0.01366, 0.40658, 0, 0.43688, 0.02141],
  [3, 0.44827, 0.02946, 0.46200, 0.03992, 0.47865, 0.05323],
  [3, 0.50893, 0.07743, 0.53686, 0.08689, 0.57828, 0.08695],
  [3, 0.64222, 0.08704, 0.68916, 0.09604, 0.73629, 0.11722],
  [3, 0.75185, 0.12421, 0.78305, 0.14139, 0.78871, 0.14609],
  [3, 0.79047, 0.14755, 0.79915, 0.15404, 0.80798, 0.16049],
  [3, 0.85605, 0.19563, 0.90106, 0.24665, 0.94626, 0.31725],
  [3, 0.96137, 0.34084, 0.97870, 0.37954, 0.98709, 0.40842],
  [3, 0.99890, 0.44902, 1, 0.48379, 0.98989, 0.49643],
  [3, 0.98355, 0.50435, 0.97407, 0.50394, 0.95283, 0.49483],
  [3, 0.90946, 0.47621, 0.86659, 0.48005, 0.81256, 0.50738],
  [3, 0.79321, 0.51717, 0.79203, 0.51727, 0.78389, 0.50999],
  [3, 0.78042, 0.50688, 0.77673, 0.50435, 0.77569, 0.50435],
  [3, 0.77340, 0.50435, 0.77144, 0.51223, 0.77279, 0.51604],
  [3, 0.77528, 0.52312, 0.77148, 0.53246, 0.76272, 0.54079],
  [3, 0.75273, 0.55029, 0.74744, 0.55139, 0.74131, 0.54523],
  [3, 0.73592, 0.53982, 0.72934, 0.54001, 0.72243, 0.54576],
  [3, 0.71714, 0.55017, 0.71599, 0.55019, 0.70693, 0.54603],
  [3, 0.69016, 0.53834, 0.68961, 0.54504, 0.70391, 0.58228],
  [3, 0.71379, 0.60798, 0.71384, 0.60951, 0.70546, 0.63124],
  [3, 0.69681, 0.65369, 0.68959, 0.66790, 0.68684, 0.66790],
  [3, 0.68537, 0.66790, 0.68135, 0.66539, 0.67792, 0.66232],
  [3, 0.67327, 0.65815, 0.67114, 0.65753, 0.66955, 0.65984],
  [3, 0.66647, 0.66433, 0.66686, 0.66947, 0.67217, 0.69441],
  [2, 0.67691, 0.71668],
  [2, 0.67481, 0.74376],
  [3, 0.67236, 0.77538, 0.67289, 0.80785, 0.67626, 0.83339],
  [3, 0.67758, 0.84338, 0.67866, 0.86179, 0.67866, 0.87430],
  [3, 0.67866, 0.91016, 0.67179, 0.92384, 0.65550, 0.92041],
  [3, 0.64134, 0.91743, 0.63330, 0.90748, 0.60637, 0.85962],
  [3, 0.58729, 0.82571, 0.56336, 0.79167, 0.54934, 0.77848],
  [3, 0.53208, 0.76226, 0.51046, 0.75893, 0.49755, 0.77051],
  [3, 0.47780, 0.78823, 0.46915, 0.81970, 0.46656, 0.88322],
  [3, 0.46495, 0.92275, 0.46303, 0.94318, 0.45992, 0.95378],
  [3, 0.45070, 0.98526, 0.43468, 0.97779, 0.40302, 0.92726],
  [3, 0.36898, 0.87291, 0.35481, 0.85186, 0.34145, 0.83579],
  [3, 0.32839, 0.82009, 0.30470, 0.79762, 0.30119, 0.79762],
  [3, 0.29947, 0.79762, 0.29879, 0.79523, 0.29066, 0.76096],
  [3, 0.28827, 0.75088, 0.28520, 0.73954, 0.28385, 0.73577],
  [2, 0.28140, 0.72891],
  [2, 0.27843, 0.73533],
  [3, 0.27680, 0.73886, 0.27470, 0.74703, 0.27377, 0.75347],
  [3, 0.27094, 0.77296, 0.26875, 0.78069, 0.26600, 0.78090],
  [3, 0.26456, 0.78101, 0.25751, 0.78166, 0.25033, 0.78235],
  [2, 0.23729, 0.78360],
  [2, 0.23296, 0.77364],
  [3, 0.23058, 0.76816, 0.22802, 0.76434, 0.22727, 0.76515],
  [3, 0.22652, 0.76596, 0.22543, 0.77163, 0.22484, 0.77773],
  [3, 0.22353, 0.79137, 0.22254, 0.79285, 0.20863, 0.80202],
  [3, 0.18524, 0.81746, 0.15501, 0.84941, 0.13865, 0.87598],
  [3, 0.13349, 0.88438, 0.12346, 0.90561, 0.11636, 0.92316],
  [3, 0.09335, 0.98010, 0.07657, 1, 0.05775, 0.99266],
  [0],
];

const TATTERED_WING_HOLES: FracCmd[][] = [
  // Decorative tear holes (~40mm from top)
  [
    [1, 0.72121, 0.42929],
    [3, 0.72362, 0.42281, 0.72356, 0.42167, 0.72018, 0.41112],
    [3, 0.71757, 0.40297, 0.71326, 0.39640, 0.70450, 0.38725],
    [3, 0.69174, 0.37392, 0.68719, 0.37190, 0.68566, 0.37891],
    [3, 0.68330, 0.38967, 0.69657, 0.42206, 0.70782, 0.43299],
    [3, 0.71498, 0.43996, 0.71748, 0.43926, 0.72121, 0.42929],
    [0],
  ],
  [
    [1, 0.64165, 0.42275],
    [3, 0.64451, 0.41337, 0.64350, 0.40652, 0.63801, 0.39805],
    [3, 0.62088, 0.37165, 0.61238, 0.38520, 0.62735, 0.41505],
    [3, 0.63440, 0.42910, 0.63897, 0.43156, 0.64165, 0.42275],
    [0],
  ],
  // Decorative tear holes (~70mm from top)
  [
    [1, 0.50093, 0.71219],
    [2, 0.50413, 0.70467],
    [2, 0.50037, 0.69059],
    [3, 0.49830, 0.68284, 0.49488, 0.67365, 0.49277, 0.67016],
    [3, 0.48951, 0.66479, 0.48870, 0.66445, 0.48743, 0.66798],
    [3, 0.48419, 0.67696, 0.48680, 0.70672, 0.49164, 0.71612],
    [3, 0.49507, 0.72275, 0.49674, 0.72205, 0.50093, 0.71219],
    [0],
  ],
  [
    [1, 0.33147, 0.71124],
    [3, 0.33454, 0.70747, 0.33506, 0.70489, 0.33434, 0.69709],
    [3, 0.33315, 0.68424, 0.32372, 0.65900, 0.32050, 0.66007],
    [3, 0.31517, 0.66184, 0.31716, 0.69893, 0.32323, 0.71091],
    [3, 0.32630, 0.71697, 0.32679, 0.71699, 0.33147, 0.71123],
    [0],
  ],
];

// 6 ball joint holes with their smaller companion holes, plus 1 pin hole.
// Positions are fractional (relX, relY) within (width, height).
// Ball joints: ~3-4mm diameter in the original 173×101mm SVG
// Companions: ~1-1.5mm diameter, positioned nearby
// Pin hole: ~5mm diameter, near the top

const TATTERED_WING_BALL_JOINTS: Array<{
  ball: { relX: number; relY: number; radiusFrac: number };
  companion: { relX: number; relY: number; radiusFrac: number };
}> = [
  { // Lower center-left (arm area)
    ball:      { relX: 0.434, relY: 0.856, radiusFrac: 0.0098 },
    companion: { relX: 0.425, relY: 0.821, radiusFrac: 0.0036 },
  },
  { // Lower center-right
    ball:      { relX: 0.645, relY: 0.795, radiusFrac: 0.0104 },
    companion: { relX: 0.632, relY: 0.766, radiusFrac: 0.0040 },
  },
  { // Far left arm
    ball:      { relX: 0.062, relY: 0.601, radiusFrac: 0.0109 },
    companion: { relX: 0.066, relY: 0.641, radiusFrac: 0.0036 },
  },
  { // Left mid (leading edge)
    ball:      { relX: 0.301, relY: 0.452, radiusFrac: 0.0081 },
    companion: { relX: 0.300, relY: 0.488, radiusFrac: 0.0021 },
  },
  { // Far right trailing edge
    ball:      { relX: 0.942, relY: 0.369, radiusFrac: 0.0097 },
    companion: { relX: 0.924, relY: 0.348, radiusFrac: 0.0034 },
  },
];

const TATTERED_WING_PIN_HOLE = { relX: 0.422, relY: 0.103, radiusFrac: 0.0153 };

/**
 * Render fractional path commands into an SVG path string, scaled by w/h.
 */
function renderWingFracPath(cmds: FracCmd[], w: number, h: number): string {
  const path = new SVGPath();
  for (const cmd of cmds) {
    switch (cmd[0]) {
      case 0: path.closePath(); break;
      case 1: path.moveTo(w * cmd[1], h * cmd[2]); break;
      case 2: path.lineTo(w * cmd[1], h * cmd[2]); break;
      case 3: path.cubicBezierTo(w * cmd[1], h * cmd[2], w * cmd[3], h * cmd[4], w * cmd[5], h * cmd[6]); break;
    }
  }
  return path.toString();
}

/**
 * WingsTattered: Asymmetric organic wing with tattered holes.
 * Traced from archive/wingtemplate.svg. Not symmetric by design.
 * Original aspect ratio ≈ 1.755:1.
 * Default size: 45 × 26mm (similar to standard wing).
 */
export class WingsTattered extends Template {
  generateCutPath(params: TemplateParams): string {
    return renderWingFracPath(TATTERED_WING_OUTLINE, params.width, params.length);
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius, slitWidth, enableSlit } = params;
    const paths = [this.generateCutPath(params)];

    // Decorative tear holes (organic FracCmd outlines)
    for (const hole of TATTERED_WING_HOLES) {
      paths.push(renderWingFracPath(hole, width, length));
    }

    // Ball-joint attachment holes with companion holes
    for (const joint of TATTERED_WING_BALL_JOINTS) {
      const bx = width * joint.ball.relX;
      const by = length * joint.ball.relY;
      const br = width * joint.ball.radiusFrac;
      paths.push(generateAttachmentHole(bx, by, br, slitWidth, 8, enableSlit, params));

      const cx = width * joint.companion.relX;
      const cy = length * joint.companion.relY;
      const cr = width * joint.companion.radiusFrac;
      paths.push(generateAttachmentHole(cx, cy, cr, slitWidth, 4, false, params));
    }

    // Pin connector hole near top
    const px = width * TATTERED_WING_PIN_HOLE.relX;
    const py = length * TATTERED_WING_PIN_HOLE.relY;
    const pr = width * TATTERED_WING_PIN_HOLE.radiusFrac;
    paths.push(generateAttachmentHole(px, py, pr, slitWidth, 8, enableSlit, params));

    return paths;
  }

  generateScorePaths(_params: TemplateParams): string[] {
    return [];
  }

  generateEngravePaths(_params: TemplateParams): string[] {
    return [];
  }
}

/**
 * WingsCustom: Asymmetric custom wing with 4 draggable connection points.
 * Outline is a quadrilateral connecting the 4 nodes with straight edges.
 * Each node gets a ball-joint attachment hole.
 */
export class WingsCustom extends Template {
  /** Get the 4 corner nodes */
  private getCorners(params: TemplateParams) {
    const w = params.width;
    const h = params.length;
    return [
      { x: (params.sailGrommetTLx as number) || 5, y: (params.sailGrommetTLy as number) || 2 },
      { x: w - ((params.sailGrommetTRx as number) || 3), y: (params.sailGrommetTRy as number) || 5 },
      { x: w - ((params.sailGrommetBRx as number) || 7), y: h - ((params.sailGrommetBRy as number) || 5) },
      { x: (params.sailGrommetBLx as number) || 3, y: h - ((params.sailGrommetBLy as number) || 2) },
    ];
  }

  /** Parse per-edge midpoints from params */
  private getEdgeMidpoints(params: TemplateParams): Array<Array<{ x: number; y: number }>> {
    const edges: Array<Array<{ x: number; y: number }>> = [];
    for (let i = 0; i < 4; i++) {
      try {
        edges.push(JSON.parse((params[`wingEdge${i}Points`] as string) || '[]'));
      } catch { edges.push([]); }
    }
    return edges;
  }

  /** Merge corners + edge midpoints into a full polygon */
  private getNodes(params: TemplateParams) {
    const corners = this.getCorners(params);
    const edgeMids = this.getEdgeMidpoints(params);
    const nodes: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < 4; i++) {
      nodes.push(corners[i]);
      nodes.push(...edgeMids[i]);
    }
    return nodes;
  }

  generateCutPath(params: TemplateParams): string {
    const holeR = getSailHoleRadius(params);
    const gap = (params.sailGrommetMargin as number) ?? 2;
    const nodes = this.getNodes(params);
    const margin = holeR + gap;
    const n = nodes.length;
    const style = (params.wingEdgeStyle as string) || 'none';
    const depth = (params.wingEdgeDepth as number) || 3;
    const count = (params.wingEdgeCount as number) || 6;
    const seed = (params.wingTornSeed as number) || 42;
    const edgeStyles = Array(n).fill(style);
    const edgeDepths = Array(n).fill(depth);
    return buildSailCutPath(nodes, margin, edgeStyles, edgeDepths, count, 2, seed);
  }

  generateCutPaths(params: TemplateParams): string[] {
    const r = getSailHoleRadius(params);
    const paths = [this.generateCutPath(params)];
    // Only cut holes at the 4 corners, not at midpoints
    for (const g of this.getCorners(params)) paths.push(circlePath(g.x, g.y, r));
    return paths;
  }

  generateScorePaths(params: TemplateParams): string[] {
    const holeR = getSailHoleRadius(params);
    const corners = this.getCorners(params);
    const nodes = this.getNodes(params);
    const scores: string[] = [];

    // Inner boundary connecting all node positions
    if (nodes.length > 0) {
      const inner = new SVGPath();
      inner.moveTo(nodes[0].x, nodes[0].y);
      for (let i = 1; i < nodes.length; i++) inner.lineTo(nodes[i].x, nodes[i].y);
      inner.closePath();
      scores.push(inner.toString());
    }

    scores.push(...buildGrommetCrosshairs(corners, holeR));
    return scores;
  }

  generateEngravePaths(_params: TemplateParams): string[] {
    return [];
  }
}

/**
 * Helper: extract edge style params for kama/mantle from TemplateParams.
 */
function getEdgeParams(params: TemplateParams, prefix: 'kama' | 'mantle') {
  return {
    style: (params[`${prefix}EdgeStyle`] as string) || 'none',
    depth: (params[`${prefix}EdgeDepth`] as number) || 2,
    count: (params[`${prefix}EdgeCount`] as number) || 6,
    seed: (params.seed as number) || 42,
  };
}

/**
 * Kama: Minifig waist-wrap skirt (47×19mm default).
 * Bilaterally symmetric outline (left half mirrored for right half).
 * Features: two outer waist tabs with rectangular protrusions, center front slit,
 * inner bridge sections, and four symmetric attachment holes.
 * Supports edge styles on the two bottom hem segments (left and right panels).
 */
export class Kama extends Template {
  generateCutPath(params: TemplateParams): string {
    const w = params.width;
    const h = params.length;
    const path = new SVGPath();
    const edge = getEdgeParams(params, 'kama');

    // Symmetric outline (left half mirrored for right)
    // Start at bottom-right of center slit
    path.moveTo(w * 0.54038, h * 0.94777);
    // Right slit wall (mirror of left, going up)
    path.lineTo(w * 0.52376, h * 0.92697);
    path.cubicBezierTo(w * 0.50568, h * 0.55313, w * 0.50225, h * 0.52236, w * 0.50000, h * 0.53148);
    // Left slit wall (going down)
    path.cubicBezierTo(w * 0.49775, h * 0.52236, w * 0.49432, h * 0.55313, w * 0.48533, h * 0.73895);
    path.lineTo(w * 0.47624, h * 0.92697);
    path.lineTo(w * 0.45962, h * 0.94777);

    // LEFT BOTTOM HEM: from center slit down to bottom, across to left side
    if (edge.style !== 'none') {
      const botY = h * 0.997;
      // Diagonal from slit corner to styled edge start avoids unstyled vertical gap
      drawStyledEdge(path, w * 0.45962, h * 0.94777, w * 0.12, botY,
        edge.style, edge.depth, edge.count, 0, 1, 0, edge.seed);
      path.lineTo(w * 0.10213, h * 0.91690);
    } else {
      path.cubicBezierTo(w * 0.43045, h * 0.98427, w * 0.39359, h * 0.99631, w * 0.30792, h * 0.99729);
      path.cubicBezierTo(w * 0.26564, h * 0.99780, w * 0.22042, h * 0.99677, w * 0.20744, h * 0.99519);
      // LEFT SIDE tab-to-side curve (included in styled path via lineTo above)
      path.cubicBezierTo(w * 0.17974, h * 0.99171, w * 0.10701, h * 0.93764, w * 0.10213, h * 0.91690);
    }
    path.cubicBezierTo(w * 0.10037, h * 0.90941, w * 0.08832, h * 0.81231, w * 0.07535, h * 0.70113);
    path.cubicBezierTo(w * 0.06239, h * 0.58995, w * 0.04952, h * 0.49077, w * 0.04676, h * 0.48071);
    path.cubicBezierTo(w * 0.04400, h * 0.47066, w * 0.03555, h * 0.45530, w * 0.02800, h * 0.44657);
    path.cubicBezierTo(w * 0.00584, h * 0.42097, w * 0.00354, h * 0.40291, w * 0.00159, h * 0.23980);
    path.cubicBezierTo(w * 0.00000, h * 0.08031, w * 0.00222, h * 0.05158, w * 0.02092, h * 0.02068);
    path.cubicBezierTo(w * 0.03053, h * 0.00480, w * 0.03598, h * 0.00356, w * 0.09990, h * 0.00270);
    path.cubicBezierTo(w * 0.17600, h * 0.00168, w * 0.18487, h * 0.00632, w * 0.19788, h * 0.05391);
    path.cubicBezierTo(w * 0.20469, h * 0.07881, w * 0.20503, h * 0.08914, w * 0.20496, h * 0.26866);
    path.lineTo(w * 0.20488, h * 0.45724);
    path.lineTo(w * 0.22330, h * 0.45916);
    path.cubicBezierTo(w * 0.23343, h * 0.46021, w * 0.25861, h * 0.45976, w * 0.27927, h * 0.45816);
    path.lineTo(w * 0.31682, h * 0.45526);
    path.lineTo(w * 0.31634, h * 0.27171);
    path.cubicBezierTo(w * 0.31582, h * 0.06918, w * 0.31669, h * 0.05933, w * 0.33835, h * 0.02399);
    path.cubicBezierTo(w * 0.34862, h * 0.00724, w * 0.35285, h * 0.00646, w * 0.43961, h * 0.00537);

    // Center top — straight line
    path.lineTo(w * 0.56039, h * 0.00537);

    // RIGHT HALF
    path.cubicBezierTo(w * 0.64715, h * 0.00646, w * 0.65138, h * 0.00724, w * 0.66165, h * 0.02399);
    path.cubicBezierTo(w * 0.68331, h * 0.05933, w * 0.68418, h * 0.06918, w * 0.68366, h * 0.27171);
    path.lineTo(w * 0.68318, h * 0.45526);
    path.lineTo(w * 0.72073, h * 0.45816);
    path.cubicBezierTo(w * 0.74139, h * 0.45976, w * 0.76657, h * 0.46021, w * 0.77670, h * 0.45916);
    path.lineTo(w * 0.79512, h * 0.45724);
    path.lineTo(w * 0.79504, h * 0.26866);
    path.cubicBezierTo(w * 0.79497, h * 0.08914, w * 0.79531, h * 0.07881, w * 0.80212, h * 0.05391);
    path.cubicBezierTo(w * 0.81513, h * 0.00632, w * 0.82400, h * 0.00168, w * 0.90010, h * 0.00270);
    path.cubicBezierTo(w * 0.96402, h * 0.00356, w * 0.96947, h * 0.00480, w * 0.97908, h * 0.02068);
    path.cubicBezierTo(w * 0.99778, h * 0.05158, w * 1.00000, h * 0.08031, w * 0.99841, h * 0.23980);
    path.cubicBezierTo(w * 0.99646, h * 0.40291, w * 0.99416, h * 0.42097, w * 0.97200, h * 0.44657);
    path.cubicBezierTo(w * 0.96445, h * 0.45530, w * 0.95600, h * 0.47066, w * 0.95324, h * 0.48071);
    path.cubicBezierTo(w * 0.95048, h * 0.49077, w * 0.93761, h * 0.58995, w * 0.92465, h * 0.70113);
    path.cubicBezierTo(w * 0.91168, h * 0.81231, w * 0.89963, h * 0.90941, w * 0.89787, h * 0.91690);
    // RIGHT BOTTOM HEM: from right side down to bottom, across to center slit
    if (edge.style !== 'none') {
      const botY = h * 0.997;
      path.lineTo(w * 0.88, botY);
      // Diagonal from outer edge to slit corner avoids unstyled vertical gap
      drawStyledEdge(path, w * 0.88, botY, w * 0.54038, h * 0.94777,
        edge.style, edge.depth, edge.count, 0, 1, 0, edge.seed + 1);
    } else {
      // RIGHT SIDE side-to-tab curve (included in styled path via lineTo above)
      path.cubicBezierTo(w * 0.89299, h * 0.93764, w * 0.82026, h * 0.99171, w * 0.79256, h * 0.99519);
      path.cubicBezierTo(w * 0.77958, h * 0.99677, w * 0.73436, h * 0.99780, w * 0.69208, h * 0.99729);
      path.cubicBezierTo(w * 0.60641, h * 0.99631, w * 0.56955, h * 0.98427, w * 0.54038, h * 0.94777);
    }

    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius, slitWidth, enableSlit } = params;
    const w = width;
    const h = length;
    const paths = [this.generateCutPath(params)];
    const holeY = h * 0.27333;
    paths.push(generateAttachmentHole(w * 0.10571, holeY, holeRadius, slitWidth, 8, enableSlit, params));
    paths.push(generateAttachmentHole(w * 0.89429, holeY, holeRadius, slitWidth, 8, enableSlit, params));
    paths.push(generateAttachmentHole(w * 0.41131, holeY, holeRadius, slitWidth, 8, enableSlit, params));
    paths.push(generateAttachmentHole(w * 0.58869, holeY, holeRadius, slitWidth, 8, enableSlit, params));
    return paths;
  }

  generateScorePaths(_params: TemplateParams): string[] { return []; }
  generateEngravePaths(_params: TemplateParams): string[] { return []; }
}

/**
 * Pauldron: Shoulder armor (23×26mm default).
 * Bilaterally symmetric outline (left half mirrored for right half).
 * Two symmetric head pin holes for minifig attachment.
 * Supports edge styles on the bottom rim arc.
 */
export class Pauldron extends Template {
  generateCutPath(params: TemplateParams): string {
    const w = params.width;
    const h = params.length;
    const path = new SVGPath();
    const edge = getEdgeParams(params, 'mantle');

    // Start point: left edge at rim height (arc starts/ends at rimTopY)
    const rounding = params.mantleRounding as boolean;
    const roundingAmt = (params.mantleRoundingAmount as number) || 0.5;
    const rimTopY = h * 0.7582;
    const rimHalfW = (w * 0.8904 - w * 0.1096) / 2;
    const rimDepth = rounding ? roundingAmt * rimHalfW : 0;
    path.moveTo(w * 0.1096, rimTopY);
    // Left body going UP through shoulder
    path.cubicBezierTo(w * 0.1426, h * 0.6769, w * 0.1547, h * 0.6204, w * 0.1546, h * 0.5471);
    path.cubicBezierTo(w * 0.1544, h * 0.4604, w * 0.1446, h * 0.4359, w * 0.0871, h * 0.3802);
    path.cubicBezierTo(w * 0.0663, h * 0.3600, w * 0.0465, h * 0.3375, w * 0.0405, h * 0.3271);
    path.cubicBezierTo(w * 0.0000, h * 0.2580, w * 0.0005, h * 0.1678, w * 0.0417, h * 0.1038);
    path.cubicBezierTo(w * 0.0691, h * 0.0612, w * 0.1157, h * 0.0281, w * 0.1744, h * 0.0096);
    path.cubicBezierTo(w * 0.2041, h * 0.0003, w * 0.2067, h * 0.0000, w * 0.2603, h * 0.0001);
    path.cubicBezierTo(w * 0.3258, h * 0.0003, w * 0.3497, h * 0.0051, w * 0.4025, h * 0.0285);
    path.cubicBezierTo(w * 0.4427, h * 0.0462, w * 0.4674, h * 0.0662, w * 0.4805, h * 0.0916);
    path.cubicBezierTo(w * 0.4890, h * 0.1081, w * 0.4895, h * 0.1114, w * 0.4893, h * 0.1515);
    path.cubicBezierTo(w * 0.4891, h * 0.1748, w * 0.4887, h * 0.2494, w * 0.4884, h * 0.3172);
    path.lineTo(w * 0.4879, h * 0.4405);
    path.lineTo(w * 0.4726, h * 0.4472);
    path.cubicBezierTo(w * 0.4421, h * 0.4605, w * 0.4295, h * 0.4936, w * 0.4444, h * 0.5213);
    // Channel U-turn
    path.cubicBezierTo(w * 0.4662, h * 0.5623, w * 0.5338, h * 0.5623, w * 0.5556, h * 0.5213);
    // Right half going DOWN through shoulder
    path.cubicBezierTo(w * 0.5705, h * 0.4936, w * 0.5579, h * 0.4605, w * 0.5274, h * 0.4472);
    path.lineTo(w * 0.5121, h * 0.4405);
    path.lineTo(w * 0.5116, h * 0.3172);
    path.cubicBezierTo(w * 0.5113, h * 0.2494, w * 0.5109, h * 0.1748, w * 0.5107, h * 0.1515);
    path.cubicBezierTo(w * 0.5105, h * 0.1114, w * 0.5110, h * 0.1081, w * 0.5195, h * 0.0916);
    path.cubicBezierTo(w * 0.5326, h * 0.0662, w * 0.5573, h * 0.0462, w * 0.5975, h * 0.0285);
    path.cubicBezierTo(w * 0.6503, h * 0.0051, w * 0.6742, h * 0.0003, w * 0.7397, h * 0.0001);
    path.cubicBezierTo(w * 0.7933, h * 0.0000, w * 0.7959, h * 0.0003, w * 0.8256, h * 0.0096);
    path.cubicBezierTo(w * 0.8843, h * 0.0281, w * 0.9309, h * 0.0612, w * 0.9583, h * 0.1038);
    path.cubicBezierTo(w * 0.9995, h * 0.1678, w * 1.0000, h * 0.2580, w * 0.9595, h * 0.3271);
    path.cubicBezierTo(w * 0.9535, h * 0.3375, w * 0.9337, h * 0.3600, w * 0.9129, h * 0.3802);
    path.cubicBezierTo(w * 0.8554, h * 0.4359, w * 0.8456, h * 0.4604, w * 0.8454, h * 0.5471);
    path.cubicBezierTo(w * 0.8453, h * 0.6204, w * 0.8574, h * 0.6769, w * 0.8904, h * 0.7582);

    // Lower semicircle rim: from right transition (0.8904, 0.7582) to left transition (0.1096, 0.7582)
    if (edge.style !== 'none') {
      if (rounding) {
        // Styled edge following the rounded arc — sample arc points and chain styled segments
        const cx = w * 0.5;
        const leftX = w * 0.1096;
        const rightX = w * 0.8904;
        const bottomY = rimTopY + rimDepth;
        const segs = Math.max(3, edge.count);
        const segCount = Math.max(1, Math.round(edge.count / segs));
        // Sample the elliptical arc: parametric t from 0 (right) to PI (left)
        const pts: { x: number; y: number }[] = [];
        for (let i = 0; i <= segs; i++) {
          const t = (i / segs) * Math.PI;
          const px = cx + rimHalfW * Math.cos(t);
          const py = rimTopY + rimDepth * Math.sin(t);
          pts.push({ x: px, y: py });
        }
        // Draw styled edges between consecutive arc sample points
        const countPerSeg = Math.max(1, Math.round(edge.count / segs));
        for (let i = 0; i < pts.length - 1; i++) {
          drawStyledEdge(path, pts[i].x, pts[i].y, pts[i + 1].x, pts[i + 1].y,
            edge.style, edge.depth, countPerSeg, 0, 1, 0, edge.seed + i);
        }
      } else {
        drawStyledEdge(path, w * 0.8904, rimTopY, w * 0.1096, rimTopY,
          edge.style, edge.depth, edge.count, 0, 1, 0, edge.seed);
      }
    } else if (rounding) {
      // Rounding without edge style: smooth U-arc expanding downward
      const cx = w * 0.5;
      const leftX = w * 0.1096;
      const rightX = w * 0.8904;
      const bottomY = rimTopY + rimDepth;
      const k = 0.5522847498; // kappa for quarter-circle bezier approximation
      path.cubicBezierTo(rightX, rimTopY + rimDepth * k, cx + rimHalfW * k, bottomY, cx, bottomY);
      path.cubicBezierTo(cx - rimHalfW * k, bottomY, leftX, rimTopY + rimDepth * k, leftX, rimTopY);
    } else {
      path.cubicBezierTo(w * 0.9116, h * 0.8101, w * 0.9137, h * 0.8230, w * 0.9042, h * 0.8424);
      path.cubicBezierTo(w * 0.8954, h * 0.8605, w * 0.8474, h * 0.9041, w * 0.8150, h * 0.9235);
      path.cubicBezierTo(w * 0.7556, h * 0.9591, w * 0.6846, h * 0.9831, w * 0.6061, h * 0.9942);
      path.cubicBezierTo(w * 0.5354, h * 1.0000, w * 0.4646, h * 1.0000, w * 0.3939, h * 0.9942);
      path.cubicBezierTo(w * 0.3154, h * 0.9831, w * 0.2444, h * 0.9591, w * 0.1850, h * 0.9235);
      path.cubicBezierTo(w * 0.1526, h * 0.9041, w * 0.1046, h * 0.8605, w * 0.0958, h * 0.8424);
      path.cubicBezierTo(w * 0.0863, h * 0.8230, w * 0.0884, h * 0.8101, w * 0.1096, h * 0.7582);
    }
    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length } = params;
    const paths = [this.generateCutPath(params)];
    const holeR = 2.5; // fixed 5mm diameter hole
    const holeCx = width * 0.2482;
    const holeCy = length * 0.2680;
    paths.push(generateAttachmentHole(width - holeCx, holeCy, holeR, 0, 0, false, params));
    paths.push(generateAttachmentHole(holeCx, holeCy, holeR, 0, 0, false, params));
    return paths;
  }

  generateScorePaths(_params: TemplateParams): string[] { return []; }
  generateEngravePaths(_params: TemplateParams): string[] { return []; }
}

/**
 * KamaSplit: Open-front split kama — two separate hanging skirt panels (samurai style).
 * Each side panel: outer tab at top, panel widens toward the bottom, styled hem edge.
 * Front center gap divides the two panels. Default 50×22mm.
 */
export class KamaSplit extends Template {
  generateCutPath(params: TemplateParams): string {
    const w = params.width;
    const h = params.length;
    const path = new SVGPath();
    const edge = getEdgeParams(params, 'kama');

    // Gap fraction in center (20% of width on each side of center)
    const gapHalf = 0.08;
    // Right panel
    const rInner = 0.50 + gapHalf; // right panel inner edge X
    const rOuter = 1.0;

    // --- RIGHT PANEL ---
    // Start at top-right of right panel (waistband)
    path.moveTo(w * rOuter * 0.96, h * 0.003);
    // Top waistband to inner edge
    path.lineTo(w * rInner, h * 0.003);
    // Inner edge going down
    path.cubicBezierTo(w * rInner, h * 0.10, w * (rInner - 0.01), h * 0.50, w * (rInner - 0.02), h * 0.88);
    // Bottom edge: inner to outer (styled)
    const rBotInX = w * (rInner - 0.02);
    const rBotInY = h * 0.88;
    const rBotOutX = w * 0.90;
    const rBotOutY = h * 0.92;
    if (edge.style !== 'none') {
      drawStyledEdge(path, rBotInX, rBotInY, rBotOutX, rBotOutY,
        edge.style, edge.depth, edge.count, 0, 1, 0, edge.seed);
    } else {
      path.cubicBezierTo(w * 0.62, h * 0.96, w * 0.78, h * 0.97, rBotOutX, rBotOutY);
    }
    // Right outer side going up
    path.cubicBezierTo(w * 0.94, h * 0.85, w * 0.96, h * 0.60, w * 0.97, h * 0.42);
    path.cubicBezierTo(w * 0.98, h * 0.25, w * 0.98, h * 0.08, w * 0.96, h * 0.003);
    path.closePath();

    // --- LEFT PANEL (mirror) ---
    const lInner = 0.50 - gapHalf;
    path.moveTo(w * 0.04, h * 0.003);
    path.lineTo(w * lInner, h * 0.003);
    // Inner edge going down
    path.cubicBezierTo(w * lInner, h * 0.10, w * (lInner + 0.01), h * 0.50, w * (lInner + 0.02), h * 0.88);
    // Bottom edge: inner to outer (styled)
    const lBotInX = w * (lInner + 0.02);
    const lBotInY = h * 0.88;
    const lBotOutX = w * 0.10;
    const lBotOutY = h * 0.92;
    if (edge.style !== 'none') {
      drawStyledEdge(path, lBotInX, lBotInY, lBotOutX, lBotOutY,
        edge.style, edge.depth, edge.count, 0, 1, 0, edge.seed + 1);
    } else {
      path.cubicBezierTo(w * 0.38, h * 0.96, w * 0.22, h * 0.97, lBotOutX, lBotOutY);
    }
    // Left outer side going up
    path.cubicBezierTo(w * 0.06, h * 0.85, w * 0.04, h * 0.60, w * 0.03, h * 0.42);
    path.cubicBezierTo(w * 0.02, h * 0.25, w * 0.02, h * 0.08, w * 0.04, h * 0.003);
    path.closePath();

    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius, slitWidth, enableSlit } = params;
    const paths = [this.generateCutPath(params)];
    const holeY = length * 0.15;
    // One attachment hole in each panel near the waistband
    paths.push(generateAttachmentHole(width * 0.20, holeY, holeRadius, slitWidth, 8, enableSlit, params));
    paths.push(generateAttachmentHole(width * 0.80, holeY, holeRadius, slitWidth, 8, enableSlit, params));
    return paths;
  }

  generateScorePaths(_params: TemplateParams): string[] { return []; }
  generateEngravePaths(_params: TemplateParams): string[] { return []; }
}

/**
 * KamaWaistCape: Half-cape kama covering the back — no center slit.
 * Wraps hip to hip. Flat waistband, curved sides, styled bottom hem.
 * Default 44×16mm.
 */
export class KamaWaistCape extends Template {
  generateCutPath(params: TemplateParams): string {
    const w = params.width;
    const h = params.length;
    const path = new SVGPath();
    const edge = getEdgeParams(params, 'kama');

    // Top waistband
    path.moveTo(w * 0.03, h * 0.04);
    path.cubicBezierTo(w * 0.20, h * 0.00, w * 0.80, h * 0.00, w * 0.97, h * 0.04);

    // Right side going down
    path.cubicBezierTo(w * 1.00, h * 0.12, w * 0.99, h * 0.35, w * 0.96, h * 0.55);
    path.cubicBezierTo(w * 0.94, h * 0.70, w * 0.90, h * 0.82, w * 0.85, h * 0.88);

    // Bottom hem (styled)
    if (edge.style !== 'none') {
      drawStyledEdge(path, w * 0.85, h * 0.88, w * 0.15, h * 0.88,
        edge.style, edge.depth, edge.count, 0, 1, 0, edge.seed);
    } else {
      path.cubicBezierTo(w * 0.72, h * 0.96, w * 0.58, h * 1.00, w * 0.50, h * 1.00);
      path.cubicBezierTo(w * 0.42, h * 1.00, w * 0.28, h * 0.96, w * 0.15, h * 0.88);
    }

    // Left side going up
    path.cubicBezierTo(w * 0.10, h * 0.82, w * 0.06, h * 0.70, w * 0.04, h * 0.55);
    path.cubicBezierTo(w * 0.01, h * 0.35, w * 0.00, h * 0.12, w * 0.03, h * 0.04);

    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius, slitWidth, enableSlit } = params;
    const paths = [this.generateCutPath(params)];
    const holeY = length * 0.18;
    paths.push(generateAttachmentHole(width * 0.25, holeY, holeRadius, slitWidth, 8, enableSlit, params));
    paths.push(generateAttachmentHole(width * 0.75, holeY, holeRadius, slitWidth, 8, enableSlit, params));
    return paths;
  }

  generateScorePaths(_params: TemplateParams): string[] { return []; }
  generateEngravePaths(_params: TemplateParams): string[] { return []; }
}

/**
 * PauldronSingle: Asymmetric single-shoulder pad (gladiator style).
 * One large shoulder plate + narrow strap on the other side.
 * Styled bottom rim. Default 20×24mm.
 */
export class PauldronSingle extends Template {
  generateCutPath(params: TemplateParams): string {
    const w = params.width;
    const h = params.length;
    const path = new SVGPath();
    const edge = getEdgeParams(params, 'mantle');

    // Start at top-left (strap side)
    path.moveTo(w * 0.20, h * 0.005);
    // Top edge across to right shoulder
    path.cubicBezierTo(w * 0.40, h * 0.00, w * 0.65, h * 0.00, w * 0.80, h * 0.01);
    // Right shoulder dome
    path.cubicBezierTo(w * 0.92, h * 0.03, w * 0.99, h * 0.10, w * 1.00, h * 0.22);
    path.cubicBezierTo(w * 1.00, h * 0.36, w * 0.97, h * 0.50, w * 0.93, h * 0.62);
    path.cubicBezierTo(w * 0.90, h * 0.72, w * 0.87, h * 0.80, w * 0.83, h * 0.87);

    // Bottom rim (styled)
    if (edge.style !== 'none') {
      drawStyledEdge(path, w * 0.83, h * 0.87, w * 0.15, h * 0.87,
        edge.style, edge.depth, edge.count, 0, 1, 0, edge.seed);
    } else {
      path.cubicBezierTo(w * 0.75, h * 0.95, w * 0.55, h * 1.00, w * 0.42, h * 1.00);
      path.cubicBezierTo(w * 0.30, h * 0.99, w * 0.20, h * 0.95, w * 0.15, h * 0.87);
    }

    // Left strap side going up
    path.cubicBezierTo(w * 0.10, h * 0.75, w * 0.06, h * 0.55, w * 0.04, h * 0.40);
    path.cubicBezierTo(w * 0.02, h * 0.25, w * 0.005, h * 0.12, w * 0.01, h * 0.06);
    path.cubicBezierTo(w * 0.03, h * 0.02, w * 0.10, h * 0.005, w * 0.20, h * 0.005);

    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length } = params;
    const paths = [this.generateCutPath(params)];
    // Single head pin hole
    const holeR = 2.5; // fixed 5mm diameter hole
    const holeCx = width * 0.60;
    const holeCy = length * 0.22;
    const hole = new SVGPath();
    hole.moveTo(holeCx + holeR, holeCy);
    hole.arcTo(holeR, holeR, 0, 1, 1, holeCx - holeR, holeCy);
    hole.arcTo(holeR, holeR, 0, 1, 1, holeCx + holeR, holeCy);
    hole.closePath();
    paths.push(hole.toString());
    return paths;
  }

  generateScorePaths(_params: TemplateParams): string[] { return []; }
  generateEngravePaths(_params: TemplateParams): string[] { return []; }
}

/**
 * PauldronWide: Extended pauldron with wider shoulder coverage.
 * Same neck channel structure as standard, wider shoulders and rim.
 * Styled bottom rim. Default 28×24mm.
 */
export class PauldronWide extends Template {
  generateCutPath(params: TemplateParams): string {
    const w = params.width;
    const h = params.length;
    const path = new SVGPath();
    const edge = getEdgeParams(params, 'mantle');

    // Start at bottom-left approaching left side
    path.moveTo(w * 0.35, h * 0.9942);
    // Left side rises
    path.cubicBezierTo(w * 0.25, h * 0.97, w * 0.15, h * 0.92, w * 0.08, h * 0.84);
    path.cubicBezierTo(w * 0.02, h * 0.74, w * 0.00, h * 0.60, w * 0.01, h * 0.46);
    path.cubicBezierTo(w * 0.03, h * 0.32, w * 0.08, h * 0.20, w * 0.16, h * 0.10);
    path.cubicBezierTo(w * 0.22, h * 0.04, w * 0.30, h * 0.01, w * 0.38, h * 0.003);
    // Top to neck (left) — straight line across
    path.cubicBezierTo(w * 0.42, h * 0.00, w * 0.44, h * 0.00, w * 0.46, h * 0.005);
    path.lineTo(w * 0.54, h * 0.005);
    // Top to right shoulder
    path.cubicBezierTo(w * 0.56, h * 0.00, w * 0.58, h * 0.00, w * 0.62, h * 0.003);
    path.cubicBezierTo(w * 0.70, h * 0.01, w * 0.78, h * 0.04, w * 0.84, h * 0.10);
    // Right side descends
    path.cubicBezierTo(w * 0.92, h * 0.20, w * 0.97, h * 0.32, w * 0.99, h * 0.46);
    path.cubicBezierTo(w * 1.00, h * 0.60, w * 0.98, h * 0.74, w * 0.92, h * 0.84);
    path.cubicBezierTo(w * 0.85, h * 0.92, w * 0.75, h * 0.97, w * 0.65, h * 0.9942);

    // Bottom rim (styled)
    if (edge.style !== 'none') {
      drawStyledEdge(path, w * 0.65, h * 0.9942, w * 0.35, h * 0.9942,
        edge.style, edge.depth, edge.count, 0, 1, 0, edge.seed);
    } else {
      path.cubicBezierTo(w * 0.55, h * 1.00, w * 0.45, h * 1.00, w * 0.35, h * 0.9942);
    }
    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length } = params;
    const paths = [this.generateCutPath(params)];
    const holeR = 2.5; // fixed 5mm diameter hole
    const holeCx = width * 0.26;
    const holeCy = length * 0.24;
    const hole1 = new SVGPath();
    hole1.moveTo(holeCx + holeR, holeCy);
    hole1.arcTo(holeR, holeR, 0, 1, 1, holeCx - holeR, holeCy);
    hole1.arcTo(holeR, holeR, 0, 1, 1, holeCx + holeR, holeCy);
    hole1.closePath();
    paths.push(hole1.toString());
    const rcx = width - holeCx;
    const hole2 = new SVGPath();
    hole2.moveTo(rcx + holeR, holeCy);
    hole2.arcTo(holeR, holeR, 0, 1, 1, rcx - holeR, holeCy);
    hole2.arcTo(holeR, holeR, 0, 1, 1, rcx + holeR, holeCy);
    hole2.closePath();
    paths.push(hole2.toString());
    return paths;
  }

  generateScorePaths(_params: TemplateParams): string[] { return []; }
  generateEngravePaths(_params: TemplateParams): string[] { return []; }
}

/**
 * Get sail grommet radius from params
 */
function getSailHoleRadius(params: TemplateParams): number {
  const holeType = (params.sailHoleType as string) || 'grommet';
  const standard = SAIL_HOLE_STANDARDS[holeType as SailHoleType];
  return standard ? standard.radius : SAIL_HOLE_STANDARDS.grommet.radius;
}

/** Parse extra grommet positions from JSON param and generate hole paths. */
function generateExtraGrommetPaths(params: TemplateParams): string[] {
  const json = (params.sailExtraGrommets as string) || '[]';
  const r = getSailHoleRadius(params);
  try {
    const extras: Array<{ x: number; y: number }> = JSON.parse(json);
    if (!Array.isArray(extras)) return [];
    return extras.map(g => circlePath(g.x, g.y, r));
  } catch { return []; }
}

/** Generate crosshair score marks for extra grommets. */
function generateExtraGrommetCrosshairs(params: TemplateParams): string[] {
  const json = (params.sailExtraGrommets as string) || '[]';
  const r = getSailHoleRadius(params);
  try {
    const extras: Array<{ x: number; y: number }> = JSON.parse(json);
    if (!Array.isArray(extras)) return [];
    return buildGrommetCrosshairs(extras, r);
  } catch { return []; }
}

/**
 * Intersect two finite line segments p1→p2 and p3→p4.
 * Returns the intersection point if the segments cross strictly within their
 * interiors (t ∈ (0,1), u ∈ (0,1)), or null if they don't cross.
 */
function segmentIntersection(
  p1: { x: number; y: number }, p2: { x: number; y: number },
  p3: { x: number; y: number }, p4: { x: number; y: number }
): { x: number; y: number } | null {
  const d1x = p2.x - p1.x, d1y = p2.y - p1.y;
  const d2x = p4.x - p3.x, d2y = p4.y - p3.y;
  const cross = d1x * d2y - d1y * d2x;
  if (Math.abs(cross) < 1e-9) return null;
  const dx = p3.x - p1.x, dy = p3.y - p1.y;
  const t = (dx * d2y - dy * d2x) / cross;
  const u = (dx * d1y - dy * d1x) / cross;
  if (t > 0 && t < 1 && u > 0 && u < 1) {
    return { x: p1.x + t * d1x, y: p1.y + t * d1y };
  }
  return null;
}

/**
 * Build a sail cut path from a CW polygon of grommet corners.
 * Each corner gets a grommet-radius arc; edges between corners get decorative styles.
 * Outward direction for each edge is computed as the right-perpendicular (CW polygon, Y-down).
 */
function buildSailCutPath(
  corners: Array<{ x: number; y: number }>,
  r: number,
  edgeStyles: string[],
  edgeDepths: number[],
  count: number,
  safeInset: number,
  tornSeed: number = 42
): string {
  const n = corners.length;
  const path = new SVGPath();

  // Compute outward perpendicular offset points for each corner (Minkowski offset).
  // At each corner, the departure is offset along the outgoing edge's outward normal,
  // and the arrival is offset along the incoming edge's outward normal.
  // This ensures every point on the outline is exactly r from the nearest corner center.
  const arrivals: Array<{ x: number; y: number }> = [];
  const departures: Array<{ x: number; y: number }> = [];
  const crossProducts: number[] = [];

  for (let i = 0; i < n; i++) {
    const prev = corners[(i - 1 + n) % n];
    const curr = corners[i];
    const next = corners[(i + 1) % n];

    // Incoming edge (prev → curr) outward normal
    const inDx = curr.x - prev.x;
    const inDy = curr.y - prev.y;
    const inLen = Math.hypot(inDx, inDy) || 1;
    const inNx = inDy / inLen;   // outward normal X (CW polygon, Y-down)
    const inNy = -inDx / inLen;  // outward normal Y

    // Outgoing edge (curr → next) outward normal
    const outDx = next.x - curr.x;
    const outDy = next.y - curr.y;
    const outLen = Math.hypot(outDx, outDy) || 1;
    const outNx = outDy / outLen;
    const outNy = -outDx / outLen;

    // Cross product to detect concave corners (negative = concave for CW, Y-down)
    crossProducts.push(inDx * outDy - inDy * outDx);

    arrivals.push({
      x: curr.x + inNx * r,
      y: curr.y + inNy * r,
    });
    departures.push({
      x: curr.x + outNx * r,
      y: curr.y + outNy * r,
    });
  }

  // Pre-compute clipping at concave corners: when adjacent offset edge segments
  // cross each other, clip both at their intersection to prevent self-intersecting paths.
  const effArrivals = arrivals.map(a => ({ ...a }));
  const effDepartures = departures.map(d => ({ ...d }));
  const skipCorner: boolean[] = new Array(n).fill(false);

  for (let ci = 0; ci < n; ci++) {
    if (crossProducts[ci] >= 0) continue; // convex: no clipping needed
    // Edge arriving at ci: departures[prev] → arrivals[ci]
    // Edge departing ci:   departures[ci]   → arrivals[next]
    const prevEdge = (ci - 1 + n) % n;
    const nextCorner = (ci + 1) % n;
    const inter = segmentIntersection(
      departures[prevEdge], arrivals[ci],
      departures[ci], arrivals[nextCorner]
    );
    if (inter) {
      effArrivals[ci] = inter;
      effDepartures[ci] = inter;
      skipCorner[ci] = true;
    }
  }

  // Start at departure of first corner
  path.moveTo(effDepartures[0].x, effDepartures[0].y);

  for (let i = 0; i < n; i++) {
    const nextIdx = (i + 1) % n;
    const curr = corners[i];
    const next = corners[nextIdx];

    // Outward normal of this edge (for styled edge decoration direction)
    const edx = next.x - curr.x;
    const edy = next.y - curr.y;
    const edLen = Math.hypot(edx, edy) || 1;
    const outX = edy / edLen;
    const outY = -edx / edLen;

    // Styled edge from effective departure[i] to effective arrival[nextIdx]
    drawStyledEdge(
      path, effDepartures[i].x, effDepartures[i].y,
      effArrivals[nextIdx].x, effArrivals[nextIdx].y,
      edgeStyles[i], edgeDepths[i] ?? 3, count, outX, outY, safeInset, tornSeed + i
    );

    // Corner at nextIdx
    if (skipCorner[nextIdx]) {
      // Adjacent offset edges already meet at their intersection — no connector needed
    } else if (crossProducts[nextIdx] >= 0) {
      // Convex corner: arc connecting arrival to departure
      path.arcTo(r, r, 0, 0, 1, effDepartures[nextIdx].x, effDepartures[nextIdx].y);
    } else {
      // Concave corner, edges don't cross within their segments:
      // connect with a straight line instead of a deep miter V-notch
      path.lineTo(effDepartures[nextIdx].x, effDepartures[nextIdx].y);
    }
  }

  path.closePath();
  return path.toString();
}

/**
 * Build blue score crosshair marks at each grommet center for centering reference.
 */
function buildGrommetCrosshairs(
  grommets: Array<{ x: number; y: number }>,
  r: number
): string[] {
  const arm = r + 1; // cross arm length
  return grommets.map((g) => {
    const cross = new SVGPath();
    cross.moveTo(g.x - arm, g.y);
    cross.lineTo(g.x + arm, g.y);
    cross.moveTo(g.x, g.y - arm);
    cross.lineTo(g.x, g.y + arm);
    return cross.toString();
  });
}

/**
 * Compute sail outline bounds that guarantee a minimum gap outside all grommet holes.
 * Returns { left, top, right, bottom } for the outline rectangle.
 */
function sailOutlineBounds(
  grommets: Array<{ x: number; y: number }>,
  holeR: number,
  gap: number,
  w: number,
  h: number
): { left: number; top: number; right: number; bottom: number } {
  const margin = holeR + gap; // distance from grommet center to outline
  let left = 0, top = 0, right = w, bottom = h;
  for (const g of grommets) {
    left = Math.min(left, g.x - margin);
    top = Math.min(top, g.y - margin);
    right = Math.max(right, g.x + margin);
    bottom = Math.max(bottom, g.y + margin);
  }
  return { left, top, right, bottom };
}

/**
 * Square Sail: rectangular outline or grommet-locked quadrilateral.
 * Outline always sits at least 1.5mm outside every grommet hole edge.
 * Blue score line shows the inner grommet boundary rectangle.
 */
export class SailSquare extends Template {
  private getGrommets(params: TemplateParams) {
    const w = params.width;
    const h = params.length;
    return [
      { x: (params.sailGrommetTLx as number) || 4, y: (params.sailGrommetTLy as number) || 4 },
      { x: w - ((params.sailGrommetTRx as number) || 4), y: (params.sailGrommetTRy as number) || 4 },
      { x: w - ((params.sailGrommetBRx as number) || 4), y: h - ((params.sailGrommetBRy as number) || 4) },
      { x: (params.sailGrommetBLx as number) || 4, y: h - ((params.sailGrommetBLy as number) || 4) },
    ];
  }

  generateCutPath(params: TemplateParams): string {
    const w = params.width;
    const h = params.length;
    const holeR = getSailHoleRadius(params);
    const gap = (params.sailGrommetMargin as number) ?? 3;
    const grommets = this.getGrommets(params);
    const lockCorners = !!params.sailLockCorners;

    if (lockCorners) {
      const margin = holeR + gap;
      const edgeStyles = [
        (params.sailTopStyle as string) || 'none',
        (params.sailRightStyle as string) || 'none',
        (params.sailBottomStyle as string) || 'none',
        (params.sailLeftStyle as string) || 'none',
      ];
      const globalDepth = (params.sailEdgeDepth as number) || 3;
      const edgeDepths = [
        (params.sailTopDepth as number) || globalDepth,
        (params.sailRightDepth as number) || globalDepth,
        (params.sailBottomDepth as number) || globalDepth,
        (params.sailLeftDepth as number) || globalDepth,
      ];
      const count = (params.sailEdgeCount as number) || 6;
      const tornSeed = (params.sailTornSeed as number) || 42;
      return buildSailCutPath(grommets, margin, edgeStyles, edgeDepths, count, 2, tornSeed);
    }

    // Outline rectangle: always gap mm outside every grommet hole edge
    const { left, top, right, bottom } = sailOutlineBounds(grommets, holeR, gap, w, h);
    const r = 1.5;
    const topStyle = (params.sailTopStyle as string) || 'none';
    const bottomStyle = (params.sailBottomStyle as string) || 'none';
    const leftStyle = (params.sailLeftStyle as string) || 'none';
    const rightStyle = (params.sailRightStyle as string) || 'none';
    const globalDepth = (params.sailEdgeDepth as number) || 3;
    const topDepth = (params.sailTopDepth as number) || globalDepth;
    const bottomDepth = (params.sailBottomDepth as number) || globalDepth;
    const leftDepth = (params.sailLeftDepth as number) || globalDepth;
    const rightDepth = (params.sailRightDepth as number) || globalDepth;
    const count = (params.sailEdgeCount as number) || 6;
    const tornSeed = (params.sailTornSeed as number) || 42;
    const safeInset = 0;

    const path = new SVGPath();
    path.moveTo(left + r, top);
    drawStyledEdge(path, left + r, top, right - r, top, topStyle, topDepth, count, 0, -1, safeInset, tornSeed);
    path.arcTo(r, r, 0, 0, 1, right, top + r);
    drawStyledEdge(path, right, top + r, right, bottom - r, rightStyle, rightDepth, count, 1, 0, safeInset, tornSeed + 1);
    path.arcTo(r, r, 0, 0, 1, right - r, bottom);
    drawStyledEdge(path, right - r, bottom, left + r, bottom, bottomStyle, bottomDepth, count, 0, 1, safeInset, tornSeed + 2);
    path.arcTo(r, r, 0, 0, 1, left, bottom - r);
    drawStyledEdge(path, left, bottom - r, left, top + r, leftStyle, leftDepth, count, -1, 0, safeInset, tornSeed + 3);
    path.arcTo(r, r, 0, 0, 1, left + r, top);
    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const r = getSailHoleRadius(params);
    const paths = [this.generateCutPath(params)];
    for (const g of this.getGrommets(params)) paths.push(circlePath(g.x, g.y, r));
    paths.push(...generateExtraGrommetPaths(params));
    return paths;
  }

  generateScorePaths(params: TemplateParams): string[] {
    const holeR = getSailHoleRadius(params);
    const grommets = this.getGrommets(params);
    const scores: string[] = [];

    // Inner boundary rectangle connecting grommet positions (blue score line)
    const inner = new SVGPath();
    inner.moveTo(grommets[0].x, grommets[0].y);
    inner.lineTo(grommets[1].x, grommets[1].y);
    inner.lineTo(grommets[2].x, grommets[2].y);
    inner.lineTo(grommets[3].x, grommets[3].y);
    inner.closePath();
    scores.push(inner.toString());

    // Crosshairs at each grommet center
    scores.push(...buildGrommetCrosshairs(grommets, holeR));
    scores.push(...generateExtraGrommetCrosshairs(params));
    return scores;
  }

  generateEngravePaths(_params: TemplateParams): string[] {
    return [];
  }
}

/**
 * Triangular Sail: full triangle or grommet-locked triangle.
 * Outline always sits at least 1.5mm outside every grommet hole edge.
 * Blue score line shows the inner grommet boundary triangle.
 */
export class SailTriangular extends Template {
  private getGrommets(params: TemplateParams) {
    const w = params.width;
    const h = params.length;
    return [
      { x: (params.sailGrommetTLx as number) || 4, y: (params.sailGrommetTLy as number) || 4 },
      { x: w - ((params.sailGrommetBRx as number) || 4), y: h - ((params.sailGrommetBRy as number) || 4) },
      { x: (params.sailGrommetBLx as number) || 4, y: h - ((params.sailGrommetBLy as number) || 4) },
    ];
  }

  generateCutPath(params: TemplateParams): string {
    const w = params.width;
    const h = params.length;
    const holeR = getSailHoleRadius(params);
    const gap = (params.sailGrommetMargin as number) ?? 3;
    const grommets = this.getGrommets(params);
    const lockCorners = !!params.sailLockCorners;

    if (lockCorners) {
      const margin = holeR + gap;
      const edgeStyles = [
        'none',
        (params.sailBottomStyle as string) || 'none',
        (params.sailLeftStyle as string) || 'none',
      ];
      const globalDepth = (params.sailEdgeDepth as number) || 3;
      const edgeDepths = [
        globalDepth,
        (params.sailBottomDepth as number) || globalDepth,
        (params.sailLeftDepth as number) || globalDepth,
      ];
      const count = (params.sailEdgeCount as number) || 6;
      const tornSeed = (params.sailTornSeed as number) || 42;
      return buildSailCutPath(grommets, margin, edgeStyles, edgeDepths, count, 2, tornSeed);
    }

    // Outline triangle: always gap mm outside every grommet hole edge
    const { left, top, right, bottom } = sailOutlineBounds(grommets, holeR, gap, w, h);
    const bottomStyle = (params.sailBottomStyle as string) || 'none';
    const leftStyle = (params.sailLeftStyle as string) || 'none';
    const globalDepth = (params.sailEdgeDepth as number) || 3;
    const bottomDepth = (params.sailBottomDepth as number) || globalDepth;
    const leftDepth = (params.sailLeftDepth as number) || globalDepth;
    const count = (params.sailEdgeCount as number) || 6;
    const tornSeed = (params.sailTornSeed as number) || 42;
    const safeInset = 0;

    const path = new SVGPath();
    path.moveTo(left, top);
    path.lineTo(right, bottom);
    drawStyledEdge(path, right, bottom, left, bottom, bottomStyle, bottomDepth, count, 0, 1, safeInset, tornSeed + 2);
    drawStyledEdge(path, left, bottom, left, top, leftStyle, leftDepth, count, -1, 0, safeInset, tornSeed + 3);
    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const r = getSailHoleRadius(params);
    const paths = [this.generateCutPath(params)];
    for (const g of this.getGrommets(params)) paths.push(circlePath(g.x, g.y, r));
    paths.push(...generateExtraGrommetPaths(params));
    return paths;
  }

  generateScorePaths(params: TemplateParams): string[] {
    const holeR = getSailHoleRadius(params);
    const grommets = this.getGrommets(params);
    const scores: string[] = [];

    // Inner boundary triangle connecting grommet positions (blue score line)
    const inner = new SVGPath();
    inner.moveTo(grommets[0].x, grommets[0].y);
    inner.lineTo(grommets[1].x, grommets[1].y);
    inner.lineTo(grommets[2].x, grommets[2].y);
    inner.closePath();
    scores.push(inner.toString());

    // Crosshairs at each grommet center
    scores.push(...buildGrommetCrosshairs(grommets, holeR));
    scores.push(...generateExtraGrommetCrosshairs(params));
    return scores;
  }

  generateEngravePaths(_params: TemplateParams): string[] {
    return [];
  }
}

/**
 * Polygon Sail: regular polygon with N sides (5-12), one grommet at each vertex.
 * Grommets are placed at regular polygon vertices inset from the bounding box.
 * Outline is the Minkowski offset of the grommet polygon by holeR + gap.
 */
export class SailPolygon extends Template {
  private getGrommets(params: TemplateParams) {
    const w = params.width;
    const h = params.length;
    const sides = Math.max(5, Math.min(12, (params.sailSides as number) || 6));
    const inset = (params.sailPolygonInset as number) ?? 4;
    const cx = w / 2;
    const cy = h / 2;
    const rx = w / 2 - inset;
    const ry = h / 2 - inset;
    const mask = (params.sailPolygonGrommetMask as string) || '';

    // Check for custom positions
    let customPositions: Array<{ x: number; y: number }> = [];
    try {
      customPositions = JSON.parse((params.sailPolygonGrommetPositions as string) || '[]');
    } catch { customPositions = []; }

    const grommets: Array<{ x: number; y: number; enabled: boolean }> = [];
    for (let i = 0; i < sides; i++) {
      const enabled = mask.length >= sides ? mask[i] !== '0' : true;
      if (customPositions.length === sides && customPositions[i]) {
        grommets.push({ x: customPositions[i].x, y: customPositions[i].y, enabled });
      } else {
        const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
        grommets.push({
          x: cx + rx * Math.cos(angle),
          y: cy + ry * Math.sin(angle),
          enabled,
        });
      }
    }
    return grommets;
  }

  generateCutPath(params: TemplateParams): string {
    const holeR = getSailHoleRadius(params);
    const gap = (params.sailGrommetMargin as number) ?? 3;
    const grommets = this.getGrommets(params);
    const margin = holeR + gap;
    const sides = grommets.length;
    const edgeStyles: string[] = new Array(sides).fill('none');
    const globalDepth = (params.sailEdgeDepth as number) || 3;
    const edgeDepths: number[] = new Array(sides).fill(globalDepth);
    const count = (params.sailEdgeCount as number) || 6;
    const tornSeed = (params.sailTornSeed as number) || 42;
    return buildSailCutPath(grommets, margin, edgeStyles, edgeDepths, count, 2, tornSeed);
  }

  generateCutPaths(params: TemplateParams): string[] {
    const r = getSailHoleRadius(params);
    const paths = [this.generateCutPath(params)];
    for (const g of this.getGrommets(params)) {
      if (g.enabled) paths.push(circlePath(g.x, g.y, r));
    }
    paths.push(...generateExtraGrommetPaths(params));
    return paths;
  }

  generateScorePaths(params: TemplateParams): string[] {
    const holeR = getSailHoleRadius(params);
    const grommets = this.getGrommets(params);
    const scores: string[] = [];

    const inner = new SVGPath();
    inner.moveTo(grommets[0].x, grommets[0].y);
    for (let i = 1; i < grommets.length; i++) {
      inner.lineTo(grommets[i].x, grommets[i].y);
    }
    inner.closePath();
    scores.push(inner.toString());

    scores.push(...buildGrommetCrosshairs(grommets.filter(g => g.enabled), holeR));
    scores.push(...generateExtraGrommetCrosshairs(params));
    return scores;
  }

  generateEngravePaths(_params: TemplateParams): string[] {
    return [];
  }
}
