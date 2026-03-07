import { NextRequest, NextResponse } from 'next/server'

// ASR (語音識別) 暫時不支援
// 如需語音識別功能，請配置以下環境變量：
// - GOOGLE_APPLICATION_CREDENTIALS (Google Cloud Speech-to-Text)
// - AZURE_SPEECH_KEY (Azure Speech Services)
// - OPENAI_API_KEY (OpenAI Whisper)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { error: '請提供音頻文件' },
        { status: 400 }
      )
    }

    // 目前不支援 ASR
    return NextResponse.json({
      error: '語音識別功能暫時不支援',
      text: '',
      suggestion: '請使用文字輸入',
    })

  } catch (error) {
    console.error('ASR Error:', error)

    return NextResponse.json(
      { error: '語音識別失敗，請稍後再試', text: '' },
      { status: 500 }
    )
  }
}

// GET 端點：獲取 ASR 狀態
export async function GET() {
  return NextResponse.json({
    available: false,
    message: '語音識別功能暫時不支援，請使用文字輸入',
    supportedFormats: ['wav', 'mp3', 'webm', 'ogg'],
  })
}
