const fs = require('fs');
const path = require('path');

function parseSVG(filename) {
  const svg = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
  // Get original dimensions in mm
  const wMatch = svg.match(/width="([\d.]+)mm"/);
  const hMatch = svg.match(/height="([\d.]+)mm"/);
  const width = parseFloat(wMatch[1]);
  const height = parseFloat(hMatch[1]);
  
  // Get transform translate
  const transMatch = svg.match(/transform="translate\(([-\d.]+),([-\d.]+)\)"/);
  const tx = parseFloat(transMatch[1]);
  const ty = parseFloat(transMatch[2]);
  
  // Get viewBox
  const vbMatch = svg.match(/viewBox="([\d.\- ]+)"/);
  const vb = vbMatch[1];
  const vbParts = vb.trim().split(/\s+/).map(Number);
  
  // Get path d attribute
  const pathMatch = svg.match(/\bd="([^"]+)"/);
  const d = pathMatch[1];
  
  console.log('=== ' + filename + ' ===');
  console.log('Dimensions: ' + width.toFixed(2) + ' x ' + height.toFixed(2) + ' mm');
  console.log('Transform: translate(' + tx + ', ' + ty + ')');
  console.log('ViewBox: ' + vb);
  
  // Parse path commands to find bounding box in raw coordinates
  // (before the translate transform)
  // The SVG viewBox defines the coordinate space of the <svg> element
  // The <g> transform offsets the paths so raw path coords are in absolute space
  // Final visible coords = raw_path_coord + translate
  // But we want coords in the viewBox space (0,0 origin at vbX, vbY)
  // viewBox says: "map this rect to the svg viewport"
  // So visible coords in mm: (raw_coord + tx - vbX) * (width_mm / vbW)
  
  // Actually simpler: the paths are in absolute Inkscape document coords,
  // the transform moves them INTO the viewBox.
  // In the viewBox space: coord_in_vb = raw_path_coord + tx - SomethingWeirdInInkscape
  // But we just need the final path in mm units.
  // viewBox maps to width/height mm, so:
  // x_mm = ((path_x + tx) - vbXOrigin - tx) * ... 
  // Actually let me just compute: final x in viewBox = pathX + tx, final y in viewBox = pathY + ty
  // Then x_mm = (finalX - vbX) / vbW * width_mm, y_mm = (finalY - vbY) / vbH * height_mm
  
  // But since viewBox origin IS 0,0 and width/height in mm equals viewBox width/height,
  // the scale factor is 1:1 (mm units in viewBox)
  // So: x_mm = pathX + tx - vbParts[0], y_mm = pathY + ty - vbParts[1]
  // But vbParts[0] = 0 and vbParts[1] = 0 for these SVGs
  // So: x_mm = pathX + tx, y_mm = pathY + ty
  
  // Wait, no. The viewBox is "0 0 W H" and the svg element has width=Wmm, height=Hmm
  // So viewBox coords ARE mm coords. The <g> transform moves the path content.
  // Final mm coord = pathCoord + translate
  // So we need: refLeft = min(all x) + tx, etc.
  
  // Parse the path to extract coordinates
  const commands = [];
  const re = /([mMcClLzZhHvVsSqQtTaA])\s*([-\d.,\s]*)/g;
  let match;
  while ((match = re.exec(d)) !== null) {
    const cmd = match[1];
    const args = match[2].trim().split(/[\s,]+/).filter(s => s).map(Number);
    commands.push({ cmd, args });
  }
  
  // Collect all points
  let curX = 0, curY = 0;
  const allX = [], allY = [];
  const rawCommands = []; // For converting to our format
  
  for (const { cmd, args } of commands) {
    if (cmd === 'm' || cmd === 'M') {
      const abs = cmd === 'M';
      for (let i = 0; i < args.length; i += 2) {
        if (abs || i === 0) {
          curX = abs ? args[i] : curX + args[i];
          curY = abs ? args[i+1] : curY + args[i+1];
        } else {
          curX += args[i];
          curY += args[i+1];
        }
        allX.push(curX); allY.push(curY);
        if (i === 0) rawCommands.push({ type: 'M', x: curX, y: curY });
        else rawCommands.push({ type: 'L', x: curX, y: curY });
      }
    } else if (cmd === 'c') {
      for (let i = 0; i < args.length; i += 6) {
        const x1 = curX + args[i], y1 = curY + args[i+1];
        const x2 = curX + args[i+2], y2 = curY + args[i+3];
        const x = curX + args[i+4], y = curY + args[i+5];
        allX.push(x1, x2, x); allY.push(y1, y2, y);
        rawCommands.push({ type: 'C', x1, y1, x2, y2, x, y });
        curX = x; curY = y;
      }
    } else if (cmd === 'C') {
      for (let i = 0; i < args.length; i += 6) {
        allX.push(args[i], args[i+2], args[i+4]);
        allY.push(args[i+1], args[i+3], args[i+5]);
        rawCommands.push({ type: 'C', x1: args[i], y1: args[i+1], x2: args[i+2], y2: args[i+3], x: args[i+4], y: args[i+5] });
        curX = args[i+4]; curY = args[i+5];
      }
    } else if (cmd === 'l') {
      for (let i = 0; i < args.length; i += 2) {
        curX += args[i]; curY += args[i+1];
        allX.push(curX); allY.push(curY);
        rawCommands.push({ type: 'L', x: curX, y: curY });
      }
    } else if (cmd === 'L') {
      for (let i = 0; i < args.length; i += 2) {
        curX = args[i]; curY = args[i+1];
        allX.push(curX); allY.push(curY);
        rawCommands.push({ type: 'L', x: curX, y: curY });
      }
    } else if (cmd === 'z' || cmd === 'Z') {
      rawCommands.push({ type: 'Z' });
    }
  }
  
  const rawMinX = Math.min(...allX);
  const rawMaxX = Math.max(...allX);
  const rawMinY = Math.min(...allY);
  const rawMaxY = Math.max(...allY);
  
  // Convert to mm (add translate)
  const mmMinX = rawMinX + tx;
  const mmMaxX = rawMaxX + tx;
  const mmMinY = rawMinY + ty;
  const mmMaxY = rawMaxY + ty;
  
  const pathW = mmMaxX - mmMinX;
  const pathH = mmMaxY - mmMinY;
  
  console.log('Path raw bounds: x=[' + rawMinX.toFixed(3) + ', ' + rawMaxX.toFixed(3) + '] y=[' + rawMinY.toFixed(3) + ', ' + rawMaxY.toFixed(3) + ']');
  console.log('Path mm bounds: x=[' + mmMinX.toFixed(3) + ', ' + mmMaxX.toFixed(3) + '] y=[' + mmMinY.toFixed(3) + ', ' + mmMaxY.toFixed(3) + ']');
  console.log('Path size in mm: ' + pathW.toFixed(2) + ' x ' + pathH.toFixed(2));
  console.log('Commands: ' + rawCommands.length);
  
  // Now convert all coords to normalized [0,1] fractions of bounding box
  // x_frac = (rawCoord + tx - mmMinX) / pathW
  // y_frac = (rawCoord + ty - mmMinY) / pathH
  const normCommands = rawCommands.map(c => {
    if (c.type === 'Z') return c;
    const nx = v => ((v + tx - mmMinX) / pathW);
    const ny = v => ((v + ty - mmMinY) / pathH);
    if (c.type === 'M' || c.type === 'L') return { type: c.type, x: nx(c.x), y: ny(c.y) };
    if (c.type === 'C') return { type: 'C', x1: nx(c.x1), y1: ny(c.y1), x2: nx(c.x2), y2: ny(c.y2), x: nx(c.x), y: ny(c.y) };
    return c;
  });
  
  console.log('');
  
  return { width: pathW, height: pathH, normCommands, rawCommands, tx, ty, mmMinX, mmMinY, filename };
}

const results = {};
['AsymetricCapeTemplate.svg', 'WraithRing.svg', '7Point.svg', 'HighCollarTemplate.svg'].forEach(f => {
  try { results[f] = parseSVG(f); } catch(e) { console.log('Error: ' + f + ': ' + e.message); }
});

// Now let's analyze holes. For capes, the standard hole is a circle or stadium shape.
// We need to find any circular features in the paths that could be attachment holes.
// The trick: look for path segments that form roughly circular arcs.
// Let me look for clusters of points around the expected hole locations.

// For a standard cape, the attachment hole is near the top center.
// For pauldrons, there are two holes symmetric about the center.
// Head hole standard: 5.3mm diameter (radius 2.65mm) for minifigure

console.log('\n=== HOLE ANALYSIS ===\n');
for (const [name, data] of Object.entries(results)) {
  if (!data) continue;
  console.log('--- ' + name + ' ---');
  console.log('Normalized path size: width=' + data.width.toFixed(2) + 'mm, height=' + data.height.toFixed(2) + 'mm');
  
  // Find points that might be circular holes:
  // Look for sequences of bezier curves that double back on themselves
  // In normalized coords, find "loops" - sequences where start and end are close
  const cmds = data.normCommands;
  
  // Simple approach: look for small self-contained regions
  // For each M command, trace until next M or Z, find center and radius of the enclosed area
  let segments = [];
  let current = [];
  for (const cmd of cmds) {
    if (cmd.type === 'M') {
      if (current.length > 0) segments.push(current);
      current = [cmd];
    } else {
      current.push(cmd);
    }
  }
  if (current.length > 0) segments.push(current);
  
  console.log('Path segments (sub-paths): ' + segments.length);
  
  // The main outline is the largest segment. Any smaller segments are likely holes.
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    // Collect endpoints
    const pts = [];
    for (const c of seg) {
      if (c.type === 'M' || c.type === 'L' || c.type === 'C') {
        pts.push({ x: c.x * data.width, y: c.y * data.height });
      }
    }
    
    if (pts.length < 3) continue;
    
    // Find center and approximate radius
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    const radii = pts.map(p => Math.sqrt((p.x - cx) ** 2 + (p.y - cy) ** 2));
    const avgR = radii.reduce((s, r) => s + r, 0) / radii.length;
    const stdR = Math.sqrt(radii.reduce((s, r) => s + (r - avgR) ** 2, 0) / radii.length);
    
    const isCircular = stdR / avgR < 0.2 && avgR < 5; // Low variance relative to radius
    
    if (i === 0) {
      console.log('  Segment 0 (main outline): ' + pts.length + ' points, center=(' + cx.toFixed(2) + ', ' + cy.toFixed(2) + ')');
    } else {
      console.log('  Segment ' + i + ': ' + pts.length + ' pts, center=(' + cx.toFixed(2) + ', ' + cy.toFixed(2) + '), avgR=' + avgR.toFixed(2) + 'mm, stdR=' + stdR.toFixed(3) + (isCircular ? ' *** LIKELY HOLE ***' : ''));
      if (isCircular) {
        console.log('    -> Hole diameter: ' + (avgR * 2).toFixed(2) + 'mm (standard minifig=5.3mm)');
      }
    }
  }
  console.log('');
}
