import { NextResponse } from 'next/server'
import { fetchFinanceData, getSimplifiedFinanceData } from '@/lib/financeData'

// 模擬數據（當無法獲取真實數據時使用）
const generateFallbackData = () => {
  const hsiBase = 19876.54
  const change = (Math.random() - 0.5) * 4 // -2% to +2%

  const stocks = [
    { code: '0700.HK', name: '騰訊', price: 298.40 + (Math.random() - 0.5) * 10, change: (Math.random() - 0.5) * 6 },
    { code: '3690.HK', name: '美團', price: 128.60 + (Math.random() - 0.5) * 5, change: (Math.random() - 0.5) * 6 },
    { code: '9988.HK', name: '阿里巴巴', price: 78.25 + (Math.random() - 0.5) * 3, change: (Math.random() - 0.5) * 6 },
    { code: '1810.HK', name: '小米', price: 18.76 + (Math.random() - 0.5) * 1, change: (Math.random() - 0.5) * 6 },
    { code: '0941.HK', name: '中國移動', price: 72.85 + (Math.random() - 0.5) * 2, change: (Math.random() - 0.5) * 4 },
    { code: '1299.HK', name: '友邦保險', price: 62.30 + (Math.random() - 0.5) * 2, change: (Math.random() - 0.5) * 4 },
  ]

  return {
    hsi: {
      value: hsiBase + (change * hsiBase / 100),
      change: change,
    },
    sentiment: Math.floor(Math.random() * 40 + 40), // 40-80
    topStocks: stocks.map(s => ({
      ...s,
      price: parseFloat(s.price.toFixed(2)),
      change: parseFloat(s.change.toFixed(2)),
    })),
    lastUpdated: new Date().toISOString(),
    isRealData: false,
  }
}

// GET /api/market - 獲取市場數據
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const type = searchParams.get('type') || 'full' // full | simplified

  try {
    // 嘗試獲取真實數據
    if (type === 'simplified') {
      const data = await getSimplifiedFinanceData()
      return NextResponse.json({
        ...data,
        isRealData: true,
      })
    }

    const realData = await fetchFinanceData()

    // 如果成功獲取真實數據
    if (realData.hsi) {
      // 計算市場情緒
      let sentiment = 50 // 中性
      if (realData.hsi.changePercent > 1) sentiment = 75 // 偏好
      else if (realData.hsi.changePercent > 0) sentiment = 60 // 稍好
      else if (realData.hsi.changePercent < -1) sentiment = 25 // 偏差
      else if (realData.hsi.changePercent < 0) sentiment = 40 // 稍差

      return NextResponse.json({
        hsi: {
          value: realData.hsi.price,
          change: realData.hsi.changePercent,
          open: realData.hsi.open,
          high: realData.hsi.high,
          low: realData.hsi.low,
          volume: realData.hsi.volume,
        },
        hscei: realData.hscei ? {
          value: realData.hscei.price,
          change: realData.hscei.changePercent,
        } : null,
        hstech: realData.hstech ? {
          value: realData.hstech.price,
          change: realData.hstech.changePercent,
        } : null,
        gold: realData.gold || null,
        oil: realData.oil || null,
        bitcoin: realData.bitcoin || null,
        us: {
          dow: realData.dow || null,
          nasdaq: realData.nasdaq || null,
          sp500: realData.sp500 || null,
        },
        usdHkd: realData.usdHkd || null,
        sentiment,
        marketStatus: realData.marketStatus,
        lastUpdated: realData.lastUpdated,
        isRealData: true,
      })
    }
  } catch (error) {
    console.error('獲取真實數據失敗，使用模擬數據:', error)
  }

  // 使用模擬數據作為後備
  return NextResponse.json(generateFallbackData())
}
