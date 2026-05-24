# Impress API

Backend for **Impress Fresheners** — a laundry and AC service management system. Built with [Fastify](https://fastify.dev/) and [Prisma](https://www.prisma.io/) on PostgreSQL.

## Features

- **Laundry Orders** — create, update, and track orders through their lifecycle (Received → Processing → Ready → Delivered)
- **AC Jobs** — manage air-conditioning service jobs with technician assignment, GST, and discount support
- **Customers** — maintain a customer directory with advance balance tracking
- **Payments** — record payments (Cash, UPI, Card, Bank Transfer, Cheque) against orders or AC jobs
- **Rates** — configurable service × item rate matrix (e.g. Wash × Shirt = ₹50)
- **Expenses** — log business expenses by department (Laundry / AC / Common)
- **Reports** — dashboard KPIs, monthly P&L with GST breakdown, and delivery schedule
- **Auth** — JWT-based authentication via HttpOnly cookies with role-based access (Admin / Staff)
- **Swagger UI** — interactive API docs at `/docs`

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js ≥ 20 |
| Framework | Fastify 5 |
| ORM | Prisma 6 |
| Database | PostgreSQL |
| Docs | Swagger (`@fastify/swagger-ui`) at `/docs` |

## Getting Started

### Prerequisites

- Node.js ≥ 20
- PostgreSQL database

### Setup

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment** — create a `.env` file:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/impress"
   JWT_SECRET="your-secret-key-min-32-chars"
   NODE_ENV="development"
   ```

3. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

4. **Seed initial data** *(optional)*
   ```bash
   npm run db:seed
   ```

5. **Start the server**
   ```bash
   # Development (auto-restart on file changes)
   npm run dev

   # Production
   npm start
   ```

The server listens on **port 3000**. API docs are available at [http://localhost:3000/docs](http://localhost:3000/docs).

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Start with `--watch` for live reload |
| `npm start` | Start in production mode |
| `npm run db:migrate` | Run pending Prisma migrations |
| `npm run db:deploy` | Deploy migrations (production) |
| `npm run db:studio` | Open Prisma Studio |
| `npm run db:seed` | Seed the database |

## API Overview

All routes are prefixed with `/api` (except `/ping` and `/docs`).

| Tag | Base path | Key operations |
|---|---|---|
| Auth | `/auth` | `POST /login`, `POST /logout`, `GET /me` |
| Customers | `/customers` | CRUD + balance adjustment |
| Orders | `/orders` | CRUD + payment recording, status/discount management |
| AC Jobs | `/ac-jobs` | CRUD + payment recording |
| Services | `/services` | Manage service types (e.g. Wash, Iron, Dry Clean) |
| Items | `/items` | Manage garment types (e.g. Shirt, Trouser) |
| Rates | `/rates` | Service × Item rate matrix |
| Expenses | `/expenses` | CRUD, filterable by month and department |
| Reports | `/reports` | Dashboard KPIs, monthly P&L, delivery schedule |

> Full request/response schemas are documented in the Swagger UI at `/docs`.

## Data Model

```
Customer ──< LaundryOrder ──< OrderLine >── ServiceItem >── Service
                                                         └── Item
Customer ──< AcJob
User ──< LaundryOrder, AcJob, Expense, Payment
Payment >── LaundryOrder | AcJob
BalanceTransaction >── Customer
```

**Money** is stored in paise (1/100 of a rupee) as integers to avoid floating-point errors. All API responses also include a `*Rupees` convenience field.

