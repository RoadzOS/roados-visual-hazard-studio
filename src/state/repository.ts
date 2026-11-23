/**
 * Persistence boundary for catalogue edits. The initial implementation stores
 * editor overrides in localStorage; an API-backed repository can implement the
 * same interface later without touching the UI.
 */
import type { CatalogueEntry } from '../catalogue/schema';

export type EntryPatch = Partial<Omit<CatalogueEntry, 'id' | 'family' | 'version'>>;
export type Overrides = Record<string, EntryPatch>;

export interface CatalogueRepository {
  loadOverrides(): Overrides;
  saveOverrides(o: Overrides): void;
}

const KEY = 'rvhl.overrides.v1';

export const localRepository: CatalogueRepository = {
  loadOverrides() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as Overrides) : {};
    } catch {
      return {};
    }
  },
  saveOverrides(o) {
    try {
      localStorage.setItem(KEY, JSON.stringify(o));
    } catch {
      /* storage unavailable — edits stay in memory for this session */
    }
  },
};
