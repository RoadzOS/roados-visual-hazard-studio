import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import spec from '../docs/rvhl-spec.md?raw';
import { useCatalogue } from '../state/catalogue';
import { documentationMarkdown } from '../export/bundles';
import { downloadText } from '../export/download';
import { Markdown } from '../components/Markdown';
import { PageHeader, Seg } from '../components/ui';

export default function Documentation() {
  const cat = useCatalogue();
  const [tab, setTab] = useState<'spec' | 'catalogue'>('spec');
  const generated = useMemo(() => documentationMarkdown({ entries: cat.entries, families: cat.families, references: cat.references, referencePolicy: cat.referencePolicy }), [cat]);
  const src = tab === 'spec' ? spec : generated;
  return (
    <div>
      <PageHeader title="Project Documentation" kicker="RVHL 1.0"
        actions={<>
          <Seg value={tab} onChange={setTab} options={[{ value: 'spec', label: 'Specification & architecture' }, { value: 'catalogue', label: 'Generated catalogue reference' }]} />
          <button className="btn" onClick={() => downloadText(tab === 'spec' ? 'rvhl-1.0.0-specification.md' : 'rvhl-1.0.0-documentation.md', src, 'text/markdown')}><Download size={14} /> Markdown</button>
        </>} />
      <div className="panel max-w-5xl p-6 md:p-8"><Markdown source={src} /></div>
    </div>
  );
}
