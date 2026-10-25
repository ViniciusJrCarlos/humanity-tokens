import { storageKey } from '../../infrastructure/storageKeys'
import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = storageKey('install_dismissed')

/** Controla o convite de instalação do PWA (Android/Chrome nativo; iOS com instruções). */
export function useInstallPrompt() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [visible, setVisible] = useState(false)
  const standalone = typeof window !== 'undefined' &&
    (window.matchMedia?.('(display-mode: standalone)').matches || (navigator as any).standalone === true)
  const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent)

  useEffect(() => {
    if (standalone || localStorage.getItem(DISMISS_KEY)) return
    const handler = (e: Event) => { e.preventDefault(); setEvent(e as BeforeInstallPromptEvent); setVisible(true) }
    window.addEventListener('beforeinstallprompt', handler)
    // iOS não dispara beforeinstallprompt: mostramos as instruções manuais.
    const t = isIos ? setTimeout(() => setVisible(true), 1200) : undefined
    return () => { window.removeEventListener('beforeinstallprompt', handler); if (t) clearTimeout(t) }
  }, [standalone, isIos])

  const dismiss = () => { localStorage.setItem(DISMISS_KEY, '1'); setVisible(false) }
  const install = async () => {
    if (!event) return
    await event.prompt()
    await event.userChoice
    setEvent(null); setVisible(false)
  }
  return { visible, canPrompt: !!event, isIos, install, dismiss }
}
