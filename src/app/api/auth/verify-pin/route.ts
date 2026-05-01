import { NextRequest, NextResponse } from 'next/server'

const ADMIN_PIN = process.env.ADMIN_PIN || '1234'

// Simple in-memory rate limiting
const failedAttempts = new Map<string, { count: number; firstAttempt: number }>()
const MAX_ATTEMPTS = 5
const WINDOW_MS = 5 * 60 * 1000 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pin } = body

    if (!pin || typeof pin !== 'string') {
      return NextResponse.json(
        { success: false, error: 'PIN diperlukan' },
        { status: 400 }
      )
    }

    // Rate limiting check
    const clientIp = request.headers.get('x-forwarded-for') || 'unknown'
    const now = Date.now()
    const record = failedAttempts.get(clientIp)

    if (record) {
      // Check if window has expired, reset if so
      if (now - record.firstAttempt > WINDOW_MS) {
        failedAttempts.delete(clientIp)
      } else if (record.count >= MAX_ATTEMPTS) {
        const remainingMs = WINDOW_MS - (now - record.firstAttempt)
        const remainingMin = Math.ceil(remainingMs / 60000)
        return NextResponse.json(
          {
            success: false,
            error: `Terlalu banyak percobaan. Coba lagi dalam ${remainingMin} menit.`,
          },
          { status: 429 }
        )
      }
    }

    // Validate PIN
    if (pin === ADMIN_PIN) {
      // Clear rate limit on success
      failedAttempts.delete(clientIp)
      return NextResponse.json({ success: true })
    }

    // Record failed attempt
    const existing = failedAttempts.get(clientIp)
    if (existing && now - existing.firstAttempt < WINDOW_MS) {
      existing.count += 1
    } else {
      failedAttempts.set(clientIp, { count: 1, firstAttempt: now })
    }

    const currentCount = failedAttempts.get(clientIp)?.count ?? 1
    const remaining = MAX_ATTEMPTS - currentCount

    return NextResponse.json(
      {
        success: false,
        error: `PIN salah. ${remaining} percobaan tersisa.`,
      },
      { status: 401 }
    )
  } catch {
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan' },
      { status: 500 }
    )
  }
}
