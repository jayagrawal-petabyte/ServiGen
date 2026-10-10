-- Enable Row Level Security (RLS) on all public tables to resolve Supabase security linter findings
-- and prevent unauthorized access through direct PostgREST endpoints.

ALTER TABLE "public"."_prisma_migrations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."organisations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."sites" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."tickets" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."teams" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."incidents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."major_incidents" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."major_incident_updates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."service_catalogue_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."change_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."configuration_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."project_subtasks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."custom_lists" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."agent_moods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."team_memberships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."knowledge_articles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."approvals" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."calendar_events" ENABLE ROW LEVEL SECURITY;
