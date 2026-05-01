import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import * as XLSX from 'xlsx'
import * as fs from 'fs'
import * as path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = '/home/z/my-project/upload'

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
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const uniqueFileName = `${randomUUID()}-${file.name}`
    const filePath = path.join(UPLOAD_DIR, uniqueFileName)
    fs.writeFileSync(filePath, fileBuffer)

    // Read Excel file
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' })
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]

    if (!worksheet) {
      return NextResponse.json(
        { error: 'No sheet found in Excel file' },
        { status: 400 }
      )
    }

    // Parse rows (skip header row)
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, {
      header: 'A',
      defval: null,
      raw: true,
    })

    // Skip the header row (first row)
    const dataRows = rows.slice(1)

    if (dataRows.length === 0) {
      return NextResponse.json(
        { error: 'No data rows found in Excel file' },
        { status: 400 }
      )
    }

    // Create ImportBatch record
    const batch = await db.importBatch.create({
      data: {
        fileName: file.name,
        totalRecords: dataRows.length,
        importDate: new Date(),
      },
    })

    // Create all SalesData records
    const salesDataRecords = dataRows.map((row) => {
      // Parse tanggal - Excel date format like "2026-05-01 18:17"
      const tanggalRaw = row['A']
      let tanggal: Date
      if (typeof tanggalRaw === 'number') {
        // Excel serial date number
        tanggal = XLSX.SSF.parse_date_code(tanggalRaw)
          ? new Date(
              XLSX.SSF.parse_date_code(tanggalRaw).y,
              XLSX.SSF.parse_date_code(tanggalRaw).m - 1,
              XLSX.SSF.parse_date_code(tanggalRaw).d
            )
          : new Date()
      } else {
        tanggal = new Date(String(tanggalRaw))
        if (isNaN(tanggal.getTime())) {
          tanggal = new Date()
        }
      }

      // idPenjualan - convert from number to string
      const idPenjualanRaw = row['B']
      const idPenjualan = idPenjualanRaw !== null && idPenjualanRaw !== undefined
        ? String(idPenjualanRaw)
        : ''

      return {
        tanggal,
        idPenjualan,
        statusRetention: toNullIfEmpty(row['C']),
        retentionCode: toNullIfEmpty(row['D']),
        pembayaran: toNullIfEmpty(row['E']),
        program: toNullIfEmpty(row['F']),
        channelStock: toNullIfEmpty(row['G']),
        kodeExtend: String(row['H'] ?? ''),
        brand: toNullIfEmpty(row['I']),
        dept: toNullIfEmpty(row['J']),
        modul: toNullIfEmpty(row['K']),
        ukuran: toNullIfEmpty(row['L']),
        qty: toIntOrNull(row['M']),
        hjp: toFloatOrNull(row['N']),
        netto: toFloatOrNull(row['O']),
        diskon: toFloatOrNull(row['P']),
        diskonRp: toFloatOrNull(row['Q']),
        potongan: toFloatOrNull(row['R']),
        potonganV: toFloatOrNull(row['S']),
        settle: toFloatOrZero(row['T']),
        importBatchId: batch.id,
      }
    })

    // Insert all records using createMany for performance
    await db.salesData.createMany({
      data: salesDataRecords,
    })

    return NextResponse.json({
      success: true,
      batchId: batch.id,
      totalRecords: dataRows.length,
    })
  } catch (error) {
    console.error('Error importing Excel:', error)
    return NextResponse.json(
      { error: 'Failed to import Excel file' },
      { status: 500 }
    )
  }
}
