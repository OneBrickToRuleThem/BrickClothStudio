# Brick Cloth Studio

**LEGO minifigure-scale fabric pattern generator** — create cut-ready SVG templates for capes, flags, sails, kamas, pauldrons, and wings.

**Live App**: [https://onebricktorulethem.github.io/BrickClothStudio/](https://onebricktorulethem.github.io/BrickClothStudio/)

---

## Features

### Pattern Generation
- **6 element types** with multiple variants each, plus custom image tracing
- **Parametric design** — adjust dimensions, holes, edges, and styles in real-time
- **Live preview** with grid overlay and mm-scale measurements

### Element Types & Variants

| Element | Variants | Default Size | Notes |
|---------|----------|-------------|-------|
| **Cape** | Standard, Wind-Swept, Phantom Shroud, Seven Points, Narrow, Top, Stepped, Man-Bat | 40×39 mm | Attachment holes, edge styles, sword/arm slits, weathering, bottom curve, side curve |
| **Flag/Banner** | Small, Large, Custom | 22×60 / 40×64 / 30×60 mm | Custom has configurable edges, side curve, and 1–6 clip holes |
| **Sail** | Square, Triangular, Polygon | 60×60 mm | Draggable grommets (4 types + extra), per-edge styling, side curve, stud-based sizing, 5–12 sided polygon |
| **Kama/Skirt** | Wrap Skirt, Full Skirt | 47×19 mm | 2–4 attachment holes, bottom hem edge styles |
| **Mantle** | Shoulder Armor, High Collar | 23×26 mm | Head pin holes, bottom rim curve, side edge styles, hem width, side curve |
| **Wing** | Tattered Wing, Custom Wing | 173×101 mm | Ball-joint holes, pin hole, decorative tear holes, side curve |
| **Custom** | Traced Image | varies | Import PNG/JPG, auto-trace to cut path |

### Edge Styles

17 edge styles available (16 decorative + none; not all elements support every style):

arched, arrow, castellated, cloud, dovetail, feathered, flame, notched, picot, sawtooth, scalloped, stepped, thorned, torn, wavy, zigzag

- **Cape bottom**: All 16 decorative styles
- **Cape sides**: All 16 decorative styles
- **Sail edges** (per-edge): All 16 decorative styles
- **Flag Custom** edges: Same as sail edges
- **Kama** bottom hem: All 16 decorative styles
- **Mantle** bottom rim: All 16 decorative styles
- **Mantle** side edges: All 16 decorative styles (protrude outward from shape)

### Transformations

- **Side Curve** — bows the side edges inward or outward without requiring an edge style. Works on capes, flags, sails, mantles, and wings. Can be combined with any edge style.
- **Bottom Curve** — rounds the bottom hem of capes and mantles.

### Save & Load Designs
- **Export design spec** — save all parameters to a JSON file
- **Import design spec** — reload any saved design with full parameter restoration
- **Preset sharing** — share design files with other users

### LEGO-Accurate Geometry
- **Hole types**: Minifigure (5.3 mm) or Minidoll (4.8 mm) with adjustable clearance
- **Override Attachment**: Custom shape (round, square, oval, pill), size, and mirrored XY position offset
- **Keyhole slit**: Single-line cut with stress-relief circle — laser/knife kerf creates the physical opening
- **Calibration test strip**: Hole sizes 4.8–5.2 mm to verify fit with your equipment and fabric
- **Stud-based sizing**: Sail dimensions can be set in LEGO stud units (8 mm grid)
- **Measurement units**: Display dimensions in mm, studs, LDU, plates, or inches
- **Extra grommets**: Add configurable extra grommet points on sails
- **Draggable polygon grommets**: Drag individual grommet positions on polygon sails

### Decorations
- **Color Fill**: Single color, split color, edge color band, or multi-color stripes (2–4 colors)
- **SVG import**: Upload vector logos and shapes
- **Image import**: PNG/JPG for reference overlays
- **Text**: Configurable font, size, and positioning
- **Controls**: Position, scale, rotate, clip to template silhouette
- **Output layers**: Engraving (green), rastering (black), or decoration-only (reference)

### Export
- **Single pattern SVG** — one template, cut-ready
- **Print sheet** — multiple copies packed onto A4 or US Letter (portrait/landscape)
- **Calibration test strip** — hole diameter test for your equipment
- **Compound paths** — outline + holes merged as a single `<path>` with `fill-rule="evenodd"` for correct Cricut/Silhouette/laser cutter interpretation
- **Layer separation**: Cut (red), Score (blue), Engrave (green), Reference (gray, hidden)
- **Self-intersection warning** — yellow banner alerts when cut paths cross themselves (prevents cutter issues)

---

## Getting Started

### Prerequisites
- Node.js 16+ and npm
- Modern web browser

### Installation

```bash
git clone https://github.com/OneBrickToRuleThem/BrickClothStudio.git
cd BrickClothStudio
npm install
npm run dev
```

Opens at `http://localhost:5173/BrickClothStudio/`

### Build for Production

```bash
npm run build
```

---

## Usage

1. **Select element & variant** — left panel
2. **Adjust parameters** — right panel (dimensions, holes, edge styles, side curve, bottom curve, etc.)
3. **Add decorations** *(optional)* — import SVG/images, position on canvas
4. **Export** — click Export Pattern at top of right panel
5. **Cut** — open SVG in your cutter software (Cricut, Silhouette, Glowforge, xTool, etc.)

---

## SVG Output

```xml
<svg viewBox="0 0 {w} {h}" width="{w}mm" height="{h}mm">
  <g id="cut" class="cut-layer">
    <path d="..." class="cut-line" fill-rule="evenodd" />
  </g>
  <g id="score" class="score-layer">...</g>
  <g id="engrave" class="engrave-layer">...</g>
  <g id="reference" class="reference-layer" style="display:none">...</g>
</svg>
```

| Layer | Color | Purpose |
|-------|-------|---------|
| Cut | `#ff0000` (red) | Primary cut lines |
| Score | `#0000ff` (blue) | Fold/crease lines |
| Engrave | `#00aa00` (green) | Surface engraving |
| Reference | `#cccccc` (gray) | Guides (hidden by default) |

All measurements in millimeters. Stroke width: 0.1 mm.

---

## Scale Reference

| Parameter | Value |
|-----------|-------|
| LEGO stud diameter (nominal) | 4.8 mm |
| Default hole diameter | 5.0 mm |
| Keyhole slit width | Single-line cut |
| LEGO grid unit | 8.0 mm |
| A4 paper | 210 × 297 mm |
| US Letter | 216 × 279 mm |

---

## Cutter Setup

### Cricut / Silhouette
1. Export SVG from Brick Cloth Studio
2. Upload SVG — paths are merged with `fill-rule="evenodd"` so holes cut correctly
3. Select material (felt, fleece, cotton, etc.)
4. Test with calibration strip first, then cut

### Laser Cutters (Glowforge, xTool, etc.)
1. Export SVG — red = cut, blue = score, green = engrave
2. Import into cutter software
3. Map colors to operations (cut/score/engrave)
4. Disable gray reference layer

---

## Calibration

Use the **Calibration Test Strip** before cutting final designs:

1. Export calibration test from the Export panel
2. Cut the test strip on your chosen fabric
3. Test LEGO stud fit in each hole (4.8–5.2 mm range)
4. Set the best-fit diameter as your hole size

---

## Technology

- **React 18** + **TypeScript** (strict mode)
- **Tailwind CSS** for styling
- **Zustand** for state management
- **Vite 5** for build tooling
- **Vitest** for unit testing (615 tests: symmetry, parameter sensitivity, self-intersection, edge isolation, geometry, packing, debug)
- **jszip** for multi-file downloads
- Custom **SVGPath** geometry builder
- **SeededRNG** for reproducible torn/tattered edges

---

## Project Structure

```
src/
├── components/          # React UI
│   ├── Editor.tsx       # Main layout + footer
│   ├── ElementSelector.tsx
│   ├── PreviewCanvas.tsx
│   ├── ParameterPanel.tsx
│   └── ExportPanel.tsx
├── geometry/            # SVG path primitives
│   ├── primitives.ts
│   ├── edgeStyles.ts    # Shared edge style functions
│   └── intersections.ts # Self-intersection detection utility
├── templates/           # Shape generators
│   ├── base.ts          # Base Template class
│   ├── cape.ts          # Cape + edge styles
│   ├── other.ts         # Flag, Sail, Kama, Pauldron, Wings
│   ├── custom.ts        # Custom traced image
│   ├── svgVariants.ts   # SVG-traced outlines (single-hole capes)
│   └── calibration.ts   # Test strip
├── export/              # SVG/ZIP export
│   ├── svg.ts
│   ├── packer.ts
│   └── zip.ts
├── services/
│   └── patternGenerator.ts
├── store/
│   └── editor.ts        # Zustand store + defaults
├── test/                # Unit tests (615 tests)
│   ├── symmetry.test.ts           # Bilateral symmetry verification (236 tests)
│   ├── parameterSensitivity.test.ts # Parameter → SVG change detection (148 tests)
│   ├── intersection.test.ts       # Self-intersection detection (142 tests)
│   ├── edgeStyleIsolation.test.ts # Edge style independence (62 tests)
│   ├── geometry.test.ts           # Geometry primitives & export (15 tests)
│   ├── packing.test.ts            # Print sheet layout (9 tests)
│   └── debug-failures.test.ts     # Debug regression tests (3 tests)
└── utils/
    ├── constants.ts
    ├── types.ts
    └── rng.ts           # Seeded RNG
```

---

## Testing

```bash
npm test              # Run all tests in watch mode
npm run test:symmetry  # Watch symmetry tests only
npx vitest run        # Single run (all 615 tests)
```

| Suite | Tests | What it verifies |
|-------|-------|------------------|
| **Symmetry** | 236 | Bilateral symmetry of all symmetric variants across parameter changes, side styles, hem+side combos |
| **Parameter Sensitivity** | 148 | Every user-facing parameter actually changes the exported SVG |
| **Self-Intersection** | 142 | Cut paths don't cross themselves across all variants, edge styles, and curve combos |
| **Edge Style Isolation** | 62 | Changing one edge style doesn't affect unrelated styles or variants |
| **Geometry** | 15 | SVGPath primitives, pattern generation, SVG export structure |
| **Packing** | 9 | Print sheet layout, multi-page, margins, orientation |
| **Debug** | 3 | Regression tests for previously-fixed edge cases |

---

## Known Limitations

- Print sheet packing is grid-based (not advanced nesting)
- No on-canvas bezier path editing

---

## License

**Non-Commercial Use Only** — free for personal, hobby, and educational use. Commercial use prohibited without written permission. See [LICENSE](LICENSE).

Do not embed copyrighted images or designs without permission.

---

## Support & Feedback

Found a bug or have a feature request? [Open an issue on GitHub](https://github.com/OneBrickToRuleThem/BrickClothStudio/issues).

---

## Community Cape Scans Wanted

We're looking for **high-quality flatbed scans of official LEGO capes and fabric accessories** to use as references for implementing new template variants. If you have access to capes not yet supported, we'd love your help!

**What we need:**
- **600 DPI flatbed scans** (or higher) of the cape laid flat
- Both sides if the fabric has a distinct front/back
- Any LEGO part number or set number for identification

**How to contribute:**
- Place scans in the [`community-scans/`](community-scans/) folder via pull request
- Or [open an issue](https://github.com/OneBrickToRuleThem/BrickClothStudio/issues) with your scan attached
- File naming: `PartNumber_Description.png` (e.g., `522px1_Standard_Black_Cape.png`)

All contributions will be credited. Scans are used solely as dimensional references — no copyrighted artwork is redistributed.

---

## Credits

Created by [OneBrickToRuleThem](https://www.instagram.com/OneBrickToRuleThem) (Jason Gianou)

Built for the LEGO minifigure customization community.

Not affiliated with the LEGO® Group. For personal use only.

**Version**: 1.1.0
