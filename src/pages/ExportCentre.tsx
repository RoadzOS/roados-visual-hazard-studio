import { useState } from 'react';
import { Download, FileJson, FileText, LoaderCircle, Package } from 'lucide-react';
import { SEVERITY_LEVELS, type FamilyId, type Severity } from '../catalogue/schema';
import { useCatalogue } from '../state/catalogue';
import { assetManifest, buildIconZip, catalogueJson, documentationMarkdown, referenceManifest, tokensJson, type IconBundleOptions } from '../export/bundles';
import { downloadBlob, downloadText, PNG_BASE_PX } from '../export/download';
import { EntryIcon, Field, PageHeader } from '../components/ui';
import { DownloadControls } from '../components/DownloadControls';
import type { Theme } from '../tokens';

export default function ExportCentre() {
  const cat = useCatalogue();
  const ctx = { entries: cat.entries, families: cat.families, references: cat.references, referencePolicy: cat.referencePolicy };
  const [single, setSingle] = useState('RDM-003');
  const [family, setFamily] = useState<FamilyId>('road_damage');
  const [sevSel, setSevSel] = useState<Severity[]>([...SEVERITY_LEVELS]);
  const [themes, setThemes] = useState<Theme[]>(['dark', 'light']);
  const [reps, setReps] = useState<('standard' | 'roados')[]>(['standard', 'roados']);
  const [png, setPng] = useState<number[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [progress, setProgress] = useState<[number, number] | null>(null);
  const entry = cat.byId.get(single) ?? cat.entries[0];

  const opts = (severities: IconBundleOptions['severities']): IconBundleOptions => ({ themes, representations: reps, severities, png, includeMasters: true });
  const run = async (key: string, name: string, list = cat.entries, severities: IconBundleOptions['severities'] = 'default') => {
    setBusy(key);
    setProgress([0, 1]);
    try { downloadBlob(name, await buildIconZip(list, ctx, opts(severities), (a, b) => setProgress([a, b]))); }
    finally { setBusy(null); setProgress(null); }
  };
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const famEntries = cat.entries.filter((e) => e.family === family);

  return (
    <div className="space-y-8">
      <PageHeader title="Export & Download Centre" kicker="SVG · PNG · ZIP · JSON · Markdown">
        Individual assets and complete collections. Every icon uses the 128×128 composed viewBox (pictogram masters use 64×64), deterministic file names and stable IDs.
        PNG 1× = {PNG_BASE_PX}px, 2× = {PNG_BASE_PX * 2}px, 3× = {PNG_BASE_PX * 3}px.
      </PageHeader>

      <section className="panel">
        <div className="panel-head"><span className="font-semibold text-white">Individual asset</span></div>
        <div className="grid gap-4 p-4 md:grid-cols-[auto_minmax(0,1fr)] md:items-center">
          <div className="flex gap-3">
            <div className="rounded-lg bg-base p-2"><EntryIcon entry={entry} size={96} /></div>
            <div className="rounded-lg bg-[#EEF1F4] p-2"><EntryIcon entry={entry} size={96} theme="light" representation="roados" /></div>
          </div>
          <div className="space-y-3">
            <select className="input" value={entry.id} onChange={(e) => setSingle(e.target.value)}>
              {cat.families.map((f) => <optgroup key={f.id} label={f.label}>{cat.entries.filter((e) => e.family === f.id).map((e) => <option key={e.id} value={e.id}>{e.id} · {e.name}</option>)}</optgroup>)}
            </select>
            <DownloadControls entry={entry} options={{}} compact />
            <div className="text-xs text-faint">Use the Icon Studio for speed, distance, direction and count compositions.</div>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><span className="font-semibold text-white">Collection settings</span><span className="text-xs text-faint">Applies to all ZIP exports below</span></div>
        <div className="grid gap-4 p-4 md:grid-cols-4">
          <Field label="Themes">{(['dark', 'light'] as Theme[]).map((t) => <label key={t} className="mr-3 inline-flex items-center gap-1.5 text-sm text-dim"><input type="checkbox" checked={themes.includes(t)} onChange={() => setThemes(toggle(themes, t))} />{t}</label>)}</Field>
          <Field label="Representations">{(['standard', 'roados'] as const).map((r) => <label key={r} className="mr-3 inline-flex items-center gap-1.5 text-sm text-dim"><input type="checkbox" checked={reps.includes(r)} onChange={() => setReps(toggle(reps, r))} />{r}</label>)}</Field>
          <Field label="Also include PNG" hint="PNG rasterisation runs in your browser and takes longer.">{[1, 2, 3].map((k) => <label key={k} className="mr-3 inline-flex items-center gap-1.5 text-sm text-dim"><input type="checkbox" checked={png.includes(k)} onChange={() => setPng(toggle(png, k))} />{k}×</label>)}</Field>
          <Field label="Every ZIP contains">
            <div className="text-xs text-dim">master pictograms · composed icons · manifest.json · catalogue.json · tokens.json · references.json · README.md</div>
          </Field>
        </div>
        {progress && <div className="px-4 pb-4"><div className="h-1.5 overflow-hidden rounded bg-line"><div className="h-full bg-accent transition-all" style={{ width: `${(progress[0] / progress[1]) * 100}%` }} /></div><div className="mt-1 text-xs text-dim">{progress[0]} / {progress[1]} assets</div></div>}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="panel flex flex-col p-4">
          <Package className="text-accent2" size={20} />
          <div className="mt-2 font-semibold text-white">All icons</div>
          <p className="mt-1 flex-1 text-sm text-dim">All {cat.entries.length} elements at their default severity, in the selected themes and representations.</p>
          <button className="btn-primary mt-3 justify-center" disabled={!!busy || !themes.length || !reps.length} onClick={() => run('all', 'rvhl-1.0.0-all-icons.zip')}>
            {busy === 'all' ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />} Download ZIP</button>
        </div>
        <div className="panel flex flex-col p-4">
          <Package className="text-accent2" size={20} />
          <div className="mt-2 font-semibold text-white">Selected category</div>
          <select className="input mt-2" value={family} onChange={(e) => setFamily(e.target.value as FamilyId)}>
            {cat.families.map((f) => <option key={f.id} value={f.id}>{f.letter}. {f.label}</option>)}
          </select>
          <p className="mt-2 flex-1 text-sm text-dim">{famEntries.length} elements, default severity.</p>
          <button className="btn-primary mt-3 justify-center" disabled={!!busy || !themes.length || !reps.length} onClick={() => run('fam', `rvhl-1.0.0-${family.replace(/_/g, '-')}.zip`, famEntries)}>
            {busy === 'fam' ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />} Download ZIP</button>
        </div>
        <div className="panel flex flex-col p-4">
          <Package className="text-accent2" size={20} />
          <div className="mt-2 font-semibold text-white">Severity variants</div>
          <div className="mt-2 flex gap-1">{SEVERITY_LEVELS.map((s) => <label key={s} className="chip cursor-pointer text-dim"><input type="checkbox" checked={sevSel.includes(s)} onChange={() => setSevSel(toggle(sevSel, s))} />{s}</label>)}</div>
          <p className="mt-2 flex-1 text-sm text-dim">Selected category rendered at each chosen severity ({famEntries.length} × {sevSel.length}).</p>
          <button className="btn-primary mt-3 justify-center" disabled={!!busy || !sevSel.length || !themes.length || !reps.length} onClick={() => run('sev', `rvhl-1.0.0-${family.replace(/_/g, '-')}-severities.zip`, famEntries, sevSel)}>
            {busy === 'sev' ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />} Download ZIP</button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head"><span className="font-semibold text-white">Data & documentation</span></div>
        <div className="grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: FileJson, t: 'Complete RVHL catalogue', d: 'Normalised entries, families and references (JSON).', f: () => downloadText('rvhl-1.0.0-catalogue.json', catalogueJson(ctx), 'application/json') },
            { icon: FileJson, t: 'Design tokens', d: 'Severity, shapes, strokes, radii, badges, themes (JSON).', f: () => downloadText('rvhl-1.0.0-tokens.json', tokensJson(), 'application/json') },
            { icon: FileJson, t: 'SVG asset manifest', d: 'Every pictogram and composed icon path with frame, theme and severity.', f: () => downloadText('rvhl-1.0.0-asset-manifest.json', assetManifest(ctx), 'application/json') },
            { icon: FileJson, t: 'Reference manifest', d: 'Documents, source URLs and per-entry verification status.', f: () => downloadText('rvhl-1.0.0-references.json', referenceManifest(ctx), 'application/json') },
            { icon: FileText, t: 'Documentation (Markdown)', d: 'Severity, speed rules, references and full catalogue tables.', f: () => downloadText('rvhl-1.0.0-documentation.md', documentationMarkdown(ctx), 'text/markdown') },
          ].map(({ icon: I, t, d, f }) => (
            <button key={t} onClick={f} className="flex items-start gap-3 bg-panel p-4 text-left hover:bg-panel2">
              <I size={18} className="mt-0.5 text-accent2" />
              <div><div className="font-medium text-white">{t}</div><div className="text-xs text-dim">{d}</div></div>
              <Download size={14} className="ml-auto mt-1 text-faint" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
