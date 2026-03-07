'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, Clock } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

export default function CooldownBanner() {
  const { cooldown, cooldownSeconds } = useAppStore()

  return (
    <AnimatePresence>
      {cooldown && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="overflow-hidden"
        >
          <div className="px-4 py-3 bg-gradient-to-r from-amber-500/20 to-red-500/20 border-b border-amber-500/30 backdrop-blur-xl">
            <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/20">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-amber-400 font-medium text-sm">
                    冷靜期提醒
                  </p>
                  <p className="text-white/60 text-xs">
                    高風險操作已觸發冷靜機制
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-amber-400">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-lg font-bold">
                  {cooldownSeconds}s
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
