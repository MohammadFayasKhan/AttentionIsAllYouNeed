/**
 * Sketchbook.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Interactive 3D virtual research notebook replicating the original
 * Vaswani et al. (2017) NIPS conference publication spreads and blueprints.
 *
 * Layout & Content Protection:
 *   - Centered layout (max-w-2xl mx-auto) with auto-height.
 *   - touch-action: pan-y allows vertical finger scrolling on mobile without trapping.
 *   - Auto-tour pauses when out of viewport or when tab is hidden.
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
  const isVisibleRef = useRef<boolean>(true);

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
      body: "- **Encoder**: $N=6$ layers with Multi-Head Self-Attention + Position-wise Feed-Forward Network.\n- **Decoder**: $N=6$ layers with Masked Multi-Head Self-Attention + Encoder-Decoder Cross Attention.\n- **Residual Connections**: $\\text{LayerNorm}(x + \\text{SubLayer}(x))$.",
      details: ["N = 6 Layers", "d_model = 512", "d_ff = 2048", "Residual Add & Norm"],
      color: "from-indigo-50 via-white to-slate-100"
    },
    {
      figure: "Figure 2",
      title: "Scaled Dot-Product & Multi-Head Attention",
      subtitle: "Equations 1 & 2 Breakdown",
      content: "$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$$",
      body: "- **Dot-Product**: Fast, matrix-multiplication optimized via BLAS.\n- **Scaling Factor**: Dividing by $\\sqrt{d_k} = \\sqrt{64} = 8$ prevents softmax gradient vanishing.\n- **Multi-Head**: $h=8$ parallel linear projections into 64-dimensional subspaces.",
      details: ["h = 8 Heads", "d_k = d_v = 64", "Scale Factor = 1/8", "Softmax Stabilized"],
      color: "from-sky-50 via-white to-slate-100"
    },
    {
      figure: "Section 3.5",
      title: "Sinusoidal Positional Encoding",
      subtitle: "Equations 3 & 4: Wavelengths from 2π to 10000·2π",
      content: "$$PE_{(pos, 2i)} = \\sin\\left(\\frac{pos}{10000^{2i/d_{model}}}\\right), \\quad PE_{(pos, 2i+1)} = \\cos\\left(\\frac{pos}{10000^{2i/d_{model}}}\\right)$$",
      body: "- **Geometric Progression**: Enables attending by relative offsets via linear transformation $PE_{pos+k} = R(\\omega_i k) PE_{pos}$.\n- **Extrapolation**: Allows sequence length scaling beyond training lengths without retraining.",
      details: ["d_model = 512", "Wave Frequencies", "Relative Shift Property", "Linear Transformation"],
      color: "from-teal-50 via-white to-slate-100"
    },
    {
      figure: "Table 1",
      title: "Maximum Path Lengths & Layer Complexity",
      subtitle: "Section 4: Self-Attention vs Recurrent vs Convolutional",
      content: "Self-Attention achieves O(1) Sequential Operations & O(1) Maximum Path Length",
      body: "- **Self-Attention**: $O(n^2 \\cdot d)$ complexity per layer, $O(1)$ sequential operations, $O(1)$ max path.\n- **Recurrent**: $O(n \\cdot d^2)$ complexity, $O(n)$ sequential operations, $O(n)$ max path.\n- **Convolutional**: $O(k \\cdot n \\cdot d^2)$ complexity, $O(1)$ sequential operations, $O(\\log_k(n))$ max path.",
      details: ["O(1) Step Operations", "O(1) Path Length", "GPU Matrix Parallelism", "Table 1 NIPS 2017"],
      color: "from-purple-50 via-white to-slate-100"
    },
    {
      figure: "Table 2",
      title: "WMT 2014 Translation Benchmarks",
      subtitle: "Section 5: State-of-the-Art Results at a Fraction of Training Cost",
      content: "Transformer (big): 28.4 EN-DE BLEU | 41.8 EN-FR BLEU",
      body: "- **EN-DE BLEU**: $28.4$ (Big) / $27.3$ (Base) outperforms best previous models by $>2.0$ BLEU.\n- **Training Time**: Base model trained in only 12 hours on 8 P100 GPUs ($3.3 \\times 10^{18}$ FLOPs).\n- **Big Model**: Trained in 3.5 days ($2.3 \\times 10^{19}$ FLOPs), establishing new SOTA.",
      details: ["28.4 BLEU EN-DE", "41.8 BLEU EN-FR", "8 P100 GPUs", "3.5 Days Training"],
      color: "from-emerald-50 via-white to-slate-100"
    },
    {
      figure: "Table 3",
      title: "Model Variations & Hyperparameter Ablations",
      subtitle: "Section 5.3: Attention Heads, Key Dimensions, and Regularization",
      content: "Single-head (h=1) drops BLEU by 0.9 points (24.9 vs 25.8)",
      body: "- **Row (A)**: $h=8$ optimal. Too many heads ($h=16, 32$) drops BLEU; single head drops BLEU by 0.9.\n- **Row (B)**: Reducing key size $d_k=16$ hurts quality (25.8 $\\rightarrow$ 25.4).\n- **Row (C)**: Bigger model with $N=8$ layers achieves 26.4 BLEU.",
      details: ["Ablation Study", "Optimal h = 8", "d_k Sensitivity", "Table 3 Results"],
      color: "from-amber-50 via-white to-slate-100"
    },
    {
      figure: "Table 4",
      title: "English Constituency Parsing Generalization",
      subtitle: "Section 5.4: WSJ 23 Parsing Score: 92.7 F1 (Semi-supervised)",
      content: "Transformer 4-layer model achieves 91.3 F1 without task-specific tuning",
      body: "- **Out-of-Domain**: Evaluated on WSJ 23 parsing to test whether Transformer generalizes.\n- **Results**: 4-layer Transformer with $d_{model}=1024$ achieved 91.3 F1 (unlabeled) and 92.7 F1 (semi-supervised), outperforming recurrent baselines.",
      details: ["Penn Treebank", "WSJ 23", "92.7 F1 Score", "Generalization"],
      color: "from-rose-50 via-white to-slate-100"
    }
  ];

  // Auto-tour rotation with visibility and tab awareness
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(([entry]) => {
      isVisibleRef.current = entry.isIntersecting;
    }, { threshold: 0.05 });
    observer.observe(el);

    if (!isPlaying) {
      observer.disconnect();
      return;
    }

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && isVisibleRef.current) {
        setCurrentPage((prev) => (prev + 1) % paperPages.length);
      }
    }, 4500);

    return () => {
      observer.disconnect();
      clearInterval(interval);
    };
  }, [isPlaying, paperPages.length]);

  const currentPlate = paperPages[currentPage];

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
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
      ref={containerRef}
      className={`relative w-full max-w-2xl mx-auto flex flex-col items-center justify-between p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/95 border border-black/10 shadow-apple-md font-sans overflow-hidden self-center ${className}`}
    >
      {/* Top Controls Bar */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between z-30 pb-2.5 border-b border-black/5 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1.5 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-full text-[11px] sm:text-xs text-apple-blue font-mono font-bold shadow-apple-sm">
            <Move className="w-3 h-3 sm:w-3.5 sm:h-3.5 animate-pulse" />
            <span>Plate {currentPage + 1} of {paperPages.length}</span>
          </div>

          {/* Auto-Tour Toggle */}
          <button
            onClick={toggleAutoTour}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] sm:text-xs font-mono font-bold transition-all shadow-apple-xs focus-visible:ring-2 focus-visible:ring-apple-blue ${
              isPlaying
                ? 'bg-apple-blue text-white hover:bg-blue-600'
                : 'bg-white text-apple-secondary hover:text-apple-text border border-black/10'
            }`}
          >
            {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-current" />}
            <span>{isPlaying ? 'Auto-Tour' : 'Tour'}</span>
          </button>
        </div>

        <div className="flex items-center gap-1 bg-white/90 border border-black/10 px-2 py-0.5 rounded-full text-xs text-apple-secondary shadow-apple-sm shrink-0">
          <button
            onClick={() => setZoom((z) => Math.min(z + 0.2, 1.4))}
            className="p-1 hover:text-apple-blue transition-colors focus-visible:ring-2 focus-visible:ring-apple-blue rounded"
            title="Zoom In"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <span className="text-[9px] font-mono text-apple-tertiary px-0.5">
            {(zoom * 100).toFixed(0)}%
          </span>
          <button
            onClick={() => setZoom((z) => Math.max(z - 0.2, 0.8))}
            className="p-1 hover:text-apple-blue transition-colors focus-visible:ring-2 focus-visible:ring-apple-blue rounded"
            title="Zoom Out"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="w-px h-3 bg-black/10 mx-0.5" />
          <button
            onClick={() => setLoupeActive(!loupeActive)}
            className={`p-1 transition-colors rounded focus-visible:ring-2 focus-visible:ring-apple-blue ${loupeActive ? 'text-apple-blue font-bold' : 'hover:text-apple-text'}`}
            title="Magnifying Loupe"
            aria-label="Toggle magnifying loupe"
          >
            <Search className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={resetView}
            className="p-1 hover:text-apple-blue transition-colors rounded focus-visible:ring-2 focus-visible:ring-apple-blue"
            title="Reset Camera"
            aria-label="Reset 3D camera view"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D Stage Viewport — pointer capture for mouse drag, but touch-action:pan-y passes vertical finger swipes to native scroll */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className="w-full max-w-xl min-h-[290px] sm:min-h-[270px] flex items-center justify-center cursor-grab active:cursor-grabbing select-none relative my-2 overflow-visible mx-auto"
        style={{ perspective: '1200px', touchAction: 'pan-y' }}
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
          className="relative w-full max-w-[420px] min-h-[270px] sm:min-h-[250px] mx-auto flex flex-col"
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
              className={`w-full min-h-full rounded-2xl sm:rounded-3xl p-3.5 sm:p-4 shadow-xl border border-black/10 bg-gradient-to-br ${currentPlate.color} flex flex-col justify-between relative backdrop-blur-md mx-auto`}
              style={{
                boxShadow: '0 20px 40px -12px rgba(0, 0, 0, 0.14), 0 0 0 1px rgba(0, 0, 0, 0.05)'
              }}
            >
              {/* Paper Watermark Texture */}
              <div className="absolute inset-0 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] opacity-[0.03] pointer-events-none rounded-2xl sm:rounded-3xl" />

              {/* Plate Header */}
              <div className="relative z-10 flex items-center justify-between border-b border-black/5 pb-1.5">
                <span className="text-[10px] font-mono font-bold text-apple-blue px-2 py-0.5 rounded-full bg-white border border-blue-200 shadow-apple-xs flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  {currentPlate.figure}
                </span>
                <span className="text-[8px] sm:text-[9px] font-mono text-apple-tertiary">
                  Vaswani et al. (2017)
                </span>
              </div>

              {/* Plate Main Title & Body */}
              <div className="relative z-10 my-auto py-1 space-y-1 overflow-visible">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-apple-text font-mono leading-snug">
                    {currentPlate.title}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-apple-secondary font-mono">
                    {currentPlate.subtitle}
                  </p>
                </div>

                <div className="p-1.5 sm:p-2 rounded-xl bg-white/90 border border-black/5 shadow-apple-xs font-mono text-[11px] sm:text-xs text-apple-text break-words">
                  <MarkdownRenderer content={currentPlate.content} />
                </div>

                <div className="text-[10px] sm:text-[11px] text-apple-secondary leading-relaxed font-sans break-words">
                  <MarkdownRenderer content={currentPlate.body} />
                </div>
              </div>

              {/* Plate Footer Details */}
              <div className="relative z-10 border-t border-black/5 pt-1 flex items-center justify-between gap-1 flex-wrap">
                <div className="flex items-center gap-1 flex-wrap">
                  {currentPlate.details.map((d, i) => (
                    <span
                      key={i}
                      className="text-[8px] sm:text-[9px] font-mono text-apple-secondary bg-black/5 px-1.5 py-0.2 rounded font-semibold"
                    >
                      {d}
                    </span>
                  ))}
                </div>
                <span className="text-[8px] sm:text-[9px] font-mono text-apple-tertiary shrink-0">
                  Plate {currentPage + 1}/{paperPages.length}
                </span>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Magnifying Loupe Overlay */}
          {loupeActive && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="absolute w-32 h-32 sm:w-36 sm:h-36 rounded-full border-4 border-apple-blue bg-white shadow-2xl pointer-events-none z-40 overflow-hidden flex items-center justify-center backdrop-blur-md"
              style={{
                top: `${loupePos.y}%`,
                left: `${loupePos.x}%`,
                transform: 'translate(-50%, -50%)',
                boxShadow: '0 20px 40px rgba(0, 113, 227, 0.35)'
              }}
            >
              <div className="text-center p-2 font-mono text-xs text-apple-blue font-bold break-words">
                <span className="text-[9px] text-apple-tertiary block mb-0.5">1.35x Lens</span>
                <MarkdownRenderer content={currentPlate.content} />
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Bottom Spread Navigator Controls */}
      <div className="w-full max-w-xl mx-auto flex items-center justify-between z-30 pt-2.5 border-t border-black/5 flex-wrap gap-1.5">
        <button
          onClick={prevPage}
          className="flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-full bg-white border border-black/10 shadow-apple-xs hover:border-blue-300 hover:text-apple-blue text-apple-secondary text-[11px] sm:text-xs font-mono font-bold transition-all min-h-[36px] focus-visible:ring-2 focus-visible:ring-apple-blue"
          aria-label="Previous plate"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Previous</span>
        </button>

        {/* Spread Navigation Dots */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {paperPages.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentPage(idx)}
              className={`h-1.5 sm:h-2 rounded-full transition-all focus-visible:ring-2 focus-visible:ring-apple-blue ${
                idx === currentPage
                  ? 'w-4 sm:w-6 bg-apple-blue shadow-apple-sm'
                  : 'w-1.5 sm:w-2 bg-black/15 hover:bg-black/30'
              }`}
              title={`Jump to Plate ${idx + 1}`}
              aria-label={`Go to plate ${idx + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextPage}
          className="flex items-center gap-1 px-3 sm:px-3.5 py-1.5 rounded-full bg-white border border-black/10 shadow-apple-xs hover:border-blue-300 hover:text-apple-blue text-apple-secondary text-[11px] sm:text-xs font-mono font-bold transition-all min-h-[36px] focus-visible:ring-2 focus-visible:ring-apple-blue"
          aria-label="Next plate"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export default Sketchbook;
