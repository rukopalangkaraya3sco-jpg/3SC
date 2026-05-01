import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || ''
  const isPostgresUrl =
    databaseUrl.includes('neon.tech') ||
    databaseUrl.startsWith('postgresql://') ||
    databaseUrl.startsWith('postgres://')

  if (isPostgresUrl && typeof window === 'undefined') {
    // Use Neon serverless adapter for PostgreSQL/Neon connections (server-side only)
    // Dynamic imports to avoid bundling Neon adapter when using SQLite
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PrismaNeon } = require('@prisma/adapter-neon')
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Pool } = require('@neondatabase/serverless')
      const pool = new Pool({ connectionString: databaseUrl })
      const adapter = new PrismaNeon(pool)
      return new PrismaClient({ adapter })
    } catch {
      // Fallback to standard client if adapter is not available
      console.warn('Neon adapter not available, using standard PrismaClient')
      return new PrismaClient({ log: ['query'] })
    }
  }

  // Standard PrismaClient for local SQLite development
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
