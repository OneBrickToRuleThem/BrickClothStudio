/**
 * Element Type Selector Component
 */

import React from 'react';
import { useEditorStore } from '../store/editor';
import { ElementType } from '../utils/types';

const ELEMENTS: Array<{ type: ElementType; label: string; icon: string }> = [
  { type: 'cape', label: 'Cape', icon: '🧥' },
  { type: 'cloak', label: 'Cloak', icon: '🧙' },
  { type: 'flag', label: 'Flag', icon: '🚩' },
  { type: 'banner', label: 'Banner', icon: '🏳️' },
  { type: 'wings', label: 'Wings', icon: '🦅' },
  { type: 'kama', label: 'Kama/Skirt', icon: '👗' },
  { type: 'pauldron', label: 'Pauldron', icon: '⚔️' },
  { type: 'custom', label: 'Custom', icon: '✏️' },
];

export default function ElementSelector() {
  const { elementType, setElementType, setTemplateVariant } = useEditorStore();

  const handleElementChange = (type: ElementType) => {
    setElementType(type);
    
    // Set appropriate default template variant
    const variants: Record<ElementType, string> = {
      cape: 'standard',
      cloak: 'hooded',
      flag: 'standard',
      banner: 'swallowtail',
      wings: 'small-wings',
      kama: 'wrap-skirt',
      pauldron: 'shoulder-armor',
      custom: 'standard',
    };
    setTemplateVariant(variants[type] as any);
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
                : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
            }`}
          >
            <span className="text-2xl">{elem.icon}</span>
            <span className="font-medium text-sm">{elem.label}</span>
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
  const { elementType, templateVariant, setTemplateVariant } = useEditorStore();

  const variants: Record<ElementType, Array<{ value: string; label: string }>> = {
    cape: [
      { value: 'standard', label: 'Standard' },
      { value: 'reference-test', label: 'Reference Test' },
    ],
    cloak: [
      { value: 'hooded', label: 'Hooded' },
      { value: 'standard', label: 'Simple' },
    ],
    flag: [
      { value: 'standard', label: 'Standard' },
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
    custom: [
      { value: 'standard', label: 'Blank' },
    ],
  };

  const currentVariants = variants[elementType] || [];

  return (
    <div className="space-y-2">
      {currentVariants.map((variant) => (
        <button
          key={variant.value}
          onClick={() => setTemplateVariant(variant.value as any)}
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
