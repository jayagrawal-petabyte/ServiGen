-- Ensure service_role exists in local or non-Supabase environments
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role;
  END IF;
END $$;

-- Add RLS policies for postgres and service_role across all public tables
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "allow_service_role_and_postgres" ON public.%I;', tbl);
    EXECUTE format(
      'CREATE POLICY "allow_service_role_and_postgres" ON public.%I FOR ALL TO postgres, service_role USING (true) WITH CHECK (true);',
      tbl
    );
  END LOOP;
END $$;
