/**
 * Parameter Panel Component
 * Controls pattern dimensions, hole settings, and decorations
 */

import React from 'react';
import { useEditorStore } from '../store/editor';
import { DEFAULT_SLIT_WIDTH, HOLE_STANDARDS, DEFAULT_HOLE_TYPE } from '../utils/constants';

export default function ParameterPanel() {
  const { parameters, setParameter, addDecoration, resetToDefaults } = useEditorStore();

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="space-y-4">
        {/* Dimensions Section */}
        <section className="panel-section">
          <div className="flex items-center justify-between">
            <h3 className="panel-section-title">Dimensions</h3>
            <button
              onClick={resetToDefaults}
              className="text-xs text-gray-500 hover:text-red-600 underline"
            >
              Reset all
            </button>
          </div>
          <div className="space-y-2">
            <ParameterSlider
              label="Length (mm)"
              name="length"
              min={20}
              max={200}
              value={parameters.length as number}
              onChange={(value) => setParameter('length', value)}
            />
            <ParameterSlider
              label="Width (mm)"
              name="width"
              min={20}
              max={150}
              value={parameters.width as number}
              onChange={(value) => setParameter('width', value)}
            />
          </div>
        </section>

        {/* Attachment Hole Section */}
        <section className="panel-section border-t pt-4">
          <h3 className="panel-section-title">Attachment Hole</h3>
          <div className="space-y-2">
            {/* Hole Type Selector */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hole Type
              </label>
              <select
                value={parameters.holeType as string || DEFAULT_HOLE_TYPE}
                onChange={(e) => {
                  const holeType = e.target.value as keyof typeof HOLE_STANDARDS;
                  setParameter('holeType', holeType);
                  setParameter('holeRadius', HOLE_STANDARDS[holeType].radius);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {Object.entries(HOLE_STANDARDS).map(([key, standard]) => (
                  <option key={key} value={key} title={standard.description}>
                    {standard.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {HOLE_STANDARDS[parameters.holeType as keyof typeof HOLE_STANDARDS || 'minifigure']?.description}
              </p>
            </div>


          </div>
        </section>

        {/* Hem Style Section — only one can be active */}
        <section className="panel-section border-t pt-4">
          <h3 className="panel-section-title">Hem Style</h3>
          <p className="text-xs text-gray-500 mb-2">Choose one hem modification</p>
          <div className="space-y-3">

            {/* Tattered */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={parameters.tattered as boolean}
                  onChange={(e) => setParameter('tattered', e.target.checked)} className="w-4 h-4" />
                <span>Tattered</span>
              </label>
              {parameters.tattered && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Intensity" name="tatteredIntensity"
                    min={0.02} max={0.12} step={0.01}
                    value={parameters.tatteredIntensity as number || 0.06}
                    onChange={(v) => setParameter('tatteredIntensity', v)} />
                  <ParameterSlider label="Seed" name="seed"
                    min={1} max={99999} step={1}
                    value={parameters.seed as number}
                    onChange={(v) => setParameter('seed', v)} />
                </div>
              )}
            </div>

            {/* Scalloped */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={parameters.scalloped as boolean}
                  onChange={(e) => setParameter('scalloped', e.target.checked)} className="w-4 h-4" />
                <span>Scalloped</span>
              </label>
              {parameters.scalloped && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Scallops" name="scallopCount"
                    min={4} max={16} step={1}
                    value={parameters.scallopCount as number || 8}
                    onChange={(v) => setParameter('scallopCount', v)} />
                  <ParameterSlider label="Depth (mm)" name="scallopDepth"
                    min={1} max={8} step={0.5}
                    value={parameters.scallopDepth as number || 3}
                    onChange={(v) => setParameter('scallopDepth', v)} />
                  <label className="flex items-center gap-2 text-sm mt-1">
                    <input type="checkbox" checked={parameters.scallopInverted as boolean}
                      onChange={(e) => setParameter('scallopInverted', e.target.checked)} className="w-4 h-4" />
                    <span>Inverted</span>
                  </label>
                </div>
              )}
            </div>

            {/* Fishtail */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={parameters.fishtail as boolean}
                  onChange={(e) => setParameter('fishtail', e.target.checked)} className="w-4 h-4" />
                <span>Fishtail notch</span>
              </label>
              {parameters.fishtail && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Notches" name="fishtailNotches"
                    min={1} max={5} step={1}
                    value={parameters.fishtailNotches as number || 3}
                    onChange={(v) => setParameter('fishtailNotches', v)} />
                  <ParameterSlider label="Depth (%)" name="fishtailDepth"
                    min={0.05} max={0.35} step={0.05}
                    value={parameters.fishtailDepth as number || 0.15}
                    onChange={(v) => setParameter('fishtailDepth', v)} />
                </div>
              )}
            </div>

            {/* Asymmetric */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={parameters.asymmetric as boolean}
                  onChange={(e) => setParameter('asymmetric', e.target.checked)} className="w-4 h-4" />
                <span>Asymmetric</span>
              </label>
              {parameters.asymmetric && (
                <div className="ml-6 mt-1">
                  <label className="block text-xs text-gray-600 mb-1">Side</label>
                  <select
                    className="w-full rounded border border-gray-300 text-sm py-1 px-2 mb-2"
                    value={parameters.asymmetricSide as string || 'left'}
                    onChange={(e) => setParameter('asymmetricSide', e.target.value)}
                  >
                    <option value="left">Left longer</option>
                    <option value="right">Right longer</option>
                    <option value="both">Both sides</option>
                  </select>
                  <ParameterSlider label="Skew" name="asymmetricSkew"
                    min={0.05} max={0.30} step={0.05}
                    value={parameters.asymmetricSkew as number || 0.15}
                    onChange={(v) => setParameter('asymmetricSkew', v)} />
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Cuts & Details Section — can be combined freely */}
        <section className="panel-section border-t pt-4">
          <h3 className="panel-section-title">Cuts &amp; Details</h3>
          <p className="text-xs text-gray-500 mb-2">These can be combined together</p>
          <div className="space-y-3">

            {/* Sword slit */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={parameters.swordSlit as boolean}
                  onChange={(e) => setParameter('swordSlit', e.target.checked)} className="w-4 h-4" />
                <span>Sword slit</span>
              </label>
              {parameters.swordSlit && (
                <div className="ml-6 mt-1">
                  <div className="form-group mb-1">
                    <label className="block text-xs text-gray-600 mb-1">Side</label>
                    <select
                      value={parameters.swordSide as string || 'right'}
                      onChange={(e) => setParameter('swordSide', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                    >
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </select>
                  </div>
                  <ParameterSlider label="Angle (°)" name="swordAngle"
                    min={0} max={60} step={5}
                    value={parameters.swordAngle as number || 35}
                    onChange={(v) => setParameter('swordAngle', v)} />
                  <ParameterSlider label="Position (%)" name="swordY"
                    min={0.15} max={0.75} step={0.05}
                    value={parameters.swordY as number || 0.45}
                    onChange={(v) => setParameter('swordY', v)} />
                </div>
              )}
            </div>

            {/* Arm slits */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={parameters.armSlits as boolean}
                  onChange={(e) => setParameter('armSlits', e.target.checked)} className="w-4 h-4" />
                <span>Arm slits</span>
              </label>
              {parameters.armSlits && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Position (%)" name="armSlitY"
                    min={0.30} max={0.60} step={0.05}
                    value={parameters.armSlitY as number || 0.35}
                    onChange={(v) => setParameter('armSlitY', v)} />
                  <ParameterSlider label="Length (mm)" name="armSlitLength"
                    min={3} max={12} step={1}
                    value={parameters.armSlitLength as number || 6}
                    onChange={(v) => setParameter('armSlitLength', v)} />
                </div>
              )}
            </div>

            {/* Decorative holes */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={parameters.starHoles as boolean}
                  onChange={(e) => setParameter('starHoles', e.target.checked)} className="w-4 h-4" />
                <span>Decorative holes</span>
              </label>
              {parameters.starHoles && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Count" name="starHoleCount"
                    min={1} max={12} step={1}
                    value={parameters.starHoleCount as number || 5}
                    onChange={(v) => setParameter('starHoleCount', v)} />
                  <ParameterSlider label="Size (mm)" name="starHoleSize"
                    min={0.5} max={4} step={0.5}
                    value={parameters.starHoleSize as number || 1.5}
                    onChange={(v) => setParameter('starHoleSize', v)} />
                </div>
              )}
            </div>

          </div>
        </section>

        {/* Decorations Section */}
        <section className="panel-section border-t pt-4">
          <h3 className="panel-section-title">Decorations</h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.svg';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const text = await file.text();
                    addDecoration({
                      name: file.name.replace('.svg', ''),
                      type: 'svg',
                      data: text,
                      x: 20,
                      y: 20,
                      scale: 1,
                      rotation: 0,
                      clipToSilhouette: true,
                      visible: true,
                      locked: false,
                    });
                  }
                };
                input.click();
              }}
              className="btn btn-secondary w-full text-xs"
            >
              + Import SVG
            </button>
            <button
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = 'image/*';
                input.onchange = async (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      addDecoration({
                        name: file.name,
                        type: 'image',
                        data: ev.target?.result as string,
                        x: 20,
                        y: 20,
                        scale: 1,
                        rotation: 0,
                        clipToSilhouette: false,
                        visible: true,
                        locked: false,
                      });
                    };
                    reader.readAsDataURL(file);
                  }
                };
                input.click();
              }}
              className="btn btn-secondary w-full text-xs"
            >
              + Import Image
            </button>
          </div>
        </section>

        {/* Info Section */}
        <section className="panel-section border-t pt-4 text-xs text-gray-600">
          <p className="font-semibold mb-1">LEGO Standards:</p>
          <p>• Minifigure: {HOLE_STANDARDS.minifigure.diameter}mm hole</p>
          <p>• Minidoll: {HOLE_STANDARDS.minidoll.diameter}mm hole</p>
          <p className="font-semibold mb-1 mt-2">Scale Reference:</p>
          <p>• LEGO stud: 4.8 mm diameter</p>
          <p>• Slit: {DEFAULT_SLIT_WIDTH} mm wide</p>
        </section>
      </div>
    </div>
  );
}

interface ParameterSliderProps {
  label: string;
  name: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}

function ParameterSlider({
  label,
  name,
  min,
  max,
  step = 1,
  value,
  onChange,
}: ParameterSliderProps) {
  return (
    <div className="form-group">
      <label className="form-label flex justify-between text-xs">
        <span>{label}</span>
        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded">
          {(value as number).toFixed(step < 1 ? 2 : 0)}
        </span>
      </label>
      <input
        type="range"
        name={name}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}
