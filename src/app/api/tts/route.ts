import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

// 可用的語音選項
const AVAILABLE_VOICES = ['tongtong', 'chuichui', 'xiaochen', 'jam', 'kazi', 'douji', 'luodo'] as const
type VoiceType = typeof AVAILABLE_VOICES[number]

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { text, voice = 'tongtong', speed = 1.0 } = body

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

    // 驗證語音類型
    const validVoice: VoiceType = AVAILABLE_VOICES.includes(voice) ? voice : 'tongtong'

    const zai = await ZAI.create()

    const response = await zai.audio.tts.create({
      input: text,
      voice: validVoice,
      speed: validSpeed,
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
