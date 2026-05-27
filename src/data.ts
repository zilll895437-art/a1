/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StudyProcessResult } from './types';

export const SAMPLE_STUDY_PACK: StudyProcessResult = {
  title: "探索人工智慧與機器學習的核心基礎",
  summary: `## 課程核心架構與深度摘要
本單元深入剖析人工智慧（Artificial Intelligence, AI）、機器學習（Machine Learning, ML）與深度學習（Deep Learning, DL）三者之間的包含關係、核心運作機制與現代發展脈絡。

### 一、 三位一體的層次與演進
*   **人工智慧 (AI)**：涵蓋所有能使電腦模擬人類智慧行為的技術，包含了基於規則的專家系統（Expert Systems）與機器學習。
*   **機器學習 (ML)**：演算法不依賴硬編碼的靜態邏輯，而是透過輸入大量數據（Data）進行自主特徵學習與模型優化，以達成預估或分類任務。
*   **深度學習 (DL)**：是機器學習的一門進階分支，核心在於利用多層結構的「類神經網路 (ANN)」來仿照人腦運算，特別擅長處理非結構化數據（如影像、自然語言與音訊）。

### 二、 核心學習類型與特徵
機器學習的運作主要可以劃分為三大主流學習典範：
1.  **監督式學習 (Supervised Learning)**：數據包含正確的目標標籤（Label）。典型應用包括迴歸（如房價預測）與分類（如垃圾郵件過濾）。
2.  **非監督式學習 (Unsupervised Learning)**：數據完全沒有標籤，演算法旨在自主尋找隱含群聚特徵或降維（如 K-means 分群、PCA）。
3.  **增強學習 (Reinforcement Learning)**：透過代理人（Agent）在環境中試錯並獲取獎勵（Reward）或懲罰，逐步找出最優策略（例如 AlphaGo）。

### 三、 結論與未來考點
現代 AI 的瓶頸已逐漸從「特徵工程（Feature Engineering）」轉移到「算力規模（Compute Scale）」與「高品質標籤數據」的獲取。考試中需特別留意不同學習法之間的應用界線與優缺點評估。`,
  keyTakeaways: [
    {
      topic: "監督式 vs. 非監督式學習的根本權衡",
      detail: "監督式學習是以『標籤 (Labels)』引導損失函數收斂，適合目標明確的任務；非監督式學習則通過計算『距離或密度相近度』來探索隱含結構（如分群、維度壓縮），適合探索性數據分析。"
    },
    {
      topic: "深度學習與神經網絡的非線性激活",
      detail: "多層感知機 (MLP) 如果不加上非線性激活函數（如 ReLU、Sigmoid），不論疊加多少層，在數學上都等同於單一的線性變換。因此非線性特徵是擬合複雜世界數據的靈魂。"
    },
    {
      topic: "過擬合 (Overfitting) 與正規化策略",
      detail: "當模型過度貼合訓練數據的噪聲時，在未知數據的泛化能力會急速變差。可採用 L1/L2 正則化 (Regularization)、Dropout 丟棄、及 Early Stopping 早期停止進行優化調參。"
    },
    {
      topic: "損失函數 (Loss Function) 的核心作用",
      detail: "損失函數充當 AI 優化時的指北針，衡量模型預測值與實際標籤的差距。分類問題常用『交叉熵 (Cross Entropy)』，數值預測任務常用『均方誤差 (MSE)』。"
    }
  ],
  lazyBag: [
    {
      question: "請解釋何謂「過擬合 (Overfitting)」，以及在實務上可以透過哪三種具體方法來緩解過擬合？",
      answer: "過擬合是指模型過度學習訓練數據的雜訊與特徵，導致在訓練集表現極佳，但在未知測試集上泛化效果（Generalization）低落的現象。\n\n緩解方法有：\n1. 增加數據量或資料增強 (Data Augmentation)，讓模型學會更全面多樣的通解。\n2. 引入正規化 (Regularization) 懲罰項，如 L1 或 L2限制權重大小。\n3. 使用 Dropout（在深層網絡中，每一次前向傳播隨機讓部分神經元斷開，降低耦合係數）。"
    },
    {
      question: "為什麼深度學習在處理影像（Image）與文字（NLP）時大放異彩，而傳統的機器學習演算法常面臨瓶頸？",
      answer: "影像與文字屬於『非結構化數據』，具有高度局部相依與高維度的特點。傳統機器學習演算法極度依賴『特徵工程』，需要科學家手工設計和篩選特徵（如 HOG、SIFT 特徵），極耗人工成本且難以做到自適應。深度學習神經網路則能透過卷積層 (CNN) 或 Transformer 架構，自動提取由淺入深的層級特徵。例如第一層提取線條輪廓，第二層提取局部眼睛鼻子，第三層組裝出臉孔，這使其在非結構化領域無比強大。"
    }
  ],
  flashcards: [
    {
      term: "Supervised Learning",
      definition: "監督式學習。使用『成對標籤數據 (X, Y)』訓練模型，使其能預測新數據之 Y 值的機器學習法。"
    },
    {
      term: "Overfitting",
      definition: "過擬合。模型拼命記住訓練集雜噪、導致通用泛化指標（Generalization）在實測中崩潰的狀態。"
    },
    {
      term: "Activation Function",
      definition: "激活函數。神經網絡中負責引入『非線性特徵』的數學轉換，若無它，多層網絡將退化為最單純的線性變換。"
    },
    {
      term: "Loss Function",
      definition: "損失函數。計算演算法預估值與標準答案差距的公式，提供梯度下降法更新模型的度量指標。"
    },
    {
      term: "Gradient Descent",
      definition: "梯度下降法。沿著損失函數曲面的最陡峭反方向一步步微調權重，以求得全域或局部最小值的核心優化演算法。"
    },
    {
      term: "Transformer",
      definition: "自注意力架構。目前最先進的神經網絡骨幹，允許大規模並行運算並捕捉長距離語音及上下文相依性。"
    }
  ],
  quiz: [
    {
      question: "下列哪一種學習演算法中，模型完全不依賴外部給定的正確標籤（Label）來進行運算訓練？",
      options: [
        "A. 邏輯迴歸分析 (Logistic Regression)",
        "B. K-means 群聚分析 (K-means Clustering)",
        "C. 支持向量機分類 (SVM)",
        "D. 深度卷積神經網絡 (CNN) 圖像分類"
      ],
      answerIndex: 1,
      explanation: "K-means 為非監督式學習（Unsupervised Learning）之經典，旨在藉由樣本點之幾何距離進行自動群聚，無須標籤。而其餘選項（Logistic Regression、SVM、CNN 等）都屬於需要提供標準解答 (Label) 的監督型演算法。"
    },
    {
      question: "在類神經網絡中，如果將所有的神經元激活函數全數移除（或設為恆等函數 f(x)=x），會發生什麼嚴重後果？",
      options: [
        "A. 網絡將會無法進行反向傳播 (Backpropagation)",
        "B. 模型訓練速度會變慢十倍",
        "C. 多層網絡在數學上將退化為單一層線性變換，失去擬合複雜非線性特性的能力",
        "D. 模型將開始嚴重過擬合進退失據"
      ],
      answerIndex: 2,
      explanation: "線性激活函數的重組依然是一組線性疊加。若捨棄非線性變換，不論堆疊了多少層深度，其本質一律退化為簡單的 w1 * w2 * ... * x 複合矩陣乘法，即退化為最基礎的線性單元。"
    },
    {
      question: "當我們發現模型在「訓練集 (Training Set)」上準確率高達 99.5%，但在「驗證集 (Validation Set)」上僅有 62.0%，代表模型面臨哪一類問題？",
      options: [
        "A. 欠擬合 (Underfitting)",
        "B. 資料偏誤量太大 (Data Bias)",
        "C. 過擬合 (Overfitting) 與泛化低落",
        "D. 學習率 (Learning Rate) 設定不夠高"
      ],
      answerIndex: 2,
      explanation: "訓練集特高代表模型記憶能力很強，但驗證集崩潰意味著該模型只是生硬死背特定細節，卻對「新考卷（新數據）」束手無策，此為標準的過擬合特徵。"
    }
  ]
};
