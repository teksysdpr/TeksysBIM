# TeksysBIM Backend

Phase-1 backend scaffold for CAD2BIM portal.

## Run

1. Copy env:
   - `cp .env.example .env`
2. Install:
   - `npm install`
3. Generate Prisma client:
   - `npm run prisma:generate`
4. (Optional) Create DB schema:
   - `npm run prisma:migrate`
5. (Optional) Seed DB:
   - `npm run prisma:seed`
6. Start dev server:
   - `npm run dev`

## Default Mode

By default `USE_IN_MEMORY=true` allows API demos without DB.

## Main APIs

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/dashboard/summary`
- `GET /api/projects`
- `POST /api/projects`
- `GET /api/files`
- `POST /api/files/upload`
- `GET /api/conversion-requests`
- `POST /api/conversion-requests`
- `PATCH /api/conversion-requests/:id/stage`
