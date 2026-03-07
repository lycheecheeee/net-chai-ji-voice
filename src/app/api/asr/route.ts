import { NextRequest, NextResponse } from 'next/server'

// ZAI SDK 配置 - 從環境變量讀取
const getZAIConfig = () => ({
  baseUrl: process.env.ZAI_BASE_URL || 'https://api.z.ai/v1',
  apiKey: process.env.ZAI_API_KEY || '',
})

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const language = formData.get('language') as string || 'yue' // 粵語

    if (!audioFile) {
      return NextResponse.json(
        { error: '請提供音頻文件' },
        { status: 400 }
      )
    }

    // 驗證文件類型
    const validTypes = ['audio/wav', 'audio/mp3', 'audio/mpeg', 'audio/webm', 'audio/ogg']
    if (!validTypes.includes(audioFile.type) && !audioFile.name.match(/\.(wav|mp3|webm|ogg)$/i)) {
      return NextResponse.json(
        { error: '不支援的音頻格式，請使用 WAV、MP3、WebM 或 OGG' },
        { status: 400 }
      )
    }

    // 驗證文件大小 (最大 25MB)
    if (audioFile.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: '音頻文件太大，最大支援 25MB' },
        { status: 400 }
      )
    }

    const config = getZAIConfig()

    // 準備 FormData
    const apiFormData = new FormData()
    apiFormData.append('file', audioFile)
    apiFormData.append('language', language)

    const response = await fetch(`${config.baseUrl}/audio/asr`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
      body: apiFormData,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('ASR API error:', errorText)
      throw new Error(`ASR API error: ${response.status}`)
    }

    const result = await response.json()

    return NextResponse.json({
      text: result.text || '',
      confidence: result.confidence || 0.9,
      duration: result.duration || 0,
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
