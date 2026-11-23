import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, ExternalLink, ShieldAlert } from 'lucide-react';
import { useCatalogue } from '../state/catalogue';
import { EntryIcon, PageHeader, RELATION_LABEL, STATUS_META, StatusBadge } from '../components/ui';
import { downloadText } from '../export/download';
import { referenceManifest } from '../export/bundles';
import type { StandardStatus } from '../catalogue/schema';

export default function StandardsReferences() {
  const { references, entries, families, referencePolicy } = useCatalogue();
  const [doc, setDoc] = useState<string>(references[0]?.id ?? '');
  const [relation, setRelation] = useState<string>('');
  const linked = useMemo(() => entries.filter((e) => e.references.some((r) => r.doc === doc && (!relation || r.relation === relation))), [entries, doc, relation]);
  const verified = entries.reduce((n, e) => n + e.references.filter((r) => r.verification === 'verified').length, 0);
  const total = entries.reduce((n, e) => n + e.references.length, 0);
  const d = references.find((r) => r.id === doc);

  return (
    <div className="space-y-8">
      <PageHeader title="Standards References" kicker="International & Indian sources"
        actions={<button className="btn" onClick={() => downloadText('rvhl-1.0.0-references.json', referenceManifest({ entries, families, references, referencePolicy }), 'application/json')}><Download size={14} /> Reference manifest</button>}>
        Each catalogue element links to the documents that govern or inform it, with a source URL and verification status. RVHL is not ISO-certified or officially approved.
      </PageHeader>

      <div className="flex gap-3 rounded-xl border border-s2/40 bg-s2/5 p-4 text-sm">
        <ShieldAlert size={20} className="mt-0.5 shrink-0 text-s2" />
        <div className="text-dim"><b className="text-text">Verification policy.</b> {referencePolicy} Currently <b className="text-text">{verified}</b> of {total} entry–document links are verified; all others display “Reference pending verification”.</div>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        {(Object.keys(STATUS_META) as StandardStatus[]).map((s) => (
          <div key={s} className="panel p-3"><StatusBadge status={s} long /><p className="mt-2 text-xs text-dim">{STATUS_META[s].desc}</p>
            <div className="mt-2 text-lg font-bold text-white">{entries.filter((e) => e.standardStatus === s).length}</div></div>
        ))}
      </div>

      <div className="panel overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left text-[11px] uppercase tracking-wider text-faint">
            <th className="p-3">Document</th><th className="p-3">Publisher</th><th className="p-3 hidden lg:table-cell">Scope</th><th className="p-3">Source</th><th className="p-3">Metadata</th><th className="p-3 text-right">Linked</th>
          </tr></thead>
          <tbody>
            {references.map((r) => {
              const n = entries.filter((e) => e.references.some((x) => x.doc === r.id)).length;
              return (
                <tr key={r.id} onClick={() => setDoc(r.id)} className={`cursor-pointer border-t border-line hover:bg-panel2 ${doc === r.id ? 'bg-panel2' : ''}`}>
                  <td className="p-3"><div className="font-medium text-white">{r.identifier}</div><div className="text-xs text-dim">{r.title}</div></td>
                  <td className="p-3 text-xs text-dim">{r.publisher}{r.edition && <div className="text-faint">{r.edition}</div>}</td>
                  <td className="p-3 hidden lg:table-cell text-xs text-dim max-w-xs">{r.scope}</td>
                  <td className="p-3"><a href={r.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-xs text-accent2 hover:underline"><ExternalLink size={12} />{r.urlKind.replace('_', ' ')}</a></td>
                  <td className="p-3"><span className={`chip ${r.metadataVerification === 'verified' ? 'border-ok/50 text-ok' : 'border-s2/50 text-s2'}`}>{r.metadataVerification}</span></td>
                  <td className="p-3 text-right tabular-nums text-dim">{n}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {d && (
        <div className="panel">
          <div className="panel-head flex-wrap">
            <div><div className="font-semibold text-white">{d.identifier}</div><div className="text-xs text-dim">{d.licensing}{d.urlNote ? ` · ${d.urlNote}` : ''}</div></div>
            <select className="input !w-auto" value={relation} onChange={(e) => setRelation(e.target.value)}>
              <option value="">Any relation</option>{Object.entries(RELATION_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {linked.map((e) => {
              const r = e.references.find((x) => x.doc === doc)!;
              return (
                <Link key={e.id} to={`/item/${e.id}`} className="flex items-center gap-3 rounded-lg border border-line p-2 hover:border-accent/50">
                  <EntryIcon entry={e} size={40} showSeverityCode={false} />
                  <div className="min-w-0 text-xs">
                    <div className="truncate text-sm text-text">{e.name}</div>
                    <div className="text-dim">{RELATION_LABEL[r.relation]}</div>
                    <div className={r.verification === 'verified' ? 'text-ok' : 'text-s2'}>{r.verification === 'verified' ? `Verified · clause ${r.clause ?? '—'}` : 'Reference pending verification'}</div>
                  </div>
                </Link>
              );
            })}
            {!linked.length && <div className="p-4 text-sm text-faint">No linked elements.</div>}
          </div>
        </div>
      )}
    </div>
  );
}
