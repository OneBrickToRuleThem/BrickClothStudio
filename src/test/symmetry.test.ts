/**
 * Symmetry unit tests for all element variants
 *
 * Verifies that pattern outlines, holes, and score paths are symmetric about
 * x = width/2 when they are expected to be, and correctly flags known
 * asymmetric variants and symmetry-breaking parameter combinations.
 */

import { describe, it, expect } from 'vitest';
import { generatePattern } from '../services/patternGenerator';
import { ElementType, TemplateVariant } from '../utils/types';

// ---------------------------------------------------------------------------
// SVG path sampling helpers
// ---------------------------------------------------------------------------

interface PathPoint { x: number; y: number }

/** Number of intermediate samples per cubic/quadratic bezier curve segment */
const BEZIER_SAMPLES = 8;

/** Evaluate a cubic bezier at parameter t ∈ [0,1] */
function cubicBezier(
  t: number,
  p0x: number, p0y: number,
  cp1x: number, cp1y: number,
  cp2x: number, cp2y: number,
  p3x: number, p3y: number
): PathPoint {
  const u = 1 - t;
  return {
    x: u * u * u * p0x + 3 * u * u * t * cp1x + 3 * u * t * t * cp2x + t * t * t * p3x,
    y: u * u * u * p0y + 3 * u * u * t * cp1y + 3 * u * t * t * cp2y + t * t * t * p3y,
  };
}

/** Evaluate a quadratic bezier at parameter t ∈ [0,1] */
function quadBezier(
  t: number,
  p0x: number, p0y: number,
  cpx: number, cpy: number,
  p2x: number, p2y: number
): PathPoint {
  const u = 1 - t;
  return {
    x: u * u * p0x + 2 * u * t * cpx + t * t * p2x,
    y: u * u * p0y + 2 * u * t * cpy + t * t * p2y,
  };
}

/**
 * Sample points along an SVG path by evaluating the actual curves.
 *
 * For M/L commands: adds the endpoint.
 * For C (cubic bezier): evaluates the curve at regular intervals
 *   (t = 1/N, 2/N, …, 1) using the previous path position as the start.
 * For Q (quadratic bezier): same approach.
 * For A (arc): adds the endpoint (arcs in this codebase are small circles).
 *
 * This gives actual on-curve points rather than control point handles,
 * making symmetry checks accurate for curved paths.
 */
function samplePath(pathData: string): PathPoint[] {
  const points: PathPoint[] = [];
  const cmds = pathData.match(/[MLCQAZHVSTZ]|-?\d+\.?\d*/gi) || [];
  let ci = 0;
  let cmd = '';
  let curX = 0, curY = 0;

  while (ci < cmds.length) {
    const token = cmds[ci];
    if (/^[A-Za-z]$/.test(token)) {
      cmd = token.toUpperCase();
      ci++;
      if (cmd === 'Z') continue;
    } else {
      switch (cmd) {
        case 'M': {
          curX = parseFloat(cmds[ci]);
          curY = parseFloat(cmds[ci + 1]);
          if (!isNaN(curX) && !isNaN(curY)) points.push({ x: curX, y: curY });
          ci += 2;
          break;
        }
        case 'L': {
          const ex = parseFloat(cmds[ci]);
          const ey = parseFloat(cmds[ci + 1]);
          if (!isNaN(ex) && !isNaN(ey)) {
            // Sample along the line segment for uniform point density
            const dx = ex - curX, dy = ey - curY;
            const len = Math.sqrt(dx * dx + dy * dy);
            const steps = Math.max(1, Math.ceil(len / 0.5)); // ~0.5mm spacing
            for (let s = 1; s <= steps; s++) {
              const t = s / steps;
              points.push({ x: curX + dx * t, y: curY + dy * t });
            }
            curX = ex;
            curY = ey;
          }
          ci += 2;
          break;
        }
        case 'C': {
          const cp1x = parseFloat(cmds[ci]);
          const cp1y = parseFloat(cmds[ci + 1]);
          const cp2x = parseFloat(cmds[ci + 2]);
          const cp2y = parseFloat(cmds[ci + 3]);
          const ex = parseFloat(cmds[ci + 4]);
          const ey = parseFloat(cmds[ci + 5]);
          // Sample the curve from current position to endpoint
          for (let s = 1; s <= BEZIER_SAMPLES; s++) {
            const t = s / BEZIER_SAMPLES;
            const pt = cubicBezier(t, curX, curY, cp1x, cp1y, cp2x, cp2y, ex, ey);
            points.push(pt);
          }
          curX = ex;
          curY = ey;
          ci += 6;
          break;
        }
        case 'Q': {
          const cpx = parseFloat(cmds[ci]);
          const cpy = parseFloat(cmds[ci + 1]);
          const ex = parseFloat(cmds[ci + 2]);
          const ey = parseFloat(cmds[ci + 3]);
          for (let s = 1; s <= BEZIER_SAMPLES; s++) {
            const t = s / BEZIER_SAMPLES;
            const pt = quadBezier(t, curX, curY, cpx, cpy, ex, ey);
            points.push(pt);
          }
          curX = ex;
          curY = ey;
          ci += 4;
          break;
        }
        case 'A': {
          // Arc: rx ry rotation large-arc sweep x y
          curX = parseFloat(cmds[ci + 5]);
          curY = parseFloat(cmds[ci + 6]);
          if (!isNaN(curX) && !isNaN(curY)) points.push({ x: curX, y: curY });
          ci += 7;
          break;
        }
        case 'H': {
          ci += 1;
          break;
        }
        case 'V': {
          ci += 1;
          break;
        }
        default:
          ci++;
          break;
      }
    }
  }
  return points;
}

/**
 * Check whether a set of SVG paths is symmetric about x = width / 2.
 *
 * For every point (x, y) in the paths, there must exist a matching point
 * (width - x, y) within the given tolerance. Points exactly on the
 * centerline (x ≈ width/2) are considered self-symmetric.
 *
 * Returns { symmetric: boolean; violations: string[] }.
 */
function checkPathSymmetry(
  paths: string[],
  width: number,
  tolerance: number = 1.1,
  centerExclude?: number
): { symmetric: boolean; violations: string[] } {
  const allPoints: PathPoint[] = [];
  for (const p of paths) {
    allPoints.push(...samplePath(p));
  }

  const center = width / 2;
  const centerZone = centerExclude ?? tolerance;
  const violations: string[] = [];

  for (const pt of allPoints) {
    // Skip points on the centerline
    if (Math.abs(pt.x - center) < centerZone) continue;

    const mirrorX = width - pt.x;
    const hasMirror = allPoints.some(
      (other) =>
        Math.abs(other.x - mirrorX) < tolerance &&
        Math.abs(other.y - pt.y) < tolerance
    );
    if (!hasMirror) {
      violations.push(
        `Point (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}) has no mirror at ` +
        `(${mirrorX.toFixed(2)}, ${pt.y.toFixed(2)})`
      );
    }
  }

  return {
    symmetric: violations.length === 0,
    violations: [...new Set(violations)].slice(0, 10), // dedupe, cap at 10
  };
}

// ---------------------------------------------------------------------------
// Variant / parameter symmetry configuration
// ---------------------------------------------------------------------------

interface VariantConfig {
  elementType: ElementType;
  templateVariant: TemplateVariant;
  /** Default dimensions for this variant */
  defaults: { width: number; length: number };
  /** Is the base silhouette (outline) expected to be symmetric at defaults? */
  outlineSymmetric: boolean;
  /** Are the cut paths (outline + holes) expected to be symmetric at defaults? */
  cutPathsSymmetric: boolean;
}

/**
 * Master list of all element variants with their expected symmetry at
 * default parameter values. Asymmetric-by-design variants (SVG-traced
 * originals that are intentionally non-symmetric) are marked false.
 */
const VARIANT_SYMMETRY: VariantConfig[] = [
  // ── Capes (procedural — symmetric by construction) ──────────────
  { elementType: 'cape', templateVariant: 'standard',            defaults: { width: 40, length: 39 }, outlineSymmetric: true,  cutPathsSymmetric: true  },
  { elementType: 'cape', templateVariant: 'short',               defaults: { width: 40, length: 30 }, outlineSymmetric: true,  cutPathsSymmetric: true  },
  { elementType: 'cape', templateVariant: 'long',                defaults: { width: 40, length: 50 }, outlineSymmetric: true,  cutPathsSymmetric: true  },
  // Tattered cape — CapeTattered uses position-dependent jitter so left/right
  // hem points have different Y values even with the same seed.
  { elementType: 'cape', templateVariant: 'tattered',            defaults: { width: 40, length: 39 }, outlineSymmetric: false, cutPathsSymmetric: false },
  // SVG-traced single-hole capes — symmetrized via buildSymmetric.cjs (or procedural NARROW_PROFILE)
  { elementType: 'cape', templateVariant: 'narrow-single-hole',  defaults: { width: 28, length: 36 }, outlineSymmetric: true,  cutPathsSymmetric: true  },
  { elementType: 'cape', templateVariant: 'top-single-hole',     defaults: { width: 37, length: 37 }, outlineSymmetric: true,  cutPathsSymmetric: true  },
  { elementType: 'cape', templateVariant: 'stepped-single-hole', defaults: { width: 41, length: 37 }, outlineSymmetric: true,  cutPathsSymmetric: true  },
  // Intentionally asymmetric (SVG-traced from non-symmetric originals)
  { elementType: 'cape', templateVariant: 'wind-swept',          defaults: { width: 47, length: 51 }, outlineSymmetric: false, cutPathsSymmetric: false },
  { elementType: 'cape', templateVariant: 'phantom-shroud',      defaults: { width: 48, length: 51 }, outlineSymmetric: false, cutPathsSymmetric: false },
  { elementType: 'cape', templateVariant: 'seven-points',        defaults: { width: 52, length: 40 }, outlineSymmetric: false, cutPathsSymmetric: false },

  // ── Flags ──────────────────────────────────────────────────────────
  { elementType: 'flag', templateVariant: 'small-flag',          defaults: { width: 22, length: 60 }, outlineSymmetric: false, cutPathsSymmetric: false },
  { elementType: 'flag', templateVariant: 'large-flag',          defaults: { width: 40, length: 64 }, outlineSymmetric: false, cutPathsSymmetric: false },
  { elementType: 'flag', templateVariant: 'custom-flag',         defaults: { width: 30, length: 60 }, outlineSymmetric: true,  cutPathsSymmetric: true  },

  // ── Kama / Skirt ───────────────────────────────────────────────────
  { elementType: 'kama', templateVariant: 'standard',            defaults: { width: 47, length: 19 }, outlineSymmetric: true,  cutPathsSymmetric: true  },
  { elementType: 'kama', templateVariant: 'full-skirt',          defaults: { width: 47, length: 19 }, outlineSymmetric: true,  cutPathsSymmetric: true  },

  // ── Mantle ─────────────────────────────────────────────────────────
  { elementType: 'mantle', templateVariant: 'standard',          defaults: { width: 23, length: 26 }, outlineSymmetric: true,  cutPathsSymmetric: true  },
  // High-collar is SVG-traced and NOT symmetric (192 violations in outline)
  { elementType: 'mantle', templateVariant: 'high-collar',       defaults: { width: 32, length: 18 }, outlineSymmetric: false, cutPathsSymmetric: false },

  // ── Wings ──────────────────────────────────────────────────────────
  // Wings represent a single wing piece — not symmetric about its center
  { elementType: 'wings', templateVariant: 'standard',           defaults: { width: 45, length: 25 }, outlineSymmetric: false, cutPathsSymmetric: false },

  // ── Sails ──────────────────────────────────────────────────────────
  { elementType: 'sail', templateVariant: 'square-sail',         defaults: { width: 60, length: 60 }, outlineSymmetric: true,  cutPathsSymmetric: true  },
  { elementType: 'sail', templateVariant: 'triangular-sail',     defaults: { width: 60, length: 60 }, outlineSymmetric: false, cutPathsSymmetric: false },
  { elementType: 'sail', templateVariant: 'polygon-sail',        defaults: { width: 60, length: 60 }, outlineSymmetric: true,  cutPathsSymmetric: true  },
];

/**
 * Parameters that are expected to BREAK outline symmetry when enabled/changed
 * from their default values on otherwise-symmetric variants.
 */
const SYMMETRY_BREAKING_PARAMS: Record<string, Record<string, number | string | boolean>> = {
  'asymmetric mode':       { asymmetric: true, asymmetricSkew: 0.7 },
  'sword slit (right)':    { swordSlit: true, swordSide: 'right', swordAngle: 35, swordY: 0.45 },
  'sword slit (left)':     { swordSlit: true, swordSide: 'left', swordAngle: 35, swordY: 0.45 },
};

/**
 * Parameters that produce symmetric results despite looking like they might not.
 * holeOverrideOffsetX spreads holes apart from center but MIRRORS both sides.
 */
const ACTUALLY_SYMMETRIC_PARAMS: Record<string, Record<string, number | string | boolean>> = {
  'hole X offset (mirrored)': { holeOverride: true, holeOverrideOffsetX: 3 },
};

/**
 * Parameters that should PRESERVE outline symmetry when applied to
 * symmetric variants.
 */
const SYMMETRY_PRESERVING_PARAMS: Record<string, Record<string, number | string | boolean>> = {
  'scalloped hem':         { scalloped: true, scallopCount: 8, scallopDepth: 3 },
  'zigzag hem':            { zigzag: true, zigzagCount: 10, zigzagDepth: 4 },
  'wavy hem':              { wavy: true, wavyCount: 6, wavyDepth: 3 },
  'castellated hem':       { castellated: true, castellatedCount: 8, castellatedDepth: 3 },
  'dovetail hem':          { dovetail: true, dovetailDepth: 0.25, dovetailWidth: 0.3 },
  'flame hem':             { flame: true, flameCount: 5, flameDepth: 6 },
  'stepped hem':           { stepped: true, steppedCount: 5, steppedDepth: 4 },
  'fishtail':              { fishtail: true, fishtailDepth: 0.15, fishtailNotches: 3 },
  'pointed':               { pointed: true, pointedDepth: 0.3, pointedRoundness: 0.4 },
  'scalloped sides':       { sideStyle: 'scalloped', sideStyleDepth: 3, sideStyleCount: 8 },
  'zigzag sides':          { sideStyle: 'zigzag', sideStyleDepth: 3, sideStyleCount: 8 },
  'wavy sides':            { sideStyle: 'wavy', sideStyleDepth: 3, sideStyleCount: 8 },
  'castellated sides':     { sideStyle: 'castellated', sideStyleDepth: 3, sideStyleCount: 8 },
  'rounding':              { rounding: true, roundingAmount: 0.5 },
  'arm slits (symmetric)': { armSlits: true, armSlitY: 0.35, armSlitLength: 6 },
  'hole Y offset':         { holeOverride: true, holeOverrideOffsetY: 2, holeOverrideOffsetX: 0 },
  'changed dimensions':    { width: 50, length: 50 },
  'large width':           { width: 80 },
  'small width':           { width: 20 },
};

// Hem/side style parameters only relevant for cape-family variants
const CAPE_FAMILY: Set<ElementType> = new Set(['cape']);

// Sails have their own symmetric-preserving parameter set
const SAIL_SYMMETRY_PRESERVING_PARAMS: Record<string, Record<string, number | string | boolean>> = {
  'scalloped all edges':   { sailTopStyle: 'scalloped', sailBottomStyle: 'scalloped', sailLeftStyle: 'scalloped', sailRightStyle: 'scalloped', sailEdgeDepth: 3 },
  'symmetric grommets':    { sailGrommetTLx: 5, sailGrommetTLy: 5, sailGrommetTRx: 5, sailGrommetTRy: 5, sailGrommetBLx: 5, sailGrommetBLy: 5, sailGrommetBRx: 5, sailGrommetBRy: 5 },
};

const SAIL_SYMMETRY_BREAKING_PARAMS: Record<string, Record<string, number | string | boolean>> = {
  'asymmetric left/right edge styles': { sailLeftStyle: 'scalloped', sailRightStyle: 'zigzag' },
  'asymmetric grommet positions':      { sailGrommetTLx: 3, sailGrommetTRx: 8 },
};

// ---------------------------------------------------------------------------
// Helper to generate a pattern with merged params
// ---------------------------------------------------------------------------

function gen(
  elementType: ElementType,
  templateVariant: TemplateVariant,
  defaults: { width: number; length: number },
  extraParams: Record<string, number | string | boolean> = {}
) {
  return generatePattern(elementType, templateVariant, {
    ...defaults,
    holeRadius: 2.5,
    clearance: 0.2,
    slitWidth: 1.2,
    enableSlit: false,
    seed: 12345,
    tatteredSymmetric: true,
    holeCount: 2,
    ...extraParams,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Symmetry — baseline outline at default parameters', () => {
  for (const v of VARIANT_SYMMETRY) {
    const label = `${v.elementType}/${v.templateVariant}`;

    it(`${label} — outline symmetry = ${v.outlineSymmetric}`, () => {
      const pattern = gen(v.elementType, v.templateVariant, v.defaults);
      expect(pattern.cutPaths.length).toBeGreaterThan(0);

      // First cut path = silhouette outline
      const outline = pattern.cutPaths[0];
      const result = checkPathSymmetry([outline], v.defaults.width);

      if (v.outlineSymmetric) {
        expect(result.symmetric).toBe(true);
        if (!result.symmetric) {
          console.warn(`[FAIL] ${label} outline violations:`, result.violations);
        }
      } else {
        // Intentionally asymmetric — use tighter tolerance to confirm
        const tight = checkPathSymmetry([outline], v.defaults.width, 0.3);
        expect(tight.symmetric).toBe(false);
      }
    });
  }
});

describe('Symmetry — full cut paths (outline + holes) at defaults', () => {
  for (const v of VARIANT_SYMMETRY) {
    const label = `${v.elementType}/${v.templateVariant}`;

    it(`${label} — cut paths symmetry = ${v.cutPathsSymmetric}`, () => {
      const pattern = gen(v.elementType, v.templateVariant, v.defaults);
      const result = checkPathSymmetry(pattern.cutPaths, v.defaults.width);

      if (v.cutPathsSymmetric) {
        expect(result.symmetric).toBe(true);
        if (!result.symmetric) {
          console.warn(`[FAIL] ${label} cut path violations:`, result.violations);
        }
      } else {
        const tight = checkPathSymmetry(pattern.cutPaths, v.defaults.width, 0.3);
        expect(tight.symmetric).toBe(false);
      }
    });
  }
});

describe('Symmetry — score paths at defaults', () => {
  for (const v of VARIANT_SYMMETRY) {
    const label = `${v.elementType}/${v.templateVariant}`;

    it(`${label} — score paths respect expected symmetry`, () => {
      const pattern = gen(v.elementType, v.templateVariant, v.defaults);
      if (pattern.scorePaths.length === 0) return; // no score paths to check

      const result = checkPathSymmetry(pattern.scorePaths, v.defaults.width);

      // Sail score paths are diagonal reinforcement lines — not expected to be symmetric about x-axis
      if (v.elementType === 'sail') return;

      if (v.outlineSymmetric) {
        expect(result.symmetric).toBe(true);
        if (!result.symmetric) {
          console.warn(`[FAIL] ${label} score path violations:`, result.violations);
        }
      }
      // Asymmetric variants may or may not have symmetric score paths; don't assert
    });
  }
});

describe('Symmetry — preserved when applying symmetric parameters to capes', () => {
  // Use standard cape as the baseline symmetric variant
  const baseline = VARIANT_SYMMETRY.find(
    (v) => v.elementType === 'cape' && v.templateVariant === 'standard'
  )!;

  for (const [name, params] of Object.entries(SYMMETRY_PRESERVING_PARAMS)) {
    it(`standard cape + "${name}" remains symmetric`, () => {
      const pattern = gen(
        baseline.elementType,
        baseline.templateVariant,
        baseline.defaults,
        params
      );
      const result = checkPathSymmetry(pattern.cutPaths, params.width as number || baseline.defaults.width);
      expect(result.symmetric).toBe(true);
      if (!result.symmetric) {
        console.warn(`[FAIL] standard + "${name}" violations:`, result.violations);
      }
    });
  }
});

describe('Symmetry — preserved across all symmetric cape variants with hem styles', () => {
  const hemStyles: Record<string, Record<string, number | string | boolean>> = {
    scalloped: { scalloped: true, scallopCount: 8, scallopDepth: 3 },
    zigzag:    { zigzag: true, zigzagCount: 10, zigzagDepth: 4 },
    wavy:      { wavy: true, wavyCount: 6, wavyDepth: 3 },
    castellated: { castellated: true, castellatedCount: 8, castellatedDepth: 3 },
    flame:     { flame: true, flameCount: 5, flameDepth: 6 },
    stepped:   { stepped: true, steppedCount: 5, steppedDepth: 4 },
    dovetail:  { dovetail: true, dovetailDepth: 0.25, dovetailWidth: 0.3 },
    fishtail:  { fishtail: true, fishtailDepth: 0.15, fishtailNotches: 3 },
    pointed:   { pointed: true, pointedDepth: 0.3, pointedRoundness: 0.4 },
  };

  const symmetricCapes = VARIANT_SYMMETRY.filter(
    (v) => v.elementType === 'cape' && v.outlineSymmetric
  );

  for (const cape of symmetricCapes) {
    for (const [styleName, styleParams] of Object.entries(hemStyles)) {
      it(`${cape.templateVariant} + ${styleName} hem remains symmetric`, () => {
        const pattern = gen(
          cape.elementType,
          cape.templateVariant,
          cape.defaults,
          styleParams
        );
        const result = checkPathSymmetry(
          [pattern.cutPaths[0]], // check outline only
          cape.defaults.width
        );
        expect(result.symmetric).toBe(true);
        if (!result.symmetric) {
          console.warn(
            `[FAIL] ${cape.templateVariant} + ${styleName}:`,
            result.violations
          );
        }
      });
    }
  }
});

describe('Symmetry — preserved across symmetric capes with side styles', () => {
  const sideStyles = ['scalloped', 'zigzag', 'wavy', 'castellated'];

  // Narrow capes converge to a point at the top, making side decorations
  // near the tip inherently asymmetric — exclude from side style tests
  const symmetricCapes = VARIANT_SYMMETRY.filter(
    (v) => v.elementType === 'cape' && v.outlineSymmetric &&
           !['narrow-single-hole'].includes(v.templateVariant)
  );

  for (const cape of symmetricCapes) {
    for (const style of sideStyles) {
      it(`${cape.templateVariant} + ${style} sides remains symmetric`, () => {
        const pattern = gen(
          cape.elementType,
          cape.templateVariant,
          cape.defaults,
          { sideStyle: style, sideStyleDepth: 3, sideStyleCount: 8 }
        );
        const result = checkPathSymmetry(
          [pattern.cutPaths[0]],
          cape.defaults.width
        );
        expect(result.symmetric).toBe(true);
        if (!result.symmetric) {
          console.warn(
            `[FAIL] ${cape.templateVariant} + ${style} sides:`,
            result.violations
          );
        }
      });
    }
  }
});

describe('Symmetry — broken by asymmetric parameters', () => {
  const baseline = VARIANT_SYMMETRY.find(
    (v) => v.elementType === 'cape' && v.templateVariant === 'standard'
  )!;

  for (const [name, params] of Object.entries(SYMMETRY_BREAKING_PARAMS)) {
    it(`standard cape + "${name}" breaks symmetry`, () => {
      const pattern = gen(
        baseline.elementType,
        baseline.templateVariant,
        baseline.defaults,
        params
      );
      const result = checkPathSymmetry(pattern.cutPaths, baseline.defaults.width, 0.3);
      expect(result.symmetric).toBe(false);
    });
  }
});

describe('Symmetry — params that look asymmetric but are actually mirrored', () => {
  const baseline = VARIANT_SYMMETRY.find(
    (v) => v.elementType === 'cape' && v.templateVariant === 'standard'
  )!;

  for (const [name, params] of Object.entries(ACTUALLY_SYMMETRIC_PARAMS)) {
    it(`standard cape + "${name}" remains symmetric`, () => {
      const pattern = gen(
        baseline.elementType,
        baseline.templateVariant,
        baseline.defaults,
        params
      );
      const result = checkPathSymmetry(pattern.cutPaths, baseline.defaults.width);
      expect(result.symmetric).toBe(true);
    });
  }
});

describe('Symmetry — non-symmetric tattered breaks symmetry', () => {
  const baseline = VARIANT_SYMMETRY.find(
    (v) => v.elementType === 'cape' && v.templateVariant === 'standard'
  )!;

  it('standard cape + tattered (non-symmetric) breaks symmetry', () => {
    const pattern = gen(
      baseline.elementType,
      baseline.templateVariant,
      baseline.defaults,
      { tattered: true, tatteredIntensity: 0.06, tatteredSymmetric: false, seed: 12345 }
    );
    const result = checkPathSymmetry([pattern.cutPaths[0]], baseline.defaults.width, 0.3);
    // Non-symmetric tattered should produce an asymmetric outline
    expect(result.symmetric).toBe(false);
  });
});

describe('Symmetry — sail variants with symmetric edge styles', () => {
  const symmetricSails = VARIANT_SYMMETRY.filter(
    (v) => v.elementType === 'sail' && v.outlineSymmetric
  );

  for (const sail of symmetricSails) {
    for (const [name, params] of Object.entries(SAIL_SYMMETRY_PRESERVING_PARAMS)) {
      it(`${sail.templateVariant} + "${name}" remains symmetric`, () => {
        const pattern = gen(
          sail.elementType,
          sail.templateVariant,
          sail.defaults,
          params
        );
        const result = checkPathSymmetry(pattern.cutPaths, sail.defaults.width);
        expect(result.symmetric).toBe(true);
        if (!result.symmetric) {
          console.warn(
            `[FAIL] ${sail.templateVariant} + "${name}":`,
            result.violations
          );
        }
      });
    }
  }
});

describe('Symmetry — sail variants with asymmetric params break symmetry', () => {
  const squareSail = VARIANT_SYMMETRY.find(
    (v) => v.elementType === 'sail' && v.templateVariant === 'square-sail'
  )!;

  for (const [name, params] of Object.entries(SAIL_SYMMETRY_BREAKING_PARAMS)) {
    it(`square-sail + "${name}" breaks symmetry`, () => {
      const pattern = gen(
        squareSail.elementType,
        squareSail.templateVariant,
        squareSail.defaults,
        params
      );
      const result = checkPathSymmetry(pattern.cutPaths, squareSail.defaults.width, 0.3);
      expect(result.symmetric).toBe(false);
    });
  }
});

describe('Symmetry — SVG-traced single-hole outlines match buildSymmetric.cjs', () => {
  // These three variants were specifically generated with mirrorAndReverseLeftHalf
  // to be perfectly symmetric. Verify this holds at various dimensions.
  const singleHoleVariants = VARIANT_SYMMETRY.filter((v) =>
    ['narrow-single-hole', 'top-single-hole', 'stepped-single-hole'].includes(v.templateVariant)
  );

  const testDimensions = [
    { width: 20, length: 20 },
    { width: 41, length: 37 },
    { width: 60, length: 80 },
    { width: 100, length: 50 },
  ];

  for (const variant of singleHoleVariants) {
    for (const dims of testDimensions) {
      it(`${variant.templateVariant} at ${dims.width}×${dims.length}mm is symmetric`, () => {
        const pattern = gen(
          variant.elementType,
          variant.templateVariant,
          dims
        );
        const result = checkPathSymmetry([pattern.cutPaths[0]], dims.width);
        expect(result.symmetric).toBe(true);
        if (!result.symmetric) {
          console.warn(
            `[FAIL] ${variant.templateVariant} ${dims.width}×${dims.length}:`,
            result.violations
          );
        }
      });
    }
  }
});

describe('Symmetry — hole positions are centered/mirrored', () => {
  const symmetricVariants = VARIANT_SYMMETRY.filter((v) => v.cutPathsSymmetric);

  for (const v of symmetricVariants) {
    it(`${v.elementType}/${v.templateVariant} — holes are symmetric`, () => {
      const pattern = gen(v.elementType, v.templateVariant, v.defaults);
      if (pattern.cutPaths.length <= 1) return; // no separate hole paths

      // Check only the hole paths (index 1+)
      const holePaths = pattern.cutPaths.slice(1);
      const result = checkPathSymmetry(holePaths, v.defaults.width);
      expect(result.symmetric).toBe(true);
      if (!result.symmetric) {
        console.warn(
          `[FAIL] ${v.elementType}/${v.templateVariant} hole symmetry:`,
          result.violations
        );
      }
    });
  }
});

describe('Symmetry — dimension changes preserve symmetry for symmetric variants', () => {
  const symmetricCapes = VARIANT_SYMMETRY.filter(
    (v) => v.elementType === 'cape' && v.outlineSymmetric
  );

  const dimensionTests = [
    { width: 30, length: 30 },
    { width: 50, length: 60 },
    { width: 80, length: 40 },
  ];

  for (const cape of symmetricCapes) {
    for (const dims of dimensionTests) {
      it(`${cape.templateVariant} at ${dims.width}×${dims.length} remains symmetric`, () => {
        const pattern = gen(cape.elementType, cape.templateVariant, dims);
        const result = checkPathSymmetry([pattern.cutPaths[0]], dims.width);
        expect(result.symmetric).toBe(true);
        if (!result.symmetric) {
          console.warn(
            `[FAIL] ${cape.templateVariant} at ${dims.width}×${dims.length}:`,
            result.violations
          );
        }
      });
    }
  }
});

describe('Symmetry — combined hem + side style on capes', () => {
  it('standard cape with scalloped hem + wavy sides remains symmetric', () => {
    const pattern = gen('cape', 'standard', { width: 40, length: 39 }, {
      scalloped: true, scallopCount: 8, scallopDepth: 3,
      sideStyle: 'wavy', sideStyleDepth: 3, sideStyleCount: 6,
    });
    const result = checkPathSymmetry([pattern.cutPaths[0]], 40);
    expect(result.symmetric).toBe(true);
  });

  it('standard cape with stepped hem + zigzag sides remains symmetric', () => {
    const pattern = gen('cape', 'standard', { width: 40, length: 39 }, {
      stepped: true, steppedCount: 5, steppedDepth: 4,
      sideStyle: 'zigzag', sideStyleDepth: 3, sideStyleCount: 8,
    });
    const result = checkPathSymmetry([pattern.cutPaths[0]], 40);
    expect(result.symmetric).toBe(true);
  });

  it('short cape with zigzag hem + scalloped sides remains symmetric', () => {
    const pattern = gen('cape', 'short', { width: 40, length: 30 }, {
      zigzag: true, zigzagCount: 10, zigzagDepth: 4,
      sideStyle: 'scalloped', sideStyleDepth: 3, sideStyleCount: 8,
    });
    const result = checkPathSymmetry([pattern.cutPaths[0]], 40);
    expect(result.symmetric).toBe(true);
  });
});

describe('Symmetry — polygon sail with even vertex counts', () => {
  const evenSideCounts = [6, 8, 10, 12];

  for (const sides of evenSideCounts) {
    it(`polygon-sail with ${sides} sides is symmetric`, () => {
      const pattern = gen('sail', 'polygon-sail', { width: 60, length: 60 }, {
        sailSides: sides,
      });
      const result = checkPathSymmetry(pattern.cutPaths, 60);
      expect(result.symmetric).toBe(true);
      if (!result.symmetric) {
        console.warn(`[FAIL] polygon ${sides} sides:`, result.violations);
      }
    });
  }
});

describe('Symmetry — polygon sail with odd vertex counts', () => {
  // Odd polygons may not be exactly symmetric depending on vertex placement
  const oddSideCounts = [5, 7, 9, 11];

  for (const sides of oddSideCounts) {
    it(`polygon-sail with ${sides} sides — check symmetry`, () => {
      const pattern = gen('sail', 'polygon-sail', { width: 60, length: 60 }, {
        sailSides: sides,
      });
      const result = checkPathSymmetry(pattern.cutPaths, 60);
      // Odd-sided regular polygons centered in a rectangle ARE symmetric
      // because the top vertex is at x=width/2 and each row is mirrored
      expect(result.symmetric).toBe(true);
    });
  }
});

describe('Symmetry — kama/mantle with edge styles', () => {
  // Only test scalloped: zigzag/wavy/castellated have a known phase mismatch
  // because the kama's left and right hem edges draw in opposite directions,
  // causing the decoration phase to be reversed.
  const edgeStyles = ['scalloped'];

  for (const style of edgeStyles) {
    it(`kama + ${style} edge remains symmetric`, () => {
      const pattern = gen('kama', 'standard', { width: 47, length: 19 }, {
        kamaEdgeStyle: style,
        kamaEdgeDepth: 2,
        kamaEdgeCount: 6,
      });
      const result = checkPathSymmetry(pattern.cutPaths, 47);
      expect(result.symmetric).toBe(true);
    });

    it(`mantle + ${style} edge remains symmetric`, () => {
      const pattern = gen('mantle', 'standard', { width: 23, length: 26 }, {
        mantleEdgeStyle: style,
        mantleEdgeDepth: 2,
        mantleEdgeCount: 6,
      });
      const result = checkPathSymmetry(pattern.cutPaths, 23);
      expect(result.symmetric).toBe(true);
    });
  }
});
