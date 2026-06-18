// routes/ac-jobs/schemas.js

// ─────────────────────────────────────────────
// Shared entity
// ─────────────────────────────────────────────

export const acJobEntity = {
  type: 'object',

  properties: {

    id: {
      type: 'string',
      format: 'uuid',
    },

    invNo: {
      type: 'string',
    },

    customerId: {
      type: ['string', 'null'],
      format: 'uuid',
    },

    custName: {
      type: 'string',
    },

    custPhone: {
      type: 'string',
    },

    custAddress: {
      type: ['string', 'null'],
    },

    technician: {
      type: ['string', 'null'],
    },

    category: {
      type: ['string', 'null'],
    },

    status: {
      type: 'string',
    },

    qty: {
      type: 'number',
    },

    ratePaise: {
      type: 'integer',
    },

    rateRupees: {
      type: 'number',
    },

    discPct: {
      type: 'number',
    },

    gstPct: {
      type: 'number',
    },

    paid: {
      type: 'boolean',
    },

    jobDate: {
      type: 'string',
      format: 'date-time',
    },

    notes: {
      type: ['string', 'null'],
    },

    customer: {
      type: ['object', 'null'],

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
      },
    },

    createdBy: {
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
// GET /invoice/peek
// ─────────────────────────────────────────────

export const peekAcInvoiceSchema = {
  tags: ['AC Jobs'],
  summary: 'Preview next AC invoice number',

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

// ─────────────────────────────────────────────
// GET /ac-jobs
// ─────────────────────────────────────────────

export const listAcJobsSchema = {
  tags: ['AC Jobs'],
  summary: 'List AC jobs',

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
    },
  },

  response: {
    200: {
      type: 'array',
      items: acJobEntity,
    },
  },
}

// ─────────────────────────────────────────────
// GET /ac-jobs/:id
// ─────────────────────────────────────────────

export const getAcJobSchema = {
  tags: ['AC Jobs'],
  summary: 'Get AC job',

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
    200: acJobEntity,
  },
}

// ─────────────────────────────────────────────
// POST /ac-jobs
// ─────────────────────────────────────────────

export const createAcJobSchema = {
  tags: ['AC Jobs'],
  summary: 'Create AC job',

  body: {
    type: 'object',

    additionalProperties: false,

    required: [
      'jobDate',
      'rateRupees',
    ],

    properties: {

      customerId: {
        type: 'string',
        format: 'uuid',
      },

      custName: {
        type: 'string',
      },

      custPhone: {
        type: 'string',
      },

      custAddress: {
        type: 'string',
      },

      technician: {
        type: 'string',
      },

      category: {
        type: 'string',
      },

      status: {
        type: 'string',
      },

      qty: {
        type: 'number',
        minimum: 1,
      },

      rateRupees: {
        type: 'number',
        minimum: 0,
      },

      discPct: {
        type: 'number',
        minimum: 0,
        maximum: 100,
      },

      gstPct: {
        type: 'number',
        minimum: 0,
        maximum: 100,
      },

      jobDate: {
        type: 'string',
        format: 'date-time',
      },

      notes: {
        type: 'string',
      },

      customInvNo: {
        type: 'string',
      },
    },
  },

  response: {
    201: acJobEntity,
  },
}

// ─────────────────────────────────────────────
// PUT /ac-jobs/:id
// ─────────────────────────────────────────────

export const updateAcJobSchema = {
  tags: ['AC Jobs'],
  summary: 'Update AC job',

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

      status: {
        type: 'string',
      },

      technician: {
        type: ['string', 'null'],
      },

      category: {
        type: ['string', 'null'],
      },

      qty: {
        type: 'number',
        minimum: 1,
      },

      rateRupees: {
        type: 'number',
        minimum: 0,
      },

      discPct: {
        type: 'number',
        minimum: 0,
        maximum: 100,
      },

      gstPct: {
        type: 'number',
        minimum: 0,
        maximum: 100,
      },

      paid: {
        type: 'boolean',
      },

      notes: {
        type: ['string', 'null'],
      },

      custAddress: {
        type: ['string', 'null'],
      },
    },
  },

  response: {
    200: acJobEntity,
  },
}

// ─────────────────────────────────────────────
// DELETE /ac-jobs/:id
// ─────────────────────────────────────────────

export const deleteAcJobSchema = {
  tags: ['AC Jobs'],
  summary: 'Delete AC job',

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
