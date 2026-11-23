import { useState } from 'react';
import { displaySpeed, formatDistance, speedBadgeSvg, type SpeedBadge, type SpeedUnit } from '../icons/compose';
import { Field, PageHeader, Seg, SvgIcon } from '../components/ui';
import { tokens } from '../tokens';

const badge = (b: SpeedBadge, size = 140) => <SvgIcon svg={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-24 -24 48 48" width="48" height="48">${speedBadgeSvg(b, 0, 0)}</svg>`} size={size} />;

type Source = 'sign_detection' | 'map_data' | 'authority_feed' | 'none';
const SOURCE_LABEL: Record<Source, string> = { sign_detection: 'Sign detected by camera', map_data: 'Map data', authority_feed: 'Authority feed', none: 'No source' };

export function Instrument({ speedKmh, postedKmh, unit, size = 'lg' }: { speedKmh: number; postedKmh: number | null; unit: SpeedUnit; size?: 'lg' | 'sm' }) {
  const over = postedKmh != null && speedKmh > postedKmh + 2;
  const max = 140;
  const frac = Math.min(1, speedKmh / max);
  const a0 = Math.PI * 0.75, a1 = a0 + Math.PI * 1.5 * frac;
  const r = 70, cx = 90, cy = 90;
  const arc = `M${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A${r} ${r} 0 ${frac > 2 / 3 ? 1 : 0} 1 ${cx + r * Math.cos(a1)} ${cy + r * Math.sin(a1)}`;
  const full = `M${cx + r * Math.cos(a0)} ${cy + r * Math.sin(a0)} A${r} ${r} 0 1 1 ${cx + r * Math.cos(a0 + Math.PI * 1.5)} ${cy + r * Math.sin(a0 + Math.PI * 1.5)}`;
  const w = size === 'lg' ? 220 : 130;
  return (
    <svg viewBox="0 0 180 170" width={w} height={(w * 170) / 180} aria-label="Current vehicle speed">
      <path d={full} fill="none" stroke="#1E2A36" strokeWidth="10" strokeLinecap="round" />
      {frac > 0 && <path d={arc} fill="none" stroke={over ? tokens.severity.S4.color : '#4C8DF6'} strokeWidth="10" strokeLinecap="round" />}
      <text x="90" y="92" textAnchor="middle" dominantBaseline="central" fontSize={tokens.typography.instrumentSize * 0.78} fontWeight="800" fill={over ? tokens.severity.S4.color : '#F2F5F7'} fontFamily={tokens.typography.numeralFamily}>{displaySpeed(speedKmh, unit)}</text>
      <text x="90" y="135" textAnchor="middle" fontSize="14" fill="#8EA0B0" fontFamily={tokens.typography.family}>{unit === 'mph' ? 'mph' : 'km/h'}</text>
    </svg>
  );
}

export default function SpeedSystem() {
  const [unit, setUnit] = useState<SpeedUnit>('kmh');
  const [posted, setPosted] = useState(60);
  const [known, setKnown] = useState(true);
  const [source, setSource] = useState<Source>('sign_detection');
  const [advisory, setAdvisory] = useState(25);
  const [advConf, setAdvConf] = useState(0.78);
  const [current, setCurrent] = useState(48);
  const [changeTo, setChangeTo] = useState(40);
  const [changeDist, setChangeDist] = useState(350);

  const postedBadge: SpeedBadge = known ? { kind: 'posted', valueKmh: posted, unit } : { kind: 'unknown', valueKmh: null, unit };

  return (
    <div className="space-y-8">
      <PageHeader title="Speed Information System" kicker="Three independent speed types"
        actions={<Seg value={unit} onChange={setUnit} options={[{ value: 'kmh', label: 'km/h (primary)' }, { value: 'mph', label: 'mph' }]} />}>
        Posted legal speed, RoadOS advisory speed and current vehicle speed are separate data with separate visual forms. RVHL never assigns a speed limit to a hazard automatically,
        and a calculated advisory speed is never displayed as a legal limit.
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="panel flex flex-col">
          <div className="panel-head"><span className="font-semibold text-white">Posted legal speed</span><span className="chip text-dim">Regulatory circle</span></div>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">{badge(postedBadge)}
            <div className="text-xs text-dim">{known ? `Source: ${SOURCE_LABEL[source]}` : 'Speed limit unknown — no value is guessed'}</div>
          </div>
          <div className="space-y-3 border-t border-line p-4">
            <Field label="Limit known?"><Seg value={known ? 'y' : 'n'} onChange={(v) => setKnown(v === 'y')} options={[{ value: 'y', label: 'Known' }, { value: 'n', label: 'Unknown' }]} /></Field>
            {known && <Field label={`Posted limit · ${posted} km/h`}><input type="range" min={10} max={120} step={10} className="w-full" value={posted} onChange={(e) => setPosted(Number(e.target.value))} /></Field>}
            <Field label="Source">
              <select className="input" value={source} onChange={(e) => setSource(e.target.value as Source)}>{(Object.keys(SOURCE_LABEL) as Source[]).map((s) => <option key={s} value={s}>{SOURCE_LABEL[s]}</option>)}</select>
            </Field>
          </div>
        </div>

        <div className="panel flex flex-col">
          <div className="panel-head"><span className="font-semibold text-white">Advisory speed</span><span className="chip border-s2/50 text-s2">RoadOS badge</span></div>
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6">{badge({ kind: 'advisory', valueKmh: advisory, unit })}
            <div className="text-xs text-dim">Confidence {Math.round(advConf * 100)}% · recommendation, not a limit</div>
          </div>
          <div className="space-y-3 border-t border-line p-4">
            <Field label={`Advisory · ${advisory} km/h`}><input type="range" min={5} max={80} step={5} className="w-full" value={advisory} onChange={(e) => setAdvisory(Number(e.target.value))} /></Field>
            <Field label={`Advisory confidence · ${Math.round(advConf * 100)}%`}><input type="range" min={0} max={1} step={0.01} className="w-full" value={advConf} onChange={(e) => setAdvConf(Number(e.target.value))} /></Field>
            {known && advisory >= posted && <div className="text-xs text-s2">Advisory ≥ posted limit — RoadOS suppresses the advisory badge in this case.</div>}
          </div>
        </div>

        <div className="panel flex flex-col">
          <div className="panel-head"><span className="font-semibold text-white">Current vehicle speed</span><span className="chip text-dim">Instrument</span></div>
          <div className="flex flex-1 items-center justify-center p-4"><Instrument speedKmh={current} postedKmh={known ? posted : null} unit={unit} /></div>
          <div className="space-y-3 border-t border-line p-4">
            <Field label={`Vehicle speed · ${current} km/h`} hint="From vehicle bus or GNSS. Turns S4 colour when above a known posted limit."><input type="range" min={0} max={140} className="w-full" value={current} onChange={(e) => setCurrent(Number(e.target.value))} /></Field>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><span className="font-semibold text-white">Speed-limit change ahead</span></div>
        <div className="grid gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-wrap items-center justify-center gap-6 rounded-xl bg-[radial-gradient(ellipse_at_top,#1b2a3a,#070b10)] p-6">
            <div className="flex flex-col items-center gap-1">{badge(postedBadge, 92)}<span className="text-[11px] text-slate-400">current</span></div>
            <svg width="70" height="20" viewBox="0 0 70 20"><path d="M2 10h56" stroke="#5D6F80" strokeWidth="3" strokeDasharray="5 4" /><path d="M56 3l12 7-12 7z" fill="#5D6F80" /></svg>
            <div className="flex flex-col items-center gap-1">{badge({ kind: 'posted', valueKmh: changeTo, unit }, 92)}<span className="text-[11px] text-slate-400">in {formatDistance(changeDist, unit === 'mph' ? 'imperial' : 'metric')}</span></div>
            <div className="w-full max-w-md rounded-xl border border-white/10 bg-black/50 px-4 py-3">
              <div className="flex items-center gap-3">
                <SvgIcon svg={`<svg xmlns="http://www.w3.org/2000/svg" viewBox="-24 -24 48 48" width="48" height="48">${speedBadgeSvg({ kind: 'posted', valueKmh: changeTo, unit }, 0, 0)}</svg>`} size={48} />
                <div><div className="text-[11px] uppercase tracking-widest text-slate-400">Limit changes ahead</div>
                  <div className="text-2xl font-bold text-white" style={{ fontFamily: tokens.typography.numeralFamily }}>{formatDistance(changeDist, unit === 'mph' ? 'imperial' : 'metric')}</div></div>
                <div className="ml-auto text-right text-[11px] text-slate-400">{SOURCE_LABEL[source]}</div>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded bg-white/10"><div className="h-full bg-accent" style={{ width: `${100 - Math.min(100, (changeDist / 1000) * 100)}%` }} /></div>
            </div>
          </div>
          <div className="space-y-3">
            <Field label={`New limit · ${changeTo} km/h`}><input type="range" min={10} max={120} step={10} className="w-full" value={changeTo} onChange={(e) => setChangeTo(Number(e.target.value))} /></Field>
            <Field label={`Distance to change · ${changeDist} m`}><input type="range" min={0} max={1000} step={10} className="w-full" value={changeDist} onChange={(e) => setChangeDist(Number(e.target.value))} /></Field>
          </div>
        </div>
      </div>

      <div className="panel p-4 text-sm text-dim">
        <div className="label mb-2">Rules</div>
        <ul className="list-disc space-y-1 pl-5">
          <li>Posted limits come only from sign detection, map data or authority feeds; the source is always recorded.</li>
          <li>When no source exists the limit is shown as <b className="text-text">unknown</b> — never estimated.</li>
          <li>Hazards never receive a legal limit. Elements that define a limit (e.g. RSG-009, MRK-014) carry it as their own legend.</li>
          <li>Advisory speeds use a distinct rounded-rectangle badge labelled ADV, carry a confidence value and are suppressed when ≥ the posted limit.</li>
          <li>Values are stored in km/h; mph is a display conversion only.</li>
        </ul>
      </div>
    </div>
  );
}
