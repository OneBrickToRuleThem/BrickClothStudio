# Brick Cloth Studio

**LEGO-scale fabric pattern generator** for creating cut-ready SVG designs for capes, cloaks, flags, banners, wings, kamas, and pauldrons.

## Features

### ✨ Pattern Generation
- **8 element types**: Cape, Cloak, Flag, Banner, Wings, Kama/Skirt, Pauldron, Custom
- **Multiple variants** per element (Standard, Short, Long, Tattered, Hooded, etc.)
- **Parametric design**: Adjust dimensions, hole size, clearance, and slit configuration in real-time
- **Live preview** with grid overlay and mm-scale measurements

### 🔩 LEGO-Accurate Geometry
- **Nominal stud diameter**: 4.8 mm (with 4.87–4.90 mm tolerance range for advanced users)
- **Configurable attachment hole**: Default 5.0 mm diameter with adjustable clearance (0–0.5 mm)
- **Keyhole slit option**: 1.2 mm wide slit for head attachment without removal
- **Calibration test strip**: Generate hole sizes (4.8–5.2 mm) to verify fit with your equipment

### 📄 Export & Layout
- **Single pattern export**: Download individual SVG for cutting
- **Multi-copy export**: Generate multiple copies as ZIP archive
- **Print sheet packing** (coming soon): A4/US Letter, portrait/landscape, auto-rotate, custom margins
- **Layer separation**: Cut (red), Score (blue), Engrave (green), Reference (gray)

### 🎨 Decorations & Imports
- **SVG import**: Upload vector logos and shapes; position, scale, rotate on canvas
- **Image import**: Add reference images (PNG/JPG) as tracing guides
- **Clipping**: Auto-clip decorations to silhouette
- **Preset save/load**: Export design parameters as JSON for reuse

### 📏 Production Ready
- **All measurements in millimeters**: No pixel ambiguity
- **SVG standard compliance**: Works with laser cutters (Glowforge, xTool, etc.) and vinyl cutters (Cricut, Silhouette)
- **Color-coded layers**: Standard red/blue/green for cutting workflows
- **Metadata**: Pattern type, element, variant, and parameters embedded in SVG

---

## Getting Started

### Prerequisites
- Node.js 16+ and npm or yarn
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

```bash
# Clone or download the project
cd brick-cloth-studio

# Install dependencies
npm install

# Start development server
npm run dev
```

The app opens at http://localhost:5173 by default.

### Build for Production

```bash
npm run build
```

Creates optimized bundle in `dist/` ready for deployment.

---

## Usage Workflow

### 1. **Select Element & Template**
   - Left panel: Choose element type (Cape, Flag, Wings, etc.)
   - Pick a variant (Standard, Short, Tattered, etc.)

### 2. **Adjust Parameters**
   - Right panel: Set length, width, hole radius, clearance, slit
   - Preview updates in real-time in center canvas

### 3. **(Optional) Add Decorations**
   - Import SVG vectors or reference images
   - Position and scale on canvas
   - Clip to silhouette or leave as reference

### 4. **Export Pattern**
   - **Single**: Click "Export SVG" for one pattern
   - **Multiple copies**: Specify count, download ZIP
   - **Calibration test**: Generate hole test strip (4.8–5.2 mm)

### 5. **Cut & Assemble**
   - Open SVG in laser cutter or vinyl cutter software
   - Use red cut layer for primary cuts
   - Blue/green layers for scoring/engraving (if supported)
   - Attach to minifig using hole/slit

---

## Scale Reference

All measurements in **millimeters (mm)**. LEGO system based on 8 mm grid.

| Parameter | Value | Notes |
|-----------|-------|-------|
| LEGO stud diameter (nominal) | 4.8 mm | Range: 4.87–4.90 mm |
| Default hole diameter | 5.0 mm | Nominal + 0.2 mm clearance |
| Keyhole slit width | 1.2 mm | Default for head attachment |
| A4 paper | 210×297 mm | Portrait/Landscape |
| US Letter | 216×279 mm | Portrait/Landscape |
| LEGO grid unit | 8.0 mm | Base unit for geometry |

---

## SVG Output Specification

### Structure
```xml
<svg viewBox="0 0 {width} {height}" width="{width}mm" height="{height}mm">
  <g id="cut" class="cut-layer">
    <!-- Red cut paths (#ff0000) -->
  </g>
  <g id="score" class="score-layer">
    <!-- Blue score paths (#0000ff) -->
  </g>
  <g id="engrave" class="engrave-layer">
    <!-- Green engrave paths (#00aa00) -->
  </g>
  <g id="reference" class="reference-layer" style="display: none;">
    <!-- Gray reference guides (#cccccc) -->
  </g>
</svg>
```

### Color Mapping
| Layer | Color | Use Case | Status |
|-------|-------|----------|--------|
| Cut | `#ff0000` (red) | Laser/vinyl cutting | ✅ Default |
| Score | `#0000ff` (blue) | Fold lines, creasing | ✅ Optional |
| Engrave | `#00aa00` (green) | Surface engraving | ✅ Optional |
| Reference | `#cccccc` (gray) | Guides, annotations | ✅ Hidden by default |

### Line Properties
- **Stroke width**: 0.1 mm (configurable)
- **Fill**: None (paths only)
- **Units**: Millimeters in viewBox, width/height attributes

---

## Laser Cutter / Vinyl Cutter Setup

### Glowforge
1. Export SVG from Brick Cloth Studio
2. Open in Glowforge UI or Adobe Illustrator
3. Set cut layer (red) to power/speed settings for your fabric
4. Use blue layer for optional scoring (if fabric allows)
5. Disable reference layer (gray) in print settings

### xTool M1/M1 Pro
1. Export SVG
2. Open in xTool Creative Space or CorelDRAW
3. Red lines = Cut, Blue = Score, Green = Engrave
4. Configure material settings (fabric: felt, fleece, etc.)
5. Preview and send to cutter

### Cricut
1. Export SVG from Brick Cloth Studio
2. Open in Cricut Design Space
3. Upload SVG file
4. Select material type (felt, fleece, etc.)
5. Adjust cut settings and test on calibration strip first
6. Execute cut

### Silhouette Cameo
1. Export SVG
2. Open in Silhouette Studio
3. Import SVG, set cut line to "Cut" (red)
4. Verify scale (should be in mm)
5. Test on calibration sheet
6. Cut on appropriate fabric setting

---

## Calibration Test

Before cutting your final design, use the **Calibration Test Strip** to verify hole fit:

1. **Export calibration test**: Click "Calibration Test" button in Export panel
2. **Cut test strip**: Print/laser the test SVG on your chosen fabric
3. **Test fit**: Try inserting LEGO stud into each hole (4.8–5.2 mm range)
4. **Note the best size**: Use that diameter for your production patterns

This accounts for:
- Equipment tolerance (laser/Cricut accuracy)
- Material thickness (felt, fleece, cotton, etc.)
- User preference (snug vs. loose fit)

---

## Element Templates & Default Parameters

### Cape (Standard)
- Length: 60 mm
- Width: 40 mm
- Hole: 5.0 mm dia. with keyhole slit option
- Use case: Classic superhero cape, basic cloak

### Cape (Short)
- 60% of standard length (~36 mm)
- Wider shoulder curve for small minifigs
- Use case: Baby faces, small torsos

### Cape (Long)
- 140% of standard length (~84 mm)
- Optional split tail
- Use case: Majestic cloaks, dramatic flowing designs

### Cape (Tattered)
- Jagged/random hem using seeded noise
- Adjustable seed for reproducibility
- Use case: Torn, weathered, damaged look

### Flag
- Rectangular with pole sleeve
- Flat top, curved or straight bottom
- Use case: Banners, standards, signage

### Banner
- Tapered trapezoid
- Swallowtail option (split bottom center)
- Use case: Tournament banners, heraldry

### Wings (Small & Large)
- Symmetric paired wings
- Adjustable span
- Use case: Superheroes, angels, dragons

### Kama / Skirt
- Wrap-around skirt panel
- Waist hole for attachment
- Use case: Warrior skirts, armor, traditional dress

### Pauldron
- Shoulder armor cloth
- Neck cutout
- Use case: Shoulder guards, armor plating

### HoodedCloak
- Cape + integrated hood
- Two-piece or single-file option
- Use case: Mysterious hooded robes

---

## Technology Stack

- **Framework**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Build**: Vite
- **Geometry**: Custom SVGPath builder (lightweight, ~2 KB)
- **Export**: jszip for multi-file downloads
- **Testing**: Vitest + React Testing Library
- **E2E**: Playwright (smoke tests)

**Bundle size** (optimized): ~150 KB gzipped (including React, Tailwind, Zustand)

---

## File Structure

```
brick-cloth-studio/
├── src/
│   ├── components/          # React components
│   │   ├── Editor.tsx       # Main layout
│   │   ├── ElementSelector.tsx
│   │   ├── PreviewCanvas.tsx
│   │   ├── ParameterPanel.tsx
│   │   └── ExportPanel.tsx
│   ├── geometry/            # SVG path builders
│   │   ├── primitives.ts    # SVGPath, circles, slits
│   │   └── arcs.ts          # Arc calculations
│   ├── templates/           # Template generators
│   │   ├── base.ts          # Base template class
│   │   ├── cape.ts          # Cape variants
│   │   ├── other.ts         # Flag, Banner, Wings, Kama, Pauldron
│   │   └── calibration.ts   # Test strip generator
│   ├── export/              # Export functions
│   │   ├── svg.ts           # SVG generation & download
│   │   ├── packer.ts        # Layout packing algorithm
│   │   └── zip.ts           # ZIP file creation
│   ├── services/            # Business logic
│   │   └── patternGenerator.ts # Route templates
│   ├── store/               # State management
│   │   └── editor.ts        # Zustand store
│   ├── utils/               # Constants, types, utilities
│   │   ├── constants.ts     # LEGO scale, paper sizes, colors
│   │   ├── types.ts         # TypeScript interfaces
│   │   └── rng.ts           # Seeded random number generator
│   ├── test/                # Test files
│   │   ├── setup.ts
│   │   ├── geometry.test.ts
│   │   └── packing.test.ts
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── index.css            # Global styles + Tailwind
├── tests/
│   └── e2e/                 # Playwright smoke tests
├── public/                  # Static assets
├── index.html               # HTML template
├── package.json             # Dependencies
├── vite.config.ts           # Vite configuration
├── vitest.config.ts         # Test configuration
├── tsconfig.json            # TypeScript config
├── tailwind.config.js       # Tailwind config
└── README.md                # This file
```

---

## Development

### Run Tests
```bash
# Unit tests
npm run test

# Test with UI
npm run test:ui

# Coverage
npm run test:coverage
```

### Code Style
- TypeScript strict mode enabled
- ESLint/Prettier ready (add to devDependencies if desired)
- Inline comments for geometry functions

### Adding New Templates

1. Create a new class extending `Template` in `src/templates/`:
```typescript
export class MyNewTemplate extends Template {
  generateCutPath(params: TemplateParams): string {
    // Return SVG path string
  }
  generateScorePaths(params: TemplateParams): string[] { return []; }
  generateEngravePaths(params: TemplateParams): string[] { return []; }
}
```

2. Add to pattern generator routing in `src/services/patternGenerator.ts`:
```typescript
if (elementType === 'mynew') {
  template = new MyNewTemplate();
  name = 'My New Template';
}
```

3. Add UI variant selector in `src/components/ElementSelector.tsx`

---

## Known Limitations & Future Work

### Current Limitations
- Print sheet layout is simplified grid packing (not advanced nesting)
- No bezier path editing on canvas (reference-only)
- Reference images not embedded in final SVG by default
- No undo/redo system yet

### Planned Features
- Full print sheet generator with multi-page support
- On-canvas decoration manipulation (drag, rotate, scale)
- Import/export design presets (JSON)
- Built-in pattern library (pre-designed capes, armor, etc.)
- Fabric material selector with thickness presets
- Batch pattern generation from CSV
- Direct print-to-PDF workflow

---

## Troubleshooting

### **Hole too tight / too loose?**
→ Use **Calibration Test** strip to find best diameter, then adjust `clearance` parameter

### **Pattern not showing in preview?**
→ Check browser console (F12) for errors
→ Verify parameter values are within expected ranges

### **SVG opens in wrong scale in Cricut/Glowforge?**
→ Ensure `viewBox` units match `width`/`height` (all should be in mm)
→ Don't resize SVG before import; scale in cutter software instead

### **Keyhole slit too narrow/wide?**
→ Adjust `slitWidth` (default 1.2 mm)
→ Test on calibration strip before final cut

### **Decorations not visible?**
→ Currently decorations are UI-only; export doesn't include them yet
→ This feature coming in next release

---

## License

**Non-Commercial Use Only** — See [LICENSE](LICENSE) for full terms.

This software is free for individuals to use for personal, hobby, and educational purposes. Commercial use by companies or businesses for profit is strictly prohibited without prior written permission.

**Important**: Do not embed copyrighted images or designs without permission. This tool is designed for:
- Creating original fabric designs
- Using custom SVG imports and vectors
- Using reference images as tracing guides (not exported)

---

## Support & Feedback

Found a bug? Have a feature request? Open an issue or contact the development team.

---

## Credits

Built with ❤️ for the LEGO minifigure community.

Inspired by the amazing fabric cape and armor designs from the LEGO customization community.

**Version**: 1.0.0  
**Last Updated**: March 2026
