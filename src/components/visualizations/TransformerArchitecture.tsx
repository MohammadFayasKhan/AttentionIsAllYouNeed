/**
 * TransformerArchitecture.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Interactive Layer Reconstruction of Vaswani et al. (2017, Section 3):
 *   - Encoder (N=6): Multi-Head Attention + Pointwise Feed-Forward Network.
 *   - Decoder (N=6): Masked Multi-Head Attention + Encoder-Decoder Cross Attention + Feed-Forward.
 *   - Residual connections: LayerNorm(x + SubLayer(x))
 *
 * Layout & Content Protection:
 *   - Centered container with auto-height and full layer titles.
 */

import React, { useState, useEffect } from 'react';
import { oneeBridge } from '../../lib/oneeEvents';
import { Layers, Zap, Play, Pause, Sparkles, ShieldCheck, Cpu } from 'lucide-react';

interface SublayerInfo {
  id: string;
  name: string;
  formula: string;
  dim: string;
  description: string;
  color: string;
  bgLight: string;
  borderLight: string;
  icon: 'mha' | 'ffn' | 'norm';
}

export const TransformerArchitecture: React.FC = () => {
  const [activeStack, setActiveStack] = useState<'encoder' | 'decoder'>('encoder');
  const [activeSublayerIdx, setActiveSublayerIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);

  // Sublayer components of the Encoder (Section 3.1)
  const encoderSublayers: SublayerInfo[] = [
    {
      id: 'enc-1',
      name: '1. Multi-Head Self-Attention',
      formula: 'MultiHead(Q, K, V) = Concat(head_1, ..., head_8)W^O',
      dim: 'd_k = d_v = 64, d_model = 512',
      description: 'Allows each position to attend to all positions in the previous encoder layer simultaneously.',
      color: 'text-blue-600',
      bgLight: 'bg-blue-50/80',
      borderLight: 'border-blue-200',
      icon: 'mha'
    },
    {
      id: 'enc-2',
      name: '2. Residual Add & LayerNorm',
      formula: 'LayerNorm(x + Sublayer(x))',
      dim: 'Mean = 0, Var = 1 normalization',
      description: 'Residual connections propagate gradients directly across all 6 stacked encoder layers.',
      color: 'text-emerald-600',
      bgLight: 'bg-emerald-50/80',
      borderLight: 'border-emerald-200',
      icon: 'norm'
    },
    {
      id: 'enc-3',
      name: '3. Position-wise Feed-Forward',
      formula: 'FFN(x) = max(0, xW_1 + b_1)W_2 + b_2',
      dim: 'd_model = 512 ➔ d_ff = 2048 ➔ 512',
      description: 'Applied to each position separately and identically with two linear transformations and ReLU.',
      color: 'text-purple-600',
      bgLight: 'bg-purple-50/80',
      borderLight: 'border-purple-200',
      icon: 'ffn'
    },
    {
      id: 'enc-4',
      name: '4. Output LayerNorm',
      formula: 'LayerNorm(x + FFN(x))',
      dim: 'd_model = 512 tensor output',
      description: 'Final normalized representation passed to subsequent encoder stack or decoder cross-attention.',
      color: 'text-teal-600',
      bgLight: 'bg-teal-50/80',
      borderLight: 'border-teal-200',
      icon: 'norm'
    }
  ];

  // Sublayer components of the Decoder (Section 3.1)
  const decoderSublayers: SublayerInfo[] = [
    {
      id: 'dec-1',
      name: '1. Masked Multi-Head Attention',
      formula: 'MaskedAttention(Q, K, V) with Upper-Triangular -∞ Mask',
      dim: 'Prevents attending to positions i+1, ..., n',
      description: 'Preserves the autoregressive property ensuring predictions for position i depend only on known outputs.',
      color: 'text-rose-600',
      bgLight: 'bg-rose-50/80',
      borderLight: 'border-rose-200',
      icon: 'mha'
    },
    {
      id: 'dec-2',
      name: '2. Encoder-Decoder Cross Attention',
      formula: 'Q from Decoder, K & V from Encoder Stack',
      dim: 'd_k = 64, d_model = 512',
      description: 'Allows every decoder position to attend over all positions in the input sequence.',
      color: 'text-indigo-600',
      bgLight: 'bg-indigo-50/80',
      borderLight: 'border-indigo-200',
      icon: 'mha'
    },
    {
      id: 'dec-3',
      name: '3. Position-wise Feed-Forward',
      formula: 'FFN(x) = max(0, xW_1 + b_1)W_2 + b_2',
      dim: 'd_model = 512 ➔ d_ff = 2048 ➔ 512',
      description: 'Expands into 2048 dimensions with non-linear activation before contracting back to 512.',
      color: 'text-purple-600',
      bgLight: 'bg-purple-50/80',
      borderLight: 'border-purple-200',
      icon: 'ffn'
    },
    {
      id: 'dec-4',
      name: '4. Linear & Softmax Output',
      formula: 'Linear(d_model) ➔ Softmax(V_target)',
      dim: 'Vocabulary probability distribution',
      description: 'Converts decoder output to predicted next-token target probabilities.',
      color: 'text-amber-600',
      bgLight: 'bg-amber-50/80',
      borderLight: 'border-amber-200',
      icon: 'norm'
    }
  ];

  const currentSublayers = activeStack === 'encoder' ? encoderSublayers : decoderSublayers;
  const activeSublayer = currentSublayers[activeSublayerIdx % currentSublayers.length];

  // Auto-play dataflow cycle with tab visibility awareness
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setActiveSublayerIdx((prev) => {
          const next = (prev + 1) % currentSublayers.length;
          if (next === 0) {
            setActiveStack((curr) => (curr === 'encoder' ? 'decoder' : 'encoder'));
          }
          return next;
        });
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isPlaying, currentSublayers.length]);

  const handleSelectSublayer = (idx: number) => {
    setActiveSublayerIdx(idx);
    const sub = currentSublayers[idx];
    oneeBridge.emit('slider_change', `“Inspecting ${sub.name}: ${sub.formula}”`);
  };

  const handleStackToggle = (stack: 'encoder' | 'decoder') => {
    setActiveStack(stack);
    setActiveSublayerIdx(0);
    oneeBridge.emit('chapter_change', `“Switched to Transformer ${stack.toUpperCase()} stack!”`);
  };

  const toggleAutoPlay = () => {
    setIsPlaying((prev) => !prev);
  };

  return (
    <div className="w-full max-w-2xl mx-auto h-auto rounded-2xl bg-slate-50/80 border border-black/5 shadow-apple-xs p-2.5 sm:p-3 flex flex-col gap-2 font-sans gpu-layer self-center">
      {/* Header & Control Bar */}
      <div className="flex items-center justify-between border-b border-black/5 pb-1.5 gap-1.5 flex-wrap">
        <div>
          <h3 className="text-xs sm:text-sm font-bold text-apple-text font-mono flex items-center gap-1.5">
            <span>Transformer Layer Reconstruction</span>
            <span className="text-[9px] font-mono text-apple-blue bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded-full font-bold">
              N=6 Stacks
            </span>
          </h3>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs flex-wrap">
          <button
            onClick={toggleAutoPlay}
            className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all shadow-apple-xs focus-visible:ring-2 focus-visible:ring-apple-blue ${
              isPlaying
                ? 'bg-apple-blue text-white hover:bg-blue-600'
                : 'bg-slate-100 text-apple-secondary hover:text-apple-text hover:bg-slate-200'
            }`}
            aria-label="Toggle auto-flow"
          >
            {isPlaying ? <Pause className="w-2.5 h-2.5" /> : <Play className="w-2.5 h-2.5 fill-current" />}
            <span>{isPlaying ? 'Auto-Flow Active' : 'Play Auto-Flow'}</span>
          </button>

          {/* Stack Switcher Pills */}
          <div className="flex items-center gap-0.5 bg-black/5 p-0.5 rounded-lg">
            <button
              onClick={() => handleStackToggle('encoder')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all text-[10px] focus-visible:ring-2 focus-visible:ring-apple-blue ${
                activeStack === 'encoder'
                  ? 'bg-white text-apple-blue shadow-apple-sm'
                  : 'text-apple-secondary hover:text-apple-text'
              }`}
            >
              Encoder
            </button>
            <button
              onClick={() => handleStackToggle('decoder')}
              className={`px-2 py-0.5 rounded-md font-bold transition-all text-[10px] focus-visible:ring-2 focus-visible:ring-apple-blue ${
                activeStack === 'decoder'
                  ? 'bg-white text-apple-purple shadow-apple-sm'
                  : 'text-apple-secondary hover:text-apple-text'
              }`}
            >
              Decoder
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Sublayer Tensor Flow Ladder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
        {currentSublayers.map((sub, idx) => {
          const isSelected = idx === activeSublayerIdx;

          return (
            <button
              key={sub.id}
              onClick={() => handleSelectSublayer(idx)}
              className={`p-2.5 rounded-xl flex items-center justify-between font-mono text-xs transition-all border text-left focus-visible:ring-2 focus-visible:ring-apple-blue ${
                isSelected
                  ? `${sub.bgLight} border-apple-blue font-bold shadow-apple-xs`
                  : 'bg-white border-black/5 hover:bg-slate-100 text-apple-text'
              }`}
            >
              <div className="flex items-center gap-1.5 min-w-0">
                {sub.icon === 'ffn' ? (
                  <Zap className={`w-3.5 h-3.5 shrink-0 ${isSelected ? sub.color : 'text-amber-500'}`} />
                ) : (
                  <Layers className={`w-3.5 h-3.5 shrink-0 ${isSelected ? sub.color : 'text-apple-blue'}`} />
                )}
                <span className={`text-[10px] sm:text-[11px] ${isSelected ? sub.color : 'text-apple-text'}`}>
                  {sub.name}
                </span>
              </div>

              <span className="text-[9px] text-apple-secondary bg-white px-1.5 py-0.2 rounded border border-black/5 font-semibold shrink-0 ml-1">
                {sub.dim}
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Sublayer Mathematical Breakdown Card */}
      <div className={`p-3 rounded-xl ${activeSublayer.bgLight} border ${activeSublayer.borderLight} space-y-1.5 shadow-apple-xs font-mono text-xs w-full`}>
        <div className="flex items-center justify-between flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <Sparkles className="w-3.5 h-3.5 text-apple-blue" />
            <span className={`text-[10px] sm:text-[11px] ${activeSublayer.color}`}>
              {activeSublayer.name}
            </span>
          </div>
          <span className="text-[9px] text-apple-text bg-white/90 px-2 py-0.5 rounded border border-black/5 font-mono font-semibold">
            {activeSublayer.formula}
          </span>
        </div>

        <p className="text-apple-secondary text-[10px] sm:text-[11px] font-sans leading-relaxed">
          {activeSublayer.description}
        </p>
      </div>

      {/* Architecture Specs Footer */}
      <div className="border-t border-black/5 pt-2 flex items-center justify-between text-[10px] font-mono text-apple-secondary flex-wrap gap-1">
        <div className="flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
          <span>Residual: <strong className="text-apple-text font-bold">LayerNorm(x + SubLayer(x))</strong></span>
        </div>
        <div className="flex items-center gap-1 text-apple-blue font-semibold">
          <Cpu className="w-3.5 h-3.5" />
          <span>Shape: <strong className="text-apple-text">d_model=512, d_ff=2048</strong></span>
        </div>
      </div>
    </div>
  );
};

export default TransformerArchitecture;
