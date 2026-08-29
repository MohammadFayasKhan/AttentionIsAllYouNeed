/**
 * useReducedMotion.ts
 * ─────────────────────────────────────────────────────────────────
 * Accessibility Hook: `prefers-reduced-motion` Media Query Listener
 *
 * Project: AttentionIsAllYouNeed
 * Author: Mohammad Fayas Khan (B.Tech CSE AI/ML student)
 *
 * Details:
 *   Subscribes to the browser's accessibility media query `(prefers-reduced-motion: reduce)`.
 *   When enabled by the user or operating system, interactive visualizers (Canvas particle text,
 *   3D notebook tilt, spring physics) automatically tone down heavy motion while preserving
 *   full interactivity and educational functionality.
 */

import { useState, useEffect } from 'react';

export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  return prefersReducedMotion;
}

export default useReducedMotion;
