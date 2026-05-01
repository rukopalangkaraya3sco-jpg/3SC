import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Add crew to group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { crewId } = body

    if (!crewId) {
      return NextResponse.json(
        { error: 'crewId is required' },
        { status: 400 }
      )
    }

    const group = await db.group.findUnique({ where: { id } })
    if (!group) {
      return NextResponse.json(
        { error: 'Group not found' },
        { status: 404 }
      )
    }

    const crew = await db.crew.findUnique({ where: { id: crewId } })
    if (!crew) {
      return NextResponse.json(
        { error: 'Crew not found' },
        { status: 404 }
      )
    }

    const updatedCrew = await db.crew.update({
      where: { id: crewId },
      data: { groupId: id },
      include: { group: true },
    })

    return NextResponse.json(updatedCrew)
  } catch (error) {
    console.error('Error adding crew to group:', error)
    return NextResponse.json(
      { error: 'Failed to add crew to group' },
      { status: 500 }
    )
  }
}

// Remove crew from group
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()
    const { crewId } = body

    if (!crewId) {
      return NextResponse.json(
        { error: 'crewId is required' },
        { status: 400 }
      )
    }

    const crew = await db.crew.findUnique({
      where: { id: crewId },
    })

    if (!crew) {
      return NextResponse.json(
        { error: 'Crew not found' },
        { status: 404 }
      )
    }

    if (crew.groupId !== id) {
      return NextResponse.json(
        { error: 'Crew is not in this group' },
        { status: 400 }
      )
    }

    const updatedCrew = await db.crew.update({
      where: { id: crewId },
      data: { groupId: null },
    })

    return NextResponse.json(updatedCrew)
  } catch (error) {
    console.error('Error removing crew from group:', error)
    return NextResponse.json(
      { error: 'Failed to remove crew from group' },
      { status: 500 }
    )
  }
}
