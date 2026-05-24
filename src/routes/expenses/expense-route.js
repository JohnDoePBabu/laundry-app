// routes/expenses/index.js

import {
  listExpensesSchema,
  createExpenseSchema,
  updateExpenseSchema,
  deleteExpenseSchema,
} from './schema.js'

import {
  toPaise,
  paiseToRupees,
} from '../../lib/util/money.js'

/**
 * GET  /api/expenses
 * POST /api/expenses
 * PUT  /api/expenses/:id
 * DEL  /api/expenses/:id
 */

export default async function expensesRoutes(fastify) {

  const { prisma } = fastify

  // ─────────────────────────────────────────────
  // GET /
  // ─────────────────────────────────────────────

  fastify.get(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: listExpensesSchema,
    },
    async (request) => {

      const {
        month,
        dept,
      } = request.query

      let dateFilter = {}

      // month format: YYYY-MM
      if (month) {

        const [year, mon] =
          month.split('-').map(Number)

        dateFilter = {

          expenseDate: {

            gte: new Date(year, mon - 1, 1),

            lt: new Date(year, mon, 1),
          },
        }
      }

      const expenses = await prisma.expense.findMany({

        where: {

          ...dateFilter,

          ...(dept && {
            dept,
          }),
        },

        include: {

          recordedBy: {
            select: {
              id: true,
              name: true,
            },
          },
        },

        orderBy: {
          expenseDate: 'desc',
        },
      })

      return paiseToRupees(expenses)
    }
  )

  // ─────────────────────────────────────────────
  // POST /
  // ─────────────────────────────────────────────

  fastify.post(
    '/',
    {
      onRequest: [fastify.authenticate],
      schema: createExpenseSchema,
    },
    async (request, reply) => {

      const {
        expenseDate,
        category,
        dept,
        description,
        amountRupees,
        payMode,
        recordedById,
      } = request.body

      const expense = await prisma.expense.create({

        data: {

          expenseDate: new Date(expenseDate),

          category: category.trim(),

          dept: dept?.trim() ?? null,

          description:
            description?.trim() ?? null,

          amountPaise:
            toPaise(amountRupees),

          payMode,

          recordedById,
        },
      })

      return reply
        .code(201)
        .send(
          paiseToRupees(expense)
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
      schema: updateExpenseSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const {
        expenseDate,
        category,
        dept,
        description,
        amountRupees,
        payMode,
      } = request.body

      const existing =
        await prisma.expense.findUnique({
          where: { id },
        })

      if (!existing) {
        return reply.notFound('Expense not found')
      }

      const updated =
        await prisma.expense.update({

          where: { id },

          data: {

            ...(expenseDate !== undefined && {
              expenseDate:
                new Date(expenseDate),
            }),

            ...(category !== undefined && {
              category:
                category.trim(),
            }),

            ...(dept !== undefined && {
              dept:
                dept?.trim() ?? null,
            }),

            ...(description !== undefined && {
              description:
                description?.trim() ?? null,
            }),

            ...(amountRupees !== undefined && {
              amountPaise:
                toPaise(amountRupees),
            }),

            ...(payMode !== undefined && {
              payMode,
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
      schema: deleteExpenseSchema,
    },
    async (request, reply) => {

      const { id } = request.params

      const existing =
        await prisma.expense.findUnique({
          where: { id },
        })

      if (!existing) {
        return reply.notFound('Expense not found')
      }

      await prisma.expense.delete({
        where: { id },
      })

      return reply.code(204).send()
    }
  )
}
