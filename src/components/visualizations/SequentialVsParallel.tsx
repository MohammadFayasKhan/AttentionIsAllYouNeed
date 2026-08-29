/**
 * SequentialVsParallel.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Compares O(n) sequential recurrent dependencies (RNN/LSTM) against O(1) parallel tensor
 * computation of the Transformer Self-Attention mechanism (Vaswani et al. 2017, Section 1).
 *
 * Layout & Content Protection:
 *   - Centered container with auto-height and responsive comparison boxes.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Zap, Play, Pause, RotateCcw, Sparkles } from 'lucide-react';

interface SequentialVsParallelProps {
  isActive?: boolean;
}

export const SequentialVsParallel: React.FC<SequentialVsParallelProps> = ({ isActive = true }) => {
  const [step, setStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const sequenceLength = 6;

  const tokens = ["The", "animal", "didn't", "cross", "the", "street"];

  // Auto-play step sequencer with tab visibility awareness
  useEffect(() => {
    if (!isPlaying || !isActive) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setStep((prev) => (prev + 1) % (sequenceLength + 1));
      }
    }, 1100);

    return () => clearInterval(interval);
  }, [isPlaying, isActive, sequenceLength]);

  const currentToken = tokens[Math.min(step, tokens.length - 1)];

  return (
    <div className="w-full max-w-2xl mx-auto h-auto rounded-2xl bg-slate-50/80 border border-black/5 shadow-apple-xs p-2.5 sm:p-3 flex flex-col gap-2 font-sans gpu-layer self-center">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-black/5 pb-1.5 flex-wrap gap-1.5">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-apple-text font-mono flex items-center gap-1.5">
            <span>Recurrence O(n) vs Self-Attention O(1)</span>
          </h3>
        </div>

        <div className="flex items-center gap-1 font-mono text-xs">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-apple-xs text-[10px] transition-all focus-visible:ring-2 focus-visible:ring-apple-blue ${
              isPlaying
                ? 'bg-apple-blue text-white hover:bg-blue-600'
                : 'bg-slate-100 text-apple-secondary hover:text-apple-text hover:bg-slate-200'
            }`}
            aria-label="Toggle playback"
          >
            {isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 fill-current" />}
            <span>{isPlaying ? 'Auto-Sweep' : 'Play'}</span>
          </button>
          <button
            onClick={() => setStep(0)}
            className="p-1 rounded-full bg-black/5 text-apple-secondary hover:text-apple-text transition-all focus-visible:ring-2 focus-visible:ring-apple-blue"
            title="Reset to Step 0"
            aria-label="Reset step"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Side-by-Side Architectural Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono w-full">
        {/* Recurrent RNN Box */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80 flex flex-col justify-between space-y-2 relative overflow-hidden">
          {/* Box Header */}
          <div className="flex items-center justify-between text-xs relative z-10">
            <span className="font-bold text-amber-900 text-[11px] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Recurrent (RNN / LSTM)</span>
            </span>
            <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-200">
              O(n) Sequential
            </span>
          </div>

          {/* Token Flow Visualization */}
          <div className="py-2 relative z-10">
            <div className="flex items-center justify-between gap-1 w-full">
              {tokens.map((token, idx) => {
                const isProcessed = idx < step;
                const isCurrent = idx === step;

                return (
                  <motion.div
                    key={idx}
                    animate={{
                      scale: isCurrent ? 1.05 : 1,
                      opacity: isProcessed || isCurrent ? 1 : 0.35
                    }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className={`px-1 sm:px-2 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-sans font-bold border transition-all text-center flex-1 min-w-0 ${
                      isCurrent
                        ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-apple-sm'
                        : isProcessed
                        ? 'bg-amber-200/90 text-amber-900 border-amber-300'
                        : 'bg-white/80 text-apple-tertiary border-black/5'
                    }`}
                  >
                    <span className="block font-bold">{token}</span>
                    <span className="block text-[8px] opacity-75 font-mono font-normal">
                      t={idx + 1}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Sequential Status Readout */}
          <div className="p-2 rounded-xl bg-amber-100/70 border border-amber-200/80 text-[10px] sm:text-[11px] text-amber-900 font-sans flex flex-wrap items-center justify-between gap-1.5 relative z-10 shadow-apple-xs">
            <span className="leading-snug">
              <strong>Step t={step < 6 ? step + 1 : 6}/6:</strong> {step < 6 ? `Waiting for h_${step} → "${currentToken}"` : 'Finished in 6 sequential steps'}
            </span>
            <span className="text-[9px] font-mono bg-white text-amber-800 font-bold px-2 py-0.5 rounded border border-amber-200 shrink-0">
              h_t = f(h_t-1, x_t)
            </span>
          </div>

          <p className="text-[10px] sm:text-[11px] text-apple-secondary font-sans leading-relaxed relative z-10">
            Must wait for hidden state <code className="text-amber-800 font-bold">h_(t-1)</code> before step <code className="text-amber-800 font-bold">t</code>. Prohibits parallel execution.
          </p>
        </div>

        {/* Self-Attention Parallel Box */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-cyan-50/80 border border-blue-200/80 flex flex-col justify-between space-y-2 relative overflow-hidden shadow-apple-sm">
          {/* Box Header */}
          <div className="flex items-center justify-between text-xs relative z-10">
            <span className="font-bold text-apple-blue text-[11px] flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 text-apple-blue" />
              <span>Self-Attention</span>
            </span>
            <span className="text-[9px] bg-blue-100/90 text-apple-blue font-bold px-2 py-0.5 rounded-full border border-blue-200 shadow-apple-xs">
              O(1) Parallel
            </span>
          </div>

          {/* Token Flow Visualization */}
          <div className="py-2 relative z-10">
            <div className="flex items-center justify-between gap-1 w-full">
              {tokens.map((token, idx) => (
                <div
                  key={idx}
                  className="px-1 sm:px-2 py-1 sm:py-1.5 rounded-xl text-[10px] sm:text-[11px] font-sans font-bold text-white shadow-apple-md text-center flex-1 min-w-0 relative overflow-hidden border border-white/40 bg-gradient-to-br from-blue-600 via-sky-500 to-indigo-600"
                >
                  <span className="relative z-10 drop-shadow-sm block">{token}</span>
                  <span className="block text-[8px] opacity-90 font-mono font-normal relative z-10">
                    t=1
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Parallel Matrix Status Readout */}
          <div className="p-2 rounded-xl bg-white/90 border border-blue-200/80 text-[10px] sm:text-[11px] text-blue-950 font-sans flex flex-wrap items-center justify-between gap-1.5 relative z-10 shadow-apple-xs">
            <span className="flex items-center gap-1.5 leading-snug flex-wrap">
              <Sparkles className="w-3.5 h-3.5 text-apple-blue shrink-0 animate-pulse" />
              <strong>All 6 tokens processed at t=1:</strong>
              <span>GPU parallelization</span>
            </span>
            <span className="text-[9px] font-mono bg-blue-50 text-apple-blue font-bold px-2 py-0.5 rounded border border-blue-200 shrink-0">
              softmax(QKᵀ / √d_k)V
            </span>
          </div>

          <p className="text-[10px] sm:text-[11px] text-apple-secondary font-sans leading-relaxed relative z-10">
            Connects all positions simultaneously in a single GPU matrix multiplication operation.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-black/5 pt-2 text-[9px] sm:text-[10px] font-mono text-apple-secondary flex items-center justify-between flex-wrap gap-1">
        <span>Vaswani et al. (2017) Section 1</span>
        <span className="text-apple-blue font-bold">Max Path Length: Recurrent O(n) ➔ Self-Attention O(1)</span>
      </div>
    </div>
  );
};

export default SequentialVsParallel;
