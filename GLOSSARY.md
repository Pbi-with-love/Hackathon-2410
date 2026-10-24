# Glossary — Junction Community Matchmaker

## Participant
A hackathon attendee who has registered with the role "participant". Has skills, roles, interests, and availability. Status is either `looking` (seeking a team, visible on the Team Matching Map) or `in_team` (has joined a team, hidden from the map).

## Team Leader / Captain
A Participant who has created a team. The role is **derived** — not chosen at registration. A captain controls team metadata (project idea, goals, needed roles) and recruitment status.

## Mentor
A hackathon attendee who has registered with the role "mentor". Has expertise and experience. Status is `available`, `busy`, or `away`. Appears on the Mentor Discovery Map with real-time location.

## Team
A group formed around a project idea. Has a captain, a challenge, a project idea, goals, and `needed_roles`. Status is `open` (recruiting) or `closed` (not recruiting). Only `open` teams appear on the Team Matching Map.

## Match
A single entity representing the connection lifecycle between one Participant and one Team. Has a `state` that advances through the state machine. A connection only becomes real when both sides accept.

### Match state machine
```
suggested → invited   (team invites participant via team_to_participant direction)
          → requested (participant asks to join via participant_to_team direction)
invited   → accepted | declined
requested → accepted | declined
any open  → expired   (participant joined a different team)
```

## Team Matching Map
The Leaflet/OSM map view that shows recruiting team leaders and looking participants. Purpose: facilitate in-person conversations. Visibility: only `open` teams and `looking` participants.

## Mentor Discovery Map
A separate Leaflet/OSM map view showing mentors by expertise and real-time location. Filterable by expertise keyword. Independent from the Team Matching Map.

## Profile
The structured data representing a Participant: skills, roles, interests, bio, availability. Populated via a form or (in a future phase) by free-text prompt extraction via Gemini.

## Location
Stored as `lat`/`lng` (decimal degrees) on participants, teams, and mentors. Set via browser geolocation API or map tap. No zone check-in. Updated in real time.
