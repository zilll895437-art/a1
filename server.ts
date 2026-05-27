/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    throw new Error("GEMINI_API_KEY 未設定，請至 AI Studio 右上方的 Settings > Secrets 設定金鑰。");
  }
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiInstance;
}

// 輔助函式：還原基本網頁轉義字元
function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\\n/g, "\n");
}

async function getUrlContent(url: string): Promise<{ title: string; description: string; content?: string; isYoutube: boolean; videoId?: string }> {
  const isYoutube = url.includes("youtube.com") || url.includes("youtu.be");
  
  if (isYoutube) {
    let videoId = "";
    if (url.includes("youtu.be/")) {
      videoId = url.split("youtu.be/")[1]?.split(/[?#]/)[0];
    } else if (url.includes("/shorts/")) {
      videoId = url.split("/shorts/")[1]?.split(/[?#]/)[0];
    } else if (url.includes("/embed/")) {
      videoId = url.split("/embed/")[1]?.split(/[?#]/)[0];
    } else {
      const match = url.match(/[?&]v=([^&#]*)/);
      videoId = match ? match[1] : "";
    }

    // 優先使用 YouTube oEmbed 界面，這在伺服器端環境下不會被機器人檢查阻擋且 100% 穩定
    try {
      console.log(`[YouTube oEmbed] 正在為網址獲取 meta 標題: ${url}`);
      const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
      const response = await fetch(oembedUrl);
      if (response.ok) {
        const json = await response.json();
        const title = json.title || "";
        const author = json.author_name ? `頻道作者：${json.author_name}` : "";
        console.log(`[YouTube oEmbed] 成功獲得影片標題: "${title}"`);
        return {
          title,
          description: author,
          isYoutube: true,
          videoId
        };
      }
    } catch (e: any) {
      console.warn(`[YouTube oEmbed] 失敗，將降級實施一般頁面爬取:`, e.message || e);
    }
    
    // 降級方案：精準抓取 YouTube 網頁
    try {
      if (videoId) {
        console.log(`[YouTube Watch] 正在嘗試從 watch 網頁獲取資訊: ${videoId}`);
        const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
            "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8"
          }
        });
        if (response.ok) {
          const html = await response.text();
          let title = "";
          const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
          if (titleMatch) {
            title = titleMatch[1].replace(" - YouTube", "").trim();
          }
          let description = "";
          const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) || 
                            html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
          if (descMatch) {
            description = descMatch[1].trim();
          }
          return {
            title: decodeHtmlEntities(title),
            description: decodeHtmlEntities(description),
            isYoutube: true,
            videoId
          };
        }
      }
    } catch (err: any) {
      console.warn("[YouTube Watch] 網頁爬取失敗:", err?.message || err);
    }
    
    return { title: "", description: "", isYoutube: true, videoId };
  } else {
    // 處理其他的普通學習網頁連結，抓取標題、描述、以及網頁內文
    try {
      console.log(`[網頁爬蟲] 正在嘗試分析與抓取網頁內容: ${url}`);
      const response = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36",
          "Accept-Language": "zh-TW,zh;q=0.9,en;q=0.8"
        },
        signal: AbortSignal.timeout(8000) // 8 秒超時保護
      });
      if (!response.ok) {
        throw new Error(`伺服器回應狀態碼: ${response.status}`);
      }
      const html = await response.text();
      
      let title = "";
      const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
      if (titleMatch) {
        title = titleMatch[1].trim();
      }
      
      let description = "";
      const descMatch = html.match(/<meta\s+name="description"\s+content="([^"]*)"/i) ||
                        html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i);
      if (descMatch) {
        description = descMatch[1].trim();
      }
      
      // 剝除所有的 script, style 與 HTML Tag 標籤
      let bodyText = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s+/g, " ")
        .trim();
        
      if (bodyText.length > 8000) {
        bodyText = bodyText.substring(0, 8000) + "...(網頁字數過長，已被後端自動截斷以符 Token 合理範圍)";
      }
      
      console.log(`[網頁爬蟲] 成功抓取網頁 "${title}"，內容約有 ${bodyText.length} 字。`);
      return {
        title: decodeHtmlEntities(title || "線上學習資源網頁"),
        description: decodeHtmlEntities(description || "無特定主題描述"),
        content: bodyText,
        isYoutube: false
      };
    } catch (e: any) {
      console.warn(`[網頁爬蟲] 網址 "${url}" 抓取失敗:`, e.message || e);
      return {
        title: "線上學習網頁連結分析",
        description: "該網頁不允許外部直接爬取，或遭遇載入超時保護",
        content: `學生貼上了一個網址：${url}。雖然目前後端暫時被目標網頁的 Cloudflare 阻擋或逾時，但請你特別發揮你的頂尖世界常識與 Google 搜尋工具，直接檢析此網頁網址主題、或自行延伸為其生成富含學術知識、台灣頂大規格的智慧讀書筆記包，切勿將內容留空白。`,
        isYoutube: false
      };
    }
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // 允許較大的檔案上傳大小（如課堂音檔、PDF 簡報 base64）
  app.use(express.json({ limit: "40mb" }));
  app.use(express.urlencoded({ limit: "40mb", extended: true }));

  // API 1: 處理與分析課堂教材 (音檔、簡報文件、Youtube、或剪貼文字)
  app.post("/api/study/process", async (req, res) => {
    try {
      const { type, fileData, youtubeUrl, rawText, options } = req.body;
      const ai = getGeminiClient();

      let parts: any[] = [];
      let systemInstruction = `你是一位專業的台灣頂尖大學學霸與卓越助教。你的任務是協助學生分析、消化上傳的課程教材（可能為音檔、PDF簡報文件、YouTube影片或文字精粹），將其轉化為全世界最精華且便於閱讀複習的「智慧讀書包」。

【核心指令與防呆規則 - 攸關生死】：
1. 你的輸出必須百分之百「完全對齊與契合使用者本次上傳/貼上的教材具體內容與主題」！
2. 嚴禁敷衍。嚴禁不管使用者上傳或是貼上什麼內容都套用「人工智慧與機器學習基礎、Python、程式設計」等機器學習預設範本或內容。
3. 如果使用者上傳、輸入或貼上的是醫學、商務、歷史、地理、法律、哲學、文學、藝術、外語等任何特定學科主題，你必須完全融入該特定領域的學術脈絡中，生成專屬於該科目的讀書包。
4. 如果使用者貼入的素材較為簡短（如僅有標題、單個詞彙或一小段文字），請你「發揮你頂尖的大型語言模型專業常識與世界一流知識庫」，針對這幾個關鍵詞或簡短主題「深度擴充與發揮學術延伸」，產出一份富有誠意、專業嚴謹、字數飽滿的繁體中文讀書包，絕不可套用無關學門！

你必須產生以下完美的繁體中文內容並以結構化 JSON 輸出：
1. title: 基於教材內容生成的合適課程/章節標題。
2. summary: 完美的課程架構與深度摘要，使用 Markdown 排版，長度 400~800 字（包含前言、核心主軸、各單元大綱詳解、結論分析）。
3. keyTakeaways: 教材中不可遺忘的「觀念與核心重點」清單詳解，每個重點包含主題名稱 (topic) 與詳細背後邏輯、原理、應用或推導說明 (detail)。
4. lazyBag: 「考前必過懶人包」，整理出最可能在期中、期末考中考出來的模擬問答詳解（如申論題、問答題），每個條目包含一個關鍵必考問題 (question) 與高分答題方向精準解答 (answer)。
5. flashcards: 學霸背誦名詞卡，精選 6 到 10 個核心專有名詞、公式或定理，每個卡片包含名詞 (term) 與精簡強大的一句話背誦定義 (definition)。
6. quiz: 考前線上真實模擬測驗，精心設計 5 題具有鑑別度且高度相關的單選實戰題。每題包含：問題 (question)、剛好 4 個選項描述 (options 陣列)、正確答案的 0-indexed 索引值 (answerIndex)、以及詳細指引考點與概念複習的延伸解析說明 (explanation)。

重要提示：
- 請確保產生之所有文字、用語皆為台灣習慣的繁體中文（如：記憶體而非內存、專案而非項目、品質而非質量、影片而非視頻等）。
- 所有 Markdown 摘要與解釋需排版精緻、注重易讀性。
- 如果輸入是 YouTube 影片或連結，當 metadata 缺失時，請務必先調用 Google Search 網頁搜尋工具，來檢索該影片的主題與深度內容，作一份最契合該影片真實主題的讀書包。`;

      // 根據輸入類型準備內容
      if (type === 'audio') {
        if (!fileData || !fileData.data || !fileData.mimeType) {
          return res.status(400).json({ error: "未上傳有效的音檔資料" });
        }
        parts.push({
          inlineData: {
            data: fileData.data,
            mimeType: fileData.mimeType
          }
        });
        parts.push({
          text: `這是一段上傳的課程教材錄音。請分析這段錄音，詳細轉錄並轉折出摘要、考前速記精華重點、考前懶人包、專有名詞卡以及課堂模擬考題。 ${options?.focusTheme ? `特別注意與加強以下核心主題之分析：${options.focusTheme}` : ""}`
        });
      } else if (type === 'document') {
        if (!fileData || !fileData.data) {
          return res.status(400).json({ error: "未上傳有效的講義文件資料" });
        }
        parts.push({
          inlineData: {
            data: fileData.data,
            mimeType: fileData.mimeType || "application/pdf"
          }
        });
        parts.push({
          text: `這是一份上傳的課程簡報 PPT 或教材 PDF 講義文件。請徹底研讀此文件的每一頁、圖表與文字，將其轉折為最精美的智慧讀書包。 ${options?.focusTheme ? `特別加強此主題的深度挖掘：${options.focusTheme}` : ""}`
        });
      } else if (type === 'youtube') {
        if (!youtubeUrl) {
          return res.status(400).json({ error: "請提供影片或網頁連結" });
        }
        
        // 呼叫全新的後端安全抓取與多模分析器
        const webInfo = await getUrlContent(youtubeUrl);
        let promptText = "";
        
        if (webInfo.isYoutube) {
          promptText = `請就以下 YouTube 影片進行深度研究與精粹分析：\n`;
          promptText += `影片網址：${youtubeUrl}\n`;
          if (webInfo.videoId) {
            promptText += `影片識別代碼 (Video ID)：${webInfo.videoId}\n`;
          }
          if (webInfo.title) {
            promptText += `影片標題：【${webInfo.title}】\n`;
            if (webInfo.description) {
              promptText += `影片背景與作者描繪：\n${webInfo.description}\n\n`;
            }
          } else {
            promptText += `（系統提示：後端未成功抓取此影片標題，可能因為連線受限。請你優先使用你工具中的 Google Search 網頁搜尋工具，搜尋該網頁 "${youtubeUrl}"，來獲取真正的影片標題與影片核心主題知識！）\n\n`;
          }
          promptText += `【絕對指令】：請將此影片涉及之真實主題/核心知識點、概念邏輯與背景理論，擴增與延伸為最完整、最高規格、完全客製化且繁體中文（台灣口吻）的智慧讀書包。限制必考主題及關聯方向：${options?.focusTheme || "影片核心內容及學術延伸知識"}`;
        } else {
          // 一般網頁連結
          promptText = `請就以下網頁、文章或學習資源內容進行深度研究與精粹分析：\n`;
          promptText += `網頁網址：${youtubeUrl}\n`;
          if (webInfo.title) {
            promptText += `網頁標題：【${webInfo.title}】\n`;
          }
          if (webInfo.description) {
            promptText += `網頁描述摘要：\n${webInfo.description}\n\n`;
          }
          if (webInfo.content) {
            promptText += `網頁擷取之部分核心內文：\n${webInfo.content}\n\n`;
          } else {
            promptText += `（系統提示：後端未成功直接抓取網頁詳情，可能因為該網站有 Cloudflare 防爬保護。請你優先使用你工具中的 Google Search 網頁搜尋工具，搜尋該網址 "${youtubeUrl}" 的核心主題知識！）\n\n`;
          }
          promptText += `【絕對指令】：請將此網頁涉及之真實主題/核心知識點、概念邏輯與背景理論，擴增與延伸為最完整、最高規格、完全客製化且繁體中文（台灣口吻）的智慧讀書包。限制必考主題及關聯方向：${options?.focusTheme || "網頁核心內容及學術延伸知識"}`;
        }

        parts.push({
          text: promptText
        });
      } else if (type === 'text') {
        if (!rawText || rawText.trim() === '') {
          return res.status(400).json({ error: "請輸入或剪貼您的課程教材文字" });
        }
        parts.push({
          text: `以下是使用者貼上的課程教材文字或講義大綱：\n\n${rawText}\n\n請以這段文字為核心素材，為學生延伸、豐富並製作成完美的考前衝刺智慧讀書包，詳細解釋每個模糊的概念。${options?.focusTheme ? `著重強調專攻主題：${options.focusTheme}` : ""}`
        });
      } else {
        return res.status(400).json({ error: "不支援的教材材質類型" });
      }

      // 使用 gemini-3.5-flash 作為基本與多模態分析的最高效且支援 API Key 的指定模型
      let response;
      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          keyTakeaways: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                detail: { type: Type.STRING }
              },
              required: ["topic", "detail"]
            }
          },
          lazyBag: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING }
              },
              required: ["question", "answer"]
            }
          },
          flashcards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING }
              },
              required: ["term", "definition"]
            }
          },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                answerIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "answerIndex", "explanation"]
            }
          }
        },
        required: ["title", "summary", "keyTakeaways", "lazyBag", "flashcards", "quiz"]
      };

      try {
        console.log(`[智慧讀書] 正在嘗試調用 Gemini API (類型: ${type})...`);
        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            {
              role: "user",
              parts: parts
            }
          ],
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            // 啟用 searchGrounding 幫助 YouTube 理解與最新的背景學問
            tools: type === 'youtube' ? [{ googleSearch: {} }] : [],
            responseSchema: responseSchema
          }
        });
      } catch (firstErr: any) {
        console.warn("[智慧讀書] 帶有 searchGrounding 工具的呼叫失敗，將採用無工具自主推理備用方案重試...", firstErr?.message || firstErr);
        
        // 針對 YouTube 連結，若 Search Grounding 失敗，微調 Prompt 讓 Model 自主推理並補足主題知識
        if (type === 'youtube') {
          parts.push({
            text: "\n【系統備註：因搜尋工具不支援，請你根據 YouTube 影片網址中所描述的英文或中文主題關鍵字，發揮你的世界頂尖知識庫，自主為學生推理生成最專業完整、富含學術知識、高鑑別度的期末考特訓讀書包，切勿因無法直接獲取影片而產生空白。】"
          });
        }

        response = await ai.models.generateContent({
          model: "gemini-3.5-flash",
          contents: [
            {
              role: "user",
              parts: parts
            }
          ],
          config: {
            systemInstruction: systemInstruction,
            responseMimeType: "application/json",
            responseSchema: responseSchema
          }
        });
      }

      const text = response.text;
      if (!text) {
        throw new Error("AI 未能成功生成結構化回覆內容");
      }

      const parsedResult = JSON.parse(text.trim());
      res.json({ success: true, result: parsedResult });
    } catch (err: any) {
      console.error("處理讀書教材出錯:", err);
      res.status(500).json({ error: err.message || "處理教材時遭遇 AI 端錯誤，請檢查您的 Secrets GEMINI_API_KEY 是否正確設定。" });
    }
  });

  // API 1.5: AI 智慧講義 PDF 深度整理器與重組器 (Optimize PDF Content)
  app.post("/api/study/optimize-pdf-content", async (req, res) => {
    try {
      const { studyPack, command, presetType } = req.body;
      if (!studyPack) {
        return res.status(400).json({ error: "請提供要優化的智慧讀書包資料" });
      }

      const ai = getGeminiClient();

      let instructionText = "";
      if (presetType === "academic") {
        instructionText = "請採用『頂大尊榮學術體』：將文字轉換成最嚴謹、充滿教授與大師級專業學術語彙、並加強邏輯嚴密度，消除過度口語或隨性的字句。";
      } else if (presetType === "condensed") {
        instructionText = "請進行『極致緊湊 A4 雙欄複習版整理』：將長篇大論極限濃縮提煉。以表格、並排結構或精短、一針見血的條列描述來代替，使印製 A4 時具有高資訊密度，節省列印版面與碳粉。";
      } else if (presetType === "examTips") {
        instructionText = "請進行『添加記憶口訣與名師點撥』：在每個重點、問答及名詞解釋中，特意補充專屬台灣學校考卷常見命題陷阱的『名師點撥考點註解』，並發想精巧好記的『速記記憶口訣』來幫助主動回憶、過目不忘。";
      } else if (presetType === "bilingual") {
        instructionText = "請轉化成『中英雙語對照版』：將課程標題、摘要的核心字句、關鍵重點條目、問答 Q&A 以及實戰演練題，以中英對照（英文 Chinese / English）的口吻或括弧補註來呈現，加倍吸收領域專業英文單字。";
      }

      if (command && command.trim() !== '') {
        instructionText += `\n此外，使用者指定了以下客製化重整指令：『${command}』`;
      }

      const systemInstruction = `你是一位享譽各界的頂尖課堂架構優化師與學術出版部常務編審。你的任務是針對既有的「智慧讀書包」，依據指定的編纂優化指令，重塑、重新提純或編製各部分的文字水準、文字語調與排版風格。

【最高編纂硬指令】：
1. 你必須精準、深度地打磨並重新詮釋傳入的智慧讀書包 JSON 內容中所有欄位（包含 標題 title、大綱摘要 summary、關鍵重點 keyTakeaways 陣列、問答 lazyBag 陣列、背誦卡 flashcards 陣列、模擬測驗 quiz 陣列）。
2. 優化過程中，學科的主幹背景與核心概念必須與原教材 100% 完美契合，但其寫作高度、多國語言力或對焦特定排版的需求則要經歷一次巨大的 AI 升級與優雅翻修。
3. 回覆必須使用台灣特有的繁體中文（例如用「記憶體」非「內存」、「影片」非「視頻」、「專案」非「項目」）。
4. 全程使用標準 JSON 格式返回。`;

      const prompt = `以下是目前的智慧讀書包資料（JSON）：
${JSON.stringify(studyPack, null, 2)}

優化編製方針：
『${instructionText}』

請你實行精雕細琢，並在回覆中返回最完美的優化後全新智慧讀書包 JSON 結果。`;

      const responseSchema = {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING },
          summary: { type: Type.STRING },
          keyTakeaways: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                topic: { type: Type.STRING },
                detail: { type: Type.STRING }
              },
              required: ["topic", "detail"]
            }
          },
          lazyBag: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                answer: { type: Type.STRING }
              },
              required: ["question", "answer"]
            }
          },
          flashcards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                term: { type: Type.STRING },
                definition: { type: Type.STRING }
              },
              required: ["term", "definition"]
            }
          },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                answerIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING }
              },
              required: ["question", "options", "answerIndex", "explanation"]
            }
          }
        },
        required: ["title", "summary", "keyTakeaways", "lazyBag", "flashcards", "quiz"]
      };

      console.log(`[AI PDF 優化] 正在調用 Gemini-3.5-Flash 優化與加工學習內容...`);
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          systemInstruction: systemInstruction,
          responseMimeType: "application/json",
          responseSchema: responseSchema
        }
      });

      const text = response.text;
      if (!text) {
        throw new Error("AI 智慧重編未能生成有效的 JSON 內容");
      }

      const parsedResult = JSON.parse(text.trim());
      res.json({ success: true, result: parsedResult });
    } catch (err: any) {
      console.error("AI 智慧 PDF 重編出錯:", err);
      res.status(500).json({ error: err.message || "AI 端在優化 PDF 內容時出錯" });
    }
  });

  // API 2: AI 智慧學霸助教隨堂問答 (Chat QA)
  app.post("/api/study/chat", async (req, res) => {
    try {
      const { messages, contextData, question } = req.body;
      if (!question) {
        return res.status(400).json({ error: "請輸入問答內容" });
      }

      const ai = getGeminiClient();

      // 建構歷史與教材上下文對談 prompt
      const prompt = `你是「智慧課程讀書助神器」的【AI 學霸課堂助教】。你手邊有一份這堂課程的完整核心分析資訊：
====================================
標題：${contextData?.title || "未命名講義"}
整體課程摘要：${contextData?.summary || "暫無"}
必背熱門概念：
${(contextData?.keyTakeaways || []).map((t: any) => `- **${t.topic}**: ${t.detail}`).join("\n")}
考前懶人包 QA：
${(contextData?.lazyBag || []).map((q: any) => `問：${q.question}\n答：${q.answer}`).join("\n")}
====================================

現在學生對此課程、講義內容提出了進一步細節疑問，或是延伸的問題。
請你根據上述的課程教材背景、你本身的強大知識庫，詳情解答學生的任何問題。

學生的問題是：『${question}』

請用幽默、細心、充滿耐心且專業的繁體中文（台灣口吻）回答。你可以使用 Markdown 來美化你的答案結構（如粗體、代碼塊、公式或列點，提升複習極限）。`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        config: {
          systemInstruction: "你是一位充滿熱忱與耐心的頂尖大學 AI 助教。你將完全針對此課程的教材脈絡，以流利的台灣繁體中文提供精準的考前特訓回答，幫助學生掃除死角。"
        }
      });

      res.json({ success: true, reply: response.text });
    } catch (err: any) {
      console.error("學霸問答失敗:", err);
      res.status(500).json({ error: err.message || "問答解析失敗" });
    }
  });

  // 設置 Vite 開發伺服器或生產靜態目錄
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // 解決 Express v4/v5 SPA 路由
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[智慧讀書工具] Server is listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
