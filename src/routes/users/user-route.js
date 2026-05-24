import { FastifyPluginAsync } from 'fastify'
import bcrypt from 'bcrypt'

const users = async (fastify) => {

  // GET /users  — admin only
  fastify.get('/', {
    onRequest: [fastify.authenticate],
  }, async (request, reply) => {
    const user = request.user;
    if (user.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' })

    return fastify.prisma.user.findMany({
      where: { active: true },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })
  })


  // POST /users  — admin only, creates staff accounts
  fastify.post('/', {
    onRequest: [fastify.authenticate],
    schema: {
      body: {
        type: 'object',
        required: ['name', 'email', 'password'],
        properties: {
          name:     { type: 'string', minLength: 1, maxLength: 100 },
          email:    { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8 },
          role:     { type: 'string', enum: ['admin', 'staff'], default: 'staff' },
        },
      },
    },
  }, async (request, reply) => {
    const caller = request.user;
    if (caller.role !== 'admin') return reply.code(403).send({ error: 'Forbidden' })

    const { name, email, password, role } = request.body;
    const passwordHash = await bcrypt.hash(password, 12)

    const user = await fastify.prisma.user.create({
      data: { name, email, passwordHash, role: role ?? 'staff', active: true },
      select: { id: true, name: true, email: true, role: true, createdAt: true },
    })

    return reply.code(201).send(user)
  })

}

export default users