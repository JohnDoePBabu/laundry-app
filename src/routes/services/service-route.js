// routes/services/index.js

import {
  listServicesSchema,
  createServiceSchema,
  updateServiceSchema,
  deleteServiceSchema,
} from './schema.js'

/**
 * GET  /api/services
 * POST /api/services
 * PUT  /api/services/:id
 * DEL  /api/services/:id
 */

export default async function servicesRoutes(fastify) {

  const { prisma } = fastify

  // ─────────────────────────────────────────────
  // GET /
  // ─────────────────────────────────────────────

  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: listServicesSchema,
    },
    async () => {

      return prisma.service.findMany({

        where: {
          active: true,
        },

        orderBy: {
          name: 'asc',
        },
      })
    }
  )

  // ─────────────────────────────────────────────
  // POST /
  // ─────────────────────────────────────────────

  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: createServiceSchema,
    },
    async (request, reply) => {

      const {
        name,
        gstPct = 0,
      } = request.body

      const service =
        await prisma.service.create({

          data: {

            name: name.trim(),

            gstPct: Number(gstPct),
          },
        })

      return reply
        .code(201)
        .send(service)
    }
  )

  // ─────────────────────────────────────────────
  // PUT /:id
  // ─────────────────────────────────────────────

  fastify.put(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: updateServiceSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const {
        name,
        gstPct,
        active,
      } = request.body

      const service =
        await prisma.service.findUnique({
          where: { id },
        })

      if (!service) {
        return reply.notFound('Service not found')
      }

      const updated =
        await prisma.service.update({

          where: { id },

          data: {

            ...(name !== undefined && {
              name: name.trim(),
            }),

            ...(gstPct !== undefined && {
              gstPct: Number(gstPct),
            }),

            ...(active !== undefined && {
              active: Boolean(active),
            }),
          },
        })

      return updated
    }
  )

  // ─────────────────────────────────────────────
  // DELETE /:id
  // ─────────────────────────────────────────────

  fastify.delete(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: deleteServiceSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const service =
        await prisma.service.findUnique({
          where: { id },
        })

      if (!service) {
        return reply.notFound('Service not found')
      }

      // Soft delete
      await prisma.service.update({

        where: { id },

        data: {
          active: false,
        },
      })

      return reply.code(204).send()
    }
  )
}
