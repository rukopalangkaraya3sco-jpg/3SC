import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

/**
 * GET /api/sales/stats?date=YYYY-MM-DD
 * Returns: tab counts (unclaim/claim) + combined aggregates for the stat cards
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateStr = searchParams.get('date') || ''

    // Build base where clause (date only, no tab filter)
    const baseWhere: Prisma.SalesDataWhereInput = {}

    if (dateStr) {
      const [year, month, day] = dateStr.split('-').map(Number)
      const startUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - 7 * 60 * 60 * 1000)
      const endUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - 7 * 60 * 60 * 1000)
      baseWhere.tanggal = { gte: startUTC, lte: endUTC }
    }

    // Count for each tab
    const [unclaimCount, claimCount, allCount] = await Promise.all([
      db.salesData.count({ where: { ...baseWhere, crewId: null } }),
      db.salesData.count({ where: { ...baseWhere, crewId: { not: null } } }),
      db.salesData.count({ where: baseWhere }),
    ])

    // Combined aggregates (all data for the date, both tabs)
    const aggregateResult = await db.salesData.aggregate({
      where: baseWhere,
      _sum: {
        settle: true,
        qty: true,
      },
    })

    return NextResponse.json({
      unclaimCount,
      claimCount,
      totalCount: allCount,
      totalSettle: Math.round((aggregateResult._sum.settle ?? 0) * 100) / 100,
      totalQty: aggregateResult._sum.qty ?? 0,
    })
  } catch (error) {
    console.error('Error fetching sales stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales stats' },
      { status: 500 }
    )
  }
}
