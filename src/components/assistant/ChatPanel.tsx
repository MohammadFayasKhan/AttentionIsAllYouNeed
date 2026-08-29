/**
 * ChatPanel.tsx
 * ─────────────────────────────────────────────────────────────────
 * Multi-Conversation Research Assistant with Persistent History Panel
 *
 * Project: AttentionIsAllYouNeed
 * Built by: Mohammad Fayas Khan (3rd-year B.Tech CSE AI/ML student at LPU)
 *
 * Architecture:
 *   1. Multi-Session Conversations:
 *      Each "New Chat" creates an independent conversation stored in localStorage.
 *      Switching conversations loads the full prior message history.
 *   2. History Sidebar Panel:
 *      A slide-out panel listing all conversations with auto-derived titles,
 *      relative timestamps, "New Chat" button, and "Clear All" with confirmation.
 *   3. Persistent Local Storage:
 *      Survives chapter changes, Quiz/Flashcards/3D Book tab switches,
 *      overlay close/reopen, and full page refreshes.
 *   4. Token Streaming & Grounded Citations:
 *      Word-by-word streaming with LaTeX math and Vaswani et al. (2017) citations.
 *   5. Isolated Scrolling:
 *      History panel, messages area, and suggested chips each scroll independently
 *      without interfering with the main page or each other.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendGroqStreamMessage, ChatMessage } from '../../lib/groq';
import {
  loadChatStore,
  saveChatStore,
  clearAllChatHistory,
  createNewConversation,
  createDefaultWelcomeMessage,
  deriveTitle,
  formatRelativeTime,
  ChatStore,
  Conversation
} from '../../lib/chatStorage';
import { EducationalMode, STORY_CHAPTERS } from '../../data/paperData';
import { ExpressionKey } from './AvatarController';
import { oneeBridge } from '../../lib/oneeEvents';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Brain,
  AlertCircle,
  RefreshCw,
  Trash2,
  PlusCircle,
  Clock,
  ChevronLeft,
  MessageSquare,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatPanelProps {
  activeChapterId: string;
  mode: EducationalMode;
  onExpressionChange?: (expr: ExpressionKey) => void;
}

const THINKING_STAGES = [
  "Thinking...",
  "Connecting the concepts...",
  "Checking the 2017 paper...",
  "Analyzing the equations...",
  "Building the explanation...",
  "Almost there..."
];

export const ChatPanel: React.FC<ChatPanelProps> = ({
  activeChapterId,
  mode
}) => {
  const activeChapter = STORY_CHAPTERS.find((c) => c.id === activeChapterId) || STORY_CHAPTERS[0];

  // ─── Multi-Conversation State ────────────────────────────────
  const [store, setStore] = useState<ChatStore>(() =>
    loadChatStore(activeChapterId, mode)
  );
  const [showHistory, setShowHistory] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Derived: current active conversation
  const activeConv = store.conversations.find(
    (c) => c.id === store.activeConversationId
  ) || store.conversations[0];
  const messages = activeConv?.messages || [];

  // ─── Chat UI State ───────────────────────────────────────────
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingIndex, setThinkingIndex] = useState(0);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<{ message: string; query: string } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Persistence: auto-save store whenever it changes ────────
  useEffect(() => {
    saveChatStore(store);
  }, [store]);

  // ─── Helper: update messages inside the active conversation ──
  const updateActiveMessages = useCallback(
    (updater: (prev: ChatMessage[]) => ChatMessage[]) => {
      setStore((prevStore) => {
        const updatedConvs = prevStore.conversations.map((c) => {
          if (c.id !== prevStore.activeConversationId) return c;
          const newMessages = updater(c.messages);
          return {
            ...c,
            messages: newMessages,
            updatedAt: Date.now(),
            title: deriveTitle(newMessages)
          };
        });
        return { ...prevStore, conversations: updatedConvs };
      });
    },
    []
  );

  // ─── Thinking Text Cycle ─────────────────────────────────────
  useEffect(() => {
    if (isThinking) {
      oneeBridge.emit('chat_thinking', `"${THINKING_STAGES[0]}"`, 'thinking');
      thinkingTimerRef.current = setInterval(() => {
        setThinkingIndex((prev) => {
          const next = (prev + 1) % THINKING_STAGES.length;
          oneeBridge.emit('chat_thinking', `"${THINKING_STAGES[next]}"`);
          return next;
        });
      }, 1600);
    } else {
      if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
      setThinkingIndex(0);
    }
    return () => {
      if (thinkingTimerRef.current) clearInterval(thinkingTimerRef.current);
    };
  }, [isThinking]);

  // ─── Abort on unmount ────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  // ─── Scroll Helpers ──────────────────────────────────────────
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    isUserScrolledUpRef.current = scrollHeight - scrollTop - clientHeight >= 100;
  };

  const scrollRafIdRef = useRef<number | null>(null);

  const scrollToBottomIfNear = useCallback((smooth = true) => {
    if (scrollRafIdRef.current) cancelAnimationFrame(scrollRafIdRef.current);
    scrollRafIdRef.current = requestAnimationFrame(() => {
      if (!isUserScrolledUpRef.current && scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: smooth ? 'smooth' : 'auto'
        });
      }
    });
  }, []);

  useEffect(() => {
    scrollToBottomIfNear(true);
    return () => {
      if (scrollRafIdRef.current) cancelAnimationFrame(scrollRafIdRef.current);
    };
  }, [messages, loading, isThinking, scrollToBottomIfNear]);

  // ─── Send Message ────────────────────────────────────────────
  const handleSend = useCallback(async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || loading || streamingId) return;

    setErrorState(null);
    isUserScrolledUpRef.current = false;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: 'user',
      content: query.trim(),
      timestamp: Date.now()
    };

    updateActiveMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setIsThinking(true);

    const assistantMsgId = `a-${Date.now()}`;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    await new Promise((r) => setTimeout(r, 450));
    if (controller.signal.aborted) return;

    updateActiveMessages((prev) => [
      ...prev,
      {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        sourceType: 'FROM PAPER'
      }
    ]);

    setIsThinking(false);
    setStreamingId(assistantMsgId);

    const initialCaption = query.toLowerCase().includes('position')
      ? '"Explaining Positional Encoding (Section 3.5)..."'
      : query.toLowerCase().includes('attention')
      ? '"Explaining Scaled Dot-Product Attention equations..."'
      : '"Streaming grounded response..."';
    oneeBridge.emit('chat_responding', initialCaption, 'working');

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: query.trim() });

      const res = await sendGroqStreamMessage(
        history,
        mode,
        activeChapterId,
        (partialText) => {
          updateActiveMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: partialText } : m
            )
          );
          scrollToBottomIfNear(false);
        },
        controller.signal
      );

      updateActiveMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: res.text, sourceType: res.sourceType }
            : m
        )
      );

      oneeBridge.emit('chat_complete', '"Hope that clarifies the equation!"', 'happy');
    } catch (err: any) {
      if (err?.name === 'AbortError') return;
      console.error('Chat generation error:', err);
      updateActiveMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
      setErrorState({
        message: 'Could not complete response generation. Please check connection and retry.',
        query: query.trim()
      });
      oneeBridge.emit('quiz_incorrect', '"Generation encountered an issue."', 'confused');
    } finally {
      setLoading(false);
      setIsThinking(false);
      setStreamingId(null);
      abortControllerRef.current = null;
    }
  }, [input, loading, streamingId, messages, mode, activeChapterId, updateActiveMessages, scrollToBottomIfNear]);

  const handleRetry = () => {
    if (errorState?.query) {
      const q = errorState.query;
      setErrorState(null);
      handleSend(q);
    }
  };

  // ─── Conversation Management ─────────────────────────────────

  /** Create a new conversation and switch to it */
  const handleNewChat = () => {
    const newConv = createNewConversation(activeChapterId, mode);
    setStore((prev) => ({
      activeConversationId: newConv.id,
      conversations: [newConv, ...prev.conversations]
    }));
    setErrorState(null);
    setShowHistory(false);
    isUserScrolledUpRef.current = false;
  };

  /** Switch to a different conversation */
  const handleSwitchConversation = (convId: string) => {
    if (convId === store.activeConversationId) {
      setShowHistory(false);
      return;
    }
    setStore((prev) => ({ ...prev, activeConversationId: convId }));
    setErrorState(null);
    setShowHistory(false);
    isUserScrolledUpRef.current = false;
  };

  /** Delete a single conversation from history */
  const handleDeleteConversation = (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setStore((prev) => {
      const remaining = prev.conversations.filter((c) => c.id !== convId);

      // If we deleted the active conversation, switch to the first remaining one,
      // or create a fresh one if all were deleted
      if (remaining.length === 0) {
        const fresh = createNewConversation(activeChapterId, mode);
        return { activeConversationId: fresh.id, conversations: [fresh] };
      }

      const newActiveId =
        convId === prev.activeConversationId ? remaining[0].id : prev.activeConversationId;
      return { activeConversationId: newActiveId, conversations: remaining };
    });
  };

  /** Clear all conversations from localStorage */
  const handleConfirmClearAll = () => {
    clearAllChatHistory();
    const fresh = createNewConversation(activeChapterId, mode);
    setStore({ activeConversationId: fresh.id, conversations: [fresh] });
    setShowClearConfirm(false);
    setShowHistory(false);
    setErrorState(null);
    oneeBridge.emit('chat_complete', '"All conversation history cleared!"', 'idle');
  };

  // ─── Dynamic Prompt Chips ────────────────────────────────────
  const dynamicChips =
    activeChapter.difficultyDetails?.[mode]?.assistantPrompts ||
    activeChapter.assistantPrompts || [
      "Why does a Transformer need positional information?",
      "Explain Q, K, and V",
      "Why divide by √d_k?",
      "Why 8 attention heads?",
      "RNN vs Transformer complexity"
    ];

  // Sort conversations by updatedAt descending for the history panel
  const sortedConversations = [...store.conversations].sort(
    (a, b) => b.updatedAt - a.updatedAt
  );

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full w-full bg-white border border-black/10 rounded-3xl overflow-hidden shadow-apple-md font-sans relative">

      {/* ──── Header ──── */}
      <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-b border-black/5 bg-slate-50/90 backdrop-blur-md shrink-0 z-10">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="w-8 h-8 rounded-xl bg-apple-blue/10 border border-blue-200 flex items-center justify-center text-apple-blue font-bold shadow-apple-xs shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h4 className="text-xs font-bold text-apple-text flex items-center gap-2 font-mono truncate">
              <span className="truncate">Onee Research Assistant</span>
              <span className="text-[9px] bg-blue-100 text-apple-blue font-bold px-2 py-0.5 rounded-full uppercase shrink-0">
                {mode.replace('_MODE', '')}
              </span>
            </h4>
            <span className="text-[10px] text-apple-secondary font-mono truncate block">
              Chapter {activeChapter.chapterNumber}: {activeChapter.eyebrow}
            </span>
          </div>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* History Toggle */}
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[11px] font-mono font-medium shadow-apple-xs transition-all focus-visible:ring-2 focus-visible:ring-apple-blue ${
              showHistory
                ? 'bg-apple-blue text-white border-apple-blue'
                : 'bg-white text-apple-secondary border-black/10 hover:text-apple-blue hover:border-blue-300'
            }`}
            title="Chat History"
            aria-label="Toggle chat history"
          >
            <Clock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">History</span>
          </button>

          {/* New Chat */}
          <button
            onClick={handleNewChat}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-black/10 text-apple-secondary hover:text-apple-blue hover:border-blue-300 text-[11px] font-mono font-medium shadow-apple-xs transition-all focus-visible:ring-2 focus-visible:ring-apple-blue"
            title="Start new conversation"
            aria-label="New conversation"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>
        </div>
      </div>

      {/* ──── History Sidebar Overlay ──── */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 z-40 flex"
            style={{ top: 0 }}
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/25 backdrop-blur-sm"
              onClick={() => setShowHistory(false)}
            />

            {/* Sidebar */}
            <motion.div
              initial={{ x: '-100%', opacity: 0.5 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '-100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350 }}
              className="relative z-50 w-[280px] sm:w-[320px] max-w-[85%] h-full bg-white/95 backdrop-blur-2xl border-r border-black/10 flex flex-col shadow-apple-xl"
            >
              {/* Sidebar Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-black/5 shrink-0">
                <h3 className="text-sm font-bold text-apple-text font-mono flex items-center gap-2">
                  <Clock className="w-4 h-4 text-apple-blue" />
                  Chat History
                </h3>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleNewChat}
                    className="p-1.5 rounded-lg text-apple-secondary hover:text-apple-blue hover:bg-blue-50 transition-all"
                    title="New conversation"
                    aria-label="New conversation"
                  >
                    <PlusCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowHistory(false)}
                    className="p-1.5 rounded-lg text-apple-secondary hover:text-apple-text hover:bg-slate-100 transition-all"
                    title="Close history"
                    aria-label="Close history panel"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Conversation List */}
              <div
                data-scrollable="true"
                onWheel={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-2 py-2 space-y-1"
                style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
              >
                {sortedConversations.length === 0 ? (
                  /* Empty State */
                  <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center">
                      <MessageSquare className="w-6 h-6 text-apple-tertiary" />
                    </div>
                    <p className="text-xs text-apple-secondary font-mono">
                      No conversations yet.
                    </p>
                    <p className="text-[10px] text-apple-tertiary font-sans">
                      Start a new chat to ask Onee about the Transformer paper!
                    </p>
                  </div>
                ) : (
                  sortedConversations.map((conv) => {
                    const isActive = conv.id === store.activeConversationId;
                    const msgCount = conv.messages.filter((m) => m.role === 'user').length;
                    const preview = conv.messages
                      .filter((m) => m.role === 'user')
                      .slice(-1)[0]?.content;

                    return (
                      <button
                        key={conv.id}
                        onClick={() => handleSwitchConversation(conv.id)}
                        className={`w-full text-left p-3 rounded-2xl transition-all group relative ${
                          isActive
                            ? 'bg-apple-blue/10 border border-blue-200 shadow-apple-xs'
                            : 'bg-white hover:bg-slate-50 border border-transparent hover:border-black/5'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold truncate font-mono ${
                              isActive ? 'text-apple-blue' : 'text-apple-text'
                            }`}>
                              {conv.title}
                            </p>
                            {preview && (
                              <p className="text-[10px] text-apple-secondary font-sans truncate mt-0.5 leading-snug">
                                {preview.slice(0, 60)}{preview.length > 60 ? '…' : ''}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1.5">
                              <span className="text-[9px] text-apple-tertiary font-mono">
                                {formatRelativeTime(conv.updatedAt)}
                              </span>
                              {msgCount > 0 && (
                                <span className="text-[9px] text-apple-tertiary font-mono">
                                  · {msgCount} {msgCount === 1 ? 'question' : 'questions'}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Delete single conversation */}
                          <button
                            onClick={(e) => handleDeleteConversation(conv.id, e)}
                            className="p-1 rounded-lg text-apple-tertiary hover:text-rose-600 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-all shrink-0 mt-0.5"
                            title="Delete conversation"
                            aria-label="Delete conversation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-apple-blue rounded-r-full" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Sidebar Footer: Clear All */}
              {sortedConversations.length > 0 && (
                <div className="px-3 py-3 border-t border-black/5 shrink-0">
                  <button
                    onClick={() => setShowClearConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-mono font-bold transition-all border border-rose-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All History
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──── Clear All Confirmation Modal ──── */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.92, y: 8 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 8 }}
              className="bg-white rounded-3xl p-5 sm:p-6 max-w-sm w-full border border-black/10 shadow-apple-xl space-y-4 text-left font-sans"
            >
              <div className="flex items-center gap-3 text-rose-600">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center shrink-0">
                  <Trash2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-apple-text font-mono">Clear All History?</h4>
                  <p className="text-[11px] text-apple-secondary font-mono">
                    This will permanently delete all {store.conversations.length} conversation{store.conversations.length !== 1 ? 's' : ''} stored on this device.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-black/5">
                <button
                  onClick={() => setShowClearConfirm(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-apple-text text-xs font-mono font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmClearAll}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-mono font-bold transition-all shadow-apple-sm"
                >
                  Clear All History
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ──── Messages Scroll Area ──── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        data-scrollable="true"
        onWheel={(e) => e.stopPropagation()}
        onTouchMove={(e) => e.stopPropagation()}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4 bg-slate-50/40 overscroll-contain"
        style={{ overscrollBehavior: 'contain', touchAction: 'pan-y' }}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          const isStreamingThis = msg.id === streamingId;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0 font-bold ${
                  isUser
                    ? 'bg-apple-blue text-white shadow-apple-sm'
                    : 'bg-blue-100 text-apple-blue border border-blue-200 shadow-apple-sm'
                }`}
              >
                {isUser ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
              </div>

              <div
                className={`max-w-[88%] p-4 rounded-2xl text-xs leading-relaxed font-sans shadow-apple-sm overflow-hidden ${
                  isUser
                    ? 'bg-apple-blue text-white rounded-tr-none'
                    : 'bg-white border border-black/10 text-apple-text rounded-tl-none'
                }`}
              >
                <MarkdownRenderer
                  content={msg.content}
                  isStreaming={isStreamingThis}
                  className={isUser ? 'text-white' : ''}
                />
                {msg.sourceType && !isUser && !isStreamingThis && (
                  <div className="mt-2.5 pt-2 border-t border-black/5 text-[9px] font-mono flex items-center gap-1 text-apple-blue font-semibold">
                    <Sparkles className="w-3 h-3" />
                    <span>Grounded in Vaswani et al. (2017) • {activeChapter.sourceReference.section}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Thinking State */}
        {isThinking && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-blue-50/90 border border-blue-200 text-xs font-mono text-apple-blue w-fit shadow-apple-sm"
          >
            <Brain className="w-4 h-4 animate-spin-slow text-apple-blue shrink-0" />
            <span className="font-semibold">{THINKING_STAGES[thinkingIndex]}</span>
          </motion.div>
        )}

        {/* Error Banner */}
        {errorState && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-sans text-rose-900 shadow-apple-sm flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="truncate">{errorState.message}</span>
            </div>
            <button
              onClick={handleRetry}
              className="flex items-center gap-1 px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs font-bold transition-all shrink-0 shadow-apple-xs"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry</span>
            </button>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ──── Suggested Prompt Chips ──── */}
      <div className="px-4 py-2 border-t border-black/5 bg-slate-50/90 flex items-center gap-2 shrink-0 overflow-hidden">
        <span className="text-[9px] font-mono font-bold text-apple-secondary uppercase shrink-0 select-none">
          Suggested:
        </span>
        <div
          data-scrollable="true"
          onWheel={(e) => {
            if (e.deltaY !== 0) {
              e.stopPropagation();
              e.currentTarget.scrollLeft += e.deltaY;
            }
          }}
          onTouchMove={(e) => e.stopPropagation()}
          className="flex items-center gap-2 overflow-x-auto py-1 overscroll-contain flex-1 min-w-0"
          style={{ overscrollBehavior: 'contain', scrollbarWidth: 'thin' }}
        >
          {dynamicChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              disabled={loading || !!streamingId}
              className="px-3 py-1.5 rounded-full bg-white border border-black/10 text-[11px] font-mono text-apple-secondary hover:text-apple-blue hover:border-blue-300 hover:bg-blue-50/50 disabled:opacity-40 transition-all shadow-apple-sm whitespace-nowrap shrink-0 cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>

      {/* ──── Input Form ──── */}
      <div className="p-3.5 border-t border-black/5 bg-white flex items-end gap-2 shrink-0">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={loading || !!streamingId}
          placeholder={`Ask Onee about Chapter ${activeChapter.chapterNumber} or any paper equation...`}
          className="flex-1 bg-slate-50 border border-black/10 rounded-2xl px-4 py-2.5 text-xs text-apple-text placeholder-apple-tertiary focus:outline-none focus:border-apple-blue focus:ring-2 focus:ring-blue-500/10 font-sans resize-none disabled:opacity-60 max-h-28"
        />
        <button
          onClick={() => handleSend()}
          disabled={loading || !!streamingId || !input.trim()}
          className="p-3 rounded-2xl bg-apple-blue text-white hover:bg-blue-600 disabled:opacity-40 transition-all shadow-apple-sm shrink-0"
          aria-label="Send Message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatPanel;
