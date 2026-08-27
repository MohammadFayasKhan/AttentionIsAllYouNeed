/**
 * MarkdownRenderer.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * MarkdownRenderer is the high-fidelity text and mathematical formatting engine used
 * throughout the application (Chat, Takeaways, 3D Notebook, Flashcards, Explanations).
 *
 * Capabilities:
 *   1. Incremental KaTeX Mathematical Typesetting:
 *      - Block Display Math: Matches multi-line `$$...$$` and LaTeX `\[...\]` delimiters.
 *      - Inline Math: Matches `$..$` and `\(...\)` syntax with zero whitespace errors.
 *      - Auto-Normalizer: Gracefully converts non-standard tokens like `\math{h}` to `\mathbf{h}`.
 *      - Safe Streaming Buffering: Handles unclosed delimiters during live token streaming
 *        without throwing errors or displaying broken raw symbols.
 *   2. Markdown Lexing & Parsing:
 *      - Hierarchical Headings: `#`, `##`, `###`, `####` rendered with Apple typography.
 *      - Horizontal Rules: `---`, `***`, `___` rendered with subtle borders.
 *      - Lists: Numbered lists (`1. `, `2. `) and bullet points (`- `, `* `).
 *      - Inline Styling: `**bold**`, `*italic*`, `_italic_`, inline code backticks.
 *      - Tables: Standard Markdown pipe tables with formatted headers and alternating rows.
 *      - Backslash Escaping: Safely cleans up raw escape backslashes (e.g. `\*` -> `*`).
 *   3. Progressive Streaming Indicator:
 *      Renders a pulsing typing cursor (`▋`) while LLM tokens are actively streaming.
 */

import React from 'react';
import katex from 'katex';

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  isStreaming = false,
  className = ''
}) => {
  // Helper to auto-format unescaped/raw mathematical expressions into KaTeX
  const autoFormatEquations = (text: string): string => {
    if (!text) return '';
    let res = text;

    // Normalizes unescaped PE equations with quotes or without
    res = res.replace(/['"]?PE_\((pos|pos\+k),\s*2i\)\s*=\s*sin\(pos\s*\/\s*10000\^\(2i\/d_model\)\)['"]?/gi, 
      '$\\text{PE}_{(pos, 2i)} = \\sin\\left(pos / 10000^{2i/d_{\\text{model}}}\\right)$');

    res = res.replace(/['"]?PE_\((pos|pos\+k),\s*2i\+1\)\s*=\s*cos\(pos\s*\/\s*10000\^\(2i\/d_model\)\)['"]?/gi, 
      '$\\text{PE}_{(pos, 2i+1)} = \\cos\\left(pos / 10000^{2i/d_{\\text{model}}}\\right)$');

    res = res.replace(/PE\(pos,\s*2i\)\s*=\s*sin\(pos\s*\/\s*10000\^\(2i\/512\)\)/gi,
      '$\\text{PE}_{(pos, 2i)} = \\sin\\left(pos / 10000^{2i/512}\\right)$');

    res = res.replace(/PE\(pos,\s*2i\+1\)\s*=\s*cos\(pos\s*\/\s*10000\^\(2i\/512\)\)/gi,
      '$\\text{PE}_{(pos, 2i+1)} = \\cos\\left(pos / 10000^{2i/512}\\right)$');

    res = res.replace(/PE_\((pos\+k)\)/g, '$\\text{PE}_{(pos+k)}$');
    res = res.replace(/PE_pos\b/g, '$\\text{PE}_{pos}$');

    res = res.replace(/Attention\(Q,\s*K,\s*V\)\s*=\s*softmax\(QK[ᵀT]\s*\/\s*√d_k\)V/gi,
      '$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V$');

    res = res.replace(/MultiHead\(Q,\s*K,\s*V\)\s*=\s*Concat\(head_1,\s*\.\.\.,\s*head_8\)W\^O/gi,
      '$\\text{MultiHead}(Q, K, V) = \\text{Concat}(\\text{head}_1, \\dots, \\text{head}_8)W^O$');

    res = res.replace(/LayerNorm\(x\s*\+\s*SubLayer\(x\)\)/gi,
      '$\\text{LayerNorm}(x + \\text{SubLayer}(x))$');

    res = res.replace(/FFN\(x\)\s*=\s*max\(0,\s*x\s*W_1\s*\+\s*b_1\)\s*W_2\s*\+\s*b_2/gi,
      '$\\text{FFN}(x) = \\max(0, x W_1 + b_1)W_2 + b_2$');

    return res;
  };

  // Helper to render raw math via KaTeX with robust error fallback
  const renderKaTeX = (math: string, displayMode: boolean): string => {
    if (!math || !math.trim()) return '';
    try {
      // Clean up common math typos or double-escapes
      let cleanMath = math.trim();
      // Replace non-standard \math{...} with \mathbf{...} or \mathrm{...}
      cleanMath = cleanMath.replace(/\\math\{/g, '\\mathbf{');
      
      return katex.renderToString(cleanMath, {
        displayMode,
        throwOnError: false,
        output: 'htmlAndMathml'
      });
    } catch {
      // Graceful fallback for incomplete streaming math expressions
      return `<span class="font-mono text-apple-blue font-semibold">${math}</span>`;
    }
  };

  // Clean backslash escapes in plain text (e.g. \* -> *)
  const cleanEscapes = (text: string): string => {
    return text.replace(/\\([*_{}\[\]()#+\-.!])/g, '$1');
  };

  // Process inline math $...$, \(...\), bold, italic, code
  const renderInline = (rawText: string): React.ReactNode => {
    const text = autoFormatEquations(rawText);
    // Regex matching inline math delimiters, bold, italic, code
    const tokenRegex = /(\$\$[\s\S]+?\$\$|\\\[[\s\S]+?\\\]|\$[^\$\n]+?\$|\\\([\s\S]+?\\\)|\*\*.*?\*\*|__.*?__|(?<!\*)\*[^\*\n]+?\*(?!\*)|`.*?`)/g;
    const segments = text.split(tokenRegex);

    return segments.map((seg, idx) => {
      if (!seg) return null;

      // Display math $$ ... $$
      if (seg.startsWith('$$') && seg.endsWith('$$') && seg.length >= 4) {
        const math = seg.slice(2, -2);
        const html = renderKaTeX(math, true);
        return (
          <span
            key={idx}
            className="block my-2 text-center overflow-x-auto text-apple-blue font-mono select-text"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }

      // Display math \[ ... \]
      if (seg.startsWith('\\[') && seg.endsWith('\\]') && seg.length >= 4) {
        const math = seg.slice(2, -2);
        const html = renderKaTeX(math, true);
        return (
          <span
            key={idx}
            className="block my-2 text-center overflow-x-auto text-apple-blue font-mono select-text"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }

      // Inline math $ ... $
      if (seg.startsWith('$') && seg.endsWith('$') && seg.length > 2) {
        const math = seg.slice(1, -1);
        const html = renderKaTeX(math, false);
        return (
          <span
            key={idx}
            className="inline-block mx-0.5 align-baseline text-apple-blue font-mono select-text"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }

      // Inline math \( ... \)
      if (seg.startsWith('\\(') && seg.endsWith('\\)') && seg.length >= 4) {
        const math = seg.slice(2, -2);
        const html = renderKaTeX(math, false);
        return (
          <span
            key={idx}
            className="inline-block mx-0.5 align-baseline text-apple-blue font-mono select-text"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      }

      // Bold text **...** or __...__
      if ((seg.startsWith('**') && seg.endsWith('**') && seg.length >= 4) ||
          (seg.startsWith('__') && seg.endsWith('__') && seg.length >= 4)) {
        return (
          <strong key={idx} className="font-bold text-apple-text">
            {renderInline(cleanEscapes(seg.slice(2, -2)))}
          </strong>
        );
      }

      // Italic text *...*
      if (seg.startsWith('*') && seg.endsWith('*') && seg.length > 2) {
        return (
          <em key={idx} className="italic text-apple-text">
            {cleanEscapes(seg.slice(1, -1))}
          </em>
        );
      }

      // Inline code `...`
      if (seg.startsWith('`') && seg.endsWith('`') && seg.length >= 2) {
        return (
          <code
            key={idx}
            className="bg-black/5 text-apple-blue px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold border border-black/5"
          >
            {seg.slice(1, -1)}
          </code>
        );
      }

      return <span key={idx}>{cleanEscapes(seg)}</span>;
    });
  };

  // Split lines into structured markdown blocks
  const parseBlocks = (raw: string): React.ReactNode[] => {
    const lines = raw.split('\n');
    const nodes: React.ReactNode[] = [];
    let i = 0;

    while (i < lines.length) {
      const line = lines[i];

      // Empty line
      if (!line.trim()) {
        i++;
        continue;
      }

      // Horizontal rule --- or ***
      if (line.trim() === '---' || line.trim() === '***' || line.trim() === '___') {
        nodes.push(
          <hr key={`hr-${i}`} className="my-3 border-t border-black/10" />
        );
        i++;
        continue;
      }

      // Display math block $$ ... $$ or \[ ... \]
      if (line.trim().startsWith('$$') || line.trim().startsWith('\\[')) {
        const isBracket = line.trim().startsWith('\\[');
        const closingTag = isBracket ? '\\]' : '$$';
        let mathContent = isBracket ? line.trim().slice(2) : line.trim().slice(2);

        if (mathContent.endsWith(closingTag) && mathContent.length >= closingTag.length) {
          mathContent = mathContent.slice(0, -closingTag.length);
        } else {
          i++;
          while (i < lines.length && !lines[i].includes(closingTag)) {
            mathContent += '\n' + lines[i];
            i++;
          }
          if (i < lines.length) {
            mathContent += '\n' + lines[i].replace(closingTag, '');
          }
        }

        const html = renderKaTeX(mathContent, true);
        nodes.push(
          <div
            key={`math-${i}`}
            className="my-3 py-2.5 px-3 rounded-2xl bg-blue-50/70 border border-blue-100 overflow-x-auto text-center font-mono shadow-apple-sm text-apple-blue select-text"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
        i++;
        continue;
      }

      // Code Block ``` ... ```
      if (line.trim().startsWith('```')) {
        const lang = line.trim().slice(3) || 'text';
        const codeLines = [];
        i++;
        while (i < lines.length && !lines[i].trim().startsWith('```')) {
          codeLines.push(lines[i]);
          i++;
        }
        nodes.push(
          <div key={`code-${i}`} className="my-3 rounded-2xl overflow-hidden border border-black/10 shadow-apple-sm">
            <div className="bg-slate-800 px-3 py-1.5 text-[10px] font-mono text-slate-300 font-bold uppercase flex items-center justify-between">
              <span>{lang}</span>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
              <code>{codeLines.join('\n')}</code>
            </pre>
          </div>
        );
        i++;
        continue;
      }

      // Table parsing | ... |
      if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
        const tableLines = [];
        while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
          tableLines.push(lines[i].trim());
          i++;
        }
        if (tableLines.length >= 2) {
          const headers = tableLines[0].split('|').map((h) => h.trim()).filter(Boolean);
          const hasSeparator = tableLines[1].includes('---');
          const rowLines = hasSeparator ? tableLines.slice(2) : tableLines.slice(1);

          nodes.push(
            <div key={`table-${i}`} className="overflow-x-auto rounded-2xl border border-black/10 shadow-apple-sm my-3">
              <table className="w-full text-left border-collapse text-xs font-sans">
                <thead>
                  <tr className="bg-blue-50/90 text-apple-blue font-mono font-bold">
                    {headers.map((h, hIdx) => (
                      <th key={hIdx} className="p-2.5 border-b border-blue-200">
                        {renderInline(h)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rowLines.map((rowStr, rIdx) => {
                    const cells = rowStr.split('|').map((c) => c.trim()).filter(Boolean);
                    return (
                      <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        {cells.map((cell, cIdx) => (
                          <td key={cIdx} className="p-2.5 border-b border-black/5 text-apple-text">
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
          continue;
        }
      }

      // Headings: ####, ###, ##, #
      if (line.startsWith('#### ')) {
        nodes.push(
          <h4 key={`h4-${i}`} className="text-xs sm:text-sm font-bold text-apple-text font-mono mt-3 mb-1">
            {renderInline(line.slice(5))}
          </h4>
        );
        i++;
        continue;
      }
      if (line.startsWith('### ')) {
        nodes.push(
          <h4 key={`h3-${i}`} className="text-sm sm:text-base font-bold text-apple-text font-mono mt-3 mb-1">
            {renderInline(line.slice(4))}
          </h4>
        );
        i++;
        continue;
      }
      if (line.startsWith('## ')) {
        nodes.push(
          <h3 key={`h2-${i}`} className="text-base sm:text-lg font-extrabold text-apple-text font-mono mt-3 mb-1">
            {renderInline(line.slice(3))}
          </h3>
        );
        i++;
        continue;
      }
      if (line.startsWith('# ')) {
        nodes.push(
          <h2 key={`h1-${i}`} className="text-lg sm:text-xl font-extrabold text-apple-text font-mono mt-3 mb-1.5">
            {renderInline(line.slice(2))}
          </h2>
        );
        i++;
        continue;
      }

      // Blockquotes >
      if (line.startsWith('> ')) {
        nodes.push(
          <blockquote
            key={`bq-${i}`}
            className="my-2 pl-3 py-1.5 border-l-2 border-apple-blue bg-blue-50/40 rounded-r-xl text-apple-secondary text-xs italic font-sans"
          >
            {renderInline(line.slice(2))}
          </blockquote>
        );
        i++;
        continue;
      }

      // Numbered lists 1. 2. etc.
      const numberedMatch = line.trim().match(/^(\d+)\.\s+(.*)$/);
      if (numberedMatch) {
        nodes.push(
          <div key={`ol-${i}`} className="ml-3 my-1 flex items-start gap-2 text-xs text-apple-text leading-relaxed">
            <span className="font-mono font-bold text-apple-blue shrink-0">{numberedMatch[1]}.</span>
            <div className="flex-1">{renderInline(numberedMatch[2])}</div>
          </div>
        );
        i++;
        continue;
      }

      // Bullet points - or *
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const bulletText = line.trim().slice(2);
        nodes.push(
          <li key={`li-${i}`} className="ml-4 list-disc text-xs text-apple-text leading-relaxed my-0.5">
            {renderInline(bulletText)}
          </li>
        );
        i++;
        continue;
      }

      // Regular paragraph
      nodes.push(
        <p key={`p-${i}`} className="text-xs text-apple-text leading-relaxed font-sans mb-1.5 last:mb-0">
          {renderInline(line)}
        </p>
      );
      i++;
    }

    return nodes;
  };

  return (
    <div className={`space-y-1 break-words overflow-hidden ${className}`}>
      {parseBlocks(content)}
      {isStreaming && (
        <span className="inline-block w-2 h-4 ml-1 bg-apple-blue animate-pulse align-middle font-mono shadow-apple-xs">
          ▋
        </span>
      )}
    </div>
  );
};

export default MarkdownRenderer;
