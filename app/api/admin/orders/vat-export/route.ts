import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/adminAuth'
import connectDB from '@/lib/mongodb'
import Order from '@/lib/schemas/Order'
import { SHIPPING_LABELS, type ShippingMethod } from '@/lib/shipping'
import { computeVat, VAT_RATE } from '@/lib/vat'

/**
 * The TVA book, as a CSV an accountant can open.
 *
 * GET /api/admin/orders/vat-export?from=2026-01-01&to=2026-03-31
 * with the x-admin-password header, like every other back-office route.
 *
 * One row per taxable line, the delivery fee included as its own line, so
 * a quarter's declaration is a sum over a column rather than a series of
 * divisions. Only paid orders: a pending or failed one was never a sale
 * and has no TVA to declare.
 *
 * Orders placed before the breakdown was stored have no `vatLines`. They
 * are recomputed here from what was charged, which is exactly as accurate
 * (the arithmetic is deterministic) and keeps the export usable over the
 * whole history rather than only from this deployment forward. The
 * `source` column says which is which, because an auditor is entitled to
 * know whether a figure was recorded or reconstructed.
 */

export const dynamic = 'force-dynamic'

// Semicolon-separated with comma decimals: this file is opened in a
// French Excel, where a comma is the decimal separator and a
// comma-separated file therefore lands entirely in column A.
const SEP = ';'

function csvCell(value: string | number): string {
  const text = typeof value === 'number' ? value.toFixed(2).replace('.', ',') : value
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function csvRow(cells: (string | number)[]): string {
  return cells.map(csvCell).join(SEP)
}

/** Parses ?from=/?to= as inclusive calendar days, UTC. Invalid = ignored. */
function parseDay(value: string | null, endOfDay: boolean): Date | null {
  if (!value) return null
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim())
  if (!match) return null
  const [, y, m, d] = match
  const date = new Date(
    Date.UTC(Number(y), Number(m) - 1, Number(d), endOfDay ? 23 : 0, endOfDay ? 59 : 0, endOfDay ? 59 : 0, endOfDay ? 999 : 0)
  )
  return Number.isNaN(date.getTime()) ? null : date
}

interface ExportLine {
  label: string
  kind: string
  amountTTC: number
  vatAmount: number
  amountHT: number
}

/** The stored breakdown, or the same arithmetic over what was charged. */
function linesFor(order: {
  vatLines?: ExportLine[]
  items?: { name?: string; price?: number; quantity?: number }[]
  shippingCost?: number
  shippingMethod?: ShippingMethod
}): { lines: ExportLine[]; source: 'stored' | 'recomputed' } {
  if (order.vatLines && order.vatLines.length > 0) {
    return { lines: order.vatLines, source: 'stored' }
  }

  const inputs = [
    ...(order.items || []).map((i) => ({
      label: i.name || 'Article',
      ttc: (i.price || 0) * (i.quantity || 1),
      kind: 'item',
    })),
    ...((order.shippingCost || 0) > 0
      ? [{
          label: `Livraison : ${SHIPPING_LABELS[order.shippingMethod || 'pickup']}`,
          ttc: order.shippingCost as number,
          kind: 'shipping',
        }]
      : []),
  ]
  const vat = computeVat(inputs.map(({ label, ttc }) => ({ label, ttc })))
  return {
    lines: vat.lines.map((line, index) => ({
      label: line.label,
      kind: inputs[index].kind,
      amountTTC: line.ttc,
      vatAmount: line.vat,
      amountHT: line.ht,
    })),
    source: 'recomputed',
  }
}

export async function GET(request: NextRequest) {
  const denied = requireAdmin(request)
  if (denied) return denied

  const { searchParams } = new URL(request.url)
  const from = parseDay(searchParams.get('from'), false)
  const to = parseDay(searchParams.get('to'), true)

  const query: Record<string, unknown> = { paymentStatus: 'paid' }
  if (from || to) {
    const range: Record<string, Date> = {}
    if (from) range.$gte = from
    if (to) range.$lte = to
    query.createdAt = range
  }

  await connectDB()
  const orders = await Order.find(query)
    .select('orderId createdAt shippingMethod shippingCost items vatLines amountTTC vatAmount amountHT vatRate')
    .sort({ createdAt: 1 })
    .lean()

  const header = [
    'commande',
    'date',
    'ligne',
    'type',
    'montant_ttc',
    'tva',
    'montant_ht',
    'taux',
    'total_commande_ttc',
    'total_commande_tva',
    'source',
  ]

  const rows: string[] = [csvRow(header)]

  for (const order of orders as unknown as Record<string, any>[]) {
    const { lines, source } = linesFor(order)
    const rate = typeof order.vatRate === 'number' ? order.vatRate : VAT_RATE
    // Order-level totals: stored when we have them, otherwise the same
    // computation the lines just went through.
    const orderTTC =
      typeof order.amountTTC === 'number'
        ? order.amountTTC
        : lines.reduce((sum, l) => sum + l.amountTTC, 0)
    const orderVat =
      typeof order.vatAmount === 'number'
        ? order.vatAmount
        : computeVat([{ label: 'total', ttc: orderTTC }]).totalVat
    const day = new Date(order.createdAt).toISOString().slice(0, 10)

    for (const line of lines) {
      rows.push(
        csvRow([
          order.orderId || '',
          day,
          line.label,
          line.kind,
          line.amountTTC,
          line.vatAmount,
          line.amountHT,
          `${Math.round(rate * 100)}%`,
          orderTTC,
          orderVat,
          source,
        ])
      )
    }
  }

  const stamp = [from, to].filter(Boolean).length
    ? `-${searchParams.get('from') || 'debut'}_${searchParams.get('to') || 'fin'}`
    : ''

  // A BOM, so Excel reads the file as UTF-8 rather than as Latin-1 and
  // turns every accented product name into mojibake.
  return new NextResponse('﻿' + rows.join('\n') + '\n', {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="tva${stamp}.csv"`,
      'Cache-Control': 'no-store',
    },
  })
}
