/**
 * Additional template generators
 * Flags, banners, wings, kama, pauldron, and cloak
 */

import { Template, TemplateParams, generateAttachmentHole } from './base';
import { SVGPath, stadiumPath, circlePath } from '../geometry/primitives';
import { SAIL_HOLE_STANDARDS, SailHoleType } from '../utils/constants';

/**
 * Banner-shaped flag base class.
 * Small and large flags have DISTINCT outlines traced from separate SVG templates:
 *   - SmallFlag_Correct.svg: single flame tongue, narrower body
 *   - LargeFlag.svg: three flame tongues, wider body
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

// ── SmallFlag body (from SmallFlag_Correct.svg subpath 0) ──
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

// ── LargeFlag body (from LargeFlag.svg subpath 0) ──
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
  private generateStyledFlagPath(params: TemplateParams): string {
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

    // Start top-left, go clockwise
    path.moveTo(margin + r, margin);
    path.lineTo(w - margin - r, margin);
    path.arcTo(r, r, 0, 0, 1, w - margin, margin + r);

    // Right edge (top to bottom) — ends at bodyBottom
    this.drawStyledSideEdge(path, w - margin, margin + r, w - margin, bodyBottom, rightStyle, sideDepth, sideCount, 1);

    // Bottom edge — decorations extend from bodyBottom down to h-margin (within bounds)
    this.drawStyledBottomEdge(path, w, h, margin, bottomStyle, depth, count, bottomExt);

    // Left edge (bottom to top) — starts from bodyBottom
    this.drawStyledSideEdge(path, margin, bodyBottom, margin, margin + r, leftStyle, sideDepth, sideCount, -1);
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
        path.lineTo(x, y2);
    }
  }

  private drawStyledBottomEdge(
    path: SVGPath, w: number, h: number, margin: number,
    style: string, depthParam: number, count: number, bottomExt: number
  ): void {
    const bottomY = h - margin;           // absolute bottom edge of bounding box
    const bodyBottom = bottomY - bottomExt; // raised baseline where the body ends
    const leftX = margin;
    const rightX = w - margin;
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
        // Shifted up so flame tips reach bottomY but don't exceed it
        const flameCount = count || 5;
        const segW = usableW / flameCount;
        const flameH = bottomExt; // = h * Math.min(depthParam || 0.15, 0.4)
        for (let i = 0; i < flameCount; i++) {
          const x0 = rightX - i * segW;
          const x1 = rightX - (i + 1) * segW;
          const cx1 = x0 - segW * 0.3;
          const cx2 = x0 - segW * 0.7;
          path.cubicBezierTo(cx1, bottomY, cx2, bodyBottom - flameH * 0.5, x1, bodyBottom);
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
        // Teeth alternate between bottomY and bodyBottom
        const zzCount = count || 8;
        const segW = usableW / zzCount;
        for (let i = 0; i < zzCount; i++) {
          const x = rightX - (i + 0.5) * segW;
          const y = (i % 2 === 0) ? bottomY : bodyBottom;
          path.lineTo(x, y);
        }
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
      default:
        path.lineTo(leftX, bodyBottom);
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
    paths.push(stadiumPath(px(shape.hole1X), py(shape.holeY), HOLE_HALF_FLAT_MM, HOLE_RADIUS_MM));
    paths.push(stadiumPath(px(shape.hole2X), py(shape.holeY), HOLE_HALF_FLAT_MM, HOLE_RADIUS_MM));

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
 * Shape from SmallFlag_Correct.svg
 */
export class FlagSmall extends BannerFlag {
  protected shape = SMALL_FLAG;

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
 * Shape from LargeFlag.svg
 */
export class FlagLarge extends BannerFlag {
  protected shape = LARGE_FLAG;

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
 * Banner: Vertical hanging banner (40×50mm default)
 * Features: horizontal rod pocket at top (score line), decorative bottom edge
 * Can be swallowtail, pointed, or straight bottom
 */
export class Banner extends Template {
  generateCutPath(params: TemplateParams): string {
    const w = params.width;
    const h = params.length;
    const path = new SVGPath();
    const pocketH = 3; // rod pocket height
    const r = 1; // corner rounding

    // Start top-left corner
    path.moveTo(r, 0);
    path.lineTo(w - r, 0);
    path.arcTo(r, r, 0, 0, 1, w, r);

    // Right edge straight down (shortened to make room for tail)
    const tailDepth = h * 0.15;
    const bodyBottom = h - tailDepth;
    path.lineTo(w, bodyBottom);

    // Bottom edge: swallowtail cut within bounds
    const cx = w / 2;
    path.lineTo(cx + 2, bodyBottom);
    path.lineTo(cx, h);  // tip at bounding box bottom
    path.lineTo(cx - 2, bodyBottom);

    // Left edge up
    path.lineTo(0, bodyBottom);
    path.lineTo(0, r);
    path.arcTo(r, r, 0, 0, 1, r, 0);
    path.closePath();
    return path.toString();
  }

  generateScorePaths(params: TemplateParams): string[] {
    const w = params.width;
    const pocketH = 3;
    // Rod pocket fold line across the top
    const score = new SVGPath();
    score.moveTo(1, pocketH);
    score.lineTo(w - 1, pocketH);
    return [score.toString()];
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, holeRadius, slitWidth, enableSlit } = params;
    const paths = [this.generateCutPath(params)];
    // Two attachment holes at top for rod/bar
    const holeY = 1.5;
    const holeInset = width * 0.2;
    paths.push(generateAttachmentHole(holeInset, holeY, holeRadius, slitWidth, 8, enableSlit));
    paths.push(generateAttachmentHole(width - holeInset, holeY, holeRadius, slitWidth, 8, enableSlit));
    return paths;
  }

  generateEngravePaths(params: TemplateParams): string[] {
    return [];
  }
}

/**
 * Wings: Symmetric paired butterfly/angel wings (60×50mm default)
 * Two separate wing shapes joined at a center spine for neck attachment
 * Features: feathered outer edges, center column with holes
 */
export class Wings extends Template {
  generateCutPath(params: TemplateParams): string {
    const w = params.width;
    const h = params.length;
    const path = new SVGPath();
    const cx = w / 2;
    const spineW = 3; // center spine half-width

    // Right wing
    // Start from top of center spine, go right
    path.moveTo(cx + spineW, h * 0.05);

    // Top edge curves out and up
    path.cubicBezierTo(
      cx + w * 0.15, h * 0.02,
      cx + w * 0.3, h * 0.0,
      cx + w * 0.4, h * 0.08
    );

    // Outer tip
    path.cubicBezierTo(
      cx + w * 0.47, h * 0.15,
      cx + w * 0.5, h * 0.25,
      cx + w * 0.48, h * 0.4
    );

    // Outer edge with feathered scallops
    const outerX = cx + w * 0.45;
    path.cubicBezierTo(outerX, h * 0.5, outerX + 1, h * 0.55, outerX - 1, h * 0.6);
    path.cubicBezierTo(outerX - 2, h * 0.65, outerX, h * 0.7, outerX - 2, h * 0.75);
    path.cubicBezierTo(outerX - 3, h * 0.8, cx + w * 0.3, h * 0.9, cx + w * 0.15, h * 0.95);

    // Bottom curves back to center
    path.cubicBezierTo(cx + w * 0.08, h * 0.97, cx + spineW + 1, h * 0.9, cx + spineW, h * 0.85);

    // Right side of center spine going up
    path.lineTo(cx + spineW, h * 0.05);

    // Left wing (mirror)
    path.moveTo(cx - spineW, h * 0.05);

    // Left spine down
    path.lineTo(cx - spineW, h * 0.85);

    // Bottom curves out left
    path.cubicBezierTo(cx - spineW - 1, h * 0.9, cx - w * 0.08, h * 0.97, cx - w * 0.15, h * 0.95);

    // Outer edge scallops going up
    const outerXL = cx - w * 0.45;
    path.cubicBezierTo(cx - w * 0.3, h * 0.9, outerXL + 3, h * 0.8, outerXL + 2, h * 0.75);
    path.cubicBezierTo(outerXL, h * 0.7, outerXL + 2, h * 0.65, outerXL + 1, h * 0.6);
    path.cubicBezierTo(outerXL - 1, h * 0.55, outerXL, h * 0.5, cx - w * 0.48, h * 0.4);

    // Outer tip going up
    path.cubicBezierTo(
      cx - w * 0.5, h * 0.25,
      cx - w * 0.47, h * 0.15,
      cx - w * 0.4, h * 0.08
    );

    // Top edge back to center
    path.cubicBezierTo(
      cx - w * 0.3, h * 0.0,
      cx - w * 0.15, h * 0.02,
      cx - spineW, h * 0.05
    );
    path.closePath();

    return path.toString();
  }

  generateScorePaths(params: TemplateParams): string[] {
    const w = params.width;
    const h = params.length;
    const cx = w / 2;
    const scores: string[] = [];

    // Feather lines on right wing
    for (let i = 0; i < 4; i++) {
      const frac = 0.25 + i * 0.15;
      const score = new SVGPath();
      const startX = cx + 4;
      const endX = cx + w * (0.2 + i * 0.06);
      score.moveTo(startX, h * frac);
      score.quadraticBezierTo((startX + endX) / 2, h * (frac - 0.03), endX, h * frac);
      scores.push(score.toString());
    }
    // Mirror feather lines on left wing
    for (let i = 0; i < 4; i++) {
      const frac = 0.25 + i * 0.15;
      const score = new SVGPath();
      const startX = cx - 4;
      const endX = cx - w * (0.2 + i * 0.06);
      score.moveTo(startX, h * frac);
      score.quadraticBezierTo((startX + endX) / 2, h * (frac - 0.03), endX, h * frac);
      scores.push(score.toString());
    }
    return scores;
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius, slitWidth, enableSlit } = params;
    const paths = [this.generateCutPath(params)];
    const cx = width / 2;
    // Two attachment holes in center spine
    paths.push(generateAttachmentHole(cx, length * 0.12, holeRadius, slitWidth, 8, enableSlit));
    paths.push(generateAttachmentHole(cx, length * 0.3, holeRadius, slitWidth, 8, enableSlit));
    return paths;
  }

  generateEngravePaths(params: TemplateParams): string[] {
    return [];
  }
}

/**
 * Kama: Minifig waist-wrap skirt (40×20mm default)
 * Semi-circular wrap that attaches at the waist with a gap in front
 * Features: Waist holes matching minifig leg post, slight flare at hem
 */
export class Kama extends Template {
  generateCutPath(params: TemplateParams): string {
    const w = params.width;
    const h = params.length;
    const path = new SVGPath();

    // Waistband (straight top with slight curve)
    const waistH = 3; // waistband height
    const gapW = w * 0.12; // front gap half-width

    // Start at top-left
    path.moveTo(0, 0);
    path.lineTo(w, 0);

    // Right edge curves outward (flare)
    path.cubicBezierTo(
      w + w * 0.05, h * 0.3,
      w + w * 0.08, h * 0.6,
      w * 0.95, h
    );

    // Bottom hem - gentle curve
    path.cubicBezierTo(
      w * 0.75, h + h * 0.05,
      w * 0.55, h + h * 0.06,
      w / 2, h + h * 0.04
    );
    path.cubicBezierTo(
      w * 0.45, h + h * 0.06,
      w * 0.25, h + h * 0.05,
      w * 0.05, h
    );

    // Left edge curves outward (flare, mirror)
    path.cubicBezierTo(
      -w * 0.08, h * 0.6,
      -w * 0.05, h * 0.3,
      0, 0
    );

    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, holeRadius, slitWidth, enableSlit } = params;
    const paths = [this.generateCutPath(params)];
    // Waist attachment hole at center top
    const cx = width / 2;
    paths.push(generateAttachmentHole(cx, 1.5, holeRadius, slitWidth, 8, enableSlit));
    return paths;
  }

  generateScorePaths(params: TemplateParams): string[] {
    const w = params.width;
    const waistH = 3;
    // Waistband fold line
    const score = new SVGPath();
    score.moveTo(1, waistH);
    score.lineTo(w - 1, waistH);
    return [score.toString()];
  }

  generateEngravePaths(params: TemplateParams): string[] {
    return [];
  }
}

/**
 * Pauldron: Single shoulder armor piece (40×30mm default)
 * Curved piece that wraps over one shoulder
 * Features: Neck cutout on inside edge, arm hole curve on outside
 */
export class Pauldron extends Template {
  generateCutPath(params: TemplateParams): string {
    const w = params.width;
    const h = params.length;
    const path = new SVGPath();

    // Top edge: curved from neck side to shoulder
    path.moveTo(w * 0.15, 0);
    path.cubicBezierTo(
      w * 0.3, -h * 0.02,
      w * 0.6, -h * 0.04,
      w * 0.9, h * 0.05
    );

    // Outer shoulder curve goes down
    path.cubicBezierTo(
      w * 1.0, h * 0.15,
      w * 1.02, h * 0.35,
      w * 0.95, h * 0.55
    );

    // Lower outer edge curves inward
    path.cubicBezierTo(
      w * 0.88, h * 0.7,
      w * 0.75, h * 0.85,
      w * 0.55, h * 0.95
    );

    // Bottom edge
    path.cubicBezierTo(
      w * 0.4, h * 1.0,
      w * 0.25, h * 0.98,
      w * 0.12, h * 0.9
    );

    // Inner neck-side curve going up
    path.cubicBezierTo(
      w * 0.02, h * 0.75,
      -w * 0.02, h * 0.5,
      w * 0.0, h * 0.3
    );

    // Neck cutout curve back to top
    path.cubicBezierTo(
      w * 0.02, h * 0.15,
      w * 0.08, h * 0.05,
      w * 0.15, 0
    );

    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius, slitWidth, enableSlit } = params;
    const paths = [this.generateCutPath(params)];
    // Attachment hole near neck edge top
    paths.push(generateAttachmentHole(width * 0.25, length * 0.15, holeRadius, slitWidth, 8, enableSlit));
    return paths;
  }

  generateScorePaths(params: TemplateParams): string[] {
    const w = params.width;
    const h = params.length;
    // Shoulder ridge fold line
    const score = new SVGPath();
    score.moveTo(w * 0.2, h * 0.1);
    score.cubicBezierTo(w * 0.4, h * 0.05, w * 0.6, h * 0.05, w * 0.85, h * 0.12);
    return [score.toString()];
  }

  generateEngravePaths(params: TemplateParams): string[] {
    return [];
  }
}

/**
 * Cloak: Large flowing garment (100×80mm)
 * Based on standard-cloak-cut-ready.svg
 * Features: Flowing tapered body, wavy side edges, dual neck attachment points
 */
export class Cloak extends Template {
  generateCutPath(params: TemplateParams): string {
    const { length, width } = params;
    const path = new SVGPath();
    const cx = width / 2;

    // Main cloak body - vertical teardrop shape
    path.moveTo(cx, 1);
    
    // Right side curves out and down
    path.quadraticBezierTo(
      cx + width * 0.15, length * 0.2,
      cx + width * 0.18, length * 0.5
    );
    
    // Right bottom curves inward
    path.quadraticBezierTo(
      cx + width * 0.12, width - 2,
      cx * 0.95, width
    );
    
    // Bottom curves left (tapers)
    path.quadraticBezierTo(
      cx, width + 1,
      cx * 0.05, width
    );
    
    // Left side curves up (mirror of right)
    path.quadraticBezierTo(
      cx - width * 0.12, width - 2,
      cx - width * 0.18, length * 0.5
    );
    
    // Left top curves to center
    path.quadraticBezierTo(
      cx - width * 0.15, length * 0.2,
      cx, 1
    );
    
    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, holeRadius, slitWidth, enableSlit } = params;
    const mainPath = this.generateCutPath(params);
    const paths = [mainPath];
    const cx = width / 2;
    
    // Two neck attachment holes
    const leftHoleX = cx - 3.5;
    const rightHoleX = cx + 3.5;
    paths.push(generateAttachmentHole(leftHoleX, 3, holeRadius, slitWidth, 8, enableSlit));
    paths.push(generateAttachmentHole(rightHoleX, 3, holeRadius, slitWidth, 8, enableSlit));
    
    return paths;
  }

  generateScorePaths(params: TemplateParams): string[] {
    return [];
  }

  generateEngravePaths(params: TemplateParams): string[] {
    return [];
  }
}

/**
 * Draw a styled edge segment from (x0,y0) to (x1,y1).
 * Style applies perpendicular decoration. `outward` direction: +1 or -1.
 * The grommetSafe parameter defines regions to skip decoration near grommets.
 */
function drawStyledEdge(
  path: SVGPath,
  x0: number, y0: number, x1: number, y1: number,
  style: string, depth: number, count: number,
  outwardX: number, outwardY: number,
  safeInset: number
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
    // Edge too short for decoration
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
        // Up
        path.lineTo(baseX + outwardX * depth, baseY + outwardY * depth);
        // Across top
        path.lineTo(
          baseX + ux * merlonW + outwardX * depth,
          baseY + uy * merlonW + outwardY * depth
        );
        // Down
        path.lineTo(baseX + ux * merlonW, baseY + uy * merlonW);
        // Across bottom to next
        const nextX = sx0 + ux * ((i + 1) * segW);
        const nextY = sy0 + uy * ((i + 1) * segW);
        path.lineTo(nextX, nextY);
      }
      break;
    }
    default:
      path.lineTo(sx1, sy1);
  }

  // Draw safe inset straight line at end
  path.lineTo(x1, y1);
}

/**
 * Get sail grommet radius from params
 */
function getSailHoleRadius(params: TemplateParams): number {
  const holeType = (params.sailHoleType as string) || 'grommet';
  const standard = SAIL_HOLE_STANDARDS[holeType as SailHoleType];
  return standard ? standard.radius : SAIL_HOLE_STANDARDS.grommet.radius;
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
  depth: number,
  count: number,
  safeInset: number
): string {
  const n = corners.length;
  const path = new SVGPath();

  // Compute outward perpendicular offset points for each corner (Minkowski offset).
  // At each corner, the departure is offset along the outgoing edge's outward normal,
  // and the arrival is offset along the incoming edge's outward normal.
  // This ensures every point on the outline is exactly r from the nearest corner center.
  const arrivals: Array<{ x: number; y: number }> = [];
  const departures: Array<{ x: number; y: number }> = [];

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

    arrivals.push({
      x: curr.x + inNx * r,
      y: curr.y + inNy * r,
    });
    departures.push({
      x: curr.x + outNx * r,
      y: curr.y + outNy * r,
    });
  }

  // Start at departure of first corner
  path.moveTo(departures[0].x, departures[0].y);

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

    // Styled edge from departure[i] to arrival[nextIdx]
    drawStyledEdge(
      path, departures[i].x, departures[i].y,
      arrivals[nextIdx].x, arrivals[nextIdx].y,
      edgeStyles[i], depth, count, outX, outY, safeInset
    );

    // Arc at next corner connecting arrival to departure (centered at corner)
    path.arcTo(r, r, 0, 0, 1, departures[nextIdx].x, departures[nextIdx].y);
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
      const depth = (params.sailEdgeDepth as number) || 3;
      const count = (params.sailEdgeCount as number) || 6;
      return buildSailCutPath(grommets, margin, edgeStyles, depth, count, 2);
    }

    // Outline rectangle: always gap mm outside every grommet hole edge
    const { left, top, right, bottom } = sailOutlineBounds(grommets, holeR, gap, w, h);
    const r = 1.5;
    const topStyle = (params.sailTopStyle as string) || 'none';
    const bottomStyle = (params.sailBottomStyle as string) || 'none';
    const leftStyle = (params.sailLeftStyle as string) || 'none';
    const rightStyle = (params.sailRightStyle as string) || 'none';
    const depth = (params.sailEdgeDepth as number) || 3;
    const count = (params.sailEdgeCount as number) || 6;
    const safeInset = 6;

    const path = new SVGPath();
    path.moveTo(left + r, top);
    drawStyledEdge(path, left + r, top, right - r, top, topStyle, depth, count, 0, -1, safeInset);
    path.arcTo(r, r, 0, 0, 1, right, top + r);
    drawStyledEdge(path, right, top + r, right, bottom - r, rightStyle, depth, count, 1, 0, safeInset);
    path.arcTo(r, r, 0, 0, 1, right - r, bottom);
    drawStyledEdge(path, right - r, bottom, left + r, bottom, bottomStyle, depth, count, 0, 1, safeInset);
    path.arcTo(r, r, 0, 0, 1, left, bottom - r);
    drawStyledEdge(path, left, bottom - r, left, top + r, leftStyle, depth, count, -1, 0, safeInset);
    path.arcTo(r, r, 0, 0, 1, left + r, top);
    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const r = getSailHoleRadius(params);
    const paths = [this.generateCutPath(params)];
    for (const g of this.getGrommets(params)) paths.push(circlePath(g.x, g.y, r));
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
      const depth = (params.sailEdgeDepth as number) || 3;
      const count = (params.sailEdgeCount as number) || 6;
      return buildSailCutPath(grommets, margin, edgeStyles, depth, count, 2);
    }

    // Outline triangle: always gap mm outside every grommet hole edge
    const { left, top, right, bottom } = sailOutlineBounds(grommets, holeR, gap, w, h);
    const bottomStyle = (params.sailBottomStyle as string) || 'none';
    const leftStyle = (params.sailLeftStyle as string) || 'none';
    const depth = (params.sailEdgeDepth as number) || 3;
    const count = (params.sailEdgeCount as number) || 6;
    const safeInset = 6;

    const path = new SVGPath();
    path.moveTo(left, top);
    path.lineTo(right, bottom);
    drawStyledEdge(path, right, bottom, left, bottom, bottomStyle, depth, count, 0, 1, safeInset);
    drawStyledEdge(path, left, bottom, left, top, leftStyle, depth, count, -1, 0, safeInset);
    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const r = getSailHoleRadius(params);
    const paths = [this.generateCutPath(params)];
    for (const g of this.getGrommets(params)) paths.push(circlePath(g.x, g.y, r));
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
    const inset = 4; // mm inset from bounding box
    const cx = w / 2;
    const cy = h / 2;
    const rx = w / 2 - inset;
    const ry = h / 2 - inset;
    const grommets: Array<{ x: number; y: number }> = [];
    for (let i = 0; i < sides; i++) {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
      grommets.push({
        x: cx + rx * Math.cos(angle),
        y: cy + ry * Math.sin(angle),
      });
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
    const depth = (params.sailEdgeDepth as number) || 3;
    const count = (params.sailEdgeCount as number) || 6;
    return buildSailCutPath(grommets, margin, edgeStyles, depth, count, 2);
  }

  generateCutPaths(params: TemplateParams): string[] {
    const r = getSailHoleRadius(params);
    const paths = [this.generateCutPath(params)];
    for (const g of this.getGrommets(params)) paths.push(circlePath(g.x, g.y, r));
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

    scores.push(...buildGrommetCrosshairs(grommets, holeR));
    return scores;
  }

  generateEngravePaths(_params: TemplateParams): string[] {
    return [];
  }
}
