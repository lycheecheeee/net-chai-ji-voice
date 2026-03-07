import { NextRequest, NextResponse } from 'next/server'

// BigModel API 配置
const BIGMODEL_API_KEY = process.env.BIGMODEL_API_KEY || ''
const BIGMODEL_BASE_URL = 'https://open.bigmodel.cn/api/paas/v4'

// Cantonese.ai API 配置
const CANTONESE_API_KEY = process.env.CANTONESE_API_KEY || ''

// BigModel 聊天 API
async function bigModelChat(messages: Array<{ role: string; content: string }>, options: any = {}) {
  if (!BIGMODEL_API_KEY) {
    throw new Error('BIGMODEL_API_KEY 未配置')
  }

  const response = await fetch(`${BIGMODEL_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${BIGMODEL_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'glm-4',
      messages,
      ...options,
    }),
  })

  if (!response.ok) {
    throw new Error(`BigModel API error: ${response.status}`)
  }

  return response.json()
}

// 節目類型定義
type BroadcastType = 'finance_morning' | 'finance_opening' | 'finance_noon' |
  'finance_closing' | 'finance_us' | 'finance_night' |
  'general_news' | 'weekend_music' | 'overnight'

interface RadioRequest {
  newsTitle: string
  newsDescription?: string
  broadcastType: string
  hour: number
  financeData?: {
    hsi?: string
    hscei?: string
    techIndex?: string
    usdHkd?: string
    gold?: string
    oil?: string
    bitcoin?: string
    dowFuture?: string
    nasdaqFuture?: string
  }
  voice?: string
}

interface RadioResponse {
  success: boolean
  broadcastType: BroadcastType
  cantoneseScript: string
  audioBase64?: string
  programName?: string
  error?: string
}

// 節目編排表
const PROGRAM_SCHEDULE: Record<number, { name: string; type: BroadcastType }> = {
  0: { name: '深夜財經回顧', type: 'finance_night' },
  1: { name: '凌晨音樂', type: 'overnight' },
  2: { name: '深夜音樂廊', type: 'overnight' },
  3: { name: '午夜輕音樂', type: 'overnight' },
  4: { name: '凌晨音樂', type: 'overnight' },
  5: { name: '清晨音樂', type: 'overnight' },
  6: { name: '早晨新聞', type: 'general_news' },
  7: { name: '晨早財經速報', type: 'finance_morning' },
  8: { name: '上班路上', type: 'general_news' },
  9: { name: '開市大直播', type: 'finance_opening' },
  10: { name: '熱門話題', type: 'general_news' },
  11: { name: '音樂早晨', type: 'weekend_music' },
  12: { name: '午間新聞財經', type: 'finance_noon' },
  13: { name: '午後音樂', type: 'weekend_music' },
  14: { name: '下午茶時間', type: 'general_news' },
  15: { name: '音樂下午茶', type: 'weekend_music' },
  16: { name: '收市檢閱', type: 'finance_closing' },
  17: { name: '放工前奏', type: 'weekend_music' },
  18: { name: '晚間新聞', type: 'general_news' },
  19: { name: '今日焦點', type: 'general_news' },
  20: { name: '美股前哨', type: 'finance_us' },
  21: { name: '夜音樂', type: 'weekend_music' },
  22: { name: '環球財經夜', type: 'finance_night' },
  23: { name: '夜傾情', type: 'general_news' },
}

// 獲取預設腳本
function getDefaultScript(type: BroadcastType, title: string, hour: number): string {
  const defaults: Record<BroadcastType, string> = {
    finance_morning: `早晨！晨早財經速報，為你睇實市場。恆生指數最新走勢，外圍市場表現，金價匯率重點。開市前最後消息，留意9點開市大直播。`,
    finance_opening: `開市大直播！港股正式開市，即時市況為你跟進。恆指即時點位同升跌，重磅股表現，板塊輪動焦點。即時市況，繼續為你跟進。`,
    finance_noon: `午間財經，上午市總結。恆指半日表現，成交額統計。午間焦點股份回顧，環球市場午間動態。下午市展望，留意16點收市檢閱。`,
    finance_closing: `收市檢閱！港股全日收市。恆指、國指、科指全日表現，成交總額統計。今日焦點板塊回顧，明日留意要點。今日市況到此，明日再會。`,
    finance_us: `美股前哨，預備開市。道指、標指、納指期貨走勢。歐洲市場表現，油價金價比特幣動態。今晚美國重要數據，環球財經夜22點再同你跟進。`,
    finance_night: `環球財經夜，美股表現。道指、標指、納指升跌，科技股七巨頭表現。亞太區明日預告，油價金價匯率深夜走勢。明晨財經速報7點再會。`,
    general_news: `各位聽眾朋友好，${hour}點整點新聞。${title}。詳細內容請留意相關報道。多謝收聽。`,
    weekend_music: `輕鬆一下，送上音樂。享受美好時光，稍後再見。`,
    overnight: `而家係凌晨${hour}點，深夜音樂廊。送上柔和音樂，陪你放鬆。祝你好夢。`,
  }
  return defaults[type] || defaults.general_news
}

// 生成粵語播報腳本 - 使用 BigModel
async function generateCantoneseScript(
  type: BroadcastType,
  programName: string,
  title: string,
  description: string | undefined,
  financeData: RadioRequest['financeData'] | undefined,
  hour: number
): Promise<string> {
  // 根據節目類型設定提示詞
  const prompts: Record<BroadcastType, string> = {
    finance_morning: `你係香港電台「${programName}」主播。
時間：朝早${hour}點
數據：恆指${financeData?.hsi || '待公佈'}

請用廣東話口語報道（約150-200字）：
- 開場：「早晨！${programName}，為你睇實市場」
- 恆生指數表現
- 外圍市場概況
- 結尾：「開市前最後消息，留意9點開市大直播」

只輸出純文字腳本。`,

    finance_opening: `你係香港電台「${programName}」主播。
時間：${hour}點，港股剛開市
數據：恆指${financeData?.hsi || '開市價'}

請用廣東話口語報道（約150-200字）：
- 開場：「開市大直播！港股正式開市」
- 即時恆指點位
- 重磅股表現
- 結尾：「即時市況，繼續為你跟進」

只輸出純文字腳本。`,

    finance_noon: `你係香港電台「${programName}」主播。
時間：中午${hour}點

請用廣東話口語報道（約150-200字）：
- 開場：「午間財經，上午市總結」
- 半日市表現
- 結尾：「下午市展望，留意16點收市檢閱」

只輸出純文字腳本。`,

    finance_closing: `你係香港電台「${programName}」主播。
時間：下午${hour}點，全日收市

請用廣東話口語報道（約150-200字）：
- 開場：「收市檢閱！港股全日收市」
- 恆指全日表現
- 結尾：「今日市況到此，明日再會」

只輸出純文字腳本。`,

    finance_us: `你係香港電台「${programName}」主播。
時間：晚上${hour}點，美股即將開市

請用廣東話口語報道（約150-200字）：
- 開場：「美股前哨，預備開市」
- 美股期貨走勢
- 結尾：「環球財經夜22點再同你跟進」

只輸出純文字腳本。`,

    finance_night: `你係香港電台「${programName}」主播。
時間：晚上${hour}點

請用廣東話口語報道（約150-200字）：
- 開場：「環球財經夜，美股表現」
- 美股走勢
- 結尾：「明晨財經速報7點再會」

只輸出純文字腳本。`,

    general_news: `你係香港電台「${programName}」主播。
新聞：${title}
${description ? `內容：${description}` : ''}

請用廣東話口語報道（約100-150字）：
- 開場：「各位聽眾朋友好，${hour}點整點新聞」
- 新聞重點
- 結尾：「多謝收聽」

只輸出純文字腳本。`,

    weekend_music: `你係香港電台「${programName}」DJ。
時間：${hour}點

請用廣東話口語（約50-80字）：
- 開場：「輕鬆一下，送上音樂」
- 結尾：「享受音樂，稍後再見」

只輸出純文字腳本。`,

    overnight: `你係香港電台深夜節目DJ。
時間：凌晨${hour}點

請用廣東話輕聲（約30-50字）：
- 「而家係凌晨${hour}點，深夜音樂廊」
- 「祝你好夢」

只輸出純文字腳本。`,
  }

  const prompt = prompts[type] || prompts.general_news

  try {
    const completion = await bigModelChat([
      {
        role: 'system',
        content: '你係專業粵語電台主播，只輸出純文字粵語腳本。使用地道廣東話口語。'
      },
      { role: 'user', content: prompt }
    ], {
      temperature: 0.8,
      max_tokens: 500,
    })

    const content = completion.choices?.[0]?.message?.content
    return content || getDefaultScript(type, title, hour)
  } catch (error) {
    console.error('❌ 腳本生成失敗:', error)
    return getDefaultScript(type, title, hour)
  }
}

// 語音合成 - 使用 Cantonese.ai
async function synthesizeVoice(text: string, voice: string = 'cantonese_female'): Promise<string | null> {
  if (!CANTONESE_API_KEY) {
    console.error('❌ CANTONESE_API_KEY 未配置')
    return null
  }

  // 清理文本
  const cleanText = text.replace(/\n/g, '，').trim().slice(0, 300)

  try {
    console.log('🎵 使用 Cantonese.ai 進行語音合成...')

    const response = await fetch('https://www.cantonese.ai/api/tts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CANTONESE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: cleanText,
        voice: voice,
        speed: 0.95,
      }),
    })

    if (!response.ok) {
      throw new Error(`Cantonese.ai API 錯誤: ${response.status}`)
    }

    const data = await response.json()

    if (data.audio_url) {
      const audioResponse = await fetch(data.audio_url)
      const arrayBuffer = await audioResponse.arrayBuffer()
      const buffer = Buffer.from(new Uint8Array(arrayBuffer))
      return buffer.toString('base64')
    } else if (data.audio_base64 || data.audioBase64) {
      return data.audio_base64 || data.audioBase64
    }

    return null
  } catch (error) {
    console.error('❌ Cantonese.ai 語音合成失敗:', error)
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: RadioRequest = await req.json()
    const { newsTitle, newsDescription, broadcastType, hour, financeData, voice = 'cantonese_female' } = body

    if (hour === undefined || hour < 0 || hour > 23) {
      return NextResponse.json(
        { success: false, error: '請提供有效的時間（0-23）', cantoneseScript: '', broadcastType: 'general_news' } as RadioResponse,
        { status: 400 }
      )
    }

    const program = PROGRAM_SCHEDULE[hour] || { name: '音樂連播', type: 'weekend_music' as BroadcastType }
    const finalType = broadcastType.includes('finance') ? program.type : program.type

    console.log(`📻 生成節目: ${program.name} (${hour}:00)`)

    // Step 1: 生成粵語腳本
    const cantoneseScript = await generateCantoneseScript(
      finalType, program.name, newsTitle || '今日新聞', newsDescription, financeData, hour
    )

    console.log(`📝 腳本已生成 (${cantoneseScript.length} 字)`)

    // Step 2: 合成語音
    const audioBase64 = await synthesizeVoice(cantoneseScript, voice)

    if (!audioBase64) {
      return NextResponse.json({
        success: false,
        error: '語音合成失敗',
        cantoneseScript,
        broadcastType: finalType,
        programName: program.name,
      } as RadioResponse, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      broadcastType: finalType,
      cantoneseScript,
      audioBase64,
      programName: program.name,
    } as RadioResponse)

  } catch (error) {
    console.error('❌ Radio API Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '處理失敗', cantoneseScript: '', broadcastType: 'general_news' } as RadioResponse,
      { status: 500 }
    )
  }
}

// GET 端點
export async function GET() {
  return NextResponse.json({
    schedule: PROGRAM_SCHEDULE,
    availableVoices: ['cantonese_female', 'cantonese_male'],
    description: '24小時廣東話財經電台 API',
    providers: { llm: 'BigModel', tts: 'Cantonese.ai' },
  })
}
