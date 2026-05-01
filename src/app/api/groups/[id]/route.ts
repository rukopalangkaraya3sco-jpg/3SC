import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const group = await db.group.findUnique({
      where: { id },
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

    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json(
      { error: 'Failed to fetch group' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    const existing = await db.group.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    const group = await db.group.update({
      where: { id },
      data: {
        ...(namaGrup !== undefined && { namaGrup }),
        ...(logoUrl !== undefined && { logoUrl }),
        ...(targetBulanan !== undefined && { targetBulanan: Number(targetBulanan) }),
        ...(week1Percentage !== undefined && { week1Percentage: Number(week1Percentage) }),
        ...(week2Percentage !== undefined && { week2Percentage: Number(week2Percentage) }),
        ...(week3Percentage !== undefined && { week3Percentage: Number(week3Percentage) }),
        ...(week4Percentage !== undefined && { week4Percentage: Number(week4Percentage) }),
      },
      include: {
        crews: true,
        _count: {
          select: { crews: true },
        },
      },
    })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error updating group:', error)
    return NextResponse.json(
      { error: 'Failed to update group' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const existing = await db.group.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    // Unlink all crews from this group before deleting
    await db.crew.updateMany({
      where: { groupId: id },
      data: { groupId: null },
    })

    await db.group.delete({ where: { id } })

    return NextResponse.json({ message: 'Group deleted successfully' })
  } catch (error) {
    console.error('Error deleting group:', error)
    return NextResponse.json(
      { error: 'Failed to delete group' },
      { status: 500 }
    )
  }
}
