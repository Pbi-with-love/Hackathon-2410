# 0% (CONET) — AI Matching Pipeline on n8n

> Feature: user types a prompt on `/match` → we extract a structured profile → hybrid search (keyword + vector) → rule-based re-rank → friendly explanations → ranked cards.
> Hosting: n8n workflow behind a webhook, called by our Express backend. No Python anywhere.
> Purpose of this file: give Claude full context, then run `/grill-me`, then build — **n8n workflow JSON first**.

---

## 0. Prompt to paste into Claude Code

```
/grill-me

Read this whole file (0pct-matching-n8n-brief.md), then explore the repo before
asking anything: Supabase schema/migrations, seed data (teams, participants,
mentors, zones), the Express server and its routes, the /match page
(chat, keyword chips, result cards), and any existing matching code.

GOAL
Implement the AI matching pipeline described here, hosted as n8n workflows
called via webhook from Express. Deliver the n8n workflow JSON files FIRST,
then the database pieces, then the Express proxy, then the frontend wiring.

GRILLING RULES
- Max 8 questions, one at a time, each with your recommended answer + one-line
  reason so I can reply "ok" or correct you.
- If the codebase answers a question, look it up instead of asking.
- Start from §10 "Open questions"; add anything you discover in the code.
- No code or files until I say "go".

AFTER "go", BUILD IN THIS ORDER, STOPPING FOR MY REVIEW AFTER STEP 1:
1. n8n/ folder with importable workflow JSON files (see §5, §6):
   - n8n/match-teams.json      (main matching webhook)
   - n8n/embed-entities.json   (embeds teams/participants/mentors)
   - n8n/README.md             (import steps, credentials to create,
                                 env values, how to test with curl)
   Each JSON must import cleanly into n8n, use only core nodes listed in §5,
   contain NO secrets, have readable node names, left-to-right layout, and a
   Sticky Note per stage (we will screenshot the canvas for the pitch).
2. Supabase migration: pgvector + fts columns, indexes, hybrid_search RPC (§7).
3. Express: POST /api/match proxy → n8n webhook, with timeout + fallback (§8).
4. Frontend: /match uses the response contract (§4): editable keyword chips,
   ranked cards with fit %, reason, Request / Skip(reason) / Show more.
5. Tests + fixtures (§9) and a 30-second demo script.

Show me the file list and a short summary after each step.
```

---

## 1. Context

- Product: **0% / CONET**, Junction hackathon companion (Tampere, Hervanta campus). Pages: Landing, Find my match (`/match`), Team map, Mentor map, My team.
- Stack: React 19 + TS + Vite + Tailwind · Node/Express · Supabase (Postgres, Auth, Realtime, pgvector, full-text search) · LLM + embedding model · **n8n** for the matching pipeline.
- Brief requirements to satisfy visibly: match on skills, interests, preferred roles, availability; every suggestion has a short friendly explanation; user can accept / decline / request more.
- Core insight: interests & availability → **similarity**; skills & roles → **complementarity** (fill gaps). Never match the raw prompt text directly against team text — that ranks a frontend dev into an all-frontend team.

---

## 2. Architecture

```
Browser (/match)
   │  POST /api/match {prompt | profile, exclude_ids, feedback}
   ▼
Express  ── header secret, 12 s timeout, fallback to precomputed seed results
   │  POST {N8N_URL}/webhook/match-teams
   ▼
n8n: match-teams
   Webhook → Validate → Extract profile (LLM) → Parse/repair JSON
   → Embed query → Supabase RPC hybrid_search (top ~20, hard filters in SQL)
   → Re-rank + diversify (Code, JS) → Explain top 5 (LLM) → Merge → Respond
   ▼
Supabase: teams/participants/mentors with embedding vector + fts tsvector

n8n: embed-entities   (manual trigger or webhook on insert/update / seed run)
   Fetch rows missing embeddings → build text → embed in batches → PATCH rows
```

---

## 3. Re-rank specification (agreed)

```
interest     = minmax(rrf) over the candidate set            ∈ [0,1]
role_fit     = 1.0 if user's primary role ∈ team.needed_roles
             = 0.6 if a secondary/adjacent role matches (e.g. fullstack → frontend)
             = 0   otherwise
skill_gain   = |user.skills ∩ (team.needed_skills − team.covered_skills)|
               / |team.needed_skills − team.covered_skills|   (0 if none missing)
avail        = (overlap − 0.5) / 0.5        (hard filter already requires ≥ 0.5)
dup_penalty  = min(0.3, 0.15 × members already holding one of the user's roles)

score = clamp(0.30·interest + 0.30·role_fit + 0.20·skill_gain + 0.20·avail − dup_penalty, 0, 1)
fit%  = round(score × 100)
```

- **No** "team almost full" penalty (filling the last slot is a great match; conflicts are handled by the invite state machine/auto-expire).
- **Diversify** top 5 with a simple MMR: when picking each next card, subtract 0.1 per already-picked card with the same challenge.
- **Feedback**: decline reason chips adjust weights for the next call: `not my challenge` → interest +0.05, `role overlap` → role +0.05, `schedule mismatch` → avail +0.05; cap any weight at 0.45, renormalise to sum 1. Weights travel in the request (`feedback.weights`), no server state needed.
- Keep the `factors` object per card; explanations may only use factors ≥ 0.6 (plus a shared challenge name).
- Weights live in one config object at the top of the Code node.

---

## 4. API contract

**Request** `POST /api/match` (Express) → forwarded to n8n:

```json
{
  "prompt": "I want to build the Dungeon in Hawaii project, I have good skill in storytelling, pitching and marketing. I would like to play the role of marketing, media.",
  "profile": null,
  "target": "teams",
  "exclude_ids": [],
  "feedback": { "weights": null, "declined": [] },
  "limit": 5
}
```

- `profile` (optional): when the user edited the keyword chips, the client sends the edited profile and n8n **skips extraction**.
- `target`: `"teams"` now; `"people"` / `"mentors"` later reuse the same workflow shape.
- `exclude_ids`: already shown/declined → used by "Show more".

**Response**

```json
{
  "profile": {
    "idea": "Dungeon in Hawaii",
    "interests": ["games", "storytelling"],
    "skills": ["storytelling", "pitching", "marketing"],
    "roles": ["marketing", "media"],
    "availability": "all weekend",
    "synonyms": ["narrative", "game design", "growth", "branding"]
  },
  "results": [
    {
      "id": "uuid",
      "name": "Team Kai",
      "challenge": "Games & Entertainment",
      "zone": "Hacking hall",
      "members": 3,
      "max_size": 4,
      "needed_roles": ["marketing", "designer"],
      "fit": 88,
      "factors": { "interest": 0.92, "role": 1, "skill": 0.5, "avail": 1 },
      "reason": "You'd fill their missing marketing role, and they're building a story-driven game too."
    }
  ],
  "meta": { "candidates": 18, "weights": { "interest": 0.3, "role": 0.3, "skill": 0.2, "avail": 0.2 }, "ms": 4200, "fallback": false }
}
```

Errors: `{ "error": "code", "message": "..." }` with HTTP 4xx/5xx; Express converts any failure/timeout into a fallback response with `meta.fallback = true`.

---

## 5. Workflow `match-teams` — required nodes

Use only core nodes so the JSON imports on any recent n8n (Cloud or self-hosted): **Webhook, Code, HTTP Request, IF, Merge, Respond to Webhook, Sticky Note**. Call the LLM, embeddings and Supabase through **HTTP Request** nodes (not provider-specific nodes) so parameters don't break across n8n versions; credentials via **Header Auth** credentials referenced by name, never inline keys.

| # | Node name | Type | Job |
|---|---|---|---|
| 1 | `Webhook: match-teams` | Webhook (POST, path `match-teams`, Header Auth, respond via Respond node) | Entry point |
| 2 | `Validate input` | Code | Check `prompt` or `profile` present, prompt ≤ 1,000 chars, defaults for target/limit/weights |
| 3 | `Has profile?` | IF | Skip extraction when the client sent edited chips |
| 4 | `LLM: extract profile` | HTTP Request → LLM API | Prompt → strict JSON (schema in §5.1), low temperature, JSON mode if the provider supports it |
| 5 | `Parse & repair profile` | Code | Strip code fences, `JSON.parse`, lowercase/normalise skills & roles against our role list, retry-safe defaults; on failure fall back to simple keyword extraction |
| 6 | `Merge profile` | Merge | Joins branches from 3 |
| 7 | `Build query` | Code | `query_text = idea + interests + synonyms`; `embed_text = idea + interests` |
| 8 | `Embed query` | HTTP Request → embeddings API | Returns vector |
| 9 | `Supabase: hybrid_search` | HTTP Request → `POST {SUPABASE_URL}/rest/v1/rpc/hybrid_search` | Returns ~20 candidate teams with rrf + fields needed for scoring |
| 10 | `Re-rank & diversify` | Code (JS) | §3 formula, feedback weights, exclude_ids, MMR, top `limit` |
| 11 | `LLM: explain` | HTTP Request → LLM API | One call for all top cards; returns `[{id, reason}]`, ≤ 25 words each, friendly, only from given factors |
| 12 | `Attach reasons` | Code | Merge reasons into cards; template fallback reason if LLM output invalid |
| 13 | `Respond to Webhook` | Respond to Webhook | Contract §4 |
| — | `Error → fallback` | Code + Respond (error output on nodes 4/8/9/11 set to continue) | Return `{error}` quickly so Express can fall back |
| — | Sticky notes | Sticky Note | "1 Understand", "2 Retrieve", "3 Rank", "4 Explain" |

### 5.1 Extraction prompt (node 4)

System: *You extract a hackathon participant profile. Return ONLY JSON matching this schema, no prose, no code fences:*
`{ idea: string|null, interests: string[], skills: string[], roles: string[] (first = primary), availability: string|null, synonyms: string[] (3–6 related search terms for idea/interests) }`
*Use only information in the text. Normalise roles to one of: frontend developer, backend developer, fullstack developer, mobile developer, ml engineer, data scientist, ux designer, ui designer, product manager, marketing, media, business, hardware.* (Claude: confirm this list against the seed data.)

### 5.2 Explanation prompt (node 11)

System: *Write one short, friendly sentence per team (max 25 words) explaining why it fits the participant. Use ONLY the provided factors and fields. Mention the strongest 1–2 factors. Never invent skills, people or facts. Return ONLY JSON: [{"id": "...", "reason": "..."}].*
Input: profile + for each card `{id, name, challenge, needed_roles, factors, matched_role, matched_skills}`.

---

## 6. Workflow `embed-entities`

| # | Node | Type | Job |
|---|---|---|---|
| 1 | `Manual trigger` + `Webhook: embed` | Manual Trigger / Webhook | Run after seeding, or on demand |
| 2 | `Fetch rows missing embedding` | HTTP Request → Supabase REST (`teams`, `participants`, `mentors`) | Select id + text fields where `embedding is null` |
| 3 | `Build embed text` | Code | Team: name + challenge + description + needed roles + role expectations. Participant: bio + interests + skills. Mentor: expertise + experience |
| 4 | `Batch` | Code (chunk into groups of ~50) | |
| 5 | `Embed batch` | HTTP Request → embeddings API | |
| 6 | `Write embeddings` | HTTP Request → Supabase REST PATCH / RPC `set_embeddings` | |
| 7 | `Summary` | Code | Counts per table |

`fts` columns are generated in Postgres (no n8n work needed).

---

## 7. Database (Supabase migration)

- `create extension if not exists vector;`
- `teams`: `embedding vector(<DIM>)`, `fts tsvector generated always as (to_tsvector('english', coalesce(name,'') || ' ' || coalesce(challenge,'') || ' ' || coalesce(description,'') || ' ' || array_to_string(needed_roles,' '))) stored`, plus `needed_skills text[]`, `max_size int` if missing. Same pattern for participants/mentors.
- Indexes: GIN on `fts`; HNSW (or none — sequential scan is fine at ≤ 500 rows; Claude decides).
- `hybrid_search(q text, q_emb vector(<DIM>), k int default 20, min_overlap float default 0.5, exclude uuid[] default '{}')` returning candidate rows with `rrf`, `needed_roles`, `needed_skills`, `covered_skills`, `member_roles`, `overlap`, `members`, `max_size`, `zone`, `challenge`. Hard filters inside SQL: `status = 'open'`, `members < max_size`, `overlap ≥ min_overlap`, `id <> all(exclude)`. RRF with k = 60, keyword side via `websearch_to_tsquery`.
- `<DIM>` must match the embedding model (see §10).
- Expose the RPC only to the service role (n8n uses the service key via Header Auth credential); keep RLS on tables.

---

## 8. Express proxy

- `POST /api/match` → validates body, forwards to `N8N_MATCH_URL` with header `X-Webhook-Secret`.
- Timeout 12 s. On timeout/error/invalid JSON → return precomputed fallback results for the seeded demo personas (deterministic) with `meta.fallback = true`.
- Never call n8n from the browser (keeps URL/secret private, avoids CORS).
- Log `meta.ms` and fallback rate.

---

## 9. Tests & fixtures

Fixture prompts (store in `n8n/fixtures/*.json` and a backend test):
1. "I'm a frontend dev looking for a sustainability project"
2. "I want to build an AI-powered education tool"
3. "I have experience in ML and want to join a health-tech team"
4. "I want to build the Dungeon in Hawaii project, I have good skill in storytelling, pitching and marketing. I would like to play the role of marketing, media."
5. Edge: empty-ish prompt ("hi"), very long prompt, non-English prompt (Finnish/Vietnamese).

Assertions:
- Extraction returns valid schema; primary role is first.
- A frontend dev never gets a team whose needed roles exclude frontend ranked above one that needs frontend (all else equal).
- Results never include closed/full teams or `exclude_ids`.
- Top 5 contains ≥ 2 different challenges when candidates allow it.
- Every card has a non-empty reason ≤ 25 words.
- Express returns fallback within 12 s if n8n is down.
- p50 end-to-end latency target ≤ 5 s.

Unit-test the re-rank function by keeping it in a plain JS module that the Code node content is copied from (`n8n/src/rerank.js` → pasted into the node), so it is testable with vitest.

---

## 10. Open questions (grill-me checklist)

1. Which LLM + embedding provider/model do we use (and therefore `<DIM>`)? Do we have API credits for the demo?
2. n8n Cloud or self-hosted? Which n8n version (affects node typeVersions in the JSON)?
3. One LLM call for extraction + one for explanations, or a single combined call to save latency?
4. Do we match `teams` only now, or also `people` and `mentors` (same workflow with a `target` switch, or separate workflows)?
5. Where is availability stored and how is overlap computed (time slots vs "all weekend" text)?
6. Canonical role list and adjacency map (e.g. fullstack → frontend/backend at 0.6) — from seed data?
7. Is `needed_skills` per team in the seed, or derived from needed roles?
8. Fallback strategy: precomputed results per demo persona, or a JS-only keyword matcher in Express?
9. Should the "Request to join" / notify-top-teams step also live in n8n, or stay in Express + Supabase Realtime?
10. Latency budget and loading UX copy on `/match`.

---

## 11. Acceptance criteria

- Importing `n8n/match-teams.json` and `n8n/embed-entities.json` into n8n works without errors; only credentials need to be selected.
- `curl` against the webhook with fixture 4 returns the §4 contract with 5 ranked, explained teams.
- `/match` shows editable chips from `profile`, then cards from `results`; Skip with a reason changes the next "Show more" results.
- The n8n canvas is readable enough to screenshot for the pitch (4 labelled stages).