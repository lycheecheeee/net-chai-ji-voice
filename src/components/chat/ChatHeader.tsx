'use client'

import { ArrowLeft, Radio, Settings } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAppStore } from '@/store/appStore'

export default function ChatHeader() {
  const setView = useAppStore((state) => state.setView)

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 w-full px-4 py-3 bg-black/40 backdrop-blur-xl border-b border-white/10"
    >
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        {/* Back button */}
        <button
          onClick={() => setView('landing')}
          className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">返回</span>
        </button>

        {/* Title */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-sm">🤖</span>
          </div>
          <span className="text-white font-medium">Net 仔</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <button className="p-2 text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-lg">
            <Radio className="w-5 h-5" />
          </button>
          <button className="p-2 text-white/80 hover:text-white transition-colors hover:bg-white/10 rounded-lg">
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.header>
  )
}
