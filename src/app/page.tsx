'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '@/store/appStore'
import LandingView from '@/components/landing/LandingView'
import ChatView from '@/components/chat/ChatView'
import DashboardView from '@/components/dashboard/DashboardView'
import RadioPlayer from '@/components/radio/RadioPlayer'

export default function Home() {
  const view = useAppStore((state) => state.view)

  return (
    <main className="min-h-screen w-full overflow-hidden">
      <AnimatePresence mode="wait">
        {view === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <LandingView />
          </motion.div>
        )}
        
        {view === 'chat' && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <ChatView />
          </motion.div>
        )}
        
        {view === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ duration: 0.3 }}
          >
            <DashboardView />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Radio Player - visible on all views */}
      <RadioPlayer />
    </main>
  )
}
