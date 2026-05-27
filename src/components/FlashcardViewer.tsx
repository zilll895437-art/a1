/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, RotateCw, HelpCircle, CheckCircle } from 'lucide-react';
import { Flashcard } from '../types';

interface FlashcardViewerProps {
  cards: Flashcard[];
}

export default function FlashcardViewer({ cards }: FlashcardViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

  if (!cards || cards.length === 0) {
    return (
      <div className="text-center p-8 text-neutral-500 font-sans" id="no-cards">
        暫無名詞記憶卡
      </div>
    );
  }

  const currentCard = cards[currentIndex];

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % cards.length);
    }, 150);
  };

  const handlePrev = () => {
    setIsFlipped(false);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + cards.length) % cards.length);
    }, 150);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div className="flex flex-col items-center justify-center p-2 md:p-4 w-full max-w-xl mx-auto" id="flashcard-container">
      {/* 頂部進度條與提示 */}
      <div className="w-full mb-6 space-y-3">
        <div className="flex justify-between items-center w-full text-xs font-mono text-neutral-500 px-1">
          <span className="bg-neutral-100 text-neutral-700 px-2.5 py-1 rounded-full font-semibold" id="flashcard-progress">
            PROGRESS: <span className="text-indigo-600 font-bold">{currentIndex + 1}</span> / {cards.length}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-neutral-400 font-sans" id="flashcard-tip">
            <HelpCircle size={13} className="text-amber-500 animate-pulse" />
            點擊卡片或空白處可翻轉
          </span>
        </div>
        
        {/* 精緻微網格進度刻度 */}
        <div className="h-1.5 w-full bg-neutral-100 rounded-full overflow-hidden flex gap-0.5 p-0.5">
          {cards.map((_, i) => (
            <div 
              key={i} 
              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                i <= currentIndex ? 'bg-gradient-to-r from-indigo-500 to-purple-500' : 'bg-neutral-200/50'
              }`}
            />
          ))}
        </div>
      </div>

      {/* 3D 翻轉卡片 */}
      <div 
        className="w-full h-72 md:h-80 cursor-pointer perspective-1000 mb-8" 
        onClick={handleFlip}
        id="flashcard-flip-wrapper"
      >
        <motion.div 
          className="relative w-full h-full duration-500 transform-style-3d select-none"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 120, damping: 16 }}
          id="flashcard-inner"
        >
          {/* 正面：名詞 Term */}
          <div className="absolute inset-0 w-full h-full rounded-2xl bg-white border border-neutral-200 shadow-[0_12px_30px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_35px_rgba(79,70,229,0.08)] transition-all flex flex-col justify-between p-7 backface-hidden">
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 text-[10px] uppercase tracking-wider font-mono bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-lg font-bold" id="card-label-front">
                ★ TERM • 學霸必背
              </span>
              <div className="w-8 h-8 rounded-full bg-neutral-50 flex items-center justify-center text-neutral-400 hover:text-indigo-600 transition-colors">
                <RotateCw size={14} className="animate-spin-slow" />
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
              <span className="text-[10px] text-neutral-400 font-mono tracking-widest block mb-1">KEY CONCEPT</span>
              <h3 className="text-2xl md:text-3xl font-display font-bold tracking-tight text-neutral-800 leading-snug" id="card-term">
                {currentCard.term}
              </h3>
            </div>
            
            <div className="text-center text-[11px] font-sans text-neutral-400 border-t border-neutral-100/80 pt-3 flex items-center justify-center gap-1.5" id="card-action-front">
              <span className="inline-block w-1.5 h-1.5 bg-indigo-500 rounded-full animate-ping" />
              點擊查看名詞深度定義與應用
            </div>
          </div>

          {/* 反面：釋義 Definition (翻轉 180 度) */}
          <div className="absolute inset-0 w-full h-full rounded-2xl bg-neutral-900 border border-neutral-850 text-white shadow-2xl flex flex-col justify-between p-7 backface-hidden rotate-y-180">
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 text-[10px] uppercase tracking-wider font-mono bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg font-bold" id="card-label-back">
                ✔ DEFINITION • 精準精粹
              </span>
              <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400">
                <CheckCircle size={14} className="text-emerald-400" />
              </div>
            </div>
            
            <div className="flex-1 flex flex-col items-center justify-center px-4 overflow-y-auto">
              <span className="text-[10px] text-neutral-550 font-mono tracking-widest block mb-2">SCHOLAR EXPLANATION</span>
              <p className="text-sm md:text-base font-sans text-neutral-200 text-center leading-relaxed font-medium" id="card-definition">
                {currentCard.definition}
              </p>
            </div>
            
            <div className="text-center text-[10px] font-mono text-neutral-500 border-t border-neutral-800/80 pt-3" id="card-action-back">
              PRESS SPACE OR CLICK TO TURN BACK
            </div>
          </div>
        </motion.div>
      </div>

      {/* 控制按鈕堆疊 */}
      <div className="flex items-center gap-4" id="flashcard-controls">
        <button
          onClick={(e) => { e.stopPropagation(); handlePrev(); }}
          className="p-3.5 rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:text-indigo-600 hover:border-indigo-300 active:scale-95 shadow-sm transition-all text-sm shrink-0"
          id="btn-card-prev"
          title="上一張"
        >
          <ChevronLeft size={18} className="stroke-[2.5]" />
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); handleFlip(); }}
          className="px-6 py-3 rounded-xl bg-neutral-900 text-white hover:bg-neutral-800 font-sans text-xs font-bold shadow-md hover:shadow-lg active:scale-95 transition-all flex items-center gap-2 tracking-wider"
          id="btn-card-flip"
        >
          <RotateCw size={13} className="text-indigo-400" />
          FLIP CARD 翻轉
        </button>

        <button
          onClick={(e) => { e.stopPropagation(); handleNext(); }}
          className="p-3.5 rounded-xl bg-white border border-neutral-200 text-neutral-700 hover:text-indigo-600 hover:border-indigo-300 active:scale-95 shadow-sm transition-all text-sm shrink-0"
          id="btn-card-next"
          title="下一張"
        >
          <ChevronRight size={18} className="stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
}
