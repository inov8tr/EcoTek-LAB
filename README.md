## EcoTek R&D Portal

A Next.js App Router experience for EcoTek’s R&D teams. It ships with:

- Dashboard, formulations, batches, analytics, and settings surfaces
- Tailwind + brand token theming
- Recharts-powered data visualizations
- PostgreSQL-backed authentication (bcrypt hashed passwords)

## Running locally

```bash
npm install
npm run dev
```

The portal runs at [http://localhost:3000](http://localhost:3000). Build and lint with:

```bash
npm run lint
npm run build
```

## Authentication & user roles

The portal now uses **NextAuth (Credentials provider)** backed by Prisma's `User` model. Every account carries a role (`ADMIN`, `RESEARCHER`, `VIEWER`) and a status (`PENDING`, `ACTIVE`, `SUSPENDED`) so admins can gate access to sensitive tooling.

### Environment variables

```
DATABASE_URL=postgres://ecotek:Kimgisarike1!@localhost:55432/ecotekdb
NEXTAUTH_SECRET=generate-a-random-string
# Optional: override the admin that prisma/seed.ts creates
# ECOTEK_ADMIN_EMAIL=admin@ecotek.com
# ECOTEK_ADMIN_PASSWORD=ChangeMeNow!2024
```

### Default credentials & workflow

`npm run db:seed` now creates an active administrator:

```
Email: admin@ecotek.com
Password: ChangeMeNow!2024
```

- Operators can self-register at `/signup`; their status stays **PENDING** until an admin approves it.
- Admins manage accounts and roles at `/admin/users`.
- Suspended users are prevented from logging in; they see a helpful message on `/login`.

Use `database/seed-portal-users.sql` if you ever need to seed users directly in SQL (it now targets the Prisma-managed `User` table).

## R&D data schema (Prisma)

Process, compliance, and analytics data are modeled with Prisma (`prisma/schema.prisma`) and stored in the same PostgreSQL instance:

- `Formulation` → `Batch` → `BinderTest`
- Compliance metadata: `Market`, `Standard`, `StandardRequirement`, `ComplianceResult`

Run migrations and seed the sample dataset (formulations F-12A/F-11B/F-10C plus their binder tests) against your database:

```bash
DATABASE_URL=postgres://ecotek:Kimgisarike1!@localhost:55432/ecotekdb npm run prisma:migrate
DATABASE_URL=postgres://ecotek:Kimgisarike1!@localhost:55432/ecotekdb npm run db:seed
```

`npm run db:seed` executes `prisma/seed.ts`, which provisions the Korean PG82-22 standard, associated requirement thresholds, mixing curve data, the admin account, and compliance snapshots for each binder test. Update `prisma/seed.ts` or insert additional records directly via Prisma whenever new test data is available.

## Deploying

1. Ensure `DATABASE_URL` points to your production PostgreSQL instance.
2. Provide `NEXTAUTH_SECRET` so NextAuth can sign JWTs.
3. Deploy with your preferred platform (Vercel, Render, etc.). The build output is fully static except for the dynamic `/formulations/[id]` and `/batches/[id]` routes.
