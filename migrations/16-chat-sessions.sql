-- 16-chat-sessions.sql
-- Persist ChatWidget "conversation history" boundaries in the database instead
-- of the browser's localStorage. Each row is a "New chat" marker: messages are
-- partitioned into sessions by comparing their created_at against started_at.
--
-- The whole chat stack (conversations, messages, chat_sessions) is accessed
-- ONLY from server routes using the Supabase service-role key, which bypasses
-- RLS. We still enable RLS and grant no anon/authenticated policies, so the
-- public anon key can never read or write these tables directly.
--
-- Safe to run multiple times (IF NOT EXISTS / idempotent).

-- ── table ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- anonymous per-browser identity, matches conversations.user_token
  user_token  text        NOT NULL,
  -- start boundary of this chat; epoch (1970) marks the very first session
  started_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Fast lookup of all sessions for a given browser token, newest first.
CREATE INDEX IF NOT EXISTS idx_chat_sessions_token
  ON chat_sessions (user_token, started_at DESC);

-- ── row level security ─────────────────────────────────────────────────────
-- Enable RLS with NO permissive policies: the anon/authenticated roles get zero
-- access, while the service-role key used by the API routes bypasses RLS.
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

-- Defensive: make sure the public anon role has no lingering table grants.
REVOKE ALL ON chat_sessions FROM anon;
REVOKE ALL ON chat_sessions FROM authenticated;

-- ── (recommended) lock down the rest of the chat stack the same way ──────────
-- These tables are also service-role-only. Uncomment if RLS isn't enabled yet.
-- ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE messages      ENABLE ROW LEVEL SECURITY;
-- REVOKE ALL ON conversations FROM anon, authenticated;
-- REVOKE ALL ON messages      FROM anon, authenticated;
