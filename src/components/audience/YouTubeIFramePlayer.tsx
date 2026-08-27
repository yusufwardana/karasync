import { useEffect, useRef, useState } from 'react';
import { AudiencePlayerStateType } from '../../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YouTubeIFramePlayerProps {
  videoId: string | null;
  volume: number;
  isMuted: boolean;
  desiredState: 'IDLE' | 'CUED' | 'PLAYING' | 'PAUSED' | 'STOPPED';
  pendingPlayFor?: string | null;
  desiredSeek?: number;
  onStateChange: (state: AudiencePlayerStateType, videoId: string | null) => void;
  onProgress: (currentTime: number, duration: number, state: AudiencePlayerStateType) => void;
  onError: (error: string) => void;
}

export function YouTubeIFramePlayer({
  videoId,
  volume,
  isMuted,
  desiredState,
  pendingPlayFor,
  desiredSeek,
  onStateChange,
  onProgress,
  onError,
}: YouTubeIFramePlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isApiReady, setIsApiReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  const currentLoadedVideoIdRef = useRef<string | null>(null);
  const progressIntervalRef = useRef<any>(null);
  const playRetryTimerRef = useRef<any>(null);
  const latestSeekAppliedRef = useRef<number | null>(null);

  // Load YouTube Iframe API once
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true);
      return;
    }

    const existingScript = document.getElementById('youtube-iframe-api-script');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api-script';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const previousCallback = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousCallback) previousCallback();
      setIsApiReady(true);
    };
  }, []);

  // Initialize YT.Player
  useEffect(() => {
    if (!isApiReady || !containerRef.current || playerRef.current) return;

    try {
      playerRef.current = new window.YT.Player(containerRef.current, {
        height: '100%',
        width: '100%',
        videoId: videoId || undefined,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          showinfo: 0,
          origin: window.location.origin,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            setIsPlayerReady(true);
            event.target.setVolume(volume);
            if (isMuted) event.target.mute();
            else event.target.unMute();
            onStateChange('READY', videoId);
          },
          onStateChange: (event: any) => {
            handleYTStateChange(event.data);
          },
          onError: (event: any) => {
            let errorMsg = 'Error playing video';
            if (event.data === 100 || event.data === 101 || event.data === 150) {
              errorMsg = 'Video tidak dapat diputar di iframe (dibatasi pemilik hak cipta)';
            }
            console.error('YouTube Player Error Code:', event.data);
            onError(errorMsg);
            onStateChange('ERROR', currentLoadedVideoIdRef.current);
          },
        },
      });
    } catch (e) {
      console.error('Failed to instantiate YouTube player:', e);
    }

    return () => {
      if (playerRef.current && playerRef.current.destroy) {
        try {
          playerRef.current.destroy();
        } catch {}
        playerRef.current = null;
      }
    };
  }, [isApiReady]);

  // Translate YouTube player state codes
  const handleYTStateChange = (ytState: number) => {
    let internalState: AudiencePlayerStateType = 'IDLE';

    switch (ytState) {
      case -1: // unstarted
        internalState = 'CUED';
        break;
      case window.YT?.PlayerState?.ENDED: // 0
        internalState = 'ENDED';
        break;
      case window.YT?.PlayerState?.PLAYING: // 1
        internalState = 'PLAYING';
        break;
      case window.YT?.PlayerState?.PAUSED: // 2
        internalState = 'PAUSED';
        break;
      case window.YT?.PlayerState?.BUFFERING: // 3
        internalState = 'BUFFERING';
        break;
      case window.YT?.PlayerState?.CUED: // 5
        internalState = 'CUED';
        break;
      default:
        internalState = 'IDLE';
    }

    onStateChange(internalState, currentLoadedVideoIdRef.current);

    // If we became CUED or READY and desiredState is PLAYING for this video, retry play!
    if (
      (internalState === 'CUED' || internalState === 'BUFFERING' || internalState === 'PAUSED') &&
      desiredState === 'PLAYING' &&
      pendingPlayFor === currentLoadedVideoIdRef.current
    ) {
      attemptPlayWithRetry();
    }
  };

  // Safe play attempt with retry
  const attemptPlayWithRetry = () => {
    clearTimeout(playRetryTimerRef.current);

    if (!playerRef.current || !isPlayerReady) {
      playRetryTimerRef.current = setTimeout(attemptPlayWithRetry, 500);
      return;
    }

    try {
      playerRef.current.playVideo();
      const state = playerRef.current.getPlayerState?.();
      if (state !== window.YT?.PlayerState?.PLAYING) {
        // Retry shortly until playing
        playRetryTimerRef.current = setTimeout(() => {
          if (desiredState === 'PLAYING' && currentLoadedVideoIdRef.current) {
            try {
              playerRef.current?.playVideo();
            } catch {}
          }
        }, 600);
      }
    } catch (e) {
      console.warn('Play attempt delayed:', e);
      playRetryTimerRef.current = setTimeout(attemptPlayWithRetry, 800);
    }
  };

  // Video ID loading / cueing logic
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;

    if (videoId && videoId !== currentLoadedVideoIdRef.current) {
      currentLoadedVideoIdRef.current = videoId;

      try {
        if (desiredState === 'PLAYING' || pendingPlayFor === videoId) {
          playerRef.current.loadVideoById(videoId, desiredSeek || 0);
          attemptPlayWithRetry();
        } else {
          playerRef.current.cueVideoById(videoId, desiredSeek || 0);
          onStateChange('CUED', videoId);
        }
      } catch (err) {
        console.error('Error loading video by ID:', err);
      }
    }
  }, [videoId, isPlayerReady]);

  // Desired state reconciliation (PLAYING, PAUSED, STOPPED, CUED)
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current || !videoId) return;

    try {
      const currentState = playerRef.current.getPlayerState?.();

      if (desiredState === 'PLAYING') {
        if (currentState !== window.YT?.PlayerState?.PLAYING) {
          attemptPlayWithRetry();
        }
      } else if (desiredState === 'PAUSED') {
        clearTimeout(playRetryTimerRef.current);
        if (currentState === window.YT?.PlayerState?.PLAYING) {
          playerRef.current.pauseVideo();
        }
      } else if (desiredState === 'STOPPED') {
        clearTimeout(playRetryTimerRef.current);
        playerRef.current.stopVideo();
        onStateChange('IDLE', videoId);
      } else if (desiredState === 'CUED') {
        if (currentState === window.YT?.PlayerState?.PLAYING) {
          playerRef.current.pauseVideo();
        }
      }
    } catch (err) {
      console.warn('State sync error:', err);
    }
  }, [desiredState, pendingPlayFor, isPlayerReady, videoId]);

  // Handle Seek reconciliation
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current || desiredSeek === undefined) return;
    if (desiredSeek === latestSeekAppliedRef.current) return;

    try {
      const currentTime = playerRef.current.getCurrentTime?.() || 0;
      if (Math.abs(currentTime - desiredSeek) > 2) {
        playerRef.current.seekTo(desiredSeek, true);
        latestSeekAppliedRef.current = desiredSeek;
      }
    } catch {}
  }, [desiredSeek, isPlayerReady]);

  // Handle Volume & Mute
  useEffect(() => {
    if (!isPlayerReady || !playerRef.current) return;
    try {
      playerRef.current.setVolume(volume);
      if (isMuted) {
        playerRef.current.mute();
      } else {
        playerRef.current.unMute();
      }
    } catch {}
  }, [volume, isMuted, isPlayerReady]);

  // Progress broadcasting loop from authoritative Audience
  useEffect(() => {
    clearInterval(progressIntervalRef.current);

    progressIntervalRef.current = setInterval(() => {
      if (!isPlayerReady || !playerRef.current) return;

      try {
        const currentTime = playerRef.current.getCurrentTime?.() || 0;
        const duration = playerRef.current.getDuration?.() || 0;
        const ytState = playerRef.current.getPlayerState?.();

        let state: AudiencePlayerStateType = 'IDLE';
        if (ytState === 1) state = 'PLAYING';
        else if (ytState === 2) state = 'PAUSED';
        else if (ytState === 3) state = 'BUFFERING';
        else if (ytState === 0) state = 'ENDED';
        else if (ytState === 5) state = 'CUED';

        if (duration > 0 || currentTime > 0) {
          onProgress(currentTime, duration, state);
        }
      } catch {}
    }, 400);

    return () => {
      clearInterval(progressIntervalRef.current);
      clearTimeout(playRetryTimerRef.current);
    };
  }, [isPlayerReady, onProgress]);

  return (
    <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">
      <div ref={containerRef} className="w-full h-full pointer-events-none" />
      
      {/* Visual Overlay blocker to prevent user direct iframe clicks */}
      <div className="absolute inset-0 z-10 pointer-events-none" />
    </div>
  );
}
