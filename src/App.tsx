import { useEffect, useState } from 'react';
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import {
  BookOpen, Construction, FileText, Gauge, Layers, LayoutDashboard, Library, Map, Menu, Navigation, PackageOpen, Palette,
  PenTool, Route as RouteIcon, Signpost, TriangleAlert, X,
} from 'lucide-react';
import Dashboard from './pages/Dashboard';
import { CatalogueBrowser } from './pages/CatalogueBrowser';
import EntryDetail from './pages/EntryDetail';
import SeveritySystem from './pages/SeveritySystem';
import SpeedSystem from './pages/SpeedSystem';
import IconStudio from './pages/IconStudio';
import MapPreview from './pages/MapPreview';
import CorridorPreview from './pages/CorridorPreview';
import StandardsReferences from './pages/StandardsReferences';
import ExportCentre from './pages/ExportCentre';
import DesignTokens from './pages/DesignTokens';
import Documentation from './pages/Documentation';
import { useCatalogue } from './state/catalogue';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/catalogue', label: 'Hazard Catalogue', icon: Library },
  { to: '/signs', label: 'Standard Road Signs', icon: Signpost },
  { to: '/markings', label: 'Road Markings', icon: RouteIcon },
  { to: '/infrastructure', label: 'Road Infrastructure', icon: Construction },
  { to: '/hazards', label: 'Non-standard Hazards', icon: TriangleAlert },
  { to: '/severity', label: 'Severity System', icon: Layers },
  { to: '/speed', label: 'Speed System', icon: Gauge },
  { to: '/studio', label: 'Icon Studio', icon: PenTool },
  { to: '/map', label: 'Map Preview', icon: Map },
  { to: '/corridor', label: 'Forward Corridor', icon: Navigation },
  { to: '/standards', label: 'Standards References', icon: BookOpen },
  { to: '/export', label: 'Export Centre', icon: PackageOpen },
  { to: '/tokens', label: 'Design Tokens', icon: Palette },
  { to: '/docs', label: 'Documentation', icon: FileText },
];

function Brand() {
  return (
    <div className="flex items-center gap-3 px-4 py-5">
      <svg viewBox="0 0 64 64" width="34" height="34" aria-hidden>
        <rect x="4" y="4" width="56" height="56" rx="14" fill="#0B1118" stroke="#E99A32" strokeWidth="5" />
        <path d="M24 50 30 14h4l6 36" fill="none" stroke="#F2F5F7" strokeWidth="4" strokeLinejoin="round" />
        <path d="M32 22v4M32 32v4M32 42v4" stroke="#E99A32" strokeWidth="3" />
      </svg>
      <div className="leading-tight">
        <div className="text-[13px] font-bold tracking-wide text-white">RoadOS</div>
        <div className="text-[11px] text-dim">Visual Hazard Studio</div>
      </div>
    </div>
  );
}

export default function App() {
  const { version, entries, issues } = useCatalogue();
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setOpen(false); window.scrollTo(0, 0); }, [loc.pathname]);
  const errors = issues.filter((i) => i.level === 'error').length;

  const nav = (
    <nav className="flex flex-col gap-0.5 px-2">
      {NAV.map(({ to, label, icon: Icon }) => (
        <NavLink key={to} to={to} end={to === '/'}
          className={({ isActive }) => `flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${isActive ? 'bg-raised text-white' : 'text-dim hover:bg-panel2 hover:text-text'}`}>
          {({ isActive }) => (<><Icon size={16} className={isActive ? 'text-s3' : ''} />{label}</>)}
        </NavLink>
      ))}
    </nav>
  );

  return (
    <div className="flex min-h-full">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-[#0a0f15] lg:flex">
        <Brand />
        <div className="scroll-thin flex-1 overflow-y-auto pb-4">{nav}</div>
        <div className="border-t border-line px-4 py-3 text-[11px] text-faint">
          <div>Specification <span className="text-dim">RVHL {version}</span></div>
          <div>{entries.length} elements · {errors ? <span className="text-s5">{errors} errors</span> : <span className="text-ok">valid</span>}</div>
        </div>
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60" />
          <aside className="absolute inset-y-0 left-0 w-64 overflow-y-auto border-r border-line bg-[#0a0f15]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between pr-3"><Brand /><button className="btn !p-1.5" onClick={() => setOpen(false)} aria-label="Close menu"><X size={16} /></button></div>
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-line bg-base/90 px-4 py-2.5 backdrop-blur lg:hidden">
          <button className="btn !p-1.5" onClick={() => setOpen(true)} aria-label="Open menu"><Menu size={16} /></button>
          <span className="text-sm font-semibold">RoadOS Visual Hazard Studio</span>
        </header>
        <main className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 md:px-8 md:py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/catalogue" element={<CatalogueBrowser key="all" title="Hazard Catalogue" kicker="All 14 families" />} />
            <Route path="/signs" element={<CatalogueBrowser key="signs" title="Standard Road Signs & Signals" kicker="Families A–B" preset={{ families: ['traffic_signals', 'signs'] }}
              intro="Signals and fixed signs. Convention geometry (triangle, circle, octagon, rectangle) is preserved; severity is shown as an external bar so official sign colours are never altered." />} />
            <Route path="/markings" element={<CatalogueBrowser key="markings" title="Road Markings" kicker="Family C" preset={{ families: ['road_markings'] }}
              intro="Pavement markings rendered on the RoadOS pavement tile, including condition states (faded, missing)." />} />
            <Route path="/infrastructure" element={<CatalogueBrowser key="infra" title="Road Infrastructure" kicker="Family D" preset={{ families: ['road_infrastructure'] }}
              intro="Dividers, barriers, delineation, lighting and roadside furniture on the RoadOS arch tile." />} />
            <Route path="/hazards" element={<CatalogueBrowser key="hazards" title="Non-standard Hazards" kicker="Families E–M" preset={{ families: ['road_geometry', 'road_damage', 'speed_control', 'temporary_obstacles', 'debris', 'environmental', 'moving_hazards', 'visibility_roadside', 'bridge_structures'] }}
              intro="Real-world hazards frequently encountered on Indian roads. Most are not covered by sign standards; their representation is a RoadOS proposal using the RoadOS hazard tile." />} />
            <Route path="/item/:id" element={<EntryDetail />} />
            <Route path="/severity" element={<SeveritySystem />} />
            <Route path="/speed" element={<SpeedSystem />} />
            <Route path="/studio" element={<IconStudio />} />
            <Route path="/map" element={<MapPreview />} />
            <Route path="/corridor" element={<CorridorPreview />} />
            <Route path="/standards" element={<StandardsReferences />} />
            <Route path="/export" element={<ExportCentre />} />
            <Route path="/tokens" element={<DesignTokens />} />
            <Route path="/docs" element={<Documentation />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <footer className="border-t border-line px-8 py-4 text-[11px] text-faint">
          RoadOS Visual Hazard Studio · RVHL {version} · One visual language for every road. · Not ISO-certified or officially approved; severity levels and advisory speeds are RoadOS proposals.
        </footer>
      </div>
    </div>
  );
}
