/**
 * App.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * App.tsx is the root component of the "Attention Is All You Need" interactive experience.
 *
 * Page Shell & Layout Architecture:
 *   1. Sticky Top Navigation Bar:
 *      - Occupies real document layout space (64px).
 *      - Sticky positioning ensures main content never begins underneath or overlaps the header.
 *   2. Main Page Stage:
 *      - Normal responsive document flow (`flex-1`).
 *      - Pure content-driven height with locked, balanced outer vertical padding (`--page-vertical-gap`).
 *      - Navbar → Top Gap → [Chapter | Onee Shared Grid] → Bottom Gap → Viewport/Page End.
 *   3. Global Educational Mode State:
 *      - Initialized to 'BEGINNER' on fresh load.
 *      - Synchronized across the entire interface.
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
    <div className="w-full bg-[#f5f5f7] text-[#1d1d1f] font-sans relative selection:bg-blue-500/20 selection:text-blue-900">
      {/* Hardware-Accelerated Ambient Glow Diffusion */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 contain-strict">
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

      {/* Sticky Top Navigation Bar (Occupies real 64px document layout space) */}
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

      {/* Main Page Stage (Normal document flow, content determines height) */}
      <main className="page relative z-10">
        <div className="chapter-layout-wrapper">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeChapter.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              <SpatialScene
                chapter={activeChapter}
                isActive={true}
                mode={mode}
                onOpenCompanion={handleOpenCompanion}
              />
            </motion.div>
          </AnimatePresence>
        </div>
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
