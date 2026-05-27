/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, X, Award, RefreshCw, ArrowRight, HelpCircle, AlertCircle } from 'lucide-react';
import { QuizQuestion } from '../types';

interface QuizSystemProps {
  quiz: QuizQuestion[];
}

export default function QuizSystem({ quiz }: QuizSystemProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [score, setScore] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState<Record<number, boolean>>({});

  if (!quiz || quiz.length === 0) {
    return (
      <div className="text-center p-8 text-neutral-500 font-sans" id="no-quiz">
        暫無模擬線上測驗項目
      </div>
    );
  }

  const currentQuestion = quiz[currentIndex];
  const totalQuestions = quiz.length;
  const isAnswered = selectedAnswers[currentIndex] !== undefined;
  const isSubmitted = submitted[currentIndex] === true;

  const handleSelectOption = (optionIndex: number) => {
    if (isSubmitted) return; // 已提交則鎖定選項
    setSelectedAnswers({
      ...selectedAnswers,
      [currentIndex]: optionIndex
    });
  };

  const handleSubmitAnswer = () => {
    if (!isAnswered || isSubmitted) return;
    
    const isCorrect = selectedAnswers[currentIndex] === currentQuestion.answerIndex;
    if (isCorrect) {
      setScore((prev) => prev + 1);
    }
    
    setSubmitted({
      ...submitted,
      [currentIndex]: true
    });
  };

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setShowResults(true);
    }
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setSelectedAnswers({});
    setScore(0);
    setShowResults(false);
    setSubmitted({});
  };

  // 取得得分級別評語
  const getFeedbackMessage = () => {
    const ratio = score / totalQuestions;
    if (ratio === 1) return { title: "卓越真學霸！考前滿分封神 👑", text: "天啊！你已經完全掌握教材的所有深度精華。這門課期末穩拿 A+ 了！" };
    if (ratio >= 0.8) return { title: "實力堅強！高分通過警戒 🚀", text: "表現得非常優秀！僅有些許細節死角，稍微瀏覽一下記憶卡即可上場殺敵！" };
    if (ratio >= 0.6) return { title: "安全過關！再接再厲 📚", text: "已達及格門檻，但建議利用下方的隨堂 AI 助教再深究你不熟悉的章節！" };
    return { title: "考前拉警報！急速重補修 ⚠️", text: "看起來這個概念還不太熟練喔。別擔心，立刻多讀幾次考前懶人包並與助教對話！" };
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-1" id="quiz-system">
      <AnimatePresence mode="wait">
        {!showResults ? (
          <motion.div
            key="quiz-card"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="bg-white border border-neutral-200 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.03)] p-6 md:p-8"
            id="quiz-active-card"
          >
            {/* 提問頂部 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-neutral-100 pb-5" id="quiz-header">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-indigo-50 border border-indigo-100/50 text-indigo-700 rounded-lg text-[11px] font-bold tracking-wider" id="quiz-badge">
                  ★ MOCK ONLINE QUIZ
                </span>
                <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-1 rounded font-bold">考前神精準預測</span>
              </div>
              <div className="flex items-center gap-3" id="quiz-pill-progress">
                <span className="text-[11px] text-neutral-400 font-mono font-medium">
                  QUESTION <span className="text-neutral-800 font-bold">{currentIndex + 1}</span> OF {totalQuestions}
                </span>
                <div className="w-24 bg-neutral-100 h-2 rounded-full overflow-hidden p-0.5 border border-neutral-200/40">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                  />
                </div>
              </div>
            </div>

            {/* 題目 Question */}
            <div className="mb-6 space-y-1.5" id="quiz-question-box">
              <span className="text-[10px] font-mono font-bold text-indigo-500 uppercase tracking-widest block">
                QUESTION INDEX: {String(currentIndex + 1).padStart(2, '0')}
              </span>
              <h3 className="text-lg md:text-xl font-display font-bold text-neutral-800 leading-snug">
                {currentQuestion.question}
              </h3>
            </div>

            {/* 選項 Options */}
            <div className="space-y-3 mb-6" id="quiz-options-list">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswers[currentIndex] === index;
                const isCorrectOption = index === currentQuestion.answerIndex;
                const showSuccess = isSubmitted && isCorrectOption;
                const showDanger = isSubmitted && isSelected && !isCorrectOption;

                let optionStyle = "border-neutral-200 bg-white hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700 shadow-sm";
                if (isSelected && !isSubmitted) {
                  optionStyle = "border-indigo-600 bg-indigo-50/40 text-indigo-900 ring-2 ring-indigo-600/15";
                } else if (showSuccess) {
                  optionStyle = "border-emerald-600 bg-emerald-50/40 text-emerald-950 font-semibold shadow-[0_4px_20px_rgba(16,185,129,0.06)]";
                } else if (showDanger) {
                  optionStyle = "border-rose-600 bg-rose-50/40 text-rose-950 shadow-[0_4px_20px_rgba(225,29,72,0.06)]";
                } else if (isSubmitted) {
                  optionStyle = "border-neutral-150/80 bg-neutral-50/50 text-neutral-500 opacity-60 cursor-not-allowed";
                }

                return (
                  <button
                    key={index}
                    onClick={() => handleSelectOption(index)}
                    disabled={isSubmitted}
                    className={`w-full text-left p-4 rounded-xl border transition-all flex items-center justify-between text-xs sm:text-sm cursor-pointer ${optionStyle}`}
                    id={`option-btn-${index}`}
                  >
                    <div className="flex items-start gap-3.5">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono text-xs font-bold shrink-0 shadow-sm transition-colors ${
                        isSelected && !isSubmitted ? 'bg-indigo-600 text-white' : 
                        showSuccess ? 'bg-emerald-600 text-white' :
                        showDanger ? 'bg-rose-600 text-white' : 'bg-neutral-100 text-neutral-600'
                      }`} id={`option-num-${index}`}>
                        {String.fromCharCode(65 + index)}
                      </span>
                      <span className="font-sans leading-relaxed pt-0.5">{option}</span>
                    </div>

                    {/* 回饋圖標 */}
                    <div className="shrink-0 pl-2">
                      {showSuccess && (
                        <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-800">
                          <Check size={12} className="stroke-[3]" />
                        </div>
                      )}
                      {showDanger && (
                        <div className="w-5 h-5 rounded-full bg-rose-100 flex items-center justify-center text-rose-800">
                          <X size={12} className="stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* AI 助教解析欄 */}
            {isSubmitted && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-amber-50/60 rounded-xl p-4.5 border border-amber-200/50 mb-6 text-xs text-neutral-700 leading-relaxed"
                id="quiz-explanation-box"
              >
                <div className="flex items-center gap-1.5 font-bold text-amber-900 mb-2" id="explan-title">
                  <AlertCircle size={14} className="text-amber-600 shrink-0" />
                  <span>助教深度解析（必背考點）：</span>
                </div>
                <p className="font-sans font-medium text-neutral-700 pl-5 whitespace-pre-line leading-relaxed" id="explan-text">
                  {currentQuestion.explanation}
                </p>
              </motion.div>
            )}

            {/* 互動操作按鈕 */}
            <div className="flex items-center justify-between border-t border-neutral-100 pt-5" id="quiz-action-bar">
              <div className="text-xs text-neutral-400 font-mono">
                {!isSubmitted && isAnswered && "⚡ 答案已選定，請點擊右方按鈕提交解答"}
                {isSubmitted && "✓ 解答已提交，可點擊右方進入下一關"}
              </div>
              
              {!isSubmitted ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!isAnswered}
                  className={`px-5 py-2.5 rounded-xl font-sans text-xs font-bold tracking-wider uppercase transition-all ${
                    isAnswered 
                      ? 'bg-neutral-950 text-white hover:bg-neutral-800 shadow-md hover:shadow-lg active:scale-95 cursor-pointer' 
                      : 'bg-neutral-100 text-neutral-400 cursor-not-allowed border border-neutral-200/40'
                  }`}
                  id="btn-quiz-submit"
                >
                  確認答案 SUBMIT
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 font-sans text-xs font-bold tracking-wider shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
                  id="btn-quiz-next"
                >
                  <span>{currentIndex < totalQuestions - 1 ? '下一題 NEXT' : '查看成績包 REPORT'}</span>
                  <ArrowRight size={14} className="stroke-[2.5]" />
                </button>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="quiz-results"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="bg-white border border-neutral-200 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.04)] p-8 text-center"
            id="quiz-result-score-card"
          >
            <div className="w-16 h-16 bg-amber-50 border border-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm" id="result-trophy">
              <Award size={32} className="stroke-[2.5]" />
            </div>
            
            <h2 className="text-2xl font-display font-extrabold text-neutral-900 mb-1" id="result-title">
              {getFeedbackMessage().title}
            </h2>
            <p className="text-xs md:text-sm text-neutral-400 font-sans max-w-md mx-auto mb-8" id="result-desc">
              {getFeedbackMessage().text}
            </p>

            {/* 得分版 */}
            <div className="bg-neutral-50/80 border border-neutral-200/60 rounded-3xl py-8 px-12 max-w-xs mx-auto mb-8 flex flex-col items-center justify-center relative overflow-hidden">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
              <span className="text-[10px] text-neutral-400 uppercase font-mono tracking-widest block mb-1">
                EXAM REPORT CARD
              </span>
              <div className="flex items-baseline" id="result-score-box">
                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-650 to-purple-650 font-display">{score}</span>
                <span className="text-3xl font-bold text-neutral-300 mx-1.5">/</span>
                <span className="text-3xl font-bold text-neutral-500 font-display">{totalQuestions}</span>
              </div>
              <span className="text-xs font-semibold text-neutral-600 mt-2 bg-neutral-200/50 px-3 py-1 rounded-full">
                答對率 {Math.round((score / totalQuestions) * 100)}%
              </span>
            </div>

            {/* 重新挑戰 */}
            <button
              onClick={handleReset}
              className="px-6 py-3 bg-neutral-950 text-white rounded-xl hover:bg-neutral-800 text-xs font-bold tracking-wider transition-all shadow-md active:scale-95 inline-flex items-center gap-2 cursor-pointer"
              id="btn-quiz-restart"
            >
              <RefreshCw size={13} className="text-indigo-400" />
              RESTART 重新挑戰
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
