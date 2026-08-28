/**
 * PositionalEncoding.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Interactive simulation of Sinusoidal Positional Encoding (Vaswani et al. 2017, Section 3.5):
 *   PE_(pos, 2i)   = sin(pos / 10000^(2i / d_model))
 *   PE_(pos, 2i+1) = cos(pos / 10000^(2i / d_model))
 *
 * Layout & Content Protection:
 *   - Uses `w-full h-auto` with clean natural padding and non-overlapping flex flow.
 */

import React, { useState, useEffect, useRef } from 'react';
import { oneeBridge } from '../../lib/oneeEvents';
import { Play, Pause, RotateCcw, Sparkles, Activity } from 'lucide-react';

export const PositionalEncoding: React.FC = () => {
  const [position, setPosition] = useState<number>(14);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [selectedDimension, setSelectedDimension] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameIdRef = useRef<number | null>(null);
  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;

  const virtualPosRef = useRef<number>(position);
  const lastTimeRef = useRef<number>(performance.now());
  const phaseRef = useRef<number>(0);
  const isVisibleRef = useRef<boolean>(true);
  const sizeRef = useRef<{ width: number; height: number; dpr: number }>({ width: 400, height: 120, dpr: 1 });

  // Dimension presets to inspect
  const dimensions = [
    { dim: 0, label: "2i = 0 (λ = 2π)", color: "#0071e3", bg: "bg-blue-100 text-apple-blue" },
    { dim: 64, label: "2i = 64 (λ = 54π)", color: "#00c7be", bg: "bg-teal-100 text-teal-800" },
    { dim: 128, label: "2i = 128 (λ = 1468π)", color: "#af52de", bg: "bg-purple-100 text-purple-800" }
  ];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPlaying(false);
    isPlayingRef.current = false;
    const newVal = parseInt(e.target.value, 10);
    setPosition(newVal);
    virtualPosRef.current = newVal;
    oneeBridge.emit('slider_change', `“Position ${newVal}: Sine phase = ${(newVal / 10000).toFixed(4)}”`);
  };

  const toggleAutoPlay = () => {
    setIsPlaying((prev) => {
      const next = !prev;
      isPlayingRef.current = next;
      return next;
    });
  };

  // High-DPI Canvas Rendering Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let isMounted = true;

    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = rect.width;
      const height = rect.height;
      if (width <= 0 || height <= 0) return;

      sizeRef.current = { width, height, dpr };
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    updateCanvasSize();

    const resizeObserver = new ResizeObserver(() => {
      updateCanvasSize();
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
    }, { threshold: 0.05 });
    intersectionObserver.observe(container);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        isVisibleRef.current = false;
      } else {
        isVisibleRef.current = true;
        lastTimeRef.current = performance.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const render = (time: number) => {
      if (!isMounted) return;

      if (!isVisibleRef.current || document.visibilityState === 'hidden') {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.08);
      lastTimeRef.current = time;

      const { width, height } = sizeRef.current;
      if (width <= 0 || height <= 0) {
        animFrameIdRef.current = requestAnimationFrame(render);
        return;
      }

      ctx.clearRect(0, 0, width, height);

      phaseRef.current += dt * 0.7;
      const phase = phaseRef.current;

      if (isPlayingRef.current) {
        virtualPosRef.current = 25 + 22 * Math.sin(time * 0.0004);
      }

      const currentPos = virtualPosRef.current;
      const d_model = 512;

      // Reference Grid
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      const drawWave = (
        freqFactor: number,
        isCosine: boolean,
        strokeColor: string,
        fillColorStart: string,
        lineWidth: number,
        phaseSpeed: number,
        amplitude: number
      ) => {
        ctx.beginPath();
        const step = width < 400 ? 3 : 2;
        let firstX = 0;
        let firstY = 0;

        for (let x = 0; x <= width; x += step) {
          const tokenPos = (x / width) * 50;
          const trigVal = isCosine
            ? Math.cos(tokenPos * freqFactor + phase * phaseSpeed)
            : Math.sin(tokenPos * freqFactor + phase * phaseSpeed);

          const y = height / 2 + trigVal * amplitude;
          if (x === 0) {
            ctx.moveTo(x, y);
            firstX = x;
            firstY = y;
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = lineWidth;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.stroke();

        ctx.lineTo(width, height);
        ctx.lineTo(firstX, height);
        ctx.closePath();
        const grad = ctx.createLinearGradient(0, height / 2 - amplitude, 0, height);
        grad.addColorStop(0, fillColorStart);
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fill();
      };

      // 1. Low Frequency Sine (2i = 0, λ = 2π) - Primary Blue
      drawWave((1 / Math.pow(10000, 0 / d_model)) * 0.75, false, '#0071e3', 'rgba(0, 113, 227, 0.08)', 2.5, 0.5, height / 3.2);
      // 2. Medium Harmonic Sine (2i = 64, λ = 54π) - Radiant Teal
      drawWave((1 / Math.pow(10000, (2 * 32) / d_model)) * 0.45, false, '#00c7be', 'rgba(0, 199, 190, 0.06)', 1.8, -0.35, height / 3.8);
      // 3. High Frequency Cosine (2i = 128, λ = 1468π) - Vibrant Purple
      drawWave((1 / Math.pow(10000, (2 * 96) / d_model)) * 0.28, true, '#af52de', 'rgba(175, 82, 222, 0.06)', 2.0, 0.6, height / 3.4);

      // Active Token Laser Marker
      const indicatorX = (currentPos / 50) * width;

      ctx.beginPath();
      const laserGlow = ctx.createLinearGradient(indicatorX - 6, 0, indicatorX + 6, 0);
      laserGlow.addColorStop(0, 'rgba(255, 149, 0, 0)');
      laserGlow.addColorStop(0.5, 'rgba(255, 149, 0, 0.2)');
      laserGlow.addColorStop(1, 'rgba(255, 149, 0, 0)');
      ctx.fillStyle = laserGlow;
      ctx.fillRect(indicatorX - 6, 0, 12, height);

      ctx.beginPath();
      ctx.strokeStyle = '#ff9500';
      ctx.setLineDash([4, 3]);
      ctx.lineWidth = 1.8;
      ctx.moveTo(indicatorX, 0);
      ctx.lineTo(indicatorX, height);
      ctx.stroke();
      ctx.setLineDash([]);

      const yBlue = height / 2 + Math.sin(currentPos * (1 / Math.pow(10000, 0 / d_model)) * 0.75 + phase * 0.5) * (height / 3.2);
      const yPurple = height / 2 + Math.cos(currentPos * (1 / Math.pow(10000, (2 * 96) / d_model)) * 0.28 + phase * 0.6) * (height / 3.4);

      const drawBead = (x: number, y: number, color: string, glowColor: string) => {
        ctx.beginPath();
        const beadGlow = ctx.createRadialGradient(x, y, 1, x, y, 8);
        beadGlow.addColorStop(0, glowColor);
        beadGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = beadGlow;
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = color;
        ctx.arc(x, y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#ffffff';
        ctx.arc(x - 1, y - 1, 1, 0, Math.PI * 2);
        ctx.fill();
      };

      drawBead(indicatorX, yBlue, '#0071e3', 'rgba(0, 113, 227, 0.45)');
      drawBead(indicatorX, yPurple, '#af52de', 'rgba(175, 82, 222, 0.45)');

      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      isMounted = false;
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
    };
  }, []);

  const pe0 = Math.sin(position / Math.pow(10000, 0 / 512)).toFixed(3);
  const pe64 = Math.sin(position / Math.pow(10000, 64 / 512)).toFixed(3);

  return (
    <div
      ref={containerRef}
      className="w-full h-auto rounded-2xl bg-slate-50/70 border border-black/5 shadow-apple-xs p-2.5 sm:p-3 flex flex-col gap-2 font-sans gpu-layer"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 pb-1.5 gap-1.5">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-apple-text font-mono flex items-center gap-1.5">
            <span>Sinusoidal Positional Encoding</span>
            <span className="text-[9px] font-mono text-apple-blue bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
              <Activity className="w-2.5 h-2.5 animate-pulse" />
              Eq. 3 & 4
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs flex-wrap">
          <button
            onClick={toggleAutoPlay}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all shadow-apple-xs ${
              isPlaying
                ? 'bg-apple-blue text-white hover:bg-blue-600'
                : 'bg-slate-100 text-apple-secondary hover:text-apple-text hover:bg-slate-200'
            }`}
          >
            {isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 fill-current" />}
            <span>{isPlaying ? 'Auto-Sweep' : 'Play'}</span>
          </button>
          <button
            onClick={() => {
              setPosition(0);
              virtualPosRef.current = 0;
            }}
            className="p-1 rounded-full bg-black/5 text-apple-secondary hover:text-apple-text transition-all"
            title="Reset Position to 0"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Canvas Multi-Harmonic Wave Viewport */}
      <div className="relative w-full h-[105px] sm:h-[115px] rounded-xl bg-slate-50 border border-black/5 overflow-hidden shadow-inner flex items-center justify-center">
        <canvas
          ref={canvasRef}
          className="w-full h-full block cursor-crosshair"
        />

        {/* Floating Live Laser Readout Badge */}
        <div className="absolute top-2 right-2 bg-white/95 border border-black/10 rounded-xl px-2.5 py-1 text-[10px] font-mono text-apple-text shadow-apple-xs flex items-center gap-2">
          <span className="text-amber-600 font-bold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            pos = {isPlaying ? Math.round(virtualPosRef.current) : position}
          </span>
          <span className="text-apple-tertiary">|</span>
          <span className="text-apple-blue font-bold">PE₀ = {pe0}</span>
          <span className="text-purple-600 font-bold">PE₆₄ = {pe64}</span>
        </div>
      </div>

      {/* Interactive Position Slider & Dimension Harmonics */}
      <div className="space-y-2 pt-2 border-t border-black/5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-mono font-bold text-apple-secondary shrink-0">
              Token Position (pos):
            </span>
            <input
              type="range"
              min="0"
              max="50"
              value={isPlaying ? Math.round(virtualPosRef.current) : position}
              onPointerDown={() => {
                setIsPlaying(false);
                isPlayingRef.current = false;
              }}
              onTouchStart={() => {
                setIsPlaying(false);
                isPlayingRef.current = false;
              }}
              onChange={handleSliderChange}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-apple-blue"
            />
            <span className="text-xs font-mono font-bold text-apple-blue w-7 text-right">
              {isPlaying ? Math.round(virtualPosRef.current) : position}
            </span>
          </div>

          {/* Dimension Selector Pills */}
          <div className="hidden sm:flex items-center gap-1.5">
            {dimensions.map((d) => (
              <button
                key={d.dim}
                onClick={() => {
                  setIsPlaying(false);
                  isPlayingRef.current = false;
                  setSelectedDimension(d.dim);
                }}
                className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold transition-all ${
                  selectedDimension === d.dim
                    ? `${d.bg} shadow-apple-xs border border-black/10`
                    : 'bg-black/5 text-apple-secondary hover:text-apple-text'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Linear Transformation Explanation Bar */}
        <div className="p-2 rounded-xl bg-blue-50/80 border border-blue-200 text-[10px] sm:text-[11px] font-mono text-apple-text flex flex-wrap items-center justify-between gap-2 shadow-apple-xs">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <Sparkles className="w-3.5 h-3.5 text-apple-blue shrink-0" />
            <span className="leading-relaxed">
              <strong>Relative Offset Property:</strong> Linear transformation allows model to attend by relative shifts: <code className="text-apple-blue font-bold">PE_(pos+k) = R(ω_i·k)·PE_pos</code>
            </span>
          </div>
          <span className="text-[9px] bg-white text-apple-blue font-bold px-2 py-0.5 rounded border border-blue-200 shrink-0">
            d_model = 512
          </span>
        </div>
      </div>
    </div>
  );
};

export default PositionalEncoding;
