import { QueueItem } from '../../types';
import { formatParticipantNumber, formatTime } from '../../lib/formatters';
import { History, RotateCcw, CheckCircle2, Music } from 'lucide-react';

interface HistoryPanelProps {
  history: QueueItem[];
  onRequeue: (item: QueueItem) => void;
}

export function HistoryPanel({ history, onRequeue }: HistoryPanelProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <History className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Riwayat Tampil Selesai</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 font-mono text-xs font-bold">
              {history.length} Lagu
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Daftar lagu yang telah selesai dinyanyikan pada sesi lomba/acara ini.
          </p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-2.5">
        {history.length > 0 ? (
          history.map((item, idx) => (
            <div
              key={`${item.queueId}-${idx}`}
              className="flex items-center justify-between p-4 rounded-2xl bg-zinc-900/70 border border-zinc-800/80 hover:border-zinc-700 transition-all"
            >
              <div className="flex items-center gap-3.5 min-w-0">
                <span className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center font-mono font-bold text-blue-300 text-xs shrink-0">
                  {formatParticipantNumber(item.participantNumber)}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">{item.title}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-xs text-zinc-400 truncate">{item.artist}</span>
                  </div>
                  <div className="text-xs text-amber-400 mt-0.5">
                    {item.participantName}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono text-zinc-500">
                  {formatTime(item.duration)}
                </span>
                <button
                  onClick={() => onRequeue(item)}
                  className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold border border-zinc-700 transition-colors flex items-center gap-1.5"
                  title="Antrekan Kembali"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Antrekan Lagi</span>
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="py-16 text-center text-zinc-500 bg-zinc-900/40 rounded-2xl border border-zinc-800/60">
            <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
            <p className="text-sm font-medium">Belum ada riwayat lagu yang selesai.</p>
            <p className="text-xs text-zinc-600 mt-1">
              Ketika lagu di Audience berakhir atau ditandai selesai, riwayat akan tercatat di sini.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
