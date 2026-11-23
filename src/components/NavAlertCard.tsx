import type { CatalogueEntry, Severity } from '../catalogue/schema';
import { composeIcon, formatDistance, speedBadgeSvg, type SpeedBadge } from '../icons/compose';
import { tokens } from '../tokens';
import { SvgIcon } from './ui';

/** Automotive navigation-style hazard alert (RoadOS UI proposal). */
export function NavAlertCard({ entry, severity, distanceM, advisory, posted, variant, compact = false }: {
  entry: CatalogueEntry; severity?: Severity; distanceM: number; advisory?: number | null; posted?: number | null; variant?: string | null; compact?: boolean;
}) {
  const sev = severity ?? entry.severity.default;
  const t = tokens.severity[sev];
  const icon = composeIcon({ entry, severity: sev, variant, showSeverityCode: false }).svg;
  const badge = (b: SpeedBadge) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-22 -22 44 44" width="44" height="44">${speedBadgeSvg(b, 0, 0)}</svg>`;
  return (
    <div className="flex items-stretch overflow-hidden rounded-2xl border border-white/10 bg-[#070b10]/95 shadow-2xl shadow-black/50" style={{ boxShadow: `inset 4px 0 0 ${t.color}` }}>
      <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
        <SvgIcon svg={icon} size={compact ? 48 : 64} className="shrink-0" />
        <div className="min-w-0">
          <div className="text-[11px] font-bold uppercase tracking-widest" style={{ color: t.color }}>{sev} · {t.label}</div>
          <div className={`${compact ? 'text-sm' : 'text-base'} truncate font-semibold text-white`}>{entry.name}</div>
          <div className={`${compact ? 'text-xl' : 'text-3xl'} font-bold tabular-nums text-white`} style={{ fontFamily: tokens.typography.numeralFamily }}>{formatDistance(distanceM)}</div>
        </div>
      </div>
      {(advisory || posted) && (
        <div className="flex shrink-0 flex-col items-center justify-center gap-1.5 border-l border-white/10 px-2.5 sm:flex-row">
          {posted ? <SvgIcon svg={badge({ kind: 'posted', valueKmh: posted, unit: 'kmh' })} size={compact ? 36 : 44} /> : null}
          {advisory ? <SvgIcon svg={badge({ kind: 'advisory', valueKmh: advisory, unit: 'kmh' })} size={compact ? 36 : 44} /> : null}
        </div>
      )}
    </div>
  );
}
