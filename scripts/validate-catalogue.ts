/* Validate the RVHL catalogue from the command line: npm run validate */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { buildCatalogue, type RawFamilyFile } from '../src/catalogue/build';
import { hasGlyph } from '../src/icons/glyphs';
import { composeIcon } from '../src/icons/compose';

const dir = join(import.meta.dirname, '../src/catalogue/data');
const read = (f: string) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
const files: RawFamilyFile[] = readdirSync(dir).filter((f) => /^[a-n]-.*\.json$/.test(f)).sort().map(read);
const cat = buildCatalogue(read('families.json'), files, read('references.json'), hasGlyph);

let composed = 0;
/** Strict-XML sanity check: no duplicate attributes inside a tag, balanced quotes. */
function checkSvg(id: string, svg: string) {
  for (const tag of svg.match(/<[a-zA-Z][^>]*>/g) ?? []) {
    const names = [...tag.matchAll(/\s([a-zA-Z:-]+)="/g)].map((m) => m[1]);
    const dup = names.find((n, i) => names.indexOf(n) !== i);
    if (dup) cat.issues.push({ level: 'error', id, message: `Duplicate attribute "${dup}" in ${tag.slice(0, 60)}…` });
    if ((tag.match(/"/g) ?? []).length % 2) cat.issues.push({ level: 'error', id, message: `Unbalanced quotes in ${tag.slice(0, 60)}…` });
  }
}
for (const e of cat.entries) {
  const variants = e.variants.length ? e.variants : [null];
  for (const theme of ['dark', 'light'] as const)
    for (const rep of ['standard', 'roados'] as const)
      for (const v of variants)
        for (const sev of ['S1', 'S5'] as const)
          checkSvg(e.id, composeIcon({ entry: e, theme, representation: rep, variant: v, severity: sev, distanceM: 200, count: 2, sizeVariant: 'L', direction: 'left', speed: { kind: 'advisory', valueKmh: 20, unit: 'kmh' } }).svg);
  composed++;
}
const byFam = Object.fromEntries(cat.families.map((f) => [f.label, cat.entries.filter((e) => e.family === f.id).length]));
console.table(byFam);
console.log(`entries: ${cat.entries.length}  families: ${cat.families.length}  references: ${cat.references.length}  composed: ${composed}`);
for (const i of cat.issues) console.log(`${i.level.toUpperCase()} ${i.id}: ${i.message}`);
const errors = cat.issues.filter((i) => i.level === 'error').length;
if (errors) { console.error(`${errors} error(s)`); process.exit(1); }
console.log('Catalogue valid.');
