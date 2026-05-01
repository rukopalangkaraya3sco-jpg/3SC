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
  Target,
  ChevronRight,
  BarChart3,
  Flame,
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
import { Progress } from '@/components/ui/progress'

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

interface GroupAchievement {
  groupId: string
  groupName: string
  logoUrl: string
  targetBulanan: number
  weeklyTarget: number
  weeklyPercentage: number
  totalSettle: number
  totalQty: number
  progress: number
  weekNum: number
  crewCount: number
}

interface CrewMonthly {
  crewId: string
  namaCrew: string
  fotoUrl: string
  idKaryawan: string
  groupName: string | null
  totalSettle: number
  totalQty: number
  transactionCount: number
  avgPricePoint: number
  rank: number
}

type SortField = 'totalSettle' | 'totalQty' | 'basketSize' | 'pricePoint'
type SortDirection = 'asc' | 'desc'
type ScoringTab = 'daily' | 'group-achievement' | 'crew-monthly'

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

const formatCompact = (value: number) => {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}M`
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}Jt`
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`
  return String(value)
}

const getTodayGMT7 = () => {
  const now = new Date()
  const gmt7 = new Date(now.getTime() + 7 * 60 * 60 * 1000 + now.getTimezoneOffset() * 60 * 1000)
  const year = gmt7.getFullYear()
  const month = String(gmt7.getMonth() + 1).padStart(2, '0')
  const day = String(gmt7.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const getMonthLabel = (dateStr: string) => {
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const [, month] = dateStr.split('-').map(Number)
  return months[(month || 1) - 1]
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
        flex flex-col items-center gap-3 p-4 sm:p-5 rounded-xl border ${borderColor}
        bg-card/80 backdrop-blur-sm shadow-lg ${glowColor}
        ${isFirst ? 'lg:-mt-4 lg:pb-6' : 'lg:mt-4'}
        relative overflow-hidden
      `}
    >
      <div className={`absolute inset-0 bg-gradient-to-b ${medalGradient} opacity-5`} />

      <div className="relative z-10">
        <div className={`
          inline-flex items-center justify-center size-9 sm:size-10 rounded-full
          bg-gradient-to-br ${medalGradient} shadow-lg
        `}>
          {rank === 1 && <Crown className="size-4 sm:size-5 text-white" />}
          {rank === 2 && <Medal className="size-4 sm:size-5 text-white" />}
          {rank === 3 && <Award className="size-4 sm:size-5 text-white" />}
        </div>
      </div>

      <Avatar className={`size-14 sm:size-16 ring-2 ${borderColor} relative z-10`}>
        {crew.fotoUrl && crew.fotoUrl !== '-' && (
          <AvatarImage src={crew.fotoUrl} alt={crew.namaCrew} />
        )}
        <AvatarFallback className="gradient-emerald text-white text-sm sm:text-lg font-bold">
          {getInitials(crew.namaCrew)}
        </AvatarFallback>
      </Avatar>

      <div className="text-center relative z-10">
        <p className="font-bold text-sm truncate max-w-[120px]">{crew.namaCrew}</p>
        {crew.groupName && (
          <Badge variant="secondary" className="text-[9px] py-0 px-1.5 mt-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
            {crew.groupName}
          </Badge>
        )}
      </div>

      <div className="text-center relative z-10 space-y-1">
        <p className="text-base sm:text-lg font-bold tracking-tight">
          {formatCurrency(crew.totalSettle)}
        </p>
        <div className="flex items-center gap-2 justify-center text-[11px] sm:text-xs text-muted-foreground">
          <span>{crew.totalQty} qty</span>
          <span className="opacity-40">|</span>
          <span>BS {crew.basketSize.toFixed(1)}</span>
        </div>
      </div>
    </motion.div>
  )
}

// ─── Group Achievement Card ──────────────────────────────

function GroupAchievementCard({ group, index }: { group: GroupAchievement; index: number }) {
  const isTop3 = index < 3
  const isCompleted = group.progress >= 100
  const gradientBorder = isCompleted
    ? 'border-emerald-500/30'
    : isTop3
      ? 'border-yellow-500/20'
      : 'border-border/30'

  const progressColor = isCompleted
    ? '[&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-emerald-400'
    : group.progress >= 70
      ? '[&>div]:bg-gradient-to-r [&>div]:from-emerald-500 [&>div]:to-yellow-400'
      : '[&>div]:bg-gradient-to-r [&>div]:from-yellow-500 [&>div]:to-orange-400'

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06 }}
    >
      <Card className={`border ${gradientBorder} bg-card/60 backdrop-blur-sm hover:bg-card/80 transition-all`}>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            {/* Rank / Status */}
            <div className="shrink-0">
              {isCompleted ? (
                <div className="size-8 sm:size-9 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center">
                  <Flame className="size-4 text-emerald-400" />
                </div>
              ) : (
                <div className={`size-8 sm:size-9 rounded-full border flex items-center justify-center ${isTop3 ? 'bg-yellow-500/10 border-yellow-500/20' : 'bg-white/5 border-border/30'}`}>
                  <span className={`text-xs font-bold ${isTop3 ? 'text-yellow-400' : 'text-muted-foreground'}`}>
                    {index + 1}
                  </span>
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-sm truncate">{group.groupName}</span>
                {isCompleted && (
                  <Badge className="text-[9px] px-1.5 py-0 bg-emerald-500/15 text-emerald-400 border-emerald-500/25 shrink-0">
                    TARGET
                  </Badge>
                )}
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 shrink-0">
                  W{group.weekNum}
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="mb-1.5">
                <Progress
                  value={Math.min(group.progress, 100)}
                  className={`h-1.5 ${progressColor}`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    <Target className="size-3 inline mr-0.5" />
                    {group.progress}%
                  </span>
                  <span className="text-muted-foreground">
                    {group.crewCount} crew
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-foreground">
                    {formatCompact(group.totalSettle)}
                  </span>
                  <span className="text-muted-foreground">/</span>
                  <span className="text-muted-foreground">
                    {formatCompact(group.weeklyTarget)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

// ─── Monthly Crew Row Component ──────────────────────────

function MonthlyCrewRow({ crew }: { crew: CrewMonthly }) {
  const hasSales = crew.totalSettle > 0
  const rankIcon = getRankIcon(crew.rank)

  return (
    <TableRow className={`hover:bg-white/5 ${crew.rank <= 3 && hasSales ? 'bg-emerald-500/[0.02]' : ''} ${!hasSales ? 'opacity-40' : ''}`}>
      <TableCell className="text-center w-10">
        <div className={`inline-flex items-center justify-center size-7 rounded-full border ${hasSales ? getRankBg(crew.rank) : 'bg-white/5 border-border/30'}`}>
          {crew.rank <= 3 && hasSales && rankIcon ? (
            <rankIcon className={`size-3.5 ${getRankStyle(crew.rank)}`} />
          ) : (
            <span className="text-xs font-medium text-muted-foreground">{crew.rank}</span>
          )}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2.5">
          <Avatar className="size-8 shrink-0 ring-1 ring-white/10">
            {crew.fotoUrl && crew.fotoUrl !== '-' && (
              <AvatarImage src={crew.fotoUrl} alt={crew.namaCrew} />
            )}
            <AvatarFallback className="gradient-emerald text-white text-[9px] font-bold">
              {getInitials(crew.namaCrew)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <span className="text-sm font-medium truncate block">{crew.namaCrew}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">{crew.idKaryawan}</span>
              {crew.groupName && (
                <Badge variant="secondary" className="text-[8px] py-0 px-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                  {crew.groupName}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-right font-semibold text-sm hidden sm:table-cell">
        {formatCurrency(crew.totalSettle)}
      </TableCell>
      <TableCell className="text-right text-sm hidden md:table-cell">
        {crew.totalQty.toLocaleString('id-ID')}
      </TableCell>
      <TableCell className="text-right text-sm hidden lg:table-cell">
        {crew.transactionCount}
      </TableCell>
      <TableCell className="text-right text-sm hidden lg:table-cell">
        {formatCurrency(crew.avgPricePoint)}
      </TableCell>
      <TableCell className="text-right">
        <Badge
          variant="secondary"
          className={`text-[10px] font-semibold ${hasSales ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-white/5 text-muted-foreground'}`}
        >
          {formatCompact(crew.totalSettle)}
        </Badge>
      </TableCell>
    </TableRow>
  )
}

// ─── Main Scoring View ───────────────────────────────────

export function ScoringView() {
  const [date, setDate] = useState(getTodayGMT7)
  const [activeTab, setActiveTab] = useState<ScoringTab>('daily')

  // Daily scoring state
  const [data, setData] = useState<ScoringCrew[]>([])
  const [summary, setSummary] = useState<ScoringSummary>({
    totalSettle: 0,
    totalQty: 0,
    avgBasketSize: 0,
    avgPricePoint: 0,
    crewCount: 0,
  })

  // Group achievement state
  const [groupAchievements, setGroupAchievements] = useState<GroupAchievement[]>([])
  const [currentWeek, setCurrentWeek] = useState(1)

  // Crew monthly state
  const [crewMonthly, setCrewMonthly] = useState<CrewMonthly[]>([])
  const [monthlySummary, setMonthlySummary] = useState({ totalSettle: 0, totalQty: 0, activeCrew: 0 })

  const [loading, setLoading] = useState(true)
  const [sortField, setSortField] = useState<SortField>('totalSettle')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  // ─── Fetchers ───────────────────────────────────────

  const fetchDailyScoring = useCallback(async (dateParam: string) => {
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

  const fetchGroupAchievement = useCallback(async (dateParam: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/scoring/group-achievement?date=${dateParam}`)
      if (!res.ok) throw new Error('Gagal memuat data pencapaian group')
      const result = await res.json()
      setGroupAchievements(result.data ?? [])
      setCurrentWeek(result.weekNum ?? 1)
    } catch {
      toast.error('Gagal memuat data pencapaian group')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchCrewMonthly = useCallback(async (dateParam: string) => {
    try {
      setLoading(true)
      const res = await fetch(`/api/scoring/crew-monthly?date=${dateParam}`)
      if (!res.ok) throw new Error('Gagal memuat data penjualan crew')
      const result = await res.json()
      const crewData = result.data ?? []
      setCrewMonthly(crewData)
      setMonthlySummary({
        totalSettle: crewData.reduce((s: number, c: CrewMonthly) => s + c.totalSettle, 0),
        totalQty: crewData.reduce((s: number, c: CrewMonthly) => s + c.totalQty, 0),
        activeCrew: crewData.filter((c: CrewMonthly) => c.totalSettle > 0).length,
      })
    } catch {
      toast.error('Gagal memuat data penjualan crew')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeTab === 'daily') fetchDailyScoring(date)
    else if (activeTab === 'group-achievement') fetchGroupAchievement(date)
    else if (activeTab === 'crew-monthly') fetchCrewMonthly(date)
  }, [date, activeTab, fetchDailyScoring, fetchGroupAchievement, fetchCrewMonthly])

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

  const topCrew = useMemo(() => sortedData.slice(0, 3), [sortedData])

  // ─── Tab Config ────────────────────────────────────

  const tabs: { id: ScoringTab; label: string; icon: React.ElementType }[] = [
    { id: 'daily', label: 'Scoring Harian', icon: Trophy },
    { id: 'group-achievement', label: 'Target Group', icon: Target },
    { id: 'crew-monthly', label: 'Penjualan Crew', icon: BarChart3 },
  ]

  // ─── Summary Cards Config ──────────────────────────

  const dailySummaryCards = useMemo(
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

  const monthlySummaryCards = useMemo(
    () => [
      {
        label: 'Total Penjualan',
        value: formatCurrency(monthlySummary.totalSettle),
        icon: TrendingUp,
        gradient: 'gradient-emerald',
        glow: 'glow-emerald',
      },
      {
        label: 'Total Qty',
        value: monthlySummary.totalQty.toLocaleString('id-ID'),
        icon: ShoppingCart,
        gradient: 'gradient-gold',
        glow: 'glow-gold',
      },
      {
        label: 'Crew Aktif',
        value: `${monthlySummary.activeCrew}/${crewMonthly.length}`,
        icon: Users,
        gradient: 'gradient-emerald',
        glow: 'glow-emerald',
      },
      {
        label: 'Periode',
        value: getMonthLabel(date),
        icon: Calendar,
        gradient: 'gradient-gold',
        glow: 'glow-gold',
      },
    ],
    [monthlySummary, crewMonthly.length, date]
  )

  // ─── Render ─────────────────────────────────────────

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="size-5 sm:size-6 text-emerald-400" />
            Scoring
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Monitoring & leaderboard penjualan crew
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="size-3.5 sm:size-4 text-muted-foreground" />
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-auto bg-white/5 border-border/50 text-xs sm:text-sm"
          />
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 rounded-xl bg-card/60 border border-border/40 p-1 overflow-x-auto scrollbar-thin">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap
                ${isActive
                  ? 'bg-emerald-500/15 text-emerald-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }
              `}
            >
              <tab.icon className="size-3.5 sm:size-4" />
              <span className="hidden xs:inline">{tab.label}</span>
              <span className="xs:hidden">{tab.label.split(' ')[0]}</span>
            </button>
          )
        })}
      </div>

      {/* ═══════════════════════════════════════════════════
          TAB 1: SCORING HARIAN
          ═══════════════════════════════════════════════════ */}
      {activeTab === 'daily' && (
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {dailySummaryCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <Card className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm">
                  <CardContent className="p-3 sm:p-4 lg:p-5">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className={`rounded-lg ${card.gradient} p-1.5 sm:p-2 ${card.glow}`}>
                        <card.icon className="size-3.5 sm:size-4 text-white" />
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                      {card.value}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                      {card.label}
                    </p>
                    <div className={`absolute -right-3 -bottom-3 w-20 h-20 rounded-full ${card.gradient} opacity-10 blur-2xl`} />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Top Crew Podium */}
          {!loading && topCrew.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3 sm:mb-4">
                <Zap className="size-4 sm:size-5 text-emerald-400" />
                <h3 className="text-sm sm:text-lg font-semibold">Top Crew Hari Ini</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <AnimatePresence>
                  {topCrew.map((crew) => {
                    const rank = (sortedData.indexOf(crew) + 1) as 1 | 2 | 3
                    return <TopCrewPodium key={crew.crewId} crew={crew} rank={rank} />
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 sm:gap-4">
                    <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
                    <div className="h-3.5 w-28 rounded bg-muted animate-pulse" />
                    <div className="ml-auto h-3.5 w-16 rounded bg-muted animate-pulse" />
                    <div className="h-3.5 w-10 rounded bg-muted animate-pulse" />
                    <div className="hidden sm:block h-3.5 w-14 rounded bg-muted animate-pulse" />
                    <div className="hidden sm:block h-3.5 w-16 rounded bg-muted animate-pulse" />
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
              className="flex flex-col items-center justify-center py-14 sm:py-20 text-center"
            >
              <div className="rounded-full bg-white/5 p-4 sm:p-5 mb-3 sm:mb-4">
                <Trophy className="size-8 sm:size-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Belum ada data scoring</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Tidak ada data penjualan untuk tanggal ini
              </p>
            </motion.div>
          )}

          {/* Scoring Table */}
          {!loading && data.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden"
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10 text-center">#</TableHead>
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
                        className="text-right cursor-pointer select-none hover:text-foreground transition-colors hidden sm:table-cell"
                        onClick={() => handleSort('totalQty')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Total Qty
                          <ArrowUpDown className="size-3" />
                        </span>
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer select-none hover:text-foreground transition-colors hidden md:table-cell"
                        onClick={() => handleSort('basketSize')}
                      >
                        <span className="inline-flex items-center gap-1">
                          Basket Size
                          <ArrowUpDown className="size-3" />
                        </span>
                      </TableHead>
                      <TableHead
                        className="text-right cursor-pointer select-none hover:text-foreground transition-colors hidden lg:table-cell"
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
                          className={`hover:bg-white/5 ${rank <= 3 && hasSales ? 'bg-emerald-500/[0.02]' : ''} ${!hasSales ? 'opacity-40' : ''}`}
                        >
                          <TableCell className="text-center">
                            <div className={`inline-flex items-center justify-center size-7 rounded-full border ${hasSales ? getRankBg(rank) : 'bg-white/5 border-border/30'}`}>
                              {rank <= 3 && hasSales ? (
                                <Trophy className={`size-3.5 ${getRankStyle(rank)}`} />
                              ) : (
                                <span className="text-xs font-medium text-muted-foreground">{rank}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2.5">
                              <Avatar className="size-8 shrink-0 ring-1 ring-white/10">
                                {crew.fotoUrl && crew.fotoUrl !== '-' && (
                                  <AvatarImage src={crew.fotoUrl} alt={crew.namaCrew} />
                                )}
                                <AvatarFallback className="gradient-emerald text-white text-[9px] font-bold">
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
                                  <span className="text-[10px] text-muted-foreground">{crew.idKaryawan}</span>
                                  {crew.groupName && (
                                    <Badge variant="secondary" className="text-[8px] py-0 px-1 bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                      {crew.groupName}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-sm">{formatCurrency(crew.totalSettle)}</TableCell>
                          <TableCell className="text-right text-sm hidden sm:table-cell">{crew.totalQty.toLocaleString('id-ID')}</TableCell>
                          <TableCell className="text-right hidden md:table-cell">{crew.basketSize.toFixed(1)}</TableCell>
                          <TableCell className="text-right hidden lg:table-cell">{formatCurrency(crew.pricePoint)}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          {!loading && data.length > 0 && (
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
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
      )}

      {/* ═══════════════════════════════════════════════════
          TAB 2: PENCAPAIAN GROUP (TARGET WEEKLY)
          ═══════════════════════════════════════════════════ */}
      {activeTab === 'group-achievement' && (
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Week info header */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl gradient-emerald p-2.5 glow-emerald">
              <Target className="size-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Pencapaian Group</h3>
              <p className="text-xs text-muted-foreground">
                Progress menuju target Minggu {currentWeek} &mdash; {getMonthLabel(date)} {date.split('-')[0]}
              </p>
            </div>
          </div>

          {/* Summary stats */}
          <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl font-bold text-emerald-400">
                  {groupAchievements.filter((g) => g.progress >= 100).length}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Target Tercapai</p>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl font-bold text-yellow-400">
                  {groupAchievements.filter((g) => g.progress >= 70 && g.progress < 100).length}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Hampir Target</p>
              </CardContent>
            </Card>
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm">
              <CardContent className="p-3 sm:p-4 text-center">
                <p className="text-lg sm:text-2xl font-bold text-orange-400">
                  {groupAchievements.filter((g) => g.progress < 70).length}
                </p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Butuh Dorongan</p>
              </CardContent>
            </Card>
          </div>

          {/* Loading */}
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-border/40 bg-card/60">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3.5 w-32 rounded bg-muted animate-pulse" />
                        <div className="h-1.5 w-full rounded bg-muted animate-pulse" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Empty */}
          {!loading && groupAchievements.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-14 sm:py-20 text-center"
            >
              <div className="rounded-full bg-white/5 p-4 sm:p-5 mb-3 sm:mb-4">
                <Target className="size-8 sm:size-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Belum ada data group</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Buat group dan atur target untuk melihat pencapaian
              </p>
            </motion.div>
          )}

          {/* Group Achievement List */}
          {!loading && groupAchievements.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {groupAchievements.map((group, index) => (
                <GroupAchievementCard key={group.groupId} group={group} index={index} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          TAB 3: PENJUALAN CREW DALAM 1 BULAN
          ═══════════════════════════════════════════════════ */}
      {activeTab === 'crew-monthly' && (
        <div className="flex flex-col gap-4 sm:gap-6">
          {/* Month header */}
          <div className="flex items-center gap-3">
            <div className="rounded-xl gradient-gold p-2.5 glow-gold">
              <BarChart3 className="size-5 text-white" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-semibold">Penjualan Crew Bulanan</h3>
              <p className="text-xs text-muted-foreground">
                Ranking penjualan crew {getMonthLabel(date)} {date.split('-')[0]}
              </p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
            {monthlySummaryCards.map((card, index) => (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <Card className="relative overflow-hidden border-border/40 bg-card/60 backdrop-blur-sm">
                  <CardContent className="p-3 sm:p-4 lg:p-5">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <div className={`rounded-lg ${card.gradient} p-1.5 sm:p-2 ${card.glow}`}>
                        <card.icon className="size-3.5 sm:size-4 text-white" />
                      </div>
                    </div>
                    <p className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
                      {card.value}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                      {card.label}
                    </p>
                    <div className={`absolute -right-3 -bottom-3 w-20 h-20 rounded-full ${card.gradient} opacity-10 blur-2xl`} />
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Loading */}
          {loading && (
            <Card className="border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden">
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 sm:gap-4">
                    <div className="h-7 w-7 rounded-full bg-muted animate-pulse" />
                    <div className="h-3.5 w-28 rounded bg-muted animate-pulse" />
                    <div className="ml-auto h-3.5 w-16 rounded bg-muted animate-pulse" />
                    <div className="hidden sm:block h-3.5 w-10 rounded bg-muted animate-pulse" />
                    <div className="hidden lg:block h-3.5 w-12 rounded bg-muted animate-pulse" />
                    <div className="hidden lg:block h-3.5 w-16 rounded bg-muted animate-pulse" />
                    <div className="h-3.5 w-14 rounded bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Empty */}
          {!loading && crewMonthly.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center py-14 sm:py-20 text-center"
            >
              <div className="rounded-full bg-white/5 p-4 sm:p-5 mb-3 sm:mb-4">
                <BarChart3 className="size-8 sm:size-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg sm:text-xl font-semibold">Belum ada data crew</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                Tidak ada data penjualan untuk bulan ini
              </p>
            </motion.div>
          )}

          {/* Crew Monthly Table */}
          {!loading && crewMonthly.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-border/40 bg-card/60 backdrop-blur-sm overflow-hidden"
            >
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="w-10 text-center">#</TableHead>
                      <TableHead>Crew</TableHead>
                      <TableHead className="text-right hidden sm:table-cell">Total Settle</TableHead>
                      <TableHead className="text-right hidden md:table-cell">Total Qty</TableHead>
                      <TableHead className="text-right hidden lg:table-cell">Transaksi</TableHead>
                      <TableHead className="text-right hidden lg:table-cell">Avg PP</TableHead>
                      <TableHead className="text-right">Settle</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {crewMonthly.map((crew) => (
                      <MonthlyCrewRow key={crew.crewId} crew={crew} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </motion.div>
          )}

          {/* Footer */}
          {!loading && crewMonthly.length > 0 && (
            <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Users className="size-3" />
                {crewMonthly.length} crew terdaftar &mdash; {monthlySummary.activeCrew} aktif
              </span>
              <span>{getMonthLabel(date)} {date.split('-')[0]}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
