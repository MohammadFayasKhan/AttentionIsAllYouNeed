/**
 * ComplexityComparison.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Interactive simulation of Table 1: Layer Complexity Comparison (Vaswani et al. 2017).
 * Compares asymptotic computational complexity per layer, minimum sequential operations,
 * and maximum path lengths across Self-Attention, Recurrent, Convolutional, and
 * Restricted Self-Attention layers.
 *
 * Core Features:
 *   1. Smooth Auto-Play Metric Sweep:
 *      Auto-cycles across Complexity / Layer, Sequential Operations, and Maximum Path Length
 *      every 2.2 seconds with a smooth Play/Pause toggle.
 *   2. Asymptotic Tradeoff Highlighting:
 *      Illustrates why Self-Attention achieves constant O(1) sequential operations, eliminating
 *      the O(n) recurrence bottleneck of RNNs.
 *   3. Zero-Overlap Responsive Layout:
 *      Streamlined header toolbar and compact 2x2 grid ensuring no visual collisions on any screen.
 */

import React, { useState, useEffect } from 'react';
import { TABLE_1_COMPLEXITY } from '../../data/paperData';
import { oneeBridge } from '../../lib/oneeEvents';
import { motion } from 'framer-motion';
import { Play, Pause, Sparkles } from 'lucide-react';

export const ComplexityComparison: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'complexity' | 'sequential' | 'path'>('complexity');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [selectedRowIdx, setSelectedRowIdx] = useState<number>(0);

  const metrics: { id: 'complexity' | 'sequential' | 'path'; label: string }[] = [
    { id: 'complexity', label: 'Complexity' },
    { id: 'sequential', label: 'Sequential' },
    { id: 'path', label: 'Max Path' }
  ];

  // Auto-play metric cycle
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setSelectedMetric((prev) => {
        if (prev === 'complexity') return 'sequential';
        if (prev === 'sequential') return 'path';
        return 'complexity';
      });
      setSelectedRowIdx((prev) => (prev + 1) % TABLE_1_COMPLEXITY.length);
    }, 2200);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const toggleAutoPlay = () => {
    setIsPlaying((prev) => !prev);
  };

  const handleMetricClick = (m: 'complexity' | 'sequential' | 'path') => {
    setSelectedMetric(m);
    oneeBridge.emit('slider_change', `“Comparing Table 1 across ${m.toUpperCase()} metric!”`);
  };

  const activeRow = TABLE_1_COMPLEXITY[selectedRowIdx];

  return (
    <div
      className="w-full h-full min-h-[200px] p-3 sm:p-4 rounded-3xl backdrop-blur-2xl bg-white/85 border border-white/60 shadow-apple-md flex flex-col justify-between font-sans overflow-hidden"
    >
      {/* Header & Control Bar */}
      <div className="flex items-center justify-between border-b border-black/5 pb-1.5 gap-1.5 shrink-0 flex-wrap">
        <div className="min-w-0">
          <h3 className="text-xs sm:text-sm font-bold text-apple-text font-mono flex items-center gap-1.5">
            <span>Table 1: Layer Complexity</span>
            <span className="text-[9px] font-mono text-apple-blue bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded-full font-bold">
              Tradeoffs
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-1 font-mono text-xs flex-wrap">
          {/* Auto-Play Sweep Button */}
          <button
            onClick={toggleAutoPlay}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all shadow-apple-xs ${
              isPlaying
                ? 'bg-apple-blue text-white hover:bg-blue-600'
                : 'bg-slate-100 text-apple-secondary hover:text-apple-text hover:bg-slate-200'
            }`}
          >
            {isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 fill-current" />}
            <span>{isPlaying ? 'Auto-Sweep' : 'Play'}</span>
          </button>

          {/* Metric Selector Pills */}
          <div className="flex items-center gap-0.5 bg-black/5 p-0.5 rounded-lg">
            {metrics.map((m) => (
              <button
                key={m.id}
                onClick={() => handleMetricClick(m.id)}
                className={`px-2 py-0.5 rounded-md font-bold transition-all text-[10px] ${
                  selectedMetric === m.id
                    ? 'bg-white text-apple-blue shadow-apple-sm'
                    : 'text-apple-secondary hover:text-apple-text'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive Layer Rows Grid */}
      <div className="my-auto py-1 space-y-1 flex-1 flex flex-col justify-center min-h-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 w-full">
          {TABLE_1_COMPLEXITY.map((row, idx) => {
            const isSelfAttention = row.layerType.includes("Self-Attention");
            const isSelected = idx === selectedRowIdx;

            const metricValue =
              selectedMetric === 'complexity'
                ? row.complexityPerLayer
                : selectedMetric === 'sequential'
                ? row.sequentialOps
                : row.maxPathLength;

            return (
              <motion.div
                key={idx}
                onClick={() => setSelectedRowIdx(idx)}
                whileHover={{ scale: 1.01 }}
                animate={{
                  borderColor: isSelected ? '#0071e3' : isSelfAttention ? '#93c5fd' : 'rgba(0,0,0,0.06)',
                  boxShadow: isSelected ? '0 2px 8px rgba(0,113,227,0.15)' : 'none'
                }}
                className={`p-1.5 sm:p-2 rounded-xl border transition-all cursor-pointer font-mono flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/90 border-apple-blue font-bold shadow-apple-xs'
                    : isSelfAttention
                    ? 'bg-blue-50/40 border-blue-200'
                    : 'bg-slate-50 border-black/5 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className={`text-[10px] sm:text-[11px] font-bold truncate ${isSelfAttention ? 'text-apple-blue' : 'text-apple-text'}`}>
                    {row.layerType}
                  </span>
                  <span className={`text-[9px] sm:text-[10px] px-1.5 py-0.2 rounded font-bold shrink-0 ${
                    selectedMetric === 'complexity'
                      ? 'bg-blue-100 text-apple-blue'
                      : selectedMetric === 'sequential'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-purple-100 text-purple-900'
                  }`}>
                    {metricValue}
                  </span>
                </div>
                <p className="text-[9px] sm:text-[10px] text-apple-secondary font-sans leading-tight truncate">
                  {row.notes}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Selected Layer Tradeoff Card */}
        <div className="p-1.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs font-mono text-apple-text flex items-center justify-between gap-2 shadow-apple-xs shrink-0 w-full">
          <div className="flex items-center gap-1 min-w-0">
            <Sparkles className="w-3 h-3 text-apple-blue shrink-0" />
            <span className="text-[10px] text-apple-secondary font-sans truncate">
              <strong className="text-apple-text">{activeRow.layerType}:</strong> {activeRow.notes}
            </span>
          </div>
          <span className="text-[9px] bg-white text-apple-blue font-bold px-1.5 py-0.2 rounded border border-blue-200 shrink-0">
            O(1) Steps
          </span>
        </div>
      </div>

      {/* Asymptotic Variables Footer */}
      <div className="border-t border-black/5 pt-1 text-[9px] sm:text-[10px] font-mono text-apple-secondary flex items-center justify-between flex-wrap gap-1 shrink-0">
        <span>n = length | d = dimension | k = kernel</span>
        <span className="text-apple-blue font-bold">n &lt; d (Machine Translation)</span>
      </div>
    </div>
  );
};

export default ComplexityComparison;
