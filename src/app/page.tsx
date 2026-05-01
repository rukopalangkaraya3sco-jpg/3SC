'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import { Navbar, type NavView } from '@/components/navbar'
import { DashboardView } from '@/components/dashboard-view'
import { CrewView } from '@/components/crew-view'
import { GroupView } from '@/components/group-view'
import { ScoringView } from '@/components/scoring-view'
import { PinLock } from '@/components/pin-lock'

export default function Home() {
  const [activeView, setActiveView] = useState<NavView>('dashboard')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background">
      <Navbar
        activeView={activeView}
        onViewChange={setActiveView}
        mobileOpen={mobileNavOpen}
        onMobileOpenChange={setMobileNavOpen}
      />

      {/* Main Content Area */}
      <main className="lg:ml-64 pt-14 lg:pt-0 pb-16 lg:pb-0">
        <div className="p-4 lg:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {activeView === 'dashboard' && <DashboardView />}
              {activeView === 'crew' && (
                <PinLock section="crew">
                  <CrewView />
                </PinLock>
              )}
              {activeView === 'groups' && (
                <PinLock section="groups">
                  <GroupView />
                </PinLock>
              )}
              {activeView === 'scoring' && <ScoringView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}
