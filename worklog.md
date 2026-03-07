# Net 知己｜Empathic AI 財經平台 開發日誌

---
## Task ID: 1-8 - Main Developer
### Work Task
開發完整的「Net 知己｜Empathic AI 財經平台」單頁應用

### Work Summary
已完成所有開發任務，項目結構和功能如下：

#### 1. 項目結構
```
src/
├── app/
│   ├── page.tsx              # 主頁（整合所有視圖）
│   ├── layout.tsx            # 更新 metadata（粵語、深色主題）
│   ├── globals.css           # 深色主題、玻璃擬態樣式
│   └── api/
│       ├── chat/route.ts     # AI 對話 API（使用 z-ai-web-dev-sdk）
│       └── market/route.ts   # 市場數據 API（模擬數據）
├── components/
│   ├── landing/
│   │   ├── StarfieldBackground.tsx  # Canvas 星空動畫
│   │   ├── NetAvatar.tsx            # 圓形頭像 + 呼吸動畫
│   │   ├── GreetingBubble.tsx       # 問候語氣泡
│   │   └── LandingView.tsx          # Landing 主視圖 + 手勢檢測
│   ├── chat/
│   │   ├── ChatHeader.tsx           # 返回、Radio、設定按鈕
│   │   ├── MessageList.tsx          # 滾動訊息列表
│   │   ├── MessageInput.tsx         # 文字輸入框 + 發送
│   │   ├── CooldownBanner.tsx       # 冷靜機制橫幅
│   │   └── ChatView.tsx             # Chat 主視圖
│   ├── dashboard/
│   │   ├── MarketSentimentCard.tsx  # 恆指 + 情緒分數
│   │   ├── Watchlist.tsx            # 觀察股票列表
│   │   ├── AiInsightCard.tsx        # AI 市場洞察
│   │   └── DashboardView.tsx        # Dashboard 主視圖
│   └── radio/
│       └── RadioPlayer.tsx          # 浮動播放器（Play/Pause、進度條、倍速）
├── store/
│   └── appStore.ts           # Zustand store（視圖狀態、聊天、冷靜機制、Radio）
└── lib/
    └── utils.ts              # 工具函數
```

#### 2. 功能實現
- **Landing 頁面**：星空背景動畫（Canvas）、Net 仔 Avatar（呼吸動畫）、問候語氣泡、手勢檢測（Swipe Up/Down）
- **Chat 頁面**：AI 對話（使用 z-ai-web-dev-sdk）、廣東話回覆、冷靜機制（高風險關鍵字觸發 30 秒倒計時）
- **Dashboard 頁面**：恆生指數、市場情緒分數、觀察名單、AI 洞察、「問點解？」互動
- **Radio Player**：浮動播放器、Play/Pause、進度條、倍速選擇

#### 3. 設計風格
- 深色主題（太空感）
- 漸變背景（深藍到紫）
- 玻璃擬態卡片（glassmorphism）
- Framer Motion 流暢動畫
- Mobile-first 響應式設計

#### 4. 技術特點
- 使用 Zustand 管理狀態（view、messages、cooldown、radio）
- 使用 z-ai-web-dev-sdk 調用 AI 模型
- 使用 Canvas 實現星空背景動畫
- 使用 Framer Motion 實現頁面切換動畫
- 高風險關鍵字檢測（全倉、all in、孖展等）

#### 5. 驗收確認
✅ Landing 頁面有流暢的星空動畫和手勢檢測
✅ Chat 頁面能與 AI 對話並顯示回覆
✅ Dashboard 顯示市場數據和洞察
✅ Radio Player 可播放音頻
✅ 冷靜機制正確觸發
✅ 頁面切換有流暢動畫
✅ 響應式設計支援手機和桌面

---
## Task ID: 1-5 - Voice Feature Developer
### Work Task
為「Net 知己」財經 AI 平台加入完整的語音功能（ASR 語音轉文字、TTS 文字轉語音）

### Work Summary
已完成所有語音功能的開發，包括：

#### 1. 新增文件
```
src/app/api/
├── asr/route.ts      # ASR API（語音轉文字）
└── tts/route.ts      # TTS API（文字轉語音）
```

#### 2. ASR API 實現 (`/api/asr/route.ts`)
- 接收 base64 編碼的音頻數據
- 使用 z-ai-web-dev-sdk 的 `zai.audio.asr.create()` 進行語音識別
- 返回轉錄文字結果
- 包含完整的錯誤處理

#### 3. TTS API 實現 (`/api/tts/route.ts`)
- 接收 `{ text, voice?, speed? }` 參數
- 支援 7 種語音選擇：tongtong, chuichui, xiaochen, jam, kazi, douji, luodo
- 語速範圍：0.5 - 2.0
- 文字長度限制：最大 1024 字符
- 返回 audio/wav 格式音頻
- 包含完整的參數驗證和錯誤處理

#### 4. MessageInput.tsx 更新
- 新增麥克風按鈕（Mic/MicOff 圖標）
- 使用 MediaRecorder API 實現錄音功能
- 錄音狀態：紅色脈動動畫
- 錄音完成後自動調用 /api/asr 轉文字
- 轉錄結果自動填入輸入框
- 支援權限請求失敗的錯誤提示
- 包含完整的清理邏輯（組件卸載時停止錄音和釋放資源）

#### 5. MessageList.tsx 更新
- 為每條 AI 訊息新增「朗讀」按鈕
- 使用 Volume2 和 Square 圖標
- 點擊調用 /api/tts 生成語音
- 支援播放/停止切換
- 顯示加載狀態（Loader2 旋轉動畫）
- 音頻播放完畢自動清理資源
- 同時只能播放一條訊息

#### 6. UI 設計特點
- 咪高峰按鈕：錄音中顯示紅色脈動動畫
- 朗讀按鈕：播放中顯示紫色背景
- 響應式設計：適配手機和桌面
- 與現有深色主題和玻璃擬態風格一致

#### 7. 驗收確認
✅ ASR API 正確接收音頻並返回文字
✅ TTS API 正確生成語音並返回 WAV 格式
✅ MessageInput 麥克風按鈕錄音功能正常
✅ 錄音完成後自動轉錄並填入輸入框
✅ MessageList 朗讀按鈕功能正常
✅ 語音播放和停止功能正常
✅ 所有加載和錄音狀態正確顯示
✅ ESLint 檢查通過，無代碼質量問題


---
Task ID: final-test
Agent: Super Z
Task: 驗證 24 小時廣東話財經電台系統

Work Log:
- 驗證 Vercel TTS API 正常運作（14KB 音頻）
- 驗證 Vercel Radio API 正常運作（500KB+ 音頻）
- 測試多個時段（7, 12, 16, 20, 22 點）全部成功
- 更新 Radio API 支持 GET 請求自動生成
- 推送代碼到 GitHub
- 發現 GitHub Token 缺少 workflow 權限
- 提供替代方案（cron-job.org 或手動添加 workflow）

Stage Summary:
- TTS API: ✅ 正常（Cantonese.ai）
- Radio API: ✅ 正常（BigModel + Cantonese.ai）
- Vercel 部署: ✅ 成功
- 自動化: ⏳ 需設置定時服務
- 音頻質量: ✅ 粵語女聲，約 500-600KB/節目

---
Task ID: cantonese-api-features
Agent: Super Z
Task: 學習並集成 Cantonese.ai API 高級功能

Work Log:
- 學習 Cantonese.ai TTS API 文檔
- 發現新功能：音頻增強、快速模式、時間戳、SRT字幕、MP3輸出
- 更新 TTS API 支持 should_enhance、should_use_turbo_model
- 更新 TTS API 支持 should_return_timestamp 返回時間戳
- 更新 TTS API 支持 pitch 音調調整（-12 ~ +12）
- 更新 TTS API 支持 duration 目標時長
- 更新 TTS API 支持 mp3 格式輸出
- 更新 Radio API 使用新功能
- 增加最大文字長度從 1024 到 5000 字符
- 推送代碼到 GitHub

Stage Summary:
- TTS API 新功能：enhance, turbo, timestamps, pitch, duration, mp3
- Radio API 集成新功能
- 文字限制提升至 5000 字符
- Vercel 部署進行中
