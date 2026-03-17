/**
 * Type definitions for the Brick Cloth Studio application
 */

export type ElementType = 'cape' | 'cloak' | 'flag' | 'banner' | 'wings' | 'kama' | 'pauldron' | 'custom';
export type TemplateVariant = 
  | 'standard'
  | 'short'
  | 'long'
  | 'tattered'
  | 'hooded'
  | 'swallowtail'
  | 'small-wings'
  | 'large-wings'
  | 'wrap-skirt'
  | 'shoulder-armor'
  | 'calibration-test'
  | 'reference-test';

export interface Point {
  x: number;
  y: number;
}

export interface Vector {
  x: number;
  y: number;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Pattern export structure
 * Contains separate path groups for different laser/cutting operations
 */
export interface PatternExport {
  id: string;
  name: string;
  cutPaths: string[]; // SVG path data for cutting
  scorePaths: string[]; // SVG path data for scoring (optional)
  engravePaths: string[]; // SVG path data for engraving (optional)
  referencePaths: string[]; // SVG path data for reference/guide (optional)
  boundingBox: BoundingBox;
  metadata: PatternMetadata;
}

export interface PatternMetadata {
  elementType: ElementType;
  templateVariant: TemplateVariant;
  parameters: Record<string, number | string | boolean>;
  createdAt: string;
  version: string;
}

/**
 * Decoration/import layer
 */
export interface DecorationLayer {
  id: string;
  name: string;
  type: 'svg' | 'image' | 'text';
  data: string; // SVG path data, image URL, or text content
  x: number; // position in mm
  y: number;
  scale: number; // scale factor
  rotation: number; // degrees
  clipToSilhouette: boolean;
  visible: boolean;
  locked: boolean;
}

/**
 * Editor state
 */
export interface EditorState {
  elementType: ElementType;
  templateVariant: TemplateVariant;
  parameters: Record<string, number | string | boolean>;
  decorations: DecorationLayer[];
  selectedDecorationId: string | null;
}

/**
 * Print sheet configuration
 */
export interface PrintSheetConfig {
  paperSize: 'A4' | 'LETTER';
  orientation: 'portrait' | 'landscape';
  marginTop: number; // mm
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  gutterX: number; // spacing between elements
  gutterY: number;
  copies: number;
  autoRotate: boolean; // try rotating 90° if it fits better
  showLabels: boolean;
  showPageOutline: boolean;
}

/**
 * SVG export options
 */
export interface SVGExportOptions {
  strokeWidth: number; // mm
  includeLayers: {
    cut: boolean;
    score: boolean;
    engrave: boolean;
    reference: boolean;
  };
  lineColors: {
    cut: string;
    score: string;
    engrave: string;
    reference: string;
  };
  groupByLayer: boolean;
}

/**
 * Calibration test strip configuration
 */
export interface CalibrationTestConfig {
  holeSizes: number[]; // mm diameters to test
  quantity: number; // copies of each hole
  material: 'fabric' | 'paper' | 'cardstock';
  testLabel: string;
}

/**
 * Preset for saving/loading design configurations
 */
export interface DesignPreset {
  name: string;
  description: string;
  version: string;
  elementType: ElementType;
  templateVariant: TemplateVariant;
  parameters: Record<string, number | string | boolean>;
  decorations: DecorationLayer[];
  createdAt: string;
  author: string;
}
