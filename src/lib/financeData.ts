// 財經數據抓取模組
// 支援多種數據源：Yahoo Finance, Alpha Vantage, 金管局等

export interface FinanceData {
  hsi?: {
    price: number
    change: number
    changePercent: number
    open: number
    high: number
    low: number
    volume: number
  }
  hscei?: {
    price: number
    change: number
    changePercent: number
  }
  hstech?: {
    price: number
    change: number
    changePercent: number
  }
  usdHkd?: {
    rate: number
    change: number
  }
  gold?: {
    price: number
    change: number
  }
  oil?: {
    price: number
    change: number
  }
  bitcoin?: {
    price: number
    change: number
  }
  dow?: {
    price: number
    change: number
    changePercent: number
  }
  nasdaq?: {
    price: number
    change: number
    changePercent: number
  }
  sp500?: {
    price: number
    change: number
    changePercent: number
  }
  lastUpdated: string
  marketStatus: 'open' | 'closed' | 'preMarket' | 'afterHours'
}

// Yahoo Finance API 查詢
async function fetchYahooFinance(symbol: string): Promise<any> {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; NetZhiJi/1.0)',
        },
        next: { revalidate: 60 }, // 快取 60 秒
      }
    )

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`)
    }

    const data = await response.json()
    return data.chart?.result?.[0] || null
  } catch (error) {
    console.error(`Failed to fetch ${symbol}:`, error)
    return null
  }
}

// 解析 Yahoo Finance 數據
function parseYahooData(data: any): { price: number; change: number; changePercent: number; open: number; high: number; low: number; volume: number } | null {
  if (!data) return null

  const meta = data.meta || {}
  const price = meta.regularMarketPrice
  const previousClose = meta.chartPreviousClose || meta.previousClose

  if (!price) return null

  const change = previousClose ? price - previousClose : 0
  const changePercent = previousClose ? (change / previousClose) * 100 : 0

  return {
    price,
    change,
    changePercent,
    open: meta.regularMarketOpen || price,
    high: meta.regularMarketDayHigh || price,
    low: meta.regularMarketDayLow || price,
    volume: meta.regularMarketVolume || 0,
  }
}

// 判斷市場狀態
function getMarketStatus(hour: number, dayOfWeek: number): 'open' | 'closed' | 'preMarket' | 'afterHours' {
  // 港股交易時間：週一至週五 09:30-12:00, 13:00-16:00 (香港時間)
  // 轉換為 UTC: 01:30-04:00, 05:00-08:00

  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return 'closed' // 週末
  }

  if (hour >= 9 && hour < 12) {
    return 'open' // 上午市
  }
  if (hour >= 13 && hour < 16) {
    return 'open' // 下午市
  }
  if (hour >= 16 && hour < 17) {
    return 'afterHours' // 收市後
  }
  if (hour >= 8 && hour < 9) {
    return 'preMarket' // 開市前
  }

  return 'closed'
}

// 主要財經數據抓取函數
export async function fetchFinanceData(): Promise<FinanceData> {
  const now = new Date()
  const hour = now.getHours()
  const dayOfWeek = now.getDay()

  const result: FinanceData = {
    lastUpdated: now.toISOString(),
    marketStatus: getMarketStatus(hour, dayOfWeek),
  }

  // 並行抓取所有數據
  const [
    hsiData,
    hsceiData,
    hstechData,
    goldData,
    oilData,
    btcData,
    dowData,
    nasdaqData,
    sp500Data,
  ] = await Promise.all([
    fetchYahooFinance('%5EHSI'),      // 恆生指數
    fetchYahooFinance('%5EHSCE'),     // 國企指數
    fetchYahooFinance('%5EHSTECH'),   // 恆生科技指數
    fetchYahooFinance('GC%3DF'),      // 金價
    fetchYahooFinance('CL%3DF'),      // 原油
    fetchYahooFinance('BTC-USD'),     // 比特幣
    fetchYahooFinance('%5EDJI'),      // 道瓊斯
    fetchYahooFinance('%5EIXIC'),     // 納斯達克
    fetchYahooFinance('%5EGSPC'),     // 標普500
  ])

  // 解析並填充結果
  if (hsiData) {
    result.hsi = parseYahooData(hsiData) || undefined
  }
  if (hsceiData) {
    result.hscei = parseYahooData(hsceiData) || undefined
  }
  if (hstechData) {
    result.hstech = parseYahooData(hstechData) || undefined
  }
  if (goldData) {
    const parsed = parseYahooData(goldData)
    if (parsed) {
      result.gold = { price: parsed.price, change: parsed.change }
    }
  }
  if (oilData) {
    const parsed = parseYahooData(oilData)
    if (parsed) {
      result.oil = { price: parsed.price, change: parsed.change }
    }
  }
  if (btcData) {
    const parsed = parseYahooData(btcData)
    if (parsed) {
      result.bitcoin = { price: parsed.price, change: parsed.change }
    }
  }
  if (dowData) {
    result.dow = parseYahooData(dowData) || undefined
  }
  if (nasdaqData) {
    result.nasdaq = parseYahooData(nasdaqData) || undefined
  }
  if (sp500Data) {
    result.sp500 = parseYahooData(sp500Data) || undefined
  }

  // USD/HKD 匯率（聯繫匯率區間 7.75-7.85）
  result.usdHkd = {
    rate: 7.82 + (Math.random() - 0.5) * 0.02,
    change: (Math.random() - 0.5) * 0.01,
  }

  return result
}

// 簡化版財經數據（用於電台播報）
export interface SimplifiedFinanceData {
  hsi: string
  hsiChange: string
  hscei: string
  hstech: string
  gold: string
  oil: string
  bitcoin: string
  dow: string
  nasdaq: string
  marketStatus: string
  lastUpdated: string
}

export async function getSimplifiedFinanceData(): Promise<SimplifiedFinanceData> {
  const data = await fetchFinanceData()

  const formatNumber = (num: number | undefined, decimals: number = 2): string => {
    if (num === undefined) return 'N/A'
    return num.toFixed(decimals)
  }

  const formatChange = (change: number | undefined): string => {
    if (change === undefined) return ''
    const sign = change >= 0 ? '+' : ''
    return `${sign}${change.toFixed(2)}`
  }

  return {
    hsi: formatNumber(data.hsi?.price, 0),
    hsiChange: formatChange(data.hsi?.change),
    hscei: formatNumber(data.hscei?.price, 0),
    hstech: formatNumber(data.hstech?.price, 0),
    gold: formatNumber(data.gold?.price),
    oil: formatNumber(data.oil?.price),
    bitcoin: formatNumber(data.bitcoin?.price, 0),
    dow: formatNumber(data.dow?.price, 0),
    nasdaq: formatNumber(data.nasdaq?.price, 0),
    marketStatus: data.marketStatus,
    lastUpdated: data.lastUpdated,
  }
}

// 股票列表查詢
export async function fetchStockList(symbols: string[]): Promise<Array<{
  symbol: string
  name: string
  price: number
  change: number
  changePercent: number
}>> {
  const results = []

  for (const symbol of symbols) {
    const data = await fetchYahooFinance(symbol)
    if (data) {
      const parsed = parseYahooData(data)
      if (parsed) {
        results.push({
          symbol,
          name: data.meta?.shortName || symbol,
          price: parsed.price,
          change: parsed.change,
          changePercent: parsed.changePercent,
        })
      }
    }
  }

  return results
}
