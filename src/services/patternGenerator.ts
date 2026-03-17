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
  CapeReferenceTest,
} from '../templates/cape';
import {
  Flag,
  Banner,
  Wings,
  Kama,
  Pauldron,
  Cloak,
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
      case 'reference-test':
        template = new CapeReferenceTest();
        name = 'Reference Test Cape';
        break;
      default:
        template = new CapeStandard();
        name = 'Standard Cape';
    }
  } else if (elementType === 'cloak') {
    template = new Cloak();
    name = 'Cloak';
  } else if (elementType === 'flag') {
    template = new Flag();
    name = 'Flag';
  } else if (elementType === 'banner') {
    template = new Banner();
    name = 'Banner';
  } else if (elementType === 'wings') {
    template = new Wings();
    name = 'Wings';
  } else if (elementType === 'kama') {
    template = new Kama();
    name = 'Kama/Skirt';
  } else if (elementType === 'pauldron') {
    template = new Pauldron();
    name = 'Pauldron';
  } else {
    // Custom/default
    template = new CapeStandard();
    name = 'Custom Pattern';
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
