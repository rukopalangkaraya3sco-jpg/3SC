'use client'

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, ShieldAlert } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from '@/components/ui/input-otp'
import { usePinLock, type PinSection } from '@/hooks/use-pin-lock'

interface PinLockProps {
  section: PinSection
  children: React.ReactNode
}

export function PinLock({ section, children }: PinLockProps) {
  const { isLocked, unlock, lock, resetTimer } = usePinLock(section)
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [shakeKey, setShakeKey] = useState(0)

  // Reset PIN and error when lock state changes
  useEffect(() => {
    if (isLocked) {
      setPin('')
      setError('')
    }
  }, [isLocked])

  const handleSubmit = useCallback(async () => {
    if (pin.length !== 4) {
      setError('Masukkan 4 digit PIN')
      return
    }

    setVerifying(true)
    setError('')

    try {
      const success = await unlock(pin)
      if (!success) {
        setError('PIN salah. Silakan coba lagi.')
        setPin('')
        setShakeKey((k) => k + 1)
      }
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.')
      setPin('')
      setShakeKey((k) => k + 1)
    } finally {
      setVerifying(false)
    }
  }, [pin, unlock])

  // Handle OTP completion (auto-submit when 4 digits entered)
  const handlePinChange = useCallback(
    (value: string) => {
      setPin(value)
      setError('')
      // Auto-submit when 4 digits are entered
      if (value.length === 4) {
        // Use a micro-delay to let the state update first
        setTimeout(async () => {
          setVerifying(true)
          setError('')
          try {
            const success = await unlock(value)
            if (!success) {
              setError('PIN salah. Silakan coba lagi.')
              setPin('')
              setShakeKey((k) => k + 1)
            }
          } catch {
            setError('Terjadi kesalahan. Silakan coba lagi.')
            setPin('')
            setShakeKey((k) => k + 1)
          } finally {
            setVerifying(false)
          }
        }, 150)
      }
    },
    [unlock]
  )

  // Reset activity timer when user interacts within the unlocked section
  const handleActivity = useCallback(() => {
    if (!isLocked) {
      resetTimer()
    }
  }, [isLocked, resetTimer])

  return (
    <div className="relative" onClick={handleActivity} onKeyPress={handleActivity}>
      {/* Content always rendered but visually hidden when locked */}
      <div
        className={
          isLocked ? 'pointer-events-none select-none opacity-0 h-0 overflow-hidden' : ''
        }
      >
        {children}
      </div>

      {/* Lock Overlay */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-50 flex items-center justify-center"
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />

            {/* Lock Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{
                type: 'spring',
                damping: 25,
                stiffness: 300,
                delay: 0.05,
              }}
              className="relative z-10 w-full max-w-sm mx-4"
            >
              <div className="rounded-2xl border border-border/50 glass-strong p-8 shadow-2xl shadow-emerald-500/5">
                {/* Lock Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    type: 'spring',
                    damping: 15,
                    stiffness: 200,
                    delay: 0.15,
                  }}
                  className="flex justify-center mb-6"
                >
                  <div className="rounded-full gradient-emerald p-4 glow-emerald">
                    <Lock className="size-8 text-white" />
                  </div>
                </motion.div>

                {/* Title */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="text-center mb-6"
                >
                  <h2 className="text-xl font-bold tracking-tight">
                    Akses Terkunci
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    Masukkan PIN admin untuk mengakses halaman manajemen
                  </p>
                </motion.div>

                {/* PIN Input */}
                <motion.div
                  key={shakeKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    x: error ? [0, -8, 8, -6, 6, -3, 3, 0] : 0,
                  }}
                  transition={
                    error
                      ? {
                          x: { duration: 0.5, ease: 'easeInOut' },
                          opacity: { delay: 0.2 },
                          y: { delay: 0.2 },
                        }
                      : { delay: 0.25 }
                  }
                  className="flex flex-col items-center gap-5"
                >
                  <InputOTP
                    maxLength={4}
                    value={pin}
                    onChange={handlePinChange}
                    disabled={verifying}
                  >
                    <InputOTPGroup>
                      <InputOTPSlot
                        index={0}
                        className="size-12 text-lg font-semibold border-white/10 bg-white/5 data-[active=true]:border-emerald-500 data-[active=true]:ring-emerald-500/30"
                      />
                      <InputOTPSlot
                        index={1}
                        className="size-12 text-lg font-semibold border-white/10 bg-white/5 data-[active=true]:border-emerald-500 data-[active=true]:ring-emerald-500/30"
                      />
                    </InputOTPGroup>
                    <InputOTPSeparator className="text-muted-foreground/30" />
                    <InputOTPGroup>
                      <InputOTPSlot
                        index={2}
                        className="size-12 text-lg font-semibold border-white/10 bg-white/5 data-[active=true]:border-emerald-500 data-[active=true]:ring-emerald-500/30"
                      />
                      <InputOTPSlot
                        index={3}
                        className="size-12 text-lg font-semibold border-white/10 bg-white/5 data-[active=true]:border-emerald-500 data-[active=true]:ring-emerald-500/30"
                      />
                    </InputOTPGroup>
                  </InputOTP>

                  {/* Error Message */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-2 text-destructive text-sm"
                      >
                        <ShieldAlert className="size-4 shrink-0" />
                        <span>{error}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Submit Button */}
                  <Button
                    onClick={handleSubmit}
                    disabled={pin.length !== 4 || verifying}
                    className="w-full gap-2 gradient-emerald hover:opacity-90 text-white border-0 glow-emerald h-11 text-sm font-semibold"
                  >
                    {verifying ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                        className="size-4 border-2 border-white/30 border-t-white rounded-full"
                      />
                    ) : (
                      <>
                        <Lock className="size-4" />
                        Buka Kunci
                      </>
                    )}
                  </Button>
                </motion.div>

                {/* Decorative elements */}
                <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full gradient-emerald opacity-5 blur-3xl pointer-events-none" />
                <div className="absolute -left-8 -bottom-8 w-32 h-32 rounded-full gradient-gold opacity-5 blur-3xl pointer-events-none" />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
