import { bicycle, C, child, F, G, GlyphDef, GlyphPalette, mirror, P, R, S, stripes, T } from './helpers';

/** Faint carriageway edges for top-view marking pictograms. */
const edges = (p: GlyphPalette) => P('M7 4v56M57 4v56', S(p.muted, 2));
const dashes = (p: GlyphPalette, x: number, color?: string, w = 4) =>
  R(x - w / 2, 4, w, 12, F(color ?? p.marking)) + R(x - w / 2, 26, w, 12, F(color ?? p.marking)) + R(x - w / 2, 48, w, 12, F(color ?? p.marking));

export const markingInfraGlyphs: Record<string, GlyphDef> = {
  mk_zebra: {
    label: 'Zebra crossing stripes',
    draw: ({ p }) => {
      let s = edges(p);
      for (let x = 10; x <= 50; x += 10) s += R(x, 16, 5, 32, F(p.marking));
      return s;
    },
  },
  mk_stop_line: {
    label: 'Stop line',
    draw: ({ p }) => edges(p) + R(9, 26, 22, 7, F(p.marking)) + R(30, 4, 4, 56, F(p.marking)) + R(42, 36, 4, 10, F(p.marking)) + R(42, 50, 4, 10, F(p.marking)) + P('M20 58V42', S(p.marking, 3)) + P('M15 46l5-7 5 7z', F(p.marking)),
  },
  mk_give_way: {
    label: 'Give-way line and triangle',
    draw: ({ p }) => {
      let s = edges(p);
      for (let x = 10; x <= 50; x += 9) s += R(x, 14, 5, 4, F(p.marking)) + R(x, 21, 5, 4, F(p.marking));
      return s + P('M20 32h24L32 56z', `fill="none" stroke="${p.marking}" stroke-width="3.5" stroke-linejoin="round"`);
    },
  },
  mk_lane: {
    label: 'Longitudinal lane line',
    variants: ['broken', 'solid', 'double', 'centre', 'faded', 'missing'],
    draw: ({ p, variant }) => {
      const v = variant ?? 'broken';
      const base = edges(p);
      switch (v) {
        case 'solid':
          return base + R(30, 4, 4, 56, F(p.marking));
        case 'double':
          return base + R(26, 4, 4, 56, F(p.yellow)) + R(34, 4, 4, 56, F(p.yellow));
        case 'centre':
          return base + dashes(p, 32, p.yellow) + P('M20 54V40M44 10v14', S(p.muted, 2.5)) + P('M16 42l4-5 4 5zM40 22l4 5 4-5z', F(p.muted));
        case 'faded':
          return base +
            R(30, 4, 4, 12, `fill="${p.marking}" opacity="0.85"`) + R(30, 26, 4, 5, `fill="${p.marking}" opacity="0.45"`) +
            R(31, 34, 2, 3, `fill="${p.marking}" opacity="0.35"`) + R(30, 48, 4, 4, `fill="${p.marking}" opacity="0.3"`) +
            C(32, 57, 1, `fill="${p.marking}" opacity="0.3"`);
        case 'missing':
          return base + P('M32 4v56', S(p.muted, 2, ' stroke-dasharray="2 5"')) + P('M18 18l28 28M46 18L18 46', S(p.red, 4.5));
        default:
          return base + dashes(p, 32);
      }
    },
  },
  mk_edge: {
    label: 'Edge line',
    draw: ({ p }) => P('M7 4v56', S(p.muted, 2)) + R(46, 4, 5, 56, F(p.marking)) + dashes(p, 24) + P('M53 6l6 6M53 18l6 6M53 30l6 6M53 42l6 6', S(p.muted, 1.5)),
  },
  mk_arrow: {
    label: 'Pavement direction arrow',
    variants: ['ahead', 'left', 'right', 'ahead_left', 'ahead_right'],
    draw: ({ p, variant }) => {
      const v = variant ?? 'ahead';
      const shaft = 'M32 60V22';
      const head = P('M24 26l8-14 8 14z', F(p.marking));
      const leftBranch = P('M32 42c0-8-6-10-14-10', S(p.marking, 5)) + P('M20 25l-10 7 10 7z', F(p.marking));
      if (v === 'ahead') return edges(p) + P(shaft, S(p.marking, 5)) + head;
      if (v === 'left') return edges(p) + P('M32 60V42', S(p.marking, 5)) + leftBranch;
      if (v === 'right') return edges(p) + mirror(P('M32 60V42', S(p.marking, 5)) + leftBranch);
      const combo = P(shaft, S(p.marking, 5)) + head + leftBranch;
      return edges(p) + (v === 'ahead_right' ? mirror(combo) : combo);
    },
  },
  mk_box: {
    label: 'Yellow box junction',
    draw: ({ p }) => {
      let s = R(8, 8, 48, 48, `fill="none" stroke="${p.yellow}" stroke-width="3.5"`);
      for (let k = -32; k <= 32; k += 12) s += P(`M${8 + Math.max(0, k)} ${8 + Math.max(0, -k)}L${56 - Math.max(0, -k)} ${56 - Math.max(0, k)}`, S(p.yellow, 2.5));
      for (let k = -32; k <= 32; k += 12) s += P(`M${56 - Math.max(0, k)} ${8 + Math.max(0, -k)}L${8 + Math.max(0, -k)} ${56 - Math.max(0, k)}`, S(p.yellow, 2.5));
      return s;
    },
  },
  mk_chevron: {
    label: 'Chevron hatching',
    draw: ({ p }) =>
      P('M32 4L12 60M32 4l20 56', S(p.marking, 3.5)) +
      P('M22 46l10-8 10 8M19 56l13-10 13 10M26 34l6-5 6 5', S(p.marking, 3.5)),
  },
  mk_bus_lane: {
    label: 'Bus lane legend',
    draw: ({ p, font }) => edges(p) + R(44, 4, 4, 56, F(p.marking)) + T(24, 20, 12, 'BUS', p.marking, font, 900) + T(24, 38, 12, 'ONLY', p.marking, font, 900) + P('M24 60V50', S(p.marking, 3)),
  },
  mk_cycle_lane: {
    label: 'Cycle lane symbol',
    draw: ({ p }) => edges(p) + R(46, 4, 3.5, 56, F(p.marking)) + G('translate(2 8) scale(0.66)', bicycle({ ...p, ink: p.marking }, p.marking)),
  },
  mk_speed: {
    label: 'Speed-limit pavement legend',
    draw: ({ p, legend, font }) => edges(p) + G('scale(1 1.7)', T(32, 18.8, 22, legend ?? '—', p.marking, font, 900)),
  },
  mk_school: {
    label: 'School pavement legend',
    draw: ({ p, font }) => edges(p) + G('scale(1 1.5)', T(32, 12, 10, 'SCHOOL', p.marking, font, 900)) + G('translate(14 26) scale(0.55)', child({ ...p, ink: p.marking }, p.marking)) + G('translate(-2 26) scale(0.55)', child({ ...p, ink: p.marking }, p.marking)),
  },
  mk_rumble: {
    label: 'Transverse rumble bars',
    draw: ({ p }) => {
      let s = edges(p);
      for (let y = 10; y <= 54; y += 7) s += R(10, y, 44, 3.5, F(p.marking), 1);
      return s;
    },
  },
  mk_studs: {
    label: 'Raised road studs',
    draw: ({ p }) => edges(p) + dashes(p, 32) + R(28.5, 18.5, 7, 5, `fill="${p.amber}" stroke="${p.marking}" stroke-width="1.5"`, 1.5) + R(28.5, 40.5, 7, 5, `fill="${p.amber}" stroke="${p.marking}" stroke-width="1.5"`, 1.5) + R(3.5, 30, 7, 5, F(p.red), 1.5) + R(53.5, 30, 7, 5, F(p.red), 1.5),
  },
  mk_reflector: {
    label: 'Retroreflective marker',
    draw: ({ p }) =>
      edges(p) + P('M22 50l10-20 10 20z', `fill="${p.amber}" stroke="${p.marking}" stroke-width="2"`) +
      P('M32 22v-8M22 26l-5-5M42 26l5-5', S(p.amber, 3)),
  },

  // ---- Infrastructure ----
  inf_painted_divider: {
    label: 'Painted median',
    draw: ({ p }) => {
      let s = P('M20 4v56M44 4v56', S(p.marking, 3.5));
      for (let y = 0; y <= 56; y += 9) s += P(`M20 ${y + 10}l24-10`, S(p.marking, 2.5));
      return s + P('M8 4v56M56 4v56', S(p.muted, 2));
    },
  },
  inf_median: {
    label: 'Raised kerbed median',
    draw: ({ p }) =>
      P('M6 48h52', S(p.muted, 3)) + P('M14 48V36l6-6h24l6 6v12z', F(p.ink)) + P('M20 30c2-6 6-8 6-12M32 30c0-8 4-10 4-14M44 30c-1-6 2-8 4-10', S(p.green, 3)) +
      R(14, 36, 36, 4, F(p.yellow)),
  },
  jersey_barrier: {
    label: 'Concrete safety-shape barrier',
    draw: ({ p }) => P('M6 56h52', S(p.muted, 3)) + P('M14 56l2-12 8-6V14h16v24l8 6 2 12z', F(p.ink)) + P('M26 22h12', S(p.field, 2)),
  },
  inf_wbeam: {
    label: 'Steel beam guardrail',
    draw: ({ p }) =>
      R(10, 26, 5, 30, F(p.ink)) + R(30, 26, 5, 30, F(p.ink)) + R(50, 26, 5, 30, F(p.ink)) +
      P('M4 22h56v6c-6 0-6 4-14 4s-8-4-14-4-6 4-14 4-8-4-14-4z', F(p.ink)) + P('M4 25h56', S(p.field, 1.5)) + P('M4 58h56', S(p.muted, 2.5)),
  },
  inf_guardrail: {
    label: 'Pedestrian guardrail',
    draw: ({ p }) => P('M6 18h52M6 46h52M8 18v40M56 18v40M17 18v28M26 18v28M35 18v28M44 18v28', S(p.ink, 3.5)),
  },
  inf_delineator: {
    label: 'Delineator post',
    draw: ({ p }) => R(26, 8, 12, 50, `fill="${p.white}" stroke="${p.ink}" stroke-width="1.5"`, 2) + R(26, 14, 12, 8, F(p.amber)) + R(26, 26, 12, 4, F(p.amber)) + P('M14 58h36', S(p.muted, 3)),
  },
  inf_hazard_marker: {
    label: 'Object hazard marker',
    draw: ({ p }) =>
      R(16, 6, 32, 46, F(p.yellow), 2) + stripes(16, 6, 48, 52, 6, '#111111') +
      R(16, 6, 32, 46, `fill="none" stroke="${p.ink}" stroke-width="2"`, 2) + P('M32 52v8', S(p.ink, 4)),
  },
  inf_chevron_marker: {
    label: 'Chevron alignment marker',
    draw: ({ p }) => R(10, 10, 44, 36, F(p.yellow), 3) + P('M24 16l12 12-12 12M36 16l12 12-12 12', S('#111111', 5.5, ' stroke-linecap="butt" stroke-linejoin="miter"')) + P('M32 46v14', S(p.ink, 4)),
  },
  inf_crash_cushion: {
    label: 'Crash cushion',
    draw: ({ p }) =>
      R(6, 26, 40, 24, F(p.ink), 3) + P('M16 26v24M26 26v24M36 26v24', S(p.field, 2)) + R(46, 22, 12, 32, F(p.yellow), 2) +
      P('M48 30l6 4-6 4M48 40l6 4-6 4', S('#111111', 2.5)) + P('M4 54h56', S(p.muted, 2.5)),
  },
  inf_bollard: {
    label: 'Bollard',
    draw: ({ p }) => P('M24 58V18a8 8 0 0 1 16 0v40z', F(p.ink)) + R(24, 24, 16, 5, F(p.amber)) + R(24, 34, 16, 5, F(p.amber)) + P('M14 58h36', S(p.muted, 3)),
  },
  inf_island: {
    label: 'Traffic island',
    draw: ({ p }) => P('M32 6c10 14 14 26 14 34a14 14 0 0 1-28 0c0-8 4-20 14-34z', `fill="${p.ink}" stroke="${p.yellow}" stroke-width="3"`) + P('M32 50V30', S(p.field, 3.5)) + P('M26 34l6-8 6 8z', F(p.field)),
  },
  streetlight: {
    label: 'Street lighting column',
    variants: ['on', 'failed', 'missing'],
    draw: ({ p, variant }) => {
      const v = variant ?? 'on';
      if (v === 'missing')
        return P('M20 58V12h18', S(p.muted, 4, ' stroke-dasharray="4 5"')) + P('M34 12h12l-2 5H36z', `fill="none" stroke="${p.muted}" stroke-width="2.5"`) + T(44, 40, 20, '?', p.ink, 'Arial', 900) + P('M10 58h22', S(p.ink, 3));
      const lamp = P('M34 10h14l-3 6H37z', F(p.ink));
      const light = v === 'on' ? P('M37 18L30 50h26L45 18z', `fill="${p.amber}" opacity="0.35"`) : '';
      return light + P('M20 58V12h16', S(p.ink, 4)) + lamp + P('M10 58h22', S(p.ink, 3)) + (v === 'failed' ? P('M30 24l22 22M52 24L30 46', S(p.red, 4.5)) : '');
    },
  },
  inf_signpost: {
    label: 'Sign post',
    draw: ({ p }) => R(14, 8, 36, 22, `fill="${p.blue}" stroke="${p.ink}" stroke-width="2.5"`, 3) + P('M20 16h24M20 22h16', S(p.white, 2.5)) + P('M32 30v28M22 58h20', S(p.ink, 4)),
  },
  inf_gantry: {
    label: 'Overhead sign gantry',
    draw: ({ p }) => P('M8 60V10h48v50', S(p.ink, 4)) + R(12, 14, 18, 14, F(p.green), 2) + R(34, 14, 18, 14, F(p.green), 2) + P('M21 18v6M43 18v6', S(p.white, 2.5)) + P('M18 22l3-4 3 4M40 22l3-4 3 4', S(p.white, 2)) + P('M24 60l2-16M40 60l-2-16', S(p.muted, 2)),
  },
  inf_boundary_stone: {
    label: 'Boundary stone',
    draw: ({ p, font }) => P('M24 56V26a8 8 0 0 1 16 0v30z', F(p.ink)) + T(32, 40, 10, 'RB', p.field, font, 900) + P('M14 56h36', S(p.muted, 3)),
  },
  inf_km_stone: {
    label: 'Kilometre stone',
    draw: ({ p, font }) =>
      P('M18 58V26a14 14 0 0 1 28 0v32z', F(p.white)) + P('M18 26a14 14 0 0 1 28 0v2H18z', F(p.yellow)) +
      T(32, 40, 13, '12', '#111111', font, 900) + T(32, 51, 6.5, 'KM', '#111111', font, 800) +
      P('M18 58V26a14 14 0 0 1 28 0v32z', `fill="none" stroke="${p.ink}" stroke-width="2"`) + P('M10 58h44', S(p.muted, 3)),
  },
  inf_railing: {
    label: 'Road railing',
    draw: ({ p }) => P('M4 20h56M4 34h56M10 20v36M32 20v36M54 20v36', S(p.ink, 4)) + P('M4 58h56', S(p.muted, 2.5)),
  },
};
