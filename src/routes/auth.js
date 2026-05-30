import bcrypt from 'bcrypt'

const auth = async (fastify) => {

  // POST /auth/login
  fastify.post('/login', {
    schema: {
      body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email:    { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 6 },
        },
      },
    },
  }, async (request, reply) => {
    const { email, password } = request.body;

    const user = await fastify.prisma.user.findUnique({ where: { email } })
    if (!user || !user.active) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return reply.code(401).send({ error: 'Invalid credentials' })
    }

    // Sign token — payload is what gets decoded on every request
    const token = fastify.jwt.sign(
      { id: user.id, name: user.name, role: user.role },
      { expiresIn: '7d' }
    )

    // Set as HttpOnly cookie (safer than localStorage — JS can't read it)
    reply.setCookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 60 * 60 * 2, // 2 hours in seconds
    })

    return { user: { id: user.id, name: user.name, role: user.role } }
  })


  // POST /auth/logout
  fastify.post('/logout', async (request, reply) => {
    reply.clearCookie('token', { path: '/' })
    return { ok: true }
  })


  // GET /auth/me  — protected
  fastify.get('/me', {
    onRequest: [fastify.authenticate],
  }, async (request) => {
    // request.user is set by jwtVerify() inside authenticate
    return { user: request.user }
  })

}

export default auth