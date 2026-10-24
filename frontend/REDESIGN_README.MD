# 0% (CONET) — Desktop-First Redesign Brief

> Junction Community Matchmaker · Junction Tampere, Hervanta Campus
> Purpose of this file: give Claude full context on the project, the redesign goals and the open decisions, then start a `/grill-me` session so we agree on the plan **before** any code is written.

---

## 0. Prompt to paste into Claude (start here)

```
/grill-me

Read this whole file (0pct-redesign-brief.md) and then explore the repo
(especially src/pages, src/components/CanvasMap.tsx, src/lib/mapConstants.ts,
the seed data and the Tailwind/CSS tokens) before asking anything.

Goal: redesign the current app, which feels like a stretched mobile app,
into a desktop-first, easy-to-use web app with 4 main pages:
(1) Landing, (2) AI Match chat, (3) Team Map, (4) Mentor Map.
Also fix the seed data so every person/team appears in the correct
building/zone on the canvas map.

Rules for this session:
- Interview me one question at a time. Walk the decision tree in order:
  scope & time budget → information architecture → each page's layout →
  data/seed fix → matching/API contract → visual system → build order.
- For every question, give your recommended answer and a one-line reason,
  so I can just reply "ok" or correct you.
- If the answer can be found in the codebase, look it up instead of asking me.
- Use the "Open questions" section (§9) as your starting checklist, but add
  any question you discover while reading the code.
- Do NOT write or change code during the grilling.
- When we've resolved everything, output:
  1. a final spec (per page: layout, components, states, data),
  2. an ordered task list sized for the time we have left, with must/should/nice,
  3. the list of files you will create/modify,
  and wait for my "go".
```

> Optional second prompt (if you want research first): see §10.

---

## 1. Project context

**Challenge (Junction):** Teams often form late, and some participants never find their people. Participants who need help (e.g. computer vision) may not know which mentor or peer has the relevant experience.

**Our answer:** an app where people arriving alone can describe themselves in plain language, get ranked team/people matches with a short friendly reason for each, and see teams and mentors live on a pixel-art map of the venue.

**Brief requirements we must visibly satisfy for judges:**
- Read participant profiles and suggest teammates / mentors.
- Match on skills, interests, preferred roles and availability.
- Every suggestion has a short, friendly explanation.
- Users can accept / decline / request other matches.

**Current stack:** React 19 + TypeScript + Vite + Tailwind. Backend Node/Express + Supabase (Postgres, Realtime, Auth, pgvector, full-text search). LLM for profile extraction + explanations.

**Current assets worth keeping:**
- `CanvasMap.tsx` — canvas-drawn Hervanta campus (traced polygons `GEO_B` buildings, `GEO_G` roads, 1215×862 coordinate space), 8×14 pixel sprites, cap color = role, pan/zoom, click-to-select, search overlay.
- Design tokens (`--bg #12100e`, `--surface #1c1814`, `--tile #2a241c`, `--fg #f3e6c8`, `--muted #a89878`, `--primary #e6b84a`, `--you #3d8bfd`, `--ink #0a0908`, `--line #5a4c3a`), Press Start 2P + IBM Plex Sans, square corners, 2px borders, hard shadows.
- Matching engine design: hard filters → hybrid search (FTS + pgvector, RRF) → rule-based re-rank (0.30 interest, 0.30 role gap, 0.20 skill gain, 0.20 availability, minus penalties) → LLM explanation from computed factors only.

---

## 2. What's wrong with the current UI

- Layouts feel like a phone app stretched onto a desktop: single narrow column, stacked cards, lots of empty space at ≥1280px, navigation patterns that belong on mobile.
- Too many routes for a demo (`/login`, `/register`, `/onboarding`, `/profile`, `/team/:id`, `/matches`, two maps) — the story isn't obvious to a first-time visitor or a judge.
- Pixel font used in places where people must read a lot → tiring.
- Seed data locations are wrong: markers don't land in the buildings/zones they claim to be in.

---

## 3. Redesign goals

1. **Desktop-first** (design at 1440×900, must work at 1280×800; tablet ≥ 768 acceptable; phone = "works, not polished").
2. **One clear story in 4 pages**, reachable from a persistent top nav: `Home · Find my match · Team map · Mentor map`.
3. **Zero-learning UX:** first-time user understands each page in < 5 seconds; every page has one primary action.
4. **Keep the pixel identity** but use it for headings/labels/map only; body text stays in a readable sans.
5. **Demo-proof:** works with seeded data even if the LLM/Realtime is slow or down (graceful fallback).

---

## 4. Information architecture

| Route | Page | Primary action |
|---|---|---|
| `/` | Landing | "Find my team" → `/match` |
| `/match` | AI Match (chat) | Describe yourself / import CV → get ranked cards |
| `/map/teams` | Team Map | Click a team lead → see project, members, missing roles → request to join |
| `/map/mentors` | Mentor Map | Describe a problem or filter by expertise → pick the right mentor |

Secondary (keep but de-emphasise, reachable from avatar menu): profile, my team, invitations/matches, login/register.
**Decision to grill:** do we need login at all for the demo, or a lightweight "pick a name" session?

Persistent top bar (desktop): logo `0%` · 4 nav links · "invitations" bell with count · avatar menu. Height ~56px, pixel font for logo/nav only.

---

## 5. Page specs

### 5.1 Landing (`/`)

Goal: in one scroll, a judge understands *the problem, why it matters, how we solve it, and where to click*.

```
┌──────────────────────────────────────────────────────────────────────┐
│ 0%   Home  Find my match  Team map  Mentor map              [Sign in]│
├──────────────────────────────────────────────────────────────────────┤
│  HERO (2 columns)                                                    │
│  Left: headline "Nobody hacks alone."                                │
│        sub: arrive solo → find a team that fits + the right mentor   │
│        [Find my team]  [Open the map]                                │
│  Right: animated mini canvas map (sprites walking, a match pulse)    │
├──────────────────────────────────────────────────────────────────────┤
│  THE PROBLEM  (3 stat/pain cards)                                    │
│  "Teams form late" · "Solo people slip through" · "Help is hidden"   │
├──────────────────────────────────────────────────────────────────────┤
│  HOW IT WORKS  (3 steps, horizontal)                                 │
│  1 Tell us in one sentence → 2 Ranked matches with reasons →         │
│  3 Meet on the map                                                   │
├──────────────────────────────────────────────────────────────────────┤
│  TWO-SIDED + CONSENT  (why it's different: both sides agree,         │
│  only best-fit teams get notified, location shown by zone only)      │
├──────────────────────────────────────────────────────────────────────┤
│  LIVE NOW strip: N teams recruiting · N people looking · N mentors   │
│  available (from seed/realtime)                    [Find my team]    │
└──────────────────────────────────────────────────────────────────────┘
```

Acceptance: primary CTA visible above the fold at 1280×800; no wall of text (max ~25 words per block); live counters read from the same data as the maps.

### 5.2 AI Match chat (`/match`)

Feature text (from us): a prompt box where you put your general idea, your skills and the role you want. The programme picks out key words and returns matches from best to least fitted, as cards with basic info about teams/people that share your values.

Example input:
> "I want to build the Dungeon in Hawaii project, I have good skill in storytelling, pitching and marketing. I would like to play the role of marketing, media."

Top of the same page — import option:
> "Already have a resume, LinkedIn or GitHub with your details? Upload the file / paste the link, add a short description of the challenge/project you picked and the role you played, and we'll take care of the rest."

Proposed desktop layout (split view, chat left / results right):

```
┌──────────────────────────────────────────────────────────────────────┐
│ ▸ IMPORT (collapsible bar, open by default for first visit)          │
│ [Drop CV (PDF/DOCX)]  [LinkedIn URL]  [GitHub URL]                   │
│ [Challenge / project you picked + role you played ........] [Import] │
├───────────────────────────────┬──────────────────────────────────────┤
│ CHAT (≈40%)                   │ RESULTS (≈60%)                       │
│ AI: "Tell me your idea,       │ Tabs: [Teams 12] [People 30]         │
│ skills and role."             │ Sort: Best fit ▾  Filters: role,     │
│ You: "Dungeon in Hawaii..."   │ challenge, availability              │
│ AI: "Here's what I picked up" │ ┌──────────┐ ┌──────────┐            │
│  Idea: Dungeon in Hawaii ✎    │ │ 92% fit  │ │ 87% fit  │            │
│  Skills: storytelling,        │ │ Team Kai │ │ ...      │            │
│   pitching, marketing ✎       │ │ needs:   │ │          │            │
│  Role: marketing, media ✎     │ │ marketing│ │          │            │
│  [Looks right → match]        │ │ "Why: ..." one line   │            │
│                               │ │ [Request] [Skip] [Map]│            │
│ Suggested prompts (chips)     │ └──────────┘ └──────────┘            │
│ [ type here .............. ⏎] │ [Show more matches]                  │
└───────────────────────────────┴──────────────────────────────────────┘
```

Key behaviours:
- **Extracted keywords are shown as editable chips** (idea / skills / role / interests / availability) before matching — user confirms or edits. This is the "the AI understood me" moment.
- Results ranked best → least; each card: name, challenge/project, fit %, members count/size, missing roles (highlight the one the user fills), one-line friendly reason, actions **Request to join / Skip (with reason chips) / Show on map**.
- "Show more" = request other matches (brief requirement). Skip reasons (not my challenge / role overlap / schedule) re-weight next results.
- Empty / loading / error states: skeleton cards; if LLM fails, fall back to keyword extraction + seeded ranking.
- Import flow fills the same chips as the chat, then runs the same match.

Acceptance: from landing to first ranked card in ≤ 2 interactions using the example prompt; every card shows a reason; Request / Skip / More all work against seed data.

### 5.3 Team Map (`/map/teams`)

Feature text (from us): for people without a team — the overall map of the building where the event takes place; interact with small icons to see all teams available right now. Reference scale: a Junction event with ~2,000 people. Only **team leads** of open teams are shown (people already in a team are filtered out). Clicking shows the project they picked, every member's info and what roles they're missing / expect.

Proposed desktop layout (map + synced list):

```
┌──────────────────────────────────────────────────────────────────────┐
│ Filters: [Missing role ▾] [Challenge ▾] [Zone ▾] [Search team/skill] │
├───────────────────────┬──────────────────────────────────────────────┤
│ LIST (≈320px)         │ CANVAS MAP (keeps current renderer)          │
│ 48 teams recruiting   │  - one sprite per open-team LEAD             │
│ ┌───────────────────┐ │  - zone labels, cluster badge "+12" when     │
│ │ Team Kai · Food   │ │    many leads share a zone at low zoom       │
│ │ needs: designer   │ │  - hover list item ⇄ highlight sprite        │
│ └───────────────────┘ │                                              │
│ ...                   │         ┌────────────────────────┐           │
│                       │         │ DETAIL DRAWER (right)  │           │
│                       │         │ Project + challenge    │           │
│                       │         │ Members: name, role,   │           │
│                       │         │  top skills            │           │
│                       │         │ Missing roles +        │           │
│                       │         │  expectations text     │           │
│                       │         │ Zone / table           │           │
│                       │         │ [Request to join]      │           │
│                       │         └────────────────────────┘           │
└───────────────────────┴──────────────────────────────────────────────┘
```

Key behaviours:
- List and map are two views of the same filtered set; selecting either selects both.
- At 2,000-person scale (~400–500 teams) the map must not become a carpet of sprites: cluster per zone when zoomed out, expand on zoom/click. Demo seed can be smaller (decide in grilling) but the UI must handle 500.
- Legend for cap colors **plus** a text/letter on hover/name tag so role isn't conveyed by color alone.
- If the user came from `/match` via "Show on map", open with that team selected.

### 5.4 Mentor Map (`/map/mentors`)

Feature text (from us): see mentors on the map with their skills and experience, so you choose the right mentor for the right problem.

Same shell as the Team Map, different content:
- Top: **"Describe your problem"** input (e.g. "YOLO misdetects in low light") → highlights top 2–3 mentors with a one-line reason each; plus expertise filter chips and status filter (available / busy / away).
- List item: name, expertise tags, years/companies, status dot, zone.
- Drawer: full expertise, experience summary, status, zone, "best for…" line, action (e.g. "Ask for help" / "Mark I'm coming").
- Mentor sprites keep gold cap; busy/away shown with a status badge, not hidden.
- Open to everyone, including closed teams.

---

## 6. Seed data & location fix

Problem: seeded markers don't land where their zone/building says they are.

Likely causes to check in the code:
- `geoToMap()` uses `LAT_MIN/MAX, LNG_MIN/MAX` that don't match the bounding box of the traced 1215×862 image, so real lat/lng values map to the wrong pixels; and/or seed lat/lng were invented without checking the traced polygons.
- Our own design doc already says **no GPS indoors — use zone/table check-in**.

Proposed fix (to confirm in grilling):
- Store position as `zone_id` (+ optional `table`), not lat/lng. Each zone has an anchor inside its building polygon in canvas coordinates.
- Place each marker at `zone anchor + deterministic jitter`, re-sampling until **point-in-polygon** of that zone's building is true, with minimum spacing so sprites don't overlap.
- Add a unit test: every seeded participant/team lead/mentor lies inside its zone's polygon.
- Rebuild seed realistically for Junction: challenges (named after plausible partner challenges), teams with 1–N members, missing roles, expectations text, mentors with expertise mix (CV, ML, hardware, backend, frontend, design, pitching, business), statuses.
- Zones (current): Hacking hall/Kampusareena, Mentor corner/Main building, Food/Festia, Main stage/Tamppi Areena, Hardware lab/Konetalo, Quiet room/Tietotalo, Entrance/outside. Confirm these match the real event layout.

---

## 7. UX principles to apply (research-backed)

- **Map + list side by side on desktop.** Store-locator research shows effective map UIs tie map pins clearly to the related information, with map and list placed side by side on desktop; on mobile, users toggle between them. Crowded maps get harder to navigate, so group/cluster pins.
- **Split view for browsing + details.** Design systems (e.g. AWS Cloudscape) recommend a split panel to inspect a selected item without leaving the list; comparisons work best with about five or fewer items at a time (NN/g guideline cited there) → keep the "top matches" view to ~5 highlighted, rest behind "Show more".
- **Recognition over recall:** suggested prompt chips, example prompt prefilled as placeholder, editable keyword chips.
- **Visibility of system status:** show "reading your CV…", "found 12 teams", skeleton cards, realtime "updated 5s ago".
- **One primary action per page/card**, secondary actions visually quieter.
- **Readability:** pixel font only ≤ 2–3 words (headings, labels, nav, buttons); body ≥ 14–16px sans; check contrast (WCAG AA) of `--muted` on `--surface`.
- **Accessibility:** keyboard focus states, Enter to send in chat, Esc to close drawer, don't rely on cap color alone.
- **Privacy cues:** location by zone only, opt-in, hidden once in a team — say this in the UI, not just the docs.

---

## 8. Facts about the real event (for realism)

- Junction 2026 main event: 13–15 Nov 2026, Espoo, ~2,000 builders over 48 hours (source: City of Espoo event page). Team size there is listed as 1–4 people (LinkedIn post) — our doc currently says ≤ 5. **Our app targets Junction Tampere at Hervanta Campus**; the 2,000 figure is our scale reference.

---

## 9. Open questions (grill-me checklist)

Scope & time
1. How many hours/people do we have before judging? What is the absolute must-have for the demo?
2. Desktop-only for the demo, or must the phone view still look decent?

IA & auth
3. Remove login/register from the demo path (guest session with a name), yes/no?
4. Keep `/profile`, `/team/:id`, `/matches` as pages, or merge into drawers/menus?

Match page
5. Split layout (chat left / results right) vs chat-first with results appearing inline below?
6. Single-turn ("describe → results") or multi-turn conversation (AI asks follow-ups)?
7. Results: teams only, people only, or both with tabs? Show all best→least with pagination, or top 5 + "show more"?
8. CV import: which formats (PDF/DOCX)? Do we really fetch LinkedIn/GitHub, or parse pasted text / GitHub public API only? Where is the file processed, and is it deleted afterwards?
9. What exactly is on a card (fields, fit %, reason length)?
10. Fallback when the LLM is slow/down.

Team map
11. Show only team leads (as brief says) — what about solo "looking" participants: hidden, or toggle?
12. Clustering rule and the seed size (e.g. 80 teams for the demo vs simulated 500).
13. "Request to join" from the map: same flow as from match cards?

Mentor map
14. Problem-description search on this page, or reuse the chat?
15. What can a user do with a mentor (request, queue, just walk over)?

Data & backend
16. Switch positions from lat/lng to zone + anchor (+ jitter)? Who owns the seed script?
17. Are the 7 zones correct for the actual event building plan?
18. Realtime needed for the demo, or polling/mock good enough?

Visual system
19. Keep the dark pixel theme exactly, or add a lighter surface for long reading areas?
20. Landing hero visual: live mini-map, static screenshot, or illustration?

---

## 10. Optional: deep-research prompt (run before or after grilling)

```
/deep-research

Research desktop web UX best practices for these three patterns and give me
concrete, cited recommendations I can apply to my hackathon app (dark,
pixel-art style, React + Tailwind):
1. Conversational / chat UIs that return ranked result cards
   (e.g. AI search, job/teammate matching): layout, editable extracted
   filters, explanation text, empty/loading/error states.
2. Map + list split views for browsing many entities (≈500 markers):
   clustering, list–map sync, detail drawers, filters.
3. Matching/recommendation explanations ("why this match") that build trust.
Prioritise Nielsen Norman Group, Baymard, Google/Material, Apple HIG,
and academic HCI sources. Output: a short checklist per pattern + what to
avoid. Keep it under 2 pages.
```

---

## 11. Draft build order (to be finalised in grilling)

| # | Item | Priority |
|---|---|---|
| 1 | App shell: desktop top nav + routes `/`, `/match`, `/map/teams`, `/map/mentors` | Must |
| 2 | Seed rebuild + zone-anchored positions + point-in-polygon test | Must |
| 3 | `/match`: chat → editable keyword chips → ranked cards (Request / Skip / More) | Must |
| 4 | Team map: leads only, synced list, detail drawer, filters | Must |
| 5 | Landing page | Must (cheap, high judge impact) |
| 6 | Mentor map: problem search + highlight + drawer | Should |
| 7 | CV / LinkedIn / GitHub import | Should |
| 8 | Clustering, "Show on map" deep link, realtime counters | Nice |