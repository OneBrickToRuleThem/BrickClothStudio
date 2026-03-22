/**
 * Generate TypeScript code for SVG template variants.
 * Outputs the fractional path data that can be pasted into template files.
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
    if (c.type === 'M') { if (cur.length > 0) segments.push(cur); cur = [c]; } else { cur.push(c); }
  }
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
  
  // Analyze sub-paths
  const subPathInfo = segments.map((seg, idx) => {
    const b = segBounds(seg);
    const w = b.maxX-b.minX, h = b.maxY-b.minY;
    const cx = (b.minX+b.maxX)/2, cy = (b.minY+b.maxY)/2;
    const pts = seg.filter(c => c.x !== undefined).map(c => ({x:c.x, y:c.y}));
    const radii = pts.map(p => Math.sqrt((p.x-cx)**2+(p.y-cy)**2));
    const avgR = radii.reduce((s,r) => s+r,0) / radii.length;
    return { idx, w, h, cx, cy, avgR, relX: (cx-ob.minX)/oW, relY: (cy-ob.minY)/oH, seg };
  });
  
  return { svgW, svgH, oW, oH, ob, segments, subPathInfo };
}

// Parse all SVGs
const data = {};
['AsymetricCapeTemplate.svg', 'WraithRing.svg', '7Point.svg', 'HighCollarTemplate.svg'].forEach(f => {
  try { data[f] = parseSVG(f); } catch(e) { console.error('Error: ' + f + ': ' + e.message); }
});

// Configuration for each variant:
// Which sub-paths are head holes (to be replaced with generateAttachmentHole)
// and which are decorative (to be kept in cut paths)
const config = {
  'AsymetricCapeTemplate.svg': {
    headHoles: [1, 2], // Sub1 and Sub2 are head holes
    decorative: [],
  },
  'WraithRing.svg': {
    headHoles: [1, 2], // Sub1 and Sub2 are the attachment holes near top
    decorative: [3, 4, 5, 6, 7, 8, 9], // All other sub-paths are decorative features
  },
  '7Point.svg': {
    headHoles: [2, 3], // Sub2 and Sub3 are head holes (~5mm)
    decorative: [1], // Sub1 is a small decorative element (2.3mm)
  },
  'HighCollarTemplate.svg': {
    headHoles: [1, 2], // Both sub-paths are head holes
    decorative: [],
  },
};

// Generate code
function normSegment(seg, ob, oW, oH) {
  return seg.map(c => {
    if (c.type==='Z') return c;
    const nx = v => (v-ob.minX)/oW;
    const ny = v => (v-ob.minY)/oH;
    if (c.type==='M'||c.type==='L') return {type:c.type, x:nx(c.x), y:ny(c.y)};
    if (c.type==='C') return {type:'C', x1:nx(c.x1),y1:ny(c.y1), x2:nx(c.x2),y2:ny(c.y2), x:nx(c.x),y:ny(c.y)};
    return c;
  });
}

function fmtNum(n) {
  // Format to 4 decimal places, remove trailing zeros
  return n.toFixed(4);
}

function genPathCode(normCmds, indent) {
  const lines = [];
  for (const c of normCmds) {
    if (c.type === 'M') {
      lines.push(indent + 'path.moveTo(w * ' + fmtNum(c.x) + ', h * ' + fmtNum(c.y) + ');');
    } else if (c.type === 'L') {
      lines.push(indent + 'path.lineTo(w * ' + fmtNum(c.x) + ', h * ' + fmtNum(c.y) + ');');
    } else if (c.type === 'C') {
      lines.push(indent + 'path.cubicBezierTo(w * ' + fmtNum(c.x1) + ', h * ' + fmtNum(c.y1) + ', w * ' + fmtNum(c.x2) + ', h * ' + fmtNum(c.y2) + ', w * ' + fmtNum(c.x) + ', h * ' + fmtNum(c.y) + ');');
    } else if (c.type === 'Z') {
      lines.push(indent + 'path.closePath();');
    }
  }
  return lines.join('\n');
}

// Output results
for (const [filename, d] of Object.entries(data)) {
  if (!d) continue;
  const cfg = config[filename];
  const norm = normSegment(d.segments[0], d.ob, d.oW, d.oH);
  
  // Get hole center positions (relative)
  const holePositions = cfg.headHoles.map(idx => {
    const sp = d.subPathInfo[idx];
    return { relX: sp.relX, relY: sp.relY };
  });
  
  // Get decorative sub-paths (normalized)
  const decorPaths = cfg.decorative.map(idx => normSegment(d.segments[idx], d.ob, d.oW, d.oH));
  
  console.log('// ═══ ' + filename + ' ═══');
  console.log('// Original: ' + d.oW.toFixed(1) + ' x ' + d.oH.toFixed(1) + ' mm');
  console.log('// Head holes: ' + holePositions.map(h => '(' + h.relX.toFixed(4) + ', ' + h.relY.toFixed(4) + ')').join(', '));
  console.log('// Decorative sub-paths: ' + decorPaths.length);
  console.log('');
  
  console.log('  generateCutPath(params: TemplateParams): string {');
  console.log('    const w = params.width;');
  console.log('    const h = params.length;');
  console.log('    const path = new SVGPath();');
  console.log(genPathCode(norm, '    '));
  console.log('    return path.toString();');
  console.log('  }');
  console.log('');
  
  if (decorPaths.length > 0) {
    console.log('  // Decorative cut-through features (part of the design)');
    console.log('  private generateDecorativePaths(params: TemplateParams): string[] {');
    console.log('    const w = params.width;');
    console.log('    const h = params.length;');
    console.log('    const paths: string[] = [];');
    for (let i = 0; i < decorPaths.length; i++) {
      console.log('    const p' + i + ' = new SVGPath();');
      console.log(genPathCode(decorPaths[i], '    '));
      console.log('    paths.push(p' + i + '.toString());');
    }
    console.log('    return paths;');
    console.log('  }');
    console.log('');
  }
  
  console.log('  // Hole positions (relative to width/height)');
  for (let i = 0; i < holePositions.length; i++) {
    console.log('  // hole' + (i+1) + ': relX=' + holePositions[i].relX.toFixed(4) + ', relY=' + holePositions[i].relY.toFixed(4));
  }
  console.log('');
  console.log('');
}
