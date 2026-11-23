/** Simulated route geometry (no map provider required). */
export type Pt = [number, number];

export interface Route {
  points: Pt[];
  cum: number[];
  lengthPx: number;
  metersPerPx: number;
}

export function makeRoute(points: Pt[], metersPerPx: number): Route {
  const cum = [0];
  for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]));
  return { points, cum, lengthPx: cum[cum.length - 1], metersPerPx };
}

export const routeLengthM = (r: Route) => r.lengthPx * r.metersPerPx;

/** Point, heading (radians) and unit normal at a distance in metres along the route. */
export function pointAt(r: Route, meters: number): { x: number; y: number; angle: number; nx: number; ny: number } {
  const d = Math.max(0, Math.min(r.lengthPx, meters / r.metersPerPx));
  let i = 1;
  while (i < r.cum.length - 1 && r.cum[i] < d) i++;
  const [x0, y0] = r.points[i - 1], [x1, y1] = r.points[i];
  const seg = r.cum[i] - r.cum[i - 1] || 1;
  const t = (d - r.cum[i - 1]) / seg;
  const angle = Math.atan2(y1 - y0, x1 - x0);
  return { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, angle, nx: -Math.sin(angle), ny: Math.cos(angle) };
}

/** Polyline path of the route between two distances (metres). */
export function subPath(r: Route, fromM: number, toM: number, step = 10): string {
  const pts: string[] = [];
  for (let m = fromM; m < toM; m += step) { const p = pointAt(r, m); pts.push(`${p.x.toFixed(1)} ${p.y.toFixed(1)}`); }
  const e = pointAt(r, toM); pts.push(`${e.x.toFixed(1)} ${e.y.toFixed(1)}`);
  return `M${pts.join('L')}`;
}
