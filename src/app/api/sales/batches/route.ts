import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const batches = await db.importBatch.findMany({
      orderBy: { importDate: 'desc' },
      include: {
        _count: {
          select: { salesData: true },
        },
      },
    })

    const result = batches.map((batch) => ({
      id: batch.id,
      fileName: batch.fileName,
      totalRecords: batch.totalRecords,
      importDate: batch.importDate,
      createdAt: batch.createdAt,
      recordCount: batch._count.salesData,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching import batches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch import batches' },
      { status: 500 }
    )
  }
}
