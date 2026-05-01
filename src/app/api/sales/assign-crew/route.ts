import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { salesId, crewId } = body

    if (!salesId) {
      return NextResponse.json(
        { error: 'salesId is required' },
        { status: 400 }
      )
    }

    // Verify sales record exists
    const salesRecord = await db.salesData.findUnique({
      where: { id: salesId },
    })

    if (!salesRecord) {
      return NextResponse.json(
        { error: 'Sales record not found' },
        { status: 404 }
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

    // Update the sales record with the crew
    const updated = await db.salesData.update({
      where: { id: salesId },
      data: { crewId: crewId || null },
      include: {
        crew: {
          select: {
            id: true,
            namaCrew: true,
            fotoUrl: true,
            idKaryawan: true,
          },
        },
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error assigning crew:', error)
    return NextResponse.json(
      { error: 'Failed to assign crew' },
      { status: 500 }
    )
  }
}
