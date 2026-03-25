/**
 * Export Panel Component
 * Handles single pattern export, print sheet generation, and calibration tests
 */

import React, { useMemo, useRef } from 'react';
import { useEditorStore } from '../store/editor';
import { generatePattern } from '../services/patternGenerator';
import { exportSinglePatternSVG, exportPrintSheetSVG, downloadSVG } from '../export/svg';
import type { ColorDesignParams } from '../export/svg';
import { generateStandardCalibration } from '../templates/calibration';
import { downloadPreset, loadPresetFromFile } from '../utils/presets';
import type { DesignPreset } from '../utils/types';

export default function ExportPanel() {
  const {
    elementType,
    templateVariant,
    parameters,
    printConfig,
    setPrintConfig,
    exportOptions,
    setExportOptions,
    decorations,
    loadPreset,
  } = useEditorStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const pattern = useMemo(() => {
    return generatePattern(elementType, templateVariant, parameters);
  }, [elementType, templateVariant, parameters]);

  const colorDesign = useMemo((): ColorDesignParams | undefined => {
    if (!exportOptions.includeDesigns) return undefined;
    const splitCount = (parameters.colorSplitCount as number) || 0;
    let splitColors: string[] = [];
    try { splitColors = JSON.parse((parameters.colorSplitColors as string) || '[]'); } catch { splitColors = []; }
    let stripeColors: string[] = [];
    try { stripeColors = JSON.parse((parameters.stripeColors as string) || '["#1a1a8a","#c0c0c0"]'); } catch { stripeColors = ['#1a1a8a', '#c0c0c0']; }
    const edgeEnabled = !!parameters.edgeColorEnabled;
    const stripeEnabled = !!parameters.stripeEnabled;
    if (splitCount < 1 && !edgeEnabled && !stripeEnabled) return undefined;
    return {
      colorSplitCount: splitCount,
      colorSplitAngle: (parameters.colorSplitAngle as number) || 0,
      colorSplitColors: splitColors,
      edgeColorEnabled: edgeEnabled,
      edgeColorWidth: (parameters.edgeColorWidth as number) || 2,
      edgeColor: (parameters.edgeColor as string) || '#8B4513',
      stripeEnabled: stripeEnabled,
      stripeWidth: (parameters.stripeWidth as number) || 3,
      stripeAngle: (parameters.stripeAngle as number) || 0,
      stripeColors: stripeColors,
    };
  }, [exportOptions.includeDesigns, parameters]);

  const handleExportSingle = () => {
    if (!pattern) return;
    const svg = exportSinglePatternSVG(pattern, exportOptions, decorations, colorDesign);
    downloadSVG(svg, `${pattern.name}.svg`);
  };

  const handleExportCalibration = () => {
    const calibPattern = generateStandardCalibration();
    const svg = exportSinglePatternSVG(calibPattern, exportOptions);
    downloadSVG(svg, 'calibration-test.svg');
  };

  const handleExportMultiple = () => {
    if (!pattern) return;
    const { copies, paperSize, orientation, autoRotate } = printConfig;
    const margin = printConfig.marginTop;
    const gutter = printConfig.gutterX;
    const patterns = Array.from({ length: copies }, () => pattern);
    const svg = exportPrintSheetSVG(patterns, paperSize, orientation, margin, gutter, autoRotate, exportOptions);
    downloadSVG(svg, `${pattern.name}-x${copies}.svg`);
  };

  const handleSaveDesign = () => {
    const name = pattern?.name || 'design';
    downloadPreset(
      { elementType, templateVariant, parameters, decorations, selectedDecorationId: null },
      name,
      `${name} design specification`
    );
  };

  const handleLoadDesign = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    loadPresetFromFile(
      file,
      (preset: DesignPreset) => {
        loadPreset({
          elementType: preset.elementType,
          templateVariant: preset.templateVariant,
          parameters: preset.parameters,
          decorations: preset.decorations || [],
          selectedDecorationId: null,
        });
      },
      (error: string) => {
        alert(`Failed to load design: ${error}`);
      }
    );
    // Reset input so same file can be reloaded
    e.target.value = '';
  };

  if (!pattern) {
    return <div className="p-4 text-gray-500">Loading export options...</div>;
  }

  return (
    <div className="p-4 h-full overflow-y-auto space-y-4">
      {/* Save / Load Design Spec */}
      <section className="panel-section bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-lg p-4">
        <h3 className="panel-section-title mb-2">Design Specification</h3>
        <div className="flex gap-2">
          <button
            onClick={handleSaveDesign}
            className="btn bg-green-600 hover:bg-green-700 text-white font-semibold flex-1 text-sm py-2 rounded-lg"
          >
            💾 Save Design
          </button>
          <button
            onClick={handleLoadDesign}
            className="btn bg-gray-600 hover:bg-gray-700 text-white font-semibold flex-1 text-sm py-2 rounded-lg"
          >
            📂 Load Design
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileSelected}
          className="hidden"
        />
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
          Save/load all parameters, decorations, and settings as a .json design file
        </p>
      </section>

      {/* Quick Download Button */}
      <section className="panel-section bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <button 
          onClick={handleExportSingle} 
          className="btn bg-blue-600 hover:bg-blue-700 text-white font-bold w-full text-base py-3 mb-2 rounded-lg shadow-md"
        >
          ⬇️ DOWNLOAD {pattern.name.toUpperCase()}
        </button>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Ready to cut! Downloads as SVG file
        </p>
      </section>

      {/* Multiple Copies / Sheet Layout */}
      <section className="panel-section border-t pt-4">
        <h3 className="panel-section-title">Sheet Export</h3>
        <label className="form-label text-xs">
          Paper size:
          <select
            value={printConfig.paperSize}
            onChange={(e) =>
              setPrintConfig({ paperSize: e.target.value as 'A4' | 'LETTER' })
            }
            className="param-input mt-1 text-sm"
          >
            <option value="A4">A4 (210×297 mm)</option>
            <option value="LETTER">US Letter (216×279 mm)</option>
          </select>
        </label>
        <label className="form-label text-xs mt-2">
          Orientation:
          <select
            value={printConfig.orientation}
            onChange={(e) =>
              setPrintConfig({ orientation: e.target.value as 'portrait' | 'landscape' })
            }
            className="param-input mt-1 text-sm"
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </label>
        <label className="form-label text-xs mt-2">
          Number of copies:
          <input
            type="number"
            min="1"
            max="20"
            value={printConfig.copies}
            onChange={(e) =>
              setPrintConfig({ copies: parseInt(e.target.value) || 1 })
            }
            className="param-input mt-1 text-sm"
          />
        </label>
        <button onClick={handleExportMultiple} className="btn btn-primary w-full text-sm mt-3 mb-2">
          ↓ Export Sheet SVG
        </button>
        <p className="text-xs text-gray-500">
          Lays out {printConfig.copies} copy(ies) on a single {printConfig.paperSize} {printConfig.orientation} sheet
        </p>
      </section>

      {/* Design Export */}
      <section className="panel-section border-t pt-4">
        <h3 className="panel-section-title">Design Colors</h3>
        <label className="flex items-center gap-2 text-xs cursor-pointer">
          <input type="checkbox"
            checked={exportOptions.includeDesigns}
            onChange={(e) => setExportOptions({ includeDesigns: e.target.checked })}
            className="w-3.5 h-3.5" />
          Include color designs in export
        </label>
        <p className="text-xs text-gray-500 mt-1">
          Exports color split and edge color bands into the SVG file
        </p>
      </section>

      {/* Calibration Test */}
      <section className="panel-section border-t pt-4">
        <h3 className="panel-section-title">Calibration</h3>
        <button
          onClick={handleExportCalibration}
          className="btn btn-secondary w-full text-sm mb-2"
        >
          ↓ Calibration Test
        </button>
        <p className="text-xs text-gray-500">
          Generates test holes (4.8-5.2 mm) to verify fit with your equipment
        </p>
      </section>

      {/* Export Options */}
      <section className="panel-section border-t pt-4">
        <h3 className="panel-section-title">Line Settings</h3>
        <label className="form-label text-xs">
          Stroke width (mm):
          <input
            type="number"
            min="0.01"
            max="1.0"
            step="0.01"
            value={exportOptions.strokeWidth}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v >= 0.01 && v <= 1.0)
                setExportOptions({ strokeWidth: v });
            }}
            className="param-input mt-1 text-sm"
          />
        </label>
        <div className="space-y-2 mt-3">
          <label className="flex items-center gap-2 text-xs">
            <input type="color" value={exportOptions.lineColors.cut}
              onChange={(e) => setExportOptions({ lineColors: { ...exportOptions.lineColors, cut: e.target.value } })}
              className="w-6 h-6 rounded border border-gray-300 cursor-pointer" />
            Cut line color
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="color" value={exportOptions.lineColors.score}
              onChange={(e) => setExportOptions({ lineColors: { ...exportOptions.lineColors, score: e.target.value } })}
              className="w-6 h-6 rounded border border-gray-300 cursor-pointer" />
            Score line color
          </label>
          <label className="flex items-center gap-2 text-xs">
            <input type="color" value={exportOptions.lineColors.engrave}
              onChange={(e) => setExportOptions({ lineColors: { ...exportOptions.lineColors, engrave: e.target.value } })}
              className="w-6 h-6 rounded border border-gray-300 cursor-pointer" />
            Engrave line color
          </label>
        </div>
      </section>

      {/* Info */}
      <section className="panel-section border-t pt-4 text-xs text-gray-600 pb-4">
        <p className="font-semibold mb-2">Export Information:</p>
        <p>✓ All dimensions in millimeters (mm)</p>
        <p>✓ Viewbox uses mm scale</p>
        <p>✓ SVG compliant for laser/Cricut</p>
        <p className="text-gray-500 mt-2">
          Tip: Use cut (red) layer for laser cutting, and other layers for scoring/engraving
        </p>
      </section>
    </div>
  );
}
