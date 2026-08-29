/**
 * ChatPanel.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * ChatPanel powers the conversational research assistant embedded in the FullOneeOverlay.
 *
 * Core Features:
 *   1. Progressive Token/Chunk Streaming & True Completion State:
 *      Uses `sendGroqStreamMessage` to stream LLM responses word-by-word with natural cadence.
 *      The UI strictly differentiates between 'thinking', 'streaming', and 'completed' states,
 *      and never marks an incomplete response as finished.
 *   2. Natural, Calm, Multi-Second Character Transitions:
 *      Allows Onee's procedural avatar animations to play smoothly at their natural 2.5s-3.5s
 *      pacing with natural eye blinks and subtle head tilts, without erratic rapid switching.
 *   3. Dynamic Speech Bubble Sync:
 *      Updates Onee's companion speech bubble smoothly at calm, non-jittery intervals.
 *   4. Recoverable Error State with Retry Action:
 *      If network times out or generation is interrupted, displays a recovery banner with a "Retry" button.
 *   5. Intelligent Sticky Auto-Scroll:
 *      Automatically follows active streaming chunks when the user is at the bottom, while
 *      gracefully allowing free backward scrolling to review previous turns.
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { sendGroqStreamMessage, ChatMessage } from '../../lib/groq';
import { EducationalMode, STORY_CHAPTERS } from '../../data/paperData';
import { ExpressionKey } from './AvatarController';
import { oneeBridge } from '../../lib/oneeEvents';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { Send, Bot, User, Sparkles, Brain, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

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

  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-init',
      role: 'assistant',
      content: `Hello! I'm **Onee**, your research companion for *"Attention Is All You Need"* (Vaswani et al. 2017).\n\nCurrently exploring **Chapter ${activeChapter.chapterNumber}: ${activeChapter.title}** in **${mode.replace('_MODE', '')}** depth.\n\nAsk me any mathematical, architectural, or empirical question, or tap any prompt chip below!`,
      timestamp: Date.now(),
      sourceType: 'FROM PAPER'
    }
  ]);

  const [loading, setLoading] = useState<boolean>(false);
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [thinkingIndex, setThinkingIndex] = useState<number>(0);
  const [streamingId, setStreamingId] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<{ message: string; query: string } | null>(null);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isUserScrolledUpRef = useRef<boolean>(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const thinkingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calm thinking text cycle (updates UI text every 1.6s without resetting avatar animation)
  useEffect(() => {
    if (isThinking) {
      // Start calm thinking animation once
      oneeBridge.emit('chat_thinking', `“${THINKING_STAGES[0]}”`, 'thinking');

      thinkingTimerRef.current = setInterval(() => {
        setThinkingIndex((prev) => {
          const next = (prev + 1) % THINKING_STAGES.length;
          // Update speech caption smoothly
          oneeBridge.emit('chat_thinking', `“${THINKING_STAGES[next]}”`);
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

  // Clean up abort controllers on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Detect user manual scroll to avoid hijacking scroll when reading previous messages
  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // If within 100px of bottom, consider user as "at bottom"
    const atBottom = scrollHeight - scrollTop - clientHeight < 100;
    isUserScrolledUpRef.current = !atBottom;
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

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    setIsThinking(true);

    const assistantMsgId = `a-${Date.now()}`;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // Realistic reasoning pause of 500ms
    await new Promise((r) => setTimeout(r, 500));
    if (controller.signal.aborted) return;

    // Add placeholder assistant message for streaming
    setMessages((prev) => [
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

    // Calm speaking/explaining animation initiated once at the start of streaming
    const initialCaption = query.toLowerCase().includes('position')
      ? '“Explaining Positional Encoding (Section 3.5)...”'
      : query.toLowerCase().includes('attention')
      ? '“Explaining Scaled Dot-Product Attention equations...”'
      : '“Streaming grounded response...”';

    oneeBridge.emit('chat_responding', initialCaption, 'working');

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      history.push({ role: 'user', content: query.trim() });

      const res = await sendGroqStreamMessage(
        history,
        mode,
        activeChapterId,
        (partialText) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId ? { ...m, content: partialText } : m
            )
          );
          scrollToBottomIfNear(false);
        },
        controller.signal
      );

      // Reconcile and set final completed text
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: res.text, sourceType: res.sourceType }
            : m
        )
      );

      // Finish cleanly with a graceful celebration reaction
      oneeBridge.emit('chat_complete', '“Hope that clarifies the equation!”', 'happy');
    } catch (err: any) {
      if (err?.name === 'AbortError') return;

      console.error('Chat generation error:', err);
      // Remove empty assistant placeholder if failed
      setMessages((prev) => prev.filter((m) => m.id !== assistantMsgId));
      setErrorState({
        message: 'Could not complete response generation. Please check connection and retry.',
        query: query.trim()
      });

      oneeBridge.emit('quiz_incorrect', '“Generation encountered an issue.”', 'confused');
    } finally {
      setLoading(false);
      setIsThinking(false);
      setStreamingId(null);
      abortControllerRef.current = null;
    }
  }, [input, loading, streamingId, messages, mode, activeChapterId]);

  const handleRetry = () => {
    if (errorState?.query) {
      const q = errorState.query;
      setErrorState(null);
      handleSend(q);
    }
  };

  // Dynamic Prompt Chips based on active chapter and mode
  const dynamicChips =
    activeChapter.difficultyDetails?.[mode]?.assistantPrompts ||
    activeChapter.assistantPrompts || [
      "Why does a Transformer need positional information?",
      "Explain Q, K, and V",
      "Why divide by √d_k?",
      "Why 8 attention heads?",
      "RNN vs Transformer complexity"
    ];

  return (
    <div className="flex flex-col h-full w-full bg-white border border-black/10 rounded-3xl overflow-hidden shadow-apple-md font-sans">
      {/* Apple Glass Chat Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-black/5 bg-slate-50/90 backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3 min-w-0">
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

        <div className="text-[10px] font-mono text-apple-tertiary hidden sm:block shrink-0">
          Vaswani et al. (2017)
        </div>
      </div>

      {/* Messages Scroll Area */}
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

        {/* Dynamic Contextual Thinking State */}
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

        {/* Recoverable Error Banner */}
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

      {/* Suggested Prompt Chips Bar — Fully scrollable horizontally on desktop with mouse wheel and touch */}
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

      {/* Input Form with Textarea supporting Enter / Shift+Enter */}
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
