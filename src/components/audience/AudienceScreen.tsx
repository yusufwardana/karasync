import { useEffect, useState, useRef, useCallback } from 'react';
import { realtime } from '../../lib/realtime';
import {
  KaraokeStateSnapshot,
  AudiencePlayerStateType,
  OverlayState,
  PlaybackDesiredState,
  QueueItem,
} from '../../types';
import { YouTubeIFramePlayer } from './YouTubeIFramePlayer';
import { AudienceOverlay } from './AudienceOverlay';
import { LyricsOverlay } from './LyricsOverlay';
import { formatParticipantNumber, formatTime } from '../../lib/formatters';
import {
  Maximize2,
  Minimize2,
  Mic2,
  Volume2,
  VolumeX,
  Radio,
  Wifi,
  WifiOff,
  Music,
} from 'lucide-react';

export function AudienceScreen() {
  const [snapshot, setSnapshot] = useState<KaraokeStateSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [needsUserInteraction, setNeedsUserInteraction] = useState(false);
  const [playerState, setPlayerState] = useState<AudiencePlayerStateType>('IDLE');
  const [currentProgress, setCurrentProgress] = useState({ currentTime: 0, duration: 0 });
  const [overlayState, setOverlayState] = useState<OverlayState>({
    showNextParticipant: false,
    nextParticipantData: null,
    showStageWelcome: false,
    stageParticipantData: null,
    overlayTimestamp: 0,
  });

  const lastBroadcastProgressRef = useRef<number>(0);

  // Initialize Realtime WebSocket as Audience
  useEffect(() => {
    realtime.init('audience');

    const unsubConnection = realtime.onConnectionStatus(setIsConnected);

    const unsubSnapshot = realtime.onSnapshot((data) => {
      setSnapshot(data);
      if (data.overlay) {
        setOverlayState(data.overlay);
      }
    });

    const unsubPlayback = realtime.onPlaybackSync((data) => {
      setSnapshot((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          playback: data.playback,
        };
      });
    });

    const unsubOverlay = realtime.onOverlayAnnouncement((data) => {
      setOverlayState(data);
    });

    const unsubQueue = realtime.onQueueUpdated((data) => {
      setSnapshot((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          queue: data.queue,
        };
      });
    });

    return () => {
      unsubConnection();
      unsubSnapshot();
      unsubPlayback();
      unsubOverlay();
      unsubQueue();
    };
  }, []);

  const handleStateChange = useCallback((newState: AudiencePlayerStateType, videoId: string | null) => {
    setPlayerState(newState);
    realtime.sendAudienceStateChange({
      state: newState,
      videoId,
    });
  }, []);

  const handleProgress = useCallback(
    (currentTime: number, duration: number, state: AudiencePlayerStateType) => {
      setCurrentProgress({ currentTime, duration });

      // Throttle broadcast progress to 300ms
      const now = Date.now();
      if (now - lastBroadcastProgressRef.current > 300) {
        lastBroadcastProgressRef.current = now;
        if (snapshot?.playback.currentVideoId) {
          realtime.sendAudienceProgress({
            videoId: snapshot.playback.currentVideoId,
            currentTime,
            duration,
            state,
          });
        }
      }
    },
    [snapshot?.playback.currentVideoId]
  );

  const handlePlayerError = useCallback((errorMsg: string) => {
    realtime.sendAudienceStateChange({
      state: 'ERROR',
      videoId: snapshot?.playback.currentVideoId || null,
      error: errorMsg,
    });
  }, [snapshot?.playback.currentVideoId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Find current playing queue item
  const currentItem: QueueItem | undefined = snapshot?.queue.find(
    (q) => q.queueId === snapshot.playback.currentQueueId
  );

  const desiredPlayback: PlaybackDesiredState = snapshot?.playback || {
    currentQueueId: null,
    currentVideoId: null,
    desiredState: 'IDLE',
    desiredSeek: 0,
    volume: 80,
    isMuted: false,
    autoplay: false,
  };

  const hasActiveVideo = Boolean(desiredPlayback.currentVideoId);

  return (
    <div className="relative w-screen h-screen bg-black text-white overflow-hidden select-none flex flex-col items-center justify-center font-sans">
      {/* Background YouTube Player */}
      <div className="absolute inset-0 z-0">
        <YouTubeIFramePlayer
          videoId={desiredPlayback.currentVideoId}
          volume={desiredPlayback.volume}
          isMuted={desiredPlayback.isMuted}
          desiredState={desiredPlayback.desiredState}
          pendingPlayFor={desiredPlayback.pendingPlayFor}
          desiredSeek={desiredPlayback.desiredSeek}
          onStateChange={handleStateChange}
          onProgress={handleProgress}
          onError={handlePlayerError}
        />
      </div>

      {/* Standby / Idle Stage Screen if no video is playing */}
      {!hasActiveVideo && (
        <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center max-w-2xl">
          <div className="w-24 h-24 rounded-3xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-center mb-6 shadow-2xl">
            <Mic2 className="w-12 h-12 text-amber-400 animate-pulse" />
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-3">
            PANGGUNG KARAOKE
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl font-normal max-w-md">
            Layar Siap. Menunggu operator memilih lagu dan peserta berikutnya.
          </p>

          <div className="mt-8 flex items-center gap-4 text-xs font-mono text-zinc-500 bg-zinc-900/50 px-4 py-2 rounded-full border border-zinc-800/80">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Audience Screen Aktif
            </span>
            <span>•</span>
            <span>Authoritative Source</span>
          </div>
        </div>
      )}

      {/* Current Singer Mini Stage Banner (Shown subtly at bottom when playing or cued) */}
      {hasActiveVideo && currentItem && (
        <div className="absolute bottom-6 left-6 z-20 pointer-events-none transition-all duration-500 flex items-center gap-4 bg-zinc-950/80 backdrop-blur-md px-5 py-3 rounded-2xl border border-zinc-800 shadow-2xl max-w-lg">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-amber-300 text-sm shrink-0">
            {formatParticipantNumber(currentItem.participantNumber)}
          </div>
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wider font-semibold text-amber-400 flex items-center gap-1.5">
              <Mic2 className="w-3.5 h-3.5" />
              {currentItem.participantName}
            </div>
            <div className="text-sm font-semibold text-white truncate">
              {currentItem.title} <span className="text-zinc-400 font-normal">({currentItem.artist})</span>
            </div>
          </div>
          <div className="ml-auto pl-3 border-l border-zinc-800 text-xs font-mono text-zinc-400 shrink-0">
            {formatTime(currentProgress.currentTime)} / {formatTime(currentProgress.duration || currentItem.duration)}
          </div>
        </div>
      )}

      {/* Lyrics Overlay */}
      <LyricsOverlay 
        currentTime={currentProgress.currentTime} 
        isVisible={hasActiveVideo && playerState === 'PLAYING'} 
      />

      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
        {/* Connection status indicator */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-md border ${
            isConnected
              ? 'bg-emerald-950/60 border-emerald-800/50 text-emerald-400'
              : 'bg-rose-950/60 border-rose-800/50 text-rose-400'
          }`}
        >
          {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          <span>{isConnected ? 'Sync Online' : 'Reconnecting...'}</span>
        </div>

        {/* Fullscreen toggle button */}
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-full bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 backdrop-blur-md transition-colors"
          title="Toggle Fullscreen"
        >
          {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
        </button>
      </div>

      {/* Top-Left Stage watermark */}
      <div className="absolute top-4 left-4 z-30 flex items-center gap-2 text-xs font-mono text-zinc-400 bg-zinc-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-zinc-800/80">
        <Radio className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-semibold text-zinc-300">STAGE SCREEN</span>
        {playerState !== 'IDLE' && (
          <span className="text-zinc-500 font-mono">[{playerState}]</span>
        )}
      </div>

      {/* Peserta Berikutnya Fullscreen Overlay */}
      <AudienceOverlay
        show={overlayState.showNextParticipant}
        data={overlayState.nextParticipantData}
        timestamp={overlayState.overlayTimestamp}
        onDismiss={() => {
          setOverlayState((prev) => ({ ...prev, showNextParticipant: false }));
        }}
      />
    </div>
  );
}
