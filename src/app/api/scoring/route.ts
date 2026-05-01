import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

interface HourlyBreakdown {
  hour: number
  qty: number
  settle: number
}

interface CrewScoring {
  crewId: string
  namaCrew: string
  fotoUrl: string
  idKaryawan: string
  groupName: string | null
  totalSettle: number
  totalQty: number
  basketSize: number
  pricePoint: number
  hourlyBreakdown: HourlyBreakdown[]
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const crewId = searchParams.get('crewId') || undefined

    // Parse the date or default to today
    let targetDate: Date
    if (dateParam) {
      targetDate = new Date(dateParam + 'T00:00:00.000Z')
    } else {
      const now = new Date()
      targetDate = new Date(
        Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
      )
    }

    // Build date range for the target date (UTC)
    const startOfDay = new Date(targetDate)
    startOfDay.setUTCHours(0, 0, 0, 0)

    const endOfDay = new Date(targetDate)
    endOfDay.setUTCHours(23, 59, 59, 999)

    // Build where clause
    const whereClause: {
      tanggal: { gte: Date; lte: Date }
      crewId: string | { not: null }
    } = {
      tanggal: {
        gte: startOfDay,
        lte: endOfDay,
      },
      crewId: { not: null },
    }
    if (crewId) {
      whereClause.crewId = crewId
    }

    // Query sales data for the given date range
    const salesData = await db.salesData.findMany({
      where: whereClause,
      include: {
        crew: {
          include: {
            group: {
              select: { namaGrup: true },
            },
          },
        },
      },
    })

    // Group by crewId
    const crewMap = new Map<
      string,
      {
        crewId: string
        namaCrew: string
        fotoUrl: string
        idKaryawan: string
        groupName: string | null
        hourlyMap: Map<number, { qty: number; settle: number }>
        totalSettle: number
        totalQty: number
      }
    >()

    for (const sale of salesData) {
      if (!sale.crew) continue

      const cId = sale.crewId!
      if (!crewMap.has(cId)) {
        crewMap.set(cId, {
          crewId: cId,
          namaCrew: sale.crew.namaCrew,
          fotoUrl: sale.crew.fotoUrl,
          idKaryawan: sale.crew.idKaryawan,
          groupName: sale.crew.group?.namaGrup || null,
          hourlyMap: new Map(),
          totalSettle: 0,
          totalQty: 0,
        })
      }

      const crewData = crewMap.get(cId)!

      // Extract hour from tanggal
      const saleDate = new Date(sale.tanggal)
      const hour = saleDate.getUTCHours()

      // Update hourly breakdown
      if (!crewData.hourlyMap.has(hour)) {
        crewData.hourlyMap.set(hour, { qty: 0, settle: 0 })
      }
      const hourData = crewData.hourlyMap.get(hour)!
      hourData.qty += sale.qty
      hourData.settle += sale.settle

      // Update totals
      crewData.totalSettle += sale.settle
      crewData.totalQty += sale.qty
    }

    // Calculate scoring metrics for each crew
    const results: CrewScoring[] = []

    for (const crewData of crewMap.values()) {
      const distinctHours = crewData.hourlyMap.size
      const basketSize = distinctHours > 0 ? crewData.totalQty / distinctHours : 0
      const pricePoint = crewData.totalQty > 0 ? crewData.totalSettle / crewData.totalQty : 0

      // Convert hourlyMap to sorted array
      const hourlyBreakdown: HourlyBreakdown[] = Array.from(
        crewData.hourlyMap.entries()
      )
        .map(([hour, data]) => ({
          hour,
          qty: data.qty,
          settle: Math.round(data.settle * 100) / 100,
        }))
        .sort((a, b) => a.hour - b.hour)

      results.push({
        crewId: crewData.crewId,
        namaCrew: crewData.namaCrew,
        fotoUrl: crewData.fotoUrl,
        idKaryawan: crewData.idKaryawan,
        groupName: crewData.groupName,
        totalSettle: Math.round(crewData.totalSettle * 100) / 100,
        totalQty: crewData.totalQty,
        basketSize: Math.round(basketSize * 100) / 100,
        pricePoint: Math.round(pricePoint * 100) / 100,
        hourlyBreakdown,
      })
    }

    // Sort by totalSettle descending
    results.sort((a, b) => b.totalSettle - a.totalSettle)

    return NextResponse.json(results)
  } catch (error) {
    console.error('Error calculating scoring:', error)
    return NextResponse.json(
      { error: 'Failed to calculate scoring' },
      { status: 500 }
    )
  }
}
