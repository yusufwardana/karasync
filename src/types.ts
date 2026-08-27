export type ParticipantStatus = 'waiting' | 'ready' | 'on_stage' | 'finished' | 'skipped';

export interface Participant {
  id: number;
  number: number;
  name: string;
  status: ParticipantStatus;
  note?: string;
}

export type QueueItemStatus = 'queued' | 'ready' | 'playing' | 'finished' | 'skipped';

export interface QueueItem {
  queueId: number;
  participantId: number;
  participantName: string;
  participantNumber: number;
  videoId: string;
  title: string;
  artist: string;
  thumbnail?: string;
  duration?: number;
  status: QueueItemStatus;
  order: number;
  addedAt: number;
}

export type PlaybackDesiredStateType = 'IDLE' | 'CUED' | 'PLAYING' | 'PAUSED' | 'STOPPED';

export interface PlaybackDesiredState {
  currentQueueId: number | null;
  currentVideoId: string | null;
  desiredState: PlaybackDesiredStateType;
  desiredSeek: number;
  volume: number;
  isMuted: boolean;
  autoplay: boolean;
  pendingPlayFor?: string | null;
}

export type AudiencePlayerStateType =
  | 'IDLE'
  | 'CUED'
  | 'READY'
  | 'PLAYING'
  | 'PAUSED'
  | 'BUFFERING'
  | 'ENDED'
  | 'ERROR';

export interface AudiencePlayerState {
  state: AudiencePlayerStateType;
  videoId: string | null;
  currentTime: number;
  duration: number;
  volume: number;
  isOnline: boolean;
  lastHeartbeat: number;
  errorMessage?: string;
}

export interface OverlayData {
  number: number;
  name: string;
  title: string;
  artist: string;
}

export interface OverlayState {
  showNextParticipant: boolean;
  nextParticipantData: OverlayData | null;
  showStageWelcome: boolean;
  stageParticipantData: OverlayData | null;
  overlayTimestamp: number;
}

export interface KaraokeStateSnapshot {
  playback: PlaybackDesiredState;
  audienceState: AudiencePlayerState;
  queue: QueueItem[];
  participants: Participant[];
  history: QueueItem[];
  overlay: OverlayState;
  serverTime: number;
}

export type PlaybackCommandType =
  | 'CUE'
  | 'PLAY'
  | 'PAUSE'
  | 'STOP'
  | 'SEEK'
  | 'NEXT'
  | 'PREVIOUS'
  | 'SET_VOLUME';

export interface SongSearchResult {
  videoId: string;
  title: string;
  artist: string;
  duration: number;
  thumbnail: string;
  category?: string;
}

export type ActiveTab = 'discover' | 'search' | 'participants' | 'queue' | 'history';
