/** Browser download + rasterisation helpers. */
export function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export const downloadText = (filename: string, text: string, type = 'text/plain') =>
  downloadBlob(filename, new Blob([text], { type: `${type};charset=utf-8` }));

export const downloadSvg = (filename: string, svg: string) => downloadText(filename, svg, 'image/svg+xml');

/** Base raster size for "1x" exports (px). */
export const PNG_BASE_PX = 64;

/** Rasterise an SVG string to PNG. background null = transparent. */
export function svgToPng(svg: string, px: number, background: string | null = null): Promise<Blob> {
  const sized = svg.replace(/width="\d+(\.\d+)?" height="\d+(\.\d+)?"/, `width="${px}" height="${px}"`);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = px;
      canvas.height = px;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject(new Error('Canvas unavailable'));
      if (background) { ctx.fillStyle = background; ctx.fillRect(0, 0, px, px); }
      ctx.drawImage(img, 0, 0, px, px);
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG encode failed'))), 'image/png');
    };
    img.onerror = () => reject(new Error('SVG could not be rasterised'));
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(sized);
  });
}
