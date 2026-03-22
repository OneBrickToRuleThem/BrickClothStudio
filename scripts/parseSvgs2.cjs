const fs = require('fs');
const path = require('path');

function parseSVG(filename) {
  const svg = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
  
  const wMatch = svg.match(/width="([\d.]+)mm"/);
  const hMatch = svg.match(/height="([\d.]+)mm"/);
  const width = parseFloat(wMatch[1]);
  const height = parseFloat(hMatch[1]);
  
  const transMatch = svg.match(/transform="translate\(([-\d.]+),([-\d.]+)\)"/);
  const tx = parseFloat(transMatch[1]);
  const ty = parseFloat(transMatch[2]);
  
  // Extract the full d attribute (may span multiple lines)
  const dMatch = svg.match(/\bd="([\s\S]*?)"/);
  let d = dMatch[1].replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
  
  console.log('=== ' + filename + ' ===');
  console.log('Dimensions: ' + width.toFixed(2) + ' x ' + height.toFixed(2) + ' mm');
  console.log('Transform: translate(' + tx + ', ' + ty + ')');
  
  // Parse all path commands and numbers using a tokenizer approach
  const tokens = [];
  let i = 0;
  while (i < d.length) {
    if (/[a-zA-Z]/.test(d[i])) {
      tokens.push(d[i]);
      i++;
    } else if (/[-.\d]/.test(d[i])) {
      let num = '';
      // Handle negative sign
      if (d[i] === '-') { num += d[i]; i++; }
      // Integer part
      while (i < d.length && /\d/.test(d[i])) { num += d[i]; i++; }
      // Decimal
      if (i < d.length && d[i] === '.') { num += d[i]; i++; while (i < d.length && /\d/.test(d[i])) { num += d[i]; i++; } }
      tokens.push(parseFloat(num));
    } else {
      i++; // skip spaces, commas
    }
  }
  
  // Parse tokens into commands with absolute coordinates
  const rawCommands = [];
  let curX = 0, curY = 0;
  let startX = 0, startY = 0;
  let ti = 0;
  
  function readNum() { return tokens[ti++]; }
  
  while (ti < tokens.length) {
    const cmd = tokens[ti++];
    
    if (cmd === 'M') {
      curX = readNum(); curY = readNum();
      startX = curX; startY = curY;
      rawCommands.push({ type: 'M', x: curX, y: curY });
      // Subsequent number pairs are implicit L
      while (ti < tokens.length && typeof tokens[ti] === 'number') {
        curX = readNum(); curY = readNum();
        rawCommands.push({ type: 'L', x: curX, y: curY });
      }
    } else if (cmd === 'm') {
      curX += readNum(); curY += readNum();
      startX = curX; startY = curY;
      rawCommands.push({ type: 'M', x: curX, y: curY });
      while (ti < tokens.length && typeof tokens[ti] === 'number') {
        curX += readNum(); curY += readNum();
        rawCommands.push({ type: 'L', x: curX, y: curY });
      }
    } else if (cmd === 'C') {
      while (ti < tokens.length && typeof tokens[ti] === 'number') {
        const x1 = readNum(), y1 = readNum(), x2 = readNum(), y2 = readNum(), x = readNum(), y = readNum();
        rawCommands.push({ type: 'C', x1, y1, x2, y2, x, y });
        curX = x; curY = y;
      }
    } else if (cmd === 'c') {
      while (ti < tokens.length && typeof tokens[ti] === 'number') {
        const x1 = curX + readNum(), y1 = curY + readNum();
        const x2 = curX + readNum(), y2 = curY + readNum();
        const x = curX + readNum(), y = curY + readNum();
        rawCommands.push({ type: 'C', x1, y1, x2, y2, x, y });
        curX = x; curY = y;
      }
    } else if (cmd === 'L') {
      while (ti < tokens.length && typeof tokens[ti] === 'number') {
        curX = readNum(); curY = readNum();
        rawCommands.push({ type: 'L', x: curX, y: curY });
      }
    } else if (cmd === 'l') {
      while (ti < tokens.length && typeof tokens[ti] === 'number') {
        curX += readNum(); curY += readNum();
        rawCommands.push({ type: 'L', x: curX, y: curY });
      }
    } else if (cmd === 'H') {
      while (ti < tokens.length && typeof tokens[ti] === 'number') {
        curX = readNum();
        rawCommands.push({ type: 'L', x: curX, y: curY });
      }
    } else if (cmd === 'h') {
      while (ti < tokens.length && typeof tokens[ti] === 'number') {
        curX += readNum();
        rawCommands.push({ type: 'L', x: curX, y: curY });
      }
    } else if (cmd === 'V') {
      while (ti < tokens.length && typeof tokens[ti] === 'number') {
        curY = readNum();
        rawCommands.push({ type: 'L', x: curX, y: curY });
      }
    } else if (cmd === 'v') {
      while (ti < tokens.length && typeof tokens[ti] === 'number') {
        curY += readNum();
        rawCommands.push({ type: 'L', x: curX, y: curY });
      }
    } else if (cmd === 'Z' || cmd === 'z') {
      rawCommands.push({ type: 'Z' });
      curX = startX; curY = startY;
    }
  }
  
  // Collect all endpoint & control-point X and Y
  const allX = [], allY = [];
  for (const c of rawCommands) {
    if (c.x !== undefined) { allX.push(c.x); allY.push(c.y); }
    if (c.x1 !== undefined) { allX.push(c.x1); allY.push(c.y1); allX.push(c.x2); allY.push(c.y2); }
  }
  
  const rawMinX = Math.min(...allX);
  const rawMaxX = Math.max(...allX);
  const rawMinY = Math.min(...allY);
  const rawMaxY = Math.max(...allY);
  
  // The viewBox is 0 0 W H, where W/H match the mm dimensions.
  // The <g> transform moves path coords into viewBox space.
  // So viewBox coords = pathCoord + translate
  // And viewBox coords are directly in mm since viewBox dimensions = mm dimensions.
  const mmMinX = rawMinX + tx;
  const mmMaxX = rawMaxX + tx;
  const mmMinY = rawMinY + ty;
  const mmMaxY = rawMaxY + ty;
  const pathW = mmMaxX - mmMinX;
  const pathH = mmMaxY - mmMinY;
  
  console.log('Path raw bounds: x=[' + rawMinX.toFixed(3) + ', ' + rawMaxX.toFixed(3) + '] y=[' + rawMinY.toFixed(3) + ', ' + rawMaxY.toFixed(3) + ']');
  console.log('Path mm size: ' + pathW.toFixed(2) + ' x ' + pathH.toFixed(2));
  console.log('Total commands: ' + rawCommands.length);
  
  // Split into sub-paths (by M commands)
  const segments = [];
  let current = [];
  for (const c of rawCommands) {
    if (c.type === 'M') {
      if (current.length > 0) segments.push(current);
      current = [c];
    } else {
      current.push(c);
    }
  }
  if (current.length > 0) segments.push(current);
  
  console.log('Sub-paths: ' + segments.length);
  
  // Analyze each segment for hole detection
  for (let si = 0; si < segments.length; si++) {
    const seg = segments[si];
    const pts = [];
    for (const c of seg) {
      if (c.x !== undefined) pts.push({ x: (c.x + tx), y: (c.y + ty) });
    }
    if (pts.length < 2) continue;
    
    // Find mm-space center & bounding box
    const segMinX = Math.min(...pts.map(p => p.x));
    const segMaxX = Math.max(...pts.map(p => p.x));
    const segMinY = Math.min(...pts.map(p => p.y));
    const segMaxY = Math.max(...pts.map(p => p.y));
    const segW = segMaxX - segMinX;
    const segH = segMaxY - segMinY;
    const cx = (segMinX + segMaxX) / 2;
    const cy = (segMinY + segMaxY) / 2;
    
    // Check circularity by comparing radii from center
    const radii = pts.map(p => Math.sqrt((p.x - cx)**2 + (p.y - cy)**2));
    const avgR = radii.reduce((s,r) => s+r, 0) / radii.length;
    const stdR = Math.sqrt(radii.reduce((s,r) => s + (r - avgR)**2, 0) / radii.length);
    const isCircular = avgR > 0.5 && stdR / avgR < 0.25;
    
    const label = si === 0 ? 'OUTLINE' : (isCircular ? 'HOLE' : 'subpath');
    console.log('  Seg[' + si + '] ' + label + ': ' + pts.length + ' pts, bbox=' + segW.toFixed(2) + 'x' + segH.toFixed(2) + 'mm, center=(' + cx.toFixed(2) + ',' + cy.toFixed(2) + ')mm, avgR=' + avgR.toFixed(2) + ', stdDev=' + stdR.toFixed(3));
    if (si > 0 && isCircular) {
      console.log('    -> Estimated diameter: ' + (avgR * 2).toFixed(2) + 'mm');
      console.log('    -> LEGO minifig standard: 5.3mm (r=2.65mm)');
      console.log('    -> Relative position: x=' + ((cx - mmMinX) / pathW * 100).toFixed(1) + '%, y=' + ((cy - mmMinY) / pathH * 100).toFixed(1) + '%');
    }
  }
  
  // Generate normalized fractional coordinates for code generation
  const normCommands = rawCommands.map(c => {
    if (c.type === 'Z') return c;
    const nx = v => ((v + tx - mmMinX) / pathW);
    const ny = v => ((v + ty - mmMinY) / pathH);
    if (c.type === 'M' || c.type === 'L') return { type: c.type, x: nx(c.x), y: ny(c.y) };
    if (c.type === 'C') return { type: 'C', x1: nx(c.x1), y1: ny(c.y1), x2: nx(c.x2), y2: ny(c.y2), x: nx(c.x), y: ny(c.y) };
    return c;
  });
  
  console.log('');
  return { pathW, pathH, normCommands, segments, tx, ty, mmMinX, mmMinY, rawCommands };
}

const results = {};
['AsymetricCapeTemplate.svg', 'WraithRing.svg', '7Point.svg', 'HighCollarTemplate.svg'].forEach(f => {
  try { results[f] = parseSVG(f); } catch(e) { console.log('Error: ' + f + ': ' + e.message + '\n' + e.stack); }
});

// Generate TypeScript code for each shape
console.log('\n\n=== GENERATED CODE SNIPPETS ===\n');
for (const [name, data] of Object.entries(results)) {
  if (!data) continue;
  console.log('// ' + name + ' (' + data.pathW.toFixed(2) + ' x ' + data.pathH.toFixed(2) + 'mm)');
  
  // Find outline (first segment) and holes (subsequent segments)
  const segments = [];
  let cur = [];
  for (const c of data.normCommands) {
    if (c.type === 'M') {
      if (cur.length > 0) segments.push(cur);
      cur = [c];
    } else {
      cur.push(c);
    }
  }
  if (cur.length > 0) segments.push(cur);
  
  // Print outline segment count
  console.log('// Outline: ' + segments[0].length + ' commands, Holes: ' + (segments.length - 1));
  console.log('');
}
