/**
 * SpatialScene.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * SpatialScene is the central responsive stage that renders each chapter of
 * "Attention Is All You Need".
 *
 * Markdown & Mathematical Typesetting:
 *   - Subtitle, Narrative Body, and Key Takeaway are all rendered through `MarkdownRenderer`
 *     so LaTeX mathematical formulas ($...$, $$...$$, \omega_i, etc.) and bold formatting
 *     are rendered cleanly as beautiful KaTeX math rather than raw unparsed strings.
 */

import React, { useState, useEffect, useRef } from 'react';
import { StoryChapter, EducationalMode } from '../../data/paperData';
import { OverlayTab } from '../onee/FullOneeOverlay';
import { AvatarController } from '../assistant/AvatarController';
import { SequentialVsParallel } from '../visualizations/SequentialVsParallel';
import { AttentionVisualizer } from '../visualizations/AttentionVisualizer';
import { MultiHeadVisualizer } from '../visualizations/MultiHeadVisualizer';
import { TransformerArchitecture } from '../visualizations/TransformerArchitecture';
import { PositionalEncoding } from '../visualizations/PositionalEncoding';
import { ComplexityComparison } from '../visualizations/ComplexityComparison';
import { BenchmarkChart } from '../visualizations/BenchmarkChart';
import { ModelVariationLab } from '../visualizations/ModelVariationLab';
import { Sketchbook } from '../effects/Sketchbook';
import { ParticleText } from '../effects/ParticleText';
import { DeveloperCard } from '../common/DeveloperCard';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { oneeBridge, OneeReaction } from '../../lib/oneeEvents';
import { AnimationKey, AvatarRefHandle } from '../../types/avatar';
import { motion } from 'framer-motion';
import { BookOpen, Tag, Sparkles, MessageSquare, Layers, HelpCircle, Book } from 'lucide-react';

interface SpatialSceneProps {
  chapter: StoryChapter;
  isActive: boolean;
  mode: EducationalMode;
  onOpenCompanion: (tab?: OverlayTab) => void;
}

export const SpatialScene: React.FC<SpatialSceneProps> = ({
  chapter,
  isActive,
  mode,
  onOpenCompanion
}) => {
  const avatarRef = useRef<AvatarRefHandle>(null);
  const [currentAnim, setCurrentAnim] = useState<AnimationKey>('idle');
  const [activeSpeechCaption, setActiveSpeechCaption] = useState<string | null>(null);
  const captionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Extract difficulty-adapted narrative content
  const difficultyDetail = chapter.difficultyDetails?.[mode];
  const activeSubtitle = difficultyDetail?.subtitle || chapter.subtitle;
  const rawBody = difficultyDetail?.body || chapter.body;
  const activeBody = Array.isArray(rawBody) ? rawBody.join('\n\n') : String(rawBody || '');
  const activeTakeaway = difficultyDetail?.takeaway || chapter.keyTakeaway;

  // Chapter-specific narrative reactions
  const chapterAnimMap: Record<string, { anim: AnimationKey; caption: string }> = {
    'story-hook': { anim: 'excited', caption: '“Notice how sequence reading used to pause word-by-word?”' },
    'story-bottleneck': { anim: 'confused', caption: '“RNNs force sequential steps: O(n) delay prevents GPU parallelization!”' },
    'story-attention': { anim: 'curious', caption: '“Select token "it" to inspect its softmax attention connections.”' },
    'story-multihead': { anim: 'searching', caption: '“Click any of the 8 heads to isolate its 64-dimensional subspace!”' },
    'story-architecture': { anim: 'working', caption: '“Tap a layer block to inspect its Add & Norm residual sublayer.”' },
    'story-position': { anim: 'working', caption: '“Scrub the position slider to see sinusoidal wave frequency shift.”' },
    'story-comparison': { anim: 'curious', caption: '“Table 1 shows Self-Attention achieves constant O(1) step operations.”' },
    'story-results': { anim: 'celebrate', caption: '“WMT 2014 translation: 28.4 EN-DE BLEU in just 3.5 GPU days!”' },
    'story-variations': { anim: 'searching', caption: '“Explore Table 3: single-head dropped BLEU by 0.9 points.”' },
    'story-notebook': { anim: 'playful', caption: '“Drag and tilt the 3D research paper spreads!”' },
    'story-conclusion': { anim: 'proud', caption: '“Replacing recurrence with attention created modern LLMs.”' }
  };

  const defaultCaption = chapterAnimMap[chapter.id]?.caption || '“Ask me anything about Attention Is All You Need!”';

  // Trigger contextual Onee reaction on active chapter mount/transition
  useEffect(() => {
    if (isActive) {
      const reaction = chapterAnimMap[chapter.id] || { anim: 'idle', caption: defaultCaption };
      setCurrentAnim(reaction.anim);
      if (avatarRef.current) {
        avatarRef.current.play(reaction.anim, 4000);
      }
      setActiveSpeechCaption(reaction.caption);

      if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
      captionTimerRef.current = setTimeout(() => {
        setActiveSpeechCaption(null);
      }, 5000);
    }
    return () => {
      if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
    };
  }, [chapter.id, isActive]);

  // Subscribe to Application-Wide Event Bridge
  useEffect(() => {
    const unsubscribe = oneeBridge.subscribe((reaction: OneeReaction) => {
      setCurrentAnim(reaction.animation);
      if (avatarRef.current) {
        avatarRef.current.play(reaction.animation, reaction.autoIdleDelayMs || 3500);
      }
      if (reaction.caption) {
        setActiveSpeechCaption(reaction.caption);
        if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
        captionTimerRef.current = setTimeout(() => {
          setActiveSpeechCaption(null);
        }, 4500);
      }
    });

    return () => {
      unsubscribe();
      if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
    };
  }, []);

  const handleAvatarTap = () => {
    oneeBridge.emit('avatar_tap');
    onOpenCompanion('chat');
  };

  // Mount corresponding interactive visualizer engine
  const renderVisualizer = () => {
    switch (chapter.id) {
      case 'story-hook':
        return (
          <div className="w-full h-full min-h-[180px] sm:min-h-[220px] rounded-3xl bg-white border border-black/5 shadow-apple-md flex flex-col items-center justify-center p-5 text-center">
            <ParticleText
              text="ATTENTION IS ALL YOU NEED"
              color="#1d1d1f"
              highlightColor="#0071e3"
            />
            <p className="text-xs font-mono text-apple-secondary mt-2 max-w-md leading-relaxed">
              The landmark 2017 paper by Vaswani et al. that eliminated recurrence and established the Transformer architecture.
            </p>
          </div>
        );
      case 'story-bottleneck':
        return <SequentialVsParallel isActive={isActive} />;
      case 'story-attention':
        return <AttentionVisualizer />;
      case 'story-multihead':
        return <MultiHeadVisualizer />;
      case 'story-architecture':
        return <TransformerArchitecture />;
      case 'story-position':
        return <PositionalEncoding />;
      case 'story-comparison':
        return <ComplexityComparison />;
      case 'story-results':
        return <BenchmarkChart />;
      case 'story-variations':
        return <ModelVariationLab />;
      case 'story-notebook':
        return <Sketchbook />;
      case 'story-conclusion':
        return (
          <div className="w-full h-full min-h-[200px] rounded-3xl bg-white border border-black/5 shadow-apple-md flex flex-col items-center justify-center p-5 text-center">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-apple-blue flex items-center justify-center font-bold text-base mb-2">
              ✨
            </div>
            <h4 className="text-sm font-extrabold text-apple-text font-mono mb-1">
              From NIPS 2017 to the Frontier of AI
            </h4>
            <p className="text-xs font-sans text-apple-secondary max-w-lg leading-relaxed mb-4">
              By replacing recurrence with multi-head self-attention and positional encoding, Vaswani et al. paved the way for GPT, Claude, Gemini, and all modern foundation models.
            </p>
            {/* Developer Acknowledgement Card */}
            <div className="w-full max-w-md pt-2 border-t border-black/5">
              <DeveloperCard isCompact={true} />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const displayCaption = activeSpeechCaption || defaultCaption;

  return (
    <div className="w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-center overflow-hidden">
      <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch overflow-hidden">
        {/* Left Column: Narrative, Metadata & Interactive Visualization (8 Cols on LG) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="col-span-1 lg:col-span-8 min-w-0 flex flex-col justify-between h-full bg-white/75 rounded-3xl border border-white/60 p-5 sm:p-6 shadow-apple-md backdrop-blur-2xl overflow-y-auto no-scrollbar"
        >
          {/* Top Eyebrow & Chapter Header */}
          <div className="space-y-1.5 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-apple-blue tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-100 flex items-center gap-1.5">
                <Tag className="w-3 h-3" />
                Chapter {chapter.chapterNumber} • {chapter.eyebrow}
              </span>
              <span className="text-[10px] font-mono text-apple-tertiary hidden sm:inline-block">
                Vaswani et al. (2017)
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-apple-text tracking-tight font-mono">
              {chapter.title}
            </h2>

            {/* Subtitle rendered with MarkdownRenderer for clean KaTeX equations */}
            <div className="text-xs sm:text-sm text-apple-secondary font-medium leading-relaxed font-sans">
              <MarkdownRenderer content={activeSubtitle} />
            </div>
          </div>

          {/* Center Interactive Visualization Canvas */}
          <div className="my-3 flex-1 min-h-0 flex items-center justify-center overflow-hidden">
            <div className="w-full h-full flex items-center justify-center min-h-0">
              {renderVisualizer()}
            </div>
          </div>

          {/* Narrative Body & Key Takeaway */}
          <div className="space-y-2 shrink-0 pt-2 border-t border-black/5">
            {/* Narrative body rendered with MarkdownRenderer */}
            <div className="text-xs text-apple-secondary leading-relaxed font-sans">
              <MarkdownRenderer content={activeBody} />
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 border border-black/5 text-xs text-apple-text font-sans flex items-start gap-2.5 shadow-apple-xs">
              <div className="w-5 h-5 rounded-lg bg-blue-100 text-apple-blue flex items-center justify-center shrink-0 mt-0.5 font-bold">
                💡
              </div>
              <div className="min-w-0 flex-1">
                <span className="font-bold text-apple-text block mb-0.5 font-mono text-[11px]">
                  Key Takeaway:
                </span>
                <div className="text-apple-secondary text-[11px] leading-relaxed">
                  <MarkdownRenderer content={activeTakeaway} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer Paper Citation Reference */}
          <div className="mt-2 pt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-mono text-apple-tertiary shrink-0">
            <span className="flex items-center gap-1.5 truncate">
              <BookOpen className="w-3.5 h-3.5 text-apple-blue shrink-0" />
              <span className="truncate">Source: Vaswani et al. (2017) ➔ {chapter.sourceReference.section} (Page {chapter.sourceReference.page})</span>
            </span>
            <span className="text-apple-blue font-bold hidden sm:inline-block shrink-0">
              Swipe / Wheel ↓ Next Chapter
            </span>
          </div>
        </motion.div>

        {/* Right Column: Dedicated Living Onee Avatar Companion Dock (4 Cols on LG) */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="hidden lg:flex lg:col-span-4 min-w-0 flex-col justify-between h-full bg-white/75 rounded-3xl border border-white/60 p-5 shadow-apple-md backdrop-blur-2xl overflow-hidden relative"
        >
          {/* Contextual Narrator Speech Bubble (Stable Non-Flickering Container) */}
          <div
            className="p-3.5 rounded-2xl bg-white/95 border border-black/10 shadow-apple-sm text-xs font-mono text-apple-secondary cursor-pointer hover:border-blue-300 transition-all select-none"
            onClick={handleAvatarTap}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-apple-blue font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Onee Narrator
              </span>
              <span className="text-[9px] text-apple-tertiary">Tap to Chat</span>
            </div>
            <p className="text-[11px] text-apple-text leading-relaxed font-sans transition-opacity duration-300">
              {displayCaption}
            </p>
          </div>

          {/* Prominently Rendered 3D Procedural Onee Avatar */}
          <div
            className="my-auto flex flex-col items-center justify-center cursor-pointer group select-none py-2"
            onClick={handleAvatarTap}
            style={{ perspective: '1200px' }}
          >
            <motion.div
              style={{ transformStyle: 'preserve-3d' }}
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              className="relative flex flex-col items-center"
            >
              {/* Seamless Radial Lighting Aura (Infinite Alpha Falloff - No Hard Edges) */}
              <div
                className="absolute -inset-12 rounded-full pointer-events-none opacity-60 group-hover:opacity-90 transition-opacity"
                style={{
                  background: 'radial-gradient(circle at 50% 50%, rgba(0, 113, 227, 0.14) 0%, rgba(99, 102, 241, 0.07) 40%, rgba(255, 255, 255, 0) 70%)'
                }}
              />

              {/* Procedural Avatar Controller */}
              <AvatarController
                ref={avatarRef}
                animation={currentAnim}
                size={270}
                className="relative z-10 filter drop-shadow-xl"
                onClick={handleAvatarTap}
              />

              <div className="mt-2 px-3.5 py-1.5 rounded-full bg-apple-blue text-white shadow-apple-md text-xs font-mono font-bold flex items-center gap-1.5 group-hover:bg-blue-600 transition-all">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Ask Onee AI</span>
              </div>
            </motion.div>
          </div>

          {/* Quick Action Navigation Launcher Pills */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-black/5 shrink-0">
            <button
              onClick={() => onOpenCompanion('chat')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-black/10 shadow-apple-xs hover:border-blue-300 hover:text-apple-blue text-apple-secondary text-xs font-mono font-bold transition-all"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Q&A Chat</span>
            </button>
            <button
              onClick={() => onOpenCompanion('quiz')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-black/10 shadow-apple-xs hover:border-blue-300 hover:text-apple-blue text-apple-secondary text-xs font-mono font-bold transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Quiz</span>
            </button>
            <button
              onClick={() => onOpenCompanion('flashcards')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-black/10 shadow-apple-xs hover:border-blue-300 hover:text-apple-blue text-apple-secondary text-xs font-mono font-bold transition-all"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Flashcards</span>
            </button>
            <button
              onClick={() => onOpenCompanion('notebook')}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl bg-white border border-black/10 shadow-apple-xs hover:border-blue-300 hover:text-apple-blue text-apple-secondary text-xs font-mono font-bold transition-all"
            >
              <Book className="w-3.5 h-3.5" />
              <span>3D Book</span>
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default SpatialScene;
