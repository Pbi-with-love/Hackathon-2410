# 04: Team Matching Map

**What to build:** A Leaflet/OpenStreetMap map centered on Tampere University showing two layers of markers: team leaders who are actively recruiting (status = open) and participants who are still looking for a team (status = looking). Clicking a team marker shows a popup with team name, project idea, needed roles, and a "Request to join" button. Clicking a participant marker shows their skills and roles. Visibility rules are enforced server-side: only open teams and looking participants appear.

**Blocked by:** 03 — Participant & team profiles + location

**Status:** ready-for-agent

- [ ] `GET /map/teams` — returns all map-visible entities: open teams with lat/lng, name, project_idea, needed_roles; and looking participants with lat/lng, name, skills, roles. Excludes closed teams and in_team participants.
- [ ] Frontend `/map/teams` route renders a full-screen Leaflet + OSM map centered on Tampere University (approximately 61.4978° N, 23.7610° E)
- [ ] Team markers and participant markers use visually distinct icons/colours
- [ ] Clicking a team marker opens a popup showing: team name, project idea, needed roles, and a "Request to join" button
- [ ] Clicking a participant marker opens a popup showing: name, skills, roles
- [ ] Map updates when the page loads (fetches from `/map/teams`)
- [ ] Seed data markers are visible on the map immediately
- [ ] Navigation link to Mentor Discovery Map is accessible from this view
