'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

export type PinSection = 'crew' | 'groups'

interface PinLockState {
  isLocked: boolean
  unlock: (pin: string) => Promise<boolean>
  lock: () => void
  resetTimer: () => void
}

const LOCK_DURATION_MS = 15 * 60 * 1000 // 15 minutes
const STORAGE_KEY_PREFIX = 'pin_unlock_'

function getStorageKey(section: PinSection): string {
  return `${STORAGE_KEY_PREFIX}${section}`
}

interface UnlockData {
  unlockedAt: number
  expiresAt: number
}

function getStoredUnlock(section: PinSection): UnlockData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(getStorageKey(section))
    if (!raw) return null
    const data: UnlockData = JSON.parse(raw)
    if (Date.now() > data.expiresAt) {
      sessionStorage.removeItem(getStorageKey(section))
      return null
    }
    return data
  } catch {
    return null
  }
}

function setStoredUnlock(section: PinSection): void {
  if (typeof window === 'undefined') return
  const data: UnlockData = {
    unlockedAt: Date.now(),
    expiresAt: Date.now() + LOCK_DURATION_MS,
  }
  sessionStorage.setItem(getStorageKey(section), JSON.stringify(data))
}

function clearStoredUnlock(section: PinSection): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(getStorageKey(section))
}

function getInitialLockedState(section: PinSection): boolean {
  const stored = getStoredUnlock(section)
  return !stored
}

export function usePinLock(section: PinSection): PinLockState {
  const [isLocked, setIsLocked] = useState(() => getInitialLockedState(section))
  const autoLockTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Set up auto-lock timer from stored unlock on mount
  useEffect(() => {
    const stored = getStoredUnlock(section)
    if (stored) {
      const remaining = stored.expiresAt - Date.now()
      if (remaining > 0) {
        autoLockTimerRef.current = setTimeout(() => {
          setIsLocked(true)
          clearStoredUnlock(section)
        }, remaining)
      }
    }

    return () => {
      if (autoLockTimerRef.current) {
        clearTimeout(autoLockTimerRef.current)
      }
    }
  }, [section])

  const startAutoLockTimer = useCallback(() => {
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current)
    }
    autoLockTimerRef.current = setTimeout(() => {
      setIsLocked(true)
      clearStoredUnlock(section)
    }, LOCK_DURATION_MS)
  }, [section])

  const unlock = useCallback(
    async (pin: string): Promise<boolean> => {
      try {
        const res = await fetch('/api/auth/verify-pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pin }),
        })
        const data = await res.json()
        if (data.success) {
          setIsLocked(false)
          setStoredUnlock(section)
          startAutoLockTimer()
          return true
        }
        return false
      } catch {
        return false
      }
    },
    [section, startAutoLockTimer]
  )

  const lock = useCallback(() => {
    setIsLocked(true)
    clearStoredUnlock(section)
    if (autoLockTimerRef.current) {
      clearTimeout(autoLockTimerRef.current)
    }
  }, [section])

  const resetTimer = useCallback(() => {
    if (!isLocked) {
      // Refresh the stored unlock with new expiry
      setStoredUnlock(section)
      startAutoLockTimer()
    }
  }, [isLocked, section, startAutoLockTimer])

  return { isLocked, unlock, lock, resetTimer }
}
