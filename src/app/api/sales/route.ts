import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const batchId = searchParams.get('batchId') || ''
    const crewId = searchParams.get('crewId') || ''
    const tab = searchParams.get('tab') || '' // 'unclaim' | 'claim' | ''
    const dateStr = searchParams.get('date') || '' // YYYY-MM-DD in GMT+7
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '50', 10)

    // Build where clause
    const where: Prisma.SalesDataWhereInput = {}

    if (search) {
      where.kodeExtend = { contains: search }
    }

    if (batchId) {
      where.importBatchId = batchId
    }

    // Tab filter takes precedence: unclaim = no crew, claim = has crew
    if (tab === 'unclaim') {
      where.crewId = null
    } else if (tab === 'claim') {
      where.crewId = { not: null }
    } else if (crewId) {
      where.crewId = crewId
    }

    // Date filter (GMT+7)
    if (dateStr) {
      const [year, month, day] = dateStr.split('-').map(Number)
      // Start of day in GMT+7 = 17:00:00 previous day UTC
      const startUTC = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - 7 * 60 * 60 * 1000)
      // End of day in GMT+7 = 16:59:59.999 current day UTC
      const endUTC = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - 7 * 60 * 60 * 1000)

      where.tanggal = {
        gte: startUTC,
        lte: endUTC,
      }
    }

    const total = await db.salesData.count({ where })
    const totalPages = Math.ceil(total / limit)
    const skip = (page - 1) * limit

    // ─── Aggregate totals for ALL matching records (not just current page) ───
    const aggregateResult = await db.salesData.aggregate({
      where,
      _sum: {
        settle: true,
        qty: true,
      },
    })

    const aggregateSettle = aggregateResult._sum.settle ?? 0
    const aggregateQty = aggregateResult._sum.qty ?? 0

    const data = await db.salesData.findMany({
      where,
      include: {
        crew: {
          select: {
            id: true,
            namaCrew: true,
            fotoUrl: true,
            idKaryawan: true,
          },
        },
        importBatch: {
          select: {
            id: true,
            fileName: true,
            importDate: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    })

    return NextResponse.json({
      data,
      total,
      page,
      totalPages,
      aggregateSettle: Math.round(aggregateSettle * 100) / 100,
      aggregateQty,
    })
  } catch (error) {
    console.error('Error fetching sales data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    )
  }
}
