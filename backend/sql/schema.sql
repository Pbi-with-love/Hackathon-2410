-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Participants: hackathon attendees looking for a team
CREATE TABLE IF NOT EXISTS participants (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  email         text        UNIQUE NOT NULL,
  password_hash text        NOT NULL,
  bio           text,
  skills        jsonb       NOT NULL DEFAULT '[]',
  roles         text[]      NOT NULL DEFAULT '{}',
  interests     text[]      NOT NULL DEFAULT '{}',
  availability  jsonb       NOT NULL DEFAULT '{}',
  status        text        NOT NULL DEFAULT 'looking'
                              CHECK (status IN ('looking', 'in_team')),
  lat           numeric,
  lng           numeric,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Teams: groups looking for members
CREATE TABLE IF NOT EXISTS teams (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  captain_id   uuid        REFERENCES participants(id),
  challenge    text,
  project_idea text,
  goals        text,
  needed_roles text[]      NOT NULL DEFAULT '{}',
  status       text        NOT NULL DEFAULT 'open'
                             CHECK (status IN ('open', 'closed')),
  lat          numeric,
  lng          numeric,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Team membership (many-to-many)
CREATE TABLE IF NOT EXISTS team_members (
  team_id        uuid        NOT NULL REFERENCES teams(id),
  participant_id uuid        NOT NULL REFERENCES participants(id),
  joined_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, participant_id)
);

-- Mentors: experienced people available to help
CREATE TABLE IF NOT EXISTS mentors (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  email         text        UNIQUE NOT NULL,
  password_hash text        NOT NULL,
  expertise     text[]      NOT NULL DEFAULT '{}',
  experience    text,
  status        text        NOT NULL DEFAULT 'available'
                              CHECK (status IN ('available', 'busy', 'away')),
  lat           numeric,
  lng           numeric,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Matches: suggestions and invitations between participants and teams
CREATE TABLE IF NOT EXISTS matches (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid        REFERENCES participants(id),
  team_id        uuid        REFERENCES teams(id),
  score          numeric     NOT NULL DEFAULT 0,
  reasons        jsonb       NOT NULL DEFAULT '[]',
  direction      text        NOT NULL
                               CHECK (direction IN ('team_to_participant', 'participant_to_team')),
  state          text        NOT NULL DEFAULT 'suggested'
                               CHECK (state IN ('suggested', 'invited', 'requested', 'accepted', 'declined', 'expired')),
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Refresh tokens for JWT rotation
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid        NOT NULL,
  user_type  text        NOT NULL CHECK (user_type IN ('participant', 'mentor')),
  token_hash text        UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
