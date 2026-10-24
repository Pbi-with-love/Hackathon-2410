# 09: Profile extraction (mocked LLM)

**What to build:** A participant types a free-text prompt describing themselves ("I'm a frontend dev, mostly React, wanna build something for energy saving, here all weekend"). The system returns a structured profile card with extracted fields — name, skills, roles, interests, availability — that the participant can review and edit before saving to their profile. The extraction currently returns a hardcoded mock response. The service is architected so the mock is swapped for Gemini (or any LLM) by changing a single function implementation.

**Blocked by:** 02 — Auth system

**Status:** ready-for-agent

- [ ] `POST /profile/extract` — accepts `{ prompt: string }`, returns a structured profile JSON: `{ name, bio, skills: [{ name, level }], roles: string[], interests: string[], availability: object }`. Currently returns a realistic hardcoded mock regardless of input (protected).
- [ ] The extraction logic lives in a `profileExtractor` service module with a clear interface: `extractProfile(prompt: string): Promise<ParticipantProfile>`. The mock implementation is one file; replacing it with Gemini means swapping that file only.
- [ ] Frontend shows a prompt input text area on the profile page or onboarding step
- [ ] Submitting the prompt calls `/profile/extract` and displays the result as an editable profile card
- [ ] Each extracted field is individually editable before saving
- [ ] Confirming the card calls `PATCH /participants/:id` to save the profile
- [ ] A clear visual indicator shows that extraction is "AI-powered (preview)" so users know the data may need correction
