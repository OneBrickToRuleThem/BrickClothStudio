/**
 * Calibration test strip generator
 * Creates a sheet with multiple hole sizes for laser/Cricut testing
 */

import { SVGPath, circlePath } from '../geometry/primitives';
import { PatternExport, BoundingBox } from '../utils/types';

export interface CalibrationTestParams {
  holeSizes: number[]; // diameters in mm
  quantityPerSize: number;
  labelText: string;
  spacing: number; // mm between holes
}

/**
 * Generate a calibration test pattern
 * Outputs circles with specified diameters for testing fit with LEGO studs
 */
export function generateCalibrationTest(
  params: CalibrationTestParams
): PatternExport {
  const { holeSizes, quantityPerSize, labelText, spacing } = params;

  // Layout: arrange holes in a grid
  const margin = 10; // mm margin around sheet
  const rowSpacing = 20; // mm vertical spacing between hole rows
  const colSpacing = 15; // mm horizontal spacing between holes in a row

  let cutPaths: string[] = [];
  let maxX = margin;
  let maxY = margin;

  // Generate holes
  let y = margin;
  for (const diameter of holeSizes) {
    const radius = diameter / 2;
    let x = margin;

    for (let i = 0; i < quantityPerSize; i++) {
      const centerX = x + radius;
      const centerY = y + radius;

      // Create circle path
      const circleSVG = circlePath(centerX, centerY, radius);
      cutPaths.push(circleSVG);

      x += diameter + colSpacing;
      maxX = Math.max(maxX, x);
    }

    y += rowSpacing;
    maxY = Math.max(maxY, y);
  }

  // Add title text as reference (not cut)
  const refPaths: string[] = [];
  refPaths.push(
    `<text x="10" y="10" font-size="4" font-family="Arial">${labelText}</text>`
  );

  // Create metadata labels for each hole size
  y = margin;
  for (const diameter of holeSizes) {
    const label = `${diameter.toFixed(2)}mm`;
    refPaths.push(
      `<text x="10" y="${y + 5}" font-size="3" font-family="Arial">${label}</text>`
    );
    y += rowSpacing;
  }

  const bbox: BoundingBox = {
    x: 0,
    y: 0,
    width: maxX + margin,
    height: maxY + margin,
  };

  return {
    id: 'calib-test',
    name: `Calibration Test - ${labelText}`,
    cutPaths,
    scorePaths: [],
    engravePaths: [],
    referencePaths: refPaths,
    boundingBox: bbox,
    metadata: {
      elementType: 'custom',
      templateVariant: 'calibration-test',
      parameters: {
        quantityPerSize: params.quantityPerSize,
        labelText: params.labelText,
        spacing: params.spacing,
        holeSizes: params.holeSizes.join(','),
      } as Record<string, number | string | boolean>,
      createdAt: new Date().toISOString(),
      version: '1.0.0',
    },
  };
}

/**
 * Default calibration test for LEGO stud fitting
 * Tests hole sizes: 4.8, 4.9, 5.0, 5.1, 5.2 mm
 */
export function generateStandardLEGOCalibration(): PatternExport {
  return generateCalibrationTest({
    holeSizes: [4.8, 4.9, 5.0, 5.1, 5.2],
    quantityPerSize: 3,
    labelText: 'LEGO Stud Hole Calibration Test',
    spacing: 5,
  });
}
