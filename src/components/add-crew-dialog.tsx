'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export interface CrewFormData {
  namaCrew: string
  fotoUrl: string
  idKaryawan: string
  pin: string
  groupId: string
}

interface GroupOption {
  id: string
  namaGrup: string
}

interface AddCrewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingCrew?: {
    id: string
    namaCrew: string
    fotoUrl: string
    idKaryawan: string
    pin: string
    groupId: string | null
  } | null
  onSuccess: () => void
}

export function AddCrewDialog({
  open,
  onOpenChange,
  editingCrew,
  onSuccess,
}: AddCrewDialogProps) {
  const isEditing = !!editingCrew

  const [formData, setFormData] = useState<CrewFormData>({
    namaCrew: editingCrew?.namaCrew ?? '',
    fotoUrl: editingCrew?.fotoUrl ?? '',
    idKaryawan: editingCrew?.idKaryawan ?? '',
    pin: editingCrew?.pin ?? '0000',
    groupId: editingCrew?.groupId ?? '',
  })
  const [loading, setLoading] = useState(false)
  const [groups, setGroups] = useState<GroupOption[]>([])
  const [showPin, setShowPin] = useState(false)

  const fetchGroups = useCallback(async () => {
    try {
      const res = await fetch('/api/groups')
      if (!res.ok) throw new Error()
      const data = await res.json()
      setGroups(data.map((g: { id: string; namaGrup: string }) => ({ id: g.id, namaGrup: g.namaGrup })))
    } catch {
      /* silent */
    }
  }, [])

  useEffect(() => {
    fetchGroups()
  }, [fetchGroups])

  // Update form when editingCrew changes
  useEffect(() => {
    setFormData({
      namaCrew: editingCrew?.namaCrew ?? '',
      fotoUrl: editingCrew?.fotoUrl ?? '',
      idKaryawan: editingCrew?.idKaryawan ?? '',
      pin: editingCrew?.pin ?? '0000',
      groupId: editingCrew?.groupId ?? '',
    })
    setShowPin(false)
  }, [editingCrew])

  const resetForm = useCallback(() => {
    setFormData({
      namaCrew: editingCrew?.namaCrew ?? '',
      fotoUrl: editingCrew?.fotoUrl ?? '',
      idKaryawan: editingCrew?.idKaryawan ?? '',
      pin: editingCrew?.pin ?? '0000',
      groupId: editingCrew?.groupId ?? '',
    })
    setShowPin(false)
  }, [editingCrew])

  const handleOpenChange = useCallback(
    (newOpen: boolean) => {
      if (!newOpen) {
        resetForm()
      }
      onOpenChange(newOpen)
    },
    [onOpenChange, resetForm]
  )

  const handleSubmit = useCallback(async () => {
    if (!formData.namaCrew.trim()) {
      toast.error('Nama Crew wajib diisi')
      return
    }
    if (!formData.idKaryawan.trim()) {
      toast.error('ID Karyawan wajib diisi')
      return
    }

    setLoading(true)
    try {
      const url = isEditing ? `/api/crews/${editingCrew!.id}` : '/api/crews'
      const method = isEditing ? 'PUT' : 'POST'

      const body: Record<string, string> = {
        namaCrew: formData.namaCrew,
        fotoUrl: formData.fotoUrl || '-',
        idKaryawan: formData.idKaryawan,
        pin: formData.pin || '0000',
      }

      if (formData.groupId) {
        body.groupId = formData.groupId
      } else if (isEditing) {
        body.groupId = ''
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menyimpan data crew')
      }

      toast.success(
        isEditing
          ? `Crew "${formData.namaCrew}" berhasil diperbarui`
          : `Crew "${formData.namaCrew}" berhasil ditambahkan`
      )
      handleOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [formData, isEditing, editingCrew, handleOpenChange, onSuccess])

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Crew' : 'Tambah Crew Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Perbarui informasi crew di bawah ini.'
              : 'Isi informasi crew baru untuk ditambahkan ke sistem.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="namaCrew">Nama Crew</Label>
            <Input
              id="namaCrew"
              placeholder="Masukkan nama crew"
              value={formData.namaCrew}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, namaCrew: e.target.value }))
              }
              className="bg-white/5 border-border/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="idKaryawan">ID Karyawan</Label>
            <Input
              id="idKaryawan"
              placeholder="Masukkan ID karyawan"
              value={formData.idKaryawan}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  idKaryawan: e.target.value,
                }))
              }
              disabled={isEditing}
              className="bg-white/5 border-border/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="pin">PIN</Label>
            <div className="relative">
              <Input
                id="pin"
                type={showPin ? 'text' : 'password'}
                placeholder="0000"
                value={formData.pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 4)
                  setFormData((prev) => ({ ...prev, pin: val }))
                }}
                maxLength={4}
                className="bg-white/5 border-border/50 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPin ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
              PIN 4 digit untuk akses crew
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="fotoUrl">Foto URL</Label>
            <Input
              id="fotoUrl"
              placeholder="https://example.com/photo.jpg"
              value={formData.fotoUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, fotoUrl: e.target.value }))
              }
              className="bg-white/5 border-border/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="groupId">Grup</Label>
            <Select
              value={formData.groupId || 'none'}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  groupId: value === 'none' ? '' : value,
                }))
              }
            >
              <SelectTrigger className="bg-white/5 border-border/50">
                <SelectValue placeholder="Pilih grup..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="text-muted-foreground">
                    Tanpa grup
                  </span>
                </SelectItem>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.namaGrup}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={loading}
            className="border-border/50"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="gradient-emerald hover:opacity-90 text-white border-0"
          >
            {loading
              ? 'Menyimpan...'
              : isEditing
                ? 'Simpan Perubahan'
                : 'Tambah Crew'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
