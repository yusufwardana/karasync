import { useState, type FormEvent } from 'react';
import { Participant, QueueItem } from '../../types';
import { formatParticipantNumber } from '../../lib/formatters';
import { User, X, Check, Edit2 } from 'lucide-react';

interface ChangeParticipantModalProps {
  queueItem: QueueItem | null;
  participants: Participant[];
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (queueId: number, newParticipantId: number) => void;
}

export function ChangeParticipantModal({
  queueItem,
  participants,
  isOpen,
  onClose,
  onConfirm,
}: ChangeParticipantModalProps) {
  const [selectedId, setSelectedId] = useState<number | ''>(
    queueItem ? queueItem.participantId : ''
  );

  if (!isOpen || !queueItem) return null;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    onConfirm(queueItem.queueId, Number(selectedId));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Ganti Peserta untuk Lagu</h2>
              <p className="text-xs text-zinc-400 truncate">{queueItem.title} - {queueItem.artist}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-zinc-300 uppercase tracking-wider">
              Pilih Peserta Baru:
            </label>
            <div className="relative">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(Number(e.target.value))}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
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

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-2"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
