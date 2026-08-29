/**
 * Flashcards.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Interactive 3D flip-card study deck for active recall and mathematical formula mastery.
 *
 * Core Features:
 *   1. True 3D Flip Transform (`rotateY: 180deg` with `backface-visibility: hidden`):
 *      Flips the card smoothly in 3D space with zero mirrored/backward text bugs.
 *   2. Dynamic Sampling (`getDynamicFlashcardsDeck`):
 *      Pulls relevant cards based on active chapter focus.
 *   3. KaTeX Mathematical Typesetting:
 *      Renders clean LaTeX formulas on both front and back.
 *   4. Keyboard & Pointer Navigation:
 *      Supports Arrow keys (Left/Right for deck, Space/Enter/ArrowUp/Down for flip).
 *   5. Centered Layout & Responsive Dimensions:
 *      Maintains stable centered geometry on mobile (320px) through desktop.
 */

import React, { useState, useEffect } from 'react';
import { Flashcard, getDynamicFlashcardsDeck } from '../../data/flashcardData';
import { EducationalMode } from '../../data/paperData';
import { oneeBridge } from '../../lib/oneeEvents';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { motion } from 'framer-motion';
import { Layers, RotateCw, ChevronLeft, ChevronRight, BookOpen, RefreshCw } from 'lucide-react';

interface FlashcardsProps {
  initialChapterId?: string;
  mode?: EducationalMode;
}

export const Flashcards: React.FC<FlashcardsProps> = ({
  initialChapterId,
  mode = 'BEGINNER'
}) => {
  const [deck, setDeck] = useState<Flashcard[]>(() =>
    getDynamicFlashcardsDeck(initialChapterId, mode, 6)
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);

  useEffect(() => {
    const fresh = getDynamicFlashcardsDeck(initialChapterId, mode, 6);
    setDeck(fresh);
    setCurrentIndex(0);
    setIsFlipped(false);
  }, [initialChapterId, mode]);

  const currentCard = deck[currentIndex] || deck[0];

  const handleFlip = () => {
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    oneeBridge.emit(
      'flashcard_flip',
      nextFlipped
        ? '“Card flipped! Reviewing formula and explanation.”'
        : '“Question side active.”'
    );
  };

  const handleNext = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1) % deck.length);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 + deck.length) % deck.length);
  };

  const handleRegenerate = () => {
    const fresh = getDynamicFlashcardsDeck(initialChapterId, mode, 6);
    setDeck(fresh);
    setCurrentIndex(0);
    setIsFlipped(false);
    oneeBridge.emit('flashcard_open', '“Generated a fresh deck of study flashcards!”');
  };

  // Keyboard navigation for flashcards
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

      if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        handleFlip();
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deck.length, isFlipped]);

  return (
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white border border-black/10 shadow-apple-md font-sans flex flex-col items-center justify-center self-center">
      {/* Header Bar */}
      <div className="w-full max-w-lg mx-auto flex items-center justify-between border-b border-black/5 pb-3 mb-4 flex-wrap gap-2">
        <div className="text-left">
          <h3 className="text-sm sm:text-base font-bold text-apple-text font-mono flex items-center gap-2">
            <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-apple-blue shrink-0" />
            <span>Interactive 3D Flashcards</span>
          </h3>
          <p className="text-[11px] sm:text-xs text-apple-secondary font-mono">
            Active recall for formulas & concepts
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs text-apple-secondary">
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-apple-secondary hover:text-apple-text transition-all text-[11px] focus-visible:ring-2 focus-visible:ring-apple-blue"
            title="Generate Fresh Flashcard Deck"
            aria-label="Generate new flashcard deck"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Deck</span>
          </button>
          <span className="font-bold text-apple-blue">
            {currentIndex + 1} / {deck.length}
          </span>
        </div>
      </div>

      {/* 3D Flip Card Container */}
      <div
        className="w-full max-w-lg h-72 sm:h-80 cursor-pointer relative select-none mx-auto focus-visible:ring-2 focus-visible:ring-apple-blue rounded-2xl sm:rounded-3xl"
        style={{ perspective: '1200px' }}
        onClick={handleFlip}
        role="button"
        tabIndex={0}
        aria-label={`Flashcard: ${currentCard?.category || 'Concept'}. Click or press space to flip.`}
      >
        <motion.div
          className="w-full h-full relative mx-auto"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Card Front (Question) */}
          <div
            className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50/90 via-white to-slate-50 border border-blue-200 p-4 sm:p-6 flex flex-col justify-between shadow-apple-md"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-apple-blue bg-blue-100/80 px-2.5 py-0.5 rounded-full">
                {currentCard?.category || 'Concept'}
              </span>
              <span className="text-[11px] sm:text-xs font-mono text-apple-tertiary flex items-center gap-1">
                <RotateCw className="w-3 h-3" />
                Tap / Space to Flip
              </span>
            </div>

            <div className="my-auto text-center px-2">
              <h4 className="text-sm sm:text-base md:text-lg font-bold text-apple-text font-mono leading-relaxed break-words">
                <MarkdownRenderer content={currentCard?.front || ''} />
              </h4>
            </div>

            <div className="text-center text-[10px] font-mono text-apple-tertiary border-t border-black/5 pt-2">
              Vaswani et al. (2017)
            </div>
          </div>

          {/* Card Back (Explanation & Mathematical Formulas) */}
          <div
            className="absolute inset-0 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-50/90 via-white to-blue-50 border border-indigo-200 p-4 sm:p-6 flex flex-col justify-between shadow-apple-md text-left overflow-y-auto no-scrollbar"
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)'
            }}
          >
            <div className="flex items-center justify-between border-b border-black/5 pb-2">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-600 bg-indigo-100/80 px-2.5 py-0.5 rounded-full">
                Explanation & Formulas
              </span>
              <span className="text-[10px] font-mono text-apple-tertiary">
                Tap to Flip Back
              </span>
            </div>

            <div className="my-auto py-2 text-xs sm:text-sm font-sans text-apple-text leading-relaxed break-words">
              <MarkdownRenderer content={currentCard?.back || ''} />
            </div>

            <div className="flex items-center justify-between border-t border-black/5 pt-2 text-[10px] font-mono text-apple-tertiary">
              <span className="flex items-center gap-1">
                <BookOpen className="w-3 h-3 text-apple-blue shrink-0" />
                <span>{currentCard?.sourceContext || 'Vaswani et al. 2017'}</span>
              </span>
              <span className="text-indigo-600 font-bold shrink-0">Grounded in Paper</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Navigation Controls Bar */}
      <div className="w-full max-w-lg mx-auto flex items-center justify-between mt-4 sm:mt-5 pt-3 border-t border-black/5 font-mono text-xs flex-wrap gap-2">
        <button
          onClick={handlePrev}
          className="flex items-center gap-1 px-3.5 sm:px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-apple-secondary hover:text-apple-text transition-all shadow-apple-sm font-bold text-[11px] sm:text-xs min-h-[40px] focus-visible:ring-2 focus-visible:ring-apple-blue"
          aria-label="Previous flashcard"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous</span>
        </button>

        <button
          onClick={handleFlip}
          className="flex items-center gap-1 px-3.5 sm:px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-apple-blue border border-blue-200 transition-all font-bold shadow-apple-sm text-[11px] sm:text-xs min-h-[40px] focus-visible:ring-2 focus-visible:ring-apple-blue"
          aria-label="Flip flashcard"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Flip Card</span>
        </button>

        <button
          onClick={handleNext}
          className="flex items-center gap-1 px-3.5 sm:px-4 py-2 rounded-xl bg-apple-blue hover:bg-blue-600 text-white transition-all shadow-apple-md font-bold text-[11px] sm:text-xs min-h-[40px] focus-visible:ring-2 focus-visible:ring-blue-400"
          aria-label="Next flashcard"
        >
          <span>Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Flashcards;
