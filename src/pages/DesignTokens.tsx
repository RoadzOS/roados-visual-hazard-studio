import { Download } from 'lucide-react';
import type { Frame } from '../catalogue/schema';
import { useCatalogue } from '../state/catalogue';
import { composeIcon, speedBadgeSvg } from '../icons/compose';
import { CodeBlock, FRAME_LABEL, PageHeader, SvgIcon } from '../components/ui';
import { downloadText } from '../export/download';
import { tokensJson } from '../export/bundles';
import { tokens } from '../tokens';

const SAMPLE: Record<Frame, string> = {
  warning_triangle: 'RSG-016', prohibitory_circle: 'RSG-009', mandatory_circle: 'RSG-004', stop_octagon: 'RSG-001', give_way_triangle: 'RSG-002',
  info_rect: 'RSG-034', direction_board: 'RSG-037', roados_hazard: 'RDM-003', roados_marking: 'MRK-001', roados_infrastructure: 'INF-004',
  roados_signal: 'SIG-001', roados_context: 'VEH-003',
};

function Swatch({ name, color }: { name: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="h-8 w-8 shrink-0 rounded-md border border-line2" style={{ background: color }} />
      <div className="min-w-0"><div className="truncate text-xs text-text">{name}</div><div className="mono text-faint">{color}</div></div>
    </div>
  );
}

export default function DesignTokens() {
  const { byId } = useCatalogue();
  const badge = (svg: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-24 -24 48 48" width="48" height="48">${svg}</svg>`;
  return (
    <div className="space-y-8">
      <PageHeader title="Design Tokens" kicker="Single source for every icon"
        actions={<button className="btn-primary" onClick={() => downloadText('rvhl-1.0.0-tokens.json', tokensJson(), 'application/json')}><Download size={14} /> tokens.json</button>}>
        All pictograms, frames, badges and previews read these tokens. The same JSON is intended as input to the RoadOS C++/Skia graphics SDK.
      </PageHeader>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="panel p-4">
          <div className="label mb-3">Severity colours (RoadOS proposal)</div>
          <div className="grid grid-cols-5 gap-2">
            {Object.entries(tokens.severity).map(([k, v]) => (
              <div key={k} className="overflow-hidden rounded-lg border border-line">
                <div className="flex h-16 items-end p-2 text-lg font-black" style={{ background: v.color, color: v.onColor }}>{k}</div>
                <div className="p-2 text-[11px]"><div className="text-text">{v.label}</div><div className="mono text-faint">{v.color}</div></div>
              </div>
            ))}
          </div>
        </div>
        <div className="panel p-4">
          <div className="label mb-3">Convention & semantic colours</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {Object.entries(tokens.convention).filter(([k]) => k !== 'notes').map(([k, v]) => <Swatch key={k} name={k} color={v as string} />)}
          </div>
          <p className="mt-3 text-[11px] text-faint">{tokens.convention.notes}</p>
        </div>
      </section>

      <section className="panel p-4">
        <div className="label mb-3">Information-class shapes</div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {(Object.keys(tokens.shapes) as Frame[]).map((f) => {
            const e = byId.get(SAMPLE[f]);
            const s = tokens.shapes[f];
            return (
              <div key={f} className="rounded-lg border border-line p-3 text-center">
                {e && <SvgIcon svg={composeIcon({ entry: e, representation: s.basis === 'convention' ? 'standard' : 'auto' }).svg} size={72} className="mx-auto" />}
                <div className="mt-2 text-xs font-medium text-text">{FRAME_LABEL[f]}</div>
                <div className={`mt-1 text-[10px] uppercase tracking-wider ${s.basis === 'convention' ? 'text-accent2' : 'text-s3'}`}>{s.basis} · {s.class}</div>
                <div className="mt-1 text-[11px] text-faint">{s.description}</div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="panel p-4">
          <div className="label mb-3">Stroke widths</div>
          {Object.entries(tokens.stroke).map(([k, v]) => (
            <div key={k} className="flex items-center gap-3 py-1.5"><span className="w-20 text-xs text-dim">{k}</span><svg width="120" height="12"><line x1="0" x2="120" y1="6" y2="6" stroke="#F2F5F7" strokeWidth={v} /></svg><span className="mono text-faint">{v}</span></div>
          ))}
        </div>
        <div className="panel p-4">
          <div className="label mb-3">Corner radii</div>
          <div className="flex flex-wrap gap-3">
            {Object.entries(tokens.radius).map(([k, v]) => (
              <div key={k} className="text-center"><div className="h-12 w-12 border-2 border-accent2" style={{ borderRadius: v }} /><div className="mt-1 text-[11px] text-dim">{k}</div><div className="mono text-faint">{v}</div></div>
            ))}
          </div>
        </div>
        <div className="panel p-4">
          <div className="label mb-3">Icon dimensions</div>
          <div className="space-y-1 text-sm text-dim">
            <div>Pictogram viewBox <span className="mono text-text">{tokens.icon.pictogramViewBox.join(' ')}</span></div>
            <div>Safe area <span className="mono text-text">{tokens.icon.pictogramSafeArea.join(' ')}</span></div>
            <div>Composed viewBox <span className="mono text-text">{tokens.icon.composedViewBox.join(' ')}</span></div>
            <div>Frame box <span className="mono text-text">{tokens.icon.frameBox.join(' ')}</span></div>
            <div>Preview sizes <span className="mono text-text">{tokens.icon.previewSizes.join(', ')}</span></div>
            <div>Min. recommended <span className="mono text-text">{tokens.icon.minimumRecommendedPx}px</span></div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="panel p-4">
          <div className="label mb-3">Typography</div>
          <div className="space-y-2">
            <div style={{ fontFamily: tokens.typography.family, fontWeight: tokens.typography.weightBold }} className="text-lg text-white">Pothole 200 m ahead</div>
            <div style={{ fontFamily: tokens.typography.numeralFamily, fontWeight: 800 }} className="text-5xl text-white">48</div>
            <div style={{ fontFamily: tokens.typography.monoFamily }} className="text-xs text-dim">RDM-003 · road_damage</div>
            <div className="mono text-faint">badge {tokens.typography.badgeSize} · distance {tokens.typography.distanceSize} · instrument {tokens.typography.instrumentSize}</div>
          </div>
        </div>
        <div className="panel p-4">
          <div className="label mb-3">Badges</div>
          <div className="flex flex-wrap items-center gap-4">
            <SvgIcon svg={badge(speedBadgeSvg({ kind: 'posted', valueKmh: 60, unit: 'kmh' }, 0, 0))} size={64} />
            <SvgIcon svg={badge(speedBadgeSvg({ kind: 'advisory', valueKmh: 25, unit: 'kmh' }, 0, 0))} size={64} />
            <SvgIcon svg={badge(speedBadgeSvg({ kind: 'unknown', valueKmh: null, unit: 'kmh' }, 0, 0))} size={64} />
            {byId.get('TMP-001') && <SvgIcon svg={composeIcon({ entry: byId.get('TMP-001')!, count: 3, distanceM: 150, direction: 'right', sizeVariant: 'L' }).svg} size={88} />}
          </div>
        </div>
        <div className="panel p-4">
          <div className="label mb-3">Backgrounds, borders & themes</div>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(tokens.backgrounds).map(([k, v]) => <Swatch key={k} name={`bg.${k}`} color={v} />)}
            {Object.entries(tokens.borders).map(([k, v]) => <Swatch key={k} name={`border.${k}`} color={v} />)}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {(['dark', 'light'] as const).map((t) => (
          <div key={t} className="panel p-4">
            <div className="label mb-3">Theme · {t}</div>
            <div className="mb-3 flex gap-3 rounded-lg p-3" style={{ background: t === 'dark' ? tokens.backgrounds.dark : tokens.backgrounds.light }}>
              {['RDM-003', 'MRK-004', 'INF-004', 'SIG-002', 'VEH-001'].map((id) => byId.get(id) && <SvgIcon key={id} svg={composeIcon({ entry: byId.get(id)!, theme: t }).svg} size={64} />)}
            </div>
            <div className="grid grid-cols-2 gap-2">{Object.entries(tokens.themes[t]).map(([k, v]) => <Swatch key={k} name={k} color={v} />)}</div>
          </div>
        ))}
      </section>

      <CodeBlock title="tokens.json" code={tokensJson()} maxH={480} />
    </div>
  );
}
