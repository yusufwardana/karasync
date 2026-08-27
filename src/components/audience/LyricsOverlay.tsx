import React, { useMemo, useEffect, useRef } from 'react';
import { Music } from 'lucide-react';

export interface LyricLine {
  time: number;
  text: string;
}

// A fallback mock lyrics set if none are provided
const MOCK_LYRICS: LyricLine[] = [
  { time: 0, text: "🎵 (Music Playing) 🎵" },
  { time: 10, text: "Welcome to the Karaoke Stage" },
  { time: 15, text: "Get ready to sing!" },
  { time: 20, text: "Here comes the first verse..." },
  { time: 25, text: "I can feel the magic in the air" },
  { time: 30, text: "Everyone is watching, but I don't care" },
  { time: 35, text: "Just gonna sing my heart out tonight" },
  { time: 40, text: "Everything is gonna be alright" },
  { time: 45, text: "🎵 (Chorus) 🎵" },
  { time: 50, text: "Oh yeah, we are shining stars" },
  { time: 55, text: "No matter who or where we are" },
  { time: 60, text: "Let the music take control" },
  { time: 65, text: "And free your beautiful soul" },
  { time: 70, text: "🎵 (Instrumental) 🎵" }
];

interface LyricsOverlayProps {
  currentTime: number;
  lyrics?: LyricLine[];
  isVisible?: boolean;
}

export function LyricsOverlay({ 
  currentTime, 
  lyrics = MOCK_LYRICS, 
  isVisible = true 
}: LyricsOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Find the index of the currently active lyric line
  const activeIndex = useMemo(() => {
    if (!lyrics || lyrics.length === 0) return -1;
    
    // Find the last lyric whose time is <= currentTime
    let active = -1;
    for (let i = 0; i < lyrics.length; i++) {
      if (currentTime >= lyrics[i].time) {
        active = i;
      } else {
        break;
      }
    }
    return active;
  }, [currentTime, lyrics]);

  // Auto-scroll to keep active line centered
  useEffect(() => {
    if (containerRef.current && activeIndex >= 0) {
      const activeElement = containerRef.current.querySelector(`[data-index="${activeIndex}"]`) as HTMLElement;
      if (activeElement) {
        // Calculate the scroll position to center the active element
        const containerHeight = containerRef.current.clientHeight;
        const offsetTop = activeElement.offsetTop;
        const elementHeight = activeElement.clientHeight;
        
        containerRef.current.scrollTo({
          top: offsetTop - (containerHeight / 2) + (elementHeight / 2),
          behavior: 'smooth'
        });
      }
    }
  }, [activeIndex]);

  if (!isVisible) return null;

  return (
    <div className="absolute inset-x-0 bottom-24 top-24 pointer-events-none z-10 flex flex-col items-center justify-center overflow-hidden mask-image-fade-vertical">
      <div 
        ref={containerRef}
        className="w-full max-w-4xl h-full flex flex-col items-center px-8 scroll-smooth overflow-hidden"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {/* Top padding to allow centering of first items */}
        <div className="h-[40vh] shrink-0" />

        {lyrics.map((line, index) => {
          const isActive = index === activeIndex;
          const isPassed = index < activeIndex;
          const isUpcoming = index > activeIndex;
          
          let yOffset = 0;
          let scale = 1;
          let opacity = 1;

          if (isActive) {
            scale = 1.1;
            opacity = 1;
          } else if (isPassed) {
            scale = 0.95;
            opacity = Math.max(0.2, 0.7 - (activeIndex - index) * 0.2);
          } else if (isUpcoming) {
            scale = 0.95;
            opacity = Math.max(0.2, 0.7 - (index - activeIndex) * 0.2);
          }

          return (
            <div
              key={index}
              data-index={index}
              className={`w-full text-center transition-all duration-500 ease-out py-3 font-sans font-black tracking-tight flex items-center justify-center gap-3`}
              style={{
                transform: `scale(${scale})`,
                opacity: opacity,
                textShadow: isActive ? '0 4px 24px rgba(0,0,0,0.8)' : '0 2px 12px rgba(0,0,0,0.5)',
                color: isActive ? '#fbbf24' : '#f4f4f5', // amber-400 for active, zinc-100 for inactive
                fontSize: isActive ? '3.5rem' : '2.5rem',
                lineHeight: '1.2'
              }}
            >
              {isActive && line.text.includes('🎵') && <Music className="w-8 h-8 text-amber-400 animate-pulse" />}
              <span>{line.text}</span>
              {isActive && line.text.includes('🎵') && <Music className="w-8 h-8 text-amber-400 animate-pulse" />}
            </div>
          );
        })}

        {/* Bottom padding to allow centering of last items */}
        <div className="h-[40vh] shrink-0" />
      </div>
    </div>
  );
}
