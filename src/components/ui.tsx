import { useMemo, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check, Copy } from 'lucide-react';
import type { CatalogueEntry, Severity, StandardStatus } from '../catalogue/schema';
import { composeIcon, type ComposeOptions } from '../icons/compose';
import { tokens } from '../tokens';

export function SvgIcon({ svg, size = 48, className = '', title }: { svg: string; size?: number | string; className?: string; title?: string }) {
  return <span title={title} className={`svg-fill inline-block shrink-0 ${className}`} style={{ width: size, height: size }} dangerouslySetInnerHTML={{ __html: svg }} />;
}

export function EntryIcon({ entry, size = 48, ...o }: { entry: CatalogueEntry; size?: number | string } & Partial<Omit<ComposeOptions, 'entry'>>) {
  const key = JSON.stringify(o);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const svg = useMemo(() => composeIcon({ entry, ...o }).svg, [entry, key]);
  return <SvgIcon svg={svg} size={size} title={`${entry.id} · ${entry.name}`} />;
}

export function SeverityBadge({ level, label = false }: { level: Severity; label?: boolean }) {
  const t = tokens.severity[level];
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-bold" style={{ background: t.color, color: t.onColor }}>
      {level}{label && <span className="font-medium">· {t.label}</span>}
    </span>
  );
}

export const STATUS_META: Record<StandardStatus, { label: string; short: string; cls: string; desc: string }> = {
  standardised: { label: 'Explicitly standardised', short: 'Standard', cls: 'border-accent/60 text-accent2 bg-accent/10', desc: 'Element is defined in an official standard or convention. RVHL artwork is an original rendering.' },
  convention_inspired: { label: 'Inspired by convention', short: 'Convention', cls: 'border-sky-400/40 text-sky-300 bg-sky-400/5', desc: 'Follows conventional sign or device geometry; exact form is a RoadOS rendering.' },
  non_standard_hazard: { label: 'Non-standard hazard', short: 'Non-standard', cls: 'border-s3/50 text-s3 bg-s3/10', desc: 'Real-world hazard not covered by sign standards. Representation is a RoadOS proposal.' },
  roados_extension: { label: 'RoadOS extension', short: 'RoadOS', cls: 'border-violet-400/40 text-violet-300 bg-violet-400/5', desc: 'RoadOS-only information concept.' },
};

export function StatusBadge({ status, long = false }: { status: StandardStatus; long?: boolean }) {
  const m = STATUS_META[status];
  return <span className={`chip ${m.cls}`} title={m.desc}>{long ? m.label : m.short}</span>;
}

export function PageHeader({ title, kicker, children, actions }: { title: string; kicker?: string; children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-3xl">
        {kicker && <div className="label mb-1 text-accent2">{kicker}</div>}
        <h1 className="text-2xl font-bold tracking-tight text-white">{title}</h1>
        {children && <div className="mt-2 text-sm leading-relaxed text-dim">{children}</div>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function Seg<T extends string | number>({ value, options, onChange }: { value: T; options: { value: T; label: ReactNode }[]; onChange: (v: T) => void }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={String(o.value)} type="button" data-on={o.value === value} onClick={() => onChange(o.value)}>{o.label}</button>
      ))}
    </div>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <label className="block">
      <div className="label mb-1.5">{label}</div>
      {children}
      {hint && <div className="mt-1 text-[11px] text-faint">{hint}</div>}
    </label>
  );
}

export function CopyButton({ text }: { text: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className="btn !py-1 !px-2 text-xs" onClick={() => { navigator.clipboard?.writeText(text).then(() => { setOk(true); setTimeout(() => setOk(false), 1200); }).catch(() => {}); }}>
      {ok ? <Check size={14} /> : <Copy size={14} />} {ok ? 'Copied' : 'Copy'}
    </button>
  );
}

export function CodeBlock({ code, title, maxH = 320 }: { code: string; title: string; maxH?: number }) {
  return (
    <div className="panel overflow-hidden">
      <div className="panel-head !py-2"><span className="label">{title}</span><CopyButton text={code} /></div>
      <pre className="scroll-thin overflow-auto p-3 mono text-dim whitespace-pre-wrap break-all" style={{ maxHeight: maxH }}>{code}</pre>
    </div>
  );
}

export function EntryTile({ entry, edited }: { entry: CatalogueEntry; edited?: boolean }) {
  return (
    <Link to={`/item/${entry.id}`} className="group panel flex flex-col items-center gap-2 p-3 text-center hover:border-accent/60 hover:bg-panel2 transition-colors">
      <EntryIcon entry={entry} size={72} />
      <div className="w-full">
        <div className="mono text-faint">{entry.id}{edited && <span className="ml-1 text-s2">●</span>}</div>
        <div className="truncate text-[13px] font-medium text-text group-hover:text-white" title={entry.name}>{entry.name}</div>
      </div>
      <div className="flex items-center gap-1"><SeverityBadge level={entry.severity.default} /><StatusBadge status={entry.standardStatus} /></div>
    </Link>
  );
}

export function Stat({ label, value, sub }: { label: string; value: ReactNode; sub?: ReactNode }) {
  return (
    <div className="panel p-4">
      <div className="label">{label}</div>
      <div className="mt-1 text-2xl font-bold text-white tabular-nums">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-dim">{sub}</div>}
    </div>
  );
}

export const DETECTION_LABEL: Record<string, string> = {
  camera: 'Camera', motion_sensor: 'Motion sensor (IMU)', community_report: 'Community report', map_data: 'Map data', authority_feed: 'Authority feed',
  v2x: 'V2X', radar: 'Radar', lidar: 'Lidar', weather_feed: 'Weather feed', vehicle_bus: 'Vehicle bus (CAN)', manual_survey: 'Manual survey',
};

export const FRAME_LABEL: Record<string, string> = {
  warning_triangle: 'Warning triangle', prohibitory_circle: 'Prohibitory circle', mandatory_circle: 'Mandatory circle', stop_octagon: 'Stop octagon',
  give_way_triangle: 'Give-way triangle', info_rect: 'Informatory rectangle', direction_board: 'Direction board', roados_hazard: 'RoadOS hazard tile',
  roados_marking: 'RoadOS pavement tile', roados_infrastructure: 'RoadOS arch tile', roados_signal: 'RoadOS signal tile', roados_context: 'RoadOS context hexagon',
};

export const RELATION_LABEL: Record<string, string> = {
  explicitly_standardised: 'Explicitly standardised', inspired_by_convention: 'Inspired by convention', related_guidance: 'Related guidance', roados_extension: 'RoadOS extension',
};
