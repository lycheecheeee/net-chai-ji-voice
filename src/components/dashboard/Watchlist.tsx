'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, TrendingUp, TrendingDown, Plus } from 'lucide-react'

interface Stock {
  code: string
  name: string
  price: number
  change: number
}

export default function Watchlist() {
  const [stocks, setStocks] = useState<Stock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/market')
        const result = await response.json()
        // 處理 market API 數據，生成觀察名單
        if (result.topStocks) {
          setStocks(result.topStocks)
        } else if (result.hsi) {
          // 從 market 數據構建股票列表
          const stockList: Stock[] = [
            { code: 'HSI', name: '恆生指數', price: result.hsi.value, change: result.hsi.change },
            { code: 'HSCEI', name: '國企指數', price: result.hscei?.value || 0, change: result.hscei?.change || 0 },
            { code: 'GOLD', name: '黃金', price: result.gold?.price || 0, change: result.gold?.change || 0 },
            { code: 'OIL', name: '原油', price: result.oil?.price || 0, change: result.oil?.change || 0 },
            { code: 'BTC', name: '比特幣', price: result.bitcoin?.price || 0, change: result.bitcoin?.change || 0 },
          ]
          setStocks(stockList)
        }
      } catch (error) {
        console.error('Failed to fetch watchlist:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-1/3 mb-4" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <div className="h-4 bg-white/10 rounded w-24" />
            <div className="h-4 bg-white/10 rounded w-16" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-colors"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-medium flex items-center gap-2">
          <Eye className="w-4 h-4 text-white/60" />
          觀察名單
        </h3>
        <button className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-white/60 hover:text-white">
          <Plus className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {stocks.map((stock, index) => (
          <motion.div
            key={stock.code}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center justify-between py-3 px-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
          >
            <div>
              <p className="text-white text-sm font-medium">{stock.name}</p>
              <p className="text-white/40 text-xs">{stock.code}</p>
            </div>
            <div className="text-right">
              <p className="text-white text-sm">${stock.price.toFixed(2)}</p>
              <p className={`text-xs flex items-center justify-end gap-0.5 ${
                stock.change >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {stock.change >= 0 ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
