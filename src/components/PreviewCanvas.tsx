/**
 * Preview Canvas Component
 * Renders SVG pattern in real millimeter scale with grid and rulers
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useEditorStore } from '../store/editor';
import { generatePattern } from '../services/patternGenerator';
import { exportSinglePatternSVG } from '../export/svg';
import { CANVAS_SCALE_MM_TO_PX, CANVAS_GRID_SPACING, SAIL_HOLE_STANDARDS } from '../utils/constants';
import type { SailHoleType } from '../utils/constants';
import minifigUrl from '/lego-man-silhouette.png';

// CSS mm-to-px conversion factor (CSS spec: 1in = 96px, 1in = 25.4mm)
const CSS_MM_TO_PX = 96 / 25.4; // ~3.7795275591

// Minifigure dimensions in mm
const MINIFIG_HEIGHT_MM = 40;
const MINIFIG_WIDTH_MM = 24;
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
  const [centered, setCentered] = useState(false);
  const [draggingGrommet, setDraggingGrommet] = useState<string | null>(null);
  const { elementType, templateVariant, parameters, setParameter } = useEditorStore();

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
        <image href="${minifigUrl}"
          x="${imgX.toFixed(2)}" y="${imgTopY.toFixed(2)}"
          width="${MINIFIG_WIDTH_MM}" height="${MINIFIG_HEIGHT_MM}"
          preserveAspectRatio="xMidYMid meet"
          opacity="${opacity}"
          style="cursor:pointer;pointer-events:all;" />
      </g>
    </svg>`;
  }, [pattern, minifigOnCape]);

  // Center the pattern in the canvas on first render and when element type changes
  const prevElementRef = useRef<string>('');
  useEffect(() => {
    if (!pattern || !canvasRef.current) return;
    // Only re-center when element type or variant changes, not on every parameter tweak
    const elementKey = `${elementType}:${templateVariant}`;
    if (prevElementRef.current === elementKey && centered) return;
    prevElementRef.current = elementKey;

    const rect = canvasRef.current.getBoundingClientRect();
    const bb = pattern.boundingBox;
    const patternW = (bb.x + bb.width + 20) * CSS_MM_TO_PX;
    const patternH = (bb.y + bb.height + 20) * CSS_MM_TO_PX;
    const initScale = Math.min(
      rect.width * 0.9 / patternW,
      rect.height * 0.9 / patternH,
      CANVAS_SCALE_MM_TO_PX * 2
    );
    setPanOffset({
      x: (rect.width - patternW * initScale) / 2,
      y: (rect.height - patternH * initScale) / 2,
    });
    setScale(initScale);
    setCentered(true);
  }, [pattern, elementType, templateVariant, centered]);

  // --- Sail grommet dragging ---
  const isSail = elementType === 'sail';
  const isSquareSail = templateVariant === 'square-sail';

  const sailGrommets = useMemo(() => {
    if (!isSail || !pattern) return [];
    const w = (parameters.width as number) || 60;
    const h = (parameters.length as number) || 60;
    const grommets: Array<{ id: string; x: number; y: number; paramX: string; paramY: string; corner: string }> = [];

    grommets.push({
      id: 'TL', corner: 'Top-Left',
      x: (parameters.sailGrommetTLx as number) || 4,
      y: (parameters.sailGrommetTLy as number) || 4,
      paramX: 'sailGrommetTLx', paramY: 'sailGrommetTLy',
    });
    if (isSquareSail) {
      grommets.push({
        id: 'TR', corner: 'Top-Right',
        x: w - ((parameters.sailGrommetTRx as number) || 4),
        y: (parameters.sailGrommetTRy as number) || 4,
        paramX: 'sailGrommetTRx', paramY: 'sailGrommetTRy',
      });
    }
    grommets.push({
      id: 'BL', corner: 'Bottom-Left',
      x: (parameters.sailGrommetBLx as number) || 4,
      y: h - ((parameters.sailGrommetBLy as number) || 4),
      paramX: 'sailGrommetBLx', paramY: 'sailGrommetBLy',
    });
    grommets.push({
      id: 'BR', corner: 'Bottom-Right',
      x: w - ((parameters.sailGrommetBRx as number) || 4),
      y: h - ((parameters.sailGrommetBRy as number) || 4),
      paramX: 'sailGrommetBRx', paramY: 'sailGrommetBRy',
    });
    return grommets;
  }, [isSail, isSquareSail, pattern, parameters]);

  const screenToMM = useCallback((clientX: number, clientY: number): { x: number; y: number } => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    const mmX = (cx - panOffset.x) / scale / CSS_MM_TO_PX - 10;
    const mmY = (cy - panOffset.y) / scale / CSS_MM_TO_PX - 10;
    return { x: mmX, y: mmY };
  }, [panOffset, scale]);

  const handleGrommetPointerDown = useCallback((e: React.PointerEvent, grommetId: string) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDraggingGrommet(grommetId);
  }, []);

  const handleGrommetPointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingGrommet) return;
    e.stopPropagation();
    e.preventDefault();
    const mm = screenToMM(e.clientX, e.clientY);
    let w = (parameters.width as number) || 60;
    let h = (parameters.length as number) || 60;
    const minEdge = 2; // minimum gap from grommet center to sail edge
    const symmetry = !!parameters.sailSymmetry;

    // Expand sail when grommet is dragged past right/bottom edges
    if (mm.x > w - minEdge) {
      w = Math.ceil((mm.x + minEdge) * 2) / 2;
      setParameter('width', w);
    }
    if (mm.y > h - minEdge) {
      h = Math.ceil((mm.y + minEdge) * 2) / 2;
      setParameter('length', h);
    }

    // Expand sail to the left: grow width, shift left-side insets (except the one being dragged)
    if (mm.x < minEdge) {
      const shift = minEdge - mm.x;
      w += shift;
      setParameter('width', w);
      if (draggingGrommet !== 'TL') setParameter('sailGrommetTLx', ((parameters.sailGrommetTLx as number) || 4) + shift);
      if (draggingGrommet !== 'BL') setParameter('sailGrommetBLx', ((parameters.sailGrommetBLx as number) || 4) + shift);
    }

    // Expand sail to the top: grow height, shift top-side insets (except the one being dragged)
    if (mm.y < minEdge) {
      const shift = minEdge - mm.y;
      h += shift;
      setParameter('length', h);
      if (draggingGrommet !== 'TL') setParameter('sailGrommetTLy', ((parameters.sailGrommetTLy as number) || 4) + shift);
      if (draggingGrommet !== 'TR') setParameter('sailGrommetTRy', ((parameters.sailGrommetTRy as number) || 4) + shift);
    }

    // Clamp position within sail bounds
    const cx = Math.max(minEdge, Math.min(w - minEdge, mm.x));
    const cy = Math.max(minEdge, Math.min(h - minEdge, mm.y));

    // Bilateral symmetry mirrors left↔right (TL↔TR, BL↔BR)
    switch (draggingGrommet) {
      case 'TL': {
        const ix = cx;
        const iy = cy;
        setParameter('sailGrommetTLx', ix);
        setParameter('sailGrommetTLy', iy);
        if (symmetry) {
          setParameter('sailGrommetTRx', ix);
          setParameter('sailGrommetTRy', iy);
        }
        break;
      }
      case 'TR': {
        const ix = w - cx;
        const iy = cy;
        setParameter('sailGrommetTRx', ix);
        setParameter('sailGrommetTRy', iy);
        if (symmetry) {
          setParameter('sailGrommetTLx', ix);
          setParameter('sailGrommetTLy', iy);
        }
        break;
      }
      case 'BL': {
        const ix = cx;
        const iy = h - cy;
        setParameter('sailGrommetBLx', ix);
        setParameter('sailGrommetBLy', iy);
        if (symmetry) {
          setParameter('sailGrommetBRx', ix);
          setParameter('sailGrommetBRy', iy);
        }
        break;
      }
      case 'BR': {
        const ix = w - cx;
        const iy = h - cy;
        setParameter('sailGrommetBRx', ix);
        setParameter('sailGrommetBRy', iy);
        if (symmetry) {
          setParameter('sailGrommetBLx', ix);
          setParameter('sailGrommetBLy', iy);
        }
        break;
      }
    }
  }, [draggingGrommet, screenToMM, parameters, setParameter]);

  const handleGrommetPointerUp = useCallback((e: React.PointerEvent) => {
    if (draggingGrommet) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDraggingGrommet(null);
    }
  }, [draggingGrommet]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Mouse position relative to the canvas container
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const newScale = Math.max(0.5, Math.min(5, scale * factor));
    const ratio = newScale / scale;
    // Adjust pan so the point under the mouse stays fixed
    setPanOffset({
      x: mx - ratio * (mx - panOffset.x),
      y: my - ratio * (my - panOffset.y),
    });
    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (draggingGrommet) return; // Don't pan while dragging grommet
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

  // LEGO grid as a CSS background on the outer canvas.
  // 1mm in the SVG = CSS_MM_TO_PX screen pixels, then scaled by the zoom factor.
  const gridSpacingPx = CANVAS_GRID_SPACING * CSS_MM_TO_PX * scale;
  const studRadius = 2.4 * CSS_MM_TO_PX * scale;       // 2.4mm stud radius
  const strokeHalf = 0.5;                                // grid line width (px)
  const gridBackground = showGrid
    ? {
        backgroundImage: [
          // Cell border grid
          `linear-gradient(to right, #ccc ${strokeHalf}px, transparent ${strokeHalf}px)`,
          `linear-gradient(to bottom, #ccc ${strokeHalf}px, transparent ${strokeHalf}px)`,
          // Stud circle (ring)
          `radial-gradient(circle ${studRadius}px at ${gridSpacingPx / 2}px ${gridSpacingPx / 2}px, transparent ${studRadius - 1}px, #ddd ${studRadius - 1}px, #ddd ${studRadius}px, transparent ${studRadius}px)`,
        ].join(', '),
        backgroundSize: `${gridSpacingPx}px ${gridSpacingPx}px`,
        backgroundPosition: `${panOffset.x % gridSpacingPx}px ${panOffset.y % gridSpacingPx}px`,
      }
    : {};

  return (
    <div
      ref={canvasRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className="w-full h-full bg-white"
      style={{ 
        overflow: 'hidden',
        position: 'relative',
        cursor: isDragging ? 'grabbing' : 'grab',
        userSelect: 'none',
        ...gridBackground,
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

        {/* Sail grommet drag handles */}
        {isSail && pattern && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              overflow: 'visible',
            }}
            viewBox={`0 0 ${(pattern.boundingBox.width + 20).toFixed(2)} ${(pattern.boundingBox.height + 20).toFixed(2)}`}
            width={`${(pattern.boundingBox.width + 20).toFixed(2)}mm`}
            height={`${(pattern.boundingBox.height + 20).toFixed(2)}mm`}
          >
            {sailGrommets.map((g) => {
              const holeType = (parameters.sailHoleType as string) || 'grommet';
              const std = SAIL_HOLE_STANDARDS[holeType as SailHoleType] || SAIL_HOLE_STANDARDS.grommet;
              const handleR = Math.max(std.radius * 1.8, 2.5);
              const cx = g.x + 10;
              const cy = g.y + 10;
              return (
                <g key={g.id}>
                  {/* Visible ring */}
                  <circle cx={cx} cy={cy} r={handleR}
                    fill={draggingGrommet === g.id ? 'rgba(59,130,246,0.35)' : 'rgba(59,130,246,0.15)'}
                    stroke={draggingGrommet === g.id ? '#2563eb' : '#3b82f6'}
                    strokeWidth={0.4}
                    strokeDasharray={draggingGrommet === g.id ? 'none' : '1,0.5'}
                  />
                  {/* Larger invisible hit target */}
                  <circle cx={cx} cy={cy} r={handleR + 2}
                    fill="transparent"
                    style={{ pointerEvents: 'all', cursor: 'move' }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => handleGrommetPointerDown(e, g.id)}
                    onPointerMove={handleGrommetPointerMove}
                    onPointerUp={handleGrommetPointerUp}
                  />
                  {/* Label */}
                  <text x={cx} y={cy - handleR - 1} textAnchor="middle"
                    fontSize={2} fill="#3b82f6" fontFamily="sans-serif">
                    {g.id}
                  </text>
                </g>
              );
            })}
          </svg>
        )}
      </div>

      {/* Zoom and scale indicator */}
      <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded shadow text-xs text-gray-700 border-l-4 border-blue-500">
        <div className="font-bold">{Math.round(scale * 100)}% Zoom</div>
        <div className="text-gray-500 mt-1">{svgWidth.toFixed(1)}mm × {svgHeight.toFixed(1)}mm</div>
        <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} className="w-3 h-3" />
          <span className="text-gray-600">Stud grid (8mm)</span>
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
