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
 *
 * 3. Dynamic Ambient Glassmorphism:
 *    - Hardware-accelerated radial glow diffusion.
 *
 * 4. Responsive Scene Stage:
 *    - Houses `SpatialScene.tsx` with smooth, natural document flow.
 *
 * 5. Living Companion Stage:
 *    - Houses `LivingOneeStage.tsx` and stably mounted `FullOneeOverlay.tsx`.
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
    <div className="h-[100dvh] w-screen overflow-hidden bg-[#f5f5f7] text-[#1d1d1f] font-sans relative selection:bg-blue-500/20 selection:text-blue-900 flex flex-col justify-between">
      {/* Hardware-Accelerated Ambient Glow Diffusion */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 contain-strict">
        <div
          className="absolute -top-[15%] -left-[10%] w-[650px] h-[650px] rounded-full opacity-60 pointer-events-none gpu-layer"
          style={{
            background: 'radial-gradient(circle, rgba(0, 113, 227, 0.22) 0%, rgba(99, 102, 241, 0.12) 40%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
        <div
          className="absolute -bottom-[15%] -right-[10%] w-[700px] h-[700px] rounded-full opacity-55 pointer-events-none gpu-layer"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.20) 0%, rgba(236, 72, 153, 0.10) 40%, transparent 70%)',
            filter: 'blur(60px)'
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[550px] h-[550px] rounded-full opacity-45 pointer-events-none gpu-layer"
          style={{
            background: 'radial-gradient(circle, rgba(0, 199, 190, 0.18) 0%, rgba(0, 113, 227, 0.08) 40%, transparent 70%)',
            filter: 'blur(50px)'
          }}
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

      {/* Chapter Indicator Rail (Left Margin Viewport on Desktop) */}
      <div className="hidden xl:flex fixed left-4 top-1/2 -translate-y-1/2 z-30 flex-col items-center gap-2 pointer-events-none select-none">
        <div className="text-[10px] font-mono font-bold text-apple-blue tracking-widest uppercase mb-1">
          {activeIndex < 9 ? `0${activeIndex + 1}` : activeIndex + 1} / {totalChapters < 10 ? `0${totalChapters}` : totalChapters}
        </div>
        <div className="flex flex-col gap-1.5 pointer-events-auto">
          {STORY_CHAPTERS.map((ch, idx) => (
            <button
              key={ch.id}
              onClick={() => goToChapter(idx)}
              className={`w-2 rounded-full transition-all duration-200 ${
                idx === activeIndex
                  ? 'h-6 bg-apple-blue shadow-apple-sm'
                  : 'h-2 bg-black/15 hover:bg-black/30'
              }`}
              title={`Chapter ${ch.chapterNumber}: ${ch.title}`}
            />
          ))}
        </div>
      </div>

      {/* Discrete Chapter Scene Stage Container */}
      <main className="w-full h-full flex-1 pt-16 relative overflow-hidden flex items-center justify-center z-10 contain-paint">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeChapter.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="w-full h-full flex items-center justify-center overflow-hidden gpu-layer"
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

      {/* Living Onee Companion & Stably Mounted Overlay */}
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
