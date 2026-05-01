'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Trophy,
  TrendingUp,
  ShoppingCart,
  Tag,
  Calendar,
  Users,
  ArrowUpDown,
  Crown,
  Medal,
  Award,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

// ─── Types ────────────────────────────────────────────────

interface ScoringCrew {
  crewId: string
  namaCrew: string
  fotoUrl: string
  idKaryawan: string
  groupName: string | null
  totalSettle: number
  totalQty: number
  basketSize: number
  pricePoint: number
  hourlyBreakdown: { hour: number; qty: number; settle: number }[]
}

interface ScoringSummary {
  totalSettle: number
  totalQty: number
  avgBasketSize: number
  avgPricePoint: number
  crewCount: number
  activeCrewCount?: number
}

type SortField = 'totalSettle' | 'totalQty' | 'basketSize' | 'pricePoint'
type SortDirection = 'asc' | 'desc'

// ─── Helpers ──────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('IDR', 'Rp')
    .trim()

const getTodayGMT7 = () => {
  const now = new Date()
  const gmt7 = new Date(now.getTime() + 7 * 60 * 60 * 1000 + now.getTimezoneOffset() * 60 * 1000)
  const year = gmt7.getFullYear()
  const month = String(gmt7.getMonth() + 1).padStart(2, '0')
  const day = String(gmt7.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

const getRankStyle = (rank: number) => {
  if (rank === 1) return 'text-yellow-400'
  if (rank === 2) return 'text-gray-300'
  if (rank === 3) return 'text-amber-600'
  return 'text-muted-foreground'
}

const getRankBg = (rank: number) => {
  if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/20'
  if (rank === 2) return 'bg-gray-400/10 border-gray-400/20'
  if (rank === 3) return 'bg-amber-600/10 border-amber-600/20'
  return 'bg-white/5 border-border/30'
}

const getRankIcon = (rank: number) => {
  if (rank === 1) return Crown
  if (rank === 2) return Medal
  if (rank === 3) return Award
  return null
}

// ─── Top Crew Podium Component ───────────────────────────

function TopCrewPodium({ crew, rank }: { crew: ScoringCrew; rank: 1 | 2 | 3 }) {
  const isFirst = rank === 1

  const borderColor = rank === 1
    ? 'border-yellow-500/40'
    : rank === 2
      ? 'border-gray-400/40'
      : 'border-amber-600/40'

  const glowColor = rank === 1
    ? 'shadow-yellow-500/20'
    : rank === 2
      ? 'shadow-gray-400/20'
      : 'shadow-amber-600/20'

  const badgeBg = rank === 1
    ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
    : rank === 2
      ? 'bg-gray-400/10 text-gray-300 border-gray-400/20'
      : 'bg-amber-600/10 text-amber-500 border-amber-600/20'

  const medalGradient = rank === 1
    ? 'from-yellow-500 to-amber-600'
    : rank === 2
      ? 'from-gray-300 to-gray-500'
      : 'from-amber-600 to-amber-800'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (rank - 1) * 0.15 }}
      className={`
        flex flex-col items-center gap-3 p-5 rounded-xl border ${borderColor}
        bg-card/80 backdrop-blur-sm shadow-lg ${glowColor}
        ${isFirst ? 'lg:-mt-4 lg:pb-6' : 'lg:mt-4'}
        relative overflow-hidden
      `}
    >
      {/* Decorative background */}
      <div className={`absolute inset-0 bg-gradient-to-b ${medalGradient} opacity-5`} />

      {/* Rank Badge */}
      <div className="relative z-10">
        <div className={`
          inline-flex items-center justify-center size-10 rounded-full
          bg-gradient-to-br ${medalGradient} shadow-lg
        `}>
          {rank === 1 && <Crown className="size-5 text-white" />}
          {rank === 2 && <Medal className="size-5 text-white" />}
          {rank === 3 && <Award className="size-5 text-white" />}
        </div>
      </div>

      {/* Avatar */}
      <Avatar className={`size-16 ring-2 ${borderColor} relative z-10`}>
        {crew.fotoUrl && crew.fotoUrl !== '-' && (
          <AvatarImage src={crew.fotoUrl} alt={crew.namaCrew} />
        )}
        <AvatarFallback className="gradient-emerald text-white text-lg font-bold">
          {getInitials(crew.namaCrew)}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <div className="text-center relative z-10">
        <p className="font-bold text-sm truncate max-w-[120px]">{crew.namaCrew}</p>
        {crew.groupName && (
          <Badge variant="secondary" className={`text-[9px] py-0 px-1.5 mt-1 ${badgeBg}`}>
            {crew.groupName}
          </Badge>
        )}
      </div>

      {/* Stats */}
      <div className="text-center relative z-10 space-y-1">
        <p className="text-lg font-bold tracking-tight">
          {formatCurrency(crew.totalSettle)}
        </p>
        <div className="flex items-center gap-2 justify-center text-xs text-muted-foreground">
          <span>{crew.totalQty} qty</span>
          <span>·</span>
          <span>BS {crew.basketSize.toFixed(1)}</span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Component ────────────────────────────────────────────

export function ScoringView() {
  const [date, setDate] = useState(getTodayGMT7)
  const [data, setData] = useState<ScoringCrew[]>([])
  const [summary, setSummary] = useState<ScoringSummary>({
    totalSettle: 0,
    totalQty: 0,
    avgBasketSize: 0,
    avgPricePoint: 0,
    crewCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('totalSettle')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // ─── Fetchers ───────────────────────────────────────

  const fetchScoring = useCallback(async (dateParam: string) => {
    try {
      setLoading(true)
      const [scoringRes, summaryRes] = await Promise.all([
        fetch(`/api/scoring?date=${dateParam}`),
        fetch(`/api/scoring/summary?date=${dateParam}`),
      ])

      if (!scoringRes.ok || !summaryRes.ok) {
        throw new Error('Gagal memuat data scoring')
      }

      const scoringData = await scoringRes.json()
      const summaryData = await summaryRes.json()

      setData(scoringData.data ?? [])
      setSummary(summaryData)
    } catch {
      toast.error('Gagal memuat data scoring')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchScoring(date)
  }, [date, fetchScoring])

  // ─── Sort ──────────────────────────────────────────

  const sortedData = useMemo(() => {
    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      return sortDirection === 'desc'
        ? (bVal as number) - (aVal as number)
        : (aVal as number) - (bVal as number)
    })
    return sorted
  }, [data, sortField, sortDirection])

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortDirection((d) => (d === 'desc' ? 'asc' : 'desc'))
      } else {
        setSortField(field)
        setSortDirection('desc')
      }
    },
    [sortField]
  )

  // Top 3 crew for today
  const topCrew = useMemo(() => {
    return sortedData.slice(0, 3)
  }, [sortedData])

  // ─── Summary Cards Config ──────────────────────────

  const summaryCards = useMemo(
    () => [
      {
        label: 'Total Penjualan',
        value: formatCurrency(summary.totalSettle),
        icon: TrendingUp,
        gradient: 'gradient-emerald',
        glow: 'glow-emerald',
      },
      {
        label: 'Total Qty',
        value: summary.totalQty.toLocaleString('id-ID'),
        icon: ShoppingCart,
        gradient: 'gradient-gold',
        glow: 'glow-gold',
      },
      {
        label: 'Avg Basket Size',
        value: summary.avgBasketSize.toFixed(1),
        icon: ShoppingCart,
        gradient: 'gradient-emerald',
        glow: 'glow-emerald',
      },
      {
        label: 'Avg Price Point',
        value: formatCurrency(summary.avgPricePoint),
        icon: Tag,
        gradient: 'gradient-gold',
        glow: 'glow-gold',
      },
    ],
    [summary]
  )

  // ─── Render ─────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="size-6 text-emerald-400" />
            Scoring Harian
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Ranking penjualan crew per hari
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground" />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto bg-white/5 border-border/50 text-sm"
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {summaryCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            <Card className="relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm">
              <CardContent className="p-4 lg:p-5">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`rounded-lg ${card.gradient} p-2 ${card.glow}`}
                  >
                    <card.icon className="size-4 text-white" />
                  </div>
                </div>
                <p className="text-2xl lg:text-3xl font-bold tracking-tight">
                  {card.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {card.label}
                </p>
                <div
                  className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${card.gradient} opacity-10 blur-2xl`}
                />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Top Crew Penjualan Hari Ini */}
      {!loading && topCrew.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Zap className="size-5 text-emerald-400" />
            <h3 className="text-lg font-semibold">Top Crew Penjualan Hari Ini</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AnimatePresence>
              {topCrew.map((crew) => {
                const rank = (sortedData.indexOf(crew) + 1) as 1 | 2 | 3
                return (
                  <TopCrewPodium key={crew.crewId} crew={crew} rank={rank} />
                )
              })}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
          <div className="p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="h-4 w-32 rounded bg-muted animate-pulse" />
                <div className="ml-auto h-4 w-20 rounded bg-muted animate-pulse" />
                <div className="h-4 w-12 rounded bg-muted animate-pulse" />
                <div className="h-4 w-16 rounded bg-muted animate-pulse" />
                <div className="h-4 w-20 rounded bg-muted animate-pulse" />
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Empty */}
      {!loading && data.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="rounded-full bg-white/5 p-5 mb-4">
            <Trophy className="size-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">Belum ada data scoring</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Tidak ada data penjualan untuk tanggal ini
          </p>
        </motion.div>
      )}

      {/* Scoring Table */}
      {!loading && data.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-12 text-center">#</TableHead>
                  <TableHead>Crew</TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort('totalSettle')}
                  >
                    <span className="inline-flex items-center gap-1">
                      Total Settle
                      <ArrowUpDown className="size-3" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort('totalQty')}
                  >
                    <span className="inline-flex items-center gap-1">
                      Total Qty
                      <ArrowUpDown className="size-3" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort('basketSize')}
                  >
                    <span className="inline-flex items-center gap-1">
                      Basket Size
                      <ArrowUpDown className="size-3" />
                    </span>
                  </TableHead>
                  <TableHead
                    className="text-right cursor-pointer select-none hover:text-foreground transition-colors"
                    onClick={() => handleSort('pricePoint')}
                  >
                    <span className="inline-flex items-center gap-1">
                      Price Point
                      <ArrowUpDown className="size-3" />
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData.map((crew, index) => {
                  const rank = index + 1
                  const hasSales = crew.totalSettle > 0
                  return (
                    <TableRow
                      key={crew.crewId}
                      className={`hover:bg-white/5 ${rank <= 3 && hasSales ? 'bg-emerald-500/[0.02]' : ''} ${!hasSales ? 'opacity-50' : ''}`}
                    >
                      <TableCell className="text-center">
                        <div
                          className={`inline-flex items-center justify-center size-7 rounded-full border ${hasSales ? getRankBg(rank) : 'bg-white/5 border-border/30'}`}
                        >
                          {rank <= 3 && hasSales ? (
                            <Trophy
                              className={`size-3.5 ${getRankStyle(rank)}`}
                            />
                          ) : (
                            <span className="text-xs font-medium text-muted-foreground">
                              {rank}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="size-9 shrink-0 ring-1 ring-white/10">
                            {crew.fotoUrl && crew.fotoUrl !== '-' && (
                              <AvatarImage
                                src={crew.fotoUrl}
                                alt={crew.namaCrew}
                              />
                            )}
                            <AvatarFallback className="gradient-emerald text-white text-[10px] font-bold">
                              {getInitials(crew.namaCrew)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-medium truncate">
                              {crew.namaCrew}
                              {!hasSales && (
                                <span className="text-muted-foreground text-[10px] ml-1.5">(no sales)</span>
                              )}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] text-muted-foreground">
                                {crew.idKaryawan}
                              </span>
                              {crew.groupName && (
                                <Badge
                                  variant="secondary"
                                  className="text-[9px] py-0 px-1.5 bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                >
                                  {crew.groupName}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(crew.totalSettle)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {crew.totalQty.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        {crew.basketSize.toFixed(1)}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(crew.pricePoint)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </motion.div>
      )}

      {/* Footer info */}
      {!loading && data.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="size-3" />
            {summary.crewCount} crew terdaftar
            {summary.activeCrewCount !== undefined && summary.activeCrewCount < summary.crewCount && (
              <span className="text-emerald-400">({summary.activeCrewCount} aktif)</span>
            )}
          </span>
          <span>Data untuk {date} (GMT+7)</span>
        </div>
      )}
    </div>
  )
}
