// Parse SmallFlag.svg and LargeFlag.svg to extract normalized path data
import { readFileSync } from 'fs';

function parsePathD(d) {
  // Tokenize path d string
  const tokens = d.match(/[a-zA-Z]|[+-]?\d*\.?\d+(?:[eE][+-]?\d+)?/g);
  if (!tokens) return [];
  
  const commands = [];
  let i = 0;
  while (i < tokens.length) {
    const cmd = tokens[i];
    if (/[a-zA-Z]/.test(cmd)) {
      i++;
      const args = [];
      while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
        args.push(parseFloat(tokens[i]));
        i++;
      }
      commands.push({ cmd, args });
    } else {
      i++;
    }
  }
  return commands;
}

function toAbsolute(commands) {
  let cx = 0, cy = 0;
  let sx = 0, sy = 0; // start of current subpath
  const result = [];
  
  for (const { cmd, args } of commands) {
    const isRel = cmd === cmd.toLowerCase();
    const CMD = cmd.toUpperCase();
    
    if (CMD === 'M') {
      for (let i = 0; i < args.length; i += 2) {
        const x = isRel ? cx + args[i] : args[i];
        const y = isRel ? cy + args[i+1] : args[i+1];
        if (i === 0) {
          result.push({ cmd: 'M', args: [x, y] });
          sx = x; sy = y;
        } else {
          result.push({ cmd: 'L', args: [x, y] });
        }
        cx = x; cy = y;
      }
    } else if (CMD === 'L') {
      for (let i = 0; i < args.length; i += 2) {
        const x = isRel ? cx + args[i] : args[i];
        const y = isRel ? cy + args[i+1] : args[i+1];
        result.push({ cmd: 'L', args: [x, y] });
        cx = x; cy = y;
      }
    } else if (CMD === 'H') {
      for (let i = 0; i < args.length; i++) {
        const x = isRel ? cx + args[i] : args[i];
        result.push({ cmd: 'L', args: [x, cy] });
        cx = x;
      }
    } else if (CMD === 'V') {
      for (let i = 0; i < args.length; i++) {
        const y = isRel ? cy + args[i] : args[i];
        result.push({ cmd: 'L', args: [cx, y] });
        cy = y;
      }
    } else if (CMD === 'C') {
      for (let i = 0; i < args.length; i += 6) {
        const x1 = isRel ? cx + args[i] : args[i];
        const y1 = isRel ? cy + args[i+1] : args[i+1];
        const x2 = isRel ? cx + args[i+2] : args[i+2];
        const y2 = isRel ? cy + args[i+3] : args[i+3];
        const x = isRel ? cx + args[i+4] : args[i+4];
        const y = isRel ? cy + args[i+5] : args[i+5];
        result.push({ cmd: 'C', args: [x1, y1, x2, y2, x, y] });
        cx = x; cy = y;
      }
    } else if (CMD === 'Z') {
      result.push({ cmd: 'Z', args: [] });
      cx = sx; cy = sy;
    }
  }
  return result;
}

function getBounds(absCmds) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const { cmd, args } of absCmds) {
    for (let i = 0; i < args.length; i += 2) {
      const x = args[i], y = args[i+1];
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function splitSubpaths(absCmds) {
  const subpaths = [];
  let current = [];
  for (const c of absCmds) {
    if (c.cmd === 'M' && current.length > 0) {
      subpaths.push(current);
      current = [];
    }
    current.push(c);
  }
  if (current.length > 0) subpaths.push(current);
  return subpaths;
}

function analyzeFile(filename) {
  const svg = readFileSync(filename, 'utf8');
  // Find the main path d attribute (the one with actual shape data, not clip path)
  const pathMatches = [...svg.matchAll(/<path[^>]*\bd="([^"]+)"[^>]*>/gs)];
  
  console.log(`\n=== ${filename} ===`);
  console.log(`Found ${pathMatches.length} paths`);
  
  for (let pi = 0; pi < pathMatches.length; pi++) {
    const d = pathMatches[pi][1];
    if (d.length < 50) continue; // skip tiny clip paths
    
    const parsed = parsePathD(d);
    const abs = toAbsolute(parsed);
    const bounds = getBounds(abs);
    const subpaths = splitSubpaths(abs);
    
    console.log(`\nPath ${pi}: ${d.length} chars, ${abs.length} commands`);
    console.log(`  Bounds: x=[${bounds.minX.toFixed(3)}, ${bounds.maxX.toFixed(3)}] y=[${bounds.minY.toFixed(3)}, ${bounds.maxY.toFixed(3)}]`);
    console.log(`  Size: ${bounds.width.toFixed(3)} x ${bounds.height.toFixed(3)}`);
    console.log(`  Subpaths: ${subpaths.length}`);
    
    for (let si = 0; si < subpaths.length; si++) {
      const sp = subpaths[si];
      const spBounds = getBounds(sp);
      console.log(`  Subpath ${si}: ${sp.length} cmds, bounds x=[${spBounds.minX.toFixed(3)}, ${spBounds.maxX.toFixed(3)}] y=[${spBounds.minY.toFixed(3)}, ${spBounds.maxY.toFixed(3)}]`);
      console.log(`    Size: ${spBounds.width.toFixed(3)} x ${spBounds.height.toFixed(3)}`);
      // Print first and last command
      console.log(`    Start: ${sp[0].cmd} ${sp[0].args.map(a=>a.toFixed(3)).join(',')}`);
      if (sp.length > 1) {
        const last = sp[sp.length-1];
        console.log(`    End: ${last.cmd} ${last.args.map(a=>a.toFixed(3)).join(',')}`);
      }
    }
  }
}

analyzeFile('SmallFlag.svg');
analyzeFile('LargeFlag.svg');

// Now export the normalized data we need
console.log('\n\n=== EXPORT DATA ===\n');

function exportPathData(filename) {
  const svg = readFileSync(filename, 'utf8');
  const pathMatches = [...svg.matchAll(/<path[^>]*\bd="([^"]+)"[^>]*>/gs)];
  
  for (let pi = 0; pi < pathMatches.length; pi++) {
    const d = pathMatches[pi][1];
    if (d.length < 50) continue;
    
    const parsed = parsePathD(d);
    const abs = toAbsolute(parsed);
    const subpaths = splitSubpaths(abs);
    
    console.log(`\n--- ${filename} ---`);
    for (let si = 0; si < subpaths.length; si++) {
      const sp = subpaths[si];
      const spBounds = getBounds(sp);
      if (spBounds.width < 1 && spBounds.height < 1) continue; // skip tiny detail paths
      
      console.log(`\nSubpath ${si} (${sp.length} cmds):`);
      for (const c of sp) {
        if (c.cmd === 'M') console.log(`  moveTo(${c.args[0].toFixed(6)}, ${c.args[1].toFixed(6)})`);
        else if (c.cmd === 'L') console.log(`  lineTo(${c.args[0].toFixed(6)}, ${c.args[1].toFixed(6)})`);
        else if (c.cmd === 'C') {
          if (c.args.length !== 6 || c.args.some(a => a === undefined)) {
            console.log(`  ERROR: bad cubic args (${c.args.length}): ${JSON.stringify(c.args)}`);
          } else {
            console.log(`  cubicBezierTo(${c.args.map(a=>a.toFixed(6)).join(', ')})`);
          }
        }
        else if (c.cmd === 'Z') console.log(`  closePath()`);
        else console.log(`  UNHANDLED: ${c.cmd} args=${JSON.stringify(c.args)}`);
      }
    }
  }
}

exportPathData('SmallFlag_Correct.svg');
exportPathData('LargeFlag.svg');
