'use client'

import { useCallback, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Pencil, Trash2, Users, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
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
import { AddCrewDialog } from '@/components/add-crew-dialog'

interface GroupRef {
  id: string
  namaGrup: string
  logoUrl: string
}

interface Crew {
  id: string
  namaCrew: string
  fotoUrl: string
  idKaryawan: string
  pin: string
  groupId: string | null
  group: GroupRef | null
  createdAt: string
  updatedAt: string
}

function PinDisplay({ pin }: { pin: string }) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex items-center gap-1.5 mt-1">
      <span className="text-[11px] text-muted-foreground font-mono tracking-wider">
        PIN: {visible ? pin : '••••'}
      </span>
      <button
        onClick={() => setVisible(!visible)}
        className="p-0.5 rounded hover:bg-white/10 transition-colors"
      >
        {visible ? (
          <EyeOff className="size-3 text-muted-foreground" />
        ) : (
          <Eye className="size-3 text-muted-foreground" />
        )}
      </button>
    </div>
  )
}

export function CrewView() {
  const [crews, setCrews] = useState<Crew[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingCrew, setEditingCrew] = useState<Crew | null>(null)
  const [deletingCrew, setDeletingCrew] = useState<Crew | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCrews = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/crews')
      if (!res.ok) throw new Error('Gagal memuat data crew')
      const data = await res.json()
      setCrews(data)
    } catch {
      toast.error('Gagal memuat data crew')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCrews()
  }, [fetchCrews])

  const handleAddCrew = useCallback(() => {
    setEditingCrew(null)
    setDialogOpen(true)
  }, [])

  const handleEditCrew = useCallback((crew: Crew) => {
    setEditingCrew(crew)
    setDialogOpen(true)
  }, [])

  const handleDeleteCrew = useCallback((crew: Crew) => {
    setDeletingCrew(crew)
    setDeleteDialogOpen(true)
  }, [])

  const confirmDelete = useCallback(async () => {
    if (!deletingCrew) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/crews/${deletingCrew.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menghapus crew')
      }
      toast.success(`Crew "${deletingCrew.namaCrew}" berhasil dihapus`)
      fetchCrews()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus crew')
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setDeletingCrew(null)
    }
  }, [deletingCrew, fetchCrews])

  const getInitials = useCallback((name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }, [])

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            Crew Management
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {crews.length} crew terdaftar
          </p>
        </div>
        <Button
          onClick={handleAddCrew}
          className="gap-2 gradient-emerald hover:opacity-90 text-white border-0 glow-emerald"
        >
          <Plus className="size-4" />
          Tambah Crew
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card
              key={i}
              className="animate-pulse border-border/50 bg-card/80"
            >
              <CardContent className="flex items-center gap-4 p-5">
                <div className="size-14 rounded-full bg-muted" />
                <div className="flex flex-col gap-2 flex-1">
                  <div className="h-4 w-28 rounded bg-muted" />
                  <div className="h-3 w-20 rounded bg-muted" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && crews.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-20 text-center"
        >
          <div className="rounded-full bg-white/5 p-5 mb-4">
            <Users className="size-10 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold">Belum ada crew</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            Tambahkan crew baru untuk mulai mengelola penjualan
          </p>
          <Button
            onClick={handleAddCrew}
            variant="outline"
            className="gap-2 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
          >
            <Plus className="size-4" />
            Tambah Crew Pertama
          </Button>
        </motion.div>
      )}

      {/* Crew Cards Grid */}
      {!loading && crews.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {crews.map((crew, index) => (
              <motion.div
                key={crew.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.04 }}
                whileHover={{ y: -3 }}
              >
                <Card className="group relative overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-emerald-500/20 transition-all hover:shadow-lg hover:shadow-emerald-500/5">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar className="size-14 shrink-0 ring-2 ring-white/10">
                        {crew.fotoUrl && (
                          <AvatarImage
                            src={crew.fotoUrl}
                            alt={crew.namaCrew}
                          />
                        )}
                        <AvatarFallback className="gradient-emerald text-white text-sm font-bold">
                          {getInitials(crew.namaCrew)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex flex-col flex-1 min-w-0">
                        <span className="font-semibold truncate text-base">
                          {crew.namaCrew}
                        </span>
                        <span className="text-xs text-muted-foreground mt-0.5">
                          ID: {crew.idKaryawan}
                        </span>
                        <PinDisplay pin={crew.pin} />
                        {crew.group && (
                          <Badge
                            variant="secondary"
                            className="mt-2 w-fit text-[10px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          >
                            {crew.group.namaGrup}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 hover:bg-white/10"
                          onClick={() => handleEditCrew(crew)}
                        >
                          <Pencil className="size-3.5" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteCrew(crew)}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Hapus</span>
                        </Button>
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

      {/* Add/Edit Dialog */}
      <AddCrewDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        editingCrew={editingCrew}
        onSuccess={fetchCrews}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-card border-border/50">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Crew</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus crew &ldquo;
              {deletingCrew?.namaCrew}&rdquo;? Tindakan ini tidak dapat
              dibatalkan.
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
