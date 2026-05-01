import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const batchId = searchParams.get('batchId') || ''
    const crewId = searchParams.get('crewId') || ''
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Build where clause
    const where: Prisma.SalesDataWhereInput = {}

    if (search) {
      where.kodeExtend = { contains: search }
    }

    if (batchId) {
      where.importBatchId = batchId
    }

    if (crewId) {
      where.crewId = crewId
    }

    const total = await db.salesData.count({ where })
    const totalPages = Math.ceil(total / limit)
    const skip = (page - 1) * limit

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
    })
  } catch (error) {
    console.error('Error fetching sales data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sales data' },
      { status: 500 }
    )
  }
}
