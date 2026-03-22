/**
 * Decoration Panel Component — standalone panel for managing decorations.
 * Lives in its own tab alongside Parameters and Export.
 */

import React, { useState, useRef } from 'react';
import { useEditorStore } from '../store/editor';
import type { DecorationType } from '../utils/types';

export default function DecorationPanel() {
  const { decorations, selectedDecorationId, addDecoration, updateDecoration, removeDecoration, selectDecoration, parameters, setParameter } = useEditorStore();
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

  const selected = decorations.find(d => d.id === selectedDecorationId);

  // Color split helpers
  const splitCount = (parameters.colorSplitCount as number) || 0;
  const splitAngle = (parameters.colorSplitAngle as number) || 0;
  const splitColorsRaw = (parameters.colorSplitColors as string) || '[]';
  let splitColors: string[] = [];
  try { splitColors = JSON.parse(splitColorsRaw); } catch { splitColors = []; }
  const DEFAULT_PALETTE = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

  function ensureColors(count: number): string[] {
    const colors = [...splitColors];
    while (colors.length < count) colors.push(DEFAULT_PALETTE[colors.length % DEFAULT_PALETTE.length]);
    return colors.slice(0, count);
  }

  function setSplitColor(index: number, color: string) {
    const colors = ensureColors(splitCount);
    colors[index] = color;
    setParameter('colorSplitColors', JSON.stringify(colors));
  }

  // Stripe color helpers
  const stripeColorCount = (parameters.stripeColorCount as number) || 2;
  const stripeColorsRaw = (parameters.stripeColors as string) || '["#1a1a8a","#c0c0c0"]';
  let stripeColorsList: string[] = [];
  try { stripeColorsList = JSON.parse(stripeColorsRaw); } catch { stripeColorsList = ['#1a1a8a', '#c0c0c0']; }
  const STRIPE_PALETTE = ['#1a1a8a', '#c0c0c0', '#8a1a1a', '#1a8a1a'];

  function ensureStripeColors(count: number): string[] {
    const colors = [...stripeColorsList];
    while (colors.length < count) colors.push(STRIPE_PALETTE[colors.length % STRIPE_PALETTE.length]);
    return colors.slice(0, count);
  }

  function setStripeColor(index: number, color: string) {
    const colors = ensureStripeColors(stripeColorCount);
    colors[index] = color;
    setParameter('stripeColors', JSON.stringify(colors));
  }

  return (
    <div className="p-4 space-y-4">
      {/* ─── Color Fill Design ─── */}
      <section className="border-b pb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Color Fill</h3>
        <div className="space-y-2">
          <div>
            <label className="text-xs text-gray-600 block mb-1">Sections</label>
            <select className="w-full border rounded px-2 py-1 text-xs"
              value={splitCount}
              onChange={(e) => {
                const count = parseInt(e.target.value) || 0;
                setParameter('colorSplitCount', count);
                if (count > 0) {
                  const colors = ensureColors(count);
                  setParameter('colorSplitColors', JSON.stringify(colors));
                }
              }}>
              <option value={0}>Off</option>
              <option value={1}>1 — Solid fill</option>
              <option value={2}>2 — Half split</option>
              <option value={3}>3 — Thirds</option>
              <option value={4}>4 — Quarters</option>
              <option value={5}>5 — Fifths</option>
              <option value={6}>6 — Sixths</option>
            </select>
          </div>

          {splitCount >= 1 && (
            <>
              {splitCount >= 2 && (
                <div>
                  <label className="text-xs text-gray-600 block mb-1">Rotation</label>
                  <div className="flex items-center gap-2">
                    <input type="range" min={0} max={360} step={1} className="flex-1"
                      value={splitAngle}
                      onChange={(e) => setParameter('colorSplitAngle', parseFloat(e.target.value))} />
                    <input type="number" min={0} max={360} step={1}
                      className="w-14 border rounded px-1 py-0.5 text-xs text-center"
                      value={splitAngle}
                      onChange={(e) => {
                        let v = parseFloat(e.target.value) || 0;
                        v = ((v % 360) + 360) % 360;
                        setParameter('colorSplitAngle', v);
                      }} />
                    <span className="text-[10px] text-gray-400">°</span>
                  </div>
                </div>
              )}
              <div className="space-y-1">
                <label className="text-xs text-gray-600">Colors</label>
                <div className="grid grid-cols-3 gap-1">
                  {ensureColors(splitCount).map((color, i) => (
                    <label key={i} className="flex items-center gap-1">
                      <input type="color" value={color}
                        onChange={(e) => setSplitColor(i, e.target.value)}
                        className="w-5 h-5 rounded border border-gray-300 cursor-pointer" />
                      <span className="text-[10px] text-gray-500">{i + 1}</span>
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── Stripe Design ─── */}
      <section className="border-b pb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Stripes</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox"
              checked={!!parameters.stripeEnabled}
              onChange={(e) => setParameter('stripeEnabled', e.target.checked)}
              className="w-3.5 h-3.5" />
            <span className="text-xs text-gray-700">Enable stripes</span>
          </label>

          {!!parameters.stripeEnabled && (
            <>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Colors</label>
                <select className="w-full border rounded px-2 py-1 text-xs mb-1"
                  value={stripeColorCount}
                  onChange={(e) => {
                    const count = parseInt(e.target.value) || 2;
                    setParameter('stripeColorCount', count);
                    const colors = ensureStripeColors(count);
                    setParameter('stripeColors', JSON.stringify(colors));
                  }}>
                  <option value={2}>2 colors — alternating</option>
                  <option value={3}>3 colors — alternating</option>
                  <option value={4}>4 colors — alternating</option>
                </select>
                <div className="grid grid-cols-4 gap-1">
                  {ensureStripeColors(stripeColorCount).map((color, i) => (
                    <label key={i} className="flex items-center gap-1">
                      <input type="color" value={color}
                        onChange={(e) => setStripeColor(i, e.target.value)}
                        className="w-5 h-5 rounded border border-gray-300 cursor-pointer" />
                      <span className="text-[10px] text-gray-500">{i + 1}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">
                  Stripe width: {((parameters.stripeWidth as number) || 3).toFixed(1)}mm
                </label>
                <input type="range" min={0.5} max={15} step={0.5} className="w-full"
                  value={(parameters.stripeWidth as number) || 3}
                  onChange={(e) => setParameter('stripeWidth', parseFloat(e.target.value))} />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">Angle</label>
                <div className="flex items-center gap-2">
                  <input type="range" min={0} max={180} step={1} className="flex-1"
                    value={(parameters.stripeAngle as number) || 0}
                    onChange={(e) => setParameter('stripeAngle', parseFloat(e.target.value))} />
                  <input type="number" min={0} max={180} step={1}
                    className="w-14 border rounded px-1 py-0.5 text-xs text-center"
                    value={(parameters.stripeAngle as number) || 0}
                    onChange={(e) => {
                      let v = parseFloat(e.target.value) || 0;
                      v = Math.max(0, Math.min(180, v));
                      setParameter('stripeAngle', v);
                    }} />
                  <span className="text-[10px] text-gray-400">°</span>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── Edge Color Band ─── */}
      <section className="border-b pb-4">
        <h3 className="text-sm font-semibold text-gray-700 mb-2">Edge Color</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox"
              checked={!!parameters.edgeColorEnabled}
              onChange={(e) => setParameter('edgeColorEnabled', e.target.checked)}
              className="w-3.5 h-3.5" />
            <span className="text-xs text-gray-700">Enable edge color band</span>
          </label>

          {!!parameters.edgeColorEnabled && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-xs text-gray-600">Color</label>
                <input type="color" value={(parameters.edgeColor as string) || '#8B4513'}
                  onChange={(e) => setParameter('edgeColor', e.target.value)}
                  className="w-6 h-6 rounded border border-gray-300 cursor-pointer" />
              </div>
              <div>
                <label className="text-xs text-gray-600 block mb-1">
                  Width inward: {((parameters.edgeColorWidth as number) || 2).toFixed(1)}mm
                </label>
                <input type="range" min={0.5} max={10} step={0.5} className="w-full"
                  value={(parameters.edgeColorWidth as number) || 2}
                  onChange={(e) => setParameter('edgeColorWidth', parseFloat(e.target.value))} />
              </div>
            </>
          )}
        </div>
      </section>

      {/* ─── Decorations ─── */}
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
