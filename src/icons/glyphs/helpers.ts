/**
 * Drawing primitives for RVHL pictograms.
 * Every pictogram is drawn on a 64×64 grid (safe area 4–60) as plain SVG
 * paths / basic shapes with explicit colours — no CSS, no clip paths, no ids —
 * so the output is portable to any SVG renderer, including Skia's SVG module.
 */

export interface GlyphPalette {
  /** Main symbol colour (black on white signs, white on dark RoadOS tiles). */
  ink: string;
  /** Field (background) colour behind the symbol — used for cut-outs. */
  field: string;
  muted: string;
  /** Colour used for holes / voids. */
  hole: string;
  red: string;
  amber: string;
  green: string;
  yellow: string;
  orange: string;
  blue: string;
  water: string;
  white: string;
  marking: string;
  brown: string;
  /** Unlit signal lamp. */
  dim: string;
}

export interface GlyphCtx {
  variant: string | null;
  p: GlyphPalette;
  /** true when drawn inside an official-convention frame (warning triangle, prohibitory circle …). */
  standard: boolean;
  legend: string | null;
  font: string;
}

export type GlyphFn = (c: GlyphCtx) => string;

export interface GlyphDef {
  draw: GlyphFn;
  /** Short human label for the pictogram itself. */
  label: string;
  variants?: string[];
}

export const S = (c: string, w = 4, extra = '') =>
  `fill="none" stroke="${c}" stroke-width="${w}"` +
  (extra.includes('stroke-linecap') ? '' : ' stroke-linecap="round"') +
  (extra.includes('stroke-linejoin') ? '' : ' stroke-linejoin="round"') +
  extra;
export const F = (c: string) => `fill="${c}"`;
export const P = (d: string, attrs: string) => `<path d="${d}" ${attrs}/>`;
export const C = (cx: number, cy: number, r: number, attrs: string) => `<circle cx="${cx}" cy="${cy}" r="${r}" ${attrs}/>`;
export const R = (x: number, y: number, w: number, h: number, attrs: string, rx = 0) =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}"${rx ? ` rx="${rx}"` : ''} ${attrs}/>`;
export const G = (transform: string, body: string) => `<g transform="${transform}">${body}</g>`;
export const mirror = (body: string) => G('matrix(-1 0 0 1 64 0)', body);
export const flipV = (body: string) => G('matrix(1 0 0 -1 0 64)', body);
export const place = (x: number, y: number, s: number, body: string) => G(`translate(${x} ${y}) scale(${s})`, body);
export const T = (x: number, y: number, size: number, text: string, color: string, font: string, weight = 800, anchor = 'middle') =>
  `<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" dominant-baseline="central">${escapeXml(text)}</text>`;

export function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Deterministic jagged ellipse (pothole rims, broken edges). */
export function jagged(cx: number, cy: number, rx: number, ry: number, n = 14, jit = 0.18): string {
  const pts: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (i % 2 === 0 ? jit : -jit * 0.6) * (i % 3 === 0 ? 1.2 : 0.8);
    pts.push(`${r1(cx + Math.cos(a) * rx * k)} ${r1(cy + Math.sin(a) * ry * k)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** Rock silhouette centred on (cx, cy), unit ≈ 12px radius at s=1. */
export function rock(p: GlyphPalette, cx: number, cy: number, s: number, fill?: string): string {
  const d = 'M-12 7L-13 -1L-7 -9L3 -11L11 -5L13 4L8 9L-6 10Z';
  return G(`translate(${cx} ${cy}) scale(${s})`,
    P(d, `${F(fill ?? p.ink)} stroke="${p.field}" stroke-width="${1.6 / s}" stroke-linejoin="round"`) +
    P('M-7 -9L-2 -1L8 1M-2 -1L-5 8', S(p.field, 1.8 / s)));
}

export function wheel(p: GlyphPalette, cx: number, cy: number, r: number, color?: string) {
  return C(cx, cy, r, `${F(color ?? p.ink)} stroke="${p.field}" stroke-width="2.5"`);
}

/** Car side view, facing right. Spans x 7–57, y 20–48. */
export function carSide(p: GlyphPalette, color?: string): string {
  const c = color ?? p.ink;
  return (
    P('M7 41V34c0-2 1.5-3.5 3.5-4l8-1.5 6.5-8.5h15l8 8.5 6 1c2 .5 3 2 3 4V41z', F(c)) +
    P('M26.5 23h6v6h-10.5zM35.5 23h4.5l5 6h-9.5z', F(p.field)) +
    wheel(p, 18, 42, 5.5, c) + wheel(p, 46, 42, 5.5, c)
  );
}

/** Car rear view. Spans x 12–52, y 18–50. */
export function carRear(p: GlyphPalette, color?: string, lamp?: string): string {
  const c = color ?? p.ink;
  return (
    P('M12 31l6-12h28l6 12v13H12z', F(c)) +
    R(14, 43, 8, 7, F(c), 2) + R(42, 43, 8, 7, F(c), 2) +
    P('M20.5 22h23l4 8h-31z', F(p.field)) +
    R(15, 34, 7, 5, F(lamp ?? p.field), 1.5) + R(42, 34, 7, 5, F(lamp ?? p.field), 1.5)
  );
}

/** Car top view, facing up. Spans x 23–41, y 10–50. */
export function carTop(p: GlyphPalette, color?: string): string {
  const c = color ?? p.ink;
  return R(23, 10, 18, 40, F(c), 6) + P('M25.5 21h13l-2 6h-9z', F(p.field)) + P('M26.5 41h11l1 4h-13z', F(p.field));
}

/** Truck side view, facing right. Spans x 5–57, y 12–48. */
export function truckSide(p: GlyphPalette, color?: string): string {
  const c = color ?? p.ink;
  return (
    R(5, 13, 32, 27, F(c), 2) +
    P('M39 21h10l7 9v10H39z', F(c)) +
    P('M42 24h6l4.5 6H42z', F(p.field)) +
    wheel(p, 13, 42, 5, c) + wheel(p, 26, 42, 5, c) + wheel(p, 48, 42, 5, c)
  );
}

/** Bus side view, facing right. Spans x 5–59, y 14–48. */
export function busSide(p: GlyphPalette, color?: string): string {
  const c = color ?? p.ink;
  let win = '';
  for (let x = 9; x < 50; x += 10) win += R(x, 20, 7, 8, F(p.field), 1);
  return (
    P('M5 16a2 2 0 0 1 2-2h46c3 0 6 3 6 7v19a2 2 0 0 1-2 2H5z', F(c)) + win +
    R(52, 20, 4, 8, F(p.field), 1) +
    wheel(p, 15, 42, 5.5, c) + wheel(p, 47, 42, 5.5, c)
  );
}

/** Walking person, facing right. Spans y 4–58. */
export function person(p: GlyphPalette, color?: string, w = 5.5): string {
  const c = color ?? p.ink;
  return (
    C(34, 9.5, 5.5, F(c)) +
    P('M32 18l-4 17M31 21l-8 9M31 21l8 7M28 35l-7 18M28 35l7 8 1 11', S(c, w))
  );
}

/** Standing person. */
export function personStanding(p: GlyphPalette, color?: string): string {
  const c = color ?? p.ink;
  return C(32, 10, 5.5, F(c)) + P('M32 18v19M24 24l8-4 8 4M28 37v17M36 37v17', S(c, 5.5));
}

/** Child figure with school bag, facing right, smaller scale. */
export function child(p: GlyphPalette, color?: string): string {
  const c = color ?? p.ink;
  return (
    C(32, 20, 5, F(c)) +
    R(22, 27, 7, 10, F(c), 2) +
    P('M31 27l-2 13M30 30l8 5M29 40l-5 13M29 40l6 6v8', S(c, 4.8))
  );
}

/** Cow / cattle side view facing left. Spans x 5–58, y 13–55. */
export function cow(p: GlyphPalette, color?: string, buffalo = false): string {
  const c = color ?? p.ink;
  const horns = buffalo
    ? P('M9 21c-6-1-7-6-3-9M16 20c2-5 7-6 9-3', S(c, 3))
    : P('M9 21c-2-4 0-7 2-8M16 20c1-4 4-5 6-5', S(c, 3));
  return (
    P('M16 23h28c7 0 10 4 10 9v7h-3v14h-5V41H25v12h-5V39c-3-2-4-5-4-8z', F(c)) +
    P('M17 22l-9 2-3 8 4 4 9-4z', F(c)) + horns +
    P('M54 27c4 3 4 9 2 14', S(c, 2.5))
  );
}

export function dog(p: GlyphPalette, color?: string): string {
  const c = color ?? p.ink;
  return (
    P('M18 30h24c4 0 6 3 6 6v3h-3v12h-4V41H25v10h-4V40c-2-2-3-5-3-10z', F(c)) +
    P('M20 31l-4-10 3-6 3 3h5l1 5-3 4z', F(c)) + P('M16 21l-6 1 1 4 6 1', F(c)) +
    P('M47 33c4-3 6-8 5-12', S(c, 3))
  );
}

export function goat(p: GlyphPalette, color?: string): string {
  const c = color ?? p.ink;
  return (
    P('M19 28h22c4 0 6 3 6 6v2h-2v15h-4V39H27v12h-4V38c-2-2-4-5-4-10z', F(c)) +
    P('M20 29l-5-9 2-5h5l3 6-1 6z', F(c)) + P('M16 23l-1 7', S(c, 2.5)) +
    P('M19 15c2-5 7-6 10-3', S(c, 3)) + P('M46 30l4-4', S(c, 3))
  );
}

/** Generic quadruped (deer-like) facing left. */
export function quadruped(p: GlyphPalette, color?: string): string {
  const c = color ?? p.ink;
  return (
    P('M20 29h22c4 0 7 3 7 7v2l-3 1v13h-4V40H27v12h-4V39c-2-2-3-5-3-10z', F(c)) +
    P('M21 30l-4-11-6-1 1-4 7 1 4 4 1 7z', F(c)) + P('M49 33l4-6', S(c, 3))
  );
}

/** Motorcycle with rider, facing right. */
export function motorcycle(p: GlyphPalette, color?: string): string {
  const c = color ?? p.ink;
  return (
    C(15, 44, 7.5, S(c, 4)) + C(49, 44, 7.5, S(c, 4)) +
    P('M15 44l10-11h14l10 11', S(c, 4)) +
    P('M23 31h16l5 5H25z', F(c)) + P('M42 33l4-9h5', S(c, 3.5)) +
    C(31, 11, 5, F(c)) + P('M30 18l-3 11h11M31 21l9 4', S(c, 4.5))
  );
}

/** Bicycle with rider, facing right. */
export function bicycle(p: GlyphPalette, color?: string, withRider = true): string {
  const c = color ?? p.ink;
  return (
    C(15, 45, 8, S(c, 3.5)) + C(49, 45, 8, S(c, 3.5)) +
    P('M15 45l9-14h15l10 14M24 31l8 14 7-14M32 45H15M38 24h5l-4 7', S(c, 3)) +
    (withRider ? C(32, 10, 4.8, F(c)) + P('M31 16l-4 12 5 9M30 19l9 5', S(c, 4.5)) : '')
  );
}

/** Red diagonal "failed / not available" strike. */
export function strike(p: GlyphPalette, w = 5): string {
  return P('M12 52L52 12', S(p.red, w));
}

/** Warning triangle (small, used inside pictograms). */
export function miniTriangle(cx: number, cy: number, s: number, stroke: string, fill: string): string {
  return G(`translate(${cx} ${cy}) scale(${s})`, P('M0 -10L10 8H-10Z', `fill="${fill}" stroke="${stroke}" stroke-width="${3 / s}" stroke-linejoin="round"`));
}

/** Water waves band. */
export function waves(c: string, y: number, w = 3.5, x0 = 8, x1 = 56): string {
  let d = `M${x0} ${y}`;
  for (let x = x0; x < x1; x += 8) d += `q2 -3 4 0t4 0`;
  return P(d, S(c, w));
}

/** Road surface edge lines in perspective (vanishing at top). */
export function roadPerspective(p: GlyphPalette, color?: string): string {
  const c = color ?? p.ink;
  return P('M8 58L26 8M56 58L38 8', S(c, 4)) + P('M32 56v-8M32 40v-7M32 26v-5M32 15v-3', S(c, 3));
}

type Pt = [number, number];
/** Sutherland–Hodgman clip of a polygon to an axis-aligned rectangle (keeps SVG free of clipPath ids). */
export function clipToRect(poly: Pt[], x0: number, y0: number, x1: number, y1: number): Pt[] {
  const edgesFns: [(p: Pt) => boolean, (a: Pt, b: Pt) => Pt][] = [
    [(q) => q[0] >= x0, (a, b) => [x0, a[1] + ((b[1] - a[1]) * (x0 - a[0])) / (b[0] - a[0])]],
    [(q) => q[0] <= x1, (a, b) => [x1, a[1] + ((b[1] - a[1]) * (x1 - a[0])) / (b[0] - a[0])]],
    [(q) => q[1] >= y0, (a, b) => [a[0] + ((b[0] - a[0]) * (y0 - a[1])) / (b[1] - a[1]), y0]],
    [(q) => q[1] <= y1, (a, b) => [a[0] + ((b[0] - a[0]) * (y1 - a[1])) / (b[1] - a[1]), y1]],
  ];
  let out = poly;
  for (const [inside, cut] of edgesFns) {
    const input = out;
    out = [];
    for (let i = 0; i < input.length; i++) {
      const cur = input[i];
      const prev = input[(i + input.length - 1) % input.length];
      if (inside(cur)) {
        if (!inside(prev)) out.push(cut(prev, cur));
        out.push(cur);
      } else if (inside(prev)) out.push(cut(prev, cur));
    }
    if (!out.length) break;
  }
  return out;
}

/** Diagonal stripes (rising to the right) clipped to a rectangle. */
export function stripes(x0: number, y0: number, x1: number, y1: number, pitch: number, color: string, rising = true): string {
  const h = y1 - y0;
  let s = '';
  for (let k = x0 - h - pitch; k < x1 + pitch; k += pitch * 2) {
    const poly: Pt[] = rising
      ? [[k, y1], [k + pitch, y1], [k + pitch + h, y0], [k + h, y0]]
      : [[k, y0], [k + pitch, y0], [k + pitch + h, y1], [k + h, y1]];
    const c = clipToRect(poly, x0, y0, x1, y1);
    if (c.length >= 3) s += `<path d="M${c.map(([a, b]) => `${Math.round(a * 10) / 10} ${Math.round(b * 10) / 10}`).join('L')}Z" fill="${color}"/>`;
  }
  return s;
}
