/**
 * SVG export utilities
 * Handles conversion of patterns to production-ready SVG
 */

import { PatternExport, BoundingBox, SVGExportOptions, DecorationLayer } from '../utils/types';
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
  options: Partial<SVGExportOptions> = {},
  decorations: DecorationLayer[] = []
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
  // When bb.x is negative (e.g. side styles extend left), shift content right to keep everything visible
  const shiftX = Math.max(0, -bb.x);
  const shiftY = Math.max(0, -bb.y);
  const width = shiftX + bb.width + paddingX * 2;
  const height = shiftY + bb.height + paddingY * 2;

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
  <g transform="translate(${paddingX + shiftX}, ${paddingY + shiftY})">
`;

  // Cut layer (always included)
  // Merge all cut paths into a single compound path so Cricut/silhouette
  // machines interpret holes correctly via fill-rule="evenodd"
  if (includeLayers.cut && pattern.cutPaths.length > 0) {
    svg += `  <g id="cut" class="cut-layer">\n`;
    const mergedCut = pattern.cutPaths.join(' ');
    svg += `    <path d="${mergedCut}" class="cut-line" fill-rule="evenodd" />\n`;
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

  // Decoration layers
  const visibleDecos = decorations.filter(d => d.visible);
  if (visibleDecos.length > 0) {
    // Group by decoration type
    const engraveDecos = visibleDecos.filter(d => d.decorationType === 'engraving');
    const rasterDecos = visibleDecos.filter(d => d.decorationType === 'rastering');
    const decoDecos = visibleDecos.filter(d => d.decorationType === 'decoration');

    const renderDecoGroup = (decos: DecorationLayer[], id: string, color: string) => {
      if (decos.length === 0) return;
      svg += `  <g id="${id}" class="${id}-layer">\n`;
      for (const deco of decos) {
        const tx = deco.x;
        const ty = deco.y;
        const w = deco.width * deco.scale;
        const h = deco.height * deco.scale;
        const rot = deco.rotation ? ` rotate(${deco.rotation} ${tx + w / 2} ${ty + h / 2})` : '';
        svg += `    <g transform="translate(${tx.toFixed(2)}, ${ty.toFixed(2)})${rot}">\n`;
        if (deco.type === 'image') {
          svg += `      <image href="${escapeXML(deco.data)}" width="${w.toFixed(2)}" height="${h.toFixed(2)}" />\n`;
        } else if (deco.type === 'text') {
          const fontSize = deco.fontSize || 4;
          const fontFamily = deco.fontFamily || 'sans-serif';
          svg += `      <text x="${(w / 2).toFixed(2)}" y="${(h / 2 + fontSize * 0.35).toFixed(2)}" ` +
            `text-anchor="middle" font-size="${fontSize}" font-family="${fontFamily}" fill="${color}">${escapeXML(deco.data)}</text>\n`;
        }
        svg += `    </g>\n`;
      }
      svg += `  </g>\n`;
    };

    if (includeLayers.engrave) renderDecoGroup(engraveDecos, 'engrave-decorations', lineColors.engrave);
    renderDecoGroup(rasterDecos, 'raster-decorations', '#000000');
    renderDecoGroup(decoDecos, 'decoration-decorations', '#333333');
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
  const layoutItems: LayoutItem[] = patterns.map((p, i) => {
    // Account for negative bounding box offsets (e.g. side styles extending into -X)
    const shiftX = Math.max(0, -p.boundingBox.x);
    const shiftY = Math.max(0, -p.boundingBox.y);
    return {
      id: `${i}`,
      width: shiftX + p.boundingBox.width + PAD * 2,
      height: shiftY + p.boundingBox.height + PAD * 2,
      data: p,
    };
  });

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
    const shiftX = Math.max(0, -p.boundingBox.x);
    const shiftY = Math.max(0, -p.boundingBox.y);
    const rot = placed.rotated ? ` rotate(90 ${(placed.width / 2).toFixed(2)} ${(placed.height / 2).toFixed(2)})` : '';
    svg += `\n  <!-- ${escapeXML(p.name)} -->\n`;
    svg += `  <g transform="translate(${placed.x.toFixed(2)}, ${placed.y.toFixed(2)})${rot}">\n`;
    svg += `    <g transform="translate(${(PAD + shiftX).toFixed(2)}, ${(PAD + shiftY).toFixed(2)})">\n`;

    if (p.cutPaths.length > 0) {
      const mergedCut = p.cutPaths.join(' ');
      svg += `      <path d="${mergedCut}" class="cut-line" fill-rule="evenodd" />\n`;
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
