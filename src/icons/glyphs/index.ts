import type { GlyphDef } from './helpers';
import { signalSignGlyphs } from './signals-signs';
import { markingInfraGlyphs } from './markings-infra';
import { geometryDamageGlyphs } from './geometry-damage';
import { obstacleEnvGlyphs } from './obstacles-env';
import { movingStructureGlyphs } from './moving-structures';

export type { GlyphDef, GlyphPalette, GlyphCtx } from './helpers';

/** The complete RVHL pictogram registry (id → drawing function). */
export const GLYPHS: Record<string, GlyphDef> = {
  ...signalSignGlyphs,
  ...markingInfraGlyphs,
  ...geometryDamageGlyphs,
  ...obstacleEnvGlyphs,
  ...movingStructureGlyphs,
};

export function hasGlyph(id: string): boolean {
  return Object.prototype.hasOwnProperty.call(GLYPHS, id);
}
