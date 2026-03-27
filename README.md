# TeksysBIM Workspace

Workspace path on server:

- `/opt/bim-teksys/teksysbim/frontend`
- `/opt/bim-teksys/teksysbim/backend`

## Architecture Baseline

- Frontend: Next.js + TypeScript + Tailwind
- Backend: TypeScript + Express modular structure
- ORM/DB: Prisma + PostgreSQL schema
- Auth: JWT + role guards
- Uploads: Multer local storage abstraction (S3-ready in next phase)

## What is implemented in this phase

- Full BIM-oriented Prisma schema (`backend/prisma/schema.prisma`)
- Seed script with sample organizations, admin user, project, request, clash and cost data
- Secure API skeleton for auth, projects, files, conversion requests, dashboard, admin, notifications
- ERP-style UI shell cloned and adapted for BIM:
  - Home
  - Login
  - Company Dashboard
  - Core BIM module routes

## Next planned step

- Replace in-memory module responses with Prisma-backed services
- Add refresh token flow + password reset flow
- Wire frontend module pages to backend APIs
- Add Swagger docs and activity log persistence
