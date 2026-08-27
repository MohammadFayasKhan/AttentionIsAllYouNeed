/**
 * FullOneeOverlay.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * This component orchestrates the large-screen Conversational Research Companion.
 * It houses a dual-column workspace:
 *   1. Left Column: The live procedural 3D Onee avatar character stage, complete
 *      with dynamic speech bubble captions, real-time emotion transitions, and tab navigation.
 *   2. Right Column: The active interactive workspace which seamlessly mounts one of
 *      five sub-applications:
 *        - ChatPanel: Grounded Q&A with progressive token/sentence streaming & KaTeX math.
 *        - Quiz: Dynamic chapter-grounded comprehension quiz with option shuffling.
 *        - Flashcards: 3D interactive flip cards with mathematical formulas.
 *        - Sketchbook: 3D interactive research paper replica with zoom/tilt controls.
 *        - DeveloperCard: Acknowledgement & creator portfolio for Fayas.
 *
 * Click-to-Close & Keyboard Handling:
 *   - Clicking the darkened backdrop outside the modal immediately closes the overlay.
 *   - Pressing the Escape key immediately triggers clean modal dismissal.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AvatarController, AnimationKey, ExpressionKey, AvatarRefHandle } from '../assistant/AvatarController';
import { ChatPanel } from '../assistant/ChatPanel';
import { Quiz } from '../quiz/Quiz';
import { Flashcards } from '../quiz/Flashcards';
import { Sketchbook } from '../effects/Sketchbook';
import { DeveloperCard } from '../common/DeveloperCard';
import { EducationalMode } from '../../data/paperData';
import { oneeBridge, OneeReaction } from '../../lib/oneeEvents';
import { MessageSquare, HelpCircle, Layers, X, BookOpen, Sparkles, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export type OverlayTab = 'chat' | 'quiz' | 'flashcards' | 'notebook' | 'developer';

interface FullOneeOverlayProps {
  expression?: ExpressionKey;
  activeChapterId: string;
  initialTab?: OverlayTab;
  mode: EducationalMode;
  onModeChange: (mode: EducationalMode) => void;
  onClose: () => void;
}

export const FullOneeOverlay: React.FC<FullOneeOverlayProps> = ({
  activeChapterId,
  initialTab = 'chat',
  mode,
  onModeChange,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<OverlayTab>(initialTab);
  const [currentAnim, setCurrentAnim] = useState<AnimationKey>('listening');
  const [companionCaption, setCompanionCaption] = useState<string | null>(
    '“Ask me anything about the Transformer architecture and equations!”'
  );

  const avatarRef = useRef<AvatarRefHandle>(null);

  const handleClose = useCallback(() => {
    oneeBridge.emit('assistant_close');
    onClose();
  }, [onClose]);

  // Listen to Escape key for instant clean modal closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  // Sync initialTab when prop changes
  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  // Subscribe to Application-wide Onee Event Bridge for dynamic reaction handling
  useEffect(() => {
    const unsubscribe = oneeBridge.subscribe((reaction: OneeReaction) => {
      setCurrentAnim(reaction.animation);
      if (avatarRef.current) {
        // Pass exact autoIdleDelayMs (does not force 4000ms onto thinking or working)
        avatarRef.current.play(reaction.animation, reaction.autoIdleDelayMs);
      }
      if (reaction.caption) {
        setCompanionCaption(reaction.caption);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleTabChange = (tab: OverlayTab) => {
    setActiveTab(tab);
    if (tab === 'chat') {
      oneeBridge.emit('assistant_open');
    } else if (tab === 'flashcards') {
      oneeBridge.emit('flashcard_open');
    } else if (tab === 'quiz') {
      oneeBridge.emit('quiz_open');
    } else if (tab === 'notebook') {
      oneeBridge.emit('notebook_open');
    } else if (tab === 'developer') {
      oneeBridge.emit('avatar_tap', '“Meet Fayas: Creator & ML Engineer of this experience!”');
    }
  };

  const handleModeToggle = (newMode: EducationalMode) => {
    onModeChange(newMode);
    oneeBridge.emit('difficulty_change', `“Switched to ${newMode.replace('_MODE', '')} depth!”`);
  };

  const educationalModes: { id: EducationalMode; label: string }[] = [
    { id: 'BEGINNER', label: 'BEGINNER' },
    { id: 'INTERMEDIATE', label: 'INTERMEDIATE' },
    { id: 'TECHNICAL', label: 'TECHNICAL' },
    { id: 'PAPER_MODE', label: 'PAPER' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={(e) => {
        // Close modal when clicking darkened backdrop outside window
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-2xl font-sans select-none"
    >
      {/* Premium Apple Glass Modal Window Container */}
      <motion.div
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-6xl h-[92vh] max-h-[880px] bg-white border border-black/10 rounded-3xl shadow-apple-lg overflow-hidden flex flex-col backdrop-blur-3xl select-auto"
      >
        {/* Top Header Control Bar */}
        <div className="px-5 sm:px-6 py-3 border-b border-black/5 flex items-center justify-between bg-slate-50/90 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-apple-blue flex items-center justify-center text-white font-bold font-mono text-xs shadow-apple-sm shrink-0">
              3D
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold font-mono text-apple-text flex items-center gap-2 truncate">
                <span className="truncate">Onee AI Conversational Companion</span>
                <span className="text-[9px] bg-blue-100 text-apple-blue font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
                  Grounded AI
                </span>
              </h3>
              <p className="text-[10px] text-apple-secondary font-mono truncate hidden sm:block">
                Vaswani et al. (2017) • NIPS 2017 arXiv:1706.03762v7
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Global Synchronized Difficulty Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-black/5 p-1 rounded-full text-xs font-mono relative">
              {educationalModes.map((m) => {
                const isSelected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModeToggle(m.id)}
                    className={`relative z-10 px-3 py-1 rounded-full font-bold transition-all text-[11px] ${
                      isSelected ? 'text-apple-blue' : 'text-apple-secondary hover:text-apple-text'
                    }`}
                  >
                    {m.label}
                    {isSelected && (
                      <motion.div
                        layoutId="modalModePill"
                        className="absolute inset-0 bg-white rounded-full shadow-apple-sm -z-10"
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Modal Close Button */}
            <button
              onClick={handleClose}
              className="p-2 rounded-full hover:bg-black/10 text-apple-secondary hover:text-apple-text transition-all"
              aria-label="Close Companion"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Workspace Body: Animated Live Character Stage on Left + Active Interactive Panel on Right */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50/40 min-h-0">
          {/* Left Column: Procedural Onee Avatar Character Stage */}
          <div className="w-full md:w-80 lg:w-[350px] p-5 sm:p-6 bg-gradient-to-b from-blue-50/80 via-white to-slate-50 border-r border-black/5 flex flex-col items-center justify-between text-center shrink-0 overflow-y-auto no-scrollbar">
            {/* Contextual Dynamic Speech Caption */}
            <AnimatePresence mode="wait">
              {companionCaption && (
                <motion.div
                  key={companionCaption}
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="w-full mb-2 p-3 rounded-2xl bg-white border border-blue-200/80 shadow-apple-sm text-xs font-sans text-apple-text text-left leading-relaxed shrink-0"
                >
                  <span className="text-apple-blue font-bold block text-[10px] font-mono mb-0.5">Onee:</span>
                  {companionCaption}
                </motion.div>
              )}
            </AnimatePresence>

            {/* 3D Character Stage */}
            <div className="relative my-auto flex flex-col items-center select-none py-2" style={{ perspective: '1200px' }}>
              <motion.div
                style={{ transformStyle: 'preserve-3d' }}
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                className="relative flex flex-col items-center"
              >
                {/* Radial Lighting Glow */}
                <div className="absolute -inset-6 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-purple-500/20 rounded-full blur-2xl opacity-70" />

                <AvatarController
                  ref={avatarRef}
                  animation={currentAnim}
                  size={260}
                  className="relative z-10 filter drop-shadow-2xl"
                  onClick={() => oneeBridge.emit('avatar_tap')}
                />

                <div className="mt-2 px-3 py-1 rounded-full bg-blue-100/80 border border-blue-200 text-apple-blue text-[10px] font-mono font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Live Procedural Avatar</span>
                </div>
              </motion.div>
            </div>

            <div className="space-y-1 mt-2 shrink-0">
              <h4 className="text-sm font-extrabold text-apple-text font-mono">
                Onee Research Companion
              </h4>
              <p className="text-[11px] text-apple-secondary font-sans leading-relaxed">
                Directly grounded in equations, algorithms, and experiments from Vaswani et al. (2017).
              </p>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="w-full mt-3 flex flex-col gap-1.5 font-mono text-xs bg-black/5 p-1.5 rounded-2xl shrink-0">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleTabChange('chat')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all ${
                    activeTab === 'chat' ? 'bg-white text-apple-blue shadow-apple-sm' : 'text-apple-secondary hover:text-apple-text'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Q&A Chat</span>
                </button>
                <button
                  onClick={() => handleTabChange('quiz')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all ${
                    activeTab === 'quiz' ? 'bg-white text-apple-blue shadow-apple-sm' : 'text-apple-secondary hover:text-apple-text'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Quiz</span>
                </button>
                <button
                  onClick={() => handleTabChange('flashcards')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all ${
                    activeTab === 'flashcards' ? 'bg-white text-apple-blue shadow-apple-sm' : 'text-apple-secondary hover:text-apple-text'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Flashcards</span>
                </button>
                <button
                  onClick={() => handleTabChange('notebook')}
                  className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl font-bold transition-all ${
                    activeTab === 'notebook' ? 'bg-white text-apple-blue shadow-apple-sm' : 'text-apple-secondary hover:text-apple-text'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>3D Notebook</span>
                </button>
              </div>

              {/* Developer Tab */}
              <button
                onClick={() => handleTabChange('developer')}
                className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl font-bold transition-all ${
                  activeTab === 'developer' ? 'bg-white text-apple-blue shadow-apple-sm' : 'text-apple-secondary hover:text-apple-text'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Developer Acknowledgement (Fayas)</span>
              </button>
            </div>
          </div>

          {/* Right Column: Active Interactive Panel */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 flex flex-col justify-center min-h-0">
            {activeTab === 'chat' ? (
              <ChatPanel
                activeChapterId={activeChapterId}
                mode={mode}
              />
            ) : activeTab === 'quiz' ? (
              <Quiz chapterId={activeChapterId} mode={mode} />
            ) : activeTab === 'flashcards' ? (
              <Flashcards initialChapterId={activeChapterId} mode={mode} />
            ) : activeTab === 'notebook' ? (
              <div className="w-full h-full min-h-[460px]">
                <Sketchbook />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center p-4">
                <DeveloperCard />
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default FullOneeOverlay;
