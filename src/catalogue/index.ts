/**
 * File-based catalogue source. Swap this module for an API-backed loader later —
 * the rest of the app only depends on BuiltCatalogue.
 */
import families from './data/families.json';
import references from './data/references.json';
import { buildCatalogue, type RawFamilyFile } from './build';
import { hasGlyph } from '../icons/glyphs';

const modules = import.meta.glob<RawFamilyFile>('./data/[a-n]-*.json', { eager: true, import: 'default' });
const files = Object.keys(modules).sort().map((k) => modules[k]);

export const baseCatalogue = buildCatalogue(families, files, references, hasGlyph);
export * from './schema';
export { buildCatalogue, slugify, kebab, RVHL_VERSION } from './build';
