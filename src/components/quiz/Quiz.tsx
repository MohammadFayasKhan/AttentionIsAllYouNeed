/**
 * Quiz.tsx
 * --------------------------------------------------------------------------------
 * Architecture Overview:
 * Interactive knowledge assessment module grounded strictly in Vaswani et al. (2017).
 *
 * Core Features:
 *   1. Dynamic Question Set Generation:
 *      Uses `getDynamicQuizQuestions(chapterId, mode)` to populate a fresh 5-question
 *      comprehension quiz on every session open, chapter change, or "New Set" click.
 *   2. Option Shuffling & KaTeX Math Rendering:
 *      Renders questions, options, and explanations with `MarkdownRenderer` for clean KaTeX equations.
 *   3. Real-time Feedback & Event Bridge Reactions:
 *      - Correct answers trigger `quiz_correct` ('celebrate' animation + confetti particle burst).
 *      - Incorrect answers trigger `quiz_incorrect` ('confused' animation + explanation drawer).
 *   4. Streak & Score Tracking:
 *      Tracks consecutive correct answer streaks and displays source citations for every question.
 */

import React, { useState, useEffect } from 'react';
import { QuizQuestion, getDynamicQuizQuestions } from '../../data/quizData';
import { EducationalMode } from '../../data/paperData';
import { oneeBridge } from '../../lib/oneeEvents';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Trophy, RotateCcw, Sparkles, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';

interface QuizProps {
  chapterId?: string;
  mode?: EducationalMode;
}

export const Quiz: React.FC<QuizProps> = ({ chapterId, mode = 'BEGINNER' }) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(() =>
    getDynamicQuizQuestions(chapterId, mode, 5)
  );
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);
  const [streak, setStreak] = useState<number>(0);
  const [completed, setCompleted] = useState<boolean>(false);

  // Regenerate questions on chapter or mode change
  useEffect(() => {
    const fresh = getDynamicQuizQuestions(chapterId, mode, 5);
    setQuestions(fresh);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setCompleted(false);
  }, [chapterId, mode]);

  const currentQ = questions[currentIndex] || questions[0];

  const handleSelectOption = (idx: number) => {
    if (isAnswered) return;
    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQ.correctIndex;
    if (isCorrect) {
      setScore((s) => s + 1);
      setStreak((st) => st + 1);
      oneeBridge.emit('quiz_correct', '“Spot on! Correct answer 🎉”');

      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.7 }
        });
      } catch (e) {
        // ignore
      }
    } else {
      setStreak(0);
      oneeBridge.emit('quiz_incorrect', '“Not quite! Check the explanation below.”');
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      setCompleted(true);
      oneeBridge.emit('quiz_complete', `“You scored ${score + (selectedOption === currentQ.correctIndex ? 1 : 0)} / ${questions.length}!”`);
    }
  };

  const handleRestart = () => {
    const fresh = getDynamicQuizQuestions(chapterId, mode, 5);
    setQuestions(fresh);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setStreak(0);
    setCompleted(false);
  };

  const handleRegenerate = () => {
    handleRestart();
  };

  return (
    <div className="w-full max-w-xl mx-auto p-4 sm:p-6 rounded-3xl bg-white border border-black/10 shadow-apple-md font-sans">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-black/5 pb-3 mb-4 flex-wrap gap-2">
        <div>
          <h3 className="text-base font-bold text-apple-text font-mono flex items-center gap-2">
            <span>Chapter Comprehension Quiz</span>
            <span className="text-[9px] bg-blue-100 text-apple-blue font-bold px-2 py-0.5 rounded-full uppercase">
              {mode.replace('_MODE', '')}
            </span>
          </h3>
          <p className="text-xs text-apple-secondary font-mono">
            Dynamic questions grounded in Vaswani et al. (2017)
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-apple-secondary hover:text-apple-text transition-all text-[11px]"
            title="Generate Fresh Questions"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>New Set</span>
          </button>
          <span className="text-apple-secondary">
            Score: <strong className="text-emerald-600 font-bold">{score}</strong> / {questions.length}
          </span>
          <span className="text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full font-bold shadow-apple-sm text-[11px]">
            🔥 {streak}
          </span>
        </div>
      </div>

      {!completed && currentQ ? (
        <div className="space-y-4">
          {/* Question Eyebrow & Title */}
          <div>
            <div className="flex items-center justify-between text-xs font-mono text-apple-secondary mb-1.5">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              <span className="text-apple-blue font-bold">{currentQ.concept}</span>
            </div>
            <div className="text-sm sm:text-base font-semibold text-apple-text leading-relaxed">
              <MarkdownRenderer content={currentQ.question} />
            </div>
          </div>

          {/* Options Grid */}
          <div className="space-y-2.5">
            {currentQ.options.map((option, idx) => {
              let btnStyle = 'bg-slate-50/80 border-black/10 hover:bg-slate-100 text-apple-text';
              if (isAnswered) {
                if (idx === currentQ.correctIndex) {
                  btnStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold shadow-apple-sm';
                } else if (idx === selectedOption) {
                  btnStyle = 'bg-rose-50 border-rose-300 text-rose-900 font-semibold';
                } else {
                  btnStyle = 'bg-slate-50/40 border-black/5 opacity-40 text-apple-tertiary';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectOption(idx)}
                  disabled={isAnswered}
                  className={`w-full text-left p-3.5 rounded-2xl border text-xs leading-relaxed transition-all flex items-start justify-between font-sans ${btnStyle}`}
                >
                  <div className="flex-1 pr-3">
                    <MarkdownRenderer content={option} />
                  </div>
                  {isAnswered && idx === currentQ.correctIndex && (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  )}
                  {isAnswered && idx === selectedOption && idx !== currentQ.correctIndex && (
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Explanation Banner */}
          <AnimatePresence>
            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 font-sans text-xs space-y-1 shadow-apple-sm"
              >
                <div className="font-bold text-apple-blue font-mono flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{selectedOption === currentQ.correctIndex ? 'Correct! 🎉' : 'Explanation:'}</span>
                </div>
                <div className="text-apple-secondary leading-relaxed">
                  <MarkdownRenderer content={currentQ.explanation} />
                </div>
                <div className="text-[10px] text-apple-blue font-mono pt-1 border-t border-blue-100">
                  Source: {currentQ.sourceContext}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {isAnswered && (
            <div className="flex justify-end pt-1">
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-apple-blue hover:bg-blue-600 text-white text-xs font-mono font-bold transition-all shadow-apple-md"
              >
                {currentIndex < questions.length - 1 ? 'Next Question →' : 'View Results →'}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Completion Results Screen */
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-6 space-y-4"
        >
          <div className="w-16 h-16 rounded-full bg-blue-100 border border-blue-200 flex items-center justify-center text-apple-blue mx-auto shadow-apple-md">
            <Trophy className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h4 className="text-lg font-bold text-apple-text font-mono">Quiz Completed!</h4>
            <p className="text-xs text-apple-secondary font-mono">
              You scored <strong className="text-apple-blue">{score}</strong> out of {questions.length} correct ({((score / questions.length) * 100).toFixed(0)}%)
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200/80 max-w-sm mx-auto text-xs font-sans text-apple-secondary leading-relaxed">
            {score === questions.length
              ? 'Outstanding! You have mastered the mathematical details and experimental findings of Attention Is All You Need.'
              : score >= 3
              ? 'Great performance! You have a solid grasp of the core Transformer architecture and attention equations.'
              : 'Good review session! Explore the chapter visuals and tap the prompt chips in Onee chat to strengthen your comprehension.'}
          </div>

          <div className="pt-2">
            <button
              onClick={handleRestart}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-apple-blue hover:bg-blue-600 text-white text-xs font-mono font-bold transition-all shadow-apple-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retry / New Question Set</span>
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Quiz;
