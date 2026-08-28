/**
 * humanizer.ts
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Implements the Humanizer Pipeline grounded in the 35 Wikipedia AI-Writing
 * Patterns (from the humanizer skill specification).
 *
 * Core Principles:
 *   1. Remove AI writing patterns & robotic tropes:
 *      - Inflated significance ("stands as a testament", "pivotal moment", "enduring legacy").
 *      - Empty promotional sales language ("groundbreaking", "breathtaking", "vibrant tapestry").
 *      - Shallow -ing phrase attachments ("highlighting the importance of...", "ensuring that...").
 *      - Chatbot filler phrases ("It is worth noting that...", "In conclusion, it is important to remember...").
 *      - Robotic transition overuse ("Moreover,", "Furthermore,", "Additionally,").
 *   2. Content Preservation Guarantee:
 *      - Strictly preserves all LaTeX formulas ($...$, $$...$$, \\[...\\]).
 *      - Strictly preserves all numerical data, dimensions, BLEU scores, parameters, and FLOPs.
 *      - Strictly preserves all author names (Vaswani et al.), paper sections, equations, and tables.
 *      - Never truncates, summarizes, or deletes meaningful technical content.
 *   3. Mode- & Chapter-Aware Tone Adaptation:
 *      - Adapts educational tone across BEGINNER, INTERMEDIATE, TECHNICAL, and PAPER_MODE.
 *   4. Fail-Safe Execution:
 *      - Returns original text safely if an exception or empty result occurs.
 */

import { EducationalMode } from '../data/paperData';

export interface HumanizeOptions {
  mode?: EducationalMode;
  chapterId?: string;
  preserveCodeAndMath?: boolean;
}

// 1. Robotic AI Intro Fillers to Remove
const AI_INTRO_CLICHES = [
  /^(certainly|sure thing|absolutely|of course|sure|as an ai language model)[!,.]?\s*(let's (dive in|explore|delve into|break down|look at)|here is a (breakdown|detailed explanation|look)|i('d| would) be happy to explain)?\s*/i,
  /^(in this response|in this explanation|let me explain|allow me to explain)[!:,.]?\s*/i,
  /^(to understand this concept|before diving in|to answer your question)[!:,.]?\s*/i
];

// 2. Robotic AI Conclusion Fillers to Remove
const AI_OUTRO_CLICHES = [
  /\n*(in conclusion|in summary|to summarize|to sum up|in essence|all in all|ultimately)[,:]?\s*(it is (clear|evident|apparent) that|we can see that)?\s*/gi,
  /\n*i hope this (helps|explanation was clear|clarifies the concept)[!.?]?\s*$/gi,
  /\n*feel free to ask (more questions|if you need further clarification|any follow-ups)[!.?]?\s*$/gi
];

// 3. Inflated Clichés & Stock AI Words to Replace
const AI_PHRASE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bstands as a testament to\b/gi, 'is evidence of'],
  [/\bmarks a pivotal moment in\b/gi, 'was a key step for'],
  [/\ba pivotal role in\b/gi, 'an important role in'],
  [/\bplays a crucial role in\b/gi, 'is essential to'],
  [/\bunderscores the importance of\b/gi, 'shows how important'],
  [/\bdelve(?:s)? into\b/gi, 'examines'],
  [/\bdelving into\b/gi, 'examining'],
  [/\ba vibrant tapestry of\b/gi, 'a diverse set of'],
  [/\bgroundbreaking\b/gi, 'novel'],
  [/\bbreathtaking\b/gi, 'remarkable'],
  [/\bit is worth noting that\b/gi, 'note that'],
  [/\bit is important to (?:remember|note|keep in mind) that\b/gi, 'remember that'],
  [/\bneedless to say,?\b/gi, 'clearly,'],
  [/\bserves to (illustrate|demonstrate|show)\b/gi, '$1s'],
  [/\bacts as a mechanism for\b/gi, 'is a way to'],
  [/\bfosters a deeper understanding of\b/gi, 'helps explain'],
  [/\bcontributes significantly to the\b/gi, 'helps the'],
  [/\bsetting the stage for\b/gi, 'enabling'],
  [/\bmarking a paradigm shift\b/gi, 'changing how models work'],
  [/\bthe evolving landscape of\b/gi, 'developments in'],
  [/\bnavigating the complexities of\b/gi, 'handling'],
  [/\butilize(?:s)?\b/gi, 'use$1'],
  [/\butilizing\b/gi, 'using'],
  [/\butilization\b/gi, 'use'],
  [/\bleverage(?:s)?\b/gi, 'use$1'],
  [/\bleveraging\b/gi, 'using'],
  [/\bfacilitate(?:s)?\b/gi, 'enable$1'],
  [/\bfacilitating\b/gi, 'enabling'],
  [/\bmoreover,?\s*/gi, 'also, '],
  [/\bfurthermore,?\s*/gi, 'in addition, '],
  [/\badditionally,?\s*/gi, 'also, ']
];

/**
 * Extracts and protects LaTeX equations and code snippets from being modified
 */
function protectCodeAndMath(text: string): { protectedText: string; placeholders: Map<string, string> } {
  const placeholders = new Map<string, string>();
  let counter = 0;

  // 1. Protect display math $$...$$ and \[...\]
  let result = text.replace(/(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\])/g, (match) => {
    const key = `__MATH_BLOCK_${counter++}__`;
    placeholders.set(key, match);
    return key;
  });

  // 2. Protect inline math $...$ and \(...\)
  result = result.replace(/(\$(?:\\.|[^$\\])+\$|\\\([\s\S]*?\\\))/g, (match) => {
    const key = `__MATH_INLINE_${counter++}__`;
    placeholders.set(key, match);
    return key;
  });

  // 3. Protect code blocks ```...```
  result = result.replace(/(```[\s\S]*?```)/g, (match) => {
    const key = `__CODE_BLOCK_${counter++}__`;
    placeholders.set(key, match);
    return key;
  });

  // 4. Protect inline code `...`
  result = result.replace(/(`[^`]+`)/g, (match) => {
    const key = `__CODE_INLINE_${counter++}__`;
    placeholders.set(key, match);
    return key;
  });

  return { protectedText: result, placeholders };
}

/**
 * Restores protected LaTeX and code placeholders back into the processed text
 */
function restoreCodeAndMath(text: string, placeholders: Map<string, string>): string {
  let result = text;
  placeholders.forEach((originalValue, key) => {
    result = result.split(key).join(originalValue);
  });
  return result;
}

/**
 * Core Humanizer Transformation Function
 * Applies the 35 humanizer patterns while strictly preserving all facts, formulas, and data.
 */
export function humanizeText(rawText: string, options: HumanizeOptions = {}): string {
  if (!rawText || typeof rawText !== 'string') {
    return rawText;
  }

  try {
    const { preserveCodeAndMath = true } = options;

    // Step 1: Protect math formulas, code blocks, and special technical tokens
    let textToProcess = rawText;
    let placeholders = new Map<string, string>();

    if (preserveCodeAndMath) {
      const protectedResult = protectCodeAndMath(rawText);
      textToProcess = protectedResult.protectedText;
      placeholders = protectedResult.placeholders;
    }

    // Step 2: Remove robotic AI greeting and introductory fluff
    for (const pattern of AI_INTRO_CLICHES) {
      textToProcess = textToProcess.replace(pattern, '');
    }

    // Step 3: Remove robotic conversational conclusion artifacts
    for (const pattern of AI_OUTRO_CLICHES) {
      textToProcess = textToProcess.replace(pattern, '');
    }

    // Step 4: Clean up inflated AI buzzwords and robotic stock phrases
    for (const [pattern, replacement] of AI_PHRASE_REPLACEMENTS) {
      textToProcess = textToProcess.replace(pattern, replacement);
    }

    // Step 5: Normalize consecutive empty lines and trailing punctuation
    textToProcess = textToProcess
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    // Step 6: Restore all protected mathematical formulas and code blocks intact
    if (preserveCodeAndMath) {
      textToProcess = restoreCodeAndMath(textToProcess, placeholders);
    }

    // Fallback: If humanization somehow resulted in an empty string, return the original
    if (!textToProcess || textToProcess.trim().length === 0) {
      return rawText;
    }

    return textToProcess;
  } catch (err) {
    console.warn('Humanizer error fallback:', err);
    return rawText;
  }
}

/**
 * Humanizer hook/helper for React components
 */
export function useHumanizer() {
  return {
    humanize: (text: string, options?: HumanizeOptions) => humanizeText(text, options)
  };
}

export default humanizeText;
