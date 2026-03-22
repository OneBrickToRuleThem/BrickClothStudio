const fs = require('fs');
const path = require('path');

// Robust SVG number tokenizer that handles:
// - Implicit decimals: .5 = 0.5
// - Sign as separator: 1.5-2.3 = 1.5, -2.3
// - Multiple dots: 1.5.5 = 1.5, 0.5
function tokenizePath(d) {
  d = d.replace(/[\n\r\t]/g, ' ');
  const tokens = [];
  let i = 0;
  
  while (i < d.length) {
    const ch = d[i];
    
    // Skip whitespace and commas
    if (ch === ' ' || ch === ',') { i++; continue; }
    
    // Letters are commands
    if (/[a-zA-Z]/.test(ch)) {
      tokens.push(ch);
      i++;
      continue;
    }
    
    // Number: optional sign, optional integer, optional decimal
    if (ch === '-' || ch === '+' || ch === '.' || /\d/.test(ch)) {
      let num = '';
      // Sign
      if (ch === '-' || ch === '+') { num += ch; i++; }
      // Integer part
      let hasDot = false;
      while (i < d.length && /\d/.test(d[i])) { num += d[i]; i++; }
      // Decimal part
      if (i < d.length && d[i] === '.') {
        hasDot = true;
        num += d[i]; i++;
        while (i < d.length && /\d/.test(d[i])) { num += d[i]; i++; }
      }
      if (num && num !== '-' && num !== '+' && num !== '.') {
        tokens.push(parseFloat(num));
      }
      continue;
    }
    
    i++; // skip unknown
  }
  
  return tokens;
}

function parseSVG(filename) {
  const svg = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
  
  const wMatch = svg.match(/width="([\d.]+)mm"/);
  const hMatch = svg.match(/height="([\d.]+)mm"/);
  const svgW = parseFloat(wMatch[1]);
  const svgH = parseFloat(hMatch[1]);
  
  const transMatch = svg.match(/transform="translate\(([-\d.]+),([-\d.]+)\)"/);
  const tx = parseFloat(transMatch[1]);
  const ty = parseFloat(transMatch[2]);
  
  // Extract path d attribute
  const dMatch = svg.match(/\bd="([\s\S]*?)"/);
  const d = dMatch[1];
  
  const tokens = tokenizePath(d);
  
  // Parse into absolute commands
  const commands = [];
  let curX = 0, curY = 0, startX = 0, startY = 0;
  let ti = 0;
  
  const readNum = () => tokens[ti++];
  const isNum = () => ti < tokens.length && typeof tokens[ti] === 'number';
  
  while (ti < tokens.length) {
    const cmd = tokens[ti++];
    
    switch (cmd) {
      case 'M':
        curX = readNum(); curY = readNum();
        startX = curX; startY = curY;
        commands.push({ type: 'M', x: curX, y: curY });
        while (isNum()) { curX = readNum(); curY = readNum(); commands.push({ type: 'L', x: curX, y: curY }); }
        break;
      case 'm':
        curX += readNum(); curY += readNum();
        startX = curX; startY = curY;
        commands.push({ type: 'M', x: curX, y: curY });
        while (isNum()) { curX += readNum(); curY += readNum(); commands.push({ type: 'L', x: curX, y: curY }); }
        break;
      case 'C':
        while (isNum()) {
          const x1 = readNum(), y1 = readNum(), x2 = readNum(), y2 = readNum(), x = readNum(), y = readNum();
          commands.push({ type: 'C', x1, y1, x2, y2, x, y });
          curX = x; curY = y;
        }
        break;
      case 'c':
        while (isNum()) {
          const dx1 = readNum(), dy1 = readNum(), dx2 = readNum(), dy2 = readNum(), dx = readNum(), dy = readNum();
          commands.push({ type: 'C', x1: curX+dx1, y1: curY+dy1, x2: curX+dx2, y2: curY+dy2, x: curX+dx, y: curY+dy });
          curX += dx; curY += dy;
        }
        break;
      case 'L':
        while (isNum()) { curX = readNum(); curY = readNum(); commands.push({ type: 'L', x: curX, y: curY }); }
        break;
      case 'l':
        while (isNum()) { const dx = readNum(), dy = readNum(); curX += dx; curY += dy; commands.push({ type: 'L', x: curX, y: curY }); }
        break;
      case 'H':
        while (isNum()) { curX = readNum(); commands.push({ type: 'L', x: curX, y: curY }); }
        break;
      case 'h':
        while (isNum()) { curX += readNum(); commands.push({ type: 'L', x: curX, y: curY }); }
        break;
      case 'V':
        while (isNum()) { curY = readNum(); commands.push({ type: 'L', x: curX, y: curY }); }
        break;
      case 'v':
        while (isNum()) { curY += readNum(); commands.push({ type: 'L', x: curX, y: curY }); }
        break;
      case 'Z': case 'z':
        commands.push({ type: 'Z' });
        curX = startX; curY = startY;
        break;
    }
  }
  
  // Convert path coords to mm by applying translate
  // viewBox = "0 0 W H" where W,H = mm dimensions
  // path_mm = raw_path_coord + translate
  const mmCommands = commands.map(c => {
    if (c.type === 'Z') return c;
    if (c.type === 'M' || c.type === 'L') return { type: c.type, x: c.x + tx, y: c.y + ty };
    if (c.type === 'C') return { type: 'C', x1: c.x1+tx, y1: c.y1+ty, x2: c.x2+tx, y2: c.y2+ty, x: c.x+tx, y: c.y+ty };
    return c;
  });
  
  // Split into sub-paths
  const segments = [];
  let cur = [];
  for (const c of mmCommands) {
    if (c.type === 'M') {
      if (cur.length > 0) segments.push(cur);
      cur = [c];
    } else {
      cur.push(c);
    }
  }
  if (cur.length > 0) segments.push(cur);
  
  // Find outline bounds (using endpoints only - control points may exceed)
  function segBounds(seg) {
    const xs = [], ys = [];
    for (const c of seg) {
      if (c.x !== undefined) { xs.push(c.x); ys.push(c.y); }
      // Include control points for better bounds
      if (c.x1 !== undefined) { xs.push(c.x1); ys.push(c.y1); xs.push(c.x2); ys.push(c.y2); }
    }
    return {
      minX: Math.min(...xs), maxX: Math.max(...xs),
      minY: Math.min(...ys), maxY: Math.max(...ys)
    };
  }
  
  const outlineBounds = segBounds(segments[0]);
  const oW = outlineBounds.maxX - outlineBounds.minX;
  const oH = outlineBounds.maxY - outlineBounds.minY;
  
  console.log('=== ' + filename + ' ===');
  console.log('SVG dimensions: ' + svgW.toFixed(2) + ' x ' + svgH.toFixed(2) + ' mm');
  console.log('Outline bounds: (' + outlineBounds.minX.toFixed(2) + ',' + outlineBounds.minY.toFixed(2) + ') to (' + outlineBounds.maxX.toFixed(2) + ',' + outlineBounds.maxY.toFixed(2) + ')');
  console.log('Outline size: ' + oW.toFixed(2) + ' x ' + oH.toFixed(2) + ' mm');
  console.log('Sub-paths: ' + segments.length);
  
  // Analyze holes
  const holes = [];
  for (let si = 1; si < segments.length; si++) {
    const seg = segments[si];
    const b = segBounds(seg);
    const w = b.maxX - b.minX;
    const h = b.maxY - b.minY;
    const cx = (b.minX + b.maxX) / 2;
    const cy = (b.minY + b.maxY) / 2;
    
    // Check circularity using endpoint distances from center
    const pts = seg.filter(c => c.x !== undefined).map(c => ({ x: c.x, y: c.y }));
    const radii = pts.map(p => Math.sqrt((p.x - cx)**2 + (p.y - cy)**2));
    const avgR = radii.reduce((s,r) => s+r, 0) / radii.length;
    const stdR = Math.sqrt(radii.reduce((s,r) => s+(r-avgR)**2, 0) / radii.length);
    const isCircular = avgR > 0.3 && stdR / avgR < 0.3;
    
    const relX = (cx - outlineBounds.minX) / oW;
    const relY = (cy - outlineBounds.minY) / oH;
    
    console.log('  Sub-path ' + si + ': ' + pts.length + ' pts, size=' + w.toFixed(2) + 'x' + h.toFixed(2) + 'mm, center=(' + cx.toFixed(2) + ',' + cy.toFixed(2) + ')mm, rel=(' + relX.toFixed(3) + ',' + relY.toFixed(3) + '), avgR=' + avgR.toFixed(2) + 'mm' + (isCircular ? ' *** HOLE d=' + (avgR*2).toFixed(2) + 'mm ***' : ''));
    
    if (isCircular) {
      holes.push({ cx, cy, relX, relY, avgR, diameter: avgR * 2 });
    }
  }
  
  // Normalize outline to fractions
  const normOutline = segments[0].map(c => {
    if (c.type === 'Z') return c;
    const nx = v => (v - outlineBounds.minX) / oW;
    const ny = v => (v - outlineBounds.minY) / oH;
    if (c.type === 'M' || c.type === 'L') return { type: c.type, x: nx(c.x), y: ny(c.y) };
    if (c.type === 'C') return { type: 'C', x1: nx(c.x1), y1: ny(c.y1), x2: nx(c.x2), y2: ny(c.y2), x: nx(c.x), y: ny(c.y) };
    return c;
  });
  
  console.log('');
  
  return { svgW, svgH, oW, oH, outlineBounds, normOutline, segments, holes, filename };
}

const results = {};
const files = ['AsymetricCapeTemplate.svg', 'WraithRing.svg', '7Point.svg', 'HighCollarTemplate.svg'];
for (const f of files) {
  try { results[f] = parseSVG(f); } catch(e) { console.log('Error: ' + f + ': ' + e.message + '\n' + e.stack + '\n'); }
}

// Generate TypeScript code for the shapes
console.log('\n=== TYPESCRIPT OUTPUT ===\n');

for (const [name, data] of Object.entries(results)) {
  if (!data) continue;
  
  console.log('// --- ' + name + ' ---');
  console.log('// Original: ' + data.oW.toFixed(2) + ' x ' + data.oH.toFixed(2) + ' mm');
  console.log('// Holes: ' + data.holes.length);
  for (const h of data.holes) {
    console.log('//   Hole at rel(' + h.relX.toFixed(4) + ', ' + h.relY.toFixed(4) + '), diameter=' + h.diameter.toFixed(2) + 'mm');
  }
  
  // Generate path commands as compact TypeScript
  console.log('const ' + name.replace(/[^a-zA-Z0-9]/g, '_').replace(/\.svg$/, '').replace(/_svg$/, '') + '_PATH: PathCmd[] = [');
  
  let lineCount = 0;
  for (const c of data.normOutline) {
    if (c.type === 'M') {
      console.log('  [\'M\', ' + c.x.toFixed(5) + ', ' + c.y.toFixed(5) + '],');
    } else if (c.type === 'L') {
      console.log('  [\'L\', ' + c.x.toFixed(5) + ', ' + c.y.toFixed(5) + '],');
    } else if (c.type === 'C') {
      console.log('  [\'C\', ' + c.x1.toFixed(5) + ', ' + c.y1.toFixed(5) + ', ' + c.x2.toFixed(5) + ', ' + c.y2.toFixed(5) + ', ' + c.x.toFixed(5) + ', ' + c.y.toFixed(5) + '],');
    } else if (c.type === 'Z') {
      console.log('  [\'Z\'],');
    }
    lineCount++;
  }
  console.log('];');
  console.log('// ' + lineCount + ' commands');
  console.log('');
}
