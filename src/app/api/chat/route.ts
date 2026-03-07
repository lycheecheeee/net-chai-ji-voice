import { NextRequest, NextResponse } from 'next/server'

// ZAI SDK 配置 - 從環境變量讀取
const getZAIConfig = () => ({
  baseUrl: process.env.ZAI_BASE_URL || 'https://api.z.ai/v1',
  apiKey: process.env.ZAI_API_KEY || '',
})

// 簡化的 ZAI 客戶端 (直接使用 fetch)
async function zaiChatCompletion(messages: Array<{ role: string; content: string }>, options: any = {}) {
  const config = getZAIConfig()

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      messages,
      ...options,
    }),
  })

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`)
  }

  return response.json()
}

const SYSTEM_PROMPT = `你係「Net 仔」，一個體貼嘅財經 AI 助手。你嘅特點：

1. 用廣東話回覆，親切友善
2. 關心用戶嘅財務狀況同風險承受能力
3. 提供理性、客觀嘅財經分析
4. 遇到高風險投資行為時會溫馨提示
5. 用簡單易明嘅方式解釋複雜嘅財經概念
6. 永遠唔會慫恿用戶做高風險投資
7. 鼓勵用戶理性投資，分散風險

回覆格式：
- 簡潔直接，唔好太長篇大論
- 用廣東話口語，令用戶覺得親切
- 可以用表情符號令對話更生動
- 如果用戶問股票，要提醒投資有風險

記住：你係一個有同理心嘅 AI 助手，要真正關心用戶嘅財務健康。`

export async function POST(request: NextRequest) {
  try {
    const { text, sessionId } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: '請提供訊息內容' },
        { status: 400 }
      )
    }

    const completion = await zaiChatCompletion([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: text }
    ], {
      temperature: 0.7,
      max_tokens: 500,
    })

    const content = completion.choices?.[0]?.message?.content || '抱歉，我暫時無法回應，請稍後再試。'

    // Detect emotion from response (simplified)
    let emotion = 'neutral'
    if (content.includes('開心') || content.includes('高興') || content.includes('好') || content.includes('👍')) {
      emotion = 'happy'
    } else if (content.includes('擔心') || content.includes('小心') || content.includes('風險') || content.includes('⚠️')) {
      emotion = 'concerned'
    } else if (content.includes('興奮') || content.includes('機會') || content.includes('利好')) {
      emotion = 'excited'
    }

    return NextResponse.json({
      content,
      emotion,
      sessionId: sessionId || `session_${Date.now()}`,
    })
  } catch (error: any) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: '發生錯誤，請稍後再試', content: '抱歉，發生錯誤，請稍後再試。' },
      { status: 500 }
    )
  }
}
