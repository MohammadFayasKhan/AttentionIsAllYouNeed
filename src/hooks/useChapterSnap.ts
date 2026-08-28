/**
 * useChapterSnap.ts
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Custom React hook that orchestrates smooth, momentum-protected chapter navigation
 * with strict anti-double-scroll inertia filters for macOS trackpads and high-DPI mice.
 *
 * Anti-Double-Scroll Mechanics:
 *   1. Kinetic Cooldown Window (700ms):
 *      Prevents decaying macOS inertia wheel events from re-triggering a second chapter
 *      transition during a single physical swipe gesture.
 *   2. Direction Reversal Reset:
 *      Instantly resets the delta accumulator if the user changes scroll direction.
 *   3. Dynamic Inertia Tail Damping:
 *      Continuously clears inertia accumulator during the active cooldown period.
 *   4. Instant Unlock on Modal Close:
 *      Clears all locks and accumulators whenever modal state changes so the main page
 *      is immediately interactive.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { oneeBridge } from '../lib/oneeEvents';

const SCROLL_COOLDOWN_MS = 700; // Cooldown window to swallow trackpad inertia tails
const SCROLL_THRESHOLD_PX = 65; // Minimum accumulated delta to trigger a chapter change

export function useChapterSnap(sectionIds: string[], initialIndex = 0) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const lastTriggerTimeRef = useRef<number>(0);
  const isLockedRef = useRef<boolean>(false);
  const deltaAccRef = useRef<number>(0);
  const activeIndexRef = useRef<number>(activeIndex);
  activeIndexRef.current = activeIndex;

  const totalChapters = sectionIds.length;

  // Clear locks when modal opens or closes
  useEffect(() => {
    isLockedRef.current = false;
    deltaAccRef.current = 0;
    lastTriggerTimeRef.current = 0;
  }, [isModalOpen]);

  const goToChapter = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(totalChapters - 1, index));
      if (clamped !== activeIndexRef.current) {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
        setActiveIndex(clamped);
        oneeBridge.emit('chapter_change');
      }
    },
    [totalChapters]
  );

  const nextChapter = useCallback(() => {
    if (activeIndexRef.current < totalChapters - 1) {
      goToChapter(activeIndexRef.current + 1);
    }
  }, [goToChapter, totalChapters]);

  const prevChapter = useCallback(() => {
    if (activeIndexRef.current > 0) {
      goToChapter(activeIndexRef.current - 1);
    }
  }, [goToChapter]);

  // Robust wheel listener with anti-double-scroll inertia damping
  useEffect(() => {
    let unlockTimer: NodeJS.Timeout | null = null;

    const handleWheel = (e: WheelEvent) => {
      // Don't intercept wheel events when modal is open
      if (isModalOpen) return;

      const target = e.target as HTMLElement | null;
      if (!target) return;

      if (['input', 'textarea', 'select'].includes(target.tagName.toLowerCase())) {
        return;
      }

      // Check if user is scrolling inside an internal scrollable container via fast O(1) selector
      const scrollableContainer = target.closest<HTMLElement>(
        '.allow-inner-scroll, .overflow-y-auto, .overflow-auto, .no-scrollbar, pre, [data-scrollable="true"]'
      );

      if (scrollableContainer && scrollableContainer !== document.body && scrollableContainer !== document.documentElement) {
        const { scrollTop, scrollHeight, clientHeight } = scrollableContainer;
        if (scrollHeight > clientHeight + 4) {
          const canScrollDown = e.deltaY > 0 && scrollTop + clientHeight < scrollHeight - 3;
          const canScrollUp = e.deltaY < 0 && scrollTop > 3;
          if (canScrollDown || canScrollUp) {
            return;
          }
        }
      }

      // Allow natural document scrolling if page content is taller than viewport
      const docScrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const docScrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
      const docClientHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      if (docScrollHeight > docClientHeight + 8) {
        const canScrollDocDown = e.deltaY > 0 && docScrollTop + docClientHeight < docScrollHeight - 6;
        const canScrollDocUp = e.deltaY < 0 && docScrollTop > 6;
        if (canScrollDocDown || canScrollDocUp) {
          deltaAccRef.current = 0; // Clear accumulated delta while actively scrolling document
          return; // Let natural browser scrolling reveal full chapter content and bottom gap
        }
      }

      const now = Date.now();

      // If within cooldown period, swallow trackpad inertia
      if (now - lastTriggerTimeRef.current < SCROLL_COOLDOWN_MS || isLockedRef.current) {
        if (e.cancelable) e.preventDefault();
        deltaAccRef.current = 0;
        return;
      }

      // Reset accumulator if direction reversed
      if ((deltaAccRef.current > 0 && e.deltaY < 0) || (deltaAccRef.current < 0 && e.deltaY > 0)) {
        deltaAccRef.current = 0;
      }

      deltaAccRef.current += e.deltaY;

      // Check if accumulated delta exceeds threshold
      if (Math.abs(deltaAccRef.current) >= SCROLL_THRESHOLD_PX) {
        if (e.cancelable) e.preventDefault();
        lastTriggerTimeRef.current = now;
        isLockedRef.current = true;

        if (deltaAccRef.current > 0) {
          nextChapter();
        } else {
          prevChapter();
        }

        deltaAccRef.current = 0;

        if (unlockTimer) clearTimeout(unlockTimer);
        unlockTimer = setTimeout(() => {
          isLockedRef.current = false;
          deltaAccRef.current = 0;
        }, SCROLL_COOLDOWN_MS);
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      window.removeEventListener('wheel', handleWheel);
      if (unlockTimer) clearTimeout(unlockTimer);
    };
  }, [isModalOpen, nextChapter, prevChapter]);

  // Touch swipe gestures with cooldown protection
  useEffect(() => {
    let touchStartY = 0;
    let touchStartX = 0;

    const handleTouchStart = (e: TouchEvent) => {
      if (isModalOpen || e.touches.length !== 1) return;
      const target = e.target as HTMLElement | null;
      if (target?.closest('input, button, select, textarea, [role="slider"], canvas')) {
        touchStartY = 0;
        touchStartX = 0;
        return;
      }
      touchStartY = e.touches[0].clientY;
      touchStartX = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (isModalOpen || touchStartY === 0) return;
      const now = Date.now();
      if (now - lastTriggerTimeRef.current < SCROLL_COOLDOWN_MS || isLockedRef.current) {
        return;
      }

      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      const deltaY = touchStartY - touchEndY;
      const deltaX = touchStartX - touchEndX;

      // Allow touch scrolling document if taller than viewport
      const docScrollTop = window.scrollY || document.documentElement.scrollTop || 0;
      const docScrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
      const docClientHeight = window.innerHeight || document.documentElement.clientHeight || 0;
      if (docScrollHeight > docClientHeight + 6) {
        const canScrollDocDown = deltaY > 0 && docScrollTop + docClientHeight < docScrollHeight - 4;
        const canScrollDocUp = deltaY < 0 && docScrollTop > 4;
        if (canScrollDocDown || canScrollDocUp) {
          return;
        }
      }

      if (Math.abs(deltaY) > 55 && Math.abs(deltaY) > Math.abs(deltaX) * 1.25) {
        lastTriggerTimeRef.current = now;
        isLockedRef.current = true;

        if (deltaY > 0) {
          nextChapter();
        } else {
          prevChapter();
        }

        setTimeout(() => {
          isLockedRef.current = false;
        }, SCROLL_COOLDOWN_MS);
      }
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isModalOpen, nextChapter, prevChapter]);

  // Keyboard navigation with key repeat damping
  useEffect(() => {
    let lastKeyTime = 0;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isModalOpen) return;
      if (['input', 'textarea'].includes((e.target as HTMLElement)?.tagName?.toLowerCase())) {
        return;
      }

      const now = Date.now();
      if (now - lastKeyTime < 350) return; // Prevent rapid key repetition

      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        lastKeyTime = now;
        nextChapter();
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        lastKeyTime = now;
        prevChapter();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isModalOpen, nextChapter, prevChapter]);

  return {
    activeIndex,
    activeChapterId: sectionIds[activeIndex] || sectionIds[0],
    goToChapter,
    nextChapter,
    prevChapter,
    totalChapters,
    isModalOpen,
    setIsModalOpen
  };
}
