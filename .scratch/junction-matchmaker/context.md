# Junction Matchmaker — Implementation Context

## Repo
/Users/camlynh/Documents/Anh_Tai/Hackathon-2310

## Integration branch
integration/junction-matchmaker

## Tickets
/Users/camlynh/Documents/Anh_Tai/Hackathon-2310/.scratch/junction-matchmaker/issues/

## Spec
/Users/camlynh/Documents/Anh_Tai/Hackathon-2310/docs/spec.md

## README (original design)
/Users/camlynh/Documents/Anh_Tai/Hackathon-2310/README.md

## Backend env vars (names only)
- SUPABASE_URL — direct PostgreSQL connection string (Supabase pooler, aws-0-eu-west-1)
- JWT_SECRET — for signing JWTs
- PORT=8080
- REDIS_URL — redis://localhost:6379 (for ticket 08)

## Frontend env vars
- VITE_SUPABASE_URL=https://bjmmyhnsljhimcmqfhtp.supabase.co
- VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_zTBIgARDWIBQOm6xlymz8Q_n_2nzcmv
  (note: this is the publishable/anon key for @supabase/supabase-js client)

## Key decisions
- Backend uses `pg` (node-postgres) for direct DB access — NOT @supabase/supabase-js
- Frontend uses @supabase/supabase-js for Realtime subscriptions only
- No RLS enabled on Supabase — no row-level security policies needed
- No database migrations — raw SQL files in backend/sql/
- Redis is LOCAL (redis://localhost:6379) for now
- Auth: JWT + bcrypt, access token (short-lived) + refresh token (long-lived, rotation)
- Two registration roles: participant | mentor (team leader is derived from creating a team)
- Location: lat/lng stored on participants, teams, mentors — no zones table
- Map: Leaflet + OpenStreetMap centered on Tampere University (61.4978° N, 23.7610° E)
- Seed data: ~20 participants, 8 teams, 6 mentors — locations near Tampere University campus
- Matching: lightweight role/skill overlap filter first (no LLM, no vector search)
- LLM: placeholder mock only (Gemini integration deferred)
- Supabase Realtime: used for match notifications on the frontend

## Stack
### Backend
- Node.js + TypeScript (strict mode, ES2022, NodeNext modules)
- Express 5
- pg (node-postgres) — install this
- bcrypt + jsonwebtoken — install these
- helmet, cors, dotenv, zod — already in dependencies
- tsx watch for dev

### Frontend  
- React 19 + TypeScript
- Vite + Tailwind CSS
- react-router — install this
- leaflet + react-leaflet — install these
- @supabase/supabase-js — install this

## Current codebase state
- backend/src/ — EMPTY (no server.ts yet)
- frontend/src/App.tsx — default Vite starter template (counter app), replace entirely
- No tests configured anywhere
