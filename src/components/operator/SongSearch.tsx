import { useState, useEffect, type FormEvent } from 'react';
import { SongSearchResult } from '../../types';
import { formatTime } from '../../lib/formatters';
import { Search, Plus, Music, Loader2, Link2, Sparkles } from 'lucide-react';

interface SongSearchProps {
  initialQuery?: string;
  onSelectSong: (song: SongSearchResult) => void;
}

export function SongSearch({ initialQuery = '', onSelectSong }: SongSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SongSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const quickPills = ['Noah', 'Mahalini', 'Dewa 19', 'Sheila On 7', 'Queen', 'Adele', 'Happy Asmara'];

  const performSearch = async (searchTerm: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch (err) {
      console.error('Search fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      performSearch(initialQuery);
    } else {
      performSearch('');
    }
  }, [initialQuery]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      performSearch(query.trim());
    }
  };

  const handlePillClick = (pill: string) => {
    setQuery(pill);
    performSearch(pill);
  };

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xl font-bold text-white mb-1">Cari Lagu Karaoke</h2>
        <p className="text-xs text-zinc-400 mb-4">
          Cari judul lagu, artis, atau tempel link video YouTube karaoke langsung.
        </p>

        <form onSubmit={handleSubmit} className="relative mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari judul lagu atau artis..."
            className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-11 pr-28 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/30 transition-colors"
          />
          <Search className="w-5 h-5 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-colors flex items-center gap-1.5"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            <span>Cari</span>
          </button>
        </form>

        {/* Quick Search Preset Tags */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-zinc-500 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Populer:
          </span>
          {quickPills.map((pill) => (
            <button
              key={pill}
              type="button"
              onClick={() => handlePillClick(pill)}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700/60 transition-colors"
            >
              {pill}
            </button>
          ))}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs font-medium text-zinc-400 px-1">
          <span>Hasil Pencarian ({results.length})</span>
          <span>Klik tombol + untuk menambah ke antrean peserta</span>
        </div>

        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center text-zinc-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
            <p className="text-sm font-medium">Mencari katalog karaoke YouTube...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {results.map((song) => (
              <div
                key={song.videoId + song.title}
                className="flex items-center gap-3.5 p-3.5 rounded-xl bg-zinc-900/70 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700/80 transition-all group"
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-14 rounded-lg overflow-hidden bg-zinc-800 shrink-0">
                  <img
                    src={song.thumbnail}
                    alt={song.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[10px] font-mono text-white">
                    {formatTime(song.duration)}
                  </span>
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-white truncate group-hover:text-amber-300 transition-colors">
                    {song.title}
                  </h4>
                  <p className="text-xs text-zinc-400 truncate mt-0.5">{song.artist}</p>
                  {song.category && (
                    <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-medium">
                      {song.category}
                    </span>
                  )}
                </div>

                {/* Add to Queue Button */}
                <button
                  onClick={() => onSelectSong(song)}
                  className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-amber-500 text-zinc-300 hover:text-zinc-950 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 border border-zinc-700/60 hover:border-amber-500"
                  title="Tambah ke Antrean"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-16 text-center text-zinc-500 bg-zinc-900/40 rounded-2xl border border-zinc-800/60">
            <Music className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
            <p className="text-sm font-medium">Tidak ada hasil yang cocok.</p>
            <p className="text-xs text-zinc-600 mt-1">
              Coba cari dengan kata kunci lain atau paste video ID YouTube langsung.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
