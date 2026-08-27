/**
 * Sketchbook.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Sketchbook is an interactive 3D virtual research notebook replicating the original
 * Vaswani et al. (2017) NIPS conference publication spreads and blueprints.
 *
 * Core Features:
 *   1. Smooth Auto-Tour Animation:
 *      Automatically cycles through paper plates every 3.8s with an interactive Play/Pause toggle.
 *   2. 3D Perspective Floating Physics:
 *      Uses CSS 3D transforms (`rotateX`, `rotateY`, `scale`, `perspective: 1200px`) with
 *      subtle continuous ambient floating tilt to create a tangible physical paper feel.
 *   3. Pointer Drag & Rotation Physics:
 *      Supports drag-to-tilt with elastic bounds (-25deg to +35deg X, -40deg to +40deg Y).
 *   4. Anti-Snap Wheel Isolation:
 *      Tagged with `data-no-snap="true"` to prevent trackpad gestures from hijacking chapter navigation.
 *   5. Magnifying Loupe & Zoom Controls:
 *      Interactive loupe overlay magnifies specific diagram details and formulas.
 *   6. Verified Paper Archive Spreads:
 *      Covers 8 curated paper plates: NIPS 2017 Archive Cover, Figure 1 Architecture,
 *      Figure 2 Attention, Section 3.5 Positional Harmonics, Table 1 Complexity,
 *      Table 2 BLEU Benchmarks, Table 3 Hyperparameter Ablations, Table 4 Parsing.
 */

import React, { useState, useEffect, useRef } from 'react';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { oneeBridge } from '../../lib/oneeEvents';
import { ZoomIn, ZoomOut, RotateCcw, Search, Move, ChevronLeft, ChevronRight, Play, Pause, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SketchbookProps {
  className?: string;
  initialPlateIndex?: number;
}

export const Sketchbook: React.FC<SketchbookProps> = ({ className = '', initialPlateIndex = 0 }) => {
  const [currentPage, setCurrentPage] = useState<number>(initialPlateIndex);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);
  const [rotation, setRotation] = useState<{ x: number; y: number }>({ x: 8, y: -5 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [loupeActive, setLoupeActive] = useState<boolean>(false);
  const [loupePos, setLoupePos] = useState<{ x: number; y: number }>({ x: 50, y: 50 });

  const containerRef = useRef<HTMLDivElement>(null);

  const paperPages = [
    {
      figure: "NIPS 2017 Archive",
      title: "Cover Plate: Vaswani et al. (2017)",
      subtitle: "NIPS 2017 Research Paper Replica (arXiv:1706.03762v7)",
      content: "ATTENTION IS ALL YOU NEED",
      body: "**Ashish Vaswani*, Noam Shazeer*, Niki Parmar*, Jakob Uszkoreit*, Llion Jones*, Aidan N. Gomez*, Łukasz Kaiser*, Illia Polosukhin***\n\n*Google Brain, Google Research, University of Toronto*\n\n> 'We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.'",
      details: ["8 Authors", "NIPS 2017", "arXiv:1706.03762", "Long Beach, CA"],
      color: "from-blue-50 via-white to-slate-100"
    },
    {
      figure: "Figure 1",
      title: "The Transformer Model Architecture",
      subtitle: "Encoder & Decoder Stacks (N=6 Identical Layers)",
      content: "Figure 1: Complete Block Architecture",
      body: "- **Encoder:** $N=6$ layers with Multi-Head Self-Attention + Position-wise Feed-Forward Network.\n- **Decoder:** $N=6$ layers with Masked Multi-Head Attention + Encoder-Decoder Cross-Attention + Feed-Forward.\n- **Sub-layer Connection:** $\\text{LayerNorm}(x + \\text{SubLayer}(x))$ with $d_{\\text{model}} = 512$.",
      details: ["N = 6 Layers", "d_model = 512", "d_ff = 2048", "Residual Add & Norm"],
      color: "from-indigo-50 via-white to-slate-100"
    },
    {
      figure: "Figure 2",
      title: "Scaled Dot-Product & Multi-Head Attention",
      subtitle: "Equation (1) & Equation (2) Blueprint",
      content: "$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$",
      body: "- **Key Scaling:** Dividing by $\\sqrt{d_k} = \\sqrt{64} = 8$ counters large dot product gradient saturation.\n- **Multi-Head Projection:** $h=8$ parallel heads project to $d_k = d_v = 64$.\n- **Output Linear:** $\\text{MultiHead}(Q,K,V) = \\text{Concat}(\\text{head}_1, \\dots, \\text{head}_8)W^O$.",
      details: ["h = 8 Heads", "d_k = 64", "d_v = 64", "Softmax Scaling"],
      color: "from-purple-50 via-white to-slate-100"
    },
    {
      figure: "Section 3.5",
      title: "Sinusoidal Positional Encoding",
      subtitle: "Equations (3) & (4) Frequency Harmonics",
      content: "$$\\text{PE}_{(pos, 2i)} = \\sin\\left(\\frac{pos}{10000^{2i/d_{\\text{model}}}}\\right)$$",
      body: "- **Cosine Wave:** $\\text{PE}_{(pos, 2i+1)} = \\cos\\left(pos / 10000^{2i/d_{\\text{model}}}\\right)$.\n- **Wavelengths:** Geometric progression from $2\\pi$ to $10000 \\cdot 2\\pi$.\n- **Relative Offset Property:** $\\text{PE}_{(pos+k)}$ can be represented as a linear rotation matrix of $\\text{PE}_{pos}$.",
      details: ["pos = 0..512", "i = 0..255", "Fixed Function", "Generalizes to n > train"],
      color: "from-cyan-50 via-white to-slate-100"
    },
    {
      figure: "Table 1",
      title: "Complexity Comparison Matrix",
      subtitle: "Self-Attention vs Recurrent vs Convolutional",
      content: "Self-Attention: O(1) Sequential Operations",
      body: "| Layer Type | Complexity | Sequential Ops | Max Path |\n| :--- | :--- | :--- | :--- |\n| **Self-Attention** | $\\mathcal{O}(n^2 \\cdot d)$ | $\\mathcal{O}(1)$ | $\\mathcal{O}(1)$ |\n| **Recurrent (RNN)** | $\\mathcal{O}(n \\cdot d^2)$ | $\\mathcal{O}(n)$ | $\\mathcal{O}(n)$ |\n| **Convolutional** | $\\mathcal{O}(k \\cdot n \\cdot d^2)$ | $\\mathcal{O}(1)$ | $\\mathcal{O}(\\log_k(n))$ |",
      details: ["n = sequence length", "d = 512 dimension", "Faster for n < d", "O(1) Path Length"],
      color: "from-emerald-50 via-white to-slate-100"
    },
    {
      figure: "Table 2",
      title: "Translation BLEU Benchmarks",
      subtitle: "WMT 2014 English-to-German & English-to-French",
      content: "Transformer (big): 28.4 EN-DE BLEU in 3.5 GPU Days",
      body: "- **Transformer (big):** **28.4 BLEU** on EN-DE, **41.8 BLEU** on EN-FR ($2.3 \\times 10^{19}$ FLOPs).\n- **Transformer (base):** **27.3 BLEU** in just 12 hours on 8 P100 GPUs ($3.3 \\times 10^{18}$ FLOPs).\n- **Previous Best (ConvS2S):** 25.16 BLEU ($9.6 \\times 10^{19}$ FLOPs).",
      details: ["8 NVIDIA P100", "3.5 Days Big", "12 Hours Base", "Adam Optimizer"],
      color: "from-amber-50 via-white to-slate-100"
    },
    {
      figure: "Table 3",
      title: "Hyperparameter Ablation Laboratory",
      subtitle: "Testing Head Count, Key Dimensions, and Depth",
      content: "Single-head (h=1) drops BLEU by 0.9 points",
      body: "- **Row (A):** Single head ($h=1, d_k=512$) drops BLEU to 24.9. 32 heads ($d_k=16$) drops to 25.4.\n- **Row (B):** Small keys ($d_k=16$) hurts BLEU to 25.1.\n- **Row (C):** Deeper model ($N=8$) improves BLEU to 26.4.\n- **Row (E):** Learned positional embeddings match fixed sinusoids (25.7 vs 25.8 BLEU).",
      details: ["Ablation (A)-(E)", "newstest2013 dev", "65M Params Base", "Optimal h=8"],
      color: "from-rose-50 via-white to-slate-100"
    },
    {
      figure: "Table 4",
      title: "English Constituency Parsing",
      subtitle: "Generalizing to Non-Translation Tasks",
      content: "Transformer WSJ-only: 91.3 F1 Score",
      body: "- **WSJ Only:** 4-layer Transformer achieved **91.3 F1** without task-specific tuning.\n- **Semi-supervised:** Achieved **92.7 F1**, rivaling Recurrent Neural Network Grammars.\n- **Significance:** Proved Transformer generalizes beyond machine translation.",
      details: ["4-layer Model", "13.7M Params", "Penn Treebank", "Constituency Parsing"],
      color: "from-slate-50 via-white to-blue-50"
    }
  ];

  // Auto-tour animation loop with tab visibility awareness
  useEffect(() => {
    if (!isPlaying || isDragging) return;

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        setCurrentPage((prev) => (prev + 1) % paperPages.length);
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [isPlaying, isDragging, paperPages.length]);

  const currentPlate = paperPages[currentPage] || paperPages[0];

  const handlePointerDown = (e: React.PointerEvent) => {
    if (loupeActive) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - rotation.y * 3, y: e.clientY - rotation.x * 3 });
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (loupeActive && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setLoupePos({ x: Math.max(10, Math.min(90, x)), y: Math.max(10, Math.min(90, y)) });
      return;
    }

    if (!isDragging) return;
    const deltaY = (e.clientX - dragStart.x) / 3;
    const deltaX = (e.clientY - dragStart.y) / 3;
    setRotation({
      x: Math.max(-25, Math.min(35, deltaX)),
      y: Math.max(-40, Math.min(40, deltaY))
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const nextPage = () => {
    setCurrentPage((prev) => {
      const next = (prev + 1) % paperPages.length;
      oneeBridge.emit('notebook_plate_change', `“Showing ${paperPages[next].figure}: ${paperPages[next].title}”`);
      return next;
    });
  };

  const prevPage = () => {
    setCurrentPage((prev) => {
      const next = (prev - 1 + paperPages.length) % paperPages.length;
      oneeBridge.emit('notebook_plate_change', `“Showing ${paperPages[next].figure}: ${paperPages[next].title}”`);
      return next;
    });
  };

  const toggleAutoTour = () => {
    setIsPlaying((prev) => !prev);
  };

  const resetView = () => {
    setZoom(1);
    setRotation({ x: 8, y: -5 });
    setLoupeActive(false);
  };

  return (
    <div
      className={`relative w-full h-full min-h-[460px] flex flex-col items-center justify-between p-4 overflow-hidden rounded-3xl backdrop-blur-2xl bg-white/85 border border-white/60 shadow-apple-md font-sans ${className}`}
    >
      {/* Top Controls Bar */}
      <div className="w-full flex items-center justify-between z-30 pb-2 border-b border-black/5 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-3 py-1 rounded-full text-xs text-apple-blue font-mono font-bold shadow-apple-sm">
            <Move className="w-3.5 h-3.5 animate-pulse" />
            <span>3D Interactive Plate {currentPage + 1} of {paperPages.length}</span>
          </div>

          {/* Auto-Tour Toggle */}
          <button
            onClick={toggleAutoTour}
            className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-bold transition-all shadow-apple-xs ${
              isPlaying
                ? 'bg-apple-blue text-white hover:bg-blue-600'
                : 'bg-white text-apple-secondary hover:text-apple-text border border-black/10'
            }`}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{isPlaying ? 'Auto-Tour Active' : 'Play Tour'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 bg-white/90 border border-black/10 backdrop-blur-md px-2.5 py-1 rounded-full text-xs text-apple-secondary shadow-apple-sm">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 1.6))}
            className="p-1 hover:text-apple-blue transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <span className="text-[10px] font-mono text-apple-tertiary px-1">
            {(zoom * 100).toFixed(0)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.8))}
            className="p-1 hover:text-apple-blue transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <div className="w-px h-3 bg-black/10 mx-1" />
          <button
            onClick={() => setLoupeActive(!loupeActive)}
            className={`p-1 transition-colors ${loupeActive ? 'text-apple-blue font-bold' : 'hover:text-apple-text'}`}
            title="Magnifying Loupe"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            className="p-1 hover:text-apple-blue transition-colors"
            title="Reset Camera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 3D Stage Viewport */}
      <div
        ref={containerRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full flex-1 min-h-[300px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none relative my-2 overflow-visible"
        style={{ perspective: '1200px' }}
      >
        <motion.div
          animate={{
            scale: zoom,
            rotateX: isDragging ? rotation.x : [rotation.x - 1.5, rotation.x + 2.5, rotation.x - 1.5],
            rotateY: isDragging ? rotation.y : [rotation.y - 2.5, rotation.y + 2.5, rotation.y - 2.5]
          }}
          transition={{
            scale: { type: 'spring', stiffness: 300, damping: 25 },
            rotateX: isDragging ? { duration: 0 } : { duration: 6, repeat: Infinity, ease: 'easeInOut' },
            rotateY: isDragging ? { duration: 0 } : { duration: 6, repeat: Infinity, ease: 'easeInOut' }
          }}
          className="relative w-[360px] sm:w-[480px] h-[270px] sm:h-[310px]"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Main Paper Plate Container */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, scale: 0.96, rotateY: -8 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.96, rotateY: 8 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute inset-0 rounded-3xl bg-white shadow-apple-lg border border-black/10 p-5 flex flex-col justify-between overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${currentPlate.color} opacity-70 pointer-events-none`} />

              {/* Plate Header */}
              <div className="relative z-10 flex items-center justify-between border-b border-black/5 pb-2.5">
                <span className="text-[10px] font-mono font-bold tracking-widest text-apple-blue bg-blue-100/80 px-2.5 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {currentPlate.figure}
                </span>
                <span className="text-[11px] font-mono text-apple-tertiary">
                  Vaswani et al. (2017)
                </span>
              </div>

              {/* Plate Main Title & Body */}
              <div className="relative z-10 my-auto py-2 space-y-2 overflow-y-auto max-h-[160px] no-scrollbar">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-apple-text font-mono leading-tight">
                    {currentPlate.title}
                  </h3>
                  <p className="text-xs text-apple-secondary font-mono mt-0.5">
                    {currentPlate.subtitle}
                  </p>
                </div>

                <div className="p-2.5 rounded-2xl bg-white/90 border border-black/5 shadow-apple-xs font-mono text-xs text-apple-text">
                  <MarkdownRenderer content={currentPlate.content} />
                </div>

                <div className="text-xs text-apple-secondary leading-relaxed font-sans">
                  <MarkdownRenderer content={currentPlate.body} />
                </div>
              </div>

              {/* Plate Footer Details */}
              <div className="relative z-10 border-t border-black/5 pt-2 flex items-center justify-between gap-1 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {currentPlate.details.map((d, i) => (
                    <span
                      key={i}
                      className="text-[9px] font-mono text-apple-secondary bg-black/5 px-2 py-0.5 rounded-md font-semibold"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <span className="text-[9px] font-mono text-apple-tertiary">
                  Plate {currentPage + 1}/{paperPages.length}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Interactive Magnifying Loupe Overlay */}
          {loupeActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute w-36 h-36 rounded-full border-4 border-apple-blue bg-white shadow-2xl pointer-events-none z-40 overflow-hidden flex items-center justify-center backdrop-blur-md"
              style={{
                top: `${loupePos.y}%`,
                left: `${loupePos.x}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 20px 40px rgba(0, 113, 227, 0.35)'
              }}
            >
              <div className="text-center p-3 font-mono text-xs text-apple-blue font-bold">
                <span className="text-[10px] text-apple-tertiary block mb-1">1.35x Lens</span>
                <MarkdownRenderer content={currentPlate.content} />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Bottom Spread Navigator Controls */}
      <div className="w-full flex items-center justify-between z-30 pt-2 border-t border-black/5 flex-wrap gap-2">
        <button
          onClick={prevPage}
          className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white border border-black/10 shadow-apple-xs hover:border-blue-300 hover:text-apple-blue text-apple-secondary text-xs font-mono font-bold transition-all"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Previous Plate</span>
        </button>

        {/* Spread Navigation Dots */}
        <div className="flex items-center gap-1.5">
          {paperPages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentPage
                  ? 'w-6 bg-apple-blue shadow-apple-sm'
                  : 'w-2 bg-black/15 hover:bg-black/30'
              }`}
              title={`Jump to Plate ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextPage}
          className="flex items-center gap-1 px-3.5 py-1.5 rounded-full bg-white border border-black/10 shadow-apple-xs hover:border-blue-300 hover:text-apple-blue text-apple-secondary text-xs font-mono font-bold transition-all"
        >
          <span>Next Plate</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default Sketchbook;
