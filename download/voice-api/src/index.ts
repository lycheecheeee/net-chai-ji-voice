import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import crypto from 'crypto';
import ZAI from 'z-ai-web-dev-sdk';

// ============== Types ==============
interface AsrRequest {
  audio: string; // base64 encoded audio
}

interface TtsRequest {
  text: string;
  voice?: 'tongtong' | 'chuichui' | 'xiaochen' | 'jam' | 'kazi' | 'douji' | 'luodo';
  speed?: number; // 0.5 - 2.0
  return_base64?: boolean; // if true, return base64 instead of binary
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  requestId: string;
  timestamp: string;
}

interface ApiKeyInfo {
  key: string;
  name: string;
  createdAt: string;
  lastUsed?: string;
  requestCount: number;
}

// ============== Configuration ==============
const PORT = process.env.PORT || 3001;
const API_KEY_HEADER = 'x-api-key';
const AUTH_ENABLED = process.env.AUTH_ENABLED !== 'false'; // Default: enabled

// API Keys storage (in production, use a database)
// You can set multiple keys via environment variable: API_KEYS=key1,key2,key3
// Or use the admin API to manage keys
let apiKeys: Map<string, ApiKeyInfo> = new Map();

// Initialize API keys from environment
function initApiKeys() {
  const envKeys = process.env.API_KEYS;
  if (envKeys) {
    envKeys.split(',').forEach((key, index) => {
      const trimmedKey = key.trim();
      if (trimmedKey) {
        apiKeys.set(trimmedKey, {
          key: trimmedKey,
          name: `Env Key ${index + 1}`,
          createdAt: new Date().toISOString(),
          requestCount: 0
        });
      }
    });
  }

  // If no keys configured, generate a default one for development
  if (apiKeys.size === 0 && process.env.NODE_ENV !== 'production') {
    const defaultKey = `dev_${crypto.randomBytes(16).toString('hex')}`;
    apiKeys.set(defaultKey, {
      key: defaultKey,
      name: 'Default Development Key',
      createdAt: new Date().toISOString(),
      requestCount: 0
    });
    console.log('');
    console.log('⚠️  開發模式：已自動生成 API Key（生產環境請設置 API_KEYS 環境變量）');
    console.log(`🔑 API Key: ${defaultKey}`);
    console.log('');
  }
}

// ============== Available voices ==============
const AVAILABLE_VOICES = ['tongtong', 'chuichui', 'xiaochen', 'jam', 'kazi', 'douji', 'luodo'] as const;
type VoiceType = typeof AVAILABLE_VOICES[number];

// ============== Express App ==============
const app = express();

// ============== ZAI instance (lazy initialization) ==============
let zaiInstance: Awaited<ReturnType<typeof ZAI.create>> | null = null;

async function getZAI() {
  if (!zaiInstance) {
    zaiInstance = await ZAI.create();
  }
  return zaiInstance;
}

// ============== Helper Functions ==============
function createResponse<T>(success: boolean, data?: T, error?: string, requestId?: string): ApiResponse<T> {
  return {
    success,
    data,
    error,
    requestId: requestId || uuidv4(),
    timestamp: new Date().toISOString()
  };
}

function generateApiKey(): string {
  return `sk_${crypto.randomBytes(24).toString('hex')}`;
}

function isValidApiKey(key: string): boolean {
  return apiKeys.has(key);
}

function updateKeyUsage(key: string) {
  const keyInfo = apiKeys.get(key);
  if (keyInfo) {
    keyInfo.lastUsed = new Date().toISOString();
    keyInfo.requestCount++;
    apiKeys.set(key, keyInfo);
  }
}

// ============== Middleware ==============

// CORS
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', API_KEY_HEADER]
}));

// Body parser
app.use(express.json({ limit: '50mb' }));

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const requestId = uuidv4();
  (req as any).requestId = requestId;
  console.log(`[${new Date().toISOString()}] [${requestId}] ${req.method} ${req.path}`);
  next();
});

// API Key Authentication Middleware
const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Skip auth for health check and root
  if (req.path === '/health' || req.path === '/') {
    return next();
  }

  // Skip auth for admin routes (they have their own auth)
  if (req.path.startsWith('/admin')) {
    return next();
  }

  // If auth is disabled, skip
  if (!AUTH_ENABLED) {
    return next();
  }

  // Get API key from header
  const apiKey = req.headers[API_KEY_HEADER] as string || 
                 req.headers['authorization']?.replace('Bearer ', '');

  if (!apiKey) {
    return res.status(401).json(createResponse(
      false, 
      undefined, 
      '缺少 API Key。請在請求頭添加 x-api-key 或 Authorization: Bearer <api-key>', 
      (req as any).requestId
    ));
  }

  if (!isValidApiKey(apiKey)) {
    console.log(`[AUTH] Invalid API key attempt: ${apiKey.substring(0, 8)}...`);
    return res.status(401).json(createResponse(
      false, 
      undefined, 
      '無效的 API Key', 
      (req as any).requestId
    ));
  }

  // Update key usage
  updateKeyUsage(apiKey);
  (req as any).apiKey = apiKey;

  next();
};

// Apply auth middleware to API routes
app.use('/api', authMiddleware);

// ============== Admin API (for managing API keys) ==============

// Admin auth middleware (uses ADMIN_SECRET from env)
const adminAuthMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const adminSecret = process.env.ADMIN_SECRET;
  
  if (!adminSecret) {
    return res.status(500).json(createResponse(
      false, 
      undefined, 
      'ADMIN_SECRET 未配置', 
      (req as any).requestId
    ));
  }

  const providedSecret = req.headers['x-admin-secret'] as string;
  
  if (providedSecret !== adminSecret) {
    return res.status(401).json(createResponse(
      false, 
      undefined, 
      '無效的管理員密鑰', 
      (req as any).requestId
    ));
  }

  next();
};

// List all API keys
app.get('/admin/keys', adminAuthMiddleware, (req: Request, res: Response) => {
  const keys = Array.from(apiKeys.values()).map(k => ({
    key: k.key.substring(0, 12) + '...', // Masked
    name: k.name,
    createdAt: k.createdAt,
    lastUsed: k.lastUsed,
    requestCount: k.requestCount
  }));

  res.json(createResponse(true, { keys, total: keys.length }, undefined, (req as any).requestId));
});

// Create new API key
app.post('/admin/keys', adminAuthMiddleware, (req: Request, res: Response) => {
  const { name = 'New Key' } = req.body;
  
  const newKey = generateApiKey();
  apiKeys.set(newKey, {
    key: newKey,
    name,
    createdAt: new Date().toISOString(),
    requestCount: 0
  });

  console.log(`[ADMIN] Created new API key: ${newKey.substring(0, 12)}... (name: ${name})`);

  res.status(201).json(createResponse(true, {
    key: newKey,
    name,
    createdAt: new Date().toISOString()
  }, undefined, (req as any).requestId));
});

// Delete API key
app.delete('/admin/keys/:key', adminAuthMiddleware, (req: Request, res: Response) => {
  const { key } = req.params;
  
  if (!apiKeys.has(key)) {
    return res.status(404).json(createResponse(false, undefined, 'API Key 不存在', (req as any).requestId));
  }

  apiKeys.delete(key);
  console.log(`[ADMIN] Deleted API key: ${key.substring(0, 12)}...`);

  res.json(createResponse(true, { deleted: true }, undefined, (req as any).requestId));
});

// ============== Public Endpoints ==============

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json(createResponse(true, { 
    status: 'ok', 
    service: 'Net 知己 Voice API',
    authEnabled: AUTH_ENABLED 
  }));
});

// Root
app.get('/', (req: Request, res: Response) => {
  res.json(createResponse(true, {
    service: 'Net 知己 AI 語音 API',
    version: '1.1.0',
    authEnabled: AUTH_ENABLED,
    endpoints: {
      'POST /api/asr': '語音轉文字 (Speech to Text)',
      'POST /api/tts': '文字轉語音 (Text to Speech)',
      'GET /api/voices': '獲取可用語音列表',
      'GET /health': '健康檢查'
    },
    voices: AVAILABLE_VOICES,
    authentication: AUTH_ENABLED ? 'API Key required (x-api-key header)' : 'Disabled'
  }));
});

// ============== ASR API (Speech to Text) ==============
app.post('/api/asr', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;

  try {
    const { audio } = req.body as AsrRequest;

    if (!audio) {
      return res.status(400).json(createResponse(false, undefined, '缺少音頻數據 (audio field is required)', requestId));
    }

    console.log(`[${requestId}] ASR request received, audio length: ${audio.length}`);

    const zai = await getZAI();

    const response = await zai.audio.asr.create({
      file_base64: audio
    });

    console.log(`[${requestId}] ASR completed, text length: ${response.text?.length || 0}`);

    return res.json(createResponse(true, {
      text: response.text || '',
      length: response.text?.length || 0
    }, undefined, requestId));

  } catch (error) {
    console.error(`[${requestId}] ASR Error:`, error);
    const errorMessage = error instanceof Error ? error.message : '語音識別失敗';
    return res.status(500).json(createResponse(false, undefined, `語音識別失敗: ${errorMessage}`, requestId));
  }
});

// ============== TTS API (Text to Speech) ==============
app.post('/api/tts', async (req: Request, res: Response) => {
  const requestId = (req as any).requestId;

  try {
    const { text, voice = 'tongtong', speed = 1.0, return_base64 = false } = req.body as TtsRequest;

    if (!text) {
      return res.status(400).json(createResponse(false, undefined, '缺少文字內容 (text field is required)', requestId));
    }

    if (text.length > 1024) {
      return res.status(400).json(createResponse(false, undefined, '文字長度超過限制（最大 1024 字符）', requestId));
    }

    const validSpeed = Math.max(0.5, Math.min(2.0, speed));
    const validVoice: VoiceType = AVAILABLE_VOICES.includes(voice as VoiceType) ? voice as VoiceType : 'tongtong';

    console.log(`[${requestId}] TTS request: text="${text.substring(0, 50)}..." voice=${validVoice} speed=${validSpeed}`);

    const zai = await getZAI();

    const response = await zai.audio.tts.create({
      input: text,
      voice: validVoice,
      speed: validSpeed,
      response_format: 'wav',
      stream: false
    });

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(new Uint8Array(arrayBuffer));

    console.log(`[${requestId}] TTS completed, audio size: ${buffer.length} bytes`);

    if (return_base64) {
      return res.json(createResponse(true, {
        audio: buffer.toString('base64'),
        format: 'wav',
        size: buffer.length,
        voice: validVoice,
        speed: validSpeed
      }, undefined, requestId));
    } else {
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', buffer.length.toString());
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('X-Request-Id', requestId);
      return res.send(buffer);
    }

  } catch (error) {
    console.error(`[${requestId}] TTS Error:`, error);
    const errorMessage = error instanceof Error ? error.message : '語音合成失敗';
    return res.status(500).json(createResponse(false, undefined, `語音合成失敗: ${errorMessage}`, requestId));
  }
});

// Get Available Voices
app.get('/api/voices', (req: Request, res: Response) => {
  const voices = [
    { id: 'tongtong', name: '童童', description: '溫暖親切', language: 'zh-CN' },
    { id: 'chuichui', name: '吹吹', description: '活潑可愛', language: 'zh-CN' },
    { id: 'xiaochen', name: '小晨', description: '沈穩專業', language: 'zh-CN' },
    { id: 'jam', name: 'Jam', description: '英音紳士', language: 'en-US' },
    { id: 'kazi', name: '卡茲', description: '清晰標準', language: 'zh-CN' },
    { id: 'douji', name: '豆吉', description: '自然流暢', language: 'zh-CN' },
    { id: 'luodo', name: '羅多', description: '富有感染力', language: 'zh-CN' }
  ];

  res.json(createResponse(true, { voices }, undefined, (req as any).requestId));
});

// ============== Error Handling ==============
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json(createResponse(false, undefined, `服務器錯誤: ${err.message}`, (req as any).requestId));
});

// ============== Start Server ==============
initApiKeys();

app.listen(PORT, () => {
  console.log('');
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     Net 知己 AI 語音 API 服務 v1.1.0                    ║');
  console.log('╠════════════════════════════════════════════════════════╣');
  console.log(`║  Server: http://localhost:${PORT}                         ║`);
  console.log(`║  Auth: ${AUTH_ENABLED ? 'Enabled ✅' : 'Disabled ❌'}                                      ║`);
  console.log('║                                                        ║');
  console.log('║  API Endpoints:                                        ║');
  console.log('║  • POST /api/asr  - 語音轉文字                         ║');
  console.log('║  • POST /api/tts  - 文字轉語音                         ║');
  console.log('║  • GET  /api/voices - 語音列表                         ║');
  console.log('║                                                        ║');
  console.log('║  Admin Endpoints:                                      ║');
  console.log('║  • GET  /admin/keys - 列出 API Keys                    ║');
  console.log('║  • POST /admin/keys - 創建 API Key                     ║');
  console.log('║  • DELETE /admin/keys/:key - 刪除 API Key              ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log('');
});

export default app;
