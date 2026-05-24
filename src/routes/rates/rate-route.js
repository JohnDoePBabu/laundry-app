// routes/rates/index.js

import {
  listRatesSchema,
  createRateSchema,
  updateRateSchema,
  deleteRateSchema,
} from './schema.js'

import {
  toPaise,
  paiseToRupees,
} from '../../lib/util/money.js'

/**
 * GET  /api/rates
 * POST /api/rates
 * PUT  /api/rates/:id
 * DEL  /api/rates/:id
 */

export default async function ratesRoutes(fastify) {

  const { prisma } = fastify

  // ─────────────────────────────────────────────
  // GET /
  // ─────────────────────────────────────────────

  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: listRatesSchema,
    },
    async (request) => {

      const { serviceId } = request.query

      const rates = await prisma.serviceItem.findMany({

        where: {

          active: true,

          ...(serviceId && {
            serviceId,
          }),
        },

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

        orderBy: [
          {
            service: {
              name: 'asc',
            },
          },
          {
            item: {
              name: 'asc',
            },
          },
        ],
      })

      return paiseToRupees(rates)
    }
  )

  // ─────────────────────────────────────────────
  // POST /
  // ─────────────────────────────────────────────

  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: createRateSchema,
    },
    async (request, reply) => {

      const body = request.body

      // Single or bulk
      const entries =
        Array.isArray(body)
          ? body
          : [body]

      const results = await Promise.all(

        entries.map((entry) => {

          const {
            serviceId,
            itemId,
            rateRupees,
          } = entry

          return prisma.serviceItem.upsert({

            where: {
              serviceId_itemId: {
                serviceId,
                itemId,
              },
            },

            update: {
              ratePaise: toPaise(rateRupees),
              active: true,
            },

            create: {
              serviceId,
              itemId,
              ratePaise: toPaise(rateRupees),
            },
          })
        })
      )

      return reply
        .code(201)
        .send(
          paiseToRupees(
            Array.isArray(body)
              ? results
              : results[0]
          )
        )
    }
  )

  // ─────────────────────────────────────────────
  // PUT /:id
  // ─────────────────────────────────────────────

  fastify.put(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: updateRateSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const {
        rateRupees,
        active,
      } = request.body

      const existing = await prisma.serviceItem.findUnique({
        where: { id },
      })

      if (!existing) {
        return reply.notFound('Rate entry not found')
      }

      const updated = await prisma.serviceItem.update({

        where: { id },

        data: {

          ...(rateRupees !== undefined && {
            ratePaise: toPaise(rateRupees),
          }),

          ...(active !== undefined && {
            active: Boolean(active),
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
      schema: deleteRateSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const existing = await prisma.serviceItem.findUnique({
        where: { id },
      })

      if (!existing) {
        return reply.notFound('Rate entry not found')
      }

      await prisma.serviceItem.delete({
        where: { id },
      })

      return reply.code(204).send()
    }
  )
}
