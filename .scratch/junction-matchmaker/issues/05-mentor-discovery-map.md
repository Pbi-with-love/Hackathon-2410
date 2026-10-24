# 05: Mentor Discovery Map

**What to build:** A separate Leaflet/OSM map view dedicated to mentor discovery. Mentor markers show expertise, experience, and real-time status (available/busy/away). Participants can filter visible mentors by typing an expertise keyword. Mentors can update their own location and availability status from this view. This map is independent of the Team Matching Map.

**Blocked by:** 03 — Participant & team profiles + location

**Status:** ready-for-agent

- [ ] `GET /map/mentors` — returns all mentors with lat/lng, name, expertise, experience, status. Optionally filterable by `?expertise=<keyword>` query param (case-insensitive substring match).
- [ ] `GET /mentors` — returns all mentors (filterable by expertise)
- [ ] `GET /mentors/:id` — returns single mentor detail
- [ ] Frontend `/map/mentors` route renders a full-screen Leaflet + OSM map centered on Tampere University
- [ ] Mentor markers use status-coded colours: green (available), yellow (busy), grey (away)
- [ ] Clicking a mentor marker opens a popup showing: name, expertise tags, experience summary, status
- [ ] Expertise keyword filter input above the map re-fetches `/map/mentors?expertise=<keyword>` and updates markers
- [ ] Mentors who are logged in see an "Update my location" button and a status selector (available / busy / away) on this page
- [ ] Seed data mentor markers are visible on the map immediately
- [ ] Navigation link to Team Matching Map is accessible from this view
