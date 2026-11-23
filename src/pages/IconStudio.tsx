import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ExternalLink, RotateCcw } from 'lucide-react';
import { SEVERITY_LEVELS, type Severity } from '../catalogue/schema';
import { useCatalogue } from '../state/catalogue';
import { composeIcon, resolveFrame, type Direction, type Representation, type SizeVariant, type SpeedKind, type SpeedUnit } from '../icons/compose';
import { GLYPHS } from '../icons/glyphs';
import { CodeBlock, Field, FRAME_LABEL, PageHeader, Seg, SeverityBadge, StatusBadge, SvgIcon } from '../components/ui';
import { DownloadControls } from '../components/DownloadControls';
import { tokens, type Theme } from '../tokens';

const BACKGROUNDS = {
  dark: { label: 'Dark UI', css: tokens.backgrounds.dark },
  light: { label: 'Light UI', css: tokens.backgrounds.light },
  map: { label: 'Night map', css: 'linear-gradient(135deg,#0e151d 0%,#13202c 50%,#0e151d 100%)' },
  asphalt: { label: 'Asphalt', css: 'repeating-linear-gradient(90deg,#2a3138 0 46%,#e9e9e2 46% 54%,#2a3138 54% 100%)' },
  checker: { label: 'Transparent', css: 'repeating-conic-gradient(#1c2632 0 25%, #141c26 0 50%) 0 0/16px 16px' },
} as const;
type BgKey = keyof typeof BACKGROUNDS;

export default function IconStudio() {
  const { entries, families, byId } = useCatalogue();
  const [params, setParams] = useSearchParams();
  const id = params.get('id') ?? 'RDM-003';
  const entry = byId.get(id) ?? entries[0];

  const [variant, setVariant] = useState<string>('');
  const [severity, setSeverity] = useState<Severity>(entry.severity.default);
  const [speedKind, setSpeedKind] = useState<SpeedKind | 'none'>('advisory');
  const [speed, setSpeed] = useState(20);
  const [unit, setUnit] = useState<SpeedUnit>('kmh');
  const [distOn, setDistOn] = useState(true);
  const [dist, setDist] = useState(200);
  const [direction, setDirection] = useState<Direction | 'none'>('none');
  const [laneMode, setLaneMode] = useState(false);
  const [lanes, setLanes] = useState(3);
  const [lane, setLane] = useState(1);
  const [count, setCount] = useState(1);
  const [size, setSize] = useState<SizeVariant | 'none'>('none');
  const [theme, setTheme] = useState<Theme>('dark');
  const [rep, setRep] = useState<Representation>('auto');
  const [bg, setBg] = useState<BgKey>('dark');

  useEffect(() => { setVariant(entry.visual.glyphVariant ?? ''); setSeverity(entry.severity.default); }, [entry]);

  const variantOptions = useMemo(() => {
    const g = GLYPHS[entry.visual.glyph]?.variants ?? [];
    return [...new Set([...entry.variants, ...g])];
  }, [entry]);

  const options = {
    variant: variant || null, severity, theme, representation: rep,
    speed: speedKind === 'none' ? null : { kind: speedKind, valueKmh: speedKind === 'unknown' ? null : unit === 'mph' ? speed * 1.609344 : speed, unit },
    distanceM: distOn ? (unit === 'mph' ? dist / 3.28084 : dist) : null,
    unitSystem: unit === 'mph' ? ('imperial' as const) : ('metric' as const),
    direction: !laneMode && direction !== 'none' ? direction : null,
    lane: laneMode ? { count: lanes, index: Math.min(lane, lanes - 1) } : null,
    count: count > 1 ? count : null,
    sizeVariant: size === 'none' ? null : size,
  };
  const composed = composeIcon({ entry, ...options });
  const plain = { variant: options.variant, severity, theme };
  const std = entry.standardFrame ? composeIcon({ entry, ...plain, representation: 'standard' }).svg : null;
  const ros = composeIcon({ entry, ...plain, representation: 'roados' }).svg;

  const meta = {
    spec: 'RVHL', version: entry.version, entry: entry.id, name: entry.name, standardStatus: entry.standardStatus,
    pictogram: { glyph: entry.visual.glyph, variant: options.variant, viewBox: tokens.icon.pictogramViewBox },
    frame: composed.frame, representation: composed.representation, theme,
    severity: { level: severity, color: tokens.severity[severity].color, label: tokens.severity[severity].label, proposal: true },
    speed: options.speed ? { ...options.speed, legal: options.speed.kind === 'posted', note: options.speed.kind === 'advisory' ? 'RoadOS advisory — not a legal limit' : undefined } : null,
    distance: options.distanceM != null ? { meters: Math.round(options.distanceM), display: options.unitSystem } : null,
    direction: options.direction, lane: options.lane, count: options.count, sizeVariant: options.sizeVariant,
    viewBox: tokens.icon.composedViewBox,
  };

  const reset = () => { setSpeedKind('none'); setDistOn(false); setDirection('none'); setLaneMode(false); setCount(1); setSize('none'); setSeverity(entry.severity.default); setRep('auto'); };

  return (
    <div>
      <PageHeader title="Icon Studio" kicker="Composition engine"
        actions={<><Link to={`/item/${entry.id}`} className="btn"><ExternalLink size={14} /> Detail page</Link><button className="btn" onClick={reset}><RotateCcw size={14} /> Reset adornments</button></>}>
        Compose any catalogue element with severity, speed, distance, direction and count. Icons are generated live from the master pictogram and design tokens — no combination is stored.
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-[300px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_380px]">
        {/* Controls */}
        <div className="panel space-y-4 p-4 self-start">
          <Field label="Element">
            <select className="input" value={entry.id} onChange={(e) => setParams({ id: e.target.value }, { replace: true })}>
              {families.map((f) => (
                <optgroup key={f.id} label={`${f.letter}. ${f.label}`}>
                  {entries.filter((e) => e.family === f.id).map((e) => <option key={e.id} value={e.id}>{e.id} · {e.name}</option>)}
                </optgroup>
              ))}
            </select>
          </Field>
          {variantOptions.length > 0 && (
            <Field label="Variant">
              <select className="input" value={variant} onChange={(e) => setVariant(e.target.value)}>
                {variantOptions.map((v) => <option key={v} value={v}>{v.replace(/_/g, ' ')}</option>)}
              </select>
            </Field>
          )}
          <Field label="Severity" hint={`Default for this element: ${entry.severity.default}`}>
            <div className="flex gap-1">
              {SEVERITY_LEVELS.map((s) => (
                <button key={s} onClick={() => setSeverity(s)} className="flex-1 rounded-md py-1.5 text-xs font-bold"
                  style={{ background: tokens.severity[s].color, color: tokens.severity[s].onColor, outline: s === severity ? '2px solid #fff' : 'none', outlineOffset: 2, opacity: s === severity ? 1 : 0.55 }}>{s}</button>
              ))}
            </div>
          </Field>
          <Field label="Speed badge" hint={speedKind === 'advisory' ? 'Advisory speed is a RoadOS recommendation, never a legal limit.' : speedKind === 'posted' ? 'Posted limits must come from a sign, map or authority source.' : undefined}>
            <Seg value={speedKind} onChange={setSpeedKind} options={[{ value: 'none', label: 'None' }, { value: 'posted', label: 'Posted' }, { value: 'advisory', label: 'Advisory' }, { value: 'unknown', label: 'Unknown' }]} />
            {(speedKind === 'posted' || speedKind === 'advisory') && (
              <div className="mt-2 flex items-center gap-2">
                <input type="number" min={5} max={160} step={5} className="input !w-24" value={speed} onChange={(e) => setSpeed(Math.max(0, Number(e.target.value)))} />
                <Seg value={unit} onChange={setUnit} options={[{ value: 'kmh', label: 'km/h' }, { value: 'mph', label: 'mph' }]} />
              </div>
            )}
          </Field>
          <Field label="Distance">
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={distOn} onChange={(e) => setDistOn(e.target.checked)} />
              <input type="number" min={0} step={10} disabled={!distOn} className="input" value={dist} onChange={(e) => setDist(Math.max(0, Number(e.target.value)))} />
              <span className="text-xs text-dim">{unit === 'mph' ? 'ft' : 'm'}</span>
            </div>
          </Field>
          <Field label="Direction / lane">
            <Seg value={laneMode ? 'lane' : 'dir'} onChange={(v) => setLaneMode(v === 'lane')} options={[{ value: 'dir', label: 'Direction' }, { value: 'lane', label: 'Lane' }]} />
            <div className="mt-2">
              {laneMode ? (
                <div className="flex items-center gap-2 text-xs text-dim">
                  Lanes <input type="number" min={1} max={6} className="input !w-16" value={lanes} onChange={(e) => setLanes(Number(e.target.value))} />
                  Hazard lane <input type="number" min={1} max={lanes} className="input !w-16" value={lane + 1} onChange={(e) => setLane(Number(e.target.value) - 1)} />
                </div>
              ) : (
                <Seg value={direction} onChange={setDirection} options={[{ value: 'none', label: '—' }, { value: 'left', label: '←' }, { value: 'ahead', label: '↑' }, { value: 'right', label: '→' }, { value: 'both', label: '↔' }]} />
              )}
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Count"><input type="number" min={1} max={99} className="input" value={count} onChange={(e) => setCount(Math.max(1, Number(e.target.value)))} /></Field>
            <Field label="Size">
              <select className="input" value={size} onChange={(e) => setSize(e.target.value as SizeVariant | 'none')}>
                <option value="none">—</option>{(['S', 'M', 'L', 'XL'] as const).map((s) => <option key={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Representation">
            <Seg value={rep} onChange={setRep} options={[{ value: 'auto', label: 'Primary' }, { value: 'standard', label: 'Standard' }, { value: 'roados', label: 'RoadOS' }]} />
          </Field>
          <Field label="Icon theme"><Seg value={theme} onChange={setTheme} options={[{ value: 'dark', label: 'Dark' }, { value: 'light', label: 'Light' }]} /></Field>
        </div>

        {/* Preview */}
        <div className="min-w-0 space-y-6">
          <div className="panel overflow-hidden">
            <div className="panel-head">
              <div className="min-w-0">
                <div className="mono text-faint">{entry.id}</div>
                <div className="truncate font-semibold text-white">{entry.name}</div>
              </div>
              <div className="flex flex-wrap items-center gap-1.5"><StatusBadge status={entry.standardStatus} long /><SeverityBadge level={severity} label /></div>
            </div>
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-2">
              {(Object.keys(BACKGROUNDS) as BgKey[]).map((k) => (
                <button key={k} onClick={() => setBg(k)} className={`chip ${bg === k ? 'border-accent text-white' : 'text-dim'}`}>
                  <span className="h-3 w-3 rounded-sm border border-line2" style={{ background: BACKGROUNDS[k].css }} />{BACKGROUNDS[k].label}
                </button>
              ))}
            </div>
            <div className="flex min-h-[340px] items-center justify-center p-8" style={{ background: BACKGROUNDS[bg].css }}>
              <SvgIcon svg={composed.svg} size={280} className="max-w-full" />
            </div>
            <div className="border-t border-line px-4 py-2 text-xs text-dim">
              Frame: <span className="text-text">{FRAME_LABEL[composed.frame]}</span> · representation <span className="text-text">{composed.representation}</span>
              {!composed.glyphFound && <span className="ml-2 text-s4">Pictogram pending — placeholder shown</span>}
            </div>
          </div>

          <DownloadControls entry={entry} options={options} />

          <div className="panel p-4">
            <div className="label mb-3">Size ladder — recognisability check</div>
            {(['dark', 'light'] as const).map((t) => (
              <div key={t} className="mb-2 flex flex-wrap items-end gap-4 rounded-lg p-3" style={{ background: t === 'dark' ? tokens.backgrounds.dark : tokens.backgrounds.light }}>
                {tokens.icon.previewSizes.map((s) => (
                  <div key={s} className="flex flex-col items-center gap-1">
                    <SvgIcon svg={composeIcon({ entry, ...options, theme: t }).svg} size={s} />
                    <span className={`text-[10px] ${t === 'dark' ? 'text-faint' : 'text-slate-500'}`}>{s}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="panel p-4">
              <div className="label mb-3">Standard vs RoadOS representation</div>
              <div className="flex items-start justify-around gap-4">
                <div className="flex flex-col items-center gap-2">
                  {std ? <SvgIcon svg={std} size={112} /> : <div className="flex h-28 w-28 items-center justify-center rounded-lg border border-dashed border-line2 p-2 text-center text-[11px] text-faint">No convention form for this element</div>}
                  <span className="text-xs text-dim">Standard</span>
                </div>
                <div className="flex flex-col items-center gap-2"><SvgIcon svg={ros} size={112} /><span className="text-xs text-dim">RoadOS</span></div>
              </div>
            </div>
            <div className="panel p-4">
              <div className="label mb-3">Severity sweep — pictogram stays constant</div>
              <div className="flex flex-wrap justify-between gap-2">
                {SEVERITY_LEVELS.map((s) => (
                  <button key={s} onClick={() => setSeverity(s)} className="flex flex-col items-center gap-1">
                    <SvgIcon svg={composeIcon({ entry, ...plain, representation: rep, severity: s }).svg} size={64} />
                    <span className="text-[11px] text-dim">{s}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Code */}
        <div className="min-w-0 space-y-6 md:col-span-2 xl:col-span-1">
          <CodeBlock title="Generated SVG" code={composed.svg} maxH={360} />
          <CodeBlock title="Composition metadata (JSON)" code={JSON.stringify(meta, null, 2)} maxH={420} />
          <div className="panel p-4 text-xs leading-relaxed text-dim">
            <div className="label mb-2">Composition layers</div>
            <ol className="list-decimal space-y-1 pl-4">
              <li>Base pictogram <span className="mono text-accent2">{entry.visual.glyph}{variant ? `:${variant}` : ''}</span> (64×64)</li>
              <li>Information-class shape <span className="text-text">{FRAME_LABEL[resolveFrame(entry, rep).frame]}</span></li>
              <li>Severity treatment <span className="text-text">{severity}</span> {composed.representation === 'standard' ? '(external bar — sign colours untouched)' : '(frame border + code tab)'}</li>
              <li>Size {options.sizeVariant ?? '—'} · count {options.count ?? '—'}</li>
              <li>Speed badge {options.speed ? options.speed.kind : '—'}</li>
              <li>Distance {options.distanceM != null ? 'on' : '—'} · {options.lane ? 'lane indicator' : options.direction ? `direction ${options.direction}` : 'no direction'}</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}
