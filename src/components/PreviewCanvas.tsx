/**
 * Preview Canvas Component
 * Renders SVG pattern in real millimeter scale with grid and rulers
 */

import React, { useMemo, useRef, useState } from 'react';
import { useEditorStore } from '../store/editor';
import { generatePattern } from '../services/patternGenerator';
import { exportSinglePatternSVG } from '../export/svg';
import { CANVAS_SCALE_MM_TO_PX, CANVAS_GRID_SPACING } from '../utils/constants';

// Real LEGO minifigure dimensions in mm
const MINIFIG_HEIGHT_MM = 40;
const MINIFIG_WIDTH_MM = 24; // including arms
// The neck post is roughly 15% from the top of the minifig
const MINIFIG_NECK_FROM_TOP = 0.15;

export default function PreviewCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null);
  const patternRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(CANVAS_SCALE_MM_TO_PX);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [showMinifig, setShowMinifig] = useState(true);
  const [minifigOnCape, setMinifigOnCape] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
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

  // Compute minifigure SVG overlay — two positions: on cape or to the side
  const minifigSvgOverlay = useMemo(() => {
    if (!pattern) return '';
    const bb = pattern.boundingBox;
    const pad = 10;
    const capeW = bb.width;
    const neckY = 39 * 0.156;
    const imgTopY = neckY - MINIFIG_HEIGHT_MM * MINIFIG_NECK_FROM_TOP;

    // On-cape: centered on cape
    const onCapeX = capeW / 2 - MINIFIG_WIDTH_MM / 2;
    // Side: to the right of the cape with a small gap
    const sideGap = 5;
    const sideX = capeW + sideGap;
    // Align vertically: neck of minifig at same Y as cape holes
    const imgX = minifigOnCape ? onCapeX : sideX;
    const opacity = minifigOnCape ? 0.18 : 0.5;

    // Expand viewBox to fit the side position
    const totalW = sideX + MINIFIG_WIDTH_MM + pad;
    const vbW = Math.max(bb.x + bb.width + pad * 2, totalW + pad);
    const vbH = bb.y + bb.height + pad * 2;

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 ${vbW.toFixed(2)} ${vbH.toFixed(2)}"
      width="${vbW.toFixed(2)}mm" height="${vbH.toFixed(2)}mm"
      style="position:absolute;top:0;left:0;pointer-events:none;">
      <g transform="translate(${pad}, ${pad})">
        <image href="/lego-man-silhouette.png"
          x="${imgX.toFixed(2)}" y="${imgTopY.toFixed(2)}"
          width="${MINIFIG_WIDTH_MM}" height="${MINIFIG_HEIGHT_MM}"
          preserveAspectRatio="xMidYMid meet"
          opacity="${opacity}"
          style="cursor:pointer;pointer-events:all;" />
      </g>
    </svg>`;
  }, [pattern, minifigOnCape]);

  // Generate LEGO 8mm grid SVG overlay
  const gridSvgOverlay = useMemo(() => {
    if (!pattern) return '';
    const bb = pattern.boundingBox;
    const pad = 10;
    const vbW = bb.x + bb.width + pad * 2;
    const vbH = bb.y + bb.height + pad * 2;
    const g = CANVAS_GRID_SPACING; // 8mm
    return `<svg xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 ${vbW.toFixed(2)} ${vbH.toFixed(2)}"
      width="${vbW.toFixed(2)}mm" height="${vbH.toFixed(2)}mm"
      style="position:absolute;top:0;left:0;pointer-events:none;">
      <defs>
        <pattern id="lego-grid" x="${pad}" y="${pad}" width="${g}" height="${g}" patternUnits="userSpaceOnUse">
          <rect width="${g}" height="${g}" fill="none" stroke="#ccc" stroke-width="0.1" />
          <circle cx="${g / 2}" cy="${g / 2}" r="2.4" fill="none" stroke="#ddd" stroke-width="0.08" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#lego-grid)" />
    </svg>`;
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
        {/* LEGO grid */}
        {showGrid && (
          <div
            dangerouslySetInnerHTML={{ __html: gridSvgOverlay }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
            }}
          />
        )}
        {/* Minifigure silhouette */}
        {showMinifig && (
          <div
            dangerouslySetInnerHTML={{ __html: minifigSvgOverlay }}
            onClick={() => setMinifigOnCape(!minifigOnCape)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              cursor: 'pointer',
            }}
          />
        )}
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
        <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="w-3 h-3" />
          <span className="text-gray-600">LEGO grid (8mm)</span>
        </label>
        <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
          <input type="checkbox" checked={showMinifig} onChange={(e) => setShowMinifig(e.target.checked)} className="w-3 h-3" />
          <span className="text-gray-600">Minifig scale</span>
        </label>
      </div>

      {/* Pattern info */}
      <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded shadow text-xs border-l-4 border-green-500">
        <div className="font-bold text-gray-900">{pattern.name}</div>
        <div className="text-gray-500">Scroll to zoom · drag to pan</div>
      </div>
    </div>
  );
}
