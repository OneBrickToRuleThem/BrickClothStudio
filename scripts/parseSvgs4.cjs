const fs = require('fs');
const path = require('path');

function tokenizePath(d) {
  d = d.replace(/[\n\r\t]/g, ' ');
  const tokens = [];
  let i = 0;
  
  while (i < d.length) {
    const ch = d[i];
    if (ch === ' ' || ch === ',') { i++; continue; }
    if (/[a-zA-Z]/.test(ch) && !(ch === 'e' || ch === 'E')) { tokens.push(ch); i++; continue; }
    if (ch === '-' || ch === '+' || ch === '.' || /\d/.test(ch)) {
      let num = '';
      // Sign
      if (ch === '-' || ch === '+') { num += ch; i++; }
      // Integer part
      while (i < d.length && /\d/.test(d[i])) { num += d[i]; i++; }
      // Decimal part
      if (i < d.length && d[i] === '.') {
        num += d[i]; i++;
        while (i < d.length && /\d/.test(d[i])) { num += d[i]; i++; }
      }
      // Exponent part (e.g., 1.5e-4)
      if (i < d.length && (d[i] === 'e' || d[i] === 'E')) {
        num += d[i]; i++;
        if (i < d.length && (d[i] === '-' || d[i] === '+')) { num += d[i]; i++; }
        while (i < d.length && /\d/.test(d[i])) { num += d[i]; i++; }
      }
      const val = parseFloat(num);
      if (!isNaN(val)) {
        tokens.push(val);
      }
      continue;
    }
    i++;
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
        curX = readNum(); curY = readNum(); startX = curX; startY = curY;
        commands.push({ type: 'M', x: curX, y: curY });
        while (isNum()) { curX = readNum(); curY = readNum(); commands.push({ type: 'L', x: curX, y: curY }); }
        break;
      case 'm':
        curX += readNum(); curY += readNum(); startX = curX; startY = curY;
        commands.push({ type: 'M', x: curX, y: curY });
        while (isNum()) { curX += readNum(); curY += readNum(); commands.push({ type: 'L', x: curX, y: curY }); }
        break;
      case 'C':
        while (isNum()) {
          const x1=readNum(),y1=readNum(),x2=readNum(),y2=readNum(),x=readNum(),y=readNum();
          commands.push({ type:'C', x1,y1,x2,y2,x,y }); curX=x; curY=y;
        }
        break;
      case 'c':
        while (isNum()) {
          const dx1=readNum(),dy1=readNum(),dx2=readNum(),dy2=readNum(),dx=readNum(),dy=readNum();
          commands.push({ type:'C', x1:curX+dx1,y1:curY+dy1,x2:curX+dx2,y2:curY+dy2,x:curX+dx,y:curY+dy });
          curX+=dx; curY+=dy;
        }
        break;
      case 'L':
        while (isNum()) { curX=readNum(); curY=readNum(); commands.push({ type:'L', x:curX, y:curY }); }
        break;
      case 'l':
        while (isNum()) { curX+=readNum(); curY+=readNum(); commands.push({ type:'L', x:curX, y:curY }); }
        break;
      case 'H':
        while (isNum()) { curX=readNum(); commands.push({ type:'L', x:curX, y:curY }); }
        break;
      case 'h':
        while (isNum()) { curX+=readNum(); commands.push({ type:'L', x:curX, y:curY }); }
        break;
      case 'V':
        while (isNum()) { curY=readNum(); commands.push({ type:'L', x:curX, y:curY }); }
        break;
      case 'v':
        while (isNum()) { curY+=readNum(); commands.push({ type:'L', x:curX, y:curY }); }
        break;
      case 'Z': case 'z':
        commands.push({ type:'Z' }); curX=startX; curY=startY;
        break;
    }
  }
  
  // Convert to mm
  const mmCommands = commands.map(c => {
    if (c.type==='Z') return c;
    if (c.type==='M'||c.type==='L') return {type:c.type, x:c.x+tx, y:c.y+ty};
    if (c.type==='C') return {type:'C', x1:c.x1+tx,y1:c.y1+ty, x2:c.x2+tx,y2:c.y2+ty, x:c.x+tx,y:c.y+ty};
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
  
  // Bounds
  function segBounds(seg) {
    const xs = [], ys = [];
    for (const c of seg) {
      if (c.x !== undefined) { xs.push(c.x); ys.push(c.y); }
      if (c.x1 !== undefined) { xs.push(c.x1); ys.push(c.y1); xs.push(c.x2); ys.push(c.y2); }
    }
    return { minX: Math.min(...xs), maxX: Math.max(...xs), minY: Math.min(...ys), maxY: Math.max(...ys) };
  }
  
  const ob = segBounds(segments[0]);
  const oW = ob.maxX - ob.minX;
  const oH = ob.maxY - ob.minY;
  
  console.log('=== ' + filename + ' ===');
  console.log('SVG: ' + svgW.toFixed(2) + 'x' + svgH.toFixed(2) + 'mm');
  console.log('Outline: ' + oW.toFixed(2) + 'x' + oH.toFixed(2) + 'mm (' + ob.minX.toFixed(2) + ',' + ob.minY.toFixed(2) + ')->(' + ob.maxX.toFixed(2) + ',' + ob.maxY.toFixed(2) + ')');
  console.log('Sub-paths: ' + segments.length);
  
  const holes = [];
  for (let si = 1; si < segments.length; si++) {
    const seg = segments[si];
    const b = segBounds(seg);
    const w = b.maxX-b.minX, h = b.maxY-b.minY;
    const cx = (b.minX+b.maxX)/2, cy = (b.minY+b.maxY)/2;
    const pts = seg.filter(c => c.x !== undefined).map(c => ({x:c.x, y:c.y}));
    const radii = pts.map(p => Math.sqrt((p.x-cx)**2+(p.y-cy)**2));
    const avgR = radii.reduce((s,r) => s+r,0) / radii.length;
    const stdR = Math.sqrt(radii.reduce((s,r) => s+(r-avgR)**2,0)/radii.length);
    const isCircular = avgR > 0.3 && stdR/avgR < 0.35;
    const relX = (cx-ob.minX)/oW, relY = (cy-ob.minY)/oH;
    console.log('  Sub' + si + ': ' + w.toFixed(2) + 'x' + h.toFixed(2) + 'mm center=(' + cx.toFixed(2) + ',' + cy.toFixed(2) + ') rel=(' + relX.toFixed(4) + ',' + relY.toFixed(4) + ') r=' + avgR.toFixed(2) + ' ' + (isCircular ? 'HOLE d=' + (avgR*2).toFixed(2) + 'mm' : 'shape'));
    if (isCircular || w < 8) holes.push({ cx, cy, relX, relY, avgR, diameter: avgR*2, w, h });
  }
  
  // Normalize outline to fractions
  const normOutline = segments[0].map(c => {
    if (c.type==='Z') return c;
    const nx = v => (v-ob.minX)/oW;
    const ny = v => (v-ob.minY)/oH;
    if (c.type==='M'||c.type==='L') return {type:c.type, x:nx(c.x), y:ny(c.y)};
    if (c.type==='C') return {type:'C', x1:nx(c.x1),y1:ny(c.y1), x2:nx(c.x2),y2:ny(c.y2), x:nx(c.x),y:ny(c.y)};
    return c;
  });
  
  console.log('');
  return { svgW, svgH, oW, oH, ob, normOutline, segments, holes, filename };
}

const results = {};
const files = ['AsymetricCapeTemplate.svg', 'WraithRing.svg', '7Point.svg', 'HighCollarTemplate.svg'];
for (const f of files) {
  try { results[f] = parseSVG(f); } catch(e) { console.log('Error parsing ' + f + ': ' + e.message + '\n'); }
}

// Generate TypeScript
console.log('\n=== TYPESCRIPT GENERATION ===\n');

function genTS(name, data) {
  const varName = name.replace(/Template|\.svg/g, '').replace(/[^a-zA-Z0-9]/g, '_');
  const lines = [];
  
  lines.push('// ' + name + ' — ' + data.oW.toFixed(1) + ' x ' + data.oH.toFixed(1) + 'mm original');
  lines.push('// Holes: ' + data.holes.map(h => 'd=' + h.diameter.toFixed(2) + 'mm at (' + h.relX.toFixed(4) + ',' + h.relY.toFixed(4) + ')').join(', '));
  lines.push('');
  
  // Generate drawing function body
  lines.push('  generateCutPath(params: TemplateParams): string {');
  lines.push('    const w = params.width;');
  lines.push('    const h = params.length;');
  lines.push('    const path = new SVGPath();');
  
  for (const c of data.normOutline) {
    if (c.type === 'M') {
      lines.push('    path.moveTo(w * ' + c.x.toFixed(6) + ', h * ' + c.y.toFixed(6) + ');');
    } else if (c.type === 'L') {
      lines.push('    path.lineTo(w * ' + c.x.toFixed(6) + ', h * ' + c.y.toFixed(6) + ');');
    } else if (c.type === 'C') {
      lines.push('    path.cubicBezierTo(w * ' + c.x1.toFixed(6) + ', h * ' + c.y1.toFixed(6) + ', w * ' + c.x2.toFixed(6) + ', h * ' + c.y2.toFixed(6) + ', w * ' + c.x.toFixed(6) + ', h * ' + c.y.toFixed(6) + ');');
    } else if (c.type === 'Z') {
      lines.push('    path.closePath();');
    }
  }
  
  lines.push('    return path.toString();');
  lines.push('  }');
  
  return lines.join('\n');
}

for (const [name, data] of Object.entries(results)) {
  if (!data) continue;
  console.log(genTS(name, data));
  console.log('');
}
