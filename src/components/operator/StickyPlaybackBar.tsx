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
  Volume2,
  VolumeX,
  Volume1,
  Tv,
  Mic2,
  Music,
} from 'lucide-react';

interface StickyPlaybackBarProps {
  currentQueueItem?: QueueItem;
  playback: PlaybackDesiredState;
  audienceState: AudiencePlayerState;
  onPlaybackCommand: (
    command: PlaybackCommandType,
    params?: { videoId?: string | null; seekTo?: number; volume?: number }
  ) => void;
  onToggleMute?: () => void;
}

export function StickyPlaybackBar({
  currentQueueItem,
  playback,
  audienceState,
  onPlaybackCommand,
}: StickyPlaybackBarProps) {
  const [volume, setVolume] = useState(playback.volume ?? 80);
  const [interpolatedTime, setInterpolatedTime] = useState(audienceState.currentTime || 0);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);

  const lastAudienceTimeRef = useRef(audienceState.currentTime);
  const lastUpdateTimeRef = useRef(Date.now());

  useEffect(() => {
    if (!isScrubbing) {
      setInterpolatedTime(audienceState.currentTime);
      lastAudienceTimeRef.current = audienceState.currentTime;
      lastUpdateTimeRef.current = Date.now();
    }
  }, [audienceState.currentTime, isScrubbing]);

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

  const handleVolumeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    setVolume(newVol);
    onPlaybackCommand('SET_VOLUME', { volume: newVol });
  };

  return (
    <footer className="h-20 bg-zinc-950 border-t border-zinc-800/90 px-6 flex items-center justify-between gap-6 shrink-0 select-none z-30">
      {/* Left: Current Track & Participant Badge */}
      <div className="flex items-center gap-3.5 w-72 min-w-0">
        {currentQueueItem ? (
          <>
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center font-mono font-bold text-amber-300 text-xs shrink-0">
              {formatParticipantNumber(currentQueueItem.participantNumber)}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-white truncate">
                {currentQueueItem.title}
              </h4>
              <p className="text-xs text-zinc-400 truncate">
                {currentQueueItem.participantName} • {currentQueueItem.artist}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-zinc-400 text-xs">
            <Music className="w-4 h-4" />
            <span>Tidak ada lagu aktif</span>
          </div>
        )}
      </div>

      {/* Center: Controls & Scrubber */}
      <div className="flex-1 max-w-2xl flex flex-col items-center gap-1.5">
        {/* Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() =>
              onPlaybackCommand('SEEK', {
                videoId: playback.currentVideoId,
                seekTo: 0,
              })
            }
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            title="Restart Track"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={handlePlayPause}
            className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center justify-center transition-transform hover:scale-105 shadow-md shadow-amber-500/20"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={() => onPlaybackCommand('NEXT')}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors"
            title="Next Track"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Scrubber */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-mono text-zinc-400 w-10 text-right">
            {formatTime(displayTime)}
          </span>
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
            className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400 focus:outline-none"
          />
          <span className="text-[11px] font-mono text-zinc-400 w-10">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* Right: Volume & State Indicator */}
      <div className="flex items-center gap-4 w-72 justify-end">
        <div className="flex items-center gap-2">
          {volume === 0 ? (
            <VolumeX className="w-4 h-4 text-zinc-500" />
          ) : volume < 50 ? (
            <Volume1 className="w-4 h-4 text-zinc-400" />
          ) : (
            <Volume2 className="w-4 h-4 text-zinc-400" />
          )}
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            title={`Volume: ${volume}%`}
          />
          <span className="text-[11px] font-mono text-zinc-400 w-7">{volume}%</span>
        </div>

        {/* Audience Mirror pill */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800 text-[11px] font-mono text-zinc-400">
          <Tv className="w-3.5 h-3.5 text-zinc-500" />
          <span className="text-zinc-300 font-semibold">{audienceState.state}</span>
        </div>
      </div>
    </footer>
  );
}
