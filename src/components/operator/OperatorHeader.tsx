import { useState, type KeyboardEvent } from 'react';
import { Search, ExternalLink, Radio, Zap, Sparkles, Tv } from 'lucide-react';

interface OperatorHeaderProps {
  onSearchSubmit: (query: string) => void;
  isAudienceOnline: boolean;
  autoplay: boolean;
  onToggleAutoplay: () => void;
  onOpenAudienceWindow: () => void;
}

export function OperatorHeader({
  onSearchSubmit,
  isAudienceOnline,
  autoplay,
  onToggleAutoplay,
  onOpenAudienceWindow,
}: OperatorHeaderProps) {
  const [searchInput, setSearchInput] = useState('');

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter' && searchInput.trim()) {
      onSearchSubmit(searchInput.trim());
    }
  };

  return (
    <header className="h-16 bg-zinc-950/80 border-b border-zinc-800/80 px-6 flex items-center justify-between gap-4 shrink-0 backdrop-blur-md">
      {/* Global Quick Search Bar */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Cari judul lagu, artis, atau paste link YouTube karaoke..."
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-xl pl-10 pr-24 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/30 transition-all"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <button
            onClick={() => searchInput.trim() && onSearchSubmit(searchInput.trim())}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 transition-colors"
          >
            Cari
          </button>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-3">
        {/* Autoplay toggle switch */}
        <button
          onClick={onToggleAutoplay}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all ${
            autoplay
              ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
              : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
          title="Mode Lomba: Autoplay non-aktif agar operator punya jeda antar peserta"
        >
          <Zap className={`w-3.5 h-3.5 ${autoplay ? 'text-amber-400 fill-amber-400' : 'text-zinc-500'}`} />
          <span>Autoplay: {autoplay ? 'ON' : 'OFF (Mode Lomba)'}</span>
        </button>

        {/* Audience Status & Launch Button */}
        <button
          onClick={onOpenAudienceWindow}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-semibold text-zinc-200 hover:text-white transition-colors"
          title="Buka Audience Screen di Jendela Baru"
        >
          <Tv className="w-3.5 h-3.5 text-amber-400" />
          <span>Layar Audience</span>
          <span
            className={`w-2 h-2 rounded-full ${
              isAudienceOnline ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'
            }`}
          />
        </button>
      </div>
    </header>
  );
}
