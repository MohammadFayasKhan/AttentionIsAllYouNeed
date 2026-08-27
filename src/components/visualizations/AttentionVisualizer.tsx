/**
 * AttentionVisualizer.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Scaled Dot-Product Attention Interactive Lab (Vaswani et al. 2017, Section 3.2.1, Eq. 1):
 *   Attention(Q, K, V) = softmax(QKᵀ / √d_k)V
 *
 * Responsive & Layout Optimizations:
 *   1. Natural Auto-Height Sizing:
 *      Uses `w-full h-auto` with flex column spacing (`gap-3`) so it never clips or overlaps surrounding text.
 *   2. Responsive Token Matrix & Attention Bars:
 *      The 11 tokens wrap cleanly on mobile, and the 11-column softmax bar distribution
 *      adapts dynamically from 320px mobile through large monitors.
 *   3. Hardware-Accelerated Animation:
 *      Uses GPU-friendly spring transitions for bar heights and active token indicators.
 */

import React, { useState, useEffect } from 'react';
import { oneeBridge } from '../../lib/oneeEvents';
import { motion } from 'framer-motion';
import { Play, Pause, Sparkles } from 'lucide-react';

export const AttentionVisualizer: React.FC = () => {
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(5); // "street" by default
  const [useScalingFactor, setUseScalingFactor] = useState<boolean>(true);
  const [temperature, setTemperature] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Linguistic test sentence from Section 3.2.1
  const tokens = ["The", "animal", "didn't", "cross", "the", "street", "because", "it", "was", "too", "tired"];

  // Attention weight distribution matrix (Rows: Queries, Cols: Keys)
  const attentionMatrix: number[][] = [
    [0.55, 0.20, 0.05, 0.05, 0.05, 0.03, 0.02, 0.02, 0.01, 0.01, 0.01],
    [0.10, 0.35, 0.05, 0.22, 0.03, 0.05, 0.05, 0.02, 0.03, 0.02, 0.08],
    [0.02, 0.08, 0.40, 0.30, 0.02, 0.03, 0.05, 0.02, 0.03, 0.02, 0.03],
    [0.03, 0.25, 0.15, 0.30, 0.02, 0.18, 0.02, 0.01, 0.01, 0.01, 0.02],
    [0.05, 0.03, 0.02, 0.05, 0.60, 0.20, 0.01, 0.01, 0.01, 0.01, 0.01],
    [0.02, 0.12, 0.03, 0.28, 0.05, 0.42, 0.02, 0.01, 0.01, 0.01, 0.03],
    [0.01, 0.05, 0.02, 0.05, 0.01, 0.02, 0.45, 0.15, 0.10, 0.05, 0.09],
    [0.02, 0.52, 0.02, 0.08, 0.01, 0.18, 0.05, 0.05, 0.02, 0.01, 0.04], // "it" attends strongly to "animal" (0.52) & "street" (0.18)
    [0.01, 0.08, 0.02, 0.05, 0.01, 0.02, 0.05, 0.12, 0.40, 0.10, 0.15],
    [0.01, 0.02, 0.01, 0.02, 0.01, 0.01, 0.02, 0.05, 0.10, 0.50, 0.25],
    [0.01, 0.28, 0.02, 0.05, 0.01, 0.02, 0.05, 0.08, 0.12, 0.15, 0.21]
  ];

  const rawWeights = attentionMatrix[selectedTokenIndex] || attentionMatrix[0];

  // Apply temperature scaling and scaling factor simulation
  const processedWeights = rawWeights.map((w) => {
    let weight = Math.pow(w, 1 / Math.max(0.1, temperature));
    if (!useScalingFactor) weight = Math.pow(w, 2.5);
    return Math.min(1, Math.max(0.04, weight));
  });

  // Auto-play interval sweep with tab visibility awareness
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setSelectedTokenIndex((prev) => (prev + 1) % tokens.length);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying, tokens.length]);

  const handleSelectToken = (idx: number) => {
    setIsPlaying(false);
    setSelectedTokenIndex(idx);
    const token = tokens[idx];
    if (idx === 7) {
      oneeBridge.emit('token_select', `“Token 'it' attends strongly to 'animal' and 'street' (Coreference resolution)!”`);
    } else if (idx === 1) {
      oneeBridge.emit('token_select', `“Token 'animal' links with verb 'cross' and state 'tired'!”`);
    } else {
      oneeBridge.emit('token_select', `“Querying attention weights for '${token}'!”`);
    }
  };

  const toggleAutoPlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleScalingToggle = (checked: boolean) => {
    setIsPlaying(false);
    setUseScalingFactor(checked);
    if (checked) {
      oneeBridge.emit('slider_change', `“Scaling by 1/√d_k (1/8) counters large dot products and stabilizes softmax gradients!”`);
    } else {
      oneeBridge.emit('slider_change', `“Without 1/√d_k scaling, large d_k dot products push softmax into vanishing gradient regions!”`);
    }
  };

  const handleTempChange = (val: number) => {
    setIsPlaying(false);
    setTemperature(val);
    if (val < 0.8) {
      oneeBridge.emit('slider_change', `“Low temp (T=${val.toFixed(1)}) sharpens attention onto highest scoring tokens!”`);
    } else if (val > 1.4) {
      oneeBridge.emit('slider_change', `“High temp (T=${val.toFixed(1)}) flattens softmax distribution across all tokens!”`);
    }
  };

  // Find top attended target token
  let maxTargetIdx = 0;
  let maxTargetVal = 0;
  processedWeights.forEach((w, idx) => {
    if (idx !== selectedTokenIndex && w > maxTargetVal) {
      maxTargetVal = w;
      maxTargetIdx = idx;
    }
  });

  return (
    <div className="w-full h-auto rounded-3xl bg-white/95 border border-black/10 shadow-apple-md p-4 sm:p-5 flex flex-col gap-3 font-sans gpu-layer">
      {/* Header & Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 pb-2.5 gap-2">
        <div>
          <h3 className="text-sm font-bold text-apple-text font-mono flex items-center gap-2">
            <span>Scaled Dot-Product Attention Lab</span>
            <span className="text-[10px] font-mono text-apple-blue bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-bold">
              Eq. 1
            </span>
          </h3>
          <p className="text-xs text-apple-secondary font-mono">
            Attention(Q, K, V) = softmax(QKᵀ / √d_k)V
          </p>
        </div>

        {/* Auto-Play & Scaling Controls */}
        <div className="flex items-center gap-2 text-xs font-mono flex-wrap">
          <button
            onClick={toggleAutoPlay}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold transition-all shadow-apple-xs ${
              isPlaying
                ? 'bg-apple-blue text-white hover:bg-blue-600'
                : 'bg-slate-100 text-apple-secondary hover:text-apple-text hover:bg-slate-200'
            }`}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{isPlaying ? 'Auto-Sweep Active' : 'Play Auto-Sweep'}</span>
          </button>

          <label className="flex items-center gap-1.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={useScalingFactor}
              onChange={(e) => handleScalingToggle(e.target.checked)}
              className="accent-apple-blue rounded cursor-pointer"
            />
            <span className={useScalingFactor ? 'text-apple-blue font-bold text-[11px]' : 'text-apple-secondary text-[11px]'}>
              Scale √d_k (d_k=64)
            </span>
          </label>
        </div>
      </div>

      {/* Interactive Tokens Matrix Stream */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 py-1">
        {tokens.map((token, idx) => {
          const isSelected = idx === selectedTokenIndex;
          const isTopTarget = !isSelected && idx === maxTargetIdx;

          return (
            <motion.button
              key={idx}
              onClick={() => handleSelectToken(idx)}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                scale: isSelected ? 1.05 : 1,
                borderColor: isSelected ? '#0071e3' : isTopTarget ? '#93c5fd' : 'rgba(0,0,0,0.08)'
              }}
              transition={{ duration: 0.2 }}
              className={`relative px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-mono transition-all border ${
                isSelected
                  ? 'bg-apple-blue text-white font-bold shadow-apple-md z-10'
                  : isTopTarget
                  ? 'bg-blue-50/90 text-apple-blue font-bold border-blue-200 shadow-apple-xs'
                  : 'bg-slate-50 border-black/5 text-apple-text hover:bg-black/5'
              }`}
            >
              {token}
              {isTopTarget && !isSelected && (
                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Dynamic Attention Weight Visualization Card */}
      <div className="p-3 rounded-2xl bg-slate-50 border border-black/5 space-y-2 shadow-apple-xs">
        <div className="flex items-center justify-between text-xs font-mono flex-wrap gap-1">
          <div className="flex items-center gap-2">
            <span className="text-apple-secondary text-[11px]">
              Query Token <span className="font-bold text-apple-text">q_{selectedTokenIndex}</span>:
            </span>
            <span className="px-2 py-0.5 rounded-lg bg-apple-blue text-white font-bold text-[11px] shadow-apple-xs">
              "{tokens[selectedTokenIndex]}"
            </span>
          </div>
          <span className="text-apple-tertiary text-[10px]">
            {useScalingFactor ? 'Scaled by √64 = 8 ➔ Stable Softmax' : 'Unscaled ➔ Extreme Vanishing Gradients'}
          </span>
        </div>

        {/* Bar Chart Viewport */}
        <div className="grid grid-cols-11 gap-1 h-8 sm:h-9 items-end pt-1">
          {processedWeights.map((w, idx) => {
            const isQuery = idx === selectedTokenIndex;
            const isTop = idx === maxTargetIdx;

            return (
              <div key={idx} className="flex flex-col items-center gap-0.5 h-full justify-end min-w-0">
                <motion.div
                  animate={{ height: `${Math.max(8, w * 100)}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`w-full rounded-t ${
                    isQuery
                      ? 'bg-apple-blue shadow-apple-xs'
                      : isTop
                      ? 'bg-blue-400'
                      : 'bg-blue-200/90'
                  }`}
                  title={`${tokens[idx]}: ${(w * 100).toFixed(0)}%`}
                />
              </div>
            );
          })}
        </div>

        {/* Token Sub-labels */}
        <div className="grid grid-cols-11 gap-0.5 text-[8px] sm:text-[9px] font-mono text-center text-apple-tertiary">
          {tokens.map((t, idx) => (
            <span
              key={idx}
              className={`truncate ${
                idx === selectedTokenIndex
                  ? 'text-apple-blue font-bold'
                  : idx === maxTargetIdx
                  ? 'text-blue-600 font-semibold'
                  : ''
              }`}
            >
              {t}
            </span>
          ))}
        </div>
      </div>

      {/* Temperature & Coreference Footer */}
      <div className="border-t border-black/5 pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs font-mono">
        <div className="flex items-center gap-2 text-[11px] shrink-0">
          <span className="text-apple-secondary">Temp (T): <strong>{temperature.toFixed(1)}</strong></span>
          <input
            type="range"
            min={0.2}
            max={2.0}
            step={0.1}
            value={temperature}
            onChange={(e) => handleTempChange(Number(e.target.value))}
            className="accent-apple-blue bg-black/10 rounded-lg cursor-pointer h-1.5 w-24"
          />
        </div>
        <div className="flex items-center gap-1.5 text-apple-blue font-bold text-[10px] sm:text-[11px] truncate">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">
            Primary: "{tokens[selectedTokenIndex]}" ➔ "{tokens[maxTargetIdx]}" ({(processedWeights[maxTargetIdx] * 100).toFixed(0)}%)
          </span>
        </div>
      </div>
    </div>
  );
};

export default AttentionVisualizer;
