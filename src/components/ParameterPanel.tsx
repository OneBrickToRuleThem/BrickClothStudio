/**
 * Parameter Panel Component
 * Controls pattern dimensions, hole settings, and decorations
 */

import React from 'react';
import { useEditorStore } from '../store/editor';
import { DEFAULT_SLIT_WIDTH, HOLE_STANDARDS, DEFAULT_HOLE_TYPE } from '../utils/constants';

export default function ParameterPanel() {
  const { parameters, setParameter, addDecoration } = useEditorStore();

  return (
    <div className="p-4 h-full overflow-y-auto">
      <div className="space-y-4">
        {/* Dimensions Section */}
        <section className="panel-section">
          <h3 className="panel-section-title">Dimensions</h3>
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

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={parameters.enableSlit as boolean}
                onChange={(e) => setParameter('enableSlit', e.target.checked)}
                className="w-4 h-4"
              />
              <span>Enable keyhole slit</span>
            </label>
            {parameters.enableSlit && (
              <ParameterSlider
                label="Slit Width (mm)"
                name="slitWidth"
                min={0.5}
                max={2}
                step={0.1}
                value={parameters.slitWidth as number}
                onChange={(value) => setParameter('slitWidth', value)}
              />
            )}
          </div>
        </section>

        {/* Advanced Section */}
        <section className="panel-section border-t pt-4">
          <h3 className="panel-section-title">Advanced</h3>
          <div className="space-y-2">
            <ParameterSlider
              label="Seed (for tattered)"
              name="seed"
              min={1}
              max={99999}
              step={1}
              value={parameters.seed as number}
              onChange={(value) => setParameter('seed', value)}
            />
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
