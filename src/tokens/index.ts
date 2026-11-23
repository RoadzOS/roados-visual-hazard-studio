import raw from './tokens.json';
import type { Severity } from '../catalogue/schema';

export const tokens = raw;
export type Theme = 'dark' | 'light';

export const severityColor = (s: Severity) => tokens.severity[s].color;
export const severityOnColor = (s: Severity) => tokens.severity[s].onColor;
export const severityLabel = (s: Severity) => tokens.severity[s].label;
