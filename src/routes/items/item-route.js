// routes/items/index.js

import {
  listItemsSchema,
  createItemSchema,
  updateItemSchema,
  deleteItemSchema,
} from './schema.js'

/**
 * GET  /api/items
 * POST /api/items
 * PUT  /api/items/:id
 * DEL  /api/items/:id
 */

export default async function itemsRoutes(fastify) {

  const { prisma } = fastify

  // ─────────────────────────────────────────────
  // GET /
  // ─────────────────────────────────────────────

  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: listItemsSchema,
    },
    async () => {

      return prisma.item.findMany({

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
      schema: createItemSchema,
    },
    async (request, reply) => {

      const {
        name,
        unit = 'pc',
      } = request.body

      const item = await prisma.item.create({

        data: {
          name: name.trim(),
          unit,
        },
      })

      return reply
        .code(201)
        .send(item)
    }
  )

  // ─────────────────────────────────────────────
  // PUT /:id
  // ─────────────────────────────────────────────

  fastify.put(
    '/:id',
    {
      onRequest: [fastify.authenticate],
      schema: updateItemSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const {
        name,
        unit,
        active,
      } = request.body

      const item = await prisma.item.findUnique({
        where: { id },
      })

      if (!item) {
        return reply.notFound('Item not found')
      }

      const updated = await prisma.item.update({

        where: { id },

        data: {

          ...(name !== undefined && {
            name: name.trim(),
          }),

          ...(unit !== undefined && {
            unit,
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
      schema: deleteItemSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const item = await prisma.item.findUnique({
        where: { id },
      })

      if (!item) {
        return reply.notFound('Item not found')
      }

      // Soft delete
      await prisma.item.update({

        where: { id },

        data: {
          active: false,
        },
      })

      return reply.code(204).send()
    }
  )
}
