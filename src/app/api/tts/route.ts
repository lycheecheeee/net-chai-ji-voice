import { NextRequest, NextResponse } from 'next/server'

// Cantonese.ai API 配置
const CANTONESE_API_KEY = process.env.CANTONESE_API_KEY || ''
const CANTONESE_API_URL = 'https://www.cantonese.ai/api/tts'

// 可用的語音選項
const AVAILABLE_VOICES = ['cantonese_female', 'cantonese_male'] as const
type VoiceType = typeof AVAILABLE_VOICES[number]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voice = 'cantonese_female', speed = 0.95 } = body

    if (!text) {
      return NextResponse.json(
        { error: '缺少文字內容' },
        { status: 400 }
      )
    }

    // 驗證文字長度
    if (text.length > 500) {
      return NextResponse.json(
        { error: '文字長度超過限制（最大 500 字符）' },
        { status: 400 }
      )
    }

    if (!CANTONESE_API_KEY) {
      return NextResponse.json(
        { error: 'TTS API Key 未配置' },
        { status: 500 }
      )
    }

    // 驗證語音類型
    const validVoice: VoiceType = AVAILABLE_VOICES.includes(voice) ? voice : 'cantonese_female'

    console.log('🎵 Cantonese.ai TTS:', text.slice(0, 50))

    const response = await fetch(CANTONESE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CANTONESE_API_KEY}`,
      },
      body: JSON.stringify({
        text: text,
        voice: validVoice,
        speed: Math.max(0.5, Math.min(1.5, speed)),
        pitch: 0,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Cantonese.ai error:', errorText)
      throw new Error(`Cantonese.ai API error: ${response.status}`)
    }

    const data = await response.json()

    // Cantonese.ai 返回 audio_url 或 audio_base64
    if (data.audio_url) {
      // 下載音頻文件
      console.log('📥 下載音頻:', data.audio_url)
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
      // 直接返回 base64 解碼後的音頻
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
      console.error('Cantonese.ai 回應格式錯誤:', data)
      throw new Error('Cantonese.ai 回應格式錯誤')
    }

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

// GET 端點：獲取可用語音列表
export async function GET() {
  return NextResponse.json({
    voices: [
      { id: 'cantonese_female', name: '粵語女聲', description: '標準粵語女聲' },
      { id: 'cantonese_male', name: '粵語男聲', description: '標準粵語男聲' },
    ],
    provider: 'Cantonese.ai',
    maxLength: 500,
  })
}
