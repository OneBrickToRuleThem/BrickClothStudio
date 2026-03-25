// Symmetrize outlines: for each point X, compute average with 1-X on the mirrored side
// The outline goes: start at bottom-center-left, up the right side, across the top,
// down the left side, back to start. The hole is a separate subpath.

// For Narrow and Top outlines (17 commands for outer shape, index 0-16):
// Commands 0..15 are the outer, 16 is close
// Let's trace the shape by looking at the FracCmd arrays:

// NARROW/TOP outline (same shape):
// [1, 0.424, 0.9926],    // M: start bottom-left area
// ...curves going right (bottom hem)...
// [3,..., 0.424, 0.9926], // back to start
// [0],                    // close

// Looking at X values: starts at 0.424 (left of center), 
// idx 4: goes to right at 0.3344 then 0.2156 (further left/up the left side)
// idx 5-9: goes to top center (~0.48-0.65)
// idx 10-11: goes far right (0.98)
// idx 12-15: goes back to left bottom

// So the path goes: bottom-left → left side up → top → right side down → bottom-right → bottom-left

// For symmetry: the top point should be at X=0.5
// The path traced: left side points need to mirror right side

// Actually, these are free-form organic shapes. The best approach is:
// 1. Find the axis of symmetry (the vertical center line)
// 2. For each command, if X < 0.5, mirror to get the right side version and average

// Let me take a different approach: manually read the shape and create a properly symmetric version
// by taking the left half and mirroring it

function symmetrize(cmds) {
  // First subpath is the outline, separated by [0]
  const closeIdx = cmds.findIndex(c => c[0] === 0);
  const outline = cmds.slice(0, closeIdx);
  const hole = closeIdx + 1 < cmds.length ? cmds.slice(closeIdx + 1) : [];
  
  // Find the topmost point (smallest Y endpoint)
  let topIdx = 0, topY = Infinity;
  for (let i = 0; i < outline.length; i++) {
    const c = outline[i];
    const y = c[0] === 3 ? c[6] : c[2];
    if (y !== undefined && y < topY) { topY = y; topIdx = i; }
  }
  
  // Find the bottommost point 
  let botIdx = 0, botY = -Infinity;
  for (let i = 0; i < outline.length; i++) {
    const c = outline[i];
    const y = c[0] === 3 ? c[6] : c[2];
    if (y !== undefined && y > botY) { botY = y; botIdx = i; }
  }
  
  console.log(`Top at idx ${topIdx} y=${topY}, Bottom at idx ${botIdx} y=${botY}`);
  
  // For each point, average X with (1 - X) to enforce X symmetry
  // But we need to identify which commands are on left vs right side
  // A simpler approach: just force X symmetry by averaging x with 1-x
  const sym = outline.map(c => {
    const out = [...c];
    // For cubic: indices 1,3,5 are X values, 2,4,6 are Y values
    // For move/line: index 1 is X, 2 is Y
    if (c[0] === 3) {
      // Average each X with its mirror
      for (const xi of [1, 3, 5]) {
        const x = out[xi];
        const mx = 1 - x;
        out[xi] = parseFloat(((x + mx) / 2).toFixed(4)); // This just gives 0.5 for every point!
      }
    }
    return out;
  });
  // That won't work - averaging X with 1-X just gives 0.5
  
  // Better approach: the outline is traced as one continuous path.
  // We need to identify PAIRS of corresponding points on left and right sides.
  // The shape starts near bottom, goes up one side, crosses the top, comes down the other side.
  // 
  // Strategy:
  //   1. Split the path into "left-side traveling" and "right-side traveling" halves
  //   2. The left half (going up from bottom to top)
  //   3. The right half (going down from top to bottom)
  //   4. Mirror the left half to get the right half
  
  return null;
}

// Let me just manually create symmetrized versions by examining the data

// For NARROW and TOP, the outline is identical. Let me trace the shape path:
// Start: (0.424, 0.993) - bottom center-left
// C1: → (0.008, 0.911) - far left, going up along bottom-left hem
// C2: → (0, 0.907) - bottom-left corner transition  
// C3: → (0, 0.909) - left edge
// L1: → (0, 0.887) - left edge vertical
// C5: → (0.334, 0.216) - left side sweeping up to center-top
// C6: → (0.399, 0.027) - continuing up to neck area
// C7: → (0.482, 0.002) - top center-left (near neck)
// C8: → (0.564, 0.018) - top center-right (crossing center)
// C9: → (0.646, 0.110) - right neck area going down
// C10: → (0.648, 0.225) - right side continuing down
// C11: → (0.983, 0.868) - right side sweeping down to bottom-right
// C12: → (0.986, 0.877) - bottom-right corner
// C13: → (0.992, 0.892) - right edge
// C14: → (0.969, 0.912) - bottom-right hem
// C15: → (0.536, 0.996) - back to bottom center-right
// C16: → (0.424, 0.993) - close at bottom center-left

// So the axis of symmetry should be at X ≈ 0.5
// Left side: commands 0-6 (going from bottom-left up to top-center)
// Right side: commands 7-15 (going from top-center down to bottom-right, back to start)

// To symmetrize: take the left side, mirror X coords (1-x) for the right side
// Left side points (endpoints): 0.424, 0.008, 0, 0, 0, 0.334, 0.399, 0.482
// Mirrored:                     0.576, 0.992, 1, 1, 1, 0.666, 0.601, 0.518
// Actual right endpoints:       0.564, 0.646, 0.648, 0.983, 0.986, 0.992, 0.969, 0.536

// These don't match perfectly — the shape is asymmetric by design (it's from a hand-drawn SVG)

// Let me just mirror the left half precisely and output:
const NARROW_TOP_LEFT = [
  // outline only (no hole), going from bottom-center up the left side to the top
  [1, 0.424, 0.9926],
  [3, 0.2824, 0.9838, 0.0272, 0.9211, 0.0083, 0.9106],
  [3, 0.0034, 0.9079, 0, 0.9071, 0, 0.9088],
  [2, 0, 0.887],
  [3, 0, 0.7612, 0.3339, 0.345, 0.3344, 0.2156],
  [3, 0.3397, 0.1284, 0.3147, 0.089, 0.3992, 0.0267],
  [3, 0.4205, 0.0125, 0.4499, 0.0038, 0.482, 0.0019],
];

// Right half should be mirror: for each point with X coord x, use 1-x
// Also reverse the order and flip control points
const NARROW_TOP_RIGHT_MIRRORED = [
  // mirror of left, reversed for clockwise direction (top → bottom)
  [3, 1-0.4499, 0.0038, 1-0.4205, 0.0125, 1-0.3992, 0.0267],
  [3, 1-0.3147, 0.089, 1-0.3397, 0.1284, 1-0.3344, 0.2156],
  [3, 1-0.3339, 0.345, 1-0, 0.7612, 1-0, 0.887],
  [2, 1-0, 0.9088],
  [3, 1-0, 0.9071, 1-0.0034, 0.9079, 1-0.0083, 0.9106],
  [3, 1-0.0272, 0.9211, 1-0.2824, 0.9838, 1-0.424, 0.9926],
];

function f(v) { return parseFloat(v.toFixed(4)); }

function mirrorCmd(cmd) {
  if (cmd[0] === 0) return cmd;
  if (cmd[0] === 1) return [1, f(1 - cmd[1]), cmd[2]];
  if (cmd[0] === 2) return [2, f(1 - cmd[1]), cmd[2]];
  if (cmd[0] === 3) return [3, f(1 - cmd[1]), cmd[2], f(1 - cmd[3]), cmd[4], f(1 - cmd[5]), cmd[6]];
  return cmd;
}

function reverseAndMirrorPath(leftCmds) {
  // Left cmds go from bottom to top. We need right side: top to bottom (reversed order)
  // For cubics, when reversing, swap control point order:
  // Original: C(cp1x,cp1y, cp2x,cp2y, endx,endy) from prevPoint
  // Reversed: C(mirror(cp2x),cp2y, mirror(cp1x),cp1y, mirror(prevEnd_x),prevEnd_y)
  
  const result = [];
  // leftCmds[0] is MoveTo (the start), skip it
  // Process curves in reverse order
  for (let i = leftCmds.length - 1; i >= 1; i--) {
    const c = leftCmds[i];
    // Previous endpoint (the start of this curve)
    const prev = leftCmds[i - 1];
    const prevX = prev[0] === 3 ? prev[5] : prev[1];
    const prevY = prev[0] === 3 ? prev[6] : prev[2];
    
    if (c[0] === 3) {
      // Cubic: reverse control points and mirror X
      result.push([3, 
        f(1 - c[3]), c[4],    // cp1 = mirrored cp2
        f(1 - c[1]), c[2],    // cp2 = mirrored cp1  
        f(1 - prevX), prevY   // endpoint = mirrored prev endpoint
      ]);
    } else if (c[0] === 2) {
      // Line: mirror the prev endpoint
      result.push([2, f(1 - prevX), prevY]);
    }
  }
  return result;
}

// Build symmetrized NARROW/TOP outline
const leftHalf = [
  [1, 0.424, 0.9926],
  [3, 0.2824, 0.9838, 0.0272, 0.9211, 0.0083, 0.9106],
  [3, 0.0034, 0.9079, 0, 0.9071, 0, 0.9088],
  [2, 0, 0.887],
  [3, 0, 0.7612, 0.3339, 0.345, 0.3344, 0.2156],
  [3, 0.3397, 0.1284, 0.3147, 0.089, 0.3992, 0.0267],
  [3, 0.4205, 0.0125, 0.4499, 0.0038, 0.482, 0.0019],
];

console.log('=== Symmetrized NARROW/TOP outline ===');
const rightHalf = reverseAndMirrorPath(leftHalf);
const symOutline = [
  ...leftHalf,
  // Connect top center: the endpoint of leftHalf is (0.482, 0.0019)
  // Mirror: (0.518, 0.0019) — this should already be the starting point of right half
  ...rightHalf,
  [0], // close
];

console.log('const OUTLINE: FracCmd[] = [');
for (const c of symOutline) {
  console.log('  [' + c.map(v => f(v)).join(', ') + '],');
}
console.log('];');

// Now do the STEPPED outline separately
console.log('\n=== STEPPED outline left half ===');
const steppedLeft = [
  [1, 0.4079, 0.9887],
  [3, 0.372, 0.9864, 0.2658, 0.974, 0.1191, 0.905],
  [3, 0.1017, 0.8968, 0.076, 0.881, 0.0546, 0.8653],
  [3, 0.0317, 0.8484, 0.002, 0.8182, 0, 0.8096],
  [3, 0.0038, 0.7868, 0.0173, 0.7677, 0.027, 0.7474],
  [3, 0.1419, 0.5026, 0.2066, 0.4251, 0.2746, 0.2835],
  [3, 0.2765, 0.2787, 0.2847, 0.2656, 0.2928, 0.2544],
  [3, 0.3039, 0.239, 0.3092, 0.2336, 0.3144, 0.2325],
  [3, 0.3182, 0.2317, 0.3242, 0.2304, 0.3278, 0.2297],
  [3, 0.3313, 0.2289, 0.3402, 0.223, 0.3475, 0.2164],
  [3, 0.3673, 0.1988, 0.3723, 0.1857, 0.3752, 0.1447],
  [3, 0.3775, 0.1118, 0.3787, 0.1071, 0.3927, 0.0744],
  [3, 0.4033, 0.05, 0.4206, 0.0348, 0.44, 0.021],
  [3, 0.4609, 0.0054, 0.4695, 0.0026, 0.499, 0.0014],
];

const steppedRight = reverseAndMirrorPath(steppedLeft);
const steppedSym = [
  ...steppedLeft,
  ...steppedRight,
  [0],
];
console.log('const STEPPED_OUTLINE: FracCmd[] = [');
for (const c of steppedSym) {
  console.log('  [' + c.map(v => f(v)).join(', ') + '],');
}
console.log('];');

// Holes (symmetrized)
console.log('\n=== HOLE POSITIONS ===');
// Narrow: hole at ~(0.4905, 0.1361) - already near center, this is the single center hole 
// Actually from the parsed data, the hole subpath center:
// Narrow hole subpath: starts at (0.5253, 0.1949), the hole circle center roughly at
// average of endpoints in the hole subpath
const narrowHolePoints = [
  [0.5253, 0.1949], [0.5538, 0.1158], [0.5185, 0.0771],
  [0.4626, 0.0759], [0.4272, 0.1146], [0.4245, 0.1489],
  [0.4289, 0.1627], [0.4642, 0.1972], [0.5253, 0.1949]
];

let sumX = 0, sumY = 0;
for (const p of narrowHolePoints) { sumX += p[0]; sumY += p[1]; }
const hcx = sumX / narrowHolePoints.length;
const hcy = sumY / narrowHolePoints.length;
console.log(`Narrow/Top hole center: (${f(hcx)}, ${f(hcy)})`);
// Symmetrize: X should be 0.5
console.log(`Symmetrized: (0.5, ${f(hcy)})`);

// Stepped hole subpath
const steppedHolePoints = [
  [0.5276, 0.218], [0.5625, 0.1792], [0.5599, 0.124],
  [0.5086, 0.0872], [0.4804, 0.0929], [0.4526, 0.1235],
  [0.4586, 0.1941], [0.4942, 0.2194], [0.5276, 0.218]
];
sumX = 0; sumY = 0;
for (const p of steppedHolePoints) { sumX += p[0]; sumY += p[1]; }
console.log(`Stepped hole center: (${f(sumX/steppedHolePoints.length)}, ${f(sumY/steppedHolePoints.length)})`);
console.log(`Symmetrized: (0.5, ${f(sumY/steppedHolePoints.length)})`);
