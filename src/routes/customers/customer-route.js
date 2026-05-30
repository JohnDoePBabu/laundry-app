// routes/customers/index.js

import {
  listCustomersSchema,
  createCustomerSchema,
  updateCustomerSchema,
  deleteCustomerSchema,
  adjustBalanceSchema,
} from './schema.js'
import { paiseToRupees, toPaise } from '../../lib/util/money.js'

export default async function customersRoutes(fastify) {

  const { prisma } = fastify

  // ─────────────────────────────────────────────
  // GET /
  // ─────────────────────────────────────────────

  fastify.get('/',
    {
       onRequest: [fastify.authenticate],
      schema: listCustomersSchema,
    },
    async () => {

      const customers = await prisma.customer.findMany({
        orderBy: { name: 'asc' },
      })

      return customers
    }
  )

  // ─────────────────────────────────────────────
  // POST /
  // ─────────────────────────────────────────────

  fastify.post('/',
    {
       onRequest: [fastify.authenticate],
      schema: createCustomerSchema,
    },
    async (request, reply) => {

      const { name, phone, notes } = request.body

      console.log('Creating customer:', { name, phone, notes });
      // Duplicate check
      const existing = await prisma.customer.findFirst({
        where: {
          OR: [
            { phone: phone.trim() },
            {
              name: {
                equals: name.trim(),
                mode: 'insensitive',
              },
            },
          ],
        },
      })

      if (existing) {
        return reply.conflict(
          `A customer already exists with this name or phone: "${existing.name}" (${existing.phone})`
        )
      }

      const customer = await prisma.customer.create({
        data: {
          name:  name.trim(),
          phone: phone.trim(),
          notes: notes?.trim() ?? null,
        },
      })
      console.log("customer created");
      return reply
        .code(201)
        .send(customer)
    }
  )

  // ─────────────────────────────────────────────
  // PUT /:id
  // ─────────────────────────────────────────────

  fastify.put('/:id',
    {
       onRequest: [fastify.authenticate],
      schema: updateCustomerSchema,
    },
    async (request, reply) => {

      const { id } = request.params
      const { name, phone, notes } = request.body

      const customer = await prisma.customer.findUnique({
        where: { id },
      })

      if (!customer) {
        return reply.notFound('Customer not found')
      }

      // Prevent duplicate phone
      if (phone && phone.trim() !== customer.phone) {

        const conflict = await prisma.customer.findUnique({
          where: { phone: phone.trim() },
        })

        if (conflict) {
          return reply.conflict(
            `Phone ${phone} is already used by "${conflict.name}"`
          )
        }
      }

      const updated = await prisma.customer.update({
        where: { id },

        data: {
          ...(name !== undefined && {
            name: name.trim(),
          }),

          ...(phone !== undefined && {
            phone: phone.trim(),
          }),

          ...(notes !== undefined && {
            notes: notes?.trim() ?? null,
          }),
        },
      })

      return paiseToRupees(updated)
    }
  )

  // ─────────────────────────────────────────────
  // DELETE /:id
  // ─────────────────────────────────────────────

  fastify.delete('/:id',
    {
       onRequest: [fastify.authenticate],
      schema: deleteCustomerSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const customer = await prisma.customer.findUnique({
        where: { id },

        include: {
          orders: { select: { id: true }, take: 1 },
          acJobs: { select: { id: true }, take: 1 },
        },
      })

      if (!customer) {
        return reply.notFound('Customer not found')
      }

      if (customer.orders.length > 0 || customer.acJobs.length > 0) {
        return reply.badRequest(
          'Cannot delete: customer has existing orders or AC jobs. Delete those first.'
        )
      }

      await prisma.customer.delete({
        where: { id },
      })

      return reply.code(204).send()
    }
  )

  // ─────────────────────────────────────────────
  // POST /:id/balance
  // ─────────────────────────────────────────────

  fastify.post('/:id/balance',
    {
      onRequest: [fastify.authenticate],
      schema: adjustBalanceSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const {
        deltaPaise,
        deltaRupees,
        reason,
        referenceId,
        referenceType,
      } = request.body

      const delta = deltaPaise !== undefined
        ? Number(deltaPaise)
        : toPaise(deltaRupees)

      if (delta === 0) {
        return reply.badRequest('delta cannot be zero')
      }

      const customer = await prisma.customer.findUnique({
        where: { id },
      })

      if (!customer) {
        return reply.notFound('Customer not found')
      }

      // Atomic transaction
      const [updated] = await prisma.$transaction([

        prisma.customer.update({
          where: { id },

          data: {
            balancePaise: {
              increment: delta,
            },
          },
        }),

        prisma.balanceTransaction.create({
          data: {
            customerId: id,
            deltaPaise: delta,
            reason: reason.trim(),
            referenceId: referenceId ?? null,
            referenceType: referenceType ?? null,
          },
        }),

      ])

      return paiseToRupees(updated)
    }
  )
}
