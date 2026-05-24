// routes/orders/schemas.js

// ─────────────────────────────────────────────
// Shared entities
// ─────────────────────────────────────────────

export const orderLineEntity = {
  type: 'object',

  properties: {
    id: {
      type: 'string',
      format: 'uuid',
    },

    qty: {
      type: 'integer',
    },

    ratePaise: {
      type: 'integer',
    },

    rateRupees: {
      type: 'number',
    },

    serviceItem: {
      type: 'object',

      properties: {

        id: {
          type: 'string',
          format: 'uuid',
        },

        service: {
          type: 'object',

          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            gstPct: { type: 'number' },
          },
        },

        item: {
          type: 'object',

          properties: {
            id: { type: 'string', format: 'uuid' },
            name: { type: 'string' },
            unit: { type: 'string' },
          },
        },
      },
    },
  },
}

export const orderEntity = {
  type: 'object',

  properties: {

    id: {
      type: 'string',
      format: 'uuid',
    },

    invNo: {
      type: 'string',
    },

    status: {
      type: 'string',
    },

    paid: {
      type: 'boolean',
    },

    orderDate: {
      type: 'string',
      format: 'date-time',
    },

    deliveryDate: {
      type: ['string', 'null'],
      format: 'date-time',
    },

    discPct: {
      type: 'number',
    },

    discAmtPaise: {
      type: 'integer',
    },

    discAmtRupees: {
      type: 'number',
    },

    paidAmountPaise: {
      type: 'integer',
    },

    paidAmountRupees: {
      type: 'number',
    },

    notes: {
      type: ['string', 'null'],
    },

    customer: {
      type: 'object',

      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        phone: { type: 'string' },
      },
    },

    orderLines: {
      type: 'array',
      items: orderLineEntity,
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
// Shared line input
// ─────────────────────────────────────────────

export const orderLineInput = {
  type: 'object',

  additionalProperties: false,

  required: ['serviceItemId', 'qty', 'rateRupees'],

  properties: {

    serviceItemId: {
      type: 'string',
      format: 'uuid',
    },

    qty: {
      type: 'integer',
      minimum: 1,
    },

    rateRupees: {
      type: 'number',
      minimum: 0,
    },
  },
}

// ─────────────────────────────────────────────
// GET /orders
// ─────────────────────────────────────────────

export const listOrdersSchema = {
  tags: ['Orders'],
  summary: 'List orders',

  querystring: {
    type: 'object',

    additionalProperties: false,

    properties: {

      status: {
        type: 'string',
      },

      customerId: {
        type: 'string',
        format: 'uuid',
      },

      from: {
        type: 'string',
        format: 'date',
      },

      to: {
        type: 'string',
        format: 'date',
      },

      paid: {
        type: 'string',
        enum: ['true', 'false'],
      },
    },
  },

  response: {
    200: {
      type: 'array',
      items: orderEntity,
    },
  },
}

// ─────────────────────────────────────────────
// GET /orders/:id
// ─────────────────────────────────────────────

export const getOrderSchema = {
  tags: ['Orders'],
  summary: 'Get order',

  params: {
    type: 'object',

    required: ['id'],

    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
    },
  },

  response: {
    200: orderEntity,
  },
}

// ─────────────────────────────────────────────
// POST /orders
// ─────────────────────────────────────────────

export const createOrderSchema = {
  tags: ['Orders'],
  summary: 'Create order',

  body: {
    type: 'object',

    additionalProperties: false,

    required: [
      'customerId',
      'createdById',
      'orderDate',
      'lines',
    ],

    properties: {

      customerId: {
        type: 'string',
        format: 'uuid',
      },

      createdById: {
        type: 'string',
        format: 'uuid',
      },

      orderDate: {
        type: 'string',
        format: 'date-time',
      },

      deliveryDate: {
        type: ['string', 'null'],
        format: 'date-time',
      },

      status: {
        type: 'string',
      },

      discPct: {
        type: 'number',
        minimum: 0,
      },

      discAmtRupees: {
        type: 'number',
        minimum: 0,
      },

      notes: {
        type: 'string',
        maxLength: 1000,
      },

      customInvNo: {
        type: 'string',
      },

      lines: {
        type: 'array',
        minItems: 1,
        items: orderLineInput,
      },
    },
  },

  response: {
    201: orderEntity,
  },
}

// ─────────────────────────────────────────────
// PUT /orders/:id
// ─────────────────────────────────────────────

export const updateOrderSchema = {
  tags: ['Orders'],
  summary: 'Update order',

  params: {
    type: 'object',

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

      status: {
        type: 'string',
      },

      deliveryDate: {
        type: ['string', 'null'],
        format: 'date-time',
      },

      discPct: {
        type: 'number',
      },

      discAmtRupees: {
        type: 'number',
      },

      notes: {
        type: ['string', 'null'],
      },

      lines: {
        type: 'array',
        items: orderLineInput,
      },
    },
  },

  response: {
    200: orderEntity,
  },
}

// ─────────────────────────────────────────────
// DELETE /orders/:id
// ─────────────────────────────────────────────

export const deleteOrderSchema = {
  tags: ['Orders'],
  summary: 'Delete or cancel order',

  params: {
    type: 'object',

    required: ['id'],

    properties: {
      id: {
        type: 'string',
        format: 'uuid',
      },
    },
  },

  querystring: {
    type: 'object',

    additionalProperties: false,

    properties: {
      mode: {
        type: 'string',
        enum: ['cancel', 'delete'],
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
// POST /orders/:id/payments
// ─────────────────────────────────────────────

export const recordPaymentSchema = {
  tags: ['Orders'],
  summary: 'Record payment',

  params: {
    type: 'object',

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

    required: ['mode', 'recordedById'],

    properties: {

      amountRupees: {
        type: 'number',
        minimum: 0,
      },

      applyAdvance: {
        type: 'boolean',
      },

      mode: {
        type: 'string',
      },

      recordedById: {
        type: 'string',
        format: 'uuid',
      },

      paidAt: {
        type: 'string',
        format: 'date-time',
      },
    },
  },

  response: {
    201: {
      type: 'object',

      properties: {

        payment: {
          type: 'object',
        },

        isPaidFull: {
          type: 'boolean',
        },

        newOrderTotal: {
          type: 'number',
        },
      },
    },
  },
}

// ─────────────────────────────────────────────
// GET /orders/invoice/peek
// ─────────────────────────────────────────────

export const peekInvoiceSchema = {
  tags: ['Orders'],
  summary: 'Preview next invoice number',

  response: {
    200: {
      type: 'object',

      properties: {
        invNo: {
          type: 'string',
        },
      },
    },
  },
}

