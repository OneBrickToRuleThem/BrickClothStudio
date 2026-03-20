/**
 * Constants for LEGO scale and page sizing
 * All measurements in millimeters (mm)
 * LEGO system based on 8mm grid
 */

// LEGO stud geometry
export const LEGO_STUD_DIAMETER_NOM = 4.8; // mm, nominal
export const LEGO_STUD_DIAMETER_MIN = 4.87; // mm, tight tolerance
export const LEGO_STUD_DIAMETER_MAX = 4.90; // mm, loose tolerance
export const LEGO_GRID_SIZE = 8; // mm, fundamental LEGO grid unit

// Default hole and clearance settings
export const DEFAULT_HOLE_DIAMETER = 5.0; // mm
export const DEFAULT_CLEARANCE = 0.2; // mm (allows for fabric thickness)
export const DEFAULT_SLIT_WIDTH = 1.2; // mm, for keyhole attachment

// Attachment hole standards for LEGO figures
export const HOLE_STANDARDS = {
  minifigure: {
    radius: 2.65, // mm, fits standard minifig neck stud (5.3mm diameter)
    diameter: 5.3,
    label: 'Minifigure (5.3mm)',
    description: 'Standard 8mm LEGO minifigure neck posts',
  },
  minidoll: {
    radius: 2.4, // mm, fits minidoll neck post (4.8mm diameter)
    diameter: 4.8,
    label: 'Minidoll (4.8mm)',
    description: 'Smaller LEGO minidoll/Friends neck posts',
  },
} as const;

export const DEFAULT_HOLE_TYPE = 'minifigure' as const;

// Sail-specific grommet/hole standards
export const SAIL_HOLE_STANDARDS = {
  grommet: {
    radius: 1.5, // mm, standard fabric grommet
    diameter: 3.0,
    label: 'Grommet (3mm)',
    description: 'Standard small grommet for lacing',
  },
  dring: {
    radius: 2.0, // mm, D-ring reinforced hole
    diameter: 4.0,
    label: 'D-Ring (4mm)',
    description: 'Larger reinforced hole for D-ring attachment',
  },
  lacing: {
    radius: 0.75, // mm, small lacing holes in a row
    diameter: 1.5,
    label: 'Lacing (1.5mm)',
    description: 'Small holes for thread/lace attachment',
  },
  pin: {
    radius: 1.0, // mm, pin-sized hole
    diameter: 2.0,
    label: 'Pin hole (2mm)',
    description: 'Small pin-sized attachment hole',
  },
} as const;

export type SailHoleType = keyof typeof SAIL_HOLE_STANDARDS;

// LEGO stud-based sail size presets
export const LEGO_STUD_SAIL_PRESETS = [
  { studsW: 4, studsH: 4, label: '4×4 studs' },
  { studsW: 6, studsH: 6, label: '6×6 studs' },
  { studsW: 6, studsH: 8, label: '6×8 studs' },
  { studsW: 8, studsH: 8, label: '8×8 studs' },
  { studsW: 8, studsH: 12, label: '8×12 studs' },
  { studsW: 10, studsH: 10, label: '10×10 studs' },
  { studsW: 10, studsH: 16, label: '10×16 studs' },
  { studsW: 12, studsH: 16, label: '12×16 studs' },
] as const;

// Paper sizes (mm)
export const PAPER_SIZES = {
  A4: { width: 210, height: 297, label: 'A4 (210×297 mm)' },
  LETTER: { width: 216, height: 279, label: 'US Letter (216×279 mm)' },
} as const;

// SVG export settings
export const SVG_STROKE_WIDTH = 0.1; // mm, for cut lines
export const SVG_CUT_COLOR = '#ff0000'; // red
export const SVG_SCORE_COLOR = '#0000ff'; // blue
export const SVG_ENGRAVE_COLOR = '#00aa00'; // green
export const SVG_REFERENCE_COLOR = '#cccccc'; // light gray

// Default margins and spacing (mm)
export const DEFAULT_PAGE_MARGIN = 10;
export const DEFAULT_GUTTER = 5;
export const DEFAULT_ELEMENT_SPACING = 3;

// Print settings
export const MIN_COPIES = 1;
export const MAX_COPIES = 20;
export const DEFAULT_COPIES = 1;

// Canvas/preview settings
export const CANVAS_SCALE_MM_TO_PX = 2; // 2 pixels per mm for preview
export const CANVAS_GRID_SPACING = LEGO_GRID_SIZE; // 8mm grid
