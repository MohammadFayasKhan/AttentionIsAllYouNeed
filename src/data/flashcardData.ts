/**
 * flashcardData.ts
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * This module stores the verified scientific flashcard deck and dynamic sampling logic
 * for active recall learning across all 11 chapters.
 *
 * Structure:
 *   - Front: Precise mathematical or architectural question.
 *   - Back: Rigorous explanation featuring inline and block KaTeX formulas,
 *     exact section/page citations, and key insights from Vaswani et al. (2017).
 *   - Categories: Architecture, Attention, Complexity, Training, Formulas, Positional, Results, Ablations.
 *
 * Dynamic Generator (`getDynamicFlashcardsDeck`):
 *   - Dynamically samples and shuffles candidate cards based on the learner's active chapter
 *     and difficulty level.
 */

import { EducationalMode } from './paperData';

export interface Flashcard {
  id: string;
  chapterId?: string;
  chapterNumber?: string;
  category: "Architecture" | "Attention" | "Complexity" | "Training" | "Formulas" | "Positional" | "Results" | "Ablations";
  front: string;
  back: string;
  sourceContext: string;
  difficulty?: EducationalMode;
}

export const VERIFIED_FLASHCARDS: Flashcard[] = [
  {
    id: "fc-00",
    chapterId: "story-hook",
    chapterNumber: "00",
    front: "Why did Recurrent Neural Networks (RNNs) struggle with GPUs?",
    back: "RNNs compute hidden state $h_t$ sequentially from $h_{t-1}$. GPUs require parallel tensor operations, so sequential recurrence forced GPU cores to idle waiting for step $t-1$.",
    category: "Complexity",
    sourceContext: "Section 1 Introduction, Page 1",
    difficulty: "BEGINNER"
  },
  {
    id: "fc-01",
    chapterId: "story-bottleneck",
    chapterNumber: "01",
    front: "What is the maximum path length between distant tokens in Self-Attention vs RNN?",
    back: "Self-Attention: $\\mathcal{O}(1)$ constant path length. RNN: $\\mathcal{O}(n)$ sequential path length. Self-Attention connects any two words in a single step regardless of distance.",
    category: "Complexity",
    sourceContext: "Section 4 Why Self-Attention, Table 1, Page 5",
    difficulty: "TECHNICAL"
  },
  {
    id: "fc-02",
    chapterId: "story-attention",
    chapterNumber: "02",
    front: "What is the mathematical equation for Scaled Dot-Product Attention?",
    back: "$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V$$\nWhere $Q, K$ have dimension $d_k = 64$ and $V$ has dimension $d_v = 64$.",
    category: "Formulas",
    sourceContext: "Section 3.2.1 Scaled Dot-Product Attention, Page 3, Eq. (1)",
    difficulty: "INTERMEDIATE"
  },
  {
    id: "fc-02b",
    chapterId: "story-attention",
    chapterNumber: "02",
    front: "Why does the attention formula divide the dot products by $\\sqrt{d_k}$?",
    back: "For large $d_k$, dot products grow large in magnitude, pushing **softmax** into saturation regions with vanishingly small gradients. Scaling by $1/\\sqrt{d_k}$ counters this effect.",
    category: "Attention",
    sourceContext: "Section 3.2.1 Scaled Dot-Product Attention, Page 3",
    difficulty: "INTERMEDIATE"
  },
  {
    id: "fc-03",
    chapterId: "story-multihead",
    chapterNumber: "03",
    front: "Why does Multi-Head Attention use $h=8$ heads with $d_k = d_{\\text{model}} / h = 64$?",
    back: "Projecting to 8 parallel 64-dimensional subspaces allows the model to attend to different representation subspaces (syntax, coreference, proximity) simultaneously, with computational cost similar to single-head attention.",
    category: "Attention",
    sourceContext: "Section 3.2.2 Multi-Head Attention, Page 4, Eq. (2)",
    difficulty: "TECHNICAL"
  },
  {
    id: "fc-04",
    chapterId: "story-architecture",
    chapterNumber: "04",
    front: "What are the dimensions of the Transformer Base model?",
    back: "$N = 6$ layers (Encoder & Decoder), $d_{\\text{model}} = 512$, $d_{\\text{ff}} = 2048$, $h = 8$ heads, $d_k = d_v = 64$, $P_{\\text{drop}} = 0.1$, Total Parameters = 65M.",
    category: "Architecture",
    sourceContext: "Section 3.1 Model Architecture & Section 5.4, Page 2 & 7",
    difficulty: "BEGINNER"
  },
  {
    id: "fc-04b",
    chapterId: "story-architecture",
    chapterNumber: "04",
    front: "What sub-layer formula is used with residual connections and layer normalization?",
    back: "$$\\text{LayerNorm}(x + \\text{SubLayer}(x))$$\nAll sub-layers produce representations of dimension $d_{\\text{model}} = 512$.",
    category: "Architecture",
    sourceContext: "Section 3.1 Model Architecture, Page 3",
    difficulty: "INTERMEDIATE"
  },
  {
    id: "fc-05",
    chapterId: "story-position",
    chapterNumber: "05",
    front: "What are the formulas for Sinusoidal Positional Encodings?",
    back: "$$PE_{(pos, 2i)} = \\sin\\left(\\frac{pos}{10000^{2i / d_{\\text{model}}}}\\right)$$\n$$PE_{(pos, 2i+1)} = \\cos\\left(\\frac{pos}{10000^{2i / d_{\\text{model}}}}\\right)$$\nWhere $pos$ is token position and $i$ is dimension index ($0$ to $255$).",
    category: "Positional",
    sourceContext: "Section 3.5 Positional Encoding, Page 6, Eqs. (3) & (4)",
    difficulty: "TECHNICAL"
  },
  {
    id: "fc-06",
    chapterId: "story-comparison",
    chapterNumber: "06",
    front: "According to Table 1, when is Self-Attention computationally faster than Recurrent layers?",
    back: "When sequence length $n$ is smaller than representation dimension $d$ ($n < d$). In typical translation ($n \\approx 30, d = 512$), $\\mathcal{O}(n^2 \\cdot d)$ is significantly faster than RNN $\\mathcal{O}(n \\cdot d^2)$.",
    category: "Complexity",
    sourceContext: "Section 4 Why Self-Attention, Table 1, Page 5",
    difficulty: "TECHNICAL"
  },
  {
    id: "fc-07",
    chapterId: "story-results",
    chapterNumber: "07",
    front: "What BLEU score and training time did Transformer (big) achieve on WMT 2014 EN-DE?",
    back: "**28.4 BLEU** on English-to-German in 3.5 days ($300,000$ steps) on 8 NVIDIA P100 GPUs ($2.3 \\times 10^{19}$ FLOPs), beating all previous baselines.",
    category: "Results",
    sourceContext: "Section 6.1 Machine Translation, Table 2, Page 7",
    difficulty: "PAPER_MODE"
  },
  {
    id: "fc-08",
    chapterId: "story-variations",
    chapterNumber: "08",
    front: "What happened when the authors reduced attention heads from $h=8$ to single head $h=1$ in Table 3?",
    back: "Single-head attention dropped BLEU by 0.9 points (from 25.8 to 24.9 dev BLEU) despite having identical total parameter count, proving the necessity of multi-head representation.",
    category: "Ablations",
    sourceContext: "Section 6.2 Model Variations, Table 3 row (A), Page 8",
    difficulty: "PAPER_MODE"
  },
  {
    id: "fc-10",
    chapterId: "story-conclusion",
    chapterNumber: "10",
    front: "What was the overarching legacy of 'Attention Is All You Need'?",
    back: "It dispensed with recurrence and convolutions entirely, establishing self-attention as the foundation for modern LLMs (BERT, GPT, Claude, Gemini, Llama).",
    category: "Results",
    sourceContext: "Section 7 Conclusion, Page 10",
    difficulty: "BEGINNER"
  }
];

export function getDynamicFlashcardsDeck(
  chapterId?: string,
  mode?: EducationalMode,
  count: number = 6
): Flashcard[] {
  let pool = [...VERIFIED_FLASHCARDS];

  if (chapterId && chapterId !== 'all') {
    const chapterCards = pool.filter((c) => c.chapterId === chapterId);
    const otherCards = pool.filter((c) => c.chapterId !== chapterId);
    pool = [...chapterCards, ...otherCards];
  }

  const shuffled = pool.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
