/**
 * chatStorage.ts
 * ─────────────────────────────────────────────────────────────────
 * Multi-Conversation Persistent Storage for Onee Chatbot
 *
 * Project: AttentionIsAllYouNeed
 * Built by: Mohammad Fayas Khan (3rd-year B.Tech CSE AI/ML student at LPU)
 *
 * Data Model:
 *   ChatStore {
 *     activeConversationId: string
 *     conversations: Conversation[]
 *   }
 *
 *   Conversation {
 *     id: string                  — unique UUID-like identifier
 *     title: string               — auto-generated from first user message
 *     createdAt: number           — epoch ms
 *     updatedAt: number           — epoch ms, updated on every message
 *     messages: ChatMessage[]     — full turn-by-turn history
 *   }
 *
 * Capabilities:
 *   - Persists across chapter changes, tab switches, modal close/reopen, page refresh.
 *   - Validates and sanitises stored data on every load (corrupt-proof).
 *   - Auto-titles conversations from the first user message content.
 *   - Supports: create, switch, delete single, clear all, save messages.
 */

import { ChatMessage } from './groq';
import { STORY_CHAPTERS, EducationalMode } from '../data/paperData';

// ─── Types ───────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface ChatStore {
  activeConversationId: string;
  conversations: Conversation[];
}

// ─── Constants ───────────────────────────────────────────────────

export const CHAT_STORAGE_KEY = 'attention_transformer_chat_store_v3';

// ─── Helpers ─────────────────────────────────────────────────────

/** Generate a short unique ID */
function generateId(): string {
  return `conv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

/** Derive a short readable title from the first user message */
export function deriveTitle(messages: ChatMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === 'user');
  if (!firstUserMsg) return 'New Conversation';
  const text = firstUserMsg.content.trim();
  if (text.length <= 48) return text;
  return text.slice(0, 45).trimEnd() + '…';
}

/** Format a timestamp into a human-friendly relative string */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diffMs = now - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;

  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Create the default welcome message for a new conversation */
export function createDefaultWelcomeMessage(
  chapterId = 'story-hook',
  mode: EducationalMode = 'BEGINNER'
): ChatMessage {
  const chapter = STORY_CHAPTERS.find((c) => c.id === chapterId) || STORY_CHAPTERS[0];
  const modeLabel = mode.replace('_MODE', '');

  return {
    id: `m-init-${Date.now()}`,
    role: 'assistant',
    content: `Hello! I'm **Onee**, your grounded research companion for *"Attention Is All You Need"* (Vaswani et al. 2017).\n\nCurrently exploring **Chapter ${chapter.chapterNumber}: ${chapter.title}** in **${modeLabel}** depth.\n\nAsk me any mathematical, architectural, or empirical question, or tap any prompt chip below!`,
    timestamp: Date.now(),
    sourceType: 'FROM PAPER'
  };
}

/** Create a fresh conversation object */
export function createNewConversation(
  chapterId = 'story-hook',
  mode: EducationalMode = 'BEGINNER'
): Conversation {
  const now = Date.now();
  return {
    id: generateId(),
    title: 'New Conversation',
    createdAt: now,
    updatedAt: now,
    messages: [createDefaultWelcomeMessage(chapterId, mode)]
  };
}

// ─── Validation ──────────────────────────────────────────────────

function isValidMessage(m: any): m is ChatMessage {
  return (
    m &&
    typeof m === 'object' &&
    typeof m.id === 'string' &&
    (m.role === 'user' || m.role === 'assistant' || m.role === 'system') &&
    typeof m.content === 'string'
  );
}

function isValidConversation(c: any): c is Conversation {
  return (
    c &&
    typeof c === 'object' &&
    typeof c.id === 'string' &&
    typeof c.title === 'string' &&
    typeof c.createdAt === 'number' &&
    typeof c.updatedAt === 'number' &&
    Array.isArray(c.messages)
  );
}

// ─── Core Storage API ────────────────────────────────────────────

/**
 * Load the entire chat store from localStorage.
 * Returns a valid ChatStore, creating a default one if nothing exists or data is corrupt.
 */
export function loadChatStore(
  activeChapterId = 'story-hook',
  mode: EducationalMode = 'BEGINNER'
): ChatStore {
  if (typeof window === 'undefined' || !window.localStorage) {
    const conv = createNewConversation(activeChapterId, mode);
    return { activeConversationId: conv.id, conversations: [conv] };
  }

  try {
    const raw = localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) {
      const conv = createNewConversation(activeChapterId, mode);
      return { activeConversationId: conv.id, conversations: [conv] };
    }

    const parsed = JSON.parse(raw);

    // Validate top-level structure
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Array.isArray(parsed.conversations) ||
      typeof parsed.activeConversationId !== 'string'
    ) {
      const conv = createNewConversation(activeChapterId, mode);
      return { activeConversationId: conv.id, conversations: [conv] };
    }

    // Validate each conversation and its messages
    const validConversations: Conversation[] = parsed.conversations
      .filter(isValidConversation)
      .map((c: Conversation) => ({
        ...c,
        messages: c.messages.filter(isValidMessage)
      }))
      .filter((c: Conversation) => c.messages.length > 0);

    if (validConversations.length === 0) {
      const conv = createNewConversation(activeChapterId, mode);
      return { activeConversationId: conv.id, conversations: [conv] };
    }

    // Ensure activeConversationId points to a real conversation
    const activeExists = validConversations.some(
      (c) => c.id === parsed.activeConversationId
    );
    const activeId = activeExists
      ? parsed.activeConversationId
      : validConversations[0].id;

    return { activeConversationId: activeId, conversations: validConversations };
  } catch (err) {
    console.warn('Failed to parse chat store, resetting:', err);
    const conv = createNewConversation(activeChapterId, mode);
    return { activeConversationId: conv.id, conversations: [conv] };
  }
}

/**
 * Persist the entire chat store to localStorage.
 */
export function saveChatStore(store: ChatStore): void {
  if (typeof window === 'undefined' || !window.localStorage) return;

  try {
    // Filter out empty streaming placeholders from each conversation before saving
    const cleaned: ChatStore = {
      ...store,
      conversations: store.conversations.map((c) => ({
        ...c,
        messages: c.messages.filter((m) => m.content && m.content.trim().length > 0)
      }))
    };
    localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(cleaned));
  } catch (err) {
    console.warn('Failed to persist chat store:', err);
  }
}

/**
 * Clear all conversation history from localStorage.
 */
export function clearAllChatHistory(): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    localStorage.removeItem(CHAT_STORAGE_KEY);
  } catch (err) {
    console.warn('Failed to clear chat history:', err);
  }
}
