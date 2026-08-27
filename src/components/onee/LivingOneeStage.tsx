/**
 * LivingOneeStage.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * LivingOneeStage provides the persistent ambient companion layer across the application.
 *
 * Performance Optimizations:
 *   1. Stably Mounted Overlay:
 *      Maintains FullOneeOverlay permanently in the DOM to avoid teardown/re-creation overhead.
 *   2. Responsive Floating Hub:
 *      On mobile, renders a non-intrusive floating trigger that never covers chapter content.
 */

import React, { useState, useEffect, useRef } from 'react';
import { AvatarRefHandle, ExpressionKey, AnimationKey } from '../assistant/AvatarController';
import { FullOneeOverlay, OverlayTab } from './FullOneeOverlay';
import { EducationalMode } from '../../data/paperData';
import { oneeBridge, OneeReaction } from '../../lib/oneeEvents';
import { Sparkles } from 'lucide-react';

interface LivingOneeStageProps {
  expression: ExpressionKey;
  activeChapterId: string;
  mode: EducationalMode;
  onModeChange: (mode: EducationalMode) => void;
  isOpen: boolean;
  onOpen: (tab?: OverlayTab) => void;
  onClose: () => void;
  initialTab?: OverlayTab;
}

export const LivingOneeStage: React.FC<LivingOneeStageProps> = ({
  expression,
  activeChapterId,
  mode,
  onModeChange,
  isOpen,
  onOpen,
  onClose,
  initialTab = 'chat'
}) => {
  const [, setCurrentExpression] = useState<ExpressionKey>(expression);
  const [, setCurrentAnimation] = useState<AnimationKey>('idle');
  const [activeCaption, setActiveCaption] = useState<string | null>(null);

  const avatarRef = useRef<AvatarRefHandle>(null);

  // Sync expression prop
  useEffect(() => {
    setCurrentExpression(expression);
  }, [expression]);

  // Subscribe to Application-Wide Onee Event Bridge
  useEffect(() => {
    const unsubscribe = oneeBridge.subscribe((reaction: OneeReaction) => {
      setCurrentExpression(reaction.expression);
      setCurrentAnimation(reaction.animation);

      if (avatarRef.current) {
        avatarRef.current.play(reaction.animation, reaction.autoIdleDelayMs);
      }

      if (reaction.caption) {
        setActiveCaption(reaction.caption);
        const timer = setTimeout(() => setActiveCaption(null), 4000);
        return () => clearTimeout(timer);
      }
    });

    return () => unsubscribe();
  }, []);

  const chapterCaptions: Record<string, string> = {
    'story-hook': '“Notice how sequence reading used to pause word-by-word?”',
    'story-bottleneck': '“RNNs force sequential steps: O(n) delay prevents GPU parallelization!”',
    'story-attention': '“Select token "it" to inspect its softmax attention connections.”',
    'story-multihead': '“Click any of the 8 heads to isolate its 64-dimensional subspace!”',
    'story-architecture': '“Tap a layer block to inspect its Add & Norm residual sublayer.”',
    'story-position': '“Scrub the position slider to see sinusoidal wave frequency shift.”',
    'story-comparison': '“Table 1 shows Self-Attention achieves constant O(1) step operations.”',
    'story-results': '“WMT 2014 translation: 28.4 EN-DE BLEU in just 3.5 GPU days!”',
    'story-variations': '“Explore Table 3: single-head dropped BLEU by 0.9 points.”',
    'story-notebook': '“Drag and tilt the 3D research paper spreads!”',
    'story-conclusion': '“Replacing recurrence with attention created modern LLMs.”'
  };

  const currentCaptionText = activeCaption || chapterCaptions[activeChapterId] || chapterCaptions['story-hook'];

  return (
    <>
      {/* Mobile-Only Floating Onee Assistant Trigger */}
      <div className="lg:hidden fixed bottom-3 right-3 sm:bottom-4 sm:right-4 z-30 flex flex-col items-end pointer-events-none select-none max-w-[calc(100vw-1.5rem)]">
        {/* Caption Bubble */}
        {currentCaptionText && !isOpen && (
          <div
            className="mb-2 max-w-[240px] px-3 py-2 rounded-2xl bg-white/95 border border-black/10 shadow-apple-md text-xs font-mono text-apple-secondary pointer-events-auto cursor-pointer text-left break-words animate-in fade-in slide-in-from-bottom-2 duration-200"
            onClick={() => onOpen('chat')}
          >
            <span className="text-apple-blue font-bold block mb-0.5 text-[10px]">Onee Narrator:</span>
            <span className="text-[11px] text-apple-text font-sans">{currentCaptionText}</span>
          </div>
        )}

        {/* Floating Action Button */}
        {!isOpen && (
          <button
            onClick={() => onOpen('chat')}
            className="pointer-events-auto flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-apple-blue text-white shadow-apple-lg text-xs font-mono font-bold hover:bg-blue-600 active:scale-95 transition-all"
            aria-label="Open Onee Assistant"
          >
            <Sparkles className="w-4 h-4" />
            <span>Ask Onee</span>
          </button>
        )}
      </div>

      {/* Large Conversational Companion Modal (Stably Mounted) */}
      <FullOneeOverlay
        isOpen={isOpen}
        activeChapterId={activeChapterId}
        initialTab={initialTab}
        mode={mode}
        onModeChange={onModeChange}
        onClose={onClose}
      />
    </>
  );
};

export default LivingOneeStage;
