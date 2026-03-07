'use client'

import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import MarketSentimentCard from './MarketSentimentCard'
import Watchlist from './Watchlist'
import AiInsightCard from './AiInsightCard'

export default function DashboardView() {
  const setView = useAppStore((state) => state.setView)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-b from-[#0a0a1a] via-[#1a1040] to-[#2d1b4e]"
    >
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sticky top-0 z-50 w-full px-4 py-3 bg-black/40 backdrop-blur-xl border-b border-white/10"
      >
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button
            onClick={() => setView('landing')}
            className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm">返回</span>
          </button>

          <h1 className="text-white font-medium">市場概覽</h1>

          <div className="w-16" /> {/* Spacer for alignment */}
        </div>
      </motion.header>

      {/* Content */}
      <main className="max-w-2xl mx-auto p-4 space-y-4 pb-24">
        {/* Market Sentiment */}
        <MarketSentimentCard />

        {/* Watchlist */}
        <Watchlist />

        {/* AI Insight */}
        <AiInsightCard />

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-2 gap-3"
        >
          <button
            onClick={() => {
              useAppStore.getState().setPresetQuestion('今日大市點睇？')
              setView('chat')
            }}
            className="p-4 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 hover:border-white/20 transition-colors text-left"
          >
            <p className="text-white font-medium text-sm mb-1">大市分析</p>
            <p className="text-white/40 text-xs">問下今日市況</p>
          </button>
          <button
            onClick={() => {
              useAppStore.getState().setPresetQuestion('有咩股票值得留意？')
              setView('chat')
            }}
            className="p-4 bg-white/5 backdrop-blur-xl rounded-xl border border-white/10 hover:border-white/20 transition-colors text-left"
          >
            <p className="text-white font-medium text-sm mb-1">股票推介</p>
            <p className="text-white/40 text-xs">搵下投資機會</p>
          </button>
        </motion.div>
      </main>
    </motion.div>
  )
}
