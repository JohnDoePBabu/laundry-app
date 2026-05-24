// routes/items/schemas.js

// ─────────────────────────────────────────────
// Shared entity
// ─────────────────────────────────────────────

export const itemEntity = {
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
// GET /items
// ─────────────────────────────────────────────

export const listItemsSchema = {
  tags: ['Items'],
  summary: 'List active items',

  response: {
    200: {
      type: 'array',
      items: itemEntity,
    },
  },
}

// ─────────────────────────────────────────────
// POST /items
// ─────────────────────────────────────────────

export const createItemSchema = {
  tags: ['Items'],
  summary: 'Create item',

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

      unit: {
        type: 'string',
        maxLength: 20,
      },
    },
  },

  response: {
    201: itemEntity,
  },
}

// ─────────────────────────────────────────────
// PUT /items/:id
// ─────────────────────────────────────────────

export const updateItemSchema = {
  tags: ['Items'],
  summary: 'Update item',

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

      unit: {
        type: 'string',
        maxLength: 20,
      },

      active: {
        type: 'boolean',
      },
    },
  },

  response: {
    200: itemEntity,
  },
}

// ─────────────────────────────────────────────
// DELETE /items/:id
// ─────────────────────────────────────────────

export const deleteItemSchema = {
  tags: ['Items'],
  summary: 'Soft delete item',

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
