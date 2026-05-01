'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  UserCheck,
  Upload,
  Clock,
  FileText,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Users,
  LayoutGrid,
  X,
  CheckSquare,
  Square,
  UserPlus,
  Calendar,
  ClipboardList,
  ClipboardCheck,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// ─── Types ────────────────────────────────────────────────

interface Crew {
  id: string
  namaCrew: string
  fotoUrl: string
  idKaryawan: string
}

interface Group {
  id: string
  namaGrup: string
}

interface SalesRecord {
  id: string
  tanggal: string
  kodeExtend: string
  qty: number
  settle: number
  crewId: string | null
  crew: Crew | null
}

interface SalesResponse {
  data: SalesRecord[]
  total: number
  page: number
  limit: number
  totalPages: number
  aggregateSettle: number
  aggregateQty: number
}

interface ImportBatch {
  id: string
  fileName: string
  totalRecords: number
  importDate: string
}

interface Stats {
  totalSales: number
  totalSettle: number
  totalCrew: number
  totalGroups: number
}

type TabType = 'unclaim' | 'claim'

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

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  const day = String(date.getDate()).padStart(2, '0')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const year = date.getFullYear()
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

/**
 * Get today's date string in GMT+7 (WIB)
 */
const getTodayGMT7 = () => {
  const now = new Date()
  const gmt7 = new Date(now.getTime() + 7 * 60 * 60 * 1000 + now.getTimezoneOffset() * 60 * 1000)
  const year = gmt7.getFullYear()
  const month = String(gmt7.getMonth() + 1).padStart(2, '0')
  const day = String(gmt7.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Format date string for display (GMT+7)
 */
const formatDateGMT7 = (dateStr: string) => {
  const date = new Date(dateStr)
  // Convert to GMT+7
  const gmt7 = new Date(date.getTime() + 7 * 60 * 60 * 1000)
  const day = String(gmt7.getUTCDate()).padStart(2, '0')
  const month = String(gmt7.getUTCMonth() + 1).padStart(2, '0')
  const year = gmt7.getUTCFullYear()
  const hours = String(gmt7.getUTCHours()).padStart(2, '0')
  const minutes = String(gmt7.getUTCMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${minutes}`
}

// ─── Crew Search Box Component ────────────────────────────

function CrewSearchBox({
  crew,
  crews,
  assigningId,
  onAssign,
  onUnassign,
}: {
  crew: Crew | null
  crews: Crew[]
  assigningId: string | null
  onAssign: (crewId: string) => void
  onUnassign: () => void
}) {
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const filteredCrews = useMemo(
    () =>
      crews.filter((c) =>
        c.namaCrew.toLowerCase().includes(searchQuery.toLowerCase())
      ),
    [crews, searchQuery]
  )

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setSearchOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (crew && !searchOpen) {
    return (
      <div className="flex items-center gap-1.5 rounded-md px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-sm w-[160px]">
        <UserCheck className="size-3.5 text-emerald-400 shrink-0" />
        <span className="truncate flex-1 text-emerald-300 text-xs">
          {crew.namaCrew}
        </span>
        <button
          onClick={onUnassign}
          className="shrink-0 rounded-full p-0.5 hover:bg-emerald-500/20 transition-colors"
          disabled={!!assigningId}
        >
          <X className="size-3 text-emerald-400/70 hover:text-emerald-300" />
        </button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative w-[160px]">
      <div className="flex items-center gap-1">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
          <Input
            placeholder="Cari crew..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchOpen(true)}
            className="h-7 text-xs pl-7 pr-2 bg-white/5 border-border/50"
            disabled={!!assigningId}
          />
        </div>
      </div>
      <AnimatePresence>
        {searchOpen && filteredCrews.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 top-full mt-1 left-0 right-0 max-h-48 overflow-y-auto rounded-md border border-border/50 bg-card shadow-xl scrollbar-thin"
          >
            {filteredCrews.map((c) => (
              <button
                key={c.id}
                onClick={() => {
                  onAssign(c.id)
                  setSearchOpen(false)
                  setSearchQuery('')
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-white/5 transition-colors text-left"
              >
                <UserCheck className="size-3 text-muted-foreground shrink-0" />
                <span className="truncate">{c.namaCrew}</span>
              </button>
            ))}
          </motion.div>
        )}
        {searchOpen && searchQuery && filteredCrews.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="absolute z-50 top-full mt-1 left-0 right-0 rounded-md border border-border/50 bg-card shadow-xl"
          >
            <p className="px-3 py-2 text-xs text-muted-foreground">
              Crew tidak ditemukan
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Component ────────────────────────────────────────────

export function DashboardView() {
  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('unclaim')
  const [date, setDate] = useState(getTodayGMT7)

  // Sales state
  const [salesData, setSalesData] = useState<SalesRecord[]>([])
  const [crews, setCrews] = useState<Crew[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [assigningId, setAssigningId] = useState<string | null>(null)
  const limit = 40

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [batchAssignOpen, setBatchAssignOpen] = useState(false)
  const [batchSearchQuery, setBatchSearchQuery] = useState('')
  const batchAssignRef = useRef<HTMLDivElement>(null)

  // Import state
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [batches, setBatches] = useState<ImportBatch[]>([])
  const [loadingBatches, setLoadingBatches] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [showImport, setShowImport] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Stats
  const [stats, setStats] = useState<Stats>({
    totalSales: 0,
    totalSettle: 0,
    totalCrew: 0,
    totalGroups: 0,
  })

  // ─── Fetchers ───────────────────────────────────────

  const fetchSales = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        search,
        tab: activeTab,
        date,
      })
      const res = await fetch(`/api/sales?${params}`)
      if (!res.ok) throw new Error('Gagal memuat data penjualan')
      const data: SalesResponse = await res.json()
      setSalesData(data.data)
      setTotalPages(data.totalPages)
      setTotal(data.total)
      setStats((s) => ({
        ...s,
        totalSales: data.total,
        totalSettle: data.aggregateSettle,
      }))
    } catch {
      toast.error('Gagal memuat data penjualan')
    } finally {
      setLoading(false)
    }
  }, [page, search, activeTab, date])

  const fetchCrews = useCallback(async () => {
    try {
      const res = await fetch('/api/crews')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setCrews(data)
      setStats((s) => ({ ...s, totalCrew: data.length }))
    } catch {
      /* silent */
    }
  }, [])

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setGroups(data)
      setStats((s) => ({ ...s, totalGroups: data.length }))
    } catch {
      /* silent */
    }
  }, [])

  const fetchBatches = useCallback(async () => {
    try {
      setLoadingBatches(true)
      const res = await fetch('/api/sales/batches')
      if (!res.ok) throw new Error('Gagal memuat riwayat import')
      const data = await res.json()
      setBatches(data)
    } catch {
      toast.error('Gagal memuat riwayat import')
    } finally {
      setLoadingBatches(false)
    }
  }, [])

  // ─── Effects ────────────────────────────────────────

  useEffect(() => {
    fetchSales()
  }, [fetchSales])

  useEffect(() => {
    fetchCrews()
    fetchGroups()
    fetchBatches()
  }, [fetchCrews, fetchGroups, fetchBatches])

  // Page-level totals (for table footer)
  const pageTotals = useMemo(() => {
    const totalQty = salesData.reduce((sum, s) => sum + s.qty, 0)
    const totalSettle = salesData.reduce((sum, s) => sum + s.settle, 0)
    return { totalQty, totalSettle }
  }, [salesData])

  // Close batch assign dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        batchAssignRef.current &&
        !batchAssignRef.current.contains(e.target as Node)
      ) {
        setBatchAssignOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Reset selection when tab changes
  useEffect(() => {
    setSelectedIds(new Set())
    setPage(1)
  }, [activeTab])

  // ─── Handlers ───────────────────────────────────────

  const handleSearch = useCallback((value: string) => {
    setSearch(value)
    setPage(1)
    setSelectedIds(new Set())
  }, [])

  const handleDateChange = useCallback((value: string) => {
    setDate(value)
    setPage(1)
    setSelectedIds(new Set())
  }, [])

  const handleAssignCrew = useCallback(
    async (salesId: string, crewId: string) => {
      setAssigningId(salesId)
      try {
        const res = await fetch('/api/sales/assign-crew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ salesId, crewId }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Gagal menugaskan crew')
        }
        const crew = crews.find((c) => c.id === crewId)
        toast.success(`Crew "${crew?.namaCrew}" berhasil ditugaskan`)
        fetchSales()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Gagal menugaskan crew'
        )
      } finally {
        setAssigningId(null)
      }
    },
    [crews, fetchSales]
  )

  const handleUnassignCrew = useCallback(
    async (salesId: string) => {
      setAssigningId(salesId)
      try {
        const res = await fetch('/api/sales/assign-crew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ salesId, crewId: '' }),
        })
        if (!res.ok) throw new Error('Gagal melepas crew')
        toast.success('Crew berhasil dilepas')
        fetchSales()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Gagal melepas crew'
        )
      } finally {
        setAssigningId(null)
      }
    },
    [fetchSales]
  )

  // Multi-select handlers
  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === salesData.length) {
        return new Set()
      }
      return new Set(salesData.map((s) => s.id))
    })
  }, [salesData])

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set())
  }, [])

  const handleBatchAssign = useCallback(
    async (crewId: string) => {
      const ids = Array.from(selectedIds)
      if (ids.length === 0) return

      try {
        const res = await fetch('/api/sales/batch-assign-crew', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ salesIds: ids, crewId }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Gagal menugaskan crew')
        }
        const crew = crews.find((c) => c.id === crewId)
        toast.success(
          `${ids.length} data berhasil ditugaskan ke "${crew?.namaCrew}"`
        )
        setSelectedIds(new Set())
        setBatchAssignOpen(false)
        fetchSales()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Gagal menugaskan crew'
        )
      }
    },
    [selectedIds, crews, fetchSales]
  )

  const handleFileSelect = useCallback((selectedFile: File) => {
    const validExtensions = ['.xlsx', '.xls']
    const ext = selectedFile.name
      .slice(selectedFile.name.lastIndexOf('.'))
      .toLowerCase()
    if (!validExtensions.includes(ext)) {
      toast.error('Harap upload file Excel (.xlsx atau .xls)')
      return
    }
    setFile(selectedFile)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) handleFileSelect(droppedFile)
    },
    [handleFileSelect]
  )

  const handleUpload = useCallback(async () => {
    if (!file) return
    setUploading(true)
    setProgress(0)
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval)
          return 90
        }
        return prev + Math.random() * 15
      })
    }, 200)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await fetch('/api/sales/import', {
        method: 'POST',
        body: formData,
      })
      clearInterval(progressInterval)
      setProgress(100)

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal mengimport file')
      }
      const result = await res.json()
      const dupInfo = result.skippedDuplicates > 0
        ? ` (${result.skippedDuplicates} data duplikat dilewati)`
        : ''
      toast.success(
        `Berhasil mengimport ${result.totalRecords ?? result.count ?? 0} data penjualan${dupInfo}`
      )
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
      fetchBatches()
      fetchSales()
      fetchCrews()
      fetchGroups()
    } catch (err) {
      clearInterval(progressInterval)
      setProgress(0)
      toast.error(err instanceof Error ? err.message : 'Gagal mengimport file')
    } finally {
      setUploading(false)
    }
  }, [file, fetchBatches, fetchSales, fetchCrews, fetchGroups])

  const sortedBatches = useMemo(
    () =>
      [...batches].sort(
        (a, b) =>
          new Date(b.importDate).getTime() - new Date(a.importDate).getTime()
      ),
    [batches]
  )

  const filteredBatchCrews = useMemo(
    () =>
      crews.filter((c) =>
        c.namaCrew.toLowerCase().includes(batchSearchQuery.toLowerCase())
      ),
    [crews, batchSearchQuery]
  )

  // ─── Tab Config ──────────────────────────────────────

  const tabs: { id: TabType; label: string; icon: typeof ClipboardList; count: number }[] = [
    { id: 'unclaim', label: 'Unclaim', icon: ClipboardList, count: activeTab === 'unclaim' ? total : 0 },
    { id: 'claim', label: 'Claimed', icon: ClipboardCheck, count: activeTab === 'claim' ? total : 0 },
  ]

  // ─── Stat Cards Config ──────────────────────────────

  const statCards = useMemo(
    () => [
      {
        label: 'Total Sales',
        value: stats.totalSales.toLocaleString('id-ID'),
        icon: TrendingUp,
        gradient: 'gradient-emerald',
        glow: 'glow-emerald',
      },
      {
        label: 'Total Settle',
        value: formatCurrency(stats.totalSettle),
        icon: DollarSign,
        gradient: 'gradient-gold',
        glow: 'glow-gold',
      },
      {
        label: 'Total Crew',
        value: String(stats.totalCrew),
        icon: Users,
        gradient: 'gradient-emerald',
        glow: 'glow-emerald',
      },
      {
        label: 'Total Groups',
        value: String(stats.totalGroups),
        icon: LayoutGrid,
        gradient: 'gradient-gold',
        glow: 'glow-gold',
      },
    ],
    [stats]
  )

  // ─── Render ─────────────────────────────────────────

  return (
    <div className="flex flex-col gap-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
        {statCards.map((card, index) => (
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
                {/* Decorative gradient */}
                <div
                  className={`absolute -right-4 -bottom-4 w-24 h-24 rounded-full ${card.gradient} opacity-10 blur-2xl`}
                />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Header: Title + Import Button */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-lg font-semibold">Data Penjualan</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowImport(!showImport)}
          className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300"
        >
          <Upload className="size-4" />
          {showImport ? 'Tutup Import' : 'Import Data'}
        </Button>
      </div>

      {/* Import Section (collapsible) */}
      <AnimatePresence>
        {showImport && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
              <CardContent className="p-5">
                <div
                  onDrop={handleDrop}
                  onDragOver={(e) => {
                    e.preventDefault()
                    setIsDragging(true)
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault()
                    setIsDragging(false)
                  }}
                  className={`
                    relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed
                    p-8 text-center transition-all cursor-pointer
                    ${
                      isDragging
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : file
                          ? 'border-emerald-400/50 bg-emerald-500/5'
                          : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                    }
                  `}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    className="hidden"
                    onChange={(e) => {
                      const selected = e.target.files?.[0]
                      if (selected) handleFileSelect(selected)
                    }}
                  />

                  {file ? (
                    <motion.div
                      initial={{ scale: 0.9, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="rounded-full gradient-emerald p-3 glow-emerald">
                        <FileSpreadsheet className="size-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">{file.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                      <CheckCircle2 className="size-5 text-emerald-400" />
                    </motion.div>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <div className="rounded-full bg-white/5 p-3">
                        <Upload className="size-6 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">
                          Drag & drop file Excel di sini
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          atau klik untuk memilih file (.xlsx, .xls)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {uploading && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 flex flex-col gap-2"
                  >
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-muted-foreground text-center">
                      Mengimport data... {Math.round(progress)}%
                    </p>
                  </motion.div>
                )}

                {file && !uploading && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 flex justify-center"
                  >
                    <Button
                      onClick={handleUpload}
                      className="gap-2 gradient-emerald hover:opacity-90 text-white border-0"
                      size="lg"
                    >
                      <Upload className="size-4" />
                      Import Data Penjualan
                    </Button>
                  </motion.div>
                )}

                {/* Recent Batches */}
                {sortedBatches.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-border/50">
                    <h3 className="text-sm font-medium text-muted-foreground mb-3">
                      Riwayat Import Terakhir
                    </h3>
                    <div className="flex flex-col gap-2 max-h-40 overflow-y-auto scrollbar-thin">
                      {sortedBatches.slice(0, 5).map((batch) => (
                        <div
                          key={batch.id}
                          className="flex items-center gap-3 text-sm py-1.5"
                        >
                          <FileText className="size-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate flex-1">
                            {batch.fileName}
                          </span>
                          <span className="text-muted-foreground shrink-0">
                            <Clock className="size-3 inline mr-1" />
                            {formatDate(batch.importDate)}
                          </span>
                          <Badge
                            variant="secondary"
                            className="shrink-0 text-[10px]"
                          >
                            {batch.totalRecords}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabs + Date Filter + Search */}
      <div className="flex flex-col gap-3">
        {/* Tab Bar */}
        <div className="flex items-center gap-1 rounded-lg bg-card/80 border border-border/50 p-1 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                relative flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                ${activeTab === tab.id
                  ? 'bg-emerald-500/10 text-emerald-400 shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }
              `}
            >
              <tab.icon className="size-4" />
              {tab.label}
              {activeTab === tab.id && total > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                >
                  {total}
                </Badge>
              )}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex items-center gap-2">
            <Calendar className="size-4 text-muted-foreground" />
            <Input
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="w-auto bg-white/5 border-border/50 text-sm h-9"
            />
          </div>
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari Kode Extend..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-9 bg-card/80 border-border/50"
            />
          </div>
          <Badge variant="outline" className="shrink-0 border-border/50">
            {total} data
          </Badge>
        </div>
      </div>

      {/* Sales Data Table */}
      {loading && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10" />
                <TableHead>Tanggal</TableHead>
                <TableHead>Kode Extend</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Settle</TableHead>
                <TableHead>Crew</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className="h-4 w-4 rounded bg-muted animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-28 rounded bg-muted animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-8 rounded bg-muted animate-pulse ml-auto" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-20 rounded bg-muted animate-pulse ml-auto" />
                  </TableCell>
                  <TableCell>
                    <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      {!loading && salesData.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="rounded-full bg-white/5 p-4 mb-4">
            {activeTab === 'unclaim' ? (
              <ClipboardList className="size-8 text-muted-foreground" />
            ) : (
              <ClipboardCheck className="size-8 text-muted-foreground" />
            )}
          </div>
          <h3 className="text-lg font-medium">
            {activeTab === 'unclaim'
              ? 'Tidak ada data unclaim'
              : 'Tidak ada data yang sudah di-claim'}
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {activeTab === 'unclaim'
              ? 'Semua penjualan sudah di-claim atau belum ada data'
              : 'Belum ada penjualan yang di-claim oleh crew'}
          </p>
        </motion.div>
      )}

      {!loading && salesData.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-lg border border-border/50 bg-card/80 backdrop-blur-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  {activeTab === 'unclaim' && (
                    <TableHead className="w-10">
                      <button
                        onClick={toggleSelectAll}
                        className="p-0.5 hover:opacity-80 transition-opacity"
                      >
                        {selectedIds.size === salesData.length &&
                        salesData.length > 0 ? (
                          <CheckSquare className="size-4 text-emerald-400" />
                        ) : (
                          <Square className="size-4 text-muted-foreground" />
                        )}
                      </button>
                    </TableHead>
                  )}
                  <TableHead>Tanggal</TableHead>
                  <TableHead>Kode Extend</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Settle</TableHead>
                  <TableHead>Crew</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.map((record) => {
                  const isSelected = selectedIds.has(record.id)
                  return (
                    <TableRow
                      key={record.id}
                      className={`hover:bg-white/5 ${isSelected ? 'bg-emerald-500/5' : ''} ${record.crewId ? 'opacity-80' : ''}`}
                    >
                      {activeTab === 'unclaim' && (
                        <TableCell>
                          <button
                            onClick={() => toggleSelect(record.id)}
                            className="p-0.5 hover:opacity-80 transition-opacity"
                          >
                            {isSelected ? (
                              <CheckSquare className="size-4 text-emerald-400" />
                            ) : (
                              <Square className="size-4 text-muted-foreground" />
                            )}
                          </button>
                        </TableCell>
                      )}
                      <TableCell className="text-sm">
                        {formatDateGMT7(record.tanggal)}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className="font-mono text-xs bg-white/5"
                        >
                          {record.kodeExtend}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {record.qty.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(record.settle)}
                      </TableCell>
                      <TableCell>
                        {activeTab === 'unclaim' ? (
                          <CrewSearchBox
                            crew={record.crew}
                            crews={crews}
                            assigningId={assigningId}
                            onAssign={(crewId) =>
                              handleAssignCrew(record.id, crewId)
                            }
                            onUnassign={() => handleUnassignCrew(record.id)}
                          />
                        ) : (
                          // Claim tab: show crew name (already assigned)
                          record.crew ? (
                            <div className="flex items-center gap-1.5 rounded-md px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 w-[160px]">
                              <UserCheck className="size-3.5 text-emerald-400 shrink-0" />
                              <span className="truncate flex-1 text-emerald-300 text-xs">
                                {record.crew.namaCrew}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )
                        )}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
              <TableFooter>
                <TableRow className="font-semibold hover:bg-transparent">
                  {activeTab === 'unclaim' && <TableCell />}
                  <TableCell colSpan={2}>Total (halaman ini)</TableCell>
                  <TableCell className="text-right">
                    {pageTotals.totalQty.toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(pageTotals.totalSettle)}
                  </TableCell>
                  <TableCell />
                </TableRow>
              </TableFooter>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50">
              <p className="text-sm text-muted-foreground">
                Halaman {page} dari {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="gap-1 border-border/50"
                >
                  <ChevronLeft className="size-4" />
                  Sebelumnya
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={page >= totalPages}
                  className="gap-1 border-border/50"
                >
                  Selanjutnya
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Floating Batch Action Bar — only for Unclaim tab */}
      <AnimatePresence>
        {activeTab === 'unclaim' && selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-3 rounded-xl glass-strong border border-emerald-500/20 shadow-xl shadow-emerald-500/10"
          >
            <Badge
              variant="secondary"
              className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
            >
              {selectedIds.size} dipilih
            </Badge>

            {/* Batch Assign Crew */}
            <div ref={batchAssignRef} className="relative">
              <Button
                size="sm"
                className="gap-2 gradient-emerald hover:opacity-90 text-white border-0"
                onClick={() => setBatchAssignOpen(!batchAssignOpen)}
              >
                <UserPlus className="size-3.5" />
                Assign Crew
              </Button>

              <AnimatePresence>
                {batchAssignOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute bottom-full mb-2 left-0 w-64 rounded-lg border border-border/50 bg-card shadow-2xl overflow-hidden"
                  >
                    <div className="p-2">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Cari crew..."
                          value={batchSearchQuery}
                          onChange={(e) => setBatchSearchQuery(e.target.value)}
                          className="h-8 text-xs pl-8 bg-white/5 border-border/50"
                          autoFocus
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto scrollbar-thin">
                      {filteredBatchCrews.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                          Crew tidak ditemukan
                        </p>
                      ) : (
                        filteredBatchCrews.map((crew) => (
                          <button
                            key={crew.id}
                            onClick={() => handleBatchAssign(crew.id)}
                            className="flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-white/5 transition-colors text-left"
                          >
                            <UserCheck className="size-3 text-muted-foreground shrink-0" />
                            <span className="truncate">{crew.namaCrew}</span>
                          </button>
                        ))
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
              Batal
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
