# 02: Auth system (register + login + token rotation)

**What to build:** A user can register as Participant or Mentor, log in with email + password, and receive JWT access + refresh tokens. Token refresh rotates both tokens. Protected route middleware rejects unauthenticated requests. Frontend shows a login/register page with role selection (Participant or Mentor). Team Leader is a derived role — not chosen at registration.

**Blocked by:** 01 — Backend scaffold + Schema + Seed data

**Status:** ready-for-agent

- [ ] `POST /auth/register` — accepts name, email, password, role (participant | mentor); hashes password with bcrypt; returns access token + refresh token
- [ ] `POST /auth/login` — validates credentials, returns new access token + refresh token
- [ ] `POST /auth/refresh` — validates refresh token, rotates both tokens (old refresh token invalidated), returns new pair
- [ ] Refresh tokens are stored hashed in the `refresh_tokens` table with expiry
- [ ] JWT middleware (`requireAuth`) validates access token on protected routes and attaches user identity to the request
- [ ] Frontend `/` route shows login/register form with role selection (Participant or Mentor)
- [ ] Frontend stores tokens client-side and attaches access token to API requests
- [ ] Frontend handles token refresh automatically when access token expires
- [ ] Registration and login errors are shown to the user (invalid credentials, email already exists)
