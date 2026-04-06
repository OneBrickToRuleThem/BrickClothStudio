/**
 * Parameter Panel Component
 * Controls pattern dimensions, hole settings, and decorations
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditorStore } from '../store/editor';
import { HOLE_STANDARDS, DEFAULT_HOLE_TYPE, SAIL_HOLE_STANDARDS, LEGO_GRID_SIZE } from '../utils/constants';
import { EDGE_STYLE_NAMES } from '../geometry/edgeStyles';

const LDU_PER_MM = 2.5; // 1 LDU = 0.4mm

type MeasurementUnit = 'mm' | 'studs' | 'ldu' | 'plates' | 'inches';
const UNIT_LABELS: Record<MeasurementUnit, string> = {
  mm: 'mm',
  studs: 'studs',
  ldu: 'LDU',
  plates: 'plates',
  inches: 'in',
};
// Multiply mm by this factor to get the unit value
const MM_TO_UNIT: Record<MeasurementUnit, number> = {
  mm: 1,
  studs: 1 / LEGO_GRID_SIZE, // 1 stud = 8mm
  ldu: LDU_PER_MM,           // 1 mm = 2.5 LDU
  plates: 1 / 3.2,           // 1 plate = 3.2mm
  inches: 1 / 25.4,          // 1 inch = 25.4mm
};

export default function ParameterPanel() {
  const { parameters, setParameter, resetToDefaults, elementType, templateVariant } = useEditorStore();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    transformations: false,
    attachment: false,
    hemStyle: false,
    sideStyle: false,
    cutsDetails: false,
  });
  const [lockAspect, setLockAspect] = useState(false);
  const [measureUnit, setMeasureUnit] = useState<MeasurementUnit>('mm');

  function toggleSection(key: string) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  // Summary labels for collapsed sections
  // Derive bottom edge value from individual booleans
  const activeHemValue: string = parameters.tattered ? 'tattered'
    : parameters.scalloped && !parameters.scallopInverted ? 'scalloped'
    : parameters.scalloped && parameters.scallopInverted ? 'arched'
    : parameters.fishtail ? 'notched'
    : parameters.pointed ? 'pointed'
    : parameters.zigzag ? 'zigzag'
    : parameters.wavy ? 'wavy'
    : parameters.castellated ? 'castellated'
    : parameters.dovetail ? 'dovetail'
    : parameters.flame ? 'flame'
    : parameters.stepped ? 'stepped'
    : parameters.serrated ? 'serrated'
    : parameters.thorned ? 'thorned'
    : parameters.torn ? 'torn'
    : parameters.feathered ? 'feathered'
    : parameters.cloud ? 'cloud'
    : parameters.sawtooth ? 'sawtooth'
    : parameters.arrow ? 'arrow'
    : parameters.picot ? 'picot'
    : 'none';
  const activeHem = activeHemValue === 'none' ? 'None'
    : activeHemValue.charAt(0).toUpperCase() + activeHemValue.slice(1);
  const activeSide = (parameters.sideStyle as string || 'none') === 'none' ? 'None' : (parameters.sideStyle as string);

  function setBottomEdge(style: string) {
    setParameter('tattered', false);
    setParameter('scalloped', false);
    setParameter('scallopInverted', false);
    setParameter('fishtail', false);
    setParameter('pointed', false);
    setParameter('zigzag', false);
    setParameter('wavy', false);
    setParameter('castellated', false);
    setParameter('dovetail', false);
    setParameter('flame', false);
    setParameter('stepped', false);
    setParameter('serrated', false);
    setParameter('thorned', false);
    setParameter('torn', false);
    setParameter('feathered', false);
    setParameter('cloud', false);
    setParameter('sawtooth', false);
    setParameter('arrow', false);
    setParameter('picot', false);
    switch (style) {
      case 'tattered': setParameter('tattered', true); break;
      case 'scalloped': setParameter('scalloped', true); break;
      case 'arched': setParameter('scalloped', true); setParameter('scallopInverted', true); break;
      case 'notched': setParameter('fishtail', true); break;
      case 'pointed': setParameter('pointed', true); break;
      case 'zigzag': setParameter('zigzag', true); break;
      case 'wavy': setParameter('wavy', true); break;
      case 'castellated': setParameter('castellated', true); break;
      case 'dovetail': setParameter('dovetail', true); break;
      case 'flame': setParameter('flame', true); break;
      case 'stepped': setParameter('stepped', true); break;
      case 'serrated': setParameter('serrated', true); break;
      case 'thorned': setParameter('thorned', true); break;
      case 'torn': setParameter('torn', true); break;
      case 'feathered': setParameter('feathered', true); break;
      case 'cloud': setParameter('cloud', true); break;
      case 'sawtooth': setParameter('sawtooth', true); break;
      case 'arrow': setParameter('arrow', true); break;
      case 'picot': setParameter('picot', true); break;
    }
  }
  const activeCuts = [
    parameters.swordSlit && 'Sword slit',
    parameters.armSlits && 'Arm slits',
    parameters.starHoles && 'Weathering',
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
          <div className="space-y-3">
            <DimensionSlider
              label="Length"
              unit={measureUnit}
              min={elementType === 'flag' ? 15 : 20}
              max={elementType === 'flag' ? 160 : elementType === 'mantle' ? 60 : 80}
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
            <DimensionSlider
              label="Width"
              unit={measureUnit}
              min={elementType === 'flag' ? 10 : 20}
              max={elementType === 'flag' ? 60 : elementType === 'mantle' ? 60 : 80}
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
            <div>
              <label className="text-xs text-gray-600 block mb-1">Measurement unit</label>
              <select className="w-full border rounded px-2 py-1 text-xs"
                value={measureUnit}
                onChange={(e) => setMeasureUnit(e.target.value as MeasurementUnit)}>
                <option value="mm">Millimeters (mm)</option>
                <option value="studs">Studs (8mm)</option>
                <option value="ldu">LDU (0.4mm)</option>
                <option value="plates">Plates (3.2mm)</option>
                <option value="inches">Inches (25.4mm)</option>
              </select>
            </div>
          </div>
        </section>

        {elementType === 'flag' && (
          <FlagParameterPanel parameters={parameters} setParameter={setParameter} />
        )}

        {elementType === 'custom' && (
          <CustomImagePanel parameters={parameters} setParameter={setParameter} />
        )}

        {(elementType === 'sail' || (elementType === 'wings' && templateVariant === 'custom-wing')) && (
          <SailParameterPanel parameters={parameters} setParameter={setParameter} />
        )}

        {/* --- Attachment Hole (all non-sail, non-flag, non-custom-wing elements) --- */}
        {elementType !== 'sail' && elementType !== 'flag' && elementType !== 'custom' && !(elementType === 'wings' && templateVariant === 'custom-wing') && (
        <section className="panel-section border-t pt-4">
          <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('attachment')}>
            <h3 className="panel-section-title">Attachment Hole</h3>
            <span className="text-gray-400 text-xs">{openSections.attachment ? '▾' : '▸'}</span>
          </button>
          {openSections.attachment && (
          <div className="mt-2 space-y-3">
            {/* Hole Type Selector — cape, kama, mantle */}
            {(elementType === 'cape' || elementType === 'kama' || elementType === 'mantle') && (
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hole Type</label>
              <select
                value={parameters.holeType as string || DEFAULT_HOLE_TYPE}
                onChange={(e) => {
                  const holeType = e.target.value as keyof typeof HOLE_STANDARDS;
                  setParameter('holeType', holeType);
                  setParameter('holeRadius', HOLE_STANDARDS[holeType].radius);
                  setParameter('holeOverrideDiameter', HOLE_STANDARDS[holeType].diameter);
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
            )}

            {/* Custom hole shape override — all non-sail */}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={parameters.holeOverride as boolean || false}
                onChange={(e) => setParameter('holeOverride', e.target.checked)} className="w-4 h-4" />
              <span>Override hole options</span>
            </label>
            {parameters.holeOverride && (
            <div className="ml-2 space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-700">Shape</label>
                <select className="w-full mt-1 text-xs border rounded px-2 py-1"
                  value={(parameters.holeOverrideShape as string) || 'round'}
                  onChange={(e) => setParameter('holeOverrideShape', e.target.value)}>
                  <option value="round">Round</option>
                  <option value="square">Square</option>
                  <option value="oval">Oval</option>
                  <option value="pill">Pill / Stadium</option>
                </select>
              </div>
              {((parameters.holeOverrideShape as string || 'round') === 'round' || (parameters.holeOverrideShape as string || 'round') === 'square') ? (
                <ParameterSlider label="Diameter (mm)" name="holeOverrideDiameter"
                  min={1} max={10} step={0.1}
                  value={(parameters.holeOverrideDiameter as number) || 5.0}
                  onChange={(v) => setParameter('holeOverrideDiameter', v)} />
              ) : (
                <>
                  <ParameterSlider label="Width (mm)" name="holeOverrideWidth"
                    min={1} max={12} step={0.1}
                    value={(parameters.holeOverrideWidth as number) || 5.0}
                    onChange={(v) => setParameter('holeOverrideWidth', v)} />
                  <ParameterSlider label="Height (mm)" name="holeOverrideHeight"
                    min={1} max={12} step={0.1}
                    value={(parameters.holeOverrideHeight as number) || 3.5}
                    onChange={(v) => setParameter('holeOverrideHeight', v)} />
                </>
              )}
              <ParameterSlider label="Horizontal offset (mm)" name="holeOverrideOffsetX"
                min={-5} max={5} step={0.1}
                value={(parameters.holeOverrideOffsetX as number) || 0}
                onChange={(v) => setParameter('holeOverrideOffsetX', v)} />
              <ParameterSlider label="Vertical offset (mm)" name="holeOverrideOffsetY"
                min={-5} max={5} step={0.1}
                value={(parameters.holeOverrideOffsetY as number) || 0}
                onChange={(v) => setParameter('holeOverrideOffsetY', v)} />
            </div>
            )}
          </div>
          )}
        </section>
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

        {/* Bottom Edge — dropdown selector */}
        <section className="panel-section border-t pt-4">
          <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('hemStyle')}>
            <h3 className="panel-section-title">Bottom Edge</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">{activeHem}</span>
              <span className="text-gray-400 text-xs">{openSections.hemStyle ? '▾' : '▸'}</span>
            </div>
          </button>
          {openSections.hemStyle && (
          <div className="mt-2 space-y-2">
          <select className="w-full border rounded px-2 py-1.5 text-sm"
            value={activeHemValue}
            onChange={(e) => setBottomEdge(e.target.value)}>
            <option value="none">None</option>
            <option value="tattered">Tattered</option>
            <option value="scalloped">Scalloped</option>
            <option value="arched">Arched</option>
            <option value="notched">Notched</option>
            <option value="pointed">Pointed</option>
            <option value="zigzag">Zigzag</option>
            <option value="wavy">Wavy</option>
            <option value="castellated">Castellated</option>
            <option value="dovetail">Dovetail</option>
            <option value="flame">Flame</option>
            <option value="stepped">Stepped</option>
            <option value="serrated">Serrated</option>
            <option value="thorned">Thorned</option>
            <option value="torn">Torn</option>
            <option value="feathered">Feathered</option>
            <option value="cloud">Cloud</option>
            <option value="sawtooth">Sawtooth</option>
            <option value="arrow">Arrow</option>
            <option value="picot">Picot</option>
          </select>

          {/* Tattered options */}
          {activeHemValue === 'tattered' && (
            <div className="space-y-1 pl-1">
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

          {/* Scalloped options */}
          {activeHemValue === 'scalloped' && (
            <div className="space-y-1 pl-1">
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

          {/* Arched options */}
          {activeHemValue === 'arched' && (
            <div className="space-y-1 pl-1">
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

          {/* Notched options */}
          {activeHemValue === 'notched' && (
            <div className="space-y-1 pl-1">
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

          {/* Pointed options */}
          {activeHemValue === 'pointed' && (
            <div className="space-y-1 pl-1">
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

          {/* Zigzag options */}
          {activeHemValue === 'zigzag' && (
            <div className="space-y-1 pl-1">
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

          {/* Wavy options */}
          {activeHemValue === 'wavy' && (
            <div className="space-y-1 pl-1">
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

          {/* Castellated options */}
          {activeHemValue === 'castellated' && (
            <div className="space-y-1 pl-1">
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

          {/* Dovetail options */}
          {activeHemValue === 'dovetail' && (
            <div className="space-y-1 pl-1">
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

          {/* Flame options */}
          {activeHemValue === 'flame' && (
            <div className="space-y-1 pl-1">
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

          {/* Stepped options */}
          {activeHemValue === 'stepped' && (
            <div className="space-y-1 pl-1">
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

          {/* Serrated — count + depth + direction */}
          {activeHemValue === 'serrated' && (
            <div className="space-y-1 pl-1">
              <ParameterSlider label="Count" name="hemEdgeCount"
                min={3} max={20} step={1}
                value={parameters.hemEdgeCount as number || 8}
                onChange={(v) => setParameter('hemEdgeCount', v)} />
              <ParameterSlider label="Depth (mm)" name="hemEdgeDepth"
                min={0.5} max={8} step={0.5}
                value={parameters.hemEdgeDepth as number || 3}
                onChange={(v) => setParameter('hemEdgeDepth', v)} />
              <label className="flex items-center gap-2 text-sm mt-1">
                <input type="checkbox" className="w-4 h-4"
                  checked={parameters.hemSerratedReverse as boolean || false}
                  onChange={(e) => setParameter('hemSerratedReverse', e.target.checked)} />
                <span>Reverse direction</span>
              </label>
            </div>
          )}

          {/* Thorned / Sawtooth / Arrow / Picot — count + depth */}
          {['thorned', 'sawtooth', 'arrow', 'picot'].includes(activeHemValue) && (
            <div className="space-y-1 pl-1">
              <ParameterSlider label="Count" name="hemEdgeCount"
                min={3} max={20} step={1}
                value={parameters.hemEdgeCount as number || 8}
                onChange={(v) => setParameter('hemEdgeCount', v)} />
              <ParameterSlider label="Depth (mm)" name="hemEdgeDepth"
                min={0.5} max={8} step={0.5}
                value={parameters.hemEdgeDepth as number || 3}
                onChange={(v) => setParameter('hemEdgeDepth', v)} />
            </div>
          )}

          {/* Feathered / Cloud — count + depth + seed */}
          {['feathered', 'cloud'].includes(activeHemValue) && (
            <div className="space-y-1 pl-1">
              <ParameterSlider label="Count" name="hemEdgeCount"
                min={3} max={20} step={1}
                value={parameters.hemEdgeCount as number || 8}
                onChange={(v) => setParameter('hemEdgeCount', v)} />
              <ParameterSlider label="Depth (mm)" name="hemEdgeDepth"
                min={0.5} max={8} step={0.5}
                value={parameters.hemEdgeDepth as number || 3}
                onChange={(v) => setParameter('hemEdgeDepth', v)} />
              <ParameterSlider label="Seed" name="seed"
                min={1} max={99999} step={1}
                value={parameters.seed as number}
                onChange={(v) => setParameter('seed', v)} />
            </div>
          )}

          {/* Torn — depth + seed */}
          {activeHemValue === 'torn' && (
            <div className="space-y-1 pl-1">
              <ParameterSlider label="Depth (mm)" name="hemEdgeDepth"
                min={0.5} max={8} step={0.5}
                value={parameters.hemEdgeDepth as number || 3}
                onChange={(v) => setParameter('hemEdgeDepth', v)} />
              <ParameterSlider label="Seed" name="seed"
                min={1} max={99999} step={1}
                value={parameters.seed as number}
                onChange={(v) => setParameter('seed', v)} />
            </div>
          )}

          </div>
          )}
        </section>

        {/* Side Edges — dropdown selector */}
        <section className="panel-section border-t pt-4">
          <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('sideStyle')}>
            <h3 className="panel-section-title">Side Edges</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 capitalize">{activeSide}</span>
              <span className="text-gray-400 text-xs">{openSections.sideStyle ? '▾' : '▸'}</span>
            </div>
          </button>
          {openSections.sideStyle && (
          <div className="mt-2 space-y-2">
          <select className="w-full border rounded px-2 py-1.5 text-sm"
            value={(parameters.sideStyle as string) || 'none'}
            onChange={(e) => setParameter('sideStyle', e.target.value)}>
            <option value="none">None</option>
            <option value="tattered">Tattered</option>
            <option value="scalloped">Scalloped</option>
            <option value="zigzag">Zigzag</option>
            <option value="wavy">Wavy</option>
            <option value="castellated">Castellated</option>
            <option value="serrated">Serrated</option>
            <option value="thorned">Thorned</option>
            <option value="torn">Torn</option>
            <option value="pointed">Pointed</option>
            <option value="flame">Flame</option>
            <option value="stepped">Stepped</option>
            <option value="dovetail">Dovetail</option>
            <option value="fishtail">Fishtail</option>
            <option value="feathered">Feathered</option>
            <option value="cloud">Cloud</option>
            <option value="sawtooth">Sawtooth</option>
            <option value="arrow">Arrow</option>
            <option value="picot">Picot</option>
          </select>

          {(parameters.sideStyle as string || 'none') !== 'none' && (
            <div className="space-y-1 pl-1">
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

            {/* Weathering */}
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={parameters.starHoles as boolean}
                  onChange={(e) => setParameter('starHoles', e.target.checked)} className="w-4 h-4" />
                <span>Weathering</span>
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

        {/* --- Mantle Transformations --- */}
        {elementType === 'mantle' && (
        <section className="panel-section border-t pt-4">
          <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('transformations')}>
            <h3 className="panel-section-title">Transformations</h3>
            <span className="text-gray-400 text-xs">{openSections.transformations ? '▾' : '▸'}</span>
          </button>
          {openSections.transformations && (
          <div className="space-y-3 mt-2">
            <div>
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={parameters.mantleRounding as boolean || false}
                  onChange={(e) => setParameter('mantleRounding', e.target.checked)} className="w-4 h-4" />
                <span>Rounding</span>
              </label>
              <p className="text-[10px] text-gray-500 ml-6">Curve the bottom rim into a U-shape</p>
              {parameters.mantleRounding && (
                <div className="ml-6 mt-1">
                  <ParameterSlider label="Amount" name="mantleRoundingAmount"
                    min={0.1} max={1.0} step={0.05}
                    value={(parameters.mantleRoundingAmount as number) || 0.5}
                    onChange={(v) => setParameter('mantleRoundingAmount', v)} />
                </div>
              )}
            </div>
          </div>
          )}
        </section>
        )}

        {/* --- Kama / Mantle Bottom Edge --- */}
        {(elementType === 'kama' || elementType === 'mantle') && (
        <section className="panel-section border-t pt-4">
          <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('edgeStyles')}>
            <h3 className="panel-section-title">Bottom Edge</h3>
            <span className="text-gray-400 text-xs">{openSections.edgeStyles ? '▾' : '▸'}</span>
          </button>
          {openSections.edgeStyles && (
          <div className="mt-2 space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700">Style</label>
              <select className="w-full mt-1 text-xs border rounded px-2 py-1"
                value={(parameters[`${elementType}EdgeStyle`] as string) || 'none'}
                onChange={(e) => {
                  setParameter(`${elementType}EdgeStyle`, e.target.value);
                  setParameter(`${elementType}EdgeDepth`, 2);
                  setParameter(`${elementType}EdgeCount`, 6);
                }}>
                {EDGE_STYLE_NAMES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
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

        {elementType !== 'sail' && (
        <section className="panel-section border-t pt-4 text-xs text-gray-600">
          <p className="font-semibold mb-1">Hole Standards:</p>
          <p>• Minifigure: {HOLE_STANDARDS.minifigure.diameter}mm hole</p>
          <p>• Minidoll: {HOLE_STANDARDS.minidoll.diameter}mm hole</p>
          <p className="font-semibold mb-1 mt-2">Scale Reference:</p>
          <p>• Stud: 4.8 mm diameter</p>
          {elementType === 'flag' && (
          <>
            <p className="font-semibold mb-1 mt-2">Flag Template:</p>
            {templateVariant === 'custom-flag' ? (
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
          </>
          )}
        </section>
        )}
      </div>
    </div>
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
  const { templateVariant, elementType } = useEditorStore();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    edgeStyles: true,
    grommets: false,
    extraGrommets: false,
  });

  function toggleSection(key: string) {
    setOpenSections(prev => ({ ...prev, [key]: !prev[key] }));
  }

  const isCustomWing = elementType === 'wings' && templateVariant === 'custom-wing';
  const isSquare = templateVariant === 'square-sail' || isCustomWing;
  const isPolygon = templateVariant === 'polygon-sail';
  const holeType = (parameters.sailHoleType as string) || 'grommet';
  const edgeStyles = ['none', 'scalloped', 'zigzag', 'wavy', 'castellated', 'torn', 'pointed', 'flame', 'stepped', 'dovetail', 'fishtail', 'feathered', 'cloud', 'sawtooth', 'arrow', 'picot'] as const;

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
                setParameter('sailPolygonGrommetPositions', '[]');
              }} />
            <ParameterSlider label="Grommet inset (mm)" name="sailPolygonInset"
              min={1} max={20} step={0.5}
              value={(parameters.sailPolygonInset as number) ?? 4}
              onChange={(v) => {
                setParameter('sailPolygonInset', v);
                setParameter('sailPolygonGrommetPositions', '[]');
              }} />
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
            <button type="button"
              className="text-xs text-blue-600 hover:text-blue-800 underline"
              onClick={() => setParameter('sailPolygonGrommetPositions', '[]')}
            >Reset grommet positions</button>
            <p className="text-[10px] text-gray-500">Drag grommets in the preview to reposition them</p>
          </div>
        </section>
      )}

      {/* Sail Options — hidden for custom wing */}
      {!isCustomWing && (
      <section className="panel-section border-t pt-4">
        <h3 className="panel-section-title">Sail Options</h3>
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
      )}

      {/* Grommet Hole Type — hidden for custom wing */}
      {!isCustomWing && (
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
      )}

      {/* Edge Styles */}
      {!isCustomWing ? (
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
      ) : (
      <section className="panel-section border-t pt-4">
        <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('edgeStyles')}>
          <h3 className="panel-section-title">Edge Style</h3>
          <span className="text-gray-400 text-xs">{openSections.edgeStyles ? '▾' : '▸'}</span>
        </button>
        {openSections.edgeStyles && (
          <div className="mt-2 space-y-3">
            <p className="text-xs text-gray-500">Apply a decorative style to all wing edges.</p>
            <select className="w-full mt-1 text-xs border rounded px-2 py-1"
              value={(parameters.wingEdgeStyle as string) || 'none'}
              onChange={(e) => setParameter('wingEdgeStyle', e.target.value)}>
              {edgeStyles.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
            {(parameters.wingEdgeStyle as string || 'none') !== 'none' && (
              <div className="space-y-1 pl-1">
                <ParameterSlider label="Depth (mm)" name="wingEdgeDepth"
                  min={1} max={12} step={0.5}
                  value={(parameters.wingEdgeDepth as number) || 3}
                  onChange={(v) => setParameter('wingEdgeDepth', v)} />
                <ParameterSlider label="Count" name="wingEdgeCount"
                  min={3} max={20} step={1}
                  value={(parameters.wingEdgeCount as number) || 6}
                  onChange={(v) => setParameter('wingEdgeCount', v)} />
              </div>
            )}
            {['torn', 'flame', 'feathered', 'cloud'].includes((parameters.wingEdgeStyle as string) || 'none') && (
              <div className="mt-2">
                <ParameterSlider label="Pattern seed" name="wingTornSeed"
                  min={1} max={9999} step={1}
                  value={(parameters.wingTornSeed as number) || 42}
                  onChange={(v) => setParameter('wingTornSeed', v)} />
                <button type="button"
                  className="mt-1.5 text-[10px] px-2 py-1 rounded border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 w-full"
                  onClick={() => setParameter('wingTornSeed', Math.floor(Math.random() * 10000))}>
                  🎲 Random Pattern
                </button>
              </div>
            )}
          </div>
        )}
      </section>
      )}

      {/* Wing Options — shown only for custom wing */}
      {isCustomWing && (
      <section className="panel-section border-t pt-4">
        <h3 className="panel-section-title">Wing Options</h3>
        <div className="mt-2 space-y-2">
          <label className="block text-sm">
            Outline margin: {((parameters.sailGrommetMargin as number) ?? 2).toFixed(1)}mm
          </label>
          <input type="range" className="w-full" min={1} max={6} step={0.5}
            value={(parameters.sailGrommetMargin as number) ?? 2}
            onChange={(e) => setParameter('sailGrommetMargin', parseFloat(e.target.value))} />
          <p className="text-[10px] text-gray-500">Gap between connection points and wing outline</p>
          <p className="text-[10px] text-gray-500 mt-2">Double-click an edge to add a point · right-click a point to remove it</p>
          <p className="text-[10px] text-gray-500">Drag nodes and edge points in the preview to reshape the wing</p>
          {(() => {
            const midCount = [0,1,2,3].reduce((sum, i) => {
              try { return sum + JSON.parse((parameters[`wingEdge${i}Points`] as string) || '[]').length; } catch { return sum; }
            }, 0);
            return midCount > 0 ? (
              <button type="button"
                className="mt-1 text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded px-2 py-1 w-full"
                onClick={() => {
                  setParameter('wingEdge0Points', '[]');
                  setParameter('wingEdge1Points', '[]');
                  setParameter('wingEdge2Points', '[]');
                  setParameter('wingEdge3Points', '[]');
                  setParameter('sailGrommetTLx', 5);
                  setParameter('sailGrommetTLy', 2);
                  setParameter('sailGrommetTRx', 3);
                  setParameter('sailGrommetTRy', 5);
                  setParameter('sailGrommetBRx', 7);
                  setParameter('sailGrommetBRy', 5);
                  setParameter('sailGrommetBLx', 3);
                  setParameter('sailGrommetBLy', 2);
                }}>
                Reset wing shape ({midCount} edge point{midCount !== 1 ? 's' : ''})
              </button>
            ) : null;
          })()}
        </div>
      </section>
      )}

      {/* Grommet Positions (square & triangular only — polygon uses vertex mask above) */}
      {!isPolygon && !isCustomWing && (
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
      )}

      {/* Extra Grommets (all sail types — hidden for custom wing) */}
      {!isCustomWing && (
      <section className="panel-section border-t pt-4">
        <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('extraGrommets')}>
          <h3 className="panel-section-title">Extra Grommets</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">{(() => { try { return JSON.parse((parameters.sailExtraGrommets as string) || '[]').length; } catch { return 0; } })()} added</span>
            <span className="text-gray-400 text-xs">{openSections.extraGrommets ? '▾' : '▸'}</span>
          </div>
        </button>
        {openSections.extraGrommets && (
        <div className="mt-2 space-y-2">
          <p className="text-[10px] text-gray-500">Additional holes independent of corner grommets. Click Add to place, then edit coordinates.</p>
          {(() => {
            let extras: Array<{x: number; y: number}> = [];
            try { extras = JSON.parse((parameters.sailExtraGrommets as string) || '[]'); } catch { extras = []; }
            const w = (parameters.width as number) || 60;
            const h = (parameters.length as number) || 60;
            return (
              <>
                {extras.map((g: {x: number; y: number}, i: number) => (
                  <div key={i} className="flex items-center gap-1 text-xs">
                    <span className="text-gray-500 w-5">#{i + 1}</span>
                    <label className="text-gray-600">X</label>
                    <input type="number" min={2} max={w - 2} step={0.5}
                      value={g.x} className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs"
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const updated = [...extras];
                        updated[i] = { ...updated[i], x: val };
                        setParameter('sailExtraGrommets', JSON.stringify(updated));
                      }} />
                    <label className="text-gray-600">Y</label>
                    <input type="number" min={2} max={h - 2} step={0.5}
                      value={g.y} className="w-16 px-1 py-0.5 border border-gray-300 rounded text-xs"
                      onChange={(e) => {
                        const val = parseFloat(e.target.value) || 0;
                        const updated = [...extras];
                        updated[i] = { ...updated[i], y: val };
                        setParameter('sailExtraGrommets', JSON.stringify(updated));
                      }} />
                    <button type="button" className="text-red-500 hover:text-red-700 text-xs px-1"
                      onClick={() => {
                        const updated = extras.filter((_: {x: number; y: number}, j: number) => j !== i);
                        setParameter('sailExtraGrommets', JSON.stringify(updated));
                      }}>✕</button>
                  </div>
                ))}
                <button type="button" className="text-xs bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded px-2 py-1"
                  onClick={() => {
                    const updated = [...extras, { x: Math.round(w / 2), y: Math.round(h / 2) }];
                    setParameter('sailExtraGrommets', JSON.stringify(updated));
                  }}>
                  + Add Grommet
                </button>
              </>
            );
          })()}
        </div>
        )}
      </section>
      )}

      {/* Info */}
      <section className="panel-section border-t pt-4 text-xs text-gray-600">
        {isCustomWing ? (
        <>
          <p className="font-semibold mb-1">Wing Info:</p>
          <p>• Connection: Ball Joint ({SAIL_HOLE_STANDARDS['ball-joint' as keyof typeof SAIL_HOLE_STANDARDS]?.label || '3.2mm'})</p>
          <p>• Drag nodes in the preview to reshape the wing</p>
          <p>• Blue crosshairs mark connection point centers</p>
          <p>• Outline margin: {((parameters.sailGrommetMargin as number) ?? 2).toFixed(1)}mm</p>
        </>
        ) : (
        <>
          <p className="font-semibold mb-1">Sail Info:</p>
          <p>• Grommet: {SAIL_HOLE_STANDARDS[holeType as keyof typeof SAIL_HOLE_STANDARDS]?.label || 'Grommet (3mm)'}</p>
          <p>• Drag grommets in the preview to reposition</p>
          <p>• Blue crosshairs mark grommet centers</p>
          {!!parameters.sailLockCorners && <p>• Corner shape follows grommets with {((parameters.sailGrommetMargin as number) ?? 3).toFixed(1)}mm gap</p>}
          {!!parameters.sailSymmetry && <p>• All corners mirror when any is dragged</p>}
        </>
        )}
      </section>
    </>
  );
}

/**
 * Custom image tracing parameter panel.
 * Works like Inkscape Trace Bitmap: live B/W preview, auto-retrace on parameter change.
 */
function CustomImagePanel({ parameters, setParameter }: {
  parameters: Record<string, number | string | boolean>;
  setParameter: (key: string, value: number | string | boolean) => void;
}) {
  const [isTracing, setIsTracing] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [contourInfo, setContourInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const traceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasImage = !!(parameters.customImageData as string);
  const hasTrace = !!(parameters.customTraceSvg as string);
  const thresholdVal = (parameters.customThreshold as number) || 128;
  const blurVal = (parameters.customBlur as number) || 0;
  const invertVal = (parameters.customInvert as boolean) || false;
  const simplifyVal = (parameters.customSimplify as number) ?? 1.5;
  const smoothVal = parameters.customSmooth !== false;
  const minAreaVal = (parameters.customMinArea as number) || 20;

  // Auto-generate B/W threshold preview when threshold/blur/invert change
  useEffect(() => {
    if (!hasImage) { setPreviewUrl(null); return; }
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(async () => {
      try {
        const { generateThresholdPreview } = await import('../services/imageTracer');
        const url = await generateThresholdPreview(
          parameters.customImageData as string, thresholdVal, invertVal, blurVal
        );
        setPreviewUrl(url);
      } catch { /* ignore */ }
    }, 150);
    return () => { if (previewTimerRef.current) clearTimeout(previewTimerRef.current); };
  }, [hasImage, parameters.customImageData, thresholdVal, blurVal, invertVal]);

  // Auto-trace when any trace parameter changes (debounced)
  const runTrace = useCallback(async () => {
    const imageData = parameters.customImageData as string;
    if (!imageData) return;
    setIsTracing(true);
    setError(null);
    try {
      const { traceImage } = await import('../services/imageTracer');
      const tw = (parameters.customTraceTargetW as number) || 40;
      const th = (parameters.customTraceTargetH as number) || 40;
      const result = await traceImage(imageData, {
        threshold: thresholdVal,
        invert: invertVal,
        blur: blurVal,
        simplify: simplifyVal,
        smooth: smoothVal,
        minArea: minAreaVal,
        targetWidth: tw,
        targetHeight: th,
      });
      setParameter('customTraceSvg', result.svgPath);
      setParameter('customTraceContours', JSON.stringify(result.contourPaths));
      // Update display dimensions from bounds (stable — doesn't feed back into targetWidth/Height)
      if (result.bounds.width > 0 && result.bounds.height > 0) {
        setParameter('width', Math.ceil(result.bounds.width * 10) / 10);
        setParameter('length', Math.ceil(result.bounds.height * 10) / 10);
      }
      setContourInfo(`${result.contourCount} contour${result.contourCount !== 1 ? 's' : ''} found`);
      if (result.contourCount === 0) {
        setError('No contours found. Try adjusting the threshold or lowering the minimum area.');
      }
    } catch (err: any) {
      setError(err.message || 'Tracing failed');
    } finally {
      setIsTracing(false);
    }
  }, [parameters.customImageData, thresholdVal, invertVal, blurVal, simplifyVal, smoothVal, minAreaVal, parameters.customTraceTargetW, parameters.customTraceTargetH]);

  // Re-trace at a different scale (e.g. to match detected hole to real-world size)
  const retraceAtScale = useCallback(async (scaleFactor: number) => {
    const imageData = parameters.customImageData as string;
    if (!imageData || Math.abs(scaleFactor - 1) < 0.01) return;
    setIsTracing(true);
    setError(null);
    try {
      const { traceImage } = await import('../services/imageTracer');
      const tw = (parameters.customTraceTargetW as number) || 40;
      const th = (parameters.customTraceTargetH as number) || 40;
      const newTW = tw * scaleFactor;
      const newTH = th * scaleFactor;
      // Update stable target dimensions so future regenerations stay at this scale
      setParameter('customTraceTargetW', Math.round(newTW * 10) / 10);
      setParameter('customTraceTargetH', Math.round(newTH * 10) / 10);
      const result = await traceImage(imageData, {
        threshold: thresholdVal,
        invert: invertVal,
        blur: blurVal,
        simplify: simplifyVal,
        smooth: smoothVal,
        minArea: minAreaVal,
        targetWidth: newTW,
        targetHeight: newTH,
      });
      setParameter('customTraceSvg', result.svgPath);
      setParameter('customTraceContours', JSON.stringify(result.contourPaths));
      if (result.bounds.width > 0 && result.bounds.height > 0) {
        setParameter('width', Math.ceil(result.bounds.width * 10) / 10);
        setParameter('length', Math.ceil(result.bounds.height * 10) / 10);
      }
      setContourInfo(`${result.contourCount} contour${result.contourCount !== 1 ? 's' : ''} found`);
    } catch (err: any) {
      setError(err.message || 'Tracing failed');
    } finally {
      setIsTracing(false);
    }
  }, [parameters.customImageData, thresholdVal, invertVal, blurVal, simplifyVal, smoothVal, minAreaVal, parameters.customTraceTargetW, parameters.customTraceTargetH, setParameter]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (PNG, JPG, BMP, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large. Maximum size is 10MB.');
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target?.result as string;
      setParameter('customImageData', dataUrl);
      setParameter('customTraceSvg', '');
      // Auto-set dimensions from image aspect ratio
      try {
        const { getImageDimensions } = await import('../services/imageTracer');
        const dims = await getImageDimensions(dataUrl);
        const aspect = dims.width / dims.height;
        const targetSize = 40; // base size in mm
        let tw: number, th: number;
        if (aspect >= 1) {
          tw = targetSize;
          th = Math.round(targetSize / aspect);
        } else {
          th = targetSize;
          tw = Math.round(targetSize * aspect);
        }
        setParameter('width', tw);
        setParameter('length', th);
        // Lock stable trace targets so regeneration doesn't shrink
        setParameter('customTraceTargetW', tw);
        setParameter('customTraceTargetH', th);
      } catch { /* keep current dims */ }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <section className="panel-section border-t pt-4">
      <h3 className="panel-section-title">Trace Bitmap</h3>
      <div className="mt-2 space-y-3">
        {/* Upload button */}
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-3 py-2 rounded bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
          >
            {hasImage ? 'Replace Image' : 'Upload Image'}
          </button>
        </div>

        {/* Side-by-side: original + threshold preview */}
        {hasImage && (
          <div className="relative">
            <div className="grid grid-cols-2 gap-1 rounded border border-gray-200 dark:border-gray-600 overflow-hidden bg-gray-100 dark:bg-gray-800">
              <div className="relative" style={{ height: 80 }}>
                <img src={parameters.customImageData as string} alt="Source" className="w-full h-full object-contain" />
                <span className="absolute bottom-0 left-0 text-[9px] bg-black/50 text-white px-1">Original</span>
              </div>
              <div className="relative" style={{ height: 80 }}>
                {previewUrl ? (
                  <img src={previewUrl} alt="Threshold" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">...</div>
                )}
                <span className="absolute bottom-0 left-0 text-[9px] bg-black/50 text-white px-1">Threshold</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => { setParameter('customImageData', ''); setParameter('customTraceSvg', ''); setPreviewUrl(null); }}
              className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600 z-10"
              title="Remove image"
            >
              ×
            </button>
          </div>
        )}

        {error && <p className="text-xs text-red-500">{error}</p>}

        {hasImage && (
          <>
            <div className="space-y-2">
              <label className="param-label">Brightness Threshold
                <span className="text-gray-400 ml-1 font-normal">{thresholdVal}</span>
              </label>
              <input type="range" min={1} max={254} step={1}
                value={thresholdVal}
                onChange={e => setParameter('customThreshold', Number(e.target.value))}
                className="param-slider" />

              <label className="param-label">Pre-blur
                <span className="text-gray-400 ml-1 font-normal">{blurVal}px</span>
              </label>
              <input type="range" min={0} max={10} step={1}
                value={blurVal}
                onChange={e => setParameter('customBlur', Number(e.target.value))}
                className="param-slider" />

              <label className="param-label">Path Simplification
                <span className="text-gray-400 ml-1 font-normal">{simplifyVal}</span>
              </label>
              <input type="range" min={0} max={10} step={0.5}
                value={simplifyVal}
                onChange={e => setParameter('customSimplify', Number(e.target.value))}
                className="param-slider" />

              <label className="param-label">Min Contour Area
                <span className="text-gray-400 ml-1 font-normal">{minAreaVal}px²</span>
              </label>
              <input type="range" min={1} max={500} step={1}
                value={minAreaVal}
                onChange={e => setParameter('customMinArea', Number(e.target.value))}
                className="param-slider" />

              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={invertVal}
                    onChange={e => setParameter('customInvert', e.target.checked)}
                    className="rounded" />
                  <span className="text-gray-700 dark:text-gray-300">Invert</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={smoothVal}
                    onChange={e => setParameter('customSmooth', e.target.checked)}
                    className="rounded" />
                  <span className="text-gray-700 dark:text-gray-300">Smooth curves</span>
                </label>
              </div>
            </div>

            {/* Status line */}
            {contourInfo && !isTracing && hasTrace && (
              <p className="text-xs text-green-600 dark:text-green-400">{contourInfo}</p>
            )}

            {/* Generate SVG — the single action to trace and push to the preview */}
            <button
              type="button"
              onClick={runTrace}
              disabled={isTracing}
              className={`w-full px-4 py-2.5 rounded-lg text-sm font-semibold tracking-wide transition-colors shadow-sm ${
                isTracing
                  ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-wait'
                  : hasTrace
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600'
                    : 'bg-emerald-500 text-white hover:bg-emerald-600 dark:bg-emerald-400 dark:hover:bg-emerald-500 dark:text-gray-900'
              }`}
            >
              {isTracing ? 'Generating...' : hasTrace ? '⟳ Regenerate SVG' : '▶ Generate SVG'}
            </button>

            {/* Symmetry mirror buttons */}
            {hasTrace && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Symmetry</p>
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    onClick={async () => {
                      const { mirrorContours } = await import('../services/imageTracer');
                      let contours: string[] = [];
                      try { contours = JSON.parse((parameters.customTraceContours as string) || '[]'); } catch { return; }
                      if (contours.length === 0) return;
                      const w = (parameters.width as number) || 40;
                      const mirrored = mirrorContours(contours, w, 'ltr');
                      setParameter('customTraceContours', JSON.stringify(mirrored));
                      setParameter('customTraceSvg', mirrored.join(' '));
                    }}
                    className="px-2 py-1.5 rounded text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/40 transition-colors"
                  >
                    ← Mirror L → R
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      const { mirrorContours } = await import('../services/imageTracer');
                      let contours: string[] = [];
                      try { contours = JSON.parse((parameters.customTraceContours as string) || '[]'); } catch { return; }
                      if (contours.length === 0) return;
                      const w = (parameters.width as number) || 40;
                      const mirrored = mirrorContours(contours, w, 'rtl');
                      setParameter('customTraceContours', JSON.stringify(mirrored));
                      setParameter('customTraceSvg', mirrored.join(' '));
                    }}
                    className="px-2 py-1.5 rounded text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 hover:bg-violet-200 dark:hover:bg-violet-800/40 transition-colors"
                  >
                    Mirror R → L →
                  </button>
                </div>
              </div>
            )}

            {/* Traced contours — allow removing individual contours (e.g. traced holes) */}
            {hasTrace && (() => {
              let contours: string[] = [];
              try { contours = JSON.parse((parameters.customTraceContours as string) || '[]'); } catch { /* */ }
              if (contours.length <= 1) return null;
              // Find the largest contour (by path length) — that's the outline
              let largestIdx = 0;
              let largestLen = 0;
              contours.forEach((path, i) => {
                if (path.length > largestLen) { largestLen = path.length; largestIdx = i; }
              });
              const contourInfo2 = contours.map((path, i) => {
                const cmdCount = (path.match(/[MCLZ]/gi) || []).length;
                return { path, index: i, cmdCount, isOutline: i === largestIdx };
              });
              return (
                <div className="border border-gray-200 dark:border-gray-600 rounded p-2 space-y-1">
                  <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">
                    Traced Contours ({contours.length})
                  </p>
                  <div className="space-y-0.5 max-h-28 overflow-y-auto">
                    {contourInfo2.map((c) => (
                      <div key={c.index} className="flex items-center justify-between text-xs">
                        <span className="text-gray-700 dark:text-gray-300">
                          {c.isOutline ? '🔲 Outline' : `⭕ Contour ${c.index + 1}`}
                          <span className="text-gray-400 ml-1">({c.cmdCount} pts)</span>
                        </span>
                        {!c.isOutline && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = contours.filter((_, idx) => idx !== c.index);
                              setParameter('customTraceContours', JSON.stringify(updated));
                              setParameter('customTraceSvg', updated.join(' '));
                            }}
                            className="px-1.5 py-0.5 rounded text-[10px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Remove this contour from the trace"
                          >
                            Remove
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* Attachment Hole Detection — only show after trace is complete */}
        {hasImage && hasTrace && (
          <HoleDetectionSection
            parameters={parameters}
            setParameter={setParameter}
            isDetecting={isDetecting}
            setIsDetecting={setIsDetecting}
            retraceAtScale={retraceAtScale}
          />
        )}

        {!hasImage && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Upload a PNG, JPG, or BMP image. The outline will be automatically traced
            into a cuttable vector shape, updating live as you adjust parameters.
          </p>
        )}
      </div>
    </section>
  );
}

function HoleDetectionSection({ parameters, setParameter, isDetecting, setIsDetecting, retraceAtScale }: {
  parameters: Record<string, number | string | boolean>;
  setParameter: (key: string, value: number | string | boolean) => void;
  isDetecting: boolean;
  setIsDetecting: (v: boolean) => void;
  retraceAtScale: (scaleFactor: number) => Promise<void>;
}) {
  const [isScaling, setIsScaling] = useState(false);
  const detectedHoles: Array<{ cx: number; cy: number; radius: number; enabled: boolean; circularity?: number; rawRadius?: number }> =
    (() => { try { return JSON.parse((parameters.customDetectedHoles as string) || '[]'); } catch { return []; } })();

  const hasHoles = detectedHoles.length > 0;
  const enabledCount = detectedHoles.filter(h => h.enabled).length;

  // Best hole for scale reference (most circular enabled, or most circular overall)
  const referenceHole = detectedHoles.find(h => h.enabled) || detectedHoles[0];
  const rawDiameter = referenceHole ? (referenceHole.rawRadius || referenceHole.radius) * 2 : 0;

  // Check if the detected hole is close to a known standard
  const isNearMinifigure = rawDiameter > 0 && Math.abs(rawDiameter - 5.3) < 1.5;
  const isNearMinidoll = rawDiameter > 0 && Math.abs(rawDiameter - 4.8) < 1.5;
  const hasScaled = !!(parameters.customHoleScaleApplied as boolean);

  const runDetection = async () => {
    setIsDetecting(true);
    try {
      const { detectHoles } = await import('../services/imageTracer');
      const found = await detectHoles(
        parameters.customImageData as string,
        (parameters.customThreshold as number) || 128,
        (parameters.customInvert as boolean) || false,
        (parameters.customBlur as number) || 0,
        (parameters.customTraceTargetW as number) || 40,
        (parameters.customTraceTargetH as number) || 40,
      );

      // Store raw detected holes — no auto-scaling
      const holesWithMeta = found.map(h => ({
        cx: h.cx,
        cy: h.cy,
        radius: h.radius,
        rawRadius: h.radius,
        circularity: h.circularity,
        enabled: true,
      }));
      setParameter('customDetectedHoles', JSON.stringify(holesWithMeta));
      setParameter('customHoleScaleApplied', false);
      if (found.length > 0) {
        setParameter('customHoleRadius', Math.round(found[0].radius * 100) / 100);
      }
    } catch { /* ignore */ }
    setIsDetecting(false);
  };

  const applyScale = async (targetDiameter: number) => {
    if (!referenceHole || isScaling) return;
    setIsScaling(true);
    const detectedDiameter = (referenceHole.rawRadius || referenceHole.radius) * 2;
    const scaleFactor = targetDiameter / detectedDiameter;
    const targetRadius = targetDiameter / 2;

    // Scale hole positions + radii
    const scaled = detectedHoles.map(h => ({
      ...h,
      cx: Math.round(h.cx * scaleFactor * 100) / 100,
      cy: Math.round(h.cy * scaleFactor * 100) / 100,
      radius: Math.round(h.radius * scaleFactor * 100) / 100,
    }));
    setParameter('customDetectedHoles', JSON.stringify(scaled));
    setParameter('customHoleRadius', targetRadius);
    setParameter('customHoleScaleApplied', true);

    // Re-trace the entire image at the new scale
    if (Math.abs(scaleFactor - 1) >= 0.01) {
      await retraceAtScale(scaleFactor);
    }
    setIsScaling(false);
  };

  const toggleHole = (idx: number) => {
    const updated = [...detectedHoles];
    updated[idx] = { ...updated[idx], enabled: !updated[idx].enabled };
    setParameter('customDetectedHoles', JSON.stringify(updated));
  };

  const clearHoles = () => {
    setParameter('customDetectedHoles', '[]');
    setParameter('customHoleScaleApplied', false);
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-600 pt-3 space-y-2">
      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">Attachment Holes</h4>

      <button
        type="button"
        onClick={runDetection}
        disabled={isDetecting}
        className={`w-full px-3 py-1.5 rounded text-xs font-medium transition-colors ${
          isDetecting
            ? 'bg-gray-300 dark:bg-gray-600 text-gray-500 cursor-wait'
            : 'bg-indigo-500 text-white hover:bg-indigo-600'
        }`}
      >
        {isDetecting ? 'Detecting...' : hasHoles ? 'Re-detect Holes' : 'Find Attachment Holes'}
      </button>

      {hasHoles && (
        <>
          {/* Detected hole info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded p-2 space-y-1">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Found {detectedHoles.length} hole{detectedHoles.length !== 1 ? 's' : ''} · {enabledCount} enabled
            </p>
            {referenceHole && (
              <p className="text-xs font-medium text-gray-700 dark:text-gray-200">
                Detected hole diameter: <span className="text-blue-600 dark:text-blue-400">{rawDiameter.toFixed(2)}mm</span>
                {isNearMinifigure && <span className="ml-1 text-green-600 dark:text-green-400">(≈ Minifigure 5.3mm)</span>}
                {isNearMinidoll && !isNearMinifigure && <span className="ml-1 text-green-600 dark:text-green-400">(≈ Minidoll 4.8mm)</span>}
              </p>
            )}
          </div>

          {/* Scale to standard buttons */}
          {!hasScaled && referenceHole && (
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 font-semibold">Scale Cape to Hole Size</p>
              <div className="grid grid-cols-2 gap-1">
                {isNearMinifigure && (
                  <button
                    type="button"
                    onClick={() => applyScale(5.3)}
                    disabled={isScaling}
                    className="px-2 py-1.5 rounded text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {isScaling ? 'Scaling...' : 'Minifigure (5.3mm)'}
                  </button>
                )}
                {isNearMinidoll && (
                  <button
                    type="button"
                    onClick={() => applyScale(4.8)}
                    disabled={isScaling}
                    className="px-2 py-1.5 rounded text-xs font-medium bg-green-500 text-white hover:bg-green-600 transition-colors disabled:opacity-50"
                  >
                    {isScaling ? 'Scaling...' : 'Minidoll (4.8mm)'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    const input = prompt('Enter target hole diameter in mm:', '5.3');
                    if (input) { const d = parseFloat(input); if (d > 0 && d <= 20) applyScale(d); }
                  }}
                  disabled={isScaling}
                  className="px-2 py-1.5 rounded text-xs font-medium bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors disabled:opacity-50"
                >
                  Custom size...
                </button>
              </div>
            </div>
          )}

          {hasScaled && (
            <p className="text-xs text-green-600 dark:text-green-400 font-medium">
              ✓ Cape scaled — hole set to {((parameters.customHoleRadius as number) * 2).toFixed(1)}mm diameter
            </p>
          )}

          {/* Hole list with checkboxes */}
          <div className="space-y-1 max-h-32 overflow-y-auto">
            {detectedHoles.map((hole, i) => (
              <div key={i} className="flex items-center gap-2 text-xs">
                <label className="flex items-center gap-2 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hole.enabled}
                    onChange={() => toggleHole(i)}
                    className="rounded"
                  />
                  <span className="text-gray-700 dark:text-gray-300">
                    Hole {i + 1}: ({hole.cx.toFixed(1)}, {hole.cy.toFixed(1)}) ⌀{(hole.radius * 2).toFixed(1)}mm
                    {hole.circularity !== undefined && (
                      <span className="text-gray-400 ml-1">({Math.round(hole.circularity * 100)}%)</span>
                    )}
                  </span>
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const remaining = detectedHoles.filter((_, idx) => idx !== i);
                    setParameter('customDetectedHoles', JSON.stringify(remaining));
                  }}
                  className="w-4 h-4 flex items-center justify-center rounded text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title={`Remove hole ${i + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Manual hole radius override */}
          {enabledCount > 0 && (
            <div className="space-y-1">
              <label className="param-label">Hole Radius
                <span className="text-gray-400 ml-1 font-normal">{((parameters.customHoleRadius as number) || 2.65).toFixed(2)}mm</span>
              </label>
              <input type="range" min={0.5} max={5} step={0.05}
                value={(parameters.customHoleRadius as number) || 2.65}
                onChange={e => setParameter('customHoleRadius', Number(e.target.value))}
                className="param-slider" />
            </div>
          )}

          <div className="flex gap-1">
            {enabledCount > 0 && enabledCount < detectedHoles.length && (
              <button
                type="button"
                onClick={() => {
                  const remaining = detectedHoles.filter(h => !h.enabled);
                  setParameter('customDetectedHoles', JSON.stringify(remaining));
                }}
                className="flex-1 px-2 py-1 rounded text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                Remove selected ({enabledCount})
              </button>
            )}
            <button
              type="button"
              onClick={clearHoles}
              className="flex-1 px-2 py-1 rounded text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            >
              Clear all holes
            </button>
          </div>
        </>
      )}

      {!hasHoles && !isDetecting && (
        <p className="text-xs text-gray-400">
          Searches the traced image for circular openings that could be minifigure attachment holes.
        </p>
      )}
    </div>
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
  const sideStyles = ['none', 'scalloped', 'zigzag', 'wavy', 'castellated', 'torn', 'pointed', 'flame', 'stepped', 'dovetail', 'fishtail', 'feathered', 'cloud', 'sawtooth', 'arrow', 'picot'] as const;

  return (
    <>
      {/* Non-custom: info note + hole options */}
      {!isCustom && (
        <>
        <section className="panel-section border-t pt-4 text-xs text-gray-500">
          <p>This flag uses a fixed shape. Select <strong>Custom</strong> for edge styling and hole options.</p>
        </section>
        <section className="panel-section border-t pt-4">
          <button type="button" className="flex items-center justify-between w-full text-left" onClick={() => toggleSection('flagHoles')}>
            <h3 className="panel-section-title">Attachment Holes</h3>
            <span className="text-gray-400 text-xs">{openSections.flagHoles ? '▾' : '▸'}</span>
          </button>
          {openSections.flagHoles && (
          <div className="mt-2 space-y-2">
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hole Type</label>
              <select
                value={parameters.holeType as string || DEFAULT_HOLE_TYPE}
                onChange={(e) => {
                  const holeType = e.target.value as keyof typeof HOLE_STANDARDS;
                  setParameter('holeType', holeType);
                  setParameter('holeRadius', HOLE_STANDARDS[holeType].radius);
                  setParameter('holeOverrideDiameter', HOLE_STANDARDS[holeType].diameter);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {Object.entries(HOLE_STANDARDS).map(([key, standard]) => (
                  <option key={key} value={key} title={standard.description}>
                    {standard.label}
                  </option>
                ))}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={parameters.holeOverride as boolean || false}
                onChange={(e) => setParameter('holeOverride', e.target.checked)} className="w-4 h-4" />
              <span>Override hole options</span>
            </label>
            {parameters.holeOverride && (
            <div className="ml-2 space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-700">Shape</label>
                <select className="w-full mt-1 text-xs border rounded px-2 py-1"
                  value={(parameters.holeOverrideShape as string) || 'round'}
                  onChange={(e) => setParameter('holeOverrideShape', e.target.value)}>
                  <option value="round">Round</option>
                  <option value="square">Square</option>
                  <option value="oval">Oval</option>
                  <option value="pill">Pill / Stadium</option>
                </select>
              </div>
              {((parameters.holeOverrideShape as string || 'round') === 'round' || (parameters.holeOverrideShape as string || 'round') === 'square') ? (
                <ParameterSlider label="Diameter (mm)" name="holeOverrideDiameter"
                  min={1} max={10} step={0.1}
                  value={(parameters.holeOverrideDiameter as number) || 5.0}
                  onChange={(v) => setParameter('holeOverrideDiameter', v)} />
              ) : (
                <>
                  <ParameterSlider label="Width (mm)" name="holeOverrideWidth"
                    min={1} max={12} step={0.1}
                    value={(parameters.holeOverrideWidth as number) || 5.0}
                    onChange={(v) => setParameter('holeOverrideWidth', v)} />
                  <ParameterSlider label="Height (mm)" name="holeOverrideHeight"
                    min={1} max={12} step={0.1}
                    value={(parameters.holeOverrideHeight as number) || 3.5}
                    onChange={(v) => setParameter('holeOverrideHeight', v)} />
                </>
              )}
              <ParameterSlider label="Horizontal offset (mm)" name="holeOverrideOffsetX"
                min={-5} max={5} step={0.1}
                value={(parameters.holeOverrideOffsetX as number) || 0}
                onChange={(v) => setParameter('holeOverrideOffsetX', v)} />
              <ParameterSlider label="Vertical offset (mm)" name="holeOverrideOffsetY"
                min={-5} max={5} step={0.1}
                value={(parameters.holeOverrideOffsetY as number) || 0}
                onChange={(v) => setParameter('holeOverrideOffsetY', v)} />
            </div>
            )}
          </div>
          )}
        </section>
        </>
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

            {/* Hole Type Selector */}
            <div className="form-group">
              <label className="block text-sm font-medium text-gray-700 mb-1">Hole Type</label>
              <select
                value={parameters.holeType as string || DEFAULT_HOLE_TYPE}
                onChange={(e) => {
                  const holeType = e.target.value as keyof typeof HOLE_STANDARDS;
                  setParameter('holeType', holeType);
                  setParameter('holeRadius', HOLE_STANDARDS[holeType].radius);
                  setParameter('holeOverrideDiameter', HOLE_STANDARDS[holeType].diameter);
                }}
                className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
              >
                {Object.entries(HOLE_STANDARDS).map(([key, standard]) => (
                  <option key={key} value={key} title={standard.description}>
                    {standard.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom hole shape override */}
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={parameters.holeOverride as boolean || false}
                onChange={(e) => setParameter('holeOverride', e.target.checked)} className="w-4 h-4" />
              <span>Override hole options</span>
            </label>
            {parameters.holeOverride && (
            <div className="ml-2 space-y-2">
              <div>
                <label className="text-xs font-medium text-gray-700">Shape</label>
                <select className="w-full mt-1 text-xs border rounded px-2 py-1"
                  value={(parameters.holeOverrideShape as string) || 'round'}
                  onChange={(e) => setParameter('holeOverrideShape', e.target.value)}>
                  <option value="round">Round</option>
                  <option value="square">Square</option>
                  <option value="oval">Oval</option>
                  <option value="pill">Pill / Stadium</option>
                </select>
              </div>
              {((parameters.holeOverrideShape as string || 'round') === 'round' || (parameters.holeOverrideShape as string || 'round') === 'square') ? (
                <ParameterSlider label="Diameter (mm)" name="holeOverrideDiameter"
                  min={1} max={10} step={0.1}
                  value={(parameters.holeOverrideDiameter as number) || 5.0}
                  onChange={(v) => setParameter('holeOverrideDiameter', v)} />
              ) : (
                <>
                  <ParameterSlider label="Width (mm)" name="holeOverrideWidth"
                    min={1} max={12} step={0.1}
                    value={(parameters.holeOverrideWidth as number) || 5.0}
                    onChange={(v) => setParameter('holeOverrideWidth', v)} />
                  <ParameterSlider label="Height (mm)" name="holeOverrideHeight"
                    min={1} max={12} step={0.1}
                    value={(parameters.holeOverrideHeight as number) || 3.5}
                    onChange={(v) => setParameter('holeOverrideHeight', v)} />
                </>
              )}
              <ParameterSlider label="Horizontal offset (mm)" name="holeOverrideOffsetX"
                min={-5} max={5} step={0.1}
                value={(parameters.holeOverrideOffsetX as number) || 0}
                onChange={(v) => setParameter('holeOverrideOffsetX', v)} />
              <ParameterSlider label="Vertical offset (mm)" name="holeOverrideOffsetY"
                min={-5} max={5} step={0.1}
                value={(parameters.holeOverrideOffsetY as number) || 0}
                onChange={(v) => setParameter('holeOverrideOffsetY', v)} />
            </div>
            )}
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
            {(['none', 'flames', 'pointed', 'swallowtail', 'straight', 'scalloped', 'zigzag', 'wavy', 'castellated', 'torn', 'stepped', 'dovetail', 'feathered', 'cloud', 'sawtooth', 'arrow', 'picot'] as const).map((style) => (
              <div key={style}>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="flagBottomStyle" className="w-4 h-4"
                    checked={bottomStyle === style}
                    onChange={() => setParameter('flagBottomStyle', style)} />
                  <span className="capitalize">{style}</span>
                </label>
                {/* Inline sub-options for this style */}
                {bottomStyle === style && (style === 'scalloped' || style === 'zigzag' || style === 'wavy' || style === 'castellated' || style === 'stepped' || style === 'dovetail' || style === 'feathered' || style === 'arrow' || style === 'picot') && (
                  <div className="ml-6 mt-1">
                    <ParameterSlider label="Count" name="flagBottomCount"
                      min={2} max={12} step={1}
                      value={parameters.flagBottomCount as number || 5}
                      onChange={(v) => setParameter('flagBottomCount', v)} />
                    <ParameterSlider label="Depth (mm)" name="flagBottomDepth"
                      min={style === 'scalloped' ? 5 : 1} max={style === 'scalloped' ? 20 : 10} step={0.5}
                      value={parameters.flagBottomDepth as number || (style === 'scalloped' ? 5 : 3)}
                      onChange={(v) => setParameter('flagBottomDepth', v)} />
                  </div>
                )}
                {bottomStyle === style && (style === 'torn' || style === 'cloud') && (
                  <div className="ml-6 mt-1">
                    <ParameterSlider label="Count" name="flagBottomCount"
                      min={2} max={12} step={1}
                      value={parameters.flagBottomCount as number || 5}
                      onChange={(v) => setParameter('flagBottomCount', v)} />
                    <ParameterSlider label="Depth (mm)" name="flagBottomDepth"
                      min={1} max={10} step={0.5}
                      value={parameters.flagBottomDepth as number || 3}
                      onChange={(v) => setParameter('flagBottomDepth', v)} />
                    <ParameterSlider label="Seed" name="flagBottomSeed"
                      min={1} max={100} step={1}
                      value={parameters.flagBottomSeed as number || 42}
                      onChange={(v) => setParameter('flagBottomSeed', v)} />
                  </div>
                )}
                {bottomStyle === style && style === 'sawtooth' && (
                  <div className="ml-6 mt-1">
                    <ParameterSlider label="Count" name="flagBottomCount"
                      min={2} max={12} step={1}
                      value={parameters.flagBottomCount as number || 8}
                      onChange={(v) => setParameter('flagBottomCount', v)} />
                    <ParameterSlider label="Depth (mm)" name="flagBottomDepth"
                      min={1} max={10} step={0.5}
                      value={parameters.flagBottomDepth as number || 3}
                      onChange={(v) => setParameter('flagBottomDepth', v)} />
                    <ParameterSlider label="Curve" name="flagSawtoothCurve"
                      min={0} max={1} step={0.1}
                      value={parameters.flagSawtoothCurve as number || 0}
                      onChange={(v) => setParameter('flagSawtoothCurve', v)} />
                    <label className="flex items-center gap-2 text-xs mt-1">
                      <input type="checkbox" className="w-3 h-3"
                        checked={!!(parameters.flagSawtoothReverse)}
                        onChange={(e) => setParameter('flagSawtoothReverse', e.target.checked)} />
                      Reverse direction
                    </label>
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

/** Dimension slider that displays values in the selected measurement unit */
function DimensionSlider({
  label,
  unit,
  min,
  max,
  value,
  onChange,
}: {
  label: string;
  unit: MeasurementUnit;
  min: number;
  max: number;
  value: number;
  onChange: (mmValue: number) => void;
}) {
  const factor = MM_TO_UNIT[unit];
  const unitLabel = UNIT_LABELS[unit];
  const displayVal = value * factor;
  const decimals = unit === 'mm' ? 1 : unit === 'ldu' ? 1 : 2;
  return (
    <div className="form-group">
      <label className="form-label flex justify-between items-center text-xs">
        <span>{label} ({unitLabel})</span>
        <input
          type="number"
          min={(min * factor).toFixed(decimals)}
          max={(max * factor).toFixed(decimals)}
          step={unit === 'mm' ? 0.5 : unit === 'ldu' ? 1 : unit === 'inches' ? 0.01 : 0.1}
          value={displayVal.toFixed(decimals)}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v)) {
              const mm = v / factor;
              onChange(Math.min(max, Math.max(min, Math.round(mm * 2) / 2)));
            }
          }}
          className="font-mono bg-gray-100 px-2 py-0.5 rounded w-20 text-right text-xs border border-gray-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={0.5}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}
