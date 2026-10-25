# 30-Second Demo Script

> Two browser tabs, one prompt, one real-time notification.

## Setup

- Backend running on :8080, frontend on :5173, n8n on :5678
- Seed data loaded, embeddings populated
- Open two browser windows side by side

---

## The Demo (30 seconds)

### Tab 1 — The solo participant (Emma)

1. **Login** as `emma@example.com` / `password123`
2. Click **"Find my match"** in the nav
3. Type: *"I'm a frontend dev with Figma skills, interested in health and education projects"*
4. Hit **Send** — watch the AI extract a profile with editable chips:
   - SKILLS: figma, frontend
   - ROLE: frontend developer
   - INTERESTS: health, education
5. Click **"Looks right — Match me"**
6. **Results appear**: ranked teams with fit %, friendly reasons, highlighted matching role
7. Click **"Request to join"** on the top match

### Tab 2 — The team captain (Mikael)

8. **Login** as `mikael@example.com` / `password123`
9. The **"My team"** nav link shows a badge — click it
10. **Join request** from Emma appears in the Recruiting panel
11. Click **Accept** — Emma joins SmartFlow
12. Switch back to Tab 1 — Emma is now on the **My Team** page showing SmartFlow

### The close (5 seconds)

> "Two-sided matching: both sides agreed. The AI understood Emma's skills in one sentence, ranked 8 teams by fit, and connected her to SmartFlow in under 10 seconds — no forms, no scrolling through lists."

---

## Fallback demo (if n8n is down)

Same flow, but results come from the keyword matcher with `meta.fallback: true`. The UI shows "Showing keyword-based results (AI matching is warming up)" at the bottom. Everything still works — just without LLM extraction and vector search.

---

## Key talking points for judges

1. **One sentence → structured profile** — AI extracts skills, role, interests; user can edit before matching
2. **Hybrid search** — keyword (FTS) + semantic (vector embeddings) via Reciprocal Rank Fusion
3. **Smart ranking** — complementarity (fill gaps, not duplicate), not just similarity
4. **Friendly explanations** — every match has a reason, generated from computed factors only
5. **Two-sided consent** — both participant and captain must agree; declined = silent, no rejection messages
6. **Live map** — walk over and meet your new team at their table
7. **Graceful fallback** — if the AI is slow, keyword matching kicks in within 12 seconds

## Demo accounts

| Account | Email | Role | State |
|---|---|---|---|
| Emma | emma@example.com | Solo participant | Has 2 pending invitations |
| Mikael | mikael@example.com | Captain (SmartFlow) | Has 2 join requests |
| Aleksi | aleksi@example.com | Member (SmartFlow) | Read-only team view |

Password for all: `password123`
