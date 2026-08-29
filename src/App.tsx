/**
 * App.tsx
 * ─────────────────────────────────────────────────────────────────
 * Root component for "Attention Is All You Need"
 *
 * Project: AttentionIsAllYouNeed
 * Built by: Mohammad Fayas Khan (3rd-year B.Tech CSE AI/ML student at LPU)
 *
 * Architecture & Interactions:
 *   - Full-viewport chapter stage rendering one chapter at a time with direction-aware transitions.
 *   - Fixed Navigation header at top with synchronized difficulty mode switcher.
 *   - Desktop Left-Margin Chapter Dot Rail (xl: screens).
 *   - Completely non-intrusive mobile scroll guidance: only appears dynamically when the user
 *     reaches the true chapter boundary and actively pulls toward the next/previous chapter.
 *   - In-flow chapter completion card at the bottom of each chapter.
 *   - Decoupled Onee research companion overlay and event bridge.
 */

import React, { useState } from 'react';
import { STORY_CHAPTERS, EducationalMode } from './data/paperData';
import { useChapterSnap } from './hooks/useChapterSnap';
import { Navigation } from './components/storytelling/Navigation';
import { SpatialScene } from './components/storytelling/SpatialScene';
import { LivingOneeStage } from './components/onee/LivingOneeStage';
import { ChapterRail } from './components/storytelling/ChapterRail';
import { MobileScrollTransitionIndicator } from './components/storytelling/MobileScrollTransitionIndicator';
import { OverlayTab } from './components/onee/FullOneeOverlay';
import { ExpressionKey } from './components/assistant/AvatarController';
import { motion, AnimatePresence } from 'framer-motion';

// Transition configuration — Apple-like ease curves
const TRANSITION_CONFIG = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

// Slide offset for enter/exit
const SLIDE_OFFSET = 50;

export function App() {
  const sectionIds = STORY_CHAPTERS.map((c) => c.id);

  const {
    activeIndex,
    activeChapterId,
    goToChapter,
    nextChapter,
    prevChapter,
    totalChapters,
    isModalOpen,
    setIsModalOpen,
    direction,
    isTransitioning,
    pullProgress,
    pullTarget,
    pullOffsetPx,
  } = useChapterSnap(sectionIds);

  const [mode, setMode] = useState<EducationalMode>('BEGINNER');
  const [modalTab, setModalTab] = useState<OverlayTab>('chat');

  const activeChapter = STORY_CHAPTERS[activeIndex] ?? STORY_CHAPTERS[0];
  const currentMood = (activeChapter.oneeMood as ExpressionKey) ?? 'neutral';

  const nextChapterMeta =
    activeIndex < totalChapters - 1
      ? {
          chapterNumber: String(STORY_CHAPTERS[activeIndex + 1]?.chapterNumber),
          title: STORY_CHAPTERS[activeIndex + 1]?.title,
        }
      : null;

  const handleOpenCompanion = (tab: OverlayTab = 'chat') => {
    setModalTab(tab);
    setIsModalOpen(true);
  };
  const handleCloseCompanion = () => setIsModalOpen(false);

  // Direction-aware variants for slide transitions
  const slideDirection = direction === 'prev' ? -1 : 1;

  return (
    <div className="app-root">
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        <div
          className="absolute -top-[15%] -left-[10%] w-[80vw] max-w-[650px] h-[80vw] max-h-[650px] rounded-full opacity-40"
          style={{ background: 'radial-gradient(circle, rgba(0,113,227,0.18) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
        <div
          className="absolute -bottom-[15%] -right-[10%] w-[80vw] max-w-[700px] h-[80vw] max-h-[700px] rounded-full opacity-35"
          style={{ background: 'radial-gradient(circle, rgba(168,85,247,0.15) 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
      </div>

      {/* Fixed top navigation bar */}
      <Navigation
        activeSectionId={activeChapterId}
        onNavigate={goToChapter}
        mode={mode}
        onModeChange={setMode}
        onOpenOnee={handleOpenCompanion}
      />

      {/* Desktop chapter rail (xl: only, fixed left side) */}
      <ChapterRail
        activeIndex={activeIndex}
        totalChapters={totalChapters}
        onNavigate={goToChapter}
      />

      {/* Full-viewport chapter stage — ONE chapter at a time */}
      <main className="chapter-stage">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeChapterId}
            className="chapter-stage-content"
            initial={{
              opacity: 0,
              y: slideDirection * SLIDE_OFFSET,
              filter: 'blur(6px)',
            }}
            animate={{
              opacity: 1,
              y: 0,
              filter: 'blur(0px)',
            }}
            exit={{
              opacity: 0,
              y: -slideDirection * SLIDE_OFFSET,
              filter: 'blur(4px)',
            }}
            transition={TRANSITION_CONFIG}
            style={{
              transform: pullOffsetPx !== 0 ? `translateY(${pullOffsetPx}px)` : undefined,
              transition: pullOffsetPx === 0 ? 'transform 0.25s cubic-bezier(0.2, 1, 0.3, 1)' : 'none',
            }}
          >
            <SpatialScene
              chapter={activeChapter}
              isActive={true}
              mode={mode}
              onOpenCompanion={handleOpenCompanion}
              onNextChapter={nextChapter}
              nextChapterMeta={nextChapterMeta}
            />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Non-intrusive mobile-only scroll guidance cue (ONLY appears when pulling at boundary) */}
      <MobileScrollTransitionIndicator
        progress={pullProgress}
        target={pullTarget}
        isTransitioning={isTransitioning}
      />

      {/* Onee companion overlay — mounted once, shown/hidden via state */}
      <LivingOneeStage
        expression={currentMood}
        activeChapterId={activeChapterId}
        mode={mode}
        onModeChange={setMode}
        isOpen={isModalOpen}
        onOpen={handleOpenCompanion}
        onClose={handleCloseCompanion}
        initialTab={modalTab}
      />
    </div>
  );
}

export default App;
