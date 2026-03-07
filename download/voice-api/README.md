# Net 知己 AI 語音 API 服務

獨立的 Node.js 語音 API 服務，支援 ASR（語音轉文字）和 TTS（文字轉語音）。

## ✨ 功能特點

- 🔐 **API Key 認證** - 安全的 API 訪問控制
- 🎤 **ASR 語音識別** - 支援多種音頻格式
- 🔊 **TTS 語音合成** - 7 種高質量中文語音
- 🐳 **Docker 支持** - 一鍵容器化部署
- 🌐 **HTTPS 證書** - 自動配置 Let's Encrypt
- 🔄 **自動續期** - 證書自動更新

---

## 📦 快速開始

### 方式一：Docker 部署（推薦）

```bash
# 1. 克隆或下載項目
cd voice-api

# 2. 配置環境變量
cp .env.example .env
# 編輯 .env 設置 API_KEYS 和 ADMIN_SECRET

# 3. 一鍵部署
docker compose up -d

# 4. 查看日誌
docker compose logs -f
```

### 方式二：完整部署腳本

```bash
# 自動安裝 Docker、Nginx、配置 HTTPS
sudo ./scripts/deploy.sh api.yourdomain.com admin@yourdomain.com
```

### 方式三：本地開發

```bash
npm install
npm run dev
```

---

## 🔐 API Key 認證

### 認證方式

所有 API 請求都需要在請求頭中攜帶 API Key：

```bash
# 方式一：x-api-key 頭
curl -H "x-api-key: YOUR_API_KEY" ...

# 方式二：Authorization 頭
curl -H "Authorization: Bearer YOUR_API_KEY" ...
```

### 管理 API Keys

```bash
# 創建新的 API Key
curl -X POST https://api.yourdomain.com/admin/keys \
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"name": "My App Key"}'

# 列出所有 API Keys
curl -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  https://api.yourdomain.com/admin/keys

# 刪除 API Key
curl -X DELETE \
  -H "x-admin-secret: YOUR_ADMIN_SECRET" \
  https://api.yourdomain.com/admin/keys/sk_xxxxx
```

---

## 🔌 API 端點

### 基礎 URL
```
https://api.yourdomain.com
```

### 1. ASR - 語音轉文字

```http
POST /api/asr
x-api-key: YOUR_API_KEY
Content-Type: application/json

{
  "audio": "base64_encoded_audio_data"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "text": "轉錄的文字內容",
    "length": 123
  }
}
```

**示例：**
```bash
# 使用 curl
curl -X POST https://api.yourdomain.com/api/asr \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"audio": "BASE64_AUDIO_DATA"}'
```

```python
# 使用 Python
import requests
import base64

with open("audio.wav", "rb") as f:
    audio_base64 = base64.b64encode(f.read()).decode()

response = requests.post(
    "https://api.yourdomain.com/api/asr",
    headers={"x-api-key": "YOUR_API_KEY"},
    json={"audio": audio_base64}
)
print(response.json())
```

### 2. TTS - 文字轉語音

```http
POST /api/tts
x-api-key: YOUR_API_KEY
Content-Type: application/json

{
  "text": "要轉換的文字",
  "voice": "tongtong",
  "speed": 1.0,
  "return_base64": false
}
```

**參數說明：**

| 參數 | 類型 | 必填 | 預設值 | 說明 |
|------|------|------|--------|------|
| text | string | ✅ | - | 要轉換的文字（最大 1024 字符） |
| voice | string | ❌ | tongtong | 語音類型 |
| speed | number | ❌ | 1.0 | 語速（範圍：0.5 - 2.0） |
| return_base64 | boolean | ❌ | false | 是否返回 base64 格式 |

**可用語音：**

| Voice | 名稱 | 風格 |
|-------|------|------|
| tongtong | 童童 | 溫暖親切（預設） |
| chuichui | 吹吹 | 活潑可愛 |
| xiaochen | 小晨 | 沈穩專業 |
| jam | Jam | 英音紳士 |
| kazi | 卡茲 | 清晰標準 |
| douji | 豆吉 | 自然流暢 |
| luodo | 羅多 | 富有感染力 |

**示例：**
```bash
# 獲取音頻文件
curl -X POST https://api.yourdomain.com/api/tts \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"text": "你好世界"}' \
  --output output.wav
```

```javascript
// JavaScript 示例
async function textToSpeech(text) {
  const response = await fetch('https://api.yourdomain.com/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'YOUR_API_KEY'
    },
    body: JSON.stringify({
      text: text,
      voice: 'tongtong',
      speed: 1.0
    })
  });

  const audioBlob = await response.blob();
  const audio = new Audio(URL.createObjectURL(audioBlob));
  audio.play();
}
```

### 3. 獲取語音列表

```http
GET /api/voices
x-api-key: YOUR_API_KEY
```

---

## 🚀 部署指南

### 環境變量配置

```bash
# .env 文件
PORT=3001
NODE_ENV=production
AUTH_ENABLED=true
API_KEYS=sk_your_api_key_here
ADMIN_SECRET=your_admin_secret_here
```

### HTTPS 證書配置

```bash
# 使用自動腳本
sudo ./scripts/setup-https.sh api.yourdomain.com

# 或手動配置
sudo certbot certonly --webroot -w /var/www/certbot -d api.yourdomain.com
```

### Nginx 配置

```bash
# 複製配置文件
sudo cp nginx/voice-api.conf /etc/nginx/conf.d/

# 添加主配置（可選，用於 rate limiting）
sudo nano /etc/nginx/nginx.conf
# 將 nginx/nginx.conf.append 的內容添加到 http 塊

# 測試並重載
sudo nginx -t && sudo systemctl reload nginx
```

### 雲服務器部署

**AWS EC2:**
```bash
# 開放安全組端口：80, 443
# 運行部署腳本
sudo ./scripts/deploy.sh api.yourdomain.com
```

**阿里雲 ECS:**
```bash
# 配置安全組規則開放 80, 443 端口
sudo ./scripts/deploy.sh api.yourdomain.com
```

**騰訊雲 CVM:**
```bash
# 配置防火牆開放 80, 443 端口
sudo ./scripts/deploy.sh api.yourdomain.com
```

---

## 📊 API 限制

| 項目 | 限制 |
|------|------|
| ASR 音頻大小 | 建議 < 10MB |
| TTS 文字長度 | 最大 1024 字符 |
| TTS 語速範圍 | 0.5 - 2.0 |
| 請求體大小 | 最大 50MB |

---

## 🐛 錯誤處理

```json
{
  "success": false,
  "error": "錯誤描述",
  "requestId": "uuid",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

| HTTP 狀態碼 | 說明 |
|------------|------|
| 400 | 請求參數錯誤 |
| 401 | API Key 無效或缺失 |
| 500 | 服務器內部錯誤 |

---

## 📁 文件結構

```
voice-api/
├── src/
│   ├── index.ts      # 主程序
│   └── test.ts       # 測試腳本
├── nginx/
│   ├── voice-api.conf      # Nginx 配置
│   └── nginx.conf.append   # Nginx 主配置補充
├── scripts/
│   ├── deploy.sh     # 完整部署腳本
│   └── setup-https.sh # HTTPS 證書腳本
├── package.json
├── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 📝 License

MIT
