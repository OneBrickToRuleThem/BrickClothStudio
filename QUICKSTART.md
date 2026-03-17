# Quick Start Guide - Brick Cloth Studio

## 5-Minute Setup

### Step 1: Install & Run
```bash
cd brick-cloth-studio
npm install
npm run dev
```

Opens at **http://localhost:5173** automatically.

### Step 2: Generate Your First Pattern
1. **Left panel**: Click on **"Cape"** (or any element)
2. **Center canvas**: You'll see a live SVG preview
3. **Right panel**: Adjust the sliders:
   - **Length**: 60 mm (standard cape length)
   - **Width**: 40 mm (shoulder width)
   - **Hole Radius**: 2.5 mm (radius = 5 mm diameter)
   - **Enable Slit**: Toggle on for keyhole attachment

### Step 3: Export
1. Click **"Export Pattern"** button (bottom of right panel)
2. Click **"↓ Export SVG"** to download

You now have a production-ready SVG! 🎉

---

## Step-by-Step: LEGO Stud Sizing

### Understanding the Hole

- **LEGO stud nominal**: 4.8 mm diameter
- **Default hole**: 5.0 mm diameter (4.8 + 0.2 mm clearance)
- **Why 0.2 mm clearance?** Allows fabric thickness to fit

### Test Before Cutting

1. **Export Calibration Test**:
   - Right panel → "Calibration Test" button
   - Downloads test strip with holes: 4.8, 4.9, 5.0, 5.1, 5.2 mm

2. **Cut Test Strip**:
   - Use your laser cutter or Cricut with your chosen fabric
   - Try fitting a LEGO stud into each hole

3. **Find Your Size**:
   - Which hole fits best? (snug but not forced?)
   - Note that diameter, e.g., "5.0 mm perfect fit"

4. **Update Pattern**:
   - Right panel → Adjust "Hole Radius" to match
   - For 5.0 mm: Radius = 2.5 mm
   - Regenerate and export

---

## Element Types Explained

| Element | Best For | Parameters |
|---------|----------|------------|
| **Cape** | Superhero, basic cloak | Length, Width, Slit |
| **Cape (Short)** | Baby faces, small torsos | Same as cape, auto-smaller |
| **Cape (Tattered)** | Torn, weathered look | Seed value for randomness |
| **Cloak** | Robed characters, wizards | Length, hood curve |
| **Flag** | Banners, standards | Length, Width, Pole sleeve |
| **Banner** | Tapered flags, heraldry | Swallowtail option |
| **Wings** | Flying characters | Wingspan adjustment |
| **Kama** | Warrior skirts, armor | Waist opening size |
| **Pauldron** | Shoulder armor | Neck cutout curve |

---

## SVG Export: What's Inside?

When you download an SVG from Brick Cloth Studio, you get:

```
Pattern.svg (example: "Standard-Cape.svg")
├── <svg> (viewBox="0 0 50 70" width="50mm" height="70mm")
├── <defs>
│   ├── <style> with color classes
│   └── (cut, score, engrave, reference layer definitions)
├── <g id="cut">
│   └── <path d="M ... L ... Z" class="cut-line" />
│   └── (all cutting paths in RED #ff0000)
├── <g id="score"> (optional)
│   └── (fold/score paths in BLUE #0000ff)
├── <g id="engrave"> (optional)
│   └── (engraving paths in GREEN #00aa00)
└── <g id="reference" style="display: none;">
    └── (gray guide/annotation paths, hidden by default)
```

---

## Opening SVG in Your Equipment

### Laser Cutter (Glowforge, xTool, etc.)
1. **File** → **Open/Import** the downloaded SVG
2. Look for **red lines** = cut layer
3. Set material type (fabric)
4. Preview and confirm scale is in **mm** (not pixels)
5. Adjust power/speed for fabric
6. Cut!

### Vinyl Cutter (Cricut, Silhouette)
1. **Upload/Import** the SVG
2. **Design Space** recognizes red cut layer
3. Select material: **Felt, Fleece, Cotton**, etc.
4. **Verify scale**: Right-click → Properties → Check dimensions in **mm**
5. **Mat selection**: Use standard mat (fabric doesn't adhere, use painter's tape)
6. Test on calibration strip first!
7. Cut

### 3D Printer (for hard templates)
Some users print SVG → PDF → physical template for tracing. Not recommended for production; use laser/Cricut instead.

---

## Common Workflows

### Workflow 1: Standard Cape for Regular Minifig
1. Select **Cape** → **Standard**
2. Keep defaults (Length 60, Width 40)
3. Toggle **"Enable keyhole slit"** ON
4. Export → Cut → Done ✓

### Workflow 2: Multiple Sizes for Different Characters
1. Generate **Short Cape** (mini-cape.json preset)
2. Export as "short-cape.svg"
3. Change to **Standard Cape**
4. Export as "standard-cape.svg"
5. Download **ZIP** with multiple copies if needed

### Workflow 3: Custom Material Testing
1. Export **Calibration Test**
2. Cut on your chosen fabric + equipment
3. Test fit with actual LEGO stud
4. Adjust hole size in "Hole Radius" slider
5. Update and export pattern
6. Cut final design

### Workflow 4: Batch Production
1. Load preset (e.g., "hero-cape.json")
2. Export → Choose **5 copies**
3. Download as ZIP
4. Cut all 5 at once
5. Vary colors by fabric choice

---

## Troubleshooting Quick Reference

### Q: "Hole is too tight; stud won't fit"
**A**: 
- Export calibration test
- Cut and test with actual stud
- Increase "Hole Radius" by 0.1 mm (now 2.6 mm = 5.2 mm dia.)
- Regenerate and export

### Q: "Hole is too loose; stud falls through"
**A**:
- Decrease "Hole Radius" by 0.1 mm (now 2.4 mm = 4.8 mm dia.)
- Test on calibration strip first
- Export updated pattern

### Q: "SVG opens huge/tiny in Cricut"
**A**:
- Don't resize SVG in Design Space
- Right-click → Properties → Confirm size is in **mm**
- If inches: File was exported wrong; regenerate in Brick Cloth Studio
- Resize in Cricut software using **dimensions given** (e.g., "60 mm length")

### Q: "What's the slit for?"
**A**:
- **Slit** = keyhole-shaped hole
- Allows minifig **head to pass through** without removing head
- Install cape after minifig is assembled
- Default slit: 1.2 mm wide

### Q: "Can I use these for other fabric types?"
**A**:
- **Felt**: Works great, no fraying
- **Fleece**: Thicker, test hole size first
- **Cotton**: May fray; seal edges (iron-on tape, fabric glue)
- **Silk**: Delicate, use lower laser power
- **Ballistic Nylon**: Durable, test fit carefully

---

## Presets Included

Brick Cloth Studio comes with 5 example presets in `/presets`:

1. **hero-cape.json** — Classic superhero cape (70 × 50 mm)
2. **tattered-cloak.json** — Weathered appearance (90 × 60 mm)
3. **mini-cape.json** — Small cape for baby faces (35 × 35 mm)
4. **battle-flag.json** — Rectangular flag (80 × 50 mm)
5. **dragon-wings.json** — Large wings (120 × 150 mm)

**To load a preset**:
1. Right panel → (Coming soon: "Load Preset" button)
2. For now, manually adjust parameters to match preset values

---

## Next Steps

- [ ] **Test calibration strip** on your equipment
- [ ] **Export 2-3 test capes** in different sizes
- [ ] **Find your ideal hole diameter** (4.8–5.2 mm range)
- [ ] **Experiment with element types** (flags, wings, cloaks)
- [ ] **Import custom SVG logos** (when feature complete)
- [ ] **Save your own presets** for future designs

---

## Pro Tips 💡

1. **Batch Testing**: Cut multiple hole sizes at once on a single sheet; identify best fit
2. **Material Library**: Keep test pieces from each fabric type; label with hole size + material
3. **Slit Variation**: Try 0.8 mm, 1.0 mm, 1.2 mm slits to find comfort fit
4. **Tattered Seeding**: Change seed value (12345, 42, 999, etc.) to get different jagged patterns
5. **Backup SVGs**: Save exported patterns in dated folders (2026-03-10/, etc.)
6. **Power Settings**: Create laser/Cricut "recipes" by fabric + weight (e.g., "Felt 3mm @ 30% power")

---

## Support

- **Bug found?** Check browser console (F12)
- **Feature request?** Look at "Planned Features" in README.md
- **Scale issues?** Verify SVG viewBox and width/height are in **mm**, not pixels

---

**Happy fabric crafting!** 🧥✨
