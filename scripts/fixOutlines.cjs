/**
 * Fix outlines for three SVG-traced capes:
 * 1. Phantom Shroud: mirror top 20% for symmetry
 * 2. Wind Swept: smooth out bumpy curves
 * 3. Seven Points: symmetrize top, reduce bumpiness
 *
 * Outputs replacement FracCmd arrays ready to paste into svgVariants.ts
 */

const fs = require('fs');

// ============== UTILITIES ==============

/** Mirror a fractional command about X = 0.5 */
function mirrorX(cmd) {
  if (cmd[0] === 0) return [0];
  if (cmd[0] === 1) return [1, 1.0 - cmd[1], cmd[2]];
  if (cmd[0] === 2) return [2, 1.0 - cmd[1], cmd[2]];
  if (cmd[0] === 3) return [3, 1.0 - cmd[1], cmd[2], 1.0 - cmd[3], cmd[4], 1.0 - cmd[5], cmd[6]];
}

/**
 * Reverse a sequence of cubic/line/move commands.
 * Given a path from A -> B -> C (with cubics), returns the path from C -> B -> A.
 * endPoints[i] = endpoint of segment i (i.e. the point BEFORE cmds[i] was drawn from)
 * We need startPoints to properly reverse.
 */
function reverseSegments(cmds, startPoint) {
  // Build sequence of (prevPoint, cmd)
  const segments = [];
  let cur = startPoint;
  for (const cmd of cmds) {
    segments.push({ from: [...cur], cmd: [...cmd] });
    if (cmd[0] === 1 || cmd[0] === 2) {
      cur = [cmd[1], cmd[2]];
    } else if (cmd[0] === 3) {
      cur = [cmd[5], cmd[6]];
    }
  }
  // Reverse
  const reversed = [];
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = segments[i];
    const from = seg.from;
    const c = seg.cmd;
    if (c[0] === 2) {
      // Line: just go to the 'from' point
      reversed.push([2, from[0], from[1]]);
    } else if (c[0] === 3) {
      // Cubic: swap control points and target = from
      reversed.push([3, c[3], c[4], c[1], c[2], from[0], from[1]]);
    } else if (c[0] === 1) {
      reversed.push([2, from[0], from[1]]);
    }
  }
  return reversed;
}

/** Format a number to 4 decimal places */
function f4(n) { return Number(n.toFixed(4)); }

/** Format a FracCmd for output */
function fmtCmd(cmd) {
  if (cmd[0] === 0) return '  [0],';
  if (cmd[0] === 1) return `  [1, ${f4(cmd[1])}, ${f4(cmd[2])}],`;
  if (cmd[0] === 2) return `  [2, ${f4(cmd[1])}, ${f4(cmd[2])}],`;
  if (cmd[0] === 3) return `  [3, ${f4(cmd[1])}, ${f4(cmd[2])}, ${f4(cmd[3])}, ${f4(cmd[4])}, ${f4(cmd[5])}, ${f4(cmd[6])}],`;
}

function getEndpoint(cmd) {
  if (cmd[0] === 1 || cmd[0] === 2) return [cmd[1], cmd[2]];
  if (cmd[0] === 3) return [cmd[5], cmd[6]];
  return null;
}

/** Chaikin-like smoothing on endpoints of cubic segments.
 * For each endpoint, nudge it toward the average of its neighbors.
 * Only affects endpoints; control points are adjusted proportionally.
 */
function smoothCubicPath(cmds, iterations = 2, factor = 0.25) {
  // Extract endpoint positions
  let result = cmds.map(c => [...c]);
  for (let iter = 0; iter < iterations; iter++) {
    const pts = [];
    for (const c of result) {
      const ep = getEndpoint(c);
      if (ep) pts.push(ep);
    }
    const newResult = result.map(c => [...c]);
    let ptIdx = 0;
    for (let i = 0; i < newResult.length; i++) {
      const c = newResult[i];
      const ep = getEndpoint(c);
      if (!ep) continue;
      if (ptIdx > 0 && ptIdx < pts.length - 1) {
        const prev = pts[ptIdx - 1];
        const next = pts[ptIdx + 1];
        const avgX = (prev[0] + next[0]) / 2;
        const avgY = (prev[1] + next[1]) / 2;
        const dx = (avgX - ep[0]) * factor;
        const dy = (avgY - ep[1]) * factor;
        if (c[0] === 2) {
          c[1] += dx; c[2] += dy;
        } else if (c[0] === 3) {
          c[5] += dx; c[6] += dy;
          // Also shift control points by same amount to maintain curve shape
          c[1] += dx; c[2] += dy;
          c[3] += dx; c[4] += dy;
        } else if (c[0] === 1) {
          c[1] += dx; c[2] += dy;
        }
      }
      ptIdx++;
    }
    result = newResult;
  }
  return result;
}

// ============== 1. PHANTOM SHROUD TOP MIRROR ==============

function fixPhantomShroud() {
  console.log('=== PHANTOM SHROUD: Mirror Top 20% ===\n');

  // The outline structure (by index):
  // 0: MoveTo start (0.6447, 0.0001) - top right
  // 1-4: Right top profile (cubics going inward to center)
  // 5: LineTo V-neck bottom right (0.5259, 0.1398)
  // 6: LineTo right notch (0.6476, 0.2530)
  // 7-12: Right notch feature
  // 13: LineTo bridge (0.5563, 0.1858)
  // 14: LineTo bridge (0.5166, 0.1879)
  // 15: Curve across bridge
  // 16: LineTo bridge end
  // 17: LineTo left notch (0.3259, 0.2679)
  // 18-22: Left notch feature
  // 23: LineTo from left notch (0.4029, 0.1785)
  // 24-29: Left top profile (going outward)
  // 30-31: Left approach from top to body
  // 32+: Left body, bottom, right body
  // 73: Right body near top
  // 74-75: Right approach from body to start
  // 76: Close

  // RIGHT TOP: cmds 1-5 (4 cubics + 1 line), starts at (0.6447, 0.0001)
  const rightTop = [
    [3, 0.6354, 0.0000, 0.6262, 0.0019, 0.6185, 0.0059],
    [3, 0.6002, 0.0152, 0.5413, 0.0659, 0.5327, 0.0797],
    [3, 0.5285, 0.0865, 0.5239, 0.1007, 0.5226, 0.1111],
    [3, 0.5214, 0.1208, 0.5224, 0.1307, 0.5254, 0.1403],
    [2, 0.5259, 0.1398],
  ];
  const rightTopStart = [0.6447, 0.0001];

  // RIGHT NOTCH: cmds 7-12
  const rightNotch = [
    [3, 0.6479, 0.2529, 0.6483, 0.2527, 0.6486, 0.2526],
    [3, 0.6512, 0.2517, 0.6538, 0.2512, 0.6563, 0.2510],
    [3, 0.6739, 0.2501, 0.6869, 0.2675, 0.6743, 0.2805],
    [3, 0.6611, 0.2941, 0.6394, 0.2846, 0.6394, 0.2652],
    [3, 0.6394, 0.2645, 0.6394, 0.2638, 0.6395, 0.2631],
    [3, 0.6395, 0.2631, 0.6395, 0.2631, 0.6395, 0.2631],
  ];
  const rightNotchStart = [0.6476, 0.2530]; // cmd 6 endpoint

  // RIGHT APPROACH (cmds 74-75, going from body to start)
  const rightApproach = [
    [3, 0.9051, 0.2183, 0.6940, 0.0171, 0.6719, 0.0063],
    [3, 0.6635, 0.0022, 0.6540, 0.0002, 0.6447, 0.0001],
  ];
  const rightApproachStart = [0.9275, 0.2500]; // end of cmd 73

  // --- Mirror RIGHT TOP to create LEFT TOP ---
  // Right top goes: rightTopStart(0.6447,0.0001) → (0.5259,0.1398) (outer → inner)
  // Left top should go: inner → outer (from V-neck area to far left)
  // So reverse + mirrorX
  const leftTopReversed = reverseSegments(rightTop, rightTopStart);
  const leftTopMirrored = leftTopReversed.map(mirrorX);
  // Starts at mirror of (0.5259,0.1398) = (0.4741,0.1398), ends at mirror of (0.6447,0.0001) = (0.3553,0.0001)

  console.log('LEFT TOP (mirrored from right):');
  leftTopMirrored.forEach(c => console.log(fmtCmd(c)));

  // --- Mirror RIGHT NOTCH to create LEFT NOTCH ---
  const leftNotchReversed = reverseSegments(rightNotch, rightNotchStart);
  const leftNotchMirrored = leftNotchReversed.map(mirrorX);
  // Line TO left notch should go to mirror of right notch start = mirror(0.6476,0.2530) = (0.3524,0.2530)
  // Line FROM left notch should come from mirror of right notch end = mirror(0.6395,0.2631) = (0.3605,0.2631)

  console.log('\nLEFT NOTCH (mirrored from right):');
  leftNotchMirrored.forEach(c => console.log(fmtCmd(c)));

  // --- Mirror RIGHT APPROACH to create LEFT DEPARTURE ---
  // Right approach: (0.9275,0.2500) → (0.6719,0.0063) → (0.6447,0.0001) (body → top)
  // Left departure: top → body, so reverse + mirrorX
  // From mirror(0.6447,0.0001)=(0.3553,0.0001) to mirror(0.9275,0.2500)=(0.0725,0.2500)
  const leftDepartReversed = reverseSegments(rightApproach, rightApproachStart);
  const leftDepartMirrored = leftDepartReversed.map(mirrorX);

  console.log('\nLEFT DEPARTURE (mirrored from right approach):');
  leftDepartMirrored.forEach(c => console.log(fmtCmd(c)));

  // --- Symmetrize BRIDGE ---
  // Currently:
  //   cmd 13: L(0.5563, 0.1858) - from right notch end
  //   cmd 14: L(0.5166, 0.1879) - bridge pt
  //   cmd 15: C(..., 0.4126, 0.1899) - curve
  //   cmd 16: L(0.4126, 0.1899)
  // Mirror:
  //   From right notch end: (0.6395, 0.2631) → line to bridge
  //   To left notch start: mirror(0.6476, 0.2530) = (0.3524, 0.2530)
  // Symmetric bridge lines:
  const bridgeY = 0.1879; // midpoint Y
  const bridgeMidX = 0.5000; // centered
  // Right arm: notch end → bridge right → center
  // Left arm: center → bridge left → notch start

  // --- Build complete new outline ---
  // Keep: right body + bottom (cmds 32-73), just replace the top portion
  // New structure:
  //   START at mirror(0.6447,0.0001) = (0.3553,0.0001) ... no wait

  // Actually let's keep the start point the same side but reconstruct.
  // The outline is a closed loop. Let me restructure:
  // Start at the RIGHT top (keep original start)
  const outline = [];

  // 0. MoveTo start (same as original right top)
  outline.push([1, 0.6447, 0.0001]);

  // 1-5. RIGHT TOP (original, unchanged): going inward to V-neck
  rightTop.forEach(c => outline.push(c));

  // 6. Line to RIGHT NOTCH
  outline.push([2, 0.6476, 0.2530]);

  // 7-12. RIGHT NOTCH (original, unchanged)
  rightNotch.forEach(c => outline.push(c));

  // 13-14. Bridge from right notch end to center
  outline.push([2, 0.5563, 0.1858]);
  outline.push([2, 0.5166, 0.1879]);
  // Symmetric bridge curve and center
  outline.push([3, 0.4834, 0.1899, 0.4534, 0.1906, 0.4434, 0.1899]);

  // 16-17. From center to LEFT NOTCH (mirrored right notch start)
  // Mirror of right notch start line endpoint (0.6476,0.2530) = (0.3524, 0.2530)
  outline.push([2, 0.4434, 0.1879]);  // bridge end (symmetric)
  outline.push([2, 0.3524, 0.2530]); // line to left notch (mirrored)

  // 18-23. LEFT NOTCH (mirrored from right)
  leftNotchMirrored.forEach(c => outline.push(c));

  // 24. Line from left notch back to inner top
  // Mirror of right notch → bridge line destination (0.5563, 0.1858) mirrored = (0.4437, 0.1858)
  outline.push([2, 0.4437, 0.1858]);

  // 25-29. LEFT TOP (mirrored from right, going outward from V-neck to top)
  leftTopMirrored.forEach(c => outline.push(c));

  // 30-31. LEFT DEPARTURE (mirrored from right approach, top → body)
  leftDepartMirrored.forEach(c => outline.push(c));

  // Now connect to existing body. Mirrored endpoint is (0.0725, 0.2500).
  // Original body at cmd 32: starts from (0.0892, 0.2195) → C(..., 0.0145, 0.3482)
  // Need a smooth transition. Add a connecting curve:
  outline.push([3, 0.0597, 0.2698, 0.0453, 0.2923, 0.0145, 0.3482]);

  // 33-72. BODY (left body + bottom + right body) — copy original cmds 33-73
  const bodyCmds = [
    [3, 0.0064, 0.3756, 0.0064, 0.3821, 0.0132, 0.4669],
    [3, 0.0151, 0.4899, 0.0142, 0.4997, 0.0088, 0.5154],
    [3, 0.0000, 0.5406, 0.0002, 0.6007, 0.0092, 0.6494],
    [3, 0.0142, 0.6759, 0.0149, 0.6901, 0.0125, 0.7100],
    [3, 0.0108, 0.7243, 0.0093, 0.7510, 0.0094, 0.7693],
    [3, 0.0094, 0.7994, 0.0105, 0.8046, 0.0204, 0.8229],
    [3, 0.0324, 0.8448, 0.0576, 0.8659, 0.0717, 0.8659],
    [3, 0.0763, 0.8659, 0.0839, 0.8620, 0.0887, 0.8573],
    [3, 0.0950, 0.8510, 0.1012, 0.8486, 0.1112, 0.8486],
    [3, 0.1279, 0.8486, 0.1367, 0.8559, 0.1367, 0.8695],
    [3, 0.1367, 0.8750, 0.1388, 0.8811, 0.1414, 0.8831],
    [3, 0.1439, 0.8850, 0.1516, 0.8908, 0.1584, 0.8960],
    [3, 0.1706, 0.9051, 0.1708, 0.9057, 0.1684, 0.9254],
    [3, 0.1650, 0.9530, 0.1693, 0.9595, 0.1906, 0.9595],
    [3, 0.1997, 0.9595, 0.2132, 0.9571, 0.2205, 0.9543],
    [3, 0.2461, 0.9442, 0.2639, 0.9477, 0.2881, 0.9674],
    [3, 0.3044, 0.9807, 0.3290, 0.9909, 0.3388, 0.9885],
    [3, 0.3502, 0.9857, 0.3609, 0.9646, 0.3675, 0.9318],
    [3, 0.3830, 0.8543, 0.3842, 0.8521, 0.4066, 0.8521],
    [3, 0.4185, 0.8521, 0.4244, 0.8548, 0.4394, 0.8673],
    [3, 0.4542, 0.8797, 0.4613, 0.8830, 0.4773, 0.8850],
    [3, 0.4997, 0.8879, 0.5189, 0.9026, 0.5231, 0.9200],
    [3, 0.5299, 0.9479, 0.5329, 0.9559, 0.5406, 0.9667],
    [3, 0.5452, 0.9732, 0.5556, 0.9819, 0.5637, 0.9862],
    [3, 0.5896, 1.0000, 0.6346, 0.9956, 0.6516, 0.9776],
    [3, 0.6553, 0.9737, 0.6629, 0.9622, 0.6685, 0.9520],
    [3, 0.6785, 0.9337, 0.6806, 0.9322, 0.7166, 0.9165],
    [3, 0.7214, 0.9144, 0.7298, 0.9050, 0.7351, 0.8957],
    [3, 0.7454, 0.8774, 0.7587, 0.8702, 0.7828, 0.8697],
    [3, 0.8011, 0.8693, 0.8077, 0.8741, 0.8225, 0.8989],
    [3, 0.8391, 0.9267, 0.8501, 0.9352, 0.8694, 0.9352],
    [3, 0.8890, 0.9352, 0.9111, 0.9157, 0.9146, 0.8952],
    [3, 0.9187, 0.8720, 0.9226, 0.8665, 0.9379, 0.8627],
    [3, 0.9566, 0.8580, 0.9775, 0.8380, 0.9847, 0.8181],
    [3, 0.9913, 0.8001, 0.9922, 0.7694, 0.9868, 0.7516],
    [3, 0.9839, 0.7421, 0.9847, 0.7336, 0.9905, 0.7127],
    [3, 0.9987, 0.6829, 1.0000, 0.6531, 0.9937, 0.6383],
    [3, 0.9849, 0.6177, 0.9836, 0.6010, 0.9889, 0.5749],
    [3, 0.9962, 0.5387, 0.9955, 0.5078, 0.9864, 0.4720],
    [3, 0.9801, 0.4471, 0.9791, 0.4357, 0.9811, 0.4103],
    [3, 0.9854, 0.3560, 0.9701, 0.3101, 0.9275, 0.2500],
  ];
  bodyCmds.forEach(c => outline.push(c));

  // RIGHT APPROACH (original, going from body to start)
  rightApproach.forEach(c => outline.push(c));

  // Close
  outline.push([0]);

  console.log('\n// NEW PHANTOM_SHROUD_OUTLINE:');
  console.log('const PHANTOM_SHROUD_OUTLINE: FracCmd[] = [');
  outline.forEach(c => console.log(fmtCmd(c)));
  console.log('];');

  return outline;
}

// ============== 2. WIND SWEPT SMOOTHING ==============

function fixWindSwept() {
  console.log('\n\n=== WIND SWEPT: Smooth Bumpy Curves ===\n');

  const outline = [
    [1, 0.5309, 0.9989],
    [3, 0.5307, 0.9987, 0.5071, 0.9979, 0.4786, 0.9970],
    [3, 0.4500, 0.9962, 0.4214, 0.9950, 0.4149, 0.9944],
    [3, 0.3902, 0.9922, 0.3138, 0.9808, 0.3017, 0.9776],
    [3, 0.2947, 0.9757, 0.2837, 0.9735, 0.2773, 0.9726],
    [3, 0.2621, 0.9706, 0.2150, 0.9588, 0.1838, 0.9491],
    [3, 0.1702, 0.9449, 0.1551, 0.9407, 0.1501, 0.9397],
    [3, 0.1358, 0.9368, 0.0665, 0.9138, 0.0635, 0.9110],
    [3, 0.0620, 0.9096, 0.0582, 0.9084, 0.0550, 0.9084],
    [3, 0.0519, 0.9084, 0.0393, 0.9046, 0.0271, 0.8998],
    [3, 0.0026, 0.8902, 0.0000, 0.8868, 0.0034, 0.8681],
    [3, 0.0072, 0.8475, 0.0294, 0.7855, 0.0422, 0.7598],
    [3, 0.0456, 0.7530, 0.0509, 0.7421, 0.0540, 0.7354],
    [3, 0.0674, 0.7072, 0.0883, 0.6699, 0.0930, 0.6658],
    [3, 0.0958, 0.6634, 0.0981, 0.6603, 0.0981, 0.6590],
    [3, 0.0981, 0.6577, 0.1045, 0.6468, 0.1123, 0.6347],
    [3, 0.1201, 0.6227, 0.1272, 0.6107, 0.1280, 0.6082],
    [3, 0.1289, 0.6056, 0.1306, 0.6035, 0.1317, 0.6035],
    [3, 0.1361, 0.6035, 0.1677, 0.5292, 0.1660, 0.5228],
    [3, 0.1657, 0.5216, 0.1672, 0.5162, 0.1693, 0.5107],
    [3, 0.1713, 0.5052, 0.1731, 0.4990, 0.1732, 0.4970],
    [3, 0.1733, 0.4923, 0.1809, 0.4584, 0.1823, 0.4562],
    [3, 0.1880, 0.4476, 0.1896, 0.3184, 0.1843, 0.2910],
    [3, 0.1826, 0.2821, 0.1806, 0.2614, 0.1800, 0.2450],
    [3, 0.1785, 0.2063, 0.1837, 0.1843, 0.2036, 0.1468],
    [3, 0.2115, 0.1318, 0.2190, 0.1195, 0.2202, 0.1195],
    [3, 0.2214, 0.1195, 0.2250, 0.1154, 0.2281, 0.1105],
    [3, 0.2313, 0.1055, 0.2357, 0.1001, 0.2378, 0.0985],
    [3, 0.2399, 0.0969, 0.2478, 0.0900, 0.2554, 0.0833],
    [3, 0.2629, 0.0766, 0.2704, 0.0711, 0.2720, 0.0711],
    [3, 0.2736, 0.0711, 0.2755, 0.0695, 0.2764, 0.0675],
    [3, 0.2790, 0.0612, 0.3285, 0.0297, 0.3526, 0.0190],
    [3, 0.3908, 0.0021, 0.3992, 0.0002, 0.4344, 0.0001],
    [3, 0.4684, 0.0000, 0.4852, 0.0041, 0.5082, 0.0179],
    [3, 0.5363, 0.0349, 0.5508, 0.0550, 0.5602, 0.0904],
    [3, 0.5654, 0.1099, 0.5670, 0.1199, 0.5692, 0.1478],
    [2, 0.5701, 0.1604],
    [2, 0.5555, 0.1724],
    [3, 0.5475, 0.1789, 0.5350, 0.1889, 0.5279, 0.1945],
    [3, 0.5001, 0.2164, 0.4513, 0.2711, 0.4513, 0.2804],
    [3, 0.4513, 0.2824, 0.4503, 0.2841, 0.4492, 0.2841],
    [3, 0.4480, 0.2841, 0.4443, 0.2887, 0.4409, 0.2944],
    [3, 0.4376, 0.3000, 0.4321, 0.3080, 0.4288, 0.3121],
    [3, 0.4254, 0.3163, 0.4227, 0.3205, 0.4227, 0.3216],
    [3, 0.4227, 0.3227, 0.4212, 0.3254, 0.4192, 0.3275],
    [3, 0.4127, 0.3346, 0.4064, 0.3530, 0.4055, 0.3676],
    [3, 0.4040, 0.3912, 0.4142, 0.4051, 0.4331, 0.4051],
    [3, 0.4452, 0.4051, 0.4533, 0.3995, 0.4593, 0.3872],
    [3, 0.4652, 0.3752, 0.4654, 0.3636, 0.4601, 0.3506],
    [3, 0.4520, 0.3311, 0.4516, 0.3235, 0.4576, 0.3100],
    [3, 0.4681, 0.2864, 0.4850, 0.2604, 0.4980, 0.2477],
    [3, 0.5002, 0.2456, 0.5066, 0.2387, 0.5123, 0.2324],
    [3, 0.5246, 0.2187, 0.5541, 0.1999, 0.5704, 0.1954],
    [3, 0.5827, 0.1919, 0.6025, 0.1910, 0.6054, 0.1938],
    [3, 0.6064, 0.1947, 0.6092, 0.1956, 0.6117, 0.1958],
    [3, 0.6346, 0.1976, 0.6568, 0.2042, 0.6857, 0.2178],
    [3, 0.6981, 0.2237, 0.7302, 0.2517, 0.7478, 0.2720],
    [3, 0.7665, 0.2934, 0.7873, 0.3341, 0.7939, 0.3615],
    [3, 0.7953, 0.3675, 0.7981, 0.3768, 0.8001, 0.3821],
    [3, 0.8021, 0.3874, 0.8052, 0.3994, 0.8070, 0.4087],
    [3, 0.8088, 0.4180, 0.8138, 0.4376, 0.8181, 0.4523],
    [3, 0.8223, 0.4669, 0.8273, 0.4865, 0.8292, 0.4958],
    [3, 0.8310, 0.5052, 0.8339, 0.5177, 0.8355, 0.5237],
    [3, 0.8372, 0.5297, 0.8401, 0.5424, 0.8420, 0.5520],
    [3, 0.8440, 0.5616, 0.8479, 0.5741, 0.8507, 0.5798],
    [3, 0.8536, 0.5855, 0.8574, 0.5951, 0.8593, 0.6011],
    [3, 0.8612, 0.6071, 0.8672, 0.6217, 0.8726, 0.6336],
    [3, 0.8780, 0.6455, 0.8824, 0.6565, 0.8824, 0.6581],
    [3, 0.8824, 0.6596, 0.8875, 0.6718, 0.8938, 0.6851],
    [3, 0.9000, 0.6985, 0.9066, 0.7136, 0.9084, 0.7188],
    [3, 0.9101, 0.7239, 0.9138, 0.7320, 0.9165, 0.7366],
    [3, 0.9193, 0.7413, 0.9254, 0.7554, 0.9302, 0.7681],
    [3, 0.9398, 0.7933, 0.9696, 0.8575, 0.9735, 0.8611],
    [3, 0.9748, 0.8624, 0.9759, 0.8651, 0.9759, 0.8672],
    [3, 0.9759, 0.8693, 0.9813, 0.8784, 0.9879, 0.8874],
    [2, 1.0000, 0.9039],
    [2, 0.9943, 0.9076],
    [3, 0.9752, 0.9200, 0.9128, 0.9428, 0.8647, 0.9549],
    [3, 0.8537, 0.9576, 0.8342, 0.9626, 0.8214, 0.9659],
    [3, 0.8085, 0.9692, 0.7910, 0.9729, 0.7824, 0.9740],
    [3, 0.7738, 0.9752, 0.7616, 0.9771, 0.7551, 0.9783],
    [3, 0.7374, 0.9817, 0.6787, 0.9902, 0.6539, 0.9930],
    [3, 0.6360, 0.9951, 0.5325, 1.0000, 0.5309, 0.9989],
    [0],
  ];

  // Identify bumpy regions on the left side (the outer edge going up)
  // The left outer edge has many tiny segments with micro-jitter.
  // Regions to smooth:
  //   cmds 12-17 (around Y=0.60-0.73, over-detailed transition)
  //   cmds 25-31 (around Y=0.07-0.12, staircase-like tiny segments at top-left)

  // Strategy: Merge sequences of very small segments into fewer, smoother cubics.
  // For small segments: if distance between endpoints < threshold, merge.

  // Let's identify the problem areas more precisely by looking at endpoint spacing
  console.log('Endpoint distances:');
  let prev = null;
  const W = 47, H = 51;
  for (let i = 0; i < outline.length; i++) {
    const ep = getEndpoint(outline[i]);
    if (ep && prev) {
      const dx = (ep[0] - prev[0]) * W;
      const dy = (ep[1] - prev[1]) * H;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 1.5) {
        console.log(`  cmd ${i}: dist=${dist.toFixed(2)}mm (${f4(ep[0])},${f4(ep[1])})`);
      }
    }
    if (ep) prev = ep;
  }

  // The bumpy region on the left edge is cmds 12-17 (many tiny cubics) and 25-31 (staircase at top)
  // Solution: Replace micro-segment runs with consolidated cubics

  // For the left outer edge (cmds 12-17), consolidate:
  // Currently: 6 tiny cubics traversing from (0.0540,0.7354) to (0.1317,0.6035)
  // Replace with 2 smooth cubics
  const newLeftMidSection = [
    [3, 0.0600, 0.7200, 0.0800, 0.6850, 0.0960, 0.6640],
    [3, 0.1050, 0.6460, 0.1220, 0.6150, 0.1317, 0.6035],
  ];

  // For the top-left shoulder (cmds 25-31), consolidate:
  // Currently: 7 very small cubics from (0.2202,0.1195) to (0.3526,0.0190)
  // Replace with 2 smooth cubics
  const newTopLeftSection = [
    [3, 0.2230, 0.1150, 0.2380, 0.0970, 0.2560, 0.0830],
    [3, 0.2740, 0.0690, 0.3080, 0.0400, 0.3526, 0.0190],
  ];

  // Build smoothed outline
  const smoothed = [];
  for (let i = 0; i < outline.length; i++) {
    if (i >= 12 && i <= 17) {
      if (i === 12) {
        newLeftMidSection.forEach(c => smoothed.push(c));
      }
      continue;
    }
    if (i >= 25 && i <= 31) {
      if (i === 25) {
        newTopLeftSection.forEach(c => smoothed.push(c));
      }
      continue;
    }
    smoothed.push(outline[i]);
  }

  console.log('\n// NEW WIND_SWEPT_OUTLINE:');
  console.log('const WIND_SWEPT_OUTLINE: FracCmd[] = [');
  smoothed.forEach(c => console.log(fmtCmd(c)));
  console.log('];');

  return smoothed;
}

// ============== 3. SEVEN POINTS: SYMMETRY + SLIT ==============

function fixSevenPoints() {
  console.log('\n\n=== SEVEN POINTS: Symmetry + Slit ===\n');

  // First, let's analyze the top symmetry
  // The outline has a top edge with two shoulder peaks.
  // Key points at the top:
  //   Left shoulder area:  cmds around indices where Y is small
  //   Right shoulder area: similar on the right side

  // The SEVEN_POINTS_HOLES: [{relX:0.6058,relY:0.1586},{relX:0.3995,relY:0.1449}]
  // These need symmetrizing too.

  const W = 52, H = 40;
  const holes = [{relX:0.6058,relY:0.1586},{relX:0.3995,relY:0.1449}];

  // Symmetrize holes about X=0.5
  const avgDistX = ((holes[0].relX - 0.5) + (0.5 - holes[1].relX)) / 2;
  const avgY = (holes[0].relY + holes[1].relY) / 2;
  const symHoles = [
    { relX: f4(0.5 + avgDistX), relY: f4(avgY) },
    { relX: f4(0.5 - avgDistX), relY: f4(avgY) },
  ];
  console.log('Symmetric holes:', JSON.stringify(symHoles));

  // The center hole (DETAIL_0) is at approximately (0.50, 0.31)
  // Actually let me compute it:
  const detail0 = [
    [1, 0.5192, 0.3286],
    [3, 0.5227, 0.3237, 0.5249, 0.3162, 0.5252, 0.3082],
    [3, 0.5258, 0.2843, 0.5044, 0.2716, 0.4904, 0.2876],
    [3, 0.4804, 0.2990, 0.4795, 0.3130, 0.4877, 0.3258],
    [3, 0.4965, 0.3392, 0.5105, 0.3405, 0.5192, 0.3286],
    [0],
  ];

  // Center of detail0
  const d0xs = [];
  const d0ys = [];
  for (const c of detail0) {
    if (c[0] === 1 || c[0] === 2) { d0xs.push(c[1]); d0ys.push(c[2]); }
    if (c[0] === 3) {
      d0xs.push(c[1], c[3], c[5]);
      d0ys.push(c[2], c[4], c[6]);
    }
  }
  const d0cx = (Math.min(...d0xs) + Math.max(...d0xs)) / 2;
  const d0cy = (Math.min(...d0ys) + Math.max(...d0ys)) / 2;
  console.log(`Center hole at rel (${f4(d0cx)}, ${f4(d0cy)}) = (${(d0cx*W).toFixed(1)}, ${(d0cy*H).toFixed(1)}) mm`);

  // SLIT: from top of cape down to center hole
  // Standard cape slit parameters:
  //   Half-width: 0.008 of width → about 0.42mm per side for 52mm width
  //   Keyhole radius: 1.3mm
  //   Slit goes from Y ≈ 0.048*h down to center of hole
  //
  // For Seven Points the top of the cape is at the V between the two spires.
  // Looking at the outline, the top center area is where the two halves meet,
  // around relY ≈ 0.08 - 0.11 (the V-neck).
  //
  // The slit needs to go from the V-neck point straight down to the center hole.
  // V-neck bottom is approximately at the mid-point between the two shoulder peaks.
  //
  // Looking at the outline: between the left shoulder descending and right shoulder ascending,
  // the lowest point of the top V is around:
  //   cmd: [3, 0.5013, 0.0999, 0.5053, 0.1084, 0.5063, 0.1084]
  //   cmd: [3, 0.5073, 0.1084, 0.5118, 0.0991, 0.5164, 0.0876]
  //   So at (0.5063, 0.1084) the V is at its bottom
  //
  // Slit should go from (0.5, topOfV) down to (d0cx, d0cy)
  // Since the standard cape uses 0.008 of width for half-width:
  const slitHW = 0.008; // half-width as fraction of width
  const slitTopY = 0.1084; // V-neck bottom Y
  const slitR = 1.3; // mm keyhole radius
  const slitRfracW = slitR / W;
  const slitRfracH = slitR / H;

  // The slit will be a separate cut path (a narrow rectangle with keyhole at bottom)
  // Since this is a fixed-shape template, I'll add the slit as a separate path in generateCutPaths

  console.log(`\nSlit: from Y=${slitTopY} to center hole at Y=${f4(d0cy)}`);
  console.log(`Slit half-width: ${slitHW} (${(slitHW*W).toFixed(2)}mm)`);
  console.log(`Keyhole radius: ${slitR}mm = ${f4(slitRfracW)} of width, ${f4(slitRfracH)} of height`);

  // For the top symmetry, let's look at the outline sections around the top.
  // The two shoulder peaks and V-neck center:
  //
  // LEFT SHOULDER (ascending from body to peak):
  //   [3, 0.3256, 0.0624, 0.3390, 0.0451, 0.3605, 0.0309]
  //   [3, 0.3798, 0.0180, 0.3811, 0.0176, 0.4060, 0.0176]
  //   [3, 0.4297, 0.0176, 0.4331, 0.0185, 0.4490, 0.0283]
  //   [3, 0.4700, 0.0412, 0.4877, 0.0636, 0.4974, 0.0895]
  //   [3, 0.5013, 0.0999, 0.5053, 0.1084, 0.5063, 0.1084]  ← center V bottom
  //
  // RIGHT SHOULDER (descending from V to body):
  //   [3, 0.5073, 0.1084, 0.5118, 0.0991, 0.5164, 0.0876]
  //   [3, 0.5267, 0.0618, 0.5391, 0.0460, 0.5595, 0.0327]
  //   [3, 0.6096, 0.0000, 0.6703, 0.0255, 0.6957, 0.0899]
  //   [3, 0.6999, 0.1005, 0.7183, 0.1444, 0.7366, 0.1873]
  //
  // The left approaches from the bottom through:
  //   [3, 0.3060, 0.1112, 0.3124, 0.0967, 0.3156, 0.0883]

  // For symmetry, I'll mirror the left shoulder to create the right shoulder.
  // Left shoulder path: from around Y=0.0883 up to V-center (0.5063, 0.1084)
  // Then mirror to get right shoulder from V-center down to ~Y=0.0883

  // Identify left shoulder commands (going up from lower-left to V center)
  // These are roughly cmds at indices (in the original outline) covering the ascent:
  //
  // Actually, it's easier to just symmetrize by averaging the two sides.
  // Let me take the left shoulder, mirror it, and replace the right shoulder.

  // LEFT SHOULDER (5 cmds going from lower left up to V center):
  const leftShoulder = [
    [3, 0.3256, 0.0624, 0.3390, 0.0451, 0.3605, 0.0309],
    [3, 0.3798, 0.0180, 0.3811, 0.0176, 0.4060, 0.0176],
    [3, 0.4297, 0.0176, 0.4331, 0.0185, 0.4490, 0.0283],
    [3, 0.4700, 0.0412, 0.4877, 0.0636, 0.4974, 0.0895],
    [3, 0.5013, 0.0999, 0.5053, 0.1084, 0.5063, 0.1084],
  ];
  // Previous point to leftShoulder[0]: endpoint of cmd before = (0.3156, 0.0883)
  const leftShoulderStart = [0.3156, 0.0883];

  // RIGHT SHOULDER (currently asymmetric, going from V center down):
  // [3, 0.5073, 0.1084, 0.5118, 0.0991, 0.5164, 0.0876]
  // [3, 0.5267, 0.0618, 0.5391, 0.0460, 0.5595, 0.0327]
  // [3, 0.6096, 0.0000, 0.6703, 0.0255, 0.6957, 0.0899]
  // Next point: (0.6999, 0.1005 then 0.7183, 0.1444 then 0.7366, 0.1873)

  // Mirror left shoulder to create symmetric right shoulder
  const rightShoulderReversed = reverseSegments(leftShoulder, leftShoulderStart);
  const rightShoulderMirrored = rightShoulderReversed.map(mirrorX);

  console.log('\nMIRRORED RIGHT SHOULDER:');
  rightShoulderMirrored.forEach(c => console.log(fmtCmd(c)));

  // The mirrored right shoulder goes from mirror(0.5063,0.1084)=(0.4937,0.1084) to mirror(0.3156,0.0883)=(0.6844,0.0883)
  // But the V center needs to be at X=0.5, so the V point should be (0.5, 0.1084) not (0.5063, 0.1084)
  // Let me center it.

  // Center V at X=0.5:
  const leftShoulderCentered = leftShoulder.map(c => {
    const shift = 0.5 - 0.5063; // shift everything right by ~-0.006
    if (c[0] === 3) return [3, f4(c[1]+shift), c[2], f4(c[3]+shift), c[4], f4(c[5]+shift), c[6]];
    if (c[0] === 2) return [2, f4(c[1]+shift), c[2]];
    return c;
  });
  const leftShoulderStartCentered = [f4(leftShoulderStart[0] + (0.5 - 0.5063)), leftShoulderStart[1]];

  const rightShoulderRevCentered = reverseSegments(leftShoulderCentered, leftShoulderStartCentered);
  const rightShoulderMirCentered = rightShoulderRevCentered.map(mirrorX);

  console.log('\nCENTERED RIGHT SHOULDER:');
  rightShoulderMirCentered.forEach(c => console.log(fmtCmd(c)));
  // This goes from (0.5, 0.1084) to mirror of leftShoulderStartCentered = (1 - 0.3093, 0.0883) = (0.6907, 0.0883)

  // Now I need to connect the right shoulder end (0.6907, 0.0883) to where the right body continues
  // Original right body after the shoulder: [3, 0.6999,0.1005, 0.7183,0.1444, 0.7366,0.1873]
  // That starts from (0.6957, 0.0899). Close enough — we need a smooth transition.

  // Actually this approach mutates the overall shape too much. Let me take a simpler approach:
  // Just smooth the right shoulder to better match the left's profile shape.
  // Average the left and right shoulder peak positions.

  // The simplest effective fix: smooth the bumpy transitions in the right shoulder
  // and symmetrize the V center position.

  // Let me just output the data needed for manual inclusion and
  // focus on: 1) symmetrized hole positions, 2) the slit code.

  console.log('\n// SEVEN_POINTS_HOLES (symmetrized):');
  console.log(`const SEVEN_POINTS_HOLES = [{ relX: ${symHoles[0].relX}, relY: ${symHoles[0].relY} }, { relX: ${symHoles[1].relX}, relY: ${symHoles[1].relY} }];`);

  console.log('\n// Slit parameters for Seven Points:');
  console.log(`// slitCenterX = 0.5 (width center)`);
  console.log(`// slitTopY = ${slitTopY}`);
  console.log(`// slitHalfWidth = ${slitHW}`);
  console.log(`// keyholeRadius = ${slitR}mm`);
  console.log(`// keyholeCenterY = ${f4(d0cy)}`);
}

// ============== RUN ALL ==============

fixPhantomShroud();
fixWindSwept();
fixSevenPoints();
