import { create } from 'zustand'

interface CaptchaCountdownStore {
  countdowns: Record<string, number>  // 存储不同手机号的倒计时
  setCountdown: (phone: string, time: number) => void
  clearCountdown: (phone: string) => void
  startCountdown: (phone: string) => void
}

export const useCaptchaCountdown = create<CaptchaCountdownStore>((set, get) => ({
  countdowns: {},
  
  setCountdown: (phone, time) => {
    set(state => ({
      countdowns: { ...state.countdowns, [phone]: time }
    }))
  },
  
  clearCountdown: (phone) => {
    set(state => {
      const newCountdowns = { ...state.countdowns }
      delete newCountdowns[phone]
      return { countdowns: newCountdowns }
    })
  },
  
  startCountdown: (phone) => {
    const countdown = 60
    get().setCountdown(phone, countdown)
    
    const timer = setInterval(() => {
      const currentCount = get().countdowns[phone]
      if (currentCount <= 1) {
        clearInterval(timer)
        get().clearCountdown(phone)
      } else {
        get().setCountdown(phone, currentCount - 1)
      }
    }, 1000)
  },
}))
