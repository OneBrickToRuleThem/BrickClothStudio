function f(v) { return parseFloat(v.toFixed(4)); }

function mirrorAndReverseLeftHalf(leftCmds) {
  const result = [];
  for (let i = leftCmds.length - 1; i >= 1; i--) {
    const c = leftCmds[i];
    const prev = leftCmds[i - 1];
    const prevX = prev[0] === 3 ? prev[5] : prev[1];
    const prevY = prev[0] === 3 ? prev[6] : prev[2];
    if (c[0] === 3) {
      result.push([3, f(1 - c[3]), c[4], f(1 - c[1]), c[2], f(1 - prevX), prevY]);
    } else if (c[0] === 2) {
      result.push([2, f(1 - prevX), prevY]);
    }
  }
  return result;
}

// === NARROW ===
// The left half goes from bottom to top (first ~7 commands based on analyzing the shape)
// Narrow outline: starts at (0.3302, 0.9923), endpoint X values:
// 0.3302 -> 0.0184 -> 0.0068 -> 0.0815 -> 0.3122 -> 0.3583 -> 0.4759 (left going up)
// 0.6493 -> 0.7316 -> 0.9368 -> 0.9786 -> 0.7173 -> 0.3302 (right going down)
// The top-center transition is around index 6-7 where X jumps from 0.4759 to 0.6493

const narrowLeft = [
  [1, 0.3302, 0.9923],
  [3, 0.1861, 0.9847, 0.0482, 0.9708, 0.0184, 0.9609],
  [3, 0.0012, 0.9551, 0, 0.9437, 0.0068, 0.8464],
  [3, 0.0147, 0.7327, 0.0385, 0.6116, 0.0815, 0.4668],
  [3, 0.1306, 0.3013, 0.2455, 0.0863, 0.3122, 0.0352],
  [3, 0.3232, 0.0267, 0.344, 0.0159, 0.3583, 0.0112],
  [3, 0.3822, 0.0033, 0.392, 0.0024, 0.4759, 0.0014],
];

const narrowRight = mirrorAndReverseLeftHalf(narrowLeft);
const narrowSym = [...narrowLeft, ...narrowRight, [0]];

console.log('// === NARROW SYMMETRIZED ===');
console.log('const SINGLE_HOLE_NARROW_OUTLINE: FracCmd[] = [');
for (const c of narrowSym) { console.log('  [' + c.map(v => f(v)).join(', ') + '],'); }
console.log('];');

// Narrow hole center: average of subpath points
// From raw data: starts (0.5379, 0.1786), shape is ~centered
// Avg X ≈ 0.49, Avg Y ≈ 0.14
console.log('// Hole: relX=0.5, relY=0.14');

// === TOP ===
// Top outline left half — from bottom-left up to top-center
const topLeft = [
  [1, 0.424, 0.9926],
  [3, 0.2824, 0.9838, 0.0272, 0.9211, 0.0083, 0.9106],
  [3, 0.0034, 0.9079, 0, 0.9071, 0, 0.9088],
  [2, 0, 0.887],
  [3, 0, 0.7612, 0.3339, 0.345, 0.3344, 0.2156],
  [3, 0.3397, 0.1284, 0.3147, 0.089, 0.3992, 0.0267],
  [3, 0.4205, 0.0125, 0.4499, 0.0038, 0.482, 0.0019],
];

const topRight = mirrorAndReverseLeftHalf(topLeft);
const topSym = [...topLeft, ...topRight, [0]];

console.log('\n// === TOP SYMMETRIZED ===');
console.log('const SINGLE_HOLE_TOP_OUTLINE: FracCmd[] = [');
for (const c of topSym) { console.log('  [' + c.map(v => f(v)).join(', ') + '],'); }
console.log('];');

// Top hole: from parsed data, center ≈ (0.4811, 0.1424)
// Symmetrized to (0.5, 0.1424)  
console.log('// Hole: relX=0.5, relY=0.1424');

// === STEPPED ===
// Stepped left half
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

const steppedRight = mirrorAndReverseLeftHalf(steppedLeft);
const steppedSym = [...steppedLeft, ...steppedRight, [0]];

console.log('\n// === STEPPED SYMMETRIZED ===');
console.log('const SINGLE_HOLE_STEPPED_OUTLINE: FracCmd[] = [');
for (const c of steppedSym) { console.log('  [' + c.map(v => f(v)).join(', ') + '],'); }
console.log('];');

// Stepped hole: center ≈ (0.508, 0.1618)
// Symmetrized to (0.5, 0.1618)
console.log('// Hole: relX=0.5, relY=0.1618');
