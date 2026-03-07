'use client'

import { useRef, useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, Loader2, Square } from 'lucide-react'
import { useAppStore, type Message } from '@/store/appStore'

interface MessageBubbleProps {
  message: Message
  isPlaying: boolean
  isPlayingMessage: string | null
  onPlay: (messageId: string, text: string) => void
  onStop: () => void
}

function MessageBubble({ message, isPlaying, isPlayingMessage, onPlay, onStop }: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const showPlayButton = !isUser && message.content
  const isThisPlaying = isPlayingMessage === message.id

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex items-end gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        {!isUser && (
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
            <span className="text-sm">🤖</span>
          </div>
        )}

        {/* Message bubble */}
        <div className="flex flex-col gap-2">
          <div
            className={`px-4 py-3 rounded-2xl ${
              isUser
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'bg-white/10 backdrop-blur-xl text-white border border-white/20'
            }`}
          >
            <p className="text-sm md:text-base whitespace-pre-wrap break-words">
              {message.content}
            </p>
            {message.emotion && !isUser && (
              <div className="mt-2 pt-2 border-t border-white/10">
                <span className="text-xs text-white/60">
                  情緒: {message.emotion}
                </span>
              </div>
            )}
          </div>

          {/* Read aloud button for AI messages */}
          {showPlayButton && (
            <div className="flex justify-start">
              <button
                onClick={() => isThisPlaying ? onStop() : onPlay(message.id, message.content)}
                disabled={isPlaying && !isThisPlaying}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all ${
                  isThisPlaying 
                    ? 'bg-purple-500/30 text-purple-300' 
                    : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/80'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isThisPlaying ? '停止朗讀' : '朗讀訊息'}
              >
                {isThisPlaying ? (
                  <>
                    <Square className="w-3 h-3" />
                    <span>停止</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3 h-3" />
                    <span>朗讀</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function MessageList() {
  const messages = useAppStore((state) => state.messages)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPlayingMessage, setIsPlayingMessage] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        URL.revokeObjectURL(audioRef.current.src)
        audioRef.current = null
      }
    }
  }, [])

  // Stop playing audio
  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      URL.revokeObjectURL(audioRef.current.src)
      audioRef.current = null
    }
    setIsPlaying(false)
    setIsPlayingMessage(null)
  }, [])

  // Play audio for a message
  const playAudio = useCallback(async (messageId: string, text: string) => {
    // Stop any currently playing audio
    stopAudio()

    setIsLoading(true)
    setIsPlayingMessage(messageId)

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: text.substring(0, 1024), // Limit to 1024 characters
          voice: 'tongtong', 
          speed: 1.0 
        })
      })

      if (!res.ok) {
        throw new Error('TTS request failed')
      }

      const audioBlob = await res.blob()
      const audioUrl = URL.createObjectURL(audioBlob)
      
      const audio = new Audio(audioUrl)
      audioRef.current = audio

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
        setIsPlaying(false)
        setIsPlayingMessage(null)
      }

      audio.onerror = () => {
        URL.revokeObjectURL(audioUrl)
        audioRef.current = null
        setIsPlaying(false)
        setIsPlayingMessage(null)
      }

      setIsLoading(false)
      setIsPlaying(true)
      
      await audio.play()
    } catch (error) {
      console.error('TTS error:', error)
      setIsLoading(false)
      setIsPlaying(false)
      setIsPlayingMessage(null)
    }
  }, [stopAudio])

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-white/60">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
            <span className="text-3xl">🤖</span>
          </div>
          <p className="text-lg mb-2">開始同 Net 仔傾偈</p>
          <p className="text-sm">問下你想知嘅財經資訊</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
      <div className="max-w-2xl mx-auto">
        <AnimatePresence mode="popLayout">
          {messages.map((message) => (
            <MessageBubble 
              key={message.id} 
              message={message}
              isPlaying={isPlaying}
              isPlayingMessage={isPlayingMessage}
              onPlay={playAudio}
              onStop={stopAudio}
            />
          ))}
        </AnimatePresence>
        
        {/* Loading indicator for TTS */}
        <AnimatePresence>
          {isLoading && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex items-center justify-center gap-2 py-4 text-white/60 text-sm"
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>正在生成語音...</span>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  )
}
