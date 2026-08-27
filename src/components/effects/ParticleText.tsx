/**
 * ParticleText.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * ParticleText renders a high-legibility, responsive procedural Dot-Matrix hero title
 * ("ATTENTION IS ALL YOU NEED") using an HTML5 `<canvas>` rendering engine.
 *
 * Core Mechanics:
 *   1. 5x7 Bitmapped Glyph Dictionary (`GLYPHS_5X7`):
 *      Every alphanumeric character is defined as seven 5-bit rows (e.g. `0b01110`).
 *      This guarantees mathematically sharp, perfectly formed characters at any resolution.
 *   2. Responsive Layout & Dot Pitch Calculation:
 *      Calculates the bounding container geometry and chooses between single-line (desktop)
 *      or two-line split (mobile < 580px) layouts. Automatically scales dot radius and
 *      spacing to prevent horizontal overflow or clipping.
 *   3. Particle Assembly & Elastic Physics:
 *      - On initial mount, particles assemble with a smooth cubic bezier easing.
 *      - Subtle rhythmic wave shimmer keeps the title subtly alive.
 *      - Pointer events apply interactive elastic repulsion when hovering over dots.
 *   4. Accessibility & Performance:
 *      - Respects `prefers-reduced-motion` by disabling scatter and repulsion.
 *      - Uses `requestAnimationFrame` with proper cleanup to prevent memory leaks.
 */

import React, { useEffect, useRef } from 'react';

interface ParticleTextProps {
  text?: string;
  color?: string;
  highlightColor?: string;
  className?: string;
  style?: React.CSSProperties;
  fontSize?: string;
}

// 5x7 High-Legibility Dot-Matrix Glyph Dictionary
const GLYPHS_5X7: Record<string, number[]> = {
  'A': [
    0b01110,
    0b10001,
    0b10001,
    0b11111,
    0b10001,
    0b10001,
    0b10001
  ],
  'B': [
    0b11110,
    0b10001,
    0b10001,
    0b11110,
    0b10001,
    0b10001,
    0b11110
  ],
  'C': [
    0b01111,
    0b10000,
    0b10000,
    0b10000,
    0b10000,
    0b10000,
    0b01111
  ],
  'D': [
    0b11110,
    0b10001,
    0b10001,
    0b10001,
    0b10001,
    0b10001,
    0b11110
  ],
  'E': [
    0b11111,
    0b10000,
    0b10000,
    0b11110,
    0b10000,
    0b10000,
    0b11111
  ],
  'F': [
    0b11111,
    0b10000,
    0b10000,
    0b11110,
    0b10000,
    0b10000,
    0b10000
  ],
  'G': [
    0b01111,
    0b10000,
    0b10000,
    0b10111,
    0b10001,
    0b10001,
    0b01110
  ],
  'H': [
    0b10001,
    0b10001,
    0b10001,
    0b11111,
    0b10001,
    0b10001,
    0b10001
  ],
  'I': [
    0b11111,
    0b00100,
    0b00100,
    0b00100,
    0b00100,
    0b00100,
    0b11111
  ],
  'J': [
    0b00111,
    0b00010,
    0b00010,
    0b00010,
    0b10010,
    0b10010,
    0b01100
  ],
  'K': [
    0b10001,
    0b10010,
    0b10100,
    0b11000,
    0b10100,
    0b10010,
    0b10001
  ],
  'L': [
    0b10000,
    0b10000,
    0b10000,
    0b10000,
    0b10000,
    0b10000,
    0b11111
  ],
  'M': [
    0b10001,
    0b11011,
    0b10101,
    0b10101,
    0b10001,
    0b10001,
    0b10001
  ],
  'N': [
    0b10001,
    0b11001,
    0b10101,
    0b10011,
    0b10001,
    0b10001,
    0b10001
  ],
  'O': [
    0b01110,
    0b10001,
    0b10001,
    0b10001,
    0b10001,
    0b10001,
    0b01110
  ],
  'P': [
    0b11110,
    0b10001,
    0b10001,
    0b11110,
    0b10000,
    0b10000,
    0b10000
  ],
  'Q': [
    0b01110,
    0b10001,
    0b10001,
    0b10001,
    0b10101,
    0b10011,
    0b01111
  ],
  'R': [
    0b11110,
    0b10001,
    0b10001,
    0b11110,
    0b10100,
    0b10010,
    0b10001
  ],
  'S': [
    0b01111,
    0b10000,
    0b10000,
    0b01110,
    0b00001,
    0b00001,
    0b11110
  ],
  'T': [
    0b11111,
    0b00100,
    0b00100,
    0b00100,
    0b00100,
    0b00100,
    0b00100
  ],
  'U': [
    0b10001,
    0b10001,
    0b10001,
    0b10001,
    0b10001,
    0b10001,
    0b01110
  ],
  'V': [
    0b10001,
    0b10001,
    0b10001,
    0b10001,
    0b01010,
    0b01010,
    0b00100
  ],
  'W': [
    0b10001,
    0b10001,
    0b10001,
    0b10101,
    0b10101,
    0b11011,
    0b10001
  ],
  'X': [
    0b10001,
    0b10001,
    0b01010,
    0b00100,
    0b01010,
    0b10001,
    0b10001
  ],
  'Y': [
    0b10001,
    0b10001,
    0b01010,
    0b00100,
    0b00100,
    0b00100,
    0b00100
  ],
  'Z': [
    0b11111,
    0b00001,
    0b00010,
    0b00100,
    0b01000,
    0b10000,
    0b11111
  ],
  '0': [
    0b01110,
    0b10011,
    0b10101,
    0b10101,
    0b11001,
    0b10001,
    0b01110
  ],
  '1': [
    0b00100,
    0b01100,
    0b00100,
    0b00100,
    0b00100,
    0b00100,
    0b01110
  ],
  '2': [
    0b01110,
    0b10001,
    0b00001,
    0b00110,
    0b01000,
    0b10000,
    0b11111
  ],
  '3': [
    0b11110,
    0b00001,
    0b00001,
    0b01110,
    0b00001,
    0b00001,
    0b11110
  ],
  '4': [
    0b00010,
    0b00110,
    0b01010,
    0b10010,
    0b11111,
    0b00010,
    0b00010
  ],
  '5': [
    0b11111,
    0b10000,
    0b11110,
    0b00001,
    0b00001,
    0b10001,
    0b01110
  ],
  '6': [
    0b01110,
    0b10000,
    0b10000,
    0b11110,
    0b10001,
    0b10001,
    0b01110
  ],
  '7': [
    0b11111,
    0b00001,
    0b00010,
    0b00100,
    0b01000,
    0b01000,
    0b01000
  ],
  '8': [
    0b01110,
    0b10001,
    0b10001,
    0b01110,
    0b10001,
    0b10001,
    0b01110
  ],
  '9': [
    0b01110,
    0b10001,
    0b10001,
    0b01111,
    0b00001,
    0b00001,
    0b01110
  ],
  '-': [
    0b00000,
    0b00000,
    0b00000,
    0b11111,
    0b00000,
    0b00000,
    0b00000
  ],
  ':': [
    0b00000,
    0b00100,
    0b00100,
    0b00000,
    0b00100,
    0b00100,
    0b00000
  ],
  '.': [
    0b00000,
    0b00000,
    0b00000,
    0b00000,
    0b00000,
    0b01100,
    0b01100
  ],
  ' ': [
    0b00000,
    0b00000,
    0b00000,
    0b00000,
    0b00000,
    0b00000,
    0b00000
  ]
};

interface Dot {
  targetX: number;
  targetY: number;
  currentX: number;
  currentY: number;
  startX: number;
  startY: number;
  radius: number;
  baseColor: string;
  charIndex: number;
  dotIndex: number;
  totalDots: number;
}

export const ParticleText: React.FC<ParticleTextProps> = ({
  text = 'ATTENTION IS ALL YOU NEED',
  color = '#1d1d1f',
  highlightColor = '#0071e3',
  className = '',
  style
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animFrame: number | null = null;
    let dots: Dot[] = [];
    let startTime = performance.now();
    let isVisible = true;
    let cachedWidth = 400;
    let cachedHeight = 160;
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

    const pointer = {
      x: -1000,
      y: -1000,
      active: false
    };

    // Calculate exact clean grid layout
    const buildDots = () => {
      const rect = container.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      if (width <= 0 || height <= 0) return;

      cachedWidth = width;
      cachedHeight = height;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const upper = text.toUpperCase();

      // Determine single-line vs multi-line layout based on width
      const isMobile = width < 580;
      const lines = isMobile
        ? (upper === 'ATTENTION IS ALL YOU NEED' ? ['ATTENTION', 'IS ALL YOU NEED'] : [upper])
        : [upper];

      // Calculate maximum horizontal dot columns across lines
      let maxCols = 0;
      const lineData = lines.map((lineStr) => {
        let cols = 0;
        for (let i = 0; i < lineStr.length; i++) {
          const char = lineStr[i];
          if (char === ' ') {
            cols += 3;
          } else {
            cols += 5;
            if (i < lineStr.length - 1 && lineStr[i + 1] !== ' ') {
              cols += 1;
            }
          }
        }
        if (cols > maxCols) maxCols = cols;
        return { text: lineStr, cols };
      });

      const totalRows = lines.length * 7 + (lines.length - 1) * 3;

      const maxAvailableWidth = width * 0.88;
      const maxAvailableHeight = height * 0.76;

      const pitchX = maxAvailableWidth / maxCols;
      const pitchY = maxAvailableHeight / totalRows;
      const pitch = Math.min(pitchX, pitchY, isMobile ? 6.5 : 8.5);
      const dotRadius = Math.max(1.2, Math.min(2.8, pitch * 0.38));

      const totalBlockWidth = maxCols * pitch;
      const totalBlockHeight = totalRows * pitch;

      const startLeft = (width - totalBlockWidth) / 2;
      const startTop = (height - totalBlockHeight) / 2;

      const newDots: Dot[] = [];
      let globalDotIndex = 0;

      lines.forEach((lineStr, lineIdx) => {
        const lineCols = lineData[lineIdx].cols;
        const lineBlockWidth = lineCols * pitch;
        let curX = startLeft + (totalBlockWidth - lineBlockWidth) / 2;
        const curY = startTop + lineIdx * (7 + 3) * pitch;

        for (let cIdx = 0; cIdx < lineStr.length; cIdx++) {
          const char = lineStr[cIdx];

          if (char === ' ') {
            curX += 3 * pitch;
            continue;
          }

          const glyph = GLYPHS_5X7[char] || GLYPHS_5X7['A'];

          for (let row = 0; row < 7; row++) {
            const rowBits = glyph[row];
            for (let col = 0; col < 5; col++) {
              const bit = (rowBits >> (4 - col)) & 1;
              if (bit === 1) {
                const targetX = curX + col * pitch + pitch / 2;
                const targetY = curY + row * pitch + pitch / 2;

                const angle = (globalDotIndex * 0.38) * Math.PI * 2;
                const dist = 70 + (globalDotIndex % 30) * 3;
                const startX = targetX + Math.cos(angle) * dist;
                const startY = targetY + Math.sin(angle) * dist;

                const xProgress = targetX / width;
                const dotColor = xProgress < 0.35 ? highlightColor : color;

                newDots.push({
                  targetX,
                  targetY,
                  currentX: reducedMotion ? targetX : startX,
                  currentY: reducedMotion ? targetY : startY,
                  startX,
                  startY,
                  radius: dotRadius,
                  baseColor: dotColor,
                  charIndex: cIdx,
                  dotIndex: globalDotIndex,
                  totalDots: 0
                });

                globalDotIndex++;
              }
            }
          }

          curX += (5 + 1) * pitch;
        }
      });

      newDots.forEach((d) => {
        d.totalDots = newDots.length;
      });

      dots = newDots;
      startTime = performance.now();
    };

    // Animation Loop with Cached Dimensions
    const render = (now: number) => {
      if (!isVisible || document.visibilityState === 'hidden') {
        animFrame = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, cachedWidth, cachedHeight);

      const elapsed = now - startTime;
      const assembleDuration = 800;

      for (let i = 0; i < dots.length; i++) {
        const dot = dots[i];
        let posX = dot.targetX;
        let posY = dot.targetY;
        let opacity = 1;

        if (!reducedMotion && elapsed < assembleDuration + 300) {
          const staggerOffset = (dot.targetX / (cachedWidth || 1)) * 250;
          const progress = Math.max(0, Math.min(1, (elapsed - staggerOffset) / assembleDuration));

          const ease = 1 - Math.pow(1 - progress, 3);
          posX = dot.startX + (dot.targetX - dot.startX) * ease;
          posY = dot.startY + (dot.targetY - dot.startY) * ease;
          opacity = Math.max(0.2, progress);
        } else {
          const shimmerWave = Math.sin(now * 0.002 - dot.targetX * 0.012);
          if (shimmerWave > 0.85) {
            opacity = 0.85 + (shimmerWave - 0.85) * 0.7;
          }
        }

        // Pointer elastic interaction
        if (pointer.active && !reducedMotion) {
          const dx = posX - pointer.x;
          const dy = posY - pointer.y;
          const dist = Math.hypot(dx, dy);
          const repelRadius = 70;

          if (dist < repelRadius && dist > 0) {
            const force = (1 - dist / repelRadius) * 14;
            posX += (dx / dist) * force;
            posY += (dy / dist) * force;
          }
        }

        dot.currentX += (posX - dot.currentX) * 0.35;
        dot.currentY += (posY - dot.currentY) * 0.35;

        ctx.globalAlpha = opacity;
        ctx.fillStyle = dot.baseColor;
        ctx.beginPath();
        ctx.arc(dot.currentX, dot.currentY, dot.radius, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animFrame = requestAnimationFrame(render);
    };

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left;
      pointer.y = e.clientY - rect.top;
      pointer.active = true;
    };

    const handlePointerLeave = () => {
      pointer.active = false;
      pointer.x = -1000;
      pointer.y = -1000;
    };

    canvas.addEventListener('pointermove', handlePointerMove, { passive: true });
    canvas.addEventListener('pointerleave', handlePointerLeave, { passive: true });

    const resizeObserver = new ResizeObserver(() => {
      buildDots();
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
    }, { threshold: 0.05 });
    intersectionObserver.observe(container);

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        isVisible = false;
      } else {
        isVisible = true;
        startTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    buildDots();
    animFrame = requestAnimationFrame(render);

    return () => {
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibility);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      if (animFrame) cancelAnimationFrame(animFrame);
    };
  }, [text, color, highlightColor]);

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[160px] sm:min-h-[200px] flex items-center justify-center overflow-hidden select-none isolate gpu-layer ${className}`}
      style={style}
      aria-label={text}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 block w-full h-full pointer-events-auto cursor-crosshair"
        aria-hidden="true"
      />
      <span className="sr-only">{text}</span>
    </div>
  );
};

export default ParticleText;
