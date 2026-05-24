import { paiseToRupees } from '../lib/util/money.js'

/**
 * GET /api/reports/dashboard      — KPI cards (totals, counts, alerts)
 * GET /api/reports/monthly        — P&L by department  ?month=YYYY-MM
 * GET /api/reports/schedule       — delivery schedule   ?date=YYYY-MM-DD
 */
export default async function reportsRoutes(fastify) {
  const { prisma } = fastify

  // ── Dashboard KPIs ────────────────────────────────────────────────────────
  fastify.get('/dashboard', async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Run all aggregations in parallel — much faster than sequential awaits
    const [
      laundryAgg,
      acAgg,
      expenseAgg,
      pendingAgg,
      overdueOrders,
      deliveredUnpaid,
    ] = await Promise.all([
      // Total laundry billed (sum of all order line values)
      prisma.orderLine.aggregate({
        _sum: { ratePaise: true },
      }),

      // Total AC billed (rate × qty, before discount/GST — simplified for dashboard)
      prisma.acJob.aggregate({
        _sum: { ratePaise: true },
      }),

      // Total expenses
      prisma.expense.aggregate({
        _sum: { amountPaise: true },
      }),

      // Outstanding laundry payments
      prisma.laundryOrder.aggregate({
        where: { paid: false, status: { not: 'CANCELLED' } },
        _sum:   { paidAmountPaise: true },
        _count: { id: true },
      }),

      // Overdue: delivery date passed, not delivered/cancelled
      prisma.laundryOrder.count({
        where: {
          deliveryDate: { lt: today },
          status:       { notIn: ['DELIVERED', 'CANCELLED'] },
        },
      }),

      // Delivered but payment still pending
      prisma.laundryOrder.count({
        where: { status: 'DELIVERED', paid: false },
      }),
    ])

    return {
      laundryRevenuePaise: laundryAgg._sum.ratePaise  ?? 0,
      acRevenuePaise:      acAgg._sum.ratePaise        ?? 0,
      totalExpensesPaise:  expenseAgg._sum.amountPaise ?? 0,
      pendingOrderCount:   pendingAgg._count.id,
      overdueCount:        overdueOrders,
      deliveredUnpaidCount: deliveredUnpaid,
    }
  })

  // ── Monthly P&L ───────────────────────────────────────────────────────────
  fastify.get('/monthly', async (request, reply) => {
    const { month } = request.query

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return reply.badRequest('month is required in YYYY-MM format')
    }

    const [year, mon] = month.split('-').map(Number)
    const from = new Date(year, mon - 1, 1)
    const to   = new Date(year, mon,     1)   // exclusive upper bound

    const [orders, acJobs, expenses] = await Promise.all([
      prisma.laundryOrder.findMany({
        where: { orderDate: { gte: from, lt: to }, status: { not: 'CANCELLED' } },
        include: {
          orderLines: {
            include: { serviceItem: { include: { service: true } } },
          },
        },
      }),

      prisma.acJob.findMany({
        where:  { jobDate: { gte: from, lt: to }, status: { not: 'CANCELLED' } },
        select: { ratePaise: true, qty: true, discPct: true, gstPct: true, paid: true },
      }),

      prisma.expense.findMany({
        where:  { expenseDate: { gte: from, lt: to } },
        select: { amountPaise: true, dept: true, category: true },
      }),
    ])

    // ── Laundry totals ──────────────────────────────────────────────────────
    let laundrySubPaise  = 0
    let laundryTaxPaise  = 0
    let laundryDiscPaise = 0

    const gstSummary = {}   // { '5': { taxable: N, tax: N }, '18': ... }

    for (const order of orders) {
      let sub = 0
      let tax = 0

      for (const line of order.orderLines) {
        const base = line.ratePaise * line.qty
        const gst  = line.serviceItem.service.gstPct
        sub += base
        tax += Math.round(base * gst / 100)

        // Build GST rate-wise breakdown
        const key = String(gst)
        if (!gstSummary[key]) gstSummary[key] = { taxablePaise: 0, taxPaise: 0 }
        gstSummary[key].taxablePaise += base
        gstSummary[key].taxPaise     += Math.round(base * gst / 100)
      }

      const disc = order.discPct > 0
        ? Math.round(sub * order.discPct / 100)
        : order.discAmtPaise

      laundrySubPaise  += sub
      laundryDiscPaise += disc
      laundryTaxPaise  += tax
    }

    const laundryTotalPaise = laundrySubPaise - laundryDiscPaise + laundryTaxPaise

    // ── AC totals ─────────────────────────────────────────────────────────
    let acTotalPaise = 0

    for (const job of acJobs) {
      const base     = job.ratePaise * job.qty
      const disc     = Math.round(base * job.discPct / 100)
      const taxable  = base - disc
      const gstAmt   = Math.round(taxable * job.gstPct / 100)
      acTotalPaise  += taxable + gstAmt

      const key = String(job.gstPct)
      if (!gstSummary[key]) gstSummary[key] = { taxablePaise: 0, taxPaise: 0 }
      gstSummary[key].taxablePaise += taxable
      gstSummary[key].taxPaise     += gstAmt
    }

    // ── Expense totals by dept ────────────────────────────────────────────
    const expByDept = { Laundry: 0, AC: 0, Common: 0 }
    for (const e of expenses) {
      const dept = e.dept ?? 'Common'
      expByDept[dept] = (expByDept[dept] ?? 0) + e.amountPaise
    }
    const totalExpPaise = Object.values(expByDept).reduce((a, b) => a + b, 0)

    // Common expenses split 50/50 between depts
    const commonHalf = Math.round((expByDept.Common ?? 0) / 2)
    const laundryExpPaise = (expByDept.Laundry ?? 0) + commonHalf
    const acExpPaise      = (expByDept.AC      ?? 0) + commonHalf

    return paiseToRupees({
      month,
      laundry: {
        incomePaise:  laundryTotalPaise,
        expensePaise: laundryExpPaise,
        profitPaise:  laundryTotalPaise - laundryExpPaise,
        orderCount:   orders.length,
      },
      ac: {
        incomePaise:  acTotalPaise,
        expensePaise: acExpPaise,
        profitPaise:  acTotalPaise - acExpPaise,
        jobCount:     acJobs.length,
      },
      combined: {
        incomePaise:  laundryTotalPaise + acTotalPaise,
        expensePaise: totalExpPaise,
        profitPaise:  laundryTotalPaise + acTotalPaise - totalExpPaise,
      },
      gstBreakdown: Object.entries(gstSummary).map(([rate, v]) => ({
        rate:         Number(rate),
        taxablePaise: v.taxablePaise,
        taxPaise:     v.taxPaise,
        cgstPaise:    Math.round(v.taxPaise / 2),
        sgstPaise:    Math.round(v.taxPaise / 2),
      })),
    })
  })

  // ── Delivery schedule ─────────────────────────────────────────────────────
  fastify.get('/schedule', async (request, reply) => {
    const { date } = request.query

    if (!date) return reply.badRequest('date is required (YYYY-MM-DD)')

    const day     = new Date(date)
    const dayEnd  = new Date(date)
    dayEnd.setDate(dayEnd.getDate() + 1)

    const orders = await prisma.laundryOrder.findMany({
      where: {
        deliveryDate: { gte: day, lt: dayEnd },
        status:       { notIn: ['DELIVERED', 'CANCELLED'] },
      },
      include: {
        customer: { select: { id: true, name: true, phone: true, balancePaise: true } },
        orderLines: {
          include: {
            serviceItem: { include: { service: true } },
          },
        },
      },
      orderBy: { invNo: 'asc' },
    })

    return paiseToRupees(orders)
  })
}