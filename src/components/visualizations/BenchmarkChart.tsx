/**
 * BenchmarkChart.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Interactive simulation of Table 2: WMT 2014 Translation Benchmarks (Vaswani et al. 2017).
 * Compares English-to-German (EN-DE) and English-to-French (EN-FR) BLEU scores against
 * computational training costs (FLOPs) across prior state-of-the-art architectures.
 *
 * Core Features:
 *   1. Smooth Auto-Play Model Sweep:
 *      Auto-cycles across all benchmark rows every 2.1s with an interactive Play/Pause toggle.
 *   2. Animated Relative BLEU Bars:
 *      Visual comparative bars highlighting the Transformer Big model's 28.4 BLEU breakthrough.
 *   3. Training Cost Efficiency Gauge:
 *      Demonstrates an order-of-magnitude reduction in FLOPs (3.5 GPU days vs months).
 *   4. Zero-Overlap Responsive Layout:
 *      4 curated landmark models fitting naturally into the available vertical viewport
 *      with strict anti-overlap margins and no-snap wheel isolation.
 */

import React, { useState, useEffect } from 'react';
import { TABLE_2_TRANSLATION, Table2Row } from '../../data/paperData';
import { oneeBridge } from '../../lib/oneeEvents';
import { motion } from 'framer-motion';
import { Play, Pause, Award, Zap, Sparkles } from 'lucide-react';

export const BenchmarkChart: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0); // Default to Transformer (big)
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Filter to 4 primary comparative models for a clean, non-overlapping viewport
  const benchmarkModels: Table2Row[] = [
    TABLE_2_TRANSLATION[0], // Transformer (big)
    TABLE_2_TRANSLATION[1], // Transformer (base)
    TABLE_2_TRANSLATION[4], // GNMT + RL
    TABLE_2_TRANSLATION[5]  // ConvS2S
  ].filter(Boolean);

  // Auto-play model sweep
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSelectedIdx((prev) => (prev + 1) % benchmarkModels.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [isPlaying, benchmarkModels.length]);

  const toggleAutoPlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleSelectModel = (idx: number) => {
    setIsPlaying(false);
    setSelectedIdx(idx);
    const item = benchmarkModels[idx];
    if (item.isTransformer) {
      oneeBridge.emit('slider_change', `“${item.model}: State-of-the-art ${item.bleuEnDe} BLEU in only ${item.trainingTime}!”`);
    } else {
      oneeBridge.emit('slider_change', `“${item.model}: Baseline BLEU ${item.bleuEnDe || 'N/A'} at high FLOP cost.”`);
    }
  };

  const activeModel = benchmarkModels[selectedIdx] || benchmarkModels[0];

  return (
    <div
      className="w-full h-full min-h-[200px] p-3 sm:p-4 rounded-3xl backdrop-blur-2xl bg-white/85 border border-white/60 shadow-apple-md flex flex-col justify-between font-sans overflow-hidden"
    >
      {/* Header & Control Bar */}
      <div className="flex items-center justify-between border-b border-black/5 pb-1.5 gap-1.5 shrink-0 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-apple-text font-mono flex items-center gap-1.5">
            <span>Table 2: WMT 2014 Benchmarks</span>
            <span className="text-[9px] font-mono text-apple-emerald bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
              <Award className="w-2.5 h-2.5" /> SOTA
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

      {/* Interactive Models Benchmark Ladder */}
      <div className="my-auto py-1 space-y-1.5 flex-1 flex flex-col justify-center min-h-0">
        <div className="flex flex-col gap-1 w-full max-w-xl mx-auto">
          {benchmarkModels.map((item: Table2Row, idx: number) => {
            const isSelected = idx === selectedIdx;
            const bleuScore = item.bleuEnDe || 23.0;
            const barWidthPercent = ((bleuScore - 20) / (28.4 - 20)) * 100;

            return (
              <motion.div
                key={idx}
                onClick={() => handleSelectModel(idx)}
                whileHover={{ scale: 1.01 }}
                animate={{
                  borderColor: isSelected ? '#0071e3' : item.isTransformer ? '#93c5fd' : 'rgba(0,0,0,0.06)',
                  boxShadow: isSelected ? '0 2px 8px rgba(0,113,227,0.15)' : 'none'
                }}
                className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer font-mono flex items-center justify-between gap-2 ${
                  isSelected
                    ? 'bg-blue-50/90 border-apple-blue shadow-apple-xs font-bold'
                    : item.isTransformer
                    ? 'bg-blue-50/30 border-blue-200'
                    : 'bg-slate-50 border-black/5 hover:bg-slate-100'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] sm:text-[11px] font-bold truncate ${item.isTransformer ? 'text-apple-blue' : 'text-apple-text'}`}>
                      {item.model}
                    </span>
                    {item.isTransformer && (
                      <span className="text-[8px] bg-blue-100 text-apple-blue font-bold px-1.5 py-0.2 rounded uppercase">
                        Vaswani
                      </span>
                    )}
                  </div>

                  {/* Relative BLEU Bar */}
                  <div className="w-full bg-black/5 h-1 rounded-full overflow-hidden mt-0.5 max-w-[180px]">
                    <motion.div
                      animate={{ width: `${Math.min(100, Math.max(10, barWidthPercent))}%` }}
                      transition={{ duration: 0.3 }}
                      className={`h-full rounded-full ${
                        item.isTransformer ? 'bg-apple-blue' : 'bg-slate-400'
                      }`}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2.5 text-right shrink-0">
                  <div>
                    <span className="text-[7px] text-apple-tertiary block font-sans uppercase">EN-DE BLEU</span>
                    <span className={`text-[11px] sm:text-xs font-bold ${item.isTransformer ? 'text-apple-emerald font-extrabold' : 'text-apple-text'}`}>
                      {item.bleuEnDe ? item.bleuEnDe.toFixed(1) : 'N/A'}
                    </span>
                  </div>
                  <div className="hidden sm:block">
                    <span className="text-[7px] text-apple-tertiary block font-sans uppercase">FLOPs</span>
                    <span className="text-[9px] sm:text-[10px] text-apple-purple font-bold">
                      {item.trainingCostFlops}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Selected Benchmark Detail Callout */}
        <div className="p-1.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs font-mono text-apple-text flex items-center justify-between gap-2 shadow-apple-xs shrink-0 max-w-xl mx-auto w-full">
          <div className="flex items-center gap-1 min-w-0">
            <Zap className="w-3 h-3 text-amber-500 shrink-0" />
            <span className="text-[10px] text-apple-secondary font-sans truncate">
              <strong className="text-apple-text">{activeModel.model}:</strong> {activeModel.gpus ? `${activeModel.gpus} (${activeModel.trainingTime})` : 'Recurrent Baseline Model'}
            </span>
          </div>
          <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-200 shrink-0">
            {activeModel.bleuEnDe ? `${activeModel.bleuEnDe} BLEU` : 'Baseline'}
          </span>
        </div>
      </div>

      {/* Benchmark Efficiency Footer */}
      <div className="border-t border-black/5 pt-1 text-[9px] sm:text-[10px] font-mono text-apple-secondary flex items-center justify-between flex-wrap gap-1 shrink-0">
        <span className="flex items-center gap-1 text-apple-emerald font-bold">
          <Sparkles className="w-2.5 h-2.5 text-emerald-600" /> Base: 12h on 8 P100 GPUs (3.3×10¹⁸ FLOPs)
        </span>
        <span className="text-apple-tertiary">Table 2 (Vaswani et al. 2017)</span>
      </div>
    </div>
  );
};

export default BenchmarkChart;
