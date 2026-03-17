# LEGO Fabric Element Standards

**Version**: 1.0.0  
**Date**: March 16, 2026  
**Scope**: Design specifications for LEGO-scale fabric elements

## Overview

This document defines the physical and design standards for fabric elements designed to attach to LEGO minifigures. All measurements are in **millimeters (mm)** and account for LEGO's 4.8 mm nominal stud diameter.

---

## Core Specifications

### LEGO Minifigure Scale
| Parameter | Value | Notes |
|-----------|-------|-------|
| Stud Diameter (Nominal) | 4.8 mm | Standard LEGO minifig peg/hole |
| Hole Diameter (Default) | 5.0 mm | 0.2 mm clearance for fabric |
| Clearance Range | 0 - 0.5 mm | User-adjustable for equipment tolerance |
| Keyhole Slit Width | 1.2 mm | Default; range 0.5-2.0 mm |
| Minifig Head Height | ~9.6 mm | 2 studs |
| Minifig Torso Height | ~10.2 mm | ~2.1 studs |

### Attachment Holes

**Standard Circle** (for 2.0mm+ clearance):
- Diameter: 5.0 mm standard
- Allows fabric to slip freely onto LEGO peg
- Clean, simple cutting

**Keyhole Slit** (for precise fit, 0-0.5mm clearance):
- Circular head: 5.0 mm diameter
- Slit extension: 1.2 mm wide × 8 mm long (downward)
- Allows fabric to be threaded without stretching
- More secure than simple circle

---

## Element Types & Standards

### 1. CAPE

**Primary Use**: Superhero/fantasy minifig costumes, dramatic visual effect

**Standard Dimensions** (based on standard-cape.svg reference):
| Variant | Width | Height | Notes |
|---------|-------|--------|-------|
| Standard | 40 mm | 39 mm | Based on real LEGO minifig cape |
| Short | 40 mm | 23 mm | 60% of standard, for babies |
| Long | 40 mm | 55 mm | 140% of standard, dramatic |
| Tattered | 40 mm | 39 mm | Ragged hem, weathered |

**Shape Profile** (Symmetrical, flowing drape):
```
    Top edge (~10-12mm from sides)
      ◄─────────►
       ┌─────┐
      ◆       ◆  ← 2 head attachment holes
     /         \   ~4-6mm from centerline, 8-9mm from top
    /           \
   │             │ ← Sides curve inward (concave)
   │    DRAPE    │
   │    SHAPE    │  ← Flowing, fabric-like appearance
    \           /
     \         /   ← Bottom tapers slightly
      ╲       ╱
       └─────┘      ← Bottom (~40mm wide, ~39mm tall)
```

**Key Features**:
- **Symmetrical**: Bilateral symmetry around vertical centerline (X = 20mm)
- **Silhouette**: Draped, flowing shape with curved sides (not geometric bell)
- **Attachment**: 2 circular holes positioned for head attachment (shoulder area)
- **Curves**: Cubic Bezier curves for smooth, natural drape
- **Hem**: Straight (standard), scalloped (variant), or tattered (variant)
- **Seam Allowance**: None (cut-to-size for laser/vinyl)

**Attachment Holes** (Head attachment):
- **Left hole**: X ≈ 15.5 mm, Y ≈ 8.5 mm (4.5 mm left of centerline X=20mm)
- **Right hole**: X ≈ 25.9 mm, Y ≈ 8.4 mm (5.9 mm right of centerline)
- **Spacing**: ~10.4 mm between hole centers
- **Radius**: ~1.3 mm (2.6 mm diameter, scaled from LEGO standard)
- **Position**: Both holes ~8-9mm from top edge, on shoulder area

**Variants**:
1. **Standard**: Classic shape, versatile
2. **Short**: 60% height for younger minifigs
3. **Long**: 140% height for kings, queens, superheroes
4. **Tattered**: Ragged hem, ± 8% vertical jitter on bottom edge

**Recommended Fabrics**:
- Felt (easiest to cut, no fraying)
- Fleece (warm, drapes well)
- Satin (shiny, formal look)
- Cotton twill (durable, structured)

**Cutting Notes**:
- Shoulder curves: 3-5mm inward from typical edge
- Bottom taper: gradual curve, ~2mm inward per 10mm horizontally
- Hole clearance: 0.2mm for fabric gives ~5.0mm hole
- Avoid sharp corners; use 2-3mm rounds

---

### 2. CLOAK

**Primary Use**: Robes, royal vestments, fantasy wear, full-body coverage

**Standard Dimensions**:
| Variant | Width | Height | Notes |
|---------|-------|--------|-------|
| Hooded | 50 mm | 80 mm | Full cloak with integrated hood |
| Standard | 50 mm | 70 mm | Cape-like but larger |

**Shape Profile** (Hooded variant):
```
    Hood section (20mm diameter circle at top)
         ●
        ╱│╲
       ╱ │ ╲  ← Hood curves
      │  │  │
      │  │  │  ← Shoulder transition
      │      │
      │      │  ← Full body drape (wider than cape)
      │      │
      ╲      ╱  ← Tapers at bottom
       ╲    ╱
        ╲──╱
```

**Key Features**:
- **Hood** (hooded variant): Integrated hood at top, ~20mm diameter
- **Width**: 50mm (25% wider than standard cape)
- **Height**: 70-80mm (nearly 2× cape height)
- **Attachment**: 2-4 holes (shoulders + chest optional)
- **Drape**: Full body coverage with gentle taper

**Attachment Points**:
- Left shoulder: ~10mm from left, ~6mm from top
- Right shoulder: ~10mm from right, ~6mm from top
- Optional chest holes: 15mm below shoulders, 8mm from centerline each

**Variants**:
1. **Hooded**: Integrated hood, full cloak body
2. **Double-layer**: Two layers with different fabrics for color contrast

**Recommended Fabrics**:
- Cotton velvet (regal, drapes beautifully)
- Linen (structured, breathable)
- Wool blend (warm, formal)
- Brocade (patterned, decorative)

**Cutting Notes**:
- Hood: Semicircle ~20mm diameter at top
- Shoulder seam integration: gradual curve transition
- Bottom hem: gentle curve or scalloped edge
- Chest area: straight vertical sections for symmetry

---

### 3. FLAG

**Primary Use**: Standard banners, pennants, signage, decorative elements

**Standard Dimensions**:
| Variant | Width | Height | Notes |
|---------|-------|--------|-------|
| Standard | 30 mm | 25 mm | Rectangular banner |
| Tall | 25 mm | 40 mm | Portrait orientation |
| Wide | 40 mm | 20 mm | Landscape orientation |

**Shape Profile**:
```
    ┌────────────┐
    │            │  ← Pole sleeve (left edge)
    │  BANNER    │     [Cut rectangle ~5mm wide]
    │   IMAGE    │  ← Main area (print/paint here)
    │            │
    └────────────┘
    │ Pole slot
```

**Key Features**:
- **Rectangular**: Clean edges, no curves
- **Pole Sleeve**: Left edge has rectangular cut-out for pole insertion
- **Dimensions**: Varies by orientation (landscape/portrait)
- **Attachment**: Typically on left edge via pole
- **Scaling**: Surface area for clear messaging

**Pole Sleeve Specification**:
- Width: 5 mm (fits ~4mm pole)
- Height: 10-15 mm from top
- Depth: Full thickness cut-out
- Alternative: 2 holes for threading pole

**Variants**:
1. **Standard**: 30×25mm rectangular
2. **Tall**: Vertical orientation 25×40mm
3. **Wide**: Horizontal orientation 40×20mm
4. **Swallowtail**: Bottom edge has notch/swallowtail shape

**Recommended Fabrics**:
- Vinyl (weatherproof, holds color)
- Cotton canvas (structured, printable)
- Polyester (lightweight, vibrant colors)
- Felt (opaque, pure colors)

**Decoration Methods**:
- Printed designs (inkjet on fabric transfer paper)
- Hand-painted (acrylics, oils)
- Appliqué (sewn-on details)
- Heat transfer vinyl (precise lettering)

**Cutting Notes**:
- Straight edges only
- Pole sleeve: rectangular cut ~5mm wide, 12mm tall
- Corner radii: 1-2mm for easier cutting
- Avoid thin slivers at pole area

---

### 4. BANNER

**Primary Use**: Decorative hanging, visual accent, shaped pennants, swallowtails

**Standard Dimensions**:
| Variant | Width | Height | Notes |
|---------|-------|--------|-------|
| Standard | 35 mm | 30 mm | Trapezoid shape |
| Swallowtail | 35 mm | 32 mm | With notch at bottom |
| Triangle | 35 mm | 28 mm | Pointed bottom |

**Shape Profile** (Swallowtail variant):
```
    Hanging edge (top)
    ┌──────────────┐
    │              │  ← Full width (35mm)
    │              ╱  ← Angled sides
    │            ╱
    │          ╱
    └────┬─────┐     ← Swallowtail notch at bottom
         │     │         (~8mm deep, centered)
```

**Key Features**:
- **Trapezoid**: Narrows toward bottom
- **Swallowtail** (optional): V-notch cut in bottom center
- **Pointed** (alternative): Sharp point at bottom instead of flat
- **Attachment**: Top edge, typically 2-4 holes for banner rod

**Top Edge (Hanging)**:
- 35 mm width
- 2-3 holes for rod/string insertion
- Spaced 10-15mm apart, ~3-4mm from edge

**Bottom Edge Shapes**:
- **Straight**: Flat bottom, tapers with angled sides
- **Swallowtail**: V-notch (8-10mm deep) at centerline
- **Pointed**: Single point at center

**Variants**:
1. **Standard**: Trapezoid with swallowtail
2. **Triangle**: Pointed bottom, full taper
3. **Double-tail**: Two notches (deeper drama)
4. **Scalloped**: Curved bottom instead of point/notch

**Recommended Fabrics**:
- Lightweight cotton (drapes, shows movement)
- Silk (elegant, catches light)
- Dupioni (textured, formal)
- Linen (structured, rustic)

**Cutting Notes**:
- Angled sides: taper ~1mm per 5mm of height
- Swallowtail: symmetric V-shape, centered
- Point: gradual taper to sharp point (~1-2mm tip)
- Scallops: 3-5mm radius curves along bottom

---

### 5. WINGS

**Primary Use**: Dragon/fairy/bird wings, back/shoulder mount, fantasy look

**Standard Dimensions**:
| Variant | Width | Height | Notes |
|---------|-------|--------|-------|
| Small | 60 mm | 50 mm | Compact wings |
| Large | 80 mm | 65 mm | Full spread |
| Dragon | 100 mm | 75 mm | Massive wings |

**Shape Profile**:
```
    Center body (10mm wide)
         │
    ┌────┼────┐
    │    │    │
    │ L  │  R │  ← Left & right wings
    │    │    │  (symmetric)
     ╲   │   ╱
      ╲  │  ╱   ← Curved toward body
       ╲ │ ╱
        ╲│╱
```

**Key Features**:
- **Center Body**: Vertical strip 8-10mm wide
- **Symmetric Wings**: Left and right matching shapes
- **Curves**: Outward curve on leading edge, inward on trailing
- **Attachment**: Top center, 2-3 holes on back shoulder area
- **Feather Details**: Optional engraving or surface texture

**Attachment Points**:
- Top center (between shoulder blades)
- 3 holes in vertical line on center body
- Spaced 5-8mm apart
- 3-4mm from left/right edges of center body

**Variants**:
1. **Small**: 60×50mm, bat-like or compact
2. **Large**: 80×65mm, full fairy/angel wings
3. **Dragon**: 100×75mm, large dramatic scale
4. **Feathered**: Surface texture with engraved feather lines

**Wing Curve Detail**:
- Leading edge: smooth outward curve (8-10mm max outward bow)
- Trailing edge: inward curve toward center (4-6mm inward)
- Feather details: 1-2mm engraved lines (optional, for detail)

**Recommended Fabrics**:
- Organza (translucent, ethereal)
- Iridescent film (color-shifting, magical)
- Cellophane (stiff, maintains shape)
- Silk charmeuse (drapes, elegant)
- Specialty holographic (high drama)

**Cutting Notes**:
- Smooth curves on both edges
- Center body: straight vertical edges
- No sharp corners on wing tips
- Feather engraving: light passes, ~1-1.5mm wide
- Optional: heat-activated shaping (curl edges gently)

---

### 6. KAMA (Wrap Skirt)

**Primary Use**: Warrior/samurai kilts, dance skirts, ceremonial wear, draped look

**Standard Dimensions**:
| Variant | Waist Dia | Height | Notes |
|---------|-----------|--------|-------|
| Standard | 30 mm | 35 mm | Fits minifig torso |
| Long | 30 mm | 50 mm | Extended skirt |
| Wide | 35 mm | 35 mm | Fuller base |

**Shape Profile**:
```
    Top (waist opening)
         ●  ← Small hole ~8mm diameter
        ╱ ╲
       ╱   ╲  ← Arc opening (wraps around torso)
      │     │
      │     │  ← Cylindrical body
      │     │
       ╲   ╱  ← Trapezoid flare at bottom
        ╲ ╱
         ●
```

**Key Features**:
- **Waist Opening**: Top arc opening ~8mm diameter at front
- **Wrap Design**: Overlaps on one side for on/off ease
- **Attachment**: 1-2 holes, usually on side seam
- **Drape**: Slightly flared toward bottom for movement
- **Layers**: Often made as two overlapping pieces

**Waist Specification**:
- Top opening: ~30mm wide × 8-10mm tall arc
- Circumference can vary (30-35mm)
- Overlap section: 5-8mm for wrap closure

**Attachment Points**:
- Side seam (left or right): 1-2 holes
- Positioned ~5mm from edge, ~10mm down from waist

**Variants**:
1. **Standard**: Wrap skirt, moderate flare
2. **Long**: Extends to heels, formal look
3. **Divided**: Two-panel (front & back) for fuller coverage
4. **Pleated**: Vertical pleats for structure (engraved lines)

**Recommended Fabrics**:
- Cotton twill (structured, crisp)
- Linen (drapes, warrior aesthetic)
- Denim (durable, holds shape)
- Dupioni silk (formal, structured)
- Chiffon (flowing, soft drape)

**Cutting Notes**:
- Waist opening: smooth arc curve
- Sides: mostly straight with slight curve toward bottom
- Bottom: 2-3mm radius curve for easy movement
- Wrap overlap: straight edge, ~6mm indent

---

### 7. PAULDRON (Shoulder Armor)

**Primary Use**: Knight/warrior armor, shoulder pads, military costumes, statement pieces

**Standard Dimensions**:
| Variant | Width | Height | Notes |
|---------|-------|--------|-------|
| Standard | 35 mm | 40 mm | Single shoulder |
| Large | 40 mm | 45 mm | Heavy armor look |
| Pair | 70 mm | 40 mm | Both shoulders |

**Shape Profile** (Single):
```
    Top edge
    ┌─────┐     
    │     │  ← Neck/center cutout (~8-10mm)
    │  ◆  │  ← Attachment hole
   ╱       ╲  ← Shoulder curves
  │         │
  │         │  ← Armor plate section
  │         │
   ╲       ╱
    └─────┘
      Bottom
```

**Key Features**:
- **Neck Cutout**: Center notch or hole for minifig neck (~8-10mm)
- **Shoulder Curve**: Rounded outer edge, fits shoulder slope
- **Armor Plate**: Solid polygon or curved shape
- **Attachment**: Top center (1 hole on neck) or side (2 holes)
- **Ridges** (optional): Engraved lines for armor plating detail

**Neck Cutout**:
- Semicircle or V-notch at top center
- 8-10mm wide at widest
- 4-6mm deep
- Smooth curves, no sharp points

**Attachment Options**:
1. **Top center**: 1 hole through neck cutout area
2. **Side attachment**: 2 holes on sides (left & right)
3. **Back mount**: Holes positioned for back mounting (less common)

**Variants**:
1. **Standard**: Single pauldron, asymmetric
2. **Large**: Oversized, heavier armor aesthetic
3. **Pair**: Symmetrical, both shoulders (as single 70mm piece)
4. **Ridged**: Vertical or diagonal engraved detail lines
5. **Spiked**: Spike mounting points at edges (functional or decorative)

**Plating Details** (optional engraving):
- Vertical ridges: 2-3mm apart, 1mm deep
- Diagonal bands: follow shoulder angle
- Circular studs: 2-3mm diameter circles, 0.5-1mm deep
- Scale pattern: overlapping semicircles for dragon/reptile armor

**Recommended Fabrics**:
- Thick felt (structured, holds shape)
- Foam-backed fabric (3D effect, protection)
- Vinyl-coated canvas (armor-like sheen)
- Metallic fabric (dramatic shimmer)
- Leather alternative (textured, aged look)

**Cutting Notes**:
- Neck cutout: smooth symmetric curve
- Outer shoulder edge: 3-5mm radius curve
- Bottom edge: straight or slight curve
- Spike mount points: reinforce with backing if functional
- Engraved details: 1-1.5mm depth, avoid thin sections

---

## Attachment Standards

### Hole Specifications

**Standard Circle**:
- Diameter: 5.0 mm (default)
- Tolerance: ±0.2 mm (allows for equipment variation)
- Position: Measured from edge coordinates
- Finish: Clean edges, no burrs

**Keyhole Slit**:
- Head diameter: 5.0 mm
- Slit width: 1.2 mm (standard, range 0.5-2.0mm)
- Slit length: 8 mm (extends downward from hole center)
- Total depth: 4 mm below centerline
- Finish: Smooth curves, no sharp transitions

### Hole Positioning Guidelines

**Single Hole** (cape shoulders):
- From top edge: 4-6 mm
- From left/right edge: 8-10 mm
- Total: Usually 2 holes symmetrically placed

**Multiple Holes** (cloaks, kamas):
- Spacing: 8-12 mm minimum between hole centers
- Alignment: Vertical line typical for symmetry
- Edge clearance: Minimum 4 mm from any edge

**Strength Notes**:
- Keep holes away from stress areas (sharp corners, points)
- If holes near edges, add 2-3mm reinforcement radius
- Overlapping elements: Position holes to avoid tearing

---

## Material & Cutting Specifications

### Cutting Equipment Compatibility

| Equipment | Hole Size | Notes |
|-----------|-----------|-------|
| Laser cutter | 5.0±0.2 mm | Crisp, clean edges |
| Vinyl cutter (Cricut, Silhouette) | 5.0±0.3 mm | May stretch slightly |
| Hand punch (5mm) | 5.0±0.5 mm | Manual tool, tolerance >±0.5mm |
| Knife/template (manual) | 4.8-5.2 mm | Variable, operator-dependent |

### Calibration & Testing

All designs should be tested with a **calibration test strip** before final cutting:

**Test Strip Includes**:
- 5 holes: 4.8, 4.9, 5.0, 5.1, 5.2 mm diameter
- 3 copies of each size
- Cut on target fabric
- Test fit on LEGO peg

**Success Criteria**:
- Hole slides easily onto peg (no binding)
- Fabric doesn't stretch excessively
- Hole edges are clean
- Hole remains secure in use

**Adjustment**:
- If 5.0mm too tight → use 5.1mm or add clearance parameter
- If 5.0mm too loose → use 4.9mm or reduce clearance parameter
- Equipment variation → document successful size for future use

---

## Design Best Practices

### Symmetry & Alignment
- Most elements should have horizontal/vertical centerline symmetry
- Use centerline as primary design reference
- Attachment holes should be symmetrically placed

### Seam Allowance
- **None required** for laser/vinyl cutting (cut-to-size)
- If hand-sewing, add 2-3mm allowance (not standard for LEGO)
- Internal elements (holes, slits) should be precise, no allowance

### Stress Points
- Avoid sharp corners at holes (add 2mm radius)
- Thin sections (<10mm for straight edges) can tear
- Neck/shoulder areas high-stress (thicker fabric recommended)

### Scaling Guidelines
- All dimensions proportional to LEGO 4.8mm stud standard
- When scaling element, maintain hole diameters (5.0mm constant)
- Proportions scale linearly; don't adjust aspect ratios

### Color & Finish
- High-saturation colors show up well at minifig scale
- Metallic/iridescent effects add visual interest
- White/light colors may show dust/wear; consider contrast
- Printed patterns: keep details >2mm for clarity

---

## Quality Checklist

For each element design, verify:

- [ ] All attachment holes are 5.0±0.2 mm diameter (or specified size)
- [ ] Hole positioning matches specification coordinates
- [ ] Curves are smooth (no sharp corners)
- [ ] Edge finish is appropriate for material
- [ ] Thickness/fabric weight supports intended use
- [ ] Weight distribution is balanced (not top-heavy)
- [ ] Design tested with calibration strip on target equipment
- [ ] Dimensions verified in mm (not pixels or arbitrary units)
- [ ] Symmetry confirmed where required
- [ ] All engraved details are ≥1mm width/depth
- [ ] No thin sections (<3mm width) that could tear

---

## Examples & References

### Real-World References
- LEGO catalog minifig capes (standard reference)
- Fantasy costume reference photos
- Historical armor/textile examples
- Cosplay documentation

### Digital Assets
- `standard-cape.svg`: Real LEGO minifig cape reference
- `presets/*.json`: Example designs and parameter sets
- Test patterns in calibration suite

### Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-16 | Initial standards document |
| | | All 7 element types defined |
| | | LEGO scale references established |
| | | Cutting & quality standards documented |

---

**Document Status**: FINAL REVIEW  
**Next Review**: June 2026  
**Maintainer**: Brick Cloth Studio Project  
