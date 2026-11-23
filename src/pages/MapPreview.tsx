import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import type { Severity } from '../catalogue/schema';
import { useCatalogue } from '../state/catalogue';
import { composeIcon, formatDistance, speedBadgeSvg } from '../icons/compose';
import { computeAdvisory } from '../engine/severity';
import { makeRoute, pointAt, routeLengthM, subPath, type Pt } from '../engine/route';
import { Field, PageHeader, SeverityBadge, SvgIcon } from '../components/ui';
import { NavAlertCard } from '../components/NavAlertCard';
import { tokens } from '../tokens';

const ROUTE: Pt[] = [[60, 560], [250, 560], [310, 500], [310, 360], [380, 290], [600, 290], [660, 230], [660, 120], [720, 70], [960, 70]];
const route = makeRoute(ROUTE, 3.2);
const LEN = Math.round(routeLengthM(route));

const SPEED_ZONES = [
  { from: 0, limit: 50 }, { from: 900, limit: 40 }, { from: 1500, limit: 60 }, { from: 2600, limit: 30 },
];
const limitAt = (m: number) => [...SPEED_ZONES].reverse().find((z) => m >= z.from)?.limit ?? null;

interface Placed { uid: number; id: string; at: number; side: 1 | -1; severity?: Severity; variant?: string }
const INITIAL: Placed[] = [
  { uid: 1, id: 'RDM-003', at: 260, side: 1 },
  { uid: 2, id: 'SPD-005', at: 520, side: -1 },
  { uid: 3, id: 'GEO-003', at: 700, side: 1 },
  { uid: 4, id: 'TMP-019', at: 1050, side: -1 },
  { uid: 5, id: 'TMP-002', at: 1160, side: 1 },
  { uid: 6, id: 'MOV-013', at: 1420, side: -1 },
  { uid: 7, id: 'ENV-001', at: 1760, side: 1 },
  { uid: 8, id: 'DEB-004', at: 2050, side: -1 },
  { uid: 9, id: 'GEO-002', at: 2230, side: 1 },
  { uid: 10, id: 'RSG-029', at: 2700, side: -1 },
  { uid: 11, id: 'MOV-009', at: 2950, side: 1 },
];

export default function MapPreview() {
  const { byId, entries, families } = useCatalogue();
  const [placed, setPlaced] = useState<Placed[]>(INITIAL);
  const [vehicle, setVehicle] = useState(120);
  const [sel, setSel] = useState<number | null>(null);
  const [layers, setLayers] = useState({ hazards: true, limits: true, advisory: true, distance: true });
  const [addId, setAddId] = useState('RDM-013');
  const [addAt, setAddAt] = useState(800);

  const veh = pointAt(route, vehicle);
  const ahead = useMemo(() => placed.map((p) => ({ ...p, d: p.at - vehicle, entry: byId.get(p.id)! })).filter((p) => p.entry).sort((a, b) => a.d - b.d), [placed, vehicle, byId]);
  const upcoming = ahead.filter((p) => p.d >= 0);
  const next = upcoming[0];
  const posted = limitAt(vehicle);
  const selected = ahead.find((p) => p.uid === sel);

  const add = () => { setPlaced((l) => [...l, { uid: Date.now(), id: addId, at: addAt, side: l.length % 2 ? 1 : -1 }]); };

  return (
    <div>
      <PageHeader title="Map Preview" kicker="Simulated route geometry · no map API key required">
        Hazard markers, posted limits, advisory badges and live distance labels on a simulated route. Drag the vehicle along the route; distances, advisory speeds and the alert card update.
      </PageHeader>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-3 min-w-0">
          <div className="panel overflow-hidden">
            <svg viewBox="0 0 1000 640" className="block w-full" style={{ background: tokens.backgrounds.map }}>
              {/* city blocks */}
              {Array.from({ length: 11 }).map((_, i) => Array.from({ length: 7 }).map((__, j) => (
                <rect key={`${i}-${j}`} x={i * 92 + 8} y={j * 92 + 8} width={76} height={76} rx={6} fill="#121c27" />
              )))}
              <path d="M0 470 C200 430 320 520 520 470 S820 380 1000 430" fill="none" stroke="#123049" strokeWidth="26" />
              <rect x="430" y="380" width="160" height="150" rx="10" fill="#10261c" />
              <path d="M0 200 H1000 M460 0 V640 M820 0 V640 M0 380 H1000" stroke="#1b2733" strokeWidth="10" fill="none" />
              {/* route */}
              <path d={subPath(route, 0, LEN)} fill="none" stroke="#0a0f15" strokeWidth="16" strokeLinejoin="round" strokeLinecap="round" />
              <path d={subPath(route, 0, vehicle)} fill="none" stroke="#3a4a5a" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />
              <path d={subPath(route, vehicle, LEN)} fill="none" stroke="#4C8DF6" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />
              {/* speed zones */}
              {layers.limits && SPEED_ZONES.map((z) => {
                const p = pointAt(route, z.from + 15);
                return <g key={z.from} transform={`translate(${p.x - p.nx * 34} ${p.y - p.ny * 34}) scale(0.8)`} dangerouslySetInnerHTML={{ __html: speedBadgeSvg({ kind: 'posted', valueKmh: z.limit, unit: 'kmh' }, 0, 0) }} />;
              })}
              {/* hazards */}
              {layers.hazards && ahead.map((h) => {
                const p = pointAt(route, h.at);
                const passed = h.d < 0;
                const ox = p.x + p.nx * 56 * h.side, oy = p.y + p.ny * 56 * h.side;
                const adv = layers.advisory && !passed && h.d < 700 ? computeAdvisory(h.entry, h.severity ?? h.entry.severity.default, limitAt(h.at), 0.85) : null;
                const svg = composeIcon({
                  entry: h.entry, severity: h.severity, variant: h.variant, representation: 'auto',
                  distanceM: layers.distance && !passed ? h.d : null, speed: adv ? { kind: 'advisory', valueKmh: adv.valueKmh, unit: 'kmh' } : null,
                }).svg;
                return (
                  <g key={h.uid} opacity={passed ? 0.3 : 1} onClick={() => setSel(h.uid)} style={{ cursor: 'pointer' }}>
                    <line x1={p.x} y1={p.y} x2={ox} y2={oy} stroke={tokens.severity[h.severity ?? h.entry.severity.default].color} strokeWidth="2" />
                    <circle cx={p.x} cy={p.y} r="6" fill={tokens.severity[h.severity ?? h.entry.severity.default].color} stroke="#0a0f15" strokeWidth="2" />
                    <svg x={ox - 30} y={oy - 30} width="60" height="60" viewBox="0 0 128 128" dangerouslySetInnerHTML={{ __html: svg.replace(/^<svg[^>]*>|<\/svg>$/g, '') }} />
                    {sel === h.uid && <rect x={ox - 33} y={oy - 33} width="66" height="66" rx="10" fill="none" stroke="#fff" strokeWidth="2" strokeDasharray="4 3" />}
                  </g>
                );
              })}
              {/* vehicle */}
              <g transform={`translate(${veh.x} ${veh.y}) rotate(${(veh.angle * 180) / Math.PI})`}>
                <circle r="16" fill="#4C8DF6" opacity="0.25" />
                <path d="M12 0L-8 -9L-4 0L-8 9Z" fill="#fff" stroke="#4C8DF6" strokeWidth="2" strokeLinejoin="round" />
              </g>
            </svg>
          </div>
          <div className="panel flex flex-wrap items-center gap-4 p-3">
            <div className="flex-1 min-w-[220px]"><Field label={`Vehicle position · ${vehicle} m of ${LEN} m`}><input type="range" min={0} max={LEN} className="w-full" value={vehicle} onChange={(e) => setVehicle(Number(e.target.value))} /></Field></div>
            {(Object.keys(layers) as (keyof typeof layers)[]).map((k) => (
              <label key={k} className="chip cursor-pointer text-dim"><input type="checkbox" checked={layers[k]} onChange={(e) => setLayers({ ...layers, [k]: e.target.checked })} /> {k}</label>
            ))}
          </div>
        </div>

        <div className="space-y-4 min-w-0">
          <div className="rounded-2xl bg-[radial-gradient(ellipse_at_top,#1b2a3a,#070b10)] p-3">
            {next ? (
              <NavAlertCard entry={next.entry} severity={next.severity} distanceM={next.d} posted={posted}
                advisory={computeAdvisory(next.entry, next.severity ?? next.entry.severity.default, posted, 0.85)?.valueKmh ?? null} compact />
            ) : <div className="p-4 text-sm text-slate-400">No hazards ahead.</div>}
          </div>

          {selected && (
            <div className="panel p-3">
              <div className="mb-2 flex items-center gap-3">
                <SvgIcon svg={composeIcon({ entry: selected.entry, severity: selected.severity }).svg} size={56} />
                <div className="min-w-0"><div className="mono text-faint">{selected.entry.id}</div><div className="font-medium text-white truncate">{selected.entry.name}</div>
                  <div className="text-xs text-dim">{selected.d >= 0 ? `${formatDistance(selected.d)} ahead` : 'passed'} · zone limit {limitAt(selected.at) ?? 'unknown'} km/h</div></div>
              </div>
              <div className="flex gap-2"><Link className="btn text-xs" to={`/item/${selected.entry.id}`}>Detail</Link><button className="btn text-xs" onClick={() => { setPlaced((l) => l.filter((p) => p.uid !== selected.uid)); setSel(null); }}><Trash2 size={13} /> Remove</button></div>
            </div>
          )}

          <div className="panel">
            <div className="panel-head"><span className="label">Upcoming ({upcoming.length})</span><span className="text-xs text-dim">Posted: {posted ?? '—'} km/h</span></div>
            <ul className="scroll-thin max-h-72 divide-y divide-line overflow-auto">
              {upcoming.map((h) => (
                <li key={h.uid}><button className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-panel2" onClick={() => setSel(h.uid)}>
                  <SvgIcon svg={composeIcon({ entry: h.entry, severity: h.severity, showSeverityCode: false }).svg} size={32} />
                  <span className="min-w-0 flex-1 truncate text-sm">{h.entry.name}</span>
                  <SeverityBadge level={h.severity ?? h.entry.severity.default} />
                  <span className="w-16 text-right text-xs tabular-nums text-dim">{formatDistance(h.d)}</span>
                </button></li>
              ))}
            </ul>
          </div>

          <div className="panel space-y-3 p-3">
            <div className="label">Add catalogue element to route</div>
            <select className="input" value={addId} onChange={(e) => setAddId(e.target.value)}>
              {families.map((f) => <optgroup key={f.id} label={f.label}>{entries.filter((e) => e.family === f.id).map((e) => <option key={e.id} value={e.id}>{e.id} · {e.name}</option>)}</optgroup>)}
            </select>
            <Field label={`Position · ${addAt} m`}><input type="range" min={0} max={LEN} step={10} className="w-full" value={addAt} onChange={(e) => setAddAt(Number(e.target.value))} /></Field>
            <button className="btn-primary w-full justify-center" onClick={add}><Plus size={14} /> Add to route</button>
          </div>
        </div>
      </div>
    </div>
  );
}
