import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// API 配置
const CANTONESE_API_KEY = process.env.CANTONESE_API_KEY || ''
const CANTONESE_API_URL = 'https://cantonese.ai/api/tts'

// 可用的語音選項
const CANTONESE_VOICES = ['cantonese_female', 'cantonese_male'] as const
const ZAI_VOICES = ['tongtong', 'chuichui', 'xiaochen', 'jam', 'kazi', 'douji', 'luodo'] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voice = 'tongtong', speed = 0.95 } = body

    if (!text) {
      return NextResponse.json(
        { error: '缺少文字內容' },
        { status: 400 }
      )
    }

    // 驗證文字長度
    if (text.length > 1024) {
      return NextResponse.json(
        { error: '文字長度超過限制（最大 1024 字符）' },
        { status: 400 }
      )
    }

    // 驗證語速
    const validSpeed = Math.max(0.5, Math.min(2.0, speed))

    // 判斷使用哪個 TTS 服務
    const isCantoneseVoice = CANTONESE_VOICES.includes(voice as any)

    // 如果指定 Cantonese 語音且有 API Key，使用 Cantonese.ai
    if (isCantoneseVoice && CANTONESE_API_KEY) {
      return await handleCantoneseTTS(text, voice, validSpeed)
    }

    // 否則使用 z.ai SDK
    return await handleZAITTS(text, voice, validSpeed)

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

// Cantonese.ai TTS
async function handleCantoneseTTS(text: string, voice: string, speed: number) {
  console.log('🎵 使用 Cantonese.ai TTS:', text.slice(0, 50))

  try {
    const response = await fetch(CANTONESE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CANTONESE_API_KEY}`,
      },
      body: JSON.stringify({
        text: text,
        voice: voice,
        speed: speed,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cantonese.ai error:', errorText)
      throw new Error(`Cantonese.ai API error: ${response.status}`)
    }

    const data = await response.json()

    // 處理返回的音頻
    if (data.audio_url) {
      const audioResponse = await fetch(data.audio_url)
      if (!audioResponse.ok) {
        throw new Error('下載音頻失敗')
      }
      const arrayBuffer = await audioResponse.arrayBuffer()
      const buffer = Buffer.from(new Uint8Array(arrayBuffer))

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=3600',
        },
      })
    } else if (data.audio_base64 || data.audioBase64) {
      const base64 = data.audio_base64 || data.audioBase64
      const buffer = Buffer.from(base64, 'base64')

      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': buffer.length.toString(),
          'Cache-Control': 'public, max-age=3600',
        },
      })
    } else {
      throw new Error('Cantonese.ai 回應格式錯誤')
    }
  } catch (error) {
    console.error('Cantonese.ai TTS 失敗，嘗試使用 z.ai:', error)
    // Fallback to z.ai
    return await handleZAITTS(text, 'tongtong', speed)
  }
}

// z.ai TTS
async function handleZAITTS(text: string, voice: string, speed: number) {
  console.log('🎵 使用 z.ai TTS:', text.slice(0, 50))

  const validVoice = ZAI_VOICES.includes(voice as any) ? voice : 'tongtong'

  const zai = await ZAI.create()

  const response = await zai.audio.tts.create({
    input: text,
    voice: validVoice as any,
    speed: speed,
    response_format: 'wav',
    stream: false
  })

  // 獲取音頻數據
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

// GET 端點：獲取可用語音列表
export async function GET() {
  return NextResponse.json({
    voices: [
      ...CANTONESE_VOICES.map(v => ({
        id: v,
        name: v === 'cantonese_female' ? '粵語女聲' : '粵語男聲',
        provider: 'Cantonese.ai'
      })),
      ...ZAI_VOICES.map(v => ({
        id: v,
        name: v,
        provider: 'z.ai'
      })),
    ],
    cantoneseApiKey: CANTONESE_API_KEY ? 'configured' : 'not configured',
    maxLength: 1024,
  })
}
