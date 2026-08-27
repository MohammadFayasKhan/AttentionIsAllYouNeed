/**
 * LivingOneeStage.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * LivingOneeStage provides the persistent ambient companion layer across the application.
 *
 * Responsibilities:
 *   1. Event Bridge Subscription:
 *      Listens to global `oneeBridge` events and updates the avatar's animation and caption.
 *   2. Unlocked Procedural Choreography:
 *      Drives `avatarRef.current.play(reaction.animation)` to execute the full multi-step
 *      expression choreography and head movement without clamping the eyes to a static expression.
 *   3. Mobile Floating Action Hub:
 *      Renders a mobile-only floating button and reactive caption bubble on screens < lg.
 *   4. Fullscreen Companion Modal Host:
 *      Mounts `FullOneeOverlay.tsx` when user triggers chat, quiz, flashcards, or developer view.
 */

import React, { useState, useEffect, useRef } from 'react';
import { AvatarRefHandle, ExpressionKey, AnimationKey } from '../assistant/AvatarController';
import { FullOneeOverlay, OverlayTab } from './FullOneeOverlay';
import { EducationalMode } from '../../data/paperData';
import { oneeBridge, OneeReaction } from '../../lib/oneeEvents';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [currentExpression, setCurrentExpression] = useState<ExpressionKey>(expression);
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
      {/* Mobile-Only Floating Onee Assistant Trigger (On LG screens, Onee is prominent in SpatialScene) */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40 flex flex-col items-end pointer-events-none select-none max-w-[calc(100vw-2rem)]">
        {/* Caption Bubble */}
        <AnimatePresence mode="wait">
          {currentCaptionText && (
            <motion.div
              key={currentCaptionText}
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              className="mb-2 max-w-[240px] px-3.5 py-2.5 rounded-2xl bg-white/95 border border-black/10 shadow-apple-md text-xs font-mono text-apple-secondary backdrop-blur-2xl pointer-events-auto cursor-pointer text-left break-words"
              onClick={() => onOpen('chat')}
            >
              <span className="text-apple-blue font-bold block mb-0.5 text-[10px]">Onee Narrator:</span>
              <span className="text-[11px] text-apple-text font-sans">{currentCaptionText}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Action Button with Avatar Badge */}
        <button
          onClick={() => onOpen('chat')}
          className="pointer-events-auto flex items-center gap-2 px-4 py-2.5 rounded-full bg-apple-blue text-white shadow-apple-lg text-xs font-mono font-bold hover:bg-blue-600 transition-all"
        >
          <Sparkles className="w-4 h-4 animate-spin-slow" />
          <span>Ask 3D Onee AI</span>
        </button>
      </div>

      {/* Large Fullscreen Conversational Companion Modal */}
      <AnimatePresence>
        {isOpen && (
          <FullOneeOverlay
            expression={currentExpression}
            activeChapterId={activeChapterId}
            initialTab={initialTab}
            mode={mode}
            onModeChange={onModeChange}
            onClose={onClose}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default LivingOneeStage;
