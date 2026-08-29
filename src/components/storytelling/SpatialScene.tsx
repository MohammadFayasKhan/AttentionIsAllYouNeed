/**
 * SpatialScene.tsx
 * ─────────────────────────────────────────────────────────────────
 * SpatialScene: Central Responsive Presentation Stage
 *
 * Project: AttentionIsAllYouNeed
 * Built by: Mohammad Fayas Khan (3rd-year B.Tech CSE AI/ML student at LPU)
 *
 * Coordinated Two-Column Stage Architecture:
 *   1. Single Source of Truth for Height (Shared Grid Row):
 *      - On desktop/tablet (lg:), Chapter panel and Onee panel are two columns inside
 *        one shared CSS Grid row (`items-stretch`).
 *      - Both panels stretch to match height smoothly.
 *   2. Content-Driven Distribution:
 *      - Chapter panel: Header → Interactive Visualizer → Narrative Body → Key Takeaway → Citation Footer.
 *      - Onee panel: Narrator Speech Bubble at top → Centered Avatar → Quick Actions at bottom.
 *   3. In-Flow End-of-Chapter Navigation Card:
 *      - Located at the natural end of the chapter content.
 *      - Provides clear visual confirmation that the chapter has been read and invites transition.
 *   4. Mobile Stacking:
 *      - Mobile (< lg:): Single-column document flow where Chapter renders first, followed by Onee dock.
 *   5. Zero Accidental Text Truncation:
 *      - All mathematical equations, source citations, and body text wrap cleanly without ellipsis.
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
import { BookOpen, Tag, Sparkles, MessageSquare, Layers, HelpCircle, Book, ArrowRight } from 'lucide-react';

interface SpatialSceneProps {
  chapter: StoryChapter;
  isActive: boolean;
  mode: EducationalMode;
  onOpenCompanion: (tab?: OverlayTab) => void;
  onNextChapter?: () => void;
  nextChapterMeta?: { chapterNumber: string; title: string } | null;
}

export const SpatialScene: React.FC<SpatialSceneProps> = ({
  chapter,
  isActive,
  mode,
  onOpenCompanion,
  onNextChapter,
  nextChapterMeta,
}) => {
  const avatarRef = useRef<AvatarRefHandle>(null);
  const [currentAnim, setCurrentAnim] = useState<AnimationKey>('idle');
  const [activeSpeechCaption, setActiveSpeechCaption] = useState<string | null>(null);
  const captionTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Extract difficulty-adapted narrative content
  const difficultyDetail = chapter.difficultyDetails?.[mode];
  const activeNarrative =
    difficultyDetail?.body.join('\n\n') ||
    chapter.body.join('\n\n') ||
    'Exploring the Transformer architecture (Vaswani et al. 2017).';

  const activeTakeaway =
    difficultyDetail?.takeaway ||
    chapter.keyTakeaway ||
    'Attention replaces recurrence with parallel self-attention mechanisms.';

  const activeSubtitle = difficultyDetail?.subtitle || chapter.subtitle;

  // Onee Ambient Voice captions per chapter
  const defaultOneeSpeech: Record<string, string> = {
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

  const displayCaption = activeSpeechCaption || defaultOneeSpeech[chapter.id] || defaultOneeSpeech['story-hook'];

  // Subscribe to Onee Bridge reactions
  useEffect(() => {
    const unsubscribe = oneeBridge.subscribe((reaction: OneeReaction) => {
      setCurrentAnim(reaction.animation);

      if (avatarRef.current) {
        avatarRef.current.play(reaction.animation, reaction.autoIdleDelayMs);
      }

      if (reaction.caption) {
        setActiveSpeechCaption(reaction.caption);
        if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
        captionTimerRef.current = setTimeout(() => {
          setActiveSpeechCaption(null);
        }, 4000);
      }
    });

    return () => {
      unsubscribe();
      if (captionTimerRef.current) clearTimeout(captionTimerRef.current);
    };
  }, []);

  const handleAvatarTap = () => {
    if (avatarRef.current) {
      avatarRef.current.play('excited', 2500);
    }
    oneeBridge.emit('avatar_tap');
    onOpenCompanion('chat');
  };

  // Render the specific visualizer mapped to this paper chapter
  const renderVisualizer = () => {
    switch (chapter.id) {
      case 'story-hook':
        return <ParticleText text="ATTENTION IS ALL YOU NEED" />;
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
        return <DeveloperCard />;
      default:
        return <ParticleText text="TRANSFORMER" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-3 sm:py-5 lg:py-6 box-border">
      {/* ── Coordinated Two-Column Stage Layout ── */}
      <div className="chapter-layout">
        {/* Main Chapter Presentation Column */}
        <section
          aria-label={`Chapter ${chapter.chapterNumber}: ${chapter.title}`}
          className="chapter-panel flex flex-col justify-between gap-3 sm:gap-4 bg-white/95 rounded-2xl sm:rounded-3xl border border-black/5 shadow-apple-md p-3.5 sm:p-5 lg:p-7 w-full"
        >
          {/* 1. Header Metadata Section */}
          <div className="space-y-1 sm:space-y-1.5 border-b border-black/5 pb-2.5 sm:pb-3 shrink-0">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 font-mono text-[10px] sm:text-xs">
                <span className="bg-blue-100 text-apple-blue font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Ch {chapter.chapterNumber}
                </span>
                <span className="text-apple-tertiary">/</span>
                <span className="text-apple-secondary font-medium">
                  {chapter.sourceReference.section}
                </span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-apple-tertiary font-mono">
                <Tag className="w-3 h-3 text-apple-blue" />
                <span>{chapter.eyebrow}</span>
              </div>
            </div>

            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-apple-text tracking-tight font-sans leading-tight">
              {chapter.title}
            </h2>
            <p className="text-xs sm:text-sm text-apple-secondary font-sans leading-snug">
              {activeSubtitle}
            </p>
          </div>

          {/* 2. Interactive Visualizer Sandbox */}
          <div className="w-full flex-1 flex flex-col items-center justify-center my-0.5">
            <div className="w-full h-auto min-h-[140px] sm:min-h-[180px] lg:min-h-[220px] rounded-2xl bg-slate-50/70 border border-black/5 p-2 sm:p-3 flex items-center justify-center relative overflow-hidden">
              {renderVisualizer()}
            </div>
          </div>

          {/* 3. Narrative Body Text */}
          <div className="space-y-2 shrink-0">
            <div className="p-3 sm:p-3.5 rounded-xl sm:rounded-2xl bg-slate-50/80 border border-black/5 text-xs sm:text-sm leading-relaxed text-apple-text font-sans break-words">
              <MarkdownRenderer content={activeNarrative} />
            </div>

            {/* 4. Key Takeaway Highlight Banner */}
            <div className="p-2.5 sm:p-3 rounded-xl bg-blue-50/70 border border-blue-100/80 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-apple-blue shrink-0 mt-0.5" />
              <div className="space-y-0.5 min-w-0">
                <span className="text-[10px] sm:text-xs font-mono font-bold text-apple-blue block uppercase tracking-wider">
                  Key Takeaway:
                </span>
                <div className="text-apple-secondary text-[11px] leading-relaxed break-words">
                  <MarkdownRenderer content={activeTakeaway} />
                </div>
              </div>
            </div>
          </div>

          {/* 5. Footer Paper Citation */}
          <div className="pt-2.5 border-t border-black/5 flex items-center justify-between text-[10px] font-mono text-apple-tertiary flex-wrap gap-1.5 shrink-0">
            <span className="flex items-center gap-1.5 flex-wrap">
              <BookOpen className="w-3.5 h-3.5 text-apple-blue shrink-0" />
              <span>Source: Vaswani et al. (2017) ➔ {chapter.sourceReference.section} (Page {chapter.sourceReference.page})</span>
            </span>
            <span className="text-apple-blue font-bold hidden sm:inline-block shrink-0">
              Vaswani et al. (2017)
            </span>
          </div>
        </section>

        {/* Living Onee Avatar Companion Dock */}
        <aside
          className="onee-panel flex flex-col justify-between gap-2.5 sm:gap-3.5 bg-gradient-to-b from-blue-50/90 via-indigo-50/60 to-purple-50/70 rounded-2xl sm:rounded-3xl border border-black/5 shadow-apple-md p-3.5 sm:p-5 lg:p-7 w-full"
        >
          {/* Top: Contextual Narrator Speech Bubble */}
          <div
            className="p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/95 border border-black/10 shadow-apple-sm text-xs font-mono text-apple-secondary cursor-pointer hover:border-blue-300 transition-all select-none relative z-20 shrink-0"
            onClick={handleAvatarTap}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAvatarTap(); }}
            aria-label="Tap to open Onee conversation"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-apple-blue font-bold flex items-center gap-1.5 text-[11px] sm:text-xs">
                <Sparkles className="w-3.5 h-3.5" />
                Onee Narrator
              </span>
              <span className="text-[9px] text-apple-tertiary">Tap to Chat</span>
            </div>
            <p className="text-[11px] text-apple-text leading-relaxed font-sans">
              {displayCaption}
            </p>
          </div>

          {/* Center: Centered 3D Onee Avatar */}
          <div
            className="flex-1 flex flex-col items-center justify-center cursor-pointer group select-none py-2 relative z-10 min-h-[130px] sm:min-h-[150px]"
            onClick={handleAvatarTap}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAvatarTap(); }}
            aria-label="Onee 3D Avatar - Click to chat"
          >
            <div className="relative flex flex-col items-center">
              {/* Luminous Glow Aura */}
              <div
                className="absolute -inset-6 sm:-inset-8 rounded-full pointer-events-none filter blur-xl opacity-70"
                style={{
                  background: 'radial-gradient(circle, rgba(0, 113, 227, 0.3) 0%, rgba(99, 102, 241, 0.18) 45%, transparent 75%)'
                }}
              />

              <div className="w-[130px] h-[130px] sm:w-[160px] sm:h-[160px] lg:w-[175px] lg:h-[175px] flex items-center justify-center relative z-10">
                <AvatarController
                  ref={avatarRef}
                  animation={currentAnim}
                  size="100%"
                  className="filter drop-shadow-xl w-full h-full"
                  onClick={handleAvatarTap}
                />
              </div>

              <div className="mt-1.5 px-3 py-1 rounded-full bg-apple-blue text-white shadow-apple-md text-[10px] sm:text-[11px] font-mono font-bold flex items-center gap-1.5 group-hover:bg-blue-600 transition-all relative z-20">
                <Sparkles className="w-3 h-3" />
                <span>Ask Onee AI</span>
              </div>
            </div>
          </div>

          {/* Bottom: Quick Action Navigation Launcher Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-1.5 sm:gap-2 pt-2 border-t border-black/5 shrink-0">
            <button
              onClick={() => onOpenCompanion('chat')}
              className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl sm:rounded-2xl bg-white border border-black/10 shadow-apple-xs hover:border-blue-300 hover:text-apple-blue text-apple-secondary text-[11px] sm:text-xs font-mono font-bold transition-all min-h-[40px] focus-visible:ring-2 focus-visible:ring-apple-blue"
            >
              <MessageSquare className="w-3.5 h-3.5 text-apple-blue" />
              <span>Q&A Chat</span>
            </button>
            <button
              onClick={() => onOpenCompanion('quiz')}
              className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl sm:rounded-2xl bg-white border border-black/10 shadow-apple-xs hover:border-blue-300 hover:text-apple-blue text-apple-secondary text-[11px] sm:text-xs font-mono font-bold transition-all min-h-[40px] focus-visible:ring-2 focus-visible:ring-apple-blue"
            >
              <HelpCircle className="w-3.5 h-3.5 text-apple-purple" />
              <span>Quiz</span>
            </button>
            <button
              onClick={() => onOpenCompanion('flashcards')}
              className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl sm:rounded-2xl bg-white border border-black/10 shadow-apple-xs hover:border-blue-300 hover:text-apple-blue text-apple-secondary text-[11px] sm:text-xs font-mono font-bold transition-all min-h-[40px] focus-visible:ring-2 focus-visible:ring-apple-blue"
            >
              <Layers className="w-3.5 h-3.5 text-apple-emerald" />
              <span>Flashcards</span>
            </button>
            <button
              onClick={() => onOpenCompanion('notebook')}
              className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl sm:rounded-2xl bg-white border border-black/10 shadow-apple-xs hover:border-blue-300 hover:text-apple-blue text-apple-secondary text-[11px] sm:text-xs font-mono font-bold transition-all min-h-[40px] focus-visible:ring-2 focus-visible:ring-apple-blue"
            >
              <Book className="w-3.5 h-3.5 text-apple-amber" />
              <span>3D Book</span>
            </button>
          </div>
        </aside>
      </div>

      {/* ── End-of-Chapter Navigation Transition Banner (In-Flow) ── */}
      <div className="w-full mt-4 sm:mt-6 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-blue-50/90 via-white to-indigo-50/90 border border-blue-200/70 shadow-apple-sm flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
        {nextChapterMeta && onNextChapter ? (
          <>
            <div className="space-y-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-apple-blue flex items-center justify-center sm:justify-start gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Chapter Completed</span>
              </span>
              <h4 className="text-xs sm:text-sm font-bold text-apple-text font-mono">
                Next: Chapter {nextChapterMeta.chapterNumber} — {nextChapterMeta.title}
              </h4>
              <p className="text-[10px] text-apple-secondary font-mono">
                Swipe up, press Arrow Down, or tap Continue
              </p>
            </div>

            <button
              onClick={onNextChapter}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-apple-blue hover:bg-blue-600 text-white text-xs font-mono font-bold shadow-apple-md active:scale-95 transition-all shrink-0 focus-visible:ring-2 focus-visible:ring-blue-400"
            >
              <span>Continue to Ch {nextChapterMeta.chapterNumber}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </>
        ) : (
          <div className="w-full text-center py-2 space-y-1">
            <span className="text-xs font-bold text-apple-text font-mono block">
              🎉 Congratulations! You have explored the complete Transformer paper.
            </span>
            <p className="text-[10px] text-apple-secondary font-mono">
              Attention Is All You Need — Vaswani et al. (2017)
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SpatialScene;
