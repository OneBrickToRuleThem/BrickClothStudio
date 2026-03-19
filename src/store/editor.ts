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
  // State setters
  setElementType: (type: ElementType) => void;
  setTemplateVariant: (variant: TemplateVariant) => void;
  setParameter: (key: string, value: number | string | boolean) => void;
  setParameters: (params: Record<string, number | string | boolean>) => void;

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
  armSlits: false,
  armSlitY: 0.35,
  armSlitLength: 6,
};

const defaultPrintConfig: PrintSheetConfig = {
  paperSize: 'A4',
  orientation: 'portrait',
  marginTop: 10,
  marginBottom: 10,
  marginLeft: 10,
  marginRight: 10,
  gutterX: 5,
  gutterY: 5,
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
};

export const useEditorStore = create<EditorStore>((set) => ({
  // Initial state
  elementType: 'cape',
  templateVariant: 'standard',
  parameters: { ...defaultParameters },
  decorations: [],
  selectedDecorationId: null,
  printConfig: defaultPrintConfig,
  exportOptions: defaultExportOptions,

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
      ...state,
      parameters: {
        ...state.parameters,
        [key]: value,
      },
    })),

  setParameters: (params) =>
    set((state) => ({
      ...state,
      parameters: {
        ...state.parameters,
        ...params,
      },
    })),

  addDecoration: (decoration) =>
    set((state) => ({
      ...state,
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
      ...state,
      decorations: state.decorations.map((d) =>
        d.id === id ? { ...d, ...updates } : d
      ),
    })),

  removeDecoration: (id) =>
    set((state) => ({
      ...state,
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
    set(() => ({
      elementType: 'cape',
      templateVariant: 'standard',
      parameters: { ...defaultParameters },
      decorations: [],
      selectedDecorationId: null,
      printConfig: { ...defaultPrintConfig },
      exportOptions: { ...defaultExportOptions },
    })),

  loadPreset: (preset) =>
    set(() => ({
      elementType: preset.elementType,
      templateVariant: preset.templateVariant,
      parameters: preset.parameters,
      decorations: preset.decorations,
      selectedDecorationId: null,
    })),
}));
