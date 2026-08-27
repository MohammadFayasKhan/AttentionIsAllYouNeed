/**
 * SequentialVsParallel.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Interactive simulation comparing sequential Recurrent (RNN / LSTM) processing against
 * parallel Self-Attention (Vaswani et al. 2017, Section 1 & 2).
 *
 * Visual Mechanics:
 *   1. Recurrent Bottleneck O(n):
 *      Words must be processed strictly one step at a time (t_1 -> t_2 -> ... -> t_n),
 *      waiting for hidden state h_(t-1). This creates an O(n) sequential barrier that
 *      prevents GPU parallelization across sequence lengths.
 *   2. Self-Attention Constant O(1) Time with Wavy Gradient Harmonic Mesh:
 *      All tokens are transformed simultaneously in a single parallel tensor operation,
 *      bathed in continuous multi-harmonic fluid gradient waves.
 *   3. Auto-Play Step Sequencer:
 *      Continuously advances the step counter with an interactive Play/Pause toggle and reset trigger.
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Zap, Clock, Sparkles } from 'lucide-react';

interface SequentialVsParallelProps {
  isActive?: boolean;
}

export const SequentialVsParallel: React.FC<SequentialVsParallelProps> = ({ isActive = true }) => {
  const [step, setStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const sequenceLength = 6;

  const tokens = ["The", "animal", "didn't", "cross", "the", "street"];

  // Auto-play step sequencer
  useEffect(() => {
    if (!isPlaying || !isActive) return;

    const interval = setInterval(() => {
      setStep((prev) => (prev + 1) % (sequenceLength + 1));
    }, 1100);

    return () => clearInterval(interval);
  }, [isPlaying, isActive, sequenceLength]);

  const currentToken = tokens[Math.min(step, tokens.length - 1)];

  return (
    <div
      className="w-full h-full min-h-[220px] p-3 sm:p-4 rounded-3xl backdrop-blur-2xl bg-white/85 border border-white/60 shadow-apple-md flex flex-col justify-between font-sans overflow-hidden"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-black/5 pb-1.5 flex-wrap gap-1.5 shrink-0">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-apple-text font-mono flex items-center gap-1.5">
            <span>Recurrence O(n) vs Self-Attention O(1)</span>
          </h3>
          <p className="text-[10px] sm:text-[11px] text-apple-secondary font-mono">
            Comparing sequential dependencies against parallel tensor computation
          </p>
        </div>

        <div className="flex items-center gap-1 font-mono text-xs">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 shadow-apple-xs text-[10px] transition-all ${
              isPlaying
                ? 'bg-apple-blue text-white hover:bg-blue-600'
                : 'bg-slate-100 text-apple-secondary hover:text-apple-text hover:bg-slate-200'
            }`}
          >
            {isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 fill-current" />}
            <span>{isPlaying ? 'Auto-Sweep' : 'Play'}</span>
          </button>
          <button
            onClick={() => setStep(0)}
            className="p-1 rounded-full bg-black/5 text-apple-secondary hover:text-apple-text transition-all"
            title="Reset to Step 0"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Side-by-Side Architectural Comparison Grid */}
      <div className="my-auto py-1.5 grid grid-cols-1 md:grid-cols-2 gap-2.5 font-mono flex-1 min-h-0">
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

          {/* Token Flow Visualization (Identical clean flex layout as right side - no truncation) */}
          <div className="py-1 relative z-10">
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
                    className={`px-1.5 sm:px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-sans font-bold border transition-all text-center flex-1 min-w-0 ${
                      isCurrent
                        ? 'bg-amber-400 text-amber-950 border-amber-500 shadow-apple-sm'
                        : isProcessed
                        ? 'bg-amber-200/90 text-amber-900 border-amber-300'
                        : 'bg-white/80 text-apple-tertiary border-black/5'
                    }`}
                  >
                    <span className="block whitespace-nowrap">{token}</span>
                    <span className="block text-[8px] opacity-75 font-mono font-normal">
                      t={idx + 1}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Sequential Status Readout (Clean and non-truncated) */}
          <div className="p-1.5 rounded-xl bg-amber-100/70 border border-amber-200/80 text-[9px] sm:text-[10px] text-amber-900 font-sans flex items-center justify-between gap-1 relative z-10 shadow-apple-xs">
            <span className="truncate">
              <strong>Step t={step < 6 ? step + 1 : 6}/6:</strong> {step < 6 ? `Waiting for h_${step} → "${currentToken}"` : 'Finished in 6 sequential steps'}
            </span>
            <span className="text-[8px] font-mono bg-white text-amber-800 font-bold px-1.5 py-0.5 rounded border border-amber-200 shrink-0">
              h_t = f(h_t-1, x_t)
            </span>
          </div>

          <p className="text-[9px] sm:text-[10px] text-apple-secondary font-sans leading-tight relative z-10">
            Must wait for hidden state <code className="text-amber-800 font-bold">h_(t-1)</code> before step <code className="text-amber-800 font-bold">t</code>. Prohibits parallel execution.
          </p>
        </div>

        {/* Self-Attention Parallel Box with Wavy Harmonic Gradient Effect */}
        <div className="p-2.5 sm:p-3 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-cyan-50/80 border border-blue-200/80 flex flex-col justify-between space-y-2 relative overflow-hidden shadow-apple-sm">
          {/* Animated Background Flowing Harmonic Wave Ribbon */}
          <div className="absolute inset-0 pointer-events-none opacity-40 overflow-hidden">
            <motion.svg
              viewBox="0 0 500 150"
              preserveAspectRatio="none"
              className="absolute inset-0 w-[200%] h-full"
              animate={{ x: [0, -250] }}
              transition={{ duration: 7, repeat: Infinity, ease: 'linear' }}
            >
              <defs>
                <linearGradient id="waveGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0071e3" stopOpacity="0.5" />
                  <stop offset="35%" stopColor="#38bdf8" stopOpacity="0.6" />
                  <stop offset="70%" stopColor="#818cf8" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#0071e3" stopOpacity="0.5" />
                </linearGradient>
                <linearGradient id="waveGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#c084fc" stopOpacity="0.4" />
                </linearGradient>
              </defs>

              <path
                d="M 0 75 Q 62.5 35, 125 75 T 250 75 T 375 75 T 500 75 T 625 75 T 750 75"
                fill="none"
                stroke="url(#waveGradient1)"
                strokeWidth="6"
                strokeLinecap="round"
              />
              <path
                d="M 0 75 Q 62.5 115, 125 75 T 250 75 T 375 75 T 500 75 T 625 75 T 750 75"
                fill="none"
                stroke="url(#waveGradient2)"
                strokeWidth="4"
                strokeDasharray="8 6"
              />
            </motion.svg>
          </div>

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

          {/* Token Flow Visualization with Continuous Wavy Gradient Flow */}
          <div className="py-1 relative z-10">
            <div className="flex items-center justify-between gap-1 w-full">
              {tokens.map((token, idx) => (
                <motion.div
                  key={idx}
                  animate={{
                    y: [0, -3, 0, 3, 0],
                    scale: [1, 1.03, 1]
                  }}
                  transition={{
                    duration: 3.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                    delay: idx * 0.25
                  }}
                  className="px-1.5 sm:px-2 py-1 rounded-xl text-[10px] sm:text-[11px] font-sans font-bold text-white shadow-apple-md text-center flex-1 min-w-0 relative overflow-hidden border border-white/40"
                  style={{
                    background: 'linear-gradient(135deg, #0071e3 0%, #38bdf8 45%, #6366f1 85%, #0071e3 100%)',
                    backgroundSize: '250% 250%'
                  }}
                >
                  {/* Subtle internal shimmer wave */}
                  <motion.div
                    animate={{ x: ['-100%', '200%'] }}
                    transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: idx * 0.2 }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 pointer-events-none"
                  />

                  <span className="relative z-10 drop-shadow-sm block whitespace-nowrap">{token}</span>
                  <span className="block text-[8px] opacity-90 font-mono font-normal relative z-10">
                    t=1
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Parallel Matrix Status Readout with Glowing Sparkle */}
          <div className="p-1.5 rounded-xl bg-white/80 border border-blue-200/80 text-[10px] text-blue-950 font-sans flex items-center justify-between gap-1 relative z-10 shadow-apple-xs backdrop-blur-md">
            <span className="truncate flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-apple-blue shrink-0 animate-pulse" />
              <strong>All 6 tokens processed at t=1:</strong> Full GPU tensor parallelization
            </span>
            <span className="text-[8px] font-mono bg-blue-50 text-apple-blue font-bold px-1.5 py-0.2 rounded border border-blue-200 shrink-0">
              softmax(QKᵀ / √d_k)V
            </span>
          </div>

          <p className="text-[9px] sm:text-[10px] text-apple-secondary font-sans leading-tight relative z-10">
            Connects all positions simultaneously in a single GPU matrix multiplication operation.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-black/5 pt-1 text-[9px] sm:text-[10px] font-mono text-apple-secondary flex items-center justify-between flex-wrap gap-1 shrink-0">
        <span>Vaswani et al. (2017) Section 1</span>
        <span className="text-apple-blue font-bold">Max Path Length: Recurrent O(n) ➔ Self-Attention O(1)</span>
      </div>
    </div>
  );
};

export default SequentialVsParallel;
