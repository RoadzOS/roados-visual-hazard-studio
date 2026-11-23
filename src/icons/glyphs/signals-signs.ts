import { C, F, G, GlyphDef, P, R, S, T, busSide, carRear, carSide, cow, child, mirror, person, personStanding, strike } from './helpers';

const housing = (x: number, y: number, w: number, h: number, c: string, stroke: string) =>
  R(x, y, w, h, `fill="${c}" stroke="${stroke}" stroke-width="2.5"`, 5);

const arrowUp = (c: string, w = 6) => P('M32 54V14', S(c, w)) + P('M20 25L32 10l12 15z', F(c));

export const signalSignGlyphs: Record<string, GlyphDef> = {
  traffic_light: {
    label: 'Three-aspect signal head',
    variants: ['all', 'red', 'amber', 'green', 'dark'],
    draw: ({ p, variant }) => {
      const v = variant ?? 'all';
      const lit = (k: string) => v === 'all' || v === k;
      return (
        housing(20, 3, 24, 58, '#141A21', p.ink) +
        C(32, 14, 7, F(lit('red') ? p.red : p.dim)) +
        C(32, 32, 7, F(lit('amber') ? p.amber : p.dim)) +
        C(32, 50, 7, F(lit('green') ? p.green : p.dim)) +
        (v === 'dark' ? strike(p) : '')
      );
    },
  },
  arrow_signal: {
    label: 'Arrow signal aspect',
    variants: ['left', 'ahead', 'right'],
    draw: ({ p, variant }) => {
      const arrow = P('M44 32H22', S(p.green, 5)) + P('M28 23l-9 9 9 9z', F(p.green));
      const body = variant === 'ahead' ? G('rotate(90 32 32)', arrow) : variant === 'right' ? mirror(arrow) : arrow;
      return housing(10, 10, 44, 44, '#141A21', p.ink) + C(32, 32, 16, F('#0A0E12')) + body;
    },
  },
  pedestrian_signal: {
    label: 'Pedestrian signal',
    variants: ['stop', 'walk'],
    draw: ({ p, variant }) => {
      const walk = variant === 'walk';
      return (
        housing(16, 3, 32, 58, '#141A21', p.ink) +
        G('translate(19.5 5) scale(0.39)', personStanding(p, walk ? p.dim : p.red)) +
        G('translate(19.5 33) scale(0.39)', person(p, walk ? p.green : p.dim))
      );
    },
  },
  flashing_signal: {
    label: 'Flashing amber signal',
    draw: ({ p }) =>
      housing(21, 16, 22, 32, '#141A21', p.ink) + C(32, 32, 8, F(p.amber)) +
      P('M8 32h6M50 32h6M14 14l5 5M50 14l-5 5M14 50l5-5M50 50l-5-5', S(p.amber, 3.5)),
  },
  lane_control: {
    label: 'Lane-control signal',
    variants: ['open', 'closed'],
    draw: ({ p, variant }) => {
      const closed = variant !== 'open';
      const xc = closed ? p.red : p.dim;
      const ac = closed ? p.dim : p.green;
      return R(6, 14, 52, 32, `fill="#141A21" stroke="${p.ink}" stroke-width="2.5"`, 4) +
        P('M32 14v32', S(p.ink, 2)) +
        P('M14 22l14 14M28 22L14 36', S(xc, 4.5)) +
        P('M43 20v12', S(ac, 4.5)) + P('M37 30l6 8 6-8z', F(ac)) +
        P('M20 46v12M44 46v12', S(p.ink, 3));
    },
  },
  railway_signal: {
    label: 'Level-crossing flashing lights',
    draw: ({ p }) =>
      P('M18 8l28 14M46 8L18 22', S(p.ink, 4)) +
      R(10, 26, 44, 16, `fill="#141A21" stroke="${p.ink}" stroke-width="2.5"`, 8) +
      C(19, 34, 5, F(p.red)) + C(45, 34, 5, F(p.dim)) + P('M32 42v18', S(p.ink, 4)),
  },
  police_signal: {
    label: 'Traffic police hand signal',
    draw: ({ p }) =>
      P('M25 6h14l-2 5H27z', F(p.ink)) + C(32, 15, 5, F(p.ink)) +
      P('M32 22v18M26 40l-2 17M38 40l2 17M32 26l-14-14M32 26l14 5', S(p.ink, 5.5)) +
      P('M14 6v8l4 3', S(p.ink, 4)),
  },
  vms: {
    label: 'Variable message sign',
    draw: ({ p }) => {
      let dots = '';
      for (let y = 18; y <= 34; y += 8) for (let x = 12; x <= 52; x += 4) if ((x + y) % 12 !== 2) dots += C(x, y, 1.4, F(p.amber));
      return R(5, 10, 54, 32, `fill="#141A21" stroke="${p.ink}" stroke-width="3"`, 3) + dots + P('M16 42v16M48 42v16', S(p.ink, 4));
    },
  },
  toll_barrier: {
    label: 'Toll / access barrier',
    draw: ({ p }) =>
      R(6, 18, 14, 40, F(p.ink), 2) + R(9, 22, 8, 8, F(p.field), 1) +
      R(20, 32, 38, 6, `fill="${p.white}" stroke="${p.ink}" stroke-width="1.5"`, 3) + R(26, 32, 6, 6, F(p.red)) + R(38, 32, 6, 6, F(p.red)) + R(50, 32, 6, 6, F(p.red)) +
      C(14, 12, 4, F(p.green)),
  },

  // ---- Regulatory ----
  stop: {
    label: 'STOP legend',
    draw: ({ p, standard, font }) =>
      standard
        ? T(32, 33, 19, 'STOP', p.white, font, 900)
        : P('M22 6h20l14 14v24L42 58H22L8 44V20z', `fill="${p.red}" stroke="${p.white}" stroke-width="2.5"`) + T(32, 33, 13.5, 'STOP', p.white, font, 900),
  },
  give_way: {
    label: 'Give way (frame-defined)',
    draw: ({ p, standard }) =>
      standard ? '' : P('M8 14h48L32 56z', `fill="${p.white}" stroke="${p.red}" stroke-width="6" stroke-linejoin="round"`),
  },
  no_entry: {
    label: 'No entry',
    draw: ({ p }) => C(32, 32, 27, F(p.red)) + R(13, 27, 38, 10, F(p.white), 1),
  },
  one_way: {
    label: 'One-way arrow',
    draw: ({ p }) => arrowUp(p.ink, 8),
  },
  no_parking: {
    label: 'Parking prohibited',
    draw: ({ p, font }) => T(32, 34, 40, 'P', p.ink, font, 800),
  },
  no_stopping: {
    label: 'Stopping prohibited',
    draw: ({ p }) => C(32, 32, 24, `fill="${p.blue}" stroke="${p.red}" stroke-width="5"`) + P('M17 17l30 30M47 17L17 47', S(p.red, 5)),
  },
  no_overtaking: {
    label: 'Overtaking prohibited',
    draw: ({ p }) => G('translate(2 10) scale(0.47)', carRear(p, p.red, p.field)) + G('translate(32 10) scale(0.47)', carRear(p, p.ink, p.field)),
  },
  u_turn: {
    label: 'U-turn arrow',
    draw: ({ p }) => P('M42 56V26a10 10 0 0 0-20 0v14', S(p.ink, 6)) + P('M13 36l9 14 9-14z', F(p.ink)),
  },
  speed_limit: {
    label: 'Speed limit number',
    draw: ({ p, legend, font, standard }) =>
      (standard ? '' : C(32, 32, 27, `fill="${p.white}" stroke="${p.red}" stroke-width="6"`)) +
      T(32, 34, (legend ?? '').length > 2 ? 22 : 28, legend ?? '—', standard ? p.ink : '#111111', font, 900),
  },
  height_limit: {
    label: 'Height limit',
    draw: ({ p, legend, font }) =>
      P('M22 6h20L32 16zM22 58h20L32 48z', F(p.ink)) + T(32, 32.5, 13, legend ?? '', p.ink, font, 800),
  },
  width_limit: {
    label: 'Width limit',
    draw: ({ p, legend, font }) =>
      P('M6 22v20l10-10zM58 22v20L48 32z', F(p.ink)) + T(32, 32.5, 13, legend ?? '', p.ink, font, 800),
  },
  weight_limit: {
    label: 'Weight limit',
    draw: ({ p, legend, font }) =>
      R(14, 10, 22, 16, F(p.ink), 1.5) + P('M37 15h7l5 6v5H37z', F(p.ink)) + C(20, 27, 3.5, F(p.ink)) + C(43, 27, 3.5, F(p.ink)) +
      T(32, 46, 15, legend ?? '', p.ink, font, 800),
  },

  // ---- Warning ----
  curve: {
    label: 'Sharp bend',
    variants: ['left', 'right'],
    draw: ({ p, variant }) => {
      const b = P('M38 58V32c0-9-6-14-15-14h-3', S(p.ink, 7)) + P('M22 6L8 18l14 12z', F(p.ink));
      return variant === 'right' ? mirror(b) : b;
    },
  },
  hairpin: {
    label: 'Hairpin bend',
    variants: ['left', 'right'],
    draw: ({ p, variant }) => {
      const b = P('M42 58V24a9 9 0 0 0-18 0v20', S(p.ink, 6)) + P('M15 40l9 15 9-15z', F(p.ink));
      return variant === 'right' ? mirror(b) : b;
    },
  },
  dip: {
    label: 'Dip in road profile',
    draw: ({ p }) => P('M4 26h14c6 0 8 16 14 16s8-16 14-16h14v6H48c-5 0-9 16-16 16s-11-16-16-16H4z', F(p.ink)),
  },
  rough_road: {
    label: 'Uneven road surface',
    draw: ({ p }) => P('M4 46h10c3 0 4-10 8-10s5 10 8 10 4-10 8-10 5 10 8 10h14v6H4z', F(p.ink)) + P('M20 22v-6M32 26v-8M44 22v-6', S(p.ink, 3.5)),
  },
  loose_gravel: {
    label: 'Loose chippings',
    draw: ({ p }) =>
      G('translate(10 6) scale(0.68)', carSide(p)) +
      C(14, 48, 3, F(p.ink)) + C(22, 54, 2.5, F(p.ink)) + C(10, 56, 2, F(p.ink)) + C(46, 50, 3, F(p.ink)) + C(54, 44, 2.5, F(p.ink)) + C(52, 56, 2, F(p.ink)) +
      P('M8 40l-4-5M56 38l4-5', S(p.ink, 2.5)),
  },
  falling_rocks: {
    label: 'Falling rocks',
    draw: ({ p }) =>
      P('M58 4v56H40L36 44l6-10-4-12 8-10z', F(p.ink)) +
      P('M22 14l7 1 2 6-5 4-6-3z', F(p.ink)) + P('M14 30l6 1 1 5-5 3-4-4z', F(p.ink)) + P('M22 46l7 0 2 6-6 4-5-4z', F(p.ink)) +
      P('M8 58h50', S(p.ink, 3)),
  },
  narrow_bridge: {
    label: 'Narrow bridge',
    draw: ({ p }) =>
      P('M12 60l8-16V20L12 4M52 60l-8-16V20l8-16', S(p.ink, 5)) + P('M14 26h6M14 34h6M44 26h6M44 34h6', S(p.ink, 3)),
  },
  narrow_road: {
    label: 'Narrow road',
    draw: ({ p }) => P('M16 60c0-10 8-12 8-20V24c0-8-8-10-8-20M48 60c0-10-8-12-8-20V24c0-8 8-10 8-20', S(p.ink, 5)),
  },
  road_narrows: {
    label: 'Carriageway narrows',
    variants: ['both', 'left', 'right'],
    draw: ({ p, variant }) => {
      const left = variant === 'right' ? 'M14 60V4' : 'M14 60V38l8-12V4';
      const right = variant === 'left' ? 'M50 60V4' : 'M50 60V38l-8-12V4';
      return P(`${left}M${right.slice(1)}`, S(p.ink, 6));
    },
  },
  slippery: {
    label: 'Slippery road',
    draw: ({ p }) =>
      G('translate(10 0) scale(0.68)', carRear(p)) +
      P('M18 40c-6 4 6 8 0 12s6 8 0 10M44 40c6 4-6 8 0 12s-6 8 0 10', S(p.ink, 3.5)),
  },
  crossroads: { label: 'Crossroads', draw: ({ p }) => P('M32 4v56M8 32h48', S(p.ink, 8, ' stroke-linecap="butt"')) },
  t_junction: { label: 'T-junction', draw: ({ p }) => P('M6 14h52M32 14v46', S(p.ink, 8, ' stroke-linecap="butt"')) },
  y_junction: { label: 'Y-junction', draw: ({ p }) => P('M32 60V34M32 34L14 6M32 34L50 6', S(p.ink, 8, ' stroke-linecap="butt"')) },
  roundabout: {
    label: 'Roundabout',
    draw: ({ p }) => {
      const seg = P('M32 12a20 20 0 0 1 17.3 10', S(p.ink, 5)) + P('M52 15l-1 13-11-6z', F(p.ink));
      return seg + G('rotate(120 32 32)', seg) + G('rotate(240 32 32)', seg);
    },
  },
  ped_crossing: {
    label: 'Pedestrian on crossing',
    draw: ({ p }) => G('translate(8 0) scale(0.78)', person(p)) + P('M6 52h52M6 58h52', S(p.ink, 3)) + R(8, 48, 6, 12, F(p.ink)) + R(22, 48, 6, 12, F(p.ink)) + R(36, 48, 6, 12, F(p.ink)) + R(50, 48, 6, 12, F(p.ink)),
  },
  children: {
    label: 'Children',
    draw: ({ p }) => G('translate(-8 0) scale(1)', child(p)) + G('translate(14 -12) scale(1.2)', person(p, undefined, 4.6)),
  },
  cow: {
    label: 'Cattle',
    variants: ['cow', 'buffalo'],
    draw: ({ p, variant }) => cow(p, undefined, variant === 'buffalo'),
  },
  train: {
    label: 'Railway locomotive',
    draw: ({ p }) =>
      P('M6 22h28v-8h10v8h6l8 10v12H6z', F(p.ink)) + R(12, 10, 6, 12, F(p.ink)) + R(37, 17, 5, 6, F(p.field)) +
      C(14, 47, 5, `fill="${p.ink}" stroke="${p.field}" stroke-width="2.5"`) + C(28, 47, 5, `fill="${p.ink}" stroke="${p.field}" stroke-width="2.5"`) + C(46, 47, 5, `fill="${p.ink}" stroke="${p.field}" stroke-width="2.5"`) +
      P('M4 56h56', S(p.ink, 3)),
  },
  hospital: {
    label: 'Hospital',
    draw: ({ p }) => R(10, 10, 44, 44, F(p.white), 4) + P('M26 16h12v10h10v12H38v10H26V38H16V26h10z', F(p.red)),
  },
  parking: { label: 'Parking', draw: ({ p, font }) => T(32, 34, 46, 'P', p.ink, font, 900) },
  fuel_pump: {
    label: 'Fuel pump',
    draw: ({ p }) => R(14, 8, 24, 48, F(p.ink), 3) + R(18, 13, 16, 12, F(p.field), 1.5) + R(10, 54, 32, 5, F(p.ink), 1) + P('M38 20h6l6 8v20a3 3 0 0 1-6 0v-8h-6', S(p.ink, 3.5)),
  },
  bus: { label: 'Bus', draw: ({ p }) => busSide(p) },
  direction_board: {
    label: 'Direction board',
    draw: ({ p }) =>
      P('M8 16h28', S(p.ink, 4)) + P('M8 16l7-6v12z', F(p.ink)) + P('M40 16h16', S(p.ink, 3)) +
      P('M8 32h28', S(p.ink, 4)) + P('M42 32h14', S(p.ink, 3)) + P('M58 32l-7-6v12z', F(p.ink)) +
      P('M28 58V44', S(p.ink, 4)) + P('M22 48l6-8 6 8z', F(p.ink)) + P('M38 50h18', S(p.ink, 3)),
  },
};

