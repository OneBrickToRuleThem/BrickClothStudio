/**
 * Generate compact TypeScript variant data as array literals.
 */
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
      if (ch === '-' || ch === '+') { num += ch; i++; }
      while (i < d.length && /\d/.test(d[i])) { num += d[i]; i++; }
      if (i < d.length && d[i] === '.') { num += d[i]; i++; while (i < d.length && /\d/.test(d[i])) { num += d[i]; i++; } }
      if (i < d.length && (d[i] === 'e' || d[i] === 'E')) { num += d[i]; i++; if (i < d.length && (d[i] === '-' || d[i] === '+')) { num += d[i]; i++; } while (i < d.length && /\d/.test(d[i])) { num += d[i]; i++; } }
      const val = parseFloat(num);
      if (!isNaN(val)) tokens.push(val);
      continue;
    }
    i++;
  }
  return tokens;
}

function parseSVG(filename) {
  const svg = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
  const transMatch = svg.match(/transform="translate\(([-\d.]+),([-\d.]+)\)"/);
  const tx = parseFloat(transMatch[1]);
  const ty = parseFloat(transMatch[2]);
  const dMatch = svg.match(/\bd="([\s\S]*?)"/);
  const tokens = tokenizePath(dMatch[1]);
  
  const commands = [];
  let curX = 0, curY = 0, startX = 0, startY = 0;
  let ti = 0;
  const readNum = () => tokens[ti++];
  const isNum = () => ti < tokens.length && typeof tokens[ti] === 'number';
  
  while (ti < tokens.length) {
    const cmd = tokens[ti++];
    switch (cmd) {
      case 'M': curX=readNum(); curY=readNum(); startX=curX; startY=curY; commands.push({type:'M',x:curX,y:curY}); while(isNum()){curX=readNum();curY=readNum();commands.push({type:'L',x:curX,y:curY});} break;
      case 'm': curX+=readNum(); curY+=readNum(); startX=curX; startY=curY; commands.push({type:'M',x:curX,y:curY}); while(isNum()){curX+=readNum();curY+=readNum();commands.push({type:'L',x:curX,y:curY});} break;
      case 'C': while(isNum()){const x1=readNum(),y1=readNum(),x2=readNum(),y2=readNum(),x=readNum(),y=readNum();commands.push({type:'C',x1,y1,x2,y2,x,y});curX=x;curY=y;} break;
      case 'c': while(isNum()){const dx1=readNum(),dy1=readNum(),dx2=readNum(),dy2=readNum(),dx=readNum(),dy=readNum();commands.push({type:'C',x1:curX+dx1,y1:curY+dy1,x2:curX+dx2,y2:curY+dy2,x:curX+dx,y:curY+dy});curX+=dx;curY+=dy;} break;
      case 'L': while(isNum()){curX=readNum();curY=readNum();commands.push({type:'L',x:curX,y:curY});} break;
      case 'l': while(isNum()){curX+=readNum();curY+=readNum();commands.push({type:'L',x:curX,y:curY});} break;
      case 'H': while(isNum()){curX=readNum();commands.push({type:'L',x:curX,y:curY});} break;
      case 'h': while(isNum()){curX+=readNum();commands.push({type:'L',x:curX,y:curY});} break;
      case 'V': while(isNum()){curY=readNum();commands.push({type:'L',x:curX,y:curY});} break;
      case 'v': while(isNum()){curY+=readNum();commands.push({type:'L',x:curX,y:curY});} break;
      case 'Z': case 'z': commands.push({type:'Z'}); curX=startX; curY=startY; break;
    }
  }
  
  const mmCommands = commands.map(c => {
    if (c.type==='Z') return c;
    if (c.type==='M'||c.type==='L') return {type:c.type, x:c.x+tx, y:c.y+ty};
    if (c.type==='C') return {type:'C', x1:c.x1+tx,y1:c.y1+ty, x2:c.x2+tx,y2:c.y2+ty, x:c.x+tx,y:c.y+ty};
    return c;
  });
  
  const segments = []; let cur = [];
  for (const c of mmCommands) { if (c.type === 'M') { if (cur.length > 0) segments.push(cur); cur = [c]; } else { cur.push(c); } }
  if (cur.length > 0) segments.push(cur);
  
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
  
  const subPathInfo = segments.map((seg, idx) => {
    const b = segBounds(seg);
    const cx = (b.minX+b.maxX)/2, cy = (b.minY+b.maxY)/2;
    const pts = seg.filter(c => c.x !== undefined).map(c => ({x:c.x, y:c.y}));
    const radii = pts.map(p => Math.sqrt((p.x-cx)**2+(p.y-cy)**2));
    const avgR = radii.reduce((s,r) => s+r,0) / radii.length;
    return { idx, cx, cy, avgR, relX: (cx-ob.minX)/oW, relY: (cy-ob.minY)/oH };
  });
  
  return { oW, oH, ob, segments, subPathInfo };
}

function normSeg(seg, ob, oW, oH) {
  return seg.map(c => {
    if (c.type==='Z') return c;
    const nx = v => (v-ob.minX)/oW;
    const ny = v => (v-ob.minY)/oH;
    if (c.type==='M'||c.type==='L') return {type:c.type, x:nx(c.x), y:ny(c.y)};
    if (c.type==='C') return {type:'C', x1:nx(c.x1),y1:ny(c.y1), x2:nx(c.x2),y2:ny(c.y2), x:nx(c.x),y:ny(c.y)};
    return c;
  });
}

function f(n) { return n.toFixed(4); }

function cmdsToArrayStr(cmds) {
  const items = [];
  for (const c of cmds) {
    if (c.type === 'Z') { items.push('  [0]'); continue; }
    if (c.type === 'M') { items.push('  [1, ' + f(c.x) + ', ' + f(c.y) + ']'); continue; }
    if (c.type === 'L') { items.push('  [2, ' + f(c.x) + ', ' + f(c.y) + ']'); continue; }
    if (c.type === 'C') { items.push('  [3, ' + f(c.x1) + ', ' + f(c.y1) + ', ' + f(c.x2) + ', ' + f(c.y2) + ', ' + f(c.x) + ', ' + f(c.y) + ']'); continue; }
  }
  return '[\n' + items.join(',\n') + ',\n]';
}

const data = {};
const files = ['AsymetricCapeTemplate.svg', 'WraithRing.svg', '7Point.svg', 'HighCollarTemplate.svg'];
for (const f of files) { try { data[f] = parseSVG(f); } catch(e) { console.error('Error: ' + f + ': ' + e.message); } }

const config = {
  'AsymetricCapeTemplate.svg': { headHoles: [1, 2], decorative: [], varName: 'WIND_SWEPT', defaultW: 47, defaultH: 51 },
  'WraithRing.svg': { headHoles: [1, 2], decorative: [3, 4, 5, 6, 7, 8, 9], varName: 'PHANTOM_SHROUD', defaultW: 48, defaultH: 51 },
  '7Point.svg': { headHoles: [2, 3], decorative: [1], varName: 'SEVEN_POINTS', defaultW: 52, defaultH: 40 },
  'HighCollarTemplate.svg': { headHoles: [1, 2], decorative: [], varName: 'HIGH_COLLAR', defaultW: 32, defaultH: 18 },
};

let out = '';
out += '// ── SVG shape path commands: [0]=close, [1,x,y]=move, [2,x,y]=line, [3,x1,y1,x2,y2,x,y]=cubic ──\n';
out += '// Coordinates are fractions [0..1] of (width, height). Generated from traced SVG templates.\n';
out += 'type FracCmd = number[];\n\n';

for (const [fname, d] of Object.entries(data)) {
  if (!d) continue;
  const cfg = config[fname];
  const norm = normSeg(d.segments[0], d.ob, d.oW, d.oH);
  
  out += '// ' + fname + ' (' + d.oW.toFixed(1) + ' x ' + d.oH.toFixed(1) + 'mm)\n';
  out += 'const ' + cfg.varName + '_OUTLINE: FracCmd[] = ' + cmdsToArrayStr(norm) + ';\n\n';
  
  // Decorative paths
  for (let i = 0; i < cfg.decorative.length; i++) {
    const idx = cfg.decorative[i];
    const normD = normSeg(d.segments[idx], d.ob, d.oW, d.oH);
    out += 'const ' + cfg.varName + '_DETAIL_' + i + ': FracCmd[] = ' + cmdsToArrayStr(normD) + ';\n\n';
  }
  
  // Hole metadata
  const holes = cfg.headHoles.map(idx => d.subPathInfo[idx]);
  out += 'const ' + cfg.varName + '_HOLES = ' + JSON.stringify(holes.map(h => ({ relX: parseFloat(h.relX.toFixed(4)), relY: parseFloat(h.relY.toFixed(4)) }))) + ';\n';
  out += '\n';
}

fs.writeFileSync(path.join(__dirname, 'variantData.ts.txt'), out);
console.log('Written to scripts/variantData.ts.txt (' + out.length + ' bytes)');
