# TeksysBIM Frontend

Frontend shell cloned from ERP architecture and adapted for BIM workflows.

## Run

1. Copy env:
   - `cp .env.example .env.local`
2. Install:
   - `npm install`
3. Start:
   - `npm run dev`
4. Build:
   - `npm run build`

## Current BIM Landing Modules

- `/` Home (BIM branding)
- `/login` Login
- `/company/dashboard` Company Dashboard
- `/company/projects`
- `/company/files`
- `/company/conversion-requests`
- `/company/clash-register`
- `/company/cost-estimation`
- `/company/deliverables`
- `/company/workflow-board`
- `/company/notifications`
- `/company/reports`
- `/company/settings`
- `/company/users`
- `/company/client-portal`

## Note

This phase keeps existing ERP-derived routes present while BIM-specific module pages are now in place for iterative expansion.
