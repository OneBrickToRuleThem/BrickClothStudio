/**
 * Main Editor Component
 * Responsive layout: desktop 3-column, mobile stacked with tab navigation
 */

import React, { useEffect, useState, useCallback } from 'react';
import ParameterPanel from './ParameterPanel';
import PreviewCanvas from './PreviewCanvas';
import ExportPanel from './ExportPanel';
import ElementSelector from './ElementSelector';
import DecorationPanel from './DecorationPanel';
import { useEditorStore } from '../store/editor';

type MobileTab = 'elements' | 'preview' | 'settings';
type RightPanel = 'parameters' | 'decorations' | 'export';

export default function Editor() {
  const [rightPanel, setRightPanel] = useState<RightPanel>('parameters');
  const [mobileTab, setMobileTab] = useState<MobileTab>('preview');
  const elementType = useEditorStore((s) => s.elementType);
  const theme = useEditorStore((s) => s.theme);
  const toggleTheme = useEditorStore((s) => s.toggleTheme);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const historyIndex = useEditorStore((s) => s.historyIndex);
  const historyLength = useEditorStore((s) => s.history.length);

  // Toggle dark class on <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  // Switch back to parameters panel when element type changes
  useEffect(() => {
    setRightPanel('parameters');
  }, [elementType]);

  // Keyboard shortcuts for undo/redo
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      undo();
    } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      redo();
    }
  }, [undo, redo]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div className="flex h-screen flex-col bg-gray-100 dark:bg-gray-900 dark:text-gray-200">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-950 text-white px-4 sm:px-6 py-3 sm:py-4 shadow-lg">
        <h1 className="text-xl sm:text-3xl font-semibold tracking-tight" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" }}>Brick Cloth Studio</h1>
        <p className="text-blue-100 text-xs sm:text-sm" style={{ fontFamily: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif" }}>Minifig-scale fabric pattern generator</p>
      </header>

      {/* Mobile tab bar — visible only on small screens */}
      <div className="flex md:hidden border-b bg-white dark:bg-gray-800 dark:border-gray-700">
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
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:bg-blue-900/30'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
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
        <div className="flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <PreviewCanvas />
        </div>

        {/* Right panel: Parameters, Decorations, Export */}
        <div className="w-64 flex-shrink-0 overflow-y-auto bg-white dark:bg-gray-800 rounded-lg shadow flex flex-col">
          {/* Panel tabs */}
          <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            {([
              { key: 'parameters' as RightPanel, label: 'Adjust' },
              { key: 'decorations' as RightPanel, label: 'Design' },
              { key: 'export' as RightPanel, label: 'Export' },
            ]).map(tab => (
              <button
                key={tab.key}
                onClick={() => setRightPanel(tab.key)}
                className={`flex-1 py-2 text-xs font-medium transition-colors ${
                  rightPanel === tab.key
                    ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:bg-blue-900/30'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex-1 overflow-y-auto">
            {rightPanel === 'parameters' && <ParameterPanel />}
            {rightPanel === 'decorations' && <DecorationPanel />}
            {rightPanel === 'export' && <ExportPanel />}
          </div>
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
          <div className="flex-1 overflow-y-auto bg-white dark:bg-gray-800 flex flex-col">
            {/* Panel tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              {([
                { key: 'parameters' as RightPanel, label: 'Adjust' },
                { key: 'decorations' as RightPanel, label: 'Design' },
                { key: 'export' as RightPanel, label: 'Export' },
              ]).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setRightPanel(tab.key)}
                  className={`flex-1 py-2 text-xs font-medium transition-colors ${
                    rightPanel === tab.key
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:text-blue-400 dark:border-blue-400 dark:bg-blue-900/30'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto">
              {rightPanel === 'parameters' && <ParameterPanel />}
              {rightPanel === 'decorations' && <DecorationPanel />}
              {rightPanel === 'export' && <ExportPanel />}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="flex-shrink-0 px-3 py-1 text-[10px] text-gray-400 dark:text-gray-500 flex items-center gap-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        {/* Undo/Redo */}
        <div className="flex items-center gap-1">
          <button onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)"
            className="px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">
            ↩
          </button>
          <button onClick={redo} disabled={historyIndex >= historyLength - 1} title="Redo (Ctrl+Y)"
            className="px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-30 disabled:cursor-not-allowed">
            ↪
          </button>
        </div>
        <span className="hidden sm:inline">·</span>
        {/* Theme toggle */}
        <button onClick={toggleTheme} title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          className="px-1.5 py-0.5 rounded text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700">
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
        <span className="hidden sm:inline">·</span>
        <span>Created by <a href="https://www.instagram.com/OneBrickToRuleThem" target="_blank" rel="noopener noreferrer" className="hover:text-gray-600 dark:hover:text-gray-300 underline">OneBrickToRuleThem</a> (Jason Gianou)</span>
        <span className="hidden sm:inline">·</span>
        <a href="https://github.com/OneBrickToRuleThem/BrickClothStudio#readme" target="_blank" rel="noopener noreferrer" className="hidden sm:inline hover:text-gray-600 dark:hover:text-gray-300 underline">README</a>
        <span className="hidden sm:inline">·</span>
        <a href="https://github.com/OneBrickToRuleThem/BrickClothStudio/issues" target="_blank" rel="noopener noreferrer" className="hidden sm:inline hover:text-gray-600 dark:hover:text-gray-300 underline">Feedback</a>
        <span className="ml-auto text-gray-300 dark:text-gray-600">Not affiliated with LEGO® Group. For personal use only.</span>
      </footer>
    </div>
  );
}
