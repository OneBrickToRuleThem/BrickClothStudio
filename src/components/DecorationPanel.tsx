/**
 * Decoration Panel Component — standalone panel for managing decorations.
 * Lives in its own tab alongside Parameters and Export.
 */

import React, { useState, useRef } from 'react';
import { useEditorStore } from '../store/editor';
import type { DecorationType } from '../utils/types';

export default function DecorationPanel() {
  const { decorations, selectedDecorationId, addDecoration, updateDecoration, removeDecoration, selectDecoration, parameters } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleAddImage() {
    fileInputRef.current?.click();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const aspect = img.width / img.height;
        const w = aspect >= 1 ? 20 : 20 * aspect;
        const h = aspect >= 1 ? 20 / aspect : 20;
        addDecoration({
          name: file.name.replace(/\.[^.]+$/, ''),
          type: 'image',
          decorationType: 'engraving',
          data: dataUrl,
          x: 5, y: 5,
          width: w, height: h,
          scale: 1, rotation: 0,
          clipToSilhouette: true,
          visible: true, locked: false,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleAddText() {
    addDecoration({
      name: 'Text',
      type: 'text',
      decorationType: 'engraving',
      data: 'Text',
      x: 5, y: 10,
      width: 20, height: 5,
      scale: 1, rotation: 0,
      fontSize: 4, fontFamily: 'sans-serif',
      clipToSilhouette: true,
      visible: true, locked: false,
    });
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="text-sm font-semibold text-gray-700">Decorations</h3>

      {/* Add buttons */}
      <div className="flex gap-2">
        <button type="button"
          className="flex-1 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded px-2 py-1.5"
          onClick={handleAddImage}>
          + Image
        </button>
        <button type="button"
          className="flex-1 text-xs bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded px-2 py-1.5"
          onClick={handleAddText}>
          + Text
        </button>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
      </div>

      {/* Decoration list */}
      {decorations.length === 0 && (
        <p className="text-xs text-gray-400 italic">No decorations added yet. Use the buttons above to add images or text.</p>
      )}
      {decorations.map((deco) => (
        <div key={deco.id}
          className={`border rounded p-2 text-xs cursor-pointer ${
            selectedDecorationId === deco.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
          }`}
          onClick={() => selectDecoration(selectedDecorationId === deco.id ? null : deco.id)}>
          <div className="flex items-center justify-between">
            <span className="font-medium truncate flex-1">
              {deco.type === 'image' ? '🖼 ' : '📝 '}{deco.name}
            </span>
            <div className="flex items-center gap-1 ml-2">
              <button type="button"
                className="text-gray-400 hover:text-gray-600"
                onClick={(e) => { e.stopPropagation(); updateDecoration(deco.id, { visible: !deco.visible }); }}
                title={deco.visible ? 'Hide' : 'Show'}>
                {deco.visible ? '👁' : '👁‍🗨'}
              </button>
              <button type="button"
                className="text-gray-400 hover:text-red-500"
                onClick={(e) => { e.stopPropagation(); removeDecoration(deco.id); }}
                title="Remove">
                ✕
              </button>
            </div>
          </div>

          {/* Expanded controls when selected */}
          {selectedDecorationId === deco.id && (
            <div className="mt-2 space-y-2 border-t pt-2" onClick={(e) => e.stopPropagation()}>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Output Layer</label>
                <select className="w-full border rounded px-2 py-1 text-xs"
                  value={deco.decorationType}
                  onChange={(e) => updateDecoration(deco.id, { decorationType: e.target.value as any })}>
                  <option value="engraving">Engraving (vector)</option>
                  <option value="rastering">Rastering (raster)</option>
                  <option value="decoration">Decoration (print only)</option>
                </select>
              </div>

              {deco.type === 'text' && (
                <>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Text</label>
                    <input type="text" className="w-full border rounded px-2 py-1 text-xs"
                      value={deco.data}
                      onChange={(e) => updateDecoration(deco.id, { data: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 block mb-1">Font</label>
                    <select className="w-full border rounded px-2 py-1 text-xs"
                      value={deco.fontFamily || 'sans-serif'}
                      onChange={(e) => updateDecoration(deco.id, { fontFamily: e.target.value })}>
                      <option value="sans-serif">Sans-serif</option>
                      <option value="serif">Serif</option>
                      <option value="monospace">Monospace</option>
                      <option value="cursive">Cursive</option>
                      <option value="'Times New Roman', serif">Times New Roman</option>
                      <option value="'Arial', sans-serif">Arial</option>
                      <option value="'Georgia', serif">Georgia</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-600">Font size (mm)</label>
                    <input type="number" min={1} max={20} step={0.5} className="w-full border rounded px-1 py-0.5 text-xs"
                      value={deco.fontSize || 4}
                      onChange={(e) => updateDecoration(deco.id, { fontSize: parseFloat(e.target.value) || 4 })} />
                  </div>
                </>
              )}

              <button type="button"
                className="w-full text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-2 py-1"
                onClick={() => {
                  const patW = (parameters.width as number) || 40;
                  const patH = (parameters.length as number) || 40;
                  const decoW = deco.width * deco.scale;
                  const decoH = deco.height * deco.scale;
                  updateDecoration(deco.id, {
                    x: (patW - decoW) / 2,
                    y: (patH - decoH) / 2,
                  });
                }}>
                Center on pattern
              </button>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">X (mm)</label>
                  <input type="number" className="w-full border rounded px-1 py-0.5 text-xs"
                    value={Math.round(deco.x * 10) / 10} step={0.5}
                    onChange={(e) => updateDecoration(deco.id, { x: parseFloat(e.target.value) || 0 })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Y (mm)</label>
                  <input type="number" className="w-full border rounded px-1 py-0.5 text-xs"
                    value={Math.round(deco.y * 10) / 10} step={0.5}
                    onChange={(e) => updateDecoration(deco.id, { y: parseFloat(e.target.value) || 0 })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">Width (mm)</label>
                  <input type="number" className="w-full border rounded px-1 py-0.5 text-xs"
                    value={Math.round(deco.width * 10) / 10} step={0.5} min={1}
                    onChange={(e) => updateDecoration(deco.id, { width: parseFloat(e.target.value) || 1 })} />
                </div>
                <div>
                  <label className="text-xs text-gray-500">Height (mm)</label>
                  <input type="number" className="w-full border rounded px-1 py-0.5 text-xs"
                    value={Math.round(deco.height * 10) / 10} step={0.5} min={1}
                    onChange={(e) => updateDecoration(deco.id, { height: parseFloat(e.target.value) || 1 })} />
                </div>
              </div>

              <div>
                <label className="text-xs text-gray-600">Rotation (°)</label>
                <input type="range" min={0} max={360} step={5} className="w-full"
                  value={deco.rotation}
                  onChange={(e) => updateDecoration(deco.id, { rotation: parseFloat(e.target.value) })} />
                <span className="text-[10px] text-gray-400">{deco.rotation}°</span>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
