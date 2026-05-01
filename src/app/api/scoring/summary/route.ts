import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Get start and end of day in GMT+7 as UTC Date objects
 */
function getGMT7DayRange(dateStr: string): { start: Date; end: Date } {
  const [year, month, day] = dateStr.split('-').map(Number)
  const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - 7 * 60 * 60 * 1000)
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

    // Get date range in GMT+7
    const { start: startOfDay, end: endOfDay } = getGMT7DayRange(dateParam)

    // Get total crew count (ALL crews, not just those with sales)
    const totalCrewCount = await db.crew.count()

    // Query all sales data for the given date range with crew assigned
    const salesData = await db.salesData.findMany({
      where: {
        tanggal: {
          gte: startOfDay,
          lte: endOfDay,
        },
        crewId: { not: null },
      },
      select: {
        tanggal: true,
        crewId: true,
        qty: true,
        settle: true,
      },
    })

    // Calculate totals
    let totalSettle = 0
    let totalQty = 0

    // Track per-crew hourly data for basket size calculation
    const crewHourlyMap = new Map<string, Set<number>>()

    for (const sale of salesData) {
      totalSettle += sale.settle
      totalQty += sale.qty

      // Track distinct hours per crew for basket size (GMT+7)
      const cId = sale.crewId!
      if (!crewHourlyMap.has(cId)) {
        crewHourlyMap.set(cId, new Set())
      }
      const saleDate = new Date(sale.tanggal)
      const gmt7Hour = (saleDate.getUTCHours() + 7) % 24
      crewHourlyMap.get(cId)!.add(gmt7Hour)
    }

    // crewCount = ALL crews (including those with 0 sales)
    const crewCount = totalCrewCount
    const activeCrewCount = crewHourlyMap.size

    // Calculate average basket size across all crews (including those with 0)
    let avgBasketSize = 0
    if (crewCount > 0) {
      let totalBasketSize = 0
      for (const [cId, hours] of crewHourlyMap) {
        const crewSales = salesData.filter((s) => s.crewId === cId)
        const crewQty = crewSales.reduce((sum, s) => sum + s.qty, 0)
        const distinctHours = hours.size
        if (distinctHours > 0) {
          totalBasketSize += crewQty / distinctHours
        }
      }
      // Average across ALL crews (crews with 0 sales contribute 0)
      avgBasketSize = totalBasketSize / crewCount
    }

    // Price point = total settle / total qty
    const avgPricePoint = totalQty > 0 ? totalSettle / totalQty : 0

    return NextResponse.json({
      totalSettle: Math.round(totalSettle * 100) / 100,
      totalQty,
      avgBasketSize: Math.round(avgBasketSize * 100) / 100,
      avgPricePoint: Math.round(avgPricePoint * 100) / 100,
      crewCount,
      activeCrewCount,
      date: dateParam,
    })
  } catch (error) {
    console.error('Error calculating scoring summary:', error)
    return NextResponse.json(
      { error: 'Failed to calculate scoring summary' },
      { status: 500 }
    )
  }
}
