/**
 * Export builders: catalogue JSON, asset manifest, reference manifest, documentation
 * and ZIP collections. Asset names and ids are deterministic so downstream consumers
 * (C++/Skia SDK, map styles) can depend on them.
 */
import type { CatalogueEntry, FamilyDefaults, ReferenceDoc, Severity } from '../catalogue/schema';
import { SEVERITY_LEVELS } from '../catalogue/schema';
import { kebab } from '../catalogue/build';
import { composeIcon, pictogramSvg, resolveFrame } from '../icons/compose';
import { tokens, type Theme } from '../tokens';
import { PNG_BASE_PX, svgToPng } from './download';

export const SPEC = 'RVHL';
export const SPEC_VERSION = '1.0.0';
const ROOT = `rvhl-${SPEC_VERSION}`;

export interface CatalogueContext {
  entries: CatalogueEntry[];
  families: FamilyDefaults[];
  references: ReferenceDoc[];
  referencePolicy: string;
}

/** FNV-1a hash — stable content fingerprint for manifests. */
export function fnv1a(s: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193); }
  return (h >>> 0).toString(16).padStart(8, '0');
}

export const iconFileName = (e: CatalogueEntry, rep: 'standard' | 'roados', theme: Theme, sev: Severity) =>
  `${e.id.toLowerCase()}-${kebab(e.slug)}__${rep}-${theme}-${sev.toLowerCase()}`;

export function catalogueJson(ctx: CatalogueContext): string {
  return JSON.stringify({
    spec: SPEC, version: SPEC_VERSION, generatedAt: new Date().toISOString(),
    disclaimer: 'RVHL is a RoadOS specification. It is not ISO-certified or officially approved. Severity levels and advisory speeds are RoadOS proposals.',
    families: ctx.families, entries: ctx.entries,
    references: { policy: ctx.referencePolicy, documents: ctx.references },
  }, null, 2);
}

export const tokensJson = () => JSON.stringify(tokens, null, 2);

export function referenceManifest(ctx: CatalogueContext): string {
  return JSON.stringify({
    spec: SPEC, version: SPEC_VERSION, policy: ctx.referencePolicy,
    documents: ctx.references.map((d) => ({ ...d, linkedEntries: ctx.entries.filter((e) => e.references.some((r) => r.doc === d.id)).length })),
    links: ctx.entries.flatMap((e) => e.references.map((r) => ({
      entry: e.id, name: e.name, standardStatus: e.standardStatus, doc: r.doc, relation: r.relation,
      clause: r.clause ?? 'Reference pending verification', figure: r.figure, page: r.page, verification: r.verification,
      url: ctx.references.find((d) => d.id === r.doc)?.url ?? null,
    }))),
  }, null, 2);
}

export interface IconBundleOptions {
  themes: Theme[];
  representations: ('standard' | 'roados')[];
  severities: 'default' | Severity[];
  png: number[]; // multipliers, e.g. [1,2,3]
  includeMasters: boolean;
}

export const defaultBundle: IconBundleOptions = { themes: ['dark', 'light'], representations: ['standard', 'roados'], severities: 'default', png: [], includeMasters: true };

interface AssetRecord { id: string; entry: string; path: string; format: 'svg' | 'png'; viewBox?: string; px?: number; frame?: string; representation?: string; theme?: string; severity?: string; hash?: string }

export async function buildIconZip(entries: CatalogueEntry[], ctx: CatalogueContext, opt: IconBundleOptions, onProgress?: (done: number, total: number) => void): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const root = zip.folder(ROOT)!;
  const assets: AssetRecord[] = [];
  const jobs: { e: CatalogueEntry; rep: 'standard' | 'roados'; theme: Theme; sev: Severity }[] = [];
  for (const e of entries)
    for (const rep of opt.representations) {
      if (rep === 'standard' && !e.standardFrame) continue;
      const sevs = opt.severities === 'default' ? [e.severity.default] : opt.severities;
      for (const theme of opt.themes) for (const sev of sevs) jobs.push({ e, rep, theme, sev });
    }
  const total = jobs.length + (opt.includeMasters ? entries.length : 0);
  let done = 0;
  if (opt.includeMasters) {
    for (const e of entries) {
      for (const theme of opt.themes) {
        const svg = pictogramSvg(e, theme);
        const path = `symbols/${theme}/${kebab(e.family)}/${e.id.toLowerCase()}-${kebab(e.slug)}.svg`;
        root.file(path, svg);
        assets.push({ id: `${e.id}:pictogram:${theme}`, entry: e.id, path, format: 'svg', viewBox: '0 0 64 64', theme, hash: fnv1a(svg) });
      }
      onProgress?.(++done, total);
    }
  }
  for (const j of jobs) {
    const { svg, frame } = composeIcon({ entry: j.e, representation: j.rep, theme: j.theme, severity: j.sev });
    const base = `icons/${j.theme}/${kebab(j.e.family)}/${iconFileName(j.e, j.rep, j.theme, j.sev)}`;
    root.file(`${base}.svg`, svg);
    const meta = { entry: j.e.id, frame, representation: j.rep, theme: j.theme, severity: j.sev };
    assets.push({ id: `${j.e.id}:${j.rep}:${j.theme}:${j.sev}`, path: `${base}.svg`, format: 'svg', viewBox: '0 0 128 128', hash: fnv1a(svg), ...meta });
    for (const k of opt.png) {
      const png = await svgToPng(svg, PNG_BASE_PX * k);
      root.file(`${base}@${k}x.png`, png);
      assets.push({ id: `${j.e.id}:${j.rep}:${j.theme}:${j.sev}@${k}x`, path: `${base}@${k}x.png`, format: 'png', px: PNG_BASE_PX * k, ...meta });
    }
    onProgress?.(++done, total);
  }
  root.file('manifest.json', svgManifest(assets));
  root.file('catalogue.json', catalogueJson({ ...ctx, entries }));
  root.file('tokens.json', tokensJson());
  root.file('references.json', referenceManifest({ ...ctx, entries }));
  root.file('README.md', documentationMarkdown({ ...ctx, entries }));
  return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
}

function svgManifest(assets: AssetRecord[]): string {
  return JSON.stringify({ spec: SPEC, version: SPEC_VERSION, generatedAt: new Date().toISOString(), naming: '{id}-{slug}__{representation}-{theme}-{severity}.svg', count: assets.length, assets }, null, 2);
}

/** Standalone asset manifest for the full catalogue (no ZIP). */
export function assetManifest(ctx: CatalogueContext): string {
  const assets: AssetRecord[] = [];
  for (const e of ctx.entries) {
    for (const theme of ['dark', 'light'] as Theme[]) {
      assets.push({ id: `${e.id}:pictogram:${theme}`, entry: e.id, path: `symbols/${theme}/${kebab(e.family)}/${e.id.toLowerCase()}-${kebab(e.slug)}.svg`, format: 'svg', viewBox: '0 0 64 64', theme });
      for (const rep of ['standard', 'roados'] as const) {
        if (rep === 'standard' && !e.standardFrame) continue;
        for (const sev of SEVERITY_LEVELS) {
          const { frame } = resolveFrame(e, rep);
          assets.push({ id: `${e.id}:${rep}:${theme}:${sev}`, entry: e.id, path: `icons/${theme}/${kebab(e.family)}/${iconFileName(e, rep, theme, sev)}.svg`, format: 'svg', viewBox: '0 0 128 128', frame, representation: rep, theme, severity: sev });
        }
      }
    }
  }
  return svgManifest(assets);
}

const statusText: Record<string, string> = {
  standardised: 'Explicitly standardised',
  convention_inspired: 'Inspired by convention',
  non_standard_hazard: 'Non-standard hazard (RoadOS)',
  roados_extension: 'RoadOS extension',
};

export function documentationMarkdown(ctx: CatalogueContext): string {
  const L: string[] = [];
  L.push(`# RoadOS Visual Hazard Library — ${SPEC} ${SPEC_VERSION}`, '', '_One visual language for every road._', '');
  L.push('> RVHL is a RoadOS design specification. It is **not** ISO-certified or officially approved. Severity levels (S1–S5) and advisory speeds are RoadOS proposals. Standard references marked “pending verification” have not yet been checked clause-by-clause against the official documents.', '');
  L.push('## Severity levels', '', '| Level | Meaning | Colour |', '|---|---|---|');
  for (const s of SEVERITY_LEVELS) L.push(`| ${s} | ${tokens.severity[s].label} | \`${tokens.severity[s].color}\` |`);
  L.push('', '## Speed information', '', '- **Posted legal speed** — circular regulatory style; only from sign detection, map or authority data.', '- **Advisory speed** — RoadOS rounded-rectangle badge; computed recommendation, never a legal limit.', '- **Current vehicle speed** — instrument-style number.', '- km/h primary; mph optional display unit.', '');
  L.push('## Reference documents', '', '| ID | Identifier | Title | Source | Verification |', '|---|---|---|---|---|');
  for (const d of ctx.references) L.push(`| ${d.id} | ${d.identifier} | ${d.title} | ${d.url} (${d.urlKind.replace('_', ' ')}) | ${d.metadataVerification} |`);
  L.push('', `_Policy:_ ${ctx.referencePolicy}`, '');
  for (const f of ctx.families) {
    const list = ctx.entries.filter((e) => e.family === f.id);
    if (!list.length) continue;
    L.push(`## ${f.letter}. ${f.label}`, '', f.description, '', '| ID | Name | Status | Default severity | Pictogram | Representation |', '|---|---|---|---|---|---|');
    for (const e of list) L.push(`| ${e.id} | ${e.name} | ${statusText[e.standardStatus]} | ${e.severity.default} | \`${e.visual.glyph}${e.visual.glyphVariant ? ':' + e.visual.glyphVariant : ''}\` | ${e.standardFrame ? `standard: ${e.standardFrame}` : 'RoadOS frame'} |`);
    L.push('');
  }
  return L.join('\n');
}
