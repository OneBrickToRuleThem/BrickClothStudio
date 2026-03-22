/**
 * Parse Kama_full_template.svg and convert to FracCmd format for svgVariants.ts
 */

const pathData = `M 9.75,18.91 C 8.45,18.84 5.03,17.82 4.8,17.42 4.72,17.28 4.15,15.43 3.54,13.32 2.93,11.21 2.33,9.32 2.2,9.13 2.07,8.94 1.67,8.65 1.32,8.48 0.27,8 0.17,7.66 0.07,4.56 0,1.53 0.1,0.98 0.98,0.39 1.43,0.09 1.69,0.07 4.7,0.05 8.27,0.03 8.69,0.12 9.3,1.02 9.62,1.5 9.64,1.69 9.63,5.1 v 3.59 l 0.87,0.03 c 0.47,0.02 1.65,0.02 2.63,-0.01 L 14.89,8.65 14.87,5.16 c -0.03,-3.85 0.01,-4.03 1.03,-4.7 0.49,-0.32 0.68,-0.34 4.76,-0.36 1.42,-0.08 4.26,-0.08 5.68,0 4.08,0.02 4.27,0.04 4.76,0.36 1.02,0.67 1.06,0.85 1.03,4.7 l -0.02,3.49 1.76,0.06 c 0.98,0.03 2.16,0.03 2.63,0.01 L 37.37,8.69 V 5.1 c -0.01,-3.41 0.01,-3.6 0.33,-4.08 0.61,-0.9 1.03,-0.99 4.6,-0.97 3.01,0.02 3.27,0.04 3.72,0.34 0.88,0.59 0.98,1.14 0.91,4.17 -0.1,3.1 -0.2,3.44 -1.25,3.92 -0.35,0.17 -0.75,0.46 -0.88,0.65 -0.13,0.19 -0.73,2.08 -1.34,4.19 -0.61,2.11 -1.18,3.96 -1.26,4.1 -0.23,0.4 -3.65,1.42 -4.95,1.49 -1.061585,0.05221 -26.43277,0.05249 -27.5,0 z`;

function tokenize(d) {
  const tokens = [];
  const regex = /([MmCcLlVvHhZzSsQqTtAa])|(-?\d+\.?\d*(?:e[+-]?\d+)?)/g;
  let match;
  while ((match = regex.exec(d)) !== null) {
    if (match[1]) tokens.push(match[1]);
    else tokens.push(parseFloat(match[2]));
  }
  return tokens;
}

function parsePath(d) {
  const tokens = tokenize(d);
  const cmds = [];
  let cx = 0, cy = 0;
  let i = 0;

  while (i < tokens.length) {
    const cmd = tokens[i++];
    switch (cmd) {
      case 'M':
        cx = tokens[i++]; cy = tokens[i++];
        cmds.push({ type: 'M', x: cx, y: cy });
        while (i < tokens.length && typeof tokens[i] === 'number') {
          cx = tokens[i++]; cy = tokens[i++];
          cmds.push({ type: 'L', x: cx, y: cy });
        }
        break;
      case 'm':
        cx += tokens[i++]; cy += tokens[i++];
        cmds.push({ type: 'M', x: cx, y: cy });
        while (i < tokens.length && typeof tokens[i] === 'number') {
          cx += tokens[i++]; cy += tokens[i++];
          cmds.push({ type: 'L', x: cx, y: cy });
        }
        break;
      case 'C':
        while (i < tokens.length && typeof tokens[i] === 'number') {
          const x1 = tokens[i++], y1 = tokens[i++];
          const x2 = tokens[i++], y2 = tokens[i++];
          const x = tokens[i++], y = tokens[i++];
          cmds.push({ type: 'C', x1, y1, x2, y2, x, y });
          cx = x; cy = y;
        }
        break;
      case 'c':
        while (i < tokens.length && typeof tokens[i] === 'number') {
          const x1 = cx + tokens[i++], y1 = cy + tokens[i++];
          const x2 = cx + tokens[i++], y2 = cy + tokens[i++];
          const x = cx + tokens[i++], y = cy + tokens[i++];
          cmds.push({ type: 'C', x1, y1, x2, y2, x, y });
          cx = x; cy = y;
        }
        break;
      case 'L':
        while (i < tokens.length && typeof tokens[i] === 'number') {
          cx = tokens[i++]; cy = tokens[i++];
          cmds.push({ type: 'L', x: cx, y: cy });
        }
        break;
      case 'l':
        while (i < tokens.length && typeof tokens[i] === 'number') {
          cx += tokens[i++]; cy += tokens[i++];
          cmds.push({ type: 'L', x: cx, y: cy });
        }
        break;
      case 'V':
        cy = tokens[i++];
        cmds.push({ type: 'L', x: cx, y: cy });
        break;
      case 'v':
        cy += tokens[i++];
        cmds.push({ type: 'L', x: cx, y: cy });
        break;
      case 'H':
        cx = tokens[i++];
        cmds.push({ type: 'L', x: cx, y: cy });
        break;
      case 'h':
        cx += tokens[i++];
        cmds.push({ type: 'L', x: cx, y: cy });
        break;
      case 'Z':
      case 'z':
        cmds.push({ type: 'Z' });
        break;
    }
  }
  return cmds;
}

const cmds = parsePath(pathData);

// Find bounding box
let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
for (const c of cmds) {
  for (const key of ['x', 'x1', 'x2']) {
    if (c[key] !== undefined) { minX = Math.min(minX, c[key]); maxX = Math.max(maxX, c[key]); }
  }
  for (const key of ['y', 'y1', 'y2']) {
    if (c[key] !== undefined) { minY = Math.min(minY, c[key]); maxY = Math.max(maxY, c[key]); }
  }
}

const w = maxX - minX;
const h = maxY - minY;
console.log(`// Bounding box: (${minX.toFixed(4)}, ${minY.toFixed(4)}) - (${maxX.toFixed(4)}, ${maxY.toFixed(4)})`);
console.log(`// Size: ${w.toFixed(2)} x ${h.toFixed(2)} mm`);
console.log(`// Min offset: dx=${minX.toFixed(4)}, dy=${minY.toFixed(4)}`);

function f(v) { return v.toFixed(4); }

// Output outline
console.log('\n// Kama_full_template.svg (' + w.toFixed(1) + ' x ' + h.toFixed(1) + 'mm original)');
console.log('const KAMA_FULL_OUTLINE: FracCmd[] = [');
for (const c of cmds) {
  switch (c.type) {
    case 'M': console.log(`  [1, ${f((c.x-minX)/w)}, ${f((c.y-minY)/h)}],`); break;
    case 'L': console.log(`  [2, ${f((c.x-minX)/w)}, ${f((c.y-minY)/h)}],`); break;
    case 'C': console.log(`  [3, ${f((c.x1-minX)/w)}, ${f((c.y1-minY)/h)}, ${f((c.x2-minX)/w)}, ${f((c.y2-minY)/h)}, ${f((c.x-minX)/w)}, ${f((c.y-minY)/h)}],`); break;
    case 'Z': console.log('  [0],'); break;
  }
}
console.log('];');

// Holes: circles approximated with 2 cubics each, center = startX + radius
const holeStarts = [
  { x: 2.32, y: 5.19, d: 5.3 },   // left outer
  { x: 39.38, y: 5.19, d: 5.3 },   // right outer
  { x: 16.68, y: 5.19, d: 5.3 },   // left inner
  { x: 25.02, y: 5.19, d: 5.3 },   // right inner
];

console.log('\nconst KAMA_FULL_HOLES = [');
for (const hole of holeStarts) {
  const cx = hole.x + hole.d / 2;
  const cy = hole.y;
  console.log(`  { relX: ${f((cx-minX)/w)}, relY: ${f((cy-minY)/h)} },`);
}
console.log('];');

// Also print abs coordinates for verification
console.log('\n// Absolute hole centers (mm):');
for (const hole of holeStarts) {
  console.log(`//   (${(hole.x + hole.d/2).toFixed(2)}, ${hole.y.toFixed(2)})`);
}
