/**
 * App.tsx
 * ─────────────────────────────────────────────────────────────────
 * Root component.
 *
 * Section-by-Section Snap Architecture:
 *   - ONE chapter visible at a time inside a full-viewport stage.
 *   - AnimatePresence drives smooth blur+fade+slide transitions between chapters.
 *   - Fixed Navigation header at top: 0, never moves.
 *   - Chapter Rail fixed on left (xl: screens).
 *   - Keyboard (Arrow/Page/Home/End), wheel, trackpad, and touch swipe
 *     all navigate between chapters via useChapterSnap.
 */

import React, { useState } from 'react';
import { STORY_CHAPTERS, EducationalMode } from './data/paperData';
import { useChapterSnap } from './hooks/useChapterSnap';
import { Navigation } from './components/storytelling/Navigation';
import { SpatialScene } from './components/storytelling/SpatialScene';
import { LivingOneeStage } from './components/onee/LivingOneeStage';
import { ChapterRail } from './components/storytelling/ChapterRail';
import { OverlayTab } from './components/onee/FullOneeOverlay';
import { ExpressionKey } from './components/assistant/AvatarController';
import { motion, AnimatePresence } from 'framer-motion';

// Transition configuration — Apple-like ease curves
const TRANSITION_CONFIG = {
  duration: 0.55,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

// Slide offset for enter/exit (subtle, not jarring)
const SLIDE_OFFSET = 50;

export function App() {
  const sectionIds = STORY_CHAPTERS.map((c) => c.id);

  const {
    activeIndex,
    activeChapterId,
    goToChapter,
    totalChapters,
    isModalOpen,
    setIsModalOpen,
    direction,
  } = useChapterSnap(sectionIds);

  const [mode, setMode] = useState<EducationalMode>('BEGINNER');
  const [modalTab, setModalTab] = useState<OverlayTab>('chat');

  const activeChapter = STORY_CHAPTERS[activeIndex] ?? STORY_CHAPTERS[0];
  const currentMood   = (activeChapter.oneeMood as ExpressionKey) ?? 'neutral';

  const handleOpenCompanion = (tab: OverlayTab = 'chat') => {
    setModalTab(tab);
    setIsModalOpen(true);
  };
  const handleCloseCompanion = () => setIsModalOpen(false);

  // Direction-aware variants for slide transitions
  const slideDirection = direction === 'prev' ? -1 : 1;

  return (
    <div className="app-root">

      {/* Ambient background glow — fixed, pointer-events-none */}
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

      {/* Fixed top navigation bar — rock-solid, firmly anchored */}
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
          >
            <SpatialScene
              chapter={activeChapter}
              isActive={true}
              mode={mode}
              onOpenCompanion={handleOpenCompanion}
            />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Chapter position indicator (mobile) */}
      <div className="chapter-counter xl:hidden">
        <span className="chapter-counter-current">
          {String(activeIndex + 1).padStart(2, '0')}
        </span>
        <span className="chapter-counter-sep">/</span>
        <span className="chapter-counter-total">
          {String(totalChapters).padStart(2, '0')}
        </span>
      </div>

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
