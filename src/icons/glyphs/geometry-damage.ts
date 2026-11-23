import { C, F, G, GlyphDef, GlyphPalette, jagged, mirror, P, person, R, roadPerspective, S, T, waves } from './helpers';

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Cosine-bell hump profile on a base line at y=48. */
function bell(cx: number, w: number, h: number, base = 48, steps = 12): { d: string; at: (x: number) => number } {
  const at = (x: number) => {
    const t = (x - cx) / (w / 2);
    return Math.abs(t) > 1 ? base : base - h * (0.5 + 0.5 * Math.cos(Math.PI * t));
  };
  let d = `M${r1(cx - w / 2)} ${base}`;
  for (let i = 1; i <= steps; i++) {
    const x = cx - w / 2 + (w * i) / steps;
    d += `L${r1(x)} ${r1(at(x))}`;
  }
  return { d: d + 'Z', at };
}

function hump(p: GlyphPalette, cx: number, w: number, h: number, marked: boolean): string {
  const b = bell(cx, w, h);
  let s = P(b.d, F(marked ? p.yellow : p.ink));
  if (marked) {
    for (let x = cx - w / 2 + w * 0.18; x < cx + w / 2 - 2; x += w * 0.22) {
      const top = b.at(x + 1.5);
      if (48 - top > 1.5) s += R(r1(x), r1(top + 0.6), 3, r1(48 - top - 0.6), F('#111111'));
    }
  }
  return s;
}

const baseLine = (p: GlyphPalette) => P('M4 49h56', S(p.ink, 3.5));

function pothole(p: GlyphPalette, cx: number, cy: number, rx: number, ry: number, opts: { water?: boolean; deep?: boolean } = {}): string {
  const rim = jagged(cx, cy, rx, ry, 16, 0.12);
  let s = P(rim, `fill="${opts.water ? p.water : p.hole}" stroke="${p.ink}" stroke-width="3.5" stroke-linejoin="round"`);
  if (opts.deep) s += P(jagged(cx, cy + ry * 0.12, rx * 0.62, ry * 0.55, 12, 0.14), `fill="#000000" stroke="${p.ink}" stroke-width="2.2" stroke-linejoin="round"`);
  else if (!opts.water) s += P(`M${r1(cx - rx * 0.6)} ${r1(cy - ry * 0.15)}q${r1(rx * 0.6)} ${r1(ry * 0.7)} ${r1(rx * 1.2)} 0`, S(p.ink, 2));
  if (opts.water) s += P(`M${r1(cx - rx * 0.55)} ${r1(cy - ry * 0.1)}q${r1(rx * 0.14)} -3 ${r1(rx * 0.28)} 0t${r1(rx * 0.28)} 0t${r1(rx * 0.28)} 0t${r1(rx * 0.28)} 0`, S(p.white, 2.2));
  s += P(`M${r1(cx + rx * 0.95)} ${r1(cy - ry * 0.4)}l${r1(rx * 0.35)} -${r1(ry * 0.5)}M${r1(cx - rx * 0.95)} ${r1(cy + ry * 0.3)}l-${r1(rx * 0.3)} ${r1(ry * 0.5)}`, S(p.ink, 2.5));
  return s;
}

export const geometryDamageGlyphs: Record<string, GlyphDef> = {
  straight_road: { label: 'Straight road', draw: ({ p }) => roadPerspective(p) },
  s_bend: {
    label: 'Reverse bend',
    draw: ({ p }) => P('M24 60c0-12 16-14 16-24s-16-12-16-22', S(p.ink, 6)) + P('M14 18L24 4l10 14z', F(p.ink)),
  },
  lane_merge: {
    label: 'Lanes merge',
    draw: ({ p }) => P('M16 60c0-14 16-16 16-28V16M48 60c0-14-16-16-16-28', S(p.ink, 6)) + P('M22 20L32 6l10 14z', F(p.ink)),
  },
  lane_split: {
    label: 'Lane splits',
    draw: ({ p }) => P('M32 60V38M32 40c0-10-12-12-12-24M32 40c0-10 12-12 12-24', S(p.ink, 6)) + P('M12 20l8-14 8 14zM36 20l8-14 8 14z', F(p.ink)),
  },
  flyover: {
    label: 'Flyover / elevated road',
    variants: ['normal', 'damaged'],
    draw: ({ p, variant }) => {
      const dmg = variant === 'damaged';
      const deck = dmg ? R(4, 16, 25, 9, F(p.ink)) + R(35, 16, 25, 9, F(p.ink)) + P('M29 14l3 6-3 4 3 4M35 14l-2 5 2 4-2 5', S(p.red, 2.5)) : R(4, 16, 56, 9, F(p.ink));
      return deck + P('M4 13h56', S(p.ink, 2.5)) + R(13, 25, 7, 24, F(p.ink)) + R(44, 25, 7, 24, F(p.ink)) + P('M4 54h56', S(p.muted, 3)) + P('M8 58h8M24 58h8M40 58h8', S(p.muted, 2));
    },
  },
  underpass: {
    label: 'Underpass',
    variants: ['normal', 'flooded'],
    draw: ({ p, variant }) =>
      P('M4 8h56v50h-9V36a19 17 0 0 0-38 0v22H4z', F(p.ink)) + P('M22 58l6-18M42 58l-6-18', S(p.muted, 2.5)) +
      (variant === 'flooded' ? R(13, 46, 38, 12, F(p.water)) + waves(p.white, 50, 2.2, 15, 49) : ''),
  },
  interchange: {
    label: 'Grade-separated interchange',
    draw: ({ p }) => P('M32 4v56M4 32h56', S(p.ink, 5)) + C(21, 21, 8, S(p.ink, 3.5)) + C(43, 21, 8, S(p.ink, 3.5)) + C(21, 43, 8, S(p.ink, 3.5)) + C(43, 43, 8, S(p.ink, 3.5)),
  },
  bridge: {
    label: 'Bridge',
    variants: ['normal', 'damaged', 'parapet', 'steep'],
    draw: ({ p, variant }) => {
      const v = variant ?? 'normal';
      if (v === 'steep')
        return P('M4 42c14 0 18-20 28-20s14 20 28 20', S(p.ink, 6)) + P('M4 34c14 0 18-20 28-20s14 20 28 20', S(p.ink, 2.5)) + P('M14 42v14M50 42v14', S(p.ink, 4)) + waves(p.water, 56, 3, 18, 46);
      const rail = v === 'parapet' ? P('M6 18h18M42 18h16M6 18v10M15 18v10M24 18v10M42 18v10M50 18v10M58 18v10', S(p.ink, 3)) + P('M26 16l4 6M38 14l-3 7', S(p.red, 3)) : P('M6 18h52M6 18v10M15 18v10M24 18v10M33 18v10M42 18v10M50 18v10M58 18v10', S(p.ink, 3));
      const deck = R(4, 28, 56, 7, F(p.ink));
      const dmg = v === 'damaged' ? P(jagged(32, 31.5, 7, 3, 10, 0.2), `fill="${p.hole}" stroke="${p.red}" stroke-width="2"`) + P('M22 30l4 2-3 2M44 29l-4 3 4 2', S(p.red, 2)) : '';
      return rail + deck + dmg + P('M12 35c0 10 9 16 20 16s20-6 20-16', S(p.ink, 4)) + waves(p.water, 57, 3, 8, 56);
    },
  },
  tunnel: {
    label: 'Tunnel portal',
    variants: ['lit', 'dark'],
    draw: ({ p, variant }) => {
      const dark = variant === 'dark';
      const inner = dark ? P('M14 58V32a18 17 0 0 1 36 0v26z', F('#000000')) : '';
      const lamps = dark
        ? C(32, 24, 4, F(p.dim)) + P('M24 18l16 14M40 18L24 32', S(p.red, 3))
        : C(22, 26, 2.5, F(p.amber)) + C(32, 21, 2.5, F(p.amber)) + C(42, 26, 2.5, F(p.amber));
      return P('M4 58V30a28 26 0 0 1 56 0v28h-9V32a19 18 0 0 0-38 0v26z', F(p.ink)) + inner + P('M22 58l7-18M42 58l-7-18', S(p.muted, 2.5)) + lamps;
    },
  },
  gradient: {
    label: 'Steep gradient',
    variants: ['up', 'down'],
    draw: ({ p, variant, font }) => {
      const wedge = P('M4 54h56V22z', F(p.ink));
      const arrow = variant === 'down' ? P('M14 14v16', S(p.ink, 4)) + P('M8 26l6 8 6-8z', F(p.ink)) : P('M14 34V18', S(p.ink, 4)) + P('M8 22l6-8 6 8z', F(p.ink));
      return variant === 'down'
        ? mirror(wedge + arrow) + T(20, 45, 13, '%', p.field, font, 900)
        : wedge + arrow + T(44, 45, 13, '%', p.field, font, 900);
    },
  },
  blind_crest: {
    label: 'Blind crest',
    draw: ({ p }) =>
      P('M4 58V50c14 0 18-22 28-22s14 22 28 22v8z', F(p.ink)) +
      P('M8 40L44 22', S(p.amber, 2.5, ' stroke-dasharray="3 4"')) + C(8, 40, 3, F(p.amber)) +
      G('translate(36 6) scale(0.34)', P('M7 41V34c0-2 1.5-3.5 3.5-4l8-1.5 6.5-8.5h15l8 8.5 6 1c2 .5 3 2 3 4V41z', `fill="none" stroke="${p.ink}" stroke-width="6" stroke-dasharray="6 6"`)),
  },
  shoulder: {
    label: 'Shoulder condition',
    variants: ['normal', 'narrow', 'missing'],
    draw: ({ p, variant }) => {
      const v = variant ?? 'normal';
      const road = R(6, 4, 36, 56, F(p.ink)) + P('M24 6v10M24 26v10M24 46v10', S(p.field, 3)) + P('M40 4v56', S(p.white, 2.5));
      if (v === 'missing')
        return road + P('M42 4c4 6-3 10 2 16s-4 10 1 16-3 10 2 14-3 8 0 10', S(p.ink, 2.5)) + C(52, 14, 2, F(p.brown)) + C(56, 30, 2.5, F(p.brown)) + C(50, 44, 2, F(p.brown)) + P('M46 20l12 12M58 20L46 32', S(p.red, 3.5));
      const w = v === 'narrow' ? 5 : 14;
      return road + R(42, 4, w, 56, `fill="${p.muted}"`) + (v === 'narrow' ? P('M52 30h8M52 30l3-3M52 30l3 3', S(p.amber, 2.5)) : '');
    },
  },
  edge_drop: {
    label: 'Edge drop-off',
    draw: ({ p }) =>
      P('M4 30h34v18h22v10H4z', F(p.ink)) + C(32, 22, 7, `fill="${p.field}" stroke="${p.ink}" stroke-width="3.5"`) +
      P('M50 30v18', S(p.amber, 3)) + P('M46 34l4-5 4 5zM46 44l4 5 4-5z', F(p.amber)),
  },

  // ---- Road damage ----
  pothole: {
    label: 'Pothole',
    variants: ['small', 'medium', 'large', 'deep', 'water_filled', 'multiple', 'long', 'edge'],
    draw: ({ p, variant }) => {
      switch (variant) {
        case 'small': return pothole(p, 32, 34, 15, 9);
        case 'medium': return pothole(p, 32, 34, 20, 11);
        case 'deep': return pothole(p, 32, 34, 24, 14, { deep: true });
        case 'water_filled': return pothole(p, 32, 34, 23, 13, { water: true });
        case 'multiple': return pothole(p, 20, 22, 12, 7) + pothole(p, 44, 32, 12, 7) + pothole(p, 24, 47, 13, 7);
        case 'long': return pothole(p, 32, 32, 11, 24);
        case 'edge': return P('M50 4v56', S(p.white, 3.5)) + R(52, 4, 10, 56, F(p.muted)) + pothole(p, 36, 34, 16, 10);
        default: return pothole(p, 32, 34, 24, 13);
      }
    },
  },
  cracks: {
    label: 'Surface cracking',
    draw: ({ p }) => P('M6 30l8-4 6 6 8-7 7 5 7-4 6 5 10-2M20 32l-3 10 6 6-2 10M35 30l2 9-5 7M42 30l4-12 8-4M14 26l-2-12 6-8', S(p.ink, 3)),
  },
  broken_asphalt: {
    label: 'Broken asphalt',
    draw: ({ p }) =>
      P('M6 10h20l-4 12-16 4z', F(p.ink)) + P('M30 8h26v14l-14 4-8-6z', F(p.ink)) + P('M6 32l18-4 6 10-6 14-18 2z', F(p.ink)) +
      P('M32 32l12-4 12 6v22H36l-6-10z', F(p.ink)) + P('M26 26l4 2-2 3z', F(p.ink)),
  },
  uneven_surface: {
    label: 'Uneven resurfacing step',
    draw: ({ p }) => P('M4 44h22l2-8h16l2 4h14v18H4z', F(p.ink)) + P('M4 36h22M44 34h16', S(p.muted, 2, ' stroke-dasharray="3 3"')) + P('M27 22v8', S(p.amber, 3)) + P('M23 27l4 5 4-5z', F(p.amber)),
  },
  manhole: {
    label: 'Manhole',
    variants: ['sunken', 'open'],
    draw: ({ p, variant }) =>
      variant === 'open'
        ? P('M8 38a20 11 0 1 0 40 0a20 11 0 1 0-40 0z', `fill="#000000" stroke="${p.ink}" stroke-width="3"`) +
          G('rotate(-18 46 22)', P('M30 22a16 6 0 1 0 32 0a16 6 0 1 0-32 0z', `fill="${p.ink}"`) + P('M36 21h20M38 24h16', S(p.field, 1.6)))
        : P('M8 32a24 13 0 1 0 48 0a24 13 0 1 0-48 0z', S(p.ink, 3)) +
          P('M14 37a18 9 0 1 0 36 0a18 9 0 1 0-36 0z', `fill="${p.ink}" stroke="${p.field}" stroke-width="1.5"`) +
          P('M20 34h24M18 38h28M20 42h24', S(p.field, 1.6)) + P('M32 6v12', S(p.amber, 3)) + P('M27 14l5 6 5-6z', F(p.amber)),
  },
  open_drain: {
    label: 'Open drain',
    draw: ({ p }) => P('M4 24h16v30h24V24h16', S(p.ink, 4.5)) + R(22, 40, 20, 12, F(p.water)) + waves(p.white, 44, 2, 24, 40) + P('M4 28h16M44 28h16', S(p.muted, 2)),
  },
  drain_cover: {
    label: 'Broken drain grating',
    draw: ({ p }) => {
      let bars = '';
      for (let x = 14; x <= 50; x += 7) if (x !== 35) bars += P(`M${x} 16v32`, S(p.ink, 3.2));
      return R(10, 12, 44, 40, F(p.hole), 3) + R(10, 12, 44, 40, `fill="none" stroke="${p.ink}" stroke-width="3.5"`, 3) + bars + P('M38 12l-6 12 6 6-4 10 4 12', S(p.red, 2.5));
    },
  },
  depression: {
    label: 'Surface depression',
    draw: ({ p }) => P('M4 30h12c6 0 8 12 16 12s10-12 16-12h12v26H4z', F(p.ink)) + P('M18 32c6 0 8 6 14 6s8-6 14-6', `fill="${p.water}" stroke="none"`) + P('M4 22h56', S(p.muted, 2, ' stroke-dasharray="3 4"')),
  },
  rutting: {
    label: 'Wheel-path rutting',
    draw: ({ p }) => P('M4 30h8c2 0 3 8 7 8s5-8 7-8h12c2 0 3 8 7 8s5-8 7-8h8v26H4z', F(p.ink)) + C(19, 22, 7, S(p.ink, 3)) + C(45, 22, 7, S(p.ink, 3)),
  },
  erosion: {
    label: 'Edge erosion / washout',
    draw: ({ p }) => P('M4 4h34c-5 8 4 12-2 20s7 12 0 20 4 12 2 16H4z', F(p.ink)) + P('M14 8v10M14 28v10M14 48v8', S(p.field, 3)) + P('M46 14c4 2 4 6 8 6M46 32c4 2 4 6 8 6M46 50c4 2 4 6 8 6', S(p.water, 3)),
  },
  broken_concrete: {
    label: 'Broken concrete slab',
    draw: ({ p }) => R(6, 6, 24, 24, F(p.ink)) + R(34, 6, 24, 24, F(p.ink)) + R(6, 34, 24, 24, F(p.ink)) + P('M34 34h24v24H44l-4-8-6 2z', F(p.ink)) + P('M10 10l8 8 2 10M38 22l8-4 6 8', S(p.field, 2)),
  },
  expansion_joint: {
    label: 'Bridge expansion joint',
    draw: ({ p }) => R(4, 30, 24, 12, F(p.ink)) + R(36, 30, 24, 12, F(p.ink)) + P('M28 30h4v4h-4zM32 36h4v4h-4z', F(p.ink)) + P('M36 30l4-8h10', S(p.red, 3.5)) + P('M4 46h56', S(p.muted, 2)),
  },
  subsidence: {
    label: 'Ground subsidence',
    draw: ({ p }) => P('M4 24h24l4 6v28H4z', F(p.ink)) + P('M34 38h26v20H34z', F(p.ink)) + P('M28 24l6 14', S(p.red, 2.5)) + P('M47 16v12', S(p.amber, 3)) + P('M42 24l5 6 5-6z', F(p.amber)),
  },

  // ---- Speed control ----
  speed_breaker: {
    label: 'Speed hump profile',
    variants: ['sign', 'marked', 'small', 'medium', 'high', 'unmarked', 'oversized', 'sharp', 'broken', 'multiple'],
    draw: ({ p, variant }) => {
      const v = variant ?? 'marked';
      switch (v) {
        case 'sign': return hump(p, 32, 40, 18, false) + P('M4 48h56v5H4z', F(p.ink));
        case 'small': return baseLine(p) + hump(p, 32, 38, 10, true);
        case 'medium': return baseLine(p) + hump(p, 32, 42, 20, true);
        case 'high': return baseLine(p) + hump(p, 32, 40, 30, true);
        case 'oversized': return baseLine(p) + hump(p, 32, 56, 34, true);
        case 'unmarked': return baseLine(p) + hump(p, 32, 42, 18, false) + T(32, 16, 18, '?', p.amber, 'Arial', 900);
        case 'sharp': return baseLine(p) + P('M13 48l2-20h34l2 20z', F(p.yellow)) + R(21, 29, 4, 19, F('#111111')) + R(30, 29, 4, 19, F('#111111')) + R(39, 29, 4, 19, F('#111111'));
        case 'broken': return baseLine(p) + P('M10 48c6 0 8-18 17-18l3 7-4 11z', F(p.ink)) + P('M34 32l4-2c8 0 10 18 16 18H33l4-7z', F(p.ink)) + P('M28 24l2 4M35 23l-1 4M31 21v3', S(p.ink, 2.4)) + P('M29 32l3 6-3 5', S(p.red, 2.4));
        case 'multiple': return baseLine(p) + hump(p, 13, 20, 13, true) + hump(p, 32, 20, 13, true) + hump(p, 51, 20, 13, true);
        default: return baseLine(p) + hump(p, 32, 42, 17, true);
      }
    },
  },
  rumble_strips: {
    label: 'Rumble strips',
    draw: ({ p }) => {
      let s = P('M6 60L24 6M58 60L40 6', S(p.ink, 3));
      const ys = [56, 47, 39, 32, 26, 21, 17];
      for (const y of ys) {
        const t = (60 - y) / 54;
        const xl = 6 + 18 * t + 2, xr = 58 - 18 * t - 2;
        s += R(r1(xl), y, r1(xr - xl), r1(4 - t * 2.4), F(p.ink), 0.8);
      }
      return s;
    },
  },
  raised_crossing: {
    label: 'Raised pedestrian crossing',
    draw: ({ p }) => P('M4 52h8l8-12h24l8 12h8v4H4z', F(p.ink)) + R(22, 40, 4, 3, F(p.field)) + R(30, 40, 4, 3, F(p.field)) + R(38, 40, 4, 3, F(p.field)) + G('translate(19 2) scale(0.42)', person(p)),
  },
  speed_cushion: {
    label: 'Speed cushions',
    draw: ({ p }) => P('M6 4v56M58 4v56', S(p.muted, 2)) + R(10, 24, 12, 16, F(p.yellow), 4) + R(26, 24, 12, 16, F(p.yellow), 4) + R(42, 24, 12, 16, F(p.yellow), 4) + P('M16 28v8M32 28v8M48 28v8', S('#111111', 2.5)),
  },
  step_up: {
    label: 'Sudden elevation',
    draw: ({ p }) => P('M4 46h24v-14h32v26H4z', F(p.ink)) + P('M16 26V12', S(p.amber, 3)) + P('M11 16l5-6 5 6z', F(p.amber)),
  },
  railway_hump: {
    label: 'Raised level-crossing track bed',
    draw: ({ p }) => baseLine(p) + hump(p, 32, 48, 20, false) + R(22, 27, 5, 5, F(p.field)) + R(37, 27, 5, 5, F(p.field)) + P('M16 18l32-12M48 18L16 6', S(p.ink, 3.5)),
  },
};

