import { useState, useEffect, useRef, type ChangeEvent } from 'react';
import {
  QueueItem,
  PlaybackDesiredState,
  AudiencePlayerState,
  PlaybackCommandType,
} from '../../types';
import { formatParticipantNumber, formatTime } from '../../lib/formatters';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  Square,
  Megaphone,
  Mic2,
  Music,
  Radio,
  Sparkles,
  Volume2,
  VolumeX,
  Tv,
} from 'lucide-react';

interface CurrentPerformancePanelProps {
  currentQueueItem?: QueueItem;
  nextQueueItem?: QueueItem;
  playback: PlaybackDesiredState;
  audienceState: AudiencePlayerState;
  onPlaybackCommand: (
    command: PlaybackCommandType,
    params?: { videoId?: string | null; seekTo?: number; volume?: number }
  ) => void;
  onCallNextParticipant: () => void;
}

export function CurrentPerformancePanel({
  currentQueueItem,
  nextQueueItem,
  playback,
  audienceState,
  onPlaybackCommand,
  onCallNextParticipant,
}: CurrentPerformancePanelProps) {
  // Local smooth interpolated progress tracking
  const [interpolatedTime, setInterpolatedTime] = useState(audienceState.currentTime || 0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const [justCalledNext, setJustCalledNext] = useState(false);

  const lastAudienceTimeRef = useRef(audienceState.currentTime);
  const lastUpdateTimeRef = useRef(Date.now());

  // Reconcile with Audience updates
  useEffect(() => {
    if (!isScrubbing) {
      setInterpolatedTime(audienceState.currentTime);
      lastAudienceTimeRef.current = audienceState.currentTime;
      lastUpdateTimeRef.current = Date.now();
    }
  }, [audienceState.currentTime, isScrubbing]);

  // Smooth interpolation frame loop when PLAYING
  useEffect(() => {
    if (audienceState.state !== 'PLAYING' || isScrubbing) return;

    const interval = setInterval(() => {
      const elapsedSec = (Date.now() - lastUpdateTimeRef.current) / 1000;
      const targetDuration = audienceState.duration || currentQueueItem?.duration || 240;
      const nextTime = Math.min(targetDuration, lastAudienceTimeRef.current + elapsedSec);
      setInterpolatedTime(nextTime);
    }, 200);

    return () => clearInterval(interval);
  }, [audienceState.state, audienceState.duration, currentQueueItem?.duration, isScrubbing]);

  const duration = audienceState.duration || currentQueueItem?.duration || 240;
  const displayTime = isScrubbing ? scrubValue : interpolatedTime;
  const progressPercent = duration > 0 ? (displayTime / duration) * 100 : 0;

  const isPlaying = audienceState.state === 'PLAYING' || playback.desiredState === 'PLAYING';

  const handlePlayPause = () => {
    if (isPlaying) {
      onPlaybackCommand('PAUSE', { videoId: playback.currentVideoId });
    } else {
      onPlaybackCommand('PLAY', { videoId: playback.currentVideoId });
    }
  };

  const handleSeekCommit = (e: ChangeEvent<HTMLInputElement>) => {
    const newSeek = parseFloat(e.target.value);
    setIsScrubbing(false);
    setInterpolatedTime(newSeek);
    onPlaybackCommand('SEEK', {
      videoId: playback.currentVideoId,
      seekTo: newSeek,
    });
  };

  const handleCallNext = () => {
    onCallNextParticipant();
    setJustCalledNext(true);
    setTimeout(() => setJustCalledNext(false), 3000);
  };

  return (
    <div className="space-y-4">
      {/* SEKARANG TAMPIL - Large Main Showcase Panel */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        {/* Subtle Ambient Light */}
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Section Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80 mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
              SEKARANG TAMPIL
            </span>
          </div>

          {/* Mirror status badge from Audience */}
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-zinc-500">Audience Mirror:</span>
            <span
              className={`px-2.5 py-0.5 rounded-md font-semibold ${
                audienceState.state === 'PLAYING'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : audienceState.state === 'PAUSED'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : audienceState.state === 'CUED'
                  ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  : audienceState.state === 'ERROR'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {audienceState.state}
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {audienceState.state === 'ERROR' && audienceState.errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-3">
            <div className="p-2 bg-rose-500/20 rounded-lg text-rose-400 shrink-0">
              <Tv className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-400 mb-1">Playback Error on Audience Screen</h4>
              <p className="text-xs text-rose-300/80 mb-3">{audienceState.errorMessage}</p>
              <button
                onClick={() => onPlaybackCommand('NEXT')}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-400 text-zinc-950 text-xs font-bold rounded-lg transition-colors flex items-center gap-2"
              >
                <SkipForward className="w-4 h-4" />
                SKIP TO NEXT SONG
              </button>
            </div>
          </div>
        )}

        {/* Current Participant & Song Info */}
        {currentQueueItem ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Big Participant Number */}
                <div className="w-16 h-16 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-mono font-black text-2xl text-amber-400 shrink-0 shadow-lg shadow-amber-950/30">
                  {formatParticipantNumber(currentQueueItem.participantNumber)}
                </div>

                {/* Participant Name & Song Title */}
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      {currentQueueItem.participantName}
                    </h2>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-[11px] font-semibold text-zinc-300">
                      On Stage
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-base md:text-lg text-zinc-200">
                    <Music className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="font-semibold">{currentQueueItem.title}</span>
                    <span className="text-zinc-500">—</span>
                    <span className="text-zinc-400">{currentQueueItem.artist}</span>
                  </div>
                </div>
              </div>

              {/* Quick Cue badge */}
              <div className="text-right shrink-0">
                <span className="text-xs font-mono text-zinc-500 block">YouTube Track</span>
                <span className="text-xs font-mono text-zinc-300 bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800 inline-block mt-0.5">
                  ID: {currentQueueItem.videoId}
                </span>
              </div>
            </div>

            {/* Progress Scrubber Bar */}
            <div className="space-y-2 pt-2">
              <div className="relative flex items-center group">
                <input
                  type="range"
                  min="0"
                  max={duration || 100}
                  step="0.5"
                  value={displayTime}
                  onMouseDown={() => setIsScrubbing(true)}
                  onTouchStart={() => setIsScrubbing(true)}
                  onChange={(e) => setScrubValue(parseFloat(e.target.value))}
                  onMouseUp={handleSeekCommit}
                  onTouchEnd={handleSeekCommit}
                  className="w-full h-2.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none z-10"
                />
              </div>

              <div className="flex justify-between text-xs font-mono text-zinc-400">
                <span className="font-semibold text-amber-300">{formatTime(displayTime)}</span>
                <span className="text-zinc-400">{formatTime(duration)}</span>
              </div>
            </div>

            {/* Playback Control Action Buttons */}
            <div className="flex items-center justify-center gap-4 pt-2">
              {/* Previous / Restart */}
              <button
                onClick={() =>
                  onPlaybackCommand('SEEK', {
                    videoId: playback.currentVideoId,
                    seekTo: 0,
                  })
                }
                className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all shadow"
                title="Restart Song (00:00)"
              >
                <RotateCcw className="w-5 h-5" />
              </button>

              {/* Big Play / Pause Button */}
              <button
                onClick={handlePlayPause}
                className={`px-8 py-3.5 rounded-2xl flex items-center gap-3 font-bold text-base transition-all shadow-lg ${
                  isPlaying
                    ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20'
                    : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/30'
                }`}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-6 h-6 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="w-6 h-6 fill-current ml-0.5" />
                    <span>Play</span>
                  </>
                )}
              </button>

              {/* Next Song */}
              <button
                onClick={() => onPlaybackCommand('NEXT')}
                className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all shadow"
                title="Next Song in Queue"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              {/* Stop / Cue */}
              <button
                onClick={() =>
                  onPlaybackCommand('STOP', {
                    videoId: playback.currentVideoId,
                  })
                }
                className="p-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-rose-400 transition-all shadow"
                title="Stop Video"
              >
                <Square className="w-5 h-5" />
              </button>
            </div>
          </div>
        ) : (
          <div className="py-10 text-center space-y-3">
            <Mic2 className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-lg font-bold text-zinc-300">Belum Ada Lagu yang Diputar</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Pilih peserta dan lagu dari menu Discover, Search, atau Antrean untuk memulai sesi tampil.
            </p>
          </div>
        )}
      </div>

      {/* BERIKUTNYA - Preview & Next Participant Call Area */}
      <div className="bg-zinc-900/80 border border-zinc-800/90 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
              BERIKUTNYA
            </span>
          </div>

          {nextQueueItem ? (
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-500/25 font-mono font-bold text-sm text-amber-300">
                {formatParticipantNumber(nextQueueItem.participantNumber)}
              </span>
              <div>
                <span className="text-base font-bold text-white mr-2">
                  {nextQueueItem.participantName}
                </span>
                <span className="text-sm text-zinc-400">
                  {nextQueueItem.title} — {nextQueueItem.artist}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-400 italic">Tidak ada peserta berikutnya di antrean.</p>
          )}
        </div>

        {/* Big Call Next Participant Button */}
        <button
          onClick={handleCallNext}
          disabled={!nextQueueItem}
          className={`px-6 py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2.5 transition-all shadow-md shrink-0 ${
            justCalledNext
              ? 'bg-emerald-500 text-zinc-950 shadow-emerald-500/20'
              : nextQueueItem
              ? 'bg-amber-500 hover:bg-amber-400 text-zinc-950 shadow-amber-500/20'
              : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
          }`}
        >
          {justCalledNext ? (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Overlay Terkirim ke Audience!</span>
            </>
          ) : (
            <>
              <Megaphone className="w-4 h-4" />
              <span>PANGGIL PESERTA BERIKUTNYA</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
