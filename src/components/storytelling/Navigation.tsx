/**
 * Navigation.tsx
 * ─────────────────────────────────────────────────────────────────
 * Fixed Top Navigation Header & Global Control Bar
 *
 * Project: AttentionIsAllYouNeed
 * Built by: Mohammad Fayas Khan (3rd-year B.Tech CSE AI/ML student at LPU)
 *
 * Responsibilities:
 *   1. Paper Identity: Quick navigation to Chapter 00 ("Attention Is All You Need").
 *   2. Global Synchronized Difficulty Segmented Control:
 *      Toggles between BEGINNER, INTERMEDIATE, TECHNICAL, and PAPER modes.
 *   3. Accessible Chapters Dropdown: Dropdown with independent two-way scrolling across all 11 chapters.
 *   4. Developer Acknowledgement: Quick badge launching Creator profile modal.
 *   5. Ask Onee AI Launcher: Instant trigger for the grounded conversational companion.
 */

import React, { useState, useEffect, useRef } from 'react';
import { STORY_CHAPTERS, EducationalMode } from '../../data/paperData';
import { oneeBridge } from '../../lib/oneeEvents';
import { OverlayTab } from '../onee/FullOneeOverlay';
import myPic from '../../MyPic.jpeg';
import { BookOpen, FileText, Sparkles, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavigationProps {
  activeSectionId: string;
  onNavigate: (sectionId: string) => void;
  mode: EducationalMode;
  onModeChange: (mode: EducationalMode) => void;
  onOpenOnee: (tab?: OverlayTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeSectionId,
  onNavigate,
  mode,
  onModeChange,
  onOpenOnee
}) => {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const educationalModes: { id: EducationalMode; label: string }[] = [
    { id: 'BEGINNER', label: 'BEGINNER' },
    { id: 'INTERMEDIATE', label: 'INTERMEDIATE' },
    { id: 'TECHNICAL', label: 'TECHNICAL' },
    { id: 'PAPER_MODE', label: 'PAPER' }
  ];

  // Close menu on outside click or Escape
  useEffect(() => {
    const handleOutside = (e: MouseEvent | TouchEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };

    if (menuOpen) {
      document.addEventListener('mousedown', handleOutside);
      document.addEventListener('touchstart', handleOutside, { passive: true });
      document.addEventListener('keydown', handleEscape);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [menuOpen]);

  const handleModeSelect = (newMode: EducationalMode) => {
    onModeChange(newMode);
    oneeBridge.emit('difficulty_change', `“Switched to ${newMode.replace('_MODE', '')} depth!”`);
  };

  return (
    <header className="fixed top-0 left-0 right-0 w-full h-14 sm:h-16 shrink-0 z-50 px-2.5 sm:px-6 lg:px-8 bg-white/85 border-b border-black/5 backdrop-blur-2xl transition-all flex items-center max-w-full overflow-visible">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Brand & Title */}
        <div
          className="flex items-center gap-2 sm:gap-3 cursor-pointer select-none shrink-0 min-w-0"
          onClick={() => onNavigate('story-hook')}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onNavigate('story-hook'); }}
          aria-label="Go to start of Attention Is All You Need"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-apple-blue flex items-center justify-center text-white font-bold font-mono text-xs shadow-apple-sm shrink-0">
            A
          </div>
          <div className="min-w-0">
            <h1 className="text-[11px] sm:text-sm font-bold text-apple-text font-mono tracking-tight flex items-center gap-1.5 sm:gap-2">
              <span className="whitespace-nowrap">ATTENTION IS ALL YOU NEED</span>
              <span className="hidden md:inline-block text-[9px] bg-blue-100 text-apple-blue font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
                Vaswani et al.
              </span>
            </h1>
            <p className="text-[9px] sm:text-[10px] text-apple-secondary font-mono hidden sm:block truncate">
              NIPS 2017 • arXiv:1706.03762v7
            </p>
          </div>
        </div>

        {/* Global Synchronized Difficulty Segmented Control */}
        <div className="hidden lg:flex items-center gap-1 bg-black/5 p-1 rounded-full text-xs font-mono relative shrink-0" role="radiogroup" aria-label="Educational Difficulty Mode">
          {educationalModes.map((m) => {
            const isSelected = mode === m.id;
            return (
              <button
                key={m.id}
                role="radio"
                aria-checked={isSelected}
                onClick={() => handleModeSelect(m.id)}
                className={`relative z-10 px-3.5 py-1 rounded-full font-bold transition-all text-[11px] focus:outline-none focus-visible:ring-2 focus-visible:ring-apple-blue ${
                  isSelected ? 'text-apple-blue' : 'text-apple-secondary hover:text-apple-text'
                }`}
              >
                {m.label}
                {isSelected && (
                  <motion.div
                    layoutId="globalModePill"
                    className="absolute inset-0 bg-white rounded-full shadow-apple-sm -z-10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Right Action Controls: Developer Pill, Chapters Menu, PDF, Ask Onee */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Built by Fayas Creator Badge */}
          <button
            onClick={() => onOpenOnee('developer')}
            className="flex items-center gap-1.5 py-1 px-1.5 sm:px-2.5 rounded-full bg-slate-100/90 border border-black/10 hover:bg-slate-200/80 transition-all text-xs font-mono shadow-apple-xs group shrink-0 focus-visible:ring-2 focus-visible:ring-apple-blue"
            title="View Developer Acknowledgement (Fayas)"
            aria-label="View Developer profile for Mohammad Fayas Khan"
          >
            <img
              src={myPic}
              alt="Fayas"
              className="w-5 h-5 rounded-full object-cover border border-blue-200 shrink-0"
            />
            <span className="text-[11px] font-bold text-apple-text group-hover:text-apple-blue transition-colors hidden sm:inline-block">
              Built by Fayas
            </span>
          </button>

          {/* Chapter Selector Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-label="Toggle Chapter Selection Menu"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-apple-bg border border-black/10 text-[11px] sm:text-xs font-mono font-bold text-apple-text hover:bg-black/5 transition-all shadow-apple-sm shrink-0 focus-visible:ring-2 focus-visible:ring-apple-blue"
            >
              <BookOpen className="w-3.5 h-3.5 text-apple-blue" />
              <span className="hidden sm:inline-block">Chapters</span>
            </button>

            {menuOpen && (
              <div
                data-scrollable="true"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                className="absolute right-0 mt-2 w-72 sm:w-80 max-w-[calc(100vw-1.5rem)] bg-white border border-black/10 rounded-2xl p-2 backdrop-blur-2xl shadow-apple-lg z-50 max-h-96 overflow-y-auto font-mono text-xs animate-in fade-in zoom-in-95 duration-150 overscroll-contain"
                style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
              >
                <div className="flex items-center justify-between px-3 py-1.5 text-[10px] font-bold text-apple-tertiary uppercase border-b border-black/5 mb-1 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
                  <span>11 Interactive Chapters</span>
                  <button
                    onClick={() => setMenuOpen(false)}
                    className="p-0.5 rounded hover:bg-black/5"
                    aria-label="Close chapters menu"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div className="space-y-1">
                  {STORY_CHAPTERS.map((ch) => (
                    <button
                      key={ch.id}
                      onClick={() => {
                        onNavigate(ch.id);
                        setMenuOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between text-xs ${
                        activeSectionId === ch.id
                          ? 'bg-blue-50 text-apple-blue font-bold border border-blue-200 shadow-apple-sm'
                          : 'text-apple-secondary hover:bg-apple-bg hover:text-apple-text'
                      }`}
                    >
                      <span className="truncate">Ch {ch.chapterNumber} • {ch.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ArXiv PDF Link */}
          <a
            href="https://arxiv.org/abs/1706.03762"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-black/10 text-xs font-mono font-bold text-apple-secondary hover:text-apple-text hover:bg-slate-200 transition-all shadow-apple-sm shrink-0 focus-visible:ring-2 focus-visible:ring-apple-blue"
            aria-label="Open original arXiv PDF paper (1706.03762)"
          >
            <FileText className="w-3.5 h-3.5 text-apple-secondary" />
            <span>PDF</span>
          </a>

          {/* Ask Onee AI Trigger */}
          <button
            onClick={() => {
              oneeBridge.emit('assistant_open');
              onOpenOnee('chat');
            }}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-apple-blue text-white text-[11px] sm:text-xs font-mono font-bold hover:bg-blue-600 transition-all shadow-apple-sm group shrink-0 focus-visible:ring-2 focus-visible:ring-blue-400"
            aria-label="Open Onee AI Research Assistant"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Ask Onee</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
