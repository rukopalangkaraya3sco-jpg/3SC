import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const crews = await db.crew.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        group: { select: { id: true, namaGrup: true, logoUrl: true } },
        _count: {
          select: { salesData: true },
        },
      },
    })

    return NextResponse.json(crews)
  } catch (error) {
    console.error('Error fetching crews:', error)
    return NextResponse.json(
      { error: 'Failed to fetch crews' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { namaCrew, fotoUrl, idKaryawan, pin, groupId } = body

    if (!namaCrew || !fotoUrl || !idKaryawan) {
      return NextResponse.json(
        { error: 'namaCrew, fotoUrl, and idKaryawan are required' },
        { status: 400 }
      )
    }

    // Check if idKaryawan already exists
    const existing = await db.crew.findUnique({
      where: { idKaryawan },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'idKaryawan already exists' },
        { status: 409 }
      )
    }

    // If groupId is provided, verify it exists
    if (groupId) {
      const groupExists = await db.group.findUnique({
        where: { id: groupId },
      })
      if (!groupExists) {
        return NextResponse.json(
          { error: 'Group not found' },
          { status: 404 }
        )
      }
    }

    const crew = await db.crew.create({
      data: {
        namaCrew,
        fotoUrl,
        idKaryawan,
        pin: pin || '0000',
        ...(groupId ? { groupId } : {}),
      },
      include: {
        group: { select: { id: true, namaGrup: true, logoUrl: true } },
      },
    })

    return NextResponse.json(crew, { status: 201 })
  } catch (error) {
    console.error('Error creating crew:', error)
    return NextResponse.json(
      { error: 'Failed to create crew' },
      { status: 500 }
    )
  }
}
