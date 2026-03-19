/**
 * Parameter Panel Component
 * Controls pattern dimensions, hole settings, and decorations
 */

import React, { useState } from 'react';
import { useEditorStore } from '../store/editor';
import { DEFAULT_SLIT_WIDTH, HOLE_STANDARDS, DEFAULT_HOLE_TYPE } from '../utils/constants';

export default function ParameterPanel() {
  const { parameters, setParameter, resetToDefaults } = useEditorStore();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    transformations: false,
    attachment: false,
    hemStyle: false,
    sideStyle: false,
    cutsDetails: false,
  });

  function toggleSection(key: string) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // Summary labels for collapsed sections
  const activeHem = parameters.tattered ? 'Tattered'
    : parameters.scalloped && !parameters.scallopInverted ? 'Scalloped'
    : parameters.scalloped && parameters.scallopInverted ? 'Arched'
    : parameters.fishtail ? 'Notched'
    : parameters.pointed ? 'Pointed'
    : parameters.zigzag ? 'Zigzag'
    : parameters.wavy ? 'Wavy'
    : parameters.castellated ? 'Castellated'
    : parameters.dovetail ? 'Dovetail'
    : parameters.flame ? 'Flame'
    : parameters.stepped ? 'Stepped'
    : 'None';
  const activeSide = (parameters.sideStyle as string || 'none') === 'none' ? 'None' : (parameters.sideStyle as string);
  const activeCuts = [
    parameters.swordSlit && 'Sword slit',
    parameters.armSlits && 'Arm slits',
    parameters.starHoles && 'Worn holes',
  ].filter(Boolean).join(', ') || 'None';

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

        {/* Transformations Section */}
        <section className="panel-section border-t pt-4">
          <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('transformations')}>
            <h3 className="panel-section-title">Transformations</h3>
            <span className="text-gray-400 text-xs">{openSections.transformations ? '▾' : '▸'}</span>
          </button>
          {openSections.transformations && (
          <div className="space-y-3 mt-2">
            <ParameterSlider
              label="Hem width"
              name="hemWidth"
              min={0.5}
              max={1.5}
              step={0.05}
              value={parameters.hemWidth as number || 1.0}
              onChange={(value) => setParameter('hemWidth', value)}
            />
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={parameters.rounding as boolean}
                  onChange={(e) => setParameter('rounding', e.target.checked)} className="w-4 h-4" />
                <span>Rounding</span>
              </label>
              {parameters.rounding && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Amount" name="roundingAmount"
                    min={0.1} max={1.0} step={0.05}
                    value={parameters.roundingAmount as number || 0.5}
                    onChange={(v) => setParameter('roundingAmount', v)} />
                </div>
              )}
            </div>
          </div>
          )}
        </section>

        {/* Attachment Hole Section */}
        <section className="panel-section border-t pt-4">
          <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('attachment')}>
            <h3 className="panel-section-title">Attachment Hole</h3>
            <span className="text-gray-400 text-xs">{openSections.attachment ? '▾' : '▸'}</span>
          </button>
          {openSections.attachment && (
          <div className="space-y-2 mt-2">
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
          )}
        </section>

        {/* Hem Style Section — only one can be active */}
        <section className="panel-section border-t pt-4">
          <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('hemStyle')}>
            <h3 className="panel-section-title">Hem Style</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{activeHem}</span>
              <span className="text-gray-400 text-xs">{openSections.hemStyle ? '▾' : '▸'}</span>
            </div>
          </button>
          {openSections.hemStyle && (
          <div className="mt-2">
          <p className="text-xs text-gray-500 mb-2">Choose one hem modification</p>
          <div className="space-y-3">

            {/* None */}
            <label className="flex items-center gap-2 text-sm">
              <input type="radio" name="hemStyle" className="w-4 h-4"
                checked={!parameters.tattered && !parameters.scalloped && !parameters.fishtail && !parameters.pointed && !parameters.zigzag && !parameters.wavy && !parameters.castellated && !parameters.dovetail && !parameters.flame && !parameters.stepped}
                onChange={() => { setParameter('tattered', false); setParameter('scalloped', false); setParameter('fishtail', false); setParameter('pointed', false); setParameter('zigzag', false); setParameter('wavy', false); setParameter('castellated', false); setParameter('dovetail', false); setParameter('flame', false); setParameter('stepped', false); }} />
              <span>None</span>
            </label>

            {/* Tattered */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="hemStyle" className="w-4 h-4"
                  checked={parameters.tattered as boolean}
                  onChange={() => { setParameter('tattered', true); setParameter('scalloped', false); setParameter('fishtail', false); setParameter('pointed', false); setParameter('zigzag', false); setParameter('wavy', false); setParameter('castellated', false); setParameter('dovetail', false); setParameter('flame', false); setParameter('stepped', false); }} />
                <span>Tattered</span>
              </label>
              {parameters.tattered && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Intensity" name="tatteredIntensity"
                    min={0.02} max={0.12} step={0.01}
                    value={parameters.tatteredIntensity as number || 0.06}
                    onChange={(v) => setParameter('tatteredIntensity', v)} />
                  <label className="flex items-center gap-2 text-sm mt-1">
                    <input type="checkbox" className="w-4 h-4"
                      checked={parameters.tatteredSymmetric !== false}
                      onChange={(e) => setParameter('tatteredSymmetric', e.target.checked)} />
                    <span>Symmetric</span>
                  </label>
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
                <input type="radio" name="hemStyle" className="w-4 h-4"
                  checked={parameters.scalloped as boolean && !parameters.scallopInverted}
                  onChange={() => { setParameter('scalloped', true); setParameter('scallopInverted', false); setParameter('tattered', false); setParameter('fishtail', false); setParameter('pointed', false); setParameter('zigzag', false); setParameter('wavy', false); setParameter('castellated', false); setParameter('dovetail', false); setParameter('flame', false); setParameter('stepped', false); }} />
                <span>Scalloped</span>
              </label>
              {parameters.scalloped && !parameters.scallopInverted && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Scallops" name="scallopCount"
                    min={4} max={16} step={1}
                    value={parameters.scallopCount as number || 8}
                    onChange={(v) => setParameter('scallopCount', v)} />
                  <ParameterSlider label="Depth (mm)" name="scallopDepth"
                    min={1} max={20} step={0.5}
                    value={parameters.scallopDepth as number || 3}
                    onChange={(v) => setParameter('scallopDepth', v)} />
                </div>
              )}
            </div>

            {/* Arched (inverted scallop) */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="hemStyle" className="w-4 h-4"
                  checked={parameters.scalloped as boolean && parameters.scallopInverted as boolean}
                  onChange={() => { setParameter('scalloped', true); setParameter('scallopInverted', true); setParameter('tattered', false); setParameter('fishtail', false); setParameter('pointed', false); setParameter('zigzag', false); setParameter('wavy', false); setParameter('castellated', false); setParameter('dovetail', false); setParameter('flame', false); setParameter('stepped', false); }} />
                <span>Arched</span>
              </label>
              {parameters.scalloped && parameters.scallopInverted && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Arches" name="scallopCount"
                    min={2} max={16} step={1}
                    value={parameters.scallopCount as number || 8}
                    onChange={(v) => setParameter('scallopCount', v)} />
                  <ParameterSlider label="Depth (mm)" name="scallopDepth"
                    min={1} max={20} step={0.5}
                    value={parameters.scallopDepth as number || 3}
                    onChange={(v) => setParameter('scallopDepth', v)} />
                </div>
              )}
            </div>

            {/* Notched */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="hemStyle" className="w-4 h-4"
                  checked={parameters.fishtail as boolean}
                  onChange={() => { setParameter('fishtail', true); setParameter('tattered', false); setParameter('scalloped', false); setParameter('pointed', false); setParameter('zigzag', false); setParameter('wavy', false); setParameter('castellated', false); setParameter('dovetail', false); setParameter('flame', false); setParameter('stepped', false); }} />
                <span>Notched</span>
              </label>
              {parameters.fishtail && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Notches" name="fishtailNotches"
                    min={1} max={5} step={1}
                    value={parameters.fishtailNotches as number || 3}
                    onChange={(v) => setParameter('fishtailNotches', v)} />
                  <ParameterSlider label="Depth (%)" name="fishtailDepth"
                    min={0.05} max={0.65} step={0.05}
                    value={parameters.fishtailDepth as number || 0.15}
                    onChange={(v) => setParameter('fishtailDepth', v)} />
                </div>
              )}
            </div>

            {/* Pointed */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="hemStyle" className="w-4 h-4"
                  checked={parameters.pointed as boolean}
                  onChange={() => { setParameter('pointed', true); setParameter('tattered', false); setParameter('scalloped', false); setParameter('fishtail', false); setParameter('zigzag', false); setParameter('wavy', false); setParameter('castellated', false); setParameter('dovetail', false); setParameter('flame', false); setParameter('stepped', false); }} />
                <span>Pointed</span>
              </label>
              {parameters.pointed && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Depth" name="pointedDepth"
                    min={0.1} max={0.6} step={0.05}
                    value={parameters.pointedDepth as number || 0.3}
                    onChange={(v) => setParameter('pointedDepth', v)} />
                </div>
              )}
            </div>

            {/* Zigzag */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="hemStyle" className="w-4 h-4"
                  checked={parameters.zigzag as boolean}
                  onChange={() => { setParameter('zigzag', true); setParameter('tattered', false); setParameter('scalloped', false); setParameter('fishtail', false); setParameter('pointed', false); setParameter('wavy', false); setParameter('castellated', false); setParameter('dovetail', false); setParameter('flame', false); setParameter('stepped', false); }} />
                <span>Zigzag</span>
              </label>
              {parameters.zigzag && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Points" name="zigzagCount"
                    min={3} max={20} step={1}
                    value={parameters.zigzagCount as number || 10}
                    onChange={(v) => setParameter('zigzagCount', v)} />
                  <ParameterSlider label="Depth (mm)" name="zigzagDepth"
                    min={1} max={15} step={0.5}
                    value={parameters.zigzagDepth as number || 4}
                    onChange={(v) => setParameter('zigzagDepth', v)} />
                </div>
              )}
            </div>

            {/* Wavy */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="hemStyle" className="w-4 h-4"
                  checked={parameters.wavy as boolean}
                  onChange={() => { setParameter('wavy', true); setParameter('tattered', false); setParameter('scalloped', false); setParameter('fishtail', false); setParameter('pointed', false); setParameter('zigzag', false); setParameter('castellated', false); setParameter('dovetail', false); setParameter('flame', false); setParameter('stepped', false); }} />
                <span>Wavy</span>
              </label>
              {parameters.wavy && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Waves" name="wavyCount"
                    min={2} max={12} step={1}
                    value={parameters.wavyCount as number || 6}
                    onChange={(v) => setParameter('wavyCount', v)} />
                  <ParameterSlider label="Depth (mm)" name="wavyDepth"
                    min={1} max={10} step={0.5}
                    value={parameters.wavyDepth as number || 3}
                    onChange={(v) => setParameter('wavyDepth', v)} />
                </div>
              )}
            </div>

            {/* Castellated */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="hemStyle" className="w-4 h-4"
                  checked={parameters.castellated as boolean}
                  onChange={() => { setParameter('castellated', true); setParameter('tattered', false); setParameter('scalloped', false); setParameter('fishtail', false); setParameter('pointed', false); setParameter('zigzag', false); setParameter('wavy', false); setParameter('dovetail', false); setParameter('flame', false); setParameter('stepped', false); }} />
                <span>Castellated</span>
              </label>
              {parameters.castellated && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Merlons" name="castellatedCount"
                    min={3} max={16} step={1}
                    value={parameters.castellatedCount as number || 8}
                    onChange={(v) => setParameter('castellatedCount', v)} />
                  <ParameterSlider label="Depth (mm)" name="castellatedDepth"
                    min={1} max={15} step={0.5}
                    value={parameters.castellatedDepth as number || 3}
                    onChange={(v) => setParameter('castellatedDepth', v)} />
                </div>
              )}
            </div>

            {/* Dovetail */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="hemStyle" className="w-4 h-4"
                  checked={parameters.dovetail as boolean}
                  onChange={() => { setParameter('dovetail', true); setParameter('tattered', false); setParameter('scalloped', false); setParameter('fishtail', false); setParameter('pointed', false); setParameter('zigzag', false); setParameter('wavy', false); setParameter('castellated', false); setParameter('flame', false); setParameter('stepped', false); }} />
                <span>Dovetail</span>
              </label>
              {parameters.dovetail && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Depth" name="dovetailDepth"
                    min={0.1} max={0.5} step={0.05}
                    value={parameters.dovetailDepth as number || 0.25}
                    onChange={(v) => setParameter('dovetailDepth', v)} />
                  <ParameterSlider label="Width" name="dovetailWidth"
                    min={0.1} max={0.6} step={0.05}
                    value={parameters.dovetailWidth as number || 0.3}
                    onChange={(v) => setParameter('dovetailWidth', v)} />
                </div>
              )}
            </div>

            {/* Flame */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="hemStyle" className="w-4 h-4"
                  checked={parameters.flame as boolean}
                  onChange={() => { setParameter('flame', true); setParameter('tattered', false); setParameter('scalloped', false); setParameter('fishtail', false); setParameter('pointed', false); setParameter('zigzag', false); setParameter('wavy', false); setParameter('castellated', false); setParameter('dovetail', false); setParameter('stepped', false); }} />
                <span>Flame</span>
              </label>
              {parameters.flame && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Flames" name="flameCount"
                    min={3} max={10} step={1}
                    value={parameters.flameCount as number || 5}
                    onChange={(v) => setParameter('flameCount', v)} />
                  <ParameterSlider label="Depth (mm)" name="flameDepth"
                    min={2} max={20} step={1}
                    value={parameters.flameDepth as number || 6}
                    onChange={(v) => setParameter('flameDepth', v)} />
                </div>
              )}
            </div>

            {/* Stepped */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="radio" name="hemStyle" className="w-4 h-4"
                  checked={parameters.stepped as boolean}
                  onChange={() => { setParameter('stepped', true); setParameter('tattered', false); setParameter('scalloped', false); setParameter('fishtail', false); setParameter('pointed', false); setParameter('zigzag', false); setParameter('wavy', false); setParameter('castellated', false); setParameter('dovetail', false); setParameter('flame', false); }} />
                <span>Stepped</span>
              </label>
              {parameters.stepped && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Steps" name="steppedCount"
                    min={2} max={10} step={1}
                    value={parameters.steppedCount as number || 5}
                    onChange={(v) => setParameter('steppedCount', v)} />
                  <ParameterSlider label="Depth (mm)" name="steppedDepth"
                    min={1} max={15} step={0.5}
                    value={parameters.steppedDepth as number || 4}
                    onChange={(v) => setParameter('steppedDepth', v)} />
                </div>
              )}
            </div>

          </div>
          </div>
          )}
        </section>

        {/* Side Style Section */}
        <section className="panel-section border-t pt-4">
          <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('sideStyle')}>
            <h3 className="panel-section-title">Side Style</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 capitalize">{activeSide}</span>
              <span className="text-gray-400 text-xs">{openSections.sideStyle ? '▾' : '▸'}</span>
            </div>
          </button>
          {openSections.sideStyle && (
          <div className="mt-2">
          <p className="text-xs text-gray-500 mb-2">Modify the left and right edges</p>
          <div className="space-y-2">
            {(['none', 'tattered', 'scalloped', 'zigzag', 'wavy', 'castellated', 'serrated', 'fringed', 'thorned'] as const).map((style) => (
              <label key={style} className="flex items-center gap-2 text-sm">
                <input type="radio" name="sideStyle" className="w-4 h-4"
                  checked={(parameters.sideStyle as string || 'none') === style}
                  onChange={() => setParameter('sideStyle', style)} />
                <span className="capitalize">{style}</span>
              </label>
            ))}
            {(parameters.sideStyle as string || 'none') !== 'none' && (
              <div className="ml-6 mt-1 space-y-1">
                <ParameterSlider label="Depth (mm)" name="sideStyleDepth"
                  min={0.5} max={8} step={0.5}
                  value={parameters.sideStyleDepth as number || 3}
                  onChange={(v) => setParameter('sideStyleDepth', v)} />
                <ParameterSlider label="Count" name="sideStyleCount"
                  min={3} max={20} step={1}
                  value={parameters.sideStyleCount as number || 8}
                  onChange={(v) => setParameter('sideStyleCount', v)} />
              </div>
            )}
          </div>
          </div>
          )}
        </section>

        {/* Cuts & Details Section — can be combined freely */}
        <section className="panel-section border-t pt-4">
          <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('cutsDetails')}>
            <h3 className="panel-section-title">Cuts &amp; Details</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{activeCuts}</span>
              <span className="text-gray-400 text-xs">{openSections.cutsDetails ? '▾' : '▸'}</span>
            </div>
          </button>
          {openSections.cutsDetails && (
          <div className="mt-2">
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

            {/* Worn holes */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={parameters.starHoles as boolean}
                  onChange={(e) => setParameter('starHoles', e.target.checked)} className="w-4 h-4" />
                <span>Worn holes</span>
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
          </div>
          )}
        </section>
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
  const decimals = step < 1 ? 2 : 0;
  return (
    <div className="form-group">
      <label className="form-label flex justify-between items-center text-xs">
        <span>{label}</span>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value.toFixed(decimals)}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) onChange(Math.min(max, Math.max(min, v)));
          }}
          className="font-mono bg-gray-100 px-2 py-0.5 rounded w-16 text-right text-xs border border-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
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
