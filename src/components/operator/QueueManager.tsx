import { useState, type DragEvent } from 'react';
import { QueueItem, Participant, QueueItemStatus } from '../../types';
import { formatParticipantNumber, formatTime, getQueueStatusBadge } from '../../lib/formatters';
import { ChangeParticipantModal } from './ChangeParticipantModal';
import {
  GripVertical,
  Play,
  Trash2,
  ArrowUp,
  ArrowDown,
  UserCheck,
  CheckCircle2,
  FastForward,
  Music,
  Plus,
  ListOrdered,
  Sparkles,
} from 'lucide-react';

interface QueueManagerProps {
  queue: QueueItem[];
  participants: Participant[];
  currentQueueId: number | null;
  onReorder: (queueIds: number[]) => void;
  onRemove: (queueId: number) => void;
  onStatusChange: (queueId: number, status: QueueItemStatus) => void;
  onPlayNow: (queueItem: QueueItem) => void;
  onOpenSearch: () => void;
  onUpdateQueueItemParticipant: (queueId: number, newParticipantId: number) => void;
}

export function QueueManager({
  queue,
  participants,
  currentQueueId,
  onReorder,
  onRemove,
  onStatusChange,
  onPlayNow,
  onOpenSearch,
  onUpdateQueueItemParticipant,
}: QueueManagerProps) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<QueueItem | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Drag and drop handlers
  const handleDragStart = (index: number) => {
    setDraggedIdx(index);
  };

  const handleDragOver = (e: DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIdx(index);
  };

  const handleDrop = (dropIndex: number) => {
    if (draggedIdx === null || draggedIdx === dropIndex) {
      setDraggedIdx(null);
      setDragOverIdx(null);
      return;
    }

    const updated = [...queue];
    const [moved] = updated.splice(draggedIdx, 1);
    updated.splice(dropIndex, 0, moved);

    setDraggedIdx(null);
    setDragOverIdx(null);
    onReorder(updated.map((q) => q.queueId));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= queue.length) return;

    const updated = [...queue];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    onReorder(updated.map((q) => q.queueId));
  };

  const filteredQueue =
    filterStatus === 'all'
      ? queue
      : queue.filter((q) => q.status === filterStatus);

  return (
    <div className="space-y-6">
      {/* Header Panel */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ListOrdered className="w-5 h-5 text-amber-400" />
            <h2 className="text-xl font-bold text-white">Daftar Antrean Karaoke</h2>
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-mono text-xs font-bold">
              {queue.length} Lagu
            </span>
          </div>
          <p className="text-xs text-zinc-400">
            Geser urutan (drag & drop) untuk mengatur giliran tampil peserta secara fleksibel.
          </p>
        </div>

        {/* Action button */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Lagu Baru</span>
          </button>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2">
        {['all', 'playing', 'ready', 'queued', 'finished', 'skipped'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
              filterStatus === st
                ? 'bg-zinc-200 text-zinc-900 font-bold shadow'
                : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-zinc-800'
            }`}
          >
            {st === 'all' ? 'Semua' : st}
          </button>
        ))}
      </div>

      {/* Queue List */}
      <div className="space-y-2.5">
        {filteredQueue.length > 0 ? (
          filteredQueue.map((item, index) => {
            const isCurrent = item.queueId === currentQueueId || item.status === 'playing';
            const badge = getQueueStatusBadge(item.status);
            const isDragOver = dragOverIdx === index;

            return (
              <div
                key={item.queueId}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={() => {
                  setDraggedIdx(null);
                  setDragOverIdx(null);
                }}
                className={`flex items-center gap-3 p-3.5 rounded-2xl transition-all border select-none ${
                  isCurrent
                    ? 'bg-zinc-900/95 border-amber-500/60 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
                    : 'bg-zinc-900/70 hover:bg-zinc-900 border-zinc-800/80'
                } ${isDragOver ? 'border-amber-400 bg-amber-500/5' : ''}`}
              >
                {/* Drag Handle */}
                <div
                  className="cursor-grab active:cursor-grabbing p-1 text-zinc-600 hover:text-zinc-300"
                  title="Drag untuk mengubah urutan"
                >
                  <GripVertical className="w-5 h-5" />
                </div>

                {/* Queue Position Index */}
                <span className="w-6 text-center font-mono text-xs font-bold text-zinc-400">
                  {index + 1}
                </span>

                {/* Participant Number Badge */}
                <div className="w-11 h-11 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-amber-300 text-sm shrink-0">
                  {formatParticipantNumber(item.participantNumber)}
                </div>

                {/* Song & Participant Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white truncate">{item.title}</span>
                    <span className="text-zinc-500">•</span>
                    <span className="text-xs text-zinc-400 truncate">{item.artist}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-semibold text-amber-400 truncate">
                      {item.participantName}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-[11px] font-mono text-zinc-400">
                      {formatTime(item.duration)}
                    </span>
                  </div>
                </div>

                {/* Status Pill */}
                <div className="shrink-0">
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${badge.bg}`}>
                    {badge.label}
                  </span>
                </div>

                {/* Reorder Buttons (Up/Down) */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => moveItem(index, 'up')}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Geser Naik"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => moveItem(index, 'down')}
                    disabled={index === queue.length - 1}
                    className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 disabled:opacity-30 disabled:hover:bg-transparent"
                    title="Geser Turun"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick Action Menus */}
                <div className="flex items-center gap-1.5 shrink-0 pl-2 border-l border-zinc-800">
                  {/* Play Now */}
                  {!isCurrent && (
                    <button
                      onClick={() => onPlayNow(item)}
                      className="p-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-zinc-950 text-xs font-semibold transition-colors"
                      title="Mainkan Sekarang (Play Now)"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                    </button>
                  )}

                  {/* Change Participant */}
                  <button
                    onClick={() => setEditingItem(item)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs transition-colors"
                    title="Ganti Peserta"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                  </button>

                  {/* Mark Finished */}
                  {item.status !== 'finished' && (
                    <button
                      onClick={() => onStatusChange(item.queueId, 'finished')}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-emerald-900/60 text-zinc-400 hover:text-emerald-400 text-xs transition-colors"
                      title="Tandai Selesai"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Skip */}
                  {item.status !== 'skipped' && item.status !== 'finished' && (
                    <button
                      onClick={() => onStatusChange(item.queueId, 'skipped')}
                      className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-900/60 text-zinc-400 hover:text-rose-400 text-xs transition-colors"
                      title="Lewati (Skip)"
                    >
                      <FastForward className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Remove */}
                  <button
                    onClick={() => onRemove(item.queueId)}
                    className="p-2 rounded-xl bg-zinc-800 hover:bg-rose-500 text-zinc-400 hover:text-white text-xs transition-colors"
                    title="Hapus dari Antrean"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="py-16 text-center text-zinc-500 bg-zinc-900/40 rounded-2xl border border-zinc-800/60">
            <Music className="w-10 h-10 mx-auto mb-2 text-zinc-600" />
            <p className="text-sm font-medium">Antrean karaoke masih kosong.</p>
            <button
              onClick={onOpenSearch}
              className="mt-3 px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold"
            >
              Cari & Tambah Lagu Sekarang
            </button>
          </div>
        )}
      </div>

      {/* Change Participant Modal */}
      <ChangeParticipantModal
        queueItem={editingItem}
        participants={participants}
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        onConfirm={(qId, newPartId) => {
          onUpdateQueueItemParticipant(qId, newPartId);
        }}
      />
    </div>
  );
}
