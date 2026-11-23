import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, ExternalLink, Pencil, PenTool, RotateCcw, Save, X } from 'lucide-react';
import {
  DetectionMethodSchema, SEVERITY_LEVELS, StandardStatusSchema, type CatalogueEntry, type ReferenceLink, type Severity,
} from '../catalogue/schema';
import { useCatalogue } from '../state/catalogue';
import { composeIcon, pictogramSvg } from '../icons/compose';
import { GLYPHS } from '../icons/glyphs';
import { computeAdvisory, computeSeverity, defaultContext } from '../engine/severity';
import {
  CodeBlock, DETECTION_LABEL, Field, FRAME_LABEL, PageHeader, RELATION_LABEL, SeverityBadge, STATUS_META, StatusBadge, SvgIcon,
} from '../components/ui';
import { DownloadControls } from '../components/DownloadControls';
import { NavAlertCard } from '../components/NavAlertCard';
import { tokens } from '../tokens';

function Row({ k, children }: { k: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[150px_minmax(0,1fr)] gap-3 border-b border-line py-2.5 text-sm last:border-0">
      <div className="text-faint">{k}</div><div className="min-w-0 text-text">{children}</div>
    </div>
  );
}

export default function EntryDetail() {
  const { id = '' } = useParams();
  const nav = useNavigate();
  const cat = useCatalogue();
  const entry = cat.byId.get(id);
  const [editing, setEditing] = useState(false);
  const [variant, setVariant] = useState<string | null>(null);
  const [sev, setSev] = useState<Severity | null>(null);
  useEffect(() => { setEditing(false); setVariant(null); setSev(null); }, [id]);

  const idx = cat.entries.findIndex((e) => e.id === id);
  if (!entry) return <div className="panel p-10 text-center text-dim">Unknown element <span className="mono">{id}</span>. <Link className="text-accent2" to="/catalogue">Back to catalogue</Link></div>;
  const prev = cat.entries[idx - 1], next = cat.entries[idx + 1];
  const fam = cat.familyById.get(entry.family)!;
  const severity = sev ?? entry.severity.default;
  const v = variant ?? entry.visual.glyphVariant;
  const variants = [...new Set([...entry.variants, ...(GLYPHS[entry.visual.glyph]?.variants ?? [])])];
  const dyn = computeSeverity(entry, defaultContext);
  const adv = computeAdvisory(entry, severity, 50, defaultContext.confidence);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm">
        <Link to={`/catalogue?family=${entry.family}`} className="flex items-center gap-1 text-dim hover:text-text"><ArrowLeft size={14} /> {fam.letter}. {fam.label}</Link>
        <div className="flex gap-2">
          {prev && <button className="btn !py-1 text-xs" onClick={() => nav(`/item/${prev.id}`)}><ArrowLeft size={13} /> {prev.id}</button>}
          {next && <button className="btn !py-1 text-xs" onClick={() => nav(`/item/${next.id}`)}>{next.id} <ArrowRight size={13} /></button>}
        </div>
      </div>

      <PageHeader kicker={`${entry.id} · ${fam.label}`} title={entry.name}
        actions={<>
          <Link className="btn" to={`/studio?id=${entry.id}`}><PenTool size={14} /> Open in Studio</Link>
          {!editing ? <button className="btn-primary" onClick={() => setEditing(true)}><Pencil size={14} /> Edit entry</button> : null}
          {cat.isEdited(entry.id) && <button className="btn" onClick={() => cat.resetEntry(entry.id)}><RotateCcw size={14} /> Revert to source</button>}
        </>}>
        {entry.description}
      </PageHeader>

      {editing && <EditForm entry={entry} onClose={() => setEditing(false)} />}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <div className="space-y-6 min-w-0">
          <div className="panel p-4">
            <Row k="Unique ID"><span className="mono text-sm">{entry.id}</span> {cat.isEdited(entry.id) && <span className="chip ml-2 border-s2/50 text-s2">Edited locally</span>}</Row>
            <Row k="Name / slug">{entry.name} <span className="mono text-faint ml-2">{entry.slug}</span></Row>
            <Row k="Category">{fam.letter}. {fam.label} <span className="text-faint">({entry.family})</span></Row>
            <Row k="Standard status"><StatusBadge status={entry.standardStatus} long /> <span className="ml-2 text-xs text-dim">{STATUS_META[entry.standardStatus].desc}</span></Row>
            <Row k="Variants">{variants.length ? <div className="flex flex-wrap gap-1">{variants.map((x) => <button key={x} onClick={() => setVariant(x)} className={`chip ${x === v ? 'border-accent text-white' : 'text-dim'}`}>{x.replace(/_/g, ' ')}</button>)}</div> : <span className="text-faint">—</span>}</Row>
            <Row k="Default severity"><SeverityBadge level={entry.severity.default} label /> <span className="ml-2 text-xs text-dim">{entry.severity.dynamic ? 'Dynamic' : 'Fixed'} · RoadOS proposal</span></Row>
            <Row k="Severity factors">{entry.severity.factors.length ? entry.severity.factors.map((f) => f.replace(/_/g, ' ')).join(' · ') : '—'}</Row>
            <Row k="Escalation conditions"><ul className="list-disc space-y-0.5 pl-4 text-dim">{entry.escalation.map((x) => <li key={x}>{x}</li>)}</ul></Row>
            <Row k="Speed rules">
              <div className="text-dim">Legal limit: <span className="text-text">{entry.speed.legalLimit.replace('_', ' ')}</span> · Advisory: <span className="text-text">{entry.speed.advisory}</span></div>
              {entry.speed.notes && <div className="mt-1 text-xs text-faint">{entry.speed.notes}</div>}
              <div className="mt-1 text-xs text-faint">RVHL never assigns a legal speed limit to a hazard automatically.</div>
            </Row>
            <Row k="Detection methods"><div className="flex flex-wrap gap-1">{entry.detectionMethods.map((d) => <span key={d} className="chip text-dim">{DETECTION_LABEL[d]}</span>)}</div></Row>
            <Row k="Confidence">Display ≥ <b>{Math.round(entry.confidence.minimumToDisplay * 100)}%</b> · Alert ≥ <b>{Math.round(entry.confidence.minimumToAlert * 100)}%</b> <span className="ml-1 text-xs text-faint">(independent of severity)</span></Row>
            <Row k="Physical dimensions">
              {entry.dimensions.typical && <div>{entry.dimensions.typical}</div>}
              <div className="mono text-faint">{entry.dimensions.measuredFields.join(', ') || '—'}</div>
              {entry.dimensions.notes && <div className="text-xs text-faint">{entry.dimensions.notes}</div>}
            </Row>
            <Row k="Visual">
              <span className="mono text-accent2">{entry.visual.glyph}{entry.visual.glyphVariant ? `:${entry.visual.glyphVariant}` : ''}</span> · {FRAME_LABEL[entry.frame]}
              {entry.standardFrame && <> · standard form: {FRAME_LABEL[entry.standardFrame]}</>}
              <div className="mono text-faint">{entry.visual.asset}</div>
            </Row>
          </div>

          <div className="panel">
            <div className="panel-head"><span className="label">Applicable standards & reference documents</span><Link to="/standards" className="text-xs text-accent2">All references</Link></div>
            <div className="divide-y divide-line">
              {entry.references.map((r) => {
                const d = cat.referenceById.get(r.doc);
                return (
                  <div key={r.doc} className="grid gap-2 p-4 text-sm md:grid-cols-[1fr_auto]">
                    <div className="min-w-0">
                      <div className="font-medium text-white">{d?.identifier} <span className="font-normal text-dim">— {d?.title}</span></div>
                      <div className="mt-1 text-xs text-dim">{RELATION_LABEL[r.relation]} · {d?.publisher}</div>
                      <div className="mt-1 text-xs">
                        {r.verification === 'verified' && (r.clause || r.figure || r.page)
                          ? <span className="text-ok">Clause {r.clause ?? '—'} · Figure {r.figure ?? '—'} · Page {r.page ?? '—'} (verified{r.verifiedBy ? ` by ${r.verifiedBy}` : ''}{r.verifiedOn ? `, ${r.verifiedOn}` : ''})</span>
                          : <span className="text-s2">Reference pending verification — no clause, figure or page is asserted.</span>}
                      </div>
                      {r.note && <div className="mt-1 text-xs text-faint">{r.note}</div>}
                      {d && <div className="mt-1 text-[11px] text-faint">Licensing: {d.licensing}</div>}
                    </div>
                    {d && <a href={d.url} target="_blank" rel="noreferrer" className="btn self-start !py-1 text-xs"><ExternalLink size={13} /> {d.urlKind === 'publisher_portal' ? 'Publisher' : 'Source'}</a>}
                  </div>
                );
              })}
            </div>
          </div>

          <CodeBlock title="Metadata JSON" code={JSON.stringify(entry, null, 2)} maxH={420} />
        </div>

        <div className="space-y-6 min-w-0">
          <div className="panel p-4">
            <div className="mb-3 flex items-center justify-between"><span className="label">Icon preview</span>
              <div className="flex gap-1">{SEVERITY_LEVELS.map((s) => <button key={s} onClick={() => setSev(s)} className="rounded px-1.5 text-[11px] font-bold" style={{ background: tokens.severity[s].color, color: tokens.severity[s].onColor, opacity: s === severity ? 1 : 0.4 }}>{s}</button>)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col items-center rounded-lg bg-base p-3"><SvgIcon svg={composeIcon({ entry, variant: v, severity }).svg} size={140} /><span className="mt-1 text-[11px] text-faint">Primary · dark</span></div>
              <div className="flex flex-col items-center rounded-lg p-3" style={{ background: tokens.backgrounds.light }}><SvgIcon svg={composeIcon({ entry, variant: v, severity, theme: 'light', representation: 'roados' }).svg} size={140} /><span className="mt-1 text-[11px] text-slate-500">RoadOS · light</span></div>
            </div>
            <div className="mt-3 flex items-center gap-3 rounded-lg border border-line p-3">
              <SvgIcon svg={pictogramSvg(entry, 'dark', v)} size={64} className="rounded bg-[#0F1720]" />
              <div className="text-xs text-dim">Master SVG pictogram · 64×64 viewBox · editable vector paths, no raster content.</div>
            </div>
          </div>

          <div className="panel p-4">
            <div className="label mb-3">RoadOS navigation preview</div>
            <div className="rounded-xl bg-[radial-gradient(ellipse_at_top,#1b2a3a,#070b10)] p-4">
              <NavAlertCard entry={entry} severity={severity} variant={v} distanceM={200} advisory={adv?.valueKmh ?? null} posted={null} />
              <div className="mt-3 text-[11px] text-slate-400">Context: car at 50 km/h, 200 m, good visibility → dynamic severity <b style={{ color: tokens.severity[dyn.level].color }}>{dyn.level}</b>. Advisory shown only when the rules allow it; posted limit is never inferred.</div>
            </div>
          </div>

          <div className="panel p-4">
            <div className="label mb-3">Download</div>
            <DownloadControls entry={entry} options={{ variant: v, severity }} compact />
          </div>
        </div>
      </div>
    </div>
  );
}

function EditForm({ entry, onClose }: { entry: CatalogueEntry; onClose: () => void }) {
  const { saveEntry, referenceById } = useCatalogue();
  const [d, setD] = useState(() => structuredClone(entry));
  const [err, setErr] = useState<string | null>(null);
  const set = <K extends keyof CatalogueEntry>(k: K, val: CatalogueEntry[K]) => setD((x) => ({ ...x, [k]: val }));
  const setRef = (i: number, patch: Partial<ReferenceLink>) => setD((x) => ({ ...x, references: x.references.map((r, j) => (j === i ? { ...r, ...patch } : r)) }));
  const statuses = useMemo(() => StandardStatusSchema.options, []);

  const save = () => {
    const references = d.references.map((r) => r.verification === 'verified' ? r : { ...r, clause: null, figure: null, page: null, verifiedBy: undefined, verifiedOn: undefined });
    for (const r of references) if (r.verification === 'verified' && !r.verifiedBy) { setErr(`Reference ${r.doc}: a verified reference needs the verifier's name.`); return; }
    // Store only fields that differ from the current entry, so later source updates still flow through.
    const next: Record<string, unknown> = { ...d, references };
    const patch = Object.fromEntries(
      Object.entries(next).filter(([k, val]) => !['id', 'family', 'version'].includes(k) && JSON.stringify(val) !== JSON.stringify(entry[k as keyof CatalogueEntry])),
    );
    if (!Object.keys(patch).length) { onClose(); return; }
    const res = saveEntry(entry.id, patch);
    if (res.ok) onClose(); else setErr(res.error);
  };

  return (
    <div className="panel mb-6 border-accent/50">
      <div className="panel-head"><span className="font-semibold text-white">Edit {entry.id}</span>
        <div className="flex gap-2"><button className="btn" onClick={onClose}><X size={14} /> Cancel</button><button className="btn-primary" onClick={save}><Save size={14} /> Save</button></div>
      </div>
      <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
        <Field label="Name"><input className="input" value={d.name} onChange={(e) => set('name', e.target.value)} /></Field>
        <Field label="Standard status">
          <select className="input" value={d.standardStatus} onChange={(e) => set('standardStatus', e.target.value as CatalogueEntry['standardStatus'])}>
            {statuses.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
          </select>
        </Field>
        <Field label="Default severity">
          <select className="input" value={d.severity.default} onChange={(e) => set('severity', { ...d.severity, default: e.target.value as Severity })}>
            {SEVERITY_LEVELS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="Description"><textarea className="input min-h-20" value={d.description} onChange={(e) => set('description', e.target.value)} /></Field>
        <Field label="Escalation conditions (one per line)"><textarea className="input min-h-20" value={d.escalation.join('\n')} onChange={(e) => set('escalation', e.target.value.split('\n').filter(Boolean))} /></Field>
        <Field label="Variants (comma-separated)"><input className="input" value={d.variants.join(', ')} onChange={(e) => set('variants', e.target.value.split(',').map((s) => s.trim()).filter(Boolean))} /></Field>
        <Field label="Advisory speed rule">
          <select className="input" value={d.speed.advisory} onChange={(e) => set('speed', { ...d.speed, advisory: e.target.value as CatalogueEntry['speed']['advisory'] })}>
            <option value="conditional">conditional</option><option value="recommended">recommended</option><option value="never">never</option>
          </select>
        </Field>
        <Field label="Confidence thresholds (display / alert)">
          <div className="flex gap-2">
            <input type="number" step={0.05} min={0} max={1} className="input" value={d.confidence.minimumToDisplay} onChange={(e) => set('confidence', { ...d.confidence, minimumToDisplay: Number(e.target.value) })} />
            <input type="number" step={0.05} min={0} max={1} className="input" value={d.confidence.minimumToAlert} onChange={(e) => set('confidence', { ...d.confidence, minimumToAlert: Number(e.target.value) })} />
          </div>
        </Field>
        <Field label="Typical dimensions"><input className="input" value={d.dimensions.typical ?? ''} onChange={(e) => set('dimensions', { ...d.dimensions, typical: e.target.value || undefined })} /></Field>
        <div className="md:col-span-2 xl:col-span-3">
          <div className="label mb-1.5">Detection methods</div>
          <div className="flex flex-wrap gap-2">
            {DetectionMethodSchema.options.map((m) => (
              <label key={m} className="chip cursor-pointer text-dim">
                <input type="checkbox" checked={d.detectionMethods.includes(m)} onChange={(e) => set('detectionMethods', e.target.checked ? [...d.detectionMethods, m] : d.detectionMethods.filter((x) => x !== m))} /> {DETECTION_LABEL[m]}
              </label>
            ))}
          </div>
        </div>
        <div className="md:col-span-2 xl:col-span-3">
          <div className="label mb-1.5">Reference verification</div>
          <p className="mb-2 text-xs text-s2">Only mark a reference as verified after checking the official document. Clause, figure and page are discarded unless the reference is verified.</p>
          <div className="space-y-2">
            {d.references.map((r, i) => (
              <div key={r.doc} className="grid items-center gap-2 rounded-lg border border-line p-2 text-xs md:grid-cols-[180px_120px_repeat(3,1fr)_1fr_120px]">
                <span className="font-medium text-text">{referenceById.get(r.doc)?.identifier}</span>
                <select className="input" value={r.verification} onChange={(e) => setRef(i, { verification: e.target.value as 'pending' | 'verified' })}><option value="pending">pending</option><option value="verified">verified</option></select>
                <input className="input" placeholder="Clause" disabled={r.verification !== 'verified'} value={r.clause ?? ''} onChange={(e) => setRef(i, { clause: e.target.value || null })} />
                <input className="input" placeholder="Figure" disabled={r.verification !== 'verified'} value={r.figure ?? ''} onChange={(e) => setRef(i, { figure: e.target.value || null })} />
                <input className="input" placeholder="Page" disabled={r.verification !== 'verified'} value={r.page ?? ''} onChange={(e) => setRef(i, { page: e.target.value || null })} />
                <input className="input" placeholder="Verified by" disabled={r.verification !== 'verified'} value={r.verifiedBy ?? ''} onChange={(e) => setRef(i, { verifiedBy: e.target.value || undefined })} />
                <input className="input" type="date" disabled={r.verification !== 'verified'} value={r.verifiedOn ?? ''} onChange={(e) => setRef(i, { verifiedOn: e.target.value || undefined })} />
              </div>
            ))}
          </div>
        </div>
        {err && <div className="md:col-span-2 xl:col-span-3 rounded-lg border border-s5/50 bg-s5/10 p-2 text-xs text-s5">{err}</div>}
      </div>
    </div>
  );
}
