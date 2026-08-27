import { useState, type FormEvent } from 'react';
import { Participant, SongSearchResult } from '../../types';
import { formatParticipantNumber, formatTime } from '../../lib/formatters';
import { Music, User, X, Check, Play, ListPlus } from 'lucide-react';

interface AddToQueueModalProps {
  song: SongSearchResult | null;
  participants: Participant[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (participantId: number, playNow?: boolean) => void;
}

export function AddToQueueModal({
  song,
  participants,
  isOpen,
  onClose,
  onConfirm,
}: AddToQueueModalProps) {
  const [selectedParticipantId, setSelectedParticipantId] = useState<number | ''>(
    participants.length > 0 ? participants[0].id : ''
  );
  const [playDirectly, setPlayDirectly] = useState(false);

  if (!isOpen || !song) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedParticipantId) return;
    onConfirm(Number(selectedParticipantId), playDirectly);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <ListPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Tambah ke Antrean</h2>
              <p className="text-xs text-zinc-400">Pilih peserta untuk lagu ini</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Song Preview Card */}
          <div className="flex items-center gap-3.5 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <img
              src={song.thumbnail}
              alt={song.title}
              className="w-16 h-12 rounded-lg object-cover bg-zinc-800 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-white truncate">{song.title}</h4>
              <p className="text-xs text-zinc-400 truncate">{song.artist}</p>
              <span className="text-[11px] font-mono text-amber-400 mt-0.5 inline-block">
                {formatTime(song.duration)}
              </span>
            </div>
          </div>

          {/* Participant Select Dropdown */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Peserta :
            </label>
            <div className="relative">
              <select
                value={selectedParticipantId}
                onChange={(e) => setSelectedParticipantId(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 transition-colors appearance-none cursor-pointer"
                required
              >
                {participants.map((p) => (
                  <option key={p.id} value={p.id}>
                    {formatParticipantNumber(p.number)} — {p.name} ({p.status})
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-zinc-500">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Action options */}
          <div className="flex items-center gap-2 pt-1">
            <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={playDirectly}
                onChange={(e) => setPlayDirectly(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-800 text-amber-500 focus:ring-0 focus:ring-offset-0 w-4 h-4"
              />
              <span>Langsung tampilkan & mainkan sekarang (Play Now)</span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={!selectedParticipantId}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 transition-all shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2"
            >
              {playDirectly ? <Play className="w-3.5 h-3.5 fill-current" /> : <Check className="w-3.5 h-3.5" />}
              {playDirectly ? 'Mainkan Sekarang' : 'Tambahkan ke Antrean'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
