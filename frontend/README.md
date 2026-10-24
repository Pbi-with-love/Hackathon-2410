# Junction Community Matchmaker — Project Overview

> **Challenge:** Help every participant find the right people to build with.
> **Goal:** People who arrive alone still find a team that fits, and anyone who gets stuck finds a mentor with the right expertise, with a short, friendly explanation for every suggestion.
> **Evaluators:** Aditya Mittal & Jay Bhide (judging on Sunday)

---

## 1. Problem

- Teams often form late, and some participants never find their people.
- Participants who need help (e.g. computer vision) don't know which mentor or peer has relevant experience.

## 2. Required by the brief

- [ ] Read participant profiles and suggest teammates/mentors.
- [ ] Use **skills, interests, preferred roles, and availability** when matching.
- [ ] Every suggestion includes a **short, friendly explanation**.
- [ ] Participants can **accept / decline / request other matches**.

## 3. Solution overview

A web app with three core features:

1. **Prompt-box matching (two-sided):** a participant describes themselves in a short prompt. The AI suggests fitting teams and, at the same time, notifies the teams that need someone like them most. A connection only happens when both sides agree.
2. **Hybrid matching engine:** hybrid search (keyword + vector) retrieves candidates, then rule-based re-ranking scores roles, skills, and availability.
3. **Venue map:** a floor plan of the venue showing mentors, open teams, and participants looking for a team, by zone/table and real-time status.

### Core insight

| Factor | Logic | Why |
|---|---|---|
| Interests, availability | **Similarity**: the closer, the better | Same challenge, same time on site |
| Skills, roles | **Complementarity**: fill the gaps | A team with 3 backend devs needs a designer, not a 4th backend dev |

---

## 4. Tech stack

| Layer | Technology |
|---|---|
| Frontend | ReactJS, TailwindCSS |
| Backend | Node.js, TypeScript, Express |
| Database / Auth / Realtime | Supabase (Postgres, Realtime, Auth) |
| Vector search | `pgvector` (Supabase extension) |
| Keyword search | Postgres full-text search (`tsvector`, `ts_rank`) |
| LLM | Profile extraction, match explanations, icebreakers |
| Embeddings | Embedding model for bios, interests, expertise |

> No need for Elasticsearch or a separate vector DB: Supabase handles both keyword and vector search.

---

## 5. User flows

### 5.1 Participant looking for a team

1. The participant types a prompt, e.g. *"I'm a frontend dev, mostly React, wanna build something for energy saving, here all weekend"*.
2. The LLM extracts a **structured profile** (JSON), shown as a profile card the user can confirm or edit.
3. The matching engine returns the **top 3–5 teams**, each with:
   - A friendly explanation (based on the highest-scoring factors)
   - Team balance radar chart, before vs. after adding you *(nice-to-have)*
   - **Request to join / Decline / Show more** buttons
4. The AI asks for consent: *"Want me to introduce you to the teams that fit you best?"*
5. If yes, only the **best-matching teams** get notified (no broadcast to everyone).
6. Once both sides agree, a chat opens with an AI-suggested **icebreaker**, and the map shows where the team/captain is.

### 5.2 Team looking for members

1. The captain sets the team to `open` and declares the **missing roles** (e.g. 1 designer, 1 ML).
2. The team gets a pop-up when a fitting participant appears, written from the team's perspective:
   > 🔔 Minh just joined: Frontend (React, 3 yrs), into the Energy challenge, here all weekend. **Minh fills exactly the Frontend gap your team is missing.** [Invite] [Skip]
3. The team can browse participants who are `looking`, see their zone, and **message or invite** them.
4. `closed` teams (full, or not looking) are filtered out of matching.

### 5.3 Finding a mentor on the map

1. The participant describes a problem, e.g. *"YOLO misdetects in low light"*.
2. The system matches it against mentor expertise (hybrid search) and highlights 2–3 mentors on the map.
3. Each mentor node shows: skills, experience, **status** (available / busy / away), and current **zone**.
4. The mentor map is open to everyone, including `closed` teams.

---

## 6. Matching engine

```
Profile (structured + embedding)
   │
   ▼
[1] Hard filters
    - team.status = open, team not full (≤ 5)
    - availability overlap ≥ 50%
   │
   ▼
[2] Hybrid search → top ~20 candidates
    - keyword: Postgres full-text (ts_rank)
    - semantic: pgvector cosine similarity
    - merged with Reciprocal Rank Fusion (RRF)
   │
   ▼
[3] Rule-based re-rank
   │
   ▼
[4] Top 3–5 → LLM writes the explanation (only from computed factors, no hallucination)
```

### Re-rank formula

```
score = 0.30 × interest_similarity      (hybrid search score)
      + 0.30 × role_gap_fill            (does the participant fill a missing role?)
      + 0.20 × skill_coverage_gain      (how many new skills the team gains)
      + 0.20 × availability_overlap     (% of overlapping time)
      − penalty(duplicate roles, team almost full)
```

### Feedback loop

- Decline with a reason via quick chips: *not my challenge / role overlap / schedule mismatch*. The reason adjusts the weights for the next suggestions.
- **Diversify** suggestions: don't return 5 near-identical teams.

---

## 7. States & routing

| Entity | State | Sees |
|---|---|---|
| Team | `open` | `looking` participants + zone + match suggestions |
| Team | `closed` | Hidden from matching, can still use the mentor map |
| Participant | `looking` | `open` teams + captain location + suggestions |
| Participant | `in_team` | Location hidden, uses the app as a team member |
| Mentor | `available` / `busy` / `away` | Shown on the map by status |

### Match lifecycle

```
suggested → invited (team invites) / requested (participant asks to join)
          → accepted | declined | expired
```

- A connection only happens when **both sides agree**.
- When a participant joins a team, their other pending invites **auto-expire**, and those teams get replacement suggestions.
- Never show a "you were rejected" notification.

---

## 8. Map & location

- **No GPS**: it isn't accurate indoors.
- Use **zone/table check-in**: users pick their zone or **scan a QR code on each table**.
- The map is a **floor plan image** of the venue; each node is placed at its zone's `(x, y)` coordinates.
- Updates in real time via Supabase Realtime.

### Privacy

- A participant's location is shown only while `looking` **and** after they consent to share.
- Shown by **zone**, not as an exact point.
- Hidden automatically once the participant is `in_team`.

---

## 9. Data model

```sql
participants (
  id, name, bio,
  skills jsonb,            -- [{ "name": "React", "level": 3 }]
  roles text[],            -- preferred roles
  interests text[],
  availability jsonb,      -- on-site time slots
  status,                  -- looking | in_team
  zone_id, consent_share bool,
  embedding vector, fts tsvector
)

teams (
  id, name, captain_id, challenge,
  needed_roles text[],
  status,                  -- open | closed
  zone_id,
  embedding vector, fts tsvector
)

team_members (team_id, participant_id)

mentors (
  id, name, expertise text[], experience,
  status,                  -- available | busy | away
  zone_id,
  embedding vector, fts tsvector
)

matches (
  id, participant_id, team_id,
  score, reasons jsonb,
  direction,               -- team_to_participant | participant_to_team
  state                    -- suggested | invited | requested | accepted | declined | expired
)

messages (id, match_id, sender_id, body, created_at)

zones (id, label, x, y)    -- coordinates on the floor plan
```

Supabase Realtime subscriptions on `matches` and `messages` power the pop-up notifications and chat.

---

## 10. API (Express)

| Method | Endpoint | Description |
|---|---|---|
| POST | `/profile/extract` | Prompt → LLM → profile JSON + embedding |
| GET | `/match/teams/:participantId` | Team suggestions for a participant |
| GET | `/match/participants/:teamId` | Participant suggestions for a team |
| POST | `/match/:id/respond` | Accept / decline (with reason) |
| POST | `/match/:id/invite` | Team invites a participant |
| POST | `/mentor/search` | Question → top mentors |
| POST | `/checkin` | Update zone (from QR) |
| PATCH | `/team/:id/status` | Set team open / closed |

---

## 11. Build order (cut from the bottom if time runs out)

| # | Item | Priority |
|---|---|---|
| 1 | Seed data: ~20 participants, 8 teams, 6 mentors, 10 zones | 🔴 Must |
| 2 | Prompt → profile extraction → save + embedding | 🔴 Must |
| 3 | Matching: hybrid search + re-rank + explanations + Accept/Decline/More | 🔴 Must (core of judging) |
| 4 | Pop-up to top teams + Invite button (Realtime) | 🔴 Must (the wow moment) |
| 5 | Venue map: floor plan + mentor/team nodes + zone check-in | 🟡 Should |
| 6 | Mentor search by question | 🟡 Should |
| 7 | Chat, radar chart, icebreaker | 🟢 Nice-to-have |

---

## 12. Demo script (~3 minutes)

1. **Problem** (20s): "Minh arrives at Junction alone and knows no one."
2. **Prompt** (30s): Minh types a few lines about himself; a profile card appears.
3. **Suggestions** (40s): 3 teams with explanations showing why they match (missing role, shared interest, overlapping time).
4. **Two screens** (40s): Team Aurora's laptop gets a pop-up and clicks Invite; Minh accepts; the map shows the way to the team's table.
5. **Mentor** (30s): the team gets stuck on computer vision, asks the system, and the map highlights an available mentor in zone B.
6. **Close** (20s): two-sided, explainable, and respects user consent.

---

## 13. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Notification spam for teams | Only notify the top 3–5 best-matching teams |
| LLM hallucinating reasons | LLM may only use facts from the computed scoring factors |
| No real data to demo | Realistic seeded fake data |
| Inaccurate indoor location | QR zone check-in instead of GPS |
| Multiple simultaneous invites | Clear state machine, auto-expire once a team is joined |
| Privacy concerns | Opt-in, zone-level display, hidden once in a team |