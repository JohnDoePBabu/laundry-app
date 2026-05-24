import fp from 'fastify-plugin'
import prisma from '../lib/prisma.js'
 
/**
 * Attaches the Prisma client to the Fastify instance so every route
 * handler can access it via  request.server.prisma  or  fastify.prisma.
 *
 * Using fastify-plugin (fp) prevents Fastify from scoping this
 * decoration to a single plugin — it becomes available app-wide.
 */
async function prismaPlugin(fastify) {
  fastify.decorate('prisma', prisma)
 
  // Gracefully disconnect from Postgres when the server shuts down.
  fastify.addHook('onClose', async () => {
    await prisma.$disconnect()
  })
}
 
export default fp(prismaPlugin, {
  name: 'prisma',
})
 