// backend/server.js
import 'dotenv/config'
import Fastify from 'fastify';
import routes from './routes/index.js';
import swagger from '@fastify/swagger'
import swaggerUI from '@fastify/swagger-ui'
import authPlugin from './plugins/auth.js'
import prismaPlugin from './plugins/prisma.js'
const fastify = Fastify({ logger: true });
import cors from '@fastify/cors';
import sensible from '@fastify/sensible'

await fastify.register(sensible)
await fastify.register(authPlugin);
await fastify.register(prismaPlugin);
await fastify.register(swagger, {
  openapi: {
    info: {
      title: 'Laundry API',
      description: 'Laundry management backend',
      version: '1.0.0'
    }
  }
});

await fastify.register(swaggerUI, {
  routePrefix: '/docs'
})


fastify.get('/ping', async () => {
  return { pong: true }
})

const start = async () => { 
    await fastify.register(cors, {
      origin: [
        'https://impress-laundry-ui-production.up.railway.app',
        'https://impress-fresheners.up.railway.app',
        'http://localhost:5173',
        'http://localhost:3000',
      ],
      credentials: true,
    });
    fastify.register(routes);
    await fastify.listen({
      port: process.env.PORT || 3000,
      host: '0.0.0.0',
    });
    console.log('Server is running on port 3000');
};

start();