/**
 * AttentionVisualizer.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Interactive simulation of Scaled Dot-Product Attention:
 *   Attention(Q, K, V) = softmax(QKᵀ / √d_k) V
 *
 * Features:
 *   1. Full 11x11 Attention Matrix:
 *      Authentic simulated attention distributions across the entire Winograd-style sequence:
 *      "The animal didn't cross the street because it was too tired".
 *   2. Smooth Auto-Play Token Sweep:
 *      Automatically sweeps through each token one-by-one with smooth 1.8s timing,
 *      allowing visual inspection of how queries attend to keys across the sentence.
 *   3. Manual Interaction & Override:
 *      Tapping any word token pauses or jumps to that word immediately.
 *   4. Scaling & Temperature Controls:
 *      Toggle 1/√d_k scaling (d_k=64) to visualize gradient stabilization vs vanishing gradients,
 *      and adjust softmax temperature T ∈ [0.2, 2.0].
 */

import React, { useState, useEffect, useRef } from 'react';
import { oneeBridge } from '../../lib/oneeEvents';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Sparkles } from 'lucide-react';

export const AttentionVisualizer: React.FC = () => {
  const [selectedTokenIndex, setSelectedTokenIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [temperature, setTemperature] = useState<number>(1.0);
  const [useScalingFactor, setUseScalingFactor] = useState<boolean>(true);

  const tokens = ["The", "animal", "didn't", "cross", "the", "street", "because", "it", "was", "too", "tired"];

  // Full Grounded Attention Matrix for all 11 tokens
  const attentionWeightsMap: Record<number, number[]> = {
    0: [0.70, 0.85, 0.05, 0.10, 0.02, 0.05, 0.01, 0.02, 0.02, 0.01, 0.02], // The -> animal
    1: [0.08, 1.00, 0.12, 0.55, 0.04, 0.42, 0.08, 0.35, 0.05, 0.04, 0.65], // animal -> cross, street, tired
    2: [0.02, 0.40, 1.00, 0.80, 0.02, 0.15, 0.10, 0.12, 0.05, 0.02, 0.10], // didn't -> cross
    3: [0.05, 0.70, 0.45, 1.00, 0.08, 0.82, 0.15, 0.20, 0.04, 0.02, 0.30], // cross -> animal, street
    4: [0.02, 0.05, 0.02, 0.10, 0.75, 0.90, 0.01, 0.02, 0.01, 0.01, 0.02], // the -> street
    5: [0.05, 0.45, 0.08, 0.75, 0.15, 1.00, 0.05, 0.10, 0.02, 0.01, 0.08], // street -> cross, animal
    6: [0.02, 0.30, 0.15, 0.40, 0.02, 0.20, 1.00, 0.55, 0.10, 0.15, 0.70], // because -> tired, cross
    7: [0.02, 0.88, 0.05, 0.15, 0.04, 0.62, 0.08, 1.00, 0.12, 0.08, 0.40], // it -> animal (88%), street (62%) [Coreference]
    8: [0.01, 0.25, 0.02, 0.08, 0.01, 0.05, 0.10, 0.70, 1.00, 0.30, 0.85], // was -> tired, it
    9: [0.01, 0.08, 0.01, 0.04, 0.01, 0.02, 0.05, 0.15, 0.10, 0.80, 1.00], // too -> tired
    10: [0.05, 0.75, 0.04, 0.30, 0.02, 0.15, 0.20, 0.65, 0.35, 0.55, 1.00]  // tired -> animal, it
  };

  const baseWeights = attentionWeightsMap[selectedTokenIndex] || attentionWeightsMap[0];

  // Softmax simulation with temperature and 1/√d_k scaling
  const processedWeights = baseWeights.map((w) => {
    let weight = w / temperature;
    if (!useScalingFactor) weight = Math.pow(w, 2.5); // vanishing gradient simulation without 1/√d_k
    return Math.min(1, Math.max(0.04, weight));
  });

  // Auto-play interval sweep
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSelectedTokenIndex((prev) => (prev + 1) % tokens.length);
    }, 1900);

    return () => clearInterval(interval);
  }, [isPlaying, tokens.length]);

  const handleSelectToken = (idx: number) => {
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
    setUseScalingFactor(checked);
    if (checked) {
      oneeBridge.emit('slider_change', `“Scaling by 1/√d_k (1/8) counters large dot products and stabilizes softmax gradients!”`);
    } else {
      oneeBridge.emit('slider_change', `“Without 1/√d_k scaling, large d_k dot products push softmax into vanishing gradient regions!”`);
    }
  };

  const handleTempChange = (val: number) => {
    setTemperature(val);
    if (val < 0.8) {
      oneeBridge.emit('slider_change', `“Low temp (T=${val.toFixed(1)}) sharpens attention onto the highest scoring tokens!”`);
    } else if (val > 1.4) {
      oneeBridge.emit('slider_change', `“High temp (T=${val.toFixed(1)}) flattens the softmax distribution across all tokens!”`);
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
    <div
      className="w-full h-full min-h-[220px] p-4 sm:p-5 rounded-3xl backdrop-blur-2xl bg-white/85 border border-white/60 shadow-apple-md flex flex-col justify-between font-sans overflow-hidden"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 pb-2.5 gap-2 shrink-0">
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
          {/* Auto-Play Sweep Button */}
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

          <label className="flex items-center gap-1.5 cursor-pointer select-none ml-1">
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

      {/* Interactive Tokens Stream with Active Auto-Sweep Highlight */}
      <div className="my-auto py-2 space-y-3">
        <div className="flex flex-wrap items-center justify-center gap-1.5">
          {tokens.map((token, idx) => {
            const isSelected = idx === selectedTokenIndex;
            const weight = processedWeights[idx];
            const isTopTarget = !isSelected && idx === maxTargetIdx;

            return (
              <motion.button
                key={idx}
                onClick={() => {
                  handleSelectToken(idx);
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.95 }}
                animate={{
                  scale: isSelected ? 1.05 : 1,
                  borderColor: isSelected ? '#0071e3' : isTopTarget ? '#93c5fd' : 'rgba(0,0,0,0.06)'
                }}
                transition={{ duration: 0.25 }}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-mono transition-all border ${
                  isSelected
                    ? 'bg-apple-blue text-white font-bold shadow-apple-md z-10'
                    : isTopTarget
                    ? 'bg-blue-50/80 text-apple-blue font-bold border-blue-200 shadow-apple-xs'
                    : 'bg-slate-50 border-black/5 text-apple-text hover:bg-black/5'
                }`}
              >
                {token}
                {isTopTarget && !isSelected && (
                  <span className="absolute -top-1.5 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Dynamic Attention Weight Visualization Bar */}
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

          <div className="grid grid-cols-11 gap-1 h-7 items-end">
            {processedWeights.map((w, idx) => {
              const isQuery = idx === selectedTokenIndex;
              const isTop = idx === maxTargetIdx;

              return (
                <div key={idx} className="flex flex-col items-center gap-0.5 h-full justify-end">
                  <motion.div
                    animate={{ height: `${w * 100}%` }}
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
          <div className="grid grid-cols-11 gap-1 text-[9px] font-mono text-center text-apple-tertiary">
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
      </div>

      {/* Temperature & Coreference Footer */}
      <div className="border-t border-black/5 pt-2 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs font-mono shrink-0">
        <div className="flex items-center gap-2 w-full sm:w-auto text-[11px]">
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
        <div className="flex items-center gap-1.5 text-apple-blue font-bold text-[11px]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            Primary Attention: "{tokens[selectedTokenIndex]}" ➔ "{tokens[maxTargetIdx]}" ({(processedWeights[maxTargetIdx] * 100).toFixed(0)}%)
          </span>
        </div>
      </div>
    </div>
  );
};

export default AttentionVisualizer;
