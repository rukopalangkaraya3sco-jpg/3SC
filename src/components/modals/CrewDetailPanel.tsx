'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { X, Zap, TrendingUp, BarChart3, Flame } from 'lucide-react'
import { fmtRp, fmtNum } from '@/lib/cms-utils'
import type { CrewStat } from '@/lib/cms-types'

interface CrewDetailPanelProps {
  selectedCrewDetail: CrewStat | null
  setSelectedCrewDetail: (c: CrewStat | null) => void
}

export default function CrewDetailPanel({ selectedCrewDetail, setSelectedCrewDetail }: CrewDetailPanelProps) {
  return (
    <AnimatePresence>
      {selectedCrewDetail && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" onClick={() => setSelectedCrewDetail(null)} />
          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white dark:bg-gray-900 border-l shadow-2xl z-50 overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Statistik Crew</h3>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setSelectedCrewDetail(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <Avatar className="w-14 h-14 border-2 border-emerald-200 dark:border-emerald-800">
                  <AvatarImage src={selectedCrewDetail.photo || ''} />
                  <AvatarFallback className="bg-gradient-to-br from-emerald-400 to-emerald-600 text-white font-bold text-lg">
                    {selectedCrewDetail.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold">{selectedCrewDetail.name}</p>
                  <p className="text-sm text-muted-foreground">{selectedCrewDetail.groupName}</p>
                  <p className="text-xs text-muted-foreground font-mono">{selectedCrewDetail.employeeId}</p>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Hari Ini', value: selectedCrewDetail.todayTotal, qty: selectedCrewDetail.todayQty, struk: selectedCrewDetail.todayStruk, icon: Zap, color: 'from-emerald-500 to-teal-600' },
                  { label: 'Minggu Ini', value: selectedCrewDetail.weekTotal, qty: selectedCrewDetail.weekQty, struk: selectedCrewDetail.weekStruk, icon: TrendingUp, color: 'from-amber-500 to-orange-600' },
                  { label: 'Bulan Ini', value: selectedCrewDetail.monthTotal, qty: selectedCrewDetail.monthQty, struk: selectedCrewDetail.monthStruk, icon: BarChart3, color: 'from-purple-500 to-violet-600' },
                  { label: 'All Time', value: selectedCrewDetail.allTimeTotal, qty: selectedCrewDetail.allTimeQty, struk: selectedCrewDetail.allTimeStruk, icon: Flame, color: 'from-cyan-500 to-sky-600' },
                ].map((s, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                    <div className="flex items-center gap-3 p-3 rounded-xl border bg-gradient-to-r from-white to-gray-50/50 dark:from-gray-800 dark:to-gray-900">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shrink-0`}>
                        <s.icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{s.label}</p>
                        <p className="font-bold">{fmtRp(s.value)}</p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5">
                        <Badge variant="outline" className="text-[10px] px-1.5">{fmtNum(s.qty)} qty</Badge>
                        <span className="text-[10px] text-muted-foreground">{fmtNum(s.struk)} struk</span>
                      </div>
                    </div>
                    {/* Basket Size & Price Point row */}
                    <div className="ml-13 mt-1 flex items-center gap-3 text-[10px] px-1">
                      <span className="text-purple-600 dark:text-purple-400 font-medium">
                        🧺 Basket: {(s.struk > 0 ? (s.qty / s.struk).toFixed(2) : '0.00')}
                      </span>
                      <span className="text-cyan-600 dark:text-cyan-400 font-medium">
                        💰 Price Point: {fmtRp(s.qty > 0 ? Math.round(s.value / s.qty) : 0)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              <div className="p-3 rounded-xl bg-muted/50 border text-center">
                <p className="text-xs text-muted-foreground">Total Transaksi (item rows)</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{fmtNum(selectedCrewDetail.transactionCount)}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{fmtNum(selectedCrewDetail.allTimeStruk)} struk unik (id transaksi)</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
