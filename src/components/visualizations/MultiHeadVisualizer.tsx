/**
 * MultiHeadVisualizer.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Interactive simulation of Multi-Head Attention:
 *   MultiHead(Q, K, V) = Concat(head_1, ..., head_h) W^O
 *   where head_i = Attention(Q W_i^Q, K W_i^K, V W_i^V)
 *
 * Features:
 *   1. Smooth Auto-Play Head Sweep:
 *      Continuously sweeps across the 8 parallel representation subspaces (H1..H8)
 *      every 1.9s, demonstrating how different heads specialize simultaneously.
 *   2. Dedicated Representation Subspaces:
 *      Highlights specific linguistic and structural roles observed in Section 3.2.2:
 *      syntactic dependencies, anaphora resolution ("it" -> "animal"), modifier scoping, etc.
 *   3. Token Connection Visualizer:
 *      Interactive visual flow showing the primary query-key token connection for each head.
 *   4. Hyperparameter Ablation Slider:
 *      Adjust head count $h \in [1, 32]$ with real Table 3 BLEU benchmark annotations.
 */

import React, { useState, useEffect } from 'react';
import { oneeBridge } from '../../lib/oneeEvents';
import { motion } from 'framer-motion';
import { Play, Pause, Eye, Sparkles, Layers } from 'lucide-react';

interface HeadRole {
  name: string;
  focus: string;
  tokens: [string, string];
  relation: string;
  weight: number;
  color: string;
  bgLight: string;
  borderLight: string;
}

export const MultiHeadVisualizer: React.FC = () => {
  const [headCount, setHeadCount] = useState<number>(8);
  const [activeHeadIndex, setActiveHeadIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const headRoles: HeadRole[] = [
    {
      name: "Head 1: Syntactic Dependencies",
      focus: "Subject ➔ Verb relationships",
      tokens: ["animal", "cross"],
      relation: "Subject ➔ Action Predicate",
      weight: 0.88,
      color: "text-blue-600",
      bgLight: "bg-blue-50/80",
      borderLight: "border-blue-200"
    },
    {
      name: "Head 2: Anaphora Coreference",
      focus: "Pronoun ➔ Antecedent resolution ('it' ➔ 'animal')",
      tokens: ["it", "animal"],
      relation: "Coreference Link (Vaswani Figure 3)",
      weight: 0.94,
      color: "text-purple-600",
      bgLight: "bg-purple-50/80",
      borderLight: "border-purple-200"
    },
    {
      name: "Head 3: Positional Proximity",
      focus: "Local bi-gram & adjacent token context",
      tokens: ["didn't", "cross"],
      relation: "Local Negation Modifier",
      weight: 0.82,
      color: "text-emerald-600",
      bgLight: "bg-emerald-50/80",
      borderLight: "border-emerald-200"
    },
    {
      name: "Head 4: Semantic Spatial Context",
      focus: "Scene & entity interaction ('street' ➔ 'cross')",
      tokens: ["street", "cross"],
      relation: "Direct Object / Location",
      weight: 0.76,
      color: "text-amber-600",
      bgLight: "bg-amber-50/80",
      borderLight: "border-amber-200"
    },
    {
      name: "Head 5: Clause Boundaries & Logic",
      focus: "Causal conjunctions & subordinate clauses",
      tokens: ["because", "tired"],
      relation: "Causal Explanation Link",
      weight: 0.79,
      color: "text-indigo-600",
      bgLight: "bg-indigo-50/80",
      borderLight: "border-indigo-200"
    },
    {
      name: "Head 6: Modifier Scoping",
      focus: "Adjective ➔ Subject attribute ('tired' ➔ 'animal')",
      tokens: ["tired", "animal"],
      relation: "Attribute State Linking",
      weight: 0.85,
      color: "text-rose-600",
      bgLight: "bg-rose-50/80",
      borderLight: "border-rose-200"
    },
    {
      name: "Head 7: Long-Range Dependencies",
      focus: "Global sentence span & distant constraints",
      tokens: ["The", "tired"],
      relation: "Span Boundary Context",
      weight: 0.68,
      color: "text-cyan-600",
      bgLight: "bg-cyan-50/80",
      borderLight: "border-cyan-200"
    },
    {
      name: "Head 8: Global Representation",
      focus: "Broad semantic pooling across all d_model dimensions",
      tokens: ["animal", "street"],
      relation: "Global Subspace Context",
      weight: 0.72,
      color: "text-teal-600",
      bgLight: "bg-teal-50/80",
      borderLight: "border-teal-200"
    }
  ];

  const currentHead = headRoles[activeHeadIndex % headRoles.length];
  const d_k = Math.floor(512 / headCount);

  // Auto-play sweep interval
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setActiveHeadIndex((prev) => (prev + 1) % headCount);
    }, 1900);

    return () => clearInterval(interval);
  }, [isPlaying, headCount]);

  const handleSelectHead = (idx: number) => {
    setActiveHeadIndex(idx);
    const role = headRoles[idx % headRoles.length];
    oneeBridge.emit('head_select', `“Head ${idx + 1} (${role.name}) isolates a 64-dim subspace!”`);
  };

  const toggleAutoPlay = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <div
      className="w-full h-full min-h-[220px] p-4 sm:p-5 rounded-3xl backdrop-blur-2xl bg-white/85 border border-white/60 shadow-apple-md flex flex-col justify-between font-sans overflow-hidden"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 pb-2.5 gap-2 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-apple-text font-mono flex items-center gap-2">
            <span>Multi-Head Attention Subspace Explorer</span>
            <span className="text-[10px] font-mono text-apple-blue bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full font-bold">
              Eq. 2
            </span>
          </h3>
          <p className="text-xs text-apple-secondary font-mono">
            MultiHead(Q,K,V) = Concat(head_1, ..., head_h)W^O
          </p>
        </div>

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

          <div className="flex items-center gap-1.5 text-xs font-mono text-apple-blue bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full font-bold">
            <Eye className="w-3.5 h-3.5" />
            <span>h={headCount} • d_k={d_k}</span>
          </div>
        </div>
      </div>

      {/* Interactive Heads Matrix Stream */}
      <div className="my-auto py-2 space-y-3">
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {Array.from({ length: headCount }).map((_, idx) => {
            const isSelected = idx === activeHeadIndex;
            const role = headRoles[idx % headRoles.length];

            return (
              <motion.button
                key={idx}
                onClick={() => {
                  handleSelectHead(idx);
                }}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                animate={{
                  scale: isSelected ? 1.05 : 1
                }}
                transition={{ duration: 0.2 }}
                className={`py-2 px-1.5 rounded-2xl text-xs font-mono font-bold transition-all border text-center relative ${
                  isSelected
                    ? 'bg-apple-blue text-white border-apple-blue shadow-apple-md z-10'
                    : 'bg-slate-50 text-apple-text border-black/5 hover:bg-black/5'
                }`}
              >
                H{idx + 1}
                {isSelected && (
                  <span className="absolute -top-1.5 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                  </span>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Selected Head Subspace Details Card */}
        <motion.div
          key={activeHeadIndex}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className={`p-3 rounded-2xl ${currentHead.bgLight} border ${currentHead.borderLight} space-y-2 shadow-apple-xs font-mono text-xs`}
        >
          <div className="flex items-center justify-between flex-wrap gap-1">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-apple-blue" />
              <span className={`font-bold text-[11px] ${currentHead.color}`}>
                {currentHead.name}
              </span>
            </div>
            <span className="text-apple-tertiary text-[10px] bg-white/80 px-2 py-0.5 rounded-md border border-black/5 font-semibold">
              Subspace dim: d_k = d_v = {d_k}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-black/5">
            <p className="text-apple-secondary text-[11px] font-sans">
              Specialized Role: <strong className="text-apple-text">{currentHead.focus}</strong>
            </p>

            <div className="flex items-center gap-2 bg-white/90 px-2.5 py-1 rounded-xl border border-black/5 shadow-apple-xs shrink-0">
              <span className="text-apple-blue font-bold text-[10px]">Active Focus:</span>
              <span className="px-1.5 py-0.5 rounded bg-blue-100 text-apple-blue font-bold text-[10px]">
                "{currentHead.tokens[0]}"
              </span>
              <span className="text-apple-tertiary text-[10px]">➔</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700 font-bold text-[10px]">
                "{currentHead.tokens[1]}"
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Head Count Interactive Slider & Baseline Annotation Footer */}
      <div className="border-t border-black/5 pt-2 flex flex-col sm:flex-row items-center justify-between gap-1.5 text-xs font-mono shrink-0">
        <div className="flex items-center gap-2 w-full sm:w-auto text-[11px]">
          <span className="text-apple-secondary">Heads (h): <strong>{headCount}</strong></span>
          <input
            type="range"
            min={1}
            max={32}
            step={headCount === 1 ? 1 : 2}
            value={headCount}
            onChange={(e) => {
              const val = Number(e.target.value);
              setHeadCount(val);
              setActiveHeadIndex(0);
            }}
            className="accent-apple-blue bg-black/10 rounded-lg cursor-pointer h-1.5 w-24"
          />
        </div>
        <div className="flex items-center gap-1.5 text-apple-blue font-bold text-[10px] sm:text-[11px]">
          <Sparkles className="w-3.5 h-3.5" />
          <span>
            {headCount === 1
              ? 'Single head h=1 drops BLEU by 0.9 pts (24.9 vs 25.8)'
              : headCount === 8
              ? 'Vaswani et al. 2017 Optimal Baseline (25.8 BLEU)'
              : `d_k = 512 / ${headCount} = ${d_k} dimensions per head`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MultiHeadVisualizer;
