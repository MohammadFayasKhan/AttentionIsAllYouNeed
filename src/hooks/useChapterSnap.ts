/**
 * useChapterSnap.ts
 * ─────────────────────────────────────────────────────────────────
 * Intentional Section-by-Section Chapter Navigation Hook.
 *
 * Written by Mohammad Fayas Khan (3rd-year B.Tech CSE AI/ML student at LPU)
 *
 * ARCHITECTURE & MOBILE GESTURE RECOGNITION:
 *   1. Content-First Reading:
 *      - When a chapter has vertically scrollable content, scrolling DOWN or pressing ArrowDown
 *        scrolls through the chapter content first until reaching the very bottom.
 *      - Only when at the boundary does an intentional push transition chapters.
 *   2. Live Continuous Mobile Touch Progress:
 *      - Dynamically detects boundary collision during `touchmove`.
 *      - Computes live `pullProgress` (-1.0 to +1.0) and elastic rubber-band `pullOffsetPx`.
 *      - Fires subtle haptic pulse (`navigator.vibrate([15])`) when crossing threshold.
 *   3. Reversible Two-Way Movement:
 *      - Symmetrical navigation for next and previous across all chapters.
 *   4. Modal & Overlay Isolation:
 *      - Suspends all snap triggers while modals, chat, or dropdowns are active.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { oneeBridge } from '../lib/oneeEvents';
import { STORY_CHAPTERS } from '../data/paperData';

export interface TransitionTargetInfo {
  type: 'next' | 'prev';
  targetIndex: number;
  chapterNumber: string;
  title: string;
}

const COOLDOWN_MS = 550;          // Cooldown between chapter transitions
const WHEEL_THRESHOLD = 70;       // Accumulated px threshold at chapter boundaries
const TOUCH_SWIPE_THRESHOLD = 45; // Px threshold for mobile swipe gesture (calibrated for responsiveness)

export function useChapterSnap(sectionIds: string[], initialIndex = 0) {
  const total = sectionIds.length;
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev' | 'none'>('none');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Live real-time pull feedback for mobile gestures
  const [pullProgress, setPullProgress] = useState<number>(0);
  const [pullTarget, setPullTarget] = useState<TransitionTargetInfo | null>(null);
  const [pullOffsetPx, setPullOffsetPx] = useState<number>(0);

  const activeIdxRef = useRef(initialIndex);
  const isModalOpenRef = useRef(isModalOpen);
  const cooldownRef = useRef(false);
  const wheelAccumRef = useRef(0);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ y: number; time: number } | null>(null);
  const boundaryStartYRef = useRef<number | null>(null);
  const hapticFiredRef = useRef(false);
  const rafRef = useRef<number | null>(null);

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

    setIsTransitioning(true);
    setDirection(targetIndex > activeIdxRef.current ? 'next' : 'prev');
    setActiveIndex(targetIndex);
    activeIdxRef.current = targetIndex;
    wheelAccumRef.current = 0;
    setPullProgress(0);
    setPullTarget(null);
    setPullOffsetPx(0);
    oneeBridge.emit('chapter_change');

    // Reset scroll position of stage content for the new chapter
    requestAnimationFrame(() => {
      const stageContent = document.querySelector('.chapter-stage-content') as HTMLElement | null;
      if (stageContent) {
        stageContent.scrollTop = 0;
      }
    });

    // Reset transitioning flag after animation completes
    setTimeout(() => {
      setIsTransitioning(false);
    }, 500);

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
      if (isModalOpenRef.current) return;

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

            if (isScrollable && !isAtBottom) {
              e.preventDefault();
              stageContent.scrollBy({ top: 140, behavior: 'smooth' });
              return;
            }
          }
          e.preventDefault();
          nextChapter();
          break;
        }

        case 'ArrowUp': {
          if (stageContent) {
            const { scrollTop, scrollHeight, clientHeight } = stageContent;
            const isScrollable = scrollHeight > clientHeight + 10;
            const isAtTop = scrollTop <= 6;

            if (isScrollable && !isAtTop) {
              e.preventDefault();
              stageContent.scrollBy({ top: -140, behavior: 'smooth' });
              return;
            }
          }
          e.preventDefault();
          prevChapter();
          break;
        }

        case 'PageDown':
        case ' ': {
          if (e.key === ' ' && e.shiftKey) {
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
      if (isModalOpenRef.current) return;

      const target = e.target as HTMLElement;
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

      e.preventDefault();

      if (cooldownRef.current) return;

      if (e.deltaY > 0) {
        wheelAccumRef.current = Math.max(0, wheelAccumRef.current) + e.deltaY;
      } else if (e.deltaY < 0) {
        wheelAccumRef.current = Math.min(0, wheelAccumRef.current) + e.deltaY;
      }

      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => {
        wheelAccumRef.current = 0;
      }, 200);

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

  // ── Live Touch Gesture Recognition with Dynamic Boundary Detection ──
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (isModalOpenRef.current) return;
      if (e.touches.length !== 1) return;

      const touch = e.touches[0];
      boundaryStartYRef.current = null;
      hapticFiredRef.current = false;
      touchStartRef.current = {
        y: touch.clientY,
        time: Date.now()
      };
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isModalOpenRef.current || !touchStartRef.current) return;
      if (cooldownRef.current) return;

      const currentY = e.touches[0]?.clientY;
      if (currentY === undefined) return;

      const stageContent = document.querySelector('.chapter-stage-content') as HTMLElement | null;
      let atTop = true;
      let atBottom = true;

      if (stageContent) {
        const { scrollTop, scrollHeight, clientHeight } = stageContent;
        atTop = scrollTop <= 6;
        atBottom = scrollTop + clientHeight >= scrollHeight - 10;
      }

      const totalDelta = touchStartRef.current.y - currentY; // positive = swiping UP
      const currentIdx = activeIdxRef.current;

      // ── Pulling UP at Bottom boundary (towards NEXT chapter) ───────
      if (atBottom && totalDelta > 0 && currentIdx < total - 1) {
        if (boundaryStartYRef.current === null) {
          boundaryStartYRef.current = currentY;
        }
        const pullDelta = boundaryStartYRef.current - currentY;
        if (pullDelta > 0) {
          const progress = Math.min(1, Math.max(0, pullDelta / TOUCH_SWIPE_THRESHOLD));
          const offset = -Math.min(22, Math.pow(pullDelta, 0.72) * 1.5);
          const nextMeta = STORY_CHAPTERS[currentIdx + 1];

          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(() => {
            setPullProgress(progress);
            setPullOffsetPx(offset);
            setPullTarget({
              type: 'next',
              targetIndex: currentIdx + 1,
              chapterNumber: String(nextMeta?.chapterNumber ?? currentIdx + 2),
              title: nextMeta?.title ?? 'Next Chapter'
            });
          });

          if (progress >= 0.85 && !hapticFiredRef.current) {
            hapticFiredRef.current = true;
            try { if (typeof navigator.vibrate === 'function') navigator.vibrate([15]); } catch {}
          }
          return;
        }
      }

      // ── Pulling DOWN at Top boundary (towards PREVIOUS chapter) ───
      if (atTop && totalDelta < 0 && currentIdx > 0) {
        if (boundaryStartYRef.current === null) {
          boundaryStartYRef.current = currentY;
        }
        const pullDelta = currentY - boundaryStartYRef.current;
        if (pullDelta > 0) {
          const progress = -Math.min(1, Math.max(0, pullDelta / TOUCH_SWIPE_THRESHOLD));
          const offset = Math.min(22, Math.pow(pullDelta, 0.72) * 1.5);
          const prevMeta = STORY_CHAPTERS[currentIdx - 1];

          if (rafRef.current) cancelAnimationFrame(rafRef.current);
          rafRef.current = requestAnimationFrame(() => {
            setPullProgress(progress);
            setPullOffsetPx(offset);
            setPullTarget({
              type: 'prev',
              targetIndex: currentIdx - 1,
              chapterNumber: String(prevMeta?.chapterNumber ?? currentIdx),
              title: prevMeta?.title ?? 'Previous Chapter'
            });
          });

          if (Math.abs(progress) >= 0.85 && !hapticFiredRef.current) {
            hapticFiredRef.current = true;
            try { if (typeof navigator.vibrate === 'function') navigator.vibrate([15]); } catch {}
          }
          return;
        }
      }

      // Reset when not pulling at boundary
      boundaryStartYRef.current = null;
      if (pullProgress !== 0) {
        setPullProgress(0);
        setPullOffsetPx(0);
        setPullTarget(null);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isModalOpenRef.current || !touchStartRef.current) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const stageContent = document.querySelector('.chapter-stage-content') as HTMLElement | null;
      let atTop = true;
      let atBottom = true;

      if (stageContent) {
        const { scrollTop, scrollHeight, clientHeight } = stageContent;
        atTop = scrollTop <= 6;
        atBottom = scrollTop + clientHeight >= scrollHeight - 10;
      }

      const totalDelta = touchStartRef.current.y - touch.clientY;
      const elapsed = Date.now() - touchStartRef.current.time;
      const currentIdx = activeIdxRef.current;

      touchStartRef.current = null;
      boundaryStartYRef.current = null;
      setPullOffsetPx(0);

      // Trigger transition if threshold reached
      if (elapsed < 700) {
        if (totalDelta >= TOUCH_SWIPE_THRESHOLD && atBottom && currentIdx < total - 1) {
          nextChapter();
          return;
        } else if (totalDelta <= -TOUCH_SWIPE_THRESHOLD && atTop && currentIdx > 0) {
          prevChapter();
          return;
        }
      }

      setPullProgress(0);
      setPullTarget(null);
    };

    const handleTouchCancel = () => {
      touchStartRef.current = null;
      boundaryStartYRef.current = null;
      setPullProgress(0);
      setPullOffsetPx(0);
      setPullTarget(null);
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [nextChapter, prevChapter, total, pullProgress]);

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
    isTransitioning,
    pullProgress,
    pullTarget,
    pullOffsetPx,
  };
}

export default useChapterSnap;
