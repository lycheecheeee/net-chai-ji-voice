import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { audio } = body

    if (!audio) {
      return NextResponse.json(
        { error: '缺少音頻數據' },
        { status: 400 }
      )
    }

    const zai = await ZAI.create()

    const response = await zai.audio.asr.create({
      file_base64: audio
    })

    return NextResponse.json({ 
      text: response.text || '',
      success: true 
    })
  } catch (error) {
    console.error('ASR Error:', error)
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `語音識別失敗: ${error.message}` },
        { status: 500 }
      )
    }
    
    return NextResponse.json(
      { error: '語音識別失敗，請稍後再試' },
      { status: 500 }
    )
  }
}
