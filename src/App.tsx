/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  UploadCloud, 
  FileAudio, 
  FileText, 
  Youtube, 
  Globe,
  Sparkles, 
  BookOpen, 
  Award, 
  HelpCircle, 
  Brain, 
  RefreshCw, 
  ArrowLeft, 
  CheckCircle, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Sliders,
  GraduationCap,
  Printer,
  X
} from 'lucide-react';
import { StudyMaterialType, StudyProcessResult } from './types';
import FlashcardViewer from './components/FlashcardViewer';
import QuizSystem from './components/QuizSystem';
import TutorChat from './components/TutorChat';
import { SAMPLE_STUDY_PACK } from './data';

// 學霸教材摘要 Markdown 渲染器（專為台灣繁體排版優化）
function renderSummaryMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-4 text-sm leading-relaxed text-neutral-800 font-sans" id="summary-md-renderer">
      {lines.map((line, idx) => {
        // 處理 H1, H2, H3 等級
        if (line.startsWith('### ')) {
          return <h4 key={idx} className="text-base font-bold text-neutral-900 mt-5 mb-2 font-display border-b border-neutral-100 pb-1 flex items-center gap-1.5" id={`sum-h3-${idx}`}><span className="w-1.5 h-4 bg-indigo-600 rounded" />{line.replace('### ', '')}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={idx} className="text-lg font-bold text-neutral-900 mt-6 mb-3 font-display flex items-center gap-2" id={`sum-h2-${idx}`}><span className="w-1.5 h-5 bg-indigo-600 rounded" />{line.replace('## ', '')}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={idx} className="text-xl font-bold text-neutral-900 mt-6 mb-3 font-display" id={`sum-h1-${idx}`}>{line.replace('# ', '')}</h2>;
        }

        // 處理無序列表
        if (line.startsWith('* ') || line.startsWith('- ')) {
          const content = line.substring(2);
          return (
            <ul key={idx} className="list-disc list-inside ml-4 text-neutral-700 space-y-1" id={`sum-ul-${idx}`}>
              <li id={`sum-li-${idx}`}>{parseBold(content)}</li>
            </ul>
          );
        }

        // 處理有序列表
        const orderMatch = line.match(/^(\d+)\.\s(.*)/);
        if (orderMatch) {
          return (
            <ol key={idx} className="list-decimal list-inside ml-4 text-neutral-700 space-y-1" id={`sum-ol-${idx}`}>
              <li id={`sum-oli-${idx}`}>{parseBold(orderMatch[2])}</li>
            </ol>
          );
        }

        // 處理引用塊
        if (line.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-4 border-indigo-500 bg-indigo-50/50 pl-4 py-2 text-xs italic text-neutral-600 rounded-r my-2" id={`sum-q-${idx}`}>
              {line.replace('> ', '')}
            </blockquote>
          );
        }

        // 處理空白行
        if (line.trim() === '') {
          return <div key={idx} className="h-1" id={`sum-br-${idx}`} />;
        }

        // 一般段落
        return <p key={idx} className="leading-relaxed text-neutral-700" id={`sum-p-${idx}`}>{parseBold(line)}</p>;
      })}
    </div>
  );
}

function parseBold(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  if (parts.length <= 1) return text;
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-semibold text-neutral-900">{part}</strong> : part);
}

export default function App() {
  // 輸入狀態
  const [activeTab, setActiveTab] = useState<StudyMaterialType>('audio');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [rawText, setRawText] = useState('');
  const [focusTheme, setFocusTheme] = useState('');
  const [fileObject, setFileObject] = useState<{ name: string; data: string; mimeType: string } | null>(null);
  
  // UI 控制狀態
  const [loading, setLoading] = useState(false);
  const [loadingTipIndex, setLoadingTipIndex] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  
  // 分析結果與檢視控制
  const [studyPack, setStudyPack] = useState<StudyProcessResult | null>(null);
  const [dashboardTab, setDashboardTab] = useState<'summary' | 'takeaways' | 'lazybag' | 'flashcards' | 'quiz' | 'chat'>('summary');
  const [activeLazyBagIndex, setActiveLazyBagIndex] = useState<number | null>(null);

  // PDF 列印與報告匯出狀態
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printOptions, setPrintOptions] = useState({
    includeSummary: true,
    includeTakeaways: true,
    includeLazyBag: true,
    includeFlashcards: true,
    includeQuiz: true,
  });

  // AI 智慧優化 PDF 狀態與客製指令
  const [isOptimizingPdf, setIsOptimizingPdf] = useState(false);
  const [aiPdfCommand, setAiPdfCommand] = useState('');
  const [aiPdfPreset, setAiPdfPreset] = useState<'academic' | 'condensed' | 'examTips' | 'bilingual' | 'none'>('none');
  const [pdfOptimizeError, setPdfOptimizeError] = useState<string | null>(null);
  const [pdfOptimizeSuccess, setPdfOptimizeSuccess] = useState<string | null>(null);
  const [pdfModalTab, setPdfModalTab] = useState<'setup' | 'aiOptimizer'>('setup');

  // loading 時播放幽默學霸小貼士
  const loadingTips = [
    "🎓 助教正在努力翻閱讀書中，大約需要 15~30 秒，趁現在活動一下脖子吧！",
    "⚡️ 學霸提示：名詞複習卡支援雙面翻轉，背誦專有名詞對於簡答題大有神助！",
    "🎧 錄音多模態分析器正在逐字語音辨識與切碎段落，務求還原課堂精華...",
    "📄 正由 Gemini 閱讀並理解這份講義的圖表與脈絡，即將為您建構考前必考選擇題！",
    "🔬 正在把您提供的 YouTube 內容，在網路上搜尋對應的大綱架構做深度交叉比對...",
    "📖 AI 已經為你規劃好「考前衝刺懶人包」模擬考題，祝你這次期末直接拿下 A+！"
  ];

  // Loading tips 定時更換
  React.useEffect(() => {
    let timer: any;
    if (loading) {
      timer = setInterval(() => {
        setLoadingTipIndex((prev) => (prev + 1) % loadingTips.length);
      }, 5000);
    } else {
      setLoadingTipIndex(0);
    }
    return () => clearInterval(timer);
  }, [loading]);
  
  // AI 智慧優化 PDF 本體與欄位資料
  const handleOptimizePdfContent = async () => {
    if (!studyPack) return;
    setIsOptimizingPdf(true);
    setPdfOptimizeError(null);
    setPdfOptimizeSuccess(null);
    try {
      const response = await fetch('/api/study/optimize-pdf-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studyPack,
          command: aiPdfCommand,
          presetType: aiPdfPreset
        })
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "AI 智慧重編重組失敗，請檢查網路或金鑰狀態");
      }
      setStudyPack(data.result);
      setPdfOptimizeSuccess("✨ AI 已成功重塑並深度整理講義 PDF！所有單元已同步更新。");
      setAiPdfCommand('');
      setAiPdfPreset('none');
    } catch (e: any) {
      console.error(e);
      setPdfOptimizeError(e.message || "連線逾時或後端處理錯誤");
    } finally {
      setIsOptimizingPdf(false);
    }
  };

  const downloadOfflineHTML = () => {
    if (!studyPack) return;

    const formatSummaryToHtml = (summaryText: string) => {
      return summaryText.split('\n').map((line) => {
        const trimmed = line.trim();
        if (trimmed.startsWith('### ')) {
          return `<h4 style="font-size: 14px; font-weight: 700; margin-top: 18px; margin-bottom: 8px; color: #1e1b4b;">${trimmed.substring(4)}</h4>`;
        }
        if (trimmed.startsWith('## ')) {
          return `<h3 style="font-size: 16px; font-weight: 700; margin-top: 24px; margin-bottom: 12px; color: #1e1b4b;">${trimmed.substring(3)}</h3>`;
        }
        if (trimmed.startsWith('# ')) {
          return `<h2 style="font-size: 20px; font-weight: 700; margin-top: 28px; margin-bottom: 16px; color: #111;">${trimmed.substring(2)}</h2>`;
        }
        if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
          const content = trimmed.substring(2).replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
          return `<ul style="list-style-type: disc; padding-left: 20px; margin: 4px 0;"><li style="font-size: 12.5px; color: #374151;">${content}</li></ul>`;
        }
        const orderMatch = trimmed.match(/^(\d+)\.\s(.*)/);
        if (orderMatch) {
          const content = orderMatch[2].replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
          return `<ol start="${orderMatch[1]}" style="padding-left: 20px; margin: 4px 0;"><li style="font-size: 12.5px; color: #374151;">${content}</li></ol>`;
        }
        if (trimmed.startsWith('> ')) {
          return `<blockquote style="border-left: 4px solid #818cf8; background-color: #f5f3ff; padding: 10px 16px; margin: 12px 0; font-size: 12px; font-style: italic; color: #4b5563; border-radius: 0 8px 8px 0;">${trimmed.substring(2)}</blockquote>`;
        }
        if (trimmed === '') return `<div style="height: 6px;"></div>`;
        const boldified = trimmed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        return `<p style="font-size: 12.5px; line-height: 1.7; color: #374151; margin: 8px 0;">${boldified}</p>`;
      }).join('\n');
    };

    let bodyHtml = "";

    bodyHtml += `
      <header>
        <div>
          <h1 style="font-size: 24px; font-weight: 850; letter-spacing: -0.5px; margin: 0 0 6px 0; color: #111827;">智慧課堂複習特訓 ➔ A+ 精華衝刺讀書包</h1>
          <div class="meta-tag" style="font-size: 11px; color: #4b5563; font-weight: 500;">Smart Study Specialist V2.5 PRO • 100% 離線免連網學習單 (雙重 PDF 支援)</div>
        </div>
        <div style="text-align: right; font-size: 10px; font-family: monospace; color: #888;">
          <div>導出時間：${new Date().toISOString().split('T')[0]}</div>
          <div>技術生成：Gemini 智慧核心</div>
        </div>
      </header>

      <div class="chapter-card" style="background: #fafafa; border: 1px solid #f3f4f6; padding: 24px; border-radius: 18px; margin-bottom: 36px;">
        <span style="font-size: 9px; text-transform: uppercase; font-weight: 700; color: #4f46e5; letter-spacing: 1.5px; display: block; margin-bottom: 2px;">原始教材主題</span>
        <h2 style="font-size: 18px; margin: 0 0 8px 0; color: #111827;">${studyPack.title}</h2>
        <div style="font-size: 11px; color: #6b7280; line-height: 1.5; margin-top: 4px;">
          本讀書包內建「學霸大綱、命題關鍵詳解、考前速背 Q&A、隨身背誦單字卡與期末全真模擬考卷」。已為列印進行最高規格排版優化。
        </div>
      </div>
    `;

    if (printOptions.includeSummary && studyPack.summary) {
      bodyHtml += `
        <div class="section">
          <div class="section-title" style="font-size: 15px; font-weight: 800; color: #111827; border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 24px; display: flex; align-items: center; gap: 10px;">
            <span class="bullet" style="width: 6px; height: 18px; background: #4f46e5; border-radius: 3px; display: inline-block;"></span>
            第一單元：課堂教材大綱與深度複習摘要
          </div>
          <div class="summary-content">
            ${formatSummaryToHtml(studyPack.summary)}
          </div>
        </div>
      `;
    }

    if (printOptions.includeTakeaways && studyPack.keyTakeaways && studyPack.keyTakeaways.length > 0) {
      bodyHtml += `
        <div class="section" style="page-break-before: always;">
          <div class="section-title" style="font-size: 15px; font-weight: 800; color: #111827; border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 24px; display: flex; align-items: center; gap: 10px;">
            <span class="bullet" style="width: 6px; height: 18px; background: #059669; border-radius: 3px; display: inline-block;"></span>
            第二單元：學霸核心必考命題關鍵重點詳解
          </div>
          <div class="grid" style="display: flex; flex-direction: column; gap: 16px;">
            ${studyPack.keyTakeaways.map((item, idx) => `
              <div class="card" style="border-left: 4px solid #059669; padding: 18px; border-radius: 14px; border: 1px solid #e5e7eb; background: #fff;">
                <div class="card-label" style="font-size: 10px; font-weight: 700; color: #9cb3c9; font-family: monospace; letter-spacing: 1px;">POINT ${String(idx + 1).padStart(2, '0')}</div>
                <div class="card-title" style="font-weight:700; margin-top:4px; font-size:13.5px;">${item.topic}</div>
                <div class="card-body" style="font-size: 12px; color: #4b5563; line-height: 1.6;">${item.detail}</div>
              </div>
            `).join('\n')}
          </div>
        </div>
      `;
    }

    if (printOptions.includeLazyBag && studyPack.lazyBag && studyPack.lazyBag.length > 0) {
      bodyHtml += `
        <div class="section" style="page-break-before: always;">
          <div class="section-title" style="font-size: 15px; font-weight: 800; color: #111827; border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 24px; display: flex; align-items: center; gap: 10px;">
            <span class="bullet" style="width: 6px; height: 18px; background: #d97706; border-radius: 3px; display: inline-block;"></span>
            第三單元：考前極速大衝刺——高分簡答與問答題庫
          </div>
          <div class="grid" style="display: flex; flex-direction: column; gap: 16px;">
            ${studyPack.lazyBag.map((item, idx) => `
              <div class="card" style="border-left: 4px solid #d97706; background-color: #fffbeb; padding: 18px; border-radius: 12px; border: 1px solid #fef3c7;">
                <div class="card-title" style="color: #b45309; font-size: 13.5px; font-weight:700;">問、${item.question}</div>
                <div class="card-body" style="color: #1f2937; margin-top: 6px; font-size: 12px; font-weight: 500;">
                  <strong>學霸高分答題思路：</strong><br/>
                  ${item.answer}
                </div>
              </div>
            `).join('\n')}
          </div>
        </div>
      `;
    }

    if (printOptions.includeFlashcards && studyPack.flashcards && studyPack.flashcards.length > 0) {
      bodyHtml += `
        <div class="section" style="page-break-before: always;">
          <div class="section-title" style="font-size: 15px; font-weight: 800; color: #111827; border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 24px; display: flex; align-items: center; gap: 10px;">
            <span class="bullet" style="width: 6px; height: 18px; background: #2563eb; border-radius: 3px; display: inline-block;"></span>
            第四單元：必背名詞及核心定義雙欄表（攜帶卡）
          </div>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 20px;">
            <p style="font-size: 11px; color: #6b7280; margin-bottom: 12px; margin-top:0;">★ 自助檢測：您可以將白話解釋那一欄進行摺疊遮蓋，試著看到專有名詞快速默背並主動回想，強化長期記憶！</p>
            <div>
              ${studyPack.flashcards.map((card) => `
                <div class="flashcard-row" style="display: flex; border-bottom: 1px dashed #e5e7eb; padding: 14px 0; align-items: flex-start;">
                  <div class="flashcard-term" style="width: 200px; font-weight: 700; font-size: 12.5px; color: #111827; padding-right: 16px; flex-shrink: 0;">📌 ${card.term}</div>
                  <div class="flashcard-desc" style="flex: 1; font-size: 12px; color: #4b5563; line-height: 1.5;">${card.definition}</div>
                </div>
              `).join('\n')}
            </div>
          </div>
        </div>
      `;
    }

    if (printOptions.includeQuiz && studyPack.quiz && studyPack.quiz.length > 0) {
      bodyHtml += `
        <div class="section" style="page-break-before: always;">
          <div class="section-title" style="font-size: 15px; font-weight: 800; color: #111827; border-bottom: 2px solid #111827; padding-bottom: 10px; margin-bottom: 24px; display: flex; align-items: center; gap: 10px;">
            <span class="bullet" style="width: 6px; height: 18px; background: #dc2626; border-radius: 3px; display: inline-block;"></span>
            第五單元：全真期末與段考模擬考卷（附標準解答）
          </div>
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 24px; margin-bottom: 24px;">
            <h3 style="font-size: 14px; font-weight: 700; margin-top: 0; margin-bottom: 12px; color: #111; text-align: center; border-bottom: 2px dashed #e5e7eb; padding-bottom: 8px;">📖 模擬考卷：單選命題卷</h3>
            ${studyPack.quiz.map((item, idx) => `
              <div class="quiz-item" style="border-bottom: 1px solid #f3f4f6; padding-bottom: 18px; margin-bottom: 18px;">
                <div style="font-weight: 700; font-size: 12.5px; color: #111; margin-bottom: 8px;">
                  第 ${idx + 1} 題. ${item.question}
                </div>
                <div style="padding-left: 12px;">
                  ${item.options.map((opt, oIdx) => `
                    <div class="option" style="margin: 8px 0; font-size: 12.5px; color: #374151; display: flex; align-items: center;">
                      <span style="display: inline-block; width: 18px; height: 18px; line-height: 18px; border: 1px solid #ccc; border-radius: 50%; text-align: center; font-size: 10px; margin-right: 8px; flex-shrink:0;">${['A', 'B', 'C', 'D'][oIdx]}</span>
                      <span>${opt}</span>
                    </div>
                  `).join('\n')}
                </div>
              </div>
            `).join('\n')}
          </div>

          <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 16px; padding: 24px; page-break-before: always; margin-top: 24px;">
            <h3 style="font-size: 14px; font-weight: 700; margin-top: 0; margin-bottom: 12px; color: #991b1b; text-align: center; border-bottom: 2px dashed #fca5a5; padding-bottom: 8px;">🔑 官方解答與名師詳解卷</h3>
            ${studyPack.quiz.map((item, idx) => `
              <div class="quiz-item" style="border-bottom: 1px dashed #fca5a5; padding-bottom: 14px; margin-bottom: 14px;">
                <div style="font-weight: 700; font-size: 12.5px; color: #991b1b;">
                  第 ${idx + 1} 題：參考答案【${['A', 'B', 'C', 'D'][item.answerIndex]}】
                </div>
                <p style="font-size: 11px; color: #4b5563; margin: 4px 0 0 0;">
                  原題：${item.question}
                </p>
                <div class="explanation" style="background: #fff; border-left: 4px solid #f87171; padding: 12px; border-radius: 0 10px 10px 0; margin-top: 10px; font-size: 11.5px; color: #7f1d1d; line-height: 1.6;">
                  <strong>老師剖析詳解：</strong>${item.explanation}
                </div>
              </div>
            `).join('\n')}
          </div>
        </div>
      `;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${studyPack.title} - A+ 精華衝刺讀書包</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: "Inter", system-ui, -apple-system, sans-serif;
      color: #111827;
      background-color: #f9fafb;
      margin: 0;
      padding: 60px 20px;
    }
    .wrapper {
      max-width: 800px;
      margin: 0 auto;
      background: white;
      padding: 50px;
      border-radius: 24px;
      box-shadow: 0 4px 30px rgba(0,0,0,0.02);
      border: 1px solid #f3f4f6;
    }
    header {
      border-bottom: 4px solid #111827;
      padding-bottom: 24px;
      margin-bottom: 36px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    h1 {
      font-size: 20px;
      font-weight: 800;
      margin: 0 0 6px 0;
      color: #111827;
      letter-spacing: -0.5px;
    }
    .meta-tag {
      font-size: 11px;
      color: #4b5563;
      font-weight: 500;
    }
    .chapter-card {
      background: #fafafa;
      border: 1px solid #f3f4f6;
      padding: 24px;
      border-radius: 18px;
      margin-bottom: 36px;
    }
    .chapter-card h2 {
      font-size: 16px;
      margin: 0 0 8px 0;
      color: #111827;
    }
    .section {
      margin-bottom: 44px;
    }
    .section-title {
      font-size: 14px;
      font-weight: 800;
      color: #111827;
      border-bottom: 2px solid #111827;
      padding-bottom: 10px;
      margin-bottom: 24px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .bullet {
      width: 6px;
      height: 18px;
      background: #4f46e5;
      border-radius: 3px;
      display: inline-block;
    }
    .summary-content {
      line-height: 1.8;
      font-size: 13px;
      color: #374151;
    }
    .grid {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .card {
      border: 1px solid #e5e7eb;
      padding: 18px;
      border-radius: 14px;
      background: #fdfdfd;
    }
    .card-label {
      font-size: 10px;
      font-weight: 700;
      color: #9cb3c9;
      font-family: monospace;
      letter-spacing: 1px;
    }
    .card-title {
      font-size: 13.5px;
      font-weight: 700;
      margin: 6px 0 10px 0;
      color: #111827;
    }
    .card-body {
      font-size: 12px;
      color: #4b5563;
      line-height: 1.6;
    }
    .print-btn {
      position: fixed;
      top: 24px;
      right: 24px;
      background: #111827;
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 50px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.2s ease;
      z-index: 1000;
    }
    .print-btn:hover {
      background: #4f46e5;
      transform: translateY(-2px);
    }
    @media print {
      body {
        background: white;
        padding: 0;
      }
      .wrapper {
        border: none;
        box-shadow: none;
        padding: 0;
        max-width: 100%;
      }
      .print-btn {
        display: none;
      }
      .card {
        page-break-inside: avoid;
      }
      .quiz-item {
        page-break-inside: avoid;
      }
      .section {
        page-break-inside: auto;
      }
    }
  </style>
</head>
<body>
  <button class="print-btn" onclick="window.print()">
    🖨️ 立即列印或儲存為 PDF (100% 穩定無阻擋)
  </button>
  <div class="wrapper">
    ${bodyHtml}
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${studyPack.title.split(' ')[0] || "學習大綱"}_A+考前智慧讀書包.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadMarkdownNotes = () => {
    if (!studyPack) return;
    
    let md = `# 🎓 ${studyPack.title}\n\n`;
    md += `*智慧考前急速衝刺讀書包 - 生成時間: ${new Date().toISOString().split('T')[0]}\n`;
    md += `*支援 100% 離線與 Markdown 閱讀（可用於 Obsidian, Notion, Logseq 等工具中）*\n\n---\n\n`;
    
    if (printOptions.includeSummary && studyPack.summary) {
      md += `## 📘 第一單元：課堂教材大綱與精華摘要\n\n`;
      md += `${studyPack.summary}\n\n---\n\n`;
    }
    
    if (printOptions.includeTakeaways && studyPack.keyTakeaways && studyPack.keyTakeaways.length > 0) {
      md += `## 🟢 第二單元：學霸核心關鍵必考重點詳解\n\n`;
      studyPack.keyTakeaways.forEach((item, idx) => {
        md += `### POINT ${String(idx + 1).padStart(2, '0')}: ${item.topic}\n`;
        md += `> ${item.detail}\n\n`;
      });
      md += `---\n\n`;
    }
    
    if (printOptions.includeLazyBag && studyPack.lazyBag && studyPack.lazyBag.length > 0) {
      md += `## 🟡 第三單元：考前大衝刺——對策申論問答題庫\n\n`;
      studyPack.lazyBag.forEach((item, idx) => {
        md += `#### Q${idx + 1}：${item.question}\n`;
        md += `**高分完美答題思路：**\n${item.answer}\n\n`;
      });
      md += `---\n\n`;
    }
    
    if (printOptions.includeFlashcards && studyPack.flashcards && studyPack.flashcards.length > 0) {
      md += `## 🔵 第四單元：必背名詞及核心定義表\n\n`;
      md += `| 📌 專有名詞 / 術語 / 公理 | 📖 學術定義與白話速記 |\n`;
      md += `| :--- | :--- |\n`;
      studyPack.flashcards.forEach((card) => {
        md += `| **${card.term}** | ${card.definition} |\n`;
      });
      md += `\n\n---\n\n`;
    }
    
    if (printOptions.includeQuiz && studyPack.quiz && studyPack.quiz.length > 0) {
      md += `## 🔴 第五單元：全真期末模擬命題與名師解答詳解\n\n`;
      md += `### 📄 模擬命題試卷\n\n`;
      studyPack.quiz.forEach((item, idx) => {
        md += `**Q${idx + 1}. ${item.question}**\n`;
        item.options.forEach((opt, oIdx) => {
          md += `- [ ] ${['A', 'B', 'C', 'D'][oIdx]} ${opt}\n`;
        });
        md += `\n`;
      });
      
      md += `\n### 🔑 答案與老師詳解與思路指引\n\n`;
      studyPack.quiz.forEach((item, idx) => {
        md += `**第 ${idx + 1} 題參考答案：【 ${['A', 'B', 'C', 'D'][item.answerIndex]} 】**\n`;
        md += `> **老師剖析詳解：** ${item.explanation}\n\n`;
      });
    }
    
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${studyPack.title.split(' ')[0] || "學習大綱"}_A+特訓智慧讀書包.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 處理檔案選取與轉 base64
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const base64Content = dataUrl.split(',')[1];
      setFileObject({
        name: file.name,
        data: base64Content,
        mimeType: file.type || getFallbackMimeType(file.name)
      });
    };
    reader.readAsDataURL(file);
    setErr(null);
  };

  const getFallbackMimeType = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext === 'pdf') return 'application/pdf';
    if (ext === 'mp3') return 'audio/mp3';
    if (ext === 'wav') return 'audio/wav';
    if (ext === 'm4a') return 'audio/x-m4a';
    if (ext === 'txt') return 'text/plain';
    return 'application/octet-stream';
  };

  // 觸發後端分析
  const handleProcessMaterial = async () => {
    setLoading(true);
    setErr(null);
    setStudyPack(null);

    try {
      const response = await fetch('/api/study/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab,
          fileData: activeTab === 'audio' || activeTab === 'document' ? fileObject : null,
          youtubeUrl: activeTab === 'youtube' ? youtubeUrl : null,
          rawText: activeTab === 'text' ? rawText : null,
          options: { focusTheme }
        })
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || "AI 分析講義時發生未預期錯誤，請至右上角 Secrets 確認。");
      }

      setStudyPack(data.result);
      setDashboardTab('summary'); // 預設顯示摘要
    } catch (e: any) {
      console.error(e);
      setErr(e.message || "處理教材失敗，請聯絡系統管理員或檢查您的 API Key 設定。");
    } finally {
      setLoading(false);
    }
  };

  const handleResetWorkspace = () => {
    setStudyPack(null);
    setFileObject(null);
    setYoutubeUrl('');
    setRawText('');
    setFocusTheme('');
    setErr(null);
  };

  const handleLoadSample = () => {
    setErr(null);
    setStudyPack(SAMPLE_STUDY_PACK);
    setDashboardTab('summary');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#FAF9F6] to-[#F1F3F5] text-neutral-900 font-sans selection:bg-indigo-100 selection:text-indigo-900" id="app-root">
      
      {/* 傳統數位畫面（列印時自動隱藏） */}
      <div className="print:hidden">
        {/* Premium Header Decoration Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-500" />

      {/* 導航 header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-neutral-200/50 sticky top-0 z-40 transition-all shadow-[0_1px_10px_rgba(0,0,0,0.01)]">
        <div className="max-w-6xl mx-auto px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-white shadow-md shadow-neutral-100">
              <GraduationCap size={20} className="stroke-[2.5] text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-display font-extrabold tracking-tight text-neutral-900 flex items-center gap-2">
                智慧課程讀書神器
                <span className="text-[9px] bg-gradient-to-r from-indigo-550 to-purple-550 text-white font-mono px-2 py-0.5 rounded-full font-bold">V2.5 PRO</span>
              </h1>
              <p className="text-[10px] text-neutral-450 font-sans tracking-tight">錄音 / 講義 / YouTube AI 極速生成模擬線上考複習包</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="https://ai.studio/build" 
              target="_blank" 
              rel="noreferrer" 
              className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-semibold text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900 transition-all cursor-pointer"
            >
              Google AI Studio
            </a>
          </div>
        </div>
      </header>

      {/* 主要內容區 */}
      <main className="max-w-5xl mx-auto px-4 py-8 md:py-14">
        <AnimatePresence mode="wait">
          {!studyPack ? (
            /* ================== WORKSPACE FOR INPUTS ================== */
            <motion.div
              key="workspace"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="max-w-3xl mx-auto space-y-8"
              id="view-workspace"
            >
              {/* 產品介紹標語 */}
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                <motion.div 
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-300/30 rounded-full text-[10px] text-amber-800 font-bold uppercase tracking-wider"
                >
                  <Sparkles size={10} className="text-amber-500 fill-amber-500 animate-pulse" />
                  考前急速充電 ⚡️ 真正的學術期末救星
                </motion.div>
                
                <h2 className="text-3xl md:text-4.5xl font-display font-black tracking-tight text-neutral-900 leading-tight">
                  把漫長課程 & 講義，一鍵煉成 <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-650 via-purple-650 to-pink-650">學霸精華全科複習包</span>
                </h2>
                
                <p className="text-xs md:text-sm text-neutral-450 leading-relaxed font-sans px-4 max-w-xl mx-auto">
                  上傳音訊、PDF 課件、或 YouTube 連結，讓 AI 數秒為你轉譯出大綱、核心高分觀念、申論題懶人包、模擬考單選題，和精巧的 3D 背誦記憶卡！
                </p>
              </div>

              {/* 錯誤信息顯示 */}
              {err && (
                <div className="p-4 bg-rose-50/50 border border-rose-200/60 rounded-2xl flex items-start gap-3 text-xs sm:text-sm text-rose-800 shadow-sm" id="error-box">
                  <span className="px-2 py-1 bg-rose-100 text-rose-800 rounded-lg text-[10px] font-bold leading-none shrink-0 mt-0.5">ERROR</span>
                  <div>
                    <h4 className="font-bold mb-0.5 text-rose-950">AI 特訓套件載入失敗</h4>
                    <p className="text-xs text-rose-750 leading-relaxed font-medium">{err}</p>
                  </div>
                </div>
              )}

              {/* 智慧示範載入橫幅 */}
              <div className="p-4 sm:p-5 bg-white border border-neutral-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_4px_25px_rgba(0,0,0,0.015)] relative overflow-hidden" id="demo-promo-box">
                <div className="absolute left-0 inset-y-0 w-1 bg-amber-550" />
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-amber-50/60 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
                    <BookOpen size={18} />
                  </div>
                  <div className="text-left">
                    <h4 className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                      💡 想要先行體驗複習效果？
                    </h4>
                    <p className="text-[11px] text-neutral-400 leading-relaxed font-sans">
                      一鍵載入我們原廠預置的「人工智慧與機器學習基礎」學霸高規格示範包。
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSample}
                  className="px-4.5 py-2 bg-neutral-900 hover:bg-neutral-850 text-white font-sans font-bold text-xs rounded-xl transition-all shrink-0 inline-flex items-center gap-1.5 active:scale-95 cursor-pointer shadow-sm animate-pulse hover:animate-none"
                  id="btn-load-sample"
                >
                  載入 ML 示範包
                </button>
              </div>

              {/* 主要輸入區 */}
              <div className="bg-white border border-neutral-200/80 rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.035)] overflow-hidden">
                
                {/* 模式選取 Tab (Segmented Pill Style) */}
                <div className="p-2 sm:p-3 bg-neutral-50/80 border-b border-neutral-150" id="material-type-tabs-container">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-neutral-200/55 rounded-2xl" id="material-type-tabs">
                    <button
                      onClick={() => { setActiveTab('audio'); setFileObject(null); }}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl font-display text-xs transition-all cursor-pointer ${
                        activeTab === 'audio' 
                          ? 'bg-white text-neutral-950 font-bold shadow-sm ring-1 ring-neutral-200/20' 
                          : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100/50'
                      }`}
                      id="tab-audio"
                    >
                      <FileAudio size={14} className={activeTab === 'audio' ? 'text-indigo-650' : ''} />
                      <span>課堂錄音檔</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('document'); setFileObject(null); }}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl font-display text-xs transition-all cursor-pointer ${
                        activeTab === 'document' 
                          ? 'bg-white text-neutral-950 font-bold shadow-sm ring-1 ring-neutral-200/20' 
                          : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100/50'
                      }`}
                      id="tab-document"
                    >
                      <FileText size={14} className={activeTab === 'document' ? 'text-indigo-650' : ''} />
                      <span>課程講義簡報</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('youtube'); }}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl font-display text-xs transition-all cursor-pointer ${
                        activeTab === 'youtube' 
                          ? 'bg-white text-neutral-950 font-bold shadow-sm ring-1 ring-neutral-200/20' 
                          : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100/50'
                      }`}
                      id="tab-youtube"
                    >
                      <Globe size={14} className={activeTab === 'youtube' ? 'text-indigo-600' : ''} />
                      <span>影片或網頁連結</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab('text'); }}
                      className={`flex items-center justify-center gap-2 py-3 rounded-xl font-display text-xs transition-all cursor-pointer ${
                        activeTab === 'text' 
                          ? 'bg-white text-neutral-950 font-bold shadow-sm ring-1 ring-neutral-200/20' 
                          : 'text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100/50'
                      }`}
                      id="tab-text"
                    >
                      <BookOpen size={14} className={activeTab === 'text' ? 'text-indigo-650' : ''} />
                      <span>剪貼課堂筆記</span>
                    </button>
                  </div>
                </div>

                {/* 輸入媒介內頁 */}
                <div className="p-6 md:p-8" id="tab-content-panel">
                  {/* TAB 1: 音檔上傳 */}
                  {activeTab === 'audio' && (
                    <div className="space-y-4" id="pane-audio">
                      <div className="border-2 border-dashed border-neutral-200 hover:border-indigo-500 rounded-2xl p-8 hover:bg-indigo-50/10 cursor-pointer transition-all relative flex flex-col items-center text-center group">
                        <input
                          type="file"
                          accept="audio/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="file-audio-input"
                        />
                        <div className="w-12 h-12 bg-neutral-50 group-hover:bg-indigo-55/10 text-neutral-500 group-hover:text-indigo-600 border border-neutral-200 group-hover:border-indigo-200 rounded-xl flex items-center justify-center mb-3 transition-colors">
                          <UploadCloud size={22} />
                        </div>
                        <h4 className="text-sm font-bold text-neutral-800">選擇您的上課/開會錄音檔</h4>
                        <p className="text-xs text-neutral-450 max-w-sm mt-1 mb-3">
                          支援 .mp1, .mp2, .mp3, .wav, .m4a 或是 .ogg 等格式 (大小限制在 20MB 以內最佳)
                        </p>
                        
                        {fileObject ? (
                          <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-200 rounded-xl flex items-center gap-2 text-xs font-bold text-indigo-700" id="audio-selected-item">
                            <CheckCircle size={14} className="text-indigo-600 fill-indigo-100" />
                            已選定：{fileObject.name}
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-405 bg-neutral-100 px-2 py-0.5 rounded font-mono uppercase">CLICK TO CHOOSE</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 2: PDF或簡報上傳 */}
                  {activeTab === 'document' && (
                    <div className="space-y-4" id="pane-document">
                      <div className="border-2 border-dashed border-neutral-200 hover:border-indigo-500 rounded-2xl p-8 hover:bg-indigo-50/10 cursor-pointer transition-all relative flex flex-col items-center text-center group">
                        <input
                          type="file"
                          accept=".pdf,.txt"
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          id="file-document-input"
                        />
                        <div className="w-12 h-12 bg-neutral-50 group-hover:bg-indigo-55/10 text-neutral-500 group-hover:text-indigo-600 border border-neutral-200 group-hover:border-indigo-200 rounded-xl flex items-center justify-center mb-3 transition-colors">
                          <UploadCloud size={22} />
                        </div>
                        <h4 className="text-sm font-bold text-neutral-800">上傳課程 PDF 或文字講義檔</h4>
                        <p className="text-xs text-neutral-450 max-w-sm mt-1 mb-3">
                          支援 .pdf 或者是 .txt 講義格式 (大小不超過 15MB 最佳)
                        </p>

                        {fileObject ? (
                          <div className="px-4 py-2 bg-indigo-50 border border-indigo-150 rounded-xl flex items-center gap-2 text-xs font-bold text-indigo-700 shadow-sm" id="doc-selected-item">
                            <CheckCircle size={14} className="text-indigo-650 fill-indigo-100" />
                            已成功定錨講義：{fileObject.name}
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-405 bg-neutral-100 px-2 py-0.5 rounded font-mono uppercase">PDF / TXT ONLY</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: YT 影片或網頁連結 */}
                  {activeTab === 'youtube' && (
                    <div className="space-y-4" id="pane-youtube">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-450 mb-2">線上影片或講義網頁連結 URL LINK / YOUTUBE VIDEO</label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-3.5 top-3.5 text-indigo-500 animate-pulse"><Globe size={16} /></span>
                            <input
                              type="url"
                              value={youtubeUrl}
                              onChange={(e) => setYoutubeUrl(e.target.value)}
                              placeholder="請貼上 YouTube 影片網址或一般線上教材、中文維基百科等連結，例：https://..."
                              className="w-full bg-[#FAF9F6] focus:bg-white border border-neutral-200 focus:border-indigo-550 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none text-neutral-800 transition-all font-sans focus:ring-4 focus:ring-indigo-100/50"
                              id="yt-url-input"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: 剪貼講義 */}
                  {activeTab === 'text' && (
                    <div className="space-y-4" id="pane-text">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-neutral-450 mb-2">貼上簡報大綱、課堂筆記、或教材純文字 RAW COURSE TEXT</label>
                        <textarea
                          rows={6}
                          value={rawText}
                          onChange={(e) => setRawText(e.target.value)}
                          placeholder="請在這裡剪貼或輸入您此次要分析的課程章節內容、期末投影片大綱或者是筆記字句..."
                          className="w-full bg-[#FAF9F6] focus:bg-white border border-neutral-200 focus:border-indigo-550 rounded-xl p-4 text-xs focus:outline-none text-neutral-800 transition-all font-sans resize-y focus:ring-4 focus:ring-indigo-100/50"
                          id="raw-notes-input"
                        />
                      </div>
                    </div>
                  )}

                  {/* 客製附加設定（如：針對主題） */}
                  <div className="mt-8 pt-6 border-t border-neutral-150" id="pane-extras">
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-3">
                      <Sliders size={13} className="text-neutral-450" />
                      更精準地複習（客製化選填 OPTIONAL）
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-neutral-600 mb-1.5">有些特定的觀念、單元想要 AI 特別挖深甚至考你嗎？</label>
                      <input
                        type="text"
                        value={focusTheme}
                        onChange={(e) => setFocusTheme(e.target.value)}
                        placeholder="例如：特別著重解釋『深度學習的梯度消失與倒傳遞』，並依此出題"
                        className="w-full bg-[#FAF9F6] focus:bg-white border border-neutral-200 focus:border-indigo-550 rounded-xl px-4 py-2.5 text-xs focus:outline-none text-neutral-800 font-sans focus:ring-4 focus:ring-indigo-100/50 transition-all"
                        id="focus-theme-input"
                      />
                    </div>
                  </div>

                  {/* 提交特訓按鈕 */}
                  <div className="mt-8 flex justify-center" id="process-action">
                    <button
                      onClick={handleProcessMaterial}
                      disabled={
                        loading ||
                        (activeTab === 'audio' && !fileObject) ||
                        (activeTab === 'document' && !fileObject) ||
                        (activeTab === 'youtube' && !youtubeUrl) ||
                        (activeTab === 'text' && !rawText.trim())
                      }
                      className="w-full sm:w-auto px-10 py-3.5 bg-neutral-900 hover:bg-indigo-600 text-white rounded-xl font-sans text-xs sm:text-sm font-bold tracking-widest uppercase shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-[0.98] flex items-center justify-center gap-2.5 cursor-pointer"
                      id="start-process-btn"
                    >
                      {loading ? (
                        <RefreshCw className="animate-spin text-white" size={16} />
                      ) : (
                        <Brain size={16} className="text-indigo-400 animate-pulse" />
                      )}
                      <span>{loading ? "AI 智慧助教正在大口研讀教材中..." : "開始 AI 特訓分析 START TRAINING ➔"}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* 智慧思考過渡 */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-8 bg-indigo-500/[0.03] p-6 border border-indigo-100 rounded-2xl text-center max-w-xl mx-auto shadow-sm"
                  id="loading-spinner-tips"
                >
                  <div className="flex items-center justify-center gap-2.5 mb-3 text-indigo-750 font-bold text-sm font-display">
                    <Sparkles className="text-indigo-600 fill-indigo-100 animate-pulse" size={18} />
                    正在將講義細節提煉成精華讀書包...
                  </div>
                  <p className="text-xs text-neutral-500 leading-relaxed font-sans" id="loading-tip-msg">
                    {loadingTips[loadingTipIndex]}
                  </p>
                  <div className="w-full bg-neutral-100 h-1.5 rounded-full overflow-hidden mt-4">
                    <div className="bg-indigo-600 h-full w-2/3 rounded-full animate-pulse" />
                  </div>
                </motion.div>
              )}
            </motion.div>
          ) : (
            /* ================== STUDY DASHBOARD ================== */
            <motion.div
              key="dashboard"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-8"
              id="view-dashboard"
            >
              {/* 返回與教材簡短回報 */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-200/80 pb-6" id="dashboard-header">
                <div className="flex items-start gap-3">
                  <button
                    onClick={handleResetWorkspace}
                    className="p-2.5 rounded-xl border border-neutral-200 text-neutral-500 hover:bg-neutral-50 hover:text-neutral-800 transition-all cursor-pointer shrink-0"
                    title="重新上傳分析"
                    id="back-workspace-btn"
                  >
                    <ArrowLeft size={16} />
                  </button>
                  <div>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-md font-sans border border-emerald-100 flex items-center gap-1 w-fit mb-1">
                      <CheckCircle size={10} className="text-emerald-600" />
                      AI 特訓教材成功生成
                    </span>
                    <h2 className="text-xl md:text-2.5xl font-extrabold text-neutral-900 tracking-tight font-display" id="study-panel-title">
                      {studyPack.title}
                    </h2>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setIsPrintModalOpen(true)}
                    className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                    id="btn-export-pdf"
                  >
                    <Printer size={13} />
                    <span>列印 / 匯出 PDF 報告</span>
                  </button>
                  <button
                    onClick={handleResetWorkspace}
                    className="px-4 py-2 text-xs font-medium border border-neutral-200 hover:bg-neutral-50 text-neutral-600 hover:text-neutral-900 rounded-xl transition-all cursor-pointer"
                    id="btn-re-process"
                  >
                    解鎖分析新教材
                  </button>
                </div>
              </div>

              {/* 大平台分欄 Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8" id="dashboard-body">
                {/* 左側選單 Rail */}
                <div className="lg:col-span-3 space-y-3" id="dashboard-sidebar">
                  <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 block px-2 mb-2">特訓單元模組</span>
                    
                    <button
                      onClick={() => setDashboardTab('summary')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 font-sans transition-all ${
                        dashboardTab === 'summary'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                          : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                      id="sidebar-summarize"
                    >
                      <BookOpen size={14} />
                      課堂大綱摘要
                    </button>

                    <button
                      onClick={() => setDashboardTab('takeaways')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 font-sans transition-all ${
                        dashboardTab === 'takeaways'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                          : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                      id="sidebar-takeaways"
                    >
                      <Brain size={14} />
                      學霸核心重點
                    </button>

                    <button
                      onClick={() => setDashboardTab('lazybag')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 font-sans transition-all ${
                        dashboardTab === 'lazybag'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                          : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                      id="sidebar-lazybag"
                    >
                      <Award size={14} />
                      考前必過懶人包
                    </button>

                    <button
                      onClick={() => setDashboardTab('flashcards')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 font-sans transition-all ${
                        dashboardTab === 'flashcards'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                          : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                      id="sidebar-flashcards"
                    >
                      <RefreshCw size={14} />
                      學霸名詞記憶卡
                    </button>

                    <button
                      onClick={() => setDashboardTab('quiz')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 font-sans transition-all ${
                        dashboardTab === 'quiz'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                          : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                      id="sidebar-quiz"
                    >
                      <CheckCircle size={14} />
                      考前線上模擬考
                    </button>

                    <button
                      onClick={() => setDashboardTab('chat')}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2.5 font-sans transition-all ${
                        dashboardTab === 'chat'
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-100'
                          : 'text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900'
                      }`}
                      id="sidebar-chat"
                    >
                      <MessageSquare size={14} />
                      24H AI 隨班助教
                    </button>
                  </div>

                  {/* 貼心提示小貼 */}
                  <div className="bg-neutral-50 border border-neutral-150 rounded-2xl p-4 text-[11px] text-neutral-500 leading-relaxed font-sans shadow-sm" id="dashboard-sidebar-tips">
                    <span className="font-bold text-neutral-700 block mb-1">💡 讀書小秘笈</span>
                    建議可以先閱讀「課堂大綱摘要」對這節課有全貌認知，再用「模擬測驗」檢測死角。最後可以用「隨班助教」詢問不理解的任何理論公式！
                  </div>
                </div>

                {/* 右側主分析 viewport */}
                <div className="lg:col-span-9" id="dashboard-content-viewport">
                  {/* TAB 1: 課堂大綱摘要 */}
                  {dashboardTab === 'summary' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6"
                      id="dashboard-tab-summary"
                    >
                      <div className="flex items-center justify-between border-b border-neutral-150 pb-4">
                        <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2 font-display">
                          課堂大綱與深度摘要
                        </h3>
                        <span className="text-[10px] font-mono text-neutral-400">GEMINI AI AUTOMATED GENERATOR</span>
                      </div>
                      
                      {/* Markdown 渲染 */}
                      <div className="prose prose-neutral max-w-none prose-sm" id="rendered-summary">
                        {renderSummaryMarkdown(studyPack.summary)}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 2: 精華重點清單 */}
                  {dashboardTab === 'takeaways' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                      id="dashboard-tab-takeaways"
                    >
                      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900 font-display">學霸核心觀念與核心重點詳解</h3>
                          <p className="text-xs text-neutral-400 font-sans mt-0.5">高分核心理論、運作機制、與必背邏輯極速複習</p>
                        </div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-5 text-indigo-700 rounded-lg shrink-0">
                          共 {studyPack.keyTakeaways.length} 個必考觀念
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="takeaways-grid">
                        {studyPack.keyTakeaways.map((takeaway, idx) => (
                          <div 
                            key={idx}
                            className="bg-white border border-neutral-200/80 rounded-2xl p-5 hover:border-indigo-600 transition-all flex flex-col justify-between"
                            id={`takeaway-card-${idx}`}
                          >
                            <div className="space-y-2">
                              <span className="text-xs font-mono font-bold text-indigo-500" id={`tk-num-${idx}`}>
                                POINT {String(idx + 1).padStart(2, '0')}
                              </span>
                              <h4 className="text-base font-bold text-neutral-900 leading-snug" id={`tk-topic-${idx}`}>
                                {takeaway.topic}
                              </h4>
                              <p className="text-xs text-neutral-600 leading-relaxed font-sans" id={`tk-detail-${idx}`}>
                                {takeaway.detail}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 3: 考前必過懶人包 Q&A */}
                  {dashboardTab === 'lazybag' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                      id="dashboard-tab-lazybag"
                    >
                      <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-lg font-bold text-neutral-900 font-display">
                          🔥 考前必過懶人包 (申論題模擬解答)
                        </h3>
                        <p className="text-xs text-neutral-400 font-sans mt-0.5">
                          老師最容易在非選擇題、問答題中考出的經典靈魂考題與 A+ 標準速記答案對決
                        </p>
                      </div>

                      <div className="space-y-3" id="lazybag-qa-accordion">
                        {studyPack.lazyBag.map((item, idx) => {
                          const isOpen = activeLazyBagIndex === idx;
                          return (
                            <div 
                              key={idx}
                              className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden transition-all shadow-sm"
                              id={`lazy-item-${idx}`}
                            >
                              <button
                                onClick={() => setActiveLazyBagIndex(isOpen ? null : idx)}
                                className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-neutral-50 transition-all"
                                id={`lazy-toggle-${idx}`}
                              >
                                <div className="flex items-start gap-3">
                                  <span className="px-2 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded font-mono shrink-0 mt-0.5" id={`lazy-badge-${idx}`}>
                                    高機率命題
                                  </span>
                                  <h4 className="text-sm font-bold text-neutral-900 leading-relaxed font-sans" id={`lazy-q-${idx}`}>
                                    {item.question}
                                  </h4>
                                </div>
                                {isOpen ? (
                                  <ChevronUp size={16} className="text-neutral-400 shrink-0" />
                                ) : (
                                  <ChevronDown size={16} className="text-neutral-400 shrink-0" />
                                )}
                              </button>

                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="border-t border-neutral-100 bg-neutral-50/50 p-5 text-xs text-neutral-700 leading-relaxed font-sans"
                                    id={`lazy-panel-${idx}`}
                                  >
                                    <div className="flex items-start gap-2 mb-2" id="expert-label">
                                      <span className="font-bold text-emerald-600 bg-emerald-100/60 px-2 py-0.5 rounded text-[10px]" id={`lazy-expert-badge-${idx}`}>
                                        A+ 學霸高分答案精華：
                                      </span>
                                    </div>
                                    <p className="text-neutral-800" id={`lazy-ans-${idx}`}>{item.answer}</p>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}

                  {/* TAB 4: 名詞記憶卡 */}
                  {dashboardTab === 'flashcards' && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-sm"
                      id="dashboard-tab-flashcards"
                    >
                      <div className="text-center max-w-md mx-auto mb-6">
                        <h3 className="text-lg font-bold text-neutral-900 font-display">學霸背誦記憶卡片</h3>
                        <p className="text-xs text-neutral-400 font-sans mt-0.5">關鍵專有名詞、定理公式快速主動回憶（Active Recall）</p>
                      </div>

                      <FlashcardViewer cards={studyPack.flashcards} />
                    </motion.div>
                  )}

                  {/* TAB 5: 線上模擬考 */}
                  {dashboardTab === 'quiz' && (
                    <div id="dashboard-tab-quiz">
                      <QuizSystem quiz={studyPack.quiz} />
                    </div>
                  )}

                  {/* TAB 6: Q&A 隨堂助教 */}
                  {dashboardTab === 'chat' && (
                    <div id="dashboard-tab-chat">
                      <TutorChat contextData={studyPack} />
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 底部 Copyright & Meta */}
      <footer className="border-t border-neutral-200/50 mt-16 py-8 text-center text-xs text-neutral-400 font-sans">
        <div className="max-w-6xl mx-auto px-4 space-y-2">
          <p>© 2026 AI 課程與講義學霸精華讀書神器. All Rights Reserved.</p>
          <p className="text-[10px] text-neutral-300">本系統與 Gemini 3.5 Flash 深度對接，所產生的複習內容與考題均由 AI 自動分析，非百分之百無缺陷，仍懇請交叉檢驗您的課本原講義。</p>
        </div>
      </footer>
    </div> {/* Closes print:hidden container */}

    {/* 1. PDF 匯出客製化選單 Modal (僅在數位介面顯示，列印時自動隱藏) */}
    <AnimatePresence>
      {isPrintModalOpen && studyPack && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 print:hidden text-left" id="pdf-export-modal" style={{ textAlign: 'left' }}>
          {/* Backdrop blur effect */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsPrintModalOpen(false)}
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-md cursor-pointer"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white border border-neutral-200 shadow-2xl rounded-3xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-neutral-900 via-indigo-950 to-neutral-900 px-6 py-5 flex items-center justify-between text-white border-b border-neutral-150">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <Printer size={16} />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold font-display tracking-tight text-white">🎓 課講 PDF 與下載中心</h3>
                  <p className="text-[10px] text-neutral-300">智慧編審優化、單元定制、以及 100% 繞過網頁攔截下載</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800/80 transition-all cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Tab Swapping System */}
            <div className="flex border-b border-neutral-200 bg-neutral-50 px-4 py-1 gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setPdfModalTab('setup')}
                className={`py-2 px-1 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  pdfModalTab === 'setup'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-950'
                }`}
              >
                <Printer size={13} />
                <span>1. 匯出選單與離線下載</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPdfModalTab('aiOptimizer');
                  setPdfOptimizeSuccess(null);
                  setPdfOptimizeError(null);
                }}
                className={`py-2 px-1 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 cursor-pointer ${
                  pdfModalTab === 'aiOptimizer'
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-neutral-500 hover:text-neutral-950'
                }`}
              >
                <Sparkles size={13} className="text-indigo-500 shrink-0" />
                <span>2. AI 智慧重組優化 🌟</span>
              </button>
            </div>

            {/* Selection Options Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 text-left" id="pdf-export-settings">
              {pdfModalTab === 'setup' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase">
                      選擇要匯出的複習章節（多選）
                    </span>

                    {/* SUMMARY */}
                    <label className="flex items-start gap-3 p-3 bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200/80 rounded-2xl cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={printOptions.includeSummary}
                        onChange={(e) => setPrintOptions(prev => ({ ...prev, includeSummary: e.target.checked }))}
                        className="mt-1 accent-indigo-600 rounded cursor-pointer shrink-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-neutral-800 block">第一單元：課堂大綱與深度摘要</span>
                        <p className="text-[10px] text-neutral-400 leading-snug font-sans mt-0.5">系統提煉之教材主體架構、概念脈絡、以及完整多層級摘要。</p>
                      </div>
                    </label>

                    {/* TAKEAWAYS */}
                    <label className="flex items-start gap-3 p-3 bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200/80 rounded-2xl cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={printOptions.includeTakeaways}
                        onChange={(e) => setPrintOptions(prev => ({ ...prev, includeTakeaways: e.target.checked }))}
                        className="mt-1 accent-indigo-600 rounded cursor-pointer shrink-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-neutral-800 block">第二單元：學霸核心必考重點詳解</span>
                        <p className="text-[10px] text-neutral-400 leading-snug font-sans mt-0.5">核心命題理論、公式、重要觀念運作機制之大師級拆解。</p>
                      </div>
                    </label>

                    {/* LAZYBAG */}
                    <label className="flex items-start gap-3 p-3 bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200/80 rounded-2xl cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={printOptions.includeLazyBag}
                        onChange={(e) => setPrintOptions(prev => ({ ...prev, includeLazyBag: e.target.checked }))}
                        className="mt-1 accent-indigo-600 rounded cursor-pointer shrink-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-neutral-800 block">第三單元：考前大衝刺問答申論 Q&A 題庫</span>
                        <p className="text-[10px] text-neutral-400 leading-snug font-sans mt-0.5">鎖定考卷非選擇題、問答題，提供學霸級完美高分範例答題思路。</p>
                      </div>
                    </label>

                    {/* FLASHCARDS */}
                    <label className="flex items-start gap-3 p-3 bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200/80 rounded-2xl cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={printOptions.includeFlashcards}
                        onChange={(e) => setPrintOptions(prev => ({ ...prev, includeFlashcards: e.target.checked }))}
                        className="mt-1 accent-indigo-600 rounded cursor-pointer shrink-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-neutral-800 block">第四單元：必背名詞及定義雙欄表（攜帶卡）</span>
                        <p className="text-[10px] text-neutral-400 leading-snug font-sans mt-0.5">將單詞卡轉換成紙張對照表，方便遮蓋住白話解釋進行主動回想背誦。</p>
                      </div>
                    </label>

                    {/* QUIZZES */}
                    <label className="flex items-start gap-3 p-3 bg-neutral-50 hover:bg-neutral-100/50 border border-neutral-200/80 rounded-2xl cursor-pointer transition-all">
                      <input
                        type="checkbox"
                        checked={printOptions.includeQuiz}
                        onChange={(e) => setPrintOptions(prev => ({ ...prev, includeQuiz: e.target.checked }))}
                        className="mt-1 accent-indigo-600 rounded cursor-pointer shrink-0"
                      />
                      <div>
                        <span className="text-xs font-bold text-neutral-800 block">第五單元：全真模擬考卷、答案卡及詳解</span>
                        <p className="text-[10px] text-neutral-400 leading-snug font-sans mt-0.5">前段生成空白考卷供作答，後段貼心附上完整標準答案及思路解析。</p>
                      </div>
                    </label>
                  </div>

                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-[10px] text-amber-800 leading-normal font-sans">
                    <strong>💡 線上列印小撇步：</strong> 點擊右下角「另存為 PDF」，若彈窗未顯示，為瀏覽器 iframe 沙盒機制阻擋。請使用下方<strong>備用下載中心</strong>！
                  </div>

                  {/* Backup downloads to solve user iframe issue */}
                  <div className="pt-4 border-t border-neutral-200/80 space-y-2.5">
                    <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase block">
                      🚀 備用離線檔案下載中心
                    </span>
                    
                    <button
                      type="button"
                      onClick={downloadOfflineHTML}
                      className="w-full text-left p-3.5 bg-neutral-900 border border-neutral-800 hover:bg-indigo-950 text-white rounded-2xl transition-all cursor-pointer shadow-md hover:shadow-indigo-100 flex flex-col gap-1"
                    >
                      <div className="flex items-center gap-1.5 font-bold text-xs text-white">
                        <span>📥 下載 100% 離線實體列印 HTML 檔</span>
                        <span className="bg-rose-500/90 text-[8px] text-white px-1.5 py-0.5 rounded-full font-mono">100% 成功一鍵另存為 PDF</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 leading-relaxed font-sans">
                        雙擊此檔案，即可在瀏覽器獨立開啟。完美規避 iframe 沙盒防護防線。不跑版地進行實體列印、或本機輸出高解析度 PDF。
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={downloadMarkdownNotes}
                      className="w-full text-left p-3 bg-neutral-50 hover:bg-indigo-50/40 border border-neutral-200 hover:border-indigo-200 text-neutral-700 hover:text-indigo-900 rounded-2xl transition-all cursor-pointer flex items-center gap-2.5"
                    >
                      <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
                        <FileText size={14} />
                      </div>
                      <div>
                        <span className="text-xs font-bold block text-neutral-800">下載為 Markdown 精緻學霸筆記 (.md)</span>
                        <p className="text-[9px] text-neutral-400 leading-normal font-sans">完整筆記無縫同步至 Obsidian, Notion 或 Logseq 進行永久存檔。</p>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* AI Optimize Description */}
                  <div className="p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl flex items-start gap-2.5">
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                      <Sparkles size={12} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-indigo-950 block">AI 智慧講義內文與考題極致編製長廊</span>
                      <p className="text-[10px] text-indigo-700 leading-snug font-sans mt-0.5">
                        此功能利用 Gemini 尊榮特調，將生成的五項單元內文進行「結構微調與二次重組」，從而自動修改摘要大綱與題目的詞彙、翻譯或排版體系。
                      </p>
                    </div>
                  </div>

                  {/* Preset Pills Selector */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase block">
                      選擇優化方向 / 高級預設風格：
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAiPdfPreset('academic')}
                        className={`p-2.5 border rounded-xl text-[11px] font-bold text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                          aiPdfPreset === 'academic'
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-sm ring-1 ring-indigo-500'
                            : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                        }`}
                      >
                        <span>🏫 臺大高階學術講義體</span>
                        <span className="text-[8px] text-neutral-400 font-normal">加強關鍵公理與嚴謹推演邏輯</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAiPdfPreset('condensed')}
                        className={`p-2.5 border rounded-xl text-[11px] font-bold text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                          aiPdfPreset === 'condensed'
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-sm ring-1 ring-indigo-500'
                            : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                        }`}
                      >
                        <span>⚡ 考前 10 分鐘極限速記體</span>
                        <span className="text-[8px] text-neutral-400 font-normal">精簡 40% 字數，濃縮雙欄速記大綱</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAiPdfPreset('examTips')}
                        className={`p-2.5 border rounded-xl text-[11px] font-bold text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                          aiPdfPreset === 'examTips'
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-sm ring-1 ring-indigo-500'
                            : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                        }`}
                      >
                        <span>🎯 名師口訣與避坑解碼</span>
                        <span className="text-[8px] text-neutral-400 font-normal">加上速背口訣、常考命題陷阱</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAiPdfPreset('bilingual')}
                        className={`p-2.5 border rounded-xl text-[11px] font-bold text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                          aiPdfPreset === 'bilingual'
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 shadow-sm ring-1 ring-indigo-500'
                            : 'border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700'
                        }`}
                      >
                        <span>🌐 專業英繁全球雙語對照</span>
                        <span className="text-[8px] text-neutral-400 font-normal">全面重編譯摘要、要點、模擬試題</span>
                      </button>
                    </div>
                  </div>

                  {/* Custom Command Box */}
                  <div className="space-y-1.5 text-left">
                    <span className="text-[10px] font-bold tracking-widest text-neutral-400 uppercase block">
                      或輸入客製化編審指令（選設定）：
                    </span>
                    <textarea
                      value={aiPdfCommand}
                      onChange={(e) => setAiPdfCommand(e.target.value)}
                      placeholder="例：『幫我將講義中的問答題全部轉化為幽默的生活化例子來說明，並且把單字表按照英文字母 A 到 Z 的順序排列』"
                      className="w-full h-20 p-3 text-xs border border-neutral-200 rounded-xl font-sans focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                    />
                  </div>

                  {/* Status Alerts */}
                  {pdfOptimizeSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800 rounded-xl leading-relaxed">
                      <strong>🎉 更新成功：</strong> {pdfOptimizeSuccess}
                    </div>
                  )}

                  {pdfOptimizeError && (
                    <div className="p-3 bg-rose-50 border border-rose-100 text-[11px] text-rose-800 rounded-xl leading-relaxed">
                      <strong>⚠️ 操作失敗：</strong> {pdfOptimizeError}
                    </div>
                  )}

                  {/* Core Action Button Trigger */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={isOptimizingPdf || (aiPdfPreset === 'none' && !aiPdfCommand.trim())}
                      onClick={handleOptimizePdfContent}
                      className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-neutral-200 text-white disabled:text-neutral-400 font-bold text-xs sm:text-sm rounded-2xl shadow-md cursor-pointer disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                    >
                      {isOptimizingPdf ? (
                        <>
                          <RefreshCw size={14} className="animate-spin text-white" />
                          <span>Gemini 正在重理編校您的 A+ 衝刺講義中 (可能需要幾秒)...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles size={14} className="text-white" />
                          <span>⚡ 啟動 AI 重新編製與整理 PDF 內容 ➔</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t border-neutral-150 bg-neutral-50 flex items-center justify-between gap-3 shrink-0">
              <span className="text-[9px] text-neutral-400 font-mono font-medium">StudySpecialist Pro V2.5</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 bg-white border border-neutral-200 text-neutral-600 rounded-xl text-xs sm:text-sm font-semibold hover:bg-neutral-50 hover:text-neutral-900 transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  關閉
                </button>
                {pdfModalTab === 'setup' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsPrintModalOpen(false);
                      setTimeout(() => {
                        window.print();
                      }, 350);
                    }}
                    disabled={
                      !printOptions.includeSummary &&
                      !printOptions.includeTakeaways &&
                      !printOptions.includeLazyBag &&
                      !printOptions.includeFlashcards &&
                      !printOptions.includeQuiz
                    }
                    className="px-6 py-2.5 bg-neutral-900 hover:bg-indigo-600 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-indigo-100 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Printer size={14} />
                    <span>列印 / 另存為 PDF</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>

    {/* 2. 僅在列印時顯示的超精緻 PDF 報告版型 (用 hidden print:block 控制) */}
    {studyPack && (
      <div className="hidden print:block bg-white text-neutral-900 font-sans p-4 max-w-[800px] mx-auto text-xs sm:text-sm leading-relaxed text-left" id="printable-report" style={{ textAlign: 'left' }}>
        
        {/* PDF 印表信頭 (Letterhead style) */}
        <div className="border-b-4 border-neutral-900 pb-5 mb-8 flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-neutral-900 font-display">
              智慧課程讀書神器 ➔ 考前全科急速衝刺報告
            </h1>
            <p className="text-[10px] text-neutral-500 font-sans mt-0.5">
              Smart Study Mate V2.5 PRO • 考前極速特訓自我學習單
            </p>
          </div>
          <div className="text-right text-[9px] font-mono text-neutral-400">
            <div>報告日期：2026-05-27</div>
            <div>技術支援：Gemini 3.5 Flash</div>
          </div>
        </div>

        {/* 主題精美卡片 */}
        <div className="p-5 bg-neutral-50 border border-neutral-200 rounded-2xl mb-8">
          <span className="text-[9px] uppercase font-bold text-indigo-600 tracking-widest block mb-0.5">原始分析課程單元</span>
          <h2 className="text-lg font-bold text-neutral-900 font-display">
            {studyPack.title}
          </h2>
          <p className="text-[11px] text-neutral-500 font-sans mt-1">
            * 本複習大綱與試卷由 AI 智慧提製。請配合原始書籍、課堂筆記、教科書交叉閱讀，確保學習無盲區。
          </p>
        </div>

        {/* 第一單元：大綱與摘要 */}
        {printOptions.includeSummary && studyPack.summary && (
          <div className="mb-10" id="print-sec-summary">
            <h3 className="text-sm font-bold text-neutral-900 border-b-2 border-neutral-800 pb-2 mb-4 flex items-center gap-1.5 font-display">
              <span className="w-1.5 h-4 bg-neutral-900 rounded inline-block" />
              第一單元：課堂大綱與深度精華摘要
            </h3>
            
            <div className="space-y-3 text-neutral-800 text-[11px] font-sans" id="print-rendered-summary">
              {studyPack.summary.split('\n').map((line, idx) => {
                if (line.startsWith('### ')) {
                  return <h4 key={idx} className="text-xs font-bold text-neutral-900 mt-4 mb-2 font-display">{line.replace('### ', '')}</h4>;
                }
                if (line.startsWith('## ')) {
                  return <h3 key={idx} className="text-sm font-bold text-neutral-900 mt-5 mb-2 font-display">{line.replace('## ', '')}</h3>;
                }
                if (line.startsWith('# ')) {
                  return <h2 key={idx} className="text-base font-bold text-neutral-900 mt-6 mb-3 font-display">{line.replace('# ', '')}</h2>;
                }
                if (line.startsWith('* ') || line.startsWith('- ')) {
                  return (
                    <ul key={idx} className="list-disc list-inside ml-3 text-neutral-700" id={`print-ul-${idx}`}>
                      <li>{parseBold(line.substring(2))}</li>
                    </ul>
                  );
                }
                const orderMatch = line.match(/^(\d+)\.\s(.*)/);
                if (orderMatch) {
                  return (
                    <ol key={idx} className="list-decimal list-inside ml-3 text-neutral-700 font-sans" id={`print-ol-${idx}`}>
                      <li>{parseBold(orderMatch[2])}</li>
                    </ol>
                  );
                }
                if (line.startsWith('> ')) {
                  return (
                    <blockquote key={idx} className="border-l-4 border-neutral-300 bg-neutral-50 pl-3 py-1.5 text-[10px] text-neutral-600 italic my-2">
                      {line.replace('> ', '')}
                    </blockquote>
                  );
                }
                if (line.trim() === '') return <div key={idx} className="h-0.5" />;
                return <p key={idx} className="text-neutral-700 text-xs leading-relaxed font-sans">{parseBold(line)}</p>;
              })}
            </div>
          </div>
        )}

        {/* 頁面分割 */}
        {printOptions.includeTakeaways && <div className="break-before-page h-6" />}

        {/* 第二單元：核心重點 */}
        {printOptions.includeTakeaways && studyPack.keyTakeaways && studyPack.keyTakeaways.length > 0 && (
          <div className="mb-10" id="print-sec-takeaways">
            <h3 className="text-sm font-bold text-neutral-900 border-b-2 border-neutral-800 pb-2 mb-4 flex items-center gap-1.5 font-display">
              <span className="w-1.5 h-4 bg-neutral-900 rounded inline-block" />
              第二單元：學霸核心關鍵必考重點詳解
            </h3>
            
            <div className="grid grid-cols-1 gap-4 font-sans" id="print-takeaways-container">
              {studyPack.keyTakeaways.map((takeaway, idx) => (
                <div key={idx} className="border border-neutral-200 rounded-xl p-4 bg-neutral-50/50" id={`print-tk-${idx}`}>
                  <div className="text-[10px] font-mono font-bold text-neutral-400">POINT {String(idx + 1).padStart(2, '0')}</div>
                  <h4 className="text-xs sm:text-sm font-bold text-neutral-900 mt-0.5 font-sans">{takeaway.topic}</h4>
                  <p className="text-[11px] text-neutral-700 leading-relaxed mt-1 font-sans">{takeaway.detail}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 頁面分割 */}
        {printOptions.includeLazyBag && <div className="break-before-page h-6" />}

        {/* 第三單元：考前問答 Q&A */}
        {printOptions.includeLazyBag && studyPack.lazyBag && studyPack.lazyBag.length > 0 && (
          <div className="mb-10 font-sans" id="print-sec-lazybag">
            <h3 className="text-sm font-bold text-neutral-900 border-b-2 border-neutral-800 pb-2 mb-4 font-display">
              第三單元：考前高機率命題問答與申論題庫 (問答 A+ 速背法)
            </h3>
            
            <div className="space-y-5" id="print-faq-container">
              {studyPack.lazyBag.map((item, idx) => (
                <div key={idx} className="space-y-1.5 border-b border-dashed border-neutral-200 pb-4 last:border-b-0" id={`print-lazy-${idx}`}>
                  <div className="flex gap-2 items-start text-left">
                    <span className="px-2 py-0.5 bg-neutral-900 text-white rounded text-[10px] font-bold font-mono">Q{idx + 1}</span>
                    <h4 className="text-xs sm:text-sm font-bold text-neutral-900 font-sans leading-relaxed text-left">{item.question}</h4>
                  </div>
                  <div className="pl-6 text-neutral-700 font-sans text-xs bg-neutral-50 p-3 rounded-xl border border-neutral-200/50 text-left">
                    <div className="text-[9px] font-bold text-emerald-600 block mb-1">➔ A+ 學霸奪高分名師答案精華：</div>
                    {item.answer}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 頁面分割 */}
        {printOptions.includeFlashcards && <div className="break-before-page h-6" />}

        {/* 第四單元：背誦單字卡 */}
        {printOptions.includeFlashcards && studyPack.flashcards && studyPack.flashcards.length > 0 && (
          <div className="mb-10 font-sans" id="print-sec-flashcards">
            <h3 className="text-sm font-bold text-neutral-900 border-b-2 border-neutral-800 pb-2 mb-4 flex items-center gap-1.5 font-display">
              <span className="w-1.5 h-4 bg-neutral-900 rounded inline-block" />
              第四單元：經典必考專業術語名詞對照表
            </h3>
            <p className="text-[11px] text-neutral-500 font-sans mb-3">* 遮擋背念：在期末實體衝刺時，可用作業紙在右欄進行物理遮蓋，主動回憶 (Active Recall) 左側專有名詞。</p>
            
            <div className="border border-neutral-200 rounded-xl overflow-hidden font-sans">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-neutral-100 border-b border-neutral-200 text-neutral-700 font-bold">
                    <th className="p-3 w-1/3 border-r border-neutral-200">專業術語 / 名詞名題 (Term)</th>
                    <th className="p-3">深入白話定義及考點拆解 (Definition)</th>
                  </tr>
                </thead>
                <tbody>
                  {studyPack.flashcards.map((card, idx) => (
                    <tr key={idx} className="border-b border-neutral-150 odd:bg-white even:bg-neutral-50/20 text-neutral-800">
                      <td className="p-3 font-bold border-r border-neutral-200 leading-relaxed text-neutral-900">{card.term}</td>
                      <td className="p-3 leading-relaxed text-neutral-700">{card.definition}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 頁面分割 */}
        {printOptions.includeQuiz && <div className="break-before-page h-6" />}

        {/* 第五單元：模擬卷 */}
        {printOptions.includeQuiz && studyPack.quiz && studyPack.quiz.length > 0 && (
          <div className="mb-10 font-sans" id="print-sec-quiz">
            <h3 className="text-sm font-bold text-neutral-900 border-b-2 border-neutral-800 pb-2 mb-2 flex items-center gap-1.5 font-display">
              <span className="w-1.5 h-4 bg-neutral-900 rounded inline-block" />
              第五單元：考前全真模擬考卷 (卷面實戰練習)
            </h3>
            <p className="text-[10px] text-neutral-400 font-sans italic mb-4">
              科目：{studyPack.title} | 試卷滿分：100 分 | 測驗時間：40 分鐘 
            </p>

            {/* Blank questions */}
            <div className="space-y-5" id="print-quiz-items">
              {studyPack.quiz.map((q, idx) => (
                <div key={idx} className="space-y-2 text-left" id={`print-q-${idx}`}>
                  <div className="flex font-sans text-xs text-neutral-800 font-bold leading-relaxed text-left">
                    <span className="mr-1">{idx + 1}.</span>
                    <p className="text-left">{q.question}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-1 pl-4 font-sans text-xs text-neutral-600 text-left">
                    {q.options.map((opt, oIdx) => {
                      const letter = String.fromCharCode(65 + oIdx);
                      return (
                        <div key={oIdx} className="flex items-center gap-1">
                          <span className="font-bold underline">({letter})</span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* 答案卡區別頁 break page */}
            <div className="break-before-page h-6" />

            {/* Answers and parsing */}
            <div className="mt-8 pt-6 border-t-2 border-double border-neutral-400" id="print-sec-answers">
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900 underline mb-3 text-left">➔ 模擬考標準解答及考點思路精析：</h4>
              
              <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5" id="print-ans-grid">
                {studyPack.quiz.map((q, idx) => (
                  <div key={idx} className="text-xs font-sans text-neutral-700 flex items-center gap-1 justify-between border-b border-neutral-200/50 pb-1.5 sm:border-b-0 sm:pb-0 sm:border-r sm:pr-2 last:border-0" id={`print-ans-item-${idx}`}>
                    <span className="font-bold text-neutral-400">第 {idx + 1} 題:</span>
                    <span className="font-bold text-indigo-700">({String.fromCharCode(65 + q.answerIndex)})</span>
                  </div>
                ))}
              </div>

              <div className="space-y-3.5" id="print-ans-explanations">
                {studyPack.quiz.map((q, idx) => (
                  <div key={idx} className="text-xs font-sans text-neutral-700 leading-relaxed bg-neutral-50/30 p-3 rounded-xl border border-neutral-100 text-left" id={`print-explanation-${idx}`}>
                    <div className="font-bold text-neutral-800 text-left">
                      第 {idx + 1} 題解析 (答案：{String.fromCharCode(65 + q.answerIndex)}):
                    </div>
                    <p className="text-neutral-500 mt-1 text-left">{q.explanation}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 底部 Copyright & Meta footer for printing */}
        <div className="border-t border-neutral-200 pt-6 mt-12 text-center text-[10px] text-neutral-400 font-sans flex items-center justify-between" id="print-footer">
          <div>智慧課程讀書神器 © 2026 學術複習報告系列. All Rights Reserved.</div>
          <div>本期末全科複習報告僅代為學術助攻，祝考生成績拔群！</div>
        </div>

      </div>
    )}
  </div>
);
}
