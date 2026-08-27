import { useState, useEffect } from 'react';
import { OperatorDashboard } from './components/operator/OperatorDashboard';
import { AudienceScreen } from './components/audience/AudienceScreen';
import { Monitor, Tv, SplitSquareVertical, ExternalLink } from 'lucide-react';

export default function App() {
  const [currentView, setCurrentView] = useState<'operator' | 'audience' | 'split'>('operator');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const viewParam = params.get('view');
    if (viewParam === 'audience') {
      setCurrentView('audience');
    } else if (viewParam === 'split') {
      setCurrentView('split');
    } else if (viewParam === 'operator') {
      setCurrentView('operator');
    }
  }, []);

  const setViewMode = (mode: 'operator' | 'audience' | 'split') => {
    setCurrentView(mode);
    const url = new URL(window.location.href);
    url.searchParams.set('view', mode);
    window.history.replaceState({}, '', url.toString());
  };

  const handleOpenAudienceTab = () => {
    const audienceUrl = `${window.location.origin}/?view=audience`;
    window.open(audienceUrl, '_blank');
  };

  // Pure Audience Screen (used for stage projector / second screen)
  if (currentView === 'audience') {
    return (
      <div className="relative w-screen h-screen bg-black overflow-hidden">
        {/* Subtle top switcher if hovered on stage for developer convenience */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-50 opacity-0 hover:opacity-100 transition-opacity bg-zinc-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800 flex items-center gap-2 text-xs">
          <span className="text-zinc-400 text-[11px]">Mode Layar:</span>
          <button
            onClick={() => setViewMode('operator')}
            className="px-2.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
          >
            Buka Operator
          </button>
          <button
            onClick={() => setViewMode('split')}
            className="px-2.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold"
          >
            Split View
          </button>
        </div>

        <AudienceScreen />
      </div>
    );
  }

  // Split View (Side-by-Side testing for operators with dual screen simulation)
  if (currentView === 'split') {
    return (
      <div className="flex flex-col h-screen w-screen bg-zinc-950 overflow-hidden">
        {/* Top Split View Bar */}
        <div className="h-10 bg-zinc-900 border-b border-zinc-800 px-4 flex items-center justify-between text-xs shrink-0 select-none">
          <div className="flex items-center gap-3">
            <span className="font-bold text-amber-400 flex items-center gap-1.5">
              <SplitSquareVertical className="w-4 h-4" />
              Dual Screen Simulator (Operator + Audience)
            </span>
            <span className="text-zinc-500">•</span>
            <span className="text-zinc-400">
              YouTube Player hanya ada di sisi kanan (Audience). Sisi kiri (Operator) hanya mirror.
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('operator')}
              className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors"
            >
              Operator Only
            </button>
            <button
              onClick={() => setViewMode('audience')}
              className="px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors"
            >
              Audience Only
            </button>
            <button
              onClick={handleOpenAudienceTab}
              className="px-3 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold flex items-center gap-1.5 transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Audience di Tab Baru</span>
            </button>
          </div>
        </div>

        {/* Split Panels */}
        <div className="flex-1 flex overflow-hidden">
          <div className="w-3/5 h-full border-r border-zinc-800 overflow-hidden relative">
            <OperatorDashboard onOpenAudienceWindow={handleOpenAudienceTab} />
          </div>
          <div className="w-2/5 h-full bg-black overflow-hidden relative">
            <AudienceScreen />
          </div>
        </div>
      </div>
    );
  }

  // Operator Dashboard (Default)
  return (
    <div className="relative w-screen h-screen bg-zinc-950 overflow-hidden">
      {/* Quick View Toggle Pill at bottom right */}
      <div className="fixed bottom-24 right-6 z-40 flex items-center gap-1.5 bg-zinc-900/90 border border-zinc-800 backdrop-blur-md px-3 py-1.5 rounded-full shadow-2xl">
        <span className="text-[11px] font-semibold text-zinc-400 mr-1">Tampilan:</span>
        <button
          onClick={() => setViewMode('operator')}
          className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-500 text-zinc-950 shadow"
        >
          Operator
        </button>
        <button
          onClick={() => setViewMode('split')}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800"
          title="Lihat kedua layar berdampingan"
        >
          Split View
        </button>
        <button
          onClick={() => setViewMode('audience')}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-zinc-800"
          title="Buka layar Audience"
        >
          Audience
        </button>
      </div>

      <OperatorDashboard onOpenAudienceWindow={handleOpenAudienceTab} />
    </div>
  );
}
