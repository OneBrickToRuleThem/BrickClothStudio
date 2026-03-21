/**
 * Preset utilities for saving and loading design configurations
 */

import { DesignPreset, EditorState } from '../utils/types';

/**
 * Export current editor state as a downloadable preset JSON
 */
export function exportPreset(
  state: EditorState,
  name: string,
  description: string,
  author: string = 'User'
): string {
  const preset: DesignPreset = {
    name,
    description,
    version: '1.0.0',
    elementType: state.elementType,
    templateVariant: state.templateVariant,
    parameters: state.parameters,
    decorations: state.decorations,
    createdAt: new Date().toISOString(),
    author,
  };

  return JSON.stringify(preset, null, 2);
}

/**
 * Download preset as JSON file
 */
export function downloadPreset(
  state: EditorState,
  name: string,
  description: string
): void {
  const presetJson = exportPreset(state, name, description);
  const blob = new Blob([presetJson], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${name.toLowerCase().replace(/\s+/g, '-')}-preset.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Parse and validate preset JSON
 */
export function parsePreset(jsonString: string): DesignPreset | null {
  try {
    const data = JSON.parse(jsonString);
    
    // Validate required fields
    if (
      !data.name ||
      !data.elementType ||
      !data.templateVariant ||
      !data.parameters
    ) {
      console.error('Invalid preset: missing required fields');
      return null;
    }

    return data as DesignPreset;
  } catch (error) {
    console.error('Failed to parse preset:', error);
    return null;
  }
}

/**
 * Load preset from file input
 */
export function loadPresetFromFile(
  file: File,
  onSuccess: (preset: DesignPreset) => void,
  onError: (error: string) => void
): void {
  const reader = new FileReader();

  reader.onload = (event) => {
    const content = event.target?.result as string;
    const preset = parsePreset(content);

    if (preset) {
      onSuccess(preset);
    } else {
      onError('Invalid preset file format');
    }
  };

  reader.onerror = () => {
    onError('Failed to read preset file');
  };

  reader.readAsText(file);
}

/**
 * Get built-in preset by name
 */
export async function getBuiltInPreset(name: string): Promise<DesignPreset | null> {
  try {
    const response = await fetch(`/presets/${name}.json`);
    if (!response.ok) return null;
    
    const data = await response.json();
    return data as DesignPreset;
  } catch (error) {
    console.error('Failed to load built-in preset:', error);
    return null;
  }
}

/**
 * List all built-in presets
 */
export const BUILTIN_PRESETS = [
  'hero-cape',
  'mini-cape',
  'battle-flag',
  'dragon-wings',
] as const;

/**
 * Get display name for preset
 */
export function getPresetDisplayName(filename: string): string {
  return filename
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}
