/**
 * ChapterRail.tsx
 * ─────────────────────────────────────────────────────────────────
 * Desktop Chapter Dot Indicator Rail & Quick Navigator
 *
 * Project: AttentionIsAllYouNeed
 * Built by: Mohammad Fayas Khan (3rd-year B.Tech CSE AI/ML student at LPU)
 *
 * Architecture & Features:
 *   - Fixed left-margin rail visible on extra-large screens (xl:).
 *   - Visual indicator showing current chapter position (e.g. `03 / 11`).
 *   - Interactive pill/dot items with active styling and hover preview cards.
 *   - Hover card renders chapter eyebrow, title, and subtitle via Framer Motion.
 *   - Click triggers smooth chapter transition to the selected chapter.
 */

import React, { useState } from 'react';
import { STORY_CHAPTERS } from '../../data/paperData';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag } from 'lucide-react';

interface ChapterRailProps {
  activeIndex: number;
  totalChapters: number;
  onNavigate: (index: number) => void;
}

export const ChapterRail: React.FC<ChapterRailProps> = ({
  activeIndex,
  totalChapters,
  onNavigate,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <aside
      className="hidden xl:flex fixed left-5 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-0 select-none pointer-events-none"
      aria-label="Chapter Navigation Rail"
    >
      {/* Counter badge */}
      <div className="text-[10px] font-mono font-bold text-apple-blue tracking-widest uppercase mb-2 pointer-events-none">
        {String(activeIndex + 1).padStart(2, '0')} /{' '}
        {String(totalChapters).padStart(2, '0')}
      </div>

      {/* Dot list */}
      <div className="flex flex-col items-center gap-1.5 pointer-events-auto" style={{ position: 'relative' }}>
        {STORY_CHAPTERS.map((ch, idx) => {
          const isActive  = idx === activeIndex;
          const isHovered = hoveredIndex === idx;

          return (
            <div
              key={ch.id}
              style={{ position: 'relative', display: 'flex', alignItems: 'center' }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Indicator dot / pill */}
              <button
                onClick={() => onNavigate(idx)}
                aria-label={`Go to Chapter ${ch.chapterNumber}: ${ch.title}`}
                className={[
                  'rounded-full transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue',
                  isActive
                    ? 'w-2.5 h-7 bg-apple-blue shadow-apple-sm'
                    : isHovered
                    ? 'w-2.5 h-4 bg-apple-blue/60'
                    : 'w-2 h-2 bg-black/20 hover:bg-black/40',
                ].join(' ')}
              />

              {/* Hover card */}
              <AnimatePresence>
                {isHovered && (
                  <motion.div
                    key="hover-card"
                    initial={{ opacity: 0, x: -6, scale: 0.96 }}
                    animate={{ opacity: 1, x: 0,  scale: 1    }}
                    exit={{    opacity: 0, x: -4,  scale: 0.96 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      position:   'absolute',
                      left:       'calc(100% + 10px)',
                      top:        '50%',
                      transform:  'translateY(-50%)',
                      width:      '240px',
                      zIndex:     50,
                      pointerEvents: 'none',
                    }}
                    className="p-3 rounded-2xl bg-white/95 backdrop-blur-xl border border-black/10 shadow-apple-lg text-left"
                  >
                    <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-apple-blue bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <Tag className="w-2.5 h-2.5" />
                        Ch {ch.chapterNumber}
                      </span>
                      <span className="text-[9px] font-mono text-apple-tertiary">
                        {ch.eyebrow}
                      </span>
                    </div>
                    <h4 className="text-[11px] font-bold text-apple-text font-mono leading-snug">
                      {ch.title}
                    </h4>
                    <p className="text-[10px] text-apple-secondary font-sans leading-relaxed mt-1">
                      {ch.subtitle}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

export default ChapterRail;
