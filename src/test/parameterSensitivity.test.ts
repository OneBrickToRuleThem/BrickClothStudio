/**
 * Parameter Sensitivity Tests
 *
 * For every element variant, adjusts each user-facing parameter and verifies
 * that the exported SVG actually changes. A parameter that claims to be
 * adjustable but produces identical SVG output is either dead code or a bug.
 */

import { describe, it, expect } from 'vitest';
import { generatePattern } from '../services/patternGenerator';
import { exportSinglePatternSVG } from '../export/svg';
import { ElementType, TemplateVariant } from '../utils/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface VariantConfig {
  element: ElementType;
  variant: TemplateVariant;
  defaults: Record<string, number | string | boolean>;
  /** Which parameter categories this variant supports */
  caps: ParameterCap[];
}

/** Parameter capability categories */
type ParameterCap =
  | 'dimensions'          // width, length (all variants)
  | 'capeTransforms'      // hemWidth, bottomCurve, sideCurve
  | 'capeHemStyles'       // bottom edge boolean flags (zigzag, scalloped, etc.)
  | 'capeSideStyles'      // sideStyle string dropdown
  | 'capeCuts'            // swordSlit, armSlits, starHoles
  | 'capeHoleRadius'      // holeRadius → generateRefHoles
  | 'capeSeed'            // seed affects tattered hem
  | 'kamaEdgeStyle'       // kamaEdgeStyle string
  | 'mantleEdgeStyle'     // mantleEdgeStyle string
  | 'mantleBottomCurve'   // mantleBottomCurve
  | 'sailHoleType'        // sailHoleType, sailGrommetMargin
  | 'polygonSides'        // sailSides (polygon-sail only)
  | 'flagStyles'          // flagBottomStyle, flagLeftStyle, flagRightStyle
  | 'wingsHoleRadius';    // holeRadius for wings

interface ParamTweak {
  label: string;
  params: Record<string, number | string | boolean>;
  cap: ParameterCap;
}

// ---------------------------------------------------------------------------
// Variant catalogue — tagged with supported parameter categories
// ---------------------------------------------------------------------------

const VARIANTS: VariantConfig[] = [
  // ── Procedural capes ────────────────────────────────────────
  { element: 'cape', variant: 'standard',
    defaults: { width: 40, length: 39 },
    caps: ['dimensions', 'capeTransforms', 'capeHemStyles', 'capeSideStyles', 'capeCuts', 'capeHoleRadius'] },

  { element: 'cape', variant: 'narrow-single-hole',
    defaults: { width: 28, length: 36 },
    caps: ['dimensions', 'capeTransforms', 'capeHemStyles', 'capeSideStyles', 'capeCuts'] },
    // NB: narrow-single-hole uses fixed hole size, so holeRadius is excluded

  { element: 'cape', variant: 'tattered',
    defaults: { width: 40, length: 39, seed: 42 },
    caps: ['dimensions', 'capeSeed', 'capeHoleRadius'] },

  // ── SVG-traced capes (outline only — scale via dimensions) ─
  { element: 'cape', variant: 'top-single-hole',
    defaults: { width: 37, length: 37 },
    caps: ['dimensions'] },

  { element: 'cape', variant: 'stepped-single-hole',
    defaults: { width: 41, length: 37 },
    caps: ['dimensions'] },

  { element: 'cape', variant: 'man-bat-single-hole',
    defaults: { width: 89.5, length: 50 },
    caps: ['dimensions'] },

  { element: 'cape', variant: 'wind-swept',
    defaults: { width: 47, length: 51 },
    caps: ['dimensions'] },

  { element: 'cape', variant: 'phantom-shroud',
    defaults: { width: 48, length: 51 },
    caps: ['dimensions'] },

  { element: 'cape', variant: 'seven-points',
    defaults: { width: 52, length: 40 },
    caps: ['dimensions'] },

  // ── Flags ───────────────────────────────────────────────────
  { element: 'flag', variant: 'small-flag',
    defaults: { width: 22, length: 60 },
    caps: ['dimensions'] },

  { element: 'flag', variant: 'large-flag',
    defaults: { width: 40, length: 64 },
    caps: ['dimensions'] },

  { element: 'flag', variant: 'custom-flag',
    defaults: { width: 30, length: 60 },
    caps: ['dimensions', 'flagStyles'] },

  // ── Wings ───────────────────────────────────────────────────
  { element: 'wings', variant: 'standard',
    defaults: { width: 45, length: 25 },
    caps: ['dimensions'] },

  { element: 'wings', variant: 'tattered-wing',
    defaults: { width: 173, length: 101 },
    caps: ['dimensions'] },

  // ── Kama ────────────────────────────────────────────────────
  { element: 'kama', variant: 'standard',
    defaults: { width: 47, length: 19 },
    caps: ['dimensions', 'kamaEdgeStyle'] },

  { element: 'kama', variant: 'full-skirt',
    defaults: { width: 47, length: 19 },
    caps: ['dimensions', 'kamaEdgeStyle'] },

  // ── Mantle ──────────────────────────────────────────────────
  { element: 'mantle', variant: 'standard',
    defaults: { width: 23, length: 26 },
    caps: ['dimensions', 'mantleEdgeStyle', 'mantleBottomCurve'] },

  { element: 'mantle', variant: 'high-collar',
    defaults: { width: 32, length: 18 },
    caps: ['dimensions', 'mantleEdgeStyle'] },

  // ── Sail ────────────────────────────────────────────────────
  { element: 'sail', variant: 'standard',
    defaults: { width: 60, length: 60 },
    caps: ['dimensions', 'sailHoleType'] },

  { element: 'sail', variant: 'triangular-sail',
    defaults: { width: 60, length: 60 },
    caps: ['dimensions', 'sailHoleType'] },

  { element: 'sail', variant: 'polygon-sail',
    defaults: { width: 60, length: 60, sailSides: 6 },
    caps: ['dimensions', 'sailHoleType', 'polygonSides'] },
];

// ---------------------------------------------------------------------------
// Shared base parameters
// ---------------------------------------------------------------------------

const BASE_PARAMS: Record<string, number | string | boolean> = {
  holeRadius: 2.5,
  clearance: 0.2,
  slitWidth: 1.2,
  enableSlit: false,
  seed: 42,
  hemWidth: 1.0,
  bottomCurve: 0,
  sideCurve: 0,
  sideStyle: 'none',
  sideStyleCount: 6,
  sideStyleDepth: 3,
  swordSlit: false,
  armSlits: false,
  starHoles: false,
  mantleBottomCurve: 0,
};

// ---------------------------------------------------------------------------
// Bottom hem styles — actual UI boolean flag combinations
// Note: "arched" = scalloped + scallopInverted (no standalone arched boolean)
// ---------------------------------------------------------------------------

const CAPE_HEM_STYLES: { label: string; params: Record<string, boolean> }[] = [
  { label: 'scalloped',   params: { scalloped: true } },
  { label: 'arched',      params: { scalloped: true, scallopInverted: true } },
  { label: 'notched',     params: { notched: true } },
  { label: 'zigzag',      params: { zigzag: true } },
  { label: 'wavy',        params: { wavy: true } },
  { label: 'castellated', params: { castellated: true } },
  { label: 'dovetail',    params: { dovetail: true } },
  { label: 'flame',       params: { flame: true } },
  { label: 'stepped',     params: { stepped: true } },
  { label: 'thorned',     params: { thorned: true } },
  { label: 'torn',        params: { torn: true } },
  { label: 'feathered',   params: { feathered: true } },
  { label: 'cloud',       params: { cloud: true } },
  { label: 'sawtooth',    params: { sawtooth: true } },
  { label: 'arrow',       params: { arrow: true } },
  { label: 'picot',       params: { picot: true } },
];

// Representative side/element edge style samples
const SIDE_STYLE_SAMPLES = ['zigzag', 'scalloped', 'wavy', 'castellated', 'torn'];
const ELEMENT_EDGE_SAMPLES = ['zigzag', 'scalloped', 'wavy', 'castellated'];

// ---------------------------------------------------------------------------
// Parameter tweaks — keyed by required capability
// ---------------------------------------------------------------------------

const PARAM_TWEAKS: ParamTweak[] = [
  // ── dimensions ─────────────────────────────────────────────
  { label: 'increase length', params: { length: 70 }, cap: 'dimensions' },
  { label: 'increase width',  params: { width: 55 },  cap: 'dimensions' },

  // ── capeTransforms ─────────────────────────────────────────
  { label: 'hemWidth',           params: { hemWidth: 1.3 },    cap: 'capeTransforms' },
  { label: 'bottomCurve',        params: { bottomCurve: 0.6 }, cap: 'capeTransforms' },
  { label: 'sideCurve positive', params: { sideCurve: 0.5 },   cap: 'capeTransforms' },
  { label: 'sideCurve negative', params: { sideCurve: -0.5 },  cap: 'capeTransforms' },

  // ── capeHemStyles ──────────────────────────────────────────
  ...CAPE_HEM_STYLES.map(s => ({
    label: `bottom edge: ${s.label}`,
    params: { ...s.params, hemEdgeCount: 6, hemEdgeDepth: 3 },
    cap: 'capeHemStyles' as ParameterCap,
  })),

  // ── capeSideStyles ─────────────────────────────────────────
  ...SIDE_STYLE_SAMPLES.map(s => ({
    label: `side edge: ${s}`,
    params: { sideStyle: s, sideStyleCount: 6, sideStyleDepth: 3 },
    cap: 'capeSideStyles' as ParameterCap,
  })),

  // ── capeCuts ───────────────────────────────────────────────
  { label: 'swordSlit',  params: { swordSlit: true, swordSide: 'right', swordAngle: 35, swordY: 0.45 }, cap: 'capeCuts' },
  { label: 'armSlits',   params: { armSlits: true, armSlitY: 0.35, armSlitLength: 6 },                    cap: 'capeCuts' },
  { label: 'starHoles',  params: { starHoles: true, starHoleCount: 5, starHoleSize: 1.5, seed: 42 },     cap: 'capeCuts' },

  // ── capeHoleRadius ─────────────────────────────────────────
  { label: 'holeRadius', params: { holeRadius: 3.5 }, cap: 'capeHoleRadius' },

  // ── capeSeed ───────────────────────────────────────────────
  { label: 'seed change', params: { seed: 999 }, cap: 'capeSeed' },

  // ── kamaEdgeStyle ──────────────────────────────────────────
  ...ELEMENT_EDGE_SAMPLES.map(s => ({
    label: `kama edge: ${s}`,
    params: { kamaEdgeStyle: s, kamaEdgeDepth: 2, kamaEdgeCount: 6 },
    cap: 'kamaEdgeStyle' as ParameterCap,
  })),

  // ── mantleEdgeStyle ────────────────────────────────────────
  ...ELEMENT_EDGE_SAMPLES.map(s => ({
    label: `mantle edge: ${s}`,
    params: { mantleEdgeStyle: s, mantleEdgeDepth: 2, mantleEdgeCount: 6 },
    cap: 'mantleEdgeStyle' as ParameterCap,
  })),

  // ── mantleBottomCurve ──────────────────────────────────────
  { label: 'mantleBottomCurve', params: { mantleBottomCurve: 0.5 }, cap: 'mantleBottomCurve' },

  // ── sailHoleType ───────────────────────────────────────────
  { label: 'sailHoleType = dring',  params: { sailHoleType: 'dring' }, cap: 'sailHoleType' },
  { label: 'sailGrommetMargin = 6', params: { sailGrommetMargin: 6 },  cap: 'sailHoleType' },

  // ── polygonSides ───────────────────────────────────────────
  { label: 'polygon sides = 8', params: { sailSides: 8 }, cap: 'polygonSides' },

  // ── flagStyles ─────────────────────────────────────────────
  { label: 'flagBottomStyle = zigzag', params: { flagBottomStyle: 'zigzag' }, cap: 'flagStyles' },
  { label: 'flagLeftStyle = wavy',     params: { flagLeftStyle: 'wavy' },     cap: 'flagStyles' },

  // ── wingsHoleRadius ────────────────────────────────────────
  { label: 'holeRadius (wings)', params: { holeRadius: 3.5 }, cap: 'wingsHoleRadius' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function svgFor(
  element: ElementType,
  variant: TemplateVariant,
  params: Record<string, number | string | boolean>
): string {
  const pattern = generatePattern(element, variant, params);
  return exportSinglePatternSVG(pattern);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Parameter Sensitivity', () => {
  for (const v of VARIANTS) {
    const variantLabel = `${v.element}/${v.variant}`;
    const defaultParams = { ...BASE_PARAMS, ...v.defaults };

    const baselineSvg = svgFor(v.element, v.variant, defaultParams);

    it(`${variantLabel}: baseline produces valid SVG`, () => {
      expect(baselineSvg).toContain('<svg');
      expect(baselineSvg).toContain('<path');
    });

    for (const tweak of PARAM_TWEAKS) {
      if (!v.caps.includes(tweak.cap)) continue;

      it(`${variantLabel}: "${tweak.label}" changes SVG`, () => {
        const tweakedSvg = svgFor(v.element, v.variant, { ...defaultParams, ...tweak.params });
        expect(tweakedSvg).not.toBe(baselineSvg);
      });
    }
  }
});
