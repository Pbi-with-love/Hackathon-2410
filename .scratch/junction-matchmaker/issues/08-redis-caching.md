# 08: Redis caching layer

**What to build:** Local Redis caches the hot read paths — map entity queries, participant/team profiles, and match results — to support the 2,000-user scale target. All data access goes through a service layer; the cache is transparent to route handlers. Cache is invalidated on writes. The Redis connection string is the only change needed to move from local Redis to Upstash or Redis Cloud.

**Blocked by:** 03 — Participant & team profiles + location

**Status:** ready-for-agent

- [ ] Redis client is configured via environment variable (`REDIS_URL`, defaults to `redis://localhost:6379`)
- [ ] A cache service module exposes `get(key)`, `set(key, value, ttlSeconds)`, and `invalidate(key)` — route handlers never call Redis directly
- [ ] `GET /map/teams` responses are cached with 10s TTL; cache is invalidated when a team's status/location changes or a participant's status changes
- [ ] `GET /map/mentors` responses are cached with 10s TTL; cache is invalidated when a mentor's status/location changes
- [ ] `GET /participants/:id` and `GET /teams/:id` responses are cached with 5min TTL; invalidated on PATCH
- [ ] `GET /match/teams/:participantId` results are cached with 30s TTL; invalidated when relevant teams or participant profile change
- [ ] Cache hit/miss is logged at debug level so it is observable during development
- [ ] A cache miss falls through to the database transparently — no error surfaced to the caller
