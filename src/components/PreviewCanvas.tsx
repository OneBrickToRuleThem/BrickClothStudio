/**
 * Preview Canvas Component
 * Renders SVG pattern in real millimeter scale with grid and rulers
 */

import React, { useMemo, useRef, useState } from 'react';
import { useEditorStore } from '../store/editor';
import { generatePattern } from '../services/patternGenerator';
import { exportSinglePatternSVG } from '../export/svg';
import { CANVAS_SCALE_MM_TO_PX, CANVAS_GRID_SPACING } from '../utils/constants';

export default function PreviewCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const patternRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(CANVAS_SCALE_MM_TO_PX);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const { elementType, templateVariant, parameters } = useEditorStore();

  // Generate pattern based on current parameters
  const pattern = useMemo(() => {
    try {
      return generatePattern(elementType, templateVariant, parameters);
    } catch (error) {
      console.error('Error generating pattern:', error);
      return null;
    }
  }, [elementType, templateVariant, parameters]);

  // Generate SVG string
  const svgString = useMemo(() => {
    if (!pattern) return '';
    return exportSinglePatternSVG(pattern);
  }, [pattern]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setScale((s) => Math.max(0.5, Math.min(5, s * delta)));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) { // Left mouse button
      setIsDragging(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (!pattern) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-gray-500 text-center">
          <p className="text-lg font-medium">Loading pattern...</p>
          <p className="text-sm mt-2">Scroll to zoom, drag to pan</p>
        </div>
      </div>
    );
  }

  const bb = pattern.boundingBox;
  const svgWidth = bb.width;
  const svgHeight = bb.height;
  const displayWidth = svgWidth * scale;
  const displayHeight = svgHeight * scale;
  const gridSpacing = CANVAS_GRID_SPACING * scale;

  return (
    <div
      ref={canvasRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="w-full h-full bg-white flex items-center justify-center"
      style={{ 
        overflow: 'hidden',
        position: 'relative',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none'
      }}
    >
      <div 
        ref={patternRef}
        className="relative inline-block"
        style={{ 
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
          transformOrigin: '0 0',
          transition: isDragging ? 'none' : 'transform 0.1s ease-out'
        }}
      >
        {/* Pattern SVG */}
        <div
          dangerouslySetInnerHTML={{ __html: svgString }}
          style={{
            width: svgWidth,
            height: svgHeight,
          }}
        />
      </div>

      {/* Zoom and scale indicator */}
      <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded shadow text-xs text-gray-700 border-l-4 border-blue-500">
        <div className="font-bold">{Math.round(scale * 100)}% Zoom</div>
        <div className="text-gray-500 mt-1">{svgWidth.toFixed(1)}mm × {svgHeight.toFixed(1)}mm</div>
      </div>

      {/* Pattern info */}
      <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded shadow text-xs border-l-4 border-green-500">
        <div className="font-bold text-gray-900">{pattern.name}</div>
        <div className="text-gray-500">Scroll to zoom · drag to pan</div>
      </div>
    </div>
  );
}
