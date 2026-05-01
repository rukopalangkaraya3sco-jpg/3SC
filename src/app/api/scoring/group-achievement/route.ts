import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

/**
 * Get the current week number of the month (1-4) based on GMT+7 date
 */
function getWeekOfMonth(dateStr: string): number {
  const [year, month, day] = dateStr.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  const dayOfMonth = date.getUTCDate()

  if (dayOfMonth <= 7) return 1
  if (dayOfMonth <= 14) return 2
  if (dayOfMonth <= 21) return 3
  return 4
}

/**
 * Get the start and end of a specific week within a month in GMT+7
 */
function getWeekRange(year: number, month: number, week: number): { start: Date; end: Date } {
  const startDay = (week - 1) * 7 + 1
  const endDay = week * 7

  // Handle end of month
  const lastDayOfNextMonth = new Date(Date.UTC(year, month, 0))
  const lastDay = lastDayOfNextMonth.getUTCDate()
  const actualEndDay = Math.min(endDay, lastDay)

  // Start of week in GMT+7 → convert to UTC
  const start = new Date(Date.UTC(year, month - 1, startDay, 0, 0, 0, 0) - 7 * 60 * 60 * 1000)
  // End of week in GMT+7 → convert to UTC
  const end = new Date(Date.UTC(year, month - 1, actualEndDay, 23, 59, 59, 999) - 7 * 60 * 60 * 1000)

  return { start, end }
}

/**
 * Get today's date string in GMT+7
 */
function getTodayGMT7(): string {
  const now = new Date()
  const gmt7 = new Date(now.getTime() + 7 * 60 * 60 * 1000 + now.getTimezoneOffset() * 60 * 1000)
  const year = gmt7.getFullYear()
  const month = String(gmt7.getMonth() + 1).padStart(2, '0')
  const day = String(gmt7.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date') || getTodayGMT7()
    const [year, month] = dateParam.split('-').map(Number)
    const weekNum = getWeekOfMonth(dateParam)

    // Get all groups with their crews and weekly percentage config
    const groups = await db.group.findMany({
      include: {
        crews: {
          select: { id: true },
        },
      },
    })

    // Get week range for the current week
    const { start, end } = getWeekRange(year, month, weekNum)

    // For each group, get total settle from all its crews for the week
    const results = []

    for (const group of groups) {
      const crewIds = group.crews.map((c) => c.id)

      // Get the weekly target percentage
      let weeklyPercentage = 25 // default
      if (weekNum === 1) weeklyPercentage = group.week1Percentage
      else if (weekNum === 2) weeklyPercentage = group.week2Percentage
      else if (weekNum === 3) weeklyPercentage = group.week3Percentage
      else if (weekNum === 4) weeklyPercentage = group.week4Percentage

      // Weekly target amount
      const weeklyTarget = group.targetBulanan * (weeklyPercentage / 100)

      // Get total settle for the group's crews this week
      const salesData = await db.salesData.findMany({
        where: {
          tanggal: {
            gte: start,
            lte: end,
          },
          crewId: {
            in: crewIds.length > 0 ? crewIds : ['__none__'],
          },
        },
        select: {
          settle: true,
          qty: true,
        },
      })

      const totalSettle = salesData.reduce((sum, s) => sum + s.settle, 0)
      const totalQty = salesData.reduce((sum, s) => sum + s.qty, 0)
      const progress = weeklyTarget > 0 ? Math.min((totalSettle / weeklyTarget) * 100, 100) : 0

      results.push({
        groupId: group.id,
        groupName: group.namaGrup,
        logoUrl: group.logoUrl,
        targetBulanan: group.targetBulanan,
        weeklyTarget: Math.round(weeklyTarget),
        weeklyPercentage,
        totalSettle: Math.round(totalSettle),
        totalQty,
        progress: Math.round(progress * 10) / 10,
        weekNum,
        crewCount: crewIds.length,
      })
    }

    // Sort by progress descending
    results.sort((a, b) => b.progress - a.progress)

    return NextResponse.json({
      data: results,
      weekNum,
      month,
      year,
    })
  } catch (error) {
    console.error('Error calculating group achievement:', error)
    return NextResponse.json(
      { error: 'Failed to calculate group achievement' },
      { status: 500 }
    )
  }
}
