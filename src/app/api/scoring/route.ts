import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

interface HourlyBreakdown {
  hour: number
  qty: number
  settle: number
}

interface CrewScoring {
  crewId: string
  namaCrew: string
  fotoUrl: string
  idKaryawan: string
  groupName: string | null
  totalSettle: number
  totalQty: number
  basketSize: number
  pricePoint: number
  hourlyBreakdown: HourlyBreakdown[]
}

/**
 * Get start and end of day in GMT+7 as UTC Date objects
 */
function getGMT7DayRange(dateStr: string): { start: Date; end: Date } {
  const [year, month, day] = dateStr.split('-').map(Number)
  // Start of day in GMT+7 (00:00:00 +07:00 = 17:00:00 UTC previous day)
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - 7 * 60 * 60 * 1000)
  // End of day in GMT+7 (23:59:59.999 +07:00 = 16:59:59.999 UTC same day)
  const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - 7 * 60 * 60 * 1000)
  return { start, end }
}

/**
 * Get today's date string in GMT+7
 */
function getTodayGMT7(): string {
  const now = new Date()
  const gmt7 = new Date(now.getTime() + 7 * 60 * 60 * 1000 + now.getTimezoneOffset() * 60 * 1000)
  const year = gmt7.getFullYear()
  const month = String(gmt7.getMonth() + 1).padStart(2, '0')
  const day = String(gmt7.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') || getTodayGMT7()
    const crewId = searchParams.get('crewId') || undefined

    // Get date range in GMT+7
    const { start: startOfDay, end: endOfDay } = getGMT7DayRange(dateParam)

    // ─── Fetch ALL crews first ────────────────────────────
    const allCrews = await db.crew.findMany({
      include: {
        group: {
          select: { namaGrup: true },
        },
      },
    })

    // Build where clause for sales data
    const whereClause: Prisma.SalesDataWhereInput = {
      tanggal: {
        gte: startOfDay,
        lte: endOfDay,
      },
      crewId: { not: null },
    }
    if (crewId) {
      whereClause.crewId = crewId
    }

    // Query sales data for the given date range
    const salesData = await db.salesData.findMany({
      where: whereClause,
      include: {
        crew: {
          include: {
            group: {
              select: { namaGrup: true },
            },
          },
        },
      },
    })

    // Group by crewId
    const crewMap = new Map<
      string,
      {
        crewId: string
        namaCrew: string
        fotoUrl: string
        idKaryawan: string
        groupName: string | null
        hourlyMap: Map<number, { qty: number; settle: number }>
        totalSettle: number
        totalQty: number
      }
    >()

    // Initialize all crews with 0 values (so crews with no sales still appear)
    for (const crew of allCrews) {
      if (crewId && crew.id !== crewId) continue
      crewMap.set(crew.id, {
        crewId: crew.id,
        namaCrew: crew.namaCrew,
        fotoUrl: crew.fotoUrl,
        idKaryawan: crew.idKaryawan,
        groupName: crew.group?.namaGrup || null,
        hourlyMap: new Map(),
        totalSettle: 0,
        totalQty: 0,
      })
    }

    for (const sale of salesData) {
      if (!sale.crew) continue

      const cId = sale.crewId!
      if (!crewMap.has(cId)) {
        // Crew exists in sales but not in our allCrews list (edge case)
        crewMap.set(cId, {
          crewId: cId,
          namaCrew: sale.crew.namaCrew,
          fotoUrl: sale.crew.fotoUrl,
          idKaryawan: sale.crew.idKaryawan,
          groupName: sale.crew.group?.namaGrup || null,
          hourlyMap: new Map(),
          totalSettle: 0,
          totalQty: 0,
        })
      }

      const crewData = crewMap.get(cId)!

      // Extract hour from tanggal in GMT+7
      const saleDate = new Date(sale.tanggal)
      const gmt7Hour = (saleDate.getUTCHours() + 7) % 24

      // Update hourly breakdown
      if (!crewData.hourlyMap.has(gmt7Hour)) {
        crewData.hourlyMap.set(gmt7Hour, { qty: 0, settle: 0 })
      }
      const hourData = crewData.hourlyMap.get(gmt7Hour)!
      hourData.qty += sale.qty
      hourData.settle += sale.settle

      // Update totals
      crewData.totalSettle += sale.settle
      crewData.totalQty += sale.qty
    }

    // Calculate scoring metrics for each crew
    const results: CrewScoring[] = []

    for (const crewData of crewMap.values()) {
      const distinctHours = crewData.hourlyMap.size
      const basketSize = distinctHours > 0 ? crewData.totalQty / distinctHours : 0
      const pricePoint = crewData.totalQty > 0 ? crewData.totalSettle / crewData.totalQty : 0

      // Convert hourlyMap to sorted array
      const hourlyBreakdown: HourlyBreakdown[] = Array.from(
        crewData.hourlyMap.entries()
      )
        .map(([hour, data]) => ({
          hour,
          qty: data.qty,
          settle: Math.round(data.settle * 100) / 100,
        }))
        .sort((a, b) => a.hour - b.hour)

      results.push({
        crewId: crewData.crewId,
        namaCrew: crewData.namaCrew,
        fotoUrl: crewData.fotoUrl,
        idKaryawan: crewData.idKaryawan,
        groupName: crewData.groupName,
        totalSettle: Math.round(crewData.totalSettle * 100) / 100,
        totalQty: crewData.totalQty,
        basketSize: Math.round(basketSize * 100) / 100,
        pricePoint: Math.round(pricePoint * 100) / 100,
        hourlyBreakdown,
      })
    }

    // Sort by totalSettle descending
    results.sort((a, b) => b.totalSettle - a.totalSettle)

    return NextResponse.json({ data: results, date: dateParam })
  } catch (error) {
    console.error('Error calculating scoring:', error)
    return NextResponse.json(
      { error: 'Failed to calculate scoring' },
      { status: 500 }
    )
  }
}
