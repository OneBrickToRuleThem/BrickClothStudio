/**
 * Self-intersection tests for generated cut paths
 *
 * Verifies that the outline of each element variant does not contain
 * self-intersecting line segments, which would cause problems with
 * laser cutters, die cutters (Cricut/Silhouette), and SVG renderers.
 *
 * Method: parse each cut path into line segments (sampling curves),
 * then check that no pair of non-adjacent segments crosses.
 */

import { describe, it, expect } from 'vitest';
import { generatePattern } from '../services/patternGenerator';
import { EDGE_STYLE_NAMES } from '../geometry/edgeStyles';
import { findIntersections } from '../geometry/intersections';
import { ElementType, TemplateVariant } from '../utils/types';

// ---------------------------------------------------------------------------
// Shared parameters
// ---------------------------------------------------------------------------

const BASE_PARAMS = {
  length: 60,
  width: 40,
  holeRadius: 2.5,
  clearance: 0.2,
  slitWidth: 1.2,
  enableSlit: false,
  seed: 42,
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Self-Intersection: baseline elements (no edge styles)', () => {
  const BASELINE_ELEMENTS: { element: ElementType; variant: TemplateVariant; extras?: Record<string, unknown> }[] = [
    { element: 'cape', variant: 'standard' },
    { element: 'cape', variant: 'wind-swept', extras: { width: 47, length: 51 } },
    { element: 'cape', variant: 'phantom-shroud', extras: { width: 48, length: 51 } },
    { element: 'cape', variant: 'seven-points', extras: { width: 52, length: 40 } },
    { element: 'flag', variant: 'small-flag', extras: { width: 22, length: 60 } },
    { element: 'flag', variant: 'large-flag', extras: { width: 40, length: 64 } },
    { element: 'flag', variant: 'custom-flag', extras: { width: 30, length: 60 } },
    { element: 'kama', variant: 'standard', extras: { width: 47, length: 19 } },
    { element: 'kama', variant: 'full-skirt', extras: { width: 47, length: 19 } },
    { element: 'mantle', variant: 'standard', extras: { width: 23, length: 26 } },
    { element: 'sail', variant: 'square-sail', extras: { width: 60, length: 60 } },
    { element: 'sail', variant: 'triangular-sail', extras: { width: 60, length: 60 } },
    { element: 'wings', variant: 'standard', extras: { width: 45, length: 25 } },
  ];

  for (const { element, variant, extras } of BASELINE_ELEMENTS) {
    it(`${element} / ${variant} has no self-intersections`, () => {
      const pattern = generatePattern(element, variant, { ...BASE_PARAMS, ...extras });
      const result = findIntersections(pattern.cutPaths);
      expect(result.count, `Found ${result.count} intersection(s):\n${result.details.join('\n')}`).toBe(0);
    });
  }
});

describe('Self-Intersection: cape with bottom curve', () => {
  for (const amount of [0.25, 0.5, 0.75, 1.0]) {
    it(`bottomCurve=${amount} has no self-intersections`, () => {
      const pattern = generatePattern('cape', 'standard', {
        ...BASE_PARAMS,
        bottomCurve: amount,
      });
      const result = findIntersections(pattern.cutPaths);
      expect(result.count, `Found ${result.count} intersection(s):\n${result.details.join('\n')}`).toBe(0);
    });
  }
});

describe('Self-Intersection: cape with side curve (no edge style)', () => {
  for (const curve of [-1, -0.5, 0.5, 1]) {
    it(`sideCurve=${curve} has no self-intersections`, () => {
      const pattern = generatePattern('cape', 'standard', {
        ...BASE_PARAMS,
        sideCurve: curve,
      });
      const result = findIntersections(pattern.cutPaths);
      expect(result.count, `Found ${result.count} intersection(s):\n${result.details.join('\n')}`).toBe(0);
    });
  }
});

describe('Self-Intersection: cape hem edge styles', () => {
  const HEM_STYLES = EDGE_STYLE_NAMES.filter(s => s !== 'none');

  for (const style of HEM_STYLES) {
    it(`hem style "${style}" has no self-intersections`, () => {
      const pattern = generatePattern('cape', 'standard', {
        ...BASE_PARAMS,
        [style]: true,
        hemEdgeCount: 6,
        hemEdgeDepth: 3,
      });
      const result = findIntersections(pattern.cutPaths);
      expect(result.count, `Found ${result.count} intersection(s):\n${result.details.join('\n')}`).toBe(0);
    });
  }
});

describe('Self-Intersection: cape side edge styles', () => {
  const SIDE_STYLES = EDGE_STYLE_NAMES.filter(s => s !== 'none');

  for (const style of SIDE_STYLES) {
    it(`side style "${style}" has no self-intersections`, () => {
      const pattern = generatePattern('cape', 'standard', {
        ...BASE_PARAMS,
        sideStyle: style,
        sideStyleCount: 6,
        sideStyleDepth: 3,
      });
      const result = findIntersections(pattern.cutPaths);
      expect(result.count, `Found ${result.count} intersection(s):\n${result.details.join('\n')}`).toBe(0);
    });
  }
});

describe('Self-Intersection: cape side edge styles + side curve', () => {
  const SIDE_STYLES = EDGE_STYLE_NAMES.filter(s => s !== 'none');

  for (const style of SIDE_STYLES) {
    for (const curve of [-0.5, 0.5]) {
      it(`side "${style}" + sideCurve=${curve} has no self-intersections`, () => {
        const pattern = generatePattern('cape', 'standard', {
          ...BASE_PARAMS,
          sideStyle: style,
          sideStyleCount: 6,
          sideStyleDepth: 3,
          sideCurve: curve,
        });
        const result = findIntersections(pattern.cutPaths);
        expect(result.count, `Found ${result.count} intersection(s):\n${result.details.join('\n')}`).toBe(0);
      });
    }
  }
});

describe('Self-Intersection: kama/mantle edge styles', () => {
  const KAMA_STYLES = ['scalloped', 'zigzag', 'wavy', 'castellated', 'torn'];

  for (const style of KAMA_STYLES) {
    it(`kama "${style}" has no self-intersections`, () => {
      const pattern = generatePattern('kama', 'standard', {
        ...BASE_PARAMS,
        width: 47,
        length: 19,
        kamaEdgeStyle: style,
        kamaEdgeCount: 6,
        kamaEdgeDepth: 2,
      });
      const result = findIntersections(pattern.cutPaths);
      expect(result.count, `Found ${result.count} intersection(s):\n${result.details.join('\n')}`).toBe(0);
    });
  }

  for (const style of EDGE_STYLE_NAMES.filter(s => s !== 'none')) {
    it(`mantle "${style}" has no self-intersections`, () => {
      const pattern = generatePattern('mantle', 'standard', {
        ...BASE_PARAMS,
        width: 23,
        length: 26,
        mantleEdgeStyle: style,
        mantleEdgeCount: 6,
        mantleEdgeDepth: 2,
      });
      const result = findIntersections(pattern.cutPaths);
      expect(result.count, `Found ${result.count} intersection(s):\n${result.details.join('\n')}`).toBe(0);
    });
  }
});

describe('Self-Intersection: sail edge styles', () => {
  const SAIL_STYLES = EDGE_STYLE_NAMES.filter(s => s !== 'none');

  for (const style of SAIL_STYLES) {
    it(`sail bottom "${style}" has no self-intersections`, () => {
      const pattern = generatePattern('sail', 'square-sail', {
        ...BASE_PARAMS,
        width: 60,
        length: 60,
        sailBottomStyle: style,
        sailEdgeCount: 6,
        sailEdgeDepth: 3,
        sailTornSeed: 42,
      });
      const result = findIntersections(pattern.cutPaths);
      expect(result.count, `Found ${result.count} intersection(s):\n${result.details.join('\n')}`).toBe(0);
    });
  }
});

describe('Self-Intersection: flag edge styles', () => {
  const FLAG_STYLES = EDGE_STYLE_NAMES.filter(s => s !== 'none');

  for (const style of FLAG_STYLES) {
    it(`flag bottom "${style}" has no self-intersections`, () => {
      const pattern = generatePattern('flag', 'custom-flag', {
        ...BASE_PARAMS,
        width: 30,
        length: 60,
        flagBottomStyle: style,
        flagBottomCount: 6,
        flagBottomDepth: 3,
        flagBottomSeed: 42,
      });
      const result = findIntersections(pattern.cutPaths);
      expect(result.count, `Found ${result.count} intersection(s):\n${result.details.join('\n')}`).toBe(0);
    });
  }
});

describe('Self-Intersection: mantle with bottom curve', () => {
  for (const amount of [0.25, 0.5, 0.75, 1.0]) {
    it(`mantleBottomCurve=${amount} has no self-intersections`, () => {
      const pattern = generatePattern('mantle', 'standard', {
        ...BASE_PARAMS,
        width: 23,
        length: 26,
        mantleBottomCurve: amount,
      });
      const result = findIntersections(pattern.cutPaths);
      expect(result.count, `Found ${result.count} intersection(s):\n${result.details.join('\n')}`).toBe(0);
    });
  }
});
