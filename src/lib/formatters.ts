import { ParticipantStatus, QueueItemStatus } from '../types';

export function formatTime(seconds: number | undefined | null): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds < 0) {
    return '00:00';
  }
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function formatParticipantNumber(num: number | undefined | null): string {
  if (num === undefined || num === null) return '#--';
  return `#${num.toString().padStart(2, '0')}`;
}

export function getParticipantStatusBadge(status: ParticipantStatus): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (status) {
    case 'on_stage':
      return {
        label: 'Di Panggung',
        bg: 'bg-emerald-500/15',
        text: 'text-emerald-400',
        border: 'border-emerald-500/30',
      };
    case 'ready':
      return {
        label: 'Siap Tampil',
        bg: 'bg-amber-500/15',
        text: 'text-amber-400',
        border: 'border-amber-500/30',
      };
    case 'waiting':
      return {
        label: 'Menunggu',
        bg: 'bg-zinc-800',
        text: 'text-zinc-400',
        border: 'border-zinc-700',
      };
    case 'finished':
      return {
        label: 'Selesai',
        bg: 'bg-blue-500/15',
        text: 'text-blue-400',
        border: 'border-blue-500/30',
      };
    case 'skipped':
      return {
        label: 'Dilewati',
        bg: 'bg-rose-500/15',
        text: 'text-rose-400',
        border: 'border-rose-500/30',
      };
    default:
      return {
        label: status,
        bg: 'bg-zinc-800',
        text: 'text-zinc-400',
        border: 'border-zinc-700',
      };
  }
}

export function getQueueStatusBadge(status: QueueItemStatus): {
  label: string;
  bg: string;
  text: string;
} {
  switch (status) {
    case 'playing':
      return {
        label: 'Sedang Main',
        bg: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40',
        text: 'text-emerald-400',
      };
    case 'ready':
      return {
        label: 'Berikutnya',
        bg: 'bg-amber-500/20 text-amber-400 border border-amber-500/40',
        text: 'text-amber-400',
      };
    case 'queued':
      return {
        label: 'Antre',
        bg: 'bg-zinc-800 text-zinc-300 border border-zinc-700',
        text: 'text-zinc-400',
      };
    case 'finished':
      return {
        label: 'Selesai',
        bg: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
        text: 'text-blue-400',
      };
    case 'skipped':
      return {
        label: 'Dilewati',
        bg: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
        text: 'text-rose-400',
      };
  }
}
