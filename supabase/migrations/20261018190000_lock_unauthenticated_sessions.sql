-- Play history is local to each device. The legacy mirror had no ownership key,
-- so its public CRUD policies cannot safely isolate one family's records.
DROP POLICY IF EXISTS "anon_select_sessions" ON public.sessions;
DROP POLICY IF EXISTS "anon_insert_sessions" ON public.sessions;
DROP POLICY IF EXISTS "anon_update_sessions" ON public.sessions;
DROP POLICY IF EXISTS "anon_delete_sessions" ON public.sessions;
REVOKE ALL ON TABLE public.sessions FROM anon, authenticated;
