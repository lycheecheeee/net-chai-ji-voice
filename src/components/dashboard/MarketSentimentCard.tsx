'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, Activity, BarChart3 } from 'lucide-react'

interface MarketData {
  hsi: {
    value: number
    change: number
  }
  sentiment: number
  topStocks: Array<{
    code: string
    name: string
    price: number
    change: number
  }>
}

export default function MarketSentimentCard() {
  const [data, setData] = useState<MarketData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/market')
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error('Failed to fetch market data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/2 mb-4" />
        <div className="h-12 bg-white/10 rounded w-1/3 mb-4" />
        <div className="h-4 bg-white/10 rounded w-2/3" />
      </div>
    )
  }

  if (!data) return null

  const isPositive = data.hsi.change >= 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white/60 text-sm font-medium flex items-center gap-2">
          <BarChart3 className="w-4 h-4" />
          恆生指數
        </h3>
        <span className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {isPositive ? '+' : ''}{data.hsi.change.toFixed(2)}%
        </span>
      </div>

      <div className="text-3xl font-bold text-white mb-4">
        {data.hsi.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}
      </div>

      {/* Sentiment Gauge */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/60 flex items-center gap-1">
            <Activity className="w-4 h-4" />
            市場情緒
          </span>
          <span className={`font-medium ${
            data.sentiment >= 70 ? 'text-green-400' :
            data.sentiment >= 40 ? 'text-amber-400' : 'text-red-400'
          }`}>
            {data.sentiment}/100
          </span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${data.sentiment}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className={`h-full rounded-full ${
              data.sentiment >= 70 ? 'bg-gradient-to-r from-green-500 to-emerald-400' :
              data.sentiment >= 40 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' :
              'bg-gradient-to-r from-red-500 to-pink-400'
            }`}
          />
        </div>
        <div className="flex justify-between text-xs text-white/40">
          <span>恐慌</span>
          <span>中性</span>
          <span>貪婪</span>
        </div>
      </div>
    </motion.div>
  )
}
