import 'dotenv/config'
import prisma from './prisma.js'
import assert from 'node:assert'
import bcrypt from 'bcrypt'
async function main() {
  console.log('🌱 Seeding database...')

  // ── Invoice counters ──────────────────────────────────────────────────────
  // upsert: safe to run multiple times without creating duplicates
  await prisma.invoiceCounter.upsert({
    where:  { prefix: 'IF' },
    update: {},
    create: { prefix: 'IF', value: 5699 },  // next order will be IF/YYYY/5700
  })

  await prisma.invoiceCounter.upsert({
    where:  { prefix: 'AC' },
    update: {},
    create: { prefix: 'AC', value: 999 },   // next job will be AC/YYYY/1000
  })

  console.log('✅ InvoiceCounter rows ready')

  // ── Services ──────────────────────────────────────────────────────────────
  const services = [
    { name: 'Wash & Fold',    gstPct: 5  },
    { name: 'Wash & Iron',    gstPct: 5  },
    { name: 'Dry Clean',      gstPct: 18 },
    { name: 'Steam Press',    gstPct: 5  },
    { name: 'Stain Removal',  gstPct: 18 },
    { name: 'Carpet Cleaning',gstPct: 18 },
    { name: 'Shoe Cleaning',  gstPct: 18 },
  ]

  for (const svc of services) {
    await prisma.service.upsert({
      where:  { name: svc.name },           // requires @@unique on name — see note
      update: {},
      create: svc,
    })
  }

  await seedAdmin();

  console.log('✅ Services seeded')
  console.log('🎉 Seed complete.')
}

const seedAdmin = async () => {
  const email = process.env.SEED_EMAIL;
  const password = process.env.SEED_PASSWORD;
  assert(email && password, 'SEED_EMAIL and SEED_PASSWORD must be set in .env');

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    console.log('Owner account already exists, skipping seed.')
    return
  }

  const passwordHash = await bcrypt.hash(password, 12)
  const user = await prisma.user.create({
    data: {
      name: 'Shop Owner',
      email,
      passwordHash,
      role: 'ADMIN',
      active: true,
    },
  })

  console.log(`Created owner: ${user.email} (id: ${user.id})`)
}
console.log('🌱 Seeding');
main()
  .catch((e) => {

    console.error(e)
    process.exit(1)
  })
  .finally(async () => {

    console.log('completed')

    await prisma.$disconnect()
  })