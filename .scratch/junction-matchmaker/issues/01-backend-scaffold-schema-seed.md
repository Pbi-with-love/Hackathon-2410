# 01: Backend scaffold + Schema + Seed data

**What to build:** Express server running with middleware (Helmet, CORS, dotenv), Supabase client configured, all SQL schema applied (participants, teams, team_members, mentors, matches, refresh_tokens), and seed data loaded (~20 participants, 8 teams, 6 mentors with Tampere University lat/lng locations). Health check endpoint responds. Schema and seed data are raw SQL files in the repo.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Express server starts with Helmet, CORS, and dotenv configured
- [ ] Supabase client module is set up and reads connection info from environment variables
- [ ] SQL schema file creates all tables: participants, teams, team_members, mentors, matches, refresh_tokens
- [ ] SQL seed file inserts ~20 participants, 8 teams (each with captain, project idea, needed roles), 6 mentors — all with realistic lat/lng near Tampere University campus
- [ ] `GET /health` returns 200 with a status message
- [ ] Schema and seed SQL files are committed to `backend/sql/`
