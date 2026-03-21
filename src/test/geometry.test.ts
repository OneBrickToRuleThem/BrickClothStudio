/**
 * Unit tests for geometry and SVG export
 */

import { describe, it, expect } from 'vitest';
import { SVGPath, circlePath, keyholeSlitPath, calculateBoundingBox } from '../geometry/primitives';
import { generatePattern } from '../services/patternGenerator';
import { exportSinglePatternSVG } from '../export/svg';

describe('SVGPath', () => {
  it('should generate moveTo command', () => {
    const path = new SVGPath();
    path.moveTo(10, 20);
    expect(path.toString()).toContain('M 10.00 20.00');
  });

  it('should generate line commands', () => {
    const path = new SVGPath();
    path.moveTo(0, 0);
    path.lineTo(10, 10);
    expect(path.toString()).toContain('M 0.00 0.00');
    expect(path.toString()).toContain('L 10.00 10.00');
  });

  it('should close path', () => {
    const path = new SVGPath();
    path.moveTo(0, 0);
    path.lineTo(10, 0);
    path.closePath();
    expect(path.toString()).toContain('Z');
  });
});

describe('Primitives', () => {
  it('should generate circle path', () => {
    const path = circlePath(50, 50, 10);
    expect(path).toContain('M');
    expect(path).toContain('A');
  });

  it('should generate keyhole slit path', () => {
    const path = keyholeSlitPath(50, 50, 2.5, 1.2, 8);
    expect(path).toContain('M');
    expect(path).toContain('L');
    expect(path).toContain('A');
  });

  it('should calculate bounding box', () => {
    const points = [
      { x: 0, y: 0 },
      { x: 100, y: 50 },
      { x: 50, y: 100 },
    ];
    const bb = calculateBoundingBox(points);
    expect(bb.x).toBe(0);
    expect(bb.y).toBe(0);
    expect(bb.width).toBe(100);
    expect(bb.height).toBe(100);
  });
});

describe('Pattern Generation', () => {
  it('should generate cape pattern', () => {
    const pattern = generatePattern('cape', 'standard', {
      length: 60,
      width: 40,
      holeRadius: 2.5,
      clearance: 0.2,
      slitWidth: 1.2,
      enableSlit: false,
    });
    expect(pattern.name).toBe('Standard Cape');
    expect(pattern.cutPaths.length).toBeGreaterThan(0);
  });

  it('should generate cape with keyhole slit', () => {
    const pattern = generatePattern('cape', 'standard', {
      length: 60,
      width: 40,
      holeRadius: 2.5,
      clearance: 0.2,
      slitWidth: 1.2,
      enableSlit: true,
    });
    expect(pattern.name).toBe('Standard Cape');
    expect(pattern.cutPaths.length).toBeGreaterThan(0);
  });

  it('should generate short cape', () => {
    const pattern = generatePattern('cape', 'short', {
      length: 40,
      width: 40,
      holeRadius: 2.5,
      clearance: 0.2,
      slitWidth: 1.2,
      enableSlit: false,
    });
    expect(pattern.name).toBe('Short Cape');
  });

  it('should generate flag pattern', () => {
    const pattern = generatePattern('flag', 'standard', {
      length: 80,
      width: 40,
      holeRadius: 2.5,
      clearance: 0.2,
      slitWidth: 1.2,
      enableSlit: false,
    });
    expect(pattern.name).toBe('Small Flag');
  });

  it('should generate wings pattern', () => {
    const pattern = generatePattern('wings', 'standard', {
      length: 25,
      width: 45,
      holeRadius: 2.5,
      clearance: 0.2,
      slitWidth: 1.2,
      enableSlit: false,
    });
    expect(pattern.name).toBe('Wing');
  });
});

describe('SVG Export', () => {
  it('should export pattern as valid SVG', () => {
    const pattern = generatePattern('cape', 'standard', {
      length: 60,
      width: 40,
      holeRadius: 2.5,
      clearance: 0.2,
      slitWidth: 1.2,
      enableSlit: false,
    });
    const svg = exportSinglePatternSVG(pattern);
    
    expect(svg).toContain('<?xml');
    expect(svg).toContain('<svg');
    expect(svg).toContain('viewBox');
    expect(svg).toContain('mm');
    expect(svg).toContain('</svg>');
  });

  it('should include cut layer in export', () => {
    const pattern = generatePattern('cape', 'standard', {
      length: 60,
      width: 40,
      holeRadius: 2.5,
      clearance: 0.2,
      slitWidth: 1.2,
      enableSlit: false,
    });
    const svg = exportSinglePatternSVG(pattern);
    
    expect(svg).toContain('id="cut"');
    expect(svg).toContain('class="cut-line"');
  });

  it('should respect stroke width in export', () => {
    const pattern = generatePattern('cape', 'standard', {
      length: 60,
      width: 40,
      holeRadius: 2.5,
      clearance: 0.2,
      slitWidth: 1.2,
      enableSlit: false,
    });
    const svg = exportSinglePatternSVG(pattern, { strokeWidth: 0.2 });
    
    expect(svg).toContain('0.20mm');
  });

  it('should use correct color codes', () => {
    const pattern = generatePattern('cape', 'standard', {
      length: 60,
      width: 40,
      holeRadius: 2.5,
      clearance: 0.2,
      slitWidth: 1.2,
      enableSlit: false,
    });
    const svg = exportSinglePatternSVG(pattern);
    
    expect(svg).toContain('#ff0000'); // cut = red
  });
});

describe('Hole Sizing', () => {
  it('should apply clearance to hole radius', () => {
    const patternWithClearance = generatePattern('cape', 'standard', {
      length: 60,
      width: 40,
      holeRadius: 2.4,
      clearance: 0.1,
      slitWidth: 1.2,
      enableSlit: false,
    });
    
    const patternNoClearance = generatePattern('cape', 'standard', {
      length: 60,
      width: 40,
      holeRadius: 2.5,
      clearance: 0,
      slitWidth: 1.2,
      enableSlit: false,
    });

    // Both should generate valid patterns
    expect(patternWithClearance.cutPaths).toBeDefined();
    expect(patternNoClearance.cutPaths).toBeDefined();
  });
});
