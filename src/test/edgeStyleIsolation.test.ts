/**
 * Edge Style Isolation Tests
 *
 * Ensures that changes to one edge style don't accidentally affect other
 * styles or element variants. Each test generates cut paths for one style
 * and snapshots the output of several other unrelated styles and element
 * types to verify they remain unchanged.
 */

import { describe, it, expect } from 'vitest';
import { generatePattern } from '../services/patternGenerator';
import { EDGE_STYLE_NAMES } from '../geometry/edgeStyles';
import { ElementType, TemplateVariant } from '../utils/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const BASE_PARAMS = {
  length: 60,
  width: 40,
  holeRadius: 2.5,
  clearance: 0.2,
  slitWidth: 1.2,
  enableSlit: false,
};

/** Generate a cape with a specific bottom hem style enabled */
function capeWithHemStyle(style: string, extraParams: Record<string, unknown> = {}) {
  return generatePattern('cape', 'standard', {
    ...BASE_PARAMS,
    [style]: true,
    hemEdgeCount: 6,
    hemEdgeDepth: 3,
    seed: 42,
    ...extraParams,
  });
}

/** Generate a cape with a specific side style */
function capeWithSideStyle(style: string, extraParams: Record<string, unknown> = {}) {
  return generatePattern('cape', 'standard', {
    ...BASE_PARAMS,
    sideStyle: style,
    sideStyleCount: 6,
    sideStyleDepth: 3,
    seed: 42,
    ...extraParams,
  });
}

/** Generate a kama with a specific edge style */
function kamaWithEdgeStyle(style: string) {
  return generatePattern('kama', 'standard', {
    ...BASE_PARAMS,
    length: 19,
    width: 47,
    kamaEdgeStyle: style,
    kamaEdgeCount: 6,
    kamaEdgeDepth: 3,
    seed: 42,
  });
}

/** Generate a mantle with a specific edge style */
function mantleWithEdgeStyle(style: string) {
  return generatePattern('mantle', 'standard', {
    ...BASE_PARAMS,
    mantleEdgeStyle: style,
    mantleEdgeCount: 6,
    mantleEdgeDepth: 3,
    seed: 42,
  });
}

/** Generate a flag with a specific bottom style */
function flagWithBottomStyle(style: string, extraParams: Record<string, unknown> = {}) {
  return generatePattern('flag', 'custom-flag', {
    ...BASE_PARAMS,
    length: 50,
    width: 30,
    flagBottomStyle: style,
    flagBottomCount: 6,
    flagBottomDepth: 3,
    flagBottomSeed: 42,
    ...extraParams,
  });
}

/** Generate a sail with a specific bottom style */
function sailWithBottomStyle(style: string) {
  return generatePattern('sail', 'square-sail', {
    ...BASE_PARAMS,
    length: 50,
    width: 50,
    sailBottomStyle: style,
    sailEdgeCount: 6,
    sailEdgeDepth: 3,
    sailTornSeed: 42,
  });
}

/** Simple hash of a string for stable comparison */
function simpleHash(s: string): string {
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    hash = ((hash << 5) - hash + s.charCodeAt(i)) | 0;
  }
  return hash.toString(36);
}

/** Join all cut paths into a single fingerprint */
function cutPathFingerprint(pattern: ReturnType<typeof generatePattern>): string {
  return simpleHash(pattern.cutPaths.join('|'));
}

// ---------------------------------------------------------------------------
// Baseline: plain cape with no edge style
// ---------------------------------------------------------------------------
const plainCape = generatePattern('cape', 'standard', BASE_PARAMS);
const plainCapeFingerprint = cutPathFingerprint(plainCape);
const plainCapePathCount = plainCape.cutPaths.length;

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Edge Style Isolation', () => {

  // ---- 1. Plain baseline is deterministic ----
  it('plain cape is deterministic across calls', () => {
    const second = generatePattern('cape', 'standard', BASE_PARAMS);
    expect(cutPathFingerprint(second)).toBe(plainCapeFingerprint);
  });

  // ---- 2. Each hem style produces a DIFFERENT path than plain ----
  const hemStyles = [
    'scalloped', 'zigzag', 'wavy', 'castellated', 'dovetail',
    'notched', 'flame', 'stepped', 'thorned', 'torn',
    'feathered', 'cloud', 'sawtooth', 'arrow', 'picot',
  ];

  for (const style of hemStyles) {
    it(`cape hem "${style}" differs from plain cape`, () => {
      const styled = capeWithHemStyle(style);
      expect(cutPathFingerprint(styled)).not.toBe(plainCapeFingerprint);
    });
  }

  // ---- 3. Each hem style is unique (no two produce the same output) ----
  it('all hem styles produce distinct outputs', () => {
    const fingerprints = new Map<string, string>();
    for (const style of hemStyles) {
      const fp = cutPathFingerprint(capeWithHemStyle(style));
      const existing = fingerprints.get(fp);
      expect(existing, `"${style}" has same output as "${existing}"`).toBeUndefined();
      fingerprints.set(fp, style);
    }
  });

  // ---- 4. Changing one style does not alter another ----
  it('hemEdgeCount only affects the active hem style, not plain cape', () => {
    // Changing count param while no style is enabled should not affect output
    const a = generatePattern('cape', 'standard', { ...BASE_PARAMS, hemEdgeCount: 6 });
    const b = generatePattern('cape', 'standard', { ...BASE_PARAMS, hemEdgeCount: 12 });
    expect(cutPathFingerprint(a)).toBe(cutPathFingerprint(b));
  });

  it('sawtoothCurve param with no active style does not affect plain cape', () => {
    const a = generatePattern('cape', 'standard', { ...BASE_PARAMS, sawtoothCurve: 0 });
    const b = generatePattern('cape', 'standard', { ...BASE_PARAMS, sawtoothCurve: 1 });
    expect(cutPathFingerprint(a)).toBe(cutPathFingerprint(b));
  });

  // ---- 5. Side style changes don't affect hem style output ----
  const sideStyleNames = ['scalloped', 'zigzag', 'sawtooth', 'arrow', 'dovetail'];

  for (const sideStyle of sideStyleNames) {
    it(`side style "${sideStyle}" is different from no side style`, () => {
      const plain = generatePattern('cape', 'standard', { ...BASE_PARAMS, sideStyle: 'none' });
      const styled = capeWithSideStyle(sideStyle);
      expect(cutPathFingerprint(styled)).not.toBe(cutPathFingerprint(plain));
    });
  }

  it('side style sawtooth is distinct from side style arrow', () => {
    const sawtooth = capeWithSideStyle('sawtooth');
    const arrow = capeWithSideStyle('arrow');
    expect(cutPathFingerprint(sawtooth)).not.toBe(cutPathFingerprint(arrow));
  });

  // ---- 6. Cross-element type isolation: kama edge style ----
  const sharedStyles = ['scalloped', 'zigzag', 'sawtooth', 'arrow', 'dovetail', 'notched'];

  for (const style of sharedStyles) {
    it(`kama edge style "${style}" differs from kama with none`, () => {
      const none = kamaWithEdgeStyle('none');
      const styled = kamaWithEdgeStyle(style);
      expect(cutPathFingerprint(styled)).not.toBe(cutPathFingerprint(none));
    });
  }

  // ---- 7. Cross-element type isolation: mantle edge style ----
  for (const style of sharedStyles) {
    it(`mantle edge style "${style}" differs from mantle with none`, () => {
      const none = mantleWithEdgeStyle('none');
      const styled = mantleWithEdgeStyle(style);
      expect(cutPathFingerprint(styled)).not.toBe(cutPathFingerprint(none));
    });
  }

  // ---- 8. Flag bottom style isolation ----
  const flagBottomStyles = ['sawtooth', 'arrow', 'scalloped', 'zigzag', 'dovetail', 'pointed', 'swallowtail'];

  for (const style of flagBottomStyles) {
    it(`flag bottom "${style}" differs from flag "none"`, () => {
      const none = flagWithBottomStyle('none');
      const styled = flagWithBottomStyle(style);
      expect(cutPathFingerprint(styled)).not.toBe(cutPathFingerprint(none));
    });
  }

  it('flag bottom styles are all distinct from each other', () => {
    const fingerprints = new Map<string, string>();
    for (const style of flagBottomStyles) {
      const fp = cutPathFingerprint(flagWithBottomStyle(style));
      const existing = fingerprints.get(fp);
      expect(existing, `"${style}" has same output as "${existing}"`).toBeUndefined();
      fingerprints.set(fp, style);
    }
  });

  // ---- 9. Sail bottom style isolation ----
  const sailStyles = ['scalloped', 'zigzag', 'sawtooth', 'arrow'];

  for (const style of sailStyles) {
    it(`sail bottom "${style}" differs from sail "none"`, () => {
      const none = sailWithBottomStyle('none');
      const styled = sailWithBottomStyle(style);
      expect(cutPathFingerprint(styled)).not.toBe(cutPathFingerprint(none));
    });
  }

  // ---- 10. Element variant isolation ----
  const variants: Array<{ element: ElementType; variant: TemplateVariant; name: string }> = [
    { element: 'cape', variant: 'standard', name: 'Standard Cape' },
    { element: 'flag', variant: 'custom-flag', name: 'Custom Flag' },
    { element: 'kama', variant: 'standard', name: 'Kama' },
    { element: 'mantle', variant: 'standard', name: 'Mantle' },
  ];

  it('different element variants produce distinct cut paths', () => {
    const fingerprints = new Map<string, string>();
    for (const { element, variant, name } of variants) {
      const pattern = generatePattern(element, variant, {
        ...BASE_PARAMS,
        length: element === 'kama' ? 19 : 60,
        width: element === 'kama' ? 47 : 40,
      });
      const fp = cutPathFingerprint(pattern);
      const existing = fingerprints.get(fp);
      expect(existing, `"${name}" has same output as "${existing}"`).toBeUndefined();
      fingerprints.set(fp, name);
    }
  });

  // ---- 11. Sawtooth curve/reverse params only affect sawtooth ----
  it('sawtoothCurve changes sawtooth output', () => {
    const noCurve = capeWithHemStyle('sawtooth', { sawtoothCurve: 0 });
    const withCurve = capeWithHemStyle('sawtooth', { sawtoothCurve: 0.8 });
    expect(cutPathFingerprint(noCurve)).not.toBe(cutPathFingerprint(withCurve));
  });

  it('sawtoothReverse changes sawtooth output', () => {
    const normal = capeWithHemStyle('sawtooth', { sawtoothReverse: false });
    const reversed = capeWithHemStyle('sawtooth', { sawtoothReverse: true });
    expect(cutPathFingerprint(normal)).not.toBe(cutPathFingerprint(reversed));
  });

  it('sawtoothCurve does not affect scalloped output', () => {
    const a = capeWithHemStyle('scalloped', { sawtoothCurve: 0 });
    const b = capeWithHemStyle('scalloped', { sawtoothCurve: 1 });
    expect(cutPathFingerprint(a)).toBe(cutPathFingerprint(b));
  });

  it('sawtoothReverse does not affect zigzag output', () => {
    const a = capeWithHemStyle('zigzag', { sawtoothReverse: false });
    const b = capeWithHemStyle('zigzag', { sawtoothReverse: true });
    expect(cutPathFingerprint(a)).toBe(cutPathFingerprint(b));
  });

  // ---- 12. drawStyledEdge styles via EDGE_STYLE_NAMES used in kama ----
  it('all EDGE_STYLE_NAMES produce valid kama output', () => {
    for (const style of EDGE_STYLE_NAMES) {
      const pattern = kamaWithEdgeStyle(style);
      expect(pattern.cutPaths.length, `kama with "${style}" should have cut paths`).toBeGreaterThan(0);
      for (const path of pattern.cutPaths) {
        expect(path, `kama "${style}" cut path should contain M command`).toContain('M');
      }
    }
  });

  // ---- 13. All EDGE_STYLE_NAMES produce valid mantle output ----
  it('all EDGE_STYLE_NAMES produce valid mantle output', () => {
    for (const style of EDGE_STYLE_NAMES) {
      const pattern = mantleWithEdgeStyle(style);
      expect(pattern.cutPaths.length, `mantle with "${style}" should have cut paths`).toBeGreaterThan(0);
      for (const path of pattern.cutPaths) {
        expect(path, `mantle "${style}" cut path should contain M command`).toContain('M');
      }
    }
  });

  // ---- 14. Side styles with sawtooth curve/reverse isolation ----
  it('side sawtooth curve changes side style output', () => {
    const noCurve = capeWithSideStyle('sawtooth', { sawtoothCurve: 0 });
    const withCurve = capeWithSideStyle('sawtooth', { sawtoothCurve: 0.8 });
    expect(cutPathFingerprint(noCurve)).not.toBe(cutPathFingerprint(withCurve));
  });

  it('side sawtooth reverse changes side style output', () => {
    const normal = capeWithSideStyle('sawtooth', { sawtoothReverse: false });
    const reversed = capeWithSideStyle('sawtooth', { sawtoothReverse: true });
    expect(cutPathFingerprint(normal)).not.toBe(cutPathFingerprint(reversed));
  });

  it('side sawtoothCurve does not affect side scalloped output', () => {
    const a = capeWithSideStyle('scalloped', { sawtoothCurve: 0 });
    const b = capeWithSideStyle('scalloped', { sawtoothCurve: 1 });
    expect(cutPathFingerprint(a)).toBe(cutPathFingerprint(b));
  });

  // ---- 15. Flag sawtooth curve/reverse ----
  it('flag sawtoothCurve changes flag sawtooth output', () => {
    const noCurve = flagWithBottomStyle('sawtooth', { sawtoothCurve: 0 });
    const withCurve = flagWithBottomStyle('sawtooth', { sawtoothCurve: 0.8 });
    expect(cutPathFingerprint(noCurve)).not.toBe(cutPathFingerprint(withCurve));
  });

  it('flag sawtoothReverse changes flag sawtooth output', () => {
    const normal = flagWithBottomStyle('sawtooth', { sawtoothReverse: false });
    const reversed = flagWithBottomStyle('sawtooth', { sawtoothReverse: true });
    expect(cutPathFingerprint(normal)).not.toBe(cutPathFingerprint(reversed));
  });

  it('flag sawtoothCurve does not affect flag scalloped output', () => {
    const a = flagWithBottomStyle('scalloped', { sawtoothCurve: 0 });
    const b = flagWithBottomStyle('scalloped', { sawtoothCurve: 1 });
    expect(cutPathFingerprint(a)).toBe(cutPathFingerprint(b));
  });
});
