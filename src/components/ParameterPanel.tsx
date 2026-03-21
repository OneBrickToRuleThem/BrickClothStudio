/**
 * Parameter Panel Component
 * Controls pattern dimensions, hole settings, and decorations
 */

import React, { useState, useRef } from 'react';
import { useEditorStore } from '../store/editor';
import { HOLE_STANDARDS, DEFAULT_HOLE_TYPE, SAIL_HOLE_STANDARDS, LEGO_GRID_SIZE } from '../utils/constants';
import type { DecorationType } from '../utils/types';

export default function ParameterPanel() {
  const { parameters, setParameter, resetToDefaults, elementType, decorations, addDecoration, updateDecoration, removeDecoration, selectDecoration, selectedDecorationId } = useEditorStore();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    transformations: false,
    attachment: false,
    hemStyle: false,
    sideStyle: false,
    cutsDetails: false,
  });
  const [lockAspect, setLockAspect] = useState(false);

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
              label={elementType === 'flag' ? 'Height (mm)' : 'Length (mm)'}
              name="length"
              min={elementType === 'flag' ? 15 : 20}
              max={elementType === 'flag' ? 80 : 200}
              value={parameters.length as number}
              onChange={(value) => {
                const oldLen = parameters.length as number;
                setParameter('length', value);
                if (lockAspect && oldLen > 0) {
                  const ratio = (parameters.width as number) / oldLen;
                  setParameter('width', Math.round(value * ratio * 2) / 2);
                }
              }}
            />
            <ParameterSlider
              label="Width (mm)"
              name="width"
              min={elementType === 'flag' ? 10 : 20}
              max={elementType === 'flag' ? 60 : 150}
              value={parameters.width as number}
              onChange={(value) => {
                const oldW = parameters.width as number;
                setParameter('width', value);
                if (lockAspect && oldW > 0) {
                  const ratio = (parameters.length as number) / oldW;
                  setParameter('length', Math.round(value * ratio * 2) / 2);
                }
              }}
            />
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="checkbox" checked={lockAspect} onChange={(e) => setLockAspect(e.target.checked)} className="w-3 h-3" />
              <span className="text-xs text-gray-500">Lock aspect ratio</span>
            </label>
          </div>
        </section>

        {elementType === 'flag' && (
          <FlagParameterPanel parameters={parameters} setParameter={setParameter} />
        )}

        {elementType === 'sail' && (
          <SailParameterPanel parameters={parameters} setParameter={setParameter} />
        )}

        {elementType === 'cape' && (
        <>
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
                  <ParameterSlider label="Roundness" name="pointedRoundness"
                    min={0} max={1} step={0.05}
                    value={parameters.pointedRoundness as number ?? 0.4}
                    onChange={(v) => setParameter('pointedRoundness', v)} />
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
          <div className="space-y-3">
            {(['none', 'tattered', 'scalloped', 'zigzag', 'wavy', 'castellated', 'serrated', 'thorned', 'torn'] as const).map((style) => (
              <div key={style}>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="sideStyle" className="w-4 h-4"
                    checked={(parameters.sideStyle as string || 'none') === style}
                    onChange={() => setParameter('sideStyle', style)} />
                  <span className="capitalize">{style}</span>
                </label>
                {(parameters.sideStyle as string || 'none') === style && style !== 'none' && (
                  <div className="ml-6 mt-1">
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
            ))}
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
                  <div className="flex items-center gap-2 mt-1">
                    <label className="text-xs text-gray-600 flex-shrink-0">Seed</label>
                    <input type="number" className="w-20 text-xs border rounded px-1 py-0.5"
                      value={parameters.seed as number || 12345}
                      onChange={(e) => setParameter('seed', parseInt(e.target.value) || 0)} />
                    <button type="button" className="text-xs bg-gray-200 hover:bg-gray-300 rounded px-2 py-0.5"
                      onClick={() => setParameter('seed', Math.floor(Math.random() * 99999))}>
                      🎲 Randomize
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
          </div>
          )}
        </section>
        </>
        )}

        {/* --- Kama / Pauldron Edge Style --- */}
        {(elementType === 'kama' || elementType === 'pauldron') && (
        <section className="panel-section border-t pt-4">
          <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('edgeStyles')}>
            <h3 className="panel-section-title">Edge Style</h3>
            <span className="text-gray-400 text-xs">{openSections.edgeStyles ? '▾' : '▸'}</span>
          </button>
          {openSections.edgeStyles && (
          <div className="mt-2 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Hem Style</label>
              <select className="w-full mt-1 text-xs border rounded px-2 py-1"
                value={(parameters[`${elementType}EdgeStyle`] as string) || 'none'}
                onChange={(e) => setParameter(`${elementType}EdgeStyle`, e.target.value)}>
                <option value="none">none</option>
                <option value="scalloped">scalloped</option>
                <option value="zigzag">zigzag</option>
                <option value="wavy">wavy</option>
                <option value="castellated">castellated</option>
                <option value="torn">torn</option>
              </select>
            </div>
            {(parameters[`${elementType}EdgeStyle`] as string || 'none') !== 'none' && (
            <div className="space-y-2">
              <ParameterSlider label="Depth (mm)" name={`${elementType}EdgeDepth`}
                min={0.5} max={8} step={0.5}
                value={(parameters[`${elementType}EdgeDepth`] as number) || 2}
                onChange={(v) => setParameter(`${elementType}EdgeDepth`, v)} />
              <ParameterSlider label="Count" name={`${elementType}EdgeCount`}
                min={2} max={20} step={1}
                value={(parameters[`${elementType}EdgeCount`] as number) || 6}
                onChange={(v) => setParameter(`${elementType}EdgeCount`, v)} />
            </div>
            )}
          </div>
          )}
        </section>
        )}

        {/* --- Pauldron Rounding --- */}
        {elementType === 'pauldron' && (
        <section className="panel-section border-t pt-4">
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={parameters.pauldronRounding as boolean || false}
                onChange={(e) => setParameter('pauldronRounding', e.target.checked)} className="w-4 h-4" />
              <span className="font-medium">Rounding</span>
            </label>
            {parameters.pauldronRounding && (
              <div className="ml-6">
                <ParameterSlider label="Amount" name="pauldronRoundingAmount"
                  min={0.1} max={1.0} step={0.05}
                  value={(parameters.pauldronRoundingAmount as number) || 0.5}
                  onChange={(v) => setParameter('pauldronRoundingAmount', v)} />
              </div>
            )}
          </div>
        </section>
        )}

        {/* Decorations Section */}
        <DecorationPanel
          decorations={decorations}
          selectedDecorationId={selectedDecorationId}
          addDecoration={addDecoration}
          updateDecoration={updateDecoration}
          removeDecoration={removeDecoration}
          selectDecoration={selectDecoration}
        />

        <section className="panel-section border-t pt-4 text-xs text-gray-600">
          <p className="font-semibold mb-1">Hole Standards:</p>
          <p>• Minifigure: {HOLE_STANDARDS.minifigure.diameter}mm hole</p>
          <p>• Minidoll: {HOLE_STANDARDS.minidoll.diameter}mm hole</p>
          <p className="font-semibold mb-1 mt-2">Scale Reference:</p>
          <p>• Stud: 4.8 mm diameter</p>
        </section>
      </div>
    </div>
  );
}

/**
 * Decoration panel — add/edit image & text decorations with type selection.
 */
function DecorationPanel({
  decorations,
  selectedDecorationId,
  addDecoration,
  updateDecoration,
  removeDecoration,
  selectDecoration,
}: {
  decorations: import('../utils/types').DecorationLayer[];
  selectedDecorationId: string | null;
  addDecoration: (decoration: Omit<import('../utils/types').DecorationLayer, 'id'>) => void;
  updateDecoration: (id: string, updates: Partial<import('../utils/types').DecorationLayer>) => void;
  removeDecoration: (id: string) => void;
  selectDecoration: (id: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
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
        // Default size: fit within 20mm keeping aspect ratio
        const aspect = img.width / img.height;
        const w = aspect >= 1 ? 20 : 20 * aspect;
        const h = aspect >= 1 ? 20 / aspect : 20;
        addDecoration({
          name: file.name.replace(/\.[^.]+$/, ''),
          type: 'image',
          decorationType: 'engraving',
          data: dataUrl,
          x: 5,
          y: 5,
          width: w,
          height: h,
          scale: 1,
          rotation: 0,
          clipToSilhouette: true,
          visible: true,
          locked: false,
        });
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    // Reset input so the same file can be re-selected
    e.target.value = '';
  }

  function handleAddText() {
    addDecoration({
      name: 'Text',
      type: 'text',
      decorationType: 'engraving',
      data: 'Text',
      x: 5,
      y: 10,
      width: 20,
      height: 5,
      scale: 1,
      rotation: 0,
      fontSize: 4,
      fontFamily: 'sans-serif',
      clipToSilhouette: true,
      visible: true,
      locked: false,
    });
  }

  const sel = decorations.find(d => d.id === selectedDecorationId) ?? null;

  return (
    <section className="panel-section border-t pt-4">
      <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => setOpen(!open)}>
        <h3 className="panel-section-title">Decorations</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{decorations.length || 'None'}</span>
          <span className="text-gray-400 text-xs">{open ? '▾' : '▸'}</span>
        </div>
      </button>
      {open && (
        <div className="mt-2 space-y-3">
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
            <p className="text-xs text-gray-400 italic">No decorations added yet</p>
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
                  {/* Decoration type — shown as image-style selector */}
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

                  {/* Text content */}
                  {deco.type === 'text' && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Text</label>
                      <input type="text" className="w-full border rounded px-2 py-1 text-xs"
                        value={deco.data}
                        onChange={(e) => updateDecoration(deco.id, { data: e.target.value })} />
                    </div>
                  )}

                  {/* Text font family (task 1) */}
                  {deco.type === 'text' && (
                    <div>
                      <label className="text-xs font-medium text-gray-600 block mb-1">Font</label>
                      <select className="w-full border rounded px-2 py-1 text-xs"
                        value={deco.fontFamily || 'sans-serif'}
                        onChange={(e) => updateDecoration(deco.id, { fontFamily: e.target.value })}>
                        <option value="sans-serif">Sans-serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                        <option value="cursive">Cursive</option>
                        <option value="fantasy">Fantasy</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                        <option value="'Arial', sans-serif">Arial</option>
                        <option value="'Courier New', monospace">Courier New</option>
                        <option value="'Georgia', serif">Georgia</option>
                        <option value="'Comic Sans MS', cursive">Comic Sans</option>
                      </select>
                    </div>
                  )}

                  {/* Text font size */}
                  {deco.type === 'text' && (
                    <ParameterSlider label="Font size (mm)" name={`fontSize-${deco.id}`}
                      min={1} max={20} step={0.5}
                      value={deco.fontSize || 4}
                      onChange={(v) => updateDecoration(deco.id, { fontSize: v })} />
                  )}

                  {/* Center decoration on pattern (task 2) */}
                  <div>
                    <button type="button"
                      className="w-full text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-2 py-1"
                      onClick={() => {
                        const patW = (useEditorStore.getState().parameters.width as number) || 40;
                        const patH = (useEditorStore.getState().parameters.length as number) || 40;
                        const decoW = deco.width * deco.scale;
                        const decoH = deco.height * deco.scale;
                        updateDecoration(deco.id, {
                          x: (patW - decoW) / 2,
                          y: (patH - decoH) / 2,
                        });
                      }}>
                      Center on pattern
                    </button>
                  </div>

                  {/* Position */}
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

                  {/* Size */}
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

                  {/* Rotation */}
                  <ParameterSlider label="Rotation (°)" name={`rotation-${deco.id}`}
                    min={0} max={360} step={5}
                    value={deco.rotation}
                    onChange={(v) => updateDecoration(deco.id, { rotation: v })} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Sail-specific parameter panel.
 * Edge styles, grommet hole type, grommet positions.
 */
function SailParameterPanel({ parameters, setParameter }: {
  parameters: Record<string, number | string | boolean>;
  setParameter: (key: string, value: number | string | boolean) => void;
}) {
  const { templateVariant } = useEditorStore();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    edgeStyles: true,
    grommets: false,
  });

  function toggleSection(key: string) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const isSquare = templateVariant === 'square-sail';
  const isPolygon = templateVariant === 'polygon-sail';
  const holeType = (parameters.sailHoleType as string) || 'grommet';
  const edgeStyles = ['none', 'scalloped', 'zigzag', 'wavy', 'castellated', 'torn'] as const;

  return (
    <>
      {/* LEGO Stud Sizing */}
      <section className="panel-section border-t pt-4">
        <h3 className="panel-section-title">Stud Sizing</h3>
        <p className="text-[10px] text-gray-500 mb-2">Set dimensions by LEGO stud count ({LEGO_GRID_SIZE}mm per stud)</p>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-1 text-xs">
          <div>
            <label className="text-gray-600">Width (studs)</label>
            <input type="number" min={1} max={32} step={1}
              className="w-full border rounded px-2 py-1 text-xs"
              value={Math.round((parameters.width as number) / LEGO_GRID_SIZE)}
              onChange={(e) => {
                const studs = Math.max(1, parseInt(e.target.value) || 1);
                setParameter('width', studs * LEGO_GRID_SIZE);
              }} />
          </div>
          <div>
            <label className="text-gray-600">Length (studs)</label>
            <input type="number" min={1} max={32} step={1}
              className="w-full border rounded px-2 py-1 text-xs"
              value={Math.round((parameters.length as number) / LEGO_GRID_SIZE)}
              onChange={(e) => {
                const studs = Math.max(1, parseInt(e.target.value) || 1);
                setParameter('length', studs * LEGO_GRID_SIZE);
              }} />
          </div>
        </div>
        <p className="text-[10px] text-gray-400 mt-1">{(parameters.width as number)}×{(parameters.length as number)}mm</p>
      </section>

      {/* Polygon Sides (polygon variant only) */}
      {isPolygon && (
        <section className="panel-section border-t pt-4">
          <h3 className="panel-section-title">Polygon Settings</h3>
          <div className="mt-1 space-y-2">
            <ParameterSlider label="Number of sides" name="sailSides"
              min={5} max={12} step={1}
              value={(parameters.sailSides as number) || 6}
              onChange={(v) => {
                setParameter('sailSides', v);
                setParameter('sailPolygonGrommetMask', '');
              }} />
            <ParameterSlider label="Grommet inset (mm)" name="sailPolygonInset"
              min={1} max={20} step={0.5}
              value={(parameters.sailPolygonInset as number) ?? 4}
              onChange={(v) => setParameter('sailPolygonInset', v)} />
            <div>
              <p className="text-xs text-gray-600 mb-1">Vertex grommets</p>
              <div className="flex flex-wrap gap-1">
                {Array.from({ length: (parameters.sailSides as number) || 6 }, (_, i) => {
                  const sides = (parameters.sailSides as number) || 6;
                  const mask = (parameters.sailPolygonGrommetMask as string) || '1'.repeat(sides);
                  const enabled = mask.length >= sides ? mask[i] !== '0' : true;
                  return (
                    <label key={i} className="flex items-center gap-0.5 text-[10px] text-gray-600 cursor-pointer">
                      <input type="checkbox" className="w-3 h-3" checked={enabled}
                        onChange={(e) => {
                          const full = mask.padEnd(sides, '1');
                          const arr = full.split('');
                          arr[i] = e.target.checked ? '1' : '0';
                          setParameter('sailPolygonGrommetMask', arr.join(''));
                        }} />
                      V{i + 1}
                    </label>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Sail Options — IN PROGRESS */}
      <section className="panel-section border-t pt-4">
        <h3 className="panel-section-title">Sail Options <span className="text-xs text-amber-500 font-normal">(in progress)</span></h3>
        <div className="mt-2 space-y-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="w-4 h-4"
              checked={!!parameters.sailSymmetry}
              onChange={(e) => setParameter('sailSymmetry', e.target.checked)} />
            <span>Bilateral symmetry</span>
          </label>
          <p className="text-[10px] text-gray-500 ml-6">Mirror all grommet positions when dragging any corner</p>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" className="w-4 h-4"
              checked={!!parameters.sailLockCorners}
              onChange={(e) => setParameter('sailLockCorners', e.target.checked)} />
            <span>Lock corners to grommets</span>
          </label>
          <p className="text-[10px] text-gray-500 ml-6">Sail outline follows grommet positions (gap preserved)</p>
          <label className="block text-sm mt-2">
            Grommet margin: {((parameters.sailGrommetMargin as number) ?? 3).toFixed(1)}mm
          </label>
          <input type="range" className="w-full" min={1} max={8} step={0.5}
            value={(parameters.sailGrommetMargin as number) ?? 3}
            onChange={(e) => setParameter('sailGrommetMargin', parseFloat(e.target.value))} />
          <p className="text-[10px] text-gray-500">Distance between grommet hole and sail outline (prevents tearing)</p>
        </div>
      </section>

      {/* Grommet Hole Type */}
      <section className="panel-section border-t pt-4">
        <h3 className="panel-section-title">Grommet Type</h3>
        <div className="mt-2 space-y-1.5">
          {(Object.keys(SAIL_HOLE_STANDARDS) as Array<keyof typeof SAIL_HOLE_STANDARDS>).map((key) => {
            const std = SAIL_HOLE_STANDARDS[key];
            return (
              <label key={key} className="flex items-center gap-2 text-sm">
                <input type="radio" name="sailHoleType" className="w-4 h-4"
                  checked={holeType === key}
                  onChange={() => setParameter('sailHoleType', key)} />
                <div className="flex flex-col">
                  <span>{std.label}</span>
                  <span className="text-[10px] text-gray-500">{std.description}</span>
                </div>
              </label>
            );
          })}
        </div>
      </section>

      {/* Edge Styles */}
      <section className="panel-section border-t pt-4">
        <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('edgeStyles')}>
          <h3 className="panel-section-title">Edge Styles</h3>
          <span className="text-gray-400 text-xs">{openSections.edgeStyles ? '▾' : '▸'}</span>
        </button>
        {openSections.edgeStyles && (
          <div className="mt-2 space-y-3">
            <p className="text-xs text-gray-500">Apply decorative styles to each edge. Drag grommets in the preview to reshape the sail.</p>

            {/* Top edge */}
            {isSquare && (
              <div>
                <label className="text-xs font-medium text-gray-700">Top Edge</label>
                <select className="w-full mt-1 text-xs border rounded px-2 py-1"
                  value={(parameters.sailTopStyle as string) || 'none'}
                  onChange={(e) => setParameter('sailTopStyle', e.target.value)}>
                  {edgeStyles.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
                {(parameters.sailTopStyle as string || 'none') !== 'none' && (
                  <div className="ml-2 mt-1">
                    <ParameterSlider label="Depth (mm)" name="sailTopDepth"
                      min={1} max={12} step={0.5}
                      value={(parameters.sailTopDepth as number) || (parameters.sailEdgeDepth as number) || 3}
                      onChange={(v) => setParameter('sailTopDepth', v)} />
                  </div>
                )}
              </div>
            )}

            {/* Bottom edge */}
            <div>
              <label className="text-xs font-medium text-gray-700">Bottom Edge</label>
              <select className="w-full mt-1 text-xs border rounded px-2 py-1"
                value={(parameters.sailBottomStyle as string) || 'none'}
                onChange={(e) => setParameter('sailBottomStyle', e.target.value)}>
                {edgeStyles.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
              {(parameters.sailBottomStyle as string || 'none') !== 'none' && (
                <div className="ml-2 mt-1">
                  <ParameterSlider label="Depth (mm)" name="sailBottomDepth"
                    min={1} max={12} step={0.5}
                    value={(parameters.sailBottomDepth as number) || (parameters.sailEdgeDepth as number) || 3}
                    onChange={(v) => setParameter('sailBottomDepth', v)} />
                </div>
              )}
            </div>

            {/* Left edge */}
            <div>
              <label className="text-xs font-medium text-gray-700">Left Edge</label>
              <select className="w-full mt-1 text-xs border rounded px-2 py-1"
                value={(parameters.sailLeftStyle as string) || 'none'}
                onChange={(e) => setParameter('sailLeftStyle', e.target.value)}>
                {edgeStyles.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
              {(parameters.sailLeftStyle as string || 'none') !== 'none' && (
                <div className="ml-2 mt-1">
                  <ParameterSlider label="Depth (mm)" name="sailLeftDepth"
                    min={1} max={12} step={0.5}
                    value={(parameters.sailLeftDepth as number) || (parameters.sailEdgeDepth as number) || 3}
                    onChange={(v) => setParameter('sailLeftDepth', v)} />
                </div>
              )}
            </div>

            {/* Right edge (square only) */}
            {isSquare && (
              <div>
                <label className="text-xs font-medium text-gray-700">Right Edge</label>
                <select className="w-full mt-1 text-xs border rounded px-2 py-1"
                  value={(parameters.sailRightStyle as string) || 'none'}
                  onChange={(e) => setParameter('sailRightStyle', e.target.value)}>
                  {edgeStyles.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
                </select>
                {(parameters.sailRightStyle as string || 'none') !== 'none' && (
                  <div className="ml-2 mt-1">
                    <ParameterSlider label="Depth (mm)" name="sailRightDepth"
                      min={1} max={12} step={0.5}
                      value={(parameters.sailRightDepth as number) || (parameters.sailEdgeDepth as number) || 3}
                      onChange={(v) => setParameter('sailRightDepth', v)} />
                  </div>
                )}
              </div>
            )}

            {/* Global fallback depth + count */}
            <ParameterSlider label="Default edge depth (mm)" name="sailEdgeDepth"
              min={1} max={12} step={0.5}
              value={parameters.sailEdgeDepth as number || 3}
              onChange={(v) => setParameter('sailEdgeDepth', v)} />
            <ParameterSlider label="Edge count" name="sailEdgeCount"
              min={3} max={16} step={1}
              value={parameters.sailEdgeCount as number || 6}
              onChange={(v) => setParameter('sailEdgeCount', v)} />

            {/* Torn seed presets — only shown when any edge uses torn style */}
            {([parameters.sailTopStyle, parameters.sailBottomStyle, parameters.sailLeftStyle, parameters.sailRightStyle].some(s => s === 'torn')) && (
              <div className="border-t pt-2 mt-2">
                <label className="text-xs font-medium text-gray-700">Tear Pattern</label>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {[
                    { label: 'Weathered', seed: 42 },
                    { label: 'Battle-worn', seed: 137 },
                    { label: 'Storm-torn', seed: 256 },
                    { label: 'Ghostly', seed: 666 },
                    { label: 'Ancient', seed: 1001 },
                    { label: 'Shredded', seed: 7777 },
                  ].map(preset => (
                    <button key={preset.seed} type="button"
                      className={`text-[10px] px-1.5 py-1 rounded border transition-colors ${
                        (parameters.sailTornSeed as number || 42) === preset.seed
                          ? 'bg-blue-100 border-blue-400 text-blue-800'
                          : 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'
                      }`}
                      onClick={() => setParameter('sailTornSeed', preset.seed)}>
                      {preset.label}
                    </button>
                  ))}
                </div>
                <button type="button"
                  className="mt-1.5 text-[10px] px-2 py-1 rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-600 w-full"
                  onClick={() => setParameter('sailTornSeed', Math.floor(Math.random() * 10000))}>
                  🎲 Random Tear Pattern
                </button>
              </div>
            )}
          </div>
        )}
      </section>

      {/* Grommet Positions */}
      <section className="panel-section border-t pt-4">
        <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('grommets')}>
          <h3 className="panel-section-title">Grommet Positions</h3>
          <span className="text-gray-400 text-xs">{openSections.grommets ? '▾' : '▸'}</span>
        </button>
        {openSections.grommets && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-gray-500 mb-2">Inset from bounding box corners (mm). Drag grommets in the preview to reposition and reshape the sail.</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <div>
                <label className="text-gray-600">TL inset X</label>
                <input type="number" min={2} max={20} step={0.5} className="w-full border rounded px-1 py-0.5 text-xs"
                  value={parameters.sailGrommetTLx as number || 4}
                  onChange={(e) => setParameter('sailGrommetTLx', parseFloat(e.target.value) || 4)} />
              </div>
              <div>
                <label className="text-gray-600">TL inset Y</label>
                <input type="number" min={2} max={20} step={0.5} className="w-full border rounded px-1 py-0.5 text-xs"
                  value={parameters.sailGrommetTLy as number || 4}
                  onChange={(e) => setParameter('sailGrommetTLy', parseFloat(e.target.value) || 4)} />
              </div>
              {isSquare && <>
                <div>
                  <label className="text-gray-600">TR inset X</label>
                  <input type="number" min={2} max={20} step={0.5} className="w-full border rounded px-1 py-0.5 text-xs"
                    value={parameters.sailGrommetTRx as number || 4}
                    onChange={(e) => setParameter('sailGrommetTRx', parseFloat(e.target.value) || 4)} />
                </div>
                <div>
                  <label className="text-gray-600">TR inset Y</label>
                  <input type="number" min={2} max={20} step={0.5} className="w-full border rounded px-1 py-0.5 text-xs"
                    value={parameters.sailGrommetTRy as number || 4}
                    onChange={(e) => setParameter('sailGrommetTRy', parseFloat(e.target.value) || 4)} />
                </div>
              </>}
              <div>
                <label className="text-gray-600">BL inset X</label>
                <input type="number" min={2} max={20} step={0.5} className="w-full border rounded px-1 py-0.5 text-xs"
                  value={parameters.sailGrommetBLx as number || 4}
                  onChange={(e) => setParameter('sailGrommetBLx', parseFloat(e.target.value) || 4)} />
              </div>
              <div>
                <label className="text-gray-600">BL inset Y</label>
                <input type="number" min={2} max={20} step={0.5} className="w-full border rounded px-1 py-0.5 text-xs"
                  value={parameters.sailGrommetBLy as number || 4}
                  onChange={(e) => setParameter('sailGrommetBLy', parseFloat(e.target.value) || 4)} />
              </div>
              <div>
                <label className="text-gray-600">BR inset X</label>
                <input type="number" min={2} max={20} step={0.5} className="w-full border rounded px-1 py-0.5 text-xs"
                  value={parameters.sailGrommetBRx as number || 4}
                  onChange={(e) => setParameter('sailGrommetBRx', parseFloat(e.target.value) || 4)} />
              </div>
              <div>
                <label className="text-gray-600">BR inset Y</label>
                <input type="number" min={2} max={20} step={0.5} className="w-full border rounded px-1 py-0.5 text-xs"
                  value={parameters.sailGrommetBRy as number || 4}
                  onChange={(e) => setParameter('sailGrommetBRy', parseFloat(e.target.value) || 4)} />
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Sail Info */}
      <section className="panel-section border-t pt-4 text-xs text-gray-600">
        <p className="font-semibold mb-1">Sail Info:</p>
        <p>• Grommet: {SAIL_HOLE_STANDARDS[holeType as keyof typeof SAIL_HOLE_STANDARDS]?.label || 'Grommet (3mm)'}</p>
        <p>• Drag grommets in the preview to reposition</p>
        <p>• Blue crosshairs mark grommet centers</p>
        {!!parameters.sailLockCorners && <p>• Corner shape follows grommets with {((parameters.sailGrommetMargin as number) ?? 3).toFixed(1)}mm gap</p>}
        {!!parameters.sailSymmetry && <p>• All corners mirror when any is dragged</p>}
      </section>
    </>
  );
}

/**
 * Flag-specific parameter panel.
 * Flags use the banner template — different dimensions, no cape options.
 */
function FlagParameterPanel({ parameters, setParameter }: {
  parameters: Record<string, number | string | boolean>;
  setParameter: (key: string, value: number | string | boolean) => void;
}) {
  const { templateVariant } = useEditorStore();
  const isCustom = templateVariant === 'custom-flag';
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    flagBottom: false,
    flagSides: false,
    flagHoles: false,
  });

  function toggleSection(key: string) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const bottomStyle = (parameters.flagBottomStyle as string) || 'none';
  const leftStyle = (parameters.flagLeftStyle as string) || 'none';
  const rightStyle = (parameters.flagRightStyle as string) || 'none';
  const sideStyles = ['none', 'scalloped', 'zigzag', 'wavy', 'castellated'] as const;

  return (
    <>
      {/* Non-custom: info note */}
      {!isCustom && (
        <section className="panel-section border-t pt-4 text-xs text-gray-500">
          <p>This flag uses a fixed shape. Select <strong>Custom</strong> for edge styling and hole options.</p>
        </section>
      )}

      {/* Custom flag: hole count */}
      {isCustom && (
      <section className="panel-section border-t pt-4">
        <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('flagHoles')}>
          <h3 className="panel-section-title">Attachment Holes</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{(parameters.flagCustomHoleCount as number) || 2} holes</span>
            <span className="text-gray-400 text-xs">{openSections.flagHoles ? '▾' : '▸'}</span>
          </div>
        </button>
        {openSections.flagHoles && (
          <div className="mt-2 space-y-2">
            <ParameterSlider label="Hole Count" name="flagCustomHoleCount"
              min={1} max={6} step={1}
              value={(parameters.flagCustomHoleCount as number) || 2}
              onChange={(v) => setParameter('flagCustomHoleCount', v)} />
          </div>
        )}
      </section>
      )}

      {/* Custom flag: Bottom Edge */}
      {isCustom && (
      <section className="panel-section border-t pt-4">
        <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('flagBottom')}>
          <h3 className="panel-section-title">Bottom Edge</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 capitalize">{bottomStyle}</span>
            <span className="text-gray-400 text-xs">{openSections.flagBottom ? '▾' : '▸'}</span>
          </div>
        </button>
        {openSections.flagBottom && (
          <div className="mt-2 space-y-2">
            <p className="text-xs text-gray-500 mb-2">Style of the bottom edge</p>
            {(['none', 'flames', 'pointed', 'swallowtail', 'straight', 'scalloped', 'zigzag', 'wavy'] as const).map((style) => (
              <div key={style}>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="flagBottomStyle" className="w-4 h-4"
                    checked={bottomStyle === style}
                    onChange={() => setParameter('flagBottomStyle', style)} />
                  <span className="capitalize">{style}</span>
                </label>
                {/* Inline sub-options for this style */}
                {bottomStyle === style && (style === 'scalloped' || style === 'zigzag' || style === 'wavy') && (
                  <div className="ml-6 mt-1">
                    <ParameterSlider label="Count" name="flagBottomCount"
                      min={2} max={12} step={1}
                      value={parameters.flagBottomCount as number || 5}
                      onChange={(v) => setParameter('flagBottomCount', v)} />
                    <ParameterSlider label="Depth (mm)" name="flagBottomDepth"
                      min={1} max={10} step={0.5}
                      value={parameters.flagBottomDepth as number || 3}
                      onChange={(v) => setParameter('flagBottomDepth', v)} />
                  </div>
                )}
                {bottomStyle === style && style === 'swallowtail' && (
                  <div className="ml-6 mt-1">
                    <ParameterSlider label="Depth" name="flagBottomDepth"
                      min={0.1} max={0.5} step={0.05}
                      value={parameters.flagBottomDepth as number || 0.3}
                      onChange={(v) => setParameter('flagBottomDepth', v)} />
                  </div>
                )}
                {bottomStyle === style && style === 'pointed' && (
                  <div className="ml-6 mt-1">
                    <ParameterSlider label="Depth" name="flagBottomDepth"
                      min={0.1} max={0.5} step={0.05}
                      value={parameters.flagBottomDepth as number || 0.25}
                      onChange={(v) => setParameter('flagBottomDepth', v)} />
                  </div>
                )}
                {bottomStyle === style && style === 'flames' && (
                  <div className="ml-6 mt-1">
                    <ParameterSlider label="Count" name="flagBottomCount"
                      min={2} max={12} step={1}
                      value={parameters.flagBottomCount as number || 5}
                      onChange={(v) => setParameter('flagBottomCount', v)} />
                    <ParameterSlider label="Depth" name="flagBottomDepth"
                      min={0.05} max={0.4} step={0.05}
                      value={parameters.flagBottomDepth as number || 0.15}
                      onChange={(v) => setParameter('flagBottomDepth', v)} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
      )}

      {/* Flag Side Styles */}
      {isCustom && (
      <section className="panel-section border-t pt-4">
        <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('flagSides')}>
          <h3 className="panel-section-title">Side Edges</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 capitalize">{leftStyle === 'none' && rightStyle === 'none' ? 'none' : `L:${leftStyle} R:${rightStyle}`}</span>
            <span className="text-gray-400 text-xs">{openSections.flagSides ? '▾' : '▸'}</span>
          </div>
        </button>
        {openSections.flagSides && (
          <div className="mt-2 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Left Edge</label>
              <select className="w-full mt-1 text-xs border rounded px-2 py-1"
                value={leftStyle}
                onChange={(e) => setParameter('flagLeftStyle', e.target.value)}>
                {sideStyles.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700">Right Edge</label>
              <select className="w-full mt-1 text-xs border rounded px-2 py-1"
                value={rightStyle}
                onChange={(e) => setParameter('flagRightStyle', e.target.value)}>
                {sideStyles.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
              </select>
            </div>
            {(leftStyle !== 'none' || rightStyle !== 'none') && (
              <div>
                <ParameterSlider label="Side count" name="flagSideCount"
                  min={3} max={12} step={1}
                  value={parameters.flagSideCount as number || 5}
                  onChange={(v) => setParameter('flagSideCount', v)} />
                <ParameterSlider label="Side depth (mm)" name="flagSideDepth"
                  min={1} max={8} step={0.5}
                  value={parameters.flagSideDepth as number || 3}
                  onChange={(v) => setParameter('flagSideDepth', v)} />
              </div>
            )}
          </div>
        )}
      </section>
      )}

      {/* Flag Info */}
      <section className="panel-section border-t pt-4 text-xs text-gray-600">
        <p className="font-semibold mb-1">Flag Template:</p>
        {isCustom ? (
          <>
            <p>• Rectangular body with customizable edges</p>
            <p>• Configurable hole count (1-6)</p>
          </>
        ) : (
          <>
            <p>• Based on cloth banner shape</p>
            <p>• Two clip holes for bar attachment</p>
            <p>• Bottom edge from banner template</p>
          </>
        )}
      </section>
    </>
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
