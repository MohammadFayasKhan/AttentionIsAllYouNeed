/**
 * MobileScrollTransitionIndicator.tsx
 * ─────────────────────────────────────────────────────────────────
 * Restrained Apple-style mobile overscroll transition indicator.
 * Shown/hidden purely via opacity and subtle translateY.
 * Respects prefers-reduced-motion.
 */

import React from 'react';
import { ChevronDown } from 'lucide-react';
import { TransitionTargetInfo } from '../../hooks/useChapterSnap';

interface Props {
  progress: number;          // 0–1
  target: TransitionTargetInfo | null;
  isTransitioning: boolean;
}

export const MobileScrollTransitionIndicator: React.FC<Props> = ({
  progress,
  target,
  isTransitioning,
}) => {
  const p   = Math.min(1, Math.max(0, progress));
  const vis = p > 0.03 || isTransitioning;
  const chevronY = p * 5;

  return (
    <div
      className="mobile-transition-indicator md:hidden w-full max-w-xl mx-auto"
      style={{ height: 52, marginTop: 12, marginBottom: 4 }}
      aria-hidden="true"
    >
      <div
        style={{
          opacity: vis ? Math.min(1, p * 1.4) : 0,
          transform: `translateY(${vis ? (1 - p) * 6 : 6}px)`,
          transition: vis
            ? 'opacity 0.12s ease-out, transform 0.12s cubic-bezier(0.16,1,0.3,1)'
            : 'opacity 0.20s ease-in, transform 0.20s ease-in',
          willChange: vis ? 'opacity, transform' : 'auto',
        }}
        className="w-full h-full flex items-center gap-3 px-4 rounded-2xl border border-blue-200/70 bg-white/90 backdrop-blur-md shadow-apple-xs"
      >
        {/* Chevron */}
        <div
          style={{
            transform: `translateY(${chevronY}px) scale(${1 + p * 0.08})`,
            transition: 'transform 0.08s linear',
            color: '#0071e3',
            flexShrink: 0,
          }}
        >
          <ChevronDown size={18} strokeWidth={2.5} />
        </div>

        {/* Text label */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-bold text-[#0071e3] font-mono leading-tight">
            {isTransitioning ? 'Revealing next chapter…' : (
              <>Next: Ch {target?.chapterNumber} — {target?.title ?? 'Next Chapter'}</>
            )}
          </p>
          <p className="text-[9px] text-[#86868b] font-mono mt-0.5">
            {isTransitioning ? '' : 'Keep pulling to advance'}
          </p>
        </div>

        {/* Progress bar */}
        <div
          className="h-1 rounded-full bg-blue-100 overflow-hidden"
          style={{ width: 56, flexShrink: 0 }}
        >
          <div
            style={{
              width: `${(isTransitioning ? 1 : p) * 100}%`,
              height: '100%',
              background: 'linear-gradient(to right, #0071e3, #5e5ce6)',
              borderRadius: 9999,
              transition: 'width 0.06s linear',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default MobileScrollTransitionIndicator;
