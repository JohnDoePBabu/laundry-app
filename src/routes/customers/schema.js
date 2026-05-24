
// routes/customers/schemas.js

export const customerEntity = {
  type: 'object',

  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },

    name: {
      type: 'string',
    },

    phone: {
      type: 'string',
    },

    notes: {
      type: ['string', 'null'],
    },

    balancePaise: {
      type: 'integer',
    },

    balanceRupees: {
      type: 'number',
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
// GET /customers
// ─────────────────────────────────────────────

export const listCustomersSchema = {
  tags: ['Customers'],
  summary: 'List customers',

  response: {
    200: {
      type: 'array',
      items: customerEntity,
    },
  },
}

// ─────────────────────────────────────────────
// POST /customers
// ─────────────────────────────────────────────

export const createCustomerSchema = {
  tags: ['Customers'],
  summary: 'Create customer',

  body: {
    type: 'object',

    additionalProperties: false,

    required: ['name', 'phone'],

    properties: {

      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
      },

      phone: {
        type: 'string',
        minLength: 10,
        maxLength: 20,
      },

      notes: {
        type: 'string',
        maxLength: 1000,
      },
    },
  },

  response: {
    201: customerEntity,
  },
}

// ─────────────────────────────────────────────
// PUT /customers/:id
// ─────────────────────────────────────────────

export const updateCustomerSchema = {
  tags: ['Customers'],
  summary: 'Update customer',

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

      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
      },

      phone: {
        type: 'string',
        minLength: 10,
        maxLength: 20,
      },

      notes: {
        type: ['string', 'null'],
        maxLength: 1000,
      },
    },
  },

  response: {
    200: customerEntity,
  },
}

// ─────────────────────────────────────────────
// DELETE /customers/:id
// ─────────────────────────────────────────────

export const deleteCustomerSchema = {
  tags: ['Customers'],
  summary: 'Delete customer',

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

// ─────────────────────────────────────────────
// POST /customers/:id/balance
// ─────────────────────────────────────────────

export const adjustBalanceSchema = {
  tags: ['Customers'],
  summary: 'Adjust customer balance',

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

    required: ['reason'],

    properties: {

      deltaPaise: {
        type: 'integer',
      },

      deltaRupees: {
        type: 'number',
      },

      reason: {
        type: 'string',
        minLength: 1,
        maxLength: 255,
      },

      referenceId: {
        type: ['string', 'null'],
      },

      referenceType: {
        type: ['string', 'null'],
      },
    },

    anyOf: [
      { required: ['deltaPaise'] },
      { required: ['deltaRupees'] },
    ],
  },

  response: {
    200: customerEntity,
  },
}
