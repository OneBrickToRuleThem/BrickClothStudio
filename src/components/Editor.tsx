/**
 * Main Editor Component
 * Responsive layout: desktop 3-column, mobile stacked with tab navigation
 */

import React, { useState } from 'react';
import ParameterPanel from './ParameterPanel';
import PreviewCanvas from './PreviewCanvas';
import ExportPanel from './ExportPanel';
import ElementSelector from './ElementSelector';

type MobileTab = 'elements' | 'preview' | 'settings';

export default function Editor() {
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('preview');

  return (
    <div className="flex h-screen flex-col bg-gray-100">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white px-4 sm:px-6 py-3 sm:py-4 shadow-lg">
        <h1 className="text-xl sm:text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" }}>Brick Cloth Studio</h1>
        <p className="text-blue-100 text-xs sm:text-sm" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" }}>Minifig-scale fabric pattern generator</p>
      </header>

      {/* Mobile tab bar — visible only on small screens */}
      <div className="flex md:hidden border-b bg-white">
        {([
          { key: 'elements' as MobileTab, label: 'Elements' },
          { key: 'preview' as MobileTab, label: 'Preview' },
          { key: 'settings' as MobileTab, label: 'Settings' },
        ]).map(tab => (
          <button
            key={tab.key}
            onClick={() => setMobileTab(tab.key)}
            className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
              mobileTab === tab.key
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Desktop layout (md+): 3-column */}
      <div className="hidden md:flex flex-1 gap-4 overflow-hidden p-4">
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

      {/* Mobile layout (< md): tabbed panels */}
      <div className="flex md:hidden flex-1 overflow-hidden">
        {mobileTab === 'elements' && (
          <div className="flex-1 overflow-y-auto p-3">
            <ElementSelector />
          </div>
        )}

        {mobileTab === 'preview' && (
          <div className="flex-1 min-w-0 bg-white overflow-hidden">
            <PreviewCanvas />
          </div>
        )}

        {mobileTab === 'settings' && (
          <div className="flex-1 overflow-y-auto bg-white">
            {!showExportPanel ? (
              <>
                <ParameterPanel />
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => {
                      setShowExportPanel(true);
                    }}
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
        )}
      </div>
    </div>
  );
}
