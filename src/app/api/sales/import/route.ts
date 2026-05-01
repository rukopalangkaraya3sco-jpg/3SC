import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'
import { randomUUID } from 'crypto'
import { mkdirSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

// Use /tmp for Vercel serverless (read-only filesystem except /tmp)
// Use local upload dir for development
function getUploadDir(): string {
  if (process.env.VERCEL) {
    return '/tmp/claim-penjualan-uploads'
  }
  return join(process.cwd(), 'upload')
}

function toNullIfEmpty(val: unknown): string | null {
  if (val === undefined || val === null || val === '') return null
  return String(val)
}

function toFloatOrNull(val: unknown): number | null {
  if (val === undefined || val === null || val === '') return null
  const num = Number(val)
  return isNaN(num) ? null : num
}

function toIntOrNull(val: unknown): number {
  if (val === undefined || val === null || val === '') return 0
  const num = Number(val)
  return isNaN(num) ? 0 : Math.round(num)
}

function toFloatOrZero(val: unknown): number {
  if (val === undefined || val === null || val === '') return 0
  const num = Number(val)
  return isNaN(num) ? 0 : num
}

/**
 * Force-extend the worksheet range to cover ALL rows that have any data.
 * Fixes the bug where Excel's internal "!ref" range is smaller than actual data.
 */
function forceFullRange(ws: XLSX.WorkSheet): void {
  const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
  // Scan all cells to find the actual max row
  for (const key in ws) {
    if (key.startsWith('!')) continue
    const addr = XLSX.utils.decode_cell(key)
    if (addr.c >= 0 && addr.r >= 0) {
      if (addr.r > range.e.r) range.e.r = addr.r
      if (addr.c > range.e.c) range.e.c = addr.c
    }
  }
  ws['!ref'] = XLSX.utils.encode_range(range)
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Save uploaded file with unique name
    const uploadDir = getUploadDir()
    if (!existsSync(uploadDir)) {
      mkdirSync(uploadDir, { recursive: true })
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const uniqueFileName = `${randomUUID()}-${file.name}`
    const filePath = join(uploadDir, uniqueFileName)
    writeFileSync(filePath, fileBuffer)

    // Read Excel file with sheetStubs to preserve all cells including empty ones
    const workbook = XLSX.read(fileBuffer, {
      type: 'buffer',
      sheetStubs: true,
    })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    if (!worksheet) {
      return NextResponse.json(
        { error: 'No sheet found in Excel file' },
        { status: 400 }
      )
    }

    // Force the worksheet range to cover ALL rows with data
    forceFullRange(worksheet)

    // Parse rows as array of arrays (more reliable than header: 'A')
    const allRows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      raw: true,
      blankrows: false,
    })

    // Skip the header row (first row) — index 0
    const dataRows = allRows.slice(1)

    if (dataRows.length === 0) {
      return NextResponse.json(
        { error: 'No data rows found in Excel file' },
        { status: 400 }
      )
    }

    console.log(`[IMPORT] Total rows read from Excel (excluding header): ${dataRows.length}`)

    // Parse all rows into SalesData records
    // Column mapping: A(0)=tanggal, B(1)=idPenjualan, C(2)=statusRetention, ...
    const salesDataRecords: {
      tanggal: Date
      idPenjualan: string
      statusRetention: string | null
      retentionCode: string | null
      pembayaran: string | null
      program: string | null
      channelStock: string | null
      kodeExtend: string
      brand: string | null
      dept: string | null
      modul: string | null
      ukuran: string | null
      qty: number
      hjp: number | null
      netto: number | null
      diskon: number | null
      diskonRp: number | null
      potongan: number | null
      potonganV: number | null
      settle: number
    }[] = []

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i] as unknown[]

      // Skip completely empty rows (all null/undefined)
      const hasAnyData = row.some(
        (cell) => cell !== null && cell !== undefined && cell !== ''
      )
      if (!hasAnyData) continue

      // Parse tanggal - column index 0
      const tanggalRaw = row[0]
      let tanggal: Date
      if (typeof tanggalRaw === 'number') {
        // Excel serial date number
        const parsed = XLSX.SSF.parse_date_code(tanggalRaw)
        if (parsed) {
          tanggal = new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d, parsed.H || 0, parsed.M || 0, parsed.S || 0))
        } else {
          tanggal = new Date()
        }
      } else if (tanggalRaw instanceof Date) {
        tanggal = tanggalRaw
      } else {
        tanggal = new Date(String(tanggalRaw))
        if (isNaN(tanggal.getTime())) {
          // Try parsing common date formats: "2026-05-01 18:17", "01/05/2026", etc.
        const strVal = String(tanggalRaw).trim()
        const dashMatch = strVal.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
        if (dashMatch) {
          tanggal = new Date(Date.UTC(
            parseInt(dashMatch[1]),
            parseInt(dashMatch[2]) - 1,
            parseInt(dashMatch[3])
          ))
        } else {
          tanggal = new Date()
        }
        }
      }

      // idPenjualan - column index 1
      const idPenjualanRaw = row[1]
      const idPenjualan = idPenjualanRaw !== null && idPenjualanRaw !== undefined
        ? String(idPenjualanRaw)
        : ''

      salesDataRecords.push({
        tanggal,
        idPenjualan,
        statusRetention: toNullIfEmpty(row[2]),
        retentionCode: toNullIfEmpty(row[3]),
        pembayaran: toNullIfEmpty(row[4]),
        program: toNullIfEmpty(row[5]),
        channelStock: toNullIfEmpty(row[6]),
        kodeExtend: String(row[7] ?? ''),
        brand: toNullIfEmpty(row[8]),
        dept: toNullIfEmpty(row[9]),
        modul: toNullIfEmpty(row[10]),
        ukuran: toNullIfEmpty(row[11]),
        qty: toIntOrNull(row[12]),
        hjp: toFloatOrNull(row[13]),
        netto: toFloatOrNull(row[14]),
        diskon: toFloatOrNull(row[15]),
        diskonRp: toFloatOrNull(row[16]),
        potongan: toFloatOrNull(row[17]),
        potonganV: toFloatOrNull(row[18]),
        settle: toFloatOrZero(row[19]),
      })
    }

    console.log(`[IMPORT] Valid data rows parsed: ${salesDataRecords.length}`)

    if (salesDataRecords.length === 0) {
      return NextResponse.json(
        { error: 'No valid data rows found in Excel file' },
        { status: 400 }
      )
    }

    // ─── Dedup validation by idPenjualan ──────────────────
    // Extract all idPenjualan from the import
    const importIds = salesDataRecords
      .map((r) => r.idPenjualan)
      .filter((id) => id !== '')

    // Find existing idPenjualan in the database
    const existingRecords = importIds.length > 0
      ? await db.salesData.findMany({
          where: { idPenjualan: { in: importIds } },
          select: { idPenjualan: true },
        })
      : []

    const existingIdSet = new Set(existingRecords.map((r) => r.idPenjualan))

    // Filter out duplicates — only keep rows whose idPenjualan doesn't already exist
    const uniqueRecords = salesDataRecords.filter(
      (r) => r.idPenjualan === '' || !existingIdSet.has(r.idPenjualan)
    )

    const duplicateCount = salesDataRecords.length - uniqueRecords.length

    if (duplicateCount > 0) {
      console.log(`[IMPORT] Skipped ${duplicateCount} duplicate rows (idPenjualan already exists)`)
    }

    if (uniqueRecords.length === 0) {
      return NextResponse.json(
        {
          error: `Semua ${salesDataRecords.length} data sudah ada (ID Penjualan duplikat). Tidak ada data baru yang diimport.`,
          duplicateCount,
        },
        { status: 409 }
      )
    }

    // Create ImportBatch record
    const batch = await db.importBatch.create({
      data: {
        fileName: file.name,
        totalRecords: uniqueRecords.length,
        importDate: new Date(),
      },
    })

    // Add importBatchId to all unique records
    const recordsWithBatch = uniqueRecords.map((record) => ({
      ...record,
      importBatchId: batch.id,
    }))

    // Insert all unique records using createMany for performance
    await db.salesData.createMany({
      data: recordsWithBatch,
    })

    console.log(`[IMPORT] Successfully imported ${uniqueRecords.length} records (${duplicateCount} duplicates skipped)`)

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      totalRecords: uniqueRecords.length,
      skippedDuplicates: duplicateCount,
      totalParsed: salesDataRecords.length,
    })
  } catch (error) {
    console.error('Error importing Excel:', error)
    return NextResponse.json(
      { error: 'Failed to import Excel file' },
      { status: 500 }
    )
  }
}
