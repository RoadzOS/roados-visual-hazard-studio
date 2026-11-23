/**
 * Pure catalogue builder: raw JSON → validated, normalised RVHL entries.
 * No UI or bundler dependencies, so it can run in Node, a future API, or tests.
 */
import {
  CatalogueEntrySchema, FamilyDefaultsSchema, RawEntrySchema, ReferenceDocSchema,
  type CatalogueEntry, type FamilyDefaults, type Frame, type RawEntry, type ReferenceDoc, type ReferenceLink,
} from './schema';

export const RVHL_VERSION = '1.0.0';

export interface RawFamilyFile { family: string; entries: unknown[] }

export interface ValidationIssue { level: 'error' | 'warning'; id: string; message: string }

export interface BuiltCatalogue {
  version: string;
  families: FamilyDefaults[];
  entries: CatalogueEntry[];
  references: ReferenceDoc[];
  referencePolicy: string;
  issues: ValidationIssue[];
}

const CONVENTION: Frame[] = ['warning_triangle', 'prohibitory_circle', 'mandatory_circle', 'stop_octagon', 'give_way_triangle', 'info_rect', 'direction_board'];

export const slugify = (s: string) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
export const kebab = (s: string) => s.replace(/_/g, '-');

function mergeRefs(base: ReferenceLink[], extra: ReferenceLink[] | undefined, standardised: boolean): ReferenceLink[] {
  const map = new Map<string, ReferenceLink>();
  for (const r of base) map.set(r.doc, { ...r });
  for (const r of extra ?? []) map.set(r.doc, { ...map.get(r.doc), ...r });
  return [...map.values()].map((r) => {
    // Never let a non-standardised element inherit an "explicitly standardised" claim from its family.
    if (!standardised && r.relation === 'explicitly_standardised') return { ...r, relation: 'inspired_by_convention' as const };
    return {
      ...r,
      clause: r.verification === 'verified' ? r.clause ?? null : null,
      figure: r.verification === 'verified' ? r.figure ?? null : null,
      page: r.verification === 'verified' ? r.page ?? null : null,
    };
  });
}

export function normaliseEntry(raw: RawEntry, fam: FamilyDefaults): CatalogueEntry {
  const slug = raw.slug ?? slugify(raw.name);
  const frame = raw.frame ?? fam.frame;
  const status = raw.standardStatus ?? fam.standardStatus;
  const standardFrame = raw.standardFrame ?? (CONVENTION.includes(frame) ? frame : null);
  const variants = raw.variants ?? (raw.glyphVariant ? [raw.glyphVariant] : []);
  return {
    id: raw.id,
    name: raw.name,
    slug,
    family: fam.id,
    description: raw.description,
    standardStatus: status,
    frame,
    standardFrame,
    variants,
    severity: {
      default: raw.severity?.default ?? raw.severityDefault ?? fam.severityDefault,
      dynamic: raw.severity?.dynamic ?? fam.dynamicSeverity,
      factors: fam.severityFactors,
    },
    escalation: raw.escalation ?? fam.escalation,
    speed: raw.speed ?? fam.speed,
    detectionMethods: raw.detectionMethods ?? fam.detectionMethods,
    confidence: raw.confidence ?? fam.confidence,
    dimensions: { ...fam.dimensions, ...raw.dimensions, measuredFields: raw.dimensions?.measuredFields ?? fam.dimensions.measuredFields ?? [] },
    visual: {
      glyph: raw.glyph,
      glyphVariant: raw.glyphVariant ?? null,
      slash: raw.slash ?? false,
      legend: raw.legend ?? null,
      asset: `symbols/${kebab(fam.id)}/${raw.id.toLowerCase()}-${kebab(slug)}.svg`,
    },
    references: mergeRefs(fam.references, raw.references, status === 'standardised'),
    tags: raw.tags ?? [],
    version: RVHL_VERSION,
  };
}

export function buildCatalogue(
  familiesRaw: unknown[],
  files: RawFamilyFile[],
  referencesRaw: { policy: string; documents: unknown[] },
  glyphExists: (id: string) => boolean,
): BuiltCatalogue {
  const issues: ValidationIssue[] = [];
  const families: FamilyDefaults[] = [];
  for (const f of familiesRaw) {
    const r = FamilyDefaultsSchema.safeParse(f);
    if (r.success) families.push(r.data);
    else issues.push({ level: 'error', id: String((f as { id?: string }).id ?? '?'), message: r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
  }
  const references: ReferenceDoc[] = [];
  for (const d of referencesRaw.documents) {
    const r = ReferenceDocSchema.safeParse(d);
    if (r.success) references.push(r.data);
    else issues.push({ level: 'error', id: String((d as { id?: string }).id ?? '?'), message: r.error.message });
  }
  const refIds = new Set(references.map((r) => r.id));
  const famById = new Map(families.map((f) => [f.id, f]));
  const entries: CatalogueEntry[] = [];
  const seen = new Set<string>();

  for (const file of files) {
    const fam = famById.get(file.family as FamilyDefaults['id']);
    if (!fam) { issues.push({ level: 'error', id: file.family, message: 'Unknown family in data file' }); continue; }
    for (const e of file.entries) {
      const r = RawEntrySchema.safeParse(e);
      if (!r.success) {
        issues.push({ level: 'error', id: String((e as { id?: string }).id ?? '?'), message: r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') });
        continue;
      }
      const raw = r.data;
      if (!raw.id.startsWith(fam.code)) issues.push({ level: 'error', id: raw.id, message: `ID prefix does not match family code ${fam.code}` });
      if (seen.has(raw.id)) { issues.push({ level: 'error', id: raw.id, message: 'Duplicate ID' }); continue; }
      seen.add(raw.id);
      const entry = normaliseEntry(raw, fam);
      const v = CatalogueEntrySchema.safeParse(entry);
      if (!v.success) { issues.push({ level: 'error', id: raw.id, message: v.error.message }); continue; }
      if (!glyphExists(entry.visual.glyph)) issues.push({ level: 'warning', id: entry.id, message: `Pictogram "${entry.visual.glyph}" not yet drawn — shown as an explicit PICTOGRAM PENDING placeholder.` });
      for (const ref of entry.references) if (!refIds.has(ref.doc)) issues.push({ level: 'error', id: entry.id, message: `Unknown reference document ${ref.doc}` });
      entries.push(entry);
    }
  }
  for (const f of families) if (!entries.some((e) => e.family === f.id)) issues.push({ level: 'error', id: f.id, message: 'Family has no entries' });

  return { version: RVHL_VERSION, families, entries, references, referencePolicy: referencesRaw.policy, issues };
}
