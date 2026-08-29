/**
 * useChapterSnap.ts
 * ─────────────────────────────────────────────────────────────────
 * Section-by-Section Snap Navigation Hook.
 *
 * ARCHITECTURE:
 *   - ONE chapter visible at a time (fullscreen stage).
 *   - Explicit chapter state machine: activeIndex drives which chapter renders.
 *   - Arrow Down / Page Down / Space → next chapter.
 *   - Arrow Up / Page Up / Shift+Space → previous chapter.
 *   - Home → first chapter, End → last chapter.
 *   - Mouse wheel / trackpad: debounced direction detection → advance/retreat.
 *   - Touch swipe: vertical swipe detection → advance/retreat.
 *   - Short cooldown (400ms) prevents rapid over-scrolling while feeling responsive.
 *   - No scroll position dependency — the page never scrolls.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { oneeBridge } from '../lib/oneeEvents';

export interface TransitionTargetInfo {
  type: 'next' | 'prev';
  targetIndex: number;
  chapterNumber: string;
  title: string;
}

const COOLDOWN_MS = 400;
const WHEEL_THRESHOLD = 30;       // px of accumulated delta before triggering
const TOUCH_SWIPE_THRESHOLD = 50; // px minimum vertical swipe distance

export function useChapterSnap(sectionIds: string[], initialIndex = 0) {
  const total = sectionIds.length;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev' | 'none'>('none');

  const activeIdxRef = useRef(initialIndex);
  const cooldownRef = useRef(false);
  const wheelAccumRef = useRef(0);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ y: number; time: number } | null>(null);

  // Keep ref in sync
  activeIdxRef.current = activeIndex;

  // ── Core navigation ───────────────────────────────────────────
  const goToChapter = useCallback((target: number | string) => {
    let targetIndex: number;

    if (typeof target === 'number') {
      targetIndex = Math.max(0, Math.min(total - 1, target));
    } else {
      targetIndex = sectionIds.indexOf(target);
      if (targetIndex === -1) targetIndex = 0;
    }

    if (targetIndex === activeIdxRef.current) return;

    setDirection(targetIndex > activeIdxRef.current ? 'next' : 'prev');
    setActiveIndex(targetIndex);
    activeIdxRef.current = targetIndex;
    oneeBridge.emit('chapter_change');

    // Cooldown to prevent rapid multi-fire
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, COOLDOWN_MS);
  }, [sectionIds, total]);

  const nextChapter = useCallback(() => {
    if (cooldownRef.current) return;
    if (activeIdxRef.current < total - 1) {
      goToChapter(activeIdxRef.current + 1);
    }
  }, [goToChapter, total]);

  const prevChapter = useCallback(() => {
    if (cooldownRef.current) return;
    if (activeIdxRef.current > 0) {
      goToChapter(activeIdxRef.current - 1);
    }
  }, [goToChapter]);

  // ── Keyboard navigation ───────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when focus is in an input, textarea, or contenteditable
      const tag = (e.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if ((e.target as HTMLElement).isContentEditable) return;

      switch (e.key) {
        case 'ArrowDown':
        case 'PageDown':
          e.preventDefault();
          nextChapter();
          break;
        case 'ArrowUp':
        case 'PageUp':
          e.preventDefault();
          prevChapter();
          break;
        case ' ':
          e.preventDefault();
          if (e.shiftKey) {
            prevChapter();
          } else {
            nextChapter();
          }
          break;
        case 'Home':
          e.preventDefault();
          goToChapter(0);
          break;
        case 'End':
          e.preventDefault();
          goToChapter(total - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextChapter, prevChapter, goToChapter, total]);

  // ── Wheel / trackpad navigation ───────────────────────────────
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Don't intercept if inside a scrollable child (e.g. dropdown, overlay)
      const target = e.target as HTMLElement;
      const scrollableParent = target.closest('[data-scrollable]');
      if (scrollableParent) return;

      // Check if the chapter content is scrollable and not at boundary
      const stageContent = document.querySelector('.chapter-stage-content') as HTMLElement | null;
      if (stageContent) {
        const { scrollTop, scrollHeight, clientHeight } = stageContent;
        const isAtTop = scrollTop <= 1;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1;
        const isScrollable = scrollHeight > clientHeight + 2;

        // If content is scrollable and NOT at boundary, let native scroll happen
        if (isScrollable) {
          if (e.deltaY > 0 && !isAtBottom) return;  // scrolling down, not at bottom
          if (e.deltaY < 0 && !isAtTop) return;     // scrolling up, not at top
        }
      }

      e.preventDefault();

      // Accumulate delta
      wheelAccumRef.current += e.deltaY;

      // Clear reset timer
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);

      // Reset accumulator after inactivity
      wheelTimerRef.current = setTimeout(() => {
        wheelAccumRef.current = 0;
      }, 150);

      // Check threshold
      if (Math.abs(wheelAccumRef.current) >= WHEEL_THRESHOLD) {
        if (wheelAccumRef.current > 0) {
          nextChapter();
        } else {
          prevChapter();
        }
        wheelAccumRef.current = 0;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [nextChapter, prevChapter]);

  // ── Touch swipe navigation ────────────────────────────────────
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      if (touch) {
        touchStartRef.current = { y: touch.clientY, time: Date.now() };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaY = touchStartRef.current.y - touch.clientY;
      const elapsed = Date.now() - touchStartRef.current.time;

      // Only respond to intentional swipes (not taps or slow drags)
      if (Math.abs(deltaY) >= TOUCH_SWIPE_THRESHOLD && elapsed < 500) {
        if (deltaY > 0) {
          nextChapter(); // swipe up → next
        } else {
          prevChapter(); // swipe down → prev
        }
      }

      touchStartRef.current = null;
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [nextChapter, prevChapter]);

  return {
    activeIndex,
    activeChapterId: sectionIds[activeIndex] ?? sectionIds[0],
    goToChapter,
    nextChapter,
    prevChapter,
    totalChapters: total,
    isModalOpen,
    setIsModalOpen,
    direction,
    transitionProgress: 0,
    setTransitionProgress: () => {},
    transitionTarget: null,
    setTransitionTarget: () => {},
    isTransitioning: false,
    transitionDirection: direction,
  };
}

export default useChapterSnap;
