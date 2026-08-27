export type ProvenanceTag = 'FROM PAPER' | 'DERIVED' | 'ILLUSTRATIVE' | 'EXTERNAL';
export type EducationalMode = 'BEGINNER' | 'INTERMEDIATE' | 'TECHNICAL' | 'PAPER_MODE';

export interface PaperMetadata {
  title: string;
  authors: string[];
  conference: string;
  year: number;
  arxivId: string;
  abstract: string;
  provenance: ProvenanceTag;
}

export interface ModelArchSpecs {
  N_layers: number;
  d_model: number;
  d_ff: number;
  h_heads: number;
  d_k: number;
  d_v: number;
  P_drop: number;
  eps_ls: number;
  params: string;
  provenance: ProvenanceTag;
}

export interface Table1Row {
  layerType: string;
  complexityPerLayer: string;
  sequentialOps: string;
  maxPathLength: string;
  notes: string;
  provenance: ProvenanceTag;
}

export interface Table2Row {
  model: string;
  bleuEnDe?: number | null;
  bleuEnFr?: number | null;
  trainingCostFlops: string;
  gpus?: string;
  trainingTime?: string;
  isTransformer: boolean;
  provenance: ProvenanceTag;
}

export interface Table3Row {
  setting: string;
  N: number;
  d_model: number;
  d_ff: number;
  h: number;
  d_k: number;
  d_v: number;
  P_drop: number;
  P_ls: number;
  trainSteps: string;
  devPPL: number;
  devBLEU: number;
  paramsM: number;
  findingNote: string;
  provenance: ProvenanceTag;
}

export interface Table4Row {
  model: string;
  wsjOnlyF1: number | null;
  semiSupervisedF1: number | null;
  paramsM?: string;
  provenance: ProvenanceTag;
}

export interface ChapterDifficultyDetail {
  subtitle: string;
  body: string[];
  takeaway: string;
  assistantPrompts: string[];
}

export interface StoryChapter {
  id: string;
  chapterNumber: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  body: string[];
  keyTakeaway: string;
  provenance: ProvenanceTag;
  sourceReference: {
    section: string;
    page: number;
    figureOrTable?: string;
  };
  oneeMood: string;
  assistantPrompts: string[];
  difficultyDetails?: Record<EducationalMode, ChapterDifficultyDetail>;
}

export const PAPER_METADATA: PaperMetadata = {
  title: "Attention Is All You Need",
  authors: [
    "Ashish Vaswani",
    "Noam Shazeer",
    "Niki Parmar",
    "Jakob Uszkoreit",
    "Llion Jones",
    "Aidan N. Gomez",
    "Łukasz Kaiser",
    "Illia Polosukhin"
  ],
  conference: "NIPS 2017 (Neural Information Processing Systems)",
  year: 2017,
  arxivId: "1706.03762v7",
  abstract: "The dominant sequence transduction models are based on complex recurrent or convolutional neural networks that include an encoder and a decoder. The best performing models also connect the encoder and decoder through an attention mechanism. We propose a new simple network architecture, the Transformer, based solely on attention mechanisms, dispensing with recurrence and convolutions entirely.",
  provenance: "FROM PAPER"
};

export const BASE_MODEL_SPECS: ModelArchSpecs = {
  N_layers: 6,
  d_model: 512,
  d_ff: 2048,
  h_heads: 8,
  d_k: 64,
  d_v: 64,
  P_drop: 0.1,
  eps_ls: 0.1,
  params: "65M",
  provenance: "FROM PAPER"
};

export const BIG_MODEL_SPECS: ModelArchSpecs = {
  N_layers: 6,
  d_model: 1024,
  d_ff: 4096,
  h_heads: 16,
  d_k: 64,
  d_v: 64,
  P_drop: 0.3,
  eps_ls: 0.1,
  params: "213M",
  provenance: "FROM PAPER"
};

export const TABLE_1_COMPLEXITY: Table1Row[] = [
  {
    layerType: "Self-Attention",
    complexityPerLayer: "O(n² · d)",
    sequentialOps: "O(1)",
    maxPathLength: "O(1)",
    notes: "Constant sequential operations allow massive parallelization on modern hardware.",
    provenance: "FROM PAPER"
  },
  {
    layerType: "Recurrent (RNN/LSTM)",
    complexityPerLayer: "O(n · d²)",
    sequentialOps: "O(n)",
    maxPathLength: "O(n)",
    notes: "Sequential bottleneck requires n time steps, inhibiting parallel training.",
    provenance: "FROM PAPER"
  },
  {
    layerType: "Convolutional",
    complexityPerLayer: "O(k · n · d²)",
    sequentialOps: "O(1)",
    maxPathLength: "O(log_k(n))",
    notes: "Requires stacking layers to connect distant position pairs.",
    provenance: "FROM PAPER"
  },
  {
    layerType: "Self-Attention (restricted)",
    complexityPerLayer: "O(r · n · d)",
    sequentialOps: "O(1)",
    maxPathLength: "O(n/r)",
    notes: "Considers only neighborhood r of size around each input position.",
    provenance: "FROM PAPER"
  }
];

export const TABLE_2_BENCHMARKS: Table2Row[] = [
  {
    model: "Transformer (big)",
    bleuEnDe: 28.4,
    bleuEnFr: 41.8,
    trainingCostFlops: "2.3e19",
    gpus: "8 P100 GPUs",
    trainingTime: "3.5 days",
    isTransformer: true,
    provenance: "FROM PAPER"
  },
  {
    model: "Transformer (base)",
    bleuEnDe: 27.3,
    bleuEnFr: 38.1,
    trainingCostFlops: "3.3e18",
    gpus: "8 P100 GPUs",
    trainingTime: "12 hours",
    isTransformer: true,
    provenance: "FROM PAPER"
  },
  {
    model: "ByteNet",
    bleuEnDe: 23.75,
    bleuEnFr: null,
    trainingCostFlops: "1.0e19",
    isTransformer: false,
    provenance: "FROM PAPER"
  },
  {
    model: "Deep-Att + PosUnk",
    bleuEnDe: null,
    bleuEnFr: 39.2,
    trainingCostFlops: "1.0e20",
    isTransformer: false,
    provenance: "FROM PAPER"
  },
  {
    model: "GNMT + RL",
    bleuEnDe: 24.6,
    bleuEnFr: 39.92,
    trainingCostFlops: "2.3e19",
    isTransformer: false,
    provenance: "FROM PAPER"
  },
  {
    model: "ConvS2S",
    bleuEnDe: 25.16,
    bleuEnFr: 40.46,
    trainingCostFlops: "9.6e19",
    isTransformer: false,
    provenance: "FROM PAPER"
  }
];

export const TABLE_2_TRANSLATION = TABLE_2_BENCHMARKS;

export const TABLE_3_VARIATIONS: Table3Row[] = [
  {
    setting: "Base Model",
    N: 6,
    d_model: 512,
    d_ff: 2048,
    h: 8,
    d_k: 64,
    d_v: 64,
    P_drop: 0.1,
    P_ls: 0.1,
    trainSteps: "100k",
    devPPL: 4.92,
    devBLEU: 25.8,
    paramsM: 65,
    findingNote: "The baseline model settings establishing the initial benchmark.",
    provenance: "FROM PAPER"
  },
  {
    setting: "(A) Single-head (h=1)",
    N: 6,
    d_model: 512,
    d_ff: 2048,
    h: 1,
    d_k: 512,
    d_v: 512,
    P_drop: 0.1,
    P_ls: 0.1,
    trainSteps: "100k",
    devPPL: 5.29,
    devBLEU: 24.9,
    paramsM: 65,
    findingNote: "Single-head attention performs 0.9 BLEU worse than 8 heads despite identical parameter count.",
    provenance: "FROM PAPER"
  },
  {
    setting: "(A) Too many heads (h=32)",
    N: 6,
    d_model: 512,
    d_ff: 2048,
    h: 32,
    d_k: 16,
    d_v: 16,
    P_drop: 0.1,
    P_ls: 0.1,
    trainSteps: "100k",
    devPPL: 5.01,
    devBLEU: 25.4,
    paramsM: 65,
    findingNote: "Having too many heads (d_k=16) reduces capacity per head, degrading BLEU.",
    provenance: "FROM PAPER"
  },
  {
    setting: "(B) Small keys (d_k=16)",
    N: 6,
    d_model: 512,
    d_ff: 2048,
    h: 8,
    d_k: 16,
    d_v: 16,
    P_drop: 0.1,
    P_ls: 0.1,
    trainSteps: "100k",
    devPPL: 5.16,
    devBLEU: 25.1,
    paramsM: 58,
    findingNote: "Reducing key dimension d_k hurts model quality, demonstrating key size importance.",
    provenance: "FROM PAPER"
  },
  {
    setting: "(C) Bigger Model (N=8)",
    N: 8,
    d_model: 512,
    d_ff: 2048,
    h: 8,
    d_k: 64,
    d_v: 64,
    P_drop: 0.1,
    P_ls: 0.1,
    trainSteps: "100k",
    devPPL: 4.73,
    devBLEU: 26.4,
    paramsM: 75,
    findingNote: "Increasing layer depth improves representation capacity and translation score.",
    provenance: "FROM PAPER"
  },
  {
    setting: "(D) High Dropout (P_drop=0.2)",
    N: 6,
    d_model: 512,
    d_ff: 2048,
    h: 8,
    d_k: 64,
    d_v: 64,
    P_drop: 0.2,
    P_ls: 0.1,
    trainSteps: "100k",
    devPPL: 5.03,
    devBLEU: 25.5,
    paramsM: 65,
    findingNote: "Higher dropout acts as regularizer but slightly reduces raw development BLEU.",
    provenance: "FROM PAPER"
  },
  {
    setting: "(E) Learned Positional Embed",
    N: 6,
    d_model: 512,
    d_ff: 2048,
    h: 8,
    d_k: 64,
    d_v: 64,
    P_drop: 0.1,
    P_ls: 0.1,
    trainSteps: "100k",
    devPPL: 4.92,
    devBLEU: 25.7,
    paramsM: 65,
    findingNote: "Learned positional embeddings perform nearly identically to fixed sinusoidal functions.",
    provenance: "FROM PAPER"
  }
];

export const STORY_CHAPTERS: StoryChapter[] = [
  {
    id: "story-hook",
    chapterNumber: "00",
    eyebrow: "THE HOOK",
    title: "What if a model didn't read one word at a time?",
    subtitle: "Before 2017, neural networks read text like a human turns pages ➔ sequentially, step by slow step.",
    body: [
      "For decades, natural language processing relied on recurrent neural networks (RNNs, LSTMs, and GRUs). To understand the 50th word in a sentence, an RNN had to process word 1, then word 2, all the way to word 49.",
      "This created a computational bottleneck: GPUs, which thrive on massive parallel computing, were left waiting in line. The Transformer changed everything by asking a radically simple question: what if we process every word simultaneously?"
    ],
    keyTakeaway: "Sequential processing creates an architectural bottleneck that limits both model capacity and training scalability.",
    provenance: "FROM PAPER",
    sourceReference: {
      section: "1. Introduction",
      page: 1
    },
    oneeMood: "neutral",
    assistantPrompts: [
      "Why was sequential processing a bottleneck?",
      "How did RNNs handle long text?",
      "What made GPUs struggle with RNNs?"
    ],
    difficultyDetails: {
      BEGINNER: {
        subtitle: "Imagine having to read a whole book word-by-word with no skipping ahead vs seeing the whole sentence at once.",
        body: [
          "Before 2017, AI translated language one single word at a time. If a sentence had 50 words, the computer had to wait 50 steps before it could even start understanding the end.",
          "The Transformer eliminated this waiting line completely: it lets computers process every word in a document at the exact same instant."
        ],
        takeaway: "Eliminating the word-by-word waiting line allowed computers to learn language thousands of times faster.",
        assistantPrompts: [
          "Explain the Transformer like I'm 10",
          "What is an RNN in simple words?",
          "Why do GPUs like parallel computing?"
        ]
      },
      INTERMEDIATE: {
        subtitle: "Recurrent networks forced O(n) sequential execution. The Transformer enabled O(1) step parallelization.",
        body: [
          "Recurrent models compute hidden state h_t sequentially from h_(t-1). This sequential dependency prevents parallel execution across GPU cores during training.",
          "Vaswani et al. proposed dispensing with recurrence entirely, using self-attention to connect all positions directly in constant O(1) sequential steps."
        ],
        takeaway: "Self-attention enables massive GPU hardware parallelization while preserving full cross-word relationship modeling.",
        assistantPrompts: [
          "Why couldn't RNNs scale to billions of parameters?",
          "How does self-attention replace recurrence?",
          "What is sequential execution complexity?"
        ]
      },
      TECHNICAL: {
        subtitle: "Eliminating the temporal recurrence constraint: transitioning from sequential h_t = f(h_{t-1}, x_t) to parallel matrix operations.",
        body: [
          "In RNNs, sequential computation forces O(n) time complexity per training sample, severely limiting maximum context length and batch parallel throughput.",
          "The Transformer replaces temporal hidden-state propagation with unconstrained all-to-all dot-product self-attention, transforming language modeling into highly optimized dense matrix multiplications."
        ],
        takeaway: "Dense matrix multiplications (GEMM) achieve near-optimal FLOP utilization on SIMD/GPU tensor cores compared to sequential recurrence.",
        assistantPrompts: [
          "Calculate GPU memory bandwidth vs compute bound for RNNs",
          "What are the mathematical limitations of LSTM cell gates?",
          "Explain gradient backpropagation through time (BPTT) issues"
        ]
      },
      PAPER_MODE: {
        subtitle: "Verbatim: 'Recurrent models typically factor computation along the symbol positions of the input and output sequences.' (Section 1, Page 1)",
        body: [
          "'Aligning the positions to steps in computation time, they generate a sequence of hidden states h_t, as a function of the previous hidden state h_{t-1} and the input for position t.'",
          "'This inherently sequential nature precludes parallelization within training examples, which becomes critical at longer sequence lengths, as memory constraints limit batching across examples.'"
        ],
        takeaway: "Verbatim: 'We propose the Transformer, a model architecture eschewing recurrence and instead relying entirely on an attention mechanism.'",
        assistantPrompts: [
          "Cite Section 1 introduction exact quotes",
          "What paper references are cited in Section 1?",
          "What did Vaswani et al. say about memory constraints?"
        ]
      }
    }
  },
  {
    id: "story-bottleneck",
    chapterNumber: "01",
    eyebrow: "THE RECURRENCE TRAP",
    title: "The Limits of Recurrence & Convolution",
    subtitle: "Recurrent models compute linearly along sequence positions. Convolutions require stacking layers to connect distant words.",
    body: [
      "In recurrent architectures, computation at step t depends on hidden state h_(t-1). This fundamental sequential nature prevents parallelization within training examples, which becomes critical at longer sequence lengths.",
      "Convolutional models (like ByteNet or ConvS2S) achieved parallelization, but learning relationships between two words separated by distance n required stacking log_k(n) or n convolutional layers.",
      "The paper proposed abandoning both recurrence and convolution entirely in favor of self-attention."
    ],
    keyTakeaway: "Self-attention reduces the maximum path length between any two words to a constant O(1) operations.",
    provenance: "FROM PAPER",
    sourceReference: {
      section: "2. Background & Section 4",
      page: 2,
      figureOrTable: "Table 1"
    },
    oneeMood: "skeptical-left",
    assistantPrompts: [
      "Compare RNN vs Convolution vs Self-Attention",
      "What is path length in neural networks?",
      "Why did Vaswani et al. drop recurrence?"
    ],
    difficultyDetails: {
      BEGINNER: {
        subtitle: "Connecting two distant words used to require playing a game of telephone across dozens of steps.",
        body: [
          "In older systems, for the first word in a paragraph to talk to the last word, the message had to travel through every word in between. By the time it reached the end, key details were often forgotten.",
          "Self-attention acts like an instant direct phone call between any two words in the text, no matter how far apart they are."
        ],
        takeaway: "Direct connections mean the model never forgets earlier words in long sentences.",
        assistantPrompts: [
          "Why did RNNs forget words at the beginning?",
          "How is a direct connection faster?",
          "What is convolution in simple terms?"
        ]
      },
      INTERMEDIATE: {
        subtitle: "Maximum path length: RNNs require O(n) steps, ConvNets require O(log_k(n)) layers, Self-Attention requires O(1).",
        body: [
          "Shorter path lengths make it easier to learn long-range dependencies. In RNNs, gradients must backpropagate through n time steps, leading to vanishing or exploding gradients.",
          "In Convolutional networks (like ByteNet), receptive field growth requires stacking deep convolutional hierarchies. Self-Attention connects all pairs in a single layer."
        ],
        takeaway: "Constant O(1) path length eliminates vanishing gradient degradation over long sequences.",
        assistantPrompts: [
          "Explain Receptive Field vs Attention Span",
          "Why do convolutions struggle with long sentences?",
          "How does path length affect gradient stability?"
        ]
      },
      TECHNICAL: {
        subtitle: "Analytical comparison: Receptive field expansion vs full all-to-all attention graph topologies.",
        body: [
          "Convolutional architectures require O(log_k(n)) dilated causal layers (ByteNet) or O(n/k) contiguous layers (ConvS2S) to cover distance n.",
          "Self-attention models the complete bipartite graph of pairwise interactions in a single matrix multiplication, yielding O(1) sequential depth with isotropic gradient propagation."
        ],
        takeaway: "Path length O(1) guarantees isotropic gradient variance across arbitrary sequence separations.",
        assistantPrompts: [
          "Derive path length for Dilated Convolutions",
          "Compare ConvS2S vs ByteNet FLOP efficiency",
          "What is the condition for n < d in Table 1?"
        ]
      },
      PAPER_MODE: {
        subtitle: "Verbatim: 'The goal of reducing sequential computation also forms the foundation of the Extended Neural GPU, ByteNet and ConvS2S.' (Section 2, Page 2)",
        body: [
          "'In these models, the number of operations required to relate signals from two arbitrary input or output positions grows in the distance between positions, linearly for ConvS2S and logarithmically for ByteNet.'",
          "'This makes it more difficult to learn dependencies between distant positions. In the Transformer this is reduced to a constant number of operations.'"
        ],
        takeaway: "Verbatim: 'Self-attention, sometimes called intra-attention is an attention mechanism relating different positions of a single sequence in order to compute a representation of the sequence.'",
        assistantPrompts: [
          "What papers are cited for ByteNet and ConvS2S?",
          "What does Section 2 say about intra-attention?",
          "Quote Table 1 notes from the paper"
        ]
      }
    }
  },
  {
    id: "story-attention",
    chapterNumber: "02",
    eyebrow: "CORE MECHANISM",
    title: "Scaled Dot-Product Attention",
    subtitle: "Every token computes three vectors: Query (Q), Key (K), and Value (V).",
    body: [
      "An attention function maps a query and a set of key-value pairs to an output. The weights assigned to values are computed by a compatibility function of the query with the corresponding key.",
      "The paper formulates Scaled Dot-Product Attention as Attention(Q, K, V) = softmax(QKᵀ / √d_k)V.",
      "The factor 1/√d_k scales down dot products for large key dimensions d_k, preventing the softmax function from pushing gradients into extremely small regions."
    ],
    keyTakeaway: "Scaling by √d_k is mathematically necessary to prevent vanishing gradients during backpropagation when key dimensions grow large.",
    provenance: "FROM PAPER",
    sourceReference: {
      section: "3.2.1 Scaled Dot-Product Attention",
      page: 3,
      figureOrTable: "Equation (1)"
    },
    oneeMood: "attentive-left",
    assistantPrompts: [
      "Explain Query, Key, and Value simply",
      "Why divide by √d_k?",
      "Walk through the softmax step"
    ],
    difficultyDetails: {
      BEGINNER: {
        subtitle: "Think of Query as a search query, Keys as book titles in a library, and Values as the content inside the books.",
        body: [
          "When you search YouTube or Google, you type a 'Query'. The search engine compares your Query with 'Keys' (video tags) and returns the best 'Values' (the actual video).",
          "Scaled dot-product attention works the same way: every word asks questions about other words and grabs relevant information."
        ],
        takeaway: "Attention computes relevance scores so each word can absorb meaning from surrounding context.",
        assistantPrompts: [
          "Give a library analogy for Q, K, and V",
          "What does softmax do in simple words?",
          "Why is it called 'Scaled' attention?"
        ]
      },
      INTERMEDIATE: {
        subtitle: "Matrix formulation: Attention(Q, K, V) = softmax(QKᵀ / √d_k)V with d_k=64.",
        body: [
          "The dot product QKᵀ computes raw similarity scores between every pair of words. Softmax converts these scores into probability weights that sum to 1.",
          "When key dimension d_k is large (e.g. 64), dot products have variance d_k. Dividing by √d_k scales variance back to 1.0, keeping softmax gradients healthy."
        ],
        takeaway: "Scaling by √64 = 8 keeps softmax in a responsive gradient zone, preventing training stagnation.",
        assistantPrompts: [
          "Walk through the dimensions: Q(n × d_k) × Kᵀ(d_k × n)",
          "Why does softmax push gradients to zero when inputs are large?",
          "Additive vs Dot-Product attention comparison"
        ]
      },
      TECHNICAL: {
        subtitle: "Statistical derivation: Assuming independent components with zero mean and unit variance, q · k has mean 0 and variance d_k.",
        body: [
          "For $q = [q_1, \\dots, q_{d_k}]$ and $k = [k_1, \\dots, k_{d_k}]$ with $\\mathbb{E}[q_i]=0, \\text{Var}(q_i)=1$, the dot product $\\sum_{i=1}^{d_k} q_i k_i$ has variance $\\text{Var}(q \\cdot k) = d_k$.",
          "Without scaling, large magnitude values enter softmax saturated regions with derivative $\\frac{\\partial \\text{softmax}(z)_i}{\\partial z_j} \\to 0$. Scaling by $1/\\sqrt{d_k}$ normalizes variance to 1."
        ],
        takeaway: "$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$ ensures $\\mathcal{O}(1)$ gradient norm variance throughout backpropagation.",
        assistantPrompts: [
          "Derive the variance of the dot product mathematically",
          "Show softmax Jacobian derivative saturation proof",
          "Compare memory footprint of FlashAttention vs standard dot-product"
        ]
      },
      PAPER_MODE: {
        subtitle: "Verbatim: 'We compute the attention function on a set of queries simultaneously, packed together into a matrix Q.' (Section 3.2.1, Page 3)",
        body: [
          "'The two most commonly used attention functions are additive attention, and dot-product (multiplicative) attention. Dot-product attention is identical to our algorithm, except for the scaling factor of 1/√d_k.'",
          "'While for small values of d_k the two mechanisms perform similarly, additive attention outperforms dot product attention without scaling for larger values of d_k.'"
        ],
        takeaway: "Verbatim: 'We suspect that for large values of d_k, the dot products grow large in magnitude, pushing the softmax function into regions where it has extremely small gradients.'",
        assistantPrompts: [
          "Quote Equation (1) exactly from the paper",
          "What additive attention paper is cited (Bahdanau et al. 2014)?",
          "What hardware matrix library optimizations are mentioned?"
        ]
      }
    }
  },
  {
    id: "story-multihead",
    chapterNumber: "03",
    eyebrow: "PARALLEL PERSPECTIVES",
    title: "Multi-Head Attention",
    subtitle: "Instead of computing attention once with d_model dimensions, the Transformer uses 8 parallel attention heads.",
    body: [
      "Instead of performing a single attention function with 512-dimensional keys, values, and queries, the authors found it beneficial to linearly project queries, keys, and values h=8 times with different, learned projections to d_k=64 and d_v=64 dimensions.",
      "Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions. With a single head, averaging inhibits this capability.",
      "The 8 outputs are concatenated and linearly projected back to d_model=512 dimensions."
    ],
    keyTakeaway: "Multi-head attention acts like 8 specialized lenses focusing on different syntactic and semantic relationships simultaneously.",
    provenance: "FROM PAPER",
    sourceReference: {
      section: "3.2.2 Multi-Head Attention",
      page: 4,
      figureOrTable: "Figure 2 & Equation (2)"
    },
    oneeMood: "curious-left",
    assistantPrompts: [
      "Why use 8 heads instead of 1?",
      "What does each head learn?",
      "How are heads combined?"
    ],
    difficultyDetails: {
      BEGINNER: {
        subtitle: "Imagine 8 detectives looking at the same crime scene, each looking for different clues.",
        body: [
          "One detective looks for grammar rules, another looks for who did what, and a third looks for words that rhyme or connect across paragraphs.",
          "By having 8 heads working at the same time, the model understands all the nuances of language without getting confused."
        ],
        takeaway: "Multiple heads allow the model to look at the same sentence through 8 different perspectives at once.",
        assistantPrompts: [
          "What is a simple analogy for attention heads?",
          "Why not just 1 giant head?",
          "How many heads do modern models have?"
        ]
      },
      INTERMEDIATE: {
        subtitle: "h=8 heads each project d_model=512 to d_k=64 dimensions, preserving total computation cost.",
        body: [
          "Single-head attention averages all relationships into one vector, losing fine-grained distinction. Multi-head projects Q, K, V using learned matrices W_i^Q, W_i^K, W_i^V.",
          "The outputs of all 8 heads are concatenated and multiplied by projection matrix W^O: MultiHead(Q,K,V) = Concat(head_1, ..., head_8)W^O."
        ],
        takeaway: "Due to reduced head dimension d_k = d_model/h = 64, multi-head attention costs the same as full-dimension single-head attention.",
        assistantPrompts: [
          "Explain the projection matrix W^O",
          "What dimensions does each head tensor have?",
          "Why did 1 head drop BLEU by 0.9 in Table 3?"
        ]
      },
      TECHNICAL: {
        subtitle: "Linear projection decomposition: $W_i^Q \\in \\mathbb{R}^{d_{\\text{model}} \\times d_k}$, $W_i^K \\in \\mathbb{R}^{d_{\\text{model}} \\times d_k}$, $W_i^V \\in \\mathbb{R}^{d_{\\text{model}} \\times d_v}$, $W^O \\in \\mathbb{R}^{h d_v \\times d_{\\text{model}}}$.",
        body: [
          "$\\text{MultiHead}(Q, K, V) = \\text{Concat}(\\text{head}_1, \\dots, \\text{head}_h)W^O$ where $\\text{head}_i = \\text{Attention}(Q W_i^Q, K W_i^K, V W_i^V)$.",
          "With $h=8, d_k=d_v=64, d_{\\text{model}}=512$, the total parameter count per Multi-Head Attention layer is $4 \\times d_{\\text{model}}^2 = 4 \\times 512^2 \\approx 1.05\\text{M}$ weights."
        ],
        takeaway: "Subspace factorization enables orthogonal rank-64 projection manifolds within the ambient $\\mathbb{R}^{512}$ space.",
        assistantPrompts: [
          "Prove parameter count for Multi-Head Attention layer",
          "Analyze subspace rank collapse in deep transformers",
          "Compare Multi-Head Attention with Grouped-Query Attention (GQA)"
        ]
      },
      PAPER_MODE: {
        subtitle: "Verbatim: 'Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions.' (Section 3.2.2, Page 4)",
        body: [
          "'In this work we employ h = 8 parallel attention layers, or heads. For each of these we use d_k = d_v = d_model / h = 64.'",
          "'Due to the reduced dimension of each head, the total computational cost is similar to that of single-head attention with full dimensionality.'"
        ],
        takeaway: "Verbatim: 'Where the projections are parameter matrices W_i^Q \\in \\mathbb{R}^{d_{model} \\times d_k}, W_i^K \\in \\mathbb{R}^{d_{model} \\times d_k}, W_i^V \\in \\mathbb{R}^{d_{model} \\times d_v} and W^O \\in \\mathbb{R}^{h d_v \\times d_{model}}.'",
        assistantPrompts: [
          "Quote Equation (2) exactly from Section 3.2.2",
          "What are the 3 ways attention is applied in Section 3.2.3?",
          "What is encoder-decoder attention in the paper?"
        ]
      }
    }
  },
  {
    id: "story-architecture",
    chapterNumber: "04",
    eyebrow: "THE RECONSTRUCTION",
    title: "The Transformer Architecture",
    subtitle: "A 6-layer Encoder stack paired with a 6-layer Decoder stack.",
    body: [
      "The Encoder consists of a stack of $N=6$ identical layers. Each layer has two sub-layers: a Multi-Head Self-Attention mechanism, and a simple position-wise Feed-Forward Network.",
      "Each sub-layer employs a residual connection followed by layer normalization: $\\text{LayerNorm}(x + \\text{SubLayer}(x))$. To facilitate these residual connections, all sub-layers produce outputs of dimension $d_{\\text{model}}=512$.",
      "The Decoder also consists of $N=6$ identical layers, adding a third sub-layer that performs Multi-Head Attention over the output of the encoder stack, along with masked self-attention to prevent positions from attending to subsequent positions."
    ],
    keyTakeaway: "Residual connections and Layer Normalization enable deep gradient flow across all 6 encoder and decoder layers.",
    provenance: "FROM PAPER",
    sourceReference: {
      section: "3.1 Model Architecture",
      page: 2,
      figureOrTable: "Figure 1"
    },
    oneeMood: "attentive-left",
    assistantPrompts: [
      "Explain the Encoder vs Decoder",
      "Why use Residual Connections?",
      "What is Masked Attention in the Decoder?"
    ],
    difficultyDetails: {
      BEGINNER: {
        subtitle: "The Encoder reads and digests the input language; the Decoder writes out the translated sentence.",
        body: [
          "Think of the Encoder as a translator who reads an entire English paragraph and creates a crystal-clear mental summary.",
          "The Decoder takes that mental summary and generates the German translation word by word, making sure it doesn't accidentally peek into future words it hasn't translated yet."
        ],
        takeaway: "The 6-layer Encoder reads the source, and the 6-layer Decoder generates the translation.",
        assistantPrompts: [
          "Why does the Decoder have a mask?",
          "What is Layer Normalization?",
          "Why are there 6 layers?"
        ]
      },
      INTERMEDIATE: {
        subtitle: "Encoder N=6 (Self-Attention + FFN), Decoder N=6 (Masked Self-Attention + Cross-Attention + FFN).",
        body: [
          "Every sub-layer wraps computation in a residual addition followed by layer normalization: $\\text{LayerNorm}(x + \\text{SubLayer}(x))$.",
          "The Feed-Forward Network applies two linear transformations with a ReLU activation in between: $\\text{FFN}(x) = \\max(0, x W_1 + b_1) W_2 + b_2$, expanding inner dimension from 512 to 2048."
        ],
        takeaway: "Sub-layer dimension $d_{\\text{model}}=512$ is strictly maintained throughout all 6 encoder and decoder stacks.",
        assistantPrompts: [
          "Explain the FFN expansion from 512 to 2048",
          "How does Cross-Attention differ from Self-Attention?",
          "Why is autoregressive masking necessary during training?"
        ]
      },
      TECHNICAL: {
        subtitle: "Mathematical sublayer flow: $x^{(l+1)} = \\text{LayerNorm}\\left(x^{(l)} + \\text{SubLayer}(x^{(l)})\\right)$ with $\\text{FFN}(x) = \\max(0, x W_1 + b_1)W_2 + b_2$.",
        body: [
          "Feed-Forward sublayer parameters: $W_1 \\in \\mathbb{R}^{512 \\times 2048}, b_1 \\in \\mathbb{R}^{2048}, W_2 \\in \\mathbb{R}^{2048 \\times 512}, b_2 \\in \\mathbb{R}^{512}$, accounting for $\\approx 2.1\\text{M}$ parameters per layer.",
          "Autoregressive decoder masking sets $QK^T$ logits corresponding to $j > i$ to $-\\infty$ before softmax, enforcing strict causal factorization $p(y) = \\prod_{t=1}^T p(y_t \\mid y_{<t}, x)$."
        ],
        takeaway: "Causal masking ensures parallel training loss computation matches autoregressive inference factorization.",
        assistantPrompts: [
          "Calculate parameter count of full Base vs Big Transformer",
          "Analyze Pre-LN vs Post-LN gradient propagation",
          "Explain weight tying between input embedding and pre-softmax linear layer"
        ]
      },
      PAPER_MODE: {
        subtitle: "Verbatim: 'The encoder is composed of a stack of N = 6 identical layers.' (Section 3.1, Page 2)",
        body: [
          "'Each layer has two sub-layers. The first is a multi-head self-attention mechanism, and the second is a simple, position-wise fully connected feed-forward network.'",
          "'We employ a residual connection around each of the two sub-layers, followed by layer normalization. That is, the output of each sub-layer is $\\text{LayerNorm}(x + \\text{SubLayer}(x))$.'"
        ],
        takeaway: "Verbatim: 'In addition to the two sub-layers in each encoder layer, the decoder inserts a third sub-layer, which performs multi-head attention over the output of the encoder stack.'",
        assistantPrompts: [
          "Quote Section 3.1 on Decoder masking",
          "Quote Section 3.3 on Position-wise Feed-Forward Networks",
          "Quote Section 3.4 on Embeddings and Softmax"
        ]
      }
    }
  },
  {
    id: "story-position",
    chapterNumber: "05",
    eyebrow: "SEQUENCE ORDER",
    title: "Sinusoidal Positional Encoding",
    subtitle: "Since the architecture has no recurrence or convolution, sequence order must be injected.",
    body: [
      "Because the model contains no recurrence and no convolution, for the model to make use of the order of the sequence, we must inject some information about the relative or absolute position of the tokens.",
      "The authors used sine and cosine functions of different frequencies: $\\text{PE}_{(pos, 2i)} = \\sin(pos / 10000^{2i/d_{\\text{model}}})$ and $\\text{PE}_{(pos, 2i+1)} = \\cos(pos / 10000^{2i/d_{\\text{model}}})$.",
      "We chose this function because we hypothesized it would allow the model to easily learn to attend by relative positions, since for any fixed offset $k$, $\\text{PE}_{(pos+k)}$ can be represented as a linear function of $\\text{PE}_{pos}$."
    ],
    keyTakeaway: "Sinusoidal frequencies allow the model to generalize to sequence lengths longer than those encountered during training.",
    provenance: "FROM PAPER",
    sourceReference: {
      section: "3.5 Positional Encoding",
      page: 6,
      figureOrTable: "Equations (3) & (4)"
    },
    oneeMood: "curious-left",
    assistantPrompts: [
      "Why sinusoidal wave encodings?",
      "Learned vs Sinusoidal positional embeddings",
      "How do positional vectors add to token vectors?"
    ],
    difficultyDetails: {
      BEGINNER: {
        subtitle: "Without word order, 'dog bites man' and 'man bites dog' would look 100% identical to the model.",
        body: [
          "Because the Transformer looks at all words at once, it needs a timestamp or barcode added to each word to know which word came first, second, or third.",
          "The authors created a clever mathematical sound wave: each position gets a unique wave signature that adds directly to the word's embedding vector."
        ],
        takeaway: "Adding wave signatures gives each word a unique position without changing its core dictionary meaning.",
        assistantPrompts: [
          "Why does a model need positional information?",
          "How does adding two vectors preserve meaning?",
          "What is a sine wave?"
        ]
      },
      INTERMEDIATE: {
        subtitle: "Sinusoidal functions: wavelengths forming a geometric progression from $2\\pi$ to $10000 \\cdot 2\\pi$ across dimensions.",
        body: [
          "Even dimensions use sine: $\\text{PE}_{(pos, 2i)} = \\sin(pos / 10000^{2i/512})$. Odd dimensions use cosine: $\\text{PE}_{(pos, 2i+1)} = \\cos(pos / 10000^{2i/512})$.",
          "This allows the model to learn relative position offsets $k$ because $\\text{PE}_{(pos+k)}$ can be computed via linear rotation matrix on $\\text{PE}_{pos}$."
        ],
        takeaway: "Sinusoidal encodings extrapolate to longer unseen sequences without adding any extra learnable parameters.",
        assistantPrompts: [
          "Explain the trigonometric addition theorem connection",
          "Why didn't learned positional embeddings beat sinusoidal in Table 3?",
          "How is positional encoding added to token embeddings?"
        ]
      },
      TECHNICAL: {
        subtitle: "Linear transformation of relative shifts: $[\\sin(\\omega_i(pos+k)), \\cos(\\omega_i(pos+k))]^T = R(\\omega_i k) [\\sin(\\omega_i pos), \\cos(\\omega_i pos)]^T$.",
        body: [
          "Each frequency $\\omega_i = 1 / 10000^{2i/d_{\\text{model}}}$ defines a 2D rotation matrix $R(\\omega_i k) = \\begin{pmatrix} \\cos(\\omega_i k) & \\sin(\\omega_i k) \\\\ -\\sin(\\omega_i k) & \\cos(\\omega_i k) \\end{pmatrix}$.",
          "This guarantees that dot products between positions $pos$ and $pos+k$ depend strictly on relative distance $k$, enabling length generalization."
        ],
        takeaway: "Orthogonal 2D rotation subgroups endow the model with shift-invariant relative position awareness.",
        assistantPrompts: [
          "Derive the 2D rotation matrix for PE(pos+k)",
          "Compare Sinusoidal Positional Encoding with RoPE (Rotary Position Embeddings)",
          "Explain why positional vectors are summed rather than concatenated"
        ]
      },
      PAPER_MODE: {
        subtitle: "Verbatim: 'In this work, we use sine and cosine functions of different frequencies:' (Section 3.5, Page 6)",
        body: [
          "$\\text{PE}_{(pos, 2i)} = \\sin\\left(pos / 10000^{2i/d_{\\text{model}}}\\right)$",
          "$\\text{PE}_{(pos, 2i+1)} = \\cos\\left(pos / 10000^{2i/d_{\\text{model}}}\\right)$",
          "'where $pos$ is the position and $i$ is the dimension. That is, each dimension of the positional encoding corresponds to a sinusoid. The wavelengths form a geometric progression from $2\\pi$ to $10000 \\cdot 2\\pi$.'"
        ],
        takeaway: "Verbatim: 'We also experimented with using learned positional embeddings instead, and found that the two versions produced nearly identical results (see Table 3 row (E)).'",
        assistantPrompts: [
          "Quote Section 3.5 on length generalization",
          "Quote Table 3 row (E) findings",
          "What is the embedding scale factor $\\sqrt{d_{\\text{model}}}$ in Section 3.4?"
        ]
      }
    }
  },
  {
    id: "story-comparison",
    chapterNumber: "06",
    eyebrow: "DATA JOURNALISM",
    title: "Why Self-Attention? (Table 1)",
    subtitle: "Comparing Computational Complexity, Sequential Operations, and Maximum Path Length.",
    body: [
      "Table 1 compares layer types across three key dimensions: Total computational complexity per layer, Sequential operations (minimum time steps required), and Maximum path length between any input and output locations.",
      "Self-attention achieves O(1) sequential operations and O(1) maximum path length, compared to O(n) for recurrent layers.",
      "When the sequence length n is smaller than representation dimensionality d (typical in machine translation where n ~ 30 and d = 512), self-attention is also faster in computational complexity per layer O(n² · d) vs O(n · d²)."
    ],
    keyTakeaway: "Self-attention trades quadratic sequence complexity for constant parallel step execution and instant path connectivity.",
    provenance: "FROM PAPER",
    sourceReference: {
      section: "4. Why Self-Attention",
      page: 5,
      figureOrTable: "Table 1"
    },
    oneeMood: "attentive-left",
    assistantPrompts: [
      "Walk through Table 1 numbers",
      "When is self-attention slower than RNN?",
      "What is maximum path length?"
    ],
    difficultyDetails: {
      BEGINNER: {
        subtitle: "Table 1 is the report card comparing Self-Attention, RNNs, and Convolutions.",
        body: [
          "In every major category: speed, step operations, and how directly words talk to each other, Self-Attention scored top marks.",
          "Because sentence length (like 30 words) is much smaller than vector size (512 dimensions), self-attention is both faster to run and easier to train."
        ],
        takeaway: "Self-Attention won across every theoretical metric that determines neural network speed and quality.",
        assistantPrompts: [
          "Why was Table 1 so important?",
          "What does O(1) mean in plain English?",
          "When would an RNN be smaller?"
        ]
      },
      INTERMEDIATE: {
        subtitle: "Complexity per layer: Self-Attention O(n²·d) vs Recurrent O(n·d²). When n < d, Self-Attention requires fewer operations.",
        body: [
          "In recurrent models (RNN/LSTM), computing each step costs d² multiplications due to matrix-vector updates across hidden states.",
          "In Self-Attention, pairwise dot products cost n²·d operations. Since translation sentences have n ≈ 30 and d = 512, n²·d = 30² × 512 = 460,800 vs n·d² = 30 × 512² = 7,864,320 operations!"
        ],
        takeaway: "For translation sequences (n < d), Self-Attention is over 15× more computationally efficient than recurrent layers.",
        assistantPrompts: [
          "Calculate 30² × 512 vs 30 × 512²",
          "What happens when sequence length n > 10,000?",
          "Explain restricted self-attention with neighborhood r"
        ]
      },
      TECHNICAL: {
        subtitle: "Complexity trade-off manifold: Flop complexity $O(n^2 d + n d^2)$ vs $O(n d^2)$ with parallel step latency $\\tau = O(1)$ vs $\\tau = O(n)$.",
        body: [
          "Self-Attention total FLOPs per layer = $2 n^2 d_k + 2 n d^2$ (projections + attention scores + value weighting). Recurrent GRU/LSTM per layer = $8 n d^2$ sequential operations.",
          "Furthermore, Self-Attention operations are structured as large matrix GEMMs (BLAS Level 3), whereas recurrent layers are memory-bound vector GEMVs (BLAS Level 2)."
        ],
        takeaway: "BLAS Level 3 compute density combined with O(1) sequential dependency maximizes accelerator roofline throughput.",
        assistantPrompts: [
          "Derive roofline model comparison between GEMM and GEMV",
          "Analyze FLOP counts of Linear Attention and FlashAttention-2",
          "What is restricted attention neighborhood r in Table 1?"
        ]
      },
      PAPER_MODE: {
        subtitle: "Verbatim: 'As noted in Table 1, a self-attention layer connects all positions with a constant number of sequentially executed operations' (Section 4, Page 5)",
        body: [
          "'In terms of computational complexity, self-attention layers are faster than recurrent layers when the sequence length n is smaller than the representation dimensionality d, which is most often the case with sentence representations used by state-of-the-art models in machine translation.'",
          "'To improve computational performance for tasks involving very long sequences, self-attention could be restricted to considering only a neighborhood of size r in the input sequence.'"
        ],
        takeaway: "Verbatim: 'Table 1: Maximum path lengths, per-layer complexity and minimum number of sequential operations for different layer types.'",
        assistantPrompts: [
          "Quote all 4 rows of Table 1 from the paper",
          "What does the paper say about interpretability in Section 4?",
          "Cite Section 4 exact page number"
        ]
      }
    }
  },
  {
    id: "story-results",
    chapterNumber: "07",
    eyebrow: "STATE OF THE ART",
    title: "Training Setup & BLEU Benchmarks",
    subtitle: "Establishing new translation benchmarks at a fraction of the computational cost.",
    body: [
      "On the WMT 2014 English-to-German translation task, the Transformer (big) achieved a BLEU score of 28.4, outperforming the best existing models (including ensembles) by over 2.0 BLEU points.",
      "On the WMT 2014 English-to-French task, the big model achieved 41.8 BLEU, setting a new single-model state-of-the-art while training for 3.5 days on 8 NVIDIA P100 GPUs ➔ a small fraction of the training cost of competing models.",
      "The Base Transformer model trained in just 12 hours on 8 P100 GPUs, achieving 27.3 BLEU on EN-DE."
    ],
    keyTakeaway: "The Transformer beat state-of-the-art translation baselines while requiring orders of magnitude fewer FLOPs during training.",
    provenance: "FROM PAPER",
    sourceReference: {
      section: "6. Results & Section 5.4",
      page: 7,
      figureOrTable: "Table 2"
    },
    oneeMood: "surprised-wide-left",
    assistantPrompts: [
      "What is a BLEU score?",
      "Compare training cost in FLOPs",
      "How many GPUs were used?"
    ],
    difficultyDetails: {
      BEGINNER: {
        subtitle: "The Transformer achieved the highest test scores in history while using a fraction of the electricity and computing power.",
        body: [
          "In language translation, models are scored on a scale called BLEU (like an SAT score for translation accuracy).",
          "The Transformer scored 28.4 on English-to-German (beating teams of competing models that trained for weeks) in just 3.5 days of training on 8 GPUs."
        ],
        takeaway: "Higher quality and drastically lower training cost made the Transformer an immediate worldwide sensation.",
        assistantPrompts: [
          "What is BLEU score in simple terms?",
          "How fast did it train compared to other models?",
          "What GPUs did the authors use?"
        ]
      },
      INTERMEDIATE: {
        subtitle: "WMT 2014 EN-DE: 28.4 BLEU (big) vs GNMT 24.6 BLEU. Training FLOPs: 2.3e19 vs 1.0e20 for Deep-Att.",
        body: [
          "The Transformer (big) trained for 300,000 steps (3.5 days) on 8 NVIDIA P100 GPUs using Adam with β1=0.9, β2=0.98, ε=10⁻⁹.",
          "Even the lightweight Base model trained in just 12 hours (100k steps, 3.3e18 FLOPs) and achieved 27.3 BLEU, outperforming all previous models."
        ],
        takeaway: "Orders-of-magnitude reduction in training FLOPs opened the door to scaling AI models to modern foundation scales.",
        assistantPrompts: [
          "Explain the warmup learning rate schedule",
          "Compare 2.3e19 FLOPs with modern GPT-4 training",
          "What was the batch size used (25,000 tokens)?"
        ]
      },
      TECHNICAL: {
        subtitle: "Optimization hyperparameter profile: Adam optimizer with variable learning rate schedule $\\text{lrate} = d_{\\text{model}}^{-0.5} \\cdot \\min(\\text{step}^{-0.5}, \\text{step} \\cdot \\text{warmup}^{-1.5})$.",
        body: [
          "Warmup schedule: $\\text{warmup\\_steps} = 4000$. Linear warmup followed by inverse square root decay stabilized initial high-variance gradients in deep stacks.",
          "Regularization suite: Residual dropout $P_{\\text{drop}} = 0.1$ (base) and $0.3$ (big), label smoothing $\\epsilon_{\\text{ls}} = 0.1$ which penalizes overconfident logit predictions.",
          "Byte-Pair Encoding (BPE) shared vocabulary: 37,000 tokens for EN-DE, 32,000 word-piece tokens for EN-FR."
        ],
        takeaway: "Inverse square root learning rate scheduling with label smoothing prevented gradient stagnation and overconfidence.",
        assistantPrompts: [
          "Plot the learning rate formula curve",
          "Why did label smoothing hurt perplexity but improve BLEU?",
          "Analyze beam search settings: beam size 4, length penalty α=0.6"
        ]
      },
      PAPER_MODE: {
        subtitle: "Verbatim: 'On the WMT 2014 English-to-German translation task, the big transformer model (Transformer (big) in Table 2) outperforms the best previously reported models' (Section 6.1, Page 7)",
        body: [
          "'by more than 2.0 BLEU, establishing a new state-of-the-art BLEU score of 28.4. The training took 3.5 days on 8 P100 GPUs.'",
          "'Even our base model surpasses all previously published models and ensembles, at a fraction of the training cost of any of the competitive models.'"
        ],
        takeaway: "Verbatim: 'Table 2: The Transformer achieves better BLEU scores than previous state-of-the-art models on the English-to-German and English-to-French newstest2014 tests at a fraction of the training cost.'",
        assistantPrompts: [
          "Quote Table 2 exact numbers for EN-FR (41.8 BLEU)",
          "What does Section 5.4 say about hardware?",
          "Quote Section 5.3 on optimizer settings"
        ]
      }
    }
  },
  {
    id: "story-variations",
    chapterNumber: "08",
    eyebrow: "HISTORICAL ABLATION",
    title: "Model Variations Laboratory (Table 3)",
    subtitle: "Systematically testing component choices to prove why each hyperparameter was selected.",
    body: [
      "In Table 3, the authors varied Transformer components to measure impact on English-German development perplexity (PPL) and BLEU score.",
      "Key Finding 1: Single-head attention (h=1) dropped BLEU by 0.9 points compared to 8 heads with identical key dimension.",
      "Key Finding 2: Reducing key dimension d_k to 16 hurt quality (25.1 BLEU), while increasing model depth (N=8) raised BLEU to 26.4.",
      "Key Finding 3: Fixed sinusoidal positional encodings performed nearly identically to learned positional embeddings (25.8 vs 25.7 BLEU)."
    ],
    keyTakeaway: "Hyperparameter tuning proved multi-head attention and key sizing are vital, while fixed positional encodings carry zero parameter penalty.",
    provenance: "FROM PAPER",
    sourceReference: {
      section: "6.2 Model Variations",
      page: 8,
      figureOrTable: "Table 3"
    },
    oneeMood: "attentive-left",
    assistantPrompts: [
      "What happens with 1 head vs 32 heads?",
      "Why did dropout matter?",
      "Learned vs sinusoidal conclusion"
    ],
    difficultyDetails: {
      BEGINNER: {
        subtitle: "Table 3 tests what happens if you change the ingredients in the recipe.",
        body: [
          "What if you only use 1 attention head instead of 8? The score immediately drops.",
          "What if you make the model taller with 8 layers instead of 6? It gets smarter and scores higher!",
          "What if you use AI-learned position tags vs fixed wave tags? Both work equally well!"
        ],
        takeaway: "The authors tested dozens of variations to guarantee their baseline settings were mathematically optimal.",
        assistantPrompts: [
          "What was the most important hyperparameter?",
          "Why did 1 head do worse?",
          "What is an ablation study?"
        ]
      },
      INTERMEDIATE: {
        subtitle: "Ablation results: Varying head count h (1 to 32), key dimension d_k (16 to 512), depth N (2 to 8), and dropout.",
        body: [
          "Single head (h=1, d_k=512) achieved 24.9 BLEU vs 8 heads 25.8 BLEU. 32 heads (d_k=16) dropped score to 25.4 BLEU due to reduced head capacity.",
          "Increasing layer count N=8 increased BLEU to 26.4. Increasing key dimension d_k improved quality over small keys."
        ],
        takeaway: "8 heads with d_k=64 strikes the optimal sweet spot between representation diversity and subspace capacity.",
        assistantPrompts: [
          "Why did d_k=16 perform poorly (25.1 BLEU)?",
          "How did dropout affect development PPL vs BLEU?",
          "What happened with learned positional embeddings?"
        ]
      },
      TECHNICAL: {
        subtitle: "Empirical ablation matrix: Analysis of rows (A) through (E) across development PPL, BLEU, and parameter efficiency.",
        body: [
          "Row (A): Multi-head attention is crucial. Single head $h=1$ with full $d_k=512$ drops BLEU by 0.9 points (PPL 5.29). Too many heads $h=32, d_k=16$ degrades capacity (BLEU 25.4).",
          "Row (B): Reducing key size $d_k=16$ hurts quality (BLEU 25.1), confirming compatibility function sensitivity.",
          "Row (C) & (D): Larger models ($N=8$, BLEU 26.4) and dropout $P_{\\text{drop}}=0.1$ yield superior generalization. Row (E): Learned vs sinusoidal positional encodings exhibit identical BLEU (25.7 vs 25.8)."
        ],
        takeaway: "Empirical validation proved that multi-head projection dimensionality and residual depth dominate translation performance.",
        assistantPrompts: [
          "Detail Table 3 row (A) through (E) parameter counts",
          "Explain why learned positional embeddings showed no statistical advantage",
          "Analyze the trade-off between d_k dimension and head count h"
        ]
      },
      PAPER_MODE: {
        subtitle: "Verbatim: 'To evaluate the importance of different components of the Transformer, we varied our base model in different ways' (Section 6.2, Page 8)",
        body: [
          "'measuring changes in performance on English-to-German translation on the development set, newstest2013.'",
          "'In Table 3 rows (A), we vary the number of attention heads and the attention key and value dimensions, keeping the amount of computation constant.'",
          "'While single-head attention is 0.9 BLEU worse than the best setting, quality also drops with too many heads.'"
        ],
        takeaway: "Verbatim: 'Table 3: Variations on the Transformer architecture. Unlisted values are identical to those of the base model.'",
        assistantPrompts: [
          "Quote Table 3 row (A) through (E) exact findings",
          "What dataset was used for development evaluation (newstest2013)?",
          "Quote Section 6.2 row (B) and (E) text"
        ]
      }
    }
  },
  {
    id: "story-notebook",
    chapterNumber: "09",
    eyebrow: "3D CANVAS EXPLORER",
    title: "Interactive Research Notebook",
    subtitle: "Inspect the original figures and equations using DOM + CSS 3D paper manipulation.",
    body: [
      "Step inside the interactive research notebook layer. Drag, tilt, and zoom through paper spreads using 18-strip nested page curl mechanics.",
      "Examine original architectural figures, mathematical equations, and source notes with the built-in magnifying loupe."
    ],
    keyTakeaway: "Manipulate the paper's original spatial diagrams with interactive touch, tilt, and magnification tools.",
    provenance: "FROM PAPER",
    sourceReference: {
      section: "Full Paper Artifact",
      page: 1
    },
    oneeMood: "curious-left",
    assistantPrompts: [
      "How to use the loupe magnifier?",
      "Show Figure 1 architecture",
      "Show Figure 2 attention heads"
    ],
    difficultyDetails: {
      BEGINNER: {
        subtitle: "Explore the original 2017 scientific paper like an interactive 3D digital book.",
        body: [
          "Drag to rotate the notebook in 3D, zoom in on diagram details, and turn pages to view the original blueprints created by the Google Brain and Google Research teams.",
          "Use the search loupe magnifying glass to inspect any diagram or equation up close."
        ],
        takeaway: "Experience scientific discovery through hands-on 3D manipulation.",
        assistantPrompts: [
          "What figures are in the original paper?",
          "How does 3D drag work?",
          "Show me Figure 1 blueprint"
        ]
      },
      INTERMEDIATE: {
        subtitle: "3D perspective viewing of original figures, architecture blueprints, and complexity comparison matrices.",
        body: [
          "Inspect Figure 1 (Encoder-Decoder stack), Figure 2 (Scaled Dot-Product and Multi-Head Attention), Table 1 (Complexity matrix), and Table 2 (Benchmark results).",
          "Supports interactive yaw/pitch tilt controls, scale zoom factor (0.75x to 1.75x), and optical loupe overlay."
        ],
        takeaway: "Interactive spatial inspection bridges high-level intuition and low-level architectural blueprints.",
        assistantPrompts: [
          "Inspect Figure 1 sublayer connections",
          "Inspect Figure 2 Q, K, V linear projections",
          "How to reset 3D notebook camera?"
        ]
      },
      TECHNICAL: {
        subtitle: "Stereoscopic 3D spatial artifact inspection with interactive camera transformations and figure annotations.",
        body: [
          "Rendered via CSS 3D matrix transformations with perspective preservation and pointer drag delta tracking.",
          "Directly maps to arXiv:1706.03762v7 primary source plates and NIPS 2017 proceedings documentation."
        ],
        takeaway: "Spatial perspective projection preserves geometric clarity across complex multi-branch network schematics.",
        assistantPrompts: [
          "What arXiv version is reproduced (v7)?",
          "Explain the page turn transition physics",
          "Inspect Table 3 ablation plate"
        ]
      },
      PAPER_MODE: {
        subtitle: "Verbatim: 'Attention Is All You Need - NIPS 2017 Research Paper Archive (arXiv:1706.03762v7)'",
        body: [
          "'Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin.'",
          "'Google Brain, Google Research, University of Toronto.'"
        ],
        takeaway: "Verbatim: 'Published at 31st Conference on Neural Information Processing Systems (NIPS 2017), Long Beach, CA, USA.'",
        assistantPrompts: [
          "List all 8 authors and their affiliations",
          "When was the paper first published on arXiv (June 12, 2017)?",
          "Quote the paper abstract verbatim"
        ]
      }
    }
  },
  {
    id: "story-conclusion",
    chapterNumber: "10",
    eyebrow: "PARADIGM SHIFT",
    title: "The Transformer Contribution",
    subtitle: "Replacing recurrence entirely with attention established a scalable foundation for sequence modeling.",
    body: [
      "Vaswani et al. (2017) demonstrated that an architecture relying entirely on self-attention mechanisms without recurrence or convolutions achieves state-of-the-art translation quality while being significantly faster to train.",
      "On English-to-German and English-to-French tasks, the Transformer achieved new benchmarks at a fraction of the computational training cost of recurrent and convolutional predecessors."
    ],
    keyTakeaway: "By replacing sequential recurrence with parallel self-attention, Vaswani et al. established a new paradigm in neural sequence modeling.",
    provenance: "FROM PAPER",
    sourceReference: {
      section: "7. Conclusion",
      page: 10
    },
    oneeMood: "joyful-wide",
    assistantPrompts: [
      "Summarize the paper in one sentence",
      "What were the key translation results?",
      "Why did self-attention scale better?"
    ],
    difficultyDetails: {
      BEGINNER: {
        subtitle: "This single paper sparked the modern AI revolution behind ChatGPT, Claude, Gemini, and translation tools.",
        body: [
          "By solving the speed and memory bottlenecks of earlier AI, the Transformer proved that attention is truly all you need to teach computers human language.",
          "Today, almost every frontier language model, coding assistant, and AI image generator uses the Transformer architecture."
        ],
        takeaway: "A simple idea: dispensing with recurrence and letting all words attend to all words, transformed modern computing.",
        assistantPrompts: [
          "How did this paper lead to ChatGPT?",
          "What is BERT vs GPT?",
          "What makes Transformers so special today?"
        ]
      },
      INTERMEDIATE: {
        subtitle: "The transition from task-specific translation to universal foundation sequence modeling.",
        body: [
          "Eliminating recurrent bottlenecks allowed models to scale from 65M parameters in 2017 to hundreds of billions of parameters today.",
          "The Transformer architecture proved equally capable of modeling text, audio, images (Vision Transformers), proteins (AlphaFold), and multi-modal reasoning."
        ],
        takeaway: "Self-attention provided the universal, highly scalable sequence operator that enabled the foundation model era.",
        assistantPrompts: [
          "How did Vision Transformers (ViT) adapt this architecture?",
          "Explain the difference between Encoder-only (BERT), Decoder-only (GPT), and Encoder-Decoder (T5)",
          "What are the scaling laws discovered from Transformers?"
        ]
      },
      TECHNICAL: {
        subtitle: "Scaling dynamics: Compute-optimal scaling $L(N, D) \\approx (N_c / N)^{\\alpha_N} + (D_c / D)^{\\alpha_D}$ enabled by unconstrained attention depth.",
        body: [
          "The Transformer unlocked stable power-law scaling across compute $C$, parameters $N$, and dataset tokens $D$, establishing the empirical scaling laws of modern LLMs.",
          "Its dense GEMM formulation and isotropic gradient flows overcame the catastrophic forgetting and gradient decay constraints that bounded recurrent models for 30 years."
        ],
        takeaway: "Empirical power-law scaling laws fundamentally depend on the parallel isotropic gradient dynamics of self-attention.",
        assistantPrompts: [
          "Explain Chinchilla scaling laws for Transformers",
          "Analyze FlashAttention memory and IO-aware speedups",
          "What architectural modifications were added in modern LLMs (SwiGLU, RMSNorm, RoPE)?"
        ]
      },
      PAPER_MODE: {
        subtitle: "Verbatim: 'In this work, we presented the Transformer, the first sequence transduction model based entirely on attention' (Section 7, Page 10)",
        body: [
          "'replacing the recurrent layers most commonly used in encoder-decoder architectures with multi-headed self-attention.'",
          "'For translation tasks, the Transformer can be trained significantly faster than architectures based on recurrent or convolutional layers. On both WMT 2014 English-to-German and WMT 2014 English-to-French translation tasks, we achieve a new state of the art.'",
          "'We are excited about the future of attention-based models and plan to apply them to other tasks.'"
        ],
        takeaway: "Verbatim: 'We plan to extend the Transformer to problems involving input and output modalities other than text and to investigate local, restricted attention mechanisms to efficiently handle large inputs and outputs such as images, audio and video.'",
        assistantPrompts: [
          "Quote Section 7 Conclusion verbatim",
          "What future modalities did the authors predict in 2017?",
          "What code repository did the authors release (Tensor2Tensor)?"
        ]
      }
    }
  }
];
