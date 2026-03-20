/**
 * Element Type Selector Component
 */

import React from 'react';
import { useEditorStore } from '../store/editor';
import { ElementType } from '../utils/types';

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
      // Simplified CapeStandard outline: narrow shoulders → flowing sides → gathered hem
      return (
        <svg {...common} viewBox="0 0 40 39">
          <path d={
            `M20 0.5 ` +
            `C15 0.5, 13 1, 12 2 C10 3.5, 9 7, 7.5 12 C6 17, 4 23, 3 27 ` +
            `C1.5 31, 0.5 34, 1 35 C1.5 36, 5 37, 10 38 C15 39, 17 39, 20 39 ` +
            `L20 39 ` +
            `C23 39, 25 39, 30 38 C35 37, 38.5 36, 39 35 C39.5 34, 38.5 31, 37 27 ` +
            `C36 23, 34 17, 32.5 12 C31 7, 30 3.5, 28 2 C27 1, 25 0.5, 20 0.5Z`
          } fill={fill} />
        </svg>
      );

    case 'flag':
      // Simplified SmallFlag: vertical pennant with single flame tongue on right
      return (
        <svg {...common} viewBox="0 0 26 36">
          <path d={
            `M4 1 L22 1 ` +
            `C23 5, 22 10, 24 14 C26 18, 20 22, 22 26 ` +
            `C24 30, 22 34, 20 35 ` +
            `L4 35 ` +
            `C4 35, 4 1, 4 1Z`
          } fill={fill} />
          {/* Two bar holes */}
          <circle cx="8" cy="4" r="1.8" fill="white" />
          <circle cx="18" cy="4" r="1.8" fill="white" />
        </svg>
      );

    case 'banner':
      // Simplified Banner: rectangle top + swallowtail V-notch bottom
      return (
        <svg {...common} viewBox="0 0 40 50">
          <path d={
            `M1 0 L39 0 L39 38 L21 38 L20 50 L19 38 L1 38 Z`
          } fill={fill} />
          {/* Rod pocket score line */}
          <line x1="2" y1="4" x2="38" y2="4" stroke="white" strokeWidth="0.8" opacity="0.6" />
          {/* Holes */}
          <circle cx="8" cy="2" r="1.5" fill="white" />
          <circle cx="32" cy="2" r="1.5" fill="white" />
        </svg>
      );

    case 'wings':
      // Simplified Wings: symmetric butterfly pair with center spine
      return (
        <svg {...common} viewBox="0 0 60 50">
          <path d={
            `M33 2.5 C38 1, 45 0, 54 4 C58 8, 60 15, 59 22 ` +
            `C58 28, 58.5 32, 57.5 37.5 C56 42, 48 47, 39 47.5 ` +
            `C35 48.5, 34 45, 33 42 L33 2.5Z ` +
            `M27 2.5 C22 1, 15 0, 6 4 C2 8, 0 15, 1 22 ` +
            `C2 28, 1.5 32, 2.5 37.5 C4 42, 12 47, 21 47.5 ` +
            `C25 48.5, 26 45, 27 42 L27 2.5Z`
          } fill={fill} fillRule="evenodd" />
          {/* Center spine */}
          <rect x="28" y="2" width="4" height="43" rx="1" fill={fill} />
          {/* Attachment holes */}
          <circle cx="30" cy="6" r="1.5" fill="white" />
          <circle cx="30" cy="15" r="1.5" fill="white" />
        </svg>
      );

    case 'kama':
      // Simplified Kama: semi-circular flared skirt with straight waistband
      return (
        <svg {...common} viewBox="-2 -1 44 24">
          <path d={
            `M0 0 L40 0 ` +
            `C42 6, 43.2 12, 38 20 ` +
            `C32 22.5, 22 23, 20 22.5 ` +
            `C18 23, 8 22.5, 2 20 ` +
            `C-3.2 12, -2 6, 0 0Z`
          } fill={fill} />
          {/* Waist fold line */}
          <line x1="1" y1="3" x2="39" y2="3" stroke="white" strokeWidth="0.6" opacity="0.6" />
          {/* Attachment hole */}
          <circle cx="20" cy="1.5" r="1.3" fill="white" />
        </svg>
      );

    case 'pauldron':
      // Simplified Pauldron: curved shoulder armor with neck cutout
      return (
        <svg {...common} viewBox="-1 -2 42 34">
          <path d={
            `M6 0 C12 -1, 24 -1.5, 36 1.5 ` +
            `C40 4.5, 41 12, 38 18 ` +
            `C35 24, 30 28, 22 30 ` +
            `C16 31, 10 30, 5 27 ` +
            `C1 22, -1 15, 0 9 ` +
            `C1 4.5, 3 1.5, 6 0Z`
          } fill={fill} />
          {/* Shoulder ridge score */}
          <path d="M8 3 C16 1.5, 24 1.5, 34 4" stroke="white" strokeWidth="0.6" fill="none" opacity="0.6" />
          {/* Attachment hole */}
          <circle cx="10" cy="4.5" r="1.3" fill="white" />
        </svg>
      );

    case 'cloak':
      // Simplified Cloak: large vertical teardrop with flowing sides
      return (
        <svg {...common} viewBox="0 0 40 50">
          <path d={
            `M20 1 ` +
            `Q27 10, 27.5 25 ` +
            `Q25.5 40, 20 48 ` +
            `Q14.5 40, 12.5 25 ` +
            `Q13 10, 20 1Z`
          } fill={fill} />
          {/* Neck holes */}
          <circle cx="18" cy="4" r="1.2" fill="white" />
          <circle cx="22" cy="4" r="1.2" fill="white" />
        </svg>
      );

    case 'sail':
      // Simplified Sail: rectangle with rounded corners and 4 grommet circles
      return (
        <svg {...common} viewBox="0 0 32 32">
          <rect x="1" y="1" width="30" height="30" rx="2" fill={fill} />
          {/* Grommets */}
          <circle cx="5" cy="5" r="2" fill="white" />
          <circle cx="27" cy="5" r="2" fill="white" />
          <circle cx="5" cy="27" r="2" fill="white" />
          <circle cx="27" cy="27" r="2" fill="white" />
          {/* Score crosshairs at grommets */}
          {[{x:5,y:5},{x:27,y:5},{x:5,y:27},{x:27,y:27}].map((g, i) => (
            <g key={i} opacity="0.4">
              <line x1={g.x-3} y1={g.y} x2={g.x+3} y2={g.y} stroke="white" strokeWidth="0.4" />
              <line x1={g.x} y1={g.y-3} x2={g.x} y2={g.y+3} stroke="white" strokeWidth="0.4" />
            </g>
          ))}
        </svg>
      );

    default:
      return <span className="text-2xl">📐</span>;
  }
}

const ELEMENTS: Array<{ type: ElementType; label: string; wip?: boolean }> = [
  // Developed element types first
  { type: 'cape', label: 'Cape' },
  { type: 'flag', label: 'Flag' },
  { type: 'sail', label: 'Sail' },
  // In development
  { type: 'kama', label: 'Kama/Skirt', wip: true },
  { type: 'banner', label: 'Banner', wip: true },
  { type: 'wings', label: 'Wings', wip: true },
  { type: 'pauldron', label: 'Pauldron', wip: true },
  { type: 'cloak', label: 'Cloak', wip: true },
];

export default function ElementSelector() {
  const { elementType, setElementType, setTemplateVariant, setParameter } = useEditorStore();

  // Default dimensions per element type / variant
  const ELEMENT_DEFAULTS: Record<string, { width: number; length: number }> = {
    'cape': { width: 40, length: 39 },
    'flag:small-flag': { width: 22, length: 60 },
    'flag:large-flag': { width: 40, length: 64 },
    'cloak': { width: 40, length: 60 },
    'banner': { width: 40, length: 50 },
    'wings': { width: 60, length: 50 },
    'kama': { width: 40, length: 20 },
    'pauldron': { width: 40, length: 30 },
    'sail': { width: 60, length: 60 },
  };

  function applyDefaults(type: string, variant: string) {
    const key = `${type}:${variant}`;
    const dims = ELEMENT_DEFAULTS[key] || ELEMENT_DEFAULTS[type] || { width: 40, length: 40 };
    setParameter('width', dims.width);
    setParameter('length', dims.length);
  }

  const handleElementChange = (type: ElementType) => {
    setElementType(type);
    
    // Set appropriate default template variant
    const variants: Record<ElementType, string> = {
      cape: 'standard',
      cloak: 'hooded',
      flag: 'small-flag',
      banner: 'swallowtail',
      wings: 'small-wings',
      kama: 'wrap-skirt',
      pauldron: 'shoulder-armor',
      sail: 'square-sail',
    };
    const variant = variants[type];
    setTemplateVariant(variant as any);
    applyDefaults(type, variant);
  };

  return (
    <div className="panel h-full">
      <div className="panel-header">Element Type</div>
      <div className="space-y-2">
        {ELEMENTS.map((elem) => (
          <button
            key={elem.type}
            onClick={() => handleElementChange(elem.type)}
            className={`w-full p-3 rounded-lg text-left transition-colors flex items-center gap-3 ${
              elementType === elem.type
                ? 'bg-blue-100 border-2 border-blue-500 text-blue-900'
                : elem.wip
                  ? 'bg-gray-50 border-2 border-transparent hover:bg-gray-100 opacity-60'
                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
            }`}
          >
            <ElementIcon type={elem.type} className={`w-8 h-8 flex-shrink-0 ${
              elementType === elem.type ? 'text-blue-700' : 'text-gray-500'
            }`} />
            <div className="flex flex-col">
              <span className="font-medium text-sm">{elem.label}</span>
              {elem.wip && <span className="text-[10px] text-amber-600 font-semibold leading-tight">IN DEVELOPMENT</span>}
            </div>
          </button>
        ))}
      </div>

      <div className="panel-section mt-6 pt-4 border-t border-gray-200">
        <div className="panel-section-title">Element Variants</div>
        <ElementVariantSelector />
      </div>
    </div>
  );
}

function ElementVariantSelector() {
  const { elementType, templateVariant, setTemplateVariant, setParameter } = useEditorStore();

  const VARIANT_DEFAULTS: Record<string, { width: number; length: number }> = {
    'small-flag': { width: 22, length: 60 },
    'large-flag': { width: 40, length: 64 },
  };

  const variants: Record<ElementType, Array<{ value: string; label: string }>> = {
    cape: [
      { value: 'standard', label: 'Standard' },
    ],
    cloak: [
      { value: 'hooded', label: 'Hooded' },
      { value: 'standard', label: 'Simple' },
    ],
    flag: [
      { value: 'small-flag', label: 'Small Flag' },
      { value: 'large-flag', label: 'Large Flag' },
    ],
    banner: [
      { value: 'swallowtail', label: 'Swallowtail' },
      { value: 'standard', label: 'Simple' },
    ],
    wings: [
      { value: 'small-wings', label: 'Small Wings' },
      { value: 'large-wings', label: 'Large Wings' },
    ],
    kama: [
      { value: 'wrap-skirt', label: 'Wrap Skirt' },
    ],
    pauldron: [
      { value: 'shoulder-armor', label: 'Shoulder Armor' },
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
            setTemplateVariant(variant.value as any);
            const dims = VARIANT_DEFAULTS[variant.value];
            if (dims) {
              setParameter('width', dims.width);
              setParameter('length', dims.length);
            }
          }}
          className={`w-full p-2 rounded text-sm transition-colors ${
            templateVariant === variant.value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          {variant.label}
        </button>
      ))}
    </div>
  );
}
