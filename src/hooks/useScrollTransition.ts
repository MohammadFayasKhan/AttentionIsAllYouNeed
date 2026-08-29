/**
 * useScrollTransition.ts
 * ─────────────────────────────────────────────────────────────────
 * Mobile-only progressive chapter transition driven by passive touch
 * scroll observation at the document boundaries.
 *
 * DESIGN PRINCIPLES:
 *   - Zero touch event interception or preventDefault calls.
 *   - Measures pull distance beyond the natural document scrollable range.
 *   - Schedules animation updates via requestAnimationFrame.
 *   - Works across all mobile & tablet viewport sizes (320px to 1024px+).
 */

import { useEffect, useRef, useCallback } from 'react';
import { STORY_CHAPTERS } from '../data/paperData';
import { TransitionTargetInfo } from './useChapterSnap';

const PULL_THRESHOLD_PX = 70; // px of overscroll past boundary to trigger chapter change
const COOLDOWN_MS = 600;

interface UseScrollTransitionOptions {
  activeIndex: number;
  totalChapters: number;
  isModalOpen: boolean;
  isLocked: boolean;
  onProgress: (p: number, target: TransitionTargetInfo | null) => void;
  onTriggerNext: () => void;
  onTriggerPrev: () => void;
  onSpringBack: () => void;
}

export function useScrollTransition({
  activeIndex,
  totalChapters,
  isModalOpen,
  isLocked,
  onProgress,
  onTriggerNext,
  onTriggerPrev,
  onSpringBack,
}: UseScrollTransitionOptions) {
  const activeIdxRef   = useRef(activeIndex);
  const isModalRef     = useRef(isModalOpen);
  const isLockedRef    = useRef(isLocked);
  const lastTriggerRef = useRef(0);

  // Touch tracking refs
  const touchStartYRef       = useRef(0);
  const touchStartScrollYRef = useRef(0);
  const progressRef          = useRef(0);
  const hapticFiredRef       = useRef(false);
  const rafRef               = useRef<number | null>(null);

  // Callbacks as refs so listeners always invoke current version
  const onProgressRef    = useRef(onProgress);
  const onTriggerNextRef = useRef(onTriggerNext);
  const onTriggerPrevRef = useRef(onTriggerPrev);
  const onSpringBackRef  = useRef(onSpringBack);

  activeIdxRef.current    = activeIndex;
  isModalRef.current      = isModalOpen;
  isLockedRef.current     = isLocked;
  onProgressRef.current   = onProgress;
  onTriggerNextRef.current = onTriggerNext;
  onTriggerPrevRef.current = onTriggerPrev;
  onSpringBackRef.current = onSpringBack;

  const scheduleProgress = useCallback((p: number, target: TransitionTargetInfo | null) => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      onProgressRef.current(p, target);
    });
  }, []);

  useEffect(() => {
    const isTouchDevice = () =>
      'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

    const onTouchStart = (e: TouchEvent) => {
      if (!isTouchDevice() || isModalRef.current) return;
      if (e.touches.length !== 1) return;

      touchStartYRef.current       = e.touches[0].clientY;
      touchStartScrollYRef.current = window.scrollY;
      progressRef.current          = 0;
      hapticFiredRef.current       = false;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isTouchDevice() || isModalRef.current) return;
      if (touchStartYRef.current === 0) return;
      if (isLockedRef.current) return;
      if (Date.now() - lastTriggerRef.current < COOLDOWN_MS) return;

      const currentFingerY = e.touches[0].clientY;
      const fingerDelta    = touchStartYRef.current - currentFingerY; // + = swiping up / pulling down page

      const { scrollHeight, clientHeight } = document.documentElement;
      const maxScrollY = Math.max(0, scrollHeight - clientHeight);

      // ── Bottom overscroll (pull up past document end) ───────
      if (fingerDelta > 0 && activeIdxRef.current < totalChapters - 1) {
        if (window.scrollY >= maxScrollY - 3 && fingerDelta > 6) {
          const pullBeyond = fingerDelta - Math.max(0, maxScrollY - touchStartScrollYRef.current);
          const progress   = Math.min(1, Math.max(0, pullBeyond / PULL_THRESHOLD_PX));

          if (progress > 0) {
            progressRef.current = progress;
            if (progress >= 0.95 && !hapticFiredRef.current) {
              hapticFiredRef.current = true;
              try { if (typeof navigator.vibrate === 'function') navigator.vibrate([10, 25]); } catch {}
            }
            const nextIdx  = activeIdxRef.current + 1;
            const nextMeta = STORY_CHAPTERS[nextIdx];
            scheduleProgress(progress, {
              type: 'next',
              targetIndex: nextIdx,
              chapterNumber: String(nextMeta?.chapterNumber ?? nextIdx + 1),
              title: nextMeta?.title ?? 'Next Chapter',
            });
          }
        }
      }

      // ── Top overscroll (pull down past start) ───────────────
      if (fingerDelta < 0 && activeIdxRef.current > 0 && window.scrollY <= 3) {
        const pullBeyond = Math.abs(fingerDelta) - touchStartScrollYRef.current;
        const progress   = Math.min(1, Math.max(0, pullBeyond / PULL_THRESHOLD_PX));

        if (progress > 0) {
          progressRef.current = -progress;
          if (progress >= 0.95 && !hapticFiredRef.current) {
            hapticFiredRef.current = true;
            try { if (typeof navigator.vibrate === 'function') navigator.vibrate([10, 25]); } catch {}
          }
        }
      }
    };

    const onTouchEnd = () => {
      if (touchStartYRef.current === 0) return;
      touchStartYRef.current = 0;

      const p = progressRef.current;
      progressRef.current = 0;

      if (p >= 0.85) {
        lastTriggerRef.current = Date.now();
        onTriggerNextRef.current();
      } else if (p <= -0.85) {
        lastTriggerRef.current = Date.now();
        onTriggerPrevRef.current();
      } else {
        onSpringBackRef.current();
      }
    };

    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove',  onTouchMove,  { passive: true });
    window.addEventListener('touchend',   onTouchEnd,   { passive: true });
    window.addEventListener('touchcancel', onTouchEnd,  { passive: true });

    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove',  onTouchMove);
      window.removeEventListener('touchcancel', onTouchEnd);
      window.removeEventListener('touchend',   onTouchEnd);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalChapters]);
}

export default useScrollTransition;
