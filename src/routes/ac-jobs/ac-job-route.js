// routes/ac-jobs/index.js

import {
  peekAcInvoiceSchema,
  listAcJobsSchema,
  getAcJobSchema,
  createAcJobSchema,
  updateAcJobSchema,
  deleteAcJobSchema,
} from './schema.js'

import {
  toPaise,
  paiseToRupees,
} from '../../lib/util/money.js'

import {
  nextInvoiceNumber,
  peekInvoiceNumber,
} from '../../service/invoice.js'

/**
 * GET  /api/ac-jobs/invoice/peek
 * GET  /api/ac-jobs
 * GET  /api/ac-jobs/:id
 * POST /api/ac-jobs
 * PUT  /api/ac-jobs/:id
 * DEL  /api/ac-jobs/:id
 */

export default async function acJobsRoutes(fastify) {

  const { prisma } = fastify

  // ─────────────────────────────────────────────
  // GET /invoice/peek
  // ─────────────────────────────────────────────

  fastify.get(
    '/invoice/peek',
    {
      onRequest: [fastify.authenticate],
      schema: peekAcInvoiceSchema,
    },
    async () => {

      return {
        invNo: await peekInvoiceNumber('AC'),
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
      schema: listAcJobsSchema,
    },
    async (request) => {

      const {
        status,
        customerId,
      } = request.query

      const jobs = await prisma.acJob.findMany({

        where: {

          ...(status && {
            status,
          }),

          ...(customerId && {
            customerId,
          }),
        },

        include: {

          customer: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },

          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          createdAt: 'desc',
        },
      })

      return paiseToRupees(

        jobs.map((job) => ({

          ...job,

          custName:
            job.customer?.name ??
            job.custName,

          custPhone:
            job.customer?.phone ??
            job.custPhone,
        }))
      )
    }
  )

  // ─────────────────────────────────────────────
  // GET /:id
  // ─────────────────────────────────────────────

  fastify.get(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: getAcJobSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const job = await prisma.acJob.findUnique({

        where: { id },

        include: {

          customer: true,

          createdBy: {
            select: {
              id: true,
              name: true,
            },
          },

          payments: true,
        },
      })

      if (!job) {
        return reply.notFound('AC job not found')
      }

      return paiseToRupees(job)
    }
  )

  // ─────────────────────────────────────────────
  // POST /
  // ─────────────────────────────────────────────

  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: createAcJobSchema,
    },
    async (request, reply) => {

      const {
        customerId,
        custName,
        custPhone,
        custAddress,
        technician,
        category,
        status = 'OPEN',
        qty = 1,
        rateRupees,
        discPct = 0,
        gstPct = 18,
        createdById,
        jobDate,
        notes,
        customInvNo,
      } = request.body

      let resolvedName = custName
      let resolvedPhone = custPhone

      // Resolve from customer table
      if (customerId) {

        const customer =
          await prisma.customer.findUnique({

            where: {
              id: customerId,
            },

            select: {
              name: true,
              phone: true,
            },
          })

        if (!customer) {
          return reply.notFound('Customer not found')
        }

        resolvedName = customer.name
        resolvedPhone = customer.phone
      }

      if (!resolvedName?.trim()) {

        return reply.badRequest(
          'custName is required (or provide customerId)'
        )
      }

      if (!resolvedPhone?.trim()) {

        return reply.badRequest(
          'custPhone is required (or provide customerId)'
        )
      }

      const invNo =
        customInvNo?.trim() ||
        await nextInvoiceNumber('AC')

      const job = await prisma.acJob.create({

        data: {

          invNo,

          customerId:
            customerId ?? null,

          custName:
            resolvedName.trim(),

          custPhone:
            resolvedPhone.trim(),

          custAddress:
            custAddress?.trim() ?? null,

          technician:
            technician?.trim() ?? null,

          category:
            category?.trim() ?? null,

          status,

          qty:
            Number(qty),

          ratePaise:
            toPaise(rateRupees),

          discPct:
            Number(discPct),

          gstPct:
            Number(gstPct),

          createdById,

          jobDate:
            new Date(jobDate),

          notes:
            notes?.trim() ?? null,
        },
      })

      return reply
        .code(201)
        .send(
          paiseToRupees(job)
        )
    }
  );

  fastify.post('/:id/payments', {
  onRequest: [fastify.authenticate],
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: { id: { type: 'string', format: 'uuid' } },
    },
    body: {
      type: 'object',
      required: ['mode', 'recordedById'],
      properties: {
        amountRupees:  { type: 'number', minimum: 0 },
        mode:          { type: 'string' },
        reference:     { type: 'string' },
        recordedById:  { type: 'string', format: 'uuid' },
        paidAt:        { type: 'string', format: 'date-time' },
      },
    },
  },
}, async (request, reply) => {
  const { id } = request.params
  const {
    amountRupees = 0,
    mode,
    reference,
    recordedById,
    paidAt,
  } = request.body

  const job = await fastify.prisma.acJob.findUnique({ where: { id } })
  if (!job) return reply.code(404).send({ error: 'AC job not found' })

  // Calculate total owed (same formula as calcAC in the UI)
  const base       = job.ratePaise * job.qty
  const discAmt    = Math.round(base * job.discPct / 100)
  const taxable    = base - discAmt
  const gstAmt     = Math.round(taxable * job.gstPct / 100)
  const totalPaise = taxable + gstAmt

  const cashPaise     = Math.round(amountRupees * 100)
  const newPaidAmount = Math.min(job.paidAmountPaise + cashPaise, totalPaise)
  const isPaidFull    = newPaidAmount >= totalPaise

  // Prisma transaction: payment record + job update happen together.
  // If either fails, both are rolled back — no orphaned records.
  const [payment, updatedJob] = await fastify.prisma.$transaction([
    fastify.prisma.payment.create({
      data: {
        acJobId:     id,
        amountPaise: cashPaise,
        mode,
        reference:   reference ?? null,
        paidAt:      paidAt ? new Date(paidAt) : new Date(),
        recordedById,
      },
    }),
    fastify.prisma.acJob.update({
      where: { id },
      data: {
        paidAmountPaise: newPaidAmount,
        paid:            isPaidFull,
      },
    }),
  ])

  return reply.code(201).send({
    payment,
    isPaidFull,
    newPaidAmountRupees: newPaidAmount / 100,
    totalRupees:         totalPaise / 100,
  })
});

  // ─────────────────────────────────────────────
  // PUT /:id
  // ─────────────────────────────────────────────

  fastify.put(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: updateAcJobSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const {
        status,
        technician,
        category,
        qty,
        rateRupees,
        discPct,
        gstPct,
        paid,
        notes,
        custAddress,
      } = request.body

      const existing =
        await prisma.acJob.findUnique({
          where: { id },
        })

      if (!existing) {
        return reply.notFound('AC job not found')
      }

      const updated =
        await prisma.acJob.update({

          where: { id },

          data: {

            ...(status !== undefined && {
              status,
            }),

            ...(technician !== undefined && {
              technician:
                technician?.trim() ?? null,
            }),

            ...(category !== undefined && {
              category:
                category?.trim() ?? null,
            }),

            ...(qty !== undefined && {
              qty:
                Number(qty),
            }),

            ...(rateRupees !== undefined && {
              ratePaise:
                toPaise(rateRupees),
            }),

            ...(discPct !== undefined && {
              discPct:
                Number(discPct),
            }),

            ...(gstPct !== undefined && {
              gstPct:
                Number(gstPct),
            }),

            ...(paid !== undefined && {
              paid:
                Boolean(paid),
            }),

            ...(notes !== undefined && {
              notes:
                notes?.trim() ?? null,
            }),

            ...(custAddress !== undefined && {
              custAddress:
                custAddress?.trim() ?? null,
            }),
          },
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
      schema: deleteAcJobSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const existing =
        await prisma.acJob.findUnique({
          where: { id },
        })

      if (!existing) {
        return reply.notFound('AC job not found')
      }

      await prisma.$transaction([

        prisma.payment.deleteMany({
          where: {
            acJobId: id,
          },
        }),

        prisma.acJob.delete({
          where: { id },
        }),
      ])

      return reply.code(204).send()
    }
  )
}
