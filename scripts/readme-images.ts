/* Generate the SVG illustrations used by README.md: npm run readme-images */
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildCatalogue, type RawFamilyFile } from '../src/catalogue/build';
import { hasGlyph } from '../src/icons/glyphs';
import { composeIcon, type ComposeOptions } from '../src/icons/compose';
import { SEVERITY_LEVELS } from '../src/catalogue/schema';
import tokens from '../src/tokens/tokens.json';

const out = join(import.meta.dirname, '../docs/images');
mkdirSync(out, { recursive: true });
const dir = join(import.meta.dirname, '../src/catalogue/data');
const read = (f: string) => JSON.parse(readFileSync(join(dir, f), 'utf8'));
const files: RawFamilyFile[] = readdirSync(dir).filter((f) => /^[a-n]-.*\.json$/.test(f)).sort().map(read);
const cat = buildCatalogue(read('families.json'), files, read('references.json'), hasGlyph);
const byId = new Map(cat.entries.map((e) => [e.id, e]));
const get = (id: string) => { const e = byId.get(id); if (!e) throw new Error(`missing ${id}`); return e; };
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const BG = '#0B1118', TXT = '#E6EDF3', DIM = '#9FB0C0';
const FONT = 'font-family="Arial, Helvetica, sans-serif"';

/** Place a composed 128×128 icon at (x,y) scaled to `size`. */
const place = (o: Omit<ComposeOptions, 'theme'> & { theme?: 'dark' | 'light' }, x: number, y: number, size = 128) =>
  composeIcon(o).svg.replace(/^<svg([^>]*)>/, (_m, a: string) => `<svg x="${x}" y="${y}" width="${size}" height="${size}"${a.replace(/\s(width|height)="[^"]*"/g, '')}>`);
const doc = (w: number, h: number, body: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" rx="16" fill="${BG}"/>${body}</svg>\n`;
const label = (x: number, y: number, s: string, size = 12, fill = DIM, weight = 'normal') =>
  `<text x="${x}" y="${y}" font-size="${size}" fill="${fill}" font-weight="${weight}" text-anchor="middle" ${FONT}>${esc(s)}</text>`;

// 1. Showcase: one element from every family.
const SHOW = ['SIG-002', 'RSG-009', 'MRK-001', 'INF-001', 'GEO-004', 'RDM-003', 'SPD-005', 'TMP-002', 'DEB-004', 'ENV-002', 'MOV-013', 'VIS-001', 'BRG-001', 'VEH-001'];
{
  const cols = 7, cw = 150, ch = 170, pad = 20;
  let body = '';
  SHOW.forEach((id, i) => {
    const e = get(id), x = pad + (i % cols) * cw, y = pad + Math.floor(i / cols) * ch;
    body += place({ entry: e }, x + 11, y, 128);
    body += label(x + 75, y + 142, e.id, 11, DIM, 'bold');
    body += label(x + 75, y + 157, e.name.length > 24 ? e.name.slice(0, 23) + '…' : e.name, 11, TXT);
  });
  writeFileSync(join(out, 'icon-showcase.svg'), doc(pad * 2 + cols * cw, pad * 2 + 2 * ch - 10, body));
}

// 2. Severity scale S1–S5 on one hazard.
{
  const e = get('RDM-003'), cw = 150, pad = 20;
  let body = '';
  SEVERITY_LEVELS.forEach((s, i) => {
    const x = pad + i * cw, t = tokens.severity[s];
    body += place({ entry: e, severity: s }, x + 11, pad, 128);
    body += label(x + 75, pad + 146, s, 14, t.color, 'bold');
    body += label(x + 75, pad + 163, t.label, 11, TXT);
  });
  writeFileSync(join(out, 'severity-scale.svg'), doc(pad * 2 + 5 * cw, pad * 2 + 172, body));
}

// 3. Composition: the same pictogram with layers added step by step.
{
  const e = get('RDM-003');
  const steps: { o: Omit<ComposeOptions, 'entry'>; t: string }[] = [
    { o: { severity: 'S1', showSeverityCode: false }, t: 'Pictogram + frame' },
    { o: { severity: 'S4' }, t: '+ severity' },
    { o: { severity: 'S4', count: 3 }, t: '+ count' },
    { o: { severity: 'S4', count: 3, speed: { kind: 'advisory', valueKmh: 20, unit: 'kmh' } }, t: '+ advisory speed' },
    { o: { severity: 'S4', count: 3, speed: { kind: 'advisory', valueKmh: 20, unit: 'kmh' }, distanceM: 250 }, t: '+ distance' },
  ];
  const cw = 150, pad = 20;
  let body = '';
  steps.forEach(({ o, t }, i) => {
    const x = pad + i * cw;
    body += place({ entry: e, ...o }, x + 11, pad, 128);
    body += label(x + 75, pad + 150, t, 12, TXT);
  });
  writeFileSync(join(out, 'composition.svg'), doc(pad * 2 + 5 * cw, pad * 2 + 160, body));
}

// 4. Speed system: posted vs advisory vs unknown.
{
  const e = get('GEO-004'), pad = 20, cw = 170;
  const items: { o: Omit<ComposeOptions, 'entry'>; t: string; s: string }[] = [
    { o: { speed: { kind: 'posted', valueKmh: 50, unit: 'kmh' } }, t: 'Posted limit', s: 'legal, from signs/map' },
    { o: { speed: { kind: 'advisory', valueKmh: 30, unit: 'kmh' } }, t: 'Advisory speed', s: 'RoadOS suggestion' },
    { o: { speed: { kind: 'unknown', valueKmh: null, unit: 'kmh' } }, t: 'Unknown limit', s: 'never guessed' },
  ];
  let body = '';
  items.forEach(({ o, t, s }, i) => {
    const x = pad + i * cw;
    body += place({ entry: e, ...o }, x + 21, pad, 128);
    body += label(x + 85, pad + 148, t, 13, TXT, 'bold');
    body += label(x + 85, pad + 165, s, 11, DIM);
  });
  writeFileSync(join(out, 'speed-system.svg'), doc(pad * 2 + 3 * cw, pad * 2 + 172, body));
}

// 5. Light theme row.
{
  const ids = ['RSG-009', 'TMP-002', 'MOV-013', 'ENV-002', 'DEB-004', 'GEO-004'], pad = 20, cw = 140;
  let body = '';
  ids.forEach((id, i) => { body += place({ entry: get(id), theme: 'light' }, pad + i * cw + 6, pad, 128); });
  const w = pad * 2 + ids.length * cw;
  writeFileSync(join(out, 'light-theme.svg'), `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${pad * 2 + 128}" viewBox="0 0 ${w} ${pad * 2 + 128}"><rect width="100%" height="100%" rx="16" fill="#EEF1F4"/>${body}</svg>\n`);
}

console.log('README images written to', out);
