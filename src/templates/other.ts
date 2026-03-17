/**
 * Additional template generators
 * Flags, banners, wings, kama, pauldron, and cloak
 * All based on standard reference SVG designs
 */

import { Template, TemplateParams, generateAttachmentHole } from './base';
import { SVGPath } from '../geometry/primitives';

/**
 * Flag: Rectangular banner with flowing top edge (60×40mm)
 * Based on standard-flag-cut-ready.svg
 * Features: Pole on left side (score line), flowing rectangular body
 */
export class Flag extends Template {
  generateCutPath(params: TemplateParams): string {
    const { length, width } = params;
    const path = new SVGPath();

    // Flag body with flowing edges - rectangular with curved top
    // Start at bottom-left
    path.moveTo(3, width);
    
    // Bottom edge
    path.lineTo(width - 3, width);
    
    // Right edge curves down
    path.quadraticBezierTo(
      width - 1, width * 0.5,
      width - 1, 3
    );
    
    // Top edge curves right to left with subtle flow
    path.quadraticBezierTo(
      width * 0.5, 1,
      3, 3
    );
    
    // Left edge curves up
    path.quadraticBezierTo(
      1, width * 0.5,
      3, width
    );
    
    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, holeRadius, slitWidth, enableSlit } = params;
    const mainPath = this.generateCutPath(params);
    const paths = [mainPath];
    // Attachment hole near top-left
    paths.push(generateAttachmentHole(width * 0.15, width * 0.15, holeRadius, slitWidth, 8, enableSlit));
    return paths;
  }

  generateScorePaths(params: TemplateParams): string[] {
    const { length, width } = params;
    // Pole line on left edge
    const scorePath = new SVGPath();
    scorePath.moveTo(0.5, 3);
    scorePath.lineTo(0.5, width - 3);
    return [scorePath.toString()];
  }

  generateEngravePaths(params: TemplateParams): string[] {
    return [];
  }
}

/**
 * Banner: Large flowing banner with decorative tassels (80×50mm)
 * Based on standard-banner-cut-ready.svg
 * Features: Curved edges, tassel points at bottom
 */
export class Banner extends Template {
  generateCutPath(params: TemplateParams): string {
    const { length, width } = params;
    const path = new SVGPath();

    // Main banner body with flowing edges
    // Start bottom-left
    path.moveTo(3, width);
    
    // Bottom edge
    path.lineTo(width - 3, width);
    
    // Right edge
    path.quadraticBezierTo(
      width - 1, width * 0.5,
      width - 1, 3
    );
    
    // Top edge flowing left
    path.quadraticBezierTo(
      width * 0.5, 1,
      3, 3
    );
    
    // Left edge
    path.quadraticBezierTo(
      1, width * 0.5,
      3, width
    );
    
    path.closePath();
    return path.toString();
  }

  generateScorePaths(params: TemplateParams): string[] {
    const { length, width } = params;
    // Tassel attachment points along bottom (5 tassels)
    const tassels: string[] = [];
    const tasselCount = 5;
    const spacing = width / (tasselCount + 1);
    const tasselDepth = 5; // mm
    
    for (let i = 1; i <= tasselCount; i++) {
      const x = spacing * i;
      const tassel = new SVGPath();
      tassel.moveTo(x, width);
      tassel.lineTo(x - 2, width + tasselDepth);
      tassel.moveTo(x, width);
      tassel.lineTo(x + 2, width + tasselDepth);
      tassels.push(tassel.toString());
    }
    return tassels;
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, holeRadius, slitWidth, enableSlit } = params;
    const mainPath = this.generateCutPath(params);
    const paths = [mainPath];
    // Attachment hole near top-center
    paths.push(generateAttachmentHole(width * 0.5, width * 0.1, holeRadius, slitWidth, 8, enableSlit));
    return paths;
  }

  generateEngravePaths(params: TemplateParams): string[] {
    return [];
  }
}

/**
 * Wings: Symmetric paired wings (120×100mm)
 * Based on standard-wings-cut-ready.svg
 * Features: Left and right wing shapes with center attachment point
 */
export class Wings extends Template {
  generateCutPath(params: TemplateParams): string {
    const { length, width } = params;
    const path = new SVGPath();
    const cx = width / 2;
    const cy = length / 2;
    const wingSpan = width * 0.35; // left wing spans from center

    // Left wing - pointed shape
    path.moveTo(cx - 5, cy - 8);
    path.quadraticBezierTo(cx - wingSpan * 0.3, cy - 10, cx - wingSpan, cy);
    path.quadraticBezierTo(cx - wingSpan * 0.3, cy + 10, cx - 5, cy + 8);
    path.lineTo(cx - 5, cy);
    path.closePath();

    // Right wing - mirror of left
    path.moveTo(cx + 5, cy - 8);
    path.lineTo(cx + 5, cy);
    path.quadraticBezierTo(cx + wingSpan * 0.3, cy + 10, cx + wingSpan, cy);
    path.quadraticBezierTo(cx + wingSpan * 0.3, cy - 10, cx + 5, cy - 8);
    path.closePath();

    return path.toString();
  }

  generateScorePaths(params: TemplateParams): string[] {
    const { length, width } = params;
    const cx = width / 2;
    const cy = length / 2;
    // Center attachment point circle
    const centerPath = new SVGPath();
    centerPath.moveTo(cx + 1.5, cy);
    centerPath.arcTo(1.5, 1.5, 0, 1, 1, cx - 1.5, cy);
    centerPath.arcTo(1.5, 1.5, 0, 1, 1, cx + 1.5, cy);
    return [centerPath.toString()];
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, length, holeRadius, slitWidth, enableSlit } = params;
    const mainPath = this.generateCutPath(params);
    const paths = [mainPath];
    const cx = width / 2;
    const cy = length / 2;
    // Center attachment hole
    paths.push(generateAttachmentHole(cx, cy, holeRadius, slitWidth, 8, enableSlit));
    return paths;
  }

  generateEngravePaths(params: TemplateParams): string[] {
    return [];
  }
}

/**
 * Kama: Curved armor blade (50×60mm)
 * Based on standard-kama-cut-ready.svg
 * Features: Curved crescent shape, single attachment point at top
 */
export class Kama extends Template {
  generateCutPath(params: TemplateParams): string {
    const { length, width } = params;
    const path = new SVGPath();
    const cx = width / 2;

    // Curved blade shape - wider at bottom, points at top
    path.moveTo(cx, 1);
    
    // Right curve (outer edge of blade)
    path.quadraticBezierTo(
      width - 2, length * 0.3,
      width - 2, length * 0.7
    );
    path.quadraticBezierTo(
      width * 0.7, width + 2,
      cx, width
    );
    
    // Left curve (inner edge of blade)
    path.quadraticBezierTo(
      width * 0.3, width - 2,
      2, length * 0.7
    );
    path.quadraticBezierTo(
      2, length * 0.3,
      cx, 1
    );
    
    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, holeRadius, slitWidth, enableSlit } = params;
    const mainPath = this.generateCutPath(params);
    const paths = [mainPath];
    const cx = width / 2;
    // Top attachment hole
    paths.push(generateAttachmentHole(cx, 3, holeRadius, slitWidth, 8, enableSlit));
    return paths;
  }

  generateScorePaths(params: TemplateParams): string[] {
    const { length, width } = params;
    const cx = width / 2;
    // Top attachment point
    const scorePath = new SVGPath();
    scorePath.moveTo(cx - 0.75, 2);
    scorePath.arcTo(0.75, 0.75, 0, 1, 1, cx + 0.75, 2);
    return [scorePath.toString()];
  }

  generateEngravePaths(params: TemplateParams): string[] {
    return [];
  }
}

/**
 * Pauldron: Shoulder armor piece (60×50mm)
 * Based on standard-pauldron-cut-ready.svg
 * Features: Curved shoulder guard, neck attachment edge
 */
export class Pauldron extends Template {
  generateCutPath(params: TemplateParams): string {
    const { length, width } = params;
    const path = new SVGPath();

    // Shoulder guard shape - rounded on outer edge, tapers down
    path.moveTo(5, 1);
    
    // Top right curves to shoulder
    path.quadraticBezierTo(
      width - 2, length * 0.2,
      width - 2, length * 0.6
    );
    
    // Right edge curves down and inward
    path.quadraticBezierTo(
      width * 0.6, width - 2,
      5, width
    );
    
    // Bottom curves left
    path.quadraticBezierTo(
      2, width * 0.5,
      1, length * 0.4
    );
    
    // Left edge curves to top
    path.quadraticBezierTo(
      2, length * 0.2,
      5, 1
    );
    
    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, holeRadius, slitWidth, enableSlit } = params;
    const mainPath = this.generateCutPath(params);
    const paths = [mainPath];
    // Top center attachment hole
    paths.push(generateAttachmentHole(width * 0.5, 3, holeRadius, slitWidth, 8, enableSlit));
    return paths;
  }

  generateScorePaths(params: TemplateParams): string[] {
    const { length, width } = params;
    // Neck attachment line at top
    const scorePath = new SVGPath();
    scorePath.moveTo(width * 0.35, 2);
    scorePath.quadraticBezierTo(width * 0.5, 1, width * 0.65, 2);
    return [scorePath.toString()];
  }

  generateEngravePaths(params: TemplateParams): string[] {
    return [];
  }
}

/**
 * Cloak: Large flowing garment (100×80mm)
 * Based on standard-cloak-cut-ready.svg
 * Features: Flowing tapered body, wavy side edges, dual neck attachment points
 */
export class Cloak extends Template {
  generateCutPath(params: TemplateParams): string {
    const { length, width } = params;
    const path = new SVGPath();
    const cx = width / 2;

    // Main cloak body - vertical teardrop shape
    path.moveTo(cx, 1);
    
    // Right side curves out and down
    path.quadraticBezierTo(
      cx + width * 0.15, length * 0.2,
      cx + width * 0.18, length * 0.5
    );
    
    // Right bottom curves inward
    path.quadraticBezierTo(
      cx + width * 0.12, width - 2,
      cx * 0.95, width
    );
    
    // Bottom curves left (tapers)
    path.quadraticBezierTo(
      cx, width + 1,
      cx * 0.05, width
    );
    
    // Left side curves up (mirror of right)
    path.quadraticBezierTo(
      cx - width * 0.12, width - 2,
      cx - width * 0.18, length * 0.5
    );
    
    // Left top curves to center
    path.quadraticBezierTo(
      cx - width * 0.15, length * 0.2,
      cx, 1
    );
    
    path.closePath();
    return path.toString();
  }

  generateCutPaths(params: TemplateParams): string[] {
    const { width, holeRadius, slitWidth, enableSlit } = params;
    const mainPath = this.generateCutPath(params);
    const paths = [mainPath];
    const cx = width / 2;
    
    // Two neck attachment holes
    const leftHoleX = cx - 3.5;
    const rightHoleX = cx + 3.5;
    paths.push(generateAttachmentHole(leftHoleX, 3, holeRadius, slitWidth, 8, enableSlit));
    paths.push(generateAttachmentHole(rightHoleX, 3, holeRadius, slitWidth, 8, enableSlit));
    
    return paths;
  }

  generateScorePaths(params: TemplateParams): string[] {
    return [];
  }

  generateEngravePaths(params: TemplateParams): string[] {
    return [];
  }
}
