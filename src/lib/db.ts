import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || ''

  // Detect if we're using Neon/PostgreSQL
  const isPostgres =
    databaseUrl.includes('neon.tech') ||
    databaseUrl.startsWith('postgresql://') ||
    databaseUrl.startsWith('postgres://')

  if (isPostgres) {
    // Use standard PrismaClient with Neon's POOLED connection URL
    // This works perfectly on Vercel serverless without any adapter
    //
    // IMPORTANT: Use Neon's pooled connection URL for DATABASE_URL:
    //   postgresql://user:pass@ep-xxx.pooler.neon.tech/dbname?sslmode=require
    //                                    ^^^^^^^
    //   (note: "pooler" in the hostname)
    //
    return new PrismaClient({
      log: ['error'],
      datasourceUrl: databaseUrl,
    })
  }

  // Standard PrismaClient for local SQLite development
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query'] : ['error'],
  })
}

export const db = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
