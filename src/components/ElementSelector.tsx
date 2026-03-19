/**
 * Element Type Selector Component
 */

import React from 'react';
import { useEditorStore } from '../store/editor';
import { ElementType } from '../utils/types';

const ELEMENTS: Array<{ type: ElementType; label: string; icon: string; wip?: boolean }> = [
  // Developed element types first
  { type: 'cape', label: 'Cape', icon: '🦸' },
  { type: 'flag', label: 'Flag', icon: '🚩' },
  { type: 'sail', label: 'Sail', icon: '⛵' },
  // In development
  { type: 'kama', label: 'Kama/Skirt', icon: '👗', wip: true },
  { type: 'banner', label: 'Banner', icon: '⚔️', wip: true },
  { type: 'wings', label: 'Wings', icon: '🪽', wip: true },
  { type: 'pauldron', label: 'Pauldron', icon: '🛡️', wip: true },
  { type: 'cloak', label: 'Cloak', icon: '🧙', wip: true },
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
            <span className="text-2xl">{elem.icon}</span>
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
