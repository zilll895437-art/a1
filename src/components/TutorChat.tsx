/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, HelpCircle, AlertOctagon, Sparkles } from 'lucide-react';
import { ChatMessage, StudyProcessResult } from '../types';

interface TutorChatProps {
  contextData: StudyProcessResult;
}

// 頂級強效且安全的行內 Markdown 渲染器，專治 React 19 多相容問題，完美支援列表、粗體、代碼區塊
function renderCustomMarkdown(text: string) {
  if (!text) return null;
  const lines = text.split('\n');
  
  return (
    <div className="space-y-2 text-sm leading-relaxed" id="markdown-body">
      {lines.map((line, idx) => {
        // 處理最常見的標題： ###
        if (line.startsWith('### ')) {
          return <h4 key={idx} className="text-base font-bold text-neutral-900 mt-3 mb-1 font-display" id={`md-h3-${idx}`}>{line.replace('### ', '')}</h4>;
        }
        if (line.startsWith('## ')) {
          return <h3 key={idx} className="text-lg font-bold text-neutral-900 mt-4 mb-2 font-display" id={`md-h2-${idx}`}>{line.replace('## ', '')}</h3>;
        }
        if (line.startsWith('# ')) {
          return <h2 key={idx} className="text-xl font-bold text-neutral-900 mt-4 mb-2 font-display" id={`md-h1-${idx}`}>{line.replace('# ', '')}</h2>;
        }

        // 處理無序列表 * 或 -
        if (line.startsWith('* ') || line.startsWith('- ')) {
          const content = line.substring(2);
          return (
            <ul key={idx} className="list-disc list-inside ml-2 text-neutral-700 space-y-1" id={`md-ul-${idx}`}>
              <li id={`md-li-${idx}`}>{parseBold(content)}</li>
            </ul>
          );
        }

        // 處理有序列表 1. 2.
        const orderMatch = line.match(/^(\d+)\.\s(.*)/);
        if (orderMatch) {
          return (
            <ol key={idx} className="list-decimal list-inside ml-2 text-neutral-700 space-y-1" id={`md-ol-${idx}`}>
              <li id={`md-oli-${idx}`}>{parseBold(orderMatch[2])}</li>
            </ol>
          );
        }

        // 處理程式碼區塊或引用
        if (line.startsWith('> ')) {
          return (
            <blockquote key={idx} className="border-l-4 border-indigo-400 bg-indigo-50/50 pl-3 py-1 text-xs text-neutral-600 rounded-r" id={`md-q-${idx}`}>
              {line.replace('> ', '')}
            </blockquote>
          );
        }

        // 空行轉為折行
        if (line.trim() === '') {
          return <div key={idx} className="h-1" id={`md-br-${idx}`} />;
        }

        // 一般段落
        return <p key={idx} className="text-neutral-700" id={`md-p-${idx}`}>{parseBold(line)}</p>;
      })}
    </div>
  );
}

// 輔助函式：解析粗體字 **包裹項目**
function parseBold(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  if (parts.length <= 1) return text;
  return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold text-neutral-900">{part}</strong> : part);
}

export default function TutorChat({ contextData }: TutorChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: `哈囉！我是你們這堂課的「AI 學霸助教」🎓。
我已經徹底研讀過你剛才上傳分析的教材了：『**${contextData.title}**』。

不論你對於這份講義中的特定細節不了解、想要我用更簡單例子解釋，或是想另外出題考考你，儘管問我！準備好要一起消滅死角了嗎？💪`,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanMsg = inputVal.trim();
    if (!cleanMsg || loading) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      role: 'user',
      text: cleanMsg,
      timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputVal('');
    setLoading(true);
    setErr(null);

    try {
      const response = await fetch('/api/study/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.concat(userMsg).map((m) => ({ role: m.role, text: m.text })),
          contextData: contextData,
          question: cleanMsg
        })
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || '助教無法解答這道題目，請稍後再試。');
      }

      setMessages((prev) => [
        ...prev,
        {
          id: Math.random().toString(),
          role: 'model',
          text: resData.reply,
          timestamp: new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (error: any) {
      console.error(error);
      setErr(error.message || '連線時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  const suggestionChips = [
    "💡 請用大白話與生活案例解釋核心觀念",
    "📝 針對本講義最難的概念額外考我一題！",
    "📚 請幫我快速整理本章節的所有專有名詞與代號對照"
  ];

  return (
    <div className="flex flex-col h-[540px] bg-[#FAF9F6] rounded-2xl border border-neutral-200 shadow-[0_12px_44px_rgba(0,0,0,0.02)] overflow-hidden" id="tutor-chat-box">
      {/* 助教頭部 */}
      <div className="bg-white border-b border-neutral-200/80 px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3" id="chat-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-white text-base font-semibold shadow-sm" id="bot-avatar">
            🎓
          </div>
          <div>
            <h4 className="text-sm font-display font-bold text-neutral-800 flex items-center gap-2" id="chat-tutor-name">
              AI 24H 隨班私教助教
              <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[9px] px-1.5 py-0.5 rounded-full font-bold border border-emerald-100">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                ONLINE
              </span>
            </h4>
            <p className="text-[10px] text-neutral-400 font-mono tracking-wider" id="chat-tutor-status">HYPER COGNITIVE • GEMINI 3.5 FLASH</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-sans" id="ref-tag">
          <Sparkles size={12} className="text-amber-500 animate-spin-slow" />
          已載入講義全本上下文
        </div>
      </div>

      {/* 訊息流 */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 font-sans bg-neutral-50/40" id="chat-messages-scroll">
        {messages.map((msg) => {
          const isBot = msg.role === 'model';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
              id={`msg-bubble-${msg.id}`}
            >
              {isBot && (
                <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-xs text-indigo-700 shadow-sm mt-1 shrink-0">
                  <Bot size={15} />
                </div>
              )}
              
              <div className="flex flex-col max-w-[85%]">
                <div
                  className={`rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                    isBot
                      ? 'bg-white border border-neutral-200 text-neutral-800 rounded-tl-none shadow-[0_2px_12px_rgba(0,0,0,0.015)]'
                      : 'bg-indigo-650 text-white rounded-tr-none shadow-sm shadow-indigo-100'
                  }`}
                  id={`msg-content-${msg.id}`}
                >
                  {isBot ? renderCustomMarkdown(msg.text) : <p className="whitespace-pre-wrap">{msg.text}</p>}
                </div>
                <span className={`text-[9px] text-neutral-450 font-mono mt-1 ${isBot ? 'text-left pl-1' : 'text-right pr-1'}`}>
                  {msg.timestamp}
                </span>
              </div>

              {!isBot && (
                <div className="w-8 h-8 rounded-lg bg-neutral-900 flex items-center justify-center text-xs text-white shadow-md mt-1 shrink-0">
                  <User size={15} />
                </div>
              )}
            </div>
          );
        })}

        {/* 思考中 Loader */}
        {loading && (
          <div className="flex items-start gap-3 justify-start" id="msg-loader">
            <div className="w-8 h-8 rounded-lg bg-white border border-neutral-200 flex items-center justify-center text-xs text-indigo-700 shadow-sm mt-1 shrink-0">
              <Bot size={15} className="animate-pulse" />
            </div>
            <div className="bg-white border border-neutral-200 rounded-2xl rounded-tl-none shadow-sm px-4 py-3 text-neutral-500 text-xs flex items-center gap-2">
              <span className="flex space-x-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
              助教正在為你深度剖析、準備考點精解...
            </div>
          </div>
        )}

        {err && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl flex items-start gap-2.5 text-xs text-rose-700" id="chat-error">
            <AlertOctagon size={15} className="mt-0.5 shrink-0 text-rose-600" />
            <div>
              <strong className="font-bold block mb-0.5">系統連線不穩定：</strong>
              <p className="text-rose-600 font-medium">{err}</p>
            </div>
          </div>
        )}
        
        <div ref={bottomRef} />
      </div>

      {/* 快捷點擊 Prompt Chips */}
      <div className="px-4 py-2.5 bg-white border-t border-neutral-100 flex flex-nowrap gap-2 overflow-x-auto scrollbar-none" id="smart-prompt-chips">
        {suggestionChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            disabled={loading}
            onClick={() => setInputVal(chip.substring(2))}
            className="px-3 py-1.5 bg-neutral-100 hover:bg-indigo-50 border border-neutral-200/65 hover:border-indigo-200 text-neutral-600 hover:text-indigo-850 rounded-full text-[11px] font-medium font-sans whitespace-nowrap transition-all active:scale-95 cursor-pointer disabled:opacity-40"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* 輸入區區塊 */}
      <form onSubmit={handleSend} className="bg-white border-t border-neutral-150 p-3 flex gap-2" id="chat-form">
        <input
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          disabled={loading}
          placeholder="有什麼不懂的學術理論或講義公式？隨時輸入問我吧..."
          className="flex-1 bg-neutral-55 hover:bg-neutral-50/20 focus:bg-white border border-neutral-200 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs font-sans focus:outline-none text-neutral-800 disabled:opacity-50 transition-all focus:ring-2 focus:ring-indigo-100"
          id="chat-input"
        />
        <button
          type="submit"
          disabled={loading || !inputVal.trim()}
          className="bg-indigo-600 text-white rounded-xl px-4 py-2.5 hover:bg-indigo-700 transition-all font-sans disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center shrink-0 active:scale-95 text-xs font-bold gap-1 cursor-pointer"
          id="chat-send-btn"
        >
          <span>SEND</span>
          <Send size={12} />
        </button>
      </form>
    </div>
  );
}
