import { create } from 'zustand'

interface ToastStore {
  msg: string | null
  show(msg: string): void
}

let timer: number | undefined

export const useToast = create<ToastStore>((set) => ({
  msg: null,
  show(msg) {
    set({ msg })
    window.clearTimeout(timer)
    timer = window.setTimeout(() => set({ msg: null }), 2200)
  },
}))

export const toast = (msg: string): void => useToast.getState().show(msg)

/** Vibração leve ao marcar (não suportada no iOS — falha em silêncio). */
export const buzz = (): void => {
  try {
    navigator.vibrate?.(15)
  } catch {
    /* sem suporte */
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      ta.remove()
      return ok
    } catch {
      return false
    }
  }
}
