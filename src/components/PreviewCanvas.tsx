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
import minifigUrl from '/Minifig_Reference.svg';

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
  const [showDevMode, setShowDevMode] = useState(false);
  const [devHoveredPoint, setDevHoveredPoint] = useState<number | null>(null);
  const [devSelectedPoint, setDevSelectedPoint] = useState<number | null>(null);
  const [devDraggingPoint, setDevDraggingPoint] = useState<number | null>(null);
  const [devPointOverrides, setDevPointOverrides] = useState<Record<number, { x: number; y: number }>>({}); 
  const { elementType, templateVariant, parameters, setParameter, decorations, selectedDecorationId, updateDecoration, selectDecoration, removeDecoration } = useEditorStore();
  const theme = useEditorStore((s) => s.theme);
  const snapToGrid = useEditorStore((s) => s.snapToGrid);
  const toggleSnapToGrid = useEditorStore((s) => s.toggleSnapToGrid);

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

  // ---------------------------------------------------------------------------
  // Dev mode: parse outline SVG path into displayable control points
  // ---------------------------------------------------------------------------
  interface DevPoint {
    index: number;        // sequential index
    x: number;
    y: number;
    type: 'M' | 'L' | 'C_cp1' | 'C_cp2' | 'C_end' | 'Q_cp' | 'Q_end' | 'A_end';
    cmdIndex: number;     // which SVG command this belongs to
    cmdType: string;      // original command letter
    arcParams?: { rx: number; ry: number; rot: number; large: number; sweep: number }; // for A commands
  }

  const devPoints = useMemo((): DevPoint[] => {
    if (!showDevMode || !pattern || pattern.cutPaths.length === 0) return [];
    const pathData = pattern.cutPaths[0]; // outline
    const points: DevPoint[] = [];
    const cmds = pathData.match(/[MLCQAZHVSTZ]|-?\d+\.?\d*/gi) || [];
    let ci = 0;
    let cmd = '';
    let cmdIdx = 0;
    let ptIdx = 0;

    while (ci < cmds.length) {
      const token = cmds[ci];
      if (/^[A-Za-z]$/.test(token)) {
        cmd = token.toUpperCase();
        ci++;
        if (cmd === 'Z') { cmdIdx++; continue; }
      } else {
        switch (cmd) {
          case 'M': {
            const x = parseFloat(cmds[ci]), y = parseFloat(cmds[ci + 1]);
            if (!isNaN(x) && !isNaN(y)) points.push({ index: ptIdx++, x, y, type: 'M', cmdIndex: cmdIdx, cmdType: 'M' });
            ci += 2; cmdIdx++; break;
          }
          case 'L': {
            const x = parseFloat(cmds[ci]), y = parseFloat(cmds[ci + 1]);
            if (!isNaN(x) && !isNaN(y)) points.push({ index: ptIdx++, x, y, type: 'L', cmdIndex: cmdIdx, cmdType: 'L' });
            ci += 2; cmdIdx++; break;
          }
          case 'C': {
            const cp1x = parseFloat(cmds[ci]), cp1y = parseFloat(cmds[ci + 1]);
            const cp2x = parseFloat(cmds[ci + 2]), cp2y = parseFloat(cmds[ci + 3]);
            const ex = parseFloat(cmds[ci + 4]), ey = parseFloat(cmds[ci + 5]);
            points.push({ index: ptIdx++, x: cp1x, y: cp1y, type: 'C_cp1', cmdIndex: cmdIdx, cmdType: 'C' });
            points.push({ index: ptIdx++, x: cp2x, y: cp2y, type: 'C_cp2', cmdIndex: cmdIdx, cmdType: 'C' });
            points.push({ index: ptIdx++, x: ex, y: ey, type: 'C_end', cmdIndex: cmdIdx, cmdType: 'C' });
            ci += 6; cmdIdx++; break;
          }
          case 'Q': {
            const cpx = parseFloat(cmds[ci]), cpy = parseFloat(cmds[ci + 1]);
            const ex = parseFloat(cmds[ci + 2]), ey = parseFloat(cmds[ci + 3]);
            points.push({ index: ptIdx++, x: cpx, y: cpy, type: 'Q_cp', cmdIndex: cmdIdx, cmdType: 'Q' });
            points.push({ index: ptIdx++, x: ex, y: ey, type: 'Q_end', cmdIndex: cmdIdx, cmdType: 'Q' });
            ci += 4; cmdIdx++; break;
          }
          case 'A': {
            const rx = parseFloat(cmds[ci]), ry = parseFloat(cmds[ci + 1]);
            const rot = parseFloat(cmds[ci + 2]), large = parseFloat(cmds[ci + 3]), sweep = parseFloat(cmds[ci + 4]);
            const ex = parseFloat(cmds[ci + 5]), ey = parseFloat(cmds[ci + 6]);
            if (!isNaN(ex) && !isNaN(ey)) points.push({
              index: ptIdx++, x: ex, y: ey, type: 'A_end', cmdIndex: cmdIdx, cmdType: 'A',
              arcParams: { rx, ry, rot, large, sweep },
            });
            ci += 7; cmdIdx++; break;
          }
          default:
            ci++; break;
        }
      }
    }
    return points;
  }, [showDevMode, pattern]);

  // Clear overrides when the underlying pattern changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => { setDevPointOverrides({}); }, [pattern]);

  // Rebuild SVG path string with dev point overrides applied
  const devModifiedPath = useMemo((): string | null => {
    if (!showDevMode || devPoints.length === 0 || Object.keys(devPointOverrides).length === 0) return null;
    // Group points by cmdIndex
    const groups = new Map<number, DevPoint[]>();
    for (const pt of devPoints) {
      if (!groups.has(pt.cmdIndex)) groups.set(pt.cmdIndex, []);
      groups.get(pt.cmdIndex)!.push(pt);
    }
    const f = (v: number) => v.toFixed(4);
    const getP = (pt: DevPoint) => devPointOverrides[pt.index] ?? pt;
    const parts: string[] = [];

    // Find the max cmdIndex and check for Z (the parser increments cmdIdx on Z)
    const sortedGroups = [...groups.entries()].sort((a, b) => a[0] - b[0]);
    for (const [, pts] of sortedGroups) {
      const first = pts[0];
      switch (first.cmdType) {
        case 'M': { const p = getP(first); parts.push(`M ${f(p.x)} ${f(p.y)}`); break; }
        case 'L': { const p = getP(first); parts.push(`L ${f(p.x)} ${f(p.y)}`); break; }
        case 'C': {
          const cp1 = pts.find(p => p.type === 'C_cp1')!;
          const cp2 = pts.find(p => p.type === 'C_cp2')!;
          const end = pts.find(p => p.type === 'C_end')!;
          const a = getP(cp1), b = getP(cp2), c = getP(end);
          parts.push(`C ${f(a.x)} ${f(a.y)} ${f(b.x)} ${f(b.y)} ${f(c.x)} ${f(c.y)}`);
          break;
        }
        case 'Q': {
          const cp = pts.find(p => p.type === 'Q_cp')!;
          const end = pts.find(p => p.type === 'Q_end')!;
          const a = getP(cp), b = getP(end);
          parts.push(`Q ${f(a.x)} ${f(a.y)} ${f(b.x)} ${f(b.y)}`);
          break;
        }
        case 'A': {
          const pt = pts[0];
          const p = getP(pt);
          const ap = pt.arcParams!;
          parts.push(`A ${f(ap.rx)} ${f(ap.ry)} ${ap.rot} ${ap.large} ${ap.sweep} ${f(p.x)} ${f(p.y)}`);
          break;
        }
      }
    }
    parts.push('Z');
    return parts.join(' ');
  }, [showDevMode, devPoints, devPointOverrides]);

  // Compute minifigure SVG overlay — locked in the lower-left (-X, +Y) quadrant
  const minifigSvgOverlay = useMemo(() => {
    if (!pattern) return '';
    const pad = 10;

    // Fixed position in the -X, +Y quadrant — does not depend on pattern dimensions
    const imgX = -MINIFIG_WIDTH_MM - 5; // left of the Y axis
    const imgY = 0; // top of minifig aligns with X axis (y=0)
    const opacity = 0.35;
    const imgFilter = theme === 'dark' ? 'filter:invert(1) brightness(0.6);' : '';

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
          style="pointer-events:none;${imgFilter}" />
      </g>
    </svg>`;
  }, [pattern, theme]);

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
  const isCustomWing = elementType === 'wings' && templateVariant === 'custom-wing';
  const hasGrommets = isSail || isCustomWing;
  const isSquareSail = templateVariant === 'square-sail' || isCustomWing;
  const isPolygonSail = templateVariant === 'polygon-sail';

  const sailGrommets = useMemo(() => {
    if (!hasGrommets || !pattern) return [];
    const w = (parameters.width as number) || 60;
    const h = (parameters.length as number) || 60;
    const grommets: Array<{ id: string; x: number; y: number; paramX: string; paramY: string; corner: string }> = [];

    if (isPolygonSail) {
      // Polygon sail: compute grommet positions from polygon vertices or custom positions
      const sides = Math.max(5, Math.min(12, (parameters.sailSides as number) || 6));
      const inset = (parameters.sailPolygonInset as number) ?? 4;
      const cx = w / 2;
      const cy = h / 2;
      const rx = w / 2 - inset;
      const ry = h / 2 - inset;
      const mask = (parameters.sailPolygonGrommetMask as string) || '';
      let customPositions: Array<{ x: number; y: number }> = [];
      try { customPositions = JSON.parse((parameters.sailPolygonGrommetPositions as string) || '[]'); } catch { customPositions = []; }

      for (let i = 0; i < sides; i++) {
        const enabled = mask.length >= sides ? mask[i] !== '0' : true;
        if (!enabled) continue;
        let gx: number, gy: number;
        if (customPositions.length === sides && customPositions[i]) {
          gx = customPositions[i].x;
          gy = customPositions[i].y;
        } else {
          const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
          gx = cx + rx * Math.cos(angle);
          gy = cy + ry * Math.sin(angle);
        }
        grommets.push({
          id: `P${i}`, corner: `V${i + 1}`,
          x: gx, y: gy,
          paramX: '', paramY: '', // handled via JSON array
        });
      }
    } else {
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
    }
    return grommets;
  }, [hasGrommets, isSquareSail, isPolygonSail, pattern, parameters]);

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
    let cx = Math.max(minInset, Math.min(w - minInset, mm.x));
    let cy = Math.max(minInset, Math.min(h - minInset, mm.y));

    // Snap to grid if enabled
    if (snapToGrid) {
      const step = CANVAS_GRID_SPACING / 2;
      cx = Math.round(cx / step) * step;
      cy = Math.round(cy / step) * step;
      cx = Math.max(minInset, Math.min(w - minInset, cx));
      cy = Math.max(minInset, Math.min(h - minInset, cy));
    }

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
      default: {
        // Polygon grommet: P0, P1, P2, ...
        if (draggingGrommet.startsWith('P')) {
          const idx = parseInt(draggingGrommet.slice(1), 10);
          const sides = Math.max(5, Math.min(12, (parameters.sailSides as number) || 6));
          const inset = (parameters.sailPolygonInset as number) ?? 4;
          const pcx = w / 2, pcy = h / 2;
          const prx = w / 2 - inset, pry = h / 2 - inset;

          // Load or initialize custom positions
          let positions: Array<{ x: number; y: number }> = [];
          try { positions = JSON.parse((parameters.sailPolygonGrommetPositions as string) || '[]'); } catch { positions = []; }
          if (positions.length !== sides) {
            positions = [];
            for (let i = 0; i < sides; i++) {
              const angle = -Math.PI / 2 + (2 * Math.PI * i) / sides;
              positions.push({ x: pcx + prx * Math.cos(angle), y: pcy + pry * Math.sin(angle) });
            }
          }

          if (idx >= 0 && idx < sides) {
            positions[idx] = { x: cx, y: cy };
            setParameter('sailPolygonGrommetPositions', JSON.stringify(positions));
          }
        }
        break;
      }
    }
  }, [draggingGrommet, screenToMM, parameters, setParameter, snapToGrid]);

  const handleGrommetPointerUp = useCallback((e: React.PointerEvent) => {
    if (draggingGrommet) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDraggingGrommet(null);
    }
  }, [draggingGrommet]);

  // Dev mode point dragging handlers
  const handleDevPointerDown = useCallback((e: React.PointerEvent, ptIndex: number) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDevDraggingPoint(ptIndex);
    setDevSelectedPoint(ptIndex);
  }, []);

  const handleDevPointerMove = useCallback((e: React.PointerEvent) => {
    if (devDraggingPoint === null) return;
    e.stopPropagation();
    e.preventDefault();
    const mm = screenToMM(e.clientX, e.clientY);
    const bb = pattern?.boundingBox;
    const shX = bb ? Math.max(0, -bb.x) : 0;
    const shY = bb ? Math.max(0, -bb.y) : 0;
    const x = mm.x - shX;
    const y = mm.y - shY;
    setDevPointOverrides(prev => ({ ...prev, [devDraggingPoint]: { x, y } }));
  }, [devDraggingPoint, screenToMM, pattern]);

  const handleDevPointerUp = useCallback((e: React.PointerEvent) => {
    if (devDraggingPoint !== null) {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setDevDraggingPoint(null);
    }
  }, [devDraggingPoint]);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    // Mouse position relative to the canvas container
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const newScale = Math.max(0.5, Math.min(10, scale * factor));
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
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900">
        <div className="text-gray-500 dark:text-gray-400 text-center">
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
  const gridLineColor = theme === 'dark' ? '#374151' : '#ccc';
  const gridStudColor = theme === 'dark' ? '#4b5563' : '#ddd';
  const gridBackground = showGrid
    ? {
        backgroundImage: [
          // Cell border grid
          `linear-gradient(to right, ${gridLineColor} ${strokeHalf}px, transparent ${strokeHalf}px)`,
          `linear-gradient(to bottom, ${gridLineColor} ${strokeHalf}px, transparent ${strokeHalf}px)`,
          // Stud circle (ring)
          `radial-gradient(circle ${studRadius}px at ${gridSpacingPx / 2}px ${gridSpacingPx / 2}px, transparent ${studRadius - 1}px, ${gridStudColor} ${studRadius - 1}px, ${gridStudColor} ${studRadius}px, transparent ${studRadius}px)`,
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
      className="w-full h-full bg-white dark:bg-gray-900"
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
            <text x={-14} y={bb.height + 14} fontSize="3" fill="#64748b" fontFamily="sans-serif" textAnchor="start">Y (mm)</text>

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
                  let dx = (ev.clientX - startX) / scale / CSS_MM_TO_PX;
                  let dy = (ev.clientY - startY) / scale / CSS_MM_TO_PX;
                  let nx = origX + dx;
                  let ny = origY + dy;
                  if (snapToGrid) {
                    const step = CANVAS_GRID_SPACING / 2;
                    nx = Math.round(nx / step) * step;
                    ny = Math.round(ny / step) * step;
                  }
                  updateDecoration(deco.id, { x: nx, y: ny });
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

        {/* Grommet drag handles */}
        {hasGrommets && pattern && (
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
            {/* Smart guides: center axis lines when dragging near center */}
            {draggingGrommet && (() => {
              const w = (parameters.width as number) || 60;
              const h = (parameters.length as number) || 60;
              const midX = w / 2 + originOffsetMM;
              const midY = h / 2 + originOffsetMMY;
              const fullW = shiftX + pattern.boundingBox.width + 20;
              const fullH = shiftY + pattern.boundingBox.height + 20;
              // Find the grommet being dragged
              const g = sailGrommets.find((gr) => gr.id === draggingGrommet);
              if (!g) return null;
              const gx = g.x + originOffsetMM;
              const gy = g.y + originOffsetMMY;
              const threshold = 1.5; // mm
              const guides: React.ReactElement[] = [];
              if (Math.abs(gx - midX) < threshold) {
                guides.push(<line key="vguide" x1={midX} y1={0} x2={midX} y2={fullH} stroke="#06b6d4" strokeWidth={0.3} strokeDasharray="1,1" />);
              }
              if (Math.abs(gy - midY) < threshold) {
                guides.push(<line key="hguide" x1={0} y1={midY} x2={fullW} y2={midY} stroke="#06b6d4" strokeWidth={0.3} strokeDasharray="1,1" />);
              }
              return guides;
            })()}
          </svg>
        )}

        {/* Dev mode: control point overlay */}
        {showDevMode && pattern && devPoints.length > 0 && (
          <svg
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              pointerEvents: 'none',
              overflow: 'visible',
              zIndex: 5,
            }}
            viewBox={`0 0 ${(shiftX + bb.width + 20).toFixed(2)} ${(shiftY + bb.height + 20).toFixed(2)}`}
            width={`${(shiftX + bb.width + 20).toFixed(2)}mm`}
            height={`${(shiftY + bb.height + 20).toFixed(2)}mm`}
          >
            <g transform={`translate(${originOffsetMM}, ${originOffsetMMY})`}>
              {/* Scale factor to keep dev annotations constant screen size */}
              {(() => { const s = 1.5 / scale; return (<>
              {/* Modified path preview when points have been dragged */}
              {devModifiedPath && (
                <path d={devModifiedPath} fill="none" stroke="#f59e0b" strokeWidth={0.4 * s}
                  strokeDasharray={`${1.5 * s},${0.8 * s}`} opacity={0.7} />
              )}
              {/* Ghost lines from original to dragged position */}
              {Object.entries(devPointOverrides).map(([idx, pos]) => {
                const pt = devPoints.find(p => p.index === Number(idx));
                if (!pt) return null;
                return (
                  <line key={`ghost-${idx}`}
                    x1={pt.x} y1={pt.y} x2={pos.x} y2={pos.y}
                    stroke="#f59e0b" strokeWidth={0.2 * s} strokeDasharray={`${0.4 * s},${0.3 * s}`}
                    opacity={0.6}
                  />
                );
              })}
              {/* Draw control point handles connecting cp1/cp2 to their curve endpoints */}
              {devPoints.map((pt) => {
                if (pt.type !== 'C_cp1' && pt.type !== 'C_cp2' && pt.type !== 'Q_cp') return null;
                const pos = devPointOverrides[pt.index] ?? pt;
                const endPt = devPoints.find(
                  (p) => p.cmdIndex === pt.cmdIndex && (p.type === 'C_end' || p.type === 'Q_end')
                );
                const prevEndIdx = devPoints.findIndex((p) => p.index === pt.index) - 1;
                const prevEnd = prevEndIdx >= 0 ? devPoints.slice(0, prevEndIdx + 1).reverse().find(
                  (p) => p.type === 'M' || p.type === 'L' || p.type === 'C_end' || p.type === 'Q_end' || p.type === 'A_end'
                ) : null;
                const rawTarget = pt.type === 'C_cp1' ? prevEnd : endPt;
                if (!rawTarget) return null;
                const target = devPointOverrides[rawTarget.index] ?? rawTarget;
                return (
                  <line key={`handle-${pt.index}`}
                    x1={pos.x} y1={pos.y} x2={target.x} y2={target.y}
                    stroke="#ef4444" strokeWidth={0.15 * s} strokeDasharray={`${0.5 * s},${0.3 * s}`}
                    opacity={0.5}
                  />
                );
              })}
              {/* Draw the points */}
              {devPoints.map((pt) => {
                const pos = devPointOverrides[pt.index] ?? pt;
                const isCP = pt.type.includes('cp');
                const isHovered = devHoveredPoint === pt.index;
                const isSelected = devSelectedPoint === pt.index;
                const isDragging = devDraggingPoint === pt.index;
                const hasMoved = !!devPointOverrides[pt.index];
                const r = (isCP ? 0.6 : 0.8) * s;
                const fill = isDragging ? '#f59e0b' : isSelected ? '#fbbf24' : isHovered ? '#f97316' : hasMoved ? '#a855f7' : isCP ? '#ef4444' : '#10b981';
                const stroke = isDragging ? '#92400e' : isSelected ? '#b45309' : isHovered ? '#c2410c' : hasMoved ? '#6b21a8' : isCP ? '#991b1b' : '#065f46';
                return (
                  <g key={`pt-${pt.index}`}>
                    {/* Original position ghost dot for moved points */}
                    {hasMoved && (
                      <circle cx={pt.x} cy={pt.y} r={r * 0.6}
                        fill="none" stroke="#9ca3af" strokeWidth={0.15 * s} strokeDasharray={`${0.3 * s},${0.2 * s}`}
                        style={{ pointerEvents: 'none' }}
                      />
                    )}
                    {/* Invisible hit target for dragging */}
                    <circle cx={pos.x} cy={pos.y} r={r + 2 * s}
                      fill="transparent"
                      style={{ pointerEvents: 'all', cursor: isDragging ? 'grabbing' : 'grab' }}
                      onMouseEnter={() => { if (devDraggingPoint === null) setDevHoveredPoint(pt.index); }}
                      onMouseLeave={() => { if (devDraggingPoint === null) setDevHoveredPoint(null); }}
                      onClick={(e) => { e.stopPropagation(); setDevSelectedPoint(pt.index === devSelectedPoint ? null : pt.index); }}
                      onPointerDown={(e) => handleDevPointerDown(e, pt.index)}
                      onPointerMove={handleDevPointerMove}
                      onPointerUp={handleDevPointerUp}
                    />
                    {/* Visible point */}
                    <circle cx={pos.x} cy={pos.y} r={isHovered || isSelected || isDragging ? r * 1.4 : r}
                      fill={fill} stroke={stroke} strokeWidth={0.2 * s}
                      style={{ pointerEvents: 'none' }}
                    />
                    {/* Index label */}
                    <text x={pos.x + 1.2 * s} y={pos.y - 1.0 * s}
                      fontSize={1.6 * s} fill={hasMoved ? '#a855f7' : isCP ? '#dc2626' : '#059669'}
                      fontFamily="monospace" fontWeight="bold"
                      style={{ pointerEvents: 'none' }}
                    >
                      {pt.index}
                    </text>
                    {/* Tooltip on hover */}
                    {isHovered && !isDragging && (
                      <g>
                        <rect x={pos.x + 2 * s} y={pos.y - 4 * s} width={(hasMoved ? 28 : 18) * s} height={4 * s}
                          rx={0.5 * s} fill="rgba(0,0,0,0.85)" />
                        <text x={pos.x + 3 * s} y={pos.y - 1.2 * s}
                          fontSize={1.8 * s} fill="white" fontFamily="monospace"
                          style={{ pointerEvents: 'none' }}
                        >
                          #{pt.index} {pt.type} ({pos.x.toFixed(2)}, {pos.y.toFixed(2)}){hasMoved ? ` ← (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)})` : ''}
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
              </>); })()}
            </g>
          </svg>
        )}
      </div>

      {/* Dev mode info panel */}
      {showDevMode && pattern && devPoints.length > 0 && (
        <div className="absolute bottom-4 left-4 bg-gray-900 text-green-400 px-3 py-2 rounded shadow-lg text-xs font-mono border border-gray-700 max-h-72 overflow-auto"
          style={{ zIndex: 10, minWidth: '340px', maxWidth: '500px' }}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="text-green-300 font-bold text-sm">Dev Mode — {devPoints.length} points</span>
            <div className="flex gap-1">
              {Object.keys(devPointOverrides).length > 0 && (
                <>
                  <button
                    className="text-yellow-400 hover:text-yellow-200 text-xs px-1.5 py-0.5 rounded bg-yellow-900 hover:bg-yellow-800"
                    onClick={() => {
                      const changes = Object.entries(devPointOverrides).map(([idx, pos]) => {
                        const pt = devPoints.find(p => p.index === Number(idx));
                        if (!pt) return '';
                        return `#${pt.index} ${pt.type}: (${pt.x.toFixed(2)}, ${pt.y.toFixed(2)}) → (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})  Δ(${(pos.x - pt.x).toFixed(2)}, ${(pos.y - pt.y).toFixed(2)})`;
                      }).filter(Boolean).join('\n');
                      navigator.clipboard.writeText(changes);
                    }}
                  >
                    Copy Changes
                  </button>
                  <button
                    className="text-red-400 hover:text-red-200 text-xs px-1.5 py-0.5 rounded bg-red-900 hover:bg-red-800"
                    onClick={() => setDevPointOverrides({})}
                  >
                    Reset
                  </button>
                </>
              )}
              <button
                className="text-gray-400 hover:text-white text-xs px-1.5 py-0.5 rounded bg-gray-800 hover:bg-gray-700"
                onClick={() => {
                  const summary = devPoints.map(p => {
                    const ov = devPointOverrides[p.index];
                    const pos = ov ?? p;
                    return `#${p.index} ${p.type.padEnd(6)} (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})${ov ? ` ← was (${p.x.toFixed(2)}, ${p.y.toFixed(2)})` : ''} cmd[${p.cmdIndex}] ${p.cmdType}`;
                  }).join('\n');
                  navigator.clipboard.writeText(summary);
                }}
              >
                Copy All
              </button>
            </div>
          </div>
          <div className="text-gray-400 text-[10px] mb-1">
            <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1" />Endpoint
            <span className="inline-block w-2 h-2 rounded-full bg-red-500 mr-1 ml-2" />Control point
            <span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1 ml-2" />Moved
            <span className="inline-block w-2 h-2 rounded-full bg-yellow-400 mr-1 ml-2" />Selected
          </div>
          {/* Override summary */}
          {Object.keys(devPointOverrides).length > 0 && (
            <div className="bg-yellow-900/30 rounded p-1.5 mb-1 border border-yellow-800 text-[10px]">
              <div className="text-yellow-300 font-bold mb-0.5">{Object.keys(devPointOverrides).length} point(s) moved:</div>
              {Object.entries(devPointOverrides).map(([idx, pos]) => {
                const pt = devPoints.find(p => p.index === Number(idx));
                if (!pt) return null;
                return (
                  <div key={idx} className="text-yellow-200">
                    #{pt.index} {pt.type}: ({pt.x.toFixed(2)}, {pt.y.toFixed(2)}) → ({pos.x.toFixed(2)}, {pos.y.toFixed(2)})
                  </div>
                );
              })}
            </div>
          )}
          {devSelectedPoint !== null && (() => {
            const pt = devPoints.find(p => p.index === devSelectedPoint);
            if (!pt) return null;
            const pos = devPointOverrides[pt.index] ?? pt;
            const w = parameters.width as number;
            const h = parameters.length as number;
            return (
              <div className="bg-gray-800 rounded p-1.5 mb-1 border border-gray-600">
                <div className="text-yellow-300">Selected: #{pt.index} ({pt.type})</div>
                <div>Position: ({pos.x.toFixed(4)}, {pos.y.toFixed(4)}) mm</div>
                <div>Fraction: ({(pos.x / w).toFixed(5)}, {(pos.y / h).toFixed(5)})</div>
                {devPointOverrides[pt.index] && (
                  <div className="text-purple-300">Original: ({pt.x.toFixed(4)}, {pt.y.toFixed(4)}) mm</div>
                )}
                <div className="text-gray-500">Command [{pt.cmdIndex}]: {pt.cmdType}</div>
              </div>
            );
          })()}
          <div className="max-h-32 overflow-auto text-[10px] leading-relaxed">
            {devPoints.map(pt => {
              const hasMoved = !!devPointOverrides[pt.index];
              const pos = devPointOverrides[pt.index] ?? pt;
              return (
                <div
                  key={pt.index}
                  className={`cursor-pointer px-1 rounded ${
                    devSelectedPoint === pt.index ? 'bg-yellow-900 text-yellow-200' :
                    devHoveredPoint === pt.index ? 'bg-gray-800 text-green-300' :
                    hasMoved ? 'bg-purple-900/30 text-purple-300' : 'hover:bg-gray-800'
                  }`}
                  onMouseEnter={() => setDevHoveredPoint(pt.index)}
                  onMouseLeave={() => setDevHoveredPoint(null)}
                  onClick={() => setDevSelectedPoint(pt.index === devSelectedPoint ? null : pt.index)}
                >
                  <span className="text-gray-500">#{String(pt.index).padStart(3)}</span>{' '}
                  <span className={hasMoved ? 'text-purple-400' : pt.type.includes('cp') ? 'text-red-400' : 'text-green-400'}>{pt.type.padEnd(6)}</span>{' '}
                  ({pos.x.toFixed(2)}, {pos.y.toFixed(2)}){hasMoved ? ' ✦' : ''}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Zoom and scale indicator */}
      <div className="absolute top-4 right-4 bg-white dark:bg-gray-800 px-3 py-2 rounded shadow text-xs text-gray-700 dark:text-gray-300 border-l-4 border-blue-500">
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
        <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
          <input type="checkbox" checked={snapToGrid} onChange={toggleSnapToGrid} className="w-3 h-3" />
          <span className="text-cyan-600 dark:text-cyan-400">Snap to grid</span>
        </label>
        <label className="flex items-center gap-1.5 mt-1.5 cursor-pointer">
          <input type="checkbox" checked={showDevMode} onChange={(e) => { setShowDevMode(e.target.checked); setDevSelectedPoint(null); setDevHoveredPoint(null); setDevDraggingPoint(null); setDevPointOverrides({}); }} className="w-3 h-3" />
          <span className="text-orange-600 font-semibold">Dev mode</span>
        </label>
      </div>

      {/* Pattern info */}
      <div className="absolute top-4 left-4 bg-white dark:bg-gray-800 px-3 py-2 rounded shadow text-xs border-l-4 border-green-500">
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
