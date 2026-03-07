'use client'

import { motion } from 'framer-motion'

interface GreetingBubbleProps {
  text?: string
}

export default function GreetingBubble({ text = '你好！今日想傾偈定睇市？' }: GreetingBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.5, duration: 0.5, ease: 'easeOut' }}
      className="relative max-w-xs md:max-w-md"
    >
      {/* Bubble container */}
      <div className="relative px-6 py-4 bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-xl">
        <p className="text-white text-lg md:text-xl font-medium text-center">
          {text}
        </p>
        
        {/* Bubble tail */}
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white/10 backdrop-blur-xl border-b border-r border-white/20 rotate-45" />
      </div>
      
      {/* Decorative elements */}
      <motion.div
        className="absolute -top-2 -left-2 w-4 h-4 rounded-full bg-pink-500/50"
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute -top-1 -right-3 w-3 h-3 rounded-full bg-cyan-500/50"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.7, 0.5],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 0.3,
        }}
      />
    </motion.div>
  )
}
