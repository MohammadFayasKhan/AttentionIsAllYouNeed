/**
 * MultiHeadVisualizer.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Interactive Subspace Explorer for Multi-Head Attention (Vaswani et al. 2017, Section 3.2.2, Eq. 2):
 *   MultiHead(Q,K,V) = Concat(head_1, ..., head_h)W^O
 *
 * Layout & Content Protection:
 *   - Centered container with auto-height and responsive subspace grid.
 */

import React, { useState, useEffect } from 'react';
import { oneeBridge } from '../../lib/oneeEvents';
import { motion } from 'framer-motion';
import { Layers, Play, Pause, Eye } from 'lucide-react';

interface HeadRole {
  id: number;
  name: string;
  focus: string;
  tokens: [string, string];
  color: string;
  bgLight: string;
  borderLight: string;
}

export const MultiHeadVisualizer: React.FC = () => {
  const [activeHeadIndex, setActiveHeadIndex] = useState<number>(0);
  const [headCount, setHeadCount] = useState<number>(8); // Baseline h=8 as per Section 3.2.2
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  const headRoles: HeadRole[] = [
    {
      id: 1,
      name: "Head 1: Syntactic Subject-Verb",
      focus: "Direct syntactic linkages between subjects and action verbs",
      tokens: ["animal", "cross"],
      color: "text-blue-600",
      bgLight: "bg-blue-50/80",
      borderLight: "border-blue-200"
    },
    {
      id: 2,
      name: "Head 2: Coreference & Pronoun Resolution",
      focus: "Resolving ambiguous pronouns to their semantic antecedents",
      tokens: ["it", "animal"],
      color: "text-indigo-600",
      bgLight: "bg-indigo-50/80",
      borderLight: "border-indigo-200"
    },
    {
      id: 3,
      name: "Head 3: Causal & Subordinate Clauses",
      focus: "Connecting clauses across causal conjunctions ('because')",
      tokens: ["cross", "tired"],
      color: "text-purple-600",
      bgLight: "bg-purple-50/80",
      borderLight: "border-purple-200"
    },
    {
      id: 4,
      name: "Head 4: Spatial & Prepositional Relations",
      focus: "Grounding entities to their spatial targets ('street')",
      tokens: ["cross", "street"],
      color: "text-emerald-600",
      bgLight: "bg-emerald-50/80",
      borderLight: "border-emerald-200"
    },
    {
      id: 5,
      name: "Head 5: Negation & Polarity Scoping",
      focus: "Tracking negation scope and logical modifiers ('didn't')",
      tokens: ["didn't", "cross"],
      color: "text-rose-600",
      bgLight: "bg-rose-50/80",
      borderLight: "border-rose-200"
    },
    {
      id: 6,
      name: "Head 6: Positional Adjacency & Bi-grams",
      focus: "Attending to immediate local linear neighbors",
      tokens: ["The", "animal"],
      color: "text-amber-600",
      bgLight: "bg-amber-50/80",
      borderLight: "border-amber-200"
    },
    {
      id: 7,
      name: "Head 7: Long-Range State Dependencies",
      focus: "Linking sentence-level causes to final emotional/physical states",
      tokens: ["animal", "tired"],
      color: "text-cyan-600",
      bgLight: "bg-cyan-50/80",
      borderLight: "border-cyan-200"
    },
    {
      id: 8,
      name: "Head 8: Global Discourse & Sentence Boundaries",
      focus: "Maintaining broad context distribution across all positions",
      tokens: ["street", "because"],
      color: "text-teal-600",
      bgLight: "bg-teal-50/80",
      borderLight: "border-teal-200"
    }
  ];

  const currentHead = headRoles[activeHeadIndex % headRoles.length];
  const d_k = Math.floor(512 / headCount);

  // Auto-play sweep interval with tab visibility awareness
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setActiveHeadIndex((prev) => (prev + 1) % headCount);
      }
    }, 1900);

    return () => clearInterval(interval);
  }, [isPlaying, headCount]);

  const handleSelectHead = (idx: number) => {
    setIsPlaying(false);
    setActiveHeadIndex(idx);
    const role = headRoles[idx % headRoles.length];
    oneeBridge.emit('head_select', `“Head ${idx + 1} (${role.name}) isolates a 64-dim subspace!”`);
  };

  const toggleAutoPlay = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <div className="w-full max-w-2xl mx-auto h-auto rounded-2xl bg-slate-50/80 border border-black/5 shadow-apple-xs p-2.5 sm:p-3 flex flex-col gap-2 font-sans gpu-layer self-center">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-black/5 pb-1.5 gap-1.5">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-apple-text font-mono flex items-center gap-1.5">
            <span>Multi-Head Attention Subspaces</span>
            <span className="text-[9px] font-mono text-apple-blue bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded-full font-bold flex items-center gap-0.5">
              <Layers className="w-2.5 h-2.5" />
              Eq. 2
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono flex-wrap">
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

          <div className="flex items-center gap-1.5 text-xs font-mono text-apple-blue bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full font-bold">
            <Eye className="w-3.5 h-3.5" />
            <span>h={headCount} • d_k={d_k}</span>
          </div>
        </div>
      </div>

      {/* Interactive Heads Matrix */}
      <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 w-full">
        {Array.from({ length: headCount }).map((_, idx) => {
          const isSelected = idx === activeHeadIndex;

          return (
            <motion.button
              key={idx}
              onClick={() => handleSelectHead(idx)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                scale: isSelected ? 1.04 : 1
              }}
              transition={{ duration: 0.2 }}
              className={`py-2 px-1.5 rounded-2xl text-xs font-mono font-bold transition-all border text-center relative focus-visible:ring-2 focus-visible:ring-apple-blue ${
                isSelected
                  ? 'bg-apple-blue text-white border-apple-blue shadow-apple-md z-10'
                  : 'bg-white text-apple-text border-black/5 hover:bg-slate-100'
              }`}
            >
              H{idx + 1}
              {isSelected && (
                <span className="absolute -top-1 -right-0.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Selected Head Subspace Details Card */}
      <div className={`p-3.5 rounded-2xl ${currentHead.bgLight} border ${currentHead.borderLight} space-y-2 shadow-apple-xs font-mono text-xs w-full`}>
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

          <div className="flex items-center gap-2 bg-white/90 px-2.5 py-1 rounded-xl border border-black/5 shadow-apple-xs">
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
      </div>

      {/* Head Count Interactive Slider & Baseline Annotation Footer */}
      <div className="border-t border-black/5 pt-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 text-xs font-mono">
        <div className="flex items-center gap-2 w-full sm:w-auto text-[11px]">
          <span className="text-apple-secondary">Heads (h): <strong>{headCount}</strong></span>
          <input
            type="range"
            min={1}
            max={32}
            step={headCount === 1 ? 1 : 2}
            value={headCount}
            onPointerDown={() => setIsPlaying(false)}
            onTouchStart={() => setIsPlaying(false)}
            onChange={(e) => {
              setIsPlaying(false);
              const val = Number(e.target.value);
              setHeadCount(val);
              setActiveHeadIndex(0);
            }}
            className="accent-apple-blue bg-black/10 rounded-lg cursor-pointer h-1.5 w-24"
          />
        </div>
        <div className="flex items-center gap-1.5 text-apple-blue font-bold text-[10px] sm:text-[11px]">
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
