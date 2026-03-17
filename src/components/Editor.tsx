/**
 * Main Editor Component
 * Three-panel layout: left (element selector), center (preview), right (parameters)
 */

import React, { useState, useMemo } from 'react';
import { useEditorStore } from '../store/editor';
import ParameterPanel from './ParameterPanel';
import PreviewCanvas from './PreviewCanvas';
import ExportPanel from './ExportPanel';
import ElementSelector from './ElementSelector';

export default function Editor() {
  const [showExportPanel, setShowExportPanel] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-6 py-4 shadow-lg">
        <h1 className="text-3xl font-bold">Brick Cloth Studio</h1>
        <p className="text-blue-100 text-sm">LEGO-scale fabric pattern generator</p>
      </header>

      {/* Main content area */}
      <div className="flex flex-1 gap-4 overflow-hidden p-4">
        {/* Left panel: Element selector */}
        <div className="w-48 flex-shrink-0 overflow-y-auto">
          <ElementSelector />
        </div>

        {/* Center: Preview canvas */}
        <div className="flex-1 min-w-0 bg-white rounded-lg shadow overflow-hidden">
          <PreviewCanvas />
        </div>

        {/* Right panel: Parameters and export */}
        <div className="w-64 flex-shrink-0 overflow-y-auto bg-white rounded-lg shadow">
          {!showExportPanel ? (
            <>
              <ParameterPanel />
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowExportPanel(true)}
                  className="btn btn-primary w-full"
                >
                  Export Pattern
                </button>
              </div>
            </>
          ) : (
            <>
              <ExportPanel />
              <div className="p-4 border-t border-gray-200">
                <button
                  onClick={() => setShowExportPanel(false)}
                  className="btn btn-secondary w-full"
                >
                  ← Back to Parameters
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
