'use client'

import { useCallback, useMemo, useState } from 'react'
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
import { Slider } from '@/components/ui/slider'
import { Calendar, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

export interface GroupFormData {
  namaGrup: string
  logoUrl: string
  targetBulanan: number
  week1Percentage: number
  week2Percentage: number
  week3Percentage: number
  week4Percentage: number
}

interface AddGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  editingGroup?: {
    id: string
    namaGrup: string
    logoUrl: string
    targetBulanan: number
    week1Percentage: number
    week2Percentage: number
    week3Percentage: number
    week4Percentage: number
  } | null
  onSuccess: () => void
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

export function AddGroupDialog({
  open,
  onOpenChange,
  editingGroup,
  onSuccess,
}: AddGroupDialogProps) {
  const isEditing = !!editingGroup

  const [formData, setFormData] = useState<GroupFormData>({
    namaGrup: editingGroup?.namaGrup ?? '',
    logoUrl: editingGroup?.logoUrl ?? '',
    targetBulanan: editingGroup?.targetBulanan ?? 0,
    week1Percentage: editingGroup?.week1Percentage ?? 25,
    week2Percentage: editingGroup?.week2Percentage ?? 25,
    week3Percentage: editingGroup?.week3Percentage ?? 25,
    week4Percentage: editingGroup?.week4Percentage ?? 25,
  })
  const [loading, setLoading] = useState(false)

  const totalPercentage = useMemo(
    () =>
      formData.week1Percentage +
      formData.week2Percentage +
      formData.week3Percentage +
      formData.week4Percentage,
    [formData]
  )

  const isValidPercentage = totalPercentage === 100

  const weekConfigs = useMemo(
    () => [
      { key: 'week1Percentage' as const, label: 'Week 1', dates: 'Tanggal 1-7', value: formData.week1Percentage },
      { key: 'week2Percentage' as const, label: 'Week 2', dates: 'Tanggal 8-14', value: formData.week2Percentage },
      { key: 'week3Percentage' as const, label: 'Week 3', dates: 'Tanggal 15-21', value: formData.week3Percentage },
      { key: 'week4Percentage' as const, label: 'Week 4', dates: 'Tanggal 22-28/30/31', value: formData.week4Percentage },
    ],
    [formData]
  )

  // Reset form when dialog opens with different editingGroup
  const handleDialogOpen = useCallback(
    (isOpen: boolean) => {
      if (isOpen) {
        setFormData({
          namaGrup: editingGroup?.namaGrup ?? '',
          logoUrl: editingGroup?.logoUrl ?? '',
          targetBulanan: editingGroup?.targetBulanan ?? 0,
          week1Percentage: editingGroup?.week1Percentage ?? 25,
          week2Percentage: editingGroup?.week2Percentage ?? 25,
          week3Percentage: editingGroup?.week3Percentage ?? 25,
          week4Percentage: editingGroup?.week4Percentage ?? 25,
        })
      }
      onOpenChange(isOpen)
    },
    [editingGroup, onOpenChange]
  )

  const handleSubmit = useCallback(async () => {
    if (!formData.namaGrup.trim()) {
      toast.error('Nama Grup wajib diisi')
      return
    }

    if (!isValidPercentage) {
      toast.error('Total persentase mingguan harus 100%')
      return
    }

    setLoading(true)
    try {
      const url = isEditing
        ? `/api/groups/${editingGroup!.id}`
        : '/api/groups'
      const method = isEditing ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          namaGrup: formData.namaGrup,
          logoUrl: formData.logoUrl || '',
          targetBulanan: formData.targetBulanan,
          week1Percentage: formData.week1Percentage,
          week2Percentage: formData.week2Percentage,
          week3Percentage: formData.week3Percentage,
          week4Percentage: formData.week4Percentage,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Gagal menyimpan data grup')
      }

      toast.success(
        isEditing
          ? `Grup "${formData.namaGrup}" berhasil diperbarui`
          : `Grup "${formData.namaGrup}" berhasil ditambahkan`
      )
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }, [formData, isEditing, editingGroup, onOpenChange, onSuccess, isValidPercentage])

  return (
    <Dialog open={open} onOpenChange={handleDialogOpen}>
      <DialogContent className="sm:max-w-lg bg-card border-border/50 max-h-[90vh] overflow-y-auto scrollbar-thin">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Edit Grup' : 'Tambah Grup Baru'}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? 'Perbarui informasi grup di bawah ini.'
              : 'Isi informasi grup baru untuk ditambahkan ke sistem.'}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="namaGrup">Nama Grup / Zoning</Label>
            <Input
              id="namaGrup"
              placeholder="Masukkan nama grup atau zoning"
              value={formData.namaGrup}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, namaGrup: e.target.value }))
              }
              className="bg-white/5 border-border/50"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input
              id="logoUrl"
              placeholder="https://example.com/logo.png"
              value={formData.logoUrl}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, logoUrl: e.target.value }))
              }
              className="bg-white/5 border-border/50"
            />
          </div>

          {/* Target Bulanan - Nominal Rp */}
          <div className="flex flex-col gap-2">
            <Label>Target Bulanan</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                Rp
              </span>
              <Input
                type="number"
                placeholder="0"
                value={formData.targetBulanan || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    targetBulanan: Number(e.target.value) || 0,
                  }))
                }
                className="pl-10 bg-white/5 border-border/50"
              />
            </div>
            {formData.targetBulanan > 0 && (
              <p className="text-xs text-muted-foreground">
                {formatCurrency(formData.targetBulanan)}
              </p>
            )}
          </div>

          {/* Weekly Targets */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">
                Alokasi Mingguan
              </Label>
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-medium ${
                    isValidPercentage
                      ? 'text-emerald-400'
                      : 'text-yellow-400'
                  }`}
                >
                  Total: {totalPercentage}%
                </span>
                {!isValidPercentage && (
                  <AlertTriangle className="size-3.5 text-yellow-400" />
                )}
              </div>
            </div>

            {!isValidPercentage && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <AlertTriangle className="size-3.5 text-yellow-400 shrink-0" />
                <p className="text-xs text-yellow-300">
                  Total persentase harus 100%. Saat ini {totalPercentage}%.
                </p>
              </div>
            )}

            {weekConfigs.map((week) => {
              const calculatedNominal = Math.round(
                (formData.targetBulanan * week.value) / 100
              )
              return (
                <div
                  key={week.key}
                  className="flex flex-col gap-2 p-3 rounded-lg bg-white/[0.02] border border-border/30"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Calendar className="size-3.5 text-emerald-400" />
                      <span className="text-sm font-medium">{week.label}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {week.dates}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-emerald-400">
                        {week.value}%
                      </span>
                      {formData.targetBulanan > 0 && (
                        <span className="text-[11px] text-muted-foreground ml-1.5">
                          = {formatCurrency(calculatedNominal)}
                        </span>
                      )}
                    </div>
                  </div>
                  <Slider
                    value={[week.value]}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        [week.key]: value[0],
                      }))
                    }
                    max={100}
                    step={5}
                    className="[&_[data-slot=slider-track]]:bg-white/10 [&_[data-slot=slider-range]]:gradient-emerald"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>0%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="border-border/50"
          >
            Batal
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !isValidPercentage}
            className="gradient-emerald hover:opacity-90 text-white border-0"
          >
            {loading
              ? 'Menyimpan...'
              : isEditing
                ? 'Simpan Perubahan'
                : 'Tambah Grup'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
