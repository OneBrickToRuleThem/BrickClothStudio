/**
 * Element Type Selector Component
 */

import React, { useMemo } from 'react';
import { useEditorStore, ELEMENT_DIMENSION_DEFAULTS } from '../store/editor';
import { ElementType } from '../utils/types';
import { generatePattern } from '../services/patternGenerator';

/**
 * SVG icon silhouettes derived from the actual template cut paths.
 * Each renders as a filled shape in a 32×32 viewBox.
 */
function ElementIcon({ type, className }: { type: ElementType; className?: string }) {
  const size = 32;
  const fill = 'currentColor';
  const common = { width: size, height: size, className, style: { display: 'block' } };

  switch (type) {
    case 'cape':
      // Exact CapeStandard outline at 40×39 default
      return (
        <svg {...common} viewBox="-1 -1 42 41">
          <path d="M 19.68 1.86 C 18.69 1.82 18.57 1.74 17.95 1.01 C 17.29 0.24 17.00 0.00 16.73 0.00 C 16.55 0.00 15.29 0.19 14.23 0.37 C 13.62 0.47 12.52 0.72 12.32 0.80 C 11.88 0.96 11.35 1.29 11.16 1.51 C 10.80 1.93 10.38 2.66 9.51 4.36 C 9.05 5.27 8.65 6.04 8.63 6.07 C 8.58 6.14 7.78 7.88 7.58 8.34 C 7.49 8.55 7.18 9.26 6.89 9.93 C 6.44 10.95 5.88 12.36 5.88 12.46 C 5.88 12.48 5.85 12.56 5.81 12.65 C 5.66 12.97 4.03 17.78 3.74 18.75 C 3.67 18.99 3.56 19.36 3.49 19.56 C 3.36 19.98 2.95 21.37 2.55 22.70 C 2.41 23.20 2.25 23.72 2.21 23.86 C 1.96 24.67 1.73 25.43 1.65 25.77 C 1.59 25.99 1.51 26.32 1.46 26.51 C 1.41 26.70 1.33 27.00 1.29 27.18 C 1.25 27.35 1.09 27.99 0.94 28.60 C 0.79 29.21 0.63 29.97 0.57 30.30 C 0.51 30.62 0.41 31.21 0.34 31.60 C 0.28 31.99 0.21 32.34 0.20 32.38 C 0.19 32.42 0.13 32.82 0.08 33.27 C -0.03 34.07 -0.03 34.80 0.08 34.99 C 0.16 35.15 0.33 35.24 1.31 35.67 C 2.84 36.33 4.94 37.00 7.24 37.55 C 8.94 37.96 9.32 38.03 11.75 38.40 C 14.34 38.80 15.06 38.89 16.07 38.97 L 23.93 38.97 C 24.94 38.89 25.66 38.80 28.25 38.40 C 30.68 38.03 31.06 37.96 32.76 37.55 C 35.06 37.00 37.16 36.33 38.69 35.67 C 39.67 35.24 39.84 35.15 39.92 34.99 C 40.03 34.80 40.03 34.07 39.92 33.27 C 39.87 32.82 39.81 32.42 39.80 32.38 C 39.79 32.34 39.72 31.99 39.66 31.60 C 39.59 31.21 39.49 30.62 39.43 30.30 C 39.37 29.97 39.21 29.21 39.06 28.60 C 38.91 27.99 38.75 27.35 38.71 27.18 C 38.67 27.00 38.59 26.70 38.54 26.51 C 38.49 26.32 38.41 25.99 38.35 25.77 C 38.27 25.43 38.04 24.67 37.79 23.86 C 37.75 23.72 37.59 23.20 37.45 22.70 C 37.05 21.37 36.64 19.98 36.51 19.56 C 36.44 19.36 36.33 18.99 36.26 18.75 C 35.97 17.78 34.34 12.97 34.19 12.65 C 34.15 12.56 34.12 12.48 34.12 12.46 C 34.12 12.36 33.56 10.95 33.11 9.93 C 32.82 9.26 32.51 8.55 32.42 8.34 C 32.22 7.88 31.42 6.14 31.37 6.07 C 31.35 6.04 30.95 5.27 30.49 4.36 C 29.62 2.66 29.20 1.93 28.84 1.51 C 28.65 1.29 28.12 0.96 27.68 0.80 C 27.48 0.72 26.38 0.47 25.77 0.37 C 24.71 0.19 23.45 0.00 23.27 0.00 C 23.00 0.00 22.71 0.24 22.05 1.01 C 21.43 1.74 21.31 1.82 20.32 1.86 L 20.32 10.24 A 1.30 1.30 0 1 1 19.68 10.24 Z" fill={fill} />
          {/* Attachment holes */}
          <circle cx="14.92" cy="6.08" r="2.36" fill="white" />
          <circle cx="25.08" cy="6.08" r="2.36" fill="white" />
        </svg>
      );

    case 'flag':
      // Exact FlagSmall outline at 22×60 default
      return (
        <svg {...common} viewBox="-1 -1 24 62">
          <path d="M 3.13 0.00 C 2.45 0.00 1.84 0.40 1.57 1.01 C 0.96 2.37 0.06 5.13 0.04 9.57 C 0.00 20.00 3.60 21.66 3.75 26.41 C 3.89 31.09 0.12 33.40 0.51 40.87 C 0.90 48.27 4.39 48.75 5.81 51.83 C 6.71 53.80 7.07 55.59 7.15 58.89 C 7.16 59.60 7.98 60.00 8.55 59.58 C 9.84 58.64 10.84 57.13 11.37 55.26 C 12.69 50.57 8.78 46.01 8.22 41.30 C 7.78 37.60 10.31 35.92 11.16 32.11 C 11.43 30.94 11.66 29.56 11.70 28.45 C 11.71 28.36 11.75 28.29 11.81 28.25 L 11.81 28.24 C 11.88 28.26 11.95 28.30 12.00 28.37 C 12.86 29.78 12.98 31.47 12.99 32.51 C 13.02 34.52 11.53 37.69 11.46 40.77 C 11.37 44.90 14.06 47.76 15.14 50.19 C 16.35 52.91 16.70 55.92 16.78 59.13 C 16.79 59.58 17.29 59.84 17.67 59.61 C 19.16 58.71 20.95 56.65 21.41 53.10 C 22.00 48.54 19.53 45.98 19.41 41.53 C 19.31 37.92 21.28 36.35 21.47 30.36 C 21.68 23.73 18.23 17.36 18.70 11.95 C 19.03 8.16 20.23 5.10 21.16 2.72 C 21.66 1.44 20.70 0.05 19.31 0.05 Z" fill={fill} />
          {/* Stadium bar holes */}
          <path d="M 5.32 3.14 L 7.15 3.14 A 1.70 1.70 0 0 1 7.15 6.54 L 5.32 6.54 A 1.70 1.70 0 0 1 5.32 3.14 Z" fill="white" />
          <path d="M 13.89 3.14 L 15.71 3.14 A 1.70 1.70 0 0 1 15.71 6.54 L 13.89 6.54 A 1.70 1.70 0 0 1 13.89 3.14 Z" fill="white" />
        </svg>
      );

    case 'wings':
      // Exact Wings outline at 45×25 default
      return (
        <svg {...common} viewBox="-1 -1 47 27">
          <path d="M 18.45 0.00 C 22.50 1.00 29.25 1.75 32.85 3.00 C 38.25 4.50 42.30 7.00 44.10 9.50 C 45.00 10.75 45.00 11.75 44.10 12.50 C 39.60 13.00 35.10 13.50 31.50 14.00 C 31.05 15.50 30.60 18.00 30.15 20.50 C 30.15 22.00 27.00 23.25 20.70 23.50 C 11.25 24.25 4.50 24.75 2.70 25.00 C 0.90 24.75 0.00 22.50 0.00 19.50 C 0.00 17.00 0.00 15.00 0.45 14.25 C 2.70 14.00 7.20 13.75 12.15 13.25 C 13.05 10.00 14.40 6.25 15.75 3.00 C 16.65 1.50 17.55 0.50 18.45 0.00 Z" fill={fill} />
          {/* Membrane finger score lines */}
          <path d="M 14.40 8.75 Q 22.95 5.50 31.50 4.25" stroke="white" strokeWidth="0.5" fill="none" opacity="0.5" />
          <path d="M 14.40 10.25 Q 24.75 7.75 35.10 7.25" stroke="white" strokeWidth="0.5" fill="none" opacity="0.5" />
          <path d="M 14.40 11.75 Q 26.55 10.00 38.70 10.25" stroke="white" strokeWidth="0.5" fill="none" opacity="0.5" />
          {/* Attachment hole */}
          <circle cx="6.75" cy="16.25" r="2.36" fill="white" />
        </svg>
      );

    case 'kama':
      // Exact Kama outline at 47×19 default
      return (
        <svg {...common} viewBox="-1 -1 49 21">
          <path d="M 25.40 18.01 L 24.62 17.61 C 23.77 10.51 23.61 9.92 23.50 10.10 C 23.39 9.92 23.23 10.51 22.81 14.04 L 22.38 17.61 L 21.60 18.01 C 20.23 18.70 18.50 18.93 14.47 18.95 C 12.49 18.96 10.36 18.94 9.75 18.91 C 8.45 18.84 5.03 17.82 4.80 17.42 C 4.72 17.28 4.15 15.43 3.54 13.32 C 2.93 11.21 2.33 9.32 2.20 9.13 C 2.07 8.94 1.67 8.65 1.32 8.48 C 0.27 8.00 0.17 7.66 0.07 4.56 C 0.00 1.53 0.10 0.98 0.98 0.39 C 1.43 0.09 1.69 0.07 4.70 0.05 C 8.27 0.03 8.69 0.12 9.30 1.02 C 9.62 1.50 9.64 1.69 9.63 5.10 L 9.63 8.69 L 10.50 8.72 C 10.97 8.74 12.15 8.74 13.13 8.71 L 14.89 8.65 L 14.87 5.16 C 14.84 1.31 14.88 1.13 15.90 0.46 C 16.39 0.14 16.58 0.12 20.66 0.10 C 22.08 0.02 24.92 0.02 26.34 0.10 C 30.42 0.12 30.61 0.14 31.10 0.46 C 32.12 1.13 32.16 1.31 32.13 5.16 L 32.11 8.65 L 33.87 8.71 C 34.85 8.74 36.03 8.74 36.50 8.72 L 37.37 8.69 L 37.37 5.10 C 37.36 1.69 37.38 1.50 37.70 1.02 C 38.31 0.12 38.73 0.03 42.30 0.05 C 45.31 0.07 45.57 0.09 46.02 0.39 C 46.90 0.98 47.00 1.53 46.93 4.56 C 46.83 7.66 46.73 8.00 45.68 8.48 C 45.33 8.65 44.93 8.94 44.80 9.13 C 44.67 9.32 44.07 11.21 43.46 13.32 C 42.85 15.43 42.28 17.28 42.20 17.42 C 41.97 17.82 38.55 18.84 37.25 18.91 C 36.64 18.94 34.51 18.96 32.53 18.95 C 28.50 18.93 26.77 18.70 25.40 18.01 Z" fill={fill} />
          {/* Attachment holes */}
          <circle cx="4.97" cy="5.19" r="2.36" fill="white" />
          <circle cx="19.33" cy="5.19" r="2.36" fill="white" />
          <circle cx="27.67" cy="5.19" r="2.36" fill="white" />
          <circle cx="42.03" cy="5.19" r="2.36" fill="white" />
        </svg>
      );

    case 'mantle':
      // Exact Pauldron outline at 23×26 default
      return (
        <svg {...common} viewBox="-1 -1 25 28">
          <path d="M 9.06 25.85 C 7.25 25.56 5.62 24.94 4.25 24.01 C 3.51 23.51 2.41 22.37 2.20 21.90 C 1.98 21.40 2.03 21.06 2.52 19.71 C 3.28 17.60 3.56 16.13 3.56 14.22 C 3.55 11.97 3.33 11.33 2.00 9.89 C 1.52 9.36 1.07 8.78 0.93 8.50 C 0.00 6.71 0.01 4.36 0.96 2.70 C 1.59 1.59 2.66 0.73 4.01 0.25 C 4.69 0.01 4.75 0.00 5.99 0.00 C 7.49 0.01 8.04 0.13 9.26 0.74 C 10.18 1.20 10.75 1.72 11.05 2.38 C 11.25 2.81 11.26 2.90 11.25 3.94 C 11.25 4.54 11.24 6.48 11.23 8.25 L 11.22 11.45 L 10.87 11.63 C 10.17 11.97 9.88 12.83 10.22 13.55 C 10.72 14.62 12.28 14.62 12.78 13.55 C 13.12 12.83 12.83 11.97 12.13 11.63 L 11.78 11.45 L 11.77 8.25 C 11.76 6.48 11.75 4.54 11.75 3.94 C 11.74 2.90 11.75 2.81 11.95 2.38 C 12.25 1.72 12.82 1.20 13.74 0.74 C 14.96 0.13 15.51 0.01 17.01 0.00 C 18.25 0.00 18.31 0.01 18.99 0.25 C 20.34 0.73 21.41 1.59 22.04 2.70 C 22.99 4.36 23.00 6.71 22.07 8.50 C 21.93 8.78 21.48 9.36 21.00 9.89 C 19.67 11.33 19.45 11.97 19.44 14.22 C 19.44 16.13 19.72 17.60 20.48 19.71 C 20.97 21.06 21.02 21.40 20.80 21.90 C 20.59 22.37 19.49 23.51 18.74 24.01 C 17.38 24.94 15.75 25.56 13.94 25.85 C 12.31 26.00 10.69 26.00 9.06 25.85 Z" fill={fill} />
          {/* Head pin holes */}
          <circle cx="17.29" cy="6.97" r="2.46" fill="white" />
          <circle cx="5.71" cy="6.97" r="2.46" fill="white" />
        </svg>
      );

    case 'sail':
      // Exact SailSquare outline at 60×60 default
      return (
        <svg {...common} viewBox="-2 -2 65 65">
          <path d="M 1.00 -0.50 L 59.00 -0.50 A 1.50 1.50 0 0 1 60.50 1.00 L 60.50 59.00 A 1.50 1.50 0 0 1 59.00 60.50 L 1.00 60.50 A 1.50 1.50 0 0 1 -0.50 59.00 L -0.50 1.00 A 1.50 1.50 0 0 1 1.00 -0.50 Z" fill={fill} />
          {/* Grommet holes */}
          <circle cx="4" cy="4" r="1.5" fill="white" />
          <circle cx="56" cy="4" r="1.5" fill="white" />
          <circle cx="4" cy="56" r="1.5" fill="white" />
          <circle cx="56" cy="56" r="1.5" fill="white" />
          {/* Score crosshairs */}
          {[{x:4,y:4},{x:56,y:4},{x:4,y:56},{x:56,y:56}].map((g, i) => (
            <g key={i} opacity="0.4">
              <line x1={g.x-2.5} y1={g.y} x2={g.x+2.5} y2={g.y} stroke="white" strokeWidth="0.5" />
              <line x1={g.x} y1={g.y-2.5} x2={g.x} y2={g.y+2.5} stroke="white" strokeWidth="0.5" />
            </g>
          ))}
        </svg>
      );

    default:
      return <span className="text-2xl">📐</span>;
  }
}

const ELEMENTS: Array<{ type: ElementType; label: string; wip?: boolean }> = [
  { type: 'cape', label: 'Cape' },
  { type: 'flag', label: 'Flag/Banner' },
  { type: 'sail', label: 'Sail' },
  { type: 'kama', label: 'Kama/Skirt' },
  { type: 'mantle', label: 'Mantle' },
  { type: 'wings', label: 'Wing', wip: true },
];

export default function ElementSelector() {
  const { elementType, switchElement } = useEditorStore();

  const handleElementChange = (type: ElementType) => {
    // Default variant per element type
    const variants: Record<ElementType, string> = {
      cape: 'standard',
      flag: 'small-flag',
      wings: 'standard',
      kama: 'wrap-skirt',
      mantle: 'shoulder-armor',
      sail: 'square-sail',
    };
    const variant = variants[type];
    switchElement(type, variant as any);
  };

  return (
    <div className="panel min-h-full">
      <div className="panel-header">Element Type</div>
      <div className="space-y-2">
        {ELEMENTS.map((elem) => (
          <button
            key={elem.type}
            onClick={() => handleElementChange(elem.type)}
            className={`w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3 ${
              elementType === elem.type
                ? 'bg-blue-100 dark:bg-blue-900/40 border-2 border-blue-500 text-blue-900 dark:text-blue-200'
                : elem.wip
                  ? 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600 opacity-60'
                  : 'bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600'
            }`}
          >
            <ElementIcon type={elem.type} className={`w-8 h-8 flex-shrink-0 ${
              elementType === elem.type ? 'text-blue-700 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'
            }`} />
            <div className="flex flex-col">
              <span className="font-medium text-sm">{elem.label}</span>
              {elem.wip && <span className="text-[10px] text-amber-600 font-semibold leading-tight">IN DEVELOPMENT</span>}
            </div>
          </button>
        ))}
      </div>

      <div className="panel-section mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
        <div className="panel-section-title">Element Variants</div>
        <ElementVariantSelector />
      </div>
    </div>
  );
}

function VariantThumbnail({ elementType, variant, className }: { elementType: ElementType; variant: string; className?: string }) {
  const pathData = useMemo(() => {
    try {
      const key = `${elementType}:${variant}`;
      const dims = ELEMENT_DIMENSION_DEFAULTS[key] || ELEMENT_DIMENSION_DEFAULTS[elementType] || { width: 40, length: 40 };
      const params: Record<string, number | string | boolean> = {
        width: dims.width,
        length: dims.length,
        holeRadius: 2.5,
        clearance: 0.2,
        slitWidth: 1.5,
        enableSlit: false,
        holeCount: 2,
        holeType: 'minifigure',
        sailSides: 6,
        sailGrommetTLx: 4, sailGrommetTLy: 4,
        sailGrommetTRx: 4, sailGrommetTRy: 4,
        sailGrommetBLx: 4, sailGrommetBLy: 4,
        sailGrommetBRx: 4, sailGrommetBRy: 4,
        sailPolygonGrommetPositions: '[]',
        sailPolygonGrommetMask: '',
        sailExtraGrommets: '[]',
        colorSplitCount: 0,
        colorSplitColors: '[]',
        stripeEnabled: false,
        stripeColors: '[]',
      };
      const pattern = generatePattern(elementType, variant as any, params);
      if (!pattern.cutPaths.length) return null;
      const bb = pattern.boundingBox;
      return { d: pattern.cutPaths[0], viewBox: `${bb.x - 1} ${bb.y - 1} ${bb.width + 2} ${bb.height + 2}` };
    } catch {
      return null;
    }
  }, [elementType, variant]);

  if (!pathData) return null;

  return (
    <svg width={28} height={28} viewBox={pathData.viewBox} className={className} style={{ display: 'block' }}>
      <path d={pathData.d} fill="currentColor" />
    </svg>
  );
}

function ElementVariantSelector() {
  const { elementType, templateVariant, switchVariant } = useEditorStore();

  const variants: Record<ElementType, Array<{ value: string; label: string }>> = {
    cape: [
      { value: 'standard', label: 'Standard' },
      { value: 'wind-swept', label: 'Wind Swept' },
      { value: 'phantom-shroud', label: 'Phantom Shroud' },
      { value: 'seven-points', label: 'Seven Points' },
      { value: 'narrow-single-hole', label: 'Narrow (Single Hole)' },
      { value: 'top-single-hole', label: 'Top (Single Hole)' },
      { value: 'stepped-single-hole', label: 'Stepped (Single Hole)' },
    ],

    flag: [
      { value: 'small-flag', label: 'Small Flag' },
      { value: 'large-flag', label: 'Large Flag' },
      { value: 'custom-flag', label: 'Custom' },
    ],

    wings: [
      { value: 'standard', label: 'Dragon Wing' },
      { value: 'custom-wing', label: 'Custom Wing' },
    ],
    kama: [
      { value: 'wrap-skirt', label: 'Wrap Skirt' },
      { value: 'full-skirt', label: 'Full Skirt' },
    ],
    mantle: [
      { value: 'shoulder-armor', label: 'Shoulder Armor' },
      { value: 'high-collar', label: 'High Collar' },
    ],
    sail: [
      { value: 'square-sail', label: 'Square Sail' },
      { value: 'triangular-sail', label: 'Triangular Sail' },
      { value: 'polygon-sail', label: 'Polygon Sail' },
    ],
  };

  const currentVariants = variants[elementType] || [];

  return (
    <div className="space-y-2">
      {currentVariants.map((variant) => (
        <button
          key={variant.value}
          onClick={() => {
            switchVariant(variant.value as any);
          }}
          className={`w-full p-2 rounded text-sm transition-colors flex items-center gap-2 ${
            templateVariant === variant.value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-gray-200'
          }`}
        >
          <VariantThumbnail
            elementType={elementType}
            variant={variant.value}
            className={`flex-shrink-0 ${
              templateVariant === variant.value ? 'text-white' : 'text-gray-500 dark:text-gray-400'
            }`}
          />
          <span>{variant.label}</span>
        </button>
      ))}
    </div>
  );
}
