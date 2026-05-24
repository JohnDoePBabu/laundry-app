import fp from 'fastify-plugin'
import jwt from '@fastify/jwt'
import cookie from '@fastify/cookie'

export default fp(async function authPlugin(fastify) {
  await fastify.register(cookie)

  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET, // min 32 chars, store in .env
    cookie: {
      cookieName: 'token',
      signed: false,
    },
  })

  // Decorator: call fastify.authenticate in any route to protect it
  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.code(401).send({ error: 'Unauthorized' })
    }
  })
})