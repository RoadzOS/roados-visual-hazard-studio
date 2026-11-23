import { useEffect, useMemo, useRef, useState } from 'react';
import { Pause, Play, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { SEVERITY_LEVELS, type CatalogueEntry, type Severity } from '../catalogue/schema';
import { useCatalogue } from '../state/catalogue';
import { composeIcon, formatDistance, speedBadgeSvg } from '../icons/compose';
import { computeAdvisory, stoppingDistanceM } from '../engine/severity';
import { Field, PageHeader, Seg, SeverityBadge, SvgIcon } from '../components/ui';
import { NavAlertCard } from '../components/NavAlertCard';
import { Instrument } from './SpeedSystem';
import { tokens } from '../tokens';

// ---- Perspective model ----
const W = 1280, HOR = 250, BOT = 720, CX = 640, K = 110, D0 = 24, LANE = 3.5, LANES = 3, HALF = (LANE * LANES) / 2;
const TRACK = 2400; // metres, loops
const VIEW = 380;
const ZS = [0, 1, 2, 3, 5, 7, 10, 14, 19, 25, 32, 40, 50, 62, 76, 92, 110, 130, 155, 185, 220, 260, 300, 340, 380];
const sc = (z: number) => D0 / (Math.max(z, -D0 * 0.4) + D0);
const yz = (z: number) => HOR + (BOT - HOR) * sc(z);

type LanePos = 0 | 1 | 2 | 'all' | 'left_edge' | 'right_edge';
interface Obj { uid: number; id: string; pos: number; lane: LanePos; severity?: Severity }

const laneLat = (l: LanePos) => (l === 'all' ? 0 : l === 'left_edge' ? -HALF + 0.6 : l === 'right_edge' ? HALF - 0.6 : -HALF + LANE / 2 + (l as number) * LANE);

const SCENARIO: Obj[] = [
  { uid: 1, id: 'RDM-003', pos: 90, lane: 1 },
  { uid: 2, id: 'SPD-005', pos: 230, lane: 'all' },
  { uid: 3, id: 'TMP-002', pos: 380, lane: 2 },
  { uid: 4, id: 'TMP-004', pos: 420, lane: 2 },
  { uid: 5, id: 'MOV-013', pos: 560, lane: 0 },
  { uid: 6, id: 'GEO-002', pos: 700, lane: 'right_edge' },
  { uid: 7, id: 'ENV-002', pos: 860, lane: 'all' },
  { uid: 8, id: 'DEB-003', pos: 1010, lane: 1 },
  { uid: 9, id: 'MOV-001', pos: 1150, lane: 'left_edge' },
  { uid: 10, id: 'INF-003', pos: 1260, lane: 'left_edge' },
  { uid: 11, id: 'GEO-003', pos: 1400, lane: 'left_edge' },
  { uid: 12, id: 'ENV-013', pos: 1560, lane: 'all' },
  { uid: 13, id: 'RDM-013', pos: 1700, lane: 2 },
  { uid: 14, id: 'MOV-015', pos: 1880, lane: 1 },
  { uid: 15, id: 'SPD-009', pos: 2050, lane: 'all' },
];
const ZONES = [{ from: 0, limit: 50 }, { from: 600, limit: 40 }, { from: 1200, limit: 60 }, { from: 1900, limit: 40 }];
const limitAt = (m: number) => [...ZONES].reverse().find((z) => ((m % TRACK) + TRACK) % TRACK >= z.from)!.limit;

const BAND = new Set(['speed_breaker', 'rumble_strips', 'raised_crossing', 'speed_cushion', 'step_up', 'railway_hump', 'mk_zebra', 'ped_crossing', 'mk_rumble', 'rail_track', 'expansion_joint']);
const WATER = new Set(['water', 'flood', 'flowing_water', 'depression']);
const HOLE = new Set(['pothole', 'manhole', 'open_drain', 'drain_cover', 'excavation', 'subsidence', 'road_collapse', 'broken_asphalt', 'cracks']);
const CURVE = new Set(['curve', 'hairpin', 's_bend']);
const HAZE = new Set(['fog', 'smoke', 'dust']);
const CONES = new Set(['cone', 'lane_closure']);

export default function CorridorPreview() {
  const { byId, entries, families } = useCatalogue();
  const [objs, setObjs] = useState<Obj[]>(SCENARIO);
  const [sim, setSim] = useState({ t: 0, v: 45 });
  const [target, setTarget] = useState(45);
  const [playing, setPlaying] = useState(true);
  const [follow, setFollow] = useState(true);
  const [ins, setIns] = useState<{ id: string; dist: number; lane: LanePos; sev: Severity | 'default' }>({ id: 'RDM-005', dist: 120, lane: 1, sev: 'default' });
  const raf = useRef<number>();
  const last = useRef<number>();

  const list = useMemo(() => objs.map((o) => ({ ...o, entry: byId.get(o.id) })).filter((o): o is Obj & { entry: CatalogueEntry } => !!o.entry), [objs, byId]);
  const sprites = useMemo(() => new Map(list.map((o) => [o.uid, composeIcon({ entry: o.entry, severity: o.severity, representation: 'roados', showSeverityCode: false }).svg.replace(/^<svg[^>]*>|<\/svg>$/g, '')])), [list]);

  // distance ahead with looping track
  const ahead = (pos: number, t: number) => { let d = (pos - (t % TRACK)) % TRACK; if (d < -40) d += TRACK; return d; };
  const visible = list.map((o) => ({ ...o, z: ahead(o.pos, sim.t) })).filter((o) => o.z > -8 && o.z < VIEW).sort((a, b) => b.z - a.z);
  const nextHaz = list.map((o) => ({ ...o, z: ahead(o.pos, sim.t) })).filter((o) => o.z > 2 && o.entry.family !== 'road_infrastructure').sort((a, b) => a.z - b.z)[0];
  const posted = limitAt(sim.t);
  const nextSev = nextHaz ? nextHaz.severity ?? nextHaz.entry.severity.default : null;
  const nextAdv = nextHaz && nextSev ? computeAdvisory(nextHaz.entry, nextSev, posted, 0.85) : null;

  // Live values for the animation loop (kept in refs so the loop is not restarted every frame).
  const live = useRef({ target, follow, posted, nextZ: nextHaz?.z ?? Infinity, nextAdv: nextAdv?.valueKmh ?? null });
  live.current = { target, follow, posted, nextZ: nextHaz?.z ?? Infinity, nextAdv: nextAdv?.valueKmh ?? null };

  useEffect(() => {
    if (!playing) { last.current = undefined; return; }
    const step = (ts: number) => {
      const dt = last.current ? Math.min(0.05, (ts - last.current) / 1000) : 0;
      last.current = ts;
      setSim(({ t, v }) => {
        const L = live.current;
        let goal = Math.min(L.target, L.posted);
        if (L.follow && L.nextAdv != null && L.nextZ < stoppingDistanceM(v) * 1.4 + 40) goal = Math.min(goal, L.nextAdv);
        const dv = goal - v;
        const rate = dv < 0 ? 14.4 : 7.2; // km/h per second (≈4 m/s² braking, 2 m/s² acceleration)
        const nv = v + Math.sign(dv) * Math.min(Math.abs(dv), rate * dt);
        return { t: t + (nv / 3.6) * dt, v: nv };
      });
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => { if (raf.current) cancelAnimationFrame(raf.current); };
  }, [playing]);

  // road bending from curve hazards
  const curves = list.filter((o) => CURVE.has(o.entry.visual.glyph)).map((o) => {
    const zc = ahead(o.pos, sim.t);
    const dir = o.entry.visual.glyphVariant === 'left' ? -1 : o.entry.visual.glyphVariant === 'right' ? 1 : 1;
    const amp = o.entry.visual.glyph === 'hairpin' ? 0.03 : 0.012;
    const fade = Math.max(0, Math.min(1, (zc + 60) / 60));
    return { zc, dir, amp, fade };
  });
  const bend = (z: number) => curves.reduce((s, c) => s + c.dir * c.amp * c.fade * Math.max(0, z - c.zc) ** 2, 0);
  const X = (z: number, lat: number) => CX + (lat + bend(z)) * K * sc(z);
  const pt = (z: number, lat: number) => `${X(z, lat).toFixed(1)},${yz(z).toFixed(1)}`;
  const quad = (z0: number, z1: number, l0: number, l1: number) => `${pt(z0, l0)} ${pt(z0, l1)} ${pt(z1, l1)} ${pt(z1, l0)}`;
  const strip = (lat: number, w: number) => ZS.map((z) => pt(z, lat - w)).join(' ') + ' ' + [...ZS].reverse().map((z) => pt(z, lat + w)).join(' ');

  const road = ZS.map((z) => pt(z, -HALF - 0.3)).join(' ') + ' ' + [...ZS].reverse().map((z) => pt(z, HALF + 0.3)).join(' ');
  const shoulderL = ZS.map((z) => pt(z, -HALF - 3)).join(' ') + ' ' + [...ZS].reverse().map((z) => pt(z, -HALF - 0.3)).join(' ');
  const shoulderR = ZS.map((z) => pt(z, HALF + 0.3)).join(' ') + ' ' + [...ZS].reverse().map((z) => pt(z, HALF + 3)).join(' ');
  const phase = sim.t % 12;
  const dashes: string[] = [];
  for (let k = 0; k < 32; k++) {
    const z0 = k * 12 - phase, z1 = z0 + 4.5;
    if (z1 < 0 || z0 > VIEW) continue;
    for (let i = 1; i < LANES; i++) dashes.push(quad(Math.max(0, z0), z1, -HALF + i * LANE - 0.08, -HALF + i * LANE + 0.08));
  }
  const haze = list.filter((o) => HAZE.has(o.entry.visual.glyph)).map((o) => ahead(o.pos, sim.t)).filter((z) => z > -80 && z < 250)
    .reduce((m, z) => Math.max(m, z < 0 ? 0.55 * (1 + z / 80) : 0.55 * (1 - z / 250)), 0);

  const groundFor = (o: (typeof visible)[number]) => {
    const g = o.entry.visual.glyph, sev = o.severity ?? o.entry.severity.default, col = tokens.severity[sev].color;
    const lat = laneLat(o.lane), z = o.z;
    if (BAND.has(g)) {
      const l0 = o.lane === 'all' ? -HALF : lat - LANE / 2, l1 = o.lane === 'all' ? HALF : lat + LANE / 2;
      const parts = [];
      const n = 10;
      for (let i = 0; i < n; i++) parts.push(<polygon key={i} points={quad(z, z + 0.9, l0 + ((l1 - l0) * i) / n, l0 + ((l1 - l0) * (i + 1)) / n)} fill={i % 2 ? '#111' : g === 'mk_zebra' || g === 'ped_crossing' ? '#eee' : '#F2C230'} />);
      return <g>{parts}<polygon points={quad(z - 0.2, z + 1.1, l0, l1)} fill="none" stroke={col} strokeWidth={1.5} opacity={0.8} /></g>;
    }
    if (WATER.has(g) || (g === 'pothole' && o.entry.visual.glyphVariant === 'water_filled')) {
      const l0 = o.lane === 'all' ? -HALF - 0.5 : lat - LANE / 2, l1 = o.lane === 'all' ? HALF + 0.5 : lat + LANE / 2;
      return <polygon points={quad(z - 3, z + 8, l0, l1)} fill="#3FA9F5" opacity={0.45} stroke="#7cc4f8" strokeWidth={1} />;
    }
    if (HOLE.has(g)) {
      const w = g === 'pothole' ? (o.entry.visual.glyphVariant === 'large' || o.entry.visual.glyphVariant === 'deep' ? 1.3 : 0.8) : 1.1;
      const cx = X(z, lat), cy = yz(z), rx = w * K * sc(z), ry = Math.max(1.5, (yz(z - 0.7) - yz(z + 0.7)) / 2);
      return <g><ellipse cx={cx} cy={cy} rx={rx * 1.15} ry={ry * 1.4} fill={col} opacity={0.25} /><ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="#05080b" stroke="#596673" strokeWidth={1} /></g>;
    }
    if (CONES.has(g)) {
      const items = [];
      for (let i = 0; i < 5; i++) {
        const zz = z + i * 4, h = 0.75 * K * sc(zz), x = X(zz, lat - LANE / 2 + 0.3), y = yz(zz);
        if (zz > 0) items.push(<polygon key={i} points={`${x - h * 0.28},${y} ${x + h * 0.28},${y} ${x},${y - h}`} fill="#F26B1D" stroke="#fff" strokeWidth={Math.max(0.5, h * 0.06)} />);
      }
      return <g>{items}</g>;
    }
    return null;
  };

  const billboard = (o: (typeof visible)[number]) => {
    if (o.z < 1) return null;
    const lat = laneLat(o.lane);
    const size = Math.max(14, Math.min(150, 2.1 * K * sc(o.z)));
    const x = X(o.z, lat), y = yz(o.z);
    const lift = BAND.has(o.entry.visual.glyph) || WATER.has(o.entry.visual.glyph) || HOLE.has(o.entry.visual.glyph) ? size * 0.35 : size * 0.15;
    const sev = o.severity ?? o.entry.severity.default;
    return (
      <g opacity={o.z > VIEW - 60 ? (VIEW - o.z) / 60 : 1}>
        <line x1={x} y1={y} x2={x} y2={y - lift} stroke={tokens.severity[sev].color} strokeWidth={Math.max(1, size * 0.03)} />
        <svg x={x - size / 2} y={y - lift - size} width={size} height={size} viewBox="0 0 128 128" dangerouslySetInnerHTML={{ __html: sprites.get(o.uid) ?? '' }} />
        {o.z < 260 && size > 26 && (
          <g transform={`translate(${x} ${y - lift - size - 12})`}>
            <rect x={-30} y={-11} width={60} height={20} rx={10} fill="#070b10" stroke={tokens.severity[sev].color} strokeWidth={1.5} />
            <text textAnchor="middle" dominantBaseline="central" y={-0.5} fontSize={12} fontWeight={800} fill="#F2F5F7" fontFamily={tokens.typography.family}>{formatDistance(o.z)}</text>
          </g>
        )}
      </g>
    );
  };

  const insert = () => setObjs((l) => [...l, { uid: Date.now(), id: ins.id, pos: (sim.t % TRACK) + ins.dist, lane: ins.lane, severity: ins.sev === 'default' ? undefined : ins.sev }]);
  const badgeSvg = (kind: 'posted' | 'advisory', v: number) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-24 -24 48 48" width="48" height="48">${speedBadgeSvg({ kind, valueKmh: v, unit: 'kmh' }, 0, 0)}</svg>`;

  return (
    <div>
      <PageHeader title="Forward Corridor Preview" kicker="Automotive instrument-style perspective">
        A simulated forward view of the road ahead. Hazards are placed at real distances and lanes, rendered with RVHL icons, ground footprints and severity colour.
        With “Follow advisory” on, the simulated vehicle slows to the RoadOS advisory speed before hazards.
      </PageHeader>

      <div className="relative overflow-hidden rounded-2xl border border-line bg-black">
        <svg viewBox={`0 0 ${W} ${BOT}`} className="block w-full">
          <defs>
            <linearGradient id="cor-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#05080c" /><stop offset="1" stopColor="#132131" /></linearGradient>
            <linearGradient id="cor-ground" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0c141c" /><stop offset="1" stopColor="#060a0e" /></linearGradient>
            <linearGradient id="cor-road" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1a222b" /><stop offset="1" stopColor="#2a333d" /></linearGradient>
          </defs>
          <rect width={W} height={HOR} fill="url(#cor-sky)" />
          <rect y={HOR} width={W} height={BOT - HOR} fill="url(#cor-ground)" />
          {[-5, -4, -3, -2, -1, 1, 2, 3, 4, 5].map((i) => <line key={i} x1={CX} y1={HOR} x2={CX + i * 420} y2={BOT} stroke="#4C8DF6" strokeOpacity={0.06} />)}
          {[20, 50, 100, 200].map((z) => <g key={z}><line x1={0} x2={W} y1={yz(z)} y2={yz(z)} stroke="#4C8DF6" strokeOpacity={0.08} strokeDasharray="4 8" /><text x={12} y={yz(z) - 4} fontSize={11} fill="#5D6F80" fontFamily={tokens.typography.family}>{z} m</text></g>)}
          <polygon points={shoulderL} fill="#141b22" />
          <polygon points={shoulderR} fill="#141b22" />
          <polygon points={road} fill="url(#cor-road)" />
          <polygon points={strip(-HALF, 0.1)} fill="#d8d8d0" opacity={0.85} />
          <polygon points={strip(HALF, 0.1)} fill="#d8d8d0" opacity={0.85} />
          {dashes.map((p, i) => <polygon key={i} points={p} fill="#e9e9e2" opacity={0.85} />)}
          {visible.map((o) => <g key={`g${o.uid}`}>{groundFor(o)}</g>)}
          {visible.map((o) => <g key={`b${o.uid}`}>{billboard(o)}</g>)}
          {haze > 0 && <rect width={W} height={BOT} fill="#9aa7b3" opacity={haze} />}
          <path d={`M${CX - 380} ${BOT} Q${CX} ${BOT - 70} ${CX + 380} ${BOT}Z`} fill="#05080b" stroke="#1e2a36" />
        </svg>

        {/* HUD */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center p-3 md:p-5">
          {nextHaz && nextHaz.z < 450 && (
            <div className="w-full max-w-md scale-90 md:scale-100">
              <NavAlertCard entry={nextHaz.entry} severity={nextSev!} distanceM={nextHaz.z} advisory={nextAdv?.valueKmh ?? null} compact />
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute bottom-2 left-2 hidden rounded-2xl bg-black/60 p-2 sm:block md:bottom-4 md:left-4">
          <Instrument speedKmh={Math.round(sim.v)} postedKmh={posted} unit="kmh" size="sm" />
        </div>
        <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-2 rounded-2xl bg-black/60 p-2 md:bottom-5 md:right-5">
          <SvgIcon svg={badgeSvg('posted', posted)} size={56} />
          {nextAdv && nextHaz && nextHaz.z < 300 && <SvgIcon svg={badgeSvg('advisory', nextAdv.valueKmh)} size={56} />}
        </div>
      </div>

      <div className="mt-4 grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_360px]">
        <div className="panel space-y-4 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-primary" onClick={() => setPlaying((p) => !p)}>{playing ? <Pause size={14} /> : <Play size={14} />} {playing ? 'Pause' : 'Drive'}</button>
            <button className="btn" onClick={() => { setSim({ t: 0, v: target }); }}><RotateCcw size={14} /> Restart</button>
            <button className="btn" onClick={() => setObjs(SCENARIO)}>Reset scenario</button>
            <label className="chip cursor-pointer text-dim"><input type="checkbox" checked={follow} onChange={(e) => setFollow(e.target.checked)} /> Follow advisory</label>
          </div>
          <Field label={`Cruise target · ${target} km/h`} hint="Vehicle never exceeds the posted zone limit in this simulation.">
            <input type="range" min={0} max={100} step={5} className="w-full" value={target} onChange={(e) => setTarget(Number(e.target.value))} />
          </Field>
          <Field label={`Position · ${Math.round(sim.t % TRACK)} m of ${TRACK} m loop`}>
            <input type="range" min={0} max={TRACK} className="w-full" value={Math.round(sim.t % TRACK)} onChange={(e) => setSim((s) => ({ ...s, t: Number(e.target.value) }))} />
          </Field>
          <div className="text-xs text-dim">Posted zone limit: <b className="text-text">{posted} km/h</b> (simulated map data) · current speed {Math.round(sim.v)} km/h</div>
        </div>

        <div className="panel space-y-3 p-4">
          <div className="label">Insert catalogue element</div>
          <select className="input" value={ins.id} onChange={(e) => setIns({ ...ins, id: e.target.value })}>
            {families.map((f) => <optgroup key={f.id} label={f.label}>{entries.filter((e) => e.family === f.id).map((e) => <option key={e.id} value={e.id}>{e.id} · {e.name}</option>)}</optgroup>)}
          </select>
          <Field label={`Distance ahead · ${ins.dist} m`}><input type="range" min={20} max={380} step={10} className="w-full" value={ins.dist} onChange={(e) => setIns({ ...ins, dist: Number(e.target.value) })} /></Field>
          <Field label="Lane">
            <Seg value={String(ins.lane)} onChange={(v) => setIns({ ...ins, lane: (/^\d$/.test(v) ? Number(v) : v) as LanePos })}
              options={[{ value: 'left_edge', label: 'L edge' }, { value: '0', label: 'Lane 1' }, { value: '1', label: 'Lane 2' }, { value: '2', label: 'Lane 3' }, { value: 'right_edge', label: 'R edge' }, { value: 'all', label: 'All' }]} />
          </Field>
          <Field label="Severity">
            <Seg value={ins.sev} onChange={(v) => setIns({ ...ins, sev: v })} options={[{ value: 'default', label: 'Default' }, ...SEVERITY_LEVELS.map((s) => ({ value: s, label: s }))]} />
          </Field>
          <button className="btn-primary w-full justify-center" onClick={insert}><Plus size={14} /> Insert into road</button>
        </div>

        <div className="panel">
          <div className="panel-head"><span className="label">Scenario ({list.length})</span></div>
          <ul className="scroll-thin max-h-80 divide-y divide-line overflow-auto">
            {list.map((o) => ({ ...o, z: ahead(o.pos, sim.t) })).sort((a, b) => a.z - b.z).map((o) => (
              <li key={o.uid} className="flex items-center gap-2 px-3 py-1.5">
                <SvgIcon svg={composeIcon({ entry: o.entry, severity: o.severity, showSeverityCode: false }).svg} size={30} />
                <span className="min-w-0 flex-1 truncate text-sm">{o.entry.name}</span>
                <SeverityBadge level={o.severity ?? o.entry.severity.default} />
                <span className="w-14 text-right text-xs tabular-nums text-dim">{o.z >= 0 ? formatDistance(o.z) : 'passed'}</span>
                <button className="text-faint hover:text-s5" onClick={() => setObjs((l) => l.filter((x) => x.uid !== o.uid))} aria-label="Remove"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
