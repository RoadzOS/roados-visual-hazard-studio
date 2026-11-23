import { useState } from 'react';
import { Download, LoaderCircle } from 'lucide-react';
import type { CatalogueEntry } from '../catalogue/schema';
import { kebab } from '../catalogue/build';
import { composeIcon, pictogramSvg, type ComposeOptions } from '../icons/compose';
import { downloadBlob, downloadSvg, downloadText, PNG_BASE_PX, svgToPng } from '../export/download';
import { tokens } from '../tokens';
import { Seg } from './ui';

type Bg = 'transparent' | 'dark' | 'light';
const BG: Record<Bg, string | null> = { transparent: null, dark: tokens.backgrounds.dark, light: tokens.backgrounds.light };

export function DownloadControls({ entry, options, compact = false }: { entry: CatalogueEntry; options: Omit<ComposeOptions, 'entry'>; compact?: boolean }) {
  const [bg, setBg] = useState<Bg>('transparent');
  const [busy, setBusy] = useState<string | null>(null);
  const base = `${entry.id.toLowerCase()}-${kebab(entry.slug)}`;
  const suffix = `${options.representation ?? 'auto'}-${options.theme ?? 'dark'}-${(options.severity ?? entry.severity.default).toLowerCase()}`;

  const svgFor = () => composeIcon({ entry, ...options, background: BG[bg] }).svg;
  const png = async (k: number) => {
    setBusy(`png${k}`);
    try { downloadBlob(`${base}__${suffix}${bg === 'transparent' ? '' : '-' + bg + 'bg'}@${k}x.png`, await svgToPng(svgFor(), PNG_BASE_PX * k)); }
    finally { setBusy(null); }
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${compact ? '' : 'panel p-3'}`}>
      <Seg value={bg} onChange={setBg} options={[{ value: 'transparent', label: 'Transparent' }, { value: 'dark', label: 'Dark bg' }, { value: 'light', label: 'Light bg' }]} />
      <button className="btn-primary" onClick={() => downloadSvg(`${base}__${suffix}${bg === 'transparent' ? '' : '-' + bg + 'bg'}.svg`, svgFor())}><Download size={14} /> SVG</button>
      {[1, 2, 3].map((k) => (
        <button key={k} className="btn" disabled={!!busy} onClick={() => png(k)} title={`${PNG_BASE_PX * k}×${PNG_BASE_PX * k}px`}>
          {busy === `png${k}` ? <LoaderCircle size={14} className="animate-spin" /> : <Download size={14} />} PNG {k}×
        </button>
      ))}
      <button className="btn" onClick={() => downloadSvg(`${base}__pictogram-${options.theme ?? 'dark'}.svg`, pictogramSvg(entry, options.theme ?? 'dark', options.variant))}><Download size={14} /> Pictogram</button>
      {!compact && <button className="btn" onClick={() => downloadText(`${base}.json`, JSON.stringify(entry, null, 2), 'application/json')}><Download size={14} /> JSON</button>}
    </div>
  );
}
