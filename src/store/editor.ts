/**
 * Zustand store for editor state
 * Manages all design parameters, decorations, and export settings
 */

import { create } from 'zustand';
import {
  EditorState,
  ElementType,
  TemplateVariant,
  DecorationLayer,
  PrintSheetConfig,
  SVGExportOptions,
} from '../utils/types';
import { DEFAULT_HOLE_DIAMETER, DEFAULT_CLEARANCE, DEFAULT_SLIT_WIDTH, DEFAULT_HOLE_TYPE, HOLE_STANDARDS } from '../utils/constants';

export interface EditorStore extends EditorState {
  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Undo/Redo
  history: Array<{ elementType: string; templateVariant: string; parameters: Record<string, number | string | boolean>; decorations: DecorationLayer[] }>;
  historyIndex: number;
  undo: () => void;
  redo: () => void;

  // Snap to grid
  snapToGrid: boolean;
  toggleSnapToGrid: () => void;

  // State setters
  setElementType: (type: ElementType) => void;
  setTemplateVariant: (variant: TemplateVariant) => void;
  setParameter: (key: string, value: number | string | boolean) => void;
  setParameters: (params: Record<string, number | string | boolean>) => void;

  // Per-element parameter memory
  savedParameters: Record<string, Record<string, number | string | boolean>>;
  /** Save current params and switch to a new element type, restoring its saved params */
  switchElement: (type: ElementType, variant: TemplateVariant) => void;
  /** Save current params and switch to a new variant within the same element type */
  switchVariant: (variant: TemplateVariant) => void;

  // Decoration management
  addDecoration: (decoration: Omit<DecorationLayer, 'id'>) => void;
  updateDecoration: (id: string, updates: Partial<DecorationLayer>) => void;
  removeDecoration: (id: string) => void;
  selectDecoration: (id: string | null) => void;

  // Print/export settings
  printConfig: PrintSheetConfig;
  setPrintConfig: (config: Partial<PrintSheetConfig>) => void;

  exportOptions: SVGExportOptions;
  setExportOptions: (options: Partial<SVGExportOptions>) => void;

  // Utilities
  resetToDefaults: () => void;
  loadPreset: (preset: EditorState) => void;
}

const defaultParameters = {
  length: 39,
  width: 40,
  hemWidth: 1.0,
  rounding: false,
  roundingAmount: 0.5,
  holeCount: 2,
  holeType: DEFAULT_HOLE_TYPE,
  holeRadius: HOLE_STANDARDS.minifigure.radius,
  clearance: DEFAULT_CLEARANCE,
  slitWidth: DEFAULT_SLIT_WIDTH,
  enableSlit: false,
  seed: 12345,
  swordSlit: false,
  swordSide: 'right',
  swordAngle: 35,
  swordY: 0.45,
  // Cape modifiers
  tattered: false,
  tatteredIntensity: 0.06,
  tatteredSymmetric: true,
  scalloped: false,
  scallopCount: 8,
  scallopDepth: 3,
  scallopInverted: false,
  starHoles: false,
  starHoleCount: 5,
  starHoleSize: 1.5,
  fishtail: false,
  fishtailDepth: 0.15,
  fishtailNotches: 3,
  asymmetric: false,
  asymmetricSkew: 0.5,
  asymmetricSide: 'left',
  pointed: false,
  pointedDepth: 0.3,
  pointedRoundness: 0.4,
  zigzag: false,
  zigzagCount: 10,
  zigzagDepth: 4,
  wavy: false,
  wavyCount: 6,
  wavyDepth: 3,
  castellated: false,
  castellatedCount: 8,
  castellatedDepth: 3,
  dovetail: false,
  dovetailDepth: 0.25,
  dovetailWidth: 0.3,
  flame: false,
  flameCount: 5,
  flameDepth: 6,
  stepped: false,
  steppedCount: 5,
  steppedDepth: 4,
  serrated: false,
  thorned: false,
  torn: false,
  feathered: false,
  cloud: false,
  sawtooth: false,
  arrow: false,
  picot: false,
  hemEdgeCount: 8,
  hemEdgeDepth: 3,
  armSlits: false,
  armSlitY: 0.35,
  armSlitLength: 6,
  // Side styles
  sideStyle: 'none' as string,
  sideStyleDepth: 3,
  sideStyleCount: 8,
  // Sail parameters
  sailHoleType: 'grommet' as string,
  sailTopStyle: 'none' as string,
  sailBottomStyle: 'none' as string,
  sailLeftStyle: 'none' as string,
  sailRightStyle: 'none' as string,
  sailEdgeDepth: 3,
  sailEdgeCount: 6,
  // Per-edge depth overrides (0 = use global sailEdgeDepth)
  sailTopDepth: 0,
  sailBottomDepth: 0,
  sailLeftDepth: 0,
  sailRightDepth: 0,
  // Torn edge seed (different seeds produce different tear patterns)
  sailTornSeed: 42,
  // Sail options
  sailSymmetry: false as boolean,
  sailLockCorners: true as boolean,
  sailGrommetMargin: 3,
  sailSides: 6,  // polygon sail: number of sides (5-12)
  sailPolygonInset: 4, // polygon grommet inset from bounding box edge (mm)
  sailPolygonGrommetMask: '', // per-vertex enable mask, e.g. '111111' — empty = all enabled
  sailPolygonGrommetPositions: '[]' as string, // JSON array of {x,y} custom polygon grommet positions — empty = use computed defaults
  sailExtraGrommets: '[]' as string, // JSON array of {x, y} extra grommet positions
  sailStudWidth: 0,  // LEGO stud-based sizing (0 = manual mm)
  sailStudLength: 0,
  // Kama edge styles
  kamaEdgeStyle: 'none' as string,
  kamaEdgeDepth: 2,
  kamaEdgeCount: 6,
  // Mantle edge styles
  mantleEdgeStyle: 'none' as string,
  mantleEdgeDepth: 2,
  mantleEdgeCount: 6,
  mantleRounding: false as boolean,
  mantleRoundingAmount: 0.5,
  // Custom flag
  flagCustomHoleCount: 2,
  // Custom hole override (applies to cape, flag, kama, mantle)
  holeOverride: false as boolean,
  holeOverrideShape: 'round' as string, // round | square | oval | pill
  holeOverrideDiameter: HOLE_STANDARDS.minifigure.diameter,
  holeOverrideWidth: 5.0,  // for oval/square: horizontal dimension
  holeOverrideHeight: 3.5, // for oval: vertical dimension
  holeOverrideOffsetX: 0,  // mm, mirrored horizontal offset (positive = spread apart)
  holeOverrideOffsetY: 0,  // mm, vertical offset (positive = move down)
  // Sail grommet positions (inset from corners in mm)
  sailGrommetTLx: 4,
  sailGrommetTLy: 4,
  sailGrommetTRx: 4,
  sailGrommetTRy: 4,
  sailGrommetBLx: 4,
  sailGrommetBLy: 4,
  sailGrommetBRx: 4,
  sailGrommetBRy: 4,
  // Wing edge midpoints (JSON arrays of {x,y} in absolute mm)
  wingEdge0Points: '[]' as string,
  wingEdge1Points: '[]' as string,
  wingEdge2Points: '[]' as string,
  wingEdge3Points: '[]' as string,
  // Wing edge styles
  wingEdgeStyle: 'none' as string,
  wingEdgeDepth: 3,
  wingEdgeCount: 6,
  wingTornSeed: 42,
  // Custom image trace
  customImageData: '' as string,   // base64 data URL of uploaded image
  customTraceSvg: '' as string,    // traced SVG path data (combined)
  customTraceContours: '[]' as string,  // JSON array of individual contour path strings
  customThreshold: 128,
  customInvert: false as boolean,
  customBlur: 1,
  customSimplify: 1.5,
  customSmooth: true as boolean,
  customMinArea: 20,
  customTraceTargetW: 40,               // stable target width for tracing (mm)
  customTraceTargetH: 40,               // stable target height for tracing (mm)
  customDetectedHoles: '[]' as string,  // JSON array of {cx, cy, radius, enabled, rawRadius}
  customHoleRadius: 2.65,               // override radius for detected holes (mm)
  customHoleScaleApplied: false as boolean,  // whether scale-to-hole has been applied
  // Color split design
  colorSplitCount: 0 as number,
  colorSplitAngle: 0 as number,
  colorSplitColors: '[]' as string,
  // Edge color band
  edgeColorEnabled: false as boolean,
  edgeColorWidth: 2 as number,
  edgeColor: '#8B4513' as string,
  // Stripe design
  stripeEnabled: false as boolean,
  stripeWidth: 3 as number,
  stripeAngle: 0 as number,
  stripeColors: '["#1a1a8a","#c0c0c0"]' as string,
  stripeColorCount: 2 as number,
};

// Default dimensions per element type / variant
export const ELEMENT_DIMENSION_DEFAULTS: Record<string, { width: number; length: number }> = {
  'cape': { width: 40, length: 39 },
  'flag:small-flag': { width: 22, length: 60 },
  'flag:large-flag': { width: 40, length: 64 },
  'flag:custom-flag': { width: 30, length: 60 },

  'wings': { width: 45, length: 25 },
  'wings:tattered-wing': { width: 173, length: 101 },
  'wings:custom-wing': { width: 45, length: 30 },
  'kama': { width: 47, length: 19 },
  'kama:full-skirt': { width: 47, length: 19 },
  'mantle': { width: 23, length: 26 },
  'cape:wind-swept': { width: 47, length: 51 },
  'cape:phantom-shroud': { width: 48, length: 51 },
  'cape:seven-points': { width: 52, length: 40 },
  'cape:narrow-single-hole': { width: 28, length: 36 },
  'cape:top-single-hole': { width: 37, length: 37 },
  'cape:stepped-single-hole': { width: 41, length: 37 },
  'mantle:high-collar': { width: 32, length: 18 },
  'sail': { width: 60, length: 60 },
  'sail:polygon-sail': { width: 60, length: 60 },
  'custom': { width: 40, length: 40 },
};

function getDimensionDefaults(elementType: string, templateVariant: string) {
  const key = `${elementType}:${templateVariant}`;
  return ELEMENT_DIMENSION_DEFAULTS[key] || ELEMENT_DIMENSION_DEFAULTS[elementType] || { width: 40, length: 40 };
}

/** Extra default parameter overrides for specific variants. */
function getVariantOverrides(templateVariant: string): Record<string, number | string | boolean> {
  if (templateVariant === 'custom-wing') {
    return {
      // Asymmetric wing shape: swept-back quadrilateral
      sailGrommetTLx: 5,   // wing root, upper
      sailGrommetTLy: 2,
      sailGrommetTRx: 3,   // wing tip, upper  (45-3 = 42)
      sailGrommetTRy: 5,
      sailGrommetBRx: 7,   // wing tip, lower  (45-7 = 38)
      sailGrommetBRy: 5,   //                  (30-5 = 25)
      sailGrommetBLx: 3,   // wing root, lower
      sailGrommetBLy: 2,   //                  (30-2 = 28)
      sailLockCorners: true,
      sailHoleType: 'ball-joint',
      sailGrommetMargin: 2,
      sailSymmetry: false,
      wingEdge0Points: '[]',
      wingEdge1Points: '[]',
      wingEdge2Points: '[]',
      wingEdge3Points: '[]',
      wingEdgeStyle: 'none',
      wingEdgeDepth: 3,
      wingEdgeCount: 6,
      wingTornSeed: 42,
    };
  }
  return {};
}

const defaultPrintConfig: PrintSheetConfig = {
  paperSize: 'A4',
  orientation: 'portrait',
  marginTop: 10,
  marginBottom: 10,
  marginLeft: 10,
  marginRight: 10,
  gutterX: 2,
  gutterY: 2,
  copies: 1,
  autoRotate: true,
  showLabels: true,
  showPageOutline: true,
};

const defaultExportOptions: SVGExportOptions = {
  strokeWidth: 0.1,
  includeLayers: {
    cut: true,
    score: false,
    engrave: false,
    reference: false,
  },
  lineColors: {
    cut: '#ff0000',
    score: '#0000ff',
    engrave: '#00aa00',
    reference: '#cccccc',
  },
  groupByLayer: true,
  includeDesigns: false,
};

const MAX_HISTORY = 50;

type HistoryEntry = {
  elementType: string;
  templateVariant: string;
  parameters: Record<string, number | string | boolean>;
  decorations: DecorationLayer[];
};

function snapshot(state: EditorStore): HistoryEntry {
  return {
    elementType: state.elementType,
    templateVariant: state.templateVariant,
    parameters: { ...state.parameters },
    decorations: state.decorations.map((d) => ({ ...d })),
  };
}

function pushHistory(state: EditorStore): Partial<EditorStore> {
  const entry = snapshot(state);
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(entry);
  if (newHistory.length > MAX_HISTORY) newHistory.shift();
  return { history: newHistory, historyIndex: newHistory.length - 1 };
}

export const useEditorStore = create<EditorStore>((set) => ({
  // Initial state
  elementType: 'cape',
  templateVariant: 'standard',
  parameters: { ...defaultParameters },
  decorations: [],
  selectedDecorationId: null,
  printConfig: defaultPrintConfig,
  exportOptions: defaultExportOptions,
  savedParameters: {},

  // Theme
  theme: 'light',
  toggleTheme: () =>
    set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

  // Undo/Redo — timeline of state snapshots
  history: [{ elementType: 'cape', templateVariant: 'standard', parameters: { ...defaultParameters }, decorations: [] }],
  historyIndex: 0,
  undo: () =>
    set((state) => {
      if (state.historyIndex <= 0) return {};
      const entry = state.history[state.historyIndex - 1];
      return {
        elementType: entry.elementType as ElementType,
        templateVariant: entry.templateVariant as TemplateVariant,
        parameters: { ...entry.parameters },
        decorations: entry.decorations.map((d) => ({ ...d })),
        historyIndex: state.historyIndex - 1,
      };
    }),
  redo: () =>
    set((state) => {
      if (state.historyIndex >= state.history.length - 1) return {};
      const entry = state.history[state.historyIndex + 1];
      return {
        elementType: entry.elementType as ElementType,
        templateVariant: entry.templateVariant as TemplateVariant,
        parameters: { ...entry.parameters },
        decorations: entry.decorations.map((d) => ({ ...d })),
        historyIndex: state.historyIndex + 1,
      };
    }),

  // Snap to grid
  snapToGrid: false,
  toggleSnapToGrid: () =>
    set((state) => ({ snapToGrid: !state.snapToGrid })),

  // Setters
  setElementType: (type) =>
    set((state) => ({
      ...state,
      elementType: type,
    })),

  setTemplateVariant: (variant) =>
    set((state) => ({
      ...state,
      templateVariant: variant,
    })),

  setParameter: (key, value) =>
    set((state) => ({
      ...pushHistory(state),
      parameters: {
        ...state.parameters,
        [key]: value,
      },
    })),

  setParameters: (params) =>
    set((state) => ({
      ...pushHistory(state),
      parameters: {
        ...state.parameters,
        ...params,
      },
    })),

  switchElement: (type, variant) =>
    set((state) => {
      const hist = pushHistory(state);
      const currentKey = `${state.elementType}:${state.templateVariant}`;
      const targetKey = `${type}:${variant}`;
      const saved = { ...state.savedParameters, [currentKey]: { ...state.parameters } };
      const dims = getDimensionDefaults(type, variant);
      const restored = saved[targetKey]
        ? { ...saved[targetKey] }
        : { ...defaultParameters, width: dims.width, length: dims.length, ...getVariantOverrides(variant) };
      return {
        ...hist,
        elementType: type,
        templateVariant: variant,
        parameters: restored,
        savedParameters: saved,
      };
    }),

  switchVariant: (variant) =>
    set((state) => {
      const hist = pushHistory(state);
      const currentKey = `${state.elementType}:${state.templateVariant}`;
      const targetKey = `${state.elementType}:${variant}`;
      const saved = { ...state.savedParameters, [currentKey]: { ...state.parameters } };
      const dims = getDimensionDefaults(state.elementType, variant);
      const restored = saved[targetKey]
        ? { ...saved[targetKey] }
        : { ...defaultParameters, width: dims.width, length: dims.length, ...getVariantOverrides(variant) };
      return {
        ...hist,
        templateVariant: variant,
        parameters: restored,
        savedParameters: saved,
      };
    }),

  addDecoration: (decoration) =>
    set((state) => ({
      ...pushHistory(state),
      decorations: [
        ...state.decorations,
        {
          ...decoration,
          id: `deco-${Date.now()}`,
        },
      ],
    })),

  updateDecoration: (id, updates) =>
    set((state) => ({
      ...pushHistory(state),
      decorations: state.decorations.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    })),

  removeDecoration: (id) =>
    set((state) => ({
      ...pushHistory(state),
      decorations: state.decorations.filter((d) => d.id !== id),
      selectedDecorationId:
        state.selectedDecorationId === id ? null : state.selectedDecorationId,
    })),

  selectDecoration: (id) =>
    set((state) => ({
      ...state,
      selectedDecorationId: id,
    })),

  setPrintConfig: (config) =>
    set((state) => ({
      ...state,
      printConfig: {
        ...state.printConfig,
        ...config,
      },
    })),

  setExportOptions: (options) =>
    set((state) => ({
      ...state,
      exportOptions: {
        ...state.exportOptions,
        ...options,
        includeLayers: options.includeLayers
          ? {
              ...state.exportOptions.includeLayers,
              ...options.includeLayers,
            }
          : state.exportOptions.includeLayers,
        lineColors: options.lineColors
          ? {
              ...state.exportOptions.lineColors,
              ...options.lineColors,
            }
          : state.exportOptions.lineColors,
      },
    })),

  resetToDefaults: () =>
    set((state) => {
      const hist = pushHistory(state);
      const dims = getDimensionDefaults(state.elementType, state.templateVariant);
      const currentKey = `${state.elementType}:${state.templateVariant}`;
      const saved = { ...state.savedParameters };
      delete saved[currentKey];
      return {
        ...hist,
        parameters: { ...defaultParameters, width: dims.width, length: dims.length },
        savedParameters: saved,
        decorations: [],
        selectedDecorationId: null,
      };
    }),

  loadPreset: (preset) =>
    set(() => ({
      elementType: preset.elementType,
      templateVariant: preset.templateVariant,
      parameters: preset.parameters,
      decorations: preset.decorations,
      selectedDecorationId: null,
    })),
}));
