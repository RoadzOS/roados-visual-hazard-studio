import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { LayoutGrid, List, Search, X } from 'lucide-react';
import { SEVERITY_LEVELS, type FamilyId, type Severity, type StandardStatus } from '../catalogue/schema';
import { useCatalogue } from '../state/catalogue';
import { EntryIcon, EntryTile, FRAME_LABEL, PageHeader, Seg, SeverityBadge, STATUS_META, StatusBadge } from '../components/ui';
import { severityColor } from '../tokens';

interface Preset { families?: FamilyId[] }

export function CatalogueBrowser({ title, kicker, intro, preset }: { title: string; kicker?: string; intro?: string; preset?: Preset }) {
  const { entries, families, isEdited } = useCatalogue();
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const fam = params.get('family') ?? '';
  const status = (params.get('status') ?? '') as StandardStatus | '';
  const sev = (params.get('sev') ?? '') as Severity | '';
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [rep, setRep] = useState<'auto' | 'roados'>('auto');

  const set = (k: string, v: string) => { const n = new URLSearchParams(params); if (v) n.set(k, v); else n.delete(k); setParams(n, { replace: true }); };

  const scoped = useMemo(() => (preset?.families ? entries.filter((e) => preset.families!.includes(e.family)) : entries), [entries, preset]);
  const famOptions = families.filter((f) => !preset?.families || preset.families.includes(f.id));

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return scoped.filter((e) =>
      (!fam || e.family === fam) && (!status || e.standardStatus === status) && (!sev || e.severity.default === sev) &&
      (!needle || [e.id, e.name, e.description, e.visual.glyph, e.slug, ...e.variants, ...e.tags].join(' ').toLowerCase().includes(needle)));
  }, [scoped, q, fam, status, sev]);

  const grouped = useMemo(() => famOptions.map((f) => ({ f, list: filtered.filter((e) => e.family === f.id) })).filter((g) => g.list.length), [famOptions, filtered]);
  const active = q || fam || status || sev;

  return (
    <div>
      <PageHeader title={title} kicker={kicker}>{intro ?? 'Every catalogue element with a stable ID, standard status, default severity and generated icon. Select any element to open its detail page.'}</PageHeader>

      <div className="panel mb-6 flex flex-wrap items-center gap-3 p-3">
        <div className="relative min-w-[220px] flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input className="input !pl-9" placeholder="Search name, ID, description, variant…" value={q} onChange={(e) => set('q', e.target.value)} />
        </div>
        {famOptions.length > 1 && (
          <select className="input !w-auto" value={fam} onChange={(e) => set('family', e.target.value)}>
            <option value="">All families ({scoped.length})</option>
            {famOptions.map((f) => <option key={f.id} value={f.id}>{f.letter}. {f.label}</option>)}
          </select>
        )}
        <select className="input !w-auto" value={status} onChange={(e) => set('status', e.target.value)}>
          <option value="">Any status</option>
          {(Object.keys(STATUS_META) as StandardStatus[]).map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
        </select>
        <div className="flex items-center gap-1">
          {SEVERITY_LEVELS.map((s) => (
            <button key={s} type="button" onClick={() => set('sev', sev === s ? '' : s)}
              className="rounded-md px-2 py-1 text-[11px] font-bold transition-opacity"
              style={{ background: severityColor(s), color: s === 'S4' || s === 'S5' ? '#fff' : '#0B1118', opacity: !sev || sev === s ? 1 : 0.3 }}>{s}</button>
          ))}
        </div>
        <Seg value={rep} onChange={setRep} options={[{ value: 'auto', label: 'Primary' }, { value: 'roados', label: 'RoadOS' }]} />
        <Seg value={view} onChange={setView} options={[{ value: 'grid', label: <LayoutGrid size={14} /> }, { value: 'list', label: <List size={14} /> }]} />
        {active && <button className="btn !py-1 text-xs" onClick={() => setParams({}, { replace: true })}><X size={13} /> Clear</button>}
      </div>

      <div className="mb-4 text-sm text-dim">{filtered.length} of {scoped.length} elements</div>

      {grouped.map(({ f, list }) => (
        <section key={f.id} className="mb-10">
          <div className="mb-3 flex items-baseline gap-3 border-b border-line pb-2">
            <span className="mono rounded bg-panel2 px-1.5 py-0.5 text-s3">{f.letter}</span>
            <h2 className="text-base font-semibold text-white">{f.label}</h2>
            <span className="text-xs text-faint">{list.length} · {f.code}-###</span>
          </div>
          {view === 'grid' ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 2xl:grid-cols-7">
              {list.map((e) => rep === 'auto' ? <EntryTile key={e.id} entry={e} edited={isEdited(e.id)} /> : (
                <Link key={e.id} to={`/item/${e.id}`} className="panel flex flex-col items-center gap-2 p-3 text-center hover:border-accent/60">
                  <EntryIcon entry={e} size={72} representation="roados" />
                  <div className="mono text-faint">{e.id}</div><div className="truncate text-[13px] w-full">{e.name}</div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="panel overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-[11px] uppercase tracking-wider text-faint">
                  <th className="p-3 w-14"></th><th className="p-3">ID</th><th className="p-3">Name</th><th className="p-3">Status</th><th className="p-3">Severity</th><th className="p-3 hidden md:table-cell">Frame</th><th className="p-3 hidden xl:table-cell">Description</th>
                </tr></thead>
                <tbody>
                  {list.map((e) => (
                    <tr key={e.id} className="border-t border-line hover:bg-panel2">
                      <td className="p-2"><EntryIcon entry={e} size={40} representation={rep} /></td>
                      <td className="p-3 mono text-dim">{e.id}</td>
                      <td className="p-3"><Link className="font-medium text-text hover:text-accent2" to={`/item/${e.id}`}>{e.name}</Link>{isEdited(e.id) && <span className="ml-1 text-s2">●</span>}</td>
                      <td className="p-3"><StatusBadge status={e.standardStatus} /></td>
                      <td className="p-3"><SeverityBadge level={e.severity.default} /></td>
                      <td className="p-3 hidden md:table-cell text-dim text-xs">{FRAME_LABEL[e.frame]}</td>
                      <td className="p-3 hidden xl:table-cell text-dim text-xs max-w-md">{e.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ))}
      {!filtered.length && <div className="panel p-10 text-center text-dim">No elements match these filters.</div>}
    </div>
  );
}
