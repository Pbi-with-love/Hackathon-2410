# 06: Match lifecycle + real-time notifications

**What to build:** The full match state machine works end-to-end. A team captain can invite a participant from the map; the participant receives a real-time notification via Supabase Realtime and can accept or decline. A participant can request to join a team; the captain gets notified. On acceptance: the participant's status flips to `in_team`, they disappear from the Team Matching Map, and all their other pending matches auto-expire (with the affected teams receiving replacement-suggestion notifications). No rejection notifications are shown. This ticket enables the two-tab demo.

**Blocked by:** 04 — Team Matching Map

**Status:** ready-for-agent

**Match state machine:**
```
suggested → invited   (team invites participant)
          → requested (participant asks to join)
invited   → accepted  (participant accepts)
          → declined  (participant declines)
requested → accepted  (captain accepts)
          → declined  (captain declines)
accepted  → (terminal)
declined  → (terminal)
any open  → expired   (participant joined a different team)
```

- [ ] `POST /match/:id/invite` — captain invites a participant; creates or updates a match record to state `invited` (protected, captain only)
- [ ] `POST /match/:id/respond` — accept or decline a match; accepts body `{ action: "accept" | "decline" }` (protected)
- [ ] On accept: participant status → `in_team`, all other pending matches for that participant → `expired`
- [ ] `GET /matches` — returns all pending matches for the authenticated user (invited/requested states)
- [ ] "Request to join" button on team marker popup creates a match in state `requested`
- [ ] Frontend subscribes to Supabase Realtime on the `matches` table for rows relevant to the current user
- [ ] A toast/notification appears in real time when a new `invited` or `requested` match arrives
- [ ] Frontend `/matches` route shows pending invitations and requests with accept/decline buttons
- [ ] Accepting a match updates the participant's map visibility immediately (they disappear from the Team Matching Map)
- [ ] No "you were rejected" message is shown when a match is declined
