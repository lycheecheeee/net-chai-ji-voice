'use client'

import { useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { useAppStore } from '@/store/appStore'
import StarfieldBackground from './StarfieldBackground'
import NetAvatar from './NetAvatar'
import GreetingBubble from './GreetingBubble'

export default function LandingView() {
  const setView = useAppStore((state) => state.setView)
  const containerRef = useRef<HTMLDivElement>(null)
  const touchStartY = useRef(0)
  const touchEndY = useRef(0)

  const handleSwipe = useCallback(() => {
    const diff = touchStartY.current - touchEndY.current
    const threshold = 50

    if (diff > threshold) {
      // Swipe up - go to chat
      setView('chat')
    } else if (diff < -threshold) {
      // Swipe down - go to dashboard
      setView('dashboard')
    }
  }, [setView])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY
    }

    const handleTouchMove = (e: TouchEvent) => {
      touchEndY.current = e.touches[0].clientY
    }

    const handleTouchEnd = () => {
      handleSwipe()
    }

    container.addEventListener('touchstart', handleTouchStart)
    container.addEventListener('touchmove', handleTouchMove)
    container.addEventListener('touchend', handleTouchEnd)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
    }
  }, [handleSwipe])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        setView('chat')
      } else if (e.key === 'ArrowDown') {
        setView('dashboard')
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setView])

  return (
    <div 
      ref={containerRef}
      className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center"
    >
      <StarfieldBackground />
      
      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-4">
        {/* App title */}
        <motion.h1
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-3xl md:text-5xl font-bold text-white mb-2 text-center"
        >
          Net 知己
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-white/70 mb-12 text-center"
        >
          Empathic AI 財經平台
        </motion.p>

        {/* Avatar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <NetAvatar />
        </motion.div>

        {/* Greeting bubble */}
        <div className="mt-8">
          <GreetingBubble />
        </div>

        {/* Navigation hints */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4"
        >
          {/* Swipe up hint */}
          <motion.button
            onClick={() => setView('chat')}
            className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <ChevronUp className="w-6 h-6" />
            <span className="text-sm">向上滑傾偈</span>
          </motion.button>

          {/* Divider */}
          <div className="w-px h-4 bg-white/30" />

          {/* Swipe down hint */}
          <motion.button
            onClick={() => setView('dashboard')}
            className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            <span className="text-sm">向下滑睇市</span>
            <ChevronDown className="w-6 h-6" />
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
