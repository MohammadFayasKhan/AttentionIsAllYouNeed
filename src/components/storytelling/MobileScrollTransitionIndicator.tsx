/**
 * MobileScrollTransitionIndicator.tsx
 * ─────────────────────────────────────────────────────────────────
 * Lightweight Apple-Style Mobile Scroll Guidance Cue
 *
 * Project: AttentionIsAllYouNeed
 * Built by: Mohammad Fayas Khan (3rd-year B.Tech CSE AI/ML student at LPU)
 *
 * Design & Non-Intrusive Behavior:
 *   - Only appears when the user is pulling against a boundary on mobile.
 *   - Uses a subtle blur-and-fade in/out effect (Apple frosted glass capsule).
 *   - Positioned safely centered away from the bottom-right "Ask Onee" trigger.
 *   - Disappears immediately when the user releases, stops pulling, or when transition starts.
 *   - Disabled on the final chapter for next, and on the first chapter for previous.
 */

import React from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { TransitionTargetInfo } from '../../hooks/useChapterSnap';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
  progress: number; // -1.0 (prev) to +1.0 (next)
  target: TransitionTargetInfo | null;
  isTransitioning: boolean;
}

export const MobileScrollTransitionIndicator: React.FC<Props> = ({
  progress,
  target,
  isTransitioning,
}) => {
  const absProgress = Math.min(1, Math.abs(progress));
  const isVisible = target !== null && absProgress > 0.06 && !isTransitioning;
  const isNext = progress >= 0;
  const isReady = absProgress >= 0.82;

  return (
    <AnimatePresence>
      {isVisible && target && (
        <motion.div
          initial={{
            opacity: 0,
            y: isNext ? 12 : -12,
            scale: 0.95,
            filter: 'blur(6px)',
          }}
          animate={{
            opacity: Math.min(1, absProgress * 1.5),
            y: 0,
            scale: 1,
            filter: 'blur(0px)',
          }}
          exit={{
            opacity: 0,
            y: isNext ? 8 : -8,
            scale: 0.95,
            filter: 'blur(4px)',
          }}
          transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="fixed left-1/2 -translate-x-1/2 z-50 pointer-events-none select-none w-auto max-w-[320px] px-2"
          style={{
            bottom: isNext ? 'max(84px, calc(env(safe-area-inset-bottom, 16px) + 72px))' : 'auto',
            top: !isNext ? 'max(64px, calc(env(safe-area-inset-top, 16px) + 56px))' : 'auto',
          }}
          aria-live="polite"
        >
          <div className="flex items-center gap-2.5 px-4 py-2 rounded-full bg-white/95 backdrop-blur-2xl border border-blue-200/80 shadow-apple-lg">
            {/* Direction Chevron */}
            <div
              className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                isReady ? 'bg-apple-blue text-white font-bold scale-110' : 'bg-blue-50 text-apple-blue'
              }`}
            >
              {isNext ? (
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isReady ? 'translate-y-0.5' : ''}`} />
              ) : (
                <ChevronUp className={`w-3.5 h-3.5 transition-transform ${isReady ? '-translate-y-0.5' : ''}`} />
              )}
            </div>

            {/* Target Label */}
            <div className="flex flex-col min-w-0 text-left">
              <span className="text-[11px] font-mono font-bold text-apple-blue flex items-center gap-1">
                <Sparkles className="w-2.5 h-2.5" />
                <span>{isNext ? 'Next' : 'Previous'}: Ch {target.chapterNumber}</span>
              </span>
              <span className="text-[10px] text-apple-secondary font-mono truncate max-w-[170px]">
                {isReady ? 'Release to advance' : target.title}
              </span>
            </div>

            {/* Mini Progress Bar */}
            <div className="w-8 h-1.5 rounded-full bg-blue-100 overflow-hidden shrink-0 ml-1">
              <div
                className="h-full rounded-full transition-all duration-75"
                style={{
                  width: `${absProgress * 100}%`,
                  background: isReady
                    ? 'linear-gradient(to right, #0071e3, #34c759)'
                    : 'linear-gradient(to right, #0071e3, #5e5ce6)',
                }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MobileScrollTransitionIndicator;
