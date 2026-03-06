# 24小時廣東話財經電台系統

## 系統架構

```
┌─────────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  GitHub Actions │────→│  Vercel API │────→│   z.ai      │────→│  音頻輸出   │
│  (每小時觸發)   │     │  (整合處理)  │     │ (LLM+TTS)   │     │  (WAV/MP3)  │
└─────────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
        │
        ↓
┌─────────────────┐
│  財經數據源     │
│  - 恆生指數     │
│  - 匯率/金價    │
│  - 美股期貨     │
└─────────────────┘
```

## 環境變數配置

### Vercel 環境變數

在 Vercel 項目設置中添加以下環境變數：

| 變數名 | 說明 | 必填 |
|--------|------|------|
| `ZAI_API_KEY` | z.ai API 金鑰（LLM + TTS） | ✅ 是 |
| `CANTONESE_API_KEY` | Cantonese.ai API 金鑰（選填） | 否 |

### GitHub Secrets

在 GitHub 倉庫設置中添加以下 Secrets：

| Secret 名稱 | 說明 | 必填 |
|------------|------|------|
| `VERCEL_API_URL` | Vercel 部署網址（如 `https://your-app.vercel.app`） | ✅ 是 |
| `STREAMING_ENDPOINT` | 串流伺服器端點（選填） | 否 |

## API 端點

### POST /api/radio

生成廣東話電台節目

**請求體：**
```json
{
  "newsTitle": "恆生指數最新走勢",
  "newsDescription": "港股今日表現",
  "broadcastType": "finance",
  "hour": 9,
  "financeData": {
    "hsi": "19876",
    "dowFuture": "38500",
    "gold": "2350"
  },
  "voice": "tongtong"
}
```

**回應：**
```json
{
  "success": true,
  "broadcastType": "finance_opening",
  "cantoneseScript": "開市大直播！港股正式開市...",
  "audioBase64": "UklGRi...",
  "programName": "開市大直播"
}
```

### GET /api/radio

獲取節目時間表和可用語音

**回應：**
```json
{
  "schedule": {
    "0": { "name": "深夜財經回顧", "type": "finance_night" },
    "7": { "name": "晨早財經速報", "type": "finance_morning" },
    ...
  },
  "availableVoices": ["tongtong", "chuichui", "xiaochen", "jam", "kazi", "douji", "luodo"],
  "description": "24小時廣東話財經電台 API"
}
```

### GET /api/market

獲取即時市場數據

**查詢參數：**
- `type`: `full` | `simplified`

**回應：**
```json
{
  "hsi": {
    "value": 19876.54,
    "change": 1.23,
    "open": 19700,
    "high": 19900,
    "low": 19650
  },
  "gold": { "price": 2350.50, "change": 5.20 },
  "oil": { "price": 78.50, "change": -0.30 },
  "marketStatus": "open",
  "isRealData": true
}
```

## 節目時間表

| 時間 | 節目名稱 | 類型 | 內容重點 |
|-----|----------|------|----------|
| 00:00 | 深夜財經回顧 | 財經 | 全日重點、期貨走勢 |
| 01:00-05:00 | 深夜音樂廊 | 深夜 | 柔和音樂 |
| 06:00 | 早晨新聞 | 新聞 | 晨早新聞 |
| 07:00 | 晨早財經速報 | 財經 | 亞洲開市前、外匯金價 |
| 08:00 | 上班路上 | 新聞 | 早間資訊 |
| 09:00 | 開市大直播 | 財經 | 港股開市、即時報價 |
| 10:00 | 熱門話題 | 新聞 | 時事討論 |
| 11:00 | 音樂早晨 | 音樂 | 輕鬆音樂 |
| 12:00 | 午間新聞財經 | 財經 | 上午市總結、環球 |
| 13:00 | 午後音樂 | 音樂 | 午間放鬆 |
| 14:00 | 下午茶時間 | 新聞 | 下午資訊 |
| 15:00 | 音樂下午茶 | 音樂 | 輕鬆時刻 |
| 16:00 | 收市檢閱 | 財經 | 全日總結、板塊分析 |
| 17:00 | 放工前奏 | 音樂 | 下班音樂 |
| 18:00 | 晚間新聞 | 新聞 | 晚間資訊 |
| 19:00 | 今日焦點 | 新聞 | 日間焦點回顧 |
| 20:00 | 美股前哨 | 財經 | 美股前瞻、歐洲市場 |
| 21:00 | 夜音樂 | 音樂 | 晚間音樂 |
| 22:00 | 環球財經夜 | 財經 | 美股表現、亞太預告 |
| 23:00 | 夜傾情 | 新聞 | 夜間清談 |

## 可用語音

| 語音 ID | 描述 |
|---------|------|
| `tongtong` | 女聲 - 標準普通話/廣東話 |
| `chuichui` | 女聲 - 溫柔 |
| `xiaochen` | 女聲 - 清脆 |
| `jam` | 男聲 - 沉穩 |
| `kazi` | 女聲 - 活潑 |
| `douji` | 男聲 - 年輕 |
| `luodo` | 男聲 - 成熟 |

## GitHub Actions 自動排程

### 觸發方式

1. **定時觸發**
   - 每小時整點執行
   - 港股交易日（週一至週五）財經時段特別執行：07:00, 09:00, 12:00, 16:00, 20:00, 22:00

2. **手動觸發**
   - 在 GitHub Actions 頁面手動運行
   - 可選擇指定時間和節目類型

### 工作流程

1. 判斷當前時間和節目類型
2. 如果是財經節目，抓取即時財經數據
3. 呼叫 Vercel Radio API 生成節目
4. 上傳音頻至 GitHub Artifacts
5. 創建 GitHub Release（定時觸發時）

## 部署指南

### 1. 部署到 Vercel

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 登入
vercel login

# 部署
vercel --prod
```

### 2. 配置環境變數

在 Vercel Dashboard → Settings → Environment Variables 中設置

### 3. 配置 GitHub Secrets

在 GitHub 倉庫 → Settings → Secrets and variables → Actions 中設置

### 4. 啟用 GitHub Actions

確保 `.github/workflows/24hr-radio.yml` 文件存在於倉庫中

## 擴展功能

### Icecast/SHOUTcast 串流

可配置串流伺服器實現真正的 24/7 網絡電台

### Telegram/Discord 推送

添加通知功能，定時推送新節目

### 多語言支援

擴展支援普通話、英語等其他語言

## 故障排除

### API 呼叫失敗

1. 檢查 Vercel 日誌
2. 確認環境變數設置正確
3. 檢查 z.ai API 配額

### 音頻生成失敗

1. 確認文字長度不超過限制
2. 檢查語音 ID 是否正確
3. 查看 Vercel 函數執行日誌

### GitHub Actions 執行失敗

1. 檢查 Secrets 配置
2. 確認 VERCEL_API_URL 格式正確（不帶尾部斜線）
3. 查看 Actions 執行日誌

## 授權

MIT License
