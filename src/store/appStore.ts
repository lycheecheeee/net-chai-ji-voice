import { create } from 'zustand'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  emotion?: string
  timestamp: Date
}

export interface Program {
  id: string
  title: string
  description: string
  audioUrl: string
  duration: number
}

interface AppStore {
  // View state
  view: 'landing' | 'chat' | 'dashboard'
  setView: (view: 'landing' | 'chat' | 'dashboard') => void
  
  // Chat state
  messages: Message[]
  addMessage: (msg: Message) => void
  clearMessages: () => void
  sessionId: string
  setSessionId: (id: string) => void
  
  // Cooldown mechanism
  cooldown: boolean
  cooldownSeconds: number
  setCooldown: (v: boolean) => void
  setCooldownSeconds: (seconds: number) => void
  startCooldown: () => void
  
  // Radio state
  radioPlaying: boolean
  radioProgram: Program | null
  radioProgress: number
  radioSpeed: number
  setRadioPlaying: (playing: boolean) => void
  setRadioProgram: (program: Program | null) => void
  setRadioProgress: (progress: number) => void
  setRadioSpeed: (speed: number) => void
  
  // Preset question for chat
  presetQuestion: string
  setPresetQuestion: (question: string) => void
}

// Generate a unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export const useAppStore = create<AppStore>((set, get) => ({
  // View state
  view: 'landing',
  setView: (view) => set({ view }),
  
  // Chat state
  messages: [],
  addMessage: (msg) => set((state) => ({ 
    messages: [...state.messages, msg] 
  })),
  clearMessages: () => set({ messages: [] }),
  sessionId: generateSessionId(),
  setSessionId: (id) => set({ sessionId: id }),
  
  // Cooldown mechanism
  cooldown: false,
  cooldownSeconds: 0,
  setCooldown: (v) => set({ cooldown: v }),
  setCooldownSeconds: (seconds) => set({ cooldownSeconds: seconds }),
  startCooldown: () => {
    set({ cooldown: true, cooldownSeconds: 30 })
    const interval = setInterval(() => {
      const currentSeconds = get().cooldownSeconds
      if (currentSeconds <= 1) {
        set({ cooldown: false, cooldownSeconds: 0 })
        clearInterval(interval)
      } else {
        set({ cooldownSeconds: currentSeconds - 1 })
      }
    }, 1000)
  },
  
  // Radio state
  radioPlaying: false,
  radioProgram: null,
  radioProgress: 0,
  radioSpeed: 1,
  setRadioPlaying: (playing) => set({ radioPlaying: playing }),
  setRadioProgram: (program) => set({ radioProgram: program }),
  setRadioProgress: (progress) => set({ radioProgress: progress }),
  setRadioSpeed: (speed) => set({ radioSpeed: speed }),
  
  // Preset question
  presetQuestion: '',
  setPresetQuestion: (question) => set({ presetQuestion: question }),
}))

// High-risk keywords for cooldown mechanism
export const HIGH_RISK_KEYWORDS = [
  '即刻全倉',
  '全倉',
  'all in',
  'all-in',
  '借錢買',
  '孖展加',
  '孖展',
  '融資買',
  '加槓桿',
  '槓桿',
  '梭哈',
  '一把梭',
  '賭身家',
  '賭全部',
  '抵押房子',
  '抵押物業',
  '賣樓買股',
  '借貸炒股',
  '信用卡套現',
  '現金套現',
  '借貸',
]

export const checkHighRiskKeywords = (text: string): boolean => {
  const lowerText = text.toLowerCase()
  return HIGH_RISK_KEYWORDS.some(keyword => 
    lowerText.includes(keyword.toLowerCase())
  )
}
