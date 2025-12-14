## Vercel configuration for Python DB API only

- Set the following environment variables in Vercel **for Production, Preview, and Development**:
  - `DB_API_URL=https://api.ecotek.green`
  - `DB_API_KEY=Kimgisarike1!`
- Do **not** add `DATABASE_URL`, Supabase/Neon URLs, or any Postgres credentials. Vercel should never see direct DB connection strings.
- Runtime must stay on Node for every route or server component that fetches from the Python API. Add `export const runtime = "nodejs";` to those files to avoid Edge.
- All DB-backed reads/writes should flow through the centralized helper in `src/lib/dbApi.ts` (or helpers built on top of it) so Vercel only ever talks to the Python API.
- Avoid API calls during build time (e.g., in `generateStaticParams` or static metadata); keep data fetching at runtime so builds succeed even if the API is unavailable.
