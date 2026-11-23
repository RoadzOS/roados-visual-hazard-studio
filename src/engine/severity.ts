/**
 * RoadOS dynamic severity model (RVHL 1.0 proposal — not an official classification).
 * Severity describes potential consequence; detection confidence is kept separate and
 * only gates whether a hazard is displayed or alerted.
 */
import { SEVERITY_LEVELS, type CatalogueEntry, type Severity, type SeverityFactor } from '../catalogue/schema';

export interface SeverityContext {
  physicalSize: 'small' | 'medium' | 'large';
  heightOrDepth: 'low' | 'moderate' | 'high';
  lanePosition: 'in_path' | 'adjacent_lane' | 'shoulder' | 'off_road';
  approachSpeedKmh: number;
  distanceM: number;
  visibility: 'good' | 'reduced' | 'poor';
  surface: 'dry' | 'wet' | 'flooded' | 'loose';
  trafficDensity: 'free' | 'moderate' | 'heavy';
  vehicleType: 'two_wheeler' | 'car' | 'bus' | 'truck';
  /** Detection confidence 0–1. Does NOT change severity. */
  confidence: number;
}

export const defaultContext: SeverityContext = {
  physicalSize: 'medium', heightOrDepth: 'moderate', lanePosition: 'in_path', approachSpeedKmh: 50, distanceM: 200,
  visibility: 'good', surface: 'dry', trafficDensity: 'moderate', vehicleType: 'car', confidence: 0.85,
};

export interface SeverityResult {
  level: Severity;
  base: Severity;
  delta: number;
  reasons: { factor: SeverityFactor; effect: number; text: string }[];
  display: boolean;
  alert: boolean;
}

/** Simple stopping distance (reaction 1.5 s + braking at 0.7 g on dry, less on wet). */
export function stoppingDistanceM(speedKmh: number, surface: SeverityContext['surface'] = 'dry'): number {
  const v = speedKmh / 3.6;
  const mu = surface === 'dry' ? 0.7 : surface === 'wet' ? 0.45 : surface === 'loose' ? 0.35 : 0.25;
  return v * 1.5 + (v * v) / (2 * mu * 9.81);
}

export function computeSeverity(entry: Pick<CatalogueEntry, 'severity' | 'confidence'>, c: SeverityContext): SeverityResult {
  const base = entry.severity.default;
  const f = new Set(entry.severity.factors);
  const reasons: SeverityResult['reasons'] = [];
  const add = (factor: SeverityFactor, effect: number, text: string) => { if (f.has(factor) && effect !== 0) reasons.push({ factor, effect, text }); };

  if (entry.severity.dynamic) {
    add('physical_size', c.physicalSize === 'large' ? 1 : c.physicalSize === 'small' ? -1 : 0, `Physical size: ${c.physicalSize}`);
    add('height_or_depth', c.heightOrDepth === 'high' ? 1 : c.heightOrDepth === 'low' ? -1 : 0, `Height/depth: ${c.heightOrDepth}`);
    add('lane_position', c.lanePosition === 'in_path' ? 0 : c.lanePosition === 'adjacent_lane' ? -1 : -2, `Lane position: ${c.lanePosition.replace('_', ' ')}`);
    add('approach_speed', c.approachSpeedKmh >= 90 ? 2 : c.approachSpeedKmh >= 60 ? 1 : c.approachSpeedKmh <= 25 ? -1 : 0, `Approach speed ${c.approachSpeedKmh} km/h`);
    const sd = stoppingDistanceM(c.approachSpeedKmh, c.surface);
    add('distance', c.distanceM < sd ? 1 : 0, `Distance ${c.distanceM} m vs stopping distance ≈ ${Math.round(sd)} m`);
    add('visibility', c.visibility === 'poor' ? 1 : 0, `Visibility: ${c.visibility}`);
    add('surface_condition', c.surface === 'dry' ? 0 : 1, `Surface: ${c.surface}`);
    add('traffic_density', c.trafficDensity === 'heavy' ? 1 : 0, `Traffic: ${c.trafficDensity}`);
    add('vehicle_type', c.vehicleType === 'two_wheeler' ? 1 : 0, `Vehicle: ${c.vehicleType.replace('_', '-')}`);
  }
  const delta = Math.max(-2, Math.min(2, reasons.reduce((s, r) => s + r.effect, 0)));
  const idx = Math.max(0, Math.min(4, SEVERITY_LEVELS.indexOf(base) + delta));
  return {
    level: SEVERITY_LEVELS[idx], base, delta, reasons,
    display: c.confidence >= entry.confidence.minimumToDisplay,
    alert: c.confidence >= entry.confidence.minimumToAlert,
  };
}

/**
 * RoadOS advisory speed proposal. Returns null when no advisory applies.
 * NEVER a legal limit: it is capped by the posted limit when one is known.
 */
export const ADVISORY_BY_SEVERITY: Record<Severity, number | null> = { S1: null, S2: 40, S3: 30, S4: 20, S5: 10 };

export function computeAdvisory(entry: Pick<CatalogueEntry, 'speed'>, level: Severity, postedKmh: number | null, confidence: number): { valueKmh: number; confidence: number } | null {
  if (entry.speed.advisory === 'never') return null;
  const v = ADVISORY_BY_SEVERITY[level];
  if (v == null) return null;
  const capped = postedKmh != null ? Math.min(v, postedKmh) : v;
  if (postedKmh != null && capped >= postedKmh) return null;
  return { valueKmh: capped, confidence: Math.round(confidence * 0.9 * 100) / 100 };
}
