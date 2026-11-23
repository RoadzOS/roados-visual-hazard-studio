import type { ReactNode } from 'react';

/** Minimal Markdown renderer (headings, lists, tables, code, quotes, inline code/bold/links). */
function inline(text: string, key: number): ReactNode {
  const parts: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|_[^_]+_)/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    const t = m[0];
    if (t.startsWith('`')) parts.push(<code key={i++}>{t.slice(1, -1)}</code>);
    else if (t.startsWith('**')) parts.push(<strong key={i++}>{t.slice(2, -2)}</strong>);
    else if (t.startsWith('[')) { const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(t)!; parts.push(<a key={i++} href={mm[2]} target="_blank" rel="noreferrer" className="text-accent2 hover:underline">{mm[1]}</a>); }
    else parts.push(<em key={i++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return <span key={key}>{parts}</span>;
}

export function Markdown({ source }: { source: string }) {
  const lines = source.split('\n');
  const out: ReactNode[] = [];
  let i = 0, k = 0;
  while (i < lines.length) {
    const l = lines[i];
    if (l.startsWith('```')) {
      const buf: string[] = []; i++;
      while (i < lines.length && !lines[i].startsWith('```')) buf.push(lines[i++]);
      i++; out.push(<pre key={k++}><code>{buf.join('\n')}</code></pre>); continue;
    }
    const h = /^(#{1,3})\s+(.*)$/.exec(l);
    if (h) { const T = (['h1', 'h2', 'h3'] as const)[h[1].length - 1]; out.push(<T key={k++}>{inline(h[2], 0)}</T>); i++; continue; }
    if (l.startsWith('|')) {
      const rows: string[][] = [];
      while (i < lines.length && lines[i].startsWith('|')) { rows.push(lines[i].split('|').slice(1, -1).map((c) => c.trim())); i++; }
      const [head, , ...body] = rows;
      out.push(<div key={k++} className="overflow-x-auto"><table><thead><tr>{head.map((c, j) => <th key={j}>{inline(c, j)}</th>)}</tr></thead><tbody>{body.map((r, ri) => <tr key={ri}>{r.map((c, j) => <td key={j}>{inline(c, j)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }
    if (/^\s*[-*]\s+/.test(l) || /^\s*\d+\.\s+/.test(l)) {
      const ordered = /^\s*\d+\./.test(l);
      const items: string[] = [];
      while (i < lines.length && (/^\s*[-*]\s+/.test(lines[i]) || /^\s*\d+\.\s+/.test(lines[i]))) { items.push(lines[i].replace(/^\s*([-*]|\d+\.)\s+/, '')); i++; }
      const L = ordered ? 'ol' : 'ul';
      out.push(<L key={k++}>{items.map((t, j) => <li key={j}>{inline(t, j)}</li>)}</L>);
      continue;
    }
    if (l.startsWith('>')) { out.push(<blockquote key={k++}>{inline(l.replace(/^>\s?/, ''), 0)}</blockquote>); i++; continue; }
    if (!l.trim()) { i++; continue; }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#|\||```|>|\s*[-*]\s|\s*\d+\.\s)/.test(lines[i])) para.push(lines[i++]);
    out.push(<p key={k++}>{inline(para.join(' '), 0)}</p>);
  }
  return <div className="md">{out}</div>;
}
