'use client'

import { motion } from 'framer-motion'
import { useAppStore } from '@/store/appStore'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import MessageInput from './MessageInput'
import CooldownBanner from './CooldownBanner'

export default function ChatView() {
  const cooldown = useAppStore((state) => state.cooldown)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`min-h-screen flex flex-col bg-gradient-to-b from-[#0a0a1a] via-[#1a1040] to-[#2d1b4e] ${
        cooldown ? 'pointer-events-none' : ''
      }`}
      style={{ opacity: cooldown ? 0.6 : 1 }}
    >
      <ChatHeader />
      <CooldownBanner />
      <MessageList />
      <MessageInput />
    </motion.div>
  )
}
