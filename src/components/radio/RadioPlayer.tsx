'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, Pause, Radio, ChevronUp, ChevronDown, X } from 'lucide-react'
import { useAppStore } from '@/store/appStore'

const SPEED_OPTIONS = [1, 1.25, 1.5]

export default function RadioPlayer() {
  const { 
    radioPlaying, 
    setRadioPlaying, 
    radioProgress, 
    setRadioProgress,
    radioSpeed,
    setRadioSpeed 
  } = useAppStore()
  
  const [isExpanded, setIsExpanded] = useState(false)
  const [isVisible, setIsVisible] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)
  const progressInterval = useRef<NodeJS.Timeout>()

  // Demo program
  const currentProgram = {
    title: '財經早晨',
    description: '每日市場重點回顧',
    duration: 1800, // 30 minutes in seconds
  }

  useEffect(() => {
    if (radioPlaying) {
      progressInterval.current = setInterval(() => {
        setRadioProgress((prev) => {
          if (prev >= 100) {
            setRadioPlaying(false)
            return 0
          }
          return prev + (100 / currentProgram.duration)
        })
      }, 1000)
    } else {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current)
      }
    }
  }, [radioPlaying, setRadioProgress, setRadioPlaying])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const currentTime = (radioProgress / 100) * currentProgram.duration
  const remainingTime = currentProgram.duration - currentTime

  if (!isVisible) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 right-4 z-50 max-w-sm"
      >
        <motion.div
          layout
          className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden shadow-2xl"
        >
          {/* Collapsed view */}
          <AnimatePresence mode="wait">
            {!isExpanded ? (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 p-3"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <Radio className="w-5 h-5 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {currentProgram.title}
                  </p>
                  <p className="text-white/40 text-xs">
                    {radioPlaying ? '播放中' : '已暫停'}
                  </p>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setRadioPlaying(!radioPlaying)}
                    className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    {radioPlaying ? (
                      <Pause className="w-4 h-4 text-white" />
                    ) : (
                      <Play className="w-4 h-4 text-white ml-0.5" />
                    )}
                  </button>
                  <button
                    onClick={() => setIsExpanded(true)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setIsVisible(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="p-4"
              >
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                      <Radio className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{currentProgram.title}</p>
                      <p className="text-white/40 text-sm">{currentProgram.description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60"
                  >
                    <ChevronDown className="w-5 h-5" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden cursor-pointer">
                    <motion.div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                      style={{ width: `${radioProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-2 text-xs text-white/40">
                    <span>{formatTime(currentTime)}</span>
                    <span>-{formatTime(remainingTime)}</span>
                  </div>
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setRadioPlaying(!radioPlaying)}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                  >
                    {radioPlaying ? (
                      <>
                        <Pause className="w-5 h-5" />
                        暫停
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5" />
                        播放
                      </>
                    )}
                  </button>
                </div>

                {/* Speed selector */}
                <div className="flex items-center justify-center gap-2 mt-4">
                  <span className="text-white/40 text-xs">速度：</span>
                  {SPEED_OPTIONS.map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setRadioSpeed(speed)}
                      className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                        radioSpeed === speed
                          ? 'bg-white/20 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
