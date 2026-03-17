# Developer Guide - Extending Brick Cloth Studio

## Architecture Overview

### Core Modules

**1. Geometry (`src/geometry/`)**
- SVGPath: Low-level SVG path builder
- Primitives: circles, arcs, keyhole slits, scalloped edges
- All coordinates in millimeters

**2. Templates (`src/templates/`)**
- Base Template class with lifecycle methods
- Element-specific templates (Cape, Flag, Wings, etc.)
- Parametric generation: cut/score/engrave paths

**3. Export (`src/export/`)**
- SVG generation with proper mm units
- Layout packing algorithm (A4/Letter, margins, gutters)
- ZIP archive creation for multiple files

**4. State Management (`src/store/`)**
- Zustand store with editor state
- Parameters, decorations, export settings
- Preset loading/saving support

**5. Services (`src/services/`)**
- Pattern generator router
- Connects UI to templates

---

## Adding a New Element Type

### Step 1: Create Template Class

File: `src/templates/mynewtemplate.ts`

```typescript
import { Template, TemplateParams, generateAttachmentHole } from './base';
import { SVGPath } from '../geometry/primitives';

export class MyNewTemplate extends Template {
  generateCutPath(params: TemplateParams): string {
    const path = new SVGPath();
    const { length, width, holeRadius, clearance, slitWidth, enableSlit } = params;
    
    const totalRadius = holeRadius + clearance;

    // Build your shape
    path.moveTo(0, 0);
    path.lineTo(width, 0);
    path.lineTo(width, length);
    path.quadraticBezierTo(width / 2, length + 10, 0, length);
    path.closePath();

    // Combine with hole
    const holeStr = generateAttachmentHole(
      width / 2,
      totalRadius,
      totalRadius,
      slitWidth,
      8, // slit extends 8mm down
      enableSlit
    );

    return path.toString();
    // Note: For production, combine hole as separate path or use boolean operations
  }

  generateScorePaths(params: TemplateParams): string[] {
    // Optional fold lines
    return [];
  }

  generateEngravePaths(params: TemplateParams): string[] {
    // Optional engrave lines
    return [];
  }
}
```

### Step 2: Register in Pattern Generator

File: `src/services/patternGenerator.ts`

```typescript
import { MyNewTemplate } from '../templates/mynewtemplate';

export function generatePattern(...) {
  // ... existing code ...
  
  if (elementType === 'mynew') {
    template = new MyNewTemplate();
    name = 'My New Element';
  }
  
  // ... rest of function ...
}
```

### Step 3: Add UI Component

File: `src/components/ElementSelector.tsx`

```typescript
const ELEMENTS = [
  // ... existing ...
  { type: 'mynew', label: 'My New', icon: '🆕' },
];

const variants: Record<ElementType, Array<...>> = {
  // ... existing ...
  mynew: [
    { value: 'variant1', label: 'Variant 1' },
    { value: 'variant2', label: 'Variant 2' },
  ],
};
```

### Step 4: Test

File: `src/test/geometry.test.ts`

```typescript
it('should generate mynew pattern', () => {
  const pattern = generatePattern('mynew', 'variant1', {
    length: 60,
    width: 40,
    // ... other params
  });
  expect(pattern.name).toBe('My New Element');
  expect(pattern.cutPaths.length).toBeGreaterThan(0);
});
```

---

## Custom Parameters & Advanced Geometry

### Adding Custom Parameters

Templates receive a `params` object. Add new keys:

```typescript
export interface TemplateParams {
  // ... existing ...
  customParam?: number;
  myAdvancedSetting?: string;
}

// In your template:
generateCutPath(params: TemplateParams): string {
  const { customParam = 10 } = params; // default value
  // Use customParam in geometry...
}
```

### Advanced Path Operations

#### Scaling a Path
```typescript
import SVGPath from 'svgpath'; // optional lightweight library
const scaled = new SVGPath(existingPath).scale(2.5).toString();
```

#### Rotating Points
```typescript
function rotatePoint(p: Point, angle: number, cx: number, cy: number): Point {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: cx + (p.x - cx) * cos - (p.y - cy) * sin,
    y: cy + (p.x - cx) * sin + (p.y - cy) * cos,
  };
}
```

#### Bezier Curves
```typescript
path.cubicBezierTo(
  cp1x, cp1y, // control point 1
  cp2x, cp2y, // control point 2
  endx, endy  // end point
);
```

---

## Testing

### Unit Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { MyNewTemplate } from '../templates/mynewtemplate';

describe('MyNewTemplate', () => {
  it('should respect length parameter', () => {
    const pattern1 = generatePattern('mynew', 'v1', { length: 60, ... });
    const pattern2 = generatePattern('mynew', 'v1', { length: 120, ... });
    
    expect(pattern2.boundingBox.height).toBeGreaterThan(pattern1.boundingBox.height);
  });

  it('should include attachment hole', () => {
    const pattern = generatePattern('mynew', 'v1', { ... });
    const svg = exportSinglePatternSVG(pattern);
    
    // Hole path should be present
    expect(svg).toContain('A'); // arc command for circle
  });
});
```

### Running Tests

```bash
npm run test              # Run all tests
npm run test:ui          # Interactive test UI
npm run test:coverage    # Coverage report
```

---

## Modifying Exports

### Custom SVG Structure

File: `src/export/svg.ts`

```typescript
export function exportSinglePatternSVG(
  pattern: PatternExport,
  options: Partial<SVGExportOptions> = {}
): string {
  // Modify SVG generation here
  // e.g., add metadata, change color mapping, etc.
}
```

### Custom Layer Colors

In `utils/constants.ts`:

```typescript
export const SVG_CUT_COLOR = '#ff0000';      // red
export const SVG_SCORE_COLOR = '#0000ff';    // blue
export const SVG_ENGRAVE_COLOR = '#00aa00';  // green
```

---

## Performance Optimization

### Memoization

Use React.useMemo for expensive calculations:

```typescript
const pattern = useMemo(() => {
  return generatePattern(elementType, templateVariant, parameters);
}, [elementType, templateVariant, parameters]);
```

### Large Batches

For many patterns (50+), consider:
- Web Workers for pattern generation
- Streaming SVG creation
- Lazy evaluation of export paths

---

## Common Pitfalls

### ❌ Using Pixels Instead of Millimeters
```typescript
// WRONG
path.lineTo(100, 100); // pixel coords?

// RIGHT
path.lineTo(100, 100); // always mm
```

### ❌ Forgetting SVG Coordinate System
SVG Y-axis increases downward:
```typescript
// Top of page
path.moveTo(x, 0);

// Bottom of page
path.lineTo(x, length);
```

### ❌ Not Closing Paths
```typescript
// WRONG - won't render properly
path.moveTo(0, 0);
path.lineTo(10, 0);
path.lineTo(10, 10);
// Missing closePath()

// RIGHT
path.moveTo(0, 0);
path.lineTo(10, 0);
path.lineTo(10, 10);
path.closePath(); // ✓
```

### ❌ Ignoring Floating Point Precision
```typescript
// WRONG
const value = 0.1 + 0.2; // 0.30000000001

// RIGHT
const value = (0.1 + 0.2).toFixed(2); // "0.30"
```

---

## File Size & Bundle

- **Core bundle**: ~150 KB gzipped
- **Geometry**: ~2 KB (custom SVGPath builder)
- **Templates**: ~8 KB (all 10 templates)
- **React/Tailwind**: ~120 KB

Keep templates lightweight. Avoid:
- Heavy math libraries (use custom fast functions)
- Large asset files (reference only, don't embed)
- Unnecessary dependencies

---

## Environment Variables (Future)

Currently not used. For future enterprise features:

```bash
VITE_API_URL=https://api.example.com
VITE_ENABLE_PRESETS_CLOUD=true
```

---

## Deployment

### Build

```bash
npm run build
# Creates dist/ folder ready for deployment
```

### Platforms

- **Vercel**: Drag-and-drop `dist/`
- **GitHub Pages**: Push to gh-pages branch
- **Netlify**: Connect GitHub repo
- **Self-hosted**: Serve `dist/` with any web server

### Environment

- Node.js 16+
- Modern browsers (ES2020 target)
- No backend required (100% client-side)

---

## Contributing

1. Fork repository
2. Create feature branch: `git checkout -b feature/my-template`
3. Write tests in `src/test/`
4. Follow TypeScript strict mode
5. Commit with descriptive messages
6. Push and open PR

---

## Resources

- [SVG Specification](https://www.w3.org/TR/SVG/)
- [LEGO Dimensions](https://brickarchitects.com/)
- [React Hooks](https://react.dev/reference/react)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Tailwind CSS](https://tailwindcss.com/)

---

**Happy extending!** 🚀
