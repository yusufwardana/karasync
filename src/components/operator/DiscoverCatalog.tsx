import { useState, useEffect, type FormEvent } from 'react';
import { SongSearchResult } from '../../types';
import { formatTime } from '../../lib/formatters';
import {
  Compass,
  Plus,
  Music,
  Flame,
  Radio,
  Sparkles,
  Link,
  PlusCircle,
} from 'lucide-react';

interface DiscoverCatalogProps {
  onSelectSong: (song: SongSearchResult) => void;
}

export function DiscoverCatalog({ onSelectSong }: DiscoverCatalogProps) {
  const [catalog, setCatalog] = useState<SongSearchResult[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [customTitle, setCustomTitle] = useState('');
  const [customArtist, setCustomArtist] = useState('');
  const [customVideoId, setCustomVideoId] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  useEffect(() => {
    fetch('/api/discover')
      .then((res) => res.json())
      .then((data) => {
        setCatalog(data.catalog || []);
        setCategories(['All', ...(data.categories || [])]);
      })
      .catch((err) => console.error('Error fetching catalog:', err));
  }, []);

  const filteredSongs =
    selectedCategory === 'All'
      ? catalog
      : catalog.filter((s) => s.category === selectedCategory);

  const handleAddCustomSong = (e: FormEvent) => {
    e.preventDefault();
    if (!customTitle || !customVideoId) return;

    let cleanVideoId = customVideoId.trim();
    const match = cleanVideoId.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i
    );
    if (match) cleanVideoId = match[1];

    const customSong: SongSearchResult = {
      videoId: cleanVideoId,
      title: customTitle.trim(),
      artist: customArtist.trim() || 'Custom Artist',
      duration: 240,
      thumbnail: `https://img.youtube.com/vi/${cleanVideoId}/hqdefault.jpg`,
      category: 'Custom Import',
    };

    onSelectSong(customSong);
    setCustomTitle('');
    setCustomArtist('');
    setCustomVideoId('');
    setShowCustomForm(false);
  };

  return (
    <div className="space-y-6">
      {/* Hero Showcase Card */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            Katalog Rekomendasi
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">
            Pilihan Lagu Karaoke Siap Pakai
          </h2>
          <p className="text-xs text-zinc-400 leading-relaxed">
            Koleksi lagu populer Indonesia & internasional berformat karaoke dengan lirik video
            terverifikasi. Pilih lagu untuk dimasukkan ke antrean peserta lomba.
          </p>
        </div>

        <button
          onClick={() => setShowCustomForm(!showCustomForm)}
          className="relative z-10 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold border border-zinc-700 transition-colors flex items-center gap-2 shrink-0 self-start md:self-center"
        >
          <PlusCircle className="w-4 h-4 text-amber-400" />
          <span>{showCustomForm ? 'Tutup Form Manual' : 'Input Video YouTube Manual'}</span>
        </button>
      </div>

      {/* Manual Custom YouTube Video Input Form */}
      {showCustomForm && (
        <form
          onSubmit={handleAddCustomSong}
          className="bg-zinc-900 border border-amber-500/30 rounded-2xl p-5 shadow-xl space-y-4 animate-in fade-in duration-200"
        >
          <div className="flex items-center gap-2 text-sm font-bold text-amber-300">
            <Link className="w-4 h-4" />
            <span>Tambah Lagu dari YouTube URL / Video ID</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                Judul Lagu *
              </label>
              <input
                type="text"
                required
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="Contoh: Sial / Separuh Aku"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                Penyanyi / Artis
              </label>
              <input
                type="text"
                value={customArtist}
                onChange={(e) => setCustomArtist(e.target.value)}
                placeholder="Contoh: Mahalini / NOAH"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase mb-1">
                YouTube Link / Video ID *
              </label>
              <input
                type="text"
                required
                value={customVideoId}
                onChange={(e) => setCustomVideoId(e.target.value)}
                placeholder="https://youtube.com/watch?v=... atau ID (11 digit)"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setShowCustomForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-zinc-400 hover:text-white"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 text-xs font-bold transition-colors"
            >
              Pilih Peserta & Antrekan
            </button>
          </div>
        </form>
      )}

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20 font-bold'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 border border-zinc-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Songs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filteredSongs.map((song) => (
          <div
            key={song.videoId}
            className="flex flex-col justify-between p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/90 hover:border-zinc-700 transition-all group"
          >
            <div className="flex items-center gap-3.5 mb-3">
              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-zinc-800 shrink-0">
                <img
                  src={song.thumbnail}
                  alt={song.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-white truncate group-hover:text-amber-300 transition-colors">
                  {song.title}
                </h4>
                <p className="text-xs text-zinc-400 truncate mt-0.5">{song.artist}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] font-mono text-amber-400/90 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                    {formatTime(song.duration)}
                  </span>
                  {song.category && (
                    <span className="text-[10px] text-zinc-500 truncate">{song.category}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={() => onSelectSong(song)}
              className="w-full py-2 px-3 rounded-xl bg-zinc-800/90 hover:bg-amber-500 text-zinc-300 hover:text-zinc-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-zinc-700/60 hover:border-amber-500 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Pilih untuk Peserta</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
