# 07: Lightweight matching + suggestions

**What to build:** A participant sees a "Suggested teams" panel alongside the Team Matching Map showing teams ranked by how well the participant fills their role gaps. A team captain sees suggested participants. Each suggestion shows a human-readable reason string computed from the data ("This team needs a Frontend Developer — that's your top skill"). No LLM or vector search needed — pure role/skill overlap filtering and sorting. The architecture is designed so the full hybrid search + re-ranking algorithm can replace the filter layer later without changing the API surface.

**Blocked by:** 04 — Team Matching Map

**Status:** ready-for-agent

- [ ] `GET /match/teams/:participantId` — returns ranked open teams for a participant. Sorted by number of `needed_roles` that overlap with participant's `roles` and `skills`. Each result includes a `reasons` array of plain-English strings.
- [ ] `GET /match/participants/:teamId` — returns ranked looking participants for a team. Sorted by role/skill gap coverage. Each result includes a `reasons` array.
- [ ] Matching logic lives in a dedicated service module (not inline in the route handler) so it can be swapped for the full algorithm later
- [ ] Reason strings are computed from data only — no LLM calls
- [ ] Frontend `/map/teams` shows a collapsible "Suggested for you" panel with the top 3–5 team suggestions and their reasons
- [ ] Each suggestion card has a "Request to join" button that triggers the match lifecycle
- [ ] Matching service has unit tests covering: role overlap scoring, edge cases (no matches, all matches, team full, participant already in a team)
