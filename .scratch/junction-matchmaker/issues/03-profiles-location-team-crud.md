# 03: Participant & team profiles + location

**What to build:** Authenticated participants can view and edit their profile (skills, roles, interests, bio). Participants can create a team, becoming its captain, by filling a structured form (name, project idea, goals, needed roles). Team captains can update their team and toggle open/closed recruitment status. Any user (participant, team captain, mentor) can set their location via browser geolocation or by tapping a mini-map, stored as lat/lng.

**Blocked by:** 02 — Auth system

**Status:** ready-for-agent

- [ ] `GET /participants/:id` — returns participant profile (protected)
- [ ] `PATCH /participants/:id` — updates bio, skills, roles, interests, status, lat/lng (protected, own record only)
- [ ] `POST /teams` — creates a team and sets the authenticated participant as captain; returns team with captain_id (protected)
- [ ] `GET /teams/:id` — returns team details including needed_roles and current members
- [ ] `PATCH /teams/:id` — updates team name, project idea, goals, needed_roles, status (open | closed), lat/lng (protected, captain only)
- [ ] `GET /teams/:id/members` — returns list of team members
- [ ] `PATCH /mentors/:id` — updates mentor expertise, experience, status (available | busy | away), lat/lng (protected, own record only)
- [ ] Frontend `/profile` route shows editable participant profile form
- [ ] Frontend `/team/new` route shows create-team form with fields: name, project idea, goals, needed roles (multi-select)
- [ ] Frontend `/team/:id` route shows team detail page with edit and open/closed toggle for the captain
- [ ] All location-setting UI offers "Use my location" (browser geolocation) and a small Leaflet map where the user can tap to place a pin
- [ ] Location updates are persisted to the database immediately
