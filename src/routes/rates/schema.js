// routes/rates/schemas.js

// ─────────────────────────────────────────────
// Shared entity
// ─────────────────────────────────────────────

export const rateEntity = {
  type: 'object',

  properties: {

    id: {
      type: 'string',
      format: 'uuid',
    },

    ratePaise: {
      type: 'integer',
    },

    rateRupees: {
      type: 'number',
    },

    active: {
      type: 'boolean',
    },

    service: {
      type: 'object',

      properties: {

        id: {
          type: 'string',
          format: 'uuid',
        },

        name: {
          type: 'string',
        },

        gstPct: {
          type: 'number',
        },
      },
    },

    item: {
      type: 'object',

      properties: {

        id: {
          type: 'string',
          format: 'uuid',
        },

        name: {
          type: 'string',
        },

        unit: {
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
// Shared create/update input
// ─────────────────────────────────────────────

export const rateInput = {
  type: 'object',

  additionalProperties: false,

  required: [
    'serviceId',
    'itemId',
    'rateRupees',
  ],

  properties: {

    serviceId: {
      type: 'string',
      format: 'uuid',
    },

    itemId: {
      type: 'string',
      format: 'uuid',
    },

    rateRupees: {
      type: 'number',
      minimum: 0,
    },
  },
}

// ─────────────────────────────────────────────
// GET /rates
// ─────────────────────────────────────────────

export const listRatesSchema = {
  tags: ['Rates'],
  summary: 'List service-item rate matrix',

  querystring: {
    type: 'object',

    additionalProperties: false,

    properties: {

      serviceId: {
        type: 'string',
        format: 'uuid',
      },
    },
  },

  response: {
    200: {
      type: 'array',
      items: rateEntity,
    },
  },
}

// ─────────────────────────────────────────────
// POST /rates
// ─────────────────────────────────────────────

export const createRateSchema = {
  tags: ['Rates'],
  summary: 'Create or upsert rates',

  body: {
    oneOf: [

      // Single object
      rateInput,

      // Bulk array
      {
        type: 'array',

        minItems: 1,

        items: rateInput,
      },
    ],
  },

  response: {

    201: {

      oneOf: [

        rateEntity,

        {
          type: 'array',
          items: rateEntity,
        },
      ],
    },
  },
}

// ─────────────────────────────────────────────
// PUT /rates/:id
// ─────────────────────────────────────────────

export const updateRateSchema = {
  tags: ['Rates'],
  summary: 'Update rate entry',

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

      rateRupees: {
        type: 'number',
        minimum: 0,
      },

      active: {
        type: 'boolean',
      },
    },
  },

  response: {
    200: rateEntity,
  },
}

// ─────────────────────────────────────────────
// DELETE /rates/:id
// ─────────────────────────────────────────────

export const deleteRateSchema = {
  tags: ['Rates'],
  summary: 'Delete rate entry',

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

