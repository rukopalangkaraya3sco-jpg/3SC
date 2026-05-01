'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  LayoutGrid,
  Users,
  Target,
  X,
  Calendar,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AddGroupDialog } from '@/components/add-group-dialog'

interface GroupCrew {
  id: string
  namaCrew: string
  idKaryawan: string
  fotoUrl: string
}

interface Group {
  id: string
  namaGrup: string
  logoUrl: string
  targetBulanan: number
  week1Percentage: number
  week2Percentage: number
  week3Percentage: number
  week4Percentage: number
  createdAt: string
  updatedAt: string
  crews: GroupCrew[]
  _count: { crews: number }
}

interface AllCrew {
  id: string
  namaCrew: string
  idKaryawan: string
  fotoUrl: string
  groupId: string | null
}

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

export function GroupView() {
  const [groups, setGroups] = useState<Group[]>([])
  const [allCrews, setAllCrews] = useState<AllCrew[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<Group | null>(null)
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [addingCrewToGroup, setAddingCrewToGroup] = useState<string | null>(
    null
  )
  const [selectedCrewToAdd, setSelectedCrewToAdd] = useState('')
  const [removingCrew, setRemovingCrew] = useState<string | null>(null)

  const fetchGroups = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/groups')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setGroups(data)
    } catch {
      toast.error('Gagal memuat data grup')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAllCrews = useCallback(async () => {
    try {
      const res = await fetch('/api/crews')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setAllCrews(data)
    } catch {
      /* silent */
    }
  }, [])

  useEffect(() => {
    fetchGroups()
    fetchAllCrews()
  }, [fetchGroups, fetchAllCrews])

  const handleAddGroup = useCallback(() => {
    setEditingGroup(null)
    setDialogOpen(true)
  }, [])

  const handleEditGroup = useCallback((group: Group) => {
    setEditingGroup(group)
    setDialogOpen(true)
  }, [])

  const handleDeleteGroup = useCallback((group: Group) => {
    setDeletingGroup(group)
    setDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deletingGroup) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/groups/${deletingGroup.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghapus grup')
      }
      toast.success(`Grup "${deletingGroup.namaGrup}" berhasil dihapus`)
      fetchGroups()
      fetchAllCrews()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus grup')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setDeletingGroup(null)
    }
  }, [deletingGroup, fetchGroups, fetchAllCrews])

  const handleAddCrewToGroup = useCallback(
    async (groupId: string, crewId: string) => {
      try {
        const res = await fetch(`/api/groups/${groupId}/crews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crewId }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Gagal menambahkan crew')
        }
        toast.success('Crew berhasil ditambahkan ke grup')
        setAddingCrewToGroup(null)
        setSelectedCrewToAdd('')
        fetchGroups()
        fetchAllCrews()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Gagal menambahkan crew'
        )
      }
    },
    [fetchGroups, fetchAllCrews]
  )

  const handleRemoveCrewFromGroup = useCallback(
    async (groupId: string, crewId: string) => {
      setRemovingCrew(crewId)
      try {
        const res = await fetch(`/api/groups/${groupId}/crews`, {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ crewId }),
        })
        if (!res.ok) {
          const data = await res.json()
          throw new Error(data.error || 'Gagal mengeluarkan crew')
        }
        toast.success('Crew berhasil dikeluarkan dari grup')
        fetchGroups()
        fetchAllCrews()
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : 'Gagal mengeluarkan crew'
        )
      } finally {
        setRemovingCrew(null)
      }
    },
    [fetchGroups, fetchAllCrews]
  )

  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [])

  // Get available crews (not in any group) for a specific group
  const getAvailableCrews = useCallback(
    (groupId: string) => {
      const groupCrewIds = groups
        .find((g) => g.id === groupId)
        ?.crews.map((c) => c.id)
      return allCrews.filter(
        (c) => c.groupId === null && !groupCrewIds?.includes(c.id)
      )
    },
    [allCrews, groups]
  )

  const getWeekConfigs = useMemo(
    () => (group: Group) => [
      { label: 'Week 1', dates: '1-7', percentage: group.week1Percentage, nominal: Math.round((group.targetBulanan * group.week1Percentage) / 100) },
      { label: 'Week 2', dates: '8-14', percentage: group.week2Percentage, nominal: Math.round((group.targetBulanan * group.week2Percentage) / 100) },
      { label: 'Week 3', dates: '15-21', percentage: group.week3Percentage, nominal: Math.round((group.targetBulanan * group.week3Percentage) / 100) },
      { label: 'Week 4', dates: '22-28/30/31', percentage: group.week4Percentage, nominal: Math.round((group.targetBulanan * group.week4Percentage) / 100) },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Group Management
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {groups.length} grup terdaftar
          </p>
        </div>
        <Button
          onClick={handleAddGroup}
          className="gap-2 gradient-emerald hover:opacity-90 text-white border-0 glow-emerald"
        >
          <Plus className="size-4" />
          Tambah Grup
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card
              key={i}
              className="animate-pulse border-border/50 bg-card/80"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="size-14 rounded-xl bg-muted" />
                  <div className="flex flex-col gap-2 flex-1">
                    <div className="h-5 w-32 rounded bg-muted" />
                    <div className="h-3 w-24 rounded bg-muted" />
                  </div>
                </div>
                <div className="mt-4 flex flex-col gap-2">
                  <div className="h-3 w-full rounded bg-muted" />
                  <div className="h-3 w-3/4 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && groups.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="rounded-full bg-white/5 p-5 mb-4">
            <LayoutGrid className="size-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">Belum ada grup</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Buat grup untuk mengorganisir crew berdasarkan zoning atau area
          </p>
          <Button
            onClick={handleAddGroup}
            variant="outline"
            className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            <Plus className="size-4" />
            Tambah Grup Pertama
          </Button>
        </motion.div>
      )}

      {/* Group Cards Grid */}
      {!loading && groups.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence mode="popLayout">
            {groups.map((group, index) => (
              <motion.div
                key={group.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.06 }}
                whileHover={{ y: -3 }}
              >
                <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-emerald-500/20 transition-all hover:shadow-lg hover:shadow-emerald-500/5">
                  <CardContent className="p-6">
                    {/* Group Header */}
                    <div className="flex items-start gap-4">
                      <Avatar className="size-14 shrink-0 rounded-xl ring-2 ring-white/10">
                        {group.logoUrl && (
                          <AvatarImage
                            src={group.logoUrl}
                            alt={group.namaGrup}
                          />
                        )}
                        <AvatarFallback className="gradient-gold text-white text-sm font-bold rounded-xl">
                          {getInitials(group.namaGrup)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-semibold text-lg truncate">
                          {group.namaGrup}
                        </span>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                          <Users className="size-3" />
                          {group._count.crews} crew
                        </div>
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 hover:bg-white/10"
                          onClick={() => handleEditGroup(group)}
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteGroup(group)}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Hapus</span>
                        </Button>
                      </div>
                    </div>

                    {/* Target Bulanan */}
                    <div className="mt-4 space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 text-muted-foreground">
                          <Target className="size-3" />
                          Target Bulanan
                        </span>
                        <span className="font-semibold text-yellow-400">
                          {formatCurrency(group.targetBulanan)}
                        </span>
                      </div>
                    </div>

                    {/* Weekly Progress Bars */}
                    <div className="mt-4 space-y-2.5">
                      {getWeekConfigs(group).map((week) => (
                        <div key={week.label} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="size-3 text-emerald-400" />
                              {week.label}
                              <span className="text-[10px] text-muted-foreground/60">
                                ({week.dates})
                              </span>
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-emerald-400">
                                {week.percentage}%
                              </span>
                              {group.targetBulanan > 0 && (
                                <span className="text-[10px] text-muted-foreground">
                                  {formatCurrency(week.nominal)}
                                </span>
                              )}
                            </div>
                          </div>
                          <Progress
                            value={week.percentage}
                            className="h-1.5 bg-white/5 [&>[data-slot=indicator]]:gradient-emerald"
                          />
                        </div>
                      ))}
                    </div>

                    {/* Crew Members */}
                    <div className="mt-5 pt-4 border-t border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          Anggota Crew
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-[10px] gap-1 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2"
                          onClick={() => {
                            setAddingCrewToGroup(group.id)
                            setSelectedCrewToAdd('')
                          }}
                        >
                          <Plus className="size-3" />
                          Tambah
                        </Button>
                      </div>

                      {/* Add Crew Selector */}
                      {addingCrewToGroup === group.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mb-3 flex gap-2"
                        >
                          <Select
                            value={selectedCrewToAdd}
                            onValueChange={setSelectedCrewToAdd}
                          >
                            <SelectTrigger className="h-8 text-xs flex-1 bg-white/5 border-border/50">
                              <SelectValue placeholder="Pilih crew..." />
                            </SelectTrigger>
                            <SelectContent>
                              {getAvailableCrews(group.id).length === 0 ? (
                                <SelectItem value="_none" disabled>
                                  Tidak ada crew tersedia
                                </SelectItem>
                              ) : (
                                getAvailableCrews(group.id).map((crew) => (
                                  <SelectItem key={crew.id} value={crew.id}>
                                    {crew.namaCrew} ({crew.idKaryawan})
                                  </SelectItem>
                                ))
                              )}
                            </SelectContent>
                          </Select>
                          <Button
                            size="sm"
                            className="h-8 gradient-emerald hover:opacity-90 text-white border-0 text-xs px-3"
                            disabled={!selectedCrewToAdd || selectedCrewToAdd === '_none'}
                            onClick={() =>
                              handleAddCrewToGroup(
                                group.id,
                                selectedCrewToAdd
                              )
                            }
                          >
                            OK
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-xs px-2"
                            onClick={() => {
                              setAddingCrewToGroup(null)
                              setSelectedCrewToAdd('')
                            }}
                          >
                            <X className="size-3" />
                          </Button>
                        </motion.div>
                      )}

                      {/* Crew Badges */}
                      <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto scrollbar-thin">
                        {group.crews.length === 0 && (
                          <span className="text-xs text-muted-foreground italic">
                            Belum ada crew
                          </span>
                        )}
                        {group.crews.map((crew) => (
                          <Badge
                            key={crew.id}
                            variant="secondary"
                            className="group/badge text-[11px] py-0.5 px-2 bg-white/5 hover:bg-white/10 pr-1.5 gap-1"
                          >
                            <span>{crew.namaCrew}</span>
                            <button
                              onClick={() =>
                                handleRemoveCrewFromGroup(group.id, crew.id)
                              }
                              disabled={removingCrew === crew.id}
                              className="ml-0.5 rounded-full p-0.5 hover:bg-destructive/20 hover:text-destructive transition-colors"
                            >
                              <X className="size-2.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                  {/* Subtle gradient overlay on hover */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add/Edit Group Dialog */}
      <AddGroupDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingGroup={editingGroup}
        onSuccess={() => {
          fetchGroups()
          fetchAllCrews()
        }}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Grup</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus grup &ldquo;
              {deletingGroup?.namaGrup}&rdquo;? Semua crew dalam grup ini akan
              dilepas dari grup. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting ? 'Menghapus...' : 'Hapus'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
