# Junction Community Matchmaker — Spec

**Label:** `ready-for-agent`

## Problem Statement

At Junction hackathon (2,000 participants, 400+ teams), people who arrive alone struggle to find a team that fits their skills and interests. Teams with open roles don't know which available participants would complement them. Participants who get stuck on a technical problem can't easily find a mentor with relevant expertise. The result: late team formation, skill mismatches, and wasted mentorship capacity — all while everyone is in the same building but can't find each other.

## Solution

A web application with two real-time maps centered on Tampere University:

1. **Team Matching Map** — An interactive Leaflet/OpenStreetMap view showing team leaders who are actively recruiting and participants still looking for a team. Participants browse the map, find a team that matches their interests, walk over, and talk in person. The map facilitates real-world conversations, not automated placement.

2. **Mentor Discovery Map** — A separate map view showing mentors by their professional expertise, experience, and real-time location. Participants search by skill or problem area and find the right mentor to visit.

Both maps update in real time via Supabase Realtime. Users authenticate with JWT tokens, set their location via browser geolocation or tapping the map, and see only the entities relevant to their current state (recruiting teams, available mentors, unmatched participants).

A lightweight matching filter helps surface the most relevant teams ("show teams that need a frontend dev"), with the architecture designed to support a full hybrid search + re-ranking algorithm in a later phase.

## User Stories

1. As a participant arriving alone, I want to register with my skills, interests, and preferred roles, so that the system knows what I bring to a team.
2. As a participant, I want to browse a map of team leaders who are actively recruiting, so that I can see who is looking for someone like me.
3. As a participant, I want to filter teams by the roles they need, so that I find teams where I'd fill a gap rather than duplicate an existing member.
4. As a participant, I want to see a team leader's project idea, goals, and needed roles on their map marker, so that I can decide whether to walk over and talk.
5. As a participant, I want to navigate to a team leader's physical location on the map, so that I can find them in the venue and introduce myself.
6. As a participant who has joined a team, I want to disappear from the "looking" pool on the map, so that other teams don't try to recruit me.
7. As a participant, I want to search for mentors by expertise or problem description, so that I can find help when my team gets stuck.
8. As a participant, I want to see a mentor's status (available/busy/away) and location on the mentor map, so that I know whether it's worth walking over.
9. As a team leader, I want to create a team with a name, project idea, goals, and the roles I need, so that my team shows up on the matching map.
10. As a team leader, I want to toggle my recruitment status (open/closed), so that I stop appearing on the map when my team is full.
11. As a team leader, I want to see participants who are still looking for a team on the map, so that I can identify potential members.
12. As a team leader, I want to receive real-time notifications when a well-matched participant appears, so that I can invite them before another team does.
13. As a team leader, I want to invite a participant to join my team, so that the participant gets notified and can accept or decline.
14. As a participant, I want to receive real-time invitations from teams, so that I can accept and join without refreshing the page.
15. As a participant, I want to accept or decline a team invitation, so that I control which team I join.
16. As a participant, I want my pending invitations to auto-expire when I join a team, so that teams I didn't choose get notified and can find someone else.
17. As a mentor, I want to register with my expertise and experience, so that participants can find me on the mentor map.
18. As a mentor, I want to update my location on the map in real time, so that participants know where to find me.
19. As a mentor, I want to set my status to available, busy, or away, so that participants know whether I can help right now.
20. As any user, I want to log in with my credentials, so that I have a persistent identity across sessions and devices.
21. As any user, I want my session to stay alive via refresh tokens, so that I don't get logged out during the hackathon.
22. As any user, I want to set my location using browser geolocation or by tapping the map, so that others can find me in the venue.
23. As any user, I want to update my location at any time, so that the map reflects where I actually am.
24. As a participant, I want to type a free-text prompt describing myself and get a structured profile card, so that I don't have to fill out many form fields (deferred: requires LLM API key).
25. As a participant, I want to edit the extracted profile card before saving, so that I can correct any mistakes.
26. As a demo viewer, I want to see two browser tabs (participant + team captain) where an invitation appears in real time when both are open, so that the two-sided matching is visually obvious.

## Implementation Decisions

### Architecture

- **Hybrid client model**: Frontend connects to Supabase directly for Realtime subscriptions and simple reads. Backend (Express) handles auth, writes, matching logic, and profile extraction.
- **Redis caching**: Local Redis instance caches match results (30s TTL), participant/team profiles (5min TTL), and map entity positions (10s TTL). All data access goes through a service layer so Redis can be swapped for Upstash/Redis Cloud later.
- **Supabase Realtime**: Powers live notifications for match invitations, status changes, and location updates. Frontend subscribes to `matches` and presence channels.

### Auth

- JWT + bcrypt for password hashing.
- Token rotation: short-lived access token + longer-lived refresh token.
- Two registration paths: **Participant** or **Mentor**. Team Leader is a derived role — creating a team promotes a participant to captain.
- Tokens stored client-side; refresh endpoint rotates both tokens.

### Data Model (Supabase/Postgres)

- **participants**: id, name, email, password_hash, bio, skills (jsonb), roles (text[]), interests (text[]), availability (jsonb), status (looking | in_team), lat, lng, embedding (vector, nullable — for future use), fts (tsvector)
- **teams**: id, name, captain_id (FK participants), challenge, project_idea, goals, needed_roles (text[]), status (open | closed), lat, lng, embedding (vector, nullable), fts (tsvector)
- **team_members**: team_id, participant_id (composite PK)
- **mentors**: id, name, email, password_hash, expertise (text[]), experience (text), status (available | busy | away), lat, lng, embedding (vector, nullable), fts (tsvector)
- **matches**: id, participant_id, team_id, score, reasons (jsonb), direction (team_to_participant | participant_to_team), state (suggested | invited | requested | accepted | declined | expired)
- **messages**: id, match_id, sender_id, body, created_at (deferred)
- **refresh_tokens**: id, user_id, user_type (participant | mentor), token_hash, expires_at, created_at

Location is stored as `lat`/`lng` (decimal) on participants, teams, and mentors — no zones table. Locations are set via browser geolocation or map tap, updated in real time.

### Maps

- **Leaflet + OpenStreetMap** for both maps. Centered on Tampere University.
- **Team Matching Map**: shows markers for recruiting team leaders (with popup: team name, idea, needed roles) and looking participants. Clicking a marker shows details + invite/request button.
- **Mentor Discovery Map**: separate view, shows mentor markers with expertise, experience, status. Filterable by expertise keyword.
- Pre-seeded locations for demo data; live-updatable for real use.

### Matching (Lightweight Phase)

- Simple filtering: filter teams by `status = open`, then match `needed_roles` against participant's `roles` and `skills`.
- Sort by number of matching roles/skills (most gaps filled first).
- Each suggestion includes a computed reason string (no LLM needed): "This team needs a Frontend Developer — that's your top skill."
- Architecture supports future upgrade to hybrid search (keyword + vector via pgvector) + rule-based re-ranking with the formula defined in the README.

### Match Lifecycle (State Machine)

```
suggested → invited (team invites participant)
          → requested (participant asks to join)
          → accepted (both sides agree)
          → declined (either side declines)
          → expired (participant joined another team)
```

- A connection requires mutual consent.
- When a participant joins a team: status flips to `in_team`, all pending matches auto-expire, participant disappears from map.
- No "you were rejected" notifications.

### Frontend Routing

- `react-router` for distinct views:
  - `/` — Landing / login / register
  - `/profile` — View/edit participant profile
  - `/map/teams` — Team Matching Map
  - `/map/mentors` — Mentor Discovery Map
  - `/team/:id` — Team detail / management (for captains)
  - `/matches` — Pending invitations and suggestions

### LLM Integration (Deferred)

- Profile extraction from free-text prompt → structured JSON. Placeholder returns a mock profile for now.
- Provider: Gemini (when API key is available).
- Match explanations generated from computed scoring factors only (no hallucination).
- Architecture: service function with a clear interface (`extractProfile(prompt: string): Promise<ParticipantProfile>`) so the mock can be swapped for real Gemini calls.

### API Endpoints (Express)

- `POST /auth/register` — Register participant or mentor
- `POST /auth/login` — Login, returns access + refresh tokens
- `POST /auth/refresh` — Rotate tokens
- `GET /participants/:id` — Get participant profile
- `PATCH /participants/:id` — Update profile, location
- `POST /teams` — Create team (promotes participant to captain)
- `GET /teams/:id` — Get team details
- `PATCH /teams/:id` — Update team (status, needed roles, location)
- `GET /teams/:id/members` — List team members
- `GET /match/teams/:participantId` — Suggested teams for a participant
- `GET /match/participants/:teamId` — Suggested participants for a team
- `POST /match/:id/respond` — Accept / decline
- `POST /match/:id/invite` — Team invites participant
- `GET /mentors` — List mentors (filterable by expertise)
- `GET /mentors/:id` — Get mentor details
- `PATCH /mentors/:id` — Update mentor (status, location)
- `POST /profile/extract` — Prompt → profile JSON (mocked)
- `GET /map/teams` — All map-visible teams + looking participants
- `GET /map/mentors` — All map-visible mentors

## Testing Decisions

### What makes a good test

Tests verify **external behavior through public interfaces**, not implementation details. A test should break only when the behavior it describes changes, not when internal code is refactored. Tests are written before the implementation (TDD red-green cycle).

### Seams

1. **Backend API routes** (primary seam): Tests hit Express endpoints with real HTTP requests against a test Supabase instance or in-memory alternative. This validates auth, routing, validation, service logic, and data access in one pass. Covers: registration, login, token refresh, team CRUD, match lifecycle (invite → accept → auto-expire), participant status transitions, location updates, and matching/filtering results.

2. **Matching service** (unit seam): Pure functions that take participant profiles and team data, return ranked/filtered results with reason strings. Tested with deterministic inputs covering: role gap matching, skill overlap scoring, edge cases (no matches, all matches, team full, participant already in team).

### Prior art

No test runner is configured yet. Vitest is the natural choice (already in the Vite ecosystem for frontend; fast and TypeScript-native for backend). Test files live alongside source: `*.test.ts`.

## Out of Scope

- **Zones / QR check-in**: No zone table, no QR scanning. Location is lat/lng only.
- **Full matching algorithm**: Hybrid search (keyword + vector), pgvector cosine similarity, Reciprocal Rank Fusion, and the weighted re-rank formula. Architecture supports it, but the lightweight filter ships first.
- **Chat / messaging**: The `messages` table exists in the schema for forward compatibility but no chat UI is built.
- **Icebreakers**: AI-generated conversation starters after match acceptance.
- **Radar charts**: Team balance visualization (before/after adding a member).
- **Real LLM integration**: Profile extraction and match explanations are mocked until the Gemini API key is connected.
- **Feedback loop**: Decline-with-reason chips that adjust matching weights.
- **Suggestion diversity**: Algorithm to avoid returning near-identical team suggestions.
- **Privacy controls**: Opt-in location sharing, consent management. For the hackathon demo, all locations are public.
- **Mobile responsiveness**: Functional on desktop browsers for demo; mobile polish is deferred.

## Further Notes

- **Demo script**: The 3-minute demo opens two browser tabs — one as a participant, one as a team captain. The participant browses the Team Matching Map, finds a team, and requests to join. The team captain's tab gets a real-time notification and accepts. The participant disappears from the map. Then the team searches the Mentor Discovery Map for help with a technical problem.
- **Scale design target**: 2,000 concurrent users. Redis caching and Supabase connection pooling are the primary tools. The demo runs with ~20 participants, 8 teams, 6 mentors.
- **Venue**: Tampere University, Tampere, Finland. Maps center on the university campus.
- **Build order priority**: Auth → Schema + Seed → Redis → Team Matching Map → Mentor Discovery Map → Real-time presence → Lightweight matching → Profile extraction (mocked).
