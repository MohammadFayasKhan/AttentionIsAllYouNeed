/**
 * Navigation.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * This component renders the fixed top navigation bar (reserved 64px height) following
 * Apple-inspired design principles (frosted backdrop-blur-2xl, subtle borders, mono badges).
 *
 * Responsibilities:
 *   1. Brand & Paper Identity: Quick navigation back to Chapter 00 / Top.
 *   2. Global Synchronized Difficulty Segmented Control:
 *      Allows the learner to seamlessly toggle between BEGINNER, INTERMEDIATE, TECHNICAL,
 *      and PAPER modes. Drives layout, explanations, mathematical depth, and Onee's tone.
 *   3. Chapter Selector Dropdown: Fast drawer navigation across all 11 paper chapters.
 *   4. Developer Acknowledgement: Direct clickable badge for creator Fayas.
 *   5. Ask Onee AI Trigger: Instant launcher for the Conversational Research Companion.
 */

import React, { useState } from 'react';
import { STORY_CHAPTERS, EducationalMode } from '../../data/paperData';
import { oneeBridge } from '../../lib/oneeEvents';
import { OverlayTab } from '../onee/FullOneeOverlay';
import myPic from '../../MyPic.jpeg';
import { BookOpen, FileText, Sparkles, User } from 'lucide-react';
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

  const educationalModes: { id: EducationalMode; label: string }[] = [
    { id: 'BEGINNER', label: 'BEGINNER' },
    { id: 'INTERMEDIATE', label: 'INTERMEDIATE' },
    { id: 'TECHNICAL', label: 'TECHNICAL' },
    { id: 'PAPER_MODE', label: 'PAPER' }
  ];

  const handleModeSelect = (newMode: EducationalMode) => {
    onModeChange(newMode);
    oneeBridge.emit('difficulty_change', `“Switched to ${newMode.replace('_MODE', '')} depth!”`);
  };

  return (
    <header className="fixed top-0 left-0 right-0 h-16 z-40 px-4 sm:px-8 bg-white/85 border-b border-black/5 backdrop-blur-2xl transition-all flex items-center">
      <div className="w-full max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand & Title */}
        <div
          className="flex items-center gap-3 cursor-pointer select-none shrink-0"
          onClick={() => onNavigate('story-hook')}
        >
          <div className="w-9 h-9 rounded-2xl bg-apple-blue flex items-center justify-center text-white font-bold font-mono text-xs shadow-apple-sm">
            A
          </div>
          <div>
            <h1 className="text-xs sm:text-sm font-bold text-apple-text font-mono tracking-tight flex items-center gap-2">
              <span>ATTENTION IS ALL YOU NEED</span>
              <span className="hidden md:inline-block text-[9px] bg-blue-100 text-apple-blue font-bold px-2 py-0.5 rounded-full uppercase">
                Vaswani et al.
              </span>
            </h1>
            <p className="text-[10px] text-apple-secondary font-mono hidden sm:block">
              NIPS 2017 • arXiv:1706.03762v7
            </p>
          </div>
        </div>

        {/* Global Synchronized Difficulty Segmented Control */}
        <div className="hidden lg:flex items-center gap-1 bg-black/5 p-1 rounded-full text-xs font-mono relative">
          {educationalModes.map((m) => {
            const isSelected = mode === m.id;
            return (
              <button
                key={m.id}
                onClick={() => handleModeSelect(m.id)}
                className={`relative z-10 px-3.5 py-1 rounded-full font-bold transition-all text-[11px] ${
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
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          {/* Built by Fayas Creator Badge */}
          <button
            onClick={() => onOpenOnee('developer')}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-full bg-slate-100/90 border border-black/10 hover:bg-slate-200/80 transition-all text-xs font-mono shadow-apple-xs group"
            title="View Developer Acknowledgement (Fayas)"
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
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-apple-bg border border-black/10 text-xs font-mono font-bold text-apple-text hover:bg-black/5 transition-all shadow-apple-sm"
            >
              <BookOpen className="w-3.5 h-3.5 text-apple-blue" />
              <span className="hidden sm:inline-block">Chapters</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-black/10 rounded-2xl p-2 backdrop-blur-2xl shadow-apple-lg z-50 max-h-96 overflow-y-auto font-mono text-xs">
                <div className="px-3 py-1.5 text-[10px] font-bold text-apple-tertiary uppercase border-b border-black/5 mb-1">
                  11 Interactive Chapters
                </div>
                {STORY_CHAPTERS.map((ch) => (
                  <button
                    key={ch.id}
                    onClick={() => {
                      onNavigate(ch.id);
                      setMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl transition-all flex items-center justify-between ${
                      activeSectionId === ch.id
                        ? 'bg-blue-50 text-apple-blue font-bold border border-blue-200 shadow-apple-sm'
                        : 'text-apple-secondary hover:bg-apple-bg hover:text-apple-text'
                    }`}
                  >
                    <span>{ch.chapterNumber} • {ch.title}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ArXiv PDF Link */}
          <a
            href="https://arxiv.org/abs/1706.03762"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-slate-100 border border-black/10 text-xs font-mono font-bold text-apple-secondary hover:text-apple-text hover:bg-slate-200 transition-all shadow-apple-sm"
          >
            <FileText className="w-3.5 h-3.5 text-apple-secondary" />
            <span>PDF (arXiv)</span>
          </a>

          {/* Ask Onee AI Trigger */}
          <button
            onClick={() => {
              oneeBridge.emit('assistant_open');
              onOpenOnee('chat');
            }}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 rounded-full bg-apple-blue text-white text-xs font-mono font-bold hover:bg-blue-600 transition-all shadow-apple-sm group"
          >
            <Sparkles className="w-3.5 h-3.5 animate-spin-slow" />
            <span>Ask Onee</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Navigation;
