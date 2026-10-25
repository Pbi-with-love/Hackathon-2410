# n8n Matching Pipeline — 0% CONET

Two n8n workflows that power the AI matching on `/match`.

## Quick start

### 1. Run n8n locally (Docker)

```bash
docker run -d --name n8n \
  -p 5678:5678 \
  -e N8N_SECURE_COOKIE=false \
  -e WEBHOOK_URL=http://localhost:5678 \
  -v n8n_data:/home/node/.n8n \
  n8nio/n8n:latest
```

Open http://localhost:5678, create an account.

### 2. Create credentials in n8n

Go to **Settings > Credentials** and create:

| Name (exact) | Type | Value |
|---|---|---|
| `Gemini API Key` | Query Auth | Parameter: `key`, Value: your Gemini API key from [aistudio.google.com](https://aistudio.google.com/apikey) |
| `Supabase Service Key` | Header Auth | Name: `apikey`, Value: your Supabase service role key. Also add header `Authorization: Bearer <same key>` |
| `Webhook Secret` | Header Auth | Name: `X-Webhook-Secret`, Value: any shared secret (must match `N8N_WEBHOOK_SECRET` in Express `.env`) |

### 3. Import workflows

1. Go to **Workflows > Import from file**
2. Import `match-teams.json` — the main matching pipeline
3. Import `embed-entities.json` — embeds teams/participants/mentors
4. In each workflow, click each HTTP Request node and select the correct credential from the dropdowns
5. **Activate** the `match-teams` workflow (toggle on)

### 4. Set n8n environment variables

In Docker, add these env vars (or set them in n8n Settings > Variables):

```bash
-e SUPABASE_URL=https://your-project.supabase.co
```

### 5. Run embed-entities

After seeding your database, open `embed-entities` and click **Execute Workflow** (manual trigger). This embeds all teams, participants, and mentors that have `embedding = null`.

### 6. Test with curl

```bash
# Test the matching webhook
curl -X POST http://localhost:5678/webhook/match-teams \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your-secret-here" \
  -d @fixtures/fixture-4-dungeon-hawaii.json

# Or use the Express proxy (after wiring step 3)
curl -X POST http://localhost:8080/api/match \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-jwt>" \
  -d @fixtures/fixture-1-frontend-sustainability.json
```

### 7. Express .env values

Add to `backend/.env`:

```env
N8N_MATCH_URL=http://localhost:5678/webhook/match-teams
N8N_WEBHOOK_SECRET=your-shared-secret
```

---

## Workflow: match-teams

**13 nodes, 4 stages** (labelled with Sticky Notes for pitch screenshots):

```
1 UNDERSTAND          2 RETRIEVE           3 RANK           4 EXPLAIN
Webhook → Validate    Build query →        Re-rank &        LLM explain →
→ IF profile? →       Embed (Gemini) →     diversify        Attach reasons →
  LLM extract →       Supabase RPC                          Respond
  Parse/repair
```

- **LLM**: Gemini 2.0 Flash (extraction at temp 0.1, explanations at temp 0.4)
- **Embeddings**: gemini-embedding-001 (3072 dimensions)
- **Search**: Supabase `hybrid_search` RPC (FTS + vector, Reciprocal Rank Fusion)
- **Re-rank**: role fit (with adjacency map), interest similarity, availability overlap, duplicate penalty, MMR diversity
- **Fallback**: on any LLM/embedding failure, graceful degradation with keyword extraction and template reasons

## Workflow: embed-entities

**7 nodes**, manual trigger:

```
Manual trigger → Fetch (teams, participants, mentors with null embedding)
→ Build text + batch → Gemini batch embed → PATCH to Supabase
```

Run once after seeding, or whenever new entities are added.

---

## Files

```
n8n/
  match-teams.json        # Main matching workflow (import to n8n)
  embed-entities.json     # Entity embedding workflow (import to n8n)
  README.md               # This file
  src/
    rerank.js             # Re-rank logic (source of truth, testable with vitest)
  fixtures/
    fixture-1-frontend-sustainability.json
    fixture-2-ai-education.json
    fixture-3-ml-healthtech.json
    fixture-4-dungeon-hawaii.json
    fixture-5-edge-cases.json
```

## Models used

| Purpose | Model | Dims | Free tier |
|---|---|---|---|
| Profile extraction | `gemini-2.0-flash` | — | Yes (AI Studio) |
| Match explanations | `gemini-2.0-flash` | — | Yes (AI Studio) |
| Entity embeddings | `gemini-embedding-001` | 3072 | Yes (AI Studio) |
