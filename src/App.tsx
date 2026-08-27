/**
 * App.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * App.tsx is the root component of the "Attention Is All You Need" interactive experience.
 * It manages the primary application states and visual layout hierarchy:
 *
 * 1. Global Educational Mode State:
 *    - Initialized strictly to 'BEGINNER' on fresh load as required.
 *    - Persistently synchronized across the top navigation, chapter scenes, living Onee dock,
 *      and the Full Onee Conversational Companion (Chat, Quiz, Flashcards, 3D Notebook, Developer).
 *
 * 2. Chapter Snap & Scrollytelling Engine:
 *    - Powered by `useChapterSnap.ts` with momentum detection, trackpad inertia protection,
 *      and keyboard navigation (Arrow keys, Page Up/Down).
 *    - Left margin chapter indicator rail displays progress across all 11 chapters.
 *
 * 3. Dynamic Ambient Glassmorphism:
 *    - Continuous multi-layer ambient blur glow orbs diffused through backdrop-filter frosted glass.
 *
 * 4. Responsive Scene Stage:
 *    - Houses `SpatialScene.tsx` inside Framer Motion's AnimatePresence for smooth chapter transitions.
 *    - Reserved 64px header space ensures zero overlap or clipping.
 *
 * 5. Living Companion Stage:
 *    - Houses `LivingOneeStage.tsx` and `FullOneeOverlay.tsx` with bidirectional event bridge sync.
 */

import React, { useState } from 'react';
import { STORY_CHAPTERS, EducationalMode } from './data/paperData';
import { useChapterSnap } from './hooks/useChapterSnap';
import { Navigation } from './components/storytelling/Navigation';
import { SpatialScene } from './components/storytelling/SpatialScene';
import { LivingOneeStage } from './components/onee/LivingOneeStage';
import { OverlayTab } from './components/onee/FullOneeOverlay';
import { ExpressionKey } from './components/assistant/AvatarController';
import { motion, AnimatePresence } from 'framer-motion';

export function App() {
  const sectionIds = STORY_CHAPTERS.map((c) => c.id);
  const {
    activeIndex,
    activeChapterId,
    goToChapter,
    totalChapters,
    isModalOpen,
    setIsModalOpen
  } = useChapterSnap(sectionIds);

  // Default mode is strictly BEGINNER on fresh load as required
  const [mode, setMode] = useState<EducationalMode>('BEGINNER');
  const [modalTab, setModalTab] = useState<OverlayTab>('chat');

  const activeChapter = STORY_CHAPTERS[activeIndex] || STORY_CHAPTERS[0];
  const currentMood = (activeChapter.oneeMood as ExpressionKey) || 'neutral';

  const handleOpenCompanion = (tab: OverlayTab = 'chat') => {
    setModalTab(tab);
    setIsModalOpen(true);
  };

  const handleCloseCompanion = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="h-[100svh] w-screen overflow-hidden bg-[#f5f5f7] text-[#1d1d1f] font-sans relative selection:bg-blue-500/20 selection:text-blue-900 flex flex-col justify-between">
      {/* Dynamic Ambient Blur Glow Orbs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <motion.div
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -30, 20, 0],
            scale: [1, 1.15, 0.95, 1],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-[15%] -left-[10%] w-[620px] h-[620px] rounded-full bg-gradient-to-br from-blue-400/30 via-indigo-300/25 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -50, 40, 0],
            y: [0, 40, -25, 0],
            scale: [1, 0.9, 1.1, 1],
            opacity: [0.35, 0.55, 0.35]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -bottom-[15%] -right-[10%] w-[680px] h-[680px] rounded-full bg-gradient-to-tl from-purple-400/30 via-pink-300/20 to-transparent blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 30, -40, 0],
            y: [0, 20, -30, 0],
            scale: [0.95, 1.1, 1, 0.95],
            opacity: [0.25, 0.4, 0.25]
          }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[520px] rounded-full bg-gradient-to-tr from-cyan-400/25 via-blue-200/20 to-transparent blur-3xl"
        />
      </div>

      {/* Fixed Top Header Navigation (Reserved 64px Height Globally) */}
      <Navigation
        activeSectionId={activeChapterId}
        onNavigate={(id) => {
          const idx = sectionIds.indexOf(id);
          if (idx !== -1) goToChapter(idx);
        }}
        mode={mode}
        onModeChange={setMode}
        onOpenOnee={handleOpenCompanion}
      />

      {/* Chapter Indicator Rail (Left Margin Viewport) */}
      <div className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center gap-2 pointer-events-none select-none">
        <div className="text-[10px] font-mono font-bold text-apple-blue tracking-widest uppercase mb-1">
          {activeIndex < 9 ? `0${activeIndex + 1}` : activeIndex + 1} / {totalChapters < 10 ? `0${totalChapters}` : totalChapters}
        </div>
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          {STORY_CHAPTERS.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => goToChapter(idx)}
              className={`w-2 rounded-full transition-all duration-300 ${
                idx === activeIndex
                  ? 'h-6 bg-apple-blue shadow-apple-sm'
                  : 'h-2 bg-black/15 hover:bg-black/30'
              }`}
              title={`Chapter ${ch.chapterNumber}: ${ch.title}`}
            />
          ))}
        </div>
      </div>

      {/* Discrete Chapter Scene Stage Container (Reserved Space for Header) */}
      <main className="w-full h-full flex-1 pt-16 relative overflow-hidden flex items-center justify-center z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChapter.id}
            initial={{ opacity: 0, y: 16, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -16, scale: 0.985 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full flex items-center justify-center overflow-hidden"
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

      {/* Living Onee Companion & Reactions */}
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
