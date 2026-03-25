const fs = require('fs');

// Simple SVG path parser
function parseSvgPath(d) {
  const tokens = d.match(/[MmCcSsLlHhVvZzAa]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g);
  if (!tokens) return [];
  const cmds = [];
  let cmd = '';
  let i = 0;
  let cx = 0, cy = 0;
  let sx = 0, sy = 0;
  let lastCp = null;

  function num() { return parseFloat(tokens[i++]); }

  while (i < tokens.length) {
    const t = tokens[i];
    if (/^[A-Za-z]$/.test(t)) { cmd = t; i++; }

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
        const isRel = cmd === 'a';
        const rx = num(), ry = num(), rot = num(), largeArc = num(), sweep = num();
        let ex = num(), ey = num();
        if (isRel) { ex += cx; ey += cy; }
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

function f(v) { return parseFloat(v.toFixed(4)); }

function processFile(filename, label, pathIndex) {
  const svg = fs.readFileSync(filename, 'utf-8');
  
  // Extract all filled paths
  const re = /(<path[^>]*?)d="([^"]+)"([^>]*>)/gs;
  let match;
  const filledPaths = [];
  while ((match = re.exec(svg)) !== null) {
    const before = match[1];
    const d = match[2];
    const after = match[3];
    if (/fill:#000000|fill="black"|fill:#000\b/.test(before + after)) {
      filledPaths.push(d);
    }
  }
  
  if (filledPaths.length === 0) {
    console.log(`// ${label}: No filled path found!`);
    return;
  }
  
  const d = filledPaths[pathIndex || 0];
  const cmds = parseSvgPath(d);
  
  // Separate outline from arcs (holes)
  const outlineCmds = cmds.filter(c => c.type !== 'ARC');
  const arcs = cmds.filter(c => c.type === 'ARC');
  
  // Bounding box
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const c of outlineCmds) {
    for (const k of ['x', 'x1', 'x2']) { if (c[k] !== undefined) { minX = Math.min(minX, c[k]); maxX = Math.max(maxX, c[k]); } }
    for (const k of ['y', 'y1', 'y2']) { if (c[k] !== undefined) { minY = Math.min(minY, c[k]); maxY = Math.max(maxY, c[k]); } }
  }
  const pw = maxX - minX;
  const ph = maxY - minY;
  
  console.log(`\n// === ${label} ===`);
  console.log(`// Filled paths: ${filledPaths.length}, using index ${pathIndex || 0}`);
  console.log(`// Path bounds: (${minX.toFixed(3)}, ${minY.toFixed(3)}) to (${maxX.toFixed(3)}, ${maxY.toFixed(3)})`);
  console.log(`// Path size: ${pw.toFixed(2)}mm x ${ph.toFixed(2)}mm`);
  console.log(`// Commands: ${outlineCmds.length} outline, ${arcs.length} arcs`);
  
  // Detect circle holes from arcs
  const circles = [];
  for (const a of arcs) {
    if (Math.abs(a.rx - a.ry) < 0.01) {
      const hcx = (a.startX + a.x) / 2;
      const hcy = (a.startY + a.y) / 2;
      if (!circles.find(c => Math.abs(c.cx - hcx) < 0.5 && Math.abs(c.cy - hcy) < 0.5)) {
        circles.push({ cx: hcx, cy: hcy, r: a.rx });
      }
    }
  }
  
  for (const c of circles) {
    console.log(`// Hole: center=(${c.cx.toFixed(3)}, ${c.cy.toFixed(3)}), r=${c.r.toFixed(3)}`);
    console.log(`//   relX: ${f((c.cx - minX) / pw)}, relY: ${f((c.cy - minY) / ph)}`);
  }

  // Find center X for symmetry
  const centerX = (minX + maxX) / 2;
  console.log(`// Center X: ${centerX.toFixed(3)}`);
  
  // Identify the top of the outline (lowest Y = neck area) and bottom (highest Y = hem)
  // The SVG outline typically starts at the bottom-left, goes clockwise
  
  // Convert to FracCmd
  const fracCmds = [];
  for (const c of outlineCmds) {
    const fx = (v) => f((v - minX) / pw);
    const fy = (v) => f((v - minY) / ph);
    switch (c.type) {
      case 'M': fracCmds.push([1, fx(c.x), fy(c.y)]); break;
      case 'L': fracCmds.push([2, fx(c.x), fy(c.y)]); break;
      case 'C': fracCmds.push([3, fx(c.x1), fy(c.y1), fx(c.x2), fy(c.y2), fx(c.x), fy(c.y)]); break;
      case 'Z': fracCmds.push([0]); break;
    }
  }
  
  console.log(`\nconst ${label}_OUTLINE: FracCmd[] = [`);
  for (const cmd of fracCmds) {
    console.log(`  [${cmd.join(', ')}],`);
  }
  console.log(`];\n`);
  
  // Now symmetrize — split into left half and right half at center
  // For each point, find its mirror and average
  console.log(`// Symmetrized version:`);
  const symCmds = fracCmds.map(cmd => {
    if (cmd[0] === 0) return cmd;
    const result = [...cmd];
    // For each X coordinate (odd indices starting from 1)
    for (let j = 1; j < result.length; j += 2) {
      const x = result[j];
      // Mirror: new_x = 1 - x, then average: (x + (1 - x)) / 2... no that's always 0.5
      // Instead, we should find matching points on opposite sides and average
    }
    return result;
  });
  
  // Better approach: split commands at the topmost point, then mirror the left half
  // Find the index of the command with the smallest Y (topmost point of neck/opening)
  let topIdx = 0;
  let topY = Infinity;
  for (let i = 0; i < fracCmds.length; i++) {
    const cmd = fracCmds[i];
    const yIdx = cmd[0] === 3 ? 6 : 2;
    if (cmd.length > yIdx && cmd[yIdx] < topY) {
      topY = cmd[yIdx];
      topIdx = i;
    }
  }
  console.log(`// Top point at index ${topIdx}, y=${topY}`);
  
  // Find where the outline transitions from left-side to right-side
  // (where X starts increasing after decreasing, near the bottom)
  let bottomIdx = 0;
  let bottomY = -Infinity;
  for (let i = 0; i < fracCmds.length; i++) {
    const cmd = fracCmds[i];
    const yIdx = cmd[0] === 3 ? 6 : 2;
    if (cmd.length > yIdx && cmd[yIdx] > bottomY) {
      bottomY = cmd[yIdx];
      bottomIdx = i;
    }
  }
  console.log(`// Bottom point at index ${bottomIdx}, y=${bottomY}`);
  
  // Hole data
  if (circles.length > 0) {
    console.log(`\nconst ${label}_HOLE = { relX: ${f((circles[0].cx - minX) / pw)}, relY: ${f((circles[0].cy - minY) / ph)} };`);
  }
  
  console.log(`// Default size: ${Math.round(pw)}x${Math.round(ph)}mm`);
}

processFile('SingleHoleNarrow_Template.svg', 'SINGLE_HOLE_NARROW', 0);
processFile('SingleHoleTop_template.svg', 'SINGLE_HOLE_TOP', 0);
processFile('SteppedShoulderSingleHole_Template.svg', 'SINGLE_HOLE_STEPPED', 0);
