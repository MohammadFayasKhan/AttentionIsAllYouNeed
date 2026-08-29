/**
 * vite-env.d.ts
 * ─────────────────────────────────────────────────────────────────
 * Vite Environment Variable Type Declarations
 *
 * Project: AttentionIsAllYouNeed
 * Author: Mohammad Fayas Khan (B.Tech CSE AI/ML student)
 *
 * Details:
 *   Declares typed environment variables loaded via `import.meta.env`.
 *   - `VITE_GROQ_API_KEY`: API key for optional remote Groq LLM inference in the Onee research chatbot.
 *   - `VITE_GROQ_MODEL`: Model identifier (e.g. `openai/gpt-oss-120b`).
 *   If no key is configured, the system gracefully falls back to the embedded grounded knowledge engine.
 */

/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GROQ_API_KEY: string;
  readonly VITE_GROQ_MODEL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
