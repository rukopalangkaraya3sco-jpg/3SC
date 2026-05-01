'use client'

import { useCallback } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, Users, LayoutGrid, Trophy, X, Menu } from 'lucide-react'

export type NavView = 'dashboard' | 'crew' | 'groups' | 'scoring'

interface NavbarProps {
  activeView: NavView
  onViewChange: (view: NavView) => void
  mobileOpen: boolean
  onMobileOpenChange: (open: boolean) => void
}

const navItems: { view: NavView; label: string; icon: React.ElementType }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { view: 'crew', label: 'Crew', icon: Users },
  { view: 'groups', label: 'Groups', icon: LayoutGrid },
  { view: 'scoring', label: 'Scoring', icon: Trophy },
]

export function Navbar({
  activeView,
  onViewChange,
  mobileOpen,
  onMobileOpenChange,
}: NavbarProps) {
  const handleNavClick = useCallback(
    (view: NavView) => {
      onViewChange(view)
      onMobileOpenChange(false)
    },
    [onViewChange, onMobileOpenChange]
  )

  return (
    <>
      {/* Mobile Header Bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 h-14 glass-strong border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg gradient-emerald p-1.5 glow-emerald">
            <BarChart3 className="size-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-glow-emerald">
            Claim Penjualan
          </span>
        </div>
        <button
          onClick={() => onMobileOpenChange(!mobileOpen)}
          className="rounded-lg p-2 hover:bg-white/5 transition-colors"
        >
          {mobileOpen ? (
            <X className="size-5" />
          ) : (
            <Menu className="size-5" />
          )}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => onMobileOpenChange(false)}
        />
      )}

      {/* Mobile Slide-out Nav */}
      <motion.aside
        initial={false}
        animate={{ x: mobileOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="lg:hidden fixed top-0 left-0 bottom-0 z-50 w-64 glass-strong border-r border-border flex flex-col"
      >
        <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border">
          <div className="rounded-lg gradient-emerald p-1.5 glow-emerald">
            <BarChart3 className="size-4 text-white" />
          </div>
          <span className="font-bold text-sm tracking-tight text-glow-emerald">
            Claim Penjualan
          </span>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeView === item.view
            return (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all
                  ${
                    isActive
                      ? 'gradient-emerald text-white glow-emerald'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }
                `}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </button>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Claim Penjualan
          </p>
        </div>
      </motion.aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col fixed top-0 left-0 bottom-0 w-64 glass-strong border-r border-border z-30">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
          <div className="rounded-lg gradient-emerald p-2 glow-emerald">
            <BarChart3 className="size-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-sm tracking-tight text-glow-emerald">
              Claim Penjualan
            </h1>
            <p className="text-[10px] text-muted-foreground leading-tight">
              Sales Management System
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = activeView === item.view
            return (
              <motion.button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                whileHover={{ x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all relative
                  ${
                    isActive
                      ? 'gradient-emerald text-white glow-emerald'
                      : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                  }
                `}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-emerald-400 -translate-x-1.5"
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                  />
                )}
              </motion.button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="p-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center">
            &copy; {new Date().getFullYear()} Claim Penjualan
          </p>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 glass-strong border-t border-border safe-area-bottom">
        <nav className="flex items-center justify-around h-14 px-2">
          {navItems.map((item) => {
            const isActive = activeView === item.view
            return (
              <button
                key={item.view}
                onClick={() => handleNavClick(item.view)}
                className={`
                  flex flex-col items-center gap-0.5 py-1 px-3 rounded-lg transition-all
                  ${
                    isActive
                      ? 'text-emerald-400'
                      : 'text-muted-foreground'
                  }
                `}
              >
                <item.icon className="size-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobileActiveIndicator"
                    className="absolute -top-px left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-emerald-400"
                    transition={{
                      type: 'spring',
                      damping: 25,
                      stiffness: 300,
                    }}
                  />
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </>
  )
}
