import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { namaCrew, fotoUrl, idKaryawan, pin, groupId } = body

    // Check if crew exists
    const existing = await db.crew.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Crew not found' },
        { status: 404 }
      )
    }

    // If idKaryawan is being updated, check for uniqueness
    if (idKaryawan && idKaryawan !== existing.idKaryawan) {
      const duplicate = await db.crew.findUnique({
        where: { idKaryawan },
      })
      if (duplicate) {
        return NextResponse.json(
          { error: 'idKaryawan already exists' },
          { status: 409 }
        )
      }
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

    const updateData: Record<string, unknown> = {}
    if (namaCrew !== undefined) updateData.namaCrew = namaCrew
    if (fotoUrl !== undefined) updateData.fotoUrl = fotoUrl
    if (idKaryawan !== undefined) updateData.idKaryawan = idKaryawan
    if (pin !== undefined) updateData.pin = pin
    // Handle groupId: set to new group, or explicitly null to unlink
    if (groupId !== undefined) updateData.groupId = groupId

    const crew = await db.crew.update({
      where: { id },
      data: updateData,
      include: {
        group: { select: { id: true, namaGrup: true, logoUrl: true } },
      },
    })

    return NextResponse.json(crew)
  } catch (error) {
    console.error('Error updating crew:', error)
    return NextResponse.json(
      { error: 'Failed to update crew' },
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

    // Check if crew exists
    const existing = await db.crew.findUnique({
      where: { id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Crew not found' },
        { status: 404 }
      )
    }

    // Unlink all sales data from this crew
    await db.salesData.updateMany({
      where: { crewId: id },
      data: { crewId: null },
    })

    await db.crew.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting crew:', error)
    return NextResponse.json(
      { error: 'Failed to delete crew' },
      { status: 500 }
    )
  }
}
