/**
 * SVG export utilities
 * Handles conversion of patterns to production-ready SVG
 */

import { PatternExport, BoundingBox, SVGExportOptions } from '../utils/types';
import {
  SVG_STROKE_WIDTH,
  SVG_CUT_COLOR,
  SVG_SCORE_COLOR,
  SVG_ENGRAVE_COLOR,
  SVG_REFERENCE_COLOR,
  PAPER_SIZES,
} from '../utils/constants';
import { packItemsOnPage, LayoutItem } from './packer';

/**
 * Export a single pattern as SVG
 */
export function exportSinglePatternSVG(
  pattern: PatternExport,
  options: Partial<SVGExportOptions> = {}
): string {
  const {
    strokeWidth = SVG_STROKE_WIDTH,
    includeLayers = {
      cut: true,
      score: true,
      engrave: true,
      reference: true,
    },
    lineColors = {
      cut: SVG_CUT_COLOR,
      score: SVG_SCORE_COLOR,
      engrave: SVG_ENGRAVE_COLOR,
      reference: SVG_REFERENCE_COLOR,
    },
    groupByLayer = true,
  } = options;

  const bb = pattern.boundingBox;
  
  // Add padding (10mm) on all sides for visibility
  const paddingX = 10;
  const paddingY = 10;
  const width = bb.x + bb.width + paddingX * 2;
  const height = bb.y + bb.height + paddingY * 2;

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 ${width.toFixed(2)} ${height.toFixed(2)}" 
     width="${width.toFixed(2)}mm" 
     height="${height.toFixed(2)}mm">
  <defs>
    <style>
      .cut-line { stroke: ${lineColors.cut}; fill: none; stroke-width: ${strokeWidth}mm; stroke-linecap: round; stroke-linejoin: round; }
      .score-line { stroke: ${lineColors.score}; fill: none; stroke-width: ${strokeWidth}mm; stroke-linecap: round; stroke-linejoin: round; }
      .engrave-line { stroke: ${lineColors.engrave}; fill: none; stroke-width: ${strokeWidth}mm; stroke-linecap: round; stroke-linejoin: round; }
      .reference-line { stroke: ${lineColors.reference}; fill: none; stroke-width: ${strokeWidth}mm; display: none; }
    </style>
  </defs>

  <!-- Pattern: ${escapeXML(pattern.name)} | ${pattern.metadata.elementType} / ${pattern.metadata.templateVariant} -->
  <g transform="translate(${paddingX}, ${paddingY})">
`;

  // Cut layer (always included)
  if (includeLayers.cut && pattern.cutPaths.length > 0) {
    svg += `  <g id="cut" class="cut-layer">\n`;
    for (const path of pattern.cutPaths) {
      svg += `    <path d="${path}" class="cut-line" />\n`;
    }
    svg += `  </g>\n`;
  }

  // Score layer
  if (includeLayers.score && pattern.scorePaths.length > 0) {
    svg += `  <g id="score" class="score-layer">\n`;
    for (const path of pattern.scorePaths) {
      svg += `    <path d="${path}" class="score-line" />\n`;
    }
    svg += `  </g>\n`;
  }

  // Engrave layer
  if (includeLayers.engrave && pattern.engravePaths.length > 0) {
    svg += `  <g id="engrave" class="engrave-layer">\n`;
    for (const path of pattern.engravePaths) {
      svg += `    <path d="${path}" class="engrave-line" />\n`;
    }
    svg += `  </g>\n`;
  }

  // Reference layer
  if (includeLayers.reference && pattern.referencePaths.length > 0) {
    svg += `  <g id="reference" class="reference-layer">\n`;
    for (const path of pattern.referencePaths) {
      svg += `    ${path}\n`;
    }
    svg += `  </g>\n`;
  }

  svg += `  </g>\n`;
  svg += `</svg>`;

  return svg;
}

/**
 * Export multiple patterns on a print sheet (single SVG)
 */
export function exportPrintSheetSVG(
  patterns: PatternExport[],
  paperSize: 'A4' | 'LETTER',
  orientation: 'portrait' | 'landscape',
  margin: number,
  gutter: number,
  autoRotate: boolean,
  options: Partial<SVGExportOptions> = {}
): string {
  const {
    strokeWidth = SVG_STROKE_WIDTH,
    lineColors = {
      cut: SVG_CUT_COLOR,
      score: SVG_SCORE_COLOR,
      engrave: SVG_ENGRAVE_COLOR,
      reference: SVG_REFERENCE_COLOR,
    },
  } = options;

  const paper = PAPER_SIZES[paperSize];
  const [width, height] =
    orientation === 'landscape' ? [paper.height, paper.width] : [paper.width, paper.height];

  // Build layout items from patterns (add small padding around each)
  const PAD = 2; // mm padding per side around each pattern
  const layoutItems: LayoutItem[] = patterns.map((p, i) => ({
    id: `${i}`,
    width: p.boundingBox.width + PAD * 2,
    height: p.boundingBox.height + PAD * 2,
    data: p,
  }));

  const layout = packItemsOnPage(layoutItems, width, height, margin, gutter, autoRotate);

  let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg"
     viewBox="0 0 ${width.toFixed(2)} ${height.toFixed(2)}"
     width="${width.toFixed(2)}mm"
     height="${height.toFixed(2)}mm">
  <defs>
    <style>
      .page-outline { stroke: #999999; fill: none; stroke-width: 0.2mm; stroke-dasharray: 1,1; }
      .cut-line { stroke: ${lineColors.cut}; fill: none; stroke-width: ${strokeWidth}mm; stroke-linecap: round; stroke-linejoin: round; }
      .score-line { stroke: ${lineColors.score}; fill: none; stroke-width: ${strokeWidth}mm; stroke-linecap: round; stroke-linejoin: round; }
      .engrave-line { stroke: ${lineColors.engrave}; fill: none; stroke-width: ${strokeWidth}mm; stroke-linecap: round; stroke-linejoin: round; }
    </style>
  </defs>

  <!-- Page outline -->
  <rect class="page-outline" x="${margin}" y="${margin}" width="${(width - margin * 2).toFixed(2)}" height="${(height - margin * 2).toFixed(2)}" />
`;

  for (const placed of layout.items) {
    const p = placed.data as PatternExport;
    const rot = placed.rotated ? ` rotate(90 ${(placed.width / 2).toFixed(2)} ${(placed.height / 2).toFixed(2)})` : '';
    svg += `\n  <!-- ${escapeXML(p.name)} -->\n`;
    svg += `  <g transform="translate(${placed.x.toFixed(2)}, ${placed.y.toFixed(2)})${rot}">\n`;
    svg += `    <g transform="translate(${PAD}, ${PAD})">\n`;

    if (p.cutPaths.length > 0) {
      for (const d of p.cutPaths) svg += `      <path d="${d}" class="cut-line" />\n`;
    }
    if (p.scorePaths.length > 0) {
      for (const d of p.scorePaths) svg += `      <path d="${d}" class="score-line" />\n`;
    }
    if (p.engravePaths.length > 0) {
      for (const d of p.engravePaths) svg += `      <path d="${d}" class="engrave-line" />\n`;
    }

    svg += `    </g>\n  </g>\n`;
  }

  svg += `</svg>`;
  return svg;
}

/**
 * Escape XML special characters
 */
function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Download SVG as file
 */
export function downloadSVG(svgContent: string, filename: string): void {
  const blob = new Blob([svgContent], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate SVG string without downloading (for testing/preview)
 */
export function generateSVGString(pattern: PatternExport): string {
  return exportSinglePatternSVG(pattern);
}
