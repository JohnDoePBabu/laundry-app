// routes/services/schemas.js

// ─────────────────────────────────────────────
// Shared entity
// ─────────────────────────────────────────────

export const serviceEntity = {
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

    active: {
      type: 'boolean',
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
// GET /services
// ─────────────────────────────────────────────

export const listServicesSchema = {
  tags: ['Services'],
  summary: 'List active services',

  response: {
    200: {
      type: 'array',
      items: serviceEntity,
    },
  },
}

// ─────────────────────────────────────────────
// POST /services
// ─────────────────────────────────────────────

export const createServiceSchema = {
  tags: ['Services'],
  summary: 'Create service',

  body: {
    type: 'object',

    additionalProperties: false,

    required: ['name'],

    properties: {

      name: {
        type: 'string',
        minLength: 1,
        maxLength: 100,
      },

      gstPct: {
        type: 'number',
        minimum: 0,
        maximum: 100,
      },
    },
  },

  response: {
    201: serviceEntity,
  },
}

// ─────────────────────────────────────────────
// PUT /services/:id
// ─────────────────────────────────────────────

export const updateServiceSchema = {
  tags: ['Services'],
  summary: 'Update service',

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

      gstPct: {
        type: 'number',
        minimum: 0,
        maximum: 100,
      },

      active: {
        type: 'boolean',
      },
    },
  },

  response: {
    200: serviceEntity,
  },
}

// ─────────────────────────────────────────────
// DELETE /services/:id
// ─────────────────────────────────────────────

export const deleteServiceSchema = {
  tags: ['Services'],
  summary: 'Soft delete service',

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
