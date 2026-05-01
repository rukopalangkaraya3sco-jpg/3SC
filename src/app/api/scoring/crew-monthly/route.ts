import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

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

/**
 * Get start and end of month in GMT+7 as UTC Date objects
 */
function getMonthRange(year: number, month: number): { start: Date; end: Date } {
  // Start of month in GMT+7 → convert to UTC
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0) - 7 * 60 * 60 * 1000)
  // End of month in GMT+7 → convert to UTC
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
  const end = new Date(Date.UTC(year, month - 1, lastDay, 23, 59, 59, 999) - 7 * 60 * 60 * 1000)
  return { start, end }
}

interface CrewMonthlyData {
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') || getTodayGMT7()
    const [year, month] = dateParam.split('-').map(Number)

    const { start, end } = getMonthRange(year, month)

    // Get all crews with their groups
    const allCrews = await db.crew.findMany({
      include: {
        group: {
          select: { namaGrup: true },
        },
      },
    })

    // Get all sales data for the month with crew assigned
    const salesData = await db.salesData.findMany({
      where: {
        tanggal: {
          gte: start,
          lte: end,
        },
        crewId: { not: null },
      },
      select: {
        crewId: true,
        settle: true,
        qty: true,
        id: true,
      },
    })

    // Aggregate per crew
    const crewMap = new Map<string, {
      totalSettle: number
      totalQty: number
      transactionCount: number
    }>()

    // Initialize all crews with 0
    for (const crew of allCrews) {
      crewMap.set(crew.id, {
        totalSettle: 0,
        totalQty: 0,
        transactionCount: 0,
      })
    }

    for (const sale of salesData) {
      if (!sale.crewId) continue
      if (!crewMap.has(sale.crewId)) {
        crewMap.set(sale.crewId, {
          totalSettle: 0,
          totalQty: 0,
          transactionCount: 0,
        })
      }
      const data = crewMap.get(sale.crewId)!
      data.totalSettle += sale.settle
      data.totalQty += sale.qty
      data.transactionCount += 1
    }

    // Build results
    const results: CrewMonthlyData[] = []

    for (const crew of allCrews) {
      const data = crewMap.get(crew.id)!
      results.push({
        crewId: crew.id,
        namaCrew: crew.namaCrew,
        fotoUrl: crew.fotoUrl,
        idKaryawan: crew.idKaryawan,
        groupName: crew.group?.namaGrup || null,
        totalSettle: Math.round(data.totalSettle),
        totalQty: data.totalQty,
        transactionCount: data.transactionCount,
        avgPricePoint: data.totalQty > 0 ? Math.round((data.totalSettle / data.totalQty) * 100) / 100 : 0,
        rank: 0,
      })
    }

    // Sort by totalSettle descending and assign ranks
    results.sort((a, b) => b.totalSettle - a.totalSettle)
    results.forEach((r, i) => {
      r.rank = i + 1
    })

    return NextResponse.json({
      data: results,
      month,
      year,
    })
  } catch (error) {
    console.error('Error calculating crew monthly sales:', error)
    return NextResponse.json(
      { error: 'Failed to calculate crew monthly sales' },
      { status: 500 }
    )
  }
}
