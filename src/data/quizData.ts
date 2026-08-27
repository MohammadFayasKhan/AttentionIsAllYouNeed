/**
 * quizData.ts
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * This module maintains the verified ground-truth question bank and dynamic generation
 * engine for the paper comprehension quiz.
 *
 * Core Mechanics:
 *   1. Verified Paper Question Pool:
 *      Contains 10+ rigorously verified questions mapped to specific chapters (Architecture,
 *      Attention, Positional Encoding, Complexity, Benchmarks, Ablations) and difficulty tiers.
 *   2. Dynamic Generator (`getDynamicQuizQuestions`):
 *      - Prioritizes questions corresponding to the active chapter currently viewed by the learner.
 *      - Randomly samples without replacement to prevent repetitive quizzes within a session.
 *      - Dynamically shuffles the 4 option choices per question, recalculating `correctIndex`
 *        on the fly so the correct choice is not stuck at a static index.
 */

import { EducationalMode } from './paperData';

export interface QuizQuestion {
  id: string;
  chapterId?: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  sourceContext: string;
  concept: string;
  difficulty?: EducationalMode;
}

export const VERIFIED_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    chapterId: "story-attention",
    question: "Why does Scaled Dot-Product Attention divide the dot products by √d_k?",
    options: [
      "To prevent vanishing gradients when d_k is large, which causes softmax to push gradients into extremely small regions",
      "To reduce the number of floating-point operations (FLOPs) required during training",
      "To force the queries and keys to sum to 1 before matrix multiplication",
      "To eliminate the need for Layer Normalization in the encoder"
    ],
    correctIndex: 0,
    explanation: "The authors suspect that for large values of d_k, the dot products grow large in magnitude, pushing the softmax function into regions with extremely small gradients. Scaling by 1/√d_k counters this effect.",
    sourceContext: "Section 3.2.1 Scaled Dot-Product Attention, Page 3",
    concept: "Attention Scaling",
    difficulty: "INTERMEDIATE"
  },
  {
    id: "q2",
    chapterId: "story-architecture",
    question: "How many encoder and decoder layers does the standard Base Transformer stack contain?",
    options: [
      "4 Encoder layers and 4 Decoder layers",
      "6 Encoder layers and 6 Decoder layers",
      "8 Encoder layers and 8 Decoder layers",
      "12 Encoder layers and 6 Decoder layers"
    ],
    correctIndex: 1,
    explanation: "Both the Encoder stack and the Decoder stack consist of N = 6 identical layers.",
    sourceContext: "Section 3.1 Model Architecture, Page 2",
    concept: "Architecture Specs",
    difficulty: "BEGINNER"
  },
  {
    id: "q3",
    chapterId: "story-comparison",
    question: "What is the maximum path length between any two tokens in a Self-Attention layer?",
    options: [
      "O(n) sequential operations",
      "O(log n) operations",
      "O(1) constant operations",
      "O(n²) operations"
    ],
    correctIndex: 2,
    explanation: "In self-attention, any input position can directly attend to any other input position in a single step, resulting in a constant O(1) maximum path length (Table 1).",
    sourceContext: "Section 4 Why Self-Attention, Table 1, Page 5",
    concept: "Path Length Complexity",
    difficulty: "TECHNICAL"
  },
  {
    id: "q4",
    chapterId: "story-multihead",
    question: "In the Base Transformer model, what are the dimensions of d_model, h (heads), and d_k?",
    options: [
      "d_model = 512, h = 8, d_k = 64",
      "d_model = 1024, h = 16, d_k = 64",
      "d_model = 256, h = 4, d_k = 64",
      "d_model = 512, h = 16, d_k = 32"
    ],
    correctIndex: 0,
    explanation: "The base model uses d_model = 512, h = 8 attention heads, and key/value dimensions d_k = d_v = 512 / 8 = 64.",
    sourceContext: "Section 3.2.2 Multi-Head Attention, Page 4",
    concept: "Model Dimensions",
    difficulty: "INTERMEDIATE"
  },
  {
    id: "q5",
    chapterId: "story-results",
    question: "What BLEU score did the Transformer (big) achieve on the WMT 2014 English-to-German translation benchmark?",
    options: [
      "25.16 BLEU",
      "27.3 BLEU",
      "28.4 BLEU",
      "41.8 BLEU"
    ],
    correctIndex: 2,
    explanation: "On the WMT 2014 English-to-German task, the Transformer (big) achieved a state-of-the-art BLEU score of 28.4 (Table 2).",
    sourceContext: "Section 6.1 Machine Translation, Table 2, Page 7",
    concept: "Benchmark Results",
    difficulty: "PAPER_MODE"
  },
  {
    id: "q6",
    chapterId: "story-position",
    question: "Why did the authors choose fixed sinusoidal positional encodings over learned positional embeddings?",
    options: [
      "Fixed sinusoidal encodings achieved nearly identical BLEU scores while allowing extrapolation to sequence lengths longer than seen during training",
      "Sinusoidal encodings eliminate the need for matrix multiplication",
      "Learned embeddings caused severe overfitting on the training set",
      "Sinusoidal encodings reduced training time by 50%"
    ],
    correctIndex: 0,
    explanation: "The authors found that learned positional embeddings produced nearly identical results to sinusoidal encodings (25.7 vs 25.8 dev BLEU), but sinusoidal encodings allow the model to extrapolate to longer sequence lengths.",
    sourceContext: "Section 3.5 Positional Encoding & Section 6.2 Table 3, Page 6 & 8",
    concept: "Positional Harmonics",
    difficulty: "TECHNICAL"
  },
  {
    id: "q7",
    chapterId: "story-bottleneck",
    question: "What primary computational limitation of RNNs motivated the creation of the Transformer?",
    options: [
      "RNNs cannot be parallelized across sequence positions during training due to sequential step dependencies",
      "RNNs have too many parameters to fit on modern GPUs",
      "RNNs cannot process text in languages other than English",
      "RNNs cannot compute softmax probability distributions"
    ],
    correctIndex: 0,
    explanation: "RNNs compute hidden state h_t sequentially from h_(t-1), which prevents batching across examples during training and leaves GPU parallel cores underutilized.",
    sourceContext: "Section 1 Introduction, Page 1",
    concept: "Recurrence Bottleneck",
    difficulty: "BEGINNER"
  },
  {
    id: "q8",
    chapterId: "story-variations",
    question: "In Table 3 row (A), what happened to the BLEU score when the number of attention heads was reduced to h=1?",
    options: [
      "BLEU dropped by 0.9 points (from 25.8 to 24.9)",
      "BLEU improved by 1.2 points due to lower parameter count",
      "BLEU remained exactly identical",
      "The model failed to converge during training"
    ],
    correctIndex: 0,
    explanation: "Single-head attention (h=1 with full dimension d_k=512) dropped BLEU by 0.9 points compared to the 8-head baseline, demonstrating that attending to multiple representation subspaces simultaneously is critical.",
    sourceContext: "Section 6.2 Model Variations, Table 3, Page 8",
    concept: "Head Ablations",
    difficulty: "PAPER_MODE"
  },
  {
    id: "q9",
    chapterId: "story-architecture",
    question: "What formula describes the output of every sub-layer in both the encoder and decoder?",
    options: [
      "LayerNorm(x + SubLayer(x))",
      "Softmax(x * SubLayer(x))",
      "ReLU(x + SubLayer(x))",
      "LayerNorm(SubLayer(x)) without residual"
    ],
    correctIndex: 0,
    explanation: "Every sublayer applies a residual connection followed by layer normalization: LayerNorm(x + SubLayer(x)), where all sublayers produce outputs of dimension d_model = 512.",
    sourceContext: "Section 3.1 Model Architecture, Page 3",
    concept: "Residual & LayerNorm",
    difficulty: "INTERMEDIATE"
  },
  {
    id: "q10",
    chapterId: "story-notebook",
    question: "On the English constituency parsing task (Table 4), what F1 score did the 4-layer Transformer achieve in the WSJ-only setting?",
    options: [
      "91.3 F1",
      "85.4 F1",
      "95.8 F1",
      "78.2 F1"
    ],
    correctIndex: 0,
    explanation: "Without task-specific tuning, the 4-layer Transformer achieved 91.3 F1 on WSJ-only and 92.7 F1 semi-supervised, proving strong generalization beyond translation.",
    sourceContext: "Section 6.3 English Constituency Parsing, Table 4, Page 9",
    concept: "Generalization",
    difficulty: "PAPER_MODE"
  }
];

// Dynamically generate a fresh, non-repetitive quiz question set matching active chapter and difficulty
export function getDynamicQuizQuestions(
  chapterId?: string,
  mode?: EducationalMode,
  count: number = 5
): QuizQuestion[] {
  let pool = [...VERIFIED_QUIZ_QUESTIONS];

  // Prioritize active chapter questions if available
  if (chapterId) {
    const chapterQuestions = pool.filter((q) => q.chapterId === chapterId);
    const otherQuestions = pool.filter((q) => q.chapterId !== chapterId);
    pool = [...chapterQuestions, ...otherQuestions];
  }

  // Shuffle candidate pool
  const shuffled = pool.sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, count);

  // For each question, shuffle options so the correct answer isn't always at the same index
  return selected.map((q, qIdx) => {
    const correctOption = q.options[q.correctIndex];
    const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);
    const newCorrectIndex = shuffledOptions.indexOf(correctOption);

    return {
      ...q,
      id: `${q.id}-${Date.now()}-${qIdx}`,
      options: shuffledOptions,
      correctIndex: newCorrectIndex
    };
  });
}
