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
  const [showGrid, setShowGrid] = useState(true);
  const [showXYGrid, setShowXYGrid] = useState(true);
  const [showFill, setShowFill] = useState(false);
  const [fillColor, setFillColor] = useState('#d4e6f1');
  const [centered, setCentered] = useState(false);
  const [draggingGrommet, setDraggingGrommet] = useState<string | null>(null);
  const { elementType, templateVariant, parameters, setParameter, decorations, selectedDecorationId, updateDecoration, selectDecoration, removeDecoration } = useEditorStore();

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

  // Compute minifigure SVG overlay — locked in the lower-left (-X, +Y) quadrant
  const minifigSvgOverlay = useMemo(() => {
    if (!pattern) return '';
    const pad = 10;

    // Fixed position in the -X, +Y quadrant — does not depend on pattern dimensions
    const imgX = -MINIFIG_WIDTH_MM - 5; // left of the Y axis
    const imgY = 8; // just below the X axis
    const opacity = 0.35;

    // ViewBox matches the pattern SVG (0 0 ...) so coordinates align with axes origin at (10,10)
    const vbW = 200;
    const vbH = 200;

    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 ${vbW} ${vbH}"
      width="${vbW}mm" height="${vbH}mm"
      style="position:absolute;top:0;left:0;pointer-events:none;overflow:visible;">
      <g transform="translate(${pad}, ${pad})">
        <image href="${minifigUrl}"
          x="${imgX.toFixed(2)}" y="${imgY.toFixed(2)}"
          width="${MINIFIG_WIDTH_MM}" height="${MINIFIG_HEIGHT_MM}"
          preserveAspectRatio="xMidYMid meet"
          opacity="${opacity}"
          style="pointer-events:none;" />
      </g>
    </svg>`;
  }, [pattern]);

  // Delete selected decoration on Delete/Backspace key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedDecorationId) {
        // Don't delete if user is typing in an input/textarea
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
        e.preventDefault();
        removeDecoration(selectedDecorationId);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedDecorationId, removeDecoration]);

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
    // Position so the pattern origin (0,0) sits in the upper-left area of the canvas
    // with some margin for the axis labels, placing the pattern in the +X/+Y quadrant
    const axisMargin = 60; // px margin for axis labels on left/top
    setPanOffset({
      x: axisMargin,
      y: axisMargin,
    });
    setScale(initScale);
    setCentered(true);
  }, [pattern, elementType, templateVariant, centered]);

  // --- Sail grommet dragging ---
  const isSail = elementType === 'sail';
  const isSquareSail = templateVariant === 'square-sail';
  const isPolygonSail = templateVariant === 'polygon-sail';

  const sailGrommets = useMemo(() => {
    if (!isSail || !pattern || isPolygonSail) return []; // polygon grommets are auto-computed
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
  }, [isSail, isSquareSail, isPolygonSail, pattern, parameters]);

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
    const symmetry = !!parameters.sailSymmetry;
    const minInset = 2;
    const edgePad = 4; // expand when cursor gets this close to edge

    // Expand sail when cursor approaches any edge
    if (mm.x > w - edgePad) {
      w = Math.round((mm.x + edgePad) * 2) / 2;
      setParameter('width', w);
    }
    if (mm.y > h - edgePad) {
      h = Math.round((mm.y + edgePad) * 2) / 2;
      setParameter('length', h);
    }

    // Allow free movement, clamp to stay within bounds
    const cx = Math.max(minInset, Math.min(w - minInset, mm.x));
    const cy = Math.max(minInset, Math.min(h - minInset, mm.y));

    // Bilateral symmetry mirrors left↔right (TL↔TR, BL↔BR)
    switch (draggingGrommet) {
      case 'TL': {
        setParameter('sailGrommetTLx', cx);
        setParameter('sailGrommetTLy', cy);
        if (symmetry) {
          setParameter('sailGrommetTRx', cx);
          setParameter('sailGrommetTRy', cy);
        }
        break;
      }
      case 'TR': {
        const ix = Math.max(minInset, w - cx);
        setParameter('sailGrommetTRx', ix);
        setParameter('sailGrommetTRy', cy);
        if (symmetry) {
          setParameter('sailGrommetTLx', ix);
          setParameter('sailGrommetTLy', cy);
        }
        break;
      }
      case 'BL': {
        const iy = Math.max(minInset, h - cy);
        setParameter('sailGrommetBLx', cx);
        setParameter('sailGrommetBLy', iy);
        if (symmetry) {
          setParameter('sailGrommetBRx', cx);
          setParameter('sailGrommetBRy', iy);
        }
        break;
      }
      case 'BR': {
        const ix = Math.max(minInset, w - cx);
        const iy = Math.max(minInset, h - cy);
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
  // Color design parameters
  const splitCount = (parameters.colorSplitCount as number) || 0;
  // Shift needed when bounding box extends into negative space (e.g. side styles)
  const shiftX = Math.max(0, -bb.x);
  const shiftY = Math.max(0, -bb.y);
  // The SVG export translates content by (padding + shift), so the pattern origin in the SVG is at:
  const originOffsetMM = 10 + shiftX; // 10mm SVG padding + any negative-BB shift
  const originOffsetMMY = 10 + shiftY;

  // LEGO grid as a CSS background on the outer canvas.
  // 1mm in the SVG = CSS_MM_TO_PX screen pixels, then scaled by the zoom factor.
  const gridSpacingPx = CANVAS_GRID_SPACING * CSS_MM_TO_PX * scale;
  const studRadius = 2.4 * CSS_MM_TO_PX * scale;       // 2.4mm stud radius
  const strokeHalf = 0.5;                                // grid line width (px)
  // Align grid to the pattern origin (0,0). The SVG content is translated by
  // (padding + shift) mm, so origin in screen px uses that offset.
  const originScreenX = panOffset.x + originOffsetMM * CSS_MM_TO_PX * scale;
  const originScreenY = panOffset.y + originOffsetMMY * CSS_MM_TO_PX * scale;
  const gridOffsetX = ((originScreenX % gridSpacingPx) + gridSpacingPx) % gridSpacingPx;
  const gridOffsetY = ((originScreenY % gridSpacingPx) + gridSpacingPx) % gridSpacingPx;
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
        backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`,
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

        {/* X/Y Axis Plane */}
        {showXYGrid && (
        <svg
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            overflow: 'visible',
            pointerEvents: 'none',
          }}
          viewBox={`0 0 ${(shiftX + bb.width + 20).toFixed(2)} ${(shiftY + bb.height + 20).toFixed(2)}`}
          width={`${(shiftX + bb.width + 20).toFixed(2)}mm`}
          height={`${(shiftY + bb.height + 20).toFixed(2)}mm`}
        >
          {/* Origin matches the SVG export's translate(padding + shift) */}
          <g transform={`translate(${originOffsetMM}, ${originOffsetMMY})`}>
            {/* Axis lines — extend into negative space so origin is a clear crosshair */}
            <line x1="-50" y1="0" x2={bb.width + 15} y2="0" stroke="#94a3b8" strokeWidth="0.3" />
            <line x1="0" y1="-50" x2="0" y2={bb.height + 15} stroke="#94a3b8" strokeWidth="0.3" />

            {/* X-axis arrowhead */}
            <polygon points={`${bb.width + 15},0 ${bb.width + 12},-1.2 ${bb.width + 12},1.2`} fill="#94a3b8" />
            {/* Y-axis arrowhead */}
            <polygon points={`0,${bb.height + 15} -1.2,${bb.height + 12} 1.2,${bb.height + 12}`} fill="#94a3b8" />

            {/* Axis labels */}
            <text x={bb.width + 14} y={-2} fontSize="3" fill="#64748b" fontFamily="sans-serif" textAnchor="end">X (mm)</text>
            <text x={3} y={bb.height + 14} fontSize="3" fill="#64748b" fontFamily="sans-serif">Y (mm)</text>

            {/* Origin label */}
            <text x={-2} y={-3} fontSize="2.5" fill="#94a3b8" fontFamily="sans-serif" textAnchor="end">0</text>

            {/* Positive X-axis ticks (8mm intervals) */}
            {Array.from({ length: Math.floor(bb.width / 8) + 1 }, (_, i) => (i + 1) * 8).filter(v => v <= bb.width + 8).map(v => (
              <g key={`xt-${v}`}>
                <line x1={v} y1={-1.5} x2={v} y2={1.5} stroke="#94a3b8" strokeWidth="0.2" />
                <text x={v} y={-3} fontSize="2" fill="#94a3b8" fontFamily="sans-serif" textAnchor="middle">{v}</text>
              </g>
            ))}
            {/* Negative X-axis ticks (8mm intervals) */}
            {Array.from({ length: 5 }, (_, i) => -(i + 1) * 8).map(v => (
              <g key={`xt-${v}`}>
                <line x1={v} y1={-1.5} x2={v} y2={1.5} stroke="#94a3b8" strokeWidth="0.2" />
                <text x={v} y={-3} fontSize="2" fill="#94a3b8" fontFamily="sans-serif" textAnchor="middle">{v}</text>
              </g>
            ))}
            {/* Positive Y-axis ticks (8mm intervals) */}
            {Array.from({ length: Math.floor(bb.height / 8) + 1 }, (_, i) => (i + 1) * 8).filter(v => v <= bb.height + 8).map(v => (
              <g key={`yt-${v}`}>
                <line x1={-1.5} y1={v} x2={1.5} y2={v} stroke="#94a3b8" strokeWidth="0.2" />
                <text x={-3} y={v + 0.8} fontSize="2" fill="#94a3b8" fontFamily="sans-serif" textAnchor="end">{v}</text>
              </g>
            ))}
            {/* Negative Y-axis ticks (8mm intervals) */}
            {Array.from({ length: 5 }, (_, i) => -(i + 1) * 8).map(v => (
              <g key={`yt-${v}`}>
                <line x1={-1.5} y1={v} x2={1.5} y2={v} stroke="#94a3b8" strokeWidth="0.2" />
                <text x={-3} y={v + 0.8} fontSize="2" fill="#94a3b8" fontFamily="sans-serif" textAnchor="end">{v}</text>
              </g>
            ))}
          </g>
        </svg>
        )}

        {/* Minifigure silhouette — lower-left spatial reference */}
        {showMinifig && (
          <div
            dangerouslySetInnerHTML={{ __html: minifigSvgOverlay }}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              overflow: 'visible',
            }}
          />
        )}
        {/* Pattern fill overlay */}
        {showFill && pattern.cutPaths.length > 0 && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              overflow: 'visible',
              pointerEvents: 'none',
              zIndex: 1,
            }}
            viewBox={`0 0 ${(shiftX + bb.width + 20).toFixed(2)} ${(shiftY + bb.height + 20).toFixed(2)}`}
            width={`${(shiftX + bb.width + 20).toFixed(2)}mm`}
            height={`${(shiftY + bb.height + 20).toFixed(2)}mm`}
          >
            <g transform={`translate(${originOffsetMM}, ${originOffsetMMY})`}>
              {pattern.cutPaths.map((d, i) => (
                <path key={i} d={d} fill={i === 0 ? fillColor : '#ffffff'} stroke="none" fillRule="evenodd" opacity={0.4} />
              ))}
            </g>
          </svg>
        )}

        {/* Color design overlays (split colors + edge color + stripes) */}
        {pattern.cutPaths.length > 0 && (splitCount >= 1 || !!parameters.edgeColorEnabled || !!parameters.stripeEnabled) && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              overflow: 'visible',
              pointerEvents: 'none',
              zIndex: 1,
            }}
            viewBox={`0 0 ${(shiftX + bb.width + 20).toFixed(2)} ${(shiftY + bb.height + 20).toFixed(2)}`}
            width={`${(shiftX + bb.width + 20).toFixed(2)}mm`}
            height={`${(shiftY + bb.height + 20).toFixed(2)}mm`}
          >
            <defs>
              <clipPath id="silhouette-clip">
                <path d={pattern.cutPaths.join(' ')} fillRule="evenodd" />
              </clipPath>
            </defs>
            <g transform={`translate(${originOffsetMM}, ${originOffsetMMY})`} clipPath="url(#silhouette-clip)">
              {/* Stripe pattern */}
              {!!parameters.stripeEnabled && (() => {
                const sw = (parameters.stripeWidth as number) || 3;
                const sa = (parameters.stripeAngle as number) || 0;
                let sColors: string[] = [];
                try { sColors = JSON.parse((parameters.stripeColors as string) || '["#1a1a8a","#c0c0c0"]'); } catch { sColors = ['#1a1a8a', '#c0c0c0']; }
                if (sColors.length < 2) sColors = ['#1a1a8a', '#c0c0c0'];
                const diag = Math.sqrt(bb.width * bb.width + bb.height * bb.height);
                const count = Math.ceil(diag / sw) + 2;
                const cx = bb.width / 2;
                const cy = bb.height / 2;
                const stripes: React.ReactElement[] = [];
                for (let i = -count; i <= count; i++) {
                  const offset = i * sw;
                  stripes.push(
                    <rect key={`stripe-${i}`}
                      x={-diag} y={offset - sw / 2}
                      width={diag * 2} height={sw}
                      fill={sColors[((i % sColors.length) + sColors.length) % sColors.length]} opacity={0.45}
                      transform={`translate(${cx}, ${cy}) rotate(${sa}) translate(${-cx}, ${-cy})`}
                    />
                  );
                }
                return stripes;
              })()}
              {/* Single color fill */}
              {splitCount === 1 && (() => {
                let colors: string[] = [];
                try { colors = JSON.parse((parameters.colorSplitColors as string) || '[]'); } catch { colors = []; }
                if (colors.length === 0) colors = ['#e74c3c'];
                return <rect x={-10} y={-10} width={bb.width + 20} height={bb.height + 20} fill={colors[0]} opacity={0.5} />;
              })()}
              {/* Split color pie slices */}
              {splitCount >= 2 && (() => {
                const cx = bb.width / 2;
                const cy = bb.height / 2;
                const r = Math.max(bb.width, bb.height) * 1.5;
                const angleStep = 360 / splitCount;
                const baseAngle = ((parameters.colorSplitAngle as number) || 0) - 90;
                let colors: string[] = [];
                try { colors = JSON.parse((parameters.colorSplitColors as string) || '[]'); } catch { colors = []; }
                const DEFAULT_PALETTE = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
                while (colors.length < splitCount) colors.push(DEFAULT_PALETTE[colors.length % DEFAULT_PALETTE.length]);
                return colors.slice(0, splitCount).map((color, i) => {
                  const a1 = (baseAngle + i * angleStep) * Math.PI / 180;
                  const a2 = (baseAngle + (i + 1) * angleStep) * Math.PI / 180;
                  const x1 = cx + r * Math.cos(a1);
                  const y1 = cy + r * Math.sin(a1);
                  const x2 = cx + r * Math.cos(a2);
                  const y2 = cy + r * Math.sin(a2);
                  const largeArc = angleStep > 180 ? 1 : 0;
                  const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
                  return <path key={`split-${i}`} d={d} fill={color} opacity={0.5} stroke="none" />;
                });
              })()}
              {/* Edge color band */}
              {!!parameters.edgeColorEnabled && pattern.cutPaths[0] && (
                <path
                  d={pattern.cutPaths[0]}
                  fill="none"
                  stroke={(parameters.edgeColor as string) || '#8B4513'}
                  strokeWidth={((parameters.edgeColorWidth as number) || 2) * 2}
                  opacity={0.6}
                />
              )}
            </g>
          </svg>
        )}

        {/* Pattern SVG — rendered above grid and axes */}
        <div
          dangerouslySetInnerHTML={{ __html: svgString }}
          style={{
            position: 'relative',
            zIndex: 2,
          }}
        />

        {/* Decoration overlays */}
        {pattern && decorations.filter(d => d.visible).map((deco) => {
          return (
            <div
              key={deco.id}
              className={`absolute ${selectedDecorationId === deco.id ? 'ring-2 ring-blue-400' : ''}`}
              style={{
                left: `${(deco.x + originOffsetMM) * CSS_MM_TO_PX}px`,
                top: `${(deco.y + originOffsetMMY) * CSS_MM_TO_PX}px`,
                width: `${deco.width * deco.scale * CSS_MM_TO_PX}px`,
                height: `${deco.height * deco.scale * CSS_MM_TO_PX}px`,
                transform: deco.rotation ? `rotate(${deco.rotation}deg)` : undefined,
                transformOrigin: 'center center',
                cursor: deco.locked ? 'default' : 'move',
                pointerEvents: 'all',
                opacity: deco.decorationType === 'engraving' ? 0.7 : 1,
                outline: selectedDecorationId === deco.id ? '1px dashed #3b82f6' : 'none',
                zIndex: 3,
              }}
              onMouseDown={(e) => {
                if (deco.locked) return;
                e.stopPropagation();
                selectDecoration(deco.id);
                const startX = e.clientX;
                const startY = e.clientY;
                const origX = deco.x;
                const origY = deco.y;
                const onMove = (ev: MouseEvent) => {
                  const dx = (ev.clientX - startX) / scale / CSS_MM_TO_PX;
                  const dy = (ev.clientY - startY) / scale / CSS_MM_TO_PX;
                  updateDecoration(deco.id, { x: origX + dx, y: origY + dy });
                };
                const onUp = () => {
                  window.removeEventListener('mousemove', onMove);
                  window.removeEventListener('mouseup', onUp);
                };
                window.addEventListener('mousemove', onMove);
                window.addEventListener('mouseup', onUp);
              }}
            >
              {deco.type === 'image' && (
                <img src={deco.data} alt={deco.name}
                  style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
                  draggable={false} />
              )}
              {deco.type === 'text' && (
                <div style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${(deco.fontSize || 4) * CSS_MM_TO_PX}px`,
                  fontFamily: deco.fontFamily || 'sans-serif',
                  color: deco.decorationType === 'engraving' ? '#00aa00' : '#333',
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}>
                  {deco.data}
                </div>
              )}
            </div>
          );
        })}

        {/* Sail grommet drag handles */}
        {isSail && pattern && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              overflow: 'visible',
              zIndex: 4,
            }}
            viewBox={`0 0 ${(shiftX + pattern.boundingBox.width + 20).toFixed(2)} ${(shiftY + pattern.boundingBox.height + 20).toFixed(2)}`}
            width={`${(shiftX + pattern.boundingBox.width + 20).toFixed(2)}mm`}
            height={`${(shiftY + pattern.boundingBox.height + 20).toFixed(2)}mm`}
          >
            {sailGrommets.map((g) => {
              const holeType = (parameters.sailHoleType as string) || 'grommet';
              const std = SAIL_HOLE_STANDARDS[holeType as SailHoleType] || SAIL_HOLE_STANDARDS.grommet;
              const handleR = Math.max(std.radius * 1.8, 2.5);
              const cx = g.x + originOffsetMM;
              const cy = g.y + originOffsetMMY;
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
          <span className="text-gray-600">Minifig reference</span>
        </label>
        <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
          <input type="checkbox" checked={showXYGrid} onChange={(e) => setShowXYGrid(e.target.checked)} className="w-3 h-3" />
          <span className="text-gray-600">XY axis</span>
        </label>
      </div>

      {/* Pattern info */}
      <div className="absolute top-4 left-4 bg-white px-3 py-2 rounded shadow text-xs border-l-4 border-green-500">
        <div className="font-bold text-gray-900">{pattern.name}</div>
        <div className="text-gray-500">Scroll to zoom · drag to pan</div>
        <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
          <input type="checkbox" checked={showFill} onChange={(e) => setShowFill(e.target.checked)} className="w-3 h-3" />
          <span className="text-gray-600">Fill shape</span>
          {showFill && (
            <input type="color" value={fillColor} onChange={(e) => setFillColor(e.target.value)}
              className="w-4 h-4 rounded border border-gray-300 cursor-pointer ml-1" />
          )}
        </label>
      </div>
    </div>
  );
}
