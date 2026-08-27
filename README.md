# Attention Is All You Need (Interactive Visual Lab)

An interactive, scrollytelling research lab that breaks down the landmark 2017 paper *"Attention Is All You Need"* by Ashish Vaswani, Noam Shazeer, Niki Parmar, Jakob Uszkoreit, Llion Jones, Aidan N. Gomez, Łukasz Kaiser, and Illia Polosukhin.

This web application combines real-time tensor animations, interactive formula breakdowns, mathematical typesetting with KaTeX, and an animated AI companion (Onee) across four educational tiers (Beginner, Intermediate, Technical, and Paper Verbatim).

---

## Live Features & Visual Simulations

### 1. Recurrence vs Self-Attention (Chapter 1)
- **Recurrent Bottleneck O(n)**: Step-by-step sequential processing ($t_1 \rightarrow t_2 \rightarrow \dots \rightarrow t_6$) demonstrating why RNNs and LSTMs cannot parallelize across sequence length.
- **Parallel Tensor Operations O(1)**: Multi-harmonic wavy gradient mesh demonstrating instant GPU parallelization.

### 2. Scaled Dot-Product Attention (Chapter 2)
- **11x11 Attention Matrix**: Full interactive query-key attention distribution on the Winograd sentence: *"The animal didn't cross the street because it was too tired"*.
- **Scale Factor Toggle**: Interactive $\frac{1}{\sqrt{d_k}}$ scaling switch demonstrating gradient stabilization against softmax saturation.

### 3. Multi-Head Representation Subspaces (Chapter 3)
- **8 Parallel Heads ($h=8, d_k=64$)**: Real-time visualization of specialized linguistic representation subspaces (syntactic dependencies, anaphora resolution, coreference).
- **Ablation Slider**: Adjust head counts ($h=1 \dots 32$) with Table 3 BLEU benchmark annotations.

### 4. Transformer Architecture Reconstruction (Chapter 4)
- **Encoder & Decoder Stacks ($N=6$)**: Interactive 2x2 modular sublayer architecture with residual connections ($\text{LayerNorm}(x + \text{Sublayer}(x))$) and autoregressive masking.

### 5. Sinusoidal Positional Encoding (Chapter 5)
- **High-DPI Wave Engine**: Real-time trigonometric wave generator rendering continuous harmonic frequencies ($2i=0, 2i=64, 2i=128$) with dynamic laser markers and $[PE_0, PE_1, PE_{64}]$ coordinate readouts.
- **Relative Shift Property**: Demonstrates linear offset rotation $PE_{(pos+k)} = R(\omega_i k) \cdot PE_{pos}$.

### 6. Layer Complexity & Tradeoffs (Chapter 6)
- **Table 1 Replication**: Interactive asymptotic comparison across Self-Attention, Recurrent, Convolutional, and Restricted Attention layers.

### 7. Translation BLEU Benchmarks (Chapter 7)
- **Table 2 Replication**: Visual comparison of WMT 2014 English-to-German and English-to-French BLEU scores against training FLOPs (Transformer Big vs GNMT vs ConvS2S).

### 8. Model Variation & Ablation Lab (Chapter 8)
- **Table 3 Replication**: 2x2 interactive grid analyzing head counts, key sizes, model depth ($N=8$), and learned vs fixed positional encodings.

### 9. 3D Research Notebook (Chapter 9)
- **3D Paper Viewer**: Interactive virtual research notebook replicating the original NIPS 2017 publication with auto-tour mode, 3D tilt physics, and a 1.35x magnifying loupe.

---

## Onee Companion: Multimodal Interactive Suite

- **Speech & Reactions**: Real-time reactive avatar synced to user interactions and slider events.
- **Interactive Quiz Engine**: 5 grounded multiple-choice questions with full explanations.
- **Flashcard Deck**: 5 double-sided memory cards covering core concepts.
- **AI Research Assistant**: Built-in chat assistant powered by Gemini for exploring transformer concepts.

---

## Tech Stack

- **Framework**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, Apple Pro Glassmorphism (`backdrop-blur-2xl`)
- **Animation & Physics**: Framer Motion, HTML5 Canvas 2D (Retina High-DPI)
- **Math Typesetting**: KaTeX (`rehype-katex`, `remark-math`)
- **Icons**: Lucide React

---

## Getting Started

### Prerequisites
- Node.js (version 18 or higher)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/MohammadFayasKhan/AttentionIsAllYouNeed.git

# Navigate into the project folder
cd AttentionIsAllYouNeed

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to explore the visualizer.

### Build for Production

```bash
npm run build
```

The production assets will be built into the `dist/` directory.

---

## Author & Developer

**Mohammad Fayas Khan**
- LinkedIn: [mohammadfayaskhan](https://www.linkedin.com/in/mohammadfayaskhan/)
- GitHub: [@MohammadFayasKhan](https://github.com/MohammadFayasKhan)
- Instagram: [@fayaskhanx](https://www.instagram.com/fayaskhanx)

---

## Citation

```bibtex
@inproceedings{vaswani2017attention,
  author    = {Ashish Vaswani and Noam Shazeer and Niki Parmar and Jakob Uszkoreit and Llion Jones and Aidan N. Gomez and {\L}ukasz Kaiser and Illia Polosukhin},
  title     = {Attention is All You Need},
  booktitle = {Advances in Neural Information Processing Systems 30 (NIPS 2017)},
  year      = {2017}
}
```
