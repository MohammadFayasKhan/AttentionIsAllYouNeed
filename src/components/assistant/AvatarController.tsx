/**
 * AvatarController.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * AvatarController wraps `@bible-strong/avatar-web` to render the authentic, procedural
 * 3D SVG Onee companion character without placeholders or static images.
 *
 * Key Responsibilities:
 *   1. Schema Validation & Sanitization:
 *      Clamps roundness properties (morphRoundness, tipRoundness, baseRoundness <= 1.0)
 *      to ensure strict compliance with `@bible-strong/avatar-core` validator.
 *   2. Lifecycle & Instance Management:
 *      Instantiates the procedural avatar once on container mount, maintains its controller,
 *      and cleans up smoothly on unmount.
 *   3. Dynamic Animation & Expression Transitions:
 *      Exposes an imperative handle `AvatarRefHandle` (`play`, `setExpression`, `stop`)
 *      and synchronizes with animation props.
 *   4. Unlocked Multi-Step Animation Sequences:
 *      Allows the avatar's rich multi-step animation sequences (eye morphs, head tilts,
 *      blinks, body bobs) to execute freely without being clamped to a single static expression.
 */

import React, { useEffect, useRef, useImperativeHandle, forwardRef, useId, useState } from 'react';
import { createAvatar, AvatarController as AvatarWebInstance } from '@bible-strong/avatar-web';
import rawAvatarData from '../../../onee.avatar.json';
import {
  VALID_ANIMATIONS,
  VALID_EXPRESSIONS,
  AnimationKey,
  ExpressionKey,
  AvatarRefHandle
} from '../../types/avatar';

export type { AnimationKey, ExpressionKey, AvatarRefHandle };

interface AvatarControllerProps {
  animation?: AnimationKey | string;
  expression?: ExpressionKey | string;
  size?: number | string;
  className?: string;
  containerId?: string;
  ariaLabel?: string;
  onClick?: () => void;
  interactive?: boolean;
}

// Ensure avatar definition strictly adheres to schema constraints (roundness <= 1)
const sanitizeDefinition = (data: any) => {
  try {
    const clone = JSON.parse(JSON.stringify(data));
    if (clone?.body?.primary) {
      if (typeof clone.body.primary.morphRoundness === 'number') {
        clone.body.primary.morphRoundness = Math.min(1, Math.max(0, clone.body.primary.morphRoundness));
      }
      if (typeof clone.body.primary.tipRoundness === 'number') {
        clone.body.primary.tipRoundness = Math.min(1, Math.max(0, clone.body.primary.tipRoundness));
      }
      if (typeof clone.body.primary.baseRoundness === 'number') {
        clone.body.primary.baseRoundness = Math.min(1, Math.max(0, clone.body.primary.baseRoundness));
      }
    }
    return clone;
  } catch {
    return data;
  }
};

const validAvatarData = sanitizeDefinition(rawAvatarData);

export const AvatarController = forwardRef<AvatarRefHandle, AvatarControllerProps>(
  (
    {
      animation = 'idle',
      expression,
      size = 300,
      className = '',
      containerId,
      ariaLabel = 'Onee procedural avatar',
      onClick,
      interactive = true
    },
    ref
  ) => {
    const autoId = useId();
    const containerRef = useRef<HTMLDivElement>(null);
    const instanceRef = useRef<AvatarWebInstance | null>(null);
    const activeAnimRef = useRef<string>('idle');
    const autoIdleTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [initError, setInitError] = useState<string | null>(null);

    // Validate animation key against schema
    const getSafeAnimation = (anim?: string): AnimationKey => {
      if (anim && VALID_ANIMATIONS.includes(anim as AnimationKey)) {
        return anim as AnimationKey;
      }
      return 'idle';
    };

    // Initialize Avatar instance once on mount with visibility culling
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      container.innerHTML = '';
      setInitError(null);

      let isVisible = true;
      let isTabActive = document.visibilityState === 'visible';

      const syncPlayback = () => {
        if (!instanceRef.current) return;
        if (!isVisible || !isTabActive) {
          try {
            instanceRef.current.stop();
          } catch (e) {}
        } else {
          try {
            instanceRef.current.play(activeAnimRef.current || 'idle');
          } catch (e) {}
        }
      };

      try {
        const initialAnim = getSafeAnimation(animation);

        const instance = createAvatar(container, {
          definition: validAvatarData,
          defaultAnimation: initialAnim,
          size: '100%',
          ariaLabel,
          onError: (err: any) => {
            console.warn('[Onee Avatar Runtime Error]', err);
            try {
              instanceRef.current?.play('idle');
            } catch (e) {
              // ignore
            }
          },
          onAnimationEnd: (endedAnim: string) => {
            // If active animation is thinking, working, excited, curious, loop it
            if (['thinking', 'working', 'excited', 'curious', 'happy', 'searching'].includes(activeAnimRef.current)) {
              try {
                instanceRef.current?.play(activeAnimRef.current);
              } catch (e) {}
              return;
            }

            // When a one-shot animation finishes, smoothly resume idle
            if (endedAnim !== 'idle') {
              try {
                instanceRef.current?.play('idle');
                activeAnimRef.current = 'idle';
              } catch (e) {
                // ignore
              }
            }
          }
        });

        instanceRef.current = instance;
        activeAnimRef.current = initialAnim;
      } catch (err: any) {
        console.error('Failed to initialize Onee avatar instance:', err);
        setInitError(err?.message || 'Avatar init failed');
      }

      // Intersection Observer for viewport visibility culling
      const observer = new IntersectionObserver(
        ([entry]) => {
          isVisible = entry.isIntersecting;
          syncPlayback();
        },
        { threshold: 0.05 }
      );
      observer.observe(container);

      const handleVisibilityChange = () => {
        isTabActive = document.visibilityState === 'visible';
        syncPlayback();
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        observer.disconnect();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        if (autoIdleTimerRef.current) clearTimeout(autoIdleTimerRef.current);
        if (instanceRef.current) {
          try {
            instanceRef.current.destroy();
          } catch (e) {
            // ignore
          }
          instanceRef.current = null;
        }
      };
    }, [autoId]);

    // React to animation prop updates
    useEffect(() => {
      if (!instanceRef.current) return;
      const safeAnim = getSafeAnimation(animation);

      if (activeAnimRef.current === safeAnim) return;

      try {
        instanceRef.current.play(safeAnim);
        activeAnimRef.current = safeAnim;
      } catch (err) {
        console.warn('Error playing animation:', err);
      }
    }, [animation]);

    // Imperative ref methods
    useImperativeHandle(ref, () => ({
      play: (anim: AnimationKey | string, autoReturnIdleMs?: number) => {
        if (!instanceRef.current) return;
        const validKey = getSafeAnimation(anim);
        try {
          if (autoIdleTimerRef.current) {
            clearTimeout(autoIdleTimerRef.current);
            autoIdleTimerRef.current = null;
          }
          instanceRef.current.play(validKey);
          activeAnimRef.current = validKey;

          // Only set auto-return timer for transient one-shot reactions (e.g. celebrate, tap)
          const isContinuous = ['thinking', 'working', 'excited', 'curious', 'happy', 'searching', 'idle', 'listening'].includes(validKey);
          if (autoReturnIdleMs && autoReturnIdleMs > 0 && !isContinuous) {
            autoIdleTimerRef.current = setTimeout(() => {
              try {
                instanceRef.current?.play('idle');
                activeAnimRef.current = 'idle';
              } catch (e) {
                // ignore
              }
            }, autoReturnIdleMs);
          }
        } catch (e) {
          console.warn('Imperative play error:', e);
        }
      },
      setExpression: (expr: ExpressionKey | string) => {
        if (!instanceRef.current) return;
        const validKey = VALID_EXPRESSIONS.includes(expr as ExpressionKey) ? (expr as ExpressionKey) : 'neutral';
        try {
          instanceRef.current.setExpression(validKey);
        } catch (e) {
          console.warn('Imperative setExpression error:', e);
        }
      },
      stop: () => {
        try {
          instanceRef.current?.stop();
        } catch (e) {
          // ignore
        }
      },
      getState: () => {
        return {
          activeAnimation: activeAnimRef.current,
          hasInstance: !!instanceRef.current
        };
      }
    }));

    return (
      <div
        id={containerId}
        className={`relative flex items-center justify-center select-none overflow-visible ${className}`}
        style={{
          width: typeof size === 'number' ? `${size}px` : size,
          height: typeof size === 'number' ? `${size}px` : size,
          cursor: interactive && onClick ? 'pointer' : 'default'
        }}
        onClick={onClick}
        role={interactive ? 'button' : 'img'}
        aria-label={ariaLabel}
        tabIndex={interactive ? 0 : -1}
      >
        <div
          ref={containerRef}
          className="w-full h-full flex items-center justify-center pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        />
        {initError && (
          <div className="absolute inset-0 flex items-center justify-center p-3 text-center text-xs text-rose-600 bg-rose-50/90 rounded-2xl border border-rose-200">
            Onee Avatar: {initError}
          </div>
        )}
      </div>
    );
  }
);

AvatarController.displayName = 'AvatarController';

export default AvatarController;
