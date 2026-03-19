/**
 * Export Panel Component
 * Handles single pattern export, print sheet generation, and calibration tests
 */

import React, { useMemo } from 'react';
import { useEditorStore } from '../store/editor';
import { generatePattern } from '../services/patternGenerator';
import { exportSinglePatternSVG, exportPrintSheetSVG, downloadSVG } from '../export/svg';
import { generateStandardCalibration } from '../templates/calibration';

export default function ExportPanel() {
  const {
    elementType,
    templateVariant,
    parameters,
    printConfig,
    setPrintConfig,
    exportOptions,
    setExportOptions,
  } = useEditorStore();

  const pattern = useMemo(() => {
    return generatePattern(elementType, templateVariant, parameters);
  }, [elementType, templateVariant, parameters]);

  const handleExportSingle = () => {
    if (!pattern) return;
    const svg = exportSinglePatternSVG(pattern, exportOptions);
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

  if (!pattern) {
    return <div className="p-4 text-gray-500">Loading export options...</div>;
  }

  return (
    <div className="p-4 h-full overflow-y-auto space-y-4">
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

      {/* Single Export */}
      <section className="panel-section">
        <h3 className="panel-section-title">Single Pattern</h3>
        <button onClick={handleExportSingle} className="btn btn-primary w-full text-sm mb-2">
          ↓ Export SVG
        </button>
        <p className="text-xs text-gray-500">
          Downloads {pattern.name} as a single SVG file for cutting
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
