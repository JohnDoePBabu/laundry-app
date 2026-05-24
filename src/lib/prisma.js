import { PrismaClient } from '@prisma/client'
// A single PrismaClient instance is reused across the entire process.
// Creating one per request would open a new connection pool each time
// and quickly exhaust the Postgres max_connections limit.
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'warn', 'error']
    : ['warn', 'error'],
})
 
export default prisma