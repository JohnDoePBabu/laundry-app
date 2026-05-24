// routes/expenses/schemas.js

// ─────────────────────────────────────────────
// Shared entity
// ─────────────────────────────────────────────

export const expenseEntity = {
  type: 'object',

  properties: {

    id: {
      type: 'string',
      format: 'uuid',
    },

    expenseDate: {
      type: 'string',
      format: 'date-time',
    },

    category: {
      type: 'string',
    },

    dept: {
      type: ['string', 'null'],
    },

    description: {
      type: ['string', 'null'],
    },

    amountPaise: {
      type: 'integer',
    },

    amountRupees: {
      type: 'number',
    },

    payMode: {
      type: 'string',
    },

    recordedBy: {
      type: 'object',

      properties: {

        id: {
          type: 'string',
          format: 'uuid',
        },

        name: {
          type: 'string',
        },
      },
    },

    createdAt: {
      type: 'string',
      format: 'date-time',
    },

    updatedAt: {
      type: 'string',
      format: 'date-time',
    },
  },
}

// ─────────────────────────────────────────────
// GET /expenses
// ─────────────────────────────────────────────

export const listExpensesSchema = {
  tags: ['Expenses'],
  summary: 'List expenses',

  querystring: {
    type: 'object',

    additionalProperties: false,

    properties: {

      month: {
        type: 'string',
        pattern: '^\\d{4}-\\d{2}$',
      },

      dept: {
        type: 'string',
      },
    },
  },

  response: {
    200: {
      type: 'array',
      items: expenseEntity,
    },
  },
}

// ─────────────────────────────────────────────
// POST /expenses
// ─────────────────────────────────────────────

export const createExpenseSchema = {
  tags: ['Expenses'],
  summary: 'Create expense',

  body: {
    type: 'object',

    additionalProperties: false,

    required: [
      'expenseDate',
      'category',
      'amountRupees',
      'payMode',
      'recordedById',
    ],

    properties: {

      expenseDate: {
        type: 'string',
        format: 'date-time',
      },

      category: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
      },

      dept: {
        type: 'string',
        maxLength: 100,
      },

      description: {
        type: 'string',
        maxLength: 1000,
      },

      amountRupees: {
        type: 'number',
        minimum: 0,
      },

      payMode: {
        type: 'string',
      },

      recordedById: {
        type: 'string',
        format: 'uuid',
      },
    },
  },

  response: {
    201: expenseEntity,
  },
}

// ─────────────────────────────────────────────
// PUT /expenses/:id
// ─────────────────────────────────────────────

export const updateExpenseSchema = {
  tags: ['Expenses'],
  summary: 'Update expense',

  params: {
    type: 'object',

    additionalProperties: false,

    required: ['id'],

    properties: {

      id: {
        type: 'string',
        format: 'uuid',
      },
    },
  },

  body: {
    type: 'object',

    additionalProperties: false,

    properties: {

      expenseDate: {
        type: 'string',
        format: 'date-time',
      },

      category: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
      },

      dept: {
        type: ['string', 'null'],
        maxLength: 100,
      },

      description: {
        type: ['string', 'null'],
        maxLength: 1000,
      },

      amountRupees: {
        type: 'number',
        minimum: 0,
      },

      payMode: {
        type: 'string',
      },
    },
  },

  response: {
    200: expenseEntity,
  },
}

// ─────────────────────────────────────────────
// DELETE /expenses/:id
// ─────────────────────────────────────────────

export const deleteExpenseSchema = {
  tags: ['Expenses'],
  summary: 'Delete expense',

  params: {
    type: 'object',

    additionalProperties: false,

    required: ['id'],

    properties: {

      id: {
        type: 'string',
        format: 'uuid',
      },
    },
  },

  response: {
    204: {
      type: 'null',
    },
  },
}
