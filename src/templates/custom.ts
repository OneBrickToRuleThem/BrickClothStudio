/**
 * Custom / Traced Image template
 * Renders user-uploaded image as a traced SVG cut path
 */

import { Template, TemplateParams } from './base';
import { circlePath } from '../geometry/primitives';

/**
 * Custom element: traced bitmap image
 * The heavy lifting (tracing) happens asynchronously in the UI layer.
 * This template wraps the pre-traced SVG path data stored in parameters.
 */
export class CustomTraced extends Template {
  generateCutPath(params: TemplateParams): string {
    // Prefer individual contours (allows removal); fall back to combined SVG
    const contoursJson = params.customTraceContours as string;
    if (contoursJson) {
      try {
        const contours: string[] = JSON.parse(contoursJson);
        if (contours.length > 0) return contours.join(' ');
      } catch { /* fall through */ }
    }
    const tracedPath = params.customTraceSvg as string;
    if (tracedPath && tracedPath.length > 0) {
      return tracedPath;
    }
    const w = params.width;
    const h = params.length;
    return `M 0 0 L ${w} 0 L ${w} ${h} L 0 ${h} Z`;
  }

  generateCutPaths(params: TemplateParams): string[] {
    const paths = [this.generateCutPath(params)];
    // Add detected attachment holes as additional cut paths
    const holesJson = params.customDetectedHoles as string;
    if (holesJson) {
      try {
        const holes: Array<{ cx: number; cy: number; radius: number; enabled: boolean }> = JSON.parse(holesJson);
        for (const hole of holes) {
          if (hole.enabled) {
            const holeRadius = (params.customHoleRadius as number) || hole.radius;
            paths.push(circlePath(hole.cx, hole.cy, holeRadius));
          }
        }
      } catch { /* ignore bad JSON */ }
    }
    return paths;
  }

  generateScorePaths(_params: TemplateParams): string[] {
    return [];
  }

  generateEngravePaths(_params: TemplateParams): string[] {
    return [];
  }
}
