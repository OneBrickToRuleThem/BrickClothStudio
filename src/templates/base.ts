/**
 * Template generator base and utilities
 * Each template returns a PatternExport with cut/score/engrave paths
 */

import { PatternExport, BoundingBox } from '../utils/types';
import { SVGPath, circlePath, keyholeSlitPath, squareHolePath, ovalHolePath, calculateBoundingBox } from '../geometry/primitives';

export interface TemplateParams {
  // Common parameters for all templates
  length: number; // mm, length of garment
  width: number; // mm, width at top/widest point
  holeRadius: number; // mm, radius of neck/attachment hole
  clearance: number; // mm, additional clearance for fabric thickness
  slitWidth: number; // mm, keyhole slit width
  enableSlit: boolean; // use keyhole or simple circle
  
  // Template-specific parameters
  [key: string]: number | string | boolean;
}

/**
 * Base template generator
 * Returns a pattern export with cut paths and metadata
 */
export abstract class Template {
  abstract generateCutPath(params: TemplateParams): string;
  
  /**
   * Generate all cut paths (main silhouette + holes)
   * Default implementation wraps the main cut path
   * Override this in subclasses to add attachment holes
   */
  generateCutPaths(params: TemplateParams): string[] {
    return [this.generateCutPath(params)];
  }
  
  abstract generateScorePaths(params: TemplateParams): string[];
  abstract generateEngravePaths(params: TemplateParams): string[];

  /**
   * Generate the complete pattern export
   */
  export(
    id: string,
    name: string,
    elementType: string,
    variantName: string,
    params: TemplateParams
  ): PatternExport {
    const cutPaths = this.generateCutPaths(params);
    const scorePaths = this.generateScorePaths(params);
    const engravePaths = this.generateEngravePaths(params);

    // Calculate bounding box from cut path
    // Simplified: use parameter bounds
    const bbox: BoundingBox = {
      x: 0,
      y: 0,
      width: params.width,
      height: params.length,
    };

    return {
      id,
      name,
      cutPaths,
      scorePaths,
      engravePaths,
      referencePaths: [],
      boundingBox: bbox,
      metadata: {
        elementType: elementType as any,
        templateVariant: variantName as any,
        parameters: params,
        createdAt: new Date().toISOString(),
        version: '1.0.0',
      },
    };
  }
}

/**
 * Generate attachment hole in center of a shape
 */
export function generateAttachmentHole(
  centerX: number,
  centerY: number,
  holeRadius: number,
  slitWidth: number,
  slitLength: number = 8,
  enableSlit: boolean = false,
  params?: TemplateParams
): string {
  // Custom hole override
  if (params?.holeOverride) {
    const shape = (params.holeOverrideShape as string) || 'round';
    if (shape === 'square') {
      const size = (params.holeOverrideDiameter as number) || 5.0;
      return squareHolePath(centerX, centerY, size);
    } else if (shape === 'oval') {
      const rx = ((params.holeOverrideWidth as number) || 5.0) / 2;
      const ry = ((params.holeOverrideHeight as number) || 3.5) / 2;
      return ovalHolePath(centerX, centerY, rx, ry);
    } else {
      const r = ((params.holeOverrideDiameter as number) || 5.0) / 2;
      return circlePath(centerX, centerY, r);
    }
  }
  if (enableSlit) {
    return keyholeSlitPath(centerX, centerY, holeRadius, slitWidth, slitLength);
  } else {
    return circlePath(centerX, centerY, holeRadius);
  }
}

/**
 * Create SVG element for a pattern export
 * Includes all cut/score/engrave layers as separate groups
 */
export function exportPatternToSVG(pattern: PatternExport): string {
  const bb = pattern.boundingBox;
  const width = Math.max(bb.width, bb.x + bb.width);
  const height = Math.max(bb.height, bb.y + bb.height);

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width.toFixed(2)} ${height.toFixed(
    2
  )}" width="${width.toFixed(2)}mm" height="${height.toFixed(2)}mm">
  <defs>
    <style>
      .cut-line { stroke: #ff0000; fill: none; stroke-width: 0.1mm; }
      .score-line { stroke: #0000ff; fill: none; stroke-width: 0.1mm; }
      .engrave-line { stroke: #00aa00; fill: none; stroke-width: 0.1mm; }
      .reference-line { stroke: #cccccc; fill: none; stroke-width: 0.1mm; display: none; }
    </style>
  </defs>

  <!-- Cut layer (primary) -->
  <g id="cut" class="cut-layer">
`;

  for (const path of pattern.cutPaths) {
    svg += `    <path d="${path}" class="cut-line" />\n`;
  }

  svg += `  </g>\n`;

  // Score layer
  if (pattern.scorePaths.length > 0) {
    svg += `  <g id="score" class="score-layer">\n`;
    for (const path of pattern.scorePaths) {
      svg += `    <path d="${path}" class="score-line" />\n`;
    }
    svg += `  </g>\n`;
  }

  // Engrave layer
  if (pattern.engravePaths.length > 0) {
    svg += `  <g id="engrave" class="engrave-layer">\n`;
    for (const path of pattern.engravePaths) {
      svg += `    <path d="${path}" class="engrave-line" />\n`;
    }
    svg += `  </g>\n`;
  }

  // Reference layer
  if (pattern.referencePaths.length > 0) {
    svg += `  <g id="reference" class="reference-layer">\n`;
    for (const path of pattern.referencePaths) {
      svg += `    <path d="${path}" class="reference-line" />\n`;
    }
    svg += `  </g>\n`;
  }

  svg += `</svg>`;

  return svg;
}
