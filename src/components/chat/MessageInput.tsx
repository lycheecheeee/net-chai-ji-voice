'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Loader2, Mic, MicOff } from 'lucide-react'
import { useAppStore, checkHighRiskKeywords } from '@/store/appStore'

export default function MessageInput() {
  const [text, setText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const chunksRef = useRef<Blob[]>([])
  
  const { 
    addMessage, 
    sessionId, 
    cooldown, 
    startCooldown,
    presetQuestion,
    setPresetQuestion 
  } = useAppStore()

  // Handle preset question from dashboard
  useEffect(() => {
    if (presetQuestion) {
      setText(presetQuestion)
      setPresetQuestion('')
      inputRef.current?.focus()
    }
  }, [presetQuestion, setPresetQuestion])

  // Cleanup function for media stream
  const cleanupMediaStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    mediaRecorderRef.current = null
    chunksRef.current = []
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupMediaStream()
    }
  }, [cleanupMediaStream])

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      })
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        cleanupMediaStream()
        
        // Convert to base64
        const reader = new FileReader()
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(',')[1]
          
          setIsTranscribing(true)
          try {
            const res = await fetch('/api/asr', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ audio: base64 })
            })
            
            const data = await res.json()
            
            if (data.text) {
              setText(prev => prev ? `${prev} ${data.text}` : data.text)
              inputRef.current?.focus()
            }
          } catch (error) {
            console.error('ASR error:', error)
          } finally {
            setIsTranscribing(false)
          }
        }
        reader.readAsDataURL(blob)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Failed to start recording:', error)
      alert('無法訪問麥克風，請檢查權限設置')
    }
  }

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  // Toggle recording
  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  const handleSubmit = async () => {
    if (!text.trim() || isLoading || cooldown) return

    const userText = text.trim()
    setText('')

    // Check for high-risk keywords
    if (checkHighRiskKeywords(userText)) {
      startCooldown()
    }

    // Add user message
    const userMessage = {
      id: `user_${Date.now()}`,
      role: 'user' as const,
      content: userText,
      timestamp: new Date(),
    }
    addMessage(userMessage)

    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: userText, sessionId }),
      })

      if (!response.ok) throw new Error('Failed to send message')

      const data = await response.json()

      // Add AI response
      const aiMessage = {
        id: `ai_${Date.now()}`,
        role: 'assistant' as const,
        content: data.content,
        emotion: data.emotion,
        timestamp: new Date(),
      }
      addMessage(aiMessage)
    } catch (error) {
      console.error('Error sending message:', error)
      addMessage({
        id: `error_${Date.now()}`,
        role: 'assistant',
        content: '抱歉，發生錯誤，請稍後再試。',
        timestamp: new Date(),
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky bottom-0 p-4 bg-black/40 backdrop-blur-xl border-t border-white/10"
    >
      <div className="max-w-2xl mx-auto">
        <div className="flex items-end gap-2 bg-white/5 rounded-2xl border border-white/10 p-2">
          {/* Voice input button */}
          <button
            onClick={toggleRecording}
            disabled={isLoading || cooldown || isTranscribing}
            className={`p-3 rounded-xl flex-shrink-0 transition-all duration-200 ${
              isRecording 
                ? 'bg-red-500 text-white animate-pulse' 
                : 'bg-white/10 text-white hover:bg-white/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={isRecording ? '停止錄音' : '開始錄音'}
          >
            <AnimatePresence mode="wait">
              {isTranscribing ? (
                <motion.div
                  key="transcribing"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Loader2 className="w-5 h-5 animate-spin" />
                </motion.div>
              ) : isRecording ? (
                <motion.div
                  key="recording"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <MicOff className="w-5 h-5" />
                </motion.div>
              ) : (
                <motion.div
                  key="mic"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Mic className="w-5 h-5" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>

          {/* Text input */}
          <textarea
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isRecording ? '錄音中...' : 
              isTranscribing ? '語音識別中...' :
              cooldown ? '冷靜期中，請稍候...' : '輸入訊息...'
            }
            disabled={isLoading || cooldown || isRecording || isTranscribing}
            rows={1}
            className="flex-1 bg-transparent text-white placeholder-white/40 resize-none outline-none px-3 py-2 text-sm md:text-base max-h-32 scrollbar-thin"
            style={{ minHeight: '40px' }}
          />

          {/* Send button */}
          <button
            onClick={handleSubmit}
            disabled={!text.trim() || isLoading || cooldown}
            className="p-3 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Recording indicator */}
        <AnimatePresence>
          {isRecording && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex items-center justify-center gap-2 mt-2 text-red-400 text-sm"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              <span>錄音中，點擊咪高峰停止</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}
