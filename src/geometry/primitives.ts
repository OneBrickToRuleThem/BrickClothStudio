/**
 * SVG path primitives and utilities
 * All coordinates in millimeters (mm)
 */

import { Point, BoundingBox } from '../utils/types';

/**
 * SVG path command helper
 */
export class SVGPath {
  private commands: string[] = [];

  moveTo(x: number, y: number): SVGPath {
    this.commands.push(`M ${this.fmt(x)} ${this.fmt(y)}`);
    return this;
  }

  lineTo(x: number, y: number): SVGPath {
    this.commands.push(`L ${this.fmt(x)} ${this.fmt(y)}`);
    return this;
  }

  lineToRel(dx: number, dy: number): SVGPath {
    this.commands.push(`l ${this.fmt(dx)} ${this.fmt(dy)}`);
    return this;
  }

  /**
   * Cubic Bezier curve (absolute)
   * cx1, cy1 = first control point
   * cx2, cy2 = second control point
   * x, y = end point
   */
  cubicBezierTo(
    cx1: number,
    cy1: number,
    cx2: number,
    cy2: number,
    x: number,
    y: number
  ): SVGPath {
    this.commands.push(
      `C ${this.fmt(cx1)} ${this.fmt(cy1)} ${this.fmt(cx2)} ${this.fmt(cy2)} ${this.fmt(x)} ${this.fmt(y)}`
    );
    return this;
  }

  /**
   * Quadratic Bezier curve (absolute)
   */
  quadraticBezierTo(cx: number, cy: number, x: number, y: number): SVGPath {
    this.commands.push(`Q ${this.fmt(cx)} ${this.fmt(cy)} ${this.fmt(x)} ${this.fmt(y)}`);
    return this;
  }

  /**
   * Arc (absolute)
   * rx, ry = radii
   * rotation = x-axis rotation in degrees
   * largeArc = 0 or 1
   * sweep = 0 or 1
   * x, y = end point
   */
  arcTo(
    rx: number,
    ry: number,
    rotation: number,
    largeArc: 0 | 1,
    sweep: 0 | 1,
    x: number,
    y: number
  ): SVGPath {
    this.commands.push(
      `A ${this.fmt(rx)} ${this.fmt(ry)} ${rotation} ${largeArc} ${sweep} ${this.fmt(x)} ${this.fmt(y)}`
    );
    return this;
  }

  /**
   * Horizontal line to (absolute)
   */
  horizontalLineTo(x: number): SVGPath {
    this.commands.push(`H ${this.fmt(x)}`);
    return this;
  }

  /**
   * Vertical line to (absolute)
   */
  verticalLineTo(y: number): SVGPath {
    this.commands.push(`V ${this.fmt(y)}`);
    return this;
  }

  /**
   * Close current subpath
   */
  closePath(): SVGPath {
    this.commands.push('Z');
    return this;
  }

  /**
   * Get the final SVG path string
   */
  toString(): string {
    return this.commands.join(' ');
  }

  /**
   * Format number to 2 decimal places for SVG output
   */
  private fmt(n: number): string {
    return n.toFixed(2);
  }
}

/**
 * Create a rounded rectangle path
 * x, y = top-left corner
 * width, height = dimensions
 * radius = corner radius
 */
export function roundedRectPath(
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): string {
  const r = Math.min(radius, width / 2, height / 2);
  const path = new SVGPath();
  
  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.arcTo(r, r, 0, 0, 1, x + width, y + r);
  path.lineTo(x + width, y + height - r);
  path.arcTo(r, r, 0, 0, 1, x + width - r, y + height);
  path.lineTo(x + r, y + height);
  path.arcTo(r, r, 0, 0, 1, x, y + height - r);
  path.lineTo(x, y + r);
  path.arcTo(r, r, 0, 0, 1, x + r, y);
  path.closePath();

  return path.toString();
}

/**
 * Create a stadium/pill-shaped path (horizontal rounded rectangle)
 * cx, cy = center of the shape
 * halfWidth = half of the flat section width (total width = 2*halfWidth + 2*radius)
 * radius = radius of the semicircular ends (total height = 2*radius)
 */
export function stadiumPath(cx: number, cy: number, halfWidth: number, radius: number): string {
  const path = new SVGPath();
  // Start at left-center, draw top semicircle right, flat top, right semicircle, flat bottom, close
  path.moveTo(cx - halfWidth, cy - radius);
  path.lineTo(cx + halfWidth, cy - radius);
  path.arcTo(radius, radius, 0, 0, 1, cx + halfWidth, cy + radius);
  path.lineTo(cx - halfWidth, cy + radius);
  path.arcTo(radius, radius, 0, 0, 1, cx - halfWidth, cy - radius);
  path.closePath();
  return path.toString();
}

/**
 * Create a circle path
 * cx, cy = center
 * radius = radius
 */
export function circlePath(cx: number, cy: number, radius: number): string {
  const r = radius;
  const path = new SVGPath();

  // Two semicircles to form complete circle
  path.moveTo(cx - r, cy);
  path.arcTo(r, r, 0, 1, 1, cx + r, cy);
  path.arcTo(r, r, 0, 1, 1, cx - r, cy);
  path.closePath();

  return path.toString();
}

/**
 * Create a keyhole/slit shape for neck attachment
 * x, y = center of keyhole
 * holeRadius = radius of circular head
 * slitWidth = width of slit
 * slitLength = length of slit (downward from circle)
 */
export function keyholeSlitPath(
  x: number,
  y: number,
  holeRadius: number,
  slitWidth: number,
  slitLength: number
): string {
  const path = new SVGPath();
  const slitHalf = slitWidth / 2;

  // Start at bottom of circle
  path.moveTo(x, y + holeRadius);

  // Right side of slit
  path.lineTo(x + slitHalf, y + holeRadius);
  path.lineTo(x + slitHalf, y + holeRadius + slitLength);

  // Bottom of slit (rounded)
  const slitBottomRadius = slitHalf;
  path.arcTo(slitBottomRadius, slitBottomRadius, 0, 0, 1, x - slitHalf, y + holeRadius + slitLength);

  // Left side of slit
  path.lineTo(x - slitHalf, y + holeRadius);

  // Circle (right side)
  path.arcTo(holeRadius, holeRadius, 0, 0, 1, x, y - holeRadius);

  // Circle (left side back to start)
  path.arcTo(holeRadius, holeRadius, 0, 0, 1, x, y + holeRadius);

  path.closePath();
  return path.toString();
}

/**
 * Create a scalloped edge using circular arcs
 * startPoint = starting point
 * endPoint = ending point
 * scallops = number of scallop bumps
 * amplitude = depth of scallop (inward)
 * direction = 'inward' or 'outward'
 */
export function scallopedPath(
  startPoint: Point,
  endPoint: Point,
  scallops: number,
  amplitude: number,
  direction: 'inward' | 'outward' = 'inward'
): string {
  const path = new SVGPath();
  path.moveTo(startPoint.x, startPoint.y);

  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const segmentLength = Math.sqrt(dx * dx + dy * dy) / scallops;
  const angle = Math.atan2(dy, dx);

  // Perpendicular direction for scallop depth
  const perpAngle = angle + (direction === 'inward' ? Math.PI / 2 : -Math.PI / 2);
  const perpX = Math.cos(perpAngle);
  const perpY = Math.sin(perpAngle);

  for (let i = 1; i <= scallops; i++) {
    const segStart = {
      x: startPoint.x + Math.cos(angle) * segmentLength * (i - 1),
      y: startPoint.y + Math.sin(angle) * segmentLength * (i - 1),
    };

    const segEnd = {
      x: startPoint.x + Math.cos(angle) * segmentLength * i,
      y: startPoint.y + Math.sin(angle) * segmentLength * i,
    };

    // Control point at peak of scallop
    const midPoint = {
      x: (segStart.x + segEnd.x) / 2,
      y: (segStart.y + segEnd.y) / 2,
    };

    const controlPoint = {
      x: midPoint.x + perpX * amplitude,
      y: midPoint.y + perpY * amplitude,
    };

    path.quadraticBezierTo(controlPoint.x, controlPoint.y, segEnd.x, segEnd.y);
  }

  return path.toString();
}

/**
 * Calculate bounding box of a set of points
 */
export function calculateBoundingBox(points: Point[]): BoundingBox {
  if (points.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;

  for (const p of points) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Offset a path outward by a distance
 * Simple implementation: moves all points outward from centroid
 * For production, use a proper offsetting library
 */
export function offsetPathOutward(
  points: Point[],
  distance: number
): Point[] {
  // Calculate centroid
  let cx = 0,
    cy = 0;
  for (const p of points) {
    cx += p.x;
    cy += p.y;
  }
  cx /= points.length;
  cy /= points.length;

  // Offset each point
  return points.map((p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist === 0) return p;

    const scale = 1 + distance / dist;
    return {
      x: cx + dx * scale,
      y: cy + dy * scale,
    };
  });
}
