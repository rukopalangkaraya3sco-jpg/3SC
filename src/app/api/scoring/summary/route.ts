import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')

    // Parse the date or default to today
    let targetDate: Date
    if (dateParam) {
      targetDate = new Date(dateParam + 'T00:00:00.000Z')
    } else {
      const now = new Date()
      targetDate = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
      )
    }

    // Build date range for the target date (UTC)
    const startOfDay = new Date(targetDate)
    startOfDay.setUTCHours(0, 0, 0, 0)

    const endOfDay = new Date(targetDate)
    endOfDay.setUTCHours(23, 59, 59, 999)

    // Query all sales data for the given date range with crew assigned
    const salesData = await db.salesData.findMany({
      where: {
        tanggal: {
          gte: startOfDay,
          lte: endOfDay,
        },
        crewId: { not: null },
      },
      include: {
        crew: true,
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

      // Track distinct hours per crew for basket size
      const cId = sale.crewId!
      if (!crewHourlyMap.has(cId)) {
        crewHourlyMap.set(cId, new Set())
      }
      const saleDate = new Date(sale.tanggal)
      const hour = saleDate.getUTCHours()
      crewHourlyMap.get(cId)!.add(hour)
    }

    const crewCount = crewHourlyMap.size

    // Calculate average basket size across all crews
    let avgBasketSize = 0
    if (crewCount > 0) {
      // For each crew: basketSize = totalQty_for_crew / distinctHours_for_crew
      // Then average across crews
      let totalBasketSize = 0
      for (const [cId, hours] of crewHourlyMap) {
        const crewSales = salesData.filter((s) => s.crewId === cId)
        const crewQty = crewSales.reduce((sum, s) => sum + s.qty, 0)
        const distinctHours = hours.size
        if (distinctHours > 0) {
          totalBasketSize += crewQty / distinctHours
        }
      }
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
    })
  } catch (error) {
    console.error('Error calculating scoring summary:', error)
    return NextResponse.json(
      { error: 'Failed to calculate scoring summary' },
      { status: 500 }
    )
  }
}
