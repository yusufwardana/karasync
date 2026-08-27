import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { OverlayData } from '../../types';
import { formatParticipantNumber } from '../../lib/formatters';
import { Mic2, Music2, Sparkles } from 'lucide-react';

interface AudienceOverlayProps {
  show: boolean;
  data: OverlayData | null;
  timestamp: number;
  onDismiss?: () => void;
}

export function AudienceOverlay({ show, data, timestamp, onDismiss }: AudienceOverlayProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show && data) {
      setVisible(true);
      const timer = setTimeout(() => {
        setVisible(false);
        onDismiss?.();
      }, 7500);
      return () => clearTimeout(timer);
    } else {
      setVisible(false);
    }
  }, [show, data, timestamp, onDismiss]);

  return (
    <AnimatePresence>
      {visible && data && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-950/90 backdrop-blur-xl p-8 text-center select-none"
        >
          {/* Ambient stage glow */}
          <div className="absolute w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl pointer-events-none -top-20 -left-20 animate-pulse" />
          <div className="absolute w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -bottom-20 -right-20" />

          <div className="relative max-w-3xl w-full flex flex-col items-center">
            {/* Header pill */}
            <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold text-sm tracking-widest uppercase mb-8 shadow-lg shadow-amber-950/20">
              <Sparkles className="w-4 h-4 text-amber-400" />
              Peserta Berikutnya
            </div>

            {/* Participant Number Badge */}
            <div className="mb-4">
              <span className="inline-block text-6xl md:text-8xl font-black tracking-tight text-white/95 font-mono drop-shadow-md">
                {formatParticipantNumber(data.number)}
              </span>
            </div>

            {/* Participant Name */}
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6 uppercase drop-shadow-lg">
              {data.name}
            </h1>

            {/* Song & Artist Card */}
            <div className="inline-flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-zinc-200 text-lg md:text-xl font-medium shadow-2xl">
              <Music2 className="w-5 h-5 text-amber-400 shrink-0" />
              <span className="font-semibold text-white">{data.title}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">{data.artist}</span>
            </div>

            {/* Stage Callout hint */}
            <p className="mt-8 text-xs md:text-sm font-medium text-zinc-400 tracking-wide flex items-center gap-2">
              <Mic2 className="w-4 h-4 text-amber-400" />
              Silakan bersiap menuju panggung
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
