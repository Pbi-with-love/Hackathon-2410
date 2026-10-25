-- Run these blocks ONE AT A TIME in the Supabase SQL editor.
-- If a block fails, fix it before running the next one.

-- ============================================================
-- BLOCK 1: Enable pgvector + add embedding columns
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE participants ADD COLUMN IF NOT EXISTS embedding vector(3072);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS embedding vector(3072);
ALTER TABLE teams ADD COLUMN IF NOT EXISTS max_size int NOT NULL DEFAULT 5;
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS embedding vector(3072);

-- ============================================================
-- BLOCK 2: Add FTS columns using a trigger (avoids immutability issues)
-- ============================================================

-- Participants FTS
ALTER TABLE participants ADD COLUMN IF NOT EXISTS fts tsvector;

CREATE OR REPLACE FUNCTION participants_fts_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.fts := to_tsvector('english',
    coalesce(NEW.name,'') || ' ' ||
    coalesce(NEW.bio,'') || ' ' ||
    array_to_string(NEW.roles,' ') || ' ' ||
    array_to_string(NEW.interests,' ')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_participants_fts ON participants;
CREATE TRIGGER trg_participants_fts
  BEFORE INSERT OR UPDATE ON participants
  FOR EACH ROW EXECUTE FUNCTION participants_fts_update();

-- Backfill existing rows
UPDATE participants SET fts = to_tsvector('english',
  coalesce(name,'') || ' ' || coalesce(bio,'') || ' ' ||
  array_to_string(roles,' ') || ' ' || array_to_string(interests,' ')
);

-- Teams FTS
ALTER TABLE teams ADD COLUMN IF NOT EXISTS fts tsvector;

CREATE OR REPLACE FUNCTION teams_fts_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.fts := to_tsvector('english',
    coalesce(NEW.name,'') || ' ' ||
    coalesce(NEW.challenge,'') || ' ' ||
    coalesce(NEW.project_idea,'') || ' ' ||
    coalesce(NEW.goals,'') || ' ' ||
    array_to_string(NEW.needed_roles,' ')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_teams_fts ON teams;
CREATE TRIGGER trg_teams_fts
  BEFORE INSERT OR UPDATE ON teams
  FOR EACH ROW EXECUTE FUNCTION teams_fts_update();

UPDATE teams SET fts = to_tsvector('english',
  coalesce(name,'') || ' ' || coalesce(challenge,'') || ' ' ||
  coalesce(project_idea,'') || ' ' || coalesce(goals,'') || ' ' ||
  array_to_string(needed_roles,' ')
);

-- Mentors FTS
ALTER TABLE mentors ADD COLUMN IF NOT EXISTS fts tsvector;

CREATE OR REPLACE FUNCTION mentors_fts_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.fts := to_tsvector('english',
    coalesce(NEW.name,'') || ' ' ||
    array_to_string(NEW.expertise,' ') || ' ' ||
    coalesce(NEW.experience,'')
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mentors_fts ON mentors;
CREATE TRIGGER trg_mentors_fts
  BEFORE INSERT OR UPDATE ON mentors
  FOR EACH ROW EXECUTE FUNCTION mentors_fts_update();

UPDATE mentors SET fts = to_tsvector('english',
  coalesce(name,'') || ' ' || array_to_string(expertise,' ') || ' ' ||
  coalesce(experience,'')
);

-- ============================================================
-- BLOCK 3: GIN indexes on FTS
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_participants_fts ON participants USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_teams_fts ON teams USING gin(fts);
CREATE INDEX IF NOT EXISTS idx_mentors_fts ON mentors USING gin(fts);

-- ============================================================
-- BLOCK 4: hybrid_search RPC
-- ============================================================

CREATE OR REPLACE FUNCTION hybrid_search(
  q           text,
  q_emb       vector(3072),
  k           int     DEFAULT 20,
  min_overlap float   DEFAULT 0.5,
  exclude     uuid[]  DEFAULT '{}',
  search_target text  DEFAULT 'teams'
)
RETURNS TABLE (
  id           uuid,
  name         text,
  challenge    text,
  zone         text,
  needed_roles text[],
  member_roles text[],
  members      int,
  max_size     int,
  overlap      float,
  rrf          float
)
LANGUAGE sql STABLE
AS $$
  WITH candidates AS (
    SELECT
      t.id,
      t.name,
      t.challenge,
      NULL::text AS zone,
      t.needed_roles,
      ARRAY(
        SELECT UNNEST(p2.roles)
        FROM team_members tm2
        JOIN participants p2 ON p2.id = tm2.participant_id
        WHERE tm2.team_id = t.id
      ) AS member_roles,
      (SELECT COUNT(*)::int FROM team_members tm3 WHERE tm3.team_id = t.id) AS members,
      t.max_size,
      1.0::float AS overlap,
      (
        1.0 / (60 + RANK() OVER (ORDER BY ts_rank(t.fts, websearch_to_tsquery('english', q)) DESC))
        +
        CASE WHEN t.embedding IS NOT NULL
          THEN 1.0 / (60 + RANK() OVER (ORDER BY t.embedding <=> q_emb))
          ELSE 0
        END
      ) AS rrf
    FROM teams t
    WHERE search_target = 'teams'
      AND t.status = 'open'
      AND t.id <> ALL(exclude)
      AND (SELECT COUNT(*) FROM team_members tm4 WHERE tm4.team_id = t.id) < t.max_size

    UNION ALL

    SELECT
      p.id,
      p.name,
      NULL::text AS challenge,
      NULL::text AS zone,
      p.roles AS needed_roles,
      '{}'::text[] AS member_roles,
      0 AS members,
      0 AS max_size,
      1.0::float AS overlap,
      (
        1.0 / (60 + RANK() OVER (ORDER BY ts_rank(p.fts, websearch_to_tsquery('english', q)) DESC))
        +
        CASE WHEN p.embedding IS NOT NULL
          THEN 1.0 / (60 + RANK() OVER (ORDER BY p.embedding <=> q_emb))
          ELSE 0
        END
      ) AS rrf
    FROM participants p
    WHERE search_target = 'people'
      AND p.status = 'looking'
      AND p.id <> ALL(exclude)
  )
  SELECT * FROM candidates
  ORDER BY rrf DESC
  LIMIT k;
$$;
