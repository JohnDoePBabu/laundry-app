import prisma from '../lib/prisma.js'

/**
 * Invoice numbers follow the pattern:  PREFIX/YYYY/NNNN
 * e.g.  IF/2025/0042   AC/2025/0007
 *
 * The counter is stored in a dedicated table so it survives server
 * restarts and is safe when two requests arrive simultaneously
 * (Postgres SELECT ... FOR UPDATE locks the row).
 *
 * Because Prisma doesn't expose advisory locks or raw SELECT FOR UPDATE
 * cleanly, we use a raw query inside a transaction.
 */

/**
 * Atomically increment the counter for a given prefix and return
 * the formatted invoice number.
 *
 * @param {'IF' | 'AC'} prefix
 * @returns {Promise<string>}  e.g. "IF/2025/0042"
 */
export async function nextInvoiceNumber(prefix) {
  const year = new Date().getFullYear()

  const result = await prisma.$transaction(async (tx) => {
    // Lock the counter row for this prefix so concurrent requests queue
    // rather than reading the same value simultaneously.
    const rows = await tx.$queryRaw`
      SELECT value FROM "InvoiceCounter"
      WHERE prefix = ${prefix}
      FOR UPDATE
    `

    if (rows.length === 0) {
      throw new Error(`No InvoiceCounter row found for prefix "${prefix}". Run db:seed first.`)
    }

    const current = Number(rows[0].value)
    const next = current + 1

    await tx.$executeRaw`
      UPDATE "InvoiceCounter"
      SET value = ${next}, "updatedAt" = NOW()
      WHERE prefix = ${prefix}
    `

    return next
  })

  return `${prefix}/${year}/${String(result).padStart(4, '0')}`
}

/**
 * Peek at the next invoice number without incrementing the counter.
 * Used by the frontend to show a preview before the user saves.
 */
export async function peekInvoiceNumber(prefix) {
  const year = new Date().getFullYear()

  const row = await prisma.invoiceCounter.findUnique({
    where: { prefix },
  })

  if (!row) {
    throw new Error(`No InvoiceCounter row found for prefix "${prefix}".`)
  }

  const next = Number(row.value) + 1
  return `${prefix}/${year}/${String(next).padStart(4, '0')}`
}