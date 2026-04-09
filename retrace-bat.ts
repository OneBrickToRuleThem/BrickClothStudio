/**
 * Re-trace ManBatSingleHole.png with potrace, then symmetrize by mirroring left half.
 * Run: npx tsx retrace-bat.ts
 */
import sharp from 'sharp';
import * as potrace from 'potrace';
import { promisify } from 'util';
import * as fs from 'fs';

const traceFn = promisify(potrace.trace);

async function main() {
  const imgPath = 'ManBatSingleHole.png';
  
  // High-quality trace
  const pngBuf = await sharp(imgPath)
    .grayscale()
    .threshold(100)
    .png()
    .toBuffer();
  
  fs.writeFileSync('_temp_trace.png', pngBuf);
  
  const svg: string = await traceFn('_temp_trace.png', {
    color: 'black',
    threshold: 128,
    turdSize: 50,
    optTolerance: 0.2,  // higher fidelity than before
    turnPolicy: 'minority',
  });
  
  fs.unlinkSync('_temp_trace.png');
  
  // Extract ALL path data
  const pathMatches = [...svg.matchAll(/d="([^"]+)"/g)];
  if (!pathMatches.length) { console.error('No paths found'); return; }
  
  const pathData = pathMatches[0][1]; // outer contour
  
  // Parse into absolute commands
  const tokens = pathData.match(/[MmLlCcZzHhVvSsQqTtAa]|[-+]?[0-9]*\.?[0-9]+/g) || [];
  
  interface Cmd { type: string; absPoints: number[][] }
  const cmds: Cmd[] = [];
  
  let i = 0;
  let curX = 0, curY = 0;
  
  while (i < tokens.length) {
    const t = tokens[i];
    if (!/[A-Za-z]/.test(t)) { i++; continue; }
    i++;
    const nums: number[] = [];
    while (i < tokens.length && !/[A-Za-z]/.test(tokens[i])) {
      nums.push(parseFloat(tokens[i]));
      i++;
    }
    
    const cmd: Cmd = { type: t, absPoints: [] };
    
    switch (t) {
      case 'M':
        for (let j = 0; j < nums.length; j += 2) {
          curX = nums[j]; curY = nums[j+1];
          cmd.absPoints.push([curX, curY]);
        }
        break;
      case 'm':
        for (let j = 0; j < nums.length; j += 2) {
          curX += nums[j]; curY += nums[j+1];
          cmd.absPoints.push([curX, curY]);
        }
        break;
      case 'C':
        for (let j = 0; j < nums.length; j += 6) {
          cmd.absPoints.push([nums[j], nums[j+1], nums[j+2], nums[j+3], nums[j+4], nums[j+5]]);
          curX = nums[j+4]; curY = nums[j+5];
        }
        break;
      case 'c':
        for (let j = 0; j < nums.length; j += 6) {
          const p = [curX+nums[j], curY+nums[j+1], curX+nums[j+2], curY+nums[j+3], curX+nums[j+4], curY+nums[j+5]];
          cmd.absPoints.push(p);
          curX = p[4]; curY = p[5];
        }
        break;
      case 'L':
        for (let j = 0; j < nums.length; j += 2) {
          curX = nums[j]; curY = nums[j+1];
          cmd.absPoints.push([curX, curY]);
        }
        break;
      case 'l':
        for (let j = 0; j < nums.length; j += 2) {
          curX += nums[j]; curY += nums[j+1];
          cmd.absPoints.push([curX, curY]);
        }
        break;
      case 'z': case 'Z':
        break;
    }
    cmds.push(cmd);
  }
  
  // Collect all points for bounding box
  let bMinX = Infinity, bMaxX = -Infinity, bMinY = Infinity, bMaxY = -Infinity;
  for (const cmd of cmds) {
    for (const pts of cmd.absPoints) {
      for (let j = 0; j < pts.length; j += 2) {
        bMinX = Math.min(bMinX, pts[j]);
        bMaxX = Math.max(bMaxX, pts[j]);
        bMinY = Math.min(bMinY, pts[j+1]);
        bMaxY = Math.max(bMaxY, pts[j+1]);
      }
    }
  }
  const bW = bMaxX - bMinX;
  const bH = bMaxY - bMinY;
  
  // Normalize to fractional
  const fx = (x: number) => (x - bMinX) / bW;
  const fy = (y: number) => (y - bMinY) / bH;
  const f = (v: number) => v.toFixed(4);
  
  // Build fractional cubic curves (outline only — first M...Z)
  interface FracCurve { cp1x: number; cp1y: number; cp2x: number; cp2y: number; ex: number; ey: number }
  const curves: FracCurve[] = [];
  let startX = 0, startY = 0;
  let pathIdx = 0;
  
  for (const cmd of cmds) {
    if (cmd.type === 'M' || cmd.type === 'm') {
      const p = cmd.absPoints[0];
      startX = fx(p[0]); startY = fy(p[1]);
      pathIdx++;
      if (pathIdx > 1) break; // only first path
    } else if ((cmd.type === 'C' || cmd.type === 'c') && pathIdx === 1) {
      for (const pts of cmd.absPoints) {
        curves.push({
          cp1x: fx(pts[0]), cp1y: fy(pts[1]),
          cp2x: fx(pts[2]), cp2y: fy(pts[3]),
          ex: fx(pts[4]), ey: fy(pts[5])
        });
      }
    }
  }
  
  console.log(`Traced: ${curves.length} cubic curves, start=(${f(startX)}, ${f(startY)})`);
  console.log(`Bbox: ${bW.toFixed(1)}x${bH.toFixed(1)}px, aspect ${(bW/bH).toFixed(3)}`);
  
  // Find the bottom-most point (tip) and top-most point
  let topIdx = -1, botIdx = -1, topY = 1, botY = 0;
  const endpoints = [{x: startX, y: startY}];
  for (const c of curves) {
    endpoints.push({x: c.ex, y: c.ey});
  }
  for (let j = 0; j < endpoints.length; j++) {
    if (endpoints[j].y < topY) { topY = endpoints[j].y; topIdx = j; }
    if (endpoints[j].y > botY) { botY = endpoints[j].y; botIdx = j; }
  }
  console.log(`Top point idx=${topIdx} at (${f(endpoints[topIdx].x)}, ${f(endpoints[topIdx].y)})`);
  console.log(`Bottom point idx=${botIdx} at (${f(endpoints[botIdx].x)}, ${f(endpoints[botIdx].y)})`);
  
  // Find center X of shape
  const centerX = (fx(bMinX) + fx(bMaxX)) / 2; // should be 0.5
  console.log(`Center X: ${f(centerX)}`);
  
  // Output the original traced outline as-is
  console.log('\n// ===== ORIGINAL POTRACE OUTLINE (for reference) =====');
  console.log(`  [1, ${f(startX)}, ${f(startY)}],`);
  for (const c of curves) {
    console.log(`  [3, ${f(c.cp1x)}, ${f(c.cp1y)}, ${f(c.cp2x)}, ${f(c.cp2y)}, ${f(c.ex)}, ${f(c.ey)}],`);
  }
  console.log('  [0],');
  
  // Now symmetrize: 
  // Split at the topmost and bottommost points
  // Use LEFT half (curves from top going left/down to bottom), mirror for right half
  
  // Reorder curves so they start at the top point
  // Currently starts at startX,startY. We need to rotate to start at topIdx.
  // topIdx is the endpoint index — curve[topIdx-1] ends at the top point
  // So reorder: curves[topIdx-1..end] + curves[0..topIdx-2]
  
  const reordered: FracCurve[] = [];
  for (let j = topIdx - 1; j < curves.length; j++) reordered.push(curves[j]);
  for (let j = 0; j < topIdx - 1; j++) reordered.push(curves[j]);
  
  // The reordered path starts at the top point (endpoints[topIdx])
  // Left side goes down to the bottom point
  // Find bottom in reordered endpoints
  const reEp = [endpoints[topIdx]];
  for (const c of reordered) reEp.push({x: c.ex, y: c.ey});
  
  let reBotIdx = 0;
  let reBotY = 0;
  for (let j = 0; j < reEp.length; j++) {
    if (reEp[j].y > reBotY) { reBotY = reEp[j].y; reBotIdx = j; }
  }
  
  console.log(`\nReordered: top at idx 0 = (${f(reEp[0].x)}, ${f(reEp[0].y)})`);
  console.log(`Bottom at reIdx ${reBotIdx} = (${f(reEp[reBotIdx].x)}, ${f(reEp[reBotIdx].y)})`);
  
  // Left half = curves 0..reBotIdx-1 (from top, going LEFT and down to bottom)
  const leftHalf = reordered.slice(0, reBotIdx);
  // Right half = curves reBotIdx..end (from bottom, going up RIGHT to top)
  
  console.log(`Left half: ${leftHalf.length} curves, Right half: ${reordered.length - reBotIdx} curves`);
  
  // Mirror function
  const mx = (x: number) => 1 - x;
  
  // Build symmetric outline:
  // Start at (0.5, topY)
  // Left half as-is (but shift start to x=0.5)
  // At bottom, use (0.5, botY)
  // Right half = mirror+reverse of left half
  
  const topPt = reEp[0];
  const botPt = reEp[reBotIdx];
  
  console.log('\n// ===== SYMMETRIZED OUTLINE =====');
  console.log('const MAN_BAT_OUTLINE: FracCmd[] = [');
  console.log(`  [1, 0.5000, ${f(topPt.y)}],`);
  
  // Left half — use original curves but adjust first curve's start and last curve's end
  for (let j = 0; j < leftHalf.length; j++) {
    const c = leftHalf[j];
    console.log(`  [3, ${f(c.cp1x)}, ${f(c.cp1y)}, ${f(c.cp2x)}, ${f(c.cp2y)}, ${j === leftHalf.length-1 ? '0.5000' : f(c.ex)}, ${j === leftHalf.length-1 ? f(botPt.y) : f(c.ey)}],`);
  }
  
  // Right half — mirror and reverse left half
  for (let j = leftHalf.length - 1; j >= 0; j--) {
    const c = leftHalf[j];
    const prevPt = j > 0 ? {x: leftHalf[j-1].ex, y: leftHalf[j-1].ey} : topPt;
    const destX = j === 0 ? 0.5 : mx(prevPt.x);
    const destY = j === 0 ? topPt.y : prevPt.y;
    console.log(`  [3, ${f(mx(c.cp2x))}, ${f(c.cp2y)}, ${f(mx(c.cp1x))}, ${f(c.cp1y)}, ${f(destX)}, ${f(destY)}],`);
  }
  
  console.log('  [0],');
  console.log('];');
  
  // Hole position
  const { data, info } = await sharp(imgPath).grayscale().raw().toBuffer({ resolveWithObject: true });
  const w2 = info.width, h2 = info.height;
  const binary: boolean[][] = [];
  for (let y = 0; y < h2; y++) {
    binary[y] = [];
    for (let x = 0; x < w2; x++) binary[y][x] = data[y * w2 + x] < 100;
  }
  const visited: boolean[][] = Array.from({length: h2}, () => Array(w2).fill(false));
  const holes: Array<{cx: number; cy: number; area: number}> = [];
  for (let y = Math.round(bMinY); y <= Math.round(bMaxY); y++) {
    for (let x = Math.round(bMinX); x <= Math.round(bMaxX); x++) {
      if (x >= 0 && x < w2 && y >= 0 && y < h2 && !binary[y][x] && !visited[y][x]) {
        const stack = [{x, y}];
        const region: Array<{x: number; y: number}> = [];
        let edge = false;
        while (stack.length) {
          const p = stack.pop()!;
          if (p.x < 0 || p.x >= w2 || p.y < 0 || p.y >= h2) { edge = true; continue; }
          if (visited[p.y][p.x] || binary[p.y][p.x]) continue;
          visited[p.y][p.x] = true;
          region.push(p);
          stack.push({x:p.x+1,y:p.y},{x:p.x-1,y:p.y},{x:p.x,y:p.y+1},{x:p.x,y:p.y-1});
        }
        if (!edge && region.length > 50) {
          let sx = 0, sy = 0;
          for (const p of region) { sx += p.x; sy += p.y; }
          holes.push({cx: sx/region.length, cy: sy/region.length, area: region.length});
        }
      }
    }
  }
  if (holes.length) {
    const h = holes.reduce((a,b) => a.area > b.area ? a : b);
    console.log(`\nconst MAN_BAT_HOLE = { relX: 0.5000, relY: ${f(fy(h.cy))} };`);
  }
}

main().catch(console.error);
