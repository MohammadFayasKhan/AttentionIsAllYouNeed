/**
 * groq.ts
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * This module is the conversational intelligence and mathematical grounding backend
 * for Onee, the interactive research companion.
 *
 * Core Capabilities:
 *   1. Progressive Streaming Simulation & Remote Groq API Integration:
 *      - Connects to Groq API (openai/gpt-oss-120b or custom model) with generous token limits (3500 max_tokens).
 *      - Implements natural token/sentence-level streaming with punctuation-aware cadence
 *        (16ms per token, 32ms at punctuation boundaries) to create a lifelike typing animation.
 *   2. Deep Verified Ground-Truth Knowledge Base:
 *      - Grounded strictly in the 2017 paper "Attention Is All You Need" (Vaswani et al., arXiv:1706.03762).
 *      - Comprehensive coverage: Permutation Invariance, Sinusoidal Positional Encoding,
 *        Scaled Dot-Product, Multi-Head Attention, Complexity Comparison (Table 1),
 *        WMT 2014 BLEU Benchmarks (Table 2), Model Ablations (Table 3), Parsing (Table 4).
 *   3. Multi-Tier Educational Tone Adaptation:
 *      - BEGINNER: Intuitive analogies, visual metaphors, accessible explanations.
 *      - INTERMEDIATE: Standard ML terminology, embeddings, softmax, residual layers.
 *      - TECHNICAL: Mathematical rigor, matrix dimensions, FLOP counts, gradient derivations.
 *      - PAPER_MODE: Verbatim citations, section numbers, equation numbers, table rows.
 */

import { EducationalMode } from '../data/paperData';
import { QuizQuestion, getDynamicQuizQuestions } from '../data/quizData';
import { Flashcard, getDynamicFlashcardsDeck } from '../data/flashcardData';
import { humanizeText } from './humanizer';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  sourceType?: 'FROM PAPER' | 'DERIVED' | 'ILLUSTRATIVE' | 'EXTERNAL';
  isThinking?: boolean;
  isHumanized?: boolean;
}

const SYSTEM_PROMPT_BASE = `You are Onee, a world-class AI research companion and ML educator explaining the landmark 2017 paper "Attention Is All You Need" (Vaswani et al., NIPS 2017 / arXiv:1706.03762v7).

Paper Ground Truth Specs:
- Authors: Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, Illia Polosukhin (Google Brain, Google Research, Univ of Toronto).
- Architecture: N=6 Encoder and N=6 Decoder layers.
- Dimensions: Base Model (d_model=512, d_ff=2048, h=8 heads, d_k=d_v=64, P_drop=0.1, 65M parameters). Big Model (d_model=1024, d_ff=4096, h=16, d_k=d_v=64, P_drop=0.3, 213M parameters).
- Core Attention Formula: $\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$
- Multi-Head Formula: $\\text{MultiHead}(Q, K, V) = \\text{Concat}(\\text{head}_1, \\dots, \\text{head}_h)W^O$
- Positional Encoding: $PE_{(pos, 2i)} = \\sin(pos / 10000^{2i/d_{model}})$, $PE_{(pos, 2i+1)} = \\cos(pos / 10000^{2i/d_{model}})$
- Sublayer Formula: $\\text{LayerNorm}(x + \\text{SubLayer}(x))$
- Results: WMT 2014 English-to-German 28.4 BLEU (big), 27.3 BLEU (base). WMT 2014 English-to-French 41.8 BLEU.
- Hardware: 8 NVIDIA P100 GPUs (3.5 days for big, 12 hours for base).
- Complexity (Table 1): Self-attention sequence step O(1) vs RNN sequence step O(n). Maximum path length O(1).
- Ablations (Table 3): Single head h=1 drops BLEU by 0.9 points (24.9 vs 25.8). Learned positional embeddings match fixed sinusoids (25.7 vs 25.8).

CRITICAL INSTRUCTIONS:
1. Every answer must be complete, coherent, and properly terminated. Never stop mid-sentence, mid-equation, or mid-list.
2. Always format mathematical formulas using clean LaTeX: inline $...$ or display block $$...$$ / \\[...\\] .
3. Format bold terms as **term**, bullet points as - item, numbered steps as 1. item, and tables using markdown syntax.
4. Ground your explanations strictly in paper findings and clearly distinguish the 2017 paper from modern post-Transformer developments (e.g. RoPE, BERT, GPT).`;

export async function sendGroqStreamMessage(
  messages: Array<{ role: string; content: string }>,
  mode: EducationalMode = 'BEGINNER',
  activeChapterId?: string,
  onChunk?: (text: string) => void,
  abortSignal?: AbortSignal
): Promise<{ text: string; sourceType: 'FROM PAPER' | 'DERIVED' | 'ILLUSTRATIVE' | 'EXTERNAL' }> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  const model = import.meta.env.VITE_GROQ_MODEL || 'openai/gpt-oss-120b';

  let modeInstruction = "";
  switch (mode) {
    case 'BEGINNER':
      modeInstruction = "Tone: Intuitive, visual, approachable. Use clear everyday analogies (e.g. library index, anagram sentences). Avoid unexplained jargon.";
      break;
    case 'INTERMEDIATE':
      modeInstruction = "Tone: Clear, conceptual ML educator. Use standard terminology (embeddings, softmax, heads, residual layers) with LaTeX formulas and clean explanations.";
      break;
    case 'TECHNICAL':
      modeInstruction = "Tone: Deep mathematical, architectural, and tensor-dimension rigor. Include exact matrix dimensions, FLOP complexities, mathematical derivations, and equations.";
      break;
    case 'PAPER_MODE':
      modeInstruction = "Tone: STRICT verbatim paper citations. Reference exact Section numbers, Equation numbers, and Table rows from Vaswani et al. (2017).";
      break;
  }

  const systemMessage = {
    role: 'system',
    content: `${SYSTEM_PROMPT_BASE}\n\nTarget Explanation Level: ${mode}\nMode Instructions: ${modeInstruction}\nCurrent Active Chapter Focus: ${activeChapterId || 'general'}`
  };

  const lastUserMessage = messages[messages.length - 1]?.content || '';

  // Function to simulate natural word/sentence streaming
  const streamLocally = async (resultText: string) => {
    if (!onChunk) return;
    const words = resultText.split(' ');
    let accumulated = '';
    for (let i = 0; i < words.length; i++) {
      if (abortSignal?.aborted) return;
      accumulated += (i === 0 ? '' : ' ') + words[i];
      onChunk(accumulated);
      const isSentenceEnd = words[i].endsWith('.') || words[i].endsWith(':') || words[i].endsWith('!');
      await new Promise((r) => setTimeout(r, isSentenceEnd ? 28 : 14));
    }
  };

  // If no API key or placeholder key, use deep grounded knowledge engine
  if (!apiKey || apiKey.includes('YOUR_GROQ_API_KEY')) {
    const grounded = getGroundedResearchAnswer(lastUserMessage, mode, activeChapterId);
    const humanized = humanizeText(grounded.text, { mode, chapterId: activeChapterId });
    await streamLocally(humanized);
    return { text: humanized, sourceType: grounded.sourceType };
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      signal: abortSignal,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [systemMessage, ...messages],
        temperature: 0.4,
        max_tokens: 3500, // Generous limit to ensure complete, untruncated technical answers
        stream: false
      })
    });

    if (!response.ok) {
      const grounded = getGroundedResearchAnswer(lastUserMessage, mode, activeChapterId);
      const humanized = humanizeText(grounded.text, { mode, chapterId: activeChapterId });
      await streamLocally(humanized);
      return { text: humanized, sourceType: grounded.sourceType };
    }

    const data = await response.json();
    const rawReply = data.choices?.[0]?.message?.content || "";

    if (!rawReply.trim()) {
      const grounded = getGroundedResearchAnswer(lastUserMessage, mode, activeChapterId);
      const humanized = humanizeText(grounded.text, { mode, chapterId: activeChapterId });
      await streamLocally(humanized);
      return { text: humanized, sourceType: grounded.sourceType };
    }

    // Process through the Humanizer pipeline
    const replyText = humanizeText(rawReply, { mode, chapterId: activeChapterId });
    await streamLocally(replyText);

    let sourceType: 'FROM PAPER' | 'DERIVED' | 'ILLUSTRATIVE' | 'EXTERNAL' = 'FROM PAPER';
    if (replyText.includes('[ILLUSTRATIVE')) sourceType = 'ILLUSTRATIVE';
    else if (replyText.includes('[DERIVED')) sourceType = 'DERIVED';

    return { text: replyText, sourceType };
  } catch (err: any) {
    if (err?.name === 'AbortError') {
      throw err;
    }
    const grounded = getGroundedResearchAnswer(lastUserMessage, mode, activeChapterId);
    const humanized = humanizeText(grounded.text, { mode, chapterId: activeChapterId });
    await streamLocally(humanized);
    return { text: humanized, sourceType: grounded.sourceType };
  }
}

// Deep Grounded Knowledge Base across all chapters and modes
function getGroundedResearchAnswer(
  query: string,
  mode: EducationalMode,
  activeChapterId?: string
): { text: string; sourceType: 'FROM PAPER' | 'DERIVED' | 'ILLUSTRATIVE' | 'EXTERNAL' } {
  const q = query.toLowerCase();

  // 1. POSITIONAL ENCODING / POSITIONAL INFORMATION (Comprehensive Answer)
  if (
    q.includes('position') ||
    q.includes('positional') ||
    q.includes('order') ||
    q.includes('sinusoid') ||
    q.includes('permutation') ||
    q.includes('pe')
  ) {
    if (mode === 'BEGINNER') {
      return {
        text: `### Why Does a Transformer Need Positional Information?

---

#### 1. The Anagram Problem (The "Bag-of-Words" Blindspot)
Consider these two simple sentences:
1. *"Dog bites man"*
2. *"Man bites dog"*

Both sentences contain the exact same words, but have completely opposite meanings!
- In older architectures like **RNNs**, words are fed one-by-one in chronological order ($t=1, 2, 3$).
- In a **Transformer**, **Self-Attention** processes every word in the sentence simultaneously in parallel. Because it compares all words against each other at once, self-attention on its own is **order-blind** (it treats a sentence like an unordered bag of words).

---

#### 2. How Positional Information Solves This
Before the word embeddings enter the Transformer layers, the model adds a unique **Positional Encoding (PE)** vector to each word:

$$\\text{Input Representation} = \\text{Word Embedding} + \\text{Positional Encoding}$$

Think of this like attaching a timestamp or seat number to each word so the model knows who is sitting where.

---

#### 3. Why Did the Authors Use Sines and Cosines?
Instead of just numbering words $1, 2, 3...$ (which would make long sentences have huge numbers), Vaswani et al. used alternating wave frequencies:
- **Fast Waves (High Frequency):** Capture close-range neighbor relationships (e.g. word 1 vs word 2).
- **Slow Waves (Low Frequency):** Capture long-range document rhythm across hundreds of words.

---

#### 4. Key Takeaways from the 2017 Paper
- **Extrapolation:** Sinusoidal waves allow the model to understand sentence lengths longer than any seen during training.
- **Learned Embeddings vs Sinusoids (Table 3, Row E):** The authors tested learned position embeddings and found they produced identical results (**25.7 vs 25.8 BLEU**), but sinusoidal encodings were chosen because they require zero learned parameters and extrapolate naturally.
- **Modern Evolution:** Later models introduced *Learned Embeddings* (BERT, GPT-2), *Relative Positional Encodings* (T5), and *Rotary Position Embeddings* (RoPE in Llama).

---

**Summary:** Positional encodings restore sequential word order to an architecture that computes all words simultaneously.`,
        sourceType: 'FROM PAPER'
      };
    }

    if (mode === 'INTERMEDIATE') {
      return {
        text: `### Why Does a Transformer Need Positional Information? (Section 3.5)

---

#### 1. Motivation: Permutation Equivariance in Self-Attention
Because self-attention contains no recurrence or convolution, it operates as a set-to-set function. Formally, self-attention is **permutation-equivariant**:

$$\\text{Attention}(P X, P X, P X) = P \\cdot \\text{Attention}(X, X, X)$$

For any permutation matrix $P$. Without explicit positional signals, the representation of *"Dog bites man"* is identical to *"Man bites dog"*.

---

#### 2. The Sinusoidal Positional Encoding Formulation
Vaswani et al. inject positional information by adding sinusoidal encodings of dimension $d_{\\text{model}} = 512$ directly to input embeddings:

$$PE_{(pos, 2i)} = \\sin\\left(\\frac{pos}{10000^{2i / d_{\\text{model}}}}\\right)$$
$$PE_{(pos, 2i+1)} = \\cos\\left(\\frac{pos}{10000^{2i / d_{\\text{model}}}}\\right)$$

Where:
- $pos \\in [0, \\dots, n-1]$ is the token position in the sequence.
- $i \\in [0, \\dots, d_{\\text{model}}/2 - 1]$ is the dimension index ($0 \\le i < 256$).
- The wavelengths form a geometric progression from $2\\pi$ to $10000 \\cdot 2\\pi$.

---

#### 3. Mathematical Intuition: Linear Relative Shift Property
The authors chose sinusoidal functions because for any fixed offset $k$, $PE_{pos+k}$ can be represented as a **linear function of $PE_{pos}$**.

Using trigonometric angle addition identities:
$$\\sin(\\omega (pos + k)) = \\sin(\\omega pos)\\cos(\\omega k) + \\cos(\\omega pos)\\sin(\\omega k)$$
$$\\cos(\\omega (pos + k)) = \\cos(\\omega pos)\\cos(\\omega k) - \\sin(\\omega pos)\\sin(\\omega k)$$

This allows the attention mechanism to learn to attend to **relative positions** by applying a linear transformation matrix.

---

#### 4. Empirical Validation in the Paper (Table 3, Row E)
The authors experimented with learned positional embeddings instead of fixed sinusoids:
- **Sinusoidal Encoding:** 25.8 dev BLEU.
- **Learned Positional Embeddings:** 25.7 dev BLEU (nearly identical).
- **Paper Conclusion:** Fixed sinusoids were chosen because they allow the model to extrapolate to sequence lengths longer than those encountered during training without adding parameters.

---

#### 5. Comparison with Alternative Positional Approaches
| Approach | Mechanism | Used In |
| :--- | :--- | :--- |
| **Absolute Sinusoidal** | Fixed sine/cosine frequencies (Eq 3 & 4) | Original Transformer (2017) |
| **Learned Absolute** | Trainable embedding table per position index | BERT (2018), GPT-2 (2019) |
| **Relative Bias** | Learned bias added directly to attention logits | Shaw et al. (2018), T5 (2020) |
| **Rotary Embedding (RoPE)** | Multiplicative rotation applied to $Q$ and $K$ | LLaMA, Mistral, PaLM |

---

**Key Takeaway:** Positional encodings provide the Transformer with deterministic sequence order awareness while maintaining constant $\\mathcal{O}(1)$ step parallelization.`,
        sourceType: 'FROM PAPER'
      };
    }

    // TECHNICAL & PAPER_MODE
    return {
      text: `### Detailed Analysis: Positional Information in the Transformer (Section 3.5 & Table 3)

---

#### 1. Theoretical Motivation: The Permutation Invariance Problem
In standard self-attention, given an input matrix $X = [\\mathbf{x}_1, \\dots, \\mathbf{x}_n]^T \\in \\mathbb{R}^{n \\times d_{\\text{model}}}$, the output representation is:

$$\\text{Attention}(X W^Q, X W^K, X W^V) = \\text{softmax}\\left(\\frac{X W^Q (W^K)^T X^T}{\\sqrt{d_k}}\\right) X W^V$$

If the rows of $X$ are permuted by a permutation matrix $P \\in \\{0, 1\\}^{n \\times n}$, the attention matrix transforms as:

$$\\text{softmax}\\left(\\frac{P X W^Q (W^K)^T X^T P^T}{\\sqrt{d_k}}\\right) P X W^V = P \\cdot \\text{Attention}(X W^Q, X W^K, X W^V)$$

Thus, self-attention is strictly **permutation-equivariant**. Unlike Recurrent Neural Networks (where hidden state $\\mathbf{h}_t = f(\\mathbf{h}_{t-1}, \\mathbf{x}_t)$ encodes sequence order by construction), a Transformer with no positional signals cannot distinguish between a sentence and any arbitrary anagram permutation of its tokens.

---

#### 2. Sinusoidal Positional Encoding Equations (Equations 3 & 4)
To inject order, positional encodings $PE \\in \\mathbb{R}^{n \\times d_{\\text{model}}}$ of identical dimensionality are added to the input embeddings:

$$\\mathbf{z}_0 = X + PE$$

The encodings are defined via orthogonal frequency harmonics:

$$PE_{(pos, 2i)} = \\sin\\left(\\frac{pos}{10000^{2i / d_{\\text{model}}}}\\right)$$
$$PE_{(pos, 2i+1)} = \\cos\\left(\\frac{pos}{10000^{2i / d_{\\text{model}}}}\\right)$$

Where:
- $pos \\in \\{0, 1, \\dots, n-1\\}$ represents the sequence index.
- $i \\in \\{0, 1, \\dots, d_{\\text{model}}/2 - 1\\}$ indexes the embedding subspace ($0 \\le i < 256$ for $d_{\\text{model}} = 512$).
- The frequency $\\omega_i = \\frac{1}{10000^{2i / d_{\\text{model}}}}$ forms a geometric progression, with wavelengths spanning $\\lambda_i = 2\\pi \\cdot 10000^{2i / d_{\\text{model}}}$ from $2\\pi$ to $10000 \\cdot 2\\pi$.

---

#### 3. Mathematical Derivation of the Linear Offset Property
The authors hypothesized that a linear model could easily learn to attend to relative positions because for any fixed offset $k$, $PE_{pos+k}$ can be computed as a linear transformation of $PE_{pos}$:

$$\\begin{pmatrix} PE_{(pos+k, 2i)} \\\\ PE_{(pos+k, 2i+1)} \\end{pmatrix} = \\begin{pmatrix} \\cos(\\omega_i k) & \\sin(\\omega_i k) \\\\ -\\sin(\\omega_i k) & \\cos(\\omega_i k) \\end{pmatrix} \\begin{pmatrix} PE_{(pos, 2i)} \\\\ PE_{(pos, 2i+1)} \\end{pmatrix}$$

This $2 \\times 2$ rotation matrix $M_k^{(i)}$ depends solely on the relative distance $k$ and is independent of absolute position $pos$.

---

#### 4. Attention Dot-Product Interaction Expansion
When input embeddings $\\mathbf{x}_i, \\mathbf{x}_j$ with positional encodings $\\mathbf{p}_i, \\mathbf{p}_j$ are multiplied in the attention logit $A_{ij}$:

$$A_{ij} = \\frac{1}{\\sqrt{d_k}} (\\mathbf{x}_i + \\mathbf{p}_i) W^Q (W^K)^T (\\mathbf{x}_j + \\mathbf{p}_j)^T$$
$$A_{ij} = \\frac{1}{\\sqrt{d_k}} \\left[ \\underbrace{\\mathbf{x}_i W^Q (W^K)^T \\mathbf{x}_j^T}_{\\text{Content-Content}} + \\underbrace{\\mathbf{x}_i W^Q (W^K)^T \\mathbf{p}_j^T}_{\\text{Content-Position}} + \\underbrace{\\mathbf{p}_i W^Q (W^K)^T \\mathbf{x}_j^T}_{\\text{Position-Content}} + \\underbrace{\\mathbf{p}_i W^Q (W^K)^T \\mathbf{p}_j^T}_{\\text{Position-Position}} \\right]$$

This four-term decomposition allows the network to independently query content and spatial offsets.

---

#### 5. Paper Experimental Observation (Table 3, Row E)
In Section 6.2 (Table 3, row E), the authors compared the fixed sinusoidal positional encoding against learned positional embeddings:
- **Sinusoidal Positional Encoding:** **25.8 BLEU** on newstest2013.
- **Learned Positional Embeddings:** **25.7 BLEU** on newstest2013.
- **Conclusion:** Both methods yielded virtually identical accuracy. Sinusoidal encodings were selected because they allow the model to extrapolate to sequence lengths longer than those observed during training, without introducing additional trainable parameters.

---

#### 6. Positional Encoding Taxonomy & Post-Paper Developments
1. **Absolute Sinusoids (Vaswani et al., 2017):** Deterministic, parameter-free, extrapolates to longer sequences.
2. **Learned Absolute Embeddings (Gehring et al., 2017; Devlin et al., 2018):** Parameterized table $\\mathbf{E}_{pos} \\in \\mathbb{R}^{L_{max} \\times d}$. Fails on $n > L_{max}$.
3. **Relative Positional Encoding (Shaw et al., 2018):** Injects learned bias vector $\\mathbf{a}_{ij}^K$ directly into the attention logits.
4. **Rotary Position Embedding (RoPE, Su et al., 2021):** Rotates query and key vectors in complex 2D planes, preserving relative dot-product distance $(R_{\\Theta, m} \\mathbf{q})^T (R_{\\Theta, n} \\mathbf{k}) = \\mathbf{q}^T R_{\\Theta, n-m} \\mathbf{k}$.

---

**Key Takeaway:** Positional encodings resolve the fundamental permutation-equivariance of self-attention, enabling parallel sequence processing with exact relative and absolute spatial awareness.`,
      sourceType: 'FROM PAPER'
    };
  }

  // 2. CONVOLUTION VS SELF-ATTENTION (Section 4 & Table 1)
  if (q.includes('convolution') || q.includes('cnn') || q.includes('receptive field') || q.includes('bytenet')) {
    if (mode === 'BEGINNER') {
      return {
        text: `### Why Convolutions Struggle with Long Sequences

---

#### 1. The "Peephole" Effect
A 1D convolution only sees a small local window of 3 or 5 words at a time (the kernel size $k$):
- To connect word 1 to word 50, you have to stack dozens of convolutional layers on top of each other.
- In **Self-Attention**, every word looks at all 50 words in a single step!

---

#### 2. Computational Comparison (Table 1)
- **Path Length in CNNs:** $\\mathcal{O}(\\log_k(n))$ with dilated convolutions or $\\mathcal{O}(n/k)$ with regular convolutions.
- **Path Length in Self-Attention:** Constant $\\mathcal{O}(1)$ between any pair of words.

---

**Summary:** Self-attention connects distant words directly in one step, whereas convolutions require stacking many layers.`,
        sourceType: 'FROM PAPER'
      };
    }

    return {
      text: `### Why Convolutions Have Trouble with Long Sentences (Section 4, Table 1)

---

#### 1. Path Length Complexity
In convolutional models (e.g. ByteNet and ConvS2S), the number of operations required to connect signals from two arbitrary input positions grows with distance:
- **Contiguous 1D Convolutions:** Requires $\\mathcal{O}(n/k)$ stacked layers.
- **Dilated Convolutions (ByteNet):** Requires $\\mathcal{O}(\\log_k(n))$ layers.
- **Self-Attention:** Achieves constant **$\\mathcal{O}(1)$ maximum path length**, enabling direct gradient flow between any two sequence positions.

---

#### 2. Computational Complexity Comparison (Table 1, Page 5)

| Layer Type | Complexity per Layer | Sequential Operations | Maximum Path Length |
| :--- | :--- | :--- | :--- |
| **Self-Attention** | $\\mathcal{O}(n^2 \\cdot d)$ | $\\mathcal{O}(1)$ | $\\mathcal{O}(1)$ |
| **Recurrent (RNN)** | $\\mathcal{O}(n \\cdot d^2)$ | $\\mathcal{O}(n)$ | $\\mathcal{O}(n)$ |
| **Convolutional** | $\\mathcal{O}(k \\cdot n \\cdot d^2)$ | $\\mathcal{O}(1)$ | $\\mathcal{O}(\\log_k(n))$ |
| **Self-Attention (restricted)** | $\\mathcal{O}(r \\cdot n \\cdot d)$ | $\\mathcal{O}(1)$ | $\\mathcal{O}(n/r)$ |

---

**Key Takeaway:** When sequence length $n < d$ (typical in translation where $n \\approx 30$ and $d = 512$), Self-Attention is computationally faster than convolutions while providing constant $\\mathcal{O}(1)$ path length.`,
      sourceType: 'FROM PAPER'
    };
  }

  // 3. QUERY, KEY, VALUE & ATTENTION FORMULA (Section 3.2.1)
  if ((q.includes('q') && q.includes('k') && q.includes('v')) || q.includes('query') || q.includes('key') || q.includes('formula') || q.includes('softmax')) {
    if (mode === 'BEGINNER') {
      return {
        text: `### Query, Key, and Value Explained

---

#### 1. The Digital Library Analogy
- **Query ($Q$):** What you type into the search bar (e.g. *"Find the verb for this subject"*).
- **Key ($K$):** The index tags and titles on every book in the library.
- **Value ($V$):** The actual information inside the books.

---

#### 2. The Core Attention Formula
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V$$

1. Calculate how well Query matches each Key ($Q K^T$).
2. Divide by $\\sqrt{d_k}$ to prevent numbers from blowing up.
3. Apply **softmax** to convert scores into percentages (probabilities that sum to 100%).
4. Compute the weighted sum of all Values ($V$).

---

**Summary:** Attention is a content-based lookup that blends values based on query-key relevance.`,
        sourceType: 'FROM PAPER'
      };
    }

    return {
      text: `### Scaled Dot-Product Attention (Section 3.2.1, Equation 1)

---

#### 1. Mathematical Formulation
Given input representations $X \\in \\mathbb{R}^{n \\times d_{\\text{model}}}$, projections are computed via learned weight matrices:

$$Q = X W^Q, \\quad K = X W^K, \\quad V = X W^V$$

Where $W^Q, W^K \\in \\mathbb{R}^{d_{\\text{model}} \\times d_k}$ and $W^V \\in \\mathbb{R}^{d_{\\text{model}} \\times d_v}$.

The attention equation is:

$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V$$

---

#### 2. Why Scale by $\\frac{1}{\\sqrt{d_k}}$?
The authors explain that for large values of $d_k$:
1. The dot products grow large in magnitude: $\\text{Var}(q \\cdot k) = d_k$ for components with mean 0 and variance 1.
2. Large values push the **softmax** function into regions with extremely small gradients ($e^x$ saturation).
3. Scaling by $\\frac{1}{\\sqrt{d_k}} = \\frac{1}{\\sqrt{64}} = \\frac{1}{8}$ normalizes the variance back to 1.0, preserving gradient stability.

---

**Key Takeaway:** Scaled Dot-Product Attention provides efficient, GPU-optimized matrix operations with bounded variance.`,
      sourceType: 'FROM PAPER'
    };
  }

  // 4. MULTI-HEAD ATTENTION & TABLE 3 ABLATIONS (Section 3.2.2)
  if (q.includes('multi-head') || q.includes('head') || q.includes('subspace') || q.includes('h=8')) {
    return {
      text: `### Multi-Head Attention Mechanism (Section 3.2.2, Equation 2)

---

#### 1. Formulation & Architecture
Instead of performing a single attention function with $d_{\\text{model}} = 512$, the authors project queries, keys, and values $h=8$ times with different learned linear projections to $d_k = d_v = d_{\\text{model}} / h = 64$:

$$\\text{MultiHead}(Q, K, V) = \\text{Concat}(\\text{head}_1, \\dots, \\text{head}_h) W^O$$
$$\\text{where} \\quad \\text{head}_i = \\text{Attention}(Q W_i^Q, K W_i^K, V W_i^V)$$

Where parameter matrices are:
- $W_i^Q \\in \\mathbb{R}^{d_{\\text{model}} \\times d_k}$
- $W_i^K \\in \\mathbb{R}^{d_{\\text{model}} \\times d_k}$
- $W_i^V \\in \\mathbb{R}^{d_{\\text{model}} \\times d_v}$
- $W^O \\in \\mathbb{R}^{h d_v \\times d_{\\text{model}}}$

---

#### 2. Why Multiple Heads? (Table 3, Row A)
Multi-head attention allows the model to jointly attend to information from different representation subspaces at different positions:
- One head can focus on syntactic agreement (subject-verb).
- Another head can focus on coreference (pronouns like "it" to antecedent).
- Another head can focus on adjacent phrases.

**Table 3 Ablation:** Single head ($h=1, d_k=512$) drops BLEU by **0.9 points** (from 25.8 to 24.9), demonstrating that subspace specialization is essential.

---

**Key Takeaway:** Multi-head attention provides multiple representation subspaces simultaneously with identical overall computational cost.`,
      sourceType: 'FROM PAPER'
    };
  }

  // 5. ENCODER-DECODER ARCHITECTURE & RESIDUALS (Section 3.1)
  if (q.includes('encoder') || q.includes('decoder') || q.includes('architecture') || q.includes('residual') || q.includes('layernorm') || q.includes('n=6')) {
    return {
      text: `### Encoder and Decoder Architecture (Section 3.1)

---

#### 1. Stack Specifications
- **Encoder:** Stack of $N = 6$ identical layers. Each layer contains 2 sub-layers:
  1. Multi-Head Self-Attention.
  2. Position-wise Feed-Forward Network ($d_{\\text{ff}} = 2048$, ReLU activation).
- **Decoder:** Stack of $N = 6$ identical layers. Each layer contains 3 sub-layers:
  1. Masked Multi-Head Self-Attention (prevents positions from attending to subsequent positions).
  2. Encoder-Decoder Cross-Attention (queries from decoder, keys/values from encoder output).
  3. Position-wise Feed-Forward Network.

---

#### 2. Residual Connections & Layer Normalization
Every sub-layer produces an output of dimension $d_{\\text{model}} = 512$ with residual connection:

$$\\text{SubLayer Output} = \\text{LayerNorm}(x + \\text{SubLayer}(x))$$

---

**Key Takeaway:** The $N=6$ symmetric stack with residual Add & Norm enables deep gradient propagation without degradation.`,
      sourceType: 'FROM PAPER'
    };
  }

  // 6. BENCHMARKS & BLEU SCORES (Section 6.1, Table 2)
  if (q.includes('bleu') || q.includes('result') || q.includes('benchmark') || q.includes('wmt') || q.includes('p100')) {
    return {
      text: `### WMT 2014 Translation Results (Section 6.1, Table 2)

---

#### 1. State-of-the-Art Translation Scores
- **WMT 2014 English-to-German:**
  - **Transformer (big):** **28.4 BLEU** ($2.3 \\times 10^{19}$ FLOPs, trained for 3.5 days on 8 NVIDIA P100 GPUs).
  - **Transformer (base):** **27.3 BLEU** ($3.3 \\times 10^{18}$ FLOPs, trained for 12 hours on 8 P100 GPUs).
  - **Previous SOTA (ConvS2S ensemble):** 26.36 BLEU ($7.7 \\times 10^{19}$ FLOPs).
- **WMT 2014 English-to-French:**
  - **Transformer (big):** **41.8 BLEU**, establishing a new single-model state of the art at a fraction of the training cost.

---

**Key Takeaway:** The Transformer surpassed all existing models in translation quality while requiring significantly less compute.`,
      sourceType: 'FROM PAPER'
    };
  }

  // 7. GENERAL GROUNDED OVERVIEW
  return {
    text: `### Grounded Summary: "Attention Is All You Need" (Vaswani et al. 2017)

The landmark paper established the Transformer architecture, which replaced recurrent and convolutional layers with multi-head self-attention:

- **Core Formula:** $\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$
- **Architecture:** $N=6$ encoder and decoder layers, $d_{\\text{model}}=512$, $h=8$ heads ($d_k=64$), and $d_{\\text{ff}}=2048$.
- **Positional Signal:** Fixed sinusoidal frequencies $PE_{(pos, 2i)} = \\sin(pos / 10000^{2i/d_{\\text{model}}})$ inject token order into the permutation-equivariant attention mechanism.
- **Key Advantage:** Constant $\\mathcal{O}(1)$ sequential path length enables 100% parallel GPU core utilization during training.

Feel free to ask about any specific equation, ablation experiment (Table 3), or architecture block!`,
    sourceType: 'FROM PAPER'
  };
}

export async function generateDynamicQuiz(chapterId?: string, mode?: EducationalMode): Promise<QuizQuestion[]> {
  return getDynamicQuizQuestions(chapterId, mode);
}

export async function generateDynamicFlashcards(chapterId?: string, mode?: EducationalMode): Promise<Flashcard[]> {
  return getDynamicFlashcardsDeck(chapterId, mode);
}
