import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// API 配置
const CANTONESE_API_KEY = process.env.CANTONESE_API_KEY || ''
const CANTONESE_API_URL = 'https://cantonese.ai/api/tts'

// z.ai API 配置 - 從環境變量讀取
const ZAI_BASE_URL = process.env.ZAI_BASE_URL || ''
const ZAI_API_KEY = process.env.ZAI_API_KEY || ''
const ZAI_CHAT_ID = process.env.ZAI_CHAT_ID || ''
const ZAI_TOKEN = process.env.ZAI_TOKEN || ''
const ZAI_USER_ID = process.env.ZAI_USER_ID || ''

// Cantonese.ai 語音 ID
const CANTONESE_VOICE_IDS = {
  cantonese_female: '91b6d38b-d4e9-42ce-bf3c-9793741c0d18',
  cantonese_male: '91b6d38b-d4e9-42ce-bf3c-9793741c0d18',
} as const

const ZAI_VOICES = ['tongtong', 'chuichui', 'xiaochen', 'jam', 'kazi', 'douji', 'luodo'] as const

// TTS 請求參數接口
interface TTSRequest {
  text: string
  voice?: string
  speed?: number
  pitch?: number
  format?: 'wav' | 'mp3'
  enhance?: boolean
  turbo?: boolean
  timestamps?: boolean
  duration?: number
  language?: 'cantonese' | 'english' | 'mandarin'
}

// TTS 響應接口（帶時間戳）
interface TTSResponseWithTimestamps {
  file: string          // Base64 編碼的音頻
  request_id: string
  srt_timestamp: string // SRT 格式字幕
  timestamps: Array<{
    start: number
    end: number
    text: string
  }>
}

export async function POST(request: NextRequest) {
  try {
    const body: TTSRequest = await request.json()
    const {
      text,
      voice = 'cantonese_female',
      speed = 1.0,
      pitch = 0,
      format = 'wav',
      enhance = true,      // 默認啟用音頻增強
      turbo = true,        // 默認啟用快速模式
      timestamps = false,  // 是否返回時間戳
      duration,
      language = 'cantonese'
    } = body

    if (!text) {
      return NextResponse.json(
        { error: '缺少文字內容' },
        { status: 400 }
      )
    }

    // API 支持最大 5000 字符
    if (text.length > 5000) {
      return NextResponse.json(
        { error: '文字長度超過限制（最大 5000 字符）' },
        { status: 400 }
      )
    }

    // 驗證參數範圍
    const validSpeed = Math.max(0.5, Math.min(3.0, speed))
    const validPitch = Math.max(-12, Math.min(12, pitch))

    // 優先使用 Cantonese.ai（如果有 API Key）
    if (CANTONESE_API_KEY) {
      try {
        return await handleCantoneseTTS({
          text,
          voice,
          speed: validSpeed,
          pitch: validPitch,
          format,
          enhance,
          turbo,
          timestamps,
          duration,
          language
        })
      } catch (error) {
        console.error('Cantonese.ai 失敗:', error)
      }
    }

    // 嘗試 z.ai API（如果有環境變量配置）
    if (ZAI_BASE_URL && ZAI_API_KEY) {
      try {
        return await handleZAIAPITTS(text, voice, validSpeed)
      } catch (error) {
        console.error('z.ai API 失敗:', error)
      }
    }

    // 最後嘗試 z.ai SDK（本地開發環境）
    return await handleZAISDKTTS(text, voice, validSpeed)

  } catch (error) {
    console.error('TTS Error:', error)

    if (error instanceof Error) {
      return NextResponse.json(
        { error: `語音合成失敗: ${error.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: '語音合成失敗，請稍後再試' },
      { status: 500 }
    )
  }
}

// Cantonese.ai TTS（完整功能版本）
async function handleCantoneseTTS(params: {
  text: string
  voice: string
  speed: number
  pitch: number
  format: 'wav' | 'mp3'
  enhance: boolean
  turbo: boolean
  timestamps: boolean
  duration?: number
  language: string
}) {
  const { text, voice, speed, pitch, format, enhance, turbo, timestamps, duration, language } = params

  console.log('🎵 使用 Cantonese.ai TTS:', {
    text: text.slice(0, 50),
    speed,
    pitch,
    format,
    enhance,
    turbo,
    timestamps
  })

  const voiceId = CANTONESE_VOICE_IDS[voice as keyof typeof CANTONESE_VOICE_IDS]
    || CANTONESE_VOICE_IDS.cantonese_female

  // 構建請求體
  const requestBody: Record<string, unknown> = {
    api_key: CANTONESE_API_KEY,
    text: text,
    frame_rate: '24000',
    speed: speed,
    pitch: pitch,
    language: language,
    output_extension: format,
    voice_id: voiceId,
    should_enhance: enhance,                              // 音頻增強
    should_use_turbo_model: turbo,                        // 快速模式
    should_return_timestamp: timestamps,                  // 返回時間戳
    should_convert_from_simplified_to_traditional: true,  // 簡體轉繁體
  }

  // 可選：目標時長
  if (duration) {
    requestBody.duration = duration
  }

  const response = await fetch(CANTONESE_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Cantonese.ai error:', errorText)

    // 處理特定錯誤碼
    if (response.status === 413) {
      return NextResponse.json(
        { error: '文字超過最大長度（5000字符）' },
        { status: 413 }
      )
    }
    if (response.status === 429) {
      return NextResponse.json(
        { error: '請求過於頻繁，請稍後再試' },
        { status: 429 }
      )
    }

    throw new Error(`Cantonese.ai API error: ${response.status}`)
  }

  // 根據是否請求時間戳，返回不同格式
  if (timestamps) {
    // 返回 JSON 格式（包含時間戳和 Base64 音頻）
    const result: TTSResponseWithTimestamps = await response.json()

    console.log(`✅ Cantonese.ai 成功 (帶時間戳): ${result.file.length} bytes`)
    console.log(`📝 SRT 字幕: ${result.srt_timestamp.slice(0, 100)}...`)

    return NextResponse.json({
      success: true,
      audioBase64: result.file,
      requestId: result.request_id,
      srtTimestamp: result.srt_timestamp,
      timestamps: result.timestamps,
      format: format,
      duration: result.timestamps?.[result.timestamps.length - 1]?.end || 0
    })
  } else {
    // 直接返回音頻數據
    const arrayBuffer = await response.arrayBuffer()
    const buffer = Buffer.from(new Uint8Array(arrayBuffer))

    console.log(`✅ Cantonese.ai 成功: ${buffer.length} bytes`)

    const contentType = format === 'mp3' ? 'audio/mpeg' : 'audio/wav'

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    })
  }
}

// z.ai TTS（直接使用 fetch API）
async function handleZAIAPITTS(text: string, voice: string, speed: number) {
  console.log('🎵 使用 z.ai API TTS:', text.slice(0, 50))

  const validVoice = ZAI_VOICES.includes(voice as any) ? voice : 'tongtong'

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${ZAI_API_KEY}`,
  }

  if (ZAI_CHAT_ID) headers['X-Chat-Id'] = ZAI_CHAT_ID
  if (ZAI_TOKEN) headers['X-Token'] = ZAI_TOKEN
  if (ZAI_USER_ID) headers['X-User-Id'] = ZAI_USER_ID

  const response = await fetch(`${ZAI_BASE_URL}/audio/tts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      input: text,
      voice: validVoice,
      speed: speed,
      response_format: 'wav',
      stream: false
    }),
  })

  if (!response.ok) {
    throw new Error(`z.ai API error: ${response.status}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(new Uint8Array(arrayBuffer))

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-cache',
    },
  })
}

// z.ai SDK TTS（本地開發環境）
async function handleZAISDKTTS(text: string, voice: string, speed: number) {
  console.log('🎵 使用 z.ai SDK TTS:', text.slice(0, 50))

  const validVoice = ZAI_VOICES.includes(voice as any) ? voice : 'tongtong'

  const zai = await ZAI.create()

  const response = await zai.audio.tts.create({
    input: text,
    voice: validVoice as any,
    speed: speed,
    response_format: 'wav',
    stream: false
  })

  const arrayBuffer = await response.arrayBuffer()
  const buffer = Buffer.from(new Uint8Array(arrayBuffer))

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'audio/wav',
      'Content-Length': buffer.length.toString(),
      'Cache-Control': 'no-cache',
    },
  })
}

// GET 端點
export async function GET() {
  return NextResponse.json({
    voices: [
      { id: 'cantonese_female', name: '粵語女聲', provider: 'Cantonese.ai', voice_id: CANTONESE_VOICE_IDS.cantonese_female },
      { id: 'cantonese_male', name: '粵語男聲', provider: 'Cantonese.ai', voice_id: CANTONESE_VOICE_IDS.cantonese_male },
      ...ZAI_VOICES.map(v => ({
        id: v,
        name: v,
        provider: 'z.ai'
      })),
    ],
    features: {
      audioEnhancement: 'should_enhance - 音頻增強，提高音質',
      turboMode: 'should_use_turbo_model - 快速合成模式',
      timestamps: 'should_return_timestamp - 返回 SRT 字幕和時間戳',
      simplifiedToTraditional: '自動將簡體中文轉換為繁體',
      formats: ['wav', 'mp3'],
      languages: ['cantonese', 'english', 'mandarin'],
    },
    parameters: {
      speed: { min: 0.5, max: 3.0, default: 1.0 },
      pitch: { min: -12, max: 12, default: 0 },
      duration: '可選目標時長（秒）',
    },
    configStatus: {
      cantonese: CANTONESE_API_KEY ? 'configured' : 'not configured',
      zaiApi: ZAI_BASE_URL && ZAI_API_KEY ? 'configured' : 'not configured',
      zaiSdk: 'available (requires .z-ai-config)',
    },
    maxLength: 5000,
    usage: {
      basic: 'POST /api/tts with { "text": "你的文字" }',
      advanced: 'POST /api/tts with { "text": "...", "speed": 1.2, "pitch": 2, "enhance": true, "turbo": true }',
      withTimestamps: 'POST /api/tts with { "text": "...", "timestamps": true } - 返回 JSON 含時間戳',
    }
  })
}
