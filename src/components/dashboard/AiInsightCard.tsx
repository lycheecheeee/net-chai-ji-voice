'use client'

import { motion } from 'framer-motion'
import { Sparkles, MessageCircleQuestion } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

interface AiInsightCardProps {
  insight?: string
}

const DEFAULT_INSIGHTS = [
  '今日大市氣氛偏向正面，科技股表現亮眼，留意騰訊同美團嘅走勢。',
  '市場觀望氣氛濃厚，建議耐心等待突破信號，唔好急住入場。',
  '內房板塊出現技術性反彈，但基本面仍有隱憂，小心為上。',
  '美聯儲加息預期降溫，利好港股後市，可以留意地產同銀行股。',
]

export default function AiInsightCard({ insight }: AiInsightCardProps) {
  const { setView, setPresetQuestion } = useAppStore()
  
  const displayInsight = insight || DEFAULT_INSIGHTS[Math.floor(Math.random() * DEFAULT_INSIGHTS.length)]

  const handleAskWhy = () => {
    setPresetQuestion('可以詳細解釋下點解咁講？')
    setView('chat')
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-purple-500/30 transition-colors"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h3 className="text-white font-medium mb-1">Net 仔洞察</h3>
          <p className="text-white/60 text-xs">AI 即時分析</p>
        </div>
      </div>

      <p className="text-white/80 text-sm leading-relaxed mb-4">
        {displayInsight}
      </p>

      <motion.button
        onClick={handleAskWhy}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/80 hover:text-white text-sm transition-colors border border-white/10"
      >
        <MessageCircleQuestion className="w-4 h-4" />
        問點解？
      </motion.button>
    </motion.div>
  )
}
