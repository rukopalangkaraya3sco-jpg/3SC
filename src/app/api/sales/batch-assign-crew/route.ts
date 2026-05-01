import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { salesIds, crewId } = body

    if (!Array.isArray(salesIds) || salesIds.length === 0) {
      return NextResponse.json(
        { error: 'salesIds must be a non-empty array' },
        { status: 400 }
      )
    }

    // If crewId is provided, verify crew exists
    if (crewId) {
      const crew = await db.crew.findUnique({
        where: { id: crewId },
      })
      if (!crew) {
        return NextResponse.json(
          { error: 'Crew not found' },
          { status: 404 }
        )
      }
    }

    // Update all sales records
    const result = await db.salesData.updateMany({
      where: { id: { in: salesIds } },
      data: { crewId: crewId || null },
    })

    return NextResponse.json({
      updated: result.count,
      crewId: crewId || null,
    })
  } catch (error) {
    console.error('Error batch assigning crew:', error)
    return NextResponse.json(
      { error: 'Failed to batch assign crew' },
      { status: 500 }
    )
  }
}
