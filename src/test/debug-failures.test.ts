import { describe, it } from 'vitest';
import { generatePattern } from '../services/patternGenerator';

function samplePath(pathData: string): {x:number,y:number}[] {
  const points: {x:number,y:number}[] = [];
  const cmds = pathData.match(/[MLCQAZHVSTZ]|-?\d+\.?\d*/gi) || [];
  let ci = 0, cmd = '', curX = 0, curY = 0, startX = 0, startY = 0;
  while (ci < cmds.length) {
    const token = cmds[ci];
    if (/^[A-Za-z]$/.test(token)) {
      cmd = token.toUpperCase(); ci++;
      if (cmd === 'Z') {
        const dx = startX - curX, dy = startY - curY;
        const len = Math.sqrt(dx*dx+dy*dy);
        if (len > 0.001) { const steps = Math.max(1, Math.ceil(len / 0.5)); for (let s = 1; s <= steps; s++) { const t = s/steps; points.push({x:curX+dx*t,y:curY+dy*t}); } }
        curX = startX; curY = startY; continue;
      }
    } else {
      switch (cmd) {
        case 'M': curX=parseFloat(cmds[ci]);curY=parseFloat(cmds[ci+1]);startX=curX;startY=curY;points.push({x:curX,y:curY});ci+=2;break;
        case 'L': { const ex=parseFloat(cmds[ci]),ey=parseFloat(cmds[ci+1]); const dx=ex-curX,dy=ey-curY,len=Math.sqrt(dx*dx+dy*dy),steps=Math.max(1,Math.ceil(len/0.5)); for(let s=1;s<=steps;s++){const t=s/steps;points.push({x:curX+dx*t,y:curY+dy*t});} curX=ex;curY=ey;ci+=2;break; }
        case 'C': { const c1x=parseFloat(cmds[ci]),c1y=parseFloat(cmds[ci+1]),c2x=parseFloat(cmds[ci+2]),c2y=parseFloat(cmds[ci+3]),ex=parseFloat(cmds[ci+4]),ey=parseFloat(cmds[ci+5]); for(let s=1;s<=8;s++){const t=s/8,u=1-t;points.push({x:u*u*u*curX+3*u*u*t*c1x+3*u*t*t*c2x+t*t*t*ex,y:u*u*u*curY+3*u*u*t*c1y+3*u*t*t*c2y+t*t*t*ey});} curX=ex;curY=ey;ci+=6;break; }
        case 'Q': { const cx=parseFloat(cmds[ci]),cy=parseFloat(cmds[ci+1]),ex=parseFloat(cmds[ci+2]),ey=parseFloat(cmds[ci+3]); for(let s=1;s<=8;s++){const t=s/8,u=1-t;points.push({x:u*u*curX+2*u*t*cx+t*t*ex,y:u*u*curY+2*u*t*cy+t*t*ey});} curX=ex;curY=ey;ci+=4;break; }
        case 'A': curX=parseFloat(cmds[ci+5]);curY=parseFloat(cmds[ci+6]);points.push({x:curX,y:curY});ci+=7;break;
        default: ci++; break;
      }
    }
  }
  return points;
}

describe('debug failures', () => {
  it('cape/standard baseline', () => {
    const pattern = generatePattern('cape', 'standard', {
      width: 40, length: 39, holeRadius: 2.5, clearance: 0.2, slitWidth: 1.2,
      enableSlit: false, seed: 12345, tatteredSymmetric: true, holeCount: 2,
    });
    const allPoints = samplePath(pattern.cutPaths[0]);
    const center = 40 / 2;
    const violations: {pt:{x:number,y:number}, mirrorX:number, bestDist:number}[] = [];
    for (const pt of allPoints) {
      const mirrorX = 2 * center - pt.x;
      let bestDist = Infinity;
      for (const o of allPoints) {
        const d = Math.max(Math.abs(o.x - mirrorX), Math.abs(o.y - pt.y));
        if (d < bestDist) bestDist = d;
      }
      if (bestDist > 0.1) violations.push({pt, mirrorX, bestDist});
    }
    const unique = new Map<string, typeof violations[0]>();
    for (const v of violations) unique.set(`${v.pt.x.toFixed(2)},${v.pt.y.toFixed(2)}`, v);
    console.log(`Total unique violations: ${unique.size}`);
    for (const [, v] of [...unique.entries()].slice(0, 15)) {
      console.log(`  (${v.pt.x.toFixed(4)}, ${v.pt.y.toFixed(4)}) mirror=(${v.mirrorX.toFixed(4)}, ${v.pt.y.toFixed(4)}) bestDist=${v.bestDist.toFixed(4)}`);
    }
  });

  it('cape/top-single-hole baseline', () => {
    const pattern = generatePattern('cape', 'top-single-hole', {
      width: 37, length: 37, holeRadius: 2.5, clearance: 0.2, slitWidth: 1.2,
      enableSlit: false, seed: 12345, tatteredSymmetric: true, holeCount: 2,
    });
    const allPoints = samplePath(pattern.cutPaths[0]);
    const center = 37 / 2;
    const violations: {pt:{x:number,y:number}, mirrorX:number, bestDist:number}[] = [];
    for (const pt of allPoints) {
      const mirrorX = 2 * center - pt.x;
      let bestDist = Infinity;
      for (const o of allPoints) {
        const d = Math.max(Math.abs(o.x - mirrorX), Math.abs(o.y - pt.y));
        if (d < bestDist) bestDist = d;
      }
      if (bestDist > 0.1) violations.push({pt, mirrorX, bestDist});
    }
    const unique = new Map<string, typeof violations[0]>();
    for (const v of violations) unique.set(`${v.pt.x.toFixed(2)},${v.pt.y.toFixed(2)}`, v);
    console.log(`Total unique violations: ${unique.size}`);
    for (const [, v] of [...unique.entries()].slice(0, 15)) {
      console.log(`  (${v.pt.x.toFixed(4)}, ${v.pt.y.toFixed(4)}) mirror=(${v.mirrorX.toFixed(4)}, ${v.pt.y.toFixed(4)}) bestDist=${v.bestDist.toFixed(4)}`);
    }
  });

  it('mantle/standard + cloud edge', () => {
    const pattern = generatePattern('mantle', 'standard', {
      width: 23, length: 26, holeRadius: 2.5, clearance: 0.2, slitWidth: 1.2,
      enableSlit: false, seed: 12345, tatteredSymmetric: true, holeCount: 2,
      mantleEdgeStyle: 'cloud', mantleEdgeDepth: 2, mantleEdgeCount: 6,
    });
    const allPoints: {x:number,y:number}[] = [];
    for (const p of pattern.cutPaths) allPoints.push(...samplePath(p));
    const center = 23 / 2;
    const violations: {pt:{x:number,y:number}, mirrorX:number, bestDist:number}[] = [];
    for (const pt of allPoints) {
      const mirrorX = 2 * center - pt.x;
      let bestDist = Infinity;
      for (const o of allPoints) {
        const d = Math.max(Math.abs(o.x - mirrorX), Math.abs(o.y - pt.y));
        if (d < bestDist) bestDist = d;
      }
      if (bestDist > 0.1) violations.push({pt, mirrorX, bestDist});
    }
    const unique = new Map<string, typeof violations[0]>();
    for (const v of violations) unique.set(`${v.pt.x.toFixed(2)},${v.pt.y.toFixed(2)}`, v);
    console.log(`Total unique violations: ${unique.size}`);
    for (const [, v] of [...unique.entries()].slice(0, 15)) {
      console.log(`  (${v.pt.x.toFixed(4)}, ${v.pt.y.toFixed(4)}) mirror=(${v.mirrorX.toFixed(4)}, ${v.pt.y.toFixed(4)}) bestDist=${v.bestDist.toFixed(4)}`);
    }
  });
});
