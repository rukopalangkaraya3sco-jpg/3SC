/**
 * Smart build script for Vercel + Neon deployment
 *
 * When VERCEL env var is detected (Vercel build environment):
 *   1. Copies schema.neon.prisma → schema.prisma (switches to PostgreSQL)
 *   2. Runs prisma generate with the PostgreSQL schema
 *   3. Runs prisma db push to create tables on Neon (if empty)
 *   4. Builds the Next.js app
 *
 * When running locally:
 *   1. Uses schema.prisma (SQLite) as-is
 *   2. Runs prisma generate with the SQLite schema
 *   3. Builds the Next.js app
 */

/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const isVercel = !!process.env.VERCEL
const prismaDir = path.join(__dirname, 'prisma')
const schemaPath = path.join(prismaDir, 'schema.prisma')
const neonSchemaPath = path.join(prismaDir, 'schema.neon.prisma')

// Backup the original schema.prisma for local dev
let sqliteBackup = null
if (isVercel && fs.existsSync(schemaPath)) {
  sqliteBackup = fs.readFileSync(schemaPath, 'utf-8')
}

if (isVercel) {
  console.log('🚀 Vercel build detected — switching to Neon PostgreSQL schema...')

  if (!fs.existsSync(neonSchemaPath)) {
    console.error('❌ schema.neon.prisma not found!')
    process.exit(1)
  }

  // Copy Neon schema to schema.prisma
  fs.copyFileSync(neonSchemaPath, schemaPath)
  console.log('✅ Switched to PostgreSQL schema (schema.neon.prisma → schema.prisma)')
}

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...')
  execSync('npx prisma generate', { stdio: 'inherit' })

  // Push schema to Neon database (creates tables if they don't exist)
  if (isVercel) {
    console.log('📤 Pushing schema to Neon database...')
    try {
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit' })
      console.log('✅ Database schema pushed successfully')
    } catch (pushError) {
      console.warn('⚠️  prisma db push failed (tables may already exist):', pushError.message)
      // Don't fail the build — tables might already exist
    }
  }

  // Build Next.js
  console.log('🔨 Building Next.js app...')
  execSync('npx next build', { stdio: 'inherit' })
} finally {
  // Restore SQLite schema for local dev (in case Vercel caches the file)
  if (isVercel && sqliteBackup) {
    fs.writeFileSync(schemaPath, sqliteBackup)
    console.log('🔄 Restored original SQLite schema.prisma')
  }
}
