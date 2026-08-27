import { useState, useEffect } from 'react';
import { realtime } from '../../lib/realtime';
import {
  KaraokeStateSnapshot,
  ActiveTab,
  SongSearchResult,
  Participant,
  QueueItem,
  QueueItemStatus,
  PlaybackCommandType,
  ParticipantStatus,
} from '../../types';
import { OperatorSidebar } from './OperatorSidebar';
import { OperatorHeader } from './OperatorHeader';
import { CurrentPerformancePanel } from './CurrentPerformancePanel';
import { StickyPlaybackBar } from './StickyPlaybackBar';
import { DiscoverCatalog } from './DiscoverCatalog';
import { SongSearch } from './SongSearch';
import { ParticipantManager } from './ParticipantManager';
import { QueueManager } from './QueueManager';
import { HistoryPanel } from './HistoryPanel';
import { AddToQueueModal } from './AddToQueueModal';

interface OperatorDashboardProps {
  onOpenAudienceWindow?: () => void;
}

export function OperatorDashboard({ onOpenAudienceWindow }: OperatorDashboardProps = {}) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('queue');
  const [searchQuery, setSearchQuery] = useState('');
  const [snapshot, setSnapshot] = useState<KaraokeStateSnapshot | null>(null);
  const [isAudienceOnline, setIsAudienceOnline] = useState(false);

  // Selected song for Add to Queue modal
  const [modalSong, setModalSong] = useState<SongSearchResult | null>(null);

  // Initialize Realtime WebSocket as Operator
  useEffect(() => {
    realtime.init('operator');

    // Subscribe to snapshot
    const unsubSnapshot = realtime.onSnapshot((data) => {
      setSnapshot(data);
      setIsAudienceOnline(data.audienceState.isOnline);
    });

    // Subscribe to audience presence
    const unsubAudiencePresence = realtime.onAudiencePresence((data) => {
      setIsAudienceOnline(data.isOnline);
      setSnapshot((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          audienceState: {
            ...prev.audienceState,
            isOnline: data.isOnline,
          },
        };
      });
    });

    // Subscribe to playback sync
    const unsubPlayback = realtime.onPlaybackSync((data) => {
      setSnapshot((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          playback: data.playback,
        };
      });
    });

    // Subscribe to mirror progress
    const unsubProgress = realtime.onMirrorProgress((data) => {
      setSnapshot((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          audienceState: {
            ...prev.audienceState,
            currentTime: data.currentTime,
            duration: data.duration,
            state: data.state as any,
          },
        };
      });
    });

    // Subscribe to audience state sync
    const unsubAudienceState = realtime.onAudienceStateSync((data) => {
      setSnapshot((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          audienceState: {
            ...prev.audienceState,
            state: data.state as any,
            videoId: data.videoId,
            errorMessage: data.error,
          },
        };
      });
    });

    // Subscribe to queue updates
    const unsubQueue = realtime.onQueueUpdated((data) => {
      setSnapshot((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          queue: data.queue,
        };
      });
    });

    // Subscribe to participants updates
    const unsubParticipants = realtime.onParticipantsUpdated((data) => {
      setSnapshot((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          participants: data.participants,
        };
      });
    });

    // Fetch initial REST state snapshot as immediate fallback
    fetch('/api/state')
      .then((res) => res.json())
      .then((data) => {
        setSnapshot(data);
        setIsAudienceOnline(data.audienceState.isOnline);
      })
      .catch((e) => console.warn('Initial fetch fallback error:', e));

    return () => {
      unsubSnapshot();
      unsubAudiencePresence();
      unsubPlayback();
      unsubProgress();
      unsubAudienceState();
      unsubQueue();
      unsubParticipants();
    };
  }, []);

  // Handlers
  const handlePlaybackCommand = (
    command: PlaybackCommandType,
    params?: { videoId?: string | null; seekTo?: number; volume?: number }
  ) => {
    realtime.sendPlaybackCommand(command, {
      videoId: params?.videoId,
      seekTo: params?.seekTo,
      volume: params?.volume,
    });
  };

  const handleCallNextParticipant = () => {
    realtime.callNextParticipant();
  };

  const handleToggleAutoplay = () => {
    if (!snapshot) return;
    const newAutoplay = !snapshot.playback.autoplay;
    realtime.sendPlaybackCommand('SET_VOLUME', { autoplay: newAutoplay });
    setSnapshot((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        playback: {
          ...prev.playback,
          autoplay: newAutoplay,
        },
      };
    });
  };

  const handleHeaderSearch = (query: string) => {
    setSearchQuery(query);
    setActiveTab('search');
  };

  const handleSelectSongForModal = (song: SongSearchResult) => {
    setModalSong(song);
  };

  const handleConfirmAddToQueue = (participantId: number, playNow?: boolean) => {
    if (!modalSong) return;
    realtime.addToQueue({
      participantId,
      videoId: modalSong.videoId,
      title: modalSong.title,
      artist: modalSong.artist,
      thumbnail: modalSong.thumbnail,
      duration: modalSong.duration,
      playNow,
    });
    setModalSong(null);
    if (playNow) {
      setActiveTab('queue');
    }
  };

  const handleReorderQueue = (queueIds: number[]) => {
    realtime.reorderQueue(queueIds);
  };

  const handleRemoveQueue = (queueId: number) => {
    realtime.removeFromQueue(queueId);
  };

  const handleQueueStatusChange = (queueId: number, status: QueueItemStatus) => {
    realtime.changeQueueStatus(queueId, status);
  };

  const handlePlayNow = (item: QueueItem) => {
    realtime.changeQueueStatus(item.queueId, 'playing');
  };

  const handleAddParticipant = (p: { name: string; number: number; note?: string }) => {
    realtime.addParticipant(p);
  };

  const handleUpdateParticipantStatus = (id: number, status: ParticipantStatus) => {
    realtime.updateParticipantStatus(id, status);
  };

  const handleAssignSongForParticipant = (participant: Participant) => {
    setActiveTab('search');
  };

  const handleUpdateQueueItemParticipant = (queueId: number, newParticipantId: number) => {
    if (!snapshot) return;
    const newPart = snapshot.participants.find((p) => p.id === newParticipantId);
    if (!newPart) return;

    const updatedQueue = snapshot.queue.map((q) => {
      if (q.queueId === queueId) {
        return {
          ...q,
          participantId: newPart.id,
          participantName: newPart.name,
          participantNumber: newPart.number,
        };
      }
      return q;
    });

    realtime.send('UPDATE_QUEUE', { queue: updatedQueue });
  };

  const handleRequeueHistoryItem = (item: QueueItem) => {
    realtime.addToQueue({
      participantId: item.participantId,
      videoId: item.videoId,
      title: item.title,
      artist: item.artist,
      thumbnail: item.thumbnail,
      duration: item.duration,
      playNow: false,
    });
  };

  // Derive current and next queue items
  const queue = snapshot?.queue || [];
  const participants = snapshot?.participants || [];
  const history = snapshot?.history || [];
  const playback = snapshot?.playback || {
    currentQueueId: null,
    currentVideoId: null,
    desiredState: 'IDLE',
    desiredSeek: 0,
    volume: 80,
    isMuted: false,
    autoplay: false,
  };
  const audienceState = snapshot?.audienceState || {
    state: 'IDLE',
    videoId: null,
    currentTime: 0,
    duration: 0,
    volume: 80,
    isOnline: false,
    lastHeartbeat: 0,
  };

  const currentQueueItem = queue.find(
    (q) => q.queueId === playback.currentQueueId || q.status === 'playing'
  );

  const nextQueueItem = queue.find(
    (q) => q.status === 'ready' || (q.status === 'queued' && q.queueId !== playback.currentQueueId)
  );

  return (
    <div className="flex h-screen w-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans select-none">
      {/* Sidebar navigation */}
      <OperatorSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        queueCount={queue.length}
        participantsCount={participants.length}
        isAudienceOnline={isAudienceOnline}
        onOpenAudienceWindow={onOpenAudienceWindow}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Global Header Search & Controls */}
        <OperatorHeader
          onSearchSubmit={handleHeaderSearch}
          isAudienceOnline={isAudienceOnline}
          autoplay={playback.autoplay}
          onToggleAutoplay={handleToggleAutoplay}
          onOpenAudienceWindow={onOpenAudienceWindow}
        />

        {/* Scrollable Main Views */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Always prominent: Current Performance & Next Stage Caller */}
          <CurrentPerformancePanel
            currentQueueItem={currentQueueItem}
            nextQueueItem={nextQueueItem}
            playback={playback}
            audienceState={audienceState}
            onPlaybackCommand={handlePlaybackCommand}
            onCallNextParticipant={handleCallNextParticipant}
          />

          {/* Tab Specific Views */}
          <div className="pt-2">
            {activeTab === 'discover' && (
              <DiscoverCatalog onSelectSong={handleSelectSongForModal} />
            )}

            {activeTab === 'search' && (
              <SongSearch
                initialQuery={searchQuery}
                onSelectSong={handleSelectSongForModal}
              />
            )}

            {activeTab === 'participants' && (
              <ParticipantManager
                participants={participants}
                queue={queue}
                onAddParticipant={handleAddParticipant}
                onUpdateStatus={handleUpdateParticipantStatus}
                onAssignSongForParticipant={handleAssignSongForParticipant}
              />
            )}

            {activeTab === 'queue' && (
              <QueueManager
                queue={queue}
                participants={participants}
                currentQueueId={playback.currentQueueId}
                onReorder={handleReorderQueue}
                onRemove={handleRemoveQueue}
                onStatusChange={handleQueueStatusChange}
                onPlayNow={handlePlayNow}
                onOpenSearch={() => setActiveTab('search')}
                onUpdateQueueItemParticipant={handleUpdateQueueItemParticipant}
              />
            )}

            {activeTab === 'history' && (
              <HistoryPanel
                history={history}
                onRequeue={handleRequeueHistoryItem}
              />
            )}
          </div>
        </main>

        {/* Bottom Sticky Playback Bar */}
        <StickyPlaybackBar
          currentQueueItem={currentQueueItem}
          playback={playback}
          audienceState={audienceState}
          onPlaybackCommand={handlePlaybackCommand}
        />
      </div>

      {/* Add To Queue Modal */}
      <AddToQueueModal
        song={modalSong}
        participants={participants}
        isOpen={Boolean(modalSong)}
        onClose={() => setModalSong(null)}
        onConfirm={handleConfirmAddToQueue}
      />
    </div>
  );
}
