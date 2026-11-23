# RoadOS Visual Hazard Library — RVHL 1.0

_One visual language for every road._

RVHL is the visual specification for RoadOS, a road-intelligence and driver-safety platform, starting with Indian roads. It contains a catalogue of road elements and hazards, a severity model, a speed-information model, a token system and an SVG icon composition engine. The RoadOS Visual Hazard Studio is the reference tool that edits, previews and exports it.

> RVHL is a RoadOS specification. It is **not** ISO-certified or officially approved. Severity levels S1–S5 and advisory speeds are RoadOS proposals. Standards references stay “pending verification” until an editor checks them against the official documents.

## 1. Scope

- 14 families (A–N): traffic signals; regulatory, warning and informatory signs; road markings; road infrastructure; road geometry; road damage; speed-control hazards; temporary obstacles; stones and debris; environmental hazards; moving hazards; visibility and roadside hazards; bridge and special structures; vehicle context.
- Each element has a stable ID `XXX-###` where `XXX` is the family code (SIG, RSG, MRK, INF, GEO, RDM, SPD, TMP, DEB, ENV, MOV, VIS, BRG, VEH).
- Standard status: **standardised**, **convention_inspired**, **non_standard_hazard** or **roados_extension**.

## 2. Architecture

```
src/
  catalogue/
    schema.ts         zod schemas + TypeScript types (source of truth for structure)
    build.ts          pure loader: raw JSON + family defaults → validated, normalised entries
    index.ts          file-based source (swap for an API loader later)
    data/
      families.json   family defaults: frame, severity factors, speed rules, detection, references
      references.json standards documents, URLs, licensing, verification policy
      a-…json – n-…json   one file per family (entries)
  tokens/tokens.json  design tokens (severity, shapes, strokes, radii, badges, themes)
  icons/
    glyphs/           original 64×64 SVG pictograms as pure functions of a palette
    compose.ts        composition engine (frame + severity + badges) → SVG string
  engine/             severity model, advisory speed, simulated route geometry
  export/             PNG rasterisation, ZIP bundles, manifests, Markdown docs
  state/              React store + CatalogueRepository (localStorage today, API later)
  pages/              the 15 studio sections + entry detail
scripts/
  validate-catalogue.ts   CLI validation (schema, IDs, pictograms, SVG well-formedness)
  contact-sheet.ts        renders every element into SVG sheets for visual QA
```

The catalogue, tokens and icon engine have **no UI dependencies**. They run in the browser, in Node (`npm run validate`) and define the behaviour the C++/Skia SDK must reproduce.

## 3. Data model

Raw entries are concise; family defaults fill everything else during normalisation:

```json
{
  "id": "RDM-001",
  "name": "Small pothole",
  "glyph": "pothole",
  "glyphVariant": "small",
  "severityDefault": "S2",
  "variants": ["small", "medium", "large", "deep", "water_filled"],
  "description": "Shallow localised loss of surface material."
}
```

The normalised entry (exported in `catalogue.json`) contains: `id, name, slug, family, description, standardStatus, frame, standardFrame, variants, severity{default, dynamic, factors}, escalation, speed{legalLimit, advisory}, detectionMethods, confidence{minimumToDisplay, minimumToAlert}, dimensions, visual{glyph, glyphVariant, slash, legend, asset}, references[], tags, version`.

Rules enforced by the builder:

- IDs are unique and prefixed with the family code.
- A non-standardised element can never inherit an “explicitly standardised” reference claim from its family; it is downgraded to “inspired by convention”.
- Clause, figure and page are forced to `null` unless the link is marked `verified` (with verifier and date).
- A missing pictogram is reported and rendered as an explicit **PICTOGRAM PENDING** placeholder — never substituted with an unrelated graphic.

## 4. Icon composition

An icon is composed, never stored:

1. **Base pictogram** — 64×64 master, safe area 4–60, explicit colours, no CSS, ids or clip paths.
2. **Shape** — information class: convention frames (warning triangle, prohibitory circle, stop octagon, give-way triangle, informatory rectangle, direction board) or RoadOS frames (hazard tile, pavement tile, arch-top infrastructure tile, signal tile, context hexagon).
3. **Severity** — RoadOS frames take the S1–S5 colour on the border plus a code tab. Convention frames keep official colours; severity is an external bar below the sign.
4. **Size** S/M/L/XL chip (bottom-left).
5. **Count** ×n chip (top-right).
6. **Speed badge** (bottom-right): posted (red ring circle), advisory (ADV rounded rectangle) or unknown (dashed circle).
7. **Distance** pill (bottom centre), metric or imperial.
8. **Direction** arrow chip or **lane** indicator (top-left).

Composed icons use a fixed `0 0 128 128` viewBox; the frame occupies `16 6 96 96`. The pictogram stays identical across severities, so recognition does not depend on colour.

## 5. Severity model (proposal)

Start from the default level; each factor the element declares adds −2…+2; the net change is clamped to ±2 and to S1–S5. Detection confidence never changes severity — it only gates display and alerting via per-element thresholds.

## 6. Speed model

- **Posted legal speed** — only from sign detection, map or authority data; the source is recorded; otherwise shown as unknown.
- **Advisory speed** — RoadOS recommendation with confidence; suppressed when ≥ posted limit; never presented as legal.
- **Current vehicle speed** — instrument numeral.
- km/h is canonical; mph is a display conversion.

## 7. Export contract

- Pictograms: `symbols/{theme}/{family}/{id}-{slug}.svg` (viewBox 0 0 64 64).
- Composed icons: `icons/{theme}/{family}/{id}-{slug}__{representation}-{theme}-{severity}.svg` (viewBox 0 0 128 128), optional `@1x/@2x/@3x.png` (64/128/192 px).
- `manifest.json` lists every asset with id, frame, representation, theme, severity and an FNV-1a content hash.
- `catalogue.json`, `tokens.json`, `references.json`, `README.md` accompany every ZIP.

## 8. Handoff to the C++/Skia SDK

- Consume `tokens.json` directly; do not hard-code colours.
- Either rasterise the exported SVGs with Skia's SVG module (they avoid CSS, clip paths and external references), or port `compose.ts` — its layout constants (`GLYPH_BOX`, badge positions) are the layout specification.
- Treat `catalogue.json` as read-only reference data keyed by stable IDs.

## 9. Editing

Entries can be edited in the detail page. Edits are validated against the schema and stored through `CatalogueRepository` (localStorage in this release). Exports always include local edits. Use “Revert to source” to discard them.

## 10. Commands

```
npm install
npm run dev            # start the studio
npm run validate       # validate catalogue + render every icon variant
npm run contact-sheet -- out/   # write SVG contact sheets for visual QA
npm run build          # type-check and build static site into dist/
```
