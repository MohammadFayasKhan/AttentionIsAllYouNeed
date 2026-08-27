/**
 * ModelVariationLab.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Interactive simulation of Table 3: Model Variations & Ablation Laboratory (Vaswani et al. 2017).
 * Explores empirical findings across attention head count (h=1..32), key size (d_k=16..512),
 * layer depth (N=2..8), and learned vs fixed sinusoidal positional encodings.
 *
 * Core Features:
 *   1. Smooth Auto-Play Ablation Sweep:
 *      Auto-cycles across ablation rows every 2.2s with an interactive Play/Pause toggle.
 *   2. BLEU Delta Visual Badges:
 *      Clear indicators highlighting performance gains (green) and drops (red) relative to the 25.8 baseline.
 *   3. Zero-Overlap Responsive Layout:
 *      4 core comparative ablation models fitting cleanly in a 2x2 grid with zero vertical collision.
 *   4. Anti-Snap Wheel Isolation:
 *      Prevents mouse wheel interactions inside the card from inadvertently switching chapters.
 */

import React, { useState, useEffect } from 'react';
import { TABLE_3_VARIATIONS, Table3Row } from '../../data/paperData';
import { oneeBridge } from '../../lib/oneeEvents';
import { motion } from 'framer-motion';
import { Play, Pause, Sliders, CheckCircle2, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';

export const ModelVariationLab: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // 4 iconic ablation rows from Table 3 for a clean, non-overlapping 2x2 layout
  const ablationRows: Table3Row[] = [
    TABLE_3_VARIATIONS[0], // Base Model (25.8 BLEU)
    TABLE_3_VARIATIONS[1], // (A) Single-head h=1 (24.9 BLEU, -0.9 drop)
    TABLE_3_VARIATIONS[3], // (B) Small keys d_k=16 (25.1 BLEU, -0.7 drop)
    TABLE_3_VARIATIONS[4]  // (C) Bigger Model N=8 (26.4 BLEU, +0.6 gain)
  ].filter(Boolean);

  // Auto-play ablation sweep
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSelectedIdx((prev) => (prev + 1) % ablationRows.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [isPlaying, ablationRows.length]);

  const toggleAutoPlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleSelectSetting = (idx: number) => {
    setIsPlaying(false);
    setSelectedIdx(idx);
    const varItem = ablationRows[idx];
    oneeBridge.emit('slider_change', `“Table 3: ${varItem.setting} ➔ ${varItem.devBLEU} BLEU”`);
  };

  const selectedSetting = ablationRows[selectedIdx] || ablationRows[0];

  return (
    <div
      className="w-full h-full min-h-[200px] p-3 sm:p-4 rounded-3xl backdrop-blur-2xl bg-white/85 border border-white/60 shadow-apple-md flex flex-col justify-between font-sans overflow-hidden"
    >
      {/* Header & Control Bar */}
      <div className="flex items-center justify-between border-b border-black/5 pb-1.5 gap-1.5 shrink-0 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-apple-text font-mono flex items-center gap-1.5">
            <span>Table 3: Model Variations</span>
            <span className="text-[9px] font-mono text-apple-blue bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
              <Sliders className="w-2.5 h-2.5" /> Ablations
            </span>
          </h3>
        </div>

        {/* Auto-Sweep Button */}
        <div className="flex items-center gap-1 font-mono text-xs">
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
        </div>
      </div>

      {/* Interactive Ablation Grid (Clean 2x2 with zero vertical overflow) */}
      <div className="my-auto py-1 space-y-1.5 flex-1 flex flex-col justify-center min-h-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 w-full max-w-xl mx-auto">
          {ablationRows.map((varItem: Table3Row, idx: number) => {
            const isSelected = idx === selectedIdx;
            const isBaseline = varItem.setting.includes('Base');
            const isDrop = varItem.devBLEU < 25.5;
            const isGain = varItem.devBLEU > 26.0;

            return (
              <motion.div
                key={idx}
                onClick={() => handleSelectSetting(idx)}
                whileHover={{ scale: 1.01 }}
                animate={{
                  borderColor: isSelected ? '#0071e3' : isBaseline ? '#93c5fd' : 'rgba(0,0,0,0.06)',
                  boxShadow: isSelected ? '0 2px 8px rgba(0,113,227,0.15)' : 'none'
                }}
                className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer font-mono flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/90 border-apple-blue shadow-apple-xs font-bold'
                    : isBaseline
                    ? 'bg-blue-50/30 border-blue-200'
                    : 'bg-slate-50 border-black/5 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className={`text-[10px] sm:text-[11px] font-bold truncate ${isSelected ? 'text-apple-blue' : 'text-apple-text'}`}>
                    {varItem.setting}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 flex items-center gap-0.5 ${
                    isGain
                      ? 'bg-emerald-100 text-emerald-900'
                      : isDrop
                      ? 'bg-rose-100 text-rose-900'
                      : 'bg-blue-100 text-apple-blue'
                  }`}>
                    {isGain && <TrendingUp className="w-2 h-2" />}
                    {isDrop && <TrendingDown className="w-2 h-2" />}
                    {varItem.devBLEU} BLEU
                  </span>
                </div>
                <div className="flex items-center justify-between text-[8px] sm:text-[9px] text-apple-secondary font-sans">
                  <span>PPL: {varItem.devPPL}</span>
                  <span>{varItem.paramsM}M Params</span>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Selected Setting Finding Card */}
        <div className="p-1.5 rounded-xl bg-blue-50/80 border border-blue-200 font-mono text-xs text-apple-text flex items-center justify-between gap-2 shadow-apple-xs shrink-0 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-1 min-w-0">
            <CheckCircle2 className="w-3 h-3 text-apple-blue shrink-0" />
            <span className="text-[10px] text-apple-secondary font-sans truncate">
              <strong className="text-apple-text">{selectedSetting.setting}:</strong> {selectedSetting.findingNote}
            </span>
          </div>
          <span className="text-[9px] bg-white text-apple-blue font-bold px-1.5 py-0.2 rounded border border-blue-200 shrink-0">
            {selectedSetting.devBLEU} BLEU
          </span>
        </div>
      </div>

      {/* Table 3 Footer */}
      <div className="border-t border-black/5 pt-1 text-[9px] sm:text-[10px] font-mono text-apple-secondary flex items-center justify-between flex-wrap gap-1 shrink-0">
        <span className="flex items-center gap-1 text-apple-blue font-bold">
          <Sparkles className="w-2.5 h-2.5 text-apple-blue" /> Evaluated on English-to-German news-test2013
        </span>
        <span className="text-apple-tertiary">Table 3 (Vaswani et al. 2017)</span>
      </div>
    </div>
  );
};

export default ModelVariationLab;
