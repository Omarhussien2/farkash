/*
# Create sessions table for Farkash play history

1. New Tables
- `sessions`
  - `id` (uuid, primary key)
  - `game` (text, not null) — one of karasina/tamathil/ishara/aks/sabr/nafas
  - `reaction_ms` (integer) — time to stop in ms (lower is better)
  - `patience_sec` (numeric) — seconds of patience gained
  - `impulsive_errors` (integer) — count of impulsive errors
  - `score` (integer) — 0..100
  - `created_at` (timestamptz, default now())

2. Security
- Enable RLS on `sessions`.
- Single-tenant no-auth app (judges use it without sign-in): allow anon + authenticated CRUD
  so the anon-key frontend can read/write its own play history.

3. Notes
- The frontend also mirrors data in localStorage for zero-friction demo use; Supabase
  sync is best-effort and does not block the UI.
*/

CREATE TABLE IF NOT EXISTS sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game text NOT NULL,
  reaction_ms integer NOT NULL DEFAULT 0,
  patience_sec numeric NOT NULL DEFAULT 0,
  impulsive_errors integer NOT NULL DEFAULT 0,
  score integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_sessions" ON sessions;
CREATE POLICY "anon_select_sessions"
ON sessions FOR SELECT
TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_sessions" ON sessions;
CREATE POLICY "anon_insert_sessions"
ON sessions FOR INSERT
TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_sessions" ON sessions;
CREATE POLICY "anon_update_sessions"
ON sessions FOR UPDATE
TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_sessions" ON sessions;
CREATE POLICY "anon_delete_sessions"
ON sessions FOR DELETE
TO anon, authenticated USING (true);
