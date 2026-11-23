/* Render every catalogue entry into contact-sheet SVGs for visual QA: npm run contact-sheet -- <outdir> */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildCatalogue, type RawFamilyFile } from '../src/catalogue/build';
import { hasGlyph } from '../src/icons/glyphs';
import { composeIcon } from '../src/icons/compose';

const out = process.argv[2] ?? 'contact-sheet';
mkdirSync(out, { recursive: true });
const dir = join(import.meta.dirname, '../src/catalogue/data');
const read = (f: string) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
const files: RawFamilyFile[] = readdirSync(dir).filter((f) => /^[a-n]-.*\.json$/.test(f)).sort().map(read);
const cat = buildCatalogue(read('families.json'), files, read('references.json'), hasGlyph);
const rep = (process.argv[3] ?? 'auto') as 'auto' | 'roados' | 'standard';
const theme = (process.argv[4] ?? 'dark') as 'dark' | 'light';
const cols = 10, cell = 132, per = 70;
for (let page = 0; page * per < cat.entries.length; page++) {
  const list = cat.entries.slice(page * per, page * per + per);
  const rows = Math.ceil(list.length / cols);
  let body = '';
  list.forEach((e, i) => {
    const x = (i % cols) * cell, y = Math.floor(i / cols) * (cell + 16);
    const svg = composeIcon({ entry: e, representation: rep, theme }).svg.replace('<svg ', `<svg x="${x + 2}" y="${y + 2}" `);
    body += svg + `<text x="${x + 66}" y="${y + cell + 8}" font-size="9" fill="#9fb0c0" text-anchor="middle" font-family="Arial">${e.id} ${e.name.slice(0, 22).replace(/&/g, '&amp;')}</text>`;
  });
  const W = cols * cell, H = rows * (cell + 16);
  writeFileSync(join(out, `sheet-${rep}-${theme}-${page + 1}.svg`), `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="${theme === 'dark' ? '#0B1118' : '#EEF1F4'}"/>${body}</svg>`);
}
console.log('written to', out);
