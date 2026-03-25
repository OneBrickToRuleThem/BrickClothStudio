const fs = require('fs');

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
        const rx = num(), ry = num(), rot = num(), la = num(), sw = num();
        let ex = num(), ey = num();
        if (isRel) { ex += cx; ey += cy; }
        cmds.push({ type: 'ARC', rx, ry, rot, la, sw, x: ex, y: ey, startX: cx, startY: cy });
        cx = ex; cy = ey; lastCp = null; break;
      }
      case 'Z': case 'z': { cmds.push({ type: 'Z' }); cx = sx; cy = sy; lastCp = null; break; }
      default: i++; break;
    }
  }
  return cmds;
}

function f(v) { return parseFloat(v.toFixed(4)); }

function processFilled(filename, pathIndex, label) {
  const svg = fs.readFileSync(filename, 'utf-8');
  const re = /(<path[^>]*?)d="([^"]+)"([^>]*>)/gs;
  let match;
  const filledPaths = [];
  while ((match = re.exec(svg)) !== null) {
    const tag = match[1] + match[3];
    if (/fill:#000000|fill="black"|fill:#000\b/.test(tag)) {
      filledPaths.push(match[2]);
    }
  }
  
  const d = filledPaths[pathIndex];
  const cmds = parseSvgPath(d);
  
  const outlineCmds = cmds.filter(c => c.type !== 'ARC');
  const arcs = cmds.filter(c => c.type === 'ARC');
  
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const c of outlineCmds) {
    for (const k of ['x', 'x1', 'x2']) { if (c[k] !== undefined) { minX = Math.min(minX, c[k]); maxX = Math.max(maxX, c[k]); } }
    for (const k of ['y', 'y1', 'y2']) { if (c[k] !== undefined) { minY = Math.min(minY, c[k]); maxY = Math.max(maxY, c[k]); } }
  }
  const pw = maxX - minX;
  const ph = maxY - minY;
  
  console.log(`\n=== ${label} ===`);
  console.log(`Bounds: (${minX.toFixed(2)}, ${minY.toFixed(2)}) to (${maxX.toFixed(2)}, ${maxY.toFixed(2)})`);
  console.log(`Size: ${pw.toFixed(1)}mm x ${ph.toFixed(1)}mm`);
  console.log(`Commands: ${outlineCmds.length} outline, ${arcs.length} arcs`);
  
  // Detect circles from arcs
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
    console.log(`Hole: center=(${c.cx.toFixed(3)}, ${c.cy.toFixed(3)}), r=${c.r.toFixed(2)}`);
    console.log(`  relX: ${f((c.cx - minX) / pw)}, relY: ${f((c.cy - minY) / ph)}`);
  }
  
  // Output FracCmd
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
  
  console.log(`\nFracCmd (raw):`);
  for (const c of fracCmds) {
    console.log(`  [${c.join(', ')}],`);
  }
  
  return { fracCmds, pw, ph, circles };
}

// Parse the ACTUAL narrow shape (2nd filled path)
processFilled('SingleHoleNarrow_Template.svg', 1, 'NARROW (2nd path)');

// Parse Top (1st filled = the actual shape)
processFilled('SingleHoleTop_template.svg', 0, 'TOP (1st path)');

// Parse Stepped
processFilled('SteppedShoulderSingleHole_Template.svg', 0, 'STEPPED');
