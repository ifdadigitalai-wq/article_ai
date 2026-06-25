"use client";

import React, { useState, useEffect } from "react";
import { Brain, X, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw, Trophy } from "lucide-react";
import confetti from "canvas-confetti";

interface Question {
  question: string;
  options: string[];
  answer: number;
}

interface QuizData {
  id: string;
  articleId: string;
  questions: Question[];
}

interface QuizModalProps {
  articleId: string;
  articleContent: string;
  onClose: () => void;
}

export default function QuizModal({ articleId, articleContent, onClose }: QuizModalProps) {
  const [quiz, setQuiz] = useState<QuizData | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [results, setResults] = useState<{
    score: number;
    totalQuestions: number;
    correctAnswers: number[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateQuiz();
  }, [articleId]);

  const generateQuiz = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId, articleContent }),
      });

      if (!res.ok) {
        throw new Error("Failed to load or generate quiz questions");
      }

      const data = await res.json();
      setQuiz(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectOption = (optIdx: number) => {
    const updated = [...selectedAnswers];
    updated[currentIdx] = optIdx;
    setSelectedAnswers(updated);
  };

  const handleNext = () => {
    if (currentIdx < 4) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmit = async () => {
    if (!quiz || selectedAnswers.length < 5 || selectedAnswers.includes(undefined as any)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quizId: quiz.id, answers: selectedAnswers }),
      });

      if (!res.ok) {
        throw new Error("Failed to submit answers");
      }

      const data = await res.json();
      setResults(data);

      // Trigger confetti on good score (e.g. 4 or 5)
      if (data.score >= 4) {
        triggerConfetti();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerConfetti = () => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentIdx];
  const hasSelected = selectedAnswers[currentIdx] !== undefined;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Brain className="w-5 h-5" />
            <span className="font-bold text-slate-900 dark:text-slate-100 text-sm tracking-wide uppercase">
              Comprehension Checkup
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-4">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500" />
              <div className="text-center space-y-1">
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  Generating AI Quiz...
                </span>
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Formulating 5 comprehension multiple-choice questions based on this article.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-xl flex items-start gap-3 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="space-y-1 text-sm">
                <p className="font-semibold">Generation Failed</p>
                <p>{error}</p>
                <button
                  onClick={generateQuiz}
                  className="text-xs underline font-bold mt-1 text-rose-700 dark:text-rose-400 cursor-pointer"
                >
                  Try Again
                </button>
              </div>
            </div>
          )}

          {!isLoading && !error && quiz && !results && (
            <div className="space-y-6">
              {/* Progress Tracker */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                  <span>Question {currentIdx + 1} of 5</span>
                  <span>{Math.round(((currentIdx + 1) / 5) * 100)}% Complete</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-300"
                    style={{ width: `${((currentIdx + 1) / 5) * 100}%` }}
                  />
                </div>
              </div>

              {/* Question card */}
              <div className="space-y-4">
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  {currentQuestion.question}
                </h3>

                <div className="grid grid-cols-1 gap-2.5">
                  {currentQuestion.options.map((option, optIdx) => {
                    const isSelected = selectedAnswers[currentIdx] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleSelectOption(optIdx)}
                        className={`w-full text-left p-4 rounded-xl border text-sm font-medium transition-all cursor-pointer ${
                          isSelected
                            ? "border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 ring-2 ring-indigo-500/10"
                            : "border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                        }`}
                      >
                        <span className="inline-block w-5 h-5 rounded-full border text-center leading-4 text-xs font-semibold mr-3 shrink-0 uppercase">
                          {String.fromCharCode(97 + optIdx)}
                        </span>
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Results screen */}
          {results && (
            <div className="space-y-6">
              <div className="p-6 bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 rounded-2xl flex flex-col items-center justify-center text-center space-y-3">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/40 rounded-full text-indigo-600 dark:text-indigo-400">
                  <Trophy className="w-10 h-10 animate-bounce" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white">Quiz Finished!</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    You answered {results.score} out of {results.totalQuestions} questions correctly.
                  </p>
                </div>
                <div className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
                  {Math.round((results.score / results.totalQuestions) * 100)}%
                </div>
              </div>

              {/* Review answers with animations */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                  Review Answers
                </h4>

                <div className="space-y-4">
                  {questions.map((q, qIdx) => {
                    const userAns = selectedAnswers[qIdx];
                    const correctAns = results.correctAnswers[qIdx];
                    const isCorrect = userAns === correctAns;

                    return (
                      <div
                        key={qIdx}
                        className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl space-y-3"
                      >
                        <h5 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                          {qIdx + 1}. {q.question}
                        </h5>

                        <div className="grid grid-cols-1 gap-2">
                          {q.options.map((option, optIdx) => {
                            const isUserSelected = userAns === optIdx;
                            const isOptionCorrect = correctAns === optIdx;

                            let optionStyles = "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900";
                            if (isOptionCorrect) {
                              optionStyles = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-semibold";
                            } else if (isUserSelected && !isCorrect) {
                              optionStyles = "border-rose-500 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 font-semibold";
                            }

                            return (
                              <div
                                key={optIdx}
                                className={`px-4 py-2.5 rounded-xl border text-xs flex items-center justify-between ${optionStyles}`}
                              >
                                <span>{option}</span>
                                {isOptionCorrect && <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400">Correct Choice</span>}
                                {isUserSelected && !isCorrect && <span className="text-[10px] uppercase font-bold text-rose-600 dark:text-rose-455">Your Selection</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-950/20 flex justify-between items-center">
          {!results ? (
            <>
              <button
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="px-4 py-2 text-xs font-semibold text-slate-550 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Previous
              </button>

              <div className="flex gap-2">
                {currentIdx < 4 ? (
                  <button
                    onClick={handleNext}
                    disabled={!hasSelected}
                    className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    <span>Next Question</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting || selectedAnswers.length < 5 || selectedAnswers.includes(undefined as any)}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5 uppercase tracking-wide shadow-sm"
                  >
                    {isSubmitting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>Submit Answers</span>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-2.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl cursor-pointer transition-colors text-center"
            >
              Close and Continue
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
