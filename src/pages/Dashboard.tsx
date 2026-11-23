import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CircleAlert, CircleCheck, Map, Navigation, PackageOpen, PenTool } from 'lucide-react';
import { SEVERITY_LEVELS, type StandardStatus } from '../catalogue/schema';
import { useCatalogue } from '../state/catalogue';
import { EntryIcon, Stat, STATUS_META } from '../components/ui';
import { tokens } from '../tokens';

const SHOWCASE = ['RDM-003', 'SPD-005', 'TMP-002', 'MOV-013', 'ENV-002', 'RSG-009', 'GEO-004', 'DEB-004'];

export default function Dashboard() {
  const { entries, families, references, issues, overrides, byId } = useCatalogue();
  const statusCounts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const e of entries) m[e.standardStatus] = (m[e.standardStatus] ?? 0) + 1;
    return m;
  }, [entries]);
  const sevCounts = useMemo(() => SEVERITY_LEVELS.map((s) => ({ s, n: entries.filter((e) => e.severity.default === s).length })), [entries]);
  const pendingLinks = entries.reduce((n, e) => n + e.references.filter((r) => r.verification === 'pending').length, 0);
  const totalLinks = entries.reduce((n, e) => n + e.references.length, 0);
  const glyphs = new Set(entries.map((e) => e.visual.glyph)).size;
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-2xl border border-line bg-gradient-to-br from-[#121e2b] via-[#0e1823] to-[#0b1118] p-6 md:p-10">
        <div className="pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 gap-3 xl:grid xl:grid-cols-4">
          {SHOWCASE.map((id) => byId.get(id)).filter(Boolean).map((e) => <EntryIcon key={e!.id} entry={e!} size={84} />)}
        </div>
        <div className="relative max-w-xl">
          <div className="label mb-2 text-s3">RVHL 1.0 · RoadOS graphics ecosystem</div>
          <h1 className="text-3xl font-bold tracking-tight text-white md:text-4xl">RoadOS Visual Hazard Studio</h1>
          <p className="mt-2 text-lg text-accent2">One visual language for every road.</p>
          <p className="mt-4 text-sm leading-relaxed text-dim">
            The catalogue, severity model, speed representation and icon composition engine for RoadOS — starting with Indian roads.
            Every icon is generated from original, editable SVG pictograms and a single token system, ready to be consumed by the RoadOS C++/Skia graphics SDK.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Link to="/catalogue" className="btn-primary">Open catalogue <ArrowRight size={15} /></Link>
            <Link to="/studio" className="btn"><PenTool size={15} /> Icon Studio</Link>
            <Link to="/corridor" className="btn"><Navigation size={15} /> Forward corridor</Link>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Catalogue elements" value={entries.length} sub={`${families.length} families`} />
        <Stat label="Original pictograms" value={glyphs} sub="64×64 SVG masters" />
        <Stat label="Standardised" value={statusCounts.standardised ?? 0} sub={`${statusCounts.convention_inspired ?? 0} convention-inspired`} />
        <Stat label="Non-standard hazards" value={statusCounts.non_standard_hazard ?? 0} sub={`${statusCounts.roados_extension ?? 0} RoadOS extensions`} />
        <Stat label="Reference documents" value={references.length} sub={`${pendingLinks}/${totalLinks} links pending verification`} />
        <Stat label="Local edits" value={Object.keys(overrides).length} sub="saved in this browser" />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <div className="panel xl:col-span-2">
          <div className="panel-head"><span className="label">Families</span><Link to="/catalogue" className="text-xs text-accent2 hover:underline">Browse all</Link></div>
          <div className="grid gap-px bg-line sm:grid-cols-2">
            {families.map((f) => {
              const list = entries.filter((e) => e.family === f.id);
              return (
                <Link key={f.id} to={`/catalogue?family=${f.id}`} className="flex items-center gap-3 bg-panel p-3 hover:bg-panel2">
                  <span className="mono w-6 text-center text-s3">{f.letter}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-text">{f.label}</div>
                    <div className="text-xs text-faint">{list.length} elements · {f.code}</div>
                  </div>
                  <div className="flex -space-x-2">{list.slice(0, 3).map((e) => <EntryIcon key={e.id} entry={e} size={34} showSeverityCode={false} />)}</div>
                </Link>
              );
            })}
          </div>
        </div>

        <div className="space-y-6">
          <div className="panel p-4">
            <div className="label mb-3">Standard status</div>
            <div className="flex h-3 overflow-hidden rounded-full">
              {(Object.keys(STATUS_META) as StandardStatus[]).map((s, i) => (
                <div key={s} style={{ width: `${((statusCounts[s] ?? 0) / entries.length) * 100}%`, background: ['#4C8DF6', '#38BDF8', '#E99A32', '#A78BFA'][i] }} />
              ))}
            </div>
            <ul className="mt-3 space-y-1.5 text-sm">
              {(Object.keys(STATUS_META) as StandardStatus[]).map((s, i) => (
                <li key={s} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: ['#4C8DF6', '#38BDF8', '#E99A32', '#A78BFA'][i] }} />
                  <span className="flex-1 text-dim">{STATUS_META[s].label}</span><span className="tabular-nums text-text">{statusCounts[s] ?? 0}</span></li>
              ))}
            </ul>
          </div>
          <div className="panel p-4">
            <div className="label mb-3">Default severity distribution</div>
            <div className="flex h-28 items-end gap-2">
              {sevCounts.map(({ s, n }) => (
                <div key={s} className="flex flex-1 flex-col items-center gap-1">
                  <span className="text-xs tabular-nums text-dim">{n}</span>
                  <div className="w-full rounded-t" style={{ height: `${(n / Math.max(...sevCounts.map((x) => x.n))) * 80}px`, background: tokens.severity[s].color }} />
                  <span className="text-[11px] font-bold text-dim">{s}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="panel p-4">
            <div className="label mb-2">Catalogue validation</div>
            {errors.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-ok"><CircleCheck size={16} /> Schema valid · unique IDs · all pictograms present</div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-s5"><CircleAlert size={16} /> {errors.length} error(s)</div>
            )}
            {warnings.length > 0 && <div className="mt-1 text-xs text-s2">{warnings.length} warning(s)</div>}
            <ul className="mt-2 max-h-32 space-y-1 overflow-auto text-xs text-dim scroll-thin">
              {issues.map((i, k) => <li key={k}><span className="mono">{i.id}</span> {i.message}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { to: '/map', icon: Map, t: 'Map preview', d: 'Simulated route with hazard markers, speed limits, advisory badges and distances.' },
          { to: '/corridor', icon: Navigation, t: 'Forward corridor', d: 'Instrument-style perspective road. Insert any catalogue element and drive towards it.' },
          { to: '/export', icon: PackageOpen, t: 'Export centre', d: 'SVG, PNG 1×/2×/3×, ZIP collections, catalogue JSON, tokens, manifests and docs.' },
        ].map(({ to, icon: I, t, d }) => (
          <Link key={to} to={to} className="panel group flex gap-3 p-4 hover:border-accent/60">
            <I size={20} className="mt-0.5 text-accent2" />
            <div><div className="font-medium text-white">{t}</div><div className="text-sm text-dim">{d}</div></div>
          </Link>
        ))}
      </section>
    </div>
  );
}
