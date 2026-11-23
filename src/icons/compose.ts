/**
 * RVHL icon composition engine.
 *
 * icon = base pictogram (64×64 master) + information-class frame + severity treatment
 *        + optional size / count / speed badge / distance / direction-or-lane adornments.
 *
 * Everything is generated as an SVG string from tokens — no stored combinations.
 * The functions are pure (no DOM), so the same module can run in a browser, in Node
 * for batch export, and serves as the reference implementation for the C++/Skia SDK.
 */
import type { CatalogueEntry, Frame, Severity } from '../catalogue/schema';
import { tokens, type Theme } from '../tokens';
import { GLYPHS, hasGlyph } from './glyphs';
import { escapeXml, type GlyphPalette } from './glyphs/helpers';

export type Representation = 'auto' | 'standard' | 'roados';
export type SizeVariant = 'S' | 'M' | 'L' | 'XL';
export type Direction = 'left' | 'ahead' | 'right' | 'both';
export type SpeedUnit = 'kmh' | 'mph';
export type SpeedKind = 'posted' | 'advisory' | 'unknown';

export interface SpeedBadge {
  kind: SpeedKind;
  /** Always stored in km/h. Converted for display when unit is mph. */
  valueKmh: number | null;
  unit: SpeedUnit;
}

export interface ComposeOptions {
  entry: Pick<CatalogueEntry, 'id' | 'name' | 'frame' | 'standardFrame' | 'visual' | 'severity' | 'family'>;
  variant?: string | null;
  severity?: Severity;
  theme?: Theme;
  representation?: Representation;
  sizeVariant?: SizeVariant | null;
  count?: number | null;
  speed?: SpeedBadge | null;
  distanceM?: number | null;
  unitSystem?: 'metric' | 'imperial';
  direction?: Direction | null;
  lane?: { count: number; index: number } | null;
  showSeverityCode?: boolean;
  /** Optional solid background (for PNG previews). */
  background?: string | null;
  legend?: string | null;
}

export interface ComposedIcon {
  svg: string;
  frame: Frame;
  representation: 'standard' | 'roados';
  glyphFound: boolean;
}

const FONT = tokens.typography.family;
const NUM_FONT = tokens.typography.numeralFamily;
const CV = tokens.convention;

const CONVENTION_FRAMES: Frame[] = ['warning_triangle', 'prohibitory_circle', 'mandatory_circle', 'stop_octagon', 'give_way_triangle', 'info_rect', 'direction_board'];
export const isConventionFrame = (f: Frame) => CONVENTION_FRAMES.includes(f);

const common = {
  red: CV.signRed, amber: CV.signalAmber, green: '#2FAE5A', yellow: CV.markingYellow, orange: '#F26B1D',
  blue: CV.signBlue, water: CV.water, white: '#FFFFFF', brown: '#9A6A3A', dim: '#2A3138',
};

export function paletteFor(frame: Frame, theme: Theme): GlyphPalette {
  const th = tokens.themes[theme];
  switch (frame) {
    case 'warning_triangle':
    case 'prohibitory_circle':
    case 'give_way_triangle':
      return { ...common, ink: CV.signBlack, field: CV.signWhite, muted: '#6B7480', hole: '#2B2F33', marking: CV.signBlack };
    case 'mandatory_circle':
    case 'info_rect':
      return { ...common, ink: '#FFFFFF', field: CV.signBlue, muted: '#A9C1EA', hole: '#0B2A5E', marking: '#FFFFFF' };
    case 'direction_board':
      return { ...common, ink: '#FFFFFF', field: CV.signGreen, muted: '#9FD3B4', hole: '#063A1F', marking: '#FFFFFF' };
    case 'stop_octagon':
      return { ...common, ink: '#FFFFFF', field: CV.signRed, muted: '#F3B7BF', hole: '#5A0612', marking: '#FFFFFF' };
    case 'roados_marking':
      return { ...common, ink: CV.markingWhite, field: th.markingFill, muted: '#7A848E', hole: '#0B0F13', marking: CV.markingWhite };
    case 'roados_infrastructure':
      return { ...common, ink: th.ink, field: th.infraFill, muted: th.inkMuted, hole: theme === 'dark' ? '#000000' : '#2B3440', marking: th.ink };
    case 'roados_context':
      return { ...common, ink: th.ink, field: th.contextFill, muted: th.inkMuted, hole: theme === 'dark' ? '#000000' : '#2B3440', marking: th.ink };
    default:
      return { ...common, ink: th.ink, field: th.frameFill, muted: th.inkMuted, hole: theme === 'dark' ? '#000000' : '#2B3440', marking: th.ink };
  }
}

/** Resolve which frame is used for a representation. */
export function resolveFrame(entry: ComposeOptions['entry'], representation: Representation = 'auto'): { frame: Frame; rep: 'standard' | 'roados' } {
  if (representation === 'standard' && entry.standardFrame) return { frame: entry.standardFrame, rep: 'standard' };
  if (representation === 'roados') {
    if (!isConventionFrame(entry.frame)) return { frame: entry.frame, rep: 'roados' };
    return { frame: 'roados_hazard', rep: 'roados' };
  }
  return { frame: entry.frame, rep: isConventionFrame(entry.frame) ? 'standard' : 'roados' };
}

/** Placement of the 64×64 pictogram inside each frame (cx, cy, box size). */
const GLYPH_BOX: Record<Frame, [number, number, number]> = {
  warning_triangle: [64, 67, 44],
  give_way_triangle: [64, 38, 34],
  prohibitory_circle: [64, 54, 58],
  mandatory_circle: [64, 54, 60],
  stop_octagon: [64, 54, 80],
  info_rect: [64, 54, 70],
  direction_board: [64, 54, 76],
  roados_hazard: [64, 55, 66],
  roados_marking: [64, 54, 76],
  roados_infrastructure: [64, 58, 62],
  roados_signal: [64, 54, 82],
  roados_context: [64, 54, 58],
};

function octagon(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 8; i++) {
    const a = ((22.5 + 45 * i) * Math.PI) / 180;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

function frameSvg(frame: Frame, theme: Theme, sev: Severity, showCode: boolean): { back: string; front: string } {
  const th = tokens.themes[theme];
  const sc = tokens.severity[sev].color;
  const so = tokens.severity[sev].onColor;
  const sw = tokens.stroke.frame;
  const codeTab = showCode
    ? `<rect x="50" y="0.5" width="28" height="15" rx="7.5" fill="${sc}"/>` +
      `<text x="64" y="8.3" font-family="${FONT}" font-size="10" font-weight="800" fill="${so}" text-anchor="middle" dominant-baseline="central">${sev}</text>`
    : '';
  switch (frame) {
    case 'warning_triangle':
      return { back: `<path d="M64 10L111 94H17Z" fill="${CV.signWhite}" stroke="${CV.signRed}" stroke-width="${tokens.stroke.signBorder}" stroke-linejoin="round"/>`, front: '' };
    case 'give_way_triangle':
      return { back: `<path d="M17 14H111L64 98Z" fill="${CV.signWhite}" stroke="${CV.signRed}" stroke-width="${tokens.stroke.signBorder + 2}" stroke-linejoin="round"/>`, front: '' };
    case 'prohibitory_circle':
      return { back: `<circle cx="64" cy="54" r="43" fill="${CV.signWhite}" stroke="${CV.signRed}" stroke-width="${tokens.stroke.signBorder + 1}"/>`, front: '' };
    case 'mandatory_circle':
      return { back: `<circle cx="64" cy="54" r="46" fill="${CV.signBlue}" stroke="#FFFFFF" stroke-width="2.5"/>`, front: '' };
    case 'stop_octagon':
      return { back: `<path d="${octagon(64, 54, 48)}" fill="${CV.signRed}"/><path d="${octagon(64, 54, 44)}" fill="none" stroke="#FFFFFF" stroke-width="3"/>`, front: '' };
    case 'info_rect':
      return { back: `<rect x="18" y="8" width="92" height="92" rx="8" fill="${CV.signBlue}" stroke="#FFFFFF" stroke-width="2.5"/>`, front: '' };
    case 'direction_board':
      return { back: `<rect x="12" y="16" width="104" height="76" rx="6" fill="${CV.signGreen}"/><rect x="16" y="20" width="96" height="68" rx="4" fill="none" stroke="#FFFFFF" stroke-width="2.5"/>`, front: '' };
    case 'roados_marking':
      return { back: `<rect x="18" y="8" width="92" height="92" rx="${tokens.radius.tile}" fill="${th.markingFill}" stroke="${sc}" stroke-width="${sw - 1}"/>`, front: codeTab };
    case 'roados_infrastructure':
      return { back: `<path d="M18 100V46Q18 8 64 8T110 46V100Z" fill="${th.infraFill}" stroke="${sc}" stroke-width="${sw - 1}" stroke-linejoin="round"/>`, front: codeTab };
    case 'roados_signal':
      return { back: `<rect x="24" y="6" width="80" height="96" rx="${tokens.radius.signal}" fill="${th.frameFill}" stroke="${sc}" stroke-width="${sw - 1}"/>`, front: codeTab };
    case 'roados_context':
      return { back: `<path d="M112 54L88 95.6H40L16 54L40 12.4H88Z" fill="${th.contextFill}" stroke="${th.accentBlue}" stroke-width="4" stroke-linejoin="round"/>`, front: '' };
    default:
      return { back: `<rect x="18" y="8" width="92" height="92" rx="${tokens.radius.hazard}" fill="${th.frameFill}" stroke="${sc}" stroke-width="${sw}"/>`, front: codeTab };
  }
}

/** Clearly-labelled placeholder — never an unrelated graphic. */
function missingGlyph(id: string): string {
  return (
    `<rect x="6" y="6" width="52" height="52" rx="6" fill="none" stroke="#E35D32" stroke-width="2.5" stroke-dasharray="5 4"/>` +
    `<text x="32" y="28" font-family="${FONT}" font-size="9" font-weight="800" fill="#E35D32" text-anchor="middle">PICTOGRAM</text>` +
    `<text x="32" y="40" font-family="${FONT}" font-size="9" font-weight="800" fill="#E35D32" text-anchor="middle">PENDING</text>` +
    `<text x="32" y="51" font-family="${FONT}" font-size="5.5" fill="#E35D32" text-anchor="middle">${escapeXml(id)}</text>`
  );
}

export function drawGlyph(glyph: string, variant: string | null, palette: GlyphPalette, standard: boolean, legend: string | null): { body: string; found: boolean } {
  if (!hasGlyph(glyph)) return { body: missingGlyph(glyph), found: false };
  return { body: GLYPHS[glyph].draw({ p: palette, variant, standard, legend, font: FONT }), found: true };
}

export function formatDistance(m: number, system: 'metric' | 'imperial' = 'metric'): string {
  if (system === 'imperial') {
    const ft = m * 3.28084;
    if (ft < 1000) return `${Math.round(ft / 10) * 10} ft`;
    const mi = m / 1609.344;
    return `${mi < 10 ? mi.toFixed(1) : Math.round(mi)} mi`;
  }
  if (m < 1000) return `${Math.round(m / 10) * 10} m`;
  const km = m / 1000;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

export const kmhToMph = (v: number) => v / 1.609344;
export function displaySpeed(valueKmh: number, unit: SpeedUnit): number {
  return Math.round(unit === 'mph' ? kmhToMph(valueKmh) : valueKmh);
}

const txt = (x: number, y: number, size: number, s: string, color: string, weight = 800, font = FONT) =>
  `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="middle" dominant-baseline="central">${escapeXml(s)}</text>`;

export function speedBadgeSvg(b: SpeedBadge, cx: number, cy: number, scale = 1): string {
  const B = tokens.badges;
  let s = '';
  if (b.kind === 'posted' && b.valueKmh != null) {
    const v = String(displaySpeed(b.valueKmh, b.unit));
    s = `<circle cx="0" cy="0" r="${B.postedSpeed.radius}" fill="${B.postedSpeed.fill}" stroke="${B.postedSpeed.ring}" stroke-width="${B.postedSpeed.ringWidth}"/>` +
      txt(0, b.unit === 'mph' ? -2 : 0.5, v.length > 2 ? 13 : 16, v, B.postedSpeed.text, 900, NUM_FONT) +
      (b.unit === 'mph' ? txt(0, 10, 6, 'mph', B.postedSpeed.text, 700) : '');
  } else if (b.kind === 'advisory' && b.valueKmh != null) {
    const v = String(displaySpeed(b.valueKmh, b.unit));
    const A = B.advisorySpeed;
    s = `<rect x="${-A.width / 2}" y="${-A.height / 2}" width="${A.width}" height="${A.height}" rx="${A.radius}" fill="${A.fill}" stroke="${A.stroke}" stroke-width="${A.strokeWidth}"/>` +
      txt(0, -8, 6.5, `${A.label} ${b.unit === 'mph' ? 'MPH' : 'KM/H'}`, A.text, 800) +
      txt(0, 4, 14, v, A.text, 900, NUM_FONT);
  } else {
    const U = B.unknownSpeed;
    s = `<circle cx="0" cy="0" r="${B.postedSpeed.radius}" fill="${U.fill}" stroke="${U.ring}" stroke-width="3" stroke-dasharray="4 3"/>` + txt(0, 0.5, 16, '?', U.text, 900);
  }
  return `<g transform="translate(${cx} ${cy}) scale(${scale})">${s}</g>`;
}

function directionChip(dir: Direction): string {
  const C = tokens.badges.chip;
  const a = {
    ahead: '<path d="M0 7V-5" stroke="#F2F5F7" stroke-width="3" stroke-linecap="round"/><path d="M-5 -2L0 -8L5 -2Z" fill="#F2F5F7"/>',
    left: '<path d="M7 0H-5" stroke="#F2F5F7" stroke-width="3" stroke-linecap="round"/><path d="M-2 -5L-8 0L-2 5Z" fill="#F2F5F7"/>',
    right: '<path d="M-7 0H5" stroke="#F2F5F7" stroke-width="3" stroke-linecap="round"/><path d="M2 -5L8 0L2 5Z" fill="#F2F5F7"/>',
    both: '<path d="M-5 0H5" stroke="#F2F5F7" stroke-width="3"/><path d="M-3 -5L-9 0L-3 5ZM3 -5L9 0L3 5Z" fill="#F2F5F7"/>',
  }[dir];
  return `<g transform="translate(15 17)"><circle r="13" fill="${C.fill}" stroke="${C.stroke}" stroke-width="2"/>${a}</g>`;
}

function laneChip(count: number, index: number, sev: Severity): string {
  const C = tokens.badges.chip;
  const n = Math.max(1, Math.min(6, count));
  const w = 8 + n * 7;
  let bars = '';
  for (let i = 0; i < n; i++) bars += `<rect x="${4 + i * 7}" y="5" width="5" height="14" rx="1.5" fill="${i === index ? tokens.severity[sev].color : '#3A4A5A'}"/>`;
  return `<g transform="translate(2 4)"><rect width="${w}" height="24" rx="6" fill="${C.fill}" stroke="${C.stroke}" stroke-width="2"/>${bars}</g>`;
}

export function composeIcon(o: ComposeOptions): ComposedIcon {
  const theme = o.theme ?? 'dark';
  const sev = o.severity ?? o.entry.severity.default;
  const { frame, rep } = resolveFrame(o.entry, o.representation);
  const palette = paletteFor(frame, theme);
  const standard = isConventionFrame(frame);
  const variant = o.variant ?? o.entry.visual.glyphVariant ?? null;
  const legend = o.legend ?? o.entry.visual.legend ?? null;
  const { body, found } = drawGlyph(o.entry.visual.glyph, variant, palette, standard, legend);
  const [cx, cy, box] = GLYPH_BOX[frame];
  const k = box / 64;
  const fr = frameSvg(frame, theme, sev, o.showSeverityCode !== false);

  const parts: string[] = [];
  if (o.background) parts.push(`<rect width="128" height="128" fill="${o.background}"/>`);
  parts.push(fr.back);
  parts.push(`<g transform="translate(${(cx - box / 2).toFixed(2)} ${(cy - box / 2).toFixed(2)}) scale(${k.toFixed(4)})">${body}</g>`);
  if (o.entry.visual.slash) {
    parts.push(frame === 'prohibitory_circle'
      ? `<path d="M33.6 23.6L94.4 84.4" stroke="${CV.signRed}" stroke-width="9" stroke-linecap="butt"/>`
      : `<path d="M30 22L98 90" stroke="${CV.signRed}" stroke-width="8" stroke-linecap="round"/>`);
  }
  parts.push(fr.front);
  // Severity treatment for convention frames: external bar (official sign colours stay untouched).
  if (standard) parts.push(`<rect x="36" y="103" width="56" height="5" rx="2.5" fill="${tokens.severity[sev].color}"/>`);

  if (o.lane) parts.push(laneChip(o.lane.count, o.lane.index, sev));
  else if (o.direction) parts.push(directionChip(o.direction));
  if (o.count && o.count > 1) {
    const C = tokens.badges.count;
    parts.push(`<g transform="translate(113 17)"><circle r="${C.radius}" fill="${C.fill}" stroke="#0B1118" stroke-width="2"/>${txt(0, 0.5, 11, `×${o.count}`, C.text, 900)}</g>`);
  }
  if (o.sizeVariant) {
    const C = tokens.badges.chip;
    parts.push(`<g transform="translate(2 78)"><rect width="28" height="20" rx="6" fill="${C.fill}" stroke="${C.stroke}" stroke-width="2"/>${txt(14, 10.5, 10, o.sizeVariant, C.text, 900)}</g>`);
  }
  if (o.speed) parts.push(speedBadgeSvg(o.speed, 104, 82));
  if (o.distanceM != null && o.distanceM >= 0) {
    const label = formatDistance(o.distanceM, o.unitSystem);
    const D = tokens.badges.distance;
    const w = 14 + label.length * 7;
    parts.push(`<rect x="${64 - w / 2}" y="109" width="${w}" height="${D.height}" rx="${D.radius}" fill="${D.fill}" stroke="${D.stroke}" stroke-width="1.5"/>` + txt(64, 118.5, tokens.typography.distanceSize, label, D.text, 800));
  }

  const title = escapeXml(`${o.entry.id} ${o.entry.name}`);
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="${title}">` +
    `<title>${title}</title>${parts.join('')}</svg>`;
  return { svg, frame, representation: rep, glyphFound: found };
}

/** Master pictogram (64×64, no frame) — the editable base asset. */
export function pictogramSvg(entry: ComposeOptions['entry'], theme: Theme = 'dark', variant?: string | null, onFrame?: Frame): string {
  const frame = onFrame ?? (isConventionFrame(entry.frame) ? 'roados_hazard' : entry.frame);
  const palette = paletteFor(frame, theme);
  const { body } = drawGlyph(entry.visual.glyph, variant ?? entry.visual.glyphVariant ?? null, palette, false, entry.visual.legend ?? null);
  const title = escapeXml(`${entry.id} ${entry.name} pictogram`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${title}"><title>${title}</title>${body}</svg>`;
}
