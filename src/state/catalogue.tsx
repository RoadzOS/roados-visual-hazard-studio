import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { baseCatalogue } from '../catalogue';
import { CatalogueEntrySchema, type CatalogueEntry, type FamilyDefaults, type ReferenceDoc } from '../catalogue/schema';
import type { ValidationIssue } from '../catalogue/build';
import { localRepository, type CatalogueRepository, type EntryPatch, type Overrides } from './repository';

interface CatalogueState {
  version: string;
  entries: CatalogueEntry[];
  byId: Map<string, CatalogueEntry>;
  families: FamilyDefaults[];
  familyById: Map<string, FamilyDefaults>;
  references: ReferenceDoc[];
  referenceById: Map<string, ReferenceDoc>;
  referencePolicy: string;
  issues: ValidationIssue[];
  overrides: Overrides;
  isEdited: (id: string) => boolean;
  saveEntry: (id: string, patch: EntryPatch) => { ok: true } | { ok: false; error: string };
  resetEntry: (id: string) => void;
  resetAll: () => void;
}

const Ctx = createContext<CatalogueState | null>(null);

export function CatalogueProvider({ children, repository = localRepository }: { children: ReactNode; repository?: CatalogueRepository }) {
  const [overrides, setOverrides] = useState<Overrides>(() => repository.loadOverrides());

  const entries = useMemo(
    () =>
      baseCatalogue.entries.map((e) => {
        const o = overrides[e.id];
        if (!o) return e;
        const merged = { ...e, ...o, id: e.id, family: e.family, version: e.version };
        const v = CatalogueEntrySchema.safeParse(merged);
        return v.success ? v.data : e;
      }),
    [overrides],
  );

  const persist = useCallback((next: Overrides) => { setOverrides(next); repository.saveOverrides(next); }, [repository]);

  const value = useMemo<CatalogueState>(() => {
    const byId = new Map(entries.map((e) => [e.id, e]));
    return {
      version: baseCatalogue.version,
      entries,
      byId,
      families: baseCatalogue.families,
      familyById: new Map(baseCatalogue.families.map((f) => [f.id, f])),
      references: baseCatalogue.references,
      referenceById: new Map(baseCatalogue.references.map((r) => [r.id, r])),
      referencePolicy: baseCatalogue.referencePolicy,
      issues: baseCatalogue.issues,
      overrides,
      isEdited: (id) => !!overrides[id],
      saveEntry: (id, patch) => {
        const base = baseCatalogue.entries.find((e) => e.id === id);
        if (!base) return { ok: false, error: 'Unknown entry' };
        const merged = { ...base, ...overrides[id], ...patch, id, family: base.family, version: base.version };
        const v = CatalogueEntrySchema.safeParse(merged);
        if (!v.success) return { ok: false, error: v.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') };
        persist({ ...overrides, [id]: { ...overrides[id], ...patch } });
        return { ok: true };
      },
      resetEntry: (id) => { const n = { ...overrides }; delete n[id]; persist(n); },
      resetAll: () => persist({}),
    };
  }, [entries, overrides, persist]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalogue(): CatalogueState {
  const v = useContext(Ctx);
  if (!v) throw new Error('useCatalogue outside provider');
  return v;
}
