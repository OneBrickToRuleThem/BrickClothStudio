/**
 * Pattern generator service
 * Instantiates appropriate template based on element type and variant
 * Returns a complete PatternExport ready for rendering/export
 */

import { ElementType, TemplateVariant, PatternExport } from '../utils/types';
import { TemplateParams } from '../templates/base';
import {
  CapeStandard,
  CapeShort,
  CapeLong,
  CapeTattered,
} from '../templates/cape';
import {
  FlagSmall,
  FlagLarge,
  Wings,
  Kama,
  Pauldron,
  SailSquare,
  SailTriangular,
  SailPolygon,
} from '../templates/other';

/**
 * Main pattern generator
 * Routes to appropriate template class and generates pattern
 */
export function generatePattern(
  elementType: ElementType,
  templateVariant: TemplateVariant,
  parameters: Record<string, number | string | boolean>
): PatternExport {
  const params: TemplateParams = {
    length: (parameters.length as number) || 60,
    width: (parameters.width as number) || 40,
    holeRadius: (parameters.holeRadius as number) || 2.5,
    clearance: (parameters.clearance as number) || 0.2,
    slitWidth: (parameters.slitWidth as number) || 1.2,
    enableSlit: (parameters.enableSlit as boolean) || false,
    ...parameters, // Include any other custom parameters
  };

  let template: any;
  let name = '';

  // Route to appropriate template
  if (elementType === 'cape') {
    switch (templateVariant) {
      case 'short':
        template = new CapeShort();
        name = 'Short Cape';
        break;
      case 'long':
        template = new CapeLong();
        name = 'Long Cape';
        break;
      case 'tattered':
        template = new CapeTattered();
        name = 'Tattered Cape';
        break;
      default:
        template = new CapeStandard();
        name = 'Standard Cape';
    }
  } else if (elementType === 'flag') {
    switch (templateVariant) {
      case 'large-flag':
        template = new FlagLarge();
        name = 'Large Flag';
        break;
      default:
        template = new FlagSmall();
        name = 'Small Flag';
    }
  } else if (elementType === 'wings') {
    template = new Wings();
    name = 'Wing';
  } else if (elementType === 'kama') {
    template = new Kama();
    name = 'Kama/Skirt';
  } else if (elementType === 'pauldron') {
    template = new Pauldron();
    name = 'Pauldron';
  } else if (elementType === 'sail') {
    switch (templateVariant) {
      case 'triangular-sail':
        template = new SailTriangular();
        name = 'Triangular Sail';
        break;
      case 'polygon-sail':
        template = new SailPolygon();
        name = 'Polygon Sail';
        break;
      default:
        template = new SailSquare();
        name = 'Square Sail';
    }
  } else {
    // Default fallback
    template = new CapeStandard();
    name = 'Pattern';
  }

  // Generate pattern export
  return template.export(
    `pattern-${Date.now()}`,
    name,
    elementType,
    templateVariant,
    params
  );
}

/**
 * Generate pattern from a preset
 */
export function generatePatternFromPreset(
  preset: any
): PatternExport {
  return generatePattern(preset.elementType, preset.templateVariant, preset.parameters);
}
