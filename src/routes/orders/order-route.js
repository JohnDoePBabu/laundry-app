// routes/orders/index.js

import {
  peekInvoiceSchema,
  listOrdersSchema,
  getOrderSchema,
  createOrderSchema,
  updateOrderSchema,
  deleteOrderSchema,
  recordPaymentSchema,
} from './schema.js'

import { toPaise, paiseToRupees } from '../../lib/util/money.js'
import { nextInvoiceNumber, peekInvoiceNumber } from '../../service/invoice.js'

/**
 * GET  /api/orders
 * GET  /api/orders/invoice/peek
 * GET  /api/orders/:id
 * POST /api/orders
 * PUT  /api/orders/:id
 * DEL  /api/orders/:id
 * POST /api/orders/:id/payments
 */

export default async function ordersRoutes(fastify) {

  const { prisma } = fastify

  // ─────────────────────────────────────────────
  // GET /invoice/peek
  // ─────────────────────────────────────────────

  fastify.get(
    '/invoice/peek',
    {
      onRequest: [fastify.authenticate],
      schema: peekInvoiceSchema,
    },
    async () => {

      return {
        invNo: await peekInvoiceNumber('IF'),
      }
    }
  )

  // ─────────────────────────────────────────────
  // GET /
  // ─────────────────────────────────────────────

  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: listOrdersSchema,
    },
    async (request) => {

      const {
        status,
        customerId,
        from,
        to,
        paid,
      } = request.query

      const orders = await prisma.laundryOrder.findMany({

        where: {

          ...(status && {
            status,
          }),

          ...(customerId && {
            customerId,
          }),

          ...(paid !== undefined && {
            paid: paid === 'true',
          }),

          ...(from || to) && {
            orderDate: {

              ...(from && {
                gte: new Date(from),
              }),

              ...(to && {
                lte: new Date(to),
              }),
            },
          },
        },

        include: {

          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
              balancePaise: true,
            },
          },

          orderLines: {
            include: {
              serviceItem: {
                include: {

                  service: {
                    select: {
                      id: true,
                      name: true,
                      gstPct: true,
                    },
                  },

                  item: {
                    select: {
                      id: true,
                      name: true,
                      unit: true,
                    },
                  },
                },
              },
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      })

      return paiseToRupees(orders)
    }
  )

  // ─────────────────────────────────────────────
  // GET /:id
  // ─────────────────────────────────────────────

  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: getOrderSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const order = await prisma.laundryOrder.findUnique({

        where: { id },

        include: {

          customer: true,

          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },

          orderLines: {
            include: {
              serviceItem: {
                include: {
                  service: true,
                  item: true,
                },
              },
            },
          },

          payments: true,
        },
      })

      if (!order) {
        return reply.notFound('Order not found')
      }

      return paiseToRupees(order)
    }
  )

  // ─────────────────────────────────────────────
  // POST /
  // ─────────────────────────────────────────────

  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: createOrderSchema,
    },
    async (request, reply) => {

      const {
        customerId,
        orderDate,
        deliveryDate,
        status = 'RECEIVED',
        discPct = 0,
        discAmtRupees = 0,
        notes,
        lines = [],
        customInvNo,
      } = request.body

      // Server owns invoice numbering
      const invNo =
        customInvNo?.trim() ||
        await nextInvoiceNumber('IF')

      const order = await prisma.laundryOrder.create({

        data: {

          invNo,

          customerId,

          createdById: request.user.id,

          orderDate: new Date(orderDate),

          deliveryDate: deliveryDate
            ? new Date(deliveryDate)
            : null,

          status,

          discPct: Number(discPct),

          discAmtPaise: toPaise(discAmtRupees),

          notes: notes?.trim() ?? null,

          orderLines: {

            create: lines.map((line) => ({

              serviceItemId: line.serviceItemId,

              qty: Number(line.qty),

              ratePaise: toPaise(line.rateRupees),
            })),
          },
        },

        include: {

          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },

          orderLines: {
            include: {
              serviceItem: {
                include: {
                  service: true,
                  item: true,
                },
              },
            },
          },
        },
      })

      return reply
        .code(201)
        .send(paiseToRupees(order))
    }
  )

  // ─────────────────────────────────────────────
  // PUT /:id
  // ─────────────────────────────────────────────

  fastify.put(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: updateOrderSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const {
        status,
        deliveryDate,
        discPct,
        discAmtRupees,
        notes,
        lines,
      } = request.body

      const existing = await prisma.laundryOrder.findUnique({
        where: { id },
      })

      if (!existing) {
        return reply.notFound('Order not found')
      }

      const updated = await prisma.$transaction(async (tx) => {

        // Replace all lines
        if (lines) {

          await tx.orderLine.deleteMany({
            where: {
              orderId: id,
            },
          })
        }

        return tx.laundryOrder.update({

          where: { id },

          data: {

            ...(status !== undefined && {
              status,
            }),

            ...(deliveryDate !== undefined && {
              deliveryDate: deliveryDate
                ? new Date(deliveryDate)
                : null,
            }),

            ...(discPct !== undefined && {
              discPct: Number(discPct),
            }),

            ...(discAmtRupees !== undefined && {
              discAmtPaise: toPaise(discAmtRupees),
            }),

            ...(notes !== undefined && {
              notes: notes?.trim() ?? null,
            }),

            ...(lines && {

              orderLines: {

                create: lines.map((line) => ({

                  serviceItemId: line.serviceItemId,

                  qty: Number(line.qty),

                  ratePaise: toPaise(line.rateRupees),
                })),
              },
            }),
          },

          include: {

            orderLines: {
              include: {
                serviceItem: {
                  include: {
                    service: true,
                    item: true,
                  },
                },
              },
            },
          },
        })
      })

      return paiseToRupees(updated)
    }
  )

  // ─────────────────────────────────────────────
  // DELETE /:id
  // ─────────────────────────────────────────────

  fastify.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: deleteOrderSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const {
        mode = 'cancel',
      } = request.query

      const order = await prisma.laundryOrder.findUnique({
        where: { id },
      })

      if (!order) {
        return reply.notFound('Order not found')
      }

      // Hard delete
      if (mode === 'delete') {

        await prisma.$transaction(async (tx) => {

          await tx.payment.deleteMany({
            where: {
              orderId: order.id,
            },
          })

          await tx.orderLine.deleteMany({
            where: {
              orderId: order.id,
            },
          })

          await tx.laundryOrder.delete({
            where: {
              id: order.id,
            },
          })

          // Reverse advance payment
          if (order.paidAmountPaise > 0) {

            await tx.customer.update({

              where: {
                id: order.customerId,
              },

              data: {
                balancePaise: {
                  decrement: order.paidAmountPaise,
                },
              },
            })

            await tx.balanceTransaction.create({

              data: {

                customerId: order.customerId,

                deltaPaise: -order.paidAmountPaise,

                reason: `Refund — order ${order.invNo} deleted`,

                referenceId: order.id,

                referenceType: 'LaundryOrder',
              },
            })
          }
        })

      } else {

        // Soft cancel
        await prisma.laundryOrder.update({

          where: {
            id: order.id,
          },

          data: {
            status: 'CANCELLED',
          },
        })
      }

      return reply.code(204).send()
    }
  )

  // ─────────────────────────────────────────────
  // POST /:id/payments
  // ─────────────────────────────────────────────

  fastify.post(
    '/:id/payments',
    {
      onRequest: [fastify.authenticate],
      schema: recordPaymentSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const {
        amountRupees,
        applyAdvance,
        mode,
        paidAt,
      } = request.body
      const recordedById = request.user.id

      const order = await prisma.laundryOrder.findUnique({

        where: { id },

        include: {
          customer: true,
        },
      })

      if (!order) {
        return reply.notFound('Order not found')
      }

      if (order.paid) {
        return reply.badRequest('Order is already fully paid')
      }

      // ─────────────────────────────────────────
      // Calculate totals server-side
      // ─────────────────────────────────────────

      const lines = await prisma.orderLine.findMany({

        where: {
          orderId: order.id,
        },

        include: {
          serviceItem: {
            include: {
              service: true,
            },
          },
        },
      })

      let subPaise  = 0
      let taxExact  = 0  // accumulate as float, no per-line rounding

      for (const line of lines) {
        const base = line.ratePaise * line.qty
        const gst  = line.serviceItem.service.gstPct
        subPaise  += base
        taxExact  += base * gst / 100
      }

      const discAmt =
        order.discPct > 0
          ? Math.round(subPaise * order.discPct / 100)
          : order.discAmtPaise

      const taxable = subPaise - discAmt

      // GST on discounted subtotal (proportional scaling — matches frontend)
      const taxOnTaxable =
        subPaise > 0 ? taxExact * (taxable / subPaise) : 0

      const totalPaise = Math.round(taxable + taxOnTaxable)

      const alreadyPaidPaise =
        order.paidAmountPaise

      const custBalancePaise =
        order.customer.balancePaise

      const advanceAvailPaise =
        custBalancePaise < 0
          ? -custBalancePaise
          : 0

      const advanceUsedPaise =
        applyAdvance
          ? Math.min(
              advanceAvailPaise,
              totalPaise - alreadyPaidPaise
            )
          : 0

      const cashPaisePaid =
        toPaise(amountRupees ?? 0)

      const totalCoveredPaise =
        cashPaisePaid + advanceUsedPaise

      const remainingPaise =
        totalPaise - alreadyPaidPaise

      const isPaidFull =
        totalCoveredPaise >= remainingPaise

      const balanceDeltaPaise =
        advanceUsedPaise -
        (totalCoveredPaise - remainingPaise)

      // ─────────────────────────────────────────
      // Atomic writes
      // ─────────────────────────────────────────

      const result = await prisma.$transaction(async (tx) => {

        // 1. Payment row
        const payment = await tx.payment.create({

          data: {

            orderId: order.id,

            amountPaise: cashPaisePaid,

            mode,

            recordedById,

            paidAt: paidAt
              ? new Date(paidAt)
              : new Date(),
          },
        })

        // 2. Update order
        const newPaidAmount =
          alreadyPaidPaise + totalCoveredPaise

        await tx.laundryOrder.update({

          where: {
            id: order.id,
          },

          data: {

            paid: isPaidFull,

            paidAmountPaise: Math.min(
              newPaidAmount,
              totalPaise
            ),
          },
        })

        // 3. Adjust customer balance
        await tx.customer.update({

          where: {
            id: order.customerId,
          },

          data: {
            balancePaise: {
              increment: -balanceDeltaPaise,
            },
          },
        })

        // 4. Audit trail
        await tx.balanceTransaction.create({

          data: {

            customerId: order.customerId,

            deltaPaise: -balanceDeltaPaise,

            reason: `Payment for order ${order.invNo}`,

            referenceId: order.id,

            referenceType: 'LaundryOrder',
          },
        })

        return payment
      })

      return reply.code(201).send({

        payment: paiseToRupees(result),

        isPaidFull,

        newOrderTotal: toRupees(totalPaise),
      })
    }
  )
}

// ─────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────

function toRupees(paise) {
  return paise / 100
}
