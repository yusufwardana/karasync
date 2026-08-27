import {
  KaraokeStateSnapshot,
  PlaybackCommandType,
  PlaybackDesiredState,
  AudiencePlayerState,
  OverlayState,
  QueueItem,
  Participant,
} from '../types';

type Listener<T> = (data: T) => void;

class RealtimeClient {
  private ws: WebSocket | null = null;
  private role: 'operator' | 'audience' = 'operator';
  private reconnectTimer: any = null;
  private heartbeatInterval: any = null;
  private isExplicitlyClosed = false;

  private listeners = {
    snapshot: new Set<Listener<KaraokeStateSnapshot>>(),
    playbackSync: new Set<Listener<{ playback: PlaybackDesiredState; command?: string; targetVideoId?: string }>>(),
    mirrorProgress: new Set<Listener<{ videoId: string; currentTime: number; duration: number; state: string }>>(),
    audienceStateSync: new Set<Listener<{ state: string; videoId: string | null; error?: string }>>(),
    overlayAnnouncement: new Set<Listener<OverlayState>>(),
    queueUpdated: new Set<Listener<{ queue: QueueItem[] }>>(),
    participantsUpdated: new Set<Listener<{ participants: Participant[] }>>(),
    audiencePresence: new Set<Listener<{ isOnline: boolean }>>(),
    connectionStatus: new Set<Listener<boolean>>(),
  };

  public isConnected = false;

  public init(role: 'operator' | 'audience') {
    this.role = role;
    this.isExplicitlyClosed = false;
    this.connect();
  }

  private getWsUrl(): string {
    const loc = window.location;
    const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${loc.host}/ws`;
  }

  private connect() {
    if (this.isExplicitlyClosed) return;

    try {
      this.ws = new WebSocket(this.getWsUrl());

      this.ws.onopen = () => {
        this.isConnected = true;
        this.emitConnection(true);

        // Identify role
        this.send('IDENTIFY', { role: this.role });

        // Start heartbeat
        this.startHeartbeat();
      };

      this.ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const { type, payload } = msg;

          switch (type) {
            case 'SNAPSHOT':
              this.listeners.snapshot.forEach((fn) => fn(payload));
              break;
            case 'PLAYBACK_STATE_SYNC':
              this.listeners.playbackSync.forEach((fn) => fn(payload));
              break;
            case 'MIRROR_PROGRESS':
              this.listeners.mirrorProgress.forEach((fn) => fn(payload));
              break;
            case 'AUDIENCE_STATE_SYNC':
              this.listeners.audienceStateSync.forEach((fn) => fn(payload));
              break;
            case 'OVERLAY_ANNOUNCEMENT':
              this.listeners.overlayAnnouncement.forEach((fn) => fn(payload));
              break;
            case 'QUEUE_UPDATED':
              this.listeners.queueUpdated.forEach((fn) => fn(payload));
              break;
            case 'PARTICIPANTS_UPDATED':
              this.listeners.participantsUpdated.forEach((fn) => fn(payload));
              break;
            case 'AUDIENCE_PRESENCE':
              this.listeners.audiencePresence.forEach((fn) => fn(payload));
              break;
            case 'PONG':
              // Heartbeat reply
              break;
          }
        } catch (e) {
          console.error('Error handling WebSocket message:', e);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emitConnection(false);
        this.stopHeartbeat();
        if (!this.isExplicitlyClosed) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch (err) {
      console.warn('WebSocket connection error, retrying...', err);
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, 2000);
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send('HEARTBEAT', { role: this.role });
      }
    }, 3000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  public send(type: string, payload: any = {}) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    }
  }

  private emitConnection(status: boolean) {
    this.listeners.connectionStatus.forEach((fn) => fn(status));
  }

  // Event subscription helpers
  public onSnapshot(fn: Listener<KaraokeStateSnapshot>) {
    this.listeners.snapshot.add(fn);
    return () => this.listeners.snapshot.delete(fn);
  }

  public onPlaybackSync(
    fn: Listener<{ playback: PlaybackDesiredState; command?: string; targetVideoId?: string }>
  ) {
    this.listeners.playbackSync.add(fn);
    return () => this.listeners.playbackSync.delete(fn);
  }

  public onMirrorProgress(
    fn: Listener<{ videoId: string; currentTime: number; duration: number; state: string }>
  ) {
    this.listeners.mirrorProgress.add(fn);
    return () => this.listeners.mirrorProgress.delete(fn);
  }

  public onAudienceStateSync(
    fn: Listener<{ state: string; videoId: string | null; error?: string }>
  ) {
    this.listeners.audienceStateSync.add(fn);
    return () => this.listeners.audienceStateSync.delete(fn);
  }

  public onOverlayAnnouncement(fn: Listener<OverlayState>) {
    this.listeners.overlayAnnouncement.add(fn);
    return () => this.listeners.overlayAnnouncement.delete(fn);
  }

  public onQueueUpdated(fn: Listener<{ queue: QueueItem[] }>) {
    this.listeners.queueUpdated.add(fn);
    return () => this.listeners.queueUpdated.delete(fn);
  }

  public onParticipantsUpdated(fn: Listener<{ participants: Participant[] }>) {
    this.listeners.participantsUpdated.add(fn);
    return () => this.listeners.participantsUpdated.delete(fn);
  }

  public onAudiencePresence(fn: Listener<{ isOnline: boolean }>) {
    this.listeners.audiencePresence.add(fn);
    return () => this.listeners.audiencePresence.delete(fn);
  }

  public onConnectionStatus(fn: Listener<boolean>) {
    this.listeners.connectionStatus.add(fn);
    return () => this.listeners.connectionStatus.delete(fn);
  }

  // Operator Action Helpers
  public sendPlaybackCommand(
    command: PlaybackCommandType,
    params: {
      videoId?: string | null;
      seekTo?: number;
      volume?: number;
      autoplay?: boolean;
    } = {}
  ) {
    this.send('PLAYBACK_COMMAND', {
      command,
      videoId: params.videoId,
      seekTo: params.seekTo,
      volume: params.volume,
      autoplay: params.autoplay,
    });
  }

  public callNextParticipant() {
    this.send('CALL_NEXT_PARTICIPANT', {});
  }

  public hideOverlay() {
    this.send('HIDE_OVERLAY', {});
  }

  public addToQueue(item: {
    participantId: number;
    videoId: string;
    title: string;
    artist: string;
    thumbnail?: string;
    duration?: number;
    playNow?: boolean;
  }) {
    this.send('ADD_TO_QUEUE', item);
  }

  public reorderQueue(queueIds: number[]) {
    this.send('REORDER_QUEUE', { queueIds });
  }

  public removeFromQueue(queueId: number) {
    this.send('REMOVE_FROM_QUEUE', { queueId });
  }

  public changeQueueStatus(queueId: number, status: string) {
    this.send('CHANGE_QUEUE_STATUS', { queueId, status });
  }

  public addParticipant(participant: { name: string; number: number; note?: string }) {
    this.send('ADD_PARTICIPANT', participant);
  }

  public updateParticipantStatus(id: number, status: string) {
    this.send('UPDATE_PARTICIPANT_STATUS', { id, status });
  }

  // Audience Action Helpers
  public sendAudienceProgress(progress: {
    videoId: string;
    currentTime: number;
    duration: number;
    state: string;
  }) {
    this.send('AUDIENCE_PROGRESS', progress);
  }

  public sendAudienceStateChange(stateData: {
    state: string;
    videoId: string | null;
    error?: string;
  }) {
    this.send('AUDIENCE_STATE_CHANGE', stateData);
  }

  public destroy() {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();
    clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
    }
  }
}

export const realtime = new RealtimeClient();
