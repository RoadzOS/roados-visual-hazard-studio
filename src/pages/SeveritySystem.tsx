import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SEVERITY_LEVELS } from '../catalogue/schema';
import { useCatalogue } from '../state/catalogue';
import { computeAdvisory, computeSeverity, defaultContext, stoppingDistanceM, type SeverityContext } from '../engine/severity';
import { composeIcon } from '../icons/compose';
import { Field, PageHeader, Seg, SeverityBadge, SvgIcon } from '../components/ui';
import { tokens } from '../tokens';

const MEANING: Record<string, string> = {
  S1: 'Awareness only. No action expected; supports orientation and trust.',
  S2: 'Minor caution. Driver may adjust lane position or speed slightly.',
  S3: 'Moderate caution. Clear speed reduction or path change expected.',
  S4: 'High danger. Likely vehicle damage or loss of control if not handled.',
  S5: 'Critical danger. Risk of serious injury; immediate action required.',
};

export default function SeveritySystem() {
  const { entries, byId, families } = useCatalogue();
  const [id, setId] = useState('RDM-002');
  const [c, setC] = useState<SeverityContext>(defaultContext);
  const entry = byId.get(id) ?? entries[0];
  const r = computeSeverity(entry, c);
  const adv = computeAdvisory(entry, r.level, 60, c.confidence);
  const set = <K extends keyof SeverityContext>(k: K, v: SeverityContext[K]) => setC((x) => ({ ...x, [k]: v }));
  const uses = (f: string) => entry.severity.factors.includes(f as never);

  return (
    <div className="space-y-8">
      <PageHeader title="Severity System" kicker="RoadOS proposal · S1–S5">
        Five severity levels describe the potential consequence of a hazard. Each element has a default level and, when dynamic, is re-rated from
        context factors. <b className="text-text">Severity is independent of detection confidence</b> — confidence only decides whether a hazard is shown or alerted.
        These levels are RoadOS proposals, not an official international classification.
      </PageHeader>

      <div className="grid gap-3 md:grid-cols-5">
        {SEVERITY_LEVELS.map((s) => {
          const t = tokens.severity[s];
          const sample = byId.get('RDM-003')!;
          return (
            <div key={s} className="panel overflow-hidden">
              <div className="flex items-center justify-between p-3" style={{ background: t.color, color: t.onColor }}>
                <span className="text-xl font-black">{s}</span><span className="mono font-bold">{t.color}</span>
              </div>
              <div className="space-y-2 p-3">
                <div className="font-semibold text-white">{t.label}</div>
                <p className="text-xs leading-relaxed text-dim">{MEANING[s]}</p>
                <div className="flex justify-center pt-1"><SvgIcon svg={composeIcon({ entry: sample, severity: s }).svg} size={72} /></div>
                <div className="text-center text-[11px] text-faint">{entries.filter((e) => e.severity.default === s).length} elements default to {s}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel">
        <div className="panel-head"><span className="font-semibold text-white">Dynamic severity calculator</span><span className="text-xs text-faint">Only the factors declared for the element are applied</span></div>
        <div className="grid gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Element">
              <select className="input" value={entry.id} onChange={(e) => setId(e.target.value)}>
                {families.filter((f) => f.dynamicSeverity).map((f) => (
                  <optgroup key={f.id} label={f.label}>{entries.filter((e) => e.family === f.id).map((e) => <option key={e.id} value={e.id}>{e.id} · {e.name}</option>)}</optgroup>
                ))}
              </select>
            </Field>
            <Field label={`Approach speed · ${c.approachSpeedKmh} km/h`} hint={!uses('approach_speed') ? 'Not a factor for this element' : undefined}>
              <input type="range" min={10} max={120} step={5} className="w-full" value={c.approachSpeedKmh} onChange={(e) => set('approachSpeedKmh', Number(e.target.value))} />
            </Field>
            <Field label={`Distance · ${c.distanceM} m`} hint={`Stopping distance at this speed ≈ ${Math.round(stoppingDistanceM(c.approachSpeedKmh, c.surface))} m (${c.surface})`}>
              <input type="range" min={10} max={500} step={10} className="w-full" value={c.distanceM} onChange={(e) => set('distanceM', Number(e.target.value))} />
            </Field>
            <Field label="Physical size"><Seg value={c.physicalSize} onChange={(v) => set('physicalSize', v)} options={[{ value: 'small', label: 'Small' }, { value: 'medium', label: 'Medium' }, { value: 'large', label: 'Large' }]} /></Field>
            <Field label="Height / depth"><Seg value={c.heightOrDepth} onChange={(v) => set('heightOrDepth', v)} options={[{ value: 'low', label: 'Low' }, { value: 'moderate', label: 'Moderate' }, { value: 'high', label: 'High' }]} /></Field>
            <Field label="Lane position"><Seg value={c.lanePosition} onChange={(v) => set('lanePosition', v)} options={[{ value: 'in_path', label: 'In path' }, { value: 'adjacent_lane', label: 'Adjacent' }, { value: 'shoulder', label: 'Shoulder' }, { value: 'off_road', label: 'Off road' }]} /></Field>
            <Field label="Visibility"><Seg value={c.visibility} onChange={(v) => set('visibility', v)} options={[{ value: 'good', label: 'Good' }, { value: 'reduced', label: 'Reduced' }, { value: 'poor', label: 'Poor' }]} /></Field>
            <Field label="Surface"><Seg value={c.surface} onChange={(v) => set('surface', v)} options={[{ value: 'dry', label: 'Dry' }, { value: 'wet', label: 'Wet' }, { value: 'loose', label: 'Loose' }, { value: 'flooded', label: 'Flooded' }]} /></Field>
            <Field label="Traffic density"><Seg value={c.trafficDensity} onChange={(v) => set('trafficDensity', v)} options={[{ value: 'free', label: 'Free' }, { value: 'moderate', label: 'Moderate' }, { value: 'heavy', label: 'Heavy' }]} /></Field>
            <Field label="Vehicle type"><Seg value={c.vehicleType} onChange={(v) => set('vehicleType', v)} options={[{ value: 'two_wheeler', label: '2-wheeler' }, { value: 'car', label: 'Car' }, { value: 'bus', label: 'Bus' }, { value: 'truck', label: 'Truck' }]} /></Field>
            <Field label={`Detection confidence · ${Math.round(c.confidence * 100)}%`} hint="Does not change severity. Gates display and alerting only.">
              <input type="range" min={0} max={1} step={0.05} className="w-full" value={c.confidence} onChange={(e) => set('confidence', Number(e.target.value))} />
            </Field>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-4 rounded-xl bg-base p-4">
              <SvgIcon svg={composeIcon({ entry, severity: r.level, distanceM: c.distanceM, speed: adv ? { kind: 'advisory', valueKmh: adv.valueKmh, unit: 'kmh' } : null }).svg} size={128} />
              <div>
                <div className="text-xs text-faint">Default</div><SeverityBadge level={r.base} label />
                <div className="mt-2 text-xs text-faint">Dynamic result</div><SeverityBadge level={r.level} label />
                <div className="mt-2 text-xs text-dim">Δ {r.delta >= 0 ? '+' : ''}{r.delta} (clamped to ±2)</div>
              </div>
            </div>
            <div className="rounded-xl border border-line p-3">
              <div className="label mb-2">Applied factors</div>
              {r.reasons.length ? (
                <ul className="space-y-1 text-sm">{r.reasons.map((x) => <li key={x.factor} className="flex justify-between gap-2"><span className="text-dim">{x.text}</span><span className={x.effect > 0 ? 'text-s4' : 'text-ok'}>{x.effect > 0 ? '+' : ''}{x.effect}</span></li>)}</ul>
              ) : <div className="text-sm text-faint">{entry.severity.dynamic ? 'No factor changes the default in this context.' : 'This element has fixed severity.'}</div>}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className={`rounded-lg border p-2 ${r.display ? 'border-ok/50 text-ok' : 'border-line text-faint'}`}>Display: {r.display ? 'yes' : 'no'} <span className="block text-[11px] text-faint">≥ {Math.round(entry.confidence.minimumToDisplay * 100)}%</span></div>
              <div className={`rounded-lg border p-2 ${r.alert ? 'border-s4/60 text-s4' : 'border-line text-faint'}`}>Alert: {r.alert ? 'yes' : 'no'} <span className="block text-[11px] text-faint">≥ {Math.round(entry.confidence.minimumToAlert * 100)}%</span></div>
            </div>
            <div className="rounded-lg border border-line p-3 text-xs text-dim">
              Advisory proposal at posted 60 km/h: {adv ? <b className="text-s2">{adv.valueKmh} km/h advisory (confidence {Math.round(adv.confidence * 100)}%)</b> : <span>none</span>}. Advisory speeds are RoadOS recommendations and are never displayed as a legal limit.
            </div>
            <Link to={`/item/${entry.id}`} className="text-xs text-accent2">Open {entry.id} detail →</Link>
          </div>
        </div>
      </div>

      <div className="panel p-4 text-sm text-dim">
        <div className="label mb-2">Model (RVHL 1.0 proposal)</div>
        <ul className="list-disc space-y-1 pl-5">
          <li>Start from the element's default severity.</li>
          <li>Each declared factor contributes −2…+2 (lane off-path lowers; high speed, poor visibility, low grip, two-wheelers and short distance raise).</li>
          <li>Net change is clamped to ±2 levels and to the S1–S5 range.</li>
          <li>Confidence thresholds (per element) decide display and alerting; they never modify severity.</li>
          <li>Advisory speed is derived from the resulting level ({Object.entries({ S2: 40, S3: 30, S4: 20, S5: 10 }).map(([k, v]) => `${k}→${v}`).join(', ')} km/h) and capped by the posted limit.</li>
        </ul>
      </div>
    </div>
  );
}
