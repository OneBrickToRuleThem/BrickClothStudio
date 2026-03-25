/**
 * Parse SingleHole SVG templates and convert to FracCmd data.
 * Extracts the filled (black) path as the outline, finds the circle hole,
 * enforces left-right symmetry, and outputs TypeScript FracCmd arrays.
 */
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Simple SVG path parser — handles M, m, C, c, S, s, L, l, H, h, V, v, Z, A, a
function parseSvgPath(d) {
  // Tokenize
  const tokens = d.match(/[MmCcSsLlHhVvZzAa]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g);
  if (!tokens) return [];
  const cmds = [];
  let cmd = '';
  let i = 0;
  let cx = 0, cy = 0; // current point
  let sx = 0, sy = 0; // start of subpath
  let lastCp = null;   // last control point for S/s

  function num() { return parseFloat(tokens[i++]); }

  while (i < tokens.length) {
    const t = tokens[i];
    if (/[A-Za-z]/.test(t)) { cmd = t; i++; }

    switch (cmd) {
      case 'M': { const x = num(), y = num(); cmds.push({ type: 'M', x, y }); cx = x; cy = y; sx = x; sy = y; cmd = 'L'; lastCp = null; break; }
      case 'm': { const dx = num(), dy = num(); cx += dx; cy += dy; cmds.push({ type: 'M', x: cx, y: cy }); sx = cx; sy = cy; cmd = 'l'; lastCp = null; break; }
      case 'L': { const x = num(), y = num(); cmds.push({ type: 'L', x, y }); cx = x; cy = y; lastCp = null; break; }
      case 'l': { const dx = num(), dy = num(); cx += dx; cy += dy; cmds.push({ type: 'L', x: cx, y: cy }); lastCp = null; break; }
      case 'H': { const x = num(); cmds.push({ type: 'L', x, y: cy }); cx = x; lastCp = null; break; }
      case 'h': { const dx = num(); cx += dx; cmds.push({ type: 'L', x: cx, y: cy }); lastCp = null; break; }
      case 'V': { const y = num(); cmds.push({ type: 'L', x: cx, y }); cy = y; lastCp = null; break; }
      case 'v': { const dy = num(); cy += dy; cmds.push({ type: 'L', x: cx, y: cy }); lastCp = null; break; }
      case 'C': { const x1 = num(), y1 = num(), x2 = num(), y2 = num(), x = num(), y = num(); cmds.push({ type: 'C', x1, y1, x2, y2, x, y }); lastCp = { x: x2, y: y2 }; cx = x; cy = y; break; }
      case 'c': { const dx1 = num(), dy1 = num(), dx2 = num(), dy2 = num(), dx = num(), dy = num(); const x1 = cx+dx1, y1 = cy+dy1, x2 = cx+dx2, y2 = cy+dy2, x = cx+dx, y = cy+dy; cmds.push({ type: 'C', x1, y1, x2, y2, x, y }); lastCp = { x: x2, y: y2 }; cx = x; cy = y; break; }
      case 'S': { const x2 = num(), y2 = num(), x = num(), y = num(); const x1 = lastCp ? 2*cx - lastCp.x : cx; const y1 = lastCp ? 2*cy - lastCp.y : cy; cmds.push({ type: 'C', x1, y1, x2, y2, x, y }); lastCp = { x: x2, y: y2 }; cx = x; cy = y; break; }
      case 's': { const dx2 = num(), dy2 = num(), dx = num(), dy = num(); const x1 = lastCp ? 2*cx - lastCp.x : cx; const y1 = lastCp ? 2*cy - lastCp.y : cy; const x2 = cx+dx2, y2 = cy+dy2, x = cx+dx, y = cy+dy; cmds.push({ type: 'C', x1, y1, x2, y2, x, y }); lastCp = { x: x2, y: y2 }; cx = x; cy = y; break; }
      case 'A': case 'a': {
        // Arc: consume 7 params, convert to line (approximate)
        const isRel = cmd === 'a';
        const rx = num(), ry = num(), rot = num(), largeArc = num(), sweep = num();
        let ex = num(), ey = num();
        if (isRel) { ex += cx; ey += cy; }
        // For circles (rx===ry), this is likely a hole — record it
        cmds.push({ type: 'ARC', rx, ry, rot, largeArc, sweep, x: ex, y: ey, startX: cx, startY: cy });
        cx = ex; cy = ey;
        lastCp = null;
        break;
      }
      case 'Z': case 'z': { cmds.push({ type: 'Z' }); cx = sx; cy = sy; lastCp = null; break; }
      default: i++; break;
    }
  }
  return cmds;
}

function processTemplate(filename, label) {
  const svgText = readFileSync(resolve(__dirname, '..', filename), 'utf-8');

  // Find all path elements with filled (black) paths
  const pathRegex = /<path[^>]*d="([^"]+)"[^>]*>/g;
  const styleRegex = /style="([^"]*)"/;
  const fillRegex = /fill[=:](?:#000|black)/;

  let outlinePath = null;
  let match;
  while ((match = pathRegex.exec(svgText)) !== null) {
    const fullTag = match[0];
    // Check if it's a filled black path (the outline silhouette)
    if (fillRegex.test(fullTag)) {
      outlinePath = match[1];
      break;
    }
  }

  if (!outlinePath) {
    console.log(`\n// ${label}: No filled outline found, using first non-cut path`);
    // Try finding the second path (usually the silhouette)
    const allPaths = [...svgText.matchAll(/<path[^>]*d="([^"]+)"[^>]*>/g)];
    if (allPaths.length >= 2) {
      outlinePath = allPaths[1][1];
    } else if (allPaths.length >= 1) {
      outlinePath = allPaths[0][1];
    }
  }

  if (!outlinePath) {
    console.log(`\n// ${label}: No path data found!`);
    return;
  }

  const cmds = parseSvgPath(outlinePath);

  // Extract viewBox dimensions
  const vbMatch = svgText.match(/viewBox="([^"]+)"/);
  const [vbX, vbY, vbW, vbH] = vbMatch[1].split(/\s+/).map(Number);

  // Extract transform translate
  const translateMatch = svgText.match(/transform="translate\(([^)]+)\)"/);
  let tx = 0, ty = 0;
  if (translateMatch) {
    const parts = translateMatch[1].split(',').map(Number);
    tx = parts[0]; ty = parts[1];
  }

  // Find the width/height in mm
  const wMatch = svgText.match(/width="([\d.]+)mm"/);
  const hMatch = svgText.match(/height="([\d.]+)mm"/);
  const widthMM = wMatch ? parseFloat(wMatch[1]) : vbW;
  const heightMM = hMatch ? parseFloat(hMatch[1]) : vbH;

  console.log(`\n// === ${label} ===`);
  console.log(`// viewBox: ${vbX} ${vbY} ${vbW} ${vbH}`);
  console.log(`// translate: ${tx}, ${ty}`);
  console.log(`// Size: ${widthMM}mm x ${heightMM}mm`);

  // Separate outline commands from arcs (holes)
  const outlineCmds = [];
  const arcs = [];
  for (const c of cmds) {
    if (c.type === 'ARC') {
      arcs.push(c);
    } else {
      outlineCmds.push(c);
    }
  }

  // Find bounding box of non-arc commands
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const c of outlineCmds) {
    for (const key of ['x', 'x1', 'x2']) {
      if (c[key] !== undefined) { minX = Math.min(minX, c[key]); maxX = Math.max(maxX, c[key]); }
    }
    for (const key of ['y', 'y1', 'y2']) {
      if (c[key] !== undefined) { minY = Math.min(minY, c[key]); maxY = Math.max(maxY, c[key]); }
    }
  }
  const pathW = maxX - minX;
  const pathH = maxY - minY;
  console.log(`// Path bounds: (${minX.toFixed(2)}, ${minY.toFixed(2)}) - (${maxX.toFixed(2)}, ${maxY.toFixed(2)})`);
  console.log(`// Path size: ${pathW.toFixed(2)} x ${pathH.toFixed(2)}`);

  // Convert to fractional coordinates
  function frac(val, range, min) {
    return ((val - min) / range);
  }
  function f(v) { return parseFloat(v.toFixed(4)); }

  // Detect holes from arcs
  if (arcs.length > 0) {
    console.log(`// Arcs found: ${arcs.length}`);
    // Group arcs into circles (pairs of half-arcs)
    const circles = [];
    for (let i = 0; i < arcs.length; i++) {
      const a = arcs[i];
      // Each half-arc of a circle: check if rx === ry
      if (Math.abs(a.rx - a.ry) < 0.01) {
        const cx = (a.startX + a.x) / 2;
        const cy = (a.startY + a.y) / 2;
        // Check if we already have this circle
        const existing = circles.find(c => Math.abs(c.cx - cx) < 0.5 && Math.abs(c.cy - cy) < 0.5);
        if (!existing) {
          circles.push({ cx, cy, r: a.rx });
        }
      }
    }
    for (const c of circles) {
      console.log(`// Circle hole at (${c.cx.toFixed(2)}, ${c.cy.toFixed(2)}), r=${c.r.toFixed(2)}`);
      console.log(`//   relX: ${f(frac(c.cx, pathW, minX))}, relY: ${f(frac(c.cy, pathH, minY))}`);
    }
  }

  // Build FracCmd array
  const fracCmds = [];
  const centerX = (minX + maxX) / 2;

  for (const c of outlineCmds) {
    switch (c.type) {
      case 'M':
        fracCmds.push([1, f(frac(c.x, pathW, minX)), f(frac(c.y, pathH, minY))]);
        break;
      case 'L':
        fracCmds.push([2, f(frac(c.x, pathW, minX)), f(frac(c.y, pathH, minY))]);
        break;
      case 'C':
        fracCmds.push([3,
          f(frac(c.x1, pathW, minX)), f(frac(c.y1, pathH, minY)),
          f(frac(c.x2, pathW, minX)), f(frac(c.y2, pathH, minY)),
          f(frac(c.x, pathW, minX)), f(frac(c.y, pathH, minY))
        ]);
        break;
      case 'Z':
        fracCmds.push([0]);
        break;
    }
  }

  // Now enforce symmetry about X center
  // Find the center of the outline
  console.log(`// Center X frac: ${f(frac(centerX, pathW, minX))}`);

  // Output the FracCmd array
  console.log(`\nconst ${label.toUpperCase().replace(/[- ]/g, '_')}_OUTLINE: FracCmd[] = [`);
  for (const cmd of fracCmds) {
    console.log(`  [${cmd.join(', ')}],`);
  }
  console.log(`];`);

  // Symmetrize: for each command, average X with its mirror (1 - x)
  const symCmds = [];
  // The outline should go clockwise from bottom. To symmetrize, we need to find
  // the midpoint and mirror pairs. For now, just output the raw and let me manually fix.

  // Also output hole positions
  if (arcs.length > 0) {
    const circles = [];
    for (let i = 0; i < arcs.length; i++) {
      const a = arcs[i];
      if (Math.abs(a.rx - a.ry) < 0.01) {
        const cx = (a.startX + a.x) / 2;
        const cy = (a.startY + a.y) / 2;
        const existing = circles.find(c => Math.abs(c.cx - cx) < 0.5 && Math.abs(c.cy - cy) < 0.5);
        if (!existing) {
          circles.push({ cx, cy, r: a.rx });
        }
      }
    }
    console.log(`\nconst ${label.toUpperCase().replace(/[- ]/g, '_')}_HOLES = [`);
    for (const c of circles) {
      console.log(`  { relX: ${f(frac(c.cx, pathW, minX))}, relY: ${f(frac(c.cy, pathH, minY))} },`);
    }
    console.log(`];`);
  }

  return { widthMM, heightMM, pathW, pathH, minX, maxX, minY, maxY };
}

processTemplate('SingleHoleNarrow_Template.svg', 'SINGLE_HOLE_NARROW');
processTemplate('SingleHoleTop_template.svg', 'SINGLE_HOLE_TOP');
processTemplate('SteppedShoulderSingleHole_Template.svg', 'SINGLE_HOLE_STEPPED');
