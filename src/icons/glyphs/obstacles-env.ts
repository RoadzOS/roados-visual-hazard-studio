import { C, carSide, F, G, GlyphDef, GlyphPalette, jagged, P, R, rock, S, stripes, T, waves } from './helpers';

const ground = (p: GlyphPalette, y = 56) => P(`M4 ${y}h56`, S(p.muted, 2.5));

function cone(p: GlyphPalette): string {
  return (
    P('M26 12h12l9 38H17z', F(p.orange)) + P('M24 22h16l1.6 7H22.4zM21.6 34h20.8l1.6 7H20z', F(p.white)) +
    R(12, 49, 40, 7, F(p.ink), 2)
  );
}

function tree(p: GlyphPalette): string {
  return C(32, 20, 13, F(p.green)) + C(22, 26, 9, F(p.green)) + C(42, 26, 9, F(p.green)) + R(29, 28, 6, 26, F(p.brown));
}

export const obstacleEnvGlyphs: Record<string, GlyphDef> = {
  cone: {
    label: 'Traffic cone',
    variants: ['single', 'multiple', 'fallen'],
    draw: ({ p, variant }) => {
      if (variant === 'multiple') return G('translate(-4 18) scale(0.6)', cone(p)) + G('translate(15 12) scale(0.66)', cone(p)) + G('translate(32 6) scale(0.72)', cone(p));
      if (variant === 'fallen') return G('rotate(-72 32 40) translate(0 6)', cone(p)) + ground(p, 58);
      return cone(p);
    },
  },
  barricade: {
    label: 'Barricade',
    variants: ['plastic', 'water_filled', 'metal'],
    draw: ({ p, variant }) => {
      if (variant === 'water_filled')
        return P('M8 54l4-24 6-6h28l6 6 4 24z', F(p.orange)) + R(14, 30, 36, 8, F(p.white)) + C(32, 20, 4, F(p.orange)) + R(28, 16, 8, 6, F(p.orange), 1) + ground(p);
      if (variant === 'metal') {
        let bars = '';
        for (let x = 14; x <= 50; x += 6) bars += P(`M${x} 18v26`, S(p.ink, 2.5));
        return R(8, 14, 48, 32, `fill="none" stroke="${p.ink}" stroke-width="4"`, 2) + bars + P('M10 46l-4 10M54 46l4 10', S(p.ink, 4)) + ground(p, 58);
      }
      return R(6, 16, 52, 16, F(p.white), 2) + stripes(6, 16, 58, 32, 6, p.red) + R(6, 16, 52, 16, `fill="none" stroke="${p.ink}" stroke-width="2"`, 2) + P('M14 32l-4 24M50 32l4 24M14 32l6 24M50 32l-6 24', S(p.ink, 3.5));
    },
  },
  construction_board: {
    label: 'Construction board',
    draw: ({ p, font }) => R(6, 8, 52, 32, F(p.yellow), 3) + T(32, 18, 9, 'WORK', '#111111', font, 900) + T(32, 30, 9, 'AHEAD', '#111111', font, 900) + P('M16 40v18M48 40v18', S(p.ink, 4)),
  },
  temp_warning_board: {
    label: 'Portable warning sign',
    draw: ({ p }) => P('M32 6L54 42H10z', `fill="${p.white}" stroke="${p.red}" stroke-width="5" stroke-linejoin="round"`) + T(32, 31, 16, '!', '#111111', 'Arial', 900) + P('M22 44l-8 14M42 44l8 14M32 44v14', S(p.ink, 3.5)),
  },
  fallen_sign: {
    label: 'Fallen signboard',
    draw: ({ p }) => G('rotate(-12 32 40)', R(8, 32, 40, 18, `fill="${p.blue}" stroke="${p.ink}" stroke-width="2.5"`, 2) + P('M14 41h28', S(p.white, 3))) + P('M44 40l14-26', S(p.ink, 4)) + ground(p, 58),
  },
  fence: {
    label: 'Construction fencing',
    draw: ({ p }) => {
      let mesh = '';
      for (let x = 10; x < 54; x += 8) mesh += P(`M${x} 16l8 32M${x + 8} 16l-8 32`, S(p.muted, 1.6));
      return mesh + P('M8 14v44M32 14v44M56 14v44M8 16h48M8 48h48', S(p.ink, 3.5)) + R(4, 54, 8, 4, F(p.orange)) + R(28, 54, 8, 4, F(p.orange)) + R(52, 54, 8, 4, F(p.orange));
    },
  },
  excavator: {
    label: 'Excavator',
    draw: ({ p }) =>
      R(6, 44, 34, 10, F(p.ink), 5) + C(11, 49, 3, F(p.field)) + C(35, 49, 3, F(p.field)) +
      R(8, 28, 28, 14, F(p.yellow), 2) + R(10, 20, 12, 10, F(p.yellow), 2) + R(12, 22, 7, 6, F(p.field), 1) +
      P('M34 32l12-18 10 14', S(p.ink, 5)) + P('M52 28l6 4-2 8-8-2z', F(p.ink)),
  },
  road_roller: {
    label: 'Road roller',
    draw: ({ p }) =>
      C(46, 44, 11, `fill="${p.ink}" stroke="${p.field}" stroke-width="2"`) + C(14, 48, 7, `fill="${p.ink}" stroke="${p.field}" stroke-width="2"`) +
      R(8, 28, 32, 14, F(p.yellow), 2) + P('M14 28V14h14v14', S(p.ink, 3.5)) + R(12, 12, 18, 3, F(p.ink)) + P('M36 34h10', S(p.ink, 4)),
  },
  material_pile: {
    label: 'Construction material',
    draw: ({ p }) => P('M4 56c4-14 12-22 20-22s14 10 18 22z', F(p.brown)) + R(36, 44, 10, 6, F(p.red), 1) + R(46, 44, 10, 6, F(p.red), 1) + R(41, 38, 10, 6, F(p.red), 1) + R(36, 50, 20, 6, F(p.red), 1) + P('M42 44h4M41 50v6', S(p.field, 1)) + ground(p, 57),
  },
  excavation: {
    label: 'Open excavation',
    draw: ({ p }) => P('M6 30h52', S(p.ink, 3)) + P('M14 30l4 20h28l4-20z', F('#000000')) + P('M14 30l4 20h28l4-20', S(p.ink, 3)) + P('M40 30c2-8 6-12 10-12s6 6 8 12z', F(p.brown)) + R(6, 18, 6, 12, F(p.orange)) + R(6, 18, 6, 4, F(p.white)),
  },
  ramp: {
    label: 'Temporary ramp',
    draw: ({ p }) => P('M4 52h12l26-16h18v22H4z', F(p.ink)) + P('M16 52l26-16', S(p.yellow, 2.5, ' stroke-dasharray="4 3"')) + P('M30 30l10-6', S(p.amber, 3)) + P('M38 20l6 2-2 6z', F(p.amber)),
  },
  cable: {
    label: 'Cable across road',
    draw: ({ p }) => P('M10 4v56M54 4v56', S(p.muted, 2.5)) + P('M4 36c8-8 12 6 20-2s12 6 20-2 12 6 16 0', S(p.ink, 4.5)) + R(2, 32, 6, 8, F(p.orange), 1) + R(56, 28, 6, 8, F(p.orange), 1),
  },
  diversion: {
    label: 'Diversion',
    draw: ({ p }) => R(22, 22, 20, 10, F(p.white)) + stripes(22, 22, 42, 32, 4, p.red) + P('M32 60V46c0-6 18-6 18-14V20c0-6-18-6-18-12', S(p.ink, 5.5)) + P('M24 12l8-10 8 10z', F(p.ink)),
  },
  lane_closure: {
    label: 'Lane closure',
    draw: ({ p }) =>
      P('M6 4v56M58 4v56M24 6v10M24 26v10M24 46v10M40 6v10M40 26v10M40 46v10', S(p.muted, 2.5)) +
      P('M44 30l10 10M54 30L44 40', S(p.red, 4)) + G('translate(36 42) scale(0.3)', cone(p)) + G('translate(36 6) scale(0.3)', cone(p)) +
      P('M49 22c0-6-16-4-16-12', S(p.ink, 3)) + P('M28 12l5-8 5 8z', F(p.ink)),
  },

  // ---- Debris ----
  stone: {
    label: 'Stone on road',
    variants: ['small', 'medium', 'large', 'boulder'],
    draw: ({ p, variant }) => {
      const s = variant === 'small' ? 1.05 : variant === 'medium' ? 1.45 : variant === 'boulder' ? 2.4 : 1.9;
      const cy = variant === 'boulder' ? 33 : 54 - 10 * s;
      return ground(p, 56) + rock(p, 32, cy, s);
    },
  },
  gravel: {
    label: 'Loose gravel / sand',
    variants: ['gravel', 'sand'],
    draw: ({ p, variant }) => {
      const sand = variant === 'sand';
      const pts = [[10, 40], [18, 46], [26, 38], [34, 46], [42, 40], [50, 46], [14, 52], [30, 53], [46, 52], [56, 40], [22, 30], [40, 30]];
      let s = '';
      for (const [x, y] of pts) s += sand ? C(x, y, 1.8, F(p.yellow)) + C(x + 3, y + 3, 1.2, F(p.yellow)) : P(jagged(x, y, 3.2, 2.6, 6, 0.2), F(p.ink));
      return s + ground(p, 58) + (sand ? P('M6 24c8-4 12 2 18-2s10 2 14-2', S(p.yellow, 2.5)) : '');
    },
  },
  pile: {
    label: 'Material heap',
    variants: ['sand', 'soil', 'mud'],
    draw: ({ p, variant }) => {
      const col = variant === 'sand' ? p.yellow : p.brown;
      let s = P('M4 54c6-18 16-30 28-30s22 12 28 30z', F(col));
      if (variant === 'soil') s += C(24, 40, 2.5, F(p.field)) + C(36, 34, 2, F(p.field)) + C(42, 46, 2.5, F(p.field)) + C(20, 50, 2, F(p.field));
      if (variant === 'mud') s += P('M14 44c4-2 6 2 10 0s6 2 10 0 6 2 10 0', S(p.field, 2)) + P('M50 54c0 4 4 4 4 0M12 54c0 3 3 3 3 0', S(col, 2.5));
      if (variant === 'sand') s += C(26, 40, 1.4, F('#111111')) + C(34, 34, 1.4, F('#111111')) + C(40, 44, 1.4, F('#111111')) + C(22, 48, 1.4, F('#111111'));
      return s + ground(p, 56);
    },
  },
  fallen_tree: {
    label: 'Fallen tree',
    draw: ({ p }) => P('M6 46l34-8', S(p.brown, 7)) + P('M14 44l-6-6M10 45l-4 6', S(p.brown, 3)) + C(46, 34, 11, F(p.green)) + C(54, 42, 8, F(p.green)) + C(40, 26, 7, F(p.green)) + ground(p, 56),
  },
  branch: {
    label: 'Tree branch',
    draw: ({ p }) => P('M6 46l48-16M24 40l-4-12M38 35l8-12M46 32l4 8', S(p.brown, 4)) + C(20, 26, 5, F(p.green)) + C(46, 21, 5, F(p.green)) + C(52, 42, 4, F(p.green)) + ground(p, 56),
  },
  glass: {
    label: 'Broken glass',
    draw: ({ p }) => P('M10 46l8-14 4 16zM26 50l10-18 6 18zM44 46l6-12 6 14zM20 28l6-6 2 8zM40 26l4-8 4 8z', `fill="${p.water}" fill-opacity="0.55" stroke="${p.ink}" stroke-width="2" stroke-linejoin="round"`) + ground(p, 56),
  },
  scrap: {
    label: 'Metal scrap',
    draw: ({ p }) => P('M8 46l14-14 10 6 12-14 10 10', S(p.ink, 4)) + P('M14 52l18-2 4-6 14 2', S(p.muted, 3.5)) + C(46, 44, 4, S(p.ink, 2.5)) + ground(p, 58),
  },
  tyre: {
    label: 'Tyre on road',
    draw: ({ p }) => {
      let tread = '';
      for (let a = 0; a < 360; a += 30) tread += G(`rotate(${a} 32 32)`, R(30, 8, 4, 6, F(p.field)));
      return C(32, 32, 22, F(p.ink)) + tread + C(32, 32, 10, F(p.field)) + C(32, 32, 6, S(p.ink, 2.5));
    },
  },
  vehicle_parts: {
    label: 'Vehicle parts',
    draw: ({ p }) => P('M6 30c0-6 4-8 10-8h22c6 0 8 2 8 6v6H6z', F(p.ink)) + R(10, 26, 8, 5, F(p.amber), 1.5) + P('M46 44l10-6M40 50l8 4', S(p.ink, 3.5)) + C(20, 48, 6, S(p.ink, 3)) + C(20, 48, 2, F(p.ink)) + ground(p, 58),
  },
  garbage: {
    label: 'Garbage',
    draw: ({ p }) => P('M14 54c-4-10 0-24 10-28l-2-6h10l-2 6c10 4 14 18 10 28z', F(p.ink)) + P('M26 20l4-6 4 6', S(p.ink, 2.5)) + R(44, 48, 8, 6, F(p.muted), 1) + P('M50 40l6 4', S(p.muted, 3)) + ground(p, 56),
  },
  cargo: {
    label: 'Cargo spillage',
    draw: ({ p }) => G('rotate(-14 24 34)', R(8, 20, 30, 24, F(p.brown), 2) + P('M8 30h30M23 20v24', S(p.field, 2))) + R(40, 44, 10, 10, F(p.brown), 1) + R(50, 48, 8, 6, F(p.brown), 1) + R(44, 36, 8, 8, F(p.brown), 1) + ground(p, 56),
  },
  carcass: {
    label: 'Animal carcass',
    draw: ({ p }) => P('M10 44c0-8 6-12 14-12h18c6 0 10 4 10 10v4H10z', F(p.ink)) + P('M52 40l6-2M20 46l-4 8M28 46l-2 8M40 46l2 8M46 46l4 8', S(p.ink, 3.5)) + P('M12 36l-6-6', S(p.ink, 3)) + ground(p, 58),
  },
  fallen_pole: {
    label: 'Fallen utility pole',
    draw: ({ p }) => P('M8 52L46 16', S(p.ink, 5)) + P('M34 20l14 14', S(p.ink, 4)) + P('M36 22c6 8 12 14 22 20M44 30c4 8 8 12 14 18', S(p.muted, 2)) + P('M18 18l-6 10h6l-6 10', S(p.amber, 3)) + ground(p, 58),
  },
  displaced_furniture: {
    label: 'Displaced road furniture',
    draw: ({ p }) => G('rotate(28 22 54)', R(16, 18, 10, 36, `fill="${p.white}" stroke="${p.ink}" stroke-width="1.5"`, 2) + R(16, 24, 10, 6, F(p.amber))) + G('rotate(-70 44 50)', R(40, 30, 10, 26, F(p.ink), 4) + R(40, 38, 10, 4, F(p.amber))) + ground(p, 58),
  },

  // ---- Environmental ----
  water: {
    label: 'Standing water',
    draw: ({ p }) => P('M4 34h56', S(p.muted, 2.5)) + R(8, 38, 48, 18, F(p.water), 9) + waves(p.white, 44, 2.5, 12, 52) + P('M20 14c0 6-6 8-6 12a6 6 0 0 0 12 0c0-4-6-6-6-12zM42 10c0 5-5 7-5 10a5 5 0 0 0 10 0c0-3-5-5-5-10z', F(p.water)),
  },
  flood: {
    label: 'Flooded road',
    draw: ({ p }) => G('translate(0 -6)', carSide(p)) + R(4, 36, 56, 22, F(p.water)) + waves(p.white, 40, 3, 6, 58) + waves(p.white, 50, 2.5, 10, 54),
  },
  flowing_water: {
    label: 'Water flowing across road',
    draw: ({ p }) => P('M18 4v56M46 4v56', S(p.muted, 2.5)) + waves(p.water, 20, 4) + waves(p.water, 32, 4) + waves(p.water, 44, 4) + P('M50 54h8', S(p.ink, 3)) + P('M56 50l5 4-5 4z', F(p.ink)),
  },
  mud: {
    label: 'Mud / slush',
    variants: ['mud', 'slush'],
    draw: ({ p, variant }) =>
      P('M6 44c4-8 12-6 16-2s10-8 18-4 14 2 18 8c-4 8-12 8-18 6s-12 4-20 2-14-4-14-10z', F(p.brown)) +
      (variant === 'slush' ? waves(p.water, 46, 2.5, 12, 52) + C(20, 26, 2.5, F(p.water)) + C(44, 22, 2, F(p.water)) : C(18, 30, 3, F(p.brown)) + C(46, 28, 2.5, F(p.brown)) + C(30, 24, 2, F(p.brown))) + ground(p, 58),
  },
  spill: {
    label: 'Oil / fuel spill',
    variants: ['oil', 'fuel'],
    draw: ({ p, variant }) => {
      const drop = P('M32 6c0 10-12 16-12 26a12 12 0 0 0 24 0c0-10-12-16-12-26z', F(variant === 'fuel' ? p.amber : p.ink));
      const sheen = P('M8 52c6-6 14-6 24-4s18 6 24 0', S(p.water, 2.5)) + P('M12 56c6-3 12-3 20-1s14 3 20-1', S(p.amber, 2.2));
      const puddle = P('M6 52c0-6 14-8 26-8s26 2 26 8-14 8-26 8S6 58 6 52z', F(variant === 'fuel' ? p.amber : '#000000'));
      return puddle + sheen + drop + (variant === 'fuel' ? P('M28 28l4-6 4 6a4 4 0 0 1-8 0z', F(p.red)) : P('M27 30a6 6 0 0 0 4 6', S(p.field, 2)));
    },
  },
  wet_road: {
    label: 'Wet road surface',
    draw: ({ p }) => P('M8 60L24 26M56 60L40 26', S(p.ink, 3.5)) + P('M32 58v-6M32 44v-5M32 33v-3', S(p.ink, 2.5)) + P('M16 8c0 4-4 6-4 9a4 4 0 0 0 8 0c0-3-4-5-4-9zM32 4c0 4-4 6-4 9a4 4 0 0 0 8 0c0-3-4-5-4-9zM48 8c0 4-4 6-4 9a4 4 0 0 0 8 0c0-3-4-5-4-9z', F(p.water)) + P('M14 52h8M42 50h8', S(p.water, 2.5)),
  },
  rain: {
    label: 'Heavy rain',
    draw: ({ p }) => P('M16 32a10 10 0 0 1 2-20 14 14 0 0 1 26 2 9 9 0 0 1 4 18z', F(p.ink)) + P('M18 38l-4 10M28 38l-4 10M38 38l-4 10M48 38l-4 10M23 50l-3 8M33 50l-3 8M43 50l-3 8', S(p.water, 3.2)),
  },
  fog: {
    label: 'Fog',
    variants: ['fog', 'dense'],
    draw: ({ p, variant }) => {
      const dense = variant === 'dense';
      const lines = dense ? [12, 20, 28, 36, 44, 52] : [16, 28, 40, 52];
      return lines.map((y, i) => P(`M${i % 2 ? 10 : 6} ${y}h${i % 2 ? 44 : 52}`, S(p.ink, dense ? 5 : 4))).join('');
    },
  },
  smoke: {
    label: 'Smoke',
    draw: ({ p }) => P('M20 58c-8-8 6-12-2-20s4-12-2-20M34 58c-8-8 6-12-2-20s4-12-2-20M48 58c-8-8 6-12-2-20s4-12-2-20', S(p.muted, 5)) + P('M10 58h44', S(p.ink, 3)),
  },
  dust: {
    label: 'Dust',
    draw: ({ p }) => P('M8 22c10-6 22 6 34 0s12-4 14 0M6 34c12-6 24 6 36 0s10-2 14 2M10 46c10-6 20 4 30-2', S(p.brown, 4)) + C(48, 46, 2, F(p.brown)) + C(54, 50, 1.6, F(p.brown)) + C(44, 54, 1.6, F(p.brown)) + C(20, 12, 1.6, F(p.brown)),
  },
  sun_glare: {
    label: 'Sun glare',
    draw: ({ p }) => {
      let rays = '';
      for (let a = 0; a < 360; a += 45) rays += G(`rotate(${a} 22 22)`, P('M22 4v6', S(p.amber, 3.2)));
      return C(22, 22, 8, F(p.amber)) + rays + P('M30 56c4-10 12-16 26-16', S(p.ink, 3.5)) + P('M36 34l20 8M30 40l22 12', S(p.amber, 2.2, ' stroke-dasharray="3 3"'));
    },
  },
  night: {
    label: 'Poor night visibility',
    draw: ({ p }) => P('M30 6a14 14 0 1 0 14 22A12 12 0 0 1 30 6z', F(p.ink)) + C(50, 10, 1.8, F(p.ink)) + C(56, 20, 1.4, F(p.ink)) + P('M8 60L22 38M56 60L42 38', S(p.muted, 3)) + P('M32 58v-5M32 46v-4', S(p.muted, 2.5)),
  },
  storm_tree: {
    label: 'Storm with falling trees',
    draw: ({ p }) => G('rotate(-24 32 56)', tree(p)) + P('M42 14c6-2 10 0 16-2M44 24c6-2 10 0 14-2M46 34c4-1 8 0 12-2', S(p.ink, 3)) + ground(p, 58),
  },
  crosswind: {
    label: 'Crosswind (windsock)',
    draw: ({ p }) => P('M10 58V8', S(p.ink, 4)) + P('M10 10l40 4v10l-40 4z', F(p.ink)) + P('M22 11v15M34 12.5v12', S(p.field, 2.5)) + P('M12 58h-6', S(p.ink, 3)) + P('M38 38h18M30 46h22M40 54h14', S(p.muted, 2.5)),
  },
};
