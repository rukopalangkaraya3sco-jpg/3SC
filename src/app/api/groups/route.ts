import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const groups = await db.group.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        crews: {
          select: {
            id: true,
            namaCrew: true,
            idKaryawan: true,
            fotoUrl: true,
          },
        },
        _count: {
          select: { crews: true },
        },
      },
    })

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch groups' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      namaGrup,
      logoUrl,
      targetBulanan,
      week1Percentage,
      week2Percentage,
      week3Percentage,
      week4Percentage,
    } = body

    if (!namaGrup) {
      return NextResponse.json(
        { error: 'namaGrup is required' },
        { status: 400 }
      )
    }

    const group = await db.group.create({
      data: {
        namaGrup,
        logoUrl: logoUrl || '',
        targetBulanan: targetBulanan ?? 0,
        week1Percentage: week1Percentage ?? 25,
        week2Percentage: week2Percentage ?? 25,
        week3Percentage: week3Percentage ?? 25,
        week4Percentage: week4Percentage ?? 25,
      },
      include: {
        crews: true,
        _count: {
          select: { crews: true },
        },
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error('Error creating group:', error)
    return NextResponse.json(
      { error: 'Failed to create group' },
      { status: 500 }
    )
  }
}
