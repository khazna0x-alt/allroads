# All Roads Showroom

Bilingual (Arabic default, RTL) Next.js + Convex platform for [allroads.om](https://allroads.om): luxury Omani showroom pages, staff-published inventory, public consignment, published-only `/api/inventory` for Wa-Agents, and a disabled Heffl lead adapter.

## Run locally

Use two terminals:

```bash
npm install
npx convex dev
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (Arabic) or `/en`. Staff desk: [http://localhost:3000/admin](http://localhost:3000/admin).

`npx convex dev` is for development only. Do not run `npx convex deploy` unless you are shipping production.

## Environment

Copy `env.example` to `.env.local` after Convex prints `NEXT_PUBLIC_CONVEX_URL`.

| Variable | Where | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_CONVEX_URL` | `.env.local` | Convex deployment URL |
| `NEXT_PUBLIC_SITE_URL` | `.env.local` | Public site origin used in the inventory API |
| `NEXT_PUBLIC_WAAGENTS_WIDGET_ID` | `.env.local` | Optional Wa-Agents chat widget |
| `SITE_URL` | Convex env | `http://localhost:3000` in development |
| `JWT_PRIVATE_KEY` / `JWKS` | Convex env | Convex Auth keys (`node scripts/generateKeys.mjs`, then `npx convex env set --from-file`) |
| `HEFFL_ENABLED` | Convex env | Keep `false` until CRM is ready |
| `HEFFL_API_KEY` | Convex env | Heffl v1 API key (unused while disabled) |

After `npx convex dev` is connected:

```bash
npx convex env set SITE_URL http://localhost:3000
node scripts/generateKeys.mjs
npx convex env set --from-file .env.convex --force
```

## Seed the first admin

No public registration. Create the first admin once:

```bash
node scripts/seed-admin.mjs admin@allroads.om "All Roads Admin"
```

Or from the Convex dashboard, run `seed:seedFirstAdmin` with `{ "identifier": "admin@allroads.om", "name": "All Roads Admin" }`.

The function returns a generated password **once**. Sign in at `/admin/login`, then change it.

Seed sample GCC cars so the showroom is not empty:

```bash
npx convex run seed:seedSampleVehicles
```

## Publication rule

Public pages and `GET /api/inventory` return only `status === "published"`. Consignment submissions enter as `pending_review`. Only staff can publish, hide, or mark sold.

## Wa-Agents

Point the bot at `https://allroads.om/api/inventory` (and `/api/inventory/:stockCode`) plus the site FAQs for hours, Al Amerat / Lulu location, financing, and consignment rules. Hidden, pending, and sold cars disappear from the feed on the next request.
