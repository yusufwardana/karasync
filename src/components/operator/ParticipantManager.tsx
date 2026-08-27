import { useState, type FormEvent } from 'react';
import { Participant, ParticipantStatus, QueueItem } from '../../types';
import { formatParticipantNumber, getParticipantStatusBadge } from '../../lib/formatters';
import {
  Users,
  UserPlus,
  Music,
  Edit,
  Trash2,
  CheckCircle,
  Clock,
  Mic2,
  X,
  Search,
  Check,
} from 'lucide-react';

interface ParticipantManagerProps {
  participants: Participant[];
  queue: QueueItem[];
  onAddParticipant: (p: { name: string; number: number; note?: string }) => void;
  onUpdateStatus: (id: number, status: ParticipantStatus) => void;
  onAssignSongForParticipant: (participant: Participant) => void;
}

export function ParticipantManager({
  participants,
  queue,
  onAddParticipant,
  onUpdateStatus,
  onAssignSongForParticipant,
}: ParticipantManagerProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Participant form state
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState<number | ''>(
    participants.length > 0 ? Math.max(...participants.map((p) => p.number)) + 1 : 1
  );
  const [newNote, setNewNote] = useState('');

  const handleAddSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newNumber) return;

    onAddParticipant({
      name: newName.trim(),
      number: Number(newNumber),
      note: newNote.trim(),
    });

    setNewName('');
    setNewNumber(Number(newNumber) + 1);
    setNewNote('');
    setIsAddModalOpen(false);
  };

  const filtered = participants.filter((p) => {
    const matchesFilter = filterStatus === 'all' || p.status === filterStatus;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.number.toString().includes(searchQuery) ||
      (p.note && p.note.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Daftar Peserta Lomba</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
              {participants.length} Peserta
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Kelola data peserta secara independen. Satu peserta dapat memilih atau mengganti lagu kapan saja.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Peserta Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama atau no peserta..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
          />
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {['all', 'waiting', 'ready', 'on_stage', 'finished', 'skipped'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap capitalize transition-all ${
                filterStatus === st
                  ? 'bg-zinc-200 text-zinc-900 font-bold shadow'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
              }`}
            >
              {st === 'all' ? 'Semua' : st === 'on_stage' ? 'Di Panggung' : st}
            </button>
          ))}
        </div>
      </div>

      {/* Participants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((participant) => {
          const badge = getParticipantStatusBadge(participant.status);
          const assignedSongs = queue.filter((q) => q.participantId === participant.id);

          return (
            <div
              key={participant.id}
              className="p-4 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-zinc-800/90 hover:border-zinc-700 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header: Number & Status */}
                <div className="flex items-center justify-between mb-3">
                  <span className="w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-mono font-black text-amber-300 text-lg">
                    {formatParticipantNumber(participant.number)}
                  </span>

                  {/* Status Dropdown */}
                  <select
                    value={participant.status}
                    onChange={(e) =>
                      onUpdateStatus(participant.id, e.target.value as ParticipantStatus)
                    }
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg border focus:outline-none cursor-pointer ${badge.bg} ${badge.text} ${badge.border}`}
                  >
                    <option value="waiting" className="bg-zinc-900 text-zinc-300">
                      Waiting
                    </option>
                    <option value="ready" className="bg-zinc-900 text-amber-300">
                      Ready (Siap Tampil)
                    </option>
                    <option value="on_stage" className="bg-zinc-900 text-emerald-300">
                      On Stage (Di Panggung)
                    </option>
                    <option value="finished" className="bg-zinc-900 text-blue-300">
                      Finished (Selesai)
                    </option>
                    <option value="skipped" className="bg-zinc-900 text-rose-300">
                      Skipped (Dilewati)
                    </option>
                  </select>
                </div>

                {/* Name & Note */}
                <h3 className="text-base font-bold text-white">{participant.name}</h3>
                {participant.note && (
                  <p className="text-xs text-zinc-400 mt-0.5">{participant.note}</p>
                )}

                {/* Assigned Songs in Queue */}
                <div className="mt-3 pt-3 border-t border-zinc-800/80">
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase mb-1.5">
                    Lagu di Antrean:
                  </div>
                  {assignedSongs.length > 0 ? (
                    <div className="space-y-1.5">
                      {assignedSongs.map((song) => (
                        <div
                          key={song.queueId}
                          className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950/60 border border-zinc-800/60 text-xs"
                        >
                          <Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span className="font-semibold text-zinc-200 truncate">
                            {song.title}
                          </span>
                          <span className="text-zinc-500">•</span>
                          <span className="text-zinc-400 truncate">{song.artist}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-400 italic">Belum memilih lagu.</p>
                  )}
                </div>
              </div>

              {/* Action: Assign / Change Song */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80">
                <button
                  onClick={() => onAssignSongForParticipant(participant)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-amber-500 text-zinc-300 hover:text-zinc-950 text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-zinc-700/60 hover:border-amber-500"
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>{assignedSongs.length > 0 ? '+ Tambah Lagu Lagi' : 'Pilihkan Lagu'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Participant Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Tambah Peserta Lomba</h2>
                  <p className="text-xs text-zinc-400">Registrasi nomor urut & nama peserta</p>
                </div>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1.5">
                  Nomor Urut Peserta *
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={newNumber}
                  onChange={(e) => setNewNumber(parseInt(e.target.value, 10))}
                  placeholder="Contoh: 15"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1.5">
                  Nama Lengkap Peserta *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Contoh: Budi Darmawan"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 uppercase mb-1.5">
                  Kategori / Catatan (Opsional)
                </label>
                <input
                  type="text"
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Contoh: Kategori Pop Dewasa / Vocal Group"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-2"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Simpan Peserta</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
