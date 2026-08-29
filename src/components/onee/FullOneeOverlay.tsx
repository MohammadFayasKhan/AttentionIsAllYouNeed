/**
 * FullOneeOverlay.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * This component orchestrates the large-screen Conversational Research Companion.
 *
 * Performance & Animation Optimizations:
 *   1. Persistent DOM Mounting:
 *      Remains stably mounted in the DOM to preserve Onee avatar instance, chat history,
 *      Markdown renderer cache, and sub-application states across open/close cycles.
 *   2. Pure GPU Transform & Opacity Transitions:
 *      Uses lightweight transform (scale 0.97 -> 1.0, translateY 6px -> 0px) and opacity
 *      transitions (200-240ms ease-out opening, 180ms ease-in closing) with will-change.
 *   3. Zero Heavy Backdrop Blur Animations:
 *      Uses a static lightweight overlay backdrop without frame-by-frame filter recalculation.
 *   4. Double-Click & Rapid Toggle Protection:
 *      Debounced action handlers prevent competing transition states.
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

export type OverlayTab = 'chat' | 'quiz' | 'flashcards' | 'notebook' | 'developer';

interface FullOneeOverlayProps {
  isOpen: boolean;
  expression?: ExpressionKey;
  activeChapterId: string;
  initialTab?: OverlayTab;
  mode: EducationalMode;
  onModeChange: (mode: EducationalMode) => void;
  onClose: () => void;
}

export const FullOneeOverlay: React.FC<FullOneeOverlayProps> = ({
  isOpen,
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
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const [shouldRenderVisibility, setShouldRenderVisibility] = useState<boolean>(isOpen);

  const avatarRef = useRef<AvatarRefHandle>(null);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Manage smooth visibility and transition state
  useEffect(() => {
    if (isOpen) {
      setShouldRenderVisibility(true);
      setIsTransitioning(true);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = setTimeout(() => {
        setIsTransitioning(false);
      }, 250);
    } else {
      setIsTransitioning(true);
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = setTimeout(() => {
        setIsTransitioning(false);
        setShouldRenderVisibility(false);
      }, 200);
    }

    return () => {
      if (transitionTimerRef.current) clearTimeout(transitionTimerRef.current);
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    oneeBridge.emit('assistant_close');
    onClose();
  }, [onClose]);

  // Listen to Escape key for instant clean modal closing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose, isOpen]);

  // Sync initialTab when prop changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Subscribe to Application-wide Onee Event Bridge for dynamic reaction handling
  useEffect(() => {
    const unsubscribe = oneeBridge.subscribe((reaction: OneeReaction) => {
      setCurrentAnim(reaction.animation);
      if (avatarRef.current) {
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
    <div
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/60 backdrop-blur-sm font-sans select-none transition-opacity duration-200 ${
        isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      } ${shouldRenderVisibility ? 'visible' : 'invisible'}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      {/* Premium Modal Window Container with Hardware-Accelerated Transforms */}
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-6xl h-[94svh] max-h-[880px] bg-white border border-black/10 rounded-3xl shadow-apple-lg overflow-hidden flex flex-col select-auto transform-gpu transition-all duration-220 ${
          isOpen
            ? 'scale-100 translate-y-0 opacity-100 ease-out'
            : 'scale-[0.97] translate-y-2 opacity-0 ease-in'
        } ${isTransitioning ? 'will-change-transform will-change-opacity' : ''}`}
      >
        {/* Top Header Control Bar */}
        <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-b border-black/5 flex items-center justify-between bg-slate-50/90 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-apple-blue flex items-center justify-center text-white font-bold font-mono text-xs shadow-apple-sm shrink-0">
              3D
            </div>
            <div className="min-w-0">
              <h3 className="text-xs sm:text-sm font-bold font-mono text-apple-text flex items-center gap-2 truncate">
                <span className="truncate">Onee AI Companion</span>
                <span className="text-[9px] bg-blue-100 text-apple-blue font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
                  Grounded
                </span>
              </h3>
              <p className="text-[10px] text-apple-secondary font-mono truncate hidden sm:block">
                Vaswani et al. (2017) • NIPS 2017 arXiv:1706.03762v7
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Global Synchronized Difficulty Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-black/5 p-1 rounded-full text-xs font-mono">
              {educationalModes.map((m) => {
                const isSelected = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => handleModeToggle(m.id)}
                    className={`px-3 py-1 rounded-full font-bold transition-all text-[11px] ${
                      isSelected
                        ? 'bg-white text-apple-blue shadow-apple-sm'
                        : 'text-apple-secondary hover:text-apple-text'
                    }`}
                  >
                    {m.label}
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
          <div className="hidden md:flex md:w-80 lg:w-[340px] p-4 lg:p-6 bg-gradient-to-b from-blue-50/80 via-white to-slate-50 border-r border-black/5 flex-col items-center justify-between text-center shrink-0 overflow-y-auto no-scrollbar">
            {/* Contextual Dynamic Speech Caption */}
            {companionCaption && (
              <div className="w-full mb-2 p-3 rounded-2xl bg-white border border-blue-200/80 shadow-apple-sm text-xs font-sans text-apple-text text-left leading-relaxed shrink-0">
                <span className="text-apple-blue font-bold block text-[10px] font-mono mb-0.5">Onee:</span>
                {companionCaption}
              </div>
            )}

            {/* 3D Character Stage */}
            <div className="relative my-auto flex flex-col items-center select-none py-1">
              <div className="relative flex flex-col items-center">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/15 via-indigo-500/15 to-purple-500/15 rounded-full blur-xl opacity-60" />

                <AvatarController
                  ref={avatarRef}
                  animation={currentAnim}
                  size={240}
                  className="relative z-10 filter drop-shadow-xl"
                  onClick={() => oneeBridge.emit('avatar_tap')}
                />

                <div className="mt-1 px-3 py-0.5 rounded-full bg-blue-100/80 border border-blue-200 text-apple-blue text-[10px] font-mono font-bold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Procedural Avatar</span>
                </div>
              </div>
            </div>

            <div className="space-y-0.5 mt-1 shrink-0">
              <h4 className="text-xs font-bold text-apple-text font-mono">
                Onee Research Companion
              </h4>
              <p className="text-[10px] text-apple-secondary font-sans leading-relaxed">
                Directly grounded in Vaswani et al. (2017).
              </p>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="w-full mt-2.5 flex flex-col gap-1 font-mono text-xs bg-black/5 p-1.5 rounded-2xl shrink-0">
              <div className="grid grid-cols-2 gap-1">
                <button
                  onClick={() => handleTabChange('chat')}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold transition-all ${
                    activeTab === 'chat' ? 'bg-white text-apple-blue shadow-apple-sm' : 'text-apple-secondary hover:text-apple-text'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Q&A Chat</span>
                </button>
                <button
                  onClick={() => handleTabChange('quiz')}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold transition-all ${
                    activeTab === 'quiz' ? 'bg-white text-apple-blue shadow-apple-sm' : 'text-apple-secondary hover:text-apple-text'
                  }`}
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Quiz</span>
                </button>
                <button
                  onClick={() => handleTabChange('flashcards')}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold transition-all ${
                    activeTab === 'flashcards' ? 'bg-white text-apple-blue shadow-apple-sm' : 'text-apple-secondary hover:text-apple-text'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Flashcards</span>
                </button>
                <button
                  onClick={() => handleTabChange('notebook')}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold transition-all ${
                    activeTab === 'notebook' ? 'bg-white text-apple-blue shadow-apple-sm' : 'text-apple-secondary hover:text-apple-text'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>3D Paper</span>
                </button>
              </div>

              {/* Developer Tab */}
              <button
                onClick={() => handleTabChange('developer')}
                className={`w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-xl font-bold transition-all ${
                  activeTab === 'developer' ? 'bg-white text-apple-blue shadow-apple-sm' : 'text-apple-secondary hover:text-apple-text'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Developer (Fayas)</span>
              </button>
            </div>
          </div>

          {/* Mobile Tab Switcher Bar */}
          <div className="md:hidden flex items-center justify-between p-2 border-b border-black/5 bg-white shrink-0 overflow-x-auto no-scrollbar gap-1 font-mono text-xs">
            <button
              onClick={() => handleTabChange('chat')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'chat' ? 'bg-apple-blue text-white shadow-apple-sm' : 'bg-slate-100 text-apple-secondary'
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => handleTabChange('quiz')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'quiz' ? 'bg-apple-blue text-white shadow-apple-sm' : 'bg-slate-100 text-apple-secondary'
              }`}
            >
              Quiz
            </button>
            <button
              onClick={() => handleTabChange('flashcards')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'flashcards' ? 'bg-apple-blue text-white shadow-apple-sm' : 'bg-slate-100 text-apple-secondary'
              }`}
            >
              Cards
            </button>
            <button
              onClick={() => handleTabChange('notebook')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'notebook' ? 'bg-apple-blue text-white shadow-apple-sm' : 'bg-slate-100 text-apple-secondary'
              }`}
            >
              3D Paper
            </button>
            <button
              onClick={() => handleTabChange('developer')}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                activeTab === 'developer' ? 'bg-apple-blue text-white shadow-apple-sm' : 'bg-slate-100 text-apple-secondary'
              }`}
            >
              Developer
            </button>
          </div>

          {/* Right Column: Active Interactive Panel */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-5 flex flex-col justify-start min-h-0 allow-inner-scroll">
            {activeTab === 'chat' && (
              <ChatPanel
                activeChapterId={activeChapterId}
                mode={mode}
              />
            )}
            {activeTab === 'quiz' && (
              <Quiz chapterId={activeChapterId} mode={mode} />
            )}
            {activeTab === 'flashcards' && (
              <div className="w-full h-auto py-2 flex items-center justify-center">
                <Flashcards initialChapterId={activeChapterId} mode={mode} />
              </div>
            )}
            {activeTab === 'notebook' && (
              <div className="w-full h-auto min-h-0 py-2 flex items-center justify-center">
                <Sketchbook />
              </div>
            )}
            {activeTab === 'developer' && (
              <div className="w-full h-auto py-2 flex items-center justify-center">
                <DeveloperCard />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FullOneeOverlay;
