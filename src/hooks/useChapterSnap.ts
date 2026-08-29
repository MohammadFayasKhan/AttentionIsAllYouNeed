/**
 * useChapterSnap.ts
 * ─────────────────────────────────────────────────────────────────
 * Intentional Section-by-Section Chapter Navigation Hook.
 *
 * Written by Mohammad Fayas Khan (3rd-year B.Tech CSE AI/ML student)
 *
 * ARCHITECTURE & SCROLL SAFETY:
 *   1. Content-First Reading:
 *      - When a chapter has vertically scrollable content (scrollHeight > clientHeight + 10),
 *        scrolling DOWN or pressing ArrowDown / PageDown / Space scrolls THROUGH the chapter
 *        content first until the user reaches the very bottom.
 *      - It NEVER prematurely skips to the next chapter while the user is still reading.
 *      - Only when the user is at the bottom (scrollTop + clientHeight >= scrollHeight - 8)
 *        AND intentionally continues scrolling down / pressing ArrowDown does it transition.
 *   2. Reversible Two-Way Movement:
 *      - Scrolling UP or pressing ArrowUp / PageUp scrolls UP through the chapter content.
 *      - Only when the user is at the top (scrollTop <= 5) AND continues scrolling up / pressing ArrowUp
 *        does it transition back to the previous chapter.
 *      - Home / End / Dot Rail / Navigation dropdown jump directly to target chapters.
 *   3. Modal & Overlay Isolation:
 *      - When isModalOpen is true, or when hovering over [data-scrollable], .allow-inner-scroll,
 *        dropdowns, popovers, or modals, all snap triggers are bypassed so internal components
 *        (chat, quiz, flashcards, chapters list) scroll independently in both directions.
 *   4. Cooldown & Debounce:
 *      - A calibrated cooldown prevents trackpad momentum from skipping multiple chapters.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { oneeBridge } from '../lib/oneeEvents';

export interface TransitionTargetInfo {
  type: 'next' | 'prev';
  targetIndex: number;
  chapterNumber: string;
  title: string;
}

const COOLDOWN_MS = 600;          // Cooldown between chapter transitions
const WHEEL_THRESHOLD = 70;       // Accumulated px threshold at chapter boundaries
const TOUCH_SWIPE_THRESHOLD = 60; // Minimum touch swipe distance at boundary

export function useChapterSnap(sectionIds: string[], initialIndex = 0) {
  const total = sectionIds.length;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev' | 'none'>('none');

  const activeIdxRef = useRef(initialIndex);
  const isModalOpenRef = useRef(isModalOpen);
  const cooldownRef = useRef(false);
  const wheelAccumRef = useRef(0);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ y: number; atTop: boolean; atBottom: boolean; time: number } | null>(null);

  // Keep refs in sync
  activeIdxRef.current = activeIndex;
  isModalOpenRef.current = isModalOpen;

  // ── Core Chapter Navigation ────────────────────────────────────
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
    wheelAccumRef.current = 0;
    oneeBridge.emit('chapter_change');

    // Reset scroll position of stage content for the new chapter
    requestAnimationFrame(() => {
      const stageContent = document.querySelector('.chapter-stage-content') as HTMLElement | null;
      if (stageContent) {
        stageContent.scrollTop = 0;
      }
    });

    // Cooldown to prevent rapid multi-chapter skipping
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

  // ── Keyboard Navigation (Content-First Scrolling) ──────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do nothing if assistant modal is open
      if (isModalOpenRef.current) return;

      // Don't intercept when focus is in an input, textarea, select, or editable element
      const target = e.target as HTMLElement;
      const tag = target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      if (target.isContentEditable) return;
      if (target.closest('[data-scrollable]') && !target.classList.contains('chapter-stage-content')) return;

      const stageContent = document.querySelector('.chapter-stage-content') as HTMLElement | null;

      switch (e.key) {
        case 'ArrowDown': {
          if (stageContent) {
            const { scrollTop, scrollHeight, clientHeight } = stageContent;
            const isScrollable = scrollHeight > clientHeight + 10;
            const isAtBottom = scrollTop + clientHeight >= scrollHeight - 12;

            // If there's more content to read in this chapter, scroll down through it!
            if (isScrollable && !isAtBottom) {
              e.preventDefault();
              stageContent.scrollBy({ top: 140, behavior: 'smooth' });
              return;
            }
          }
          // At bottom or not scrollable: advance to next chapter
          e.preventDefault();
          nextChapter();
          break;
        }

        case 'ArrowUp': {
          if (stageContent) {
            const { scrollTop, scrollHeight, clientHeight } = stageContent;
            const isScrollable = scrollHeight > clientHeight + 10;
            const isAtTop = scrollTop <= 6;

            // If user is further down in this chapter, scroll up through it!
            if (isScrollable && !isAtTop) {
              e.preventDefault();
              stageContent.scrollBy({ top: -140, behavior: 'smooth' });
              return;
            }
          }
          // At top or not scrollable: retreat to previous chapter
          e.preventDefault();
          prevChapter();
          break;
        }

        case 'PageDown':
        case ' ': {
          if (e.key === ' ' && e.shiftKey) {
            // Shift + Space -> scroll up / prev chapter
            if (stageContent) {
              const { scrollTop, scrollHeight, clientHeight } = stageContent;
              const isScrollable = scrollHeight > clientHeight + 10;
              const isAtTop = scrollTop <= 6;
              if (isScrollable && !isAtTop) {
                e.preventDefault();
                stageContent.scrollBy({ top: -clientHeight * 0.75, behavior: 'smooth' });
                return;
              }
            }
            e.preventDefault();
            prevChapter();
          } else {
            // Space / PageDown -> scroll down / next chapter
            if (stageContent) {
              const { scrollTop, scrollHeight, clientHeight } = stageContent;
              const isScrollable = scrollHeight > clientHeight + 10;
              const isAtBottom = scrollTop + clientHeight >= scrollHeight - 12;
              if (isScrollable && !isAtBottom) {
                e.preventDefault();
                stageContent.scrollBy({ top: clientHeight * 0.75, behavior: 'smooth' });
                return;
              }
            }
            e.preventDefault();
            nextChapter();
          }
          break;
        }

        case 'PageUp': {
          if (stageContent) {
            const { scrollTop, scrollHeight, clientHeight } = stageContent;
            const isScrollable = scrollHeight > clientHeight + 10;
            const isAtTop = scrollTop <= 6;
            if (isScrollable && !isAtTop) {
              e.preventDefault();
              stageContent.scrollBy({ top: -clientHeight * 0.75, behavior: 'smooth' });
              return;
            }
          }
          e.preventDefault();
          prevChapter();
          break;
        }

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

  // ── Wheel / Trackpad Navigation (Scroll-First with Boundary Snap) ───
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Do nothing if assistant modal is open
      if (isModalOpenRef.current) return;

      const target = e.target as HTMLElement;

      // If user is scrolling inside a modal, dropdown, code editor, or other scrollable widget, let it scroll naturally!
      const scrollableChild = target.closest('[data-scrollable], .allow-inner-scroll, header, nav, .bs-avatar');
      if (scrollableChild && !scrollableChild.classList.contains('chapter-stage-content')) {
        return;
      }

      const stageContent = document.querySelector('.chapter-stage-content') as HTMLElement | null;
      if (!stageContent) return;

      const { scrollTop, scrollHeight, clientHeight } = stageContent;
      const isScrollable = scrollHeight > clientHeight + 10;
      const isAtTop = scrollTop <= 4;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 6;

      // If chapter content is scrollable and user has NOT reached boundary:
      // ALLOW natural vertical scrolling without intercepting!
      if (isScrollable) {
        if (e.deltaY > 0 && !isAtBottom) {
          wheelAccumRef.current = 0;
          return;
        }
        if (e.deltaY < 0 && !isAtTop) {
          wheelAccumRef.current = 0;
          return;
        }
      }

      // If at boundary (or not scrollable), user is pushing past the end of the chapter.
      // Prevent default page bounce and accumulate intentional delta:
      e.preventDefault();

      if (cooldownRef.current) return;

      // Accumulate delta in direction of scroll
      if (e.deltaY > 0) {
        wheelAccumRef.current = Math.max(0, wheelAccumRef.current) + e.deltaY;
      } else if (e.deltaY < 0) {
        wheelAccumRef.current = Math.min(0, wheelAccumRef.current) + e.deltaY;
      }

      // Clear accumulator timer
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => {
        wheelAccumRef.current = 0;
      }, 200);

      // Check if threshold reached for intentional chapter transition
      if (wheelAccumRef.current >= WHEEL_THRESHOLD) {
        wheelAccumRef.current = 0;
        nextChapter();
      } else if (wheelAccumRef.current <= -WHEEL_THRESHOLD) {
        wheelAccumRef.current = 0;
        prevChapter();
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [nextChapter, prevChapter]);

  // ── Touch Swipe Navigation (Boundary-Aware on Mobile) ──────────
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (isModalOpenRef.current) return;

      const touch = e.touches[0];
      if (!touch) return;

      const stageContent = document.querySelector('.chapter-stage-content') as HTMLElement | null;
      let atTop = true;
      let atBottom = true;

      if (stageContent) {
        const { scrollTop, scrollHeight, clientHeight } = stageContent;
        atTop = scrollTop <= 6;
        atBottom = scrollTop + clientHeight >= scrollHeight - 8;
      }

      touchStartRef.current = {
        y: touch.clientY,
        atTop,
        atBottom,
        time: Date.now()
      };
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isModalOpenRef.current || !touchStartRef.current) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaY = touchStartRef.current.y - touch.clientY;
      const elapsed = Date.now() - touchStartRef.current.time;
      const { atTop, atBottom } = touchStartRef.current;

      // Only transition if swipe started at the boundary and user swiped intentionally
      if (Math.abs(deltaY) >= TOUCH_SWIPE_THRESHOLD && elapsed < 600) {
        if (deltaY > 0 && atBottom) {
          // Swiped up while at bottom of chapter -> next chapter
          nextChapter();
        } else if (deltaY < 0 && atTop) {
          // Swiped down while at top of chapter -> prev chapter
          prevChapter();
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
