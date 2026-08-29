/**
 * ModelVariationLab.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Interactive Table 3: Variations on the Transformer Architecture (Vaswani et al. 2017, Table 3 & Section 5.3):
 *   - Attention heads ablation (h=1 vs h=8 vs h=16).
 *   - Key dimensionality d_k and d_v variations.
 *   - Model size & dropout variations.
 *
 * Layout & Content Protection:
 *   - Centered container with auto-height and full setting names.
 */

import React, { useState, useEffect } from 'react';
import { TABLE_3_VARIATIONS, Table3Row } from '../../data/paperData';
import { oneeBridge } from '../../lib/oneeEvents';
import { Sliders, CheckCircle2, TrendingUp, TrendingDown, Play, Pause, Sparkles } from 'lucide-react';

export const ModelVariationLab: React.FC = () => {
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const ablationRows: Table3Row[] = [
    TABLE_3_VARIATIONS[0], // (A) Base Model Baseline (25.8 BLEU)
    TABLE_3_VARIATIONS[1], // (A) Single Head h=1 (24.9 BLEU, -0.9 drop)
    TABLE_3_VARIATIONS[2], // (A) Too Many Heads h=16 (25.8 BLEU, -0.4 drop)
    TABLE_3_VARIATIONS[4]  // (C) Bigger Model N=8 (26.4 BLEU, +0.6 gain)
  ].filter(Boolean);

  // Auto-play ablation sweep with tab visibility awareness
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setSelectedIdx((prev) => (prev + 1) % ablationRows.length);
      }
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
    <div className="w-full max-w-2xl mx-auto h-auto rounded-2xl bg-slate-50/80 border border-black/5 shadow-apple-xs p-2.5 sm:p-3 flex flex-col gap-2 font-sans gpu-layer self-center">
      {/* Header & Control Bar */}
      <div className="flex items-center justify-between border-b border-black/5 pb-1.5 gap-1.5 flex-wrap">
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
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all shadow-apple-xs focus-visible:ring-2 focus-visible:ring-apple-blue ${
              isPlaying
                ? 'bg-apple-blue text-white hover:bg-blue-600'
                : 'bg-slate-100 text-apple-secondary hover:text-apple-text hover:bg-slate-200'
            }`}
            aria-label="Toggle auto-sweep"
          >
            {isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 fill-current" />}
            <span>{isPlaying ? 'Auto-Sweep' : 'Play'}</span>
          </button>
        </div>
      </div>

      {/* Interactive Ablation Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
        {ablationRows.map((varItem: Table3Row, idx: number) => {
          const isSelected = idx === selectedIdx;
          const isBaseline = varItem.setting.includes('Base');
          const isDrop = varItem.devBLEU < 25.5;
          const isGain = varItem.devBLEU > 26.0;

          return (
            <div
              key={idx}
              onClick={() => handleSelectSetting(idx)}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer font-mono flex flex-col justify-between ${
                isSelected
                  ? 'bg-blue-50/90 border-apple-blue shadow-apple-xs font-bold'
                  : isBaseline
                  ? 'bg-blue-50/30 border-blue-200'
                  : 'bg-white border-black/5 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className={`text-[10px] sm:text-[11px] font-bold ${isSelected ? 'text-apple-blue' : 'text-apple-text'}`}>
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
            </div>
          );
        })}
      </div>

      {/* Selected Setting Finding Card */}
      <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 font-mono text-xs text-apple-text flex flex-wrap items-center justify-between gap-2 shadow-apple-xs w-full">
        <div className="flex items-center gap-1.5 min-w-0 flex-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-apple-blue shrink-0" />
          <span className="text-[10px] sm:text-[11px] text-apple-secondary font-sans leading-relaxed">
            <strong className="text-apple-text">{selectedSetting.setting}:</strong> {selectedSetting.findingNote}
          </span>
        </div>
        <span className="text-[9px] bg-white text-apple-blue font-bold px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
          {selectedSetting.devBLEU} BLEU
        </span>
      </div>

      {/* Table 3 Footer */}
      <div className="border-t border-black/5 pt-2 text-[9px] sm:text-[10px] font-mono text-apple-secondary flex items-center justify-between flex-wrap gap-1">
        <span className="flex items-center gap-1 text-apple-blue font-bold">
          <Sparkles className="w-2.5 h-2.5 text-apple-blue" /> Evaluated on English-to-German news-test2013
        </span>
        <span className="text-apple-tertiary">Table 3 (Vaswani et al. 2017)</span>
      </div>
    </div>
  );
};

export default ModelVariationLab;
