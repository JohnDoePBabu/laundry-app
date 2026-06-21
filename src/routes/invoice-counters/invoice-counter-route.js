export default async function invoiceCounterRoutes(fastify) {
  const { prisma } = fastify

  // GET / — list both counters with their next invoice preview
  fastify.get('/', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['Invoice Counters'],
      summary: 'List invoice counters',
      response: {
        200: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              prefix:    { type: 'string' },
              value:     { type: 'integer' },
              nextInvNo: { type: 'string' },
              updatedAt: { type: 'string', format: 'date-time' },
            },
          },
        },
      },
    },
  }, async () => {
    const counters = await prisma.invoiceCounter.findMany({
      orderBy: { prefix: 'asc' },
    })

    const year = new Date().getFullYear()

    return counters.map((c) => ({
      ...c,
      value: Number(c.value),
      nextInvNo: `${c.prefix}/${year}/${String(Number(c.value) + 1).padStart(4, '0')}`,
    }))
  })

  // PUT /:prefix — set counter value
  fastify.put('/:prefix', {
    onRequest: [fastify.authenticate],
    schema: {
      tags: ['Invoice Counters'],
      summary: 'Update invoice counter',
      params: {
        type: 'object',
        required: ['prefix'],
        properties: {
          prefix: { type: 'string', enum: ['IF', 'AC'] },
        },
      },
      body: {
        type: 'object',
        additionalProperties: false,
        required: ['value'],
        properties: {
          value: { type: 'integer', minimum: 0 },
        },
      },
      response: {
        200: {
          type: 'object',
          properties: {
            prefix:    { type: 'string' },
            value:     { type: 'integer' },
            nextInvNo: { type: 'string' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const { prefix } = request.params
    const { value } = request.body

    const existing = await prisma.invoiceCounter.findUnique({ where: { prefix } })
    if (!existing) return reply.notFound(`No counter found for prefix "${prefix}"`)

    if (value <= Number(existing.value)) {
      return reply.badRequest(`Value must be greater than current counter (${Number(existing.value)})`)
    }

    const updated = await prisma.invoiceCounter.update({
      where: { prefix },
      data: { value },
    })

    const year = new Date().getFullYear()

    return {
      ...updated,
      value: Number(updated.value),
      nextInvNo: `${prefix}/${year}/${String(Number(updated.value) + 1).padStart(4, '0')}`,
    }
  })
}
