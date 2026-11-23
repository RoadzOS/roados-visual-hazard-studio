import {
  bicycle, busSide, C, carRear, carSide, carTop, child, cow, dog, F, G, GlyphDef, GlyphPalette, goat, jagged, miniTriangle,
  motorcycle, P, person, quadruped, R, rock, S, T, truckSide,
} from './helpers';

const ground = (p: GlyphPalette, y = 56) => P(`M4 ${y}h56`, S(p.muted, 2.5));
const eyeSlash = (p: GlyphPalette, cx: number, cy: number, s: number) =>
  G(`translate(${cx} ${cy}) scale(${s})`, P('M-12 0c6-8 18-8 24 0-6 8-18 8-24 0z', S(p.ink, 2.5 / s)) + C(0, 0, 3.5, F(p.ink)) + P('M-11 9L11 -9', S(p.red, 3 / s)));

function vehicleSide(p: GlyphPalette, kind: string | null, color?: string) {
  if (kind === 'bus') return busSide(p, color);
  if (kind === 'truck') return truckSide(p, color);
  return carSide(p, color);
}

export const movingStructureGlyphs: Record<string, GlyphDef> = {
  pedestrian: { label: 'Pedestrian', draw: ({ p }) => person(p) },
  child: { label: 'Child', draw: ({ p }) => G('translate(-6 -14) scale(1.2)', child(p)) },
  cyclist: { label: 'Cyclist', draw: ({ p }) => bicycle(p) },
  motorcycle: { label: 'Motorcycle', draw: ({ p }) => motorcycle(p) },
  wrong_way: {
    label: 'Wrong-way vehicle',
    variants: ['car', 'motorcycle'],
    draw: ({ p, variant }) => {
      const flow = P('M12 58V24', S(p.muted, 3)) + P('M7 28l5-8 5 8z', F(p.muted)) + P('M52 58V24', S(p.muted, 3)) + P('M47 28l5-8 5 8z', F(p.muted));
      const veh = variant === 'motorcycle'
        ? G('rotate(180 32 32)', R(29, 10, 6, 44, F(p.red), 3) + R(24, 26, 16, 4, F(p.red), 2))
        : G('rotate(180 32 30)', carTop(p, p.red));
      return flow + veh + P('M32 4v4', S(p.red, 3));
    },
  },
  stopped_vehicle: {
    label: 'Stopped vehicle',
    variants: ['car', 'bus', 'truck'],
    draw: ({ p, variant }) => G('translate(0 4)', vehicleSide(p, variant)) + C(10, 14, 3.5, F(p.amber)) + C(54, 14, 3.5, F(p.amber)) + P('M28 8h3v10h-3zM34 8h3v10h-3z', F(p.ink)),
  },
  slow_vehicle: {
    label: 'Slow-moving vehicle',
    draw: ({ p }) => G('translate(0 8)', truckSide(p)) + P('M36 14a10 10 0 0 1 20 0', S(p.ink, 3)) + P('M46 14l-6-5', S(p.amber, 3)),
  },
  tractor: {
    label: 'Tractor',
    draw: ({ p }) =>
      C(20, 42, 13, `fill="${p.ink}" stroke="${p.field}" stroke-width="2"`) + C(20, 42, 4, F(p.field)) + C(50, 48, 7, `fill="${p.ink}" stroke="${p.field}" stroke-width="2"`) +
      P('M10 28V12h18l4 16h22v12H32', `fill="none" stroke="${p.ink}" stroke-width="4" stroke-linejoin="round"`) + R(30, 28, 24, 10, F(p.ink), 2) + P('M48 28V16', S(p.ink, 3)),
  },
  animal: { label: 'Animal', draw: ({ p }) => quadruped(p) },
  dog: { label: 'Dog', draw: ({ p }) => dog(p) },
  goat: { label: 'Goat', draw: ({ p }) => goat(p) },
  herd: {
    label: 'Animal herd',
    draw: ({ p }) => G('translate(18 -4) scale(0.62)', cow(p, p.muted)) + G('translate(-2 8) scale(0.62)', cow(p)) + G('translate(22 22) scale(0.62)', cow(p)),
  },
  braking: {
    label: 'Sudden braking vehicle',
    variants: ['car', 'bus'],
    draw: ({ p, variant }) =>
      (variant === 'bus'
        ? R(12, 10, 40, 38, F(p.ink), 4) + R(16, 14, 32, 14, F(p.field), 2) + R(15, 36, 8, 6, F(p.red), 1.5) + R(41, 36, 8, 6, F(p.red), 1.5) + R(14, 48, 8, 6, F(p.ink)) + R(42, 48, 8, 6, F(p.ink))
        : carRear(p, undefined, p.red)) +
      P('M4 30h5M4 38h5M55 30h5M55 38h5', S(p.red, 3)),
  },
  car_door: {
    label: 'Opening vehicle door',
    draw: ({ p }) => G('translate(-10 0)', carTop(p)) + P('M31 24l14 8', S(p.amber, 5)) + P('M48 20c6 4 8 10 8 16', S(p.amber, 2.5, ' stroke-dasharray="3 3"')) + P('M52 52V40', S(p.muted, 3)) + P('M48 44l4-6 4 6z', F(p.muted)),
  },
  reversing: {
    label: 'Reversing vehicle',
    draw: ({ p, font }) => G('translate(6 0)', carSide(p)) + P('M14 14H2', S(p.amber, 3.5)) + P('M6 9l-5 5 5 5z', F(p.amber)) + T(22, 14, 11, 'R', p.amber, font, 900),
  },
  breakdown: {
    label: 'Vehicle breakdown',
    draw: ({ p }) => G('translate(-4 -2) scale(0.9)', carSide(p)) + P('M38 18l8-10', S(p.ink, 3)) + miniTriangle(52, 46, 0.9, p.red, p.field) + ground(p, 58),
  },
  collision: {
    label: 'Collision',
    draw: ({ p }) =>
      G('rotate(-35 22 34) translate(-10 0)', carTop(p)) + G('rotate(40 44 30) translate(12 0)', carTop(p)) +
      P('M32 10l3 7 7-3-3 7 7 3-7 3 3 7-7-3-3 7-3-7-7 3 3-7-7-3 7-3-3-7 7 3z', F(p.amber)),
  },
  ambulance: {
    label: 'Emergency vehicle',
    draw: ({ p }) =>
      P('M4 18h36v8h8l10 10v8H4z', F(p.white)) + P('M4 18h36v8h8l10 10v8H4z', `fill="none" stroke="${p.ink}" stroke-width="2.5"`) +
      P('M18 22h6v5h5v6h-5v5h-6v-5h-5v-6h5z', F(p.red)) + R(16, 12, 10, 6, F(p.blue), 2) + P('M14 6l3 4M28 6l-3 4', S(p.blue, 2.5)) +
      C(14, 46, 5.5, `fill="${p.ink}" stroke="${p.field}" stroke-width="2.5"`) + C(46, 46, 5.5, `fill="${p.ink}" stroke="${p.field}" stroke-width="2.5"`),
  },
  queue: {
    label: 'Traffic queue',
    draw: ({ p }) => G('translate(18 0) scale(0.45)', carRear(p, p.muted, p.red)) + G('translate(13 12) scale(0.6)', carRear(p, p.muted, p.red)) + G('translate(7 24) scale(0.8)', carRear(p, undefined, p.red)),
  },

  // ---- Visibility & roadside ----
  hidden_sign: {
    label: 'Hidden sign',
    draw: ({ p }) => P('M22 8L42 42H2z', `fill="${p.white}" stroke="${p.red}" stroke-width="4" stroke-linejoin="round"`) + P('M22 42v16', S(p.ink, 3.5)) + C(36, 26, 12, F(p.green)) + C(46, 36, 11, F(p.green)) + C(34, 42, 9, F(p.green)),
  },
  missing_sign: {
    label: 'Missing warning sign',
    draw: ({ p, font }) => P('M32 6L58 50H6z', `fill="none" stroke="${p.ink}" stroke-width="3.5" stroke-dasharray="5 4" stroke-linejoin="round"`) + T(32, 35, 20, '?', p.ink, font, 900) + P('M32 50v10', S(p.ink, 3.5, ' stroke-dasharray="3 3"')),
  },
  missing_reflectors: {
    label: 'Missing reflectors',
    draw: ({ p }) => P('M7 4v56M57 4v56', S(p.muted, 2)) + R(30, 6, 4, 10, F(p.ink)) + R(30, 27, 4, 10, F(p.ink)) + R(30, 48, 4, 10, F(p.ink)) + R(28.5, 19, 7, 5, F(p.amber), 1.5) + R(28.5, 40, 7, 5, `fill="none" stroke="${p.ink}" stroke-width="1.8" stroke-dasharray="2 2"`, 1.5) + P('M40 34l12 12M52 34L40 46', S(p.red, 3)),
  },
  damaged_sign: {
    label: 'Damaged signboard',
    draw: ({ p }) => G('rotate(16 32 30)', P('M32 6L52 40H12z', `fill="${p.white}" stroke="${p.red}" stroke-width="4" stroke-linejoin="round"`) + P('M24 30l6-6 4 6 6-4', S(p.muted, 2))) + P('M32 40c0 6-4 10-4 18', S(p.ink, 3.5)) + P('M22 58h16', S(p.ink, 3)),
  },
  vegetation: {
    label: 'Vegetation obstruction',
    draw: ({ p }) => P('M40 4v56', S(p.muted, 2.5)) + R(4, 4, 36, 56, `fill="${p.ink}" opacity="0.18"`) + C(44, 20, 12, F(p.green)) + C(36, 34, 10, F(p.green)) + C(48, 44, 12, F(p.green)) + C(56, 30, 8, F(p.green)),
  },
  blind_junction: {
    label: 'Blind junction',
    draw: ({ p }) => P('M32 60V30M6 30h52', S(p.ink, 7, ' stroke-linecap="butt"')) + R(38, 36, 20, 22, F(p.muted), 2) + eyeSlash(p, 18, 14, 0.9),
  },
  restricted_sight: {
    label: 'Restricted sight distance',
    draw: ({ p }) => G('translate(32 30) scale(1.9)', P('M-12 0c6-8 18-8 24 0-6 8-18 8-24 0z', S(p.ink, 1.6)) + C(0, 0, 3.5, F(p.ink))) + P('M10 52L54 8', S(p.red, 5)),
  },
  low_clearance: {
    label: 'Low overhead clearance',
    variants: ['overhead', 'bridge'],
    draw: ({ p, variant }) => {
      const top = variant === 'bridge'
        ? R(4, 8, 56, 10, F(p.ink)) + R(4, 18, 6, 40, F(p.ink)) + R(54, 18, 6, 40, F(p.ink))
        : P('M4 14c14 6 42 6 56 0M4 20c14 6 42 6 56 0', S(p.ink, 2.5)) + C(10, 12, 2, F(p.ink)) + C(54, 12, 2, F(p.ink));
      return top + P('M32 28v22', S(p.amber, 3.5)) + P('M26 31l6-7 6 7zM26 47l6 7 6-7z', F(p.amber)) + ground(p, 58);
    },
  },
  encroachment: {
    label: 'Roadside encroachment',
    draw: ({ p }) => P('M24 4v56', S(p.white, 2.5, ' stroke-dasharray="6 5"')) + P('M30 22l6-10h20l4 10z', F(p.red)) + R(32, 22, 26, 20, `fill="none" stroke="${p.ink}" stroke-width="3"`) + R(30, 42, 30, 6, F(p.ink)) + P('M34 48v8M56 48v8', S(p.ink, 3)) + P('M10 16v28', S(p.ink, 3)) + P('M5 40l5 6 5-6z', F(p.ink)),
  },
  embankment: {
    label: 'Unprotected embankment',
    draw: ({ p }) => P('M4 22h30l26 36H4z', F(p.ink)) + P('M8 18h24', S(p.ink, 2)) + P('M10 14v-6M20 14v-6M30 14v-6', S(p.red, 2.5, ' stroke-dasharray="2 3"')) + P('M40 34l8 10M46 30l8 12', S(p.muted, 2)) + C(44, 20, 6, S(p.amber, 2.5)),
  },
  rail_track: {
    label: 'Level-crossing track',
    variants: ['normal', 'damaged'],
    draw: ({ p, variant }) => {
      let sl = '';
      for (let x = 8; x <= 56; x += 8) sl += R(x - 2, 16, 4, 32, F(p.muted));
      const dmg = variant === 'damaged' ? P(jagged(30, 32, 9, 5, 10, 0.25), `fill="#000000" stroke="${p.red}" stroke-width="2.5"`) + P('M40 30l6 4-4 4', S(p.red, 2)) : '';
      return sl + P('M4 22h56M4 42h56', S(p.ink, 4.5)) + dmg;
    },
  },
  landslide: {
    label: 'Landslide',
    draw: ({ p }) => P('M4 8c10 0 16 10 22 18s16 14 34 18v14H4z', F(p.brown)) + rock(p, 34, 40, 0.7) + rock(p, 48, 46, 0.55) + rock(p, 20, 30, 0.6) + P('M4 58h56', S(p.ink, 3)) + P('M44 20l6 6M52 16l4 8', S(p.ink, 2.5)),
  },
  road_collapse: {
    label: 'Road collapse',
    draw: ({ p }) => P('M4 22h22l-4 8 6 4-4 6v4H4z', F(p.ink)) + P('M60 22H40l4 6-6 6 4 6v4h18z', F(p.ink)) + G('rotate(25 32 46)', R(24, 40, 14, 8, F(p.ink))) + P('M4 50h56', S(p.muted, 2, ' stroke-dasharray="3 3"')) + P('M30 14v8', S(p.red, 3)) + P('M26 18l4 6 4-6z', F(p.red)),
  },
  retaining_wall: {
    label: 'Retaining wall damage',
    draw: ({ p }) => {
      let bricks = '';
      for (let row = 0; row < 5; row++) for (let col = 0; col < 3; col++) bricks += R(10 + col * 15 + (row % 2) * 7 - (row % 2 && col === 2 ? 7 : 0), 8 + row * 10, 13, 8, F(p.ink), 1);
      return bricks + P('M30 8l-4 12 6 6-4 10 4 8-2 10', S(p.red, 2.5)) + P('M54 8c4 12 4 34 0 50', S(p.amber, 2.5, ' stroke-dasharray="3 3"')) + ground(p, 60);
    },
  },

  // ---- Vehicle context ----
  speedometer: {
    label: 'Speedometer',
    draw: ({ p }) => {
      let ticks = '';
      for (let a = -120; a <= 120; a += 30) ticks += G(`rotate(${a} 32 36)`, P('M32 10v5', S(p.ink, 2.5)));
      return P('M12.5 47.3A23 23 0 1 1 51.5 47.3', S(p.ink, 3)) + ticks + P('M32 36l12-12', S(p.amber, 4)) + C(32, 36, 4, F(p.ink));
    },
  },
  vehicle_dimensions: {
    label: 'Vehicle dimensions',
    draw: ({ p }) => G('translate(6 6) scale(0.8)', carSide(p)) + P('M8 50h46M58 22v24', S(p.amber, 2.5)) + P('M8 50l4-3v6zM54 50l-4-3v6zM58 22l-3 4h6zM58 46l-3-4h6z', F(p.amber)),
  },
  ground_clearance: {
    label: 'Ground clearance',
    draw: ({ p }) => G('translate(0 -6)', carSide(p)) + P('M32 38v14', S(p.amber, 2.5)) + P('M29 41l3-4 3 4zM29 49l3 4 3-4z', F(p.amber)) + P('M4 54h56', S(p.ink, 3)),
  },
  vehicle_type: {
    label: 'Vehicle type',
    variants: ['two_wheeler', 'car', 'bus', 'truck'],
    draw: ({ p, variant }) => (variant === 'two_wheeler' ? motorcycle(p) : vehicleSide(p, variant)),
  },
  trailer: {
    label: 'Trailer / heavy load',
    draw: ({ p }) => G('translate(26 8) scale(0.6)', P('M39 21h10l7 9v10H39z', F(p.ink)) + R(28, 36, 12, 4, F(p.ink))) + R(4, 18, 40, 18, F(p.ink), 2) + C(14, 40, 4.5, `fill="${p.ink}" stroke="${p.field}" stroke-width="2"`) + C(26, 40, 4.5, `fill="${p.ink}" stroke="${p.field}" stroke-width="2"`) + C(52, 40, 4.5, `fill="${p.ink}" stroke="${p.field}" stroke-width="2"`) + P('M44 30h6', S(p.ink, 2.5)),
  },
  approach_direction: {
    label: 'Approach direction',
    draw: ({ p, font }) => C(32, 32, 24, S(p.muted, 2.5)) + T(32, 12, 8, 'N', p.muted, font, 800) + P('M32 50V22', S(p.ink, 5)) + P('M24 28l8-12 8 12z', F(p.ink)) + C(32, 50, 4, F(p.amber)),
  },
  brake: {
    label: 'Brake system',
    draw: ({ p }) => {
      let holes = '';
      for (let a = 0; a < 360; a += 45) holes += G(`rotate(${a} 30 34)`, C(30, 20, 1.8, F(p.field)));
      return C(30, 34, 20, F(p.ink)) + holes + C(30, 34, 7, F(p.field)) + P('M44 14c8 4 12 12 12 20s-4 16-12 20', S(p.amber, 6));
    },
  },
  sensors: {
    label: 'Vehicle sensors',
    draw: ({ p }) => G('translate(0 6)', carTop(p)) + P('M22 12a14 14 0 0 1 20 0M18 7a20 20 0 0 1 28 0', S(p.amber, 2.5)) + C(32, 17, 2.5, F(p.amber)),
  },

};
